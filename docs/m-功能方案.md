# 在线音乐搜索 / 本地歌单 · 可行性分析与落地记录

> 分析对象：本仓库现有听歌功能（`js/features/m_player.js`、`js/features/store.js`、`index.html`）
> 与 [guohuiyuan/go-music-dl](https://github.com/guohuiyuan/go-music-dl)（已克隆到本地逐文件阅读，11 MB / 414 commits / AGPL-3.0）
>
> 前半部分是可行性分析，最后一节是最终落地结果。

---

## 落地结果（最终实现的取舍）

分析阶段给出的方案在实施时做了几处调整，先列在这里，细节见后文：

| 议题 | 原方案 | 最终采用 | 原因 |
|------|--------|----------|------|
| 怎么编译 exe | 本机装 Go | **GitHub Actions 自动编译** | 本机磁盘只剩 0.8 GB，装不下 Go 工具链；使用者也不需要装任何运行时 |
| 依赖版本 | 固定到 commit `2c1cefe` | 固定到 tag **`v1.1.3`** | `goproxy.cn` 对该仓库返回 `temporarily unavailable`，proxy.golang.org 只认 tag 不认未缓存的 commit |
| 歌单落盘位置 | `data/music/<歌单>/<歌>/` | **`data/m/<歌单>/<歌>/`** | 按命名约定，新增目录不出现 `music` 字样 |
| 文件名 | `music-server/`、`modal_music.js` | `m-server/`、`m_player.js` | 同上 |
| 默认音源 | 含咪咕 | **不含咪咕、汽水、B站** | 咪咕/汽水音频加密，必须整段下载才能播，首播延迟高；需要时可在界面手动开启 |

新增文件：

```
m-server/                      Go 源码（AGPL-3.0）
.github/workflows/build.yml    自动编译 m-server.exe
js/features/m_player.js        播放器（原 modal_music.js 改名 + 改造）
js/features/m_online.js        搜索、解析、换源
js/features/m_library.js       歌单管理
docs/m-功能方案.md             本文
```

---

## 0. 一句话结论

**可行，而且比预想的容易。** go-music-dl 的 `core` 包已经把「多源搜索 / 取音频直链 / 取歌词 / 取封面 / 换源匹配 / 带 Range 的流式代理」全部封装成了可直接调用的函数，前端只需要对接一层自定义 JSON 协议。

**唯一的结构性代价：必须新增一个本地 Go 伴生进程（约 15–20 MB 的 exe）。**

原因：网站是纯静态的（GitHub Pages + `LocalDataServer.exe`），而所有音乐源都有防盗链（需要特定 `Referer`/`User-Agent`）、部分源返回加密音频（咪咕 Z3D、汽水）、浏览器又不允许前端改 `Referer`。这些只能在服务端做。**没有 exe 就没有在线搜索**——这是物理约束，不是实现取舍。

---

## 1. 已阅读的代码

### 1.1 本地站点

| 文件 | 行数 | 读到的关键事实 |
|------|------|----------------|
| `js/features/modal_music.js` | 1316 | 播放内核、LRC 解析、目录树扁平化、播放模式、定时关闭、输出设备 |
| `js/features/store.js` | 908 | 数据集模型、防抖写盘、回读校验、跨窗口轮询、掉线补写 |
| `index.html` | 656–766 | 音乐模态框 DOM 结构 |
| `readme.md` | — | 音乐章节、本地服务 API 表 |
| `css/style.css` | 395–460 | `music-*` 样式体系 |

### 1.2 go-music-dl

| 文件 | 作用 |
|------|------|
| `cmd/search-server/main.go` | **最小的 JSON 搜索服务示例**（正是我们要的骨架） |
| `core/service.go` (1807 行) | 音源工厂、取流、取词、Range 代理、音频签名识别、相似度算法、ID3 写入 |
| `core/download.go` (328 行) | 完整下载流程：取流 → 验签 → 取词 → 取封面 → 内嵌元数据 → 原子落盘 |
| `core/media_tools.go` | ffmpeg/ffprobe 探测（可选依赖） |
| `internal/web/music.go` (55 KB) | `/search` `/download` `/lyric` `/cover_proxy` `/inspect` **`/switch_source`** |
| `internal/web/lyrics_format.go` | 歌词格式判别（逐字 karaoke / 逐行 line） |
| `internal/web/local_music.go` | 本地曲库索引、封面写入、自动缓存 |
| 依赖 `github.com/guohuiyuan/music-lib` | 12 个音源的实际实现 |

---

## 2. 现有听歌功能的骨架（改造必须迁就的现实）

```
LocalDataServer /api/music/tree
        ↓  flattenTree()  ← 目录结构决定歌曲列表
   S.songs[]  （纯数组，靠 S.index 驱动）
        ↓  playIndex(i)
audio.src = /api/music/media?path=<相对路径>
        ↓
fetch 歌词 → parseLRC → syncLyric → 接管首页金句
```

四个硬约束：

1. **`S.songs` 是纯数组 + 索引**。上一首/下一首/随机/单曲循环全部基于 `S.index` 做算术。在线歌曲不能靠「伪造一个 path」混进去，必须先把队列项抽象成 `{ kind: 'local' | 'online' }`。
2. **封面和歌词都是「相对 `data/music` 的路径」**，统一走 `mediaUrl()` 拼 URL。在线歌曲没有本地路径，需要让 `mediaUrl()` 认识 `http(s)://` 与 `blob:`。
3. **歌曲树完全由目录推导**：单个音频的文件夹用文件夹名当歌名，封面按 `cover/folder/front/album/封面` 前缀优先级挑选。
4. **播放时接管首页金句区**，停止后恢复轮播——这条逻辑要保持不动。

好消息：第 3 条反过来是我们的**免费红利**——只要把下载的歌按 `data/music/<歌单名>/` 放好，现有播放器不用改一行就能看到它们。

---

## 3. go-music-dl 源码分析

### 3.1 关键 API（`core` 包，可直接调用）

| 函数 | 用途 | 我们要用它做什么 |
|------|------|------------------|
| `GetSearchFunc(source) func(string) ([]model.Song, error)` | 单源搜索 | 多源并发搜索 |
| `GetDownloadFunc(source) func(*model.Song) (string, error)` | 拿音频**直链** | 试听代理 / 下载 |
| `GetLyricFunc(source) func(*model.Song) (string, error)` | 拿 LRC 文本 | 歌词 |
| `FetchBytesWithMime(url, source) ([]byte, string, error)` | 带正确 Header 抓字节 | 抓封面、小文件 |
| `BuildSourceRequest(method, url, source, range)` | 造带 Referer/UA/Cookie 的请求 | 流式代理 |
| `NewSourceRangeFetch(url, source, range)` | **分块 Range 代理** | 拖动进度条 seek |
| `DetectAudioExtBySignature([]byte)` | 魔数识别 | 音频乱码检测 |
| `ValidatePlayable(*model.Song)` | 探测是否真能播 | 换源候选筛选 |
| `DownloadSongDataWithTemplate(...)` | 取流+取词+封面+内嵌 ID3 | 「加入歌单」的现成实现 |
| `CalcSongSimilarity(name, artist, candName, candArtist)` | 0.7×歌名 + 0.3×歌手 | 换源匹配打分 |
| `IsDurationClose(a, b)` | 时长差 ≤10s 或 ≤15% | 换源时长校验 |
| `NormalizeText` / `SimilarityScore` / `LevenshteinDistance` | 文本归一化与编辑距离 | 同上 |

### 3.2 三块直接能用的现成积木

**(1) `cmd/search-server/main.go` —— 这就是我们的服务骨架**

它做的事和我们要的几乎一模一样：监听 `127.0.0.1:0`、打印端口、`core.CM.Load()`、对每个源 `go fn(keyword)` 并发搜索、加 `Access-Control-Allow-Origin: *`、返回 JSON。改造成我们的 API 只需在这基础上加取流/歌词/封面/下载几个 handler。

**(2) `NewSourceRangeFetch` —— 解决「在线听歌能拖进度条」**

内部逻辑：先发 `Range: bytes=0-3` 探 4 个字节 → 拿 `Content-Range` 总长度 → 用魔数判断真实格式 → 然后**分块并发拉取**（首块 32 KB 快速起播，之后每块 256 KB，最多 16 并发）→ 边拉边写响应。

这解决了两个坑：① 上游若只支持 Range，浏览器 `<audio>` 直连会因 CORS/Referer 失败；② 单连接慢，分块并发明显更快。若上游不支持 Range（不返回 206），函数会返回 `handled=false`，此时退化为普通转发（不能 seek，可接受）。

**(3) `findBestSwitchSong` —— 换源算法已经写好了**

```
候选源 = 默认源 + 全部源，排除当前源与不可用源
  ↓ 对每个源并发搜索（6s 超时，失败则只用歌名再搜一次）
  ↓ 打分 CalcSongSimilarity（歌名 0.7 + 歌手 0.3），记录时长差
  ↓ 排序：分数降序，同分比时长差
  ↓ 高置信捷径：score ≥ 0.98 且时长差 ≤ 3s → 立刻 ValidatePlayable，通过就直接用，不等其它源
  ↓ 否则取前 12 个候选，6 并发逐个 ValidatePlayable（真发一次 Range 请求看是否 200/206）
  ↓ 返回第一个能播的；全挂 → 报 "no playable match"
```

阈值常量：`switchHighConfidenceScore = 0.98`、`switchMaxCandidatesPerSource = 8`、`switchParallelValidationLimit = 12`、`switchParallelValidationParallel = 6`。这些参数可以直接沿用。

### 3.3 音源能力（README 表格 + 实测约束）

| 音源 | 搜索 | 下载 | 歌词 | 备注 |
|------|------|------|------|------|
| `netease` 网易云 | ✅ | ✅ | ✅ | 支持 FLAC 无损 |
| `qq` QQ音乐 | ✅ | ✅ | ✅ | **下载必须 Cookie**，否则拿不到直链 |
| `kugou` 酷狗 | ✅ | ✅ | ✅ | 普通歌曲可 FLAC |
| `kuwo` 酷我 | ✅ | ✅ | ✅ | 稳定，适合做兜底源 |
| `migu` 咪咕 | ✅ | ✅ | ✅ | 音频加密（Z3D），`core` 已实现解密 |
| `qianqian` 千千 | ✅ | ✅ | ✅ | 可用 |
| `soda` 汽水 | ✅ | ✅ | ✅ | 会员整曲需签名器；无签名器时**只给试听片段** |
| `bilibili` | ✅ | ✅ | ✅ | 需要 Referer（`core` 已处理） |
| `apple` | ✅ | ⚠️ | ✅ | 只有 30s preview，**不适合做主力** |
| `fivesing` / `jamendo` / `joox` | ✅ | ✅ | ✅ | 内容偏小众 |

**默认集合建议**：`netease, qq, kugou, kuwo, migu, qianqian`（与上游 `GetDefaultSourceNames()` 一致，已自动排除 bilibili/joox/jamendo/fivesing）。汽水因为「无签名器只有试听片段」，建议作为**可选**而非默认——否则会大量触发质量校验失败，白白增加换源开销。

### 3.4 依赖与体积

`core` 包的 import 全清单（已逐个文件核对）：

- 标准库
- `github.com/guohuiyuan/music-lib/*`（12 个音源）
- `gorm.io/gorm` + `github.com/glebarez/sqlite`（**纯 Go 实现，不需要 CGO**，用于存 Cookie/设置）
- `github.com/dhowden/tag`（读 ID3）
- `github.com/liuzl/gocc`（繁简转换）、`golang.org/x/text`

**关键结论：`core` 不依赖 `gioui.org` / `webview` / `gin`。** 桌面端那堆重依赖只属于 `desktop_*` 和 `internal/web`。我们只 import `core` + 标准库 `net/http`，交叉编译出来的 exe 预估 **12–20 MB**（`-ldflags="-s -w"` 之后），比 `LocalDataServer.exe` 的 664 KB 大，但对一体机无压力。

`ffmpeg` 只在两处用到：① 本地音乐探测；② flac/m4a/wma 的元数据内嵌。**mp3 的 ID3v2.3 是纯 Go 手写字节**（`embedMP3ID3v23Metadata`），不需要 ffmpeg。我们的方案是「音频 / 封面 / 歌词三件套分开存文件」，压根不需要内嵌，所以 **ffmpeg 完全可以不装**。

### 3.5 构建前置条件（当前不满足）

- 本机 **没有安装 Go**（`go version` → command not found）。
- `go.mod` 要求 **Go 1.25.1+**。
- 需要下载 `go1.25.x.windows-amd64.zip`（约 80 MB，go.dev 可达），解压到项目外的目录，不污染系统环境。
- 首次 `go mod download` 要拉 20+ 个模块。`proxy.golang.org` 与 `goproxy.cn` 均实测可达。

---

## 4. 三种架构方案对比

| 方案 | 做法 | 结论 |
|------|------|------|
| **A. 本地伴生进程（推荐）** | 新增 `MusicServer.exe`，与 `LocalDataServer.exe` 并列，页面探测端口 | ✅ 保持纯静态站点、无需公网服务器、数据不出本机、断网也能放本地歌 |
| B. 公网后端 | 部署一台服务器做代理 | ❌ 流量与版权风险极高；违背「班级一体机离线可用」的定位；等于给别人搭盗版站 |
| C. 直接用 `music-dl web` 模式 | 跑官方预编译版，前端对接它的接口 | ❌ `/search` 返回的是 **HTML 页面**不是 JSON（`renderIndex`），得解析 DOM；而且它强制首次 `setup` 建管理员账号、带完整登录态，等于把一整套无关的 Web UI 塞进班牌 |

**为什么不能直接改 `LocalDataServer.exe`**：仓库里只有编译好的 exe（664 KB），**没有 Go 源码**。虽然它的 `/api/data/{name}` 不校验数据名（可以白嫖存 `musicLibrary.json`），但它没有「往 `data/music/` 写文件」的接口。所以下载落盘只能由新进程做。

**端口规划**：`LocalDataServer` 占 17632–17641。新服务用 **17650**，页面按 `17650 → 17659` 顺序探测（和现有 `_probe()` 同一套路，`/api/ping` 返回 `{"service":"class-music-online"}` 做身份校验，避免误连）。

---

## 5. 推荐架构

```
┌──────────────────────────────┐
│ 浏览器 index.html (github.io │
│ 或 file://)                  │
│  ├ 本地列表 ← 现有 tree API  │
│  ├ 搜索页   ← 新 /api/search │
│  └ 歌单页   ← musicLibrary   │
└───────┬──────────────┬───────┘
        │ :17632       │ :17650
        ▼              ▼
┌───────────────┐  ┌──────────────────────────┐
│LocalDataServer│  │ MusicServer.exe (新)     │
│ 读/写 data/*.json│ │  · 多源并发搜索          │
│ 扫 data/music │  │  · Range 流式代理        │
│ Range 播放    │  │  · 质量校验 + 换源       │
└───────┬───────┘  │  · 下载三件套落盘        │
        │          └───────────┬──────────────┘
        ▼                      ▼ HTTPS
   data/music/<歌单>/     网易云/QQ/酷狗/酷我/咪咕/千千
   ├ 歌名 - 歌手.mp3
   ├ cover.jpg
   └ 歌名 - 歌手.lrc
```

### 5.1 新增 API（全部返回 JSON，全部带 `Access-Control-Allow-Origin: *`）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/ping` | `{service:"class-music-online", version, sources:[...]}` |
| GET | `/api/search?q=&sources=&limit=` | 多源并发搜索，统一结构，**按源分组返回** |
| POST | `/api/resolve` | 入参一个 song 对象 → 出参 `{streamId, ext, duration, quality:{audio,lyric,cover}, warnings[]}` |
| GET | `/api/stream?sid=` | Range 透传（不落盘） |
| GET | `/api/lyric?song=` | LRC 文本 |
| GET | `/api/cover?song=` | 图片字节（带内存缓存） |
| POST | `/api/library/add` | 下载三件套到 `data/music/<歌单>/` |
| POST | `/api/library/remove` | 删除文件（走回收站更稳，或先改名 `.trash`） |
| GET | `/api/library/verify` | 巡检本地歌单文件完整性 |

> `/api/search` 建议支持**流式返回**（SSE 或分块 JSON）：6 个源并发，快的 300 ms 就回，慢的要 3 s。等齐再返回会让搜索框卡 3 秒。做法：每个源一有结果就 `flush` 一段，前端边收边渲染。

### 5.2 「临时缓存」策略（在线试听）

| 类型 | 策略 | 落盘？ |
|------|------|--------|
| 音频 | **直通流式**，服务端只保留 512 KB ring buffer 做中转；切歌/停止即释放 | ❌ 完全不落盘 |
| 封面 | 进程内 `map[coverURL][]byte` + LRU，上限 20 张 / 8 MB | ❌ |
| 歌词 | 进程内 `map[songKey]string`，上限 30 首，当前歌 + 预取下一首 | ❌ |
| 上游不支持 Range 时 | 整段读进内存（> 30 MB 直接放弃并换源），播完释放 | ❌ |

**这样「用完就删」变成「从来不存在」——比删临时文件更彻底。** 唯一代价：每次拖动进度条都要重新向上游请求那一段（有 Range 代理后体验可接受）。

若你更想要「整曲缓存到临时目录、切歌删除」的稳妥方案，也做得到（`%TEMP%\ycyz-music\`，退出/切歌/超 1 小时清理），但会引入「异常退出残留」的清理负担。**建议先用纯流式，实测卡顿再降级。**

---

## 6. 质量校验与换源（核心难点）

### 6.1 三级校验

**音频**

| 检查项 | 判定 |
|--------|------|
| 魔数（首 64 KB） | `ID3` / `fLaC` / `OggS` / `ftyp`@4 / `RIFF…WAVE` / WMA GUID → 通过 |
| 反例特征 | `<html`、`<!DOCTYPE`、`{"code"`、全 0、纯空白 → 乱码/错误页 |
| Content-Type 与魔数一致 | 不一致以魔数为准，不一致本身扣分 |
| 时长一致性 | `Content-Length × 8 ÷ 码率` 推算时长 vs 元数据 `duration`，偏差 > 20% → 疑似**试听片段**（汽水/Apple 常见） |
| 浏览器终审 | 播放前用 `AudioContext.decodeAudioData()` 试解首 256 KB（可选，异步不阻塞） |

**歌词**

| 检查项 | 判定 |
|--------|------|
| 空 / 只有 `[ti:]` `[ar:]` 标签行 | 不合格 |
| 无任何 `[mm:ss.xx]` 时间轴 | 不合格 |
| 有效歌词行 < 3 行 | 不合格 |
| 含 HTML 标签 / JSON 结构 | 不合格 |
| 非 UTF-8 编码 | 尝试 GBK→UTF-8 转码后复检 |
| 逐字（karaoke）格式 | 加分项（现有 `parseLRC` 已支持） |

**封面**

| 检查项 | 判定 |
|--------|------|
| 魔数 | `FFD8FF`(JPEG) / `89504E47`(PNG) / `RIFF…WEBP` / `GIF8` |
| 长度 | < 1 KB → 不合格 |
| 可解码 | Go 侧 `image.DecodeConfig` 能读出宽高，且 W,H ≥ 100 |
| 反例 | 返回的是 HTML 错误页 / 纯色占位图 |

### 6.2 综合评分与决策

```
score = 100
      − 音频不合格        −100（直接否决）
      − 歌词缺失          −25
      − 歌词仅 1~2 行     −15
      − 封面缺失/损坏     −10
      − 时长偏差 > 20%    −40
      − 码率 < 96 kbps    −10
```

- `score ≥ 70` → 直接用
- `40 ≤ score < 70` → 先换源试一次；换不到更好的就用它，并附 `warnings`
- `score < 40` → 强制换源；全部源都 < 40 → **选分最高的那个**，前端明确提示「当前音源音质较低 / 歌词缺失」

### 6.3 换源触发时机

1. **播放前**：`/api/resolve` 里做一次 Range 探测（约 200 ms），不合格立刻换源，用户无感。
2. **播放中**：`audio` 的 `error` / `stalled` 超过 8 s → 自动换源续播，**保持 `currentTime`**（换源成功后 `audio.currentTime = 原位置`）。
3. **加入歌单后**：落盘完成再复检一遍文件（防止「下载时正常、写盘损坏」）。

### 6.4 复用上游算法

`findBestSwitchSong` 的整体流程可原样搬过来，只需把「返回 song」改成「返回 song + 评分 + 换源链路」，便于前端展示「已从网易云切换到酷我」。

---

## 7. 本地歌单

### 7.1 数据模型（新增一个 Store 数据集，**不需要重编译 `LocalDataServer.exe`**）

`store.js` 的 `defaults` 加一项即可，服务端不校验数据名：

```js
musicLibrary: {
  version: 1,
  playlists: [{
    id: 'pl_xxx',
    name: '晚自习',
    createdAt: 1761...,
    songs: [{
      key: 'netease:1234567',      // 去重键
      source: 'netease', id: '1234567',
      name: '晴天', artist: '周杰伦', album: '叶惠美',
      duration: 269,
      audio: '晚自习/晴天 - 周杰伦.mp3',   // 相对 data/music
      cover: '晚自习/cover.jpg',
      lyric: '晚自习/晴天 - 周杰伦.lrc',
      addedAt: 1761...,
      quality: { audio: 92, lyric: 100, cover: 100, warnings: [] }
    }]
  }]
}
```

### 7.2 落盘布局（关键设计）

```
data/music/
└── 晚自习/                      ← 歌单名 = 文件夹名
    ├── 晴天 - 周杰伦.mp3
    ├── 晴天 - 周杰伦.lrc
    └── cover.jpg               ← 多首共用一张？不行，会被 pickCover 混用
```

⚠️ 注意：现有 `flattenTree` 的规则是「**同一文件夹里的所有音频共用一个封面和一个歌词**」。所以：

- **歌单文件夹里只能放一首歌**，否则封面/歌词会串。
- 因此布局改为**每首歌一个子文件夹**：`data/music/晚自习/晴天 - 周杰伦/{audio.mp3, cover.jpg, lyric.lrc}`。
  现有逻辑里「单音频文件夹 → 用文件夹名当歌名」，正好显示成「晴天 - 周杰伦」，完美适配。
- 或者更干净：**歌单名做二级目录、每首歌做三级目录**，即 `data/music/歌单/歌曲/`。

这是本次方案里唯一需要「顺着老代码的怪癖走」的地方，但换来的是**零改动兼容现有播放器**。

### 7.3 下载的原子性与失败回滚

沿用 `saveDownloadedSongToFile` 的做法：写 `.musicdl-*.part` 临时文件 → `Sync()` → `Rename()`。中途失败不会留下半截文件被扫描成「坏歌」。

### 7.4 歌单管理功能

新建 / 重命名 / 删除 / 排序 / 移除单曲 / 整单下载 / 一键校验（`/api/library/verify` 扫一遍，标出坏文件并提供「重新下载」）。

---

## 8. 前端改造清单

| 文件 | 改动 |
|------|------|
| `js/features/m_player.js`（原 `modal_music.js` 改名） | 队列项抽象成 `{kind:'local'\|'m'}`；`mediaUrl()` 支持 http/blob；`playIndex` 分派；新增 tab 切换 |
| `js/features/m_online.js`（新） | 搜索、resolve、流式播放会话、换源续播、封面/歌词内存缓存 |
| `js/features/m_library.js`（新） | 歌单 CRUD、加入歌单、校验 |
| `index.html` | tab 栏 + 搜索面板 + 歌单面板 DOM（约 40 行） |
| `css/style.css` | 约 75 行新样式（复用 `music-*` 变量，保持主题色） |
| `js/features/store.js` | `defaults` 加 `musicLibrary` |
| `js/features/main.js` | 注册两个新模块 |
| `readme.md` | 更新音乐章节、API 表、exe 使用说明 |

UI 建议：模态框顶部加 `本地 | 搜索 | 歌单` 三个 tab，播放条完全不动（现有播放条已经足够）。

---

## 9. 风险与限制

| 风险 | 影响 | 应对 |
|------|------|------|
| **本机无 Go 环境** | 无法编译 exe | 下载 go1.25.x zip 解压到项目外；或提供「下载预编译 exe」的说明 |
| **音源接口漂移** | 某天某个源突然全挂（平台改接口/加风控） | 多源 + 换源天然容错；sidecar 保留 `go.mod`，`go get -u music-lib` 即可修 |
| **QQ 必须 Cookie** | 不配 Cookie 时 QQ 源取不到直链 | 默认源里把 QQ 放后面；提供 Cookie 配置入口（写进 sidecar 的 sqlite） |
| **汽水无签名器只有试听** | 大量 30s 片段 | 默认不启用汽水 |
| **AGPL-3.0 许可证** | go-music-dl 是强传染性协议 | 若 sidecar 源码进仓库，**必须**保留 AGPL 声明与 LICENSE；且因是本地进程、不对外提供网络服务，不触发「网络交互须开源」条款。最稳妥：sidecar 独立子目录 + 独立 `go.mod` + 原样保留 LICENSE 与出处 |
| **版权合规** | 下载受版权保护的音源 | 定位为班级内网 / 个人学习；不做公网下载服务；UI 上不提供「批量扒全站」类功能 |
| **一体机性能** | 希沃机型内存小 | exe 常驻 30–60 MB，需实测；可加 `-ldflags` 瘦身、关闭并发预取 |
| **首次搜索慢** | 6 源并发最慢 3 s | 分源流式返回，先到先渲染 |
| **file:// 下 Origin 为 null** | 跨域 | 服务端统一 `Access-Control-Allow-Origin: *`，不带 credentials |
| **`127.0.0.1` 混内容** | https 页面加载 http 资源 | `127.0.0.1` / `localhost` 属「potentially trustworthy origin」，浏览器不会当混合内容拦截，已确认可行 |

---

## 10. 实施阶段（按依赖顺序，不含时间估算）

| 阶段 | 内容 | 验收标准 |
|------|------|----------|
| **P0 环境与骨架** | 装 Go、拉依赖、把 `cmd/search-server` 改造成 `cmd/class-music-server`、编译出 exe、页面探测端口 | 浏览器访问 `/api/ping` 通；`/api/search?q=晴天` 返回 JSON |
| **P1 搜索与试听** | 搜索 UI、`/api/resolve`、`/api/stream` Range 代理、封面/歌词、接入现有播放条 | 搜到就能点播、能拖进度条、歌词同步、首页金句接管 |
| **P2 质量校验与换源** | 三级校验、评分、`/switch_source` 逻辑、播放中故障自动续播 | 故意构造坏源，能看到自动切换与 warnings 提示 |
| **P3 本地歌单** | `musicLibrary` 数据集、`/api/library/add` 三件套落盘、歌单 CRUD UI、与现有树打通 | 加入歌单后重启页面，本地 tab 里能看到并能播 |
| **P4 打磨** | 分源流式渲染、去重、批量、校验巡检、readme | — |

---

## 11. 需要你拍板的 5 件事

1. **是否接受「多一个 exe」？** 这是保持纯静态站点、又能在线搜索的唯一路径。如果不能接受，就只能放弃在线搜索（或退化为「粘贴链接解析」——那也需要后端）。
2. **临时缓存策略**：纯流式不落盘（推荐）／ 允许 `%TEMP%` 临时文件。
3. **默认音源集合**：建议 `netease, qq, kugou, kuwo, migu, qianqian`，汽水/Apple/B站 作为可选开关。
4. **歌单落盘路径**：`data/music/<歌单名>/<歌名 - 歌手>/`（推荐，零改动兼容现有播放器）。
5. **sidecar 源码是否进仓库**：进（AGPL 合规、可维护）／ 只放编译好的 exe（体积小，但合规与维护都吃亏）。
