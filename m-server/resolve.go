package main

import (
	"errors"
	"fmt"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/guohuiyuan/go-music-dl/core"
	"github.com/guohuiyuan/music-lib/model"
)

// Quality 一首歌的综合体检结果
type Quality struct {
	Audio Check `json:"audio"`
	Lyric Check `json:"lyric"`
	Cover Check `json:"cover"`
	Total int   `json:"total"`
}

// Resolution 解析结果
type Resolution struct {
	Song     Song
	URL      string
	Bytes    []byte
	Ext      string
	Quality  Quality
	Switched bool
	From     string
	Warnings []string
}

const (
	scoreGood     = 70
	scoreAccept   = 45
	// 单个音源搜索超时：给足 30s
	sourceTimeout = 30 * time.Second
	// 整体搜索截止：比单源略长，留 2s 收集余量
	// 必须 >= sourceTimeout，否则单源 30s 白等
	searchTimeout  = 32 * time.Second
	maxAltSources  = 4
	maxAltPerSrc   = 3
	maxSwitchTries = 4
)

func downloadURL(song Song) (string, error) {
	fn := core.GetDownloadFunc(song.Source)
	if fn == nil {
		return "", fmt.Errorf("不支持该音源：%s", song.Source)
	}
	m := song.toModel()
	url, err := fn(m)
	if err != nil {
		return "", err
	}
	if strings.TrimSpace(url) == "" {
		return "", errors.New("音源没有返回可用的音频地址")
	}
	return url, nil
}

func fetchAudioBytes(song Song) ([]byte, error) {
	m := song.toModel()
	switch song.Source {
	case "soda":
		return core.FetchDecryptedSodaAudio(m)
	case "migu":
		return core.FetchDecryptedMiguAudio(m)
	}
	url, err := downloadURL(song)
	if err != nil {
		return nil, err
	}
	data, _, err := core.FetchBytesWithMime(url, song.Source)
	return data, err
}

func fetchLyric(song Song) (string, Check) {
	key := "l:" + song.key()
	if e, ok := memoGet(lyricMemo, key); ok {
		return e.Text, Check{OK: true, Score: 100}
	}

	fn := core.GetLyricFunc(song.Source)
	if fn == nil {
		return "", Check{OK: false, Score: 0, Issues: []string{"该音源不提供歌词"}}
	}
	raw, err := fn(song.toModel())
	if err != nil || strings.TrimSpace(raw) == "" {
		return "", Check{OK: false, Score: 0, Issues: []string{"没有取到歌词"}}
	}

	text, c := checkLyric(raw)
	if text != "" {
		memoPut(lyricMemo, key, cacheEntry{Text: text})
	}
	return text, c
}

func fetchCover(song Song) ([]byte, string, Check) {
	if strings.TrimSpace(song.Cover) == "" {
		return nil, "", Check{OK: false, Score: 0, Issues: []string{"该音源没有封面"}}
	}
	key := "c:" + song.Cover
	if e, ok := memoGet(coverMemo, key); ok {
		return e.Data, e.Mime, Check{OK: true, Score: 100}
	}

	data, mime, err := core.FetchBytesWithMime(song.Cover, song.Source)
	if err != nil || len(data) == 0 {
		return nil, "", Check{OK: false, Score: 0, Issues: []string{"封面下载失败"}}
	}

	c := checkCover(data, mime)
	if c.OK {
		memoPut(coverMemo, key, cacheEntry{Data: data, Mime: mime})
	}
	return data, mime, c
}

// resolveSong 完整解析一首歌：取流 → 校验 → 必要时换源
func resolveSong(song Song, allowSwitch bool) *Resolution {
	res := tryResolve(song)
	if res == nil {
		return &Resolution{
			Song:     song,
			Quality:  Quality{Total: 0},
			Warnings: []string{"所有音源都无法解析这首歌"},
		}
	}

	needSwitch := !res.Quality.Audio.OK ||
		res.Quality.Total < scoreAccept ||
		(res.Quality.Audio.Score < 60 && !res.Quality.Lyric.OK)

	if needSwitch && allowSwitch {
		if alt := switchTo(song, res); alt != nil {
			alt.Switched = true
			alt.From = song.Source
			alt.Warnings = append(alt.Warnings,
				fmt.Sprintf("已从 %s 切换到 %s", sourceLabel(song.Source), sourceLabel(alt.Song.Source)))
			return alt
		}
		res.Warnings = append(res.Warnings, "没有找到更合适的音源，使用当前结果")
	}

	return res
}

func tryResolve(song Song) *Resolution {
	if strings.TrimSpace(song.ID) == "" || song.Source == "" {
		return nil
	}

	res := &Resolution{Song: song, Quality: Quality{}}

	fullFetch := fullFetchSources[song.Source]

	var (
		wg         sync.WaitGroup
		lyricCheck Check
		coverCheck Check
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

	if fullFetch {
		data, err := fetchAudioBytes(song)
		wg.Wait()
		if err != nil || len(data) == 0 {
			res.Quality = Quality{
				Audio: Check{OK: false, Score: 0, Issues: []string{"音频下载失败"}},
				Lyric: lyricCheck, Cover: coverCheck, Total: 0,
			}
			return res
		}
		if len(data) > sessionBytesCap {
			res.Quality = Quality{
				Audio: Check{OK: false, Score: 0, Issues: []string{"音频文件过大"}},
				Lyric: lyricCheck, Cover: coverCheck, Total: 0,
			}
			return res
		}
		res.Bytes = data
		res.Quality.Audio = checkAudioBytes(data, song.Duration)
		res.Ext = res.Quality.Audio.Ext
	} else {
		url, err := downloadURL(song)
		if err != nil {
			wg.Wait()
			res.Quality = Quality{
				Audio: Check{OK: false, Score: 0, Issues: []string{err.Error()}},
				Lyric: lyricCheck, Cover: coverCheck, Total: 0,
			}
			return res
		}
		res.URL = url
		res.Quality.Audio = probeAudioURL(url, song.Source, song.Duration)
		res.Ext = res.Quality.Audio.Ext
		wg.Wait()
	}

	if res.Ext == "" {
		res.Ext = song.Ext
	}
	if res.Ext == "" {
		res.Ext = "mp3"
	}

	res.Quality.Lyric = lyricCheck
	res.Quality.Cover = coverCheck
	res.Quality.Total = scoreOf(res.Quality)
	res.Warnings = append(res.Warnings, lyricCheck.Issues...)
	res.Warnings = append(res.Warnings, coverCheck.Issues...)

	return res
}

func scoreOf(q Quality) int {
	if !q.Audio.OK {
		return 0
	}
	total := q.Audio.Score
	if !q.Lyric.OK {
		total -= 25
	}
	if !q.Cover.OK {
		total -= 10
	}
	if total < 0 {
		total = 0
	}
	if total > 100 {
		total = 100
	}
	return total
}

// switchTo 换源：按歌名 + 歌手在其它音源里找最匹配且能播的
func switchTo(origin Song, current *Resolution) *Resolution {
	candidates := searchAlternatives(origin)
	if len(candidates) == 0 {
		return nil
	}

	best := current
	bestScore := -1
	if current != nil {
		bestScore = current.Quality.Total
	}

	for i, cand := range candidates {
		if i >= maxSwitchTries {
			break
		}
		alt := tryResolve(cand)
		if alt == nil {
			continue
		}
		if alt.Quality.Total > bestScore && alt.Quality.Audio.OK {
			best, bestScore = alt, alt.Quality.Total
		}
		if alt.Quality.Audio.OK && alt.Quality.Total >= scoreGood {
			return alt
		}
	}

	if best != current && bestScore >= scoreAccept {
		return best
	}
	return nil
}

type scoredSong struct {
	song  Song
	score float64
	diff  int
}

func searchAlternatives(origin Song) []Song {
	keyword := strings.TrimSpace(origin.Name)
	if origin.Artist != "" {
		keyword = keyword + " " + origin.Artist
	}
	if keyword == "" {
		return nil
	}

	excluded := map[string]bool{origin.Source: true}
	srcs := make([]string, 0, maxAltSources)
	for _, s := range defaultSources {
		if excluded[s] {
			continue
		}
		srcs = append(srcs, s)
		if len(srcs) >= maxAltSources {
			break
		}
	}
	if len(srcs) == 0 {
		return nil
	}

	var (
		mu      sync.Mutex
		wg      sync.WaitGroup
		scored  []scoredSong
	)

	for _, src := range srcs {
		wg.Add(1)
		go func(s string) {
			defer wg.Done()
			fn := core.GetSearchFunc(s)
			if fn == nil {
				return
			}
			songs, err := runSearch(fn, keyword)
			if err != nil || len(songs) == 0 {
				return
			}
			local := make([]scoredSong, 0, len(songs))
			for _, m := range songs {
				c := songFromModel(m)
				c.Source = s
				score := core.CalcSongSimilarity(origin.Name, origin.Artist, c.Name, c.Artist)
				if score < 0.55 {
					continue
				}
				diff := 0
				if origin.Duration > 0 && c.Duration > 0 {
					diff = origin.Duration - c.Duration
					if diff < 0 {
						diff = -diff
					}
					if !core.IsDurationClose(origin.Duration, c.Duration) {
						score -= 0.15
					}
				}
				local = append(local, scoredSong{song: c, score: score, diff: diff})
			}
			sort.SliceStable(local, func(i, j int) bool {
				if local[i].score == local[j].score {
					return local[i].diff < local[j].diff
				}
				return local[i].score > local[j].score
			})
			if len(local) > maxAltPerSrc {
				local = local[:maxAltPerSrc]
			}
			mu.Lock()
			scored = append(scored, local...)
			mu.Unlock()
		}(src)
	}
	wg.Wait()

	sort.SliceStable(scored, func(i, j int) bool {
		if scored[i].score == scored[j].score {
			return scored[i].diff < scored[j].diff
		}
		return scored[i].score > scored[j].score
	})

	out := make([]Song, 0, len(scored))
	seen := map[string]bool{}
	for _, s := range scored {
		k := s.song.key()
		if seen[k] {
			continue
		}
		seen[k] = true
		out = append(out, s.song)
	}
	return out
}

func runSearch(fn func(string) ([]model.Song, error), keyword string) ([]model.Song, error) {
	type outcome struct {
		songs []model.Song
		err   error
	}
	ch := make(chan outcome, 1)
	go func() {
		defer func() {
			if r := recover(); r != nil {
				ch <- outcome{err: fmt.Errorf("搜索异常：%v", r)}
			}
		}()
		songs, err := fn(keyword)
		ch <- outcome{songs: songs, err: err}
	}()

	select {
	case o := <-ch:
		return o.songs, o.err
	case <-time.After(sourceTimeout):
		return nil, fmt.Errorf("搜索超时（>%s）", sourceTimeout)
	}
}
