可以把这个项目理解成一句话：

> `index.html` 是骨架，`css/style.css` 是皮肤，`js/data/*` 是默认数据，`js/features/*` 是功能模块，`store.js` 是本地持久化，`main.js` 是启动器。

下面按目录逐个文件说明职责。

---

## 一、根目录文件

| 文件 | 作用 | 关键点 |
|---|---|---|
| `index.html` | 网站主页面结构 | 定义所有 DOM 容器、按钮、模态框；按顺序引入 CSS 和 JS；内含 1920×1080 等比缩放脚本；默认隐藏 `#pageContent`，由 `main.js` 显示。 |
| `css/style.css` | 全站样式表 | 字体、背景、模态框、按钮、时间/作息面板、节气卡片、时间轴、每日 60s、金句、开关滑块、公告、通知、寻物、添加按钮、今日课表临时编辑、响应式布局。 |
| `LocalDataServer.exe` | 本地 HTTP 数据服务 | 提供 `/api/ping` 和 `/api/data/{name}` 读写接口，端口 `17632~17641`，让网页能直接读写本地磁盘数据。没有它时网站进入内存模式，修改不保存。 |
| `fonts/STZhongsong.ttf` | 中宋字体 | 被 `style.css` 的 `@font-face` 引用，用于标题、金句、通知等。 |
| `fonts/STKaiti.ttf` | 楷体字体 | 用于高考天数大标题。 |
| `fonts/STXingkai.ttf` | 行楷字体 | 用于“寻物”大标题。 |
| `images/立春.png` 等 24 张图 | 二十四节气配图 | 被 `js/data/solarterms.js` 引用，在节气卡片中显示。 |

---

## 二、`js/data/` 静态默认数据

这些文件提供网站内置的默认数据。  
`Store` 初始化时会优先尝试从本地服务读取数据；如果本地服务不可用，就用这里的默认数据。

| 文件 | 作用 | 关键内容 |
|---|---|---|
| `js/data/solarterms.js` | 二十四节气默认数据 | 定义 `solarTerms` 数组，每项包含 `name`、`month`、`day`、`color`、`image`、`desc`。`Timeline` 会再用寿星公式动态修正日期。 |
| `js/data/timetable.js` | 课表默认数据 | 定义 `timetable`，包含 `monday` 到 `friday`、`sunday` 的课程数组。另有 `timetable_last2`、`timetable_last` 是保留旧数据，当前未加载。 |
| `js/data/schedule.js` | 作息表默认数据 | 定义 `schedule`，包含 `weekday`、`friday`、`saturday`、`sunday` 的时间段和活动名。`schedule2`、`schedule_last` 是保留旧数据，当前未加载。 |
| `js/data/phrases.js` | 本地金句库 | 定义 `localPhrases`，分 `high`、`medium`、`low` 三档，对应 45%、35%、20% 展示权重。最后 `window.localPhrases = localPhrases` 暴露到全局。 |

---

## 三、`js/features/` 基础设施

| 文件 | 作用 | 关键点 |
|---|---|---|
| `js/features/00_state.js` | 全局状态和定时器句柄 | 定义 `App.State` 和 `App.Timers`。`App.State` 保存 `lastPhrase`、`intervalDuration`、`apiProbability`、`lostAndFoundFontSize`、`notifications`，并通过 getter/setter 桥接 `Store`。`App.Timers` 保存各模块定时器。 |
| `js/features/01_utils.js` | 通用工具函数 | 目前只提供 `timeToMinutes(time)`，把 `"HH:MM"` 或 `Date` 转成分钟数，供作息判断使用。 |
| `js/features/store.js` | 本地数据存储适配层 | 核心持久化模块。探测本地服务端口、加载默认数据、缓存数据、防抖写入、页面关闭前 `flush()`。管理 `settings`、`timetable`、`schedule`、`phrases`、`solarterms`、`lostfound`、`notifications`。控制右上角 `#serviceBanner` 提示。 |

---

## 四、`js/features/` 页面功能模块

| 文件 | 作用 | 关键点 |
|---|---|---|
| `js/features/clock.js` | 当前时间、日期、星期 | 每帧更新 `#currentDateTime`，内容为 `HH:MM:SS` 和 `YYYY/MM/DD 周X`。 |
| `js/features/weather.js` | 天气显示 | 先用 `ipwho.is` 获取经纬度和时区，再用 `open-meteo.com` 获取天气代码和温度，更新 `#weatherInfo`，每 60 秒刷新。 |
| `js/features/daily_image.js` | 每日 60s 图片 | 控制 `.right-image-container` 和 `#apiImage`。读取 `imageSwitch`，开启时加载图片并每 24 小时刷新；关闭时隐藏且不请求。有主备两个图片 API。 |
| `js/features/timeline.js` | 二十四节气时间轴 | 根据 `solarterms` 生成节气标记和详情卡片，计算进度条，点击标记显示卡片。用寿星公式动态计算当年节气日期。 |
| `js/features/exam_countdown.js` | 高考倒计时 | 目标日期 `2028-06-07`，计算剩余天数并写入 `#daysUntil`，每天更新一次。 |
| `js/features/school_schedule.js` | 作息与课表核心模块 | 计算当前活动、下节课、作息倒计时；渲染 `#todayTimetable`；支持今日课表临时覆盖；每秒刷新 `#currentSchedule`、`#nextSchedule`、`#countdownName`、`#countdownTimer`。 |
| `js/features/golden_phrase.js` | 金句轮播 | 从本地或联网获取金句，更新 `#goldenPhrase`。支持联网概率、轮播间隔、点击刷新、动画开关、API 权重和重试。联网失败自动回退本地金句。 |
| `js/features/auto_refresh.js` | 自动刷新页面 | 读取 `autoRefreshSwitch`，开启后 15 分钟执行一次 `location.reload()`。 |

---

## 五、`js/features/` 模态框模块

| 文件 | 作用 | 关键点 |
|---|---|---|
| `js/features/modal_core.js` | 模态框通用开关 | 绑定设置、更新日志、公告、寻物、通知的打开/关闭按钮；处理全屏按钮 `⛶ / 🗗`。金句选择弹窗由 `ModalPhrase` 单独处理。 |
| `js/features/modal_settings.js` | 设置面板逻辑 | 从 `Store` 同步设置到 DOM；绑定金句开关、图片开关、点击刷新、动画、自动刷新；绑定联网概率、轮播间隔、字号滑块和数字输入；提供 `resetProbability()` 和 `resetInterval()`。 |
| `js/features/modal_timetable.js` | 今日课表临时编辑 | 在设置面板中渲染今天课表输入框；保存到 `settings.temporaryTimetable`；只对当天生效；第二天自动恢复原始课表；支持“恢复原始课表”。 |
| `js/features/modal_lost_found.js` | 寻物功能 | 读取和保存 `lostfound` 数组；渲染“姓名 的 物品”；支持行内编辑、添加、删除二次确认；通过 `--laf-font-size` 控制整表字号。 |
| `js/features/modal_notification.js` | 通知功能 | 读取和保存 `notifications` 数组；支持添加、编辑、删除通知；支持 Enter 换行；字号保存到 `notificationFontSize`。 |
| `js/features/modal_phrase.js` | 金句选择弹窗 | 从 `Store` 或 `localPhrases` 读取金句，渲染 `#phraseList`；点击某条后调用 `GoldenPhrase.updateDisplay()` 显示，并关闭弹窗；若轮播开启则重启定时器。 |

---

## 六、启动文件

| 文件 | 作用 | 关键点 |
|---|---|---|
| `js/features/main.js` | 网站启动入口 | `window.onload` 后先 `await App.Store.init()`；然后用 `safeInit` 依次初始化 Clock、Weather、DailyImage、Timeline、ExamCountdown、SchoolSchedule、GoldenPhrase、AutoRefresh、各 Modal；最后显示 `#pageContent`；页面卸载时清理金句定时器并 `Store.flush()` 保存数据。 |

---

## 七、整体调用关系

```text
index.html
  ├─ 引入 css/style.css
  ├─ 引入 js/data/*.js            提供默认数据
  ├─ 引入 js/features/00_state.js 提供 App.State / App.Timers
  ├─ 引入 js/features/01_utils.js 提供时间工具
  ├─ 引入 js/features/store.js    提供本地持久化
  ├─ 引入 js/features/*.js        各功能模块
  └─ 引入 js/features/main.js     统一启动

Store.init()
  ├─ 探测 LocalDataServer.exe
  ├─ 加载 settings / timetable / schedule / phrases / solarterms / lostfound / notifications
  └─ 失败则使用 js/data/*.js 默认数据

各功能模块
  ├─ 从 Store 或全局默认数据读取
  ├─ 更新对应 DOM
  └─ 用户修改后写回 Store，再由 Store 保存到本地服务
```

---

## 八、一句话总结每个文件

- `index.html`：页面骨架和所有容器。
- `css/style.css`：全站外观和布局。
- `js/data/solarterms.js`：二十四节气默认数据。
- `js/data/timetable.js`：课表默认数据。
- `js/data/schedule.js`：作息表默认数据。
- `js/data/phrases.js`：本地金句库。
- `00_state.js`：全局状态和定时器。
- `01_utils.js`：时间工具。
- `store.js`：本地持久化核心。
- `clock.js`：时间日期显示。
- `weather.js`：天气显示。
- `daily_image.js`：每日 60s 图片。
- `timeline.js`：节气时间轴。
- `exam_countdown.js`：高考倒计时。
- `school_schedule.js`：作息、课表、倒计时核心。
- `golden_phrase.js`：金句轮播。
- `auto_refresh.js`：自动刷新。
- `modal_core.js`：模态框开关。
- `modal_settings.js`：设置面板。
- `modal_timetable.js`：今日课表临时编辑。
- `modal_lost_found.js`：寻物。
- `modal_notification.js`：通知。
- `modal_phrase.js`：金句选择。
- `main.js`：启动入口。
- `LocalDataServer.exe`：本地数据服务。
- `fonts/*`：字体资源。
- `images/*`：节气图片资源。