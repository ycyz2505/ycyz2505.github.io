package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/guohuiyuan/go-music-dl/core"
)

const (
	appService = "class-m-online"
	appVersion = "1.0.0"

	portStart = 17650
	portEnd   = 17659
)

var (
	currentPort int
	startedAt   = time.Now()
)

func main() {
	log.SetFlags(log.Ltime)
	log.SetPrefix("[m] ")

	loadCookies()

	initLogLevel()   // ← 新增

	if err := ensureDataDir(); err != nil {
		log.Printf("数据目录不可写：%v", err)
	}

	mux := http.NewServeMux()
	registerRoutes(mux)

	go gcSessions()

	ln, port, err := listenLocal()
	if err != nil {
		log.Fatalf("端口 %d-%d 全部被占用：%v", portStart, portEnd, err)
	}
	currentPort = port

	srv := &http.Server{
		Handler:           withCORS(mux),
		ReadHeaderTimeout: 10 * time.Second,
	}

	go func() {
		log.Printf("已启动 http://127.0.0.1:%d", port)
		log.Printf("数据目录 %s", dataDir())
		if err := srv.Serve(ln); err != nil && err != http.ErrServerClosed {
			log.Fatalf("服务异常退出：%v", err)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)
	<-stop

	log.Println("正在关闭…")
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	_ = srv.Shutdown(ctx)
}

func listenLocal() (net.Listener, int, error) {
	var lastErr error
	for p := portStart; p <= portEnd; p++ {
		ln, err := net.Listen("tcp", fmt.Sprintf("127.0.0.1:%d", p))
		if err == nil {
			return ln, p, nil
		}
		lastErr = err
	}
	return nil, 0, lastErr
}

func registerRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/m/ping", handlePing)
	mux.HandleFunc("GET /api/m/sources", handleSources)
	mux.HandleFunc("GET /api/m/diag", handleDiag)   // ← 新增
	mux.HandleFunc("GET /api/m/search", handleSearch)
	mux.HandleFunc("GET /api/m/resolve", handleResolve)
	mux.HandleFunc("GET /api/m/switch", handleSwitch)
	mux.HandleFunc("GET /api/m/stream", handleStream)
	mux.HandleFunc("GET /api/m/lyric", handleLyric)
	mux.HandleFunc("GET /api/m/cover", handleCover)
	mux.HandleFunc("GET /api/m/media", handleMedia)

	mux.HandleFunc("GET /api/m/library", handleLibraryGet)
	mux.HandleFunc("POST /api/m/library/playlist", handlePlaylistOp)
	mux.HandleFunc("POST /api/m/library/add", handleLibraryAdd)
	mux.HandleFunc("POST /api/m/library/remove", handleLibraryRemove)
	mux.HandleFunc("POST /api/m/library/verify", handleLibraryVerify)

	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "not found"})
	})
}

func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		h := w.Header()
		h.Set("Access-Control-Allow-Origin", "*")
		h.Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		h.Set("Access-Control-Allow-Headers", "Content-Type, Range")
		h.Set("Access-Control-Expose-Headers", "Content-Range, Accept-Ranges, Content-Length, Content-Type")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// ---------- 通用工具 ----------

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func writeErr(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]any{"ok": false, "error": msg})
}

func queryInt(r *http.Request, key string, def int) int {
	raw := strings.TrimSpace(r.URL.Query().Get(key))
	if raw == "" {
		return def
	}
	n := 0
	for _, ch := range raw {
		if ch < '0' || ch > '9' {
			return def
		}
		n = n*10 + int(ch-'0')
		if n > 1<<30 {
			return def
		}
	}
	return n
}

func nowMs() int64 { return time.Now().UnixMilli() }

// 可选 Cookie：data/m/cookies.json，形如 {"netease":"MUSIC_U=...","qq":"..."}
func loadCookies() {
	raw, err := os.ReadFile(cookieFile())
	if err != nil {
		return
	}
	var m map[string]string
	if json.Unmarshal(raw, &m) != nil {
		return
	}
	core.CM.SetAll(m)
	log.Printf("已载入 %d 条 Cookie 配置", len(m))
}
