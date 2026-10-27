package main

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/guohuiyuan/music-lib/model"
)

// Song 是对外的统一歌曲结构
type Song struct {
	ID       string            `json:"id"`
	Source   string            `json:"source"`
	Name     string            `json:"name"`
	Artist   string            `json:"artist"`
	Album    string            `json:"album"`
	Duration int               `json:"duration"`
	Cover    string            `json:"cover"`
	Ext      string            `json:"ext"`
	Extra    map[string]string `json:"extra,omitempty"`
}

func songFromModel(m model.Song) Song {
	return Song{
		ID:       strings.TrimSpace(m.ID),
		Source:   strings.TrimSpace(m.Source),
		Name:     strings.TrimSpace(m.Name),
		Artist:   strings.TrimSpace(m.Artist),
		Album:    strings.TrimSpace(m.Album),
		Duration: m.Duration,
		Cover:    strings.TrimSpace(m.Cover),
		Ext:      strings.TrimPrefix(strings.TrimSpace(m.Ext), "."),
		Extra:    m.Extra,
	}
}

func (s Song) toModel() *model.Song {
	return &model.Song{
		ID:       s.ID,
		Source:   s.Source,
		Name:     s.Name,
		Artist:   s.Artist,
		Album:    s.Album,
		Duration: s.Duration,
		Cover:    s.Cover,
		Ext:      s.Ext,
		Extra:    s.Extra,
	}
}

func (s Song) key() string { return s.Source + ":" + s.ID }

// 从查询参数还原一首歌
func songFromQuery(r *http.Request) Song {
	q := r.URL.Query()
	s := Song{
		ID:       strings.TrimSpace(q.Get("id")),
		Source:   strings.TrimSpace(q.Get("source")),
		Name:     strings.TrimSpace(q.Get("name")),
		Artist:   strings.TrimSpace(q.Get("artist")),
		Album:    strings.TrimSpace(q.Get("album")),
		Duration: queryInt(r, "duration", 0),
		Cover:    strings.TrimSpace(q.Get("cover")),
		Ext:      strings.TrimPrefix(strings.TrimSpace(q.Get("ext")), "."),
	}
	if raw := strings.TrimSpace(q.Get("extra")); raw != "" {
		var m map[string]string
		if json.Unmarshal([]byte(raw), &m) == nil {
			s.Extra = m
		}
	}
	return s
}

// 音源
var (
	// 默认参与搜索的音源
	defaultSources = []string{"netease", "qq", "kugou", "kuwo", "qianqian"}
	// 需要整段下载后才能播放的音源（音频被加密）
	fullFetchSources = map[string]bool{"soda": true, "migu": true}
	// 全部可搜索音源
	allSources = []string{
		"netease", "qq", "kugou", "kuwo", "migu",
		"qianqian", "soda", "bilibili",
	}
)

func sourceLabel(src string) string {
	switch src {
	case "netease":
		return "网易云"
	case "qq":
		return "QQ音乐"
	case "kugou":
		return "酷狗"
	case "kuwo":
		return "酷我"
	case "migu":
		return "咪咕"
	case "qianqian":
		return "千千"
	case "soda":
		return "汽水"
	case "bilibili":
		return "B站"
	case "local":
		return "本地"
	}
	return src
}

func isValidSource(src string) bool {
	for _, s := range allSources {
		if s == src {
			return true
		}
	}
	return false
}

func parseSources(raw string) []string {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return append([]string(nil), defaultSources...)
	}
	seen := map[string]bool{}
	out := make([]string, 0, 4)
	for _, part := range strings.Split(raw, ",") {
		s := strings.TrimSpace(part)
		if s == "" || seen[s] || !isValidSource(s) {
			continue
		}
		seen[s] = true
		out = append(out, s)
	}
	if len(out) == 0 {
		return append([]string(nil), defaultSources...)
	}
	return out
}
