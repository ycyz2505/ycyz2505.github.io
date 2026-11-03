//go:build windows

package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"syscall"
	"time"
	"unsafe"
)

var (
	kernel32         = syscall.NewLazyDLL("kernel32.dll")
	procCreateMutexW = kernel32.NewProc("CreateMutexW")

	// 进程存活期间一直持有，退出时由系统自动释放
	instanceMutex syscall.Handle
)

// singleInstance 返回 false 表示已经有一个 m-server 在运行。
// 命名互斥量拦住新版本之间的重复启动；端口探测再拦住还没加互斥量的旧版本。
func singleInstance() bool {
	name, err := syscall.UTF16PtrFromString(`Local\ClassMServer`)
	if err == nil {
		handle, _, callErr := procCreateMutexW.Call(0, 0, uintptr(unsafe.Pointer(name)))
		if handle != 0 {
			instanceMutex = syscall.Handle(handle)
		}
		if errno, ok := callErr.(syscall.Errno); ok && errno == syscall.ERROR_ALREADY_EXISTS {
			return false
		}
	}

	return !existingMServer()
}

func existingMServer() bool {
	client := &http.Client{Timeout: 400 * time.Millisecond}

	for port := portStart; port <= portEnd; port++ {
		resp, err := client.Get(fmt.Sprintf("http://127.0.0.1:%d/api/m/ping", port))
		if err != nil {
			continue
		}

		var body struct {
			Service string `json:"service"`
		}
		decodeErr := json.NewDecoder(resp.Body).Decode(&body)
		resp.Body.Close()

		if decodeErr == nil && body.Service == appService {
			return true
		}
	}

	return false
}
