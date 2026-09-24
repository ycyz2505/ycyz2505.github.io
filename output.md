## 1 `css/style.css`
```css
body,html{overflow:hidden;margin:0;padding:0;width:100%;height:100%;font-family:'Microsoft YaHei',sans-serif;background:linear-gradient(to bottom right,#f5fff5,#e8f5e9)}

@font-face{font-family:'STZhongsong';src:url('../fonts/STZhongsong.ttf') format('truetype');font-weight:400;font-style:normal;font-display:swap}
@font-face{font-family:'STZhongSong';src:url('../fonts/STZhongsong.ttf') format('truetype');font-weight:400;font-style:normal;font-display:swap}
@font-face{font-family:'STKaiti';src:url('../fonts/STKaiti.ttf') format('truetype');font-weight:400;font-style:normal;font-display:swap}
@font-face{font-family:'STXingkai';src:url('../fonts/STXingkai.ttf') format('truetype');font-weight:400;font-style:normal;font-display:swap}

/* ===== 模态框 ===== */
.settings-modal{position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;justify-content:center;align-items:center;opacity:0;visibility:hidden;transition:all .3s;z-index:999}
.settings-modal.active{opacity:1;visibility:visible}
.settings-content{background:#fff;width:60%;height:75%;border-radius:12px;transform:scale(.8);opacity:0;transition:all .3s;position:relative;padding:20px;overflow:hidden;display:flex;flex-direction:column}
.settings-modal.active .settings-content{transform:scale(1);opacity:1}
.settings-modal.fullscreen .settings-content{width:100%;height:100%;max-width:none;max-height:none;border-radius:0}
.changelog-modal .settings-content{max-width:600px}
.settings-header{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #eee;padding-bottom:10px;margin-bottom:20px}
.settings-header h3{margin:0;font-size:24px;color:#333}
.settings-body{display:flex;flex-direction:column;gap:10px;padding:20px;overflow-y:auto;height:calc(100% - 60px)}
.text-content{padding:15px;white-space:pre-wrap;overflow-y:auto;height:calc(100% - 50px)}

/* ===== 按钮 ===== */
.action-button,.settings-button,.add-notification-btn,.reset-btn{background:#8bc34a;border:none;cursor:pointer;color:#fff;transition:all .3s}
.action-buttons,.settings-button{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);z-index:10}
.action-buttons{display:flex;gap:15px}
.action-button{padding:0 20px;height:40px;border-radius:20px;box-shadow:0 2px 8px rgba(0,0,0,.2);font-size:14px;display:flex;align-items:center;justify-content:center;white-space:nowrap}
.settings-button{width:40px;height:40px;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,.2);display:flex;align-items:center;justify-content:center;font-size:24px}
.add-notification-btn{padding:8px 15px;border-radius:4px;font-family:STZhongsong,serif;font-size:15px}
.reset-btn{padding:5px 12px;min-width:50px;white-space:nowrap;border-radius:4px;font-size:13px}
.action-button:hover,.add-notification-btn:hover{transform:scale(1.05)}
.settings-button:hover{transform:translateX(-50%) scale(1.1)}
.reset-btn:hover{background:#7cb342;transform:scale(1.05)}
.close-btn,.maximize-btn{cursor:pointer;padding:0 10px;color:#666}
.close-btn{font-size:28px}
.maximize-btn{font-size:24px;transition:all .3s;position:relative;z-index:100}
.close-btn:hover,.maximize-btn:hover{color:#333}
.maximize-btn:hover{transform:scale(1.1)}
.delete-btn,.delete-notification-btn{position:absolute;right:15px;top:50%;transform:translateY(-50%);padding:4px 12px;border-radius:15px;background:#f44;color:#fff;border:none;cursor:pointer;transition:all .3s}
.delete-notification-btn{font-family:STZhongsong,serif;font-size:14px}

/* ===== 节气卡片 ===== */
.solar-card{position:absolute;top:calc(100% + 20px);left:50%;transform:translateX(-50%);width:500px;background:rgba(255,255,255,.96);border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,.15);padding:20px;opacity:0;visibility:hidden;transition:all .3s;z-index:10;display:flex;align-items:center;gap:20px}
.solar-card::before{content:'';position:absolute;bottom:100%;left:50%;transform:translateX(-50%);border:10px solid transparent;border-bottom-color:rgba(255,255,255,.96)}
.solar-card.active{opacity:1;visibility:visible;transform:translate(-50%,0)}
.solar-card h3{text-align:center;margin:0 0 15px;font-size:24px;color:#1b5e20;font-family:STZhongsong,serif}
.solar-card img{width:160px;height:140px;object-fit:cover;border-radius:8px}
.solar-card p{font-size:16px;line-height:1.6;color:#444;margin:0;font-family:'Microsoft YaHei';flex-grow:1;text-indent:2em}

/* ===== 时间 / 作息 ===== */
#currentDateTime,.schedule-container{position:absolute;left:25px;z-index:5;background:rgba(255,255,255,.9);border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.1)}
#currentDateTime{top:78px;padding:15px 25px;text-align:center;min-width:180px}
.schedule-container{top:225px;padding:15px 20px;min-width:190px}
.time-section{font-family:'Microsoft-Yahei',sans-serif;font-size:44px;color:#1b5e20;margin:8px 0;display:block;width:100%}
.date-section{font-family:'Microsoft YaHei',serif;font-size:22px;color:#666;letter-spacing:.5px;white-space:nowrap;display:block;width:100%}
.schedule-item{font-family:'STZhongSong',sans-serif;margin:8px 0}
.schedule-title{display:block;font-size:20px;color:#1b5e20;font-weight:600;line-height:.8}
.schedule-value{display:block;font-size:25px;color:#2d2d2d;text-align:center;margin:4px 0 0;padding:2px 0;line-height:.8}
.timetable{margin-top:10px;border-top:1px solid #eee;padding-top:8px}
.timetable-item{font-size:25px;font-family:STZhongSong,cursive;line-height:1.2;text-align:center}

/* ===== 导航 / 倒计时 ===== */
.navbar{background-color:#333;overflow:hidden;width:100%;box-shadow:0 2px 10px rgba(0,0,0,.2);position:relative;z-index:6}
.brand{float:left;color:#fff;padding:14px 20px;font-size:20px;font-weight:700;text-decoration:none;letter-spacing:1px}
.navbar a{float:left;display:block;color:#f2f2f2;text-align:center;padding:14px 18px;text-decoration:none;font-size:16px;transition:all .3s}
.navbar a:hover{background:#ddd;color:#000}
.small-title{text-align:center;color:#2d2d2d;font-size:38px;font-family:STZhongsong,serif;margin-top:50px;text-shadow:1px 1px 2px rgba(0,0,0,.1)}
.big-title{text-align:center;color:#1b5e20;font-size:160px;font-family:STKaiti;margin:20px 0;text-shadow:2px 2px 4px rgba(0,0,0,.1)}
.timeline-container{max-width:750px;margin:50px auto;position:relative;height:120px;overflow:visible}
.timeline-progress{height:8px;background:linear-gradient(to right,#8bc34a 0%,#8bc34a var(--progress-percent),#e0e0e0 var(--progress-percent),#e0e0e0 100%);border-radius:4px;position:relative;margin-top:60px}
.solar-term-marker{position:absolute;top:-45px;width:70px;text-align:center;transform:translateX(-50%);cursor:pointer;transition:all .3s;z-index:2}
.current-marker{position:absolute;left:0;top:-10px;width:3px;height:30px;background:#ff5722;transform:translateX(-50%);transition:left .5s ease-out;box-shadow:0 2px 4px rgba(255,87,34,.3)}
.end-marker{position:absolute;right:-15px;top:-45px;width:90px;text-align:center;color:#d32f2f;font-weight:700;text-shadow:0 2px 4px rgba(211,47,47,.2);transform:translateX(30%)}

/* ===== 每日 60s ===== */
.right-image-container{position:absolute;right:50px;top:45%;transform:translateY(-50%);z-index:5;background:#fff;padding:10px;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,.1);display:flex}
.right-image-container img{height:800px;object-fit:cover;display:block;border-radius:6px;width:auto}

/* ===== 金句 ===== */
#goldenPhrase{text-align:center;margin:0 auto;width:760px;font-size:26px;color:#1b5e20;min-height:40px;font-family:STZhongSong,cursive;text-shadow:1px 1px 2px rgba(0,0,0,.1);transition:opacity .5s,transform .3s;position:relative;top:0;cursor:pointer;z-index:5}
#goldenPhrase:active{transform:scale(.98)}
#goldenPhrase.no-animation{transition:none!important}
#goldenPhrase.no-animation:active{transform:none!important}
#phraseList{padding:15px;overflow-y:auto;height:calc(100% - 50px)}
.phrase-item{padding:12px;margin:8px 0;border-radius:6px;background:#f8f8f8;cursor:pointer;transition:all .3s ease;font-family:STZhongSong,cursive;color:#1b5e20}
.phrase-item:hover{background:#e8f5e9;transform:translateX(5px);box-shadow:0 2px 8px rgba(0,0,0,.1)}
.phrase-item:active{transform:scale(.97);background:#e0f2f1!important}
.phrase-click-effect{animation:phraseClickWave .4s ease-out;position:relative}
@keyframes phraseClickWave{0%{box-shadow:0 0 0 0 rgba(139,195,74,.3)}100%{box-shadow:0 0 0 10px rgba(139,195,74,0)}}

/* ===== 开关 / 滑块 ===== */
input[type="checkbox"]{position:absolute;opacity:0;cursor:pointer;height:0;width:0}
.switch-container{display:flex;flex-direction:column;gap:20px;margin-top:20px}
.switch{position:relative;display:flex;align-items:center;justify-content:space-between;width:100%}
.slider{position:relative;cursor:pointer;width:40px;height:24px;background-color:#ccc;transition:.4s;border-radius:24px}
.switch-text{font-size:14px;color:#1b5e20;display:inline-block}
.slider:before{position:absolute;content:"";height:20px;width:20px;left:2px;bottom:2px;background-color:#fff;transition:.4s;border-radius:50%}
input:checked+.slider{background-color:#8bc34a}
input:checked+.slider:before{transform:translateX(16px)}
input:checked~.switch-text{color:#4CAF50}
.probability-control{display:flex;align-items:center;gap:15px;width:100%;margin:12px 0}
.probability-control .switch-text{flex:1;font-size:14px;color:#1b5e20}
.range-group{display:flex;align-items:center;gap:10px;width:40%;justify-content:flex-end}
.font-size-control{display:flex;align-items:center;gap:10px}
.font-size-label{font-size:14px;color:#1b5e20;font-family:STZhongsong,serif}
#apiProbability,#intervalSlider,#fontSizeSlider,#lostAndFoundFontSizeSlider{height:4px;background:#ddd;border-radius:2px;-webkit-appearance:none;margin:0 8px}
#apiProbability,#intervalSlider{width:100%}
#fontSizeSlider,#lostAndFoundFontSizeSlider{width:150px}
#apiProbability::-webkit-slider-thumb,#intervalSlider::-webkit-slider-thumb,#fontSizeSlider::-webkit-slider-thumb,#lostAndFoundFontSizeSlider::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;background:#8bc34a;border-radius:50%;cursor:pointer;border:none;box-shadow:none}
#apiProbability::-moz-range-thumb,#intervalSlider::-moz-range-thumb,#fontSizeSlider::-moz-range-thumb,#lostAndFoundFontSizeSlider::-moz-range-thumb{width:16px;height:16px;background:#8bc34a;border-radius:50%;border:none;cursor:pointer}
#apiProbabilityValue,#intervalValue,#fontSizeValue{width:50px;padding:5px;border:1px solid #ddd;border-radius:4px;text-align:center;font-size:13px;font-family:inherit}

/* ===== 公告 / 通知 ===== */
.announcement-card{background:#fff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.1);padding:20px;margin:15px;border:1px solid #eee}
.announcement-title{font-size:1.6em;color:#1b5e20;font-weight:600;margin-bottom:8px;border-bottom:2px solid #8bc34a;padding-bottom:5px;text-align:center}
.announcement-time{font-size:.95em;color:#666;margin-bottom:15px;text-align:center}
.announcement-body{line-height:1.2;color:#444;font-size:1.2em}
.announcement-body ul{margin:8px 0;padding-left:25px}
.announcement-body li{margin:6px 0}
.announcement-footnote{font-size:.85em;color:#999;margin-top:15px;border-top:1px dashed #ddd;padding-top:10px}
.announcement-content{height:calc(100% - 60px);overflow-y:auto;padding:0 10px}
.announcement-content::-webkit-scrollbar{width:6px}
.announcement-content::-webkit-scrollbar-track{background:#f1f1f1;border-radius:3px}
.announcement-content::-webkit-scrollbar-thumb{background:#c1c1c1;border-radius:3px}
.announcement-content::-webkit-scrollbar-thumb:hover{background:#8bc34a}
.notification-container{display:flex;flex-direction:column;height:100%;font-family:STZhongsong,serif}
#notificationContent{flex:1;overflow-y:auto;padding:15px;transition:font-size .3s ease;max-height:calc(100% - 70px)}
.notification-item{position:relative;margin-bottom:15px;padding:15px;background:#f8f8f8;border-radius:8px;cursor:pointer;transition:all .3s;min-height:40px;word-wrap:break-word;overflow-wrap:break-word;font-family:inherit;box-shadow:0 2px 5px rgba(0,0,0,.05)}
.notification-item:hover{background:#e8f5e9;box-shadow:0 3px 8px rgba(0,0,0,.1)}
.notification-editable{width:100%;min-height:60px;padding:10px;border:2px solid #8bc34a;border-radius:4px;font-size:inherit;box-sizing:border-box;font-family:inherit;resize:vertical;line-height:1.5}
.notification-footer{display:flex;justify-content:space-between;align-items:center;padding:15px;border-top:1px solid #eee;margin-top:10px;position:sticky;bottom:0;background:#fff;z-index:10;flex-shrink:0}
.empty-notification{text-align:center;padding:30px;color:#999;font-style:italic}

/* ===== 寻物 ===== */
.editable{cursor:pointer;transition:all .3s;padding:2px 5px;border-radius:4px;font-family:STZhongsong,serif;color:#1e90ff;text-shadow:0 0 2px rgba(0,0,0,.2);border-bottom:2px solid #ffd700}
.editable:hover{background:#f0f0f0}
.edit-input{width:120px;padding:5px;border:2px solid #8bc34a;border-radius:4px;font-size:28px;text-align:center;color:#1e90ff;margin:0 5px;font-family:STZhongsong,serif}
#lostAndFoundList .announcement-card{padding:12px;margin:8px 10px}
#lostAndFoundList .announcement-body{line-height:1.1}
#lostAndFoundList .editable{margin:1px 0;padding:2px 4px}

/* ===== 添加按钮 ===== */
.add-button{position:fixed;bottom:30px;right:30px;width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#8bc34a,#7cb342);color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.25),0 0 0 2px rgba(255,255,255,.8) inset;transition:all .3s ease;z-index:999;font-size:24px;font-weight:700;animation:button-pulse 2s infinite}
.add-button:hover{transform:scale(1.15);box-shadow:0 6px 16px rgba(0,0,0,.3),0 0 0 2px rgba(255,255,255,.9) inset}
.add-button:active{transform:scale(.85);box-shadow:0 2px 6px rgba(0,0,0,.2),0 0 0 3px rgba(255,255,255,.8) inset;background:linear-gradient(135deg,#7cb342,#689f38)}
@keyframes gradient-pulse{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
@keyframes button-pulse{0%,100%{box-shadow:0 0 0 0 rgba(139,195,74,0)}70%{box-shadow:0 0 0 10px rgba(139,195,74,0)}}

/* ===== 寻物：字号通过 CSS 变量控制，方便整表重渲染 ===== */
#lostAndFoundList{ --laf-font-size: 28px; }
#lostAndFoundList .editable,
#lostAndFoundList .static-text{ font-size: var(--laf-font-size) !important; }

```

## 2 `index.html`
```html
<!DOCTYPE html>
<html>
<head>
    <title>高二（22）班 | 高考必胜</title>
    <meta charset="utf-8">
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div id="serviceBanner" style="
        position:fixed;top:10px;right:10px;z-index:99999;display:none;
        background:#ff9800;color:#fff;padding:6px 14px;border-radius:4px;
        font-size:12px;box-shadow:0 2px 8px rgba(0,0,0,.2);">
        本地服务未启动，数据将不会被保存
    </div>

    <div id="pageContent" style="display: none;">
        <!-- 导航栏 -->
        <header>
            <nav class="navbar">
                <div class="brand">杨村一中&nbsp;高二（22）班</div>
            </nav>
        </header>

        <!-- 时钟 -->
        <div id="currentDateTime">
            <div class="time-section"></div>
            <div class="date-section"></div>
        </div>

        <!-- 作息提示容器 -->
        <div id="scheduleContainer" class="schedule-container">
            <div class="schedule-item">
                <span class="schedule-title">天气：</span>
                <span class="schedule-value" id="weatherInfo">加载中...</span>
            </div>
            <div class="schedule-item">
                <span class="schedule-title">当前：</span>
                <span class="schedule-value" id="currentSchedule">加载中...</span>
            </div>
            <div class="schedule-item">
                <span class="schedule-title">下节课：</span>
                <span class="schedule-value" id="nextSchedule">加载中...</span>
            </div>
            <div class="schedule-item">
                <span class="schedule-title" id="countdownName">倒计时：</span>
                <span class="schedule-value" id="countdownTimer" style="font-size: 28px;">--:--</span>
            </div>
            <div class="timetable" id="todayTimetable"></div>
        </div>

        <!-- 高考倒计时 -->
        <div class="small-title">距离2028年高考仅剩</div>
        <div id="daysUntil" class="big-title"></div>

        <!-- 时间轴 -->
        <div class="timeline-container">
            <div class="timeline-progress" id="timeline">
                <div class="end-marker">
                    <div id="timelineEndTitle" style="white-space: nowrap;">高考日</div>
                    <div id="timelineEndDate" style="font-size:0.9em; margin-top:3px">6月7日</div>
                </div>
            </div>
        </div>

        <!-- 金句 -->
        <div id="goldenPhrase"></div>

        <!-- 每日60s -->
        <div class="right-image-container">
            <img id="apiImage" src="" alt="每日60s">
        </div>

        <!-- 底部按钮 -->
        <div class="action-buttons">
            <button id="settingsButton" class="action-button">⚙️ 设置</button>
            <button id="changelogButton" class="action-button">📝 更新日志</button>
            <button id="announcementButton" class="action-button">📢 公告</button>
            <button id="phraseSelectButton" class="action-button">📜 选择金句</button>
            <button id="lostAndFoundButton" class="action-button">🔍 寻物</button>
            <button id="notificationButton" class="action-button">🔔 通知</button>
        </div>

        <!-- 设置模态框 -->
        <div class="settings-modal" id="settingsModal">
            <div class="settings-content">
                <div class="settings-header">
                    <h3>设置</h3>
                    <span class="close-btn" id="closeSettings">&times;</span>
                </div>
                <div class="settings-body">
                    <div class="switch-container">
                        <label class="switch">
                            <span class="switch-text">金句自动轮播</span>
                            <input type="checkbox" id="goldenSwitch" checked>
                            <span class="slider"></span>
                        </label>
                        <label class="switch">
                            <span class="switch-text">显示每日60s</span>
                            <input type="checkbox" id="imageSwitch" checked>
                            <span class="slider"></span>
                        </label>
                        <div class="probability-control">
                            <span class="switch-text">联网获取金句的概率(%)</span>
                            <div class="range-group">
                                <input type="range" id="apiProbability" min="0" max="100" value="50">
                                <input type="number" id="apiProbabilityValue" min="0" max="100" value="50">
                                <button class="reset-btn" onclick="resetProbability()">重置</button>
                            </div>
                        </div>
                        <div class="probability-control">
                            <span class="switch-text">金句轮播时间间隔（秒）</span>
                            <div class="range-group">
                                <input type="range" id="intervalSlider" min="1" max="60" value="15">
                                <input type="number" id="intervalValue" min="1" max="60" value="15">
                                <button class="reset-btn" onclick="resetInterval()">重置</button>
                            </div>
                        </div>
                        <label class="switch">
                            <span class="switch-text">启用点击刷新金句</span>
                            <input type="checkbox" id="clickRefreshSwitch">
                            <span class="slider"></span>
                        </label>
                        <label class="switch">
                            <span class="switch-text">开启金句动画效果</span>
                            <input type="checkbox" id="animationSwitch" checked>
                            <span class="slider"></span>
                        </label>
                        <!-- <label class="switch">
                            <span class="switch-text">本地金句只展示原创</span>
                            <input type="checkbox" id="originalSwitch">
                            <span class="slider"></span>
                        </label> -->
                        <label class="switch">
                            <span class="switch-text">自动刷新页面</span>
                            <input type="checkbox" id="autoRefreshSwitch">
                            <span class="slider"></span>
                        </label>
                    </div>
                </div>
            </div>
        </div>

        <!-- 更新日志模态框 -->
        <div class="settings-modal" id="changelogModal">
            <div class="settings-content">
                <div class="settings-header">
                    <h3>更新日志</h3>
                    <span class="close-btn" id="closeChangelog">&times;</span>
                </div>
                <div class="text-content" id="changelogContent">
                    本网站是网站作者在初中时做的，稍微改了下就搬过来了。因为整体重构过，所以有一些 bug，且功能不完善的问题。

                    待添加的新功能：自定义倒计时（不只是高考倒计时，如一月考倒计时、期末倒计时等）、智能的座位表（支持快捷搜索等）、老虎机（随机抽人）、方便地统计需要讲的题目（课前统计好，课上老师直接讲）、数据本地存储（目的是增加普适性，让所有班级都能用上这个网站，而不是仅 22 班）等。欢迎提建议。

                    2026.9.24
                    1. 修复天气无法获取的 bug；
                    2. 更新课表与作息表；
                    3. 实现数据本地存储，新增运行在本地的 LocalDataServer.exe 用于启动本地 http 服务以实现网页直接读写本地磁盘；
                    4. 大幅精简现有代码，长度缩小 40%，提升运行效率；
                    5. 修复每次打开网页默认显示每日 60s 的 bug；
                    6. 修复周六课表无课时“下节课”不显示“无”的 bug；
                </div>
            </div>
        </div>

        <!-- 公告板模态框 -->
        <div class="settings-modal" id="announcementModal">
            <div class="settings-content">
                <div class="settings-header" style="padding-bottom: 8px;">
                    <h3 style="font-size: 1.2em;">公告</h3>
                    <div style="display: flex; align-items: center;">
                        <span class="maximize-btn" id="maximizeAnnouncement">⛶</span>
                        <span class="close-btn" id="closeAnnouncement">&times;</span>
                    </div>
                </div>
                <div class="announcement-content">
                    <div class="announcement-card">
                        <div class="announcement-title">📢 倒计时网站征稿活动开始啦！</div>
                        <div class="announcement-time">2025.3.1</div>
                        <div class="announcement-body">
                            C2201倒计时网站底部金句轮播内容<strong>开始征稿了</strong>！选上的作品可以放在网站上<strong>轮播展示</strong>！
                            <ul>
                                <li><strong>参与条件：</strong>是个人都能参加</li>
                                <li><strong>时间：</strong>即日起至2025年5月31日（活动已结束）</li>
                                <li><strong>征稿内容：</strong><strong>励志文字</strong>、优美<strong>作文素材</strong>、<strong>诗歌（含现代诗）</strong>或<strong>整活</strong>（<strong>不能八卦</strong>）等（特别地，既可以原创，也可以投你在其他地方看到的很好的句子上来，但是要<strong>标明出处</strong>；若是原创句子可选择展示时是否显示署名）（一个句子展示的概率：励志文字 = 优美作文素材 > 整活，可根据具体情况调整，特别地，若原创句子写的<strong>过于精妙</strong>，可以<strong>提高展示概率</strong>）</li>
                                <li><strong>字数要求：</strong>1~80字（包含标点）</li>
                                <li><strong>提交格式：</strong>你的名字+句子内容+是否原创（+若非原创，标明出处）</li>
                                <li><strong>提交方式：</strong>写在便利贴上交给TQC</li>
                            </ul>
                            <p class="announcement-footnote">最终解释权归TQC所有</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 金句选择模态框 -->
        <div class="settings-modal" id="phraseModal">
            <div class="settings-content">
                <div class="settings-header">
                    <h3>选择金句</h3>
                    <span class="close-btn" id="closePhrase">&times;</span>
                </div>
                <div class="text-content" id="phraseList"></div>
            </div>
        </div>

        <!-- 寻物模态框 -->
        <div class="settings-modal" id="lostAndFoundModal">
            <div class="settings-content">
                <div class="settings-header">
                    <h3>寻物</h3>
                    <div style="display: flex; align-items: center;">
                        <span class="maximize-btn" id="maximizeLostAndFound">⛶</span>
                        <span class="close-btn" id="closeLostAndFound">&times;</span>
                    </div>
                </div>
                <div class="notification-container" style="display: flex; flex-direction: column; height: 100%;">
                    <div class="big-title" style="
                        background: linear-gradient(135deg, #FF0000 0%, #FF6B00 25%, #FFD700 50%, #FF6B00 75%, #FF0000 100%);
                        -webkit-background-clip: text;
                        background-clip: text;
                        -webkit-text-fill-color: transparent;
                        background-size: 200% 200%;
                        animation: gradient-pulse 4s ease infinite;
                        text-shadow: 2px 2px 4px rgba(0,0,0,0.3), 0 0 10px rgba(255,107,0,0.5);
                        font-size: 120px;
                        font-family: STXingkai, cursive;
                        letter-spacing: 4px;
                        width: 100%;
                        text-align: center;
                        margin: -8px 0 0;
                        padding: 0;
                        line-height: 1.2;
                    ">寻物</div>

                    <!-- 列表容器 + 独立加号按钮 -->
                    <div style="position: relative; flex: 1; overflow: hidden;">
                        <div class="announcement-content" id="lostAndFoundList" style="
                            height: 100%; overflow-y: auto; padding: 10px;"></div>
                        <div class="add-button" id="addLostFoundBtn">+</div>
                    </div>

                    <div class="notification-footer" style="position: sticky; bottom: 0; background: white; z-index: 10; padding: 10px 15px; border-top: 1px solid #eee;">
                        <div class="font-size-control">
                            <span class="font-size-label">字体大小:</span>
                            <input type="range" id="lostAndFoundFontSizeSlider" min="12" max="120" value="28">
                            <input type="number" id="lostAndFoundFontSizeValue" min="12" max="120" value="28">
                            <span>px</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 通知模态框 -->
        <div class="settings-modal" id="notificationModal">
            <div class="settings-content">
                <div class="settings-header">
                    <h3>通知</h3>
                    <div style="display: flex; align-items: center;">
                        <span class="maximize-btn" id="maximizeNotification">⛶</span>
                        <span class="close-btn" id="closeNotification">&times;</span>
                    </div>
                </div>
                <div class="notification-container">
                    <div id="notificationContent">
                        <div class="empty-notification">暂无通知，点击下方按钮添加</div>
                    </div>
                    <div class="notification-footer">
                        <button class="add-notification-btn" id="addNotificationBtn">+ 添加通知</button>
                        <div class="font-size-control">
                            <span class="font-size-label">字体大小:</span>
                            <input type="range" id="fontSizeSlider" min="12" max="120" value="16">
                            <input type="number" id="fontSizeValue" min="12" max="120" value="16">
                            <span>px</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- 1. 基础数据 -->
    <script src="js/data/solarterms.js"></script>
    <script src="js/data/timetable.js"></script>
    <script src="js/data/schedule.js"></script>
    <script src="js/data/phrases.js"></script>

    <!-- 2. 状态与工具 -->
    <script src="js/features/00_state.js"></script>
    <script src="js/features/01_utils.js"></script>

    <!-- 2.5 本地数据存储层（新增） -->
    <script src="js/features/store.js"></script>

    <!-- 3. 独立功能模块 -->
    <script src="js/features/clock.js"></script>
    <script src="js/features/weather.js"></script>
    <script src="js/features/daily_image.js"></script>
    <script src="js/features/timeline.js"></script>
    <script src="js/features/exam_countdown.js"></script>
    <script src="js/features/school_schedule.js"></script>
    <script src="js/features/golden_phrase.js"></script>
    <script src="js/features/auto_refresh.js"></script>

    <!-- 4. 弹窗交互模块 -->
    <script src="js/features/modal_core.js"></script>
    <script src="js/features/modal_settings.js"></script>
    <script src="js/features/modal_lost_found.js"></script>
    <script src="js/features/modal_notification.js"></script>
    <script src="js/features/modal_phrase.js"></script>

    <script>
        (function () {
            const targetWidth = 1920;
            function resize() {
                const currentWidth = document.documentElement.clientWidth || document.body.clientWidth;
                const scale = currentWidth / targetWidth;
                const pageContent = document.getElementById('pageContent');
                if (!pageContent) return;
                pageContent.style.zoom = scale;
                pageContent.style.width = targetWidth + 'px';
                pageContent.style.height = '1080px';
                pageContent.style.position = 'relative';
                pageContent.style.overflow = 'hidden';
                document.body.style.overflowX = 'hidden';
            }
            resize();
            window.addEventListener('resize', resize);
        })();
    </script>

    <!-- 5. 主入口 -->
    <script src="js/features/main.js"></script>
</body>
</html>

```

## 6 `js/data/timetable.js`
```js
const timetable = {
    monday: ["英语","语文","数学","生物","美术","英语","化学","体育","班会","物理","自习","语文","自习"],
    tuesday: ["语文","物理","化学","数学","音乐","语文","生物","英语","活动","生物","化学","化学","自习"],
    wednesday: ["英语","英语","数学","物理","心/通","语文","自习","自习","自习","物理","数学","自习","自习"],
    thursday: ["语文","生物","物理","化学","数学","英语","语文","体育","活动","英语","英语","生物","自习"],
    friday: ["物/化","体育","语文","政治","生物","物理","化学","数学","英语"],
    sunday: ["数学","数学","语文","自习"]
};

const timetable_last2 = {
    monday: ["英语","语文","生物","物理","英语","体育","数学","技术","班会","英语","自习","生物","语文"],
    tuesday: ["语文","语文","数学","化学","体育","英语","生物","历史","活动","生物","化学","生物","物理"],
    wednesday: ["数学","生物","语文","化学","物理","数学","英语","美术","音乐","自习","语文","语文","化学"],
    thursday: ["英语","语文","英语","化学","数学","体育","地理","物理","活动","自习","英语","英语","数学"],
    friday: ["语文","化学","心理","物理","英语","政治","生物","语文","数学"],
    sunday: ["自习","数学","物理","数学"]
};

const timetable_last = {
    monday: ["数学","英语","政治","物理","化学","语文","语文","语文考试"],
    tuesday: ["英语","数学","数学","语文","体育","历史","政治","文综考试"],
    wednesday: ["数学","物理","英语","历史","音/美","化学","语文","理综考试"],
    thursday: ["语文","物理","化学","数学","英语","政治","历史","数学考试"],
    friday: ["数学","语文","英语","体育","物理","化学","班会","英语考试"]
};

```

## 7 `js/features/00_state.js`
```js
window.App = window.App || {};

window.App.State = {
    // 仅内存，不需要持久化
    lastPhrase: null,

    // ---------- 设置项：通过 App.Store 持久化 ----------
    get intervalDuration() {
        if (window.App.Store) return window.App.Store.getSetting('intervalDuration');
        return 15000;
    },
    set intervalDuration(v) {
        if (window.App.Store) window.App.Store.setSetting('intervalDuration', v);
    },

    get apiProbability() {
        if (window.App.Store) return window.App.Store.getSetting('apiProbability');
        return 50;
    },
    set apiProbability(v) {
        if (window.App.Store) window.App.Store.setSetting('apiProbability', v);
    },

    get lostAndFoundFontSize() {
        if (window.App.Store) return window.App.Store.getSetting('lostAndFoundFontSize');
        return 28;
    },
    set lostAndFoundFontSize(v) {
        if (window.App.Store) window.App.Store.setSetting('lostAndFoundFontSize', v);
    },

    // ---------- 通知列表 ----------
    get notifications() {
        if (window.App.Store) return window.App.Store.get('notifications') || [];
        return this._fallbackNotifications || (this._fallbackNotifications = []);
    },
    set notifications(v) {
        if (window.App.Store) window.App.Store.set('notifications', v);
        else this._fallbackNotifications = v;
    }
};

window.App.Timers = {
    phrase: null,
    weather: null,
    refresh: null,
    image: null,
    schoolSchedule: null
};

```

## 8 `js/features/01_utils.js`
```js
window.App.Utils = {
    timeToMinutes(time) {
        if (time instanceof Date) return time.getHours() * 60 + time.getMinutes();
        if (time === '23:59') return 1439;
        const [h, m] = time.split(':').map(Number);
        return h * 60 + m;
    }
};


```

## 9 `js/features/auto_refresh.js`
```js
window.App.AutoRefresh = {
    interval: 15 * 60 * 1000,

    init() {
        const switchBtn = document.getElementById('autoRefreshSwitch');
        if (!switchBtn) return;

        switchBtn.addEventListener('change', e => {
            if (window.App.Store) window.App.Store.setSetting('autoRefreshSwitch', e.target.checked);
            e.target.checked ? this.start() : this.stop();
        });

        // DOM 里的 checked 已在 modal_settings.applyFromStore 里被同步过
        if (switchBtn.checked) this.start();
    },

    start() {
        this.stop();
        window.App.Timers.refresh = setTimeout(() => location.reload(), this.interval);
    },

    stop() {
        if (window.App.Timers.refresh) {
            clearTimeout(window.App.Timers.refresh);
            window.App.Timers.refresh = null;
        }
    }
};

```

## 10 `js/features/clock.js`
```js
window.App.Clock = (() => {
    let lastHTML = '';
    const pad = n => String(n).padStart(2, '0');

    return {
        init() {
            this.update();
        },

        update() {
            const d = new Date();
            const html =
                `<div class="time-section">${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}</div>` +
                `<div class="date-section">${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} 周${'日一二三四五六'[d.getDay()]}</div>`;

            if (html !== lastHTML) {
                lastHTML = html;
                const el = document.getElementById('currentDateTime');
                if (el) el.innerHTML = html;
            }

            requestAnimationFrame(() => this.update());
        }
    };
})();


```

## 14 `js/features/main.js`
```js
window.onload = async function () {
    // 1) 先初始化本地存储，加载磁盘数据
    try {
        await window.App.Store.init();
    } catch (e) {
        console.error('❌ 本地存储初始化失败：', e);
    }

    const safeInit = (name, fn) => {
        try {
            if (typeof fn === 'function') fn();
            else console.warn(`⚠️ 模块 ${name} 未找到或 init 不是函数`);
        } catch (e) {
            console.error(`❌ 模块 ${name} 初始化失败:`, e);
        }
    };

    // 2) 核心功能模块
    safeInit('Clock', () => window.App.Clock?.init());
    safeInit('Weather', () => window.App.Weather?.init());
    safeInit('DailyImage', () => window.App.DailyImage?.init());
    safeInit('Timeline', () => window.App.Timeline?.init());
    safeInit('ExamCountdown', () => window.App.ExamCountdown?.init());
    safeInit('SchoolSchedule', () => window.App.SchoolSchedule?.init());
    safeInit('GoldenPhrase', () => window.App.GoldenPhrase?.init());
    safeInit('AutoRefresh', () => window.App.AutoRefresh?.init());

    // 3) 弹窗交互模块
    safeInit('ModalCore', () => window.App.ModalCore?.init());
    safeInit('ModalSettings', () => window.App.ModalSettings?.init());
    safeInit('ModalLostFound', () => window.App.ModalLostFound?.init());
    safeInit('ModalNotification', () => window.App.ModalNotification?.init());
    safeInit('ModalPhrase', () => window.App.ModalPhrase?.init());

    // 4) 显示主界面
    const loadingOverlay = document.getElementById('loadingOverlay');
    const pageContent = document.getElementById('pageContent');
    if (loadingOverlay) loadingOverlay.style.display = 'none';
    if (pageContent) pageContent.style.display = 'block';
};

window.addEventListener('unload', () => {
    try {
        if (window.App.Timers?.phrase) clearInterval(window.App.Timers.phrase);
        window.App.Store?.flush();
    } catch (e) { /* ignore */ }
});

```

## 15 `js/features/modal_core.js`
```js
window.App.ModalCore = {
    init() {
        // 注意：金句选择弹窗由 ModalPhrase 独立处理
        const modals = [
            { btn: 'settingsButton', modal: 'settingsModal', close: 'closeSettings' },
            { btn: 'changelogButton', modal: 'changelogModal', close: 'closeChangelog' },
            { btn: 'announcementButton', modal: 'announcementModal', close: 'closeAnnouncement' },
            { btn: 'lostAndFoundButton', modal: 'lostAndFoundModal', close: 'closeLostAndFound' },
            { btn: 'notificationButton', modal: 'notificationModal', close: 'closeNotification' }
        ];

        modals.forEach(({ btn, modal, close }) => {
            document.getElementById(btn)?.addEventListener('click', () => {
                document.getElementById(modal).classList.add('active');
            });
            document.getElementById(close)?.addEventListener('click', () => {
                document.getElementById(modal).classList.remove('active');
                this.resetFullscreen(modal);
            });
        });

        ['maximizeNotification', 'maximizeLostAndFound', 'maximizeAnnouncement'].forEach(id => {
            document.getElementById(id)?.addEventListener('click', function () {
                const modal = this.closest('.settings-modal');
                modal.classList.toggle('fullscreen');
                this.textContent = modal.classList.contains('fullscreen') ? '🗗' : '⛶';
            });
        });
    },

    resetFullscreen(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.remove('fullscreen');
        const maxBtn = modal.querySelector('.maximize-btn');
        if (maxBtn) maxBtn.textContent = '⛶';
    }
};


```

## 19 `js/features/modal_settings.js`
```js
window.App.ModalSettings = {
    init() {
        this.applyFromStore();
        this.bindProbability();
        this.bindInterval();
        this.bindSwitches();

        window.resetProbability = () => this.setProbability(50);
        window.resetInterval = () => this.setIntervalDuration(15);
    },

    clamp(value, min, max, fallback) {
        const number = Number(value);
        return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
    },

    // 把 Store 里的设置写回 DOM
    applyFromStore() {
        const s = (window.App.Store && window.App.Store.get('settings')) || {};

        const setChecked = (id, value, fallback) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.checked = (value === undefined) ? fallback : !!value;
        };
        setChecked('goldenSwitch', s.goldenSwitch, true);
        setChecked('imageSwitch', s.imageSwitch, true);
        setChecked('clickRefreshSwitch', s.clickRefreshSwitch, false);
        setChecked('animationSwitch', s.animationSwitch, true);
        setChecked('autoRefreshSwitch', s.autoRefreshSwitch, false);

        const intervalSec = (s.intervalDuration ?? 15000) / 1000;
        const setVal = (id, value) => {
            const el = document.getElementById(id);
            if (el && value !== undefined) el.value = value;
        };
        setVal('apiProbability', s.apiProbability ?? 50);
        setVal('apiProbabilityValue', s.apiProbability ?? 50);
        setVal('intervalSlider', intervalSec);
        setVal('intervalValue', intervalSec);
        setVal('lostAndFoundFontSizeSlider', s.lostAndFoundFontSize ?? 28);
        setVal('lostAndFoundFontSizeValue', s.lostAndFoundFontSize ?? 28);
        setVal('fontSizeSlider', s.notificationFontSize ?? 16);
        setVal('fontSizeValue', s.notificationFontSize ?? 16);

        // 动画开关同步到元素 class
        document.getElementById('goldenPhrase')?.classList.toggle('no-animation', !(s.animationSwitch !== false));
    },

    setProbability(value) {
        const finalValue = this.clamp(value, 0, 100, 50);
        const slider = document.getElementById('apiProbability');
        const number = document.getElementById('apiProbabilityValue');
        if (slider) slider.value = finalValue;
        if (number) number.value = finalValue;
        window.App.State.apiProbability = finalValue;
    },

    setIntervalDuration(value) {
        const finalValue = this.clamp(value, 1, 60, 15);
        const slider = document.getElementById('intervalSlider');
        const number = document.getElementById('intervalValue');
        if (slider) slider.value = finalValue;
        if (number) number.value = finalValue;
        window.App.State.intervalDuration = finalValue * 1000;

        if (document.getElementById('goldenSwitch')?.checked) {
            window.App.GoldenPhrase?.startTimer();
        }
    },

    bindPair(rangeId, numberId, { min, max, fallback, onInput }) {
        const range = document.getElementById(rangeId);
        const number = document.getElementById(numberId);
        if (!range && !number) return;

        const apply = value => {
            const result = this.clamp(value, min, max, fallback);
            if (range && range.value !== String(result)) range.value = result;
            if (number && number.value !== String(result)) number.value = result;
            onInput?.(result);
        };

        [range, number].forEach(el => {
            if (!el) return;
            el.addEventListener('input', e => apply(e.target.value));
            el.addEventListener('change', e => apply(e.target.value));
        });
    },

    bindProbability() {
        this.bindPair('apiProbability', 'apiProbabilityValue', {
            min: 0, max: 100, fallback: 50,
            onInput: value => { window.App.State.apiProbability = value; }
        });
    },

    bindInterval() {
        this.bindPair('intervalSlider', 'intervalValue', {
            min: 1, max: 60, fallback: 15,
            onInput: value => {
                window.App.State.intervalDuration = value * 1000;
                if (document.getElementById('goldenSwitch')?.checked) {
                    window.App.GoldenPhrase?.startTimer();
                }
            }
        });
    },

    bindSwitches() {
        const saveSetting = (key, value) => {
            if (window.App.Store) window.App.Store.setSetting(key, value);
        };

        document.getElementById('goldenSwitch')?.addEventListener('change', e => {
            saveSetting('goldenSwitch', e.target.checked);
            if (!window.App.GoldenPhrase) return;
            e.target.checked ? window.App.GoldenPhrase.startTimer() : window.App.GoldenPhrase.stopTimer();
        });

        document.getElementById('imageSwitch')?.addEventListener('change', e => {
            saveSetting('imageSwitch', e.target.checked);
            // 全部交给 DailyImage 处理：它会读 Store 的最新值，决定显示/隐藏 + 定时器
            window.App.DailyImage?.init();
        });

        document.getElementById('animationSwitch')?.addEventListener('change', e => {
            saveSetting('animationSwitch', e.target.checked);
            document.getElementById('goldenPhrase')?.classList.toggle('no-animation', !e.target.checked);
        });

        // clickRefresh / autoRefresh 的持久化分别在 golden_phrase.js / auto_refresh.js 中完成
        document.getElementById('clickRefreshSwitch')?.addEventListener('change', e => {
            saveSetting('clickRefreshSwitch', e.target.checked);
        });
    }
};

```

## 20 `js/features/school_schedule.js`
```js
window.App.SchoolSchedule = {
    DAYS: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],

    init() {
        clearInterval(window.App.Timers.schoolSchedule);
        window.App.Timers.schoolSchedule = setInterval(() => {
            this.updateDisplay();
            this.updateCountdownDisplay();
        }, 1000);

        this.updateDisplay();
        this.updateCountdownDisplay();
    },

    getScheduleData() {
        if (window.App.Store) return window.App.Store.get('schedule') || {};
        return (typeof schedule !== 'undefined') ? schedule : {};
    },

    getTimetableData() {
        if (window.App.Store) return window.App.Store.get('timetable') || {};
        return (typeof timetable !== 'undefined') ? timetable : {};
    },

    getTodaySchedule(day) {
        const data = this.getScheduleData();
        if (day === 5) return data.friday;
        if (day === 0) return data.sunday;
        return data.weekday;
    },

    getCourseName(day, lessonIndex) {
        const courses = this.getTimetableData()[this.DAYS[day]] || [];
        return courses[day === 0 ? lessonIndex : lessonIndex + 1] || '';
    },

    isCourseSchedule(name) {
        if (!name) return false;
        return name.includes('节课') || name.includes('晚自习') || name.endsWith('考试');
    },

    getLessonItems(todaySchedule) {
        if (!Array.isArray(todaySchedule)) return [];
        return todaySchedule.filter(item => this.isCourseSchedule(item[1]));
    },

    getNextSchoolDayTime(now) {
        const target = new Date(now);
        const day = target.getDay();
        const daysUntilSunday = day === 5 ? 2 : day === 6 ? 1 : 0;

        target.setDate(target.getDate() + daysUntilSunday);
        target.setHours(17, 30, 0, 0);

        return { endTime: target, label: '周日返校' };
    },

    getCurrentSchedule() {
        const now = new Date();
        const day = now.getDay();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const utils = window.App.Utils;

        if (day === 6) return { current: '周末', nextLesson: '无' };

        if (day === 0 && currentMinutes < utils.timeToMinutes('17:30')) {
            return { current: '周末', nextLesson: '第一节晚自习' };
        }

        const todaySchedule = this.getTodaySchedule(day);
        if (!todaySchedule) return { current: '加载中...', nextLesson: '' };

        if (currentMinutes >= utils.timeToMinutes('21:30') || currentMinutes < utils.timeToMinutes('6:30')) {
            return { current: '睡觉', nextLesson: '无' };
        }

        let current = '';
        let currentIndex = -1;

        for (let i = 0; i < todaySchedule.length; i++) {
            const [timeRange, name] = todaySchedule[i];
            const [start, end] = timeRange.split('-');
            const startMinutes = utils.timeToMinutes(start);
            const endMinutes = utils.timeToMinutes(end);

            const isInRange = endMinutes < startMinutes
                ? currentMinutes >= startMinutes || currentMinutes < endMinutes
                : currentMinutes >= startMinutes && currentMinutes < endMinutes;

            if (isInRange) { current = name; currentIndex = i; break; }
        }

        let nextLesson = '';
        if (currentIndex >= 0) {
            for (let i = currentIndex + 1; i < todaySchedule.length; i++) {
                const name = todaySchedule[i][1];
                if (this.isCourseSchedule(name)) { nextLesson = name; break; }
            }
        }

        if (!current && day === 5) return { current: '放学', nextLesson: '无' };
        return { current: current || '休息', nextLesson: nextLesson || '无' };
    },

    getCourseDisplayName(day, scheduleName) {
        if (!this.isCourseSchedule(scheduleName)) return scheduleName;
        const lessonItems = this.getLessonItems(this.getTodaySchedule(day));
        const lessonIndex = lessonItems.findIndex(item => item[1] === scheduleName);
        return lessonIndex < 0 ? scheduleName : (this.getCourseName(day, lessonIndex) || scheduleName);
    },

    updateDisplay() {
        const day = new Date().getDay();
        const result = this.getCurrentSchedule();

        const currentElement = document.getElementById('currentSchedule');
        const nextElement = document.getElementById('nextSchedule');

        if (currentElement) currentElement.textContent = this.getCourseDisplayName(day, result.current);
        if (nextElement) {
            const next = result.nextLesson;
            nextElement.textContent = (!next || next === '无')
                ? '无'
                : this.getCourseDisplayName(day, next);
        }

        this.renderTimetable(day);
    },

    renderTimetable(day) {
        const container = document.getElementById('todayTimetable');
        if (!container) return;

        const centered = (text) =>
            `<div class="timetable-item" style="font-family: STZhongSong, cursive; font-size:24px; text-align:center;">${text}</div>`;

        if (day === 6) { container.innerHTML = centered('周末无课表'); return; }

        const courses = this.getTimetableData()[this.DAYS[day]] || [];
        if (!courses.length) { container.innerHTML = centered('暂无数据'); return; }

        container.innerHTML = courses.map((course, index) => {
            let label = '';
            let showDivider = false;

            if (day === 0) {
                label = `晚${index + 1}`;
            } else if (index === 0) {
                label = '早'; showDivider = true;
            } else if (index <= 8) {
                label = String(index);
                if (index === 4 || index === 8) showDivider = true;
            } else {
                label = `晚${index - 8}`;
            }

            let itemStyle =
                'display:flex;align-items:center;font-family:STZhongSong,cursive;' +
                'font-size:24px;line-height:1;padding:2px 0;';

            if (showDivider) {
                itemStyle += 'border-bottom:2px dashed #ddd;margin-bottom:6px;padding-bottom:6px;';
            }

            return `
                <div style="${itemStyle}">
                    <div style="width:42%;text-align:right;padding-right:15px;color:#8bc34a;font-weight:bold;">
                        ${label}
                    </div>
                    <div style="width:58%;text-align:left;padding-left:5px;color:#333;">
                        ${course}
                    </div>
                </div>
            `;
        }).join('');
    },

    getNextScheduleInfo() {
        const now = new Date();
        const day = now.getDay();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const utils = window.App.Utils;

        const todaySchedule = this.getTodaySchedule(day);
        if (!todaySchedule) return { endTime: '23:59', label: '加载中' };

        const current = this.getCurrentSchedule().current;

        if (current === '放学' || day === 6 || (day === 0 && current === '周末')) {
            return this.getNextSchoolDayTime(now);
        }

        if (current === '午休') {
            const firstPart = currentMinutes < utils.timeToMinutes('13:10');
            return {
                endTime: firstPart ? '13:10' : '13:40',
                label: firstPart ? '熄灯' : '起床'
            };
        }

        const currentIndex = todaySchedule.findIndex(([timeRange]) => {
            const [start, end] = timeRange.split('-');
            const startMinutes = utils.timeToMinutes(start);
            const endMinutes = utils.timeToMinutes(end);
            return endMinutes < startMinutes
                ? currentMinutes >= startMinutes || currentMinutes < endMinutes
                : currentMinutes >= startMinutes && currentMinutes < endMinutes;
        });

        if (currentIndex === -1) return { endTime: '23:59', label: '新的一天' };

        const currentItem = todaySchedule[currentIndex];
        const currentRange = currentItem[0];
        const currentName = currentItem[1];

        if (currentName.includes('课间')) {
            return { endTime: currentRange.split('-')[1], label: '上课' };
        }

        if (
            currentName.includes('节课') ||
            currentName.includes('晚自习') ||
            currentName.includes('早读') ||
            currentName.endsWith('考试')
        ) {
            return { endTime: currentRange.split('-')[1], label: '下课' };
        }

        const nextIndex = currentIndex + 1;
        if (nextIndex < todaySchedule.length) {
            return {
                endTime: todaySchedule[nextIndex][0].split('-')[0],
                label: todaySchedule[nextIndex][1]
            };
        }

        return { endTime: '23:59', label: '新的一天' };
    },

    updateCountdownDisplay() {
        const result = this.getNextScheduleInfo();
        const now = new Date();

        let target;
        if (result.endTime instanceof Date) {
            target = result.endTime;
        } else {
            const [hour, minute] = result.endTime.split(':').map(Number);
            target = new Date(now);
            target.setHours(hour, minute, 0, 0);
            if (target < now) target.setDate(target.getDate() + 1);
        }

        const difference = Math.max(0, target - now);
        const totalSeconds = Math.floor(difference / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        const pad = n => String(n).padStart(2, '0');

        const timerElement = document.getElementById('countdownTimer');
        const labelElement = document.getElementById('countdownName');

        if (labelElement) labelElement.textContent = `距离${result.label}还有：`;

        if (timerElement) {
            timerElement.textContent = hours > 0
                ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
                : `${pad(minutes)}:${pad(seconds)}`;
        }
    }
};

```

## 21 `js/features/store.js`
```js
// ============================================================
//  js/features/store.js
//  本地数据存储适配层
//  与本地 LocalDataServer.exe（127.0.0.1:17632~17641）通信
// ============================================================
window.App = window.App || {};

window.App.Store = {
    // 探测到的服务地址，例如 http://127.0.0.1:17632
    baseUrl: null,
    // 本地服务是否可用
    available: false,
    // 内存缓存：{ settings, timetable, schedule, phrases, solarterms, lostfound, notifications }
    cache: {},
    // 防抖写入的定时器
    writeTimers: {},
    // 初始化 Promise（保证只执行一次）
    initPromise: null,

    // 各文件首次运行时的默认值（timetable / schedule / phrases / solarterms 在 _doInit 里动态填充）
    defaults: {
        settings: {
            goldenSwitch: true,
            imageSwitch: true,
            apiProbability: 50,
            intervalDuration: 15000,
            clickRefreshSwitch: false,
            animationSwitch: true,
            autoRefreshSwitch: false,
            lostAndFoundFontSize: 28,
            notificationFontSize: 16
        },
        timetable: {},
        schedule: {},
        phrases: {},
        solarterms: [],
        lostfound: [],
        notifications: []
    },

    // ---------- 初始化 ----------
    init() {
        if (this.initPromise) return this.initPromise;
        this.initPromise = this._doInit();
        return this.initPromise;
    },

    async _doInit() {
        // 1) 从 /js/data/*.js 里拿默认值
        this.defaults.timetable   = (typeof timetable   !== 'undefined') ? timetable   : {};
        this.defaults.schedule    = (typeof schedule    !== 'undefined') ? schedule    : {};
        this.defaults.phrases     = (typeof localPhrases!== 'undefined') ? localPhrases: {};
        this.defaults.solarterms  = (typeof solarTerms  !== 'undefined') ? solarTerms  : [];

        // 2) 探测本地服务
        await this._detectPort();

        // 3) 加载全部数据文件
        await this._loadAll();

        // 4) 界面提示
        this._updateBanner();

        console.info(
            this.available
                ? `[Store] 本地服务已连接：${this.baseUrl}`
                : '[Store] 本地服务未启动，运行在内存模式（修改不会被保存）'
        );
    },

    // ---------- 端口探测 ----------
    async _detectPort() {
        for (let port = 17632; port <= 17641; port++) {
            const ok = await this._probe(port);
            if (ok) {
                this.baseUrl = `http://127.0.0.1:${port}`;
                this.available = true;
                return;
            }
        }
        this.baseUrl = null;
        this.available = false;
    },

    _probe(port) {
        return new Promise(resolve => {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 500);
            fetch(`http://127.0.0.1:${port}/api/ping`, {
                signal: controller.signal,
                cache: 'no-store'
            }).then(res => {
                clearTimeout(timer);
                if (!res.ok) return resolve(false);
                return res.json().then(data => {
                    resolve(data && data.service === 'class-local-data');
                }).catch(() => resolve(false));
            }).catch(() => {
                clearTimeout(timer);
                resolve(false);
            });
        });
    },

    // ---------- 批量加载 ----------
    async _loadAll() {
        const names = [
            'settings', 'timetable', 'schedule',
            'phrases', 'solarterms', 'lostfound', 'notifications'
        ];
        for (const name of names) {
            this.cache[name] = await this._load(name, this.defaults[name]);
        }
    },

    async _load(name, defaultValue) {
        const safeDefault = this._clone(defaultValue);

        if (!this.available) return safeDefault;

        try {
            const res = await fetch(`${this.baseUrl}/api/data/${name}`, {
                cache: 'no-store'
            });

            if (res.ok) {
                const data = await res.json();
                // settings 采用“合并”策略，保证后续版本新增的键有默认值
                if (name === 'settings' && data && typeof data === 'object' && !Array.isArray(data)) {
                    return Object.assign({}, safeDefault, data);
                }
                return data;
            }

            if (res.status === 404) {
                // 首次运行：写入默认值
                await this._writeNow(name, safeDefault);
                return safeDefault;
            }
        } catch (e) {
            console.warn(`[Store] 加载 ${name} 失败:`, e);
        }
        return safeDefault;
    },

    // ---------- 对外读写 ----------
    get(name) {
        return this.cache[name];
    },

    set(name, value) {
        this.cache[name] = value;
        this._scheduleWrite(name);
    },

    // 原地修改（例如 push 到 notifications）时调用
    touch(name) {
        this._scheduleWrite(name);
    },

    getSetting(key) {
        const s = this.cache.settings || this.defaults.settings;
        return s[key];
    },

    setSetting(key, value) {
        if (!this.cache.settings) this.cache.settings = this._clone(this.defaults.settings);
        this.cache.settings[key] = value;
        this._scheduleWrite('settings');
    },

    // ---------- 写入 ----------
    _scheduleWrite(name) {
        if (!this.available) return;
        if (this.writeTimers[name]) clearTimeout(this.writeTimers[name]);
        this.writeTimers[name] = setTimeout(() => {
            this._writeNow(name, this.cache[name]);
            this.writeTimers[name] = null;
        }, 150);
    },

    _writeNow(name, value) {
        if (!this.available) return Promise.resolve();
        return fetch(`${this.baseUrl}/api/data/${name}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(value)
        }).catch(err => {
            console.warn(`[Store] 保存 ${name} 失败:`, err);
        });
    },

    // 页面关闭/隐藏时立即 flush
    flush() {
        if (!this.available) return;
        Object.keys(this.writeTimers).forEach(name => {
            if (this.writeTimers[name]) {
                clearTimeout(this.writeTimers[name]);
                this.writeTimers[name] = null;
                this._writeNow(name, this.cache[name]);
            }
        });
    },

    // ---------- 辅助 ----------
    _clone(v) {
        try { return JSON.parse(JSON.stringify(v)); }
        catch (e) { return v; }
    },

    _updateBanner() {
        const banner = document.getElementById('serviceBanner');
        if (!banner) return;
        if (this.available) {
            banner.style.display = 'none';
        } else {
            banner.style.display = 'block';
            banner.textContent = '本地服务未启动（D 盘 LocalDataServer.exe），修改不会被保存';
            // 3 秒后淡出，避免一直遮挡
            setTimeout(() => { banner.style.opacity = '0'; banner.style.transition = 'opacity .5s'; }, 4000);
        }
    }
};

// 关闭/隐藏页面时强制 flush
window.addEventListener('pagehide', () => window.App.Store.flush());
window.addEventListener('beforeunload', () => window.App.Store.flush());

```