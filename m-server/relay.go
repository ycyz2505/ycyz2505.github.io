package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/guohuiyuan/go-music-dl/core"
)

// ============================================================
//  在线搜索中转（Meting / 兼容 Meting 的公共 API）
//
//  教室网络直连网易云 / QQ / 酷狗等接口会被拦截，所以这里把搜索、
//  取流、歌词、封面都交给公共中转接口。每个中转接口都可能有延迟或
//  临时失效，搜索时会并发请求多个，合并结果；播放时优先用返回该
//  结果的中转，失败再让上层换源逻辑尝试其它中转。
// ============================================================

const relaySource = "meting"

const relayUA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36"

type relayEndpoint struct {
	Name     string
	Kind     string
	Base     string
	Upstream string
}

var relayEndpoints = []relayEndpoint{
	{
		Name:     "gdstudio",
		Kind:     "gdstudio",
		Base:     "https://music-api.gdstudio.xyz/api.php",
		Upstream: "netease",
	},
	{
		Name:     "icodeq",
		Kind:     "icodeq",
		Base:     "https://meting.icodeq.com/api",
		Upstream: "netease",
	},
}

var (
	relayFetchClient  = &http.Client{Timeout: 25 * time.Second}
	relayStreamClient = &http.Client{Timeout: 10 * time.Minute}
)

// ---------- JSON 小工具 ----------

// 中转接口的 id 有时是字符串、有时是数字
type flexString string

func (f *flexString) UnmarshalJSON(data []byte) error {
	if len(data) == 0 || string(data) == "null" {
		*f = ""
		return nil
	}
	if data[0] == '"' {
		var s string
		if json.Unmarshal(data, &s) == nil {
			*f = flexString(s)
			return nil
		}
	}
	var n json.Number
	if json.Unmarshal(data, &n) == nil {
		*f = flexString(n.String())
		return nil
	}
	*f = flexString(strings.Trim(string(data), `"`))
	return nil
}

func relayArtistList(raw json.RawMessage) []string {
	if len(raw) == 0 {
		return nil
	}

	var list []string
	if json.Unmarshal(raw, &list) == nil {
		return list
	}

	var one string
	if json.Unmarshal(raw, &one) == nil {
		return []string{one}
	}
	return nil
}

// ---------- HTTP ----------

func relayRequest(ctx context.Context, rawURL string, timeout time.Duration) (*http.Response, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, rawURL, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("User-Agent", relayUA)
	req.Header.Set("Accept", "application/json,text/plain,*/*")

	client := &http.Client{Timeout: timeout}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		resp.Body.Close()
		return nil, fmt.Errorf("HTTP %d", resp.StatusCode)
	}
	return resp, nil
}

func relayGet(ctx context.Context, rawURL string, timeout time.Duration, max int64) ([]byte, string, error) {
	resp, err := relayRequest(ctx, rawURL, timeout)
	if err != nil {
		return nil, "", err
	}
	defer resp.Body.Close()

	data, err := io.ReadAll(io.LimitReader(resp.Body, max))
	if err != nil {
		return nil, "", err
	}
	if len(data) == 0 {
		return nil, "", errors.New("空响应")
	}
	return data, resp.Header.Get("Content-Type"), nil
}

func relayGetBytes(ctx context.Context, rawURL string, timeout time.Duration, max int64) ([]byte, string, error) {
	return relayGet(ctx, rawURL, timeout, max)
}

func relayJSONError(data []byte) error {
	text := strings.TrimSpace(string(data))
	if len(text) > 160 {
		text = text[:160]
	}
	return fmt.Errorf("返回非 JSON：%s", text)
}

// ---------- 基础字段 ----------

func relayByName(name string) *relayEndpoint {
	for i := range relayEndpoints {
		if relayEndpoints[i].Name == name {
			return &relayEndpoints[i]
		}
	}
	return nil
}

func relayProviderLabel(upstream string) string {
	switch strings.ToLower(strings.TrimSpace(upstream)) {
	case "netease":
		return "网易云"
	case "tencent", "qq":
		return "QQ音乐"
	case "kugou":
		return "酷狗"
	case "kuwo":
		return "酷我"
	case "migu":
		return "咪咕"
	case "baidu", "qianqian":
		return "千千"
	}
	return upstream
}

func relaySongID(relay, upstream, id string) string {
	id = strings.TrimSpace(id)
	if id == "" {
		id = "unknown"
	}
	return relay + ":" + upstream + ":" + id
}

func relayIDFromURL(raw string) string {
	u, err := url.Parse(raw)
	if err != nil {
		return ""
	}
	return strings.TrimSpace(u.Query().Get("id"))
}

func relayExtFromURL(raw string) string {
	u, err := url.Parse(raw)
	if err != nil {
		return ""
	}
	path := strings.ToLower(u.Path)
	if idx := strings.LastIndex(path, "."); idx >= 0 && idx+1 < len(path) {
		ext := path[idx+1:]
		if len(ext) <= 5 {
			return ext
		}
	}
	return ""
}

// ============================================================
//  搜索
// ============================================================

func relaySearch(keyword string, limit int) ([]Song, error) {
	keyword = strings.TrimSpace(keyword)
	if keyword == "" {
		return nil, errors.New("缺少搜索关键词")
	}
	if limit <= 0 || limit > 50 {
		limit = 12
	}

	ctx, cancel := context.WithTimeout(context.Background(), 8*time.Second)
	defer cancel()

	type result struct {
		relay string
		songs []Song
		err   error
		ms    int64
	}

	ch := make(chan result, 2)

	go func() {
		t0 := time.Now()
		songs, err := relaySearchGD(ctx, keyword, limit)
		ch <- result{relay: "gdstudio", songs: songs, err: err, ms: time.Since(t0).Milliseconds()}
	}()

	go func() {
		t0 := time.Now()
		songs, err := relaySearchICodeq(ctx, keyword, limit)
		ch <- result{relay: "icodeq", songs: songs, err: err, ms: time.Since(t0).Milliseconds()}
	}()

	groups := map[string][]Song{}
	errs := make([]string, 0, 2)

	for i := 0; i < 2; i++ {
		r := <-ch
		if r.err != nil {
			mlogWarn("[relay] %s 搜索失败（%dms）：%s", r.relay, r.ms, r.err)
			errs = append(errs, r.relay+": "+r.err.Error())
			continue
		}
		if len(r.songs) == 0 {
			mlogWarn("[relay] %s 返回 0 首（%dms）", r.relay, r.ms)
			continue
		}
		mlogInfo("[relay] %s 返回 %d 首（%dms）", r.relay, len(r.songs), r.ms)
		groups[r.relay] = r.songs
	}

	if len(groups) == 0 {
		if len(errs) == 0 {
			errs = append(errs, "所有中转都没有返回结果")
		}
		return nil, fmt.Errorf("Meting 中转搜索失败：%s", strings.Join(errs, "；"))
	}

	return relayMix(groups, limit), nil
}

// 把不同中转 / 不同上游的结果混排：每个上游轮流取一首，避免 12 首全是网易云。
func relayMix(groups map[string][]Song, limit int) []Song {
	providers := []string{"netease", "tencent", "kugou", "kuwo", "migu"}
	byProvider := map[string][]Song{}
	seen := map[string]bool{}

	// icodeq 的音频走它的代理直链，在校园网下更稳；GD Studio 作为补充 / 备用
	for _, relay := range []string{"icodeq", "gdstudio"} {
		for _, song := range groups[relay] {
			upstream := strings.TrimSpace(song.Extra["upstream"])
			if upstream == "" {
				upstream = "netease"
			}
			key := upstream + "|" + strings.ToLower(song.Name) + "|" + strings.ToLower(song.Artist)
			if seen[key] {
				continue
			}
			seen[key] = true
			byProvider[upstream] = append(byProvider[upstream], song)
		}
	}

	out := make([]Song, 0, limit)
	index := map[string]int{}

	for len(out) < limit {
		added := false
		for _, upstream := range providers {
			list := byProvider[upstream]
			i := index[upstream]
			if i >= len(list) {
				continue
			}
			out = append(out, list[i])
			index[upstream] = i + 1
			added = true
			if len(out) >= limit {
				break
			}
		}
		if !added {
			break
		}
	}

	if len(out) < limit {
		for _, upstream := range providers {
			for i := index[upstream]; i < len(byProvider[upstream]); i++ {
				out = append(out, byProvider[upstream][i])
				if len(out) >= limit {
					return out
				}
			}
		}
	}

	return out
}

// ---------- GD Studio（Meting 兼容格式） ----------

type gdSearchSong struct {
	ID      flexString      `json:"id"`
	Name    string          `json:"name"`
	Artist  json.RawMessage `json:"artist"`
	Album   string          `json:"album"`
	PicID   flexString      `json:"pic_id"`
	URLID   flexString      `json:"url_id"`
	LyricID flexString      `json:"lyric_id"`
	Source  string          `json:"source"`
}

func relaySearchGD(ctx context.Context, keyword string, limit int) ([]Song, error) {
	ep := relayByName("gdstudio")
	if ep == nil {
		return nil, errors.New("GD Studio 中转未配置")
	}

	q := url.Values{}
	q.Set("types", "search")
	q.Set("source", ep.Upstream)
	q.Set("name", keyword)
	q.Set("count", strconv.Itoa(limit))

	data, _, err := relayGet(ctx, ep.Base+"?"+q.Encode(), 7*time.Second, 4<<20)
	if err != nil {
		return nil, err
	}

	var rows []gdSearchSong
	if json.Unmarshal(data, &rows) != nil {
		return nil, relayJSONError(data)
	}

	out := make([]Song, 0, len(rows))
	for _, row := range rows {
		name := strings.TrimSpace(row.Name)
		if name == "" {
			continue
		}

		id := strings.TrimSpace(string(row.URLID))
		if id == "" {
			id = strings.TrimSpace(string(row.ID))
		}
		if id == "" {
			continue
		}

		artists := relayArtistList(row.Artist)
		extra := map[string]string{
			"relay":    ep.Name,
			"upstream": ep.Upstream,
			"provider": relayProviderLabel(ep.Upstream),
			"song_id":  strings.TrimSpace(string(row.ID)),
			"url_id":   strings.TrimSpace(string(row.URLID)),
			"lyric_id": strings.TrimSpace(string(row.LyricID)),
			"pic_id":   strings.TrimSpace(string(row.PicID)),
		}

		cover := ""
		if strings.TrimSpace(string(row.PicID)) != "" {
			pq := url.Values{}
			pq.Set("types", "pic")
			pq.Set("source", ep.Upstream)
			pq.Set("id", strings.TrimSpace(string(row.PicID)))
			cover = ep.Base + "?" + pq.Encode()
		}

		out = append(out, Song{
			ID:     relaySongID(ep.Name, ep.Upstream, id),
			Source: relaySource,
			Name:   name,
			Artist: strings.Join(artists, " / "),
			Album:  strings.TrimSpace(row.Album),
			Cover:  cover,
			Extra:  extra,
		})
	}

	return out, nil
}

// ---------- icodeq（Meting 接口，返回带 auth 的直链） ----------

type icodeqSearchSong struct {
	Title  string `json:"title"`
	Author string `json:"author"`
	URL    string `json:"url"`
	Pic    string `json:"pic"`
	Lrc    string `json:"lrc"`
}

func relaySearchICodeq(ctx context.Context, keyword string, limit int) ([]Song, error) {
	ep := relayByName("icodeq")
	if ep == nil {
		return nil, errors.New("icodeq 中转未配置")
	}

	upstreams := []string{"netease", "tencent", "kugou"}
	type result struct {
		songs []Song
		err   error
	}

	ch := make(chan result, len(upstreams))
	for _, upstream := range upstreams {
		go func(up string) {
			songs, err := relaySearchICodeqOne(ctx, ep, up, keyword, limit)
			ch <- result{songs: songs, err: err}
		}(upstream)
	}

	out := make([]Song, 0, limit)
	errs := make([]string, 0, len(upstreams))

	for i := 0; i < len(upstreams); i++ {
		r := <-ch
		if r.err != nil {
			errs = append(errs, r.err.Error())
			continue
		}
		out = append(out, r.songs...)
	}

	if len(out) == 0 {
		if len(errs) == 0 {
			errs = append(errs, "没有返回结果")
		}
		return nil, errors.New(strings.Join(errs, "；"))
	}
	return out, nil
}

func relaySearchICodeqOne(ctx context.Context, ep *relayEndpoint, upstream, keyword string, limit int) ([]Song, error) {
	q := url.Values{}
	q.Set("server", upstream)
	q.Set("type", "search")
	q.Set("id", keyword)

	data, _, err := relayGet(ctx, ep.Base+"?"+q.Encode(), 7*time.Second, 4<<20)
	if err != nil {
		return nil, err
	}

	var rows []icodeqSearchSong
	if json.Unmarshal(data, &rows) != nil {
		return nil, relayJSONError(data)
	}

	out := make([]Song, 0, len(rows))
	for _, row := range rows {
		title := strings.TrimSpace(row.Title)
		audio := strings.TrimSpace(row.URL)
		if title == "" || audio == "" {
			continue
		}

		id := relayIDFromURL(audio)
		if id == "" {
			id = upstream + ":" + title + ":" + strings.TrimSpace(row.Author)
		}

		extra := map[string]string{
			"relay":     ep.Name,
			"upstream":  upstream,
			"provider":  relayProviderLabel(upstream),
			"song_id":   id,
			"audio_url": audio,
			"lyric_url": strings.TrimSpace(row.Lrc),
			"pic_url":   strings.TrimSpace(row.Pic),
			"ts":        strconv.FormatInt(time.Now().Unix(), 10),
		}

		out = append(out, Song{
			ID:     relaySongID(ep.Name, upstream, id),
			Source: relaySource,
			Name:   title,
			Artist: strings.TrimSpace(row.Author),
			Cover:  strings.TrimSpace(row.Pic),
			Extra:  extra,
		})

		if len(out) >= limit {
			break
		}
	}

	return out, nil
}

// 供换源 / 跨源匹配使用：按歌名 + 歌手在中转里再搜一遍
func relaySearchCandidates(name, artist string, limit int) []Song {
	keyword := strings.TrimSpace(name)
	if strings.TrimSpace(artist) != "" {
		keyword = keyword + " " + strings.TrimSpace(artist)
	}
	if keyword == "" {
		return nil
	}

	songs, err := relaySearch(keyword, limit)
	if err != nil {
		return nil
	}
	return songs
}

// 换源时保留两个中转的原始结果（不去重），这样 GD 的直链失效时，
// 还能马上试同一首歌在 icodeq 上的代理直链。
func relaySearchAllCandidates(name, artist string, limit int) []Song {
	keyword := strings.TrimSpace(name)
	if strings.TrimSpace(artist) != "" {
		keyword = keyword + " " + strings.TrimSpace(artist)
	}
	if keyword == "" {
		return nil
	}

	ctx, cancel := context.WithTimeout(context.Background(), 8*time.Second)
	defer cancel()

	type result struct {
		songs []Song
		err   error
	}
	ch := make(chan result, 2)

	go func() {
		songs, err := relaySearchGD(ctx, keyword, limit)
		ch <- result{songs: songs, err: err}
	}()
	go func() {
		songs, err := relaySearchICodeq(ctx, keyword, limit)
		ch <- result{songs: songs, err: err}
	}()

	out := make([]Song, 0, limit*2)
	for i := 0; i < 2; i++ {
		r := <-ch
		if r.err == nil {
			out = append(out, r.songs...)
		}
	}
	return out
}

// ============================================================
//  取流 / 歌词 / 封面
// ============================================================

func relayAudioURL(song Song) (string, string, error) {
	relay := strings.TrimSpace(song.Extra["relay"])
	upstream := strings.TrimSpace(song.Extra["upstream"])
	if upstream == "" {
		upstream = "netease"
	}

	switch relay {
	case "gdstudio":
		ep := relayByName("gdstudio")
		if ep == nil {
			return "", "", errors.New("GD Studio 中转未配置")
		}
		id := strings.TrimSpace(song.Extra["url_id"])
		if id == "" {
			id = strings.TrimSpace(song.Extra["song_id"])
		}
		if id == "" {
			return "", "", errors.New("缺少歌曲 id")
		}

		q := url.Values{}
		q.Set("types", "url")
		q.Set("source", ep.Upstream)
		q.Set("id", id)

		data, _, err := relayGet(context.Background(), ep.Base+"?"+q.Encode(), 12*time.Second, 1<<20)
		if err != nil {
			return "", "", err
		}
		var row struct {
			URL string `json:"url"`
			Ext string `json:"ext"`
		}
		if json.Unmarshal(data, &row) != nil || strings.TrimSpace(row.URL) == "" {
			return "", "", fmt.Errorf("中转没有返回音频地址")
		}
		ext := strings.TrimPrefix(strings.TrimSpace(row.Ext), ".")
		if ext == "" {
			ext = relayExtFromURL(row.URL)
		}
		return row.URL, ext, nil

	case "icodeq":
		audio := strings.TrimSpace(song.Extra["audio_url"])
		if audio == "" {
			return "", "", errors.New("缺少中转音频地址")
		}
		return audio, relayExtFromURL(audio), nil
	}

	return "", "", fmt.Errorf("未知中转：%s", relay)
}

func relayProbeAudio(rawURL string, duration int) Check {
	c := Check{Score: 100}

	req, err := http.NewRequest(http.MethodGet, rawURL, nil)
	if err != nil {
		c.OK = false
		c.Score = 0
		c.Issues = append(c.Issues, "无法构造请求")
		return c
	}
	req.Header.Set("User-Agent", relayUA)
	req.Header.Set("Range", "bytes=0-65535")

	resp, err := relayFetchClient.Do(req)
	if err != nil {
		c.OK = false
		c.Score = 0
		c.Issues = append(c.Issues, "连接中转音频失败")
		return c
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusPartialContent {
		c.OK = false
		c.Score = 0
		c.Issues = append(c.Issues, "中转音频返回 HTTP "+strconv.Itoa(resp.StatusCode))
		return c
	}

	head, _ := io.ReadAll(io.LimitReader(resp.Body, 65536))
	c.Size = totalSize(resp)
	c.Ext = core.DetectAudioExtBySignature(head)
	return judgeAudioHead(head, c, duration)
}

func relayLyric(song Song) (string, Check) {
	relay := strings.TrimSpace(song.Extra["relay"])

	switch relay {
	case "gdstudio":
		ep := relayByName("gdstudio")
		if ep == nil {
			return "", Check{OK: false, Score: 0, Issues: []string{"中转未配置"}}
		}
		id := strings.TrimSpace(song.Extra["lyric_id"])
		if id == "" {
			id = strings.TrimSpace(song.Extra["song_id"])
		}
		if id == "" {
			return "", Check{OK: false, Score: 0, Issues: []string{"缺少歌词 id"}}
		}

		q := url.Values{}
		q.Set("types", "lyric")
		q.Set("source", ep.Upstream)
		q.Set("id", id)

		data, _, err := relayGet(context.Background(), ep.Base+"?"+q.Encode(), 10*time.Second, 2<<20)
		if err != nil {
			return "", Check{OK: false, Score: 0, Issues: []string{"中转歌词请求失败"}}
		}
		var row struct {
			Lyric string `json:"lyric"`
		}
		if json.Unmarshal(data, &row) != nil || strings.TrimSpace(row.Lyric) == "" {
			return "", Check{OK: false, Score: 0, Issues: []string{"中转没有返回歌词"}}
		}
		return checkLyric(row.Lyric)

	case "icodeq":
		raw := strings.TrimSpace(song.Extra["lyric_url"])
		if raw == "" {
			return "", Check{OK: false, Score: 0, Issues: []string{"缺少歌词地址"}}
		}
		data, _, err := relayGet(context.Background(), raw, 10*time.Second, 2<<20)
		if err != nil {
			return "", Check{OK: false, Score: 0, Issues: []string{"中转歌词请求失败"}}
		}
		return checkLyric(string(data))
	}

	return "", Check{OK: false, Score: 0, Issues: []string{"未知中转"}}
}

func relayFetchCoverURL(rawURL string) ([]byte, string, error) {
	rawURL = strings.TrimSpace(rawURL)
	if rawURL == "" {
		return nil, "", errors.New("缺少封面地址")
	}

	u, err := url.Parse(rawURL)
	if err != nil {
		return nil, "", err
	}

	if strings.Contains(u.Host, "gdstudio.xyz") && u.Query().Get("types") == "pic" {
		data, _, err := relayGet(context.Background(), rawURL, 10*time.Second, 1<<20)
		if err != nil {
			return nil, "", err
		}
		var row struct {
			URL string `json:"url"`
		}
		if json.Unmarshal(data, &row) != nil || strings.TrimSpace(row.URL) == "" {
			return nil, "", errors.New("封面接口没有返回地址")
		}
		return relayGetBytes(context.Background(), row.URL, 12*time.Second, 8<<20)
	}

	return relayGetBytes(context.Background(), rawURL, 12*time.Second, 8<<20)
}

func relayCover(song Song) ([]byte, string, Check) {
	cover := strings.TrimSpace(song.Cover)
	if cover == "" {
		return nil, "", Check{OK: false, Score: 0, Issues: []string{"该中转结果没有封面"}}
	}

	data, mime, err := relayFetchCoverURL(cover)
	if err != nil || len(data) == 0 {
		return nil, "", Check{OK: false, Score: 0, Issues: []string{"封面下载失败"}}
	}

	c := checkCover(data, mime)
	return data, mime, c
}

// ============================================================
//  解析
// ============================================================

// icodeq 返回的 auth 直链会过期；搜索结果放久后再播放时先重新搜一次，
// 拿到同一首歌的新直链，避免解析到别的翻唱。
func relayRefreshIfNeeded(song Song) Song {
	if strings.TrimSpace(song.Extra["relay"]) != "icodeq" {
		return song
	}

	ts, _ := strconv.ParseInt(strings.TrimSpace(song.Extra["ts"]), 10, 64)
	if ts > 0 && time.Now().Unix()-ts < 120 {
		return song
	}

	return relayRefreshICodeq(song)
}

func relayRefreshICodeq(song Song) Song {
	keyword := strings.TrimSpace(song.Name)
	if strings.TrimSpace(song.Artist) != "" {
		keyword = keyword + " " + strings.TrimSpace(song.Artist)
	}
	if keyword == "" {
		return song
	}

	ctx, cancel := context.WithTimeout(context.Background(), 8*time.Second)
	defer cancel()

	songs, err := relaySearchICodeq(ctx, keyword, 12)
	if err != nil || len(songs) == 0 {
		return song
	}

	originID := strings.TrimSpace(song.Extra["song_id"])
	originUpstream := strings.TrimSpace(song.Extra["upstream"])
	best := song
	bestScore := 0.0

	for _, cand := range songs {
		score := core.CalcSongSimilarity(song.Name, song.Artist, cand.Name, cand.Artist)
		if originID != "" && strings.TrimSpace(cand.Extra["song_id"]) == originID {
			score += 1.0
		}
		if strings.TrimSpace(cand.Extra["upstream"]) == originUpstream {
			score += 0.15
		}
		if score > bestScore {
			bestScore = score
			best = cand
		}
	}

	if bestScore < 0.55 {
		return song
	}
	return best
}

func tryResolveMeting(song Song) *Resolution {
	song = relayRefreshIfNeeded(song)

	res := &Resolution{
		Song:    song,
		Quality: Quality{},
		Sources: map[string]string{
			"audio": relaySource,
			"lyric": relaySource,
			"cover": relaySource,
		},
	}

	audioURL, ext, err := relayAudioURL(song)
	if err != nil || strings.TrimSpace(audioURL) == "" {
		msg := "中转音频地址获取失败"
		if err != nil {
			msg = err.Error()
		}
		res.Quality.Audio = Check{OK: false, Score: 0, Issues: []string{msg}}
		return res
	}

	audioCheck := relayProbeAudio(audioURL, song.Duration)
	if ext == "" {
		ext = audioCheck.Ext
	}
	if ext == "" {
		ext = "mp3"
	}

	var (
		wg          sync.WaitGroup
		lyricCheck  Check
		coverCheck  Check
	)
	wg.Add(2)
	go func() {
		defer wg.Done()
		_, lyricCheck = fetchLyric(song)
	}()
	go func() {
		defer wg.Done()
		_, _, coverCheck = fetchCover(song)
	}()
	wg.Wait()

	res.URL = audioURL
	res.Ext = ext
	res.Quality.Audio = audioCheck
	res.Quality.Lyric = lyricCheck
	res.Quality.Cover = coverCheck
	res.Quality.Total = scoreOf(res.Quality)
	res.Warnings = append(res.Warnings, lyricCheck.Issues...)
	res.Warnings = append(res.Warnings, coverCheck.Issues...)
	return res
}

// ============================================================
//  音频流代理
// ============================================================

func proxyRelayStream(w http.ResponseWriter, r *http.Request, rawURL string) {
	req, err := http.NewRequestWithContext(r.Context(), http.MethodGet, rawURL, nil)
	if err != nil {
		writeErr(w, http.StatusBadGateway, "无法构造中转音频请求")
		return
	}
	req.Header.Set("User-Agent", relayUA)
	if rg := strings.TrimSpace(r.Header.Get("Range")); rg != "" {
		req.Header.Set("Range", rg)
	}

	resp, err := relayStreamClient.Do(req)
	if err != nil {
		writeErr(w, http.StatusBadGateway, "中转音频连接失败")
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
		w.Header().Set("Content-Type", "audio/mpeg")
	}

	w.WriteHeader(resp.StatusCode)
	_, _ = io.Copy(w, resp.Body)
}
