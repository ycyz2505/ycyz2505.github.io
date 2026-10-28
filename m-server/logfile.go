package main

import (
	"io"
	"log"
	"os"
	"path/filepath"
	"runtime"
)

const (
	logFileName = "m-server.log"
	logMaxBytes = 4 << 20 // 单份日志上限 4MB
)

// teeWriter 同时写日志文件和控制台。
// 编译时用了 -H windowsgui，控制台句柄可能是无效的，
// 所以这里吞掉两边的写入错误，绝不让日志调用本身出错。
type teeWriter struct {
	file *os.File
	con  io.Writer
}

func (w *teeWriter) Write(p []byte) (int, error) {
	if w.file != nil {
		_, _ = w.file.Write(p)
	}
	if w.con != nil {
		_, _ = w.con.Write(p)
	}
	return len(p), nil
}

func logFilePath() string {
	return filepath.Join(exeDir(), logFileName)
}

// setupLog 把日志重定向到 exe 同级的 m-server.log。
// 静默启动后没有命令行窗口，日志文件是唯一的排查途径。
func setupLog() {
	path := logFilePath()
	rotateLog(path)

	f, err := os.OpenFile(path, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0o644)
	if err != nil {
		// 目录只读之类的情况：保持默认输出，至少不崩
		return
	}

	w := &teeWriter{file: f}
	if hasConsole() {
		w.con = os.Stderr
	}
	log.SetOutput(w)
}

// rotateLog 超过上限就把旧日志挪成 .old，只保留最近一份
func rotateLog(path string) {
	st, err := os.Stat(path)
	if err != nil || st.Size() < logMaxBytes {
		return
	}
	_ = os.Remove(path + ".old")
	_ = os.Rename(path, path+".old")
}

// hasConsole 判断当前进程有没有可写的控制台。
// 用 -H windowsgui 编译出来的 exe 拿不到有效句柄，这里会返回 false。
func hasConsole() bool {
	if runtime.GOOS != "windows" {
		return true
	}
	_, err := os.Stderr.Stat()
	return err == nil
}
