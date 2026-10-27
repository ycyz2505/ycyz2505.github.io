package main

import (
	"crypto/rand"
	"encoding/hex"
	"sync"
	"time"
)

const (
	sessionTTL     = 2 * time.Hour
	sessionMax     = 24
	sessionBytesCap = 48 << 20 // 单首整段缓存的字节上限
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

	if len(sessions) > sessionMax {
		evictLocked()
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

func evictLocked() {
	var oldestID string
	var oldest time.Time
	for id, s := range sessions {
		if oldestID == "" || s.LastUsed.Before(oldest) {
			oldestID, oldest = id, s.LastUsed
		}
	}
	if oldestID != "" {
		delete(sessions, oldestID)
	}
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
