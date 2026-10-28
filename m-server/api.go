package main

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/guohuiyuan/go-music-dl/core"
)

type sourceResult struct {
	Source  string `json:"source"`
	Label   string `json:"label"`
	Songs   []Song `json:"songs"`
	Error   string `json:"error,omitempty"`
	ErrKind string `json:"errKind,omitempty"`
	MS      int64  `json:"ms"`
}

func handlePing(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{
		"service":  appService,
		"version":  appVersion,
		"sources":  defaultSources,
		"optional": optionalSources(),
		"port":     currentPort,
		"uptime":   int64(time.Since(startedAt).Seconds()),
		"logLevel": levelName(int(logLevel.Load())),
	})
}

func handleSources(w http.ResponseWriter, r *http.Request) {
	list := make([]map[string]string, 0, len(allSources))
	for _, s := range allSources {
		list = append(list, map[string]string{"id": s, "label": sourceLabel(s)})
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"ok":      true,
		"default": defaultSources,
		"sources": list,
	})
}

func optionalSources() []string {
	seen := map[string]bool{}
	for _, s := range defaultSources {
		seen[s] = true
	}
	out := make([]string, 0, 3)
	for _, s := range allSources {
		if !seen[s] {
			out = append(out, s)
		}
	}
	return out
}

func handleSearch(w http.ResponseWriter, r *http.Request) {
	keyword := strings.TrimSpace(r.URL.Query().Get("q"))
	if keyword == "" {
		writeErr(w, http.StatusBadRequest, "缺少搜索关键词")
		return
	}

	srcs := parseSources(r.URL.Query().Get("sources"))
	limit := queryInt(r, "limit", 12)
	if limit <= 0 || limit > 50 {
		limit = 12
	}

	rid := reqSeq.Add(1)
	mlogInfo("[search#%d] 关键词=%q 音源=%v limit=%d", rid, keyword, srcs, limit)

	ch := make(chan sourceResult, len(srcs))
	pending := make(map[string]bool, len(srcs))
	for _, s := range srcs {
		pending[s] = true
	}

	for _, src := range srcs {
		go func(s string) {
			t0 := time.Now()
			mlogDebug("[search#%d][%s] 开始", rid, s)

			fn := core.GetSearchFunc(s)
			if fn == nil {
				mlogWarn("[search#%d][%s] 该音源未注册", rid, s)
				ch <- sourceResult{
					Source: s, Label: sourceLabel(s),
					Error: "音源未注册", ErrKind: "not-registered",
				}
				return
			}

			defer func() {
				if rec := recover(); rec != nil {
					ms := time.Since(t0).Milliseconds()
					mlogWarn("[search#%d][%s] panic %v (%dms)", rid, s, rec, ms)
					ch <- sourceResult{
						Source: s, Label: sourceLabel(s),
						Error:  fmt.Sprintf("内部异常：%v", rec),
						ErrKind: "panic", MS: ms,
					}
				}
			}()

			songs, err := runSearch(fn, keyword)
			ms := time.Since(t0).Milliseconds()

			if err != nil {
				kind := classifyErr(err)
				mlogWarn("[search#%d][%s] 失败 kind=%s（%s）用时=%dms err=%q",
					rid, s, kind, errKindLabel(kind), ms, shortErr(err))
				ch <- sourceResult{
					Source: s, Label: sourceLabel(s),
					Error: err.Error(), ErrKind: kind, MS: ms,
				}
				return
			}

			out := make([]Song, 0, limit)
			for _, m := range songs {
				if len(out) >= limit {
					break
				}
				song := songFromModel(m)
				song.Source = s
				if song.ID == "" || song.Name == "" {
					continue
				}
				out = append(out, song)
			}

			mlogInfo("[search#%d][%s] 完成 songs=%d 用时=%dms", rid, s, len(out), ms)
			ch <- sourceResult{Source: s, Label: sourceLabel(s), Songs: out, MS: ms}
		}(src)
	}

	groups := make([]sourceResult, 0, len(srcs))
	deadline := time.After(searchTimeout)
	received := 0

collect:
	for received < len(srcs) {
		select {
		case res := <-ch:
			received++
			delete(pending, res.Source)
			groups = append(groups, res)
		case <-deadline:
			for s := range pending {
				mlogWarn("[search#%d][%s] 整体超时（>%s）仍未返回", rid, s, searchTimeout)
				groups = append(groups, sourceResult{
					Source: s, Label: sourceLabel(s),
					Error:  fmt.Sprintf("整体超时（>%s）", searchTimeout),
					ErrKind: "timeout",
				})
			}
			break collect
		}
	}

	order := map[string]int{}
	for i, s := range srcs {
		order[s] = i
	}
	sort.SliceStable(groups, func(i, j int) bool {
		return order[groups[i].Source] < order[groups[j].Source]
	})

	flat := make([]Song, 0, len(srcs)*limit)
	errs := make([]map[string]string, 0, len(groups))
	for _, g := range groups {
		flat = append(flat, g.Songs...)
		if g.Error != "" {
			errs = append(errs, map[string]string{
				"source":  g.Source,
				"message": g.Error,
				"kind":    g.ErrKind,
				"label":   errKindLabel(g.ErrKind),
			})
		}
	}

	if len(errs) > 0 {
		mlogWarn("[search#%d] 汇总：成功 %d/%d 音源，失败 %d 个",
			rid, len(srcs)-len(errs), len(srcs), len(errs))
	} else {
		mlogInfo("[search#%d] 汇总：所有 %d 个音源成功", rid, len(srcs))
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"ok":     true,
		"query":  keyword,
		"songs":  flat,
		"groups": groups,
		"errors": errs,
	})
}

func handleResolve(w http.ResponseWriter, r *http.Request) {
	song := songFromQuery(r)
	if song.Source == "" || song.ID == "" {
		writeErr(w, http.StatusBadRequest, "缺少歌曲 id 或 source")
		return
	}

	mlogInfo("[resolve] source=%s id=%s name=%q", song.Source, song.ID, song.Name)

	res := resolveSong(song, true)
	if res == nil {
		res = &Resolution{Song: song, Warnings: []string{"解析失败"}}
	}
	if !res.Quality.Audio.OK && res.URL == "" && len(res.Bytes) == 0 {
		mlogWarn("[resolve] 全部失败 source=%s id=%s", song.Source, song.ID)
		writeJSON(w, http.StatusOK, map[string]any{
			"ok":       false,
			"error":    "所有音源都无法解析这首歌",
			"song":     song,
			"quality":  res.Quality,
			"warnings": res.Warnings,
		})
		return
	}

	sess := &session{Song: res.Song, URL: res.URL, Bytes: res.Bytes, Ext: res.Ext}
	putSession(sess)

	mlogInfo("[resolve] 成功 source=%s sid=%s score=%d switched=%v",
		res.Song.Source, sess.ID, res.Quality.Total, res.Switched)

	writeJSON(w, http.StatusOK, map[string]any{
		"ok":       true,
		"sid":      sess.ID,
		"song":     res.Song,
		"ext":      res.Ext,
		"quality":  res.Quality,
		"switched": res.Switched,
		"from":     res.From,
		"warnings": res.Warnings,
		"sources":  res.Sources,
	})
}

func handleSwitch(w http.ResponseWriter, r *http.Request) {
	song := songFromQuery(r)
	if song.Name == "" {
		writeErr(w, http.StatusBadRequest, "缺少歌名")
		return
	}

	alts := searchAlternatives(song)
	if len(alts) == 0 {
		writeJSON(w, http.StatusOK, map[string]any{"ok": false, "error": "没有找到其它音源"})
		return
	}

	for i, cand := range alts {
		if i >= maxSwitchTries {
			break
		}
		alt := tryResolve(cand)
		if alt == nil || !alt.Quality.Audio.OK {
			continue
		}
		sess := &session{Song: alt.Song, URL: alt.URL, Bytes: alt.Bytes, Ext: alt.Ext}
		putSession(sess)
		writeJSON(w, http.StatusOK, map[string]any{
			"ok":      true,
			"sid":     sess.ID,
			"song":    alt.Song,
			"ext":     alt.Ext,
			"quality": alt.Quality,
			"sources": alt.Sources,
		})
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"ok": false, "error": "其它音源也播不了"})
}

func handleStream(w http.ResponseWriter, r *http.Request) {
	sess := getSession(strings.TrimSpace(r.URL.Query().Get("sid")))
	if sess == nil {
		writeErr(w, http.StatusNotFound, "播放会话已过期，请重新点击播放")
		return
	}

	if len(sess.Bytes) > 0 {
		http.ServeContent(w, r, "a."+sess.Ext, sess.Created, bytes.NewReader(sess.Bytes))
		return
	}

	rangeHeader := r.Header.Get("Range")

	fetch, handled, err := core.NewSourceRangeFetch(sess.URL, sess.Song.Source, rangeHeader)
	if err != nil {
		writeErr(w, http.StatusBadGateway, "音源分片请求失败")
		return
	}
	if handled {
		w.Header().Set("Content-Type", core.AudioMimeByExt(sess.Ext))
		w.Header().Set("Accept-Ranges", "bytes")
		w.Header().Set("Content-Length", strconv.FormatInt(fetch.ContentLength, 10))
		if fetch.ContentRange != "" {
			w.Header().Set("Content-Range", fetch.ContentRange)
		}
		w.WriteHeader(fetch.StatusCode)
		if err := fetch.WriteTo(w); err != nil {
			return
		}
		return
	}

	req, err := core.BuildSourceRequest(http.MethodGet, sess.URL, sess.Song.Source, rangeHeader)
	if err != nil {
		writeErr(w, http.StatusBadGateway, "无法构造上游请求")
		return
	}

	resp, err := (&http.Client{Timeout: 60 * time.Second}).Do(req)
	if err != nil {
		writeErr(w, http.StatusBadGateway, "上游连接失败")
		return
	}
	defer resp.Body.Close()

	for k, v := range resp.Header {
		switch http.CanonicalHeaderKey(k) {
		case "Transfer-Encoding", "Connection", "Access-Control-Allow-Origin":
			continue
		}
		w.Header()[k] = v
	}
	if ct := strings.ToLower(resp.Header.Get("Content-Type")); ct == "" || strings.HasPrefix(ct, "application/octet-stream") {
		w.Header().Set("Content-Type", core.AudioMimeByExt(sess.Ext))
	}
	w.WriteHeader(resp.StatusCode)
	_, _ = io.Copy(w, resp.Body)
}

func handleLyric(w http.ResponseWriter, r *http.Request) {
	song := songFromQuery(r)
	if song.Source == "" || song.ID == "" {
		http.Error(w, "missing id or source", http.StatusBadRequest)
		return
	}

	text, check := fetchLyric(song)
	if strings.TrimSpace(text) == "" {
		w.Header().Set("X-M-Lyric", "missing")
		http.Error(w, "no lyric", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	w.Header().Set("X-M-Lyric", strconv.Itoa(check.Score))
	_, _ = io.WriteString(w, text)
}

func handleCover(w http.ResponseWriter, r *http.Request) {
	url := strings.TrimSpace(r.URL.Query().Get("url"))
	source := strings.TrimSpace(r.URL.Query().Get("source"))
	if url == "" {
		song := songFromQuery(r)
		url = song.Cover
	}
	if url == "" {
		http.Error(w, "missing url", http.StatusBadRequest)
		return
	}

	key := "c:" + url
	if e, ok := memoGet(coverMemo, key); ok && len(e.Data) > 0 {
		writeImage(w, e.Data, e.Mime)
		return
	}

	data, mime, err := core.FetchBytesWithMime(url, source)
	if err != nil || len(data) == 0 {
		http.Error(w, "cover fetch failed", http.StatusBadGateway)
		return
	}
	if !checkCover(data, mime).OK {
		http.Error(w, "cover invalid", http.StatusBadGateway)
		return
	}

	memoPut(coverMemo, key, cacheEntry{Data: data, Mime: mime})
	writeImage(w, data, mime)
}

func writeImage(w http.ResponseWriter, data []byte, mime string) {
	if mime == "" {
		mime = "image/jpeg"
	}
	w.Header().Set("Content-Type", mime)
	w.Header().Set("Cache-Control", "public, max-age=21600")
	_, _ = w.Write(data)
}

func handleMedia(w http.ResponseWriter, r *http.Request) {
	rel := strings.TrimSpace(r.URL.Query().Get("path"))
	if rel == "" {
		http.Error(w, "missing path", http.StatusBadRequest)
		return
	}
	full, ok := safeJoin(dataDir(), rel)
	if !ok {
		http.Error(w, "forbidden", http.StatusForbidden)
		return
	}
	http.ServeFile(w, r, full)
}