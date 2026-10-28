package main

import (
	"crypto/rand"
	"encoding/hex"
	"sync"
	"time"
)

const (
	sessionTTL      = 2 * time.Hour
	sessionMax      = 24
	sessionBytesCap = 48 << 20  // 单首整段缓存的字节上限
	sessionTotalCap = 192 << 20 // 全部会话合计的字节上限
)

type session struct {
	ID       string
	Song     Song
	URL      string
	Bytes    []byte
	Ext      string
	Created  time.Time
	LastUsed time.Time
}

var (
	sessMu   sync.Mutex
	sessions = map[string]*session{}
)

func newSessionID() string {
	b := make([]byte, 12)
	if _, err := rand.Read(b); err != nil {
		return hex.EncodeToString([]byte(time.Now().Format(time.RFC3339Nano)))
	}
	return hex.EncodeToString(b)
}

func putSession(s *session) {
	sessMu.Lock()
	defer sessMu.Unlock()

	s.ID = newSessionID()
	s.Created = time.Now()
	s.LastUsed = s.Created
	sessions[s.ID] = s

	// 先按数量收敛
	for len(sessions) > sessionMax {
		if !evictLocked(s.ID) {
			break
		}
	}
	// 再按总字节收敛：整段缓存的音源（咪咕 / 汽水）单首可达 48MB，
	// 只数条数的话 24 个会话能吃掉上 GB 内存
	for totalBytesLocked() > sessionTotalCap && len(sessions) > 1 {
		if !evictLocked(s.ID) {
			break
		}
	}
}

func getSession(id string) *session {
	sessMu.Lock()
	defer sessMu.Unlock()

	s, ok := sessions[id]
	if !ok {
		return nil
	}
	if time.Since(s.LastUsed) > sessionTTL {
		delete(sessions, id)
		return nil
	}
	s.LastUsed = time.Now()
	return s
}

func dropSession(id string) {
	sessMu.Lock()
	defer sessMu.Unlock()
	delete(sessions, id)
}

// totalBytesLocked 当前所有会话占用的字节数（只统计整段缓存的音频）
func totalBytesLocked() int64 {
	var n int64
	for _, s := range sessions {
		n += int64(len(s.Bytes))
	}
	return n
}

// evictLocked 淘汰最久未使用的会话，keep 指定的那个不动
func evictLocked(keep string) bool {
	var (
		oldestID string
		oldest   time.Time
	)
	for id, s := range sessions {
		if id == keep {
			continue
		}
		if oldestID == "" || s.LastUsed.Before(oldest) {
			oldestID, oldest = id, s.LastUsed
		}
	}
	if oldestID == "" {
		return false
	}
	delete(sessions, oldestID)
	return true
}

func gcSessions() {
	ticker := time.NewTicker(10 * time.Minute)
	defer ticker.Stop()
	for range ticker.C {
		sessMu.Lock()
		for id, s := range sessions {
			if time.Since(s.LastUsed) > sessionTTL {
				delete(sessions, id)
			}
		}
		sessMu.Unlock()
	}
}

// ---------- 歌词 / 封面 内存缓存（不落盘） ----------

type cacheEntry struct {
	Text string
	Data []byte
	Mime string
	At   time.Time
}

const (
	cacheTTL = 90 * time.Minute
	cacheMax = 64
)

var (
	cacheMu   sync.Mutex
	lyricMemo = map[string]cacheEntry{}
	coverMemo = map[string]cacheEntry{}
)

func memoGet(m map[string]cacheEntry, key string) (cacheEntry, bool) {
	cacheMu.Lock()
	defer cacheMu.Unlock()
	e, ok := m[key]
	if !ok || time.Since(e.At) > cacheTTL {
		if ok {
			delete(m, key)
		}
		return cacheEntry{}, false
	}
	return e, true
}

func memoPut(m map[string]cacheEntry, key string, e cacheEntry) {
	cacheMu.Lock()
	defer cacheMu.Unlock()
	e.At = time.Now()
	m[key] = e
	if len(m) > cacheMax {
		var oldestKey string
		var oldest time.Time
		for k, v := range m {
			if oldestKey == "" || v.At.Before(oldest) {
				oldestKey, oldest = k, v.At
			}
		}
		if oldestKey != "" {
			delete(m, oldestKey)
		}
	}
}
