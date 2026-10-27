package main

import (
	"bytes"
	"fmt"
	"image"
	_ "image/gif"
	_ "image/jpeg"
	_ "image/png"
	"io"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/guohuiyuan/go-music-dl/core"
	"golang.org/x/text/encoding/simplifiedchinese"
	"golang.org/x/text/transform"
)

// Check 单项检查结果
type Check struct {
	OK      bool     `json:"ok"`
	Score   int      `json:"score"`
	Issues  []string `json:"issues,omitempty"`
	Ext     string   `json:"ext,omitempty"`
	Size    int64    `json:"size,omitempty"`
	Bitrate int      `json:"bitrate,omitempty"`
}

var probeClient = &http.Client{Timeout: 9 * time.Second}

// ---------- 音频 ----------

// 只取头部若干字节判断，不下载整首
func probeAudioURL(urlStr, source string, duration int) Check {
	c := Check{Score: 100}

	req, err := core.BuildSourceRequest(http.MethodGet, urlStr, source, "bytes=0-65535")
	if err != nil {
		c.OK = false
		c.Score = 0
		c.Issues = append(c.Issues, "无法构造请求")
		return c
	}

	resp, err := probeClient.Do(req)
	if err != nil {
		c.OK = false
		c.Score = 0
		c.Issues = append(c.Issues, "连接音源失败")
		return c
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusPartialContent {
		c.OK = false
		c.Score = 0
		c.Issues = append(c.Issues, "音源返回 HTTP "+strconv.Itoa(resp.StatusCode))
		return c
	}

	head, _ := io.ReadAll(io.LimitReader(resp.Body, 65536))
	c.Size = totalSize(resp)
	c.Ext = core.DetectAudioExtBySignature(head)

	return judgeAudioHead(head, c, duration)
}

// 已经拿到完整字节时的判定
func checkAudioBytes(data []byte, duration int) Check {
	c := Check{Score: 100, Size: int64(len(data))}
	head := data
	if len(head) > 65536 {
		head = head[:65536]
	}
	c.Ext = core.DetectAudioExtBySignature(data)
	return judgeAudioHead(head, c, duration)
}

func judgeAudioHead(head []byte, c Check, duration int) Check {
	if len(head) < 64 {
		c.OK = false
		c.Score = 0
		c.Issues = append(c.Issues, "音频数据过短")
		return c
	}

	if looksLikeText(head) {
		c.OK = false
		c.Score = 0
		c.Issues = append(c.Issues, "返回的是网页或错误内容，不是音频")
		return c
	}

	if c.Ext == "" {
		c.OK = false
		c.Score = 0
		c.Issues = append(c.Issues, "音频头部无法识别（疑似损坏）")
		return c
	}

	if c.Size > 0 && duration > 0 {
		kbps := int(c.Size * 8 / int64(duration) / 1000)
		c.Bitrate = kbps
		switch {
		case kbps < 40:
			c.Issues = append(c.Issues,
				fmt.Sprintf("疑似试听片段（约 %d kbps，与标称时长不符）", kbps))
			c.Score -= 45
		case kbps > 1600:
			c.Issues = append(c.Issues,
				fmt.Sprintf("码率异常（约 %d kbps）", kbps))
			c.Score -= 10
		}
	}

	if c.Score < 0 {
		c.Score = 0
	}
	c.OK = c.Score >= 55
	return c
}

func totalSize(resp *http.Response) int64 {
	if cr := resp.Header.Get("Content-Range"); cr != "" {
		if idx := strings.LastIndex(cr, "/"); idx >= 0 {
			if n, err := strconv.ParseInt(strings.TrimSpace(cr[idx+1:]), 10, 64); err == nil {
				return n
			}
		}
	}
	return resp.ContentLength
}

// 判断一段字节是不是网页/JSON/错误文本
func looksLikeText(b []byte) bool {
	if len(b) == 0 {
		return true
	}
	if len(b) > 512 {
		b = b[:512]
	}
	s := strings.ToLower(strings.TrimLeft(string(b), " \t\r\n\ufeff\x00"))
	if s == "" {
		return true
	}
	for _, p := range []string{"<!doctype", "<html", "<?xml", "<head", "<body"} {
		if strings.HasPrefix(s, p) {
			return true
		}
	}
	if strings.HasPrefix(s, "{") || strings.HasPrefix(s, "[") {
		return true
	}
	for _, p := range []string{"error", "not found", "forbidden", "denied", "too many"} {
		if strings.HasPrefix(s, p) {
			return true
		}
	}
	return false
}

// ---------- 歌词 ----------

var (
	lrcStampRe = regexp.MustCompile(`\[(\d{1,3}):(\d{1,2})(?:[.:](\d{1,3}))?\]`)
	htmlTagRe  = regexp.MustCompile(`(?i)<\s*/?\s*(br|p|div|span|html|body|script)\b`)
)

func checkLyric(raw string) (string, Check) {
	c := Check{Score: 100}

	text := raw
	if !utf8.ValidString(text) {
		if decoded, err := decodeGBK(raw); err == nil {
			text = decoded
		} else {
			c.Issues = append(c.Issues, "歌词编码无法识别")
			c.Score -= 40
		}
	}

	text = strings.ReplaceAll(text, "\r\n", "\n")
	trimmed := strings.TrimSpace(text)
	if trimmed == "" {
		c.OK = false
		c.Score = 0
		c.Issues = append(c.Issues, "歌词为空")
		return text, c
	}
	if looksLikeText([]byte(trimmed)) || htmlTagRe.MatchString(trimmed) {
		c.OK = false
		c.Score = 0
		c.Issues = append(c.Issues, "歌词内容异常（疑似网页）")
		return text, c
	}

	stamps := len(lrcStampRe.FindAllString(trimmed, -1))
	lines := 0
	for _, line := range strings.Split(trimmed, "\n") {
		line = strings.TrimSpace(line)
		if line == "" || !lrcStampRe.MatchString(line) {
			continue
		}
		if strings.TrimSpace(lrcStampRe.ReplaceAllString(line, "")) != "" {
			lines++
		}
	}

	switch {
	case stamps == 0:
		c.Issues = append(c.Issues, "歌词没有时间轴")
		c.Score -= 40
	case lines < 3:
		c.Issues = append(c.Issues, fmt.Sprintf("有效歌词仅 %d 行", lines))
		c.Score -= 25
	}

	if c.Score < 0 {
		c.Score = 0
	}
	c.OK = c.Score >= 60
	return text, c
}

func decodeGBK(s string) (string, error) {
	r := transform.NewReader(bytes.NewReader([]byte(s)), simplifiedchinese.GBK.NewDecoder())
	out, err := io.ReadAll(r)
	if err != nil {
		return "", err
	}
	return string(out), nil
}

// ---------- 封面 ----------

func checkCover(data []byte, mime string) Check {
	c := Check{Score: 100, Size: int64(len(data))}

	if len(data) == 0 {
		c.OK = false
		c.Score = 0
		c.Issues = append(c.Issues, "封面为空")
		return c
	}
	if len(data) < 1024 {
		c.OK = false
		c.Score = 20
		c.Issues = append(c.Issues, "封面文件过小")
		return c
	}

	kind := imageKind(data)
	if kind == "" {
		c.OK = false
		c.Score = 10
		c.Issues = append(c.Issues, "封面格式无法识别")
		return c
	}

	if kind == "webp" {
		c.Ext = "webp"
		c.OK = true
		return c
	}

	cfg, _, err := image.DecodeConfig(bytes.NewReader(data))
	if err != nil {
		c.OK = false
		c.Score = 20
		c.Issues = append(c.Issues, "封面无法解码（疑似损坏）")
		return c
	}
	c.Ext = kind
	if cfg.Width < 100 || cfg.Height < 100 {
		c.Issues = append(c.Issues, fmt.Sprintf("封面尺寸过小（%dx%d）", cfg.Width, cfg.Height))
		c.Score -= 20
	}
	c.OK = c.Score >= 60
	return c
}

func imageKind(b []byte) string {
	switch {
	case len(b) >= 3 && b[0] == 0xFF && b[1] == 0xD8 && b[2] == 0xFF:
		return "jpg"
	case len(b) >= 8 && bytes.Equal(b[:8], []byte{0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A}):
		return "png"
	case len(b) >= 6 && (bytes.Equal(b[:6], []byte("GIF87a")) || bytes.Equal(b[:6], []byte("GIF89a"))):
		return "gif"
	case len(b) >= 12 && bytes.Equal(b[:4], []byte("RIFF")) && bytes.Equal(b[8:12], []byte("WEBP")):
		return "webp"
	}
	return ""
}
