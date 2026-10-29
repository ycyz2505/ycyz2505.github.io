// ============================================================
//  LocalDataServer.cpp
//  本地数据服务 —— 为班级网页提供读写 D 盘 JSON 文件的能力
//
//  接口：
//    GET    /api/ping
//    GET    /api/list
//    GET    /api/data/{name}
//    PUT    /api/data/{name}
//    POST   /api/data/{name}
//    DELETE /api/data/{name}
//    GET    /api/music/tree
//    GET    /api/music/media?path=相对路径   （支持 Range）
//    GET    /api/audio/devices               （列出音频输出设备）
//    POST   /api/audio/device                （切换设备启用/禁用）
//    GET    /api/audio/volume                （读取系统主音量 0~100）
//    POST   /api/audio/volume?v=0~100        （设置系统主音量）
//
//  MinGW 编译命令：
//    g++ -O2 -static -mwindows LocalDataServer.cpp ^
//        -o LocalDataServer.exe -lws2_32 -lole32 -lpropsys ^
//        -static-libgcc -static-libstdc++
//
//  MSVC 编译命令：
//    cl /O2 /MT /EHsc /DNDEBUG LocalDataServer.cpp ^
//       /link /SUBSYSTEM:WINDOWS ws2_32.lib ole32.lib propsys.lib
// ============================================================

#ifndef WIN32_LEAN_AND_MEAN
#define WIN32_LEAN_AND_MEAN
#endif

#include <winsock2.h>
#include <ws2tcpip.h>
#include <windows.h>
#include <mmreg.h>
#include <objbase.h>
#include <mmdeviceapi.h>
#include <endpointvolume.h>
#include <functiondiscoverykeys_devpkey.h>
#include <propvarutil.h>

#include <string>
#include <vector>
#include <algorithm>
#include <cctype>
#include <cwctype>
#include <cstdio>

// MSVC 下用 pragma 自动链接；MinGW 不认，靠命令行 -l 参数。
#pragma comment(lib, "ws2_32.lib")
#pragma comment(lib, "ole32.lib")
#pragma comment(lib, "propsys.lib")

static std::wstring g_exeDir;
static std::wstring g_dataDir;

static const int PORT_START = 17632;
static const int PORT_END   = 17641;
static const size_t PATH_BUF_LEN = 2048;

// ------------------------------------------------------------
// 手动定义 PKEY_Device_FriendlyName，避免 MinGW 下找不到数据符号
//   {a45c254e-df1c-4efd-8020-67d146a850e0}, 14
// ------------------------------------------------------------
static const PROPERTYKEY kPKEY_Device_FriendlyName = {
    { 0xa45c254e, 0xdf1c, 0x4efd,
      { 0x80, 0x20, 0x67, 0xd1, 0x46, 0xa8, 0x50, 0xe0 } },
    14
};

// ------------------------------------------------------------
// 基础工具
// ------------------------------------------------------------
static std::wstring GetExeDir()
{
    wchar_t buf[MAX_PATH] = { 0 };
    DWORD n = GetModuleFileNameW(NULL, buf, MAX_PATH);
    if (n == 0) return L".";

    std::wstring full(buf, n);
    size_t pos = full.find_last_of(L"\\/");
    if (pos == std::wstring::npos) return L".";
    return full.substr(0, pos);
}

static bool EnsureDir(const std::wstring& dir)
{
    DWORD attr = GetFileAttributesW(dir.c_str());
    if (attr != INVALID_FILE_ATTRIBUTES && (attr & FILE_ATTRIBUTE_DIRECTORY))
        return true;
    return CreateDirectoryW(dir.c_str(), NULL) != 0;
}

static std::wstring ToWide(const std::string& s)
{
    if (s.empty()) return std::wstring();
    int len = MultiByteToWideChar(CP_UTF8, 0, s.c_str(), (int)s.size(), NULL, 0);
    if (len <= 0) return std::wstring();
    std::wstring out((size_t)len, L'\0');
    MultiByteToWideChar(CP_UTF8, 0, s.c_str(), (int)s.size(), &out[0], len);
    return out;
}

static std::string ToUtf8(const std::wstring& w)
{
    if (w.empty()) return std::string();
    int len = WideCharToMultiByte(CP_UTF8, 0, w.c_str(), (int)w.size(),
                                  NULL, 0, NULL, NULL);
    if (len <= 0) return std::string();
    std::string out((size_t)len, '\0');
    WideCharToMultiByte(CP_UTF8, 0, w.c_str(), (int)w.size(),
                        &out[0], len, NULL, NULL);
    return out;
}

static bool ReadTextFile(const std::wstring& path, std::string& out)
{
    HANDLE h = CreateFileW(path.c_str(), GENERIC_READ,
                           FILE_SHARE_READ | FILE_SHARE_WRITE,
                           NULL, OPEN_EXISTING, FILE_ATTRIBUTE_NORMAL, NULL);
    if (h == INVALID_HANDLE_VALUE) return false;

    DWORD size = GetFileSize(h, NULL);
    if (size == INVALID_FILE_SIZE) { CloseHandle(h); return false; }

    out.clear();
    if (size > 0) {
        out.resize((size_t)size);
        DWORD read = 0;
        if (!ReadFile(h, &out[0], size, &read, NULL)) {
            CloseHandle(h);
            return false;
        }
        out.resize((size_t)read);
    }
    CloseHandle(h);

    if (out.size() >= 3 &&
        (unsigned char)out[0] == 0xEF &&
        (unsigned char)out[1] == 0xBB &&
        (unsigned char)out[2] == 0xBF) {
        out.erase(0, 3);
    }
    return true;
}

// 所有写盘操作串行化，避免两个请求同时改同一个文件
static CRITICAL_SECTION g_writeLock;

static bool WriteTextFile(const std::wstring& path, const std::string& data)
{
    // 临时文件名带线程 id + 自增序号：并发写同一个文件时不会互相覆盖同一个 .tmp
    static volatile LONG s_tmpSeed = 0;
    LONG seed = InterlockedIncrement(&s_tmpSeed);

    std::wstring tmp = path
        + L"." + std::to_wstring((unsigned long)GetCurrentThreadId())
        + L"." + std::to_wstring((unsigned long)seed)
        + L".tmp";

    EnterCriticalSection(&g_writeLock);

    bool ok = false;
    HANDLE h = CreateFileW(tmp.c_str(), GENERIC_WRITE, 0, NULL,
                           CREATE_ALWAYS, FILE_ATTRIBUTE_NORMAL, NULL);

    if (h != INVALID_HANDLE_VALUE) {
        bool written = true;

        if (!data.empty()) {
            DWORD done = 0;
            written = WriteFile(h, data.data(), (DWORD)data.size(), &done, NULL) != 0
                      && done == (DWORD)data.size();
        }

        FlushFileBuffers(h);
        CloseHandle(h);

        if (written &&
            MoveFileExW(tmp.c_str(), path.c_str(),
                        MOVEFILE_REPLACE_EXISTING | MOVEFILE_WRITE_THROUGH)) {
            ok = true;
        } else {
            DeleteFileW(tmp.c_str());
        }
    }

    LeaveCriticalSection(&g_writeLock);
    return ok;
}

static std::string UrlDecode(const std::string& s)
{
    std::string out;
    out.reserve(s.size());
    for (size_t i = 0; i < s.size(); ++i) {
        char c = s[i];
        if (c == '%' && i + 2 < s.size()) {
            int hi = -1, lo = -1;
            char a = s[i + 1], b = s[i + 2];
            if (a >= '0' && a <= '9') hi = a - '0';
            else if (a >= 'a' && a <= 'f') hi = a - 'a' + 10;
            else if (a >= 'A' && a <= 'F') hi = a - 'A' + 10;
            if (b >= '0' && b <= '9') lo = b - '0';
            else if (b >= 'a' && b <= 'f') lo = b - 'a' + 10;
            else if (b >= 'A' && b <= 'F') lo = b - 'A' + 10;
            if (hi >= 0 && lo >= 0) {
                out.push_back((char)(hi * 16 + lo));
                i += 2;
                continue;
            }
        }
        if (c == '+') out.push_back(' ');
        else out.push_back(c);
    }
    return out;
}

static bool IsSafeName(const std::string& name)
{
    if (name.empty() || name.size() > 64) return false;
    for (size_t i = 0; i < name.size(); ++i) {
        char c = name[i];
        if (!(std::isalnum((unsigned char)c) || c == '_' || c == '-'))
            return false;
    }
    return true;
}

static long long ParseLL(const std::string& s, long long def)
{
    if (s.empty()) return def;
    long long v = 0;
    for (size_t i = 0; i < s.size(); ++i) {
        char c = s[i];
        if (c < '0' || c > '9') return def;
        v = v * 10 + (c - '0');
        if (v > (1LL << 50)) return def;
    }
    return v;
}

// ------------------------------------------------------------
// 网络收发
// ------------------------------------------------------------
static void SendAll(SOCKET s, const char* data, int len)
{
    int sent = 0;
    while (sent < len) {
        int n = send(s, data + sent, len - sent, 0);
        if (n <= 0) break;
        sent += n;
    }
}

static void SendResponse(SOCKET client, int code, const char* status,
                         const char* contentType, const std::string& body)
{
    std::string head;
    head.reserve(640);
    head += "HTTP/1.1 ";
    head += std::to_string(code);
    head += " ";
    head += status;
    head += "\r\n";
    head += "Content-Type: ";
    head += contentType;
    head += "\r\n";
    head += "Content-Length: ";
    head += std::to_string(body.size());
    head += "\r\n";
    head += "Access-Control-Allow-Origin: *\r\n";
    head += "Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS\r\n";
    head += "Access-Control-Allow-Headers: Content-Type, Range\r\n";
    head += "Access-Control-Expose-Headers: Content-Range, Accept-Ranges, Content-Length\r\n";
    head += "Access-Control-Allow-Private-Network: true\r\n";
    head += "Access-Control-Max-Age: 86400\r\n";
    head += "X-LocalData-Service: yes\r\n";
    head += "Cache-Control: no-store\r\n";
    head += "Connection: close\r\n";
    head += "\r\n";

    SendAll(client, head.c_str(), (int)head.size());
    if (!body.empty()) SendAll(client, body.data(), (int)body.size());
}

static long long GetContentLength(const std::string& head)
{
    std::string lower = head;
    std::transform(lower.begin(), lower.end(), lower.begin(),
                   [](unsigned char c) { return (char)std::tolower(c); });

    size_t pos = lower.find("content-length:");
    if (pos == std::string::npos) return 0;

    pos += 15;
    while (pos < lower.size() && (lower[pos] == ' ' || lower[pos] == '\t')) ++pos;

    long long value = 0;
    while (pos < lower.size() && std::isdigit((unsigned char)lower[pos])) {
        value = value * 10 + (lower[pos] - '0');
        ++pos;
        if (value > 64LL * 1024 * 1024) break;
    }
    return value;
}

static std::string GetHeader(const std::string& head, const std::string& name)
{
    std::string lower = head;
    std::transform(lower.begin(), lower.end(), lower.begin(),
                   [](unsigned char c) { return (char)std::tolower(c); });

    std::string key = name;
    std::transform(key.begin(), key.end(), key.begin(),
                   [](unsigned char c) { return (char)std::tolower(c); });
    key += ":";

    size_t pos = lower.find(key);
    if (pos == std::string::npos) return "";
    pos += key.size();
    while (pos < lower.size() && (lower[pos] == ' ' || lower[pos] == '\t')) ++pos;
    size_t end = head.find("\r\n", pos);
    if (end == std::string::npos) end = head.size();
    return head.substr(pos, end - pos);
}

static std::string GetQueryParam(const std::string& target, const std::string& name)
{
    size_t q = target.find('?');
    if (q == std::string::npos) return "";

    std::string query = target.substr(q + 1);
    std::string key = name + "=";
    size_t pos = 0;

    while (pos < query.size()) {
        size_t amp = query.find('&', pos);
        std::string pair = query.substr(
            pos, amp == std::string::npos ? std::string::npos : amp - pos);

        if (pair.compare(0, key.size(), key) == 0) {
            return UrlDecode(pair.substr(key.size()));
        }
        if (amp == std::string::npos) break;
        pos = amp + 1;
    }
    return "";
}

// ------------------------------------------------------------
// 极简 JSON 取值（用于解析前端发来的小请求体）
// ------------------------------------------------------------
static bool ExtractJsonString(const std::string& json,
                              const std::string& key,
                              std::string& out)
{
    std::string search = "\"" + key + "\"";
    size_t p = json.find(search);
    if (p == std::string::npos) return false;

    p = json.find(':', p + search.size());
    if (p == std::string::npos) return false;

    p = json.find('"', p + 1);
    if (p == std::string::npos) return false;
    p++;

    std::string result;
    while (p < json.size() && json[p] != '"') {
        if (json[p] == '\\' && p + 1 < json.size()) {
            p++;
            char c = json[p];
            switch (c) {
                case 'n': result += '\n'; break;
                case 'r': result += '\r'; break;
                case 't': result += '\t'; break;
                case '"': result += '"';  break;
                case '\\': result += '\\'; break;
                default: result += c; break;
            }
        } else {
            result += json[p];
        }
        p++;
    }

    out = result;
    return true;
}

static bool ExtractJsonBool(const std::string& json,
                            const std::string& key,
                            bool& out)
{
    std::string search = "\"" + key + "\"";
    size_t p = json.find(search);
    if (p == std::string::npos) return false;

    p = json.find(':', p + search.size());
    if (p == std::string::npos) return false;
    p++;

    while (p < json.size() && (json[p] == ' ' || json[p] == '\t')) p++;

    if (json.compare(p, 4, "true") == 0) { out = true;  return true; }
    if (json.compare(p, 5, "false") == 0) { out = false; return true; }
    return false;
}

static bool ExtractJsonInt(const std::string& json,
                           const std::string& key,
                           long long& out)
{
    std::string search = "\"" + key + "\"";
    size_t p = json.find(search);
    if (p == std::string::npos) return false;

    p = json.find(':', p + search.size());
    if (p == std::string::npos) return false;
    p++;

    while (p < json.size() && (json[p] == ' ' || json[p] == '\t')) p++;

    size_t start = p;
    if (p < json.size() && (json[p] == '-' || json[p] == '+')) p++;
    while (p < json.size() && json[p] >= '0' && json[p] <= '9') p++;

    if (p == start) return false;
    out = ParseLL(json.substr(start, p - start), 0);
    return true;
}

// ============================================================
//  音乐模块
// ============================================================
static std::wstring GetMusicRoot()
{
    return g_dataDir + L"\\music";
}

static bool IsSafeRelPath(const std::string& s)
{
    if (s.empty() || s.size() > 700) return false;
    if (s[0] == '/' || s[0] == '\\') return false;
    if (s.find("..") != std::string::npos) return false;
    if (s.find(':') != std::string::npos) return false;
    for (size_t i = 0; i < s.size(); ++i) {
        unsigned char c = (unsigned char)s[i];
        if (c < 0x20) return false;
    }
    return true;
}

static bool ResolveUnderRoot(const std::wstring& root,
                             const std::wstring& target,
                             std::wstring& out)
{
    wchar_t rbuf[PATH_BUF_LEN];
    wchar_t tbuf[PATH_BUF_LEN];

    if (GetFullPathNameW(root.c_str(), PATH_BUF_LEN, rbuf, NULL) == 0) return false;
    if (GetFullPathNameW(target.c_str(), PATH_BUF_LEN, tbuf, NULL) == 0) return false;

    std::wstring r(rbuf), t(tbuf);
    if (t.size() < r.size()) return false;
    if (_wcsnicmp(t.c_str(), r.c_str(), r.size()) != 0) return false;
    if (t.size() > r.size() && t[r.size()] != L'\\' && t[r.size()] != L'/')
        return false;

    out = t;
    return true;
}

static std::string JsonEscape(const std::string& s)
{
    static const char* hex = "0123456789abcdef";
    std::string out;
    out.reserve(s.size() + 8);

    for (size_t i = 0; i < s.size(); ++i) {
        unsigned char c = (unsigned char)s[i];
        switch (c) {
            case '"':  out += "\\\""; break;
            case '\\': out += "\\\\"; break;
            case '\n': out += "\\n";  break;
            case '\r': out += "\\r";  break;
            case '\t': out += "\\t";  break;
            case '\b': out += "\\b";  break;
            case '\f': out += "\\f";  break;
            default:
                if (c < 0x20) {
                    char buf[7];
                    buf[0] = '\\';
                    buf[1] = 'u';
                    buf[2] = '0';
                    buf[3] = '0';
                    buf[4] = hex[(c >> 4) & 0x0F];
                    buf[5] = hex[c & 0x0F];
                    buf[6] = 0;
                    out += buf;
                } else {
                    out += (char)c;
                }
        }
    }
    return out;
}

static std::wstring ToLowerW(const std::wstring& s)
{
    std::wstring out = s;
    for (size_t i = 0; i < out.size(); ++i)
        out[i] = (wchar_t)towlower(out[i]);
    return out;
}

static bool HasExt(const std::wstring& name, const wchar_t* ext)
{
    std::wstring lower = ToLowerW(name);
    size_t n = wcslen(ext);
    if (lower.size() < n) return false;
    return lower.compare(lower.size() - n, n, ext) == 0;
}

static bool IsAudioFile(const std::wstring& name)
{
    return HasExt(name, L".mp3")  || HasExt(name, L".flac") ||
           HasExt(name, L".wav")  || HasExt(name, L".m4a")  ||
           HasExt(name, L".aac")  || HasExt(name, L".ogg")  ||
           HasExt(name, L".opus") || HasExt(name, L".wma")  ||
           HasExt(name, L".ape")  || HasExt(name, L".mp4");
}

static bool IsLyricFile(const std::wstring& name)
{
    return HasExt(name, L".lrc");
}

static bool IsImageFile(const std::wstring& name)
{
    return HasExt(name, L".jpg")  || HasExt(name, L".jpeg") ||
           HasExt(name, L".png")  || HasExt(name, L".webp") ||
           HasExt(name, L".gif")  || HasExt(name, L".bmp");
}

static std::string GetMimeType(const std::wstring& path)
{
    size_t dot = path.find_last_of(L'.');
    if (dot == std::wstring::npos) return "application/octet-stream";

    std::wstring ext = ToLowerW(path.substr(dot + 1));

    if (ext == L"mp3")  return "audio/mpeg";
    if (ext == L"flac") return "audio/flac";
    if (ext == L"wav")  return "audio/wav";
    if (ext == L"m4a")  return "audio/mp4";
    if (ext == L"aac")  return "audio/aac";
    if (ext == L"ogg")  return "audio/ogg";
    if (ext == L"opus") return "audio/ogg";
    if (ext == L"wma")  return "audio/x-ms-wma";
    if (ext == L"ape")  return "audio/x-ape";
    if (ext == L"mp4")  return "video/mp4";
    if (ext == L"lrc")  return "text/plain; charset=utf-8";
    if (ext == L"jpg" || ext == L"jpeg") return "image/jpeg";
    if (ext == L"png")  return "image/png";
    if (ext == L"webp") return "image/webp";
    if (ext == L"gif")  return "image/gif";
    if (ext == L"bmp")  return "image/bmp";
    return "application/octet-stream";
}

// ---------- 目录树 ----------
struct MusicEntry {
    std::wstring name;
    bool isDir;
};

static bool MusicEntryLess(const MusicEntry& a, const MusicEntry& b)
{
    return a.name < b.name;
}

static void BuildMusicTree(const std::wstring& dir,
                           const std::string& relPrefix,
                           std::string& out)
{
    std::vector<MusicEntry> dirs, files;

    std::wstring pattern = dir + L"\\*";
    WIN32_FIND_DATAW fd;
    HANDLE h = FindFirstFileW(pattern.c_str(), &fd);

    if (h != INVALID_HANDLE_VALUE) {
        do {
            if (wcscmp(fd.cFileName, L".") == 0 ||
                wcscmp(fd.cFileName, L"..") == 0) continue;

            bool isDir = (fd.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY) != 0;

            if (isDir) {
                MusicEntry e;
                e.name = fd.cFileName;
                e.isDir = true;
                dirs.push_back(e);
            } else {
                if (IsAudioFile(fd.cFileName) ||
                    IsLyricFile(fd.cFileName) ||
                    IsImageFile(fd.cFileName)) {
                    MusicEntry e;
                    e.name = fd.cFileName;
                    e.isDir = false;
                    files.push_back(e);
                }
            }
        } while (FindNextFileW(h, &fd));
        FindClose(h);
    }

    std::sort(dirs.begin(), dirs.end(), MusicEntryLess);
    std::sort(files.begin(), files.end(), MusicEntryLess);

    out += "[";
    bool first = true;

    for (size_t i = 0; i < dirs.size(); ++i) {
        const std::wstring& name = dirs[i].name;
        std::string nameUtf8 = ToUtf8(name);
        std::string rel = relPrefix.empty() ? nameUtf8 : (relPrefix + "/" + nameUtf8);

        std::wstring childDir = dir + L"\\" + name;
        std::string childJson;
        BuildMusicTree(childDir, rel, childJson);

        if (!first) out += ",";
        first = false;

        out += "{\"name\":\"";
        out += JsonEscape(nameUtf8);
        out += "\",\"path\":\"";
        out += JsonEscape(rel);
        out += "\",\"type\":\"folder\",\"children\":";
        out += childJson;
        out += "}";
    }

    for (size_t i = 0; i < files.size(); ++i) {
        const std::wstring& name = files[i].name;
        std::string nameUtf8 = ToUtf8(name);
        std::string rel = relPrefix.empty() ? nameUtf8 : (relPrefix + "/" + nameUtf8);

        std::wstring lower = ToLowerW(name);
        size_t dot = lower.find_last_of(L'.');
        std::wstring ext = (dot == std::wstring::npos) ? L"" : lower.substr(dot + 1);

        if (!first) out += ",";
        first = false;

        out += "{\"name\":\"";
        out += JsonEscape(nameUtf8);
        out += "\",\"path\":\"";
        out += JsonEscape(rel);
        out += "\",\"type\":\"";
        out += IsLyricFile(name) ? "lyric"
             : (IsImageFile(name) ? "image" : "audio");
        out += "\",\"ext\":\"";
        out += JsonEscape(ToUtf8(ext));
        out += "\"}";
    }

    out += "]";
}

// ---------- 文件发送（带 Range） ----------
static void SendFileWithRange(SOCKET client,
                              const std::wstring& filePath,
                              const std::string& rangeHeader)
{
    HANDLE h = CreateFileW(filePath.c_str(), GENERIC_READ,
                           FILE_SHARE_READ | FILE_SHARE_WRITE,
                           NULL, OPEN_EXISTING, FILE_ATTRIBUTE_NORMAL, NULL);
    if (h == INVALID_HANDLE_VALUE) {
        SendResponse(client, 404, "Not Found",
                     "application/json; charset=utf-8",
                     "{\"error\":\"not found\"}");
        return;
    }

    LARGE_INTEGER sizeLi;
    if (!GetFileSizeEx(h, &sizeLi)) {
        CloseHandle(h);
        SendResponse(client, 500, "Internal Server Error",
                     "text/plain; charset=utf-8", "size error");
        return;
    }

    long long fileSize = sizeLi.QuadPart;
    std::string mime = GetMimeType(filePath);

    long long start = 0;
    long long end = (fileSize > 0) ? fileSize - 1 : 0;
    bool partial = false;

    if (!rangeHeader.empty()) {
        size_t eq = rangeHeader.find('=');
        if (eq != std::string::npos &&
            rangeHeader.compare(0, eq, "bytes") == 0) {

            std::string spec = rangeHeader.substr(eq + 1);
            size_t dash = spec.find('-');

            if (dash != std::string::npos) {
                std::string a = spec.substr(0, dash);
                std::string b = spec.substr(dash + 1);

                long long s = ParseLL(a, -1);
                long long e = ParseLL(b, -1);

                if (s < 0 && e >= 0) {
                    start = (e >= fileSize) ? 0 : (fileSize - e);
                    end = fileSize - 1;
                } else if (s >= 0) {
                    start = s;
                    end = (e >= 0) ? e : (fileSize - 1);
                }

                if (start < 0 || start >= fileSize || end < start) {
                    std::string head =
                        "HTTP/1.1 416 Range Not Satisfiable\r\n"
                        "Content-Range: bytes */" + std::to_string(fileSize) + "\r\n"
                        "Content-Length: 0\r\n"
                        "Access-Control-Allow-Origin: *\r\n"
                        "Connection: close\r\n\r\n";
                    SendAll(client, head.c_str(), (int)head.size());
                    CloseHandle(h);
                    return;
                }

                if (end >= fileSize) end = fileSize - 1;
                partial = true;
            }
        }
    }

    long long contentLength = (fileSize > 0) ? (end - start + 1) : 0;

    std::string head;
    head.reserve(512);
    head += partial
        ? "HTTP/1.1 206 Partial Content\r\n"
        : "HTTP/1.1 200 OK\r\n";
    head += "Content-Type: " + mime + "\r\n";
    head += "Content-Length: " + std::to_string(contentLength) + "\r\n";
    if (partial) {
        head += "Content-Range: bytes " + std::to_string(start) + "-" +
                std::to_string(end) + "/" + std::to_string(fileSize) + "\r\n";
    }
    head += "Accept-Ranges: bytes\r\n";
    head += "Access-Control-Allow-Origin: *\r\n";
    head += "Access-Control-Expose-Headers: Content-Range, Accept-Ranges, Content-Length\r\n";
    head += "Access-Control-Allow-Headers: Content-Type, Range\r\n";
    head += "Cache-Control: no-store\r\n";
    head += "Connection: close\r\n";
    head += "\r\n";

    SendAll(client, head.c_str(), (int)head.size());

    if (contentLength > 0) {
        LARGE_INTEGER li;
        li.QuadPart = start;
        SetFilePointerEx(h, li, NULL, FILE_BEGIN);

        const DWORD BUF_SIZE = 64 * 1024;
        std::vector<char> buf(BUF_SIZE);
        long long remain = contentLength;

        while (remain > 0) {
            DWORD toRead = (DWORD)(remain > (long long)BUF_SIZE ? (long long)BUF_SIZE : remain);
            DWORD read = 0;

            if (!ReadFile(h, buf.data(), toRead, &read, NULL) || read == 0) break;

            SendAll(client, buf.data(), (int)read);
            remain -= read;
        }
    }

    CloseHandle(h);
}

// ============================================================
//  音频设备模块
// ============================================================
static const CLSID CLSID_CPolicyConfigClient =
    { 0x870af99c, 0x171d, 0x4f9e,
      { 0xaf, 0x0d, 0xe6, 0x3d, 0xf4, 0x0c, 0x2b, 0xc9 } };

static const IID IID_IPolicyConfig =
    { 0xf8679f50, 0x850a, 0x41cf,
      { 0x9c, 0x72, 0x43, 0x0f, 0x29, 0x02, 0x90, 0xc8 } };

struct IPolicyConfig : public IUnknown
{
    virtual HRESULT STDMETHODCALLTYPE GetMixFormat(PCWSTR, WAVEFORMATEX**) = 0;
    virtual HRESULT STDMETHODCALLTYPE GetDeviceFormat(PCWSTR, INT, WAVEFORMATEX**) = 0;
    virtual HRESULT STDMETHODCALLTYPE ResetDeviceFormat(PCWSTR) = 0;
    virtual HRESULT STDMETHODCALLTYPE SetDeviceFormat(PCWSTR, WAVEFORMATEX*, WAVEFORMATEX*) = 0;
    virtual HRESULT STDMETHODCALLTYPE GetProcessingPeriod(PCWSTR, INT, PINT64, PINT64) = 0;
    virtual HRESULT STDMETHODCALLTYPE SetProcessingPeriod(PCWSTR, PINT64) = 0;
    virtual HRESULT STDMETHODCALLTYPE GetShareMode(PCWSTR, void*) = 0;
    virtual HRESULT STDMETHODCALLTYPE SetShareMode(PCWSTR, void*) = 0;
    virtual HRESULT STDMETHODCALLTYPE GetPropertyValue(PCWSTR, const PROPERTYKEY&, PROPVARIANT*) = 0;
    virtual HRESULT STDMETHODCALLTYPE SetPropertyValue(PCWSTR, const PROPERTYKEY&, PROPVARIANT*) = 0;
    virtual HRESULT STDMETHODCALLTYPE SetDefaultEndpoint(PCWSTR, ERole) = 0;
    virtual HRESULT STDMETHODCALLTYPE SetEndpointVisibility(PCWSTR, INT) = 0;
};

static std::string EnumerateAudioDevices()
{
    HRESULT hrInit = CoInitialize(NULL);
    bool needUninit = SUCCEEDED(hrInit);

    std::string out = "[]";

    IMMDeviceEnumerator* pEnum = NULL;
    HRESULT hr = CoCreateInstance(__uuidof(MMDeviceEnumerator), NULL,
                                  CLSCTX_ALL,
                                  __uuidof(IMMDeviceEnumerator),
                                  (void**)&pEnum);
    if (FAILED(hr) || !pEnum) {
        if (needUninit) CoUninitialize();
        return out;
    }

    IMMDeviceCollection* pCol = NULL;
    hr = pEnum->EnumAudioEndpoints(
            eRender,
            DEVICE_STATE_ACTIVE | DEVICE_STATE_DISABLED,
            &pCol);

    if (FAILED(hr) || !pCol) {
        pEnum->Release();
        if (needUninit) CoUninitialize();
        return out;
    }

    UINT count = 0;
    pCol->GetCount(&count);

    out = "[";
    bool first = true;

    for (UINT i = 0; i < count; i++) {
        IMMDevice* pDev = NULL;
        if (FAILED(pCol->Item(i, &pDev)) || !pDev) continue;

        DWORD state = 0;
        pDev->GetState(&state);
        bool isActive = (state & DEVICE_STATE_ACTIVE) != 0;

        std::string idUtf8;
        LPWSTR wid = NULL;
        if (SUCCEEDED(pDev->GetId(&wid)) && wid) {
            idUtf8 = ToUtf8(wid);
            CoTaskMemFree(wid);
        }

        std::string nameUtf8;
        IPropertyStore* pProps = NULL;
        if (SUCCEEDED(pDev->OpenPropertyStore(STGM_READ, &pProps)) && pProps) {
            PROPVARIANT pv;
            PropVariantInit(&pv);
            if (SUCCEEDED(pProps->GetValue(kPKEY_Device_FriendlyName, &pv)) &&
                pv.vt == VT_LPWSTR && pv.pwszVal) {
                nameUtf8 = ToUtf8(pv.pwszVal);
            }
            PropVariantClear(&pv);
            pProps->Release();
        }

        pDev->Release();

        if (idUtf8.empty()) continue;

        if (!first) out += ",";
        first = false;

        out += "{\"id\":\"";
        out += JsonEscape(idUtf8);
        out += "\",\"name\":\"";
        out += JsonEscape(nameUtf8.empty() ? idUtf8 : nameUtf8);
        out += "\",\"active\":";
        out += isActive ? "true" : "false";
        out += "}";
    }

    out += "]";

    pCol->Release();
    pEnum->Release();
    if (needUninit) CoUninitialize();

    return out;
}

static HRESULT SetAudioDeviceEnabled(const std::string& idUtf8, bool enable)
{
    HRESULT hrInit = CoInitialize(NULL);
    bool needUninit = SUCCEEDED(hrInit);

    IPolicyConfig* pPolicy = NULL;
    HRESULT hr = CoCreateInstance(CLSID_CPolicyConfigClient, NULL,
                                  CLSCTX_ALL, IID_IPolicyConfig,
                                  (void**)&pPolicy);

    if (FAILED(hr) || !pPolicy) {
        if (needUninit) CoUninitialize();
        return hr;
    }

    std::wstring wid = ToWide(idUtf8);
    hr = pPolicy->SetEndpointVisibility(wid.c_str(), enable ? 1 : 0);

    pPolicy->Release();
    if (needUninit) CoUninitialize();

    return hr;
}

// ------------------------------------------------------------
// 系统主音量（默认输出设备）
// ------------------------------------------------------------
static bool OpenEndpointVolume(IAudioEndpointVolume** out)
{
    IMMDeviceEnumerator* pEnum = NULL;
    HRESULT hr = CoCreateInstance(__uuidof(MMDeviceEnumerator), NULL,
                                  CLSCTX_ALL,
                                  __uuidof(IMMDeviceEnumerator),
                                  (void**)&pEnum);
    if (FAILED(hr) || !pEnum) return false;

    IMMDevice* pDev = NULL;
    hr = pEnum->GetDefaultAudioEndpoint(eRender, eConsole, &pDev);
    if (FAILED(hr) || !pDev) {
        pEnum->Release();
        return false;
    }

    IAudioEndpointVolume* pVol = NULL;
    hr = pDev->Activate(__uuidof(IAudioEndpointVolume), CLSCTX_ALL,
                        NULL, (void**)&pVol);

    pDev->Release();
    pEnum->Release();

    if (FAILED(hr) || !pVol) return false;

    *out = pVol;
    return true;
}

static bool GetSystemVolume(float& level, bool& mute)
{
    HRESULT hrInit = CoInitialize(NULL);
    bool needUninit = SUCCEEDED(hrInit);

    bool ok = false;
    IAudioEndpointVolume* pVol = NULL;

    if (OpenEndpointVolume(&pVol)) {
        float v = 0.0f;
        BOOL m = FALSE;
        if (SUCCEEDED(pVol->GetMasterVolumeLevelScalar(&v)) &&
            SUCCEEDED(pVol->GetMute(&m))) {
            level = v;
            mute = (m != FALSE);
            ok = true;
        }
        pVol->Release();
    }

    if (needUninit) CoUninitialize();
    return ok;
}

// 设置主音量（0.0 ~ 1.0）。非零音量会顺手解除静音，否则用户会觉得没反应。
static bool SetSystemVolume(float level)
{
    if (level < 0.0f) level = 0.0f;
    if (level > 1.0f) level = 1.0f;

    HRESULT hrInit = CoInitialize(NULL);
    bool needUninit = SUCCEEDED(hrInit);

    bool ok = false;
    IAudioEndpointVolume* pVol = NULL;

    if (OpenEndpointVolume(&pVol)) {
        if (SUCCEEDED(pVol->SetMasterVolumeLevelScalar(level, NULL))) {
            ok = true;
            if (level > 0.0f) {
                BOOL m = FALSE;
                if (SUCCEEDED(pVol->GetMute(&m)) && m) {
                    pVol->SetMute(FALSE, NULL);
                }
            }
        }
        pVol->Release();
    }

    if (needUninit) CoUninitialize();
    return ok;
}

// ------------------------------------------------------------
// 请求处理
// ------------------------------------------------------------
static void HandleClient(SOCKET client)
{
    DWORD timeout = 15000;
    setsockopt(client, SOL_SOCKET, SO_RCVTIMEO,
               (const char*)&timeout, sizeof(timeout));
    setsockopt(client, SOL_SOCKET, SO_SNDTIMEO,
               (const char*)&timeout, sizeof(timeout));

    std::string buffer;
    char tmp[8192];

    size_t headEnd = std::string::npos;
    while ((headEnd = buffer.find("\r\n\r\n")) == std::string::npos) {
        int n = recv(client, tmp, sizeof(tmp), 0);
        if (n <= 0) { closesocket(client); return; }
        buffer.append(tmp, (size_t)n);
        if (buffer.size() > 1024 * 1024) { closesocket(client); return; }
    }

    std::string head = buffer.substr(0, headEnd);
    std::string rest = buffer.substr(headEnd + 4);

    size_t lineEnd = head.find("\r\n");
    std::string requestLine =
        (lineEnd == std::string::npos) ? head : head.substr(0, lineEnd);

    size_t sp1 = requestLine.find(' ');
    if (sp1 == std::string::npos) { closesocket(client); return; }
    size_t sp2 = requestLine.find(' ', sp1 + 1);

    std::string method = requestLine.substr(0, sp1);
    std::string target = requestLine.substr(
        sp1 + 1,
        (sp2 == std::string::npos) ? std::string::npos : (sp2 - sp1 - 1));

    std::string path = target;
    size_t qpos = path.find('?');
    if (qpos != std::string::npos) path = path.substr(0, qpos);
    path = UrlDecode(path);

    long long contentLength = GetContentLength(head);
    std::string body = rest;
    while ((long long)body.size() < contentLength) {
        int n = recv(client, tmp, sizeof(tmp), 0);
        if (n <= 0) break;
        body.append(tmp, (size_t)n);
    }
    if ((long long)body.size() > contentLength)
        body.resize((size_t)contentLength);

    if (method == "OPTIONS") {
        SendResponse(client, 204, "No Content", "text/plain; charset=utf-8", "");
        closesocket(client);
        return;
    }

    if (path == "/api/ping" && method == "GET") {
        SendResponse(client, 200, "OK", "application/json; charset=utf-8",
                     "{\"ok\":true,\"service\":\"class-local-data\",\"version\":\"1.4\"}");
        closesocket(client);
        return;
    }

    if (path == "/api/list" && method == "GET") {
        WIN32_FIND_DATAW fd;
        std::wstring pattern = g_dataDir + L"\\*.json";
        HANDLE hFind = FindFirstFileW(pattern.c_str(), &fd);
        std::string out = "[";
        bool first = true;

        if (hFind != INVALID_HANDLE_VALUE) {
            do {
                if (fd.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY) continue;

                std::string name = ToUtf8(fd.cFileName);
                if (!first) out += ",";
                first = false;
                out += "\"";
                out += JsonEscape(name);
                out += "\"";
            } while (FindNextFileW(hFind, &fd));
            FindClose(hFind);
        }
        out += "]";
        SendResponse(client, 200, "OK", "application/json; charset=utf-8", out);
        closesocket(client);
        return;
    }

    if (path == "/api/music/tree" && method == "GET") {
        std::wstring root = GetMusicRoot();
        EnsureDir(g_dataDir);
        EnsureDir(root);

        std::string out;
        BuildMusicTree(root, "", out);

        SendResponse(client, 200, "OK", "application/json; charset=utf-8", out);
        closesocket(client);
        return;
    }

    if (path == "/api/music/media" && method == "GET") {
        std::string rel = GetQueryParam(target, "path");

        if (!IsSafeRelPath(rel)) {
            SendResponse(client, 400, "Bad Request",
                         "application/json; charset=utf-8",
                         "{\"error\":\"invalid path\"}");
            closesocket(client);
            return;
        }

        std::wstring root = GetMusicRoot();
        std::wstring full;

        if (!ResolveUnderRoot(root, root + L"\\" + ToWide(rel), full)) {
            SendResponse(client, 403, "Forbidden",
                         "application/json; charset=utf-8",
                         "{\"error\":\"forbidden\"}");
            closesocket(client);
            return;
        }

        std::string rangeHeader = GetHeader(head, "Range");
        SendFileWithRange(client, full, rangeHeader);

        closesocket(client);
        return;
    }

    // ---------- 音频设备：列出 ----------
    if (path == "/api/audio/devices" && method == "GET") {
        std::string out = EnumerateAudioDevices();
        SendResponse(client, 200, "OK", "application/json; charset=utf-8", out);
        closesocket(client);
        return;
    }

    // ---------- 音频设备：切换启用/禁用 ----------
    if (path == "/api/audio/device" &&
        (method == "POST" || method == "PUT")) {

        std::string id;
        bool enable = false;

        if (!ExtractJsonString(body, "id", id) ||
            !ExtractJsonBool(body, "enable", enable) ||
            id.empty()) {
            SendResponse(client, 400, "Bad Request",
                         "application/json; charset=utf-8",
                         "{\"error\":\"missing id or enable\"}");
            closesocket(client);
            return;
        }

        HRESULT hr = SetAudioDeviceEnabled(id, enable);

        if (SUCCEEDED(hr)) {
            SendResponse(client, 200, "OK",
                         "application/json; charset=utf-8",
                         "{\"ok\":true}");
        } else if (hr == E_ACCESSDENIED) {
            SendResponse(client, 403, "Forbidden",
                         "application/json; charset=utf-8",
                         "{\"error\":\"access denied, need admin\"}");
        } else {
            SendResponse(client, 500, "Internal Server Error",
                         "application/json; charset=utf-8",
                         "{\"error\":\"set endpoint visibility failed\"}");
        }
        closesocket(client);
        return;
    }

    // ---------- 系统音量：读取 ----------
    if (path == "/api/audio/volume" && method == "GET") {
        float level = 0.0f;
        bool mute = false;

        if (!GetSystemVolume(level, mute)) {
            SendResponse(client, 500, "Internal Server Error",
                         "application/json; charset=utf-8",
                         "{\"error\":\"read volume failed\"}");
            closesocket(client);
            return;
        }

        char out[96];
        snprintf(out, sizeof(out),
                 "{\"ok\":true,\"volume\":%d,\"mute\":%s}",
                 (int)(level * 100.0f + 0.5f),
                 mute ? "true" : "false");

        SendResponse(client, 200, "OK",
                     "application/json; charset=utf-8", out);
        closesocket(client);
        return;
    }

    // ---------- 系统音量：设置（?v=0~100 或 {"volume":0~100}） ----------
    if (path == "/api/audio/volume" &&
        (method == "POST" || method == "PUT")) {

        long long pct = -1;

        std::string qv = GetQueryParam(target, "v");
        if (!qv.empty()) pct = ParseLL(qv, -1);

        if (pct < 0) {
            long long fromBody = -1;
            if (ExtractJsonInt(body, "volume", fromBody)) pct = fromBody;
        }

        if (pct < 0)   pct = 0;
        if (pct > 100) pct = 100;

        if (!SetSystemVolume((float)pct / 100.0f)) {
            SendResponse(client, 500, "Internal Server Error",
                         "application/json; charset=utf-8",
                         "{\"error\":\"set volume failed\"}");
            closesocket(client);
            return;
        }

        char out[96];
        snprintf(out, sizeof(out), "{\"ok\":true,\"volume\":%d}", (int)pct);

        SendResponse(client, 200, "OK",
                     "application/json; charset=utf-8", out);
        closesocket(client);
        return;
    }

    const std::string prefix = "/api/data/";
    if (path.size() > prefix.size() &&
        path.compare(0, prefix.size(), prefix) == 0) {

        std::string name = path.substr(prefix.size());

        if (!IsSafeName(name)) {
            SendResponse(client, 400, "Bad Request",
                         "application/json; charset=utf-8",
                         "{\"error\":\"invalid name\"}");
            closesocket(client);
            return;
        }

        std::wstring filePath = g_dataDir + L"\\" + ToWide(name) + L".json";

        if (method == "GET") {
            std::string content;
            if (ReadTextFile(filePath, content)) {
                SendResponse(client, 200, "OK",
                             "application/json; charset=utf-8", content);
            } else {
                SendResponse(client, 404, "Not Found",
                             "application/json; charset=utf-8",
                             "{\"error\":\"not found\"}");
            }
            closesocket(client);
            return;
        }

        if (method == "PUT" || method == "POST") {
            if (body.empty()) body = "null";
            if (WriteTextFile(filePath, body)) {
                SendResponse(client, 200, "OK",
                             "application/json; charset=utf-8",
                             "{\"ok\":true}");
            } else {
                SendResponse(client, 500, "Internal Server Error",
                             "application/json; charset=utf-8",
                             "{\"error\":\"write failed\"}");
            }
            closesocket(client);
            return;
        }

        if (method == "DELETE") {
            DeleteFileW(filePath.c_str());
            SendResponse(client, 200, "OK",
                         "application/json; charset=utf-8",
                         "{\"ok\":true}");
            closesocket(client);
            return;
        }
    }

    SendResponse(client, 404, "Not Found", "text/plain; charset=utf-8", "Not Found");
    closesocket(client);
}

static DWORD WINAPI ClientThread(LPVOID param)
{
    SOCKET client = (SOCKET)(UINT_PTR)param;
    HandleClient(client);
    return 0;
}

static int RunServer()
{
    g_exeDir = GetExeDir();
    g_dataDir = g_exeDir + L"\\data";
    EnsureDir(g_dataDir);

    InitializeCriticalSection(&g_writeLock);

    WSADATA wsaData;
    if (WSAStartup(MAKEWORD(2, 2), &wsaData) != 0) return 1;

    SOCKET listenSock = INVALID_SOCKET;
    int usedPort = 0;

    for (int port = PORT_START; port <= PORT_END; ++port) {
        SOCKET s = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
        if (s == INVALID_SOCKET) continue;

        BOOL exclusive = TRUE;
        setsockopt(s, SOL_SOCKET, SO_EXCLUSIVEADDRUSE,
                   (const char*)&exclusive, sizeof(exclusive));

        sockaddr_in addr;
        ZeroMemory(&addr, sizeof(addr));
        addr.sin_family = AF_INET;
        addr.sin_addr.s_addr = inet_addr("127.0.0.1");
        addr.sin_port = htons((u_short)port);

        bool bound = (bind(s, (sockaddr*)&addr, sizeof(addr)) == 0);
        if (bound && listen(s, SOMAXCONN) == 0) {
            listenSock = s;
            usedPort = port;
            break;
        }
        closesocket(s);
    }

    if (listenSock == INVALID_SOCKET) {
        WSACleanup();
        return 1;
    }

    WriteTextFile(g_exeDir + L"\\service_port.txt", std::to_string(usedPort));

    for (;;) {
        SOCKET client = accept(listenSock, NULL, NULL);
        if (client == INVALID_SOCKET) {
            Sleep(30);
            continue;
        }

        HANDLE h = CreateThread(NULL, 0, ClientThread,
                                (LPVOID)(UINT_PTR)client, 0, NULL);
        if (h) {
            CloseHandle(h);
        } else {
            HandleClient(client);
        }
    }

    closesocket(listenSock);
    WSACleanup();
    return 0;
}

int WINAPI WinMain(HINSTANCE, HINSTANCE, LPSTR, int)
{
    HANDLE mutex = CreateMutexW(NULL, TRUE, L"Local\\ClassLocalDataService");
    if (mutex && GetLastError() == ERROR_ALREADY_EXISTS) {
        return 0;
    }

    int code = RunServer();

    if (mutex) CloseHandle(mutex);
    return code;
}