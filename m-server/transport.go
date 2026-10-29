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
// 网络自适应层
//
// 背景：家里一切正常，学校却只有 HTTPS 音源能用，走 80 端口的
// 网易云 / 酷狗 / 酷我 全部超时或被 RST。原因可能是：
//   1) 网关只掐 80 端口
//   2) 共享出口 IP 被目标站风控
//   3) 校园 IPv6 能解析但不通，拨号卡到超时
//   4) 校园 DNS 被劫持 / 污染
//
// 这里不再让人手工试参数：启动时自检一次，把 IPv6、DNS、本地代理
// 三件事探明白，然后按探测结果生成一条「策略链」，请求失败就自动
// 换下一条。成功过的策略按域名记住，全失败则熔断一段时间。
// ============================================================

const (
	attemptHeaderTimeout = 6 * time.Second  // 单条策略等响应头的时间
	chainBudget          = 27 * time.Second // 整条链的总预算
	netMemoTTL           = 10 * time.Minute // 成功策略的记忆时长
	deadCooldown         = 90 * time.Second // 全失败后的熔断时长
	peekLimit            = 128 << 10        // 超过这个体积就不嗅探响应体

	dialTimeout = 6 * time.Second
)

// 本地代理常见端口：Clash / v2ray / ssr / Charles 等
var localProxyPorts = []int{7890, 7897, 10809, 10808, 1080, 8889, 3128, 8080}

// 公共 DNS，系统 DNS 解析失败时依次尝试
var publicDNS = []string{"223.5.5.5:53", "119.29.29.29:53", "180.76.76.76:53", "1.1.1.1:53"}

// 用于 IPv6 自检的固定地址（阿里公共 DNS 的 v6 节点）
const ipv6ProbeAddr = "[2400:3200::1]:53"

type netProfile struct {
	name  string
	https bool
	tr    *http.Transport
}

type netMemo struct {
	profile string
	at      time.Time
}

type fallbackTransport struct {
	profiles []netProfile

	mu   sync.Mutex
	memo map[string]netMemo
	dead map[string]time.Time

	notes []string // 自检结论，供日志与 /api/m/net 展示
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

func newHTTPTransport(d *net.Dialer) *http.Transport {
	tr := baseTransport()
	tr.ResponseHeaderTimeout = attemptHeaderTimeout
	tr.TLSHandshakeTimeout = 5 * time.Second
	tr.MaxIdleConnsPerHost = 4
	if d != nil {
		tr.DialContext = d.DialContext
	}
	return tr
}

// ---------- 环境变量 ----------

func envBool(key string) bool {
	switch strings.ToLower(strings.TrimSpace(os.Getenv(key))) {
	case "1", "true", "yes", "on":
		return true
	}
	return false
}

// ---------- 自检 ----------

func probeTCP(network, addr string, timeout time.Duration) bool {
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()

	d := net.Dialer{Timeout: timeout}
	conn, err := d.DialContext(ctx, network, addr)
	if err != nil {
		return false
	}
	_ = conn.Close()
	return true
}

// detectV4Only 判断是否只能走 IPv4。
// 显式设了 M_FORCE_IPV4 就听它的，否则连一次 IPv6 地址试试。
func detectV4Only() bool {
	if _, ok := os.LookupEnv("M_FORCE_IPV4"); ok {
		return envBool("M_FORCE_IPV4")
	}
	return !probeTCP("tcp6", ipv6ProbeAddr, 1500*time.Millisecond)
}

func newResolver(server string) *net.Resolver {
	return &net.Resolver{
		PreferGo: true,
		Dial: func(ctx context.Context, network, address string) (net.Conn, error) {
			if !strings.HasPrefix(network, "udp") && !strings.HasPrefix(network, "tcp") {
				network = "udp"
			}
			d := net.Dialer{Timeout: 3 * time.Second}
			return d.DialContext(ctx, network, server)
		},
	}
}

// detectDNS 系统 DNS 解析不动就换一个公共 DNS，返回空串表示用系统的
func detectDNS() string {
	if v := strings.TrimSpace(os.Getenv("M_DNS")); v != "" {
		if !strings.Contains(v, ":") {
			v += ":53"
		}
		return v
	}

	ctx, cancel := context.WithTimeout(context.Background(), 1200*time.Millisecond)
	_, err := net.DefaultResolver.LookupHost(ctx, "music.163.com")
	cancel()
	if err == nil {
		return ""
	}

	deadline := time.Now().Add(2500 * time.Millisecond)
	for _, server := range publicDNS {
		left := time.Until(deadline)
		if left <= 0 {
			break
		}
		r := newResolver(server)
		ctx, cancel := context.WithTimeout(context.Background(), left)
		_, e := r.LookupHost(ctx, "music.163.com")
		cancel()
		if e == nil {
			return server
		}
	}
	return ""
}

// detectProxies 扫一遍本机常见代理端口，探测到的才纳入策略链
func detectProxies() []string {
	raw := strings.TrimSpace(os.Getenv("M_PROXY"))
	if raw != "" {
		return splitList(raw)
	}
	if list := proxyFileList(); len(list) > 0 {
		return list
	}

	var out []string
	for _, p := range localProxyPorts {
		addr := fmt.Sprintf("127.0.0.1:%d", p)
		if probeTCP("tcp4", addr, 250*time.Millisecond) {
			out = append(out, "http://"+addr)
		}
	}
	return out
}

// ---------- 构建 ----------

func newFallbackTransport() *fallbackTransport {
	t := &fallbackTransport{
		memo: map[string]netMemo{},
		dead: map[string]time.Time{},
	}

	// 三项自检并发跑，避免拖慢启动
	var (
		wg      sync.WaitGroup
		v4only  bool
		dns     string
		proxies []string
	)
	wg.Add(3)
	go func() { defer wg.Done(); v4only = detectV4Only() }()
	go func() { defer wg.Done(); dns = detectDNS() }()
	go func() { defer wg.Done(); proxies = detectProxies() }()
	wg.Wait()

	dialerAuto := &net.Dialer{Timeout: dialTimeout, KeepAlive: 30 * time.Second}
	dialerV4 := &net.Dialer{Timeout: dialTimeout, KeepAlive: 30 * time.Second}

	if v4only {
		t.notes = append(t.notes, "IPv6 不可用，只走 IPv4")
	} else {
		t.notes = append(t.notes, "IPv6 可用")
	}

	// 拨号方式：v4 优先，DNS 被劫持时再加一条自定义解析的
	type dialOption struct {
		tag string
		d   *net.Dialer
	}
	dials := []dialOption{}

	if v4only {
		dials = append(dials, dialOption{tag: "v4", d: dialerV4})
	} else {
		dials = append(dials, dialOption{tag: "", d: dialerAuto})
	}

	if dns != "" {
		dials = append(dials, dialOption{
			tag: "dns",
			d:   &net.Dialer{Timeout: dialTimeout, KeepAlive: 30 * time.Second, Resolver: newResolver(dns)},
		})
		t.notes = append(t.notes, "系统 DNS 异常，改用 "+dns)
	} else {
		t.notes = append(t.notes, "DNS 正常")
	}

	for _, dm := range dials {
		base := dm.tag
		if base == "" {
			base = "direct"
		}
		t.profiles = append(t.profiles,
			netProfile{name: base, tr: newHTTPTransport(dm.d)},
			netProfile{name: base + "+https", https: true, tr: newHTTPTransport(dm.d)},
		)
	}

	// 丢掉长连接再试一次，专门对付「连接建立了但不回数据」的网关
	nk := newHTTPTransport(dials[0].d)
	nk.DisableKeepAlives = true
	t.profiles = append(t.profiles, netProfile{name: "nokeep", tr: nk})

	// 代理兜底
	proxies := detectProxies()
	for i, raw := range proxies {
		u, err := url.Parse(raw)
		if err != nil || u.Host == "" {
			mlogWarn("[net] 代理地址无效，已忽略：%s", raw)
			continue
		}
		tr := newHTTPTransport(dials[0].d)
		tr.Proxy = http.ProxyURL(u)
		t.profiles = append(t.profiles, netProfile{
			name: fmt.Sprintf("proxy%d", i+1),
			tr:   tr,
		})
		t.notes = append(t.notes, "发现可用代理 "+u.Redacted())
	}

	return t
}

// installNetFallback 必须在日志级别初始化之后调用，否则日志会被吞掉
func installNetFallback() {
	ft := newFallbackTransport()
	http.DefaultTransport = ft

	names := make([]string, 0, len(ft.profiles))
	for _, p := range ft.profiles {
		names = append(names, p.name)
	}

	mlogInfo("[net] 自检：%s", strings.Join(ft.notes, "；"))
	mlogInfo("[net] 策略链：%s", strings.Join(names, " → "))
}

// ---------- 策略选择 ----------

func (t *fallbackTransport) order(host string) []netProfile {
	t.mu.Lock()
	m, ok := t.memo[host]
	t.mu.Unlock()

	if !ok || m.profile == "" || time.Since(m.at) > netMemoTTL {
		return t.profiles
	}

	out := make([]netProfile, 0, len(t.profiles))
	for _, p := range t.profiles {
		if p.name == m.profile {
			out = append(out, p)
			break
		}
	}
	for _, p := range t.profiles {
		if p.name != m.profile {
			out = append(out, p)
		}
	}
	if len(out) == 0 {
		return t.profiles
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

func (t *fallbackTransport) markAlive(host, profile string) {
	t.mu.Lock()
	t.memo[host] = netMemo{profile: profile, at: time.Now()}
	delete(t.dead, host)
	t.mu.Unlock()
}

func (t *fallbackTransport) snapshot() map[string]string {
	t.mu.Lock()
	defer t.mu.Unlock()

	out := make(map[string]string, len(t.memo))
	for k, v := range t.memo {
		out[k] = v.profile
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

	for i, p := range order {
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

		resp, err := t.attempt(p, r)
		if err != nil {
			lastErr = err
			mlogDebug("[net] %s %s 策略=%s 失败：%s",
				req.Method, host, p.name, shortErr(err))
			continue
		}

		if bad, why := suspicious(resp, req.Method); bad {
			_ = resp.Body.Close()
			lastErr = fmt.Errorf("策略 %s 响应异常：%s", p.name, why)
			mlogDebug("[net] %s %s 策略=%s 响应异常：%s",
				req.Method, host, p.name, why)
			continue
		}

		if len(t.profiles) > 0 && p.name != t.profiles[0].name {
			mlogInfo("[net] %s 自动切到策略 %s，已记住", host, p.name)
		}
		t.markAlive(host, p.name)
		return resp, nil
	}

	if lastErr == nil {
		lastErr = errors.New("所有网络策略都失败")
	}
	t.markDead(host)
	return nil, lastErr
}

func (t *fallbackTransport) attempt(p netProfile, req *http.Request) (*http.Response, error) {
	if !p.https {
		return p.tr.RoundTrip(req)
	}
	if !strings.EqualFold(req.URL.Scheme, "http") {
		return nil, errors.New("非 http 请求无需升级")
	}

	u := *req.URL
	u.Scheme = "https"
	if u.Port() == "80" {
		u.Host = u.Hostname()
	}

	c := req.Clone(req.Context())
	c.URL = &u
	c.Host = ""
	return p.tr.RoundTrip(c)
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

// ---------- 配置 ----------

func proxyFileList() []string {
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
			"error": "网络自适应层未启用",
		})
		return
	}

	names := make([]string, 0, len(ft.profiles))
	for _, p := range ft.profiles {
		names = append(names, p.name)
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"ok":       true,
		"notes":    ft.notes,
		"profiles": names,
		"memo":     ft.snapshot(),
	})
}
