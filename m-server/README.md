# m-server

本地伴生服务，给页面的「搜索 / 歌单」两个标签页提供后端能力。

没有它，本地播放和原有功能照常工作；在线搜索、在线试听、保存到本地歌单不可用。

## 使用者：不需要装任何东西

到仓库的 **Releases** 页面下载 `m-server.exe`，放到 `LocalDataServer.exe` 同一个目录，双击运行即可。

- 不需要安装 Go、Node 或任何运行时
- 不需要联网安装依赖，exe 是单文件静态编译
- **静默启动**，不弹命令行窗口（编译时带 `-H windowsgui`）
- 首次运行会在同级目录建 `data/m/` 用来存歌单与已下载的歌曲
- 日志写到同目录的 `m-server.log`

启动后不会有任何可见窗口。想确认它活着，看 `m-server.log`：

```
[m] 17:33:24 m-server 1.0.0 启动
[m] 17:33:24 日志级别=info（M_LOG=debug 可开启详细日志）
[m] 17:33:24 已启动 http://127.0.0.1:17650
[m] 17:33:24 数据目录 D:\EClassDisplay\data\m
[m] 17:33:24 日志文件 D:\EClassDisplay\m-server.log
```

端口从 `17650` 开始找，被占用就依次往后试到 `17659`。页面会自动探测，不用手工配置。

**停止**：任务管理器里结束 `m-server.exe`，或命令行执行：

```bash
taskkill /IM m-server.exe /F
```

## 日志

| 项 | 说明 |
|---|---|
| 位置 | 与 `m-server.exe` 同级的 `m-server.log` |
| 轮转 | 启动时超过 4MB 就把旧文件转存为 `m-server.log.old`，只保留一份 |
| 级别 | 默认 `info`；设环境变量 `M_LOG=debug` 输出每次请求的详细过程，`M_LOG=warn` 只留问题 |
| 控制台 | 从终端手动启动时日志同时打到 stderr，双击启动则只写文件 |

排查网络问题时建议先开 `M_LOG=debug` 复现一次，日志里会带上每个音源的耗时和失败原因分类（超时 / DNS / TLS / 403 等）。

## 维护者：怎么编译

仓库已配好 GitHub Actions（`.github/workflows/build.yml`），**本机不需要装 Go**：

1. 修改 `m-server/` 下的代码
2. push 到 `main`，Actions 自动编译并上传产物 `m-server-exe`
3. 打 tag 时自动附到 Release

想在本地编译才需要 Go 1.25+：

```bash
cd m-server
go get github.com/guohuiyuan/go-music-dl@v1.1.3
go mod tidy
go build -trimpath -ldflags "-s -w -H windowsgui" -o ../m-server.exe .
```

`-H windowsgui` 就是「静默启动」的来源：去掉它编译出来的 exe 会带一个命令行窗口，日志也只打控制台。

依赖版本固定在 `v1.1.3`，避免上游改动导致行为漂移。

> 国内网络如果 `proxy.golang.org` 取不到该模块，可换 `GOPROXY=https://goproxy.io,direct`。
> `goproxy.cn` 对该仓库会返回 `temporarily unavailable`，不要用。

## 数据布局

```
data/m/
├── library.json          歌单与歌曲元数据
├── cookies.json          可选，各平台 Cookie
├── prefs.json            音源分配（音频 / 歌词 / 封面）
├── proxy.json            可选，网络兜底代理
└── <歌单名>/
    └── <歌名 - 歌手>/
        ├── audio.mp3     音频（扩展名按实际格式）
        ├── cover.jpg     封面
        └── lyric.lrc     歌词
```

日志不在这里，在 exe 同级：`m-server.log`。

每首歌一个子文件夹，封面和歌词不会互相串。

## Cookie（可选）

部分平台（如 QQ 音乐）不配 Cookie 就拿不到音频地址。在 `data/m/cookies.json` 里写：

```json
{
  "netease": "MUSIC_U=...",
  "qq": "uin=...; qm_keyst=..."
}
```

重启服务生效。不配也能用其它音源。

## 接口

全部返回 JSON，全部带 `Access-Control-Allow-Origin: *`，只监听 `127.0.0.1`。

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/m/ping` | 探测服务 |
| GET | `/api/m/sources` | 音源列表 |
| GET | `/api/m/search?q=&sources=&limit=` | 多源并发搜索 |
| GET | `/api/m/resolve?id=&source=&...` | 解析 + 质量校验 + 自动换源 |
| GET | `/api/m/switch?id=&source=&name=&artist=` | 手动换源 |
| GET | `/api/m/stream?sid=` | 音频流（支持 Range） |
| GET | `/api/m/lyric?...` | 歌词文本 |
| GET | `/api/m/cover?url=&source=` | 封面图 |
| GET | `/api/m/media?path=` | 歌单里的本地文件 |
| GET | `/api/m/library` | 读歌单 |
| POST | `/api/m/library/playlist` | 新建 / 改名 / 删除 / 排序 |
| POST | `/api/m/library/add` | 下载三件套并入歌单 |
| POST | `/api/m/library/remove` | 移出歌单 |
| POST | `/api/m/library/verify` | 巡检本地文件 |
| GET | `/api/m/prefs` | 读音源分配 |
| POST | `/api/m/prefs` | 改音源分配 |
| GET | `/api/m/net` | 网络兜底状态（每个域名当前用的策略） |

## 音源分配

音频、歌词、封面可以各自指定来源，存在 `data/m/prefs.json`：

```json
{
  "audio": "bilibili",
  "lyric": "migu",
  "cover": "migu"
}
```

值为 `auto` 表示跟随音频源。跨源找歌按「歌名 + 歌手 + 时长」算相似度，低于 0.55 就回退原源；结果缓存 15 分钟。

## 网络自适应

有些网络只放行 443、掐掉 80，而部分音源接口是明文 HTTP。服务启动后会先自检三件事，再据此生成策略链：

| 自检 | 判定 | 结果 |
|---|---|---|
| IPv6 | 连一次 v6 地址，1.5s 内不通就判为不可用 | 只用 IPv4 拨号 |
| DNS | 解析 `music.163.com`，失败则依次试 4 个公共 DNS | 自动换 DNS |
| 代理 | 扫本机 7890 / 10809 / 1080 / 8080 等常见端口 | 探到的才纳入 |

策略链形如：

```
direct → direct+https → dns → dns+https → nokeep → proxy1
```

- 某条走通后按域名记住 10 分钟，之后直接走它
- 全部失败熔断该域名 90 秒，避免每次搜索白等
- 空响应 / 返回网页 / 5xx 视为失败，继续换下一条
- 自检结论和当前策略链会打进 `m-server.log`，也可以 `GET /api/m/net` 查看

需要强制指定时仍可用环境变量：

| 变量 | 作用 |
|---|---|
| `M_FORCE_IPV4=1` | 强制只走 IPv4（`=0` 表示强制允许 v6） |
| `M_DNS=223.5.5.5` | 指定 DNS，跳过自检 |
| `M_PROXY=http://127.0.0.1:7890` | 指定代理，跳过端口扫描 |
| `M_LOG=debug` | 打出每次请求用了哪条策略、失败在哪一步 |

也可以把代理写进 `data/m/proxy.json`：`{"enable": true, "proxies": ["socks5://127.0.0.1:1080"]}`。

> 兜底依赖库使用默认的 `http.Transport`。如果上游库自建了 Transport，这一层会被绕过。

## 质量校验

播放前和下载前都会做三级校验，不合格就换源：

- **音频**：魔数（ID3 / fLaC / OggS / ftyp / RIFF / WMA）、是否误返回网页、码率与标称时长是否匹配（识别试听片段）
- **歌词**：是否为空、有没有时间轴、有效行数、是否误返回网页、非 UTF-8 自动按 GBK 解码
- **封面**：魔数、文件大小、能否解码、尺寸

综合评分 100 分制：音频不合格直接否决（0 分），歌词缺失 −25，封面缺失 −10，时长明显不符 −45。

- ≥ 70 直接用
- 45~69 尝试换源一次，换不到就用它并附警告
- < 45 强制换源；所有源都差就取分最高的，并在界面上说明问题

## 隐私

- 在线试听的音频**不落盘**，只在内存里中转，切歌即释放
- 封面、歌词只在内存里缓存（上限 64 项，90 分钟过期）
- 只有点了「加入歌单」才会写文件到 `data/m/`
- 服务只监听 `127.0.0.1`，局域网内其它设备访问不到

## 许可

本目录整体适用 **AGPL-3.0**，详见 `LICENSE` 与 `NOTICE`。

仅供学习与技术交流，请勿用于商业用途，请勿公开部署为下载服务。
