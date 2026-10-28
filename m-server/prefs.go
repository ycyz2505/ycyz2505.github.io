package main

import (
	"encoding/json"
	"net/http"
	"os"
	"strings"
	"sync"
)

// ============================================================
// 音源分配偏好
//
// 音频、歌词、封面可以各自指定来源，例如：
//   音频 = bilibili，歌词 = migu，封面 = migu
// 值为 "auto" 表示跟随音频源（也就是原来的行为）。
// 存在 data/m/prefs.json，改完立即生效。
// ============================================================

type Prefs struct {
	Audio string `json:"audio"`
	Lyric string `json:"lyric"`
	Cover string `json:"cover"`
}

var (
	prefsMu    sync.RWMutex
	prefsCache *Prefs
)

func defaultPrefs() *Prefs {
	return &Prefs{Audio: "auto", Lyric: "auto", Cover: "auto"}
}

func normalizeSource(v string) string {
	v = strings.ToLower(strings.TrimSpace(v))
	if v == "" || v == "auto" {
		return "auto"
	}
	if !isValidSource(v) {
		return "auto"
	}
	return v
}

func loadPrefs() *Prefs {
	prefsMu.RLock()
	if prefsCache != nil {
		p := *prefsCache
		prefsMu.RUnlock()
		return &p
	}
	prefsMu.RUnlock()

	p := defaultPrefs()

	raw, err := os.ReadFile(prefsFile())
	if err == nil {
		var in Prefs
		if json.Unmarshal(raw, &in) == nil {
			p.Audio = in.Audio
			p.Lyric = in.Lyric
			p.Cover = in.Cover
		}
	}

	p.Audio = normalizeSource(p.Audio)
	p.Lyric = normalizeSource(p.Lyric)
	p.Cover = normalizeSource(p.Cover)

	prefsMu.Lock()
	prefsCache = p
	out := *p
	prefsMu.Unlock()

	return &out
}

func savePrefs(p *Prefs) error {
	if err := ensureDataDir(); err != nil {
		return err
	}

	raw, err := json.MarshalIndent(p, "", "  ")
	if err != nil {
		return err
	}

	target := prefsFile()
	tmp := target + ".part"
	if err := os.WriteFile(tmp, raw, 0o644); err != nil {
		return err
	}
	if err := os.Rename(tmp, target); err != nil {
		return err
	}

	prefsMu.Lock()
	saved := *p
	prefsCache = &saved
	prefsMu.Unlock()

	return nil
}

func handlePrefsGet(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{
		"ok":      true,
		"prefs":   loadPrefs(),
		"sources": allSources,
	})
}

func handlePrefsSet(w http.ResponseWriter, r *http.Request) {
	var in Prefs
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		writeErr(w, http.StatusBadRequest, "请求格式错误")
		return
	}

	next := &Prefs{
		Audio: normalizeSource(in.Audio),
		Lyric: normalizeSource(in.Lyric),
		Cover: normalizeSource(in.Cover),
	}

	if err := savePrefs(next); err != nil {
		writeErr(w, http.StatusInternalServerError, "保存音源设置失败")
		return
	}

	// 设置变了，之前缓存的「跨源匹配结果」作废
	clearAltMemo()

	mlogInfo("[prefs] 音频=%s 歌词=%s 封面=%s",
		next.Audio, next.Lyric, next.Cover)

	writeJSON(w, http.StatusOK, map[string]any{"ok": true, "prefs": next})
}
