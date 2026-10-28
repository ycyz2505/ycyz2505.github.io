package main

import (
	"context"
	"crypto/tls"
	"errors"
	"fmt"
	"log"
	"net"
	"net/url"
	"os"
	"strings"
	"sync/atomic"
)

var (
	logLevel atomic.Int32
	reqSeq   atomic.Uint64
)

const (
	logWarn = iota
	logInfo
	logDebug
)

func initLogLevel() {
	switch strings.ToLower(strings.TrimSpace(os.Getenv("M_LOG"))) {
	case "debug":
		logLevel.Store(logDebug)
	case "warn":
		logLevel.Store(logWarn)
	default:
		logLevel.Store(logInfo)
	}
	log.Printf("日志级别=%s（M_LOG=debug 可开启详细日志）", levelName(int(logLevel.Load())))
}

func levelName(v int) string {
	switch v {
	case logDebug:
		return "debug"
	case logInfo:
		return "info"
	case logWarn:
		return "warn"
	}
	return "?"
}

func mlogf(level int, format string, args ...any) {
	if int(logLevel.Load()) < level {
		return
	}
	log.Printf(format, args...)
}

func mlogInfo(format string, args ...any)  { mlogf(logInfo, format, args...) }
func mlogDebug(format string, args ...any) { mlogf(logDebug, format, args...) }
func mlogWarn(format string, args ...any)  { mlogf(logWarn, "[warn] "+format, args...) }

// classifyErr 把错误归到能一眼看出问题所在的类别
func classifyErr(err error) string {
	if err == nil {
		return ""
	}
	if errors.Is(err, context.DeadlineExceeded) {
		return "timeout"
	}

	var ne net.Error
	if errors.As(err, &ne) && ne.Timeout() {
		return "timeout"
	}

	var dnsErr *net.DNSError
	if errors.As(err, &dnsErr) {
		if dnsErr.IsNotFound {
			return "dns-notfound"
		}
		return "dns-error"
	}

	var urlErr *url.Error
	if errors.As(err, &urlErr) && urlErr.Timeout() {
		return "timeout"
	}

	var tlsErr *tls.RecordHeaderError
	if errors.As(err, &tlsErr) {
		return "tls"
	}

	msg := strings.ToLower(err.Error())
	switch {
	case strings.Contains(msg, "certificate"),
		strings.Contains(msg, "x509"),
		strings.Contains(msg, "tls"):
		return "tls"
	case strings.Contains(msg, "connection refused"):
		return "conn-refused"
	case strings.Contains(msg, "connection reset"),
		strings.Contains(msg, "broken pipe"):
		return "conn-reset"
	case strings.Contains(msg, "no such host"):
		return "dns-notfound"
	case strings.Contains(msg, "i/o timeout"),
		strings.Contains(msg, "context deadline"),
		strings.Contains(msg, "timed out"),
		strings.Contains(msg, "超时"):
		return "timeout"
	case strings.Contains(msg, "no route to host"),
		strings.Contains(msg, "network is unreachable"):
		return "net-unreachable"
	case strings.Contains(msg, "eof"):
		return "eof"
	case strings.Contains(msg, "403"):
		return "http-403"
	case strings.Contains(msg, "429"):
		return "http-429"
	}
	return "error"
}

func errKindLabel(kind string) string {
	switch kind {
	case "timeout":
		return "超时"
	case "dns-notfound":
		return "DNS 解析失败"
	case "dns-error":
		return "DNS 错误"
	case "tls":
		return "TLS 握手失败"
	case "conn-refused":
		return "连接被拒绝"
	case "conn-reset":
		return "连接被重置"
	case "net-unreachable":
		return "网络不可达"
	case "eof":
		return "连接被对端关闭"
	case "http-403":
		return "被风控/拒绝（403）"
	case "http-429":
		return "请求过多（429）"
	case "not-registered":
		return "音源未注册"
	case "panic":
		return "内部异常"
	}
	return "错误"
}

func shortErr(err error) string {
	if err == nil {
		return ""
	}
	s := err.Error()
	if len([]rune(s)) > 220 {
		s = string([]rune(s)[:220]) + "…"
	}
	return s
}

var _ = fmt.Sprintf