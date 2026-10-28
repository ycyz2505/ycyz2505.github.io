package main

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"
)

// ============================================================
// 网络多策略兜底层
//
// 背景：校园网常见两种拦法
//   1) 只掐 80 端口（明文 HTTP），443 放行
//   2) 共享出口 IP 被目标站风控，直接不响应
// 库里的音源地址是写死的 http://，我们改不了它，
// 所以在 RoundTrip 这一层做兜底：一条路走不通就自动换下一条。
//
// 策略顺序：direct → https（同域升 443）→ nokeep（丢连接重试）→ proxy（可选代理）
// 成功过的策略会按 host 记住 10 分钟，之后直接走它；
// 全部失败则把 host 熔断 60 秒，避免每次搜索都白等 24 秒。
// ============================================================

const (
	attemptHeaderTimeout = 7 * time.Second  // 单次尝试等响应头的时间
	chainBudget          = 24 * time.Second // 整条兜底链的总预算
	netMemoTTL           = 10 * time.Minute // 成功策略的记忆时长
	deadCooldown         = 60 * time.Second // 全部失败后的熔断时长
	peekLimit            = 128 << 10        // 超过这个体积就不嗅探响应体
)

type netMemo struct {
	strategy string
	at       time.Time
}

type fallbackTransport struct {
	direct   *http.Transport
	noKeep   *http.Transport
	proxyTrs []*http.Transport
	proxyURL []string

	mu   sync.Mutex
	memo map[string]netMemo
	dead map[string]time.Time
}

// 包初始化时先存下原始 transport，避免自我递归
var originTransport = http.DefaultTransport

func baseTransport() *http.Transport {
	if t, ok := originTransport.(*http.Transport); ok {
		return t.Clone()
	}
	return &http.Transport{
		Proxy:             http.ProxyFromEnvironment,
		ForceAttemptHTTP2: true,
	}
}

func newFallbackTransport() *fallbackTransport {
	d := baseTransport()
	d.ResponseHeaderTimeout = attemptHeaderTimeout
	d.TLSHandshakeTimeout = 6 * time.Second
	d.DialContext = newDialer()
	d.MaxIdleConnsPerHost = 4

	nk := d.Clone()
	nk.DisableKeepAlives = true

	t := &fallbackTransport{
		direct: d,
		noKeep: nk,
		memo:   map[string]netMemo{},
		dead:   map[string]time.Time{},
	}
	t.loadProxies()
	return t
}

func envBool(key string) bool {
	switch strings.ToLower(strings.TrimSpace(os.Getenv(key))) {
	case "1", "true", "yes", "on":
		return true
	}
	return false
}

// newDialer 校园网 IPv6 常常半通，拨号会卡到超时；M_FORCE_IPV4=1 可强制只走 v4
func newDialer() func(ctx context.Context, network, addr string) (net.Conn, error) {
	d := &net.Dialer{
		Timeout:   6 * time.Second,
		KeepAlive: 30 * time.Second,
	}
	if !envBool("M_FORCE_IPV4") {
		return d.DialContext
	}
	return func(ctx context.Context, network, addr string) (net.Conn, error) {
		return d.DialContext(ctx, "tcp4", addr)
	}
}

// installCustomDNS 绕开校园 DNS 劫持：M_DNS=223.5.5.5
func installCustomDNS(server string) {
	server = strings.TrimSpace(server)
	if server == "" {
		return
	}
	if !strings.Contains(server, ":") {
		server += ":53"
	}

	target := server
	net.DefaultResolver = &net.Resolver{
		PreferGo: true,
		Dial: func(ctx context.Context, network, address string) (net.Conn, error) {
			if !strings.HasPrefix(network, "udp") && !strings.HasPrefix(network, "tcp") {
				network = "udp"
			}
			d := net.Dialer{Timeout: 5 * time.Second}
			return d.DialContext(ctx, network, target)
		},
	}
	mlogInfo("[net] DNS 解析改为 %s", target)
}

// installNetFallback 必须在日志级别初始化之后调用，否则日志会被吞掉
func installNetFallback() {
	ft := newFallbackTransport()
	http.DefaultTransport = ft

	if dns := strings.TrimSpace(os.Getenv("M_DNS")); dns != "" {
		installCustomDNS(dns)
	}

	chain := "direct → https → nokeep"
	if len(ft.proxyTrs) > 0 {
		chain += fmt.Sprintf(" → proxy(%d)", len(ft.proxyTrs))
	}
	if envBool("M_FORCE_IPV4") {
		chain += "（强制 IPv4）"
	}
	mlogInfo("[net] 兜底链已启用：%s", chain)
}

func (t *fallbackTransport) loadProxies() {
	for _, raw := range proxyList() {
		u, err := url.Parse(raw)
		if err != nil || u.Host == "" {
			mlogWarn("[net] 代理地址无效，已忽略：%s", raw)
			continue
		}
		tr := t.direct.Clone()
		tr.Proxy = http.ProxyURL(u)
		t.proxyTrs = append(t.proxyTrs, tr)
		t.proxyURL = append(t.proxyURL, u.Redacted())
	}
	if len(t.proxyTrs) > 0 {
		mlogInfo("[net] 已载入 %d 个备用代理：%s",
			len(t.proxyTrs), strings.Join(t.proxyURL, "、"))
	}
}

// ---------- 策略选择 ----------

func (t *fallbackTransport) order(host string) []string {
	base := []string{"direct", "https", "nokeep"}
	if len(t.proxyTrs) > 0 {
		base = append(base, "proxy")
	}

	t.mu.Lock()
	m, ok := t.memo[host]
	t.mu.Unlock()

	if !ok || m.strategy == "" || time.Since(m.at) > netMemoTTL {
		return base
	}

	out := make([]string, 0, len(base))
	out = append(out, m.strategy)
	for _, s := range base {
		if s != m.strategy {
			out = append(out, s)
		}
	}
	return out
}

func (t *fallbackTransport) isDead(host string) bool {
	t.mu.Lock()
	defer t.mu.Unlock()

	at, ok := t.dead[host]
	if !ok {
		return false
	}
	if time.Since(at) > deadCooldown {
		delete(t.dead, host)
		return false
	}
	return true
}

func (t *fallbackTransport) markDead(host string) {
	t.mu.Lock()
	t.dead[host] = time.Now()
	delete(t.memo, host)
	t.mu.Unlock()
}

func (t *fallbackTransport) markAlive(host, strategy string) {
	t.mu.Lock()
	t.memo[host] = netMemo{strategy: strategy, at: time.Now()}
	delete(t.dead, host)
	t.mu.Unlock()
}

func (t *fallbackTransport) snapshot() map[string]string {
	t.mu.Lock()
	defer t.mu.Unlock()

	out := make(map[string]string, len(t.memo))
	for k, v := range t.memo {
		out[k] = v.strategy
	}
	return out
}

// ---------- RoundTrip ----------

func (t *fallbackTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	host := req.URL.Hostname()

	if t.isDead(host) {
		return nil, fmt.Errorf("%s 近期连接失败，熔断中（%s 后自动重试）", host, deadCooldown)
	}

	order := t.order(host)
	start := time.Now()

	var lastErr error

	for i, name := range order {
		if time.Since(start) > chainBudget {
			break
		}

		r := req
		if i > 0 {
			c, err := cloneRequest(req)
			if err != nil {
				break
			}
			r = c
		}

		resp, err := t.attempt(name, r)
		if err != nil {
			lastErr = err
			mlogDebug("[net] %s %s 策略=%s 失败：%s",
				req.Method, host, name, shortErr(err))
			continue
		}

		if bad, why := suspicious(resp, req.Method); bad {
			_ = resp.Body.Close()
			lastErr = fmt.Errorf("策略 %s 响应异常：%s", name, why)
			mlogDebug("[net] %s %s 策略=%s 响应异常：%s",
				req.Method, host, name, why)
			continue
		}

		if name != "direct" {
			mlogInfo("[net] %s 自动切到策略 %s，已记住", host, name)
		}
		t.markAlive(host, name)
		return resp, nil
	}

	if lastErr == nil {
		lastErr = errors.New("所有网络策略都失败")
	}
	t.markDead(host)
	return nil, lastErr
}

func (t *fallbackTransport) attempt(name string, req *http.Request) (*http.Response, error) {
	switch name {
	case "https":
		if !strings.EqualFold(req.URL.Scheme, "http") {
			return nil, errors.New("仅 http 请求可升级为 https")
		}
		u := *req.URL
		u.Scheme = "https"
		if u.Port() == "80" {
			u.Host = u.Hostname()
		}
		c := req.Clone(req.Context())
		c.URL = &u
		c.Host = ""
		return t.direct.RoundTrip(c)

	case "nokeep":
		return t.noKeep.RoundTrip(req)

	case "proxy":
		var lastErr error
		for i, tr := range t.proxyTrs {
			if i > 0 && req.Body != nil && req.Body != http.NoBody {
				if req.GetBody == nil {
					break
				}
				body, err := req.GetBody()
				if err != nil {
					break
				}
				req.Body = body
			}
			resp, err := tr.RoundTrip(req)
			if err == nil {
				return resp, nil
			}
			lastErr = err
		}
		if lastErr == nil {
			lastErr = errors.New("没有可用代理")
		}
		return nil, lastErr

	default:
		return t.direct.RoundTrip(req)
	}
}

// cloneRequest 复制一份可重放的请求；请求体不能重放时返回错误
func cloneRequest(req *http.Request) (*http.Request, error) {
	r := req.Clone(req.Context())

	if req.Body == nil || req.Body == http.NoBody {
		return r, nil
	}
	if req.GetBody == nil {
		return nil, errors.New("请求体不可重放")
	}
	body, err := req.GetBody()
	if err != nil {
		return nil, err
	}
	r.Body = body
	return r, nil
}

// suspicious 判断响应是不是「被网关拦了」的假响应
// 只嗅探明确短小的响应，音频流一律放过
func suspicious(resp *http.Response, method string) (bool, string) {
	if resp == nil {
		return true, "空响应对象"
	}
	if resp.StatusCode >= 500 {
		return true, "HTTP " + strconv.Itoa(resp.StatusCode)
	}
	if strings.EqualFold(method, http.MethodHead) {
		return false, ""
	}

	n := resp.ContentLength
	if n < 0 || n > peekLimit {
		return false, ""
	}
	if n == 0 {
		return true, "响应为空"
	}
	if resp.Body == nil {
		return false, ""
	}

	buf, err := io.ReadAll(io.LimitReader(resp.Body, peekLimit+1))
	_ = resp.Body.Close()
	if err != nil {
		return true, "读取响应失败"
	}

	resp.Body = io.NopCloser(bytes.NewReader(buf))
	resp.ContentLength = int64(len(buf))

	if len(buf) == 0 {
		return true, "响应为空"
	}

	head := buf
	if len(head) > 512 {
		head = head[:512]
	}
	s := strings.ToLower(strings.TrimLeft(string(head), " \t\r\n\ufeff\x00"))
	if strings.HasPrefix(s, "<!doctype") || strings.HasPrefix(s, "<html") {
		return true, "返回的是网页而不是接口数据"
	}
	return false, ""
}

// ---------- 代理配置 ----------

func proxyList() []string {
	if v := strings.TrimSpace(os.Getenv("M_PROXY")); v != "" {
		return splitList(v)
	}

	raw, err := os.ReadFile(proxyFile())
	if err != nil {
		return nil
	}

	var cfg struct {
		Enable  bool     `json:"enable"`
		Proxies []string `json:"proxies"`
	}
	if json.Unmarshal(raw, &cfg) != nil || !cfg.Enable {
		return nil
	}
	return cfg.Proxies
}

func splitList(v string) []string {
	parts := strings.FieldsFunc(v, func(r rune) bool {
		return r == ',' || r == ';' || r == '\n' || r == '\r'
	})
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		if p = strings.TrimSpace(p); p != "" {
			out = append(out, p)
		}
	}
	return out
}

// ---------- 状态接口 ----------

func handleNetStatus(w http.ResponseWriter, r *http.Request) {
	ft, ok := http.DefaultTransport.(*fallbackTransport)
	if !ok {
		writeJSON(w, http.StatusOK, map[string]any{
			"ok":    false,
			"error": "网络兜底层未启用",
		})
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"ok":      true,
		"proxies": ft.proxyURL,
		"memo":    ft.snapshot(),
	})
}
