package main

import (
	"fmt"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/guohuiyuan/go-music-dl/core"
)

type diagResult struct {
	Source  string `json:"source"`
	Label   string `json:"label"`
	OK      bool   `json:"ok"`
	Songs   int    `json:"songs"`
	MS      int64  `json:"ms"`
	Error   string `json:"error,omitempty"`
	ErrKind string `json:"errKind,omitempty"`
	Reason  string `json:"reason,omitempty"`
}

// handleDiag 一次并发探测所有音源，帮你在异地网络快速定位是哪一层出问题
// GET /api/m/diag?q=周杰伦 稻香&sources=netease,qq,...
func handleDiag(w http.ResponseWriter, r *http.Request) {
	keyword := strings.TrimSpace(r.URL.Query().Get("q"))
	if keyword == "" {
		keyword = "周杰伦 稻香"
	}
	srcs := parseSources(r.URL.Query().Get("sources"))

	mlogInfo("[diag] 开始诊断 关键词=%q 音源=%v", keyword, srcs)

	var (
		wg  sync.WaitGroup
		mu  sync.Mutex
		out = make([]diagResult, 0, len(srcs))
	)

	for _, src := range srcs {
		wg.Add(1)
		go func(s string) {
			defer wg.Done()
			t0 := time.Now()
			res := diagResult{Source: s, Label: sourceLabel(s)}

			fn := core.GetSearchFunc(s)
			if fn == nil {
				res.Error = "音源未注册"
				res.ErrKind = "not-registered"
				res.Reason = errKindLabel(res.ErrKind)
				mu.Lock()
				out = append(out, res)
				mu.Unlock()
				return
			}

			func() {
				defer func() {
					if rec := recover(); rec != nil {
						res.Error = fmt.Sprintf("内部异常：%v", rec)
						res.ErrKind = "panic"
					}
				}()
				songs, err := runSearch(fn, keyword)
				res.MS = time.Since(t0).Milliseconds()
				if err != nil {
					res.Error = err.Error()
					res.ErrKind = classifyErr(err)
					return
				}
				res.OK = true
				res.Songs = len(songs)
			}()

			if !res.OK {
				if res.ErrKind == "" {
					res.ErrKind = classifyErr(fmt.Errorf("%s", res.Error))
				}
				res.Reason = errKindLabel(res.ErrKind)
				mlogWarn("[diag][%s] 失败 kind=%s（%s）用时=%dms err=%q",
					s, res.ErrKind, res.Reason, res.MS, shortErr(fmt.Errorf("%s", res.Error)))
			} else {
				mlogInfo("[diag][%s] 成功 songs=%d 用时=%dms", s, res.Songs, res.MS)
			}

			mu.Lock()
			out = append(out, res)
			mu.Unlock()
		}(src)
	}
	wg.Wait()

	writeJSON(w, http.StatusOK, map[string]any{
		"ok":      true,
		"query":   keyword,
		"results": out,
	})
}