//go:build windows

package main

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"syscall"
	"time"
)

// 自动更新：每次启动时在后台检查 GitHub Releases 的 manifest.json。
// manifest 里 m-server 和 LocalDataServer 各自有独立的版本号与文件，
// 本程序只比较 / 下载自己的那一份，不会因为另一个 exe 有新版本就重复下载。
const updateManifestURL = "https://github.com/ycyz2505/ycyz2505.github.io/releases/download/build-latest/manifest.json"

// 国内访问 GitHub 常常不稳，按顺序尝试加速源，最后才直连。
var updateAccelerators = []string{
	"https://ghfast.top/",
	"https://gh-proxy.com/",
	"https://ghproxy.net/",
	"",
}

type updateEntry struct {
	Version string `json:"version"`
	URL     string `json:"url"`
	SHA256  string `json:"sha256"`
}

type updateManifest struct {
	MServer         updateEntry `json:"m-server"`
	LocalDataServer updateEntry `json:"local-data-server"`
}

func startUpdateCheck() {
	if os.Getenv("CLASS_NO_SELF_UPDATE") != "" {
		return
	}

	go func() {
		manifest, err := fetchUpdateManifest()
		if err != nil {
			log.Printf("自动更新：获取清单失败：%v", err)
			return
		}

		entry := manifest.MServer
		if entry.Version == "" || !versionGreater(entry.Version, appVersion) {
			return
		}

		log.Printf("自动更新：发现 m-server %s（当前 %s），开始下载", entry.Version, appVersion)

		data, err := fetchUpdateAsset(entry.URL)
		if err != nil {
			log.Printf("自动更新：下载失败：%v", err)
			return
		}

		if entry.SHA256 != "" {
			sum := sha256.Sum256(data)
			if !strings.EqualFold(hex.EncodeToString(sum[:]), entry.SHA256) {
				log.Printf("自动更新：SHA-256 校验失败，放弃本次更新")
				return
			}
		}

		if err := applySelfUpdate(data); err != nil {
			log.Printf("自动更新：安装失败：%v", err)
			return
		}

		log.Printf("自动更新：新版本已就绪，正在重启")
		time.Sleep(150 * time.Millisecond)
		os.Exit(0)
	}()
}

func fetchUpdateManifest() (*updateManifest, error) {
	type result struct {
		data []byte
		err  error
	}

	ch := make(chan result, len(updateAccelerators))

	for _, prefix := range updateAccelerators {
		go func(prefix string) {
			data, err := fetchHTTP(prefix+updateManifestURL, 6*time.Second)
			ch <- result{data: data, err: err}
		}(prefix)
	}

	var lastErr error
	for i := 0; i < len(updateAccelerators); i++ {
		r := <-ch
		if r.err != nil {
			lastErr = r.err
			continue
		}

		var manifest updateManifest
		if err := json.Unmarshal(r.data, &manifest); err != nil {
			lastErr = err
			continue
		}
		if manifest.MServer.Version == "" {
			lastErr = fmt.Errorf("清单缺少 m-server")
			continue
		}
		return &manifest, nil
	}

	if lastErr == nil {
		lastErr = fmt.Errorf("没有可用的更新源")
	}
	return nil, lastErr
}

func fetchUpdateAsset(url string) ([]byte, error) {
	if url == "" {
		return nil, fmt.Errorf("清单缺少下载地址")
	}

	var lastErr error
	for _, prefix := range updateAccelerators {
		data, err := fetchHTTP(prefix+url, 90*time.Second)
		if err == nil {
			return data, nil
		}
		lastErr = err
	}
	return nil, lastErr
}

func fetchHTTP(url string, timeout time.Duration) ([]byte, error) {
	client := &http.Client{Timeout: timeout}

	resp, err := client.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("HTTP %d", resp.StatusCode)
	}

	data, err := io.ReadAll(io.LimitReader(resp.Body, 64<<20))
	if err != nil {
		return nil, err
	}
	if len(data) == 0 {
		return nil, fmt.Errorf("空响应")
	}
	return data, nil
}

func versionGreater(a, b string) bool {
	pa := versionParts(a)
	pb := versionParts(b)

	for i := 0; i < len(pa) || i < len(pb); i++ {
		var x, y int
		if i < len(pa) {
			x = pa[i]
		}
		if i < len(pb) {
			y = pb[i]
		}
		if x != y {
			return x > y
		}
	}
	return false
}

func versionParts(v string) []int {
	v = strings.TrimSpace(v)
	v = strings.TrimPrefix(v, "v")

	fields := strings.FieldsFunc(v, func(r rune) bool {
		return r == '.' || r == '-' || r == '+'
	})

	out := make([]int, 0, len(fields))
	for _, field := range fields {
		n := 0
		for _, ch := range field {
			if ch < '0' || ch > '9' {
				break
			}
			n = n*10 + int(ch-'0')
		}
		out = append(out, n)
	}
	return out
}

// 下载完成后写一个批处理：等本进程退出 → 替换 exe → 重新启动。
func applySelfUpdate(data []byte) error {
	dir := exeDir()

	newPath := filepath.Join(dir, "m-server-new.exe")
	if err := os.WriteFile(newPath, data, 0o755); err != nil {
		return err
	}

	batPath := filepath.Join(dir, fmt.Sprintf("m-server-update-%d.bat", os.Getpid()))

	bat := "@echo off\r\n" +
		"setlocal\r\n" +
		"set n=0\r\n" +
		":retry\r\n" +
		"set /a n+=1\r\n" +
		"if %n% gtr 60 exit /b 1\r\n" +
		"ping -n 2 127.0.0.1 >nul\r\n" +
		"move /y \"%~dp0m-server-new.exe\" \"%~dp0m-server.exe\" >nul 2>nul\r\n" +
		"if errorlevel 1 goto retry\r\n" +
		"start \"\" \"%~dp0m-server.exe\"\r\n" +
		"del \"%~f0\"\r\n"

	if err := os.WriteFile(batPath, []byte(bat), 0o755); err != nil {
		return err
	}

	cmd := exec.Command("cmd.exe", "/C", batPath)
	cmd.Dir = dir
	cmd.SysProcAttr = &syscall.SysProcAttr{
		HideWindow:    true,
		CreationFlags: 0x08000000, // CREATE_NO_WINDOW
	}

	return cmd.Start()
}
