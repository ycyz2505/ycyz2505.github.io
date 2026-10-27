package main

import (
	"encoding/json"
	"errors"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"
)

type LibSong struct {
	Key      string   `json:"key"`
	Source   string   `json:"source"`
	ID       string   `json:"id"`
	Name     string   `json:"name"`
	Artist   string   `json:"artist"`
	Album    string   `json:"album"`
	Duration int      `json:"duration"`
	Ext      string   `json:"ext"`
	Audio    string   `json:"audio"`
	Cover    string   `json:"cover"`
	Lyric    string   `json:"lyric"`
	AddedAt  int64    `json:"addedAt"`
	Quality  int      `json:"quality"`
	Warnings []string `json:"warnings,omitempty"`
}

type Playlist struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	CreatedAt int64     `json:"createdAt"`
	Songs     []LibSong `json:"songs"`
}

type Library struct {
	Version   int        `json:"version"`
	Playlists []Playlist `json:"playlists"`
}

var (
	libMu    sync.Mutex
	libCache *Library
)

func loadLibrary() (*Library, error) {
	if libCache != nil {
		return libCache, nil
	}

	lib := &Library{Version: 1, Playlists: []Playlist{}}

	raw, err := os.ReadFile(libraryFile())
	if err == nil {
		if e := json.Unmarshal(raw, lib); e != nil {
			_ = os.WriteFile(libraryFile()+".corrupt", raw, 0o644)
			lib = &Library{Version: 1, Playlists: []Playlist{}}
		}
	} else if !errors.Is(err, os.ErrNotExist) {
		return nil, err
	}

	if lib.Version == 0 {
		lib.Version = 1
	}
	if lib.Playlists == nil {
		lib.Playlists = []Playlist{}
	}
	for i := range lib.Playlists {
		if lib.Playlists[i].Songs == nil {
			lib.Playlists[i].Songs = []LibSong{}
		}
	}

	if len(lib.Playlists) == 0 {
		lib.Playlists = append(lib.Playlists, Playlist{
			ID:        "pl_" + newSessionID()[:8],
			Name:      "默认",
			CreatedAt: nowMs(),
			Songs:     []LibSong{},
		})
		_ = saveLibraryLocked(lib)
	}

	libCache = lib
	return lib, nil
}

func saveLibraryLocked(lib *Library) error {
	if err := ensureDataDir(); err != nil {
		return err
	}
	raw, err := json.MarshalIndent(lib, "", "  ")
	if err != nil {
		return err
	}
	target := libraryFile()
	tmp := target + ".part"
	if err := os.WriteFile(tmp, raw, 0o644); err != nil {
		return err
	}
	return os.Rename(tmp, target)
}

func findPlaylist(lib *Library, id string) *Playlist {
	for i := range lib.Playlists {
		if lib.Playlists[i].ID == id {
			return &lib.Playlists[i]
		}
	}
	return nil
}

// ---------- HTTP ----------

func handleLibraryGet(w http.ResponseWriter, r *http.Request) {
	libMu.Lock()
	lib, err := loadLibrary()
	libMu.Unlock()
	if err != nil {
		writeErr(w, http.StatusInternalServerError, "读取歌单失败")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"ok": true, "library": lib})
}

type playlistReq struct {
	Action string   `json:"action"`
	ID     string   `json:"id"`
	Name   string   `json:"name"`
	Order  []string `json:"order"`
}

func handlePlaylistOp(w http.ResponseWriter, r *http.Request) {
	var req playlistReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, http.StatusBadRequest, "请求格式错误")
		return
	}

	libMu.Lock()
	defer libMu.Unlock()

	lib, err := loadLibrary()
	if err != nil {
		writeErr(w, http.StatusInternalServerError, "读取歌单失败")
		return
	}

	switch strings.TrimSpace(req.Action) {
	case "create":
		name := strings.TrimSpace(req.Name)
		if name == "" {
			writeErr(w, http.StatusBadRequest, "歌单名不能为空")
			return
		}
		lib.Playlists = append(lib.Playlists, Playlist{
			ID:        "pl_" + newSessionID()[:8],
			Name:      name,
			CreatedAt: nowMs(),
			Songs:     []LibSong{},
		})

	case "rename":
		pl := findPlaylist(lib, req.ID)
		if pl == nil {
			writeErr(w, http.StatusNotFound, "歌单不存在")
			return
		}
		name := strings.TrimSpace(req.Name)
		if name == "" {
			writeErr(w, http.StatusBadRequest, "歌单名不能为空")
			return
		}
		oldSeg := safeSegment(pl.Name)
		pl.Name = name
		newSeg := safeSegment(name)
		oldDir := filepath.Join(dataDir(), oldSeg)
		newDir := filepath.Join(dataDir(), newSeg)
		if oldDir != newDir {
			if _, err := os.Stat(oldDir); err == nil {
				_ = os.Rename(oldDir, newDir)
			}
			for i := range pl.Songs {
				pl.Songs[i].Audio = rewritePrefix(pl.Songs[i].Audio, oldSeg, newSeg)
				pl.Songs[i].Cover = rewritePrefix(pl.Songs[i].Cover, oldSeg, newSeg)
				pl.Songs[i].Lyric = rewritePrefix(pl.Songs[i].Lyric, oldSeg, newSeg)
			}
		}

	case "delete":
		idx := -1
		for i := range lib.Playlists {
			if lib.Playlists[i].ID == req.ID {
				idx = i
				break
			}
		}
		if idx < 0 {
			writeErr(w, http.StatusNotFound, "歌单不存在")
			return
		}
		dir := filepath.Join(dataDir(), safeSegment(lib.Playlists[idx].Name))
		if isInside(dataDir(), dir) {
			_ = os.RemoveAll(dir)
		}
		lib.Playlists = append(lib.Playlists[:idx], lib.Playlists[idx+1:]...)
		if len(lib.Playlists) == 0 {
			lib.Playlists = append(lib.Playlists, Playlist{
				ID: "pl_" + newSessionID()[:8], Name: "默认",
				CreatedAt: nowMs(), Songs: []LibSong{},
			})
		}

	case "reorder":
		if len(req.Order) == 0 {
			writeErr(w, http.StatusBadRequest, "缺少顺序")
			return
		}
		sorted := make([]Playlist, 0, len(lib.Playlists))
		for _, id := range req.Order {
			if pl := findPlaylist(lib, id); pl != nil {
				sorted = append(sorted, *pl)
			}
		}
		for _, pl := range lib.Playlists {
			found := false
			for _, s := range sorted {
				if s.ID == pl.ID {
					found = true
					break
				}
			}
			if !found {
				sorted = append(sorted, pl)
			}
		}
		lib.Playlists = sorted

	default:
		writeErr(w, http.StatusBadRequest, "未知操作")
		return
	}

	if err := saveLibraryLocked(lib); err != nil {
		writeErr(w, http.StatusInternalServerError, "保存歌单失败")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"ok": true, "library": lib})
}

func rewritePrefix(path, oldPrefix, newPrefix string) string {
	if path == "" {
		return path
	}
	p := strings.ReplaceAll(path, "\\", "/")
	if strings.HasPrefix(p, oldPrefix+"/") {
		return newPrefix + "/" + strings.TrimPrefix(p, oldPrefix+"/")
	}
	return path
}

func isInside(base, target string) bool {
	b, err1 := filepath.Abs(base)
	t, err2 := filepath.Abs(target)
	if err1 != nil || err2 != nil {
		return false
	}
	if b == t {
		return false
	}
	return strings.HasPrefix(t, b+string(os.PathSeparator))
}

// ---------- 加入歌单 ----------

type addReq struct {
	PlaylistID string `json:"playlistId"`
	Song       Song   `json:"song"`
}

type grabbed struct {
	Song     Song
	Audio    []byte
	Ext      string
	Cover    []byte
	CoverExt string
	Lyric    string
	Quality  Quality
}

func grabSong(song Song) *grabbed {
	data, err := fetchAudioBytes(song)
	if err != nil || len(data) == 0 {
		return nil
	}

	g := &grabbed{Song: song, Audio: data}
	g.Quality.Audio = checkAudioBytes(data, song.Duration)
	g.Ext = g.Quality.Audio.Ext
	if g.Ext == "" {
		g.Ext = "mp3"
	}

	if text, lc := fetchLyric(song); text != "" {
		g.Lyric = text
		g.Quality.Lyric = lc
	} else {
		g.Quality.Lyric = lc
	}

	if cover, _, cc := fetchCover(song); len(cover) > 0 {
		g.Cover = cover
		g.CoverExt = imageKind(cover)
		if g.CoverExt == "" {
			g.CoverExt = "jpg"
		}
		g.Quality.Cover = cc
	} else {
		g.Quality.Cover = cc
	}

	g.Quality.Total = scoreOf(g.Quality)
	return g
}

func downloadSong(song Song) (*grabbed, error) {
	first := grabSong(song)
	if first != nil && first.Quality.Audio.OK && first.Quality.Total >= scoreGood {
		return first, nil
	}

	best := first
	bestScore := -1
	if first != nil && first.Quality.Audio.OK {
		bestScore = first.Quality.Total
	}

	for i, alt := range searchAlternatives(song) {
		if i >= maxSwitchTries {
			break
		}
		g := grabSong(alt)
		if g == nil || !g.Quality.Audio.OK {
			continue
		}
		if g.Quality.Total > bestScore {
			best, bestScore = g, g.Quality.Total
		}
		if g.Quality.Total >= scoreGood {
			break
		}
	}

	if best == nil || !best.Quality.Audio.OK {
		return nil, errors.New("没有找到可用的音源")
	}
	return best, nil
}

func handleLibraryAdd(w http.ResponseWriter, r *http.Request) {
	var req addReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, http.StatusBadRequest, "请求格式错误")
		return
	}
	if strings.TrimSpace(req.Song.ID) == "" || strings.TrimSpace(req.Song.Source) == "" {
		writeErr(w, http.StatusBadRequest, "歌曲信息不完整")
		return
	}

	libMu.Lock()
	lib, err := loadLibrary()
	if err != nil {
		libMu.Unlock()
		writeErr(w, http.StatusInternalServerError, "读取歌单失败")
		return
	}
	pl := findPlaylist(lib, req.PlaylistID)
	if pl == nil {
		libMu.Unlock()
		writeErr(w, http.StatusNotFound, "歌单不存在")
		return
	}
	for _, s := range pl.Songs {
		if s.Key == req.Song.key() {
			libMu.Unlock()
			writeJSON(w, http.StatusOK, map[string]any{"ok": true, "duplicated": true, "song": s})
			return
		}
	}
	plName := pl.Name
	libMu.Unlock()

	g, err := downloadSong(req.Song)
	if err != nil {
		writeJSON(w, http.StatusOK, map[string]any{"ok": false, "error": err.Error()})
		return
	}

	relDir, err := writeSongFiles(plName, g)
	if err != nil {
		writeJSON(w, http.StatusOK, map[string]any{"ok": false, "error": "写文件失败：" + err.Error()})
		return
	}

	entry := LibSong{
		Key:      g.Song.key(),
		Source:   g.Song.Source,
		ID:       g.Song.ID,
		Name:     g.Song.Name,
		Artist:   g.Song.Artist,
		Album:    g.Song.Album,
		Duration: g.Song.Duration,
		Ext:      g.Ext,
		Audio:    relDir + "/audio." + g.Ext,
		AddedAt:  nowMs(),
		Quality:  g.Quality.Total,
	}
	if len(g.Cover) > 0 {
		entry.Cover = relDir + "/cover." + g.CoverExt
	}
	if g.Lyric != "" {
		entry.Lyric = relDir + "/lyric.lrc"
	}
	if !g.Quality.Lyric.OK {
		entry.Warnings = append(entry.Warnings, "歌词缺失")
	}
	if !g.Quality.Cover.OK {
		entry.Warnings = append(entry.Warnings, "封面缺失")
	}

	libMu.Lock()
	defer libMu.Unlock()
	if pl = findPlaylist(lib, req.PlaylistID); pl != nil {
		pl.Songs = append(pl.Songs, entry)
	}
	if err := saveLibraryLocked(lib); err != nil {
		writeErr(w, http.StatusInternalServerError, "保存歌单失败")
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"ok": true, "song": entry})
}

func writeSongFiles(playlistName string, g *grabbed) (string, error) {
	if err := ensureDataDir(); err != nil {
		return "", err
	}

	plDir := filepath.Join(dataDir(), safeSegment(playlistName))
	folder := safeSegment(strings.TrimSpace(g.Song.Name + " - " + g.Song.Artist))
	dir := filepath.Join(plDir, folder)
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return "", err
	}

	if err := writeFileAtomic(filepath.Join(dir, "audio."+g.Ext), g.Audio); err != nil {
		return "", err
	}
	if len(g.Cover) > 0 {
		_ = writeFileAtomic(filepath.Join(dir, "cover."+g.CoverExt), g.Cover)
	}
	if g.Lyric != "" {
		_ = writeFileAtomic(filepath.Join(dir, "lyric.lrc"), []byte(g.Lyric))
	}

	rel, err := filepath.Rel(dataDir(), dir)
	if err != nil {
		return "", err
	}
	return filepath.ToSlash(rel), nil
}

func writeFileAtomic(path string, data []byte) error {
	tmp := path + ".part"
	if err := os.WriteFile(tmp, data, 0o644); err != nil {
		return err
	}
	return os.Rename(tmp, path)
}

// ---------- 移除 / 校验 ----------

type removeReq struct {
	PlaylistID string `json:"playlistId"`
	Key        string `json:"key"`
}

func handleLibraryRemove(w http.ResponseWriter, r *http.Request) {
	var req removeReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, http.StatusBadRequest, "请求格式错误")
		return
	}

	libMu.Lock()
	defer libMu.Unlock()

	lib, err := loadLibrary()
	if err != nil {
		writeErr(w, http.StatusInternalServerError, "读取歌单失败")
		return
	}
	pl := findPlaylist(lib, req.PlaylistID)
	if pl == nil {
		writeErr(w, http.StatusNotFound, "歌单不存在")
		return
	}

	idx := -1
	for i := range pl.Songs {
		if pl.Songs[i].Key == req.Key {
			idx = i
			break
		}
	}
	if idx < 0 {
		writeErr(w, http.StatusNotFound, "歌曲不存在")
		return
	}

	if pl.Songs[idx].Audio != "" {
		full, ok := safeJoin(dataDir(), filepath.Dir(filepath.FromSlash(pl.Songs[idx].Audio)))
		if ok && isInside(dataDir(), full) {
			_ = os.RemoveAll(full)
		}
	}

	pl.Songs = append(pl.Songs[:idx], pl.Songs[idx+1:]...)
	if err := saveLibraryLocked(lib); err != nil {
		writeErr(w, http.StatusInternalServerError, "保存歌单失败")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"ok": true, "library": lib})
}

func handleLibraryVerify(w http.ResponseWriter, r *http.Request) {
	libMu.Lock()
	lib, err := loadLibrary()
	libMu.Unlock()
	if err != nil {
		writeErr(w, http.StatusInternalServerError, "读取歌单失败")
		return
	}

	type issue struct {
		Playlist string `json:"playlist"`
		Key      string `json:"key"`
		Name     string `json:"name"`
		Problem  string `json:"problem"`
	}

	issues := make([]issue, 0)
	for _, pl := range lib.Playlists {
		for _, s := range pl.Songs {
			full, ok := safeJoin(dataDir(), s.Audio)
			if !ok {
				issues = append(issues, issue{pl.Name, s.Key, s.Name, "路径异常"})
				continue
			}
			data, err := os.ReadFile(full)
			if err != nil {
				issues = append(issues, issue{pl.Name, s.Key, s.Name, "音频文件丢失"})
				continue
			}
			c := checkAudioBytes(data, s.Duration)
			if !c.OK {
				problems := strings.Join(c.Issues, "；")
				if problems == "" {
					problems = "音频异常"
				}
				issues = append(issues, issue{pl.Name, s.Key, s.Name, problems})
			}
		}
	}

	writeJSON(w, http.StatusOK, map[string]any{"ok": true, "issues": issues})
}
