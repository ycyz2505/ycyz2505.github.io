package main

import (
	"os"
	"path/filepath"
	"strings"
)

// 数据目录：<exe 同级>/data/m
// 开发时可用 M_DATA_DIR 覆盖
func dataDir() string {
	if v := strings.TrimSpace(os.Getenv("M_DATA_DIR")); v != "" {
		return filepath.Clean(v)
	}
	return filepath.Join(exeDir(), "data", "m")
}

func cookieFile() string { return filepath.Join(dataDir(), "cookies.json") }

func libraryFile() string { return filepath.Join(dataDir(), "library.json") }

func ensureDataDir() error { return os.MkdirAll(dataDir(), 0o755) }

func exeDir() string {
	exe, err := os.Executable()
	if err != nil {
		if wd, e := os.Getwd(); e == nil {
			return wd
		}
		return "."
	}
	if resolved, e := filepath.EvalSymlinks(exe); e == nil {
		exe = resolved
	}
	return filepath.Dir(exe)
}

// 把任意字符串变成安全的单层目录名
func safeSegment(name string) string {
	name = strings.TrimSpace(name)
	if name == "" {
		return "unknown"
	}
	var b strings.Builder
	for _, r := range name {
		switch {
		case r == '/' || r == '\\' || r == ':' || r == '*' || r == '?' ||
			r == '"' || r == '<' || r == '>' || r == '|':
			b.WriteRune('_')
		case r < 0x20:
			b.WriteRune('_')
		default:
			b.WriteRune(r)
		}
	}
	out := strings.Trim(b.String(), " .")
	if out == "" {
		return "unknown"
	}
	if len([]rune(out)) > 80 {
		out = string([]rune(out)[:80])
	}
	return out
}

// 确保路径落在 dataDir 内，防止目录穿越
func safeJoin(base, rel string) (string, bool) {
	rel = strings.ReplaceAll(rel, "\\", "/")
	rel = strings.TrimPrefix(rel, "/")
	clean := filepath.Clean(filepath.Join(base, filepath.FromSlash(rel)))
	baseClean := filepath.Clean(base)
	if clean == baseClean {
		return clean, true
	}
	if !strings.HasPrefix(clean, baseClean+string(os.PathSeparator)) {
		return "", false
	}
	return clean, true
}
