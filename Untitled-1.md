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
                </div>
            </div>
        </div>

        <!-- 公告板模态框 -->
        <div class="settings-modal" id="announcementModal">
            <div class="settings-content">
                <div class="settings-header" style="padding-bottom: 8px;">
                    <h3 style="font-size: 1.2em;">公告</h3>
                    <span class="close-btn" id="closeAnnouncement">&times;</span>
                </div>
                <div class="announcement-content"></div>
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

                    <div class="announcement-content" id="lostAndFoundList" style="flex: 1; overflow-y: auto; padding: 10px;">
                        <div class="add-button">+</div>
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

## 3 `js/data/phrases.js`
```js
const localPhrases = {
    high: [ // 45% 概率
        // "时间在沙漏中倒流，却永远无法逆流至你的眼眸。",
        // "落叶把秋天写成信笺，寄给了永远不会拆封的春天。",
        // "月光在窗棂上结霜，冻结了所有未曾说出口的告白。",
        // "若将星辰碾作粉末，能否涂抹黑夜的伤口？",
        // "风筝切断了自己的线，从此天空成了沉默的共犯。",
        // "火山把心事烧成灰烬，每一粒尘埃都写着遗憾。",
        // "候鸟飞越经纬线时，把故乡折成了小小的三角形。",
        // "钟摆在虚无里摇晃，左边是存在，右边是遗忘。",
        // "灯塔熄灭后，海浪开始用暗语讲述沉船的故事。",
        // "沙漠模仿海的波纹，却永远学不会潮汐的心跳。",
        // "蝉用十七年光阴，把夏天翻译成三声短促的叹息。",
        // "镜子里的倒影突然开口：你才是被囚禁的虚像。",
        // "冰川在午夜流泪，海平面便漫过了人类的年轮。",
        // "枯枝把风的形状刻进年轮，一圈就是一次轮回。",
        // "雨滴垂直坠落，天空与大地终于有了相爱的证据。",
        // "旧钢琴吞下所有音符，吐出铁锈色的沉默。",
        // "候车厅的时钟吞食时间，旅客都成了消化的残渣。",
        // "望远镜倒转方向时，星辰都坠入瞳孔的深渊。",

        // "时间裂开一道缝隙，我躲在里面窥探永恒。",
        // "风把往事揉成碎片，撒向海面时成了发光的鱼群。",
        // "春天在冰层下苏醒，而我被永远冻在了冬天的句点。",
        // "我们是被神遗弃的谜题，答案散落在宇宙的褶皱里。",
        // "当所有蝴蝶选择沉睡，谁来证明世界曾扇动过翅膀？",
        // "墓碑上刻的不是名字，是未说出口的叹息结成琥珀。",
        // "沙漠偷走月亮的银币，买下整片星空铺在驼铃经过的路上。",
        // "童年溺死在玻璃罐里，糖纸裹着锈迹斑斑的蝉鸣。",
        // "火山吞掉最后一封信，岩浆在凝固前拼出歪斜的'再见'。",
        // "镜子吃掉我的轮廓，从此所有倒影都长出荆棘。",
        // "候鸟衔着时针南飞，四季在翅膀的震颤中碎成齑粉。",
        // "灯塔溺亡于自己的光，潮汐带走了所有未完成的指引。",
        // "钟摆割裂黄昏时，血色的云正在缝合天空的伤口。",
        // "蒲公英举起白色火焰，烧穿了整个春天的沉默。",
        // "冰川在瞳孔深处坍塌，沉没的岛屿正在长出新的年轮。",
        // "风筝线勒进银河，断掉的那头系着童年的指纹。",
        // "博物馆里陈列的月光，标价牌写着'已售罄'。",
        // "候车亭吞下末班车的尾气，长椅开始腐烂成蒲公英的温床。",
        // "日记本里的字迹集体叛逃，空白处爬满潮湿的菌丝。",
        // "蚂蚁搬运着陨石的残骸，在混凝土裂缝里重建星座。",

        // "在沙漏底部埋下绿洲的倒影，等骆驼刺刺穿时间脊背，让荒原在掌心长出春天。",
        // "把贝壳种进季风的眼眶，潮汐涨落时便有了盐粒形状的回声，而珊瑚正悄然漫过指缝。",
        // "冰层裂开时游鱼衔住落日，所有凝固的火焰都将在深水区重新获得指纹。",
        // "纸船载着银河的碎屑驶向漩涡，当桅杆折断在彩虹尽头，便用露水浇筑新的星座。",
        // "苔藓正在缝补石阶的裂缝，而星光在凌晨三点学会了倒立行走。",
        // "候鸟衔走最后一片雪原时，年轮开始反向旋转，直到树根触到云层的静脉。",
        // "把蝉鸣装订成褪色的琴谱，让暴雨在琴键上长出青铜的根系。",
        // "钟摆吞食了十二个月亮，吐出的果核正在地心孵化成发光的茧。",
        // "把彗星的尾巴编成绳结，垂钓沉没在岩浆里的青铜编钟。",
        // "将极光裁剪成绷带，包扎被流星灼伤的冰川脊梁。",
        // "枯叶蝶正在复制秋天的遗嘱，而泥土深处有种子在修改年轮密码。",
        // "把闪电折进宣纸褶皱，等墨汁干涸时便游出会下雨的龙。",
        // "陨石在湖面写下倒置的经文，每一圈涟漪都是未完成的标点。",
        // "用蜘蛛网打捞下沉的暮色，直到露珠把月光腌制成透明的琥珀。",
        // "仙人掌在沙漠背面豢养海啸，每根尖刺都是尚未解封的潮信。",
        // "把蝉蜕钉在子夜的幕布上，让所有寂静都拥有裂痕的走向。",
        // "石英在岩层深处背诵光年，而钟乳石正以毫米为单位雕刻永恒。",

        "我们拒绝走入夜晚，\n于是自己点燃了太阳，\n在黄昏的裂缝里，\n种下整片银河的光。",
        "当命运掐住我的咽喉时，\n我的选择便从指缝间生根——\n它们不知道，\n我早已把“自由”\n刻在了每根骨头的背面。",
        "他们说这是宫殿，\n却给每块砖石刻满禁令——\n我的翅膀在金丝笼里\n进化成了装饰品。",
        "锁链在皮肤上刺绣，\n痛觉开成淡青色藤花。\n“放我走？”你轻笑时，\n整座牢狱突然透明，\n暴露出心脏里\n未熄灭的萤火虫墓园。",
        "你以吻封缄的囚笼，\n是月光铸的——\n每根栏杆都流淌着\n我未能说出口的\n碎钻星辰。",
        "爱你晨光里奔赴的山川，也爱你暮色中归来的灯火，愿你孩童般清澈的欢笑，永远比岁月更辽阔。",
        "你掌心有春天的温度，融化了我所有冬天的迟疑。",
        "我数到第三片落花时，风突然安静。",
        "那场樱花雨落得无声无息，像极了我们未曾说出口的告别，十五岁的风吹过，花瓣拂过睫毛的瞬间，才惊觉这盛大绚烂，原是青春一场最盛大的凋零。",
        "后来翻毕业照，照片里的人都在笑着，可十四岁的夏天，连同夏天里懵懂的心跳、未说出口的话、和永远在走廊打闹的我们，一起永远定格在那个泛黄的午后，再也没能回来。",
        "后来才懂，那天随手合上的教室门，“哐当”一声锁住的，是没勇气递出去的小纸条、刻在后桌你名字的笔画、和所有以为“永远”不会散的我们——原来青春最疼的告别，是连句“再见”都悬在喉咙里，永远停在了那个蝉鸣震耳欲聋的午后。",
        "那三年，是初夏阳光穿过树叶，碎金般洒满斑驳课桌的清澈时光；我们如同被风偶然聚拢又轻轻吹散的云，在彼此生命最透亮的扉页上，留下了一行行带着栀子花香与纸飞机轨迹的、永不褪色的诗。",
        "记得阳光里跳舞的粉笔灰，奔跑时风中的青柠香。三年时光是青春扉页上透明的诗行，你的笑声是跳动的星光。愿此去山长水阔，你身影永远轻盈，眸中盛满星辰。纵使散作漫天星子，也请记得：曾有一束光，以“同窗”为名，刻下我们永不褪色的夏天——它永不告别，只流淌在望向远方的目光里。",

        "远村秋色如画，红树间疏黄。——晏殊《诉衷情·芙蓉金菊斗馨香》",
        "绿水本无忧，因风皱面。青山原不老，为雪白头。——李文甫",
        "脉脉花疏天淡，云来去、数枝雪。——范成大《霜天晓角·梅》",
        "但屈指西风几时来，又不道流年暗中偷换。——苏轼《洞仙歌·冰肌玉骨》",

        "心有好风景，再不怕旁人煞风景。",
        "我是残败的中世纪，你是我的文艺复兴。",
        "一起去啊，更远的地方。",
        "醉后不知天在水，一舟清梦压星间。",
        "拥抱一朵玫瑰需要耐心和勇气。",
        "夏日刚到，来日还长。",
        "所有的苦难与背负尽头，都是行云流水般的此世光明。",
        "且视他人之疑目如盏盏鬼火，大胆地去走你的夜路。——史铁生《病隙碎笔》",
        "少年振衣，岂不可作千里风幡看？少年瞬目，亦可壮作万古清流想。——张晓风《林中杂想》",
        "人心中的成见就像一座大山，任你怎么努力也休想搬动。——申公豹",
        "再次相见，不必寒暄。",
        "颠倒世界的一万六千亩玫瑰凋落了，但你的长夏永远不会凋落，那是连神明都夸口称赞过的美丽的夏天。——《惊封》",
        "每个人所谓的悲欢离合都只是天地的一瞬间而已，眨眼就会被冲散，从此万籁俱寂，再也找不到踪迹。相遇是件何其珍贵的事情！",
        "宇宙于百忙之中让你降临，是为了让你看见自己的特别。——张皓宸《你是宇宙安排的邂逅》",
        "何事能奈我潇洒，将落魂都笑纳。是非皆闲话，就且随它吧。名利都放下，不过是手中的沙，何必牵挂。——檀健次《灯火千万》",

        "天雷滚滚我好怕怕，劈的我浑身掉渣渣~ ——哪吒",
        "若前方无路，我就踏出一条路。——敖丙",
        "若天地不容，我就扭转这乾坤。——哪吒",
        // "时间——一晃就过去了。",
        "申公豹：“人心中的成见就像一座大山……” 石矶娘娘：“太好了每个人心里都有我。”",
        "他（一头戴着皇冠的猪）是个传奇。——史蒂夫"

        // "我没法活成光，只好活成它的影子。——某同学原创🌟",
        // "重逢很难，不如从未相见。——某同学原创🌟",
        // "若想要改变一条汹涌的河水流向，则必将要等待一场天崩地裂。——DXL原创🌟",
        // "我的灵魂之上凿刻的，是对命运的不屑和死亡。——DXL原创🌟",
        // "他微微抬眼，时间好似静止，万物皆为虚无，只有他在闪闪发光。——DXL原创🌟",
        // "何为以后？大概就是，以彼此为星轨，并以永远为期。——DXL原创🌟",
        // "她是过去的未来，亦是未来的过去，过去因她而存在，未来因她而改变。——DXL原创🌟",
        // "如果你不在了，我会一直坐在山谷里听从前你的回音。——某同学原创🌟",
        // "我伏在天空怀里，听雨的心跳。——某同学原创🌟",
        // "我在他的眼睛里看见了自己，于是我永远存活在他的眼中了。——某同学原创🌟",
        // "太阳看见地球老去，流出的泪灼伤了我们。——某同学原创🌟",
        // "那北极星空中舞动的极光，是我最后的归冢余望。——班上某同学原创🌟",
        // "孩童的双眸，是未被翻译的星光，当世界用谎言，为他们戴上近视眼镜，那两汪清泉，依然倒映着宇宙最初的语法，磨损的成年人啊，只能蹲下来，借他们的瞳孔，冲洗自己生锈的『天真』。——网站作者原创🌟",
        // "因为你爱着这个世界，所以我愿意用我的目光追随你的目光，用我的心去感受你所感受的美好。你所眷恋的人间烟火、草木山川、悲欢离合，从此也将成为我深爱的风景。——网站作者原创🌟"
    ],
    medium: [ // 35% 概率
        "宝剑锋从磨砺出，梅花香自苦寒来。——《警世贤文·勤奋篇》",
        "千淘万漉虽辛苦，吹尽狂沙始到金。——刘禹锡《浪淘沙·莫道谗言如浪深》",
        "青春须早为，岂能长少年。——孟郊《劝学》",
        "摩霄志在潜修羽，会接鸾凰别苇丛。——刘象《鸳鸯》",
        "千门万户曈曈日，总把新桃换旧符。——王安石《元日》",
        "大鹏一日同风起，扶摇直上九万里。——李白《上李邕》",

        "春日最好的阳光照在这里，于是长路上洒满了光。",
        "我无坚不摧，也无所不能。",
        "我们与万物同行，星辰指引方向，云与光铺展成大地的模样。",
        "如果有一天，你来到我们的所抵达的终点，能为我们献上一束花吗？",
        "我以为我 无坚不摧 无所不能 直到你的出现 ——《称为》黄子弘凡",
        "当丁达尔效应出现的时候，光便有了形状。",
        "傲慢使别人无法爱我，偏见使我无法爱别人。——[英]简·奥斯汀《傲慢与偏见》",
        "我们，不是来改变世界的。我们，就是世界！——旅行团乐队",
        "我一直留着，你送给我的帽子。但我们的故事，只剩下，这首歌。——马赛克乐队《莫里森与杂货铺》",

        "在晨曦的微光中，露珠轻吻着花瓣，如同繁星点缀于夜空的边际。",
        "夕阳如熔金洒落，将天边染成一幅绚烂的画卷，静候那永不褪色的黄昏。",
        "星光在夜的织锦上细细描绘，每一颗都是未完的故事，悬于无垠的宇宙之中。",
        "风，穿越古老的巷弄，携带着时光的低语，轻抚过岁月的痕迹。",
        "月光倾洒，如细丝般缠绕着树梢，编织着夜的静谧与温柔。",
        "晨曦初破，霞光如织，天边渐渐泛起希望的色彩，迎接新日的诞生。",
        "落叶在秋风中起舞，每一片都是季节的笔触，书写着岁月的诗篇。",
        "雾气缭绕在山间，仿佛是大自然的呼吸，轻柔地覆盖着万物的梦境。",
        "雨滴轻敲窗棂，如同天空在低语，诉说着未了的情缘。",
        "在那遥远的天际，云彩编织着魔法的城堡，等待着勇敢的探险者去探寻。",

        "有个人肚子疼去医院看病，医生摸了肚子问是什么感觉，他说，我感觉有人在摸我的肚子。",
        "企鹅为什么肚子是白的，其他地方是黑的？因为手短只能洗到肚子[耶]",

        "羌笛吹落梅，让人分不清异乡和故里。",
        "渴望靠近篝火，又恐惧被温暖灼伤。",
        "崩刃的剑，依旧致命，锈蚀的盾，屹立如初。",
        "如有一味绝境，非历十方生死。",
        "预言无用，不知道结局的人生才会刺激。",
        "为何看不清故乡的模样，即时它就在心的中央。",

        // "努力是为了寻找到死亡与死亡之间的区别。——DXL原创🌟"
    ],
    low: [ // 20% 概率
        // "要么忙着活，要么忙着死。——《肖申克的救赎》",
        // "希望是好事，也许是人间至善，而美好的事永不消逝。——《肖申克的救赎》",
        // "当落叶枯去，你会不会为它闭上眼睛？——《小雨中》",
        // "人会迷路，人会消失，人会被抹去然后重生。——《S.》",
        // "截神之力，引为柴薪，依人之智，烹然烈火。——游戏《尘白禁区》角色芙提雅·伊格妮丝，由班上某（可能是唯一一个）该游戏玩家投稿"
    ]
};

// const originalPhrases = {
//     high: [
//         "那北极星空中舞动的极光，是我最后的归冢余望。——班上某同学原创",
//         "我没法活成光，只好活成它的影子。——某同学原创",
//         "重逢很难，不如从未相见。——某同学原创",
//         "若想要改变一条汹涌的河水流向，则必将要等待一场天崩地裂。——DXL原创",
//         "我的灵魂之上凿刻的，是对命运的不屑和死亡。——DXL原创",
//         "他微微抬眼，时间好似静止，万物皆为虚无，只有他在闪闪发光。——DXL原创",
//         "何为以后？大概就是，以彼此为星轨，并以永远为期。——DXL原创",
//         "她是过去的未来，亦是未来的过去，过去因她而存在，未来因她而改变。——DXL原创",
//         "如果你不在了，我会一直坐在山谷里听从前你的回音。——某同学原创",
//         "我伏在天空怀里，听雨的心跳。——某同学原创",
//         "我在他的眼睛里看见了自己，于是我永远存活在他的眼中了。——某同学原创",
//         "太阳看见地球老去，流出的泪灼伤了我们。——某同学原创"
//     ],
//     medium: [
//         "努力是为了寻找到死亡与死亡之间的区别。——DXL原创"
//     ],
//     low: []
// };



window.localPhrases = localPhrases;
```

## 4 `js/data/schedule.js`
```js
const schedule = {
    weekday: [
        ["6:30-7:00", "早餐"],
        ["7:00-7:40", "早读"],
        ["7:40-7:50", "课间"],
        ["7:50-8:35", "第一节课"],
        ["8:35-9:05", "大课间"],
        ["9:05-9:50", "第二节课"],
        ["9:50-10:00", "课间"],
        ["10:00-10:45", "第三节课"],
        ["10:45-10:55", "课间"],
        ["10:55-11:40", "第四节课"],
        ["11:40-12:20", "午餐"],
        ["12:20-13:50", "午休"],
        ["13:50-14:00", "课间"],
        ["14:00-14:45", "第五节课"],
        ["14:45-14:55", "课间"],
        ["14:55-15:40", "第六节课"],
        ["15:40-15:50", "课间"],
        ["15:50-16:35", "第七节课"],
        ["16:35-17:05", "大课间"],
        ["17:05-17:40", "第八节课"],
        ["17:40-18:15", "晚餐"],
        ["18:15-18:20", "晚自习预备"],
        ["18:20-19:05", "第一节晚自习"],
        ["19:05-19:15", "课间"],
        ["19:15-20:00", "第二节晚自习"],
        ["20:00-20:10", "课间"],
        ["20:10-20:50", "第三节晚自习"],
        ["20:50-21:00", "课间"],
        ["21:00-21:40", "第四节晚自习"],
        ["21:40-6:30", "睡觉"]
    ],
    friday: [
        ["6:30-7:00", "早餐"],
        ["7:00-7:40", "早读"],
        ["7:40-7:50", "课间"],
        ["7:50-8:35", "第一节课"],
        ["8:35-9:05", "大课间"],
        ["9:05-9:50", "第二节课"],
        ["9:50-10:00", "课间"],
        ["10:00-10:45", "第三节课"],
        ["10:45-10:55", "课间"],
        ["10:55-11:40", "第四节课"],
        ["11:40-12:20", "午餐"],
        ["12:20-13:50", "午休"],
        ["13:50-14:00", "课间"],
        ["14:00-14:45", "第五节课"],
        ["14:45-14:55", "课间"],
        ["14:55-15:40", "第六节课"],
        ["15:40-15:50", "课间"],
        ["15:50-16:35", "第七节课"],
        ["16:35-17:05", "大课间"],
        ["17:05-17:40", "第八节课"],
        ["17:40-23:59", "放学回家"]
    ],
    saturday: [
        ["0:00-23:59", "周末"]
    ],
    sunday: [
        ["0:00-17:40", "周末"],
        ["17:40-18:20", "返校"],
        ["18:20-19:05", "第一节晚自习"],
        ["19:05-19:15", "课间"],
        ["19:15-20:00", "第二节晚自习"],
        ["20:00-20:10", "课间"],
        ["20:10-20:50", "第三节晚自习"],
        ["20:50-21:00", "课间"],
        ["21:00-21:40", "第四节晚自习"],
        ["21:40-6:30", "睡觉"]
    ]
};

const schedule2 = {
    weekday: [
        ["7:00-7:30", "早餐"],
        ["7:30-7:50", "早读"],
        ["7:50-8:00", "课间"],
        ["8:00-8:40", "第一节课"],
        ["8:40-8:50", "课间"],
        ["8:50-9:30", "第二节课"],
        ["9:30-9:40", "课间"],
        ["9:40-10:20", "第三节课"],
        ["10:20-10:30", "课间"],
        ["10:30-11:10", "第四节课"],
        ["11:10-11:20", "课间"],
        ["11:20-12:00", "第五节课"],
        ["12:00-12:40", "午餐"],
        ["12:40-13:40", "午休"],
        ["13:40-13:50", "课间"],
        ["13:50-14:00", "课前唱"],
        ["14:00-14:40", "第六节课"],
        ["14:40-14:50", "课间"],
        ["14:50-15:30", "第七节课"],
        ["15:30-15:40", "课间"],
        ["15:40-15:45", "考前准备"],
        ["15:45-17:45", "考试"],
        ["17:45-18:30", "晚餐"],
        ["18:30-19:00", "政史背记"],
        ["19:00-20:00", "第一节晚自习"],
        ["20:00-20:10", "课间"],
        ["20:10-21:30", "第二节晚自习"],
        ["21:30-21:40", "课间"],
        ["21:40-22:20", "第三节晚自习"],
        ["22:20-7:00", "洗漱睡觉"]
    ],
    friday: [
        ["7:00-7:30", "早餐"],
        ["7:30-7:50", "早读"],
        ["7:50-8:00", "课间"],
        ["8:00-8:40", "第一节课"],
        ["8:40-8:50", "课间"],
        ["8:50-9:30", "第二节课"],
        ["9:30-9:40", "课间"],
        ["9:40-10:20", "第三节课"],
        ["10:20-10:30", "课间"],
        ["10:30-11:10", "第四节课"],
        ["11:10-11:20", "课间"],
        ["11:20-12:00", "第五节课"],
        ["12:00-12:40", "午餐"],
        ["12:40-13:40", "午休"],
        ["13:40-13:50", "课间"],
        ["13:50-14:00", "课前唱"],
        ["14:00-14:40", "第六节课"],
        ["14:40-14:50", "课间"],
        ["14:50-15:30", "第七节课"],
        ["15:30-15:40", "课间"],
        ["15:40-15:45", "考前准备"],
        ["15:45-17:25", "考试"],
        ["17:25-23:59", "放学回家"]
    ],
    saturday: [
        ["0:00-23:59", "周末"]
    ],
    sunday: [
        ["17:45-18:30", "晚餐"],
        ["18:30-19:00", "政史背记"],
        ["19:00-20:00", "第一节晚自习"],
        ["20:00-20:10", "课间"],
        ["20:10-21:30", "第二节晚自习"],
        ["21:30-21:40", "课间"],
        ["21:40-22:20", "第三节晚自习"],
        ["22:20-7:00", "洗漱睡觉"]
    ]
};

const schedule_last = {
    weekday: [
        ["7:00-7:30", "早餐"],
        ["7:30-7:50", "早读"],
        ["7:50-8:00", "课间"],
        ["8:00-8:40", "第一节课"],
        ["8:40-8:50", "课间"],
        ["8:50-9:30", "第二节课"],
        ["9:30-9:40", "课间"],
        ["9:40-10:20", "第三节课"],
        ["10:20-10:30", "课间"],
        ["10:30-11:10", "第四节课"],
        ["11:10-11:20", "课间"],
        ["11:20-12:00", "第五节课"],
        ["12:00-12:40", "午餐"],
        ["12:40-13:40", "午休"],
        ["13:40-13:50", "课间"],
        ["13:50-14:00", "课前唱"],
        ["14:00-14:40", "第六节课"],
        ["14:40-14:50", "课间"],
        ["14:50-15:30", "第七节课"],
        ["15:30-15:40", "课间"],
        ["15:40-15:45", "考前准备"],
        ["15:45-17:45", "考试"],
        ["17:45-18:30", "晚餐"],
        ["18:30-19:00", "政史背记"],
        ["19:00-20:00", "第一节晚自习"],
        ["20:00-20:10", "课间"],
        ["20:10-21:30", "第二节晚自习"],
        ["21:30-21:40", "课间"],
        ["21:40-22:20", "第三节晚自习"],
        ["22:20-7:00", "洗漱睡觉"]
    ],
    friday: [
        ["7:00-7:30", "早餐"],
        ["7:30-7:50", "早读"],
        ["7:50-8:00", "课间"],
        ["8:00-8:40", "第一节课"],
        ["8:40-8:50", "课间"],
        ["8:50-9:30", "第二节课"],
        ["9:30-9:40", "课间"],
        ["9:40-10:20", "第三节课"],
        ["10:20-10:30", "课间"],
        ["10:30-11:10", "第四节课"],
        ["11:10-11:20", "课间"],
        ["11:20-12:00", "第五节课"],
        ["12:00-12:40", "午餐"],
        ["12:40-13:40", "午休"],
        ["13:40-13:50", "课间"],
        ["13:50-14:00", "课前唱"],
        ["14:00-14:40", "第六节课"],
        ["14:40-14:50", "课间"],
        ["14:50-15:30", "第七节课"],
        ["15:30-15:40", "课间"],
        ["15:40-15:45", "考前准备"],
        ["15:45-17:25", "考试"],
        ["17:25-23:59", "放学"]
    ]
};

```

## 5 `js/data/solarterms.js`
```js
const solarTerms = [
    { 
        name: '立春', 
        month: 1, 
        day: 3, 
        color: '#a5d6a7',
        image: 'images/立春.png',
        desc: '立春是二十四节气之首，标志着冬天的结束和春天的开始。此时气温开始回暖，万物复苏，东风送暖，柳树发芽，梅花绽放。古代有迎春仪式和咬春习俗，人们祈求新年吉祥如意。'
    },
    { 
        name: '雨水', 
        month: 1, 
        day: 18, 
        color: '#8bc34a',
        image: 'images/雨水.png',
        desc: '雨水节气正值仲春之初，气温继续回升，降水增多，冰雪融化。这个时节适宜春耕备耕，农民开始忙碌农事。古人有"獭祭鱼"、"鸿雁来"等物候现象观察记载。'
    },
    { 
        name: '惊蛰', 
        month: 2, 
        day: 5, 
        color: '#7cb342',
        image: 'images/惊蛰.png',
        desc: '惊蛰时节春雷始鸣，蛰伏的昆虫被惊醒而出。此时桃花盛开，杏花怒放，田间地头一片繁忙景象。古有"桃始华"、"仓庚鸣"的物候特征。'
    },
    { 
        name: '春分', 
        month: 2, 
        day: 20, 
        color: '#69a63d',
        image: 'images/春分.png',
        desc: '春分日昼夜平分，标志着春季中期。此时莺飞草长，小麦拔节孕穗，农事活动进入繁忙阶段。民间有竖蛋游戏和祭日习俗。'
    },
    { 
        name: '清明', 
        month: 3, 
        day: 4, 
        color: '#5d9536',
        image: 'images/清明.png',
        desc: '清明时节气温升高，春雨绵绵滋润大地。这是扫墓祭祖的重要日子，也是踏青赏花的好时机。古代有蹴鞠、荡秋千等娱乐活动。'
    },
    { 
        name: '谷雨', 
        month: 3, 
        day: 20, 
        color: '#4d802e',
        image: 'images/谷雨.png',
        desc: '谷雨是春季最后一个节气，降雨量增加利于谷物生长。此时牡丹盛开，茶树抽新芽，农忙季节全面到来。有"萍始生"、"鸣鸠拂其羽"等物候现象。'
    },
    { 
        name: '立夏', 
        month: 4, 
        day: 5, 
        color: '#467930',
        image: 'images/立夏.png',
        desc: '立夏标志着夏季的开始，气温显著上升。此时蝼蝈鸣叫，蚯蚓出地面，王瓜开始生长。古代有"迎夏"仪式和尝新活动。'
    },
    { 
        name: '小满', 
        month: 4, 
        day: 21, 
        color: '#3d6826',
        image: 'images/小满.png',
        desc: '小满时节麦类作物籽粒开始饱满但未成熟。此时蚕结茧，菜子成熟可以收割。农谚有"小满小满，麦粒渐满"的说法。'
    },
    { 
        name: '芒种', 
        month: 5, 
        day: 5, 
        color: '#30571f',
        image: 'images/芒种.png',
        desc: '芒种是农忙时节，北方麦收南方插秧。此时梅子成熟，天气潮湿闷热。农谚说"芒种忙忙种"，抓紧时间播种作物。'
    },
    { 
        name: '夏至', 
        month: 5, 
        day: 21, 
        color: '#254517',
        image: '夏至.png',
        desc: '夏至日北半球白昼最长，标志着盛夏到来。此时蝉鸣阵阵，荷花盛开，农作物生长旺盛。古人有祭天仪式和消夏活动。'
    },
    { 
        name: '小暑', 
        month: 6, 
        day: 7, 
        color: '#1c3611',
        image: '小暑.png',
        desc: '小暑时节天气逐渐炎热，雷雨增多。此时蟋蟀开始在墙角鸣叫，鹰隼捕食更加频繁。农谚有"小暑大暑，灌死老鼠"的说法。'
    },
    { 
        name: '大暑', 
        month: 6, 
        day: 22, 
        color: '#122408',
        image: '大暑.png',
        desc: '大暑是一年中最热的时节，高温酷暑考验着万物生长。此时荷花盛开至极，雷阵雨频繁出现。古人有饮伏茶、晒伏姜的习俗。'
    },
    { 
        name: '立秋', 
        month: 7, 
        day: 7, 
        color: '#1a3a4a',
        image: '立秋.png',
        desc: '立秋标志着秋天的开始，气温由热转凉。此时早晚温差加大，稻谷抽穗扬花。古人有"贴秋膘"、"啃秋"等习俗。'
    },
    { 
        name: '处暑', 
        month: 7, 
        day: 23, 
        color: '#2d4d5d',
        image: '处暑.png',
        desc: '处暑时节暑气消退，秋意渐浓。此时农作物进入成熟期，农民开始收割。古代有"祭蜡"和"迎秋"仪式。'
    },
    { 
        name: '白露', 
        month: 8, 
        day: 7, 
        color: '#3d5d6d',
        image: '白露.png',
        desc: '白露时节天气转凉，清晨露水凝结成霜。此时鸿雁南飞，菊花开放。农谚有"白露白茫茫，无谷满粮仓"的说法。'
    },
    { 
        name: '秋分', 
        month: 8, 
        day: 23, 
        color: '#4d6d7d',
        image: '秋分.png',
        desc: '秋分日昼夜平分，标志着秋季中期。此时秋高气爽，桂花飘香。古代有"竖蛋"和"送秋牛"的习俗。'
    },
    { 
        name: '寒露', 
        month: 9, 
        day: 8, 
        color: '#5d7d8d',
        image: '寒露.png',
        desc: '寒露时节气温降低，露水寒冷凝结。此时菊花盛开至极，农事进入抢收阶段。古人有赏菊和饮菊花酒的习俗。'
    },
    { 
        name: '霜降', 
        month: 9, 
        day: 23, 
        color: '#6d8da7',
        image: '霜降.png',
        desc: '霜降是秋季最后一个节气，天气渐冷初霜出现。此时柿子成熟红透，枫叶变红。农谚有"霜降见霜，米谷满仓"的说法。'
    },
    { 
        name: '立冬', 
        month: 10, 
        day: 7, 
        color: '#7d9dc3',
        image: '立冬.png',
        desc: '立冬标志着冬季的开始，气温明显下降。此时水始冰地始冻，农民开始准备越冬作物。古代有"贺冬"和"补冬"的习俗。'
    },
    { 
        name: '小雪', 
        month: 10, 
        day: 22, 
        color: '#8da6d9',
        image: '小雪.png',
        desc: '小雪时节天气寒冷降雪开始。此时阴气下降阳气上升，农事进入冬闲时期。古人有腌制腊肉和观赏雪景的习俗。'
    },
    { 
        name: '大雪', 
        month: 11, 
        day: 7, 
        color: '#9fb4e6',
        image: '大雪.png',
        desc: '大雪时节降雪量增加天气更加寒冷。此时鹖鸟不鸣虎始交，农事基本结束进入农闲。古人有赏雪和制作腊肉的习俗。'
    },
    { 
        name: '冬至', 
        month: 11, 
        day: 21, 
        color: '#b3c2ec',
        image: '冬至.png',
        desc: '冬至日北半球白昼最短标志着寒冬到来。此时蚯蚓结麋角解水泉动，古代有"冬至大如年"的说法和祭祀活动。'
    },
    { 
        name: '小寒', 
        month: 12, 
        day: 6, 
        color: '#c5d1f0',
        image: '小寒.png',
        desc: '小寒时节天气寒冷但未达极点。此时雁北乡鹊始巢雉雊鸲，农事基本停止进入农闲。古人有"数九消寒"的习俗。'
    },
    { 
        name: '大寒', 
        month: 12, 
        day: 20, 
        color: '#d9e0ff',
        image: '大寒.png',
        desc: '大寒是一年中最冷时节标志着冬季尾声。此时鸡乳泽腹水泉动，农事全部结束准备过年。古人有"除旧布新"的习俗迎接新春到来。'
    }
];
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
    intervalDuration: 15000,
    apiProbability: 50,
    lostAndFoundFontSize: 28,
    notifications: [],
    lastPhrase: null
};

window.App.Timers = {
    phrase: null,
    weather: null,
    refresh: null,
    image: null
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
            e.target.checked ? this.start() : this.stop();
        });

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

## 11 `js/features/daily_image.js`
```js
window.App.DailyImage = {
    init() {
        const switchBtn = document.getElementById('imageSwitch');
        if (switchBtn && !switchBtn.checked) {
            const container = document.querySelector('.right-image-container');
            if (container) container.style.display = 'none';
            return;
        }

        this.updateImage();
        clearInterval(window.App.Timers.image);
        window.App.Timers.image = setInterval(() => this.updateImage(), 86400000);
    },

    updateImage() {
        const img = document.getElementById('apiImage');
        const container = document.querySelector('.right-image-container');
        if (!img || !container) return;

        container.style.display = 'flex';
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.5s';

        const t = Date.now();
        const temp = new Image();
        temp.onload = () => {
            img.src = `https://v.api.aa1.cn/api/60s-v3/?t=${t}`;
            img.style.opacity = '1';
        };
        temp.onerror = () => {
            img.src = `https://api.03c3.cn/zb/api.php?t=${t}`;
            img.style.opacity = '1';
        };
        temp.src = `https://v.api.aa1.cn/api/60s-v3/?t=${t}`;
    }
};

```

## 12 `js/features/exam_countdown.js`
```js
window.App.ExamCountdown = {
    init() {
        this.update();
    },

    update() {
        const target = new Date(2028, 5, 7);
        const diff = target - new Date();
        const days = Math.max(0, Math.ceil(diff / 86400000));

        const el = document.getElementById('daysUntil');
        if (el) el.textContent = `${days}天`;

        const now = new Date();
        setTimeout(() => this.update(), 86400000 - (now % 86400000));
    }
};

```

## 13 `js/features/golden_phrase.js`
```js
window.App.GoldenPhrase = {
    apiConfigs: [
        {
            url: 'https://zj.v.api.aa1.cn/api/wenan-shici/?type=json',
            method: 'GET',
            weight: 15,
            maxRetry: 3,
            handler(data) {
                const text = data.msg || '';
                return text.length <= 100 ? text : null;
            }
        },
        {
            url: 'https://api.songzixian.com/api/daily-poem?dataSource=LOCAL_DAILY_POEM',
            method: 'GET',
            weight: 15,
            maxRetry: 3,
            handler(data) {
                if (!data.data) return null;
                const title = (data.data.title || '').replace(/\s*·\s*/g, '·');
                const formatted = /^《(.+)》$/.test(title) ? title : `《${title}》`;
                return `${data.data.quotes || ''}——${data.data.author || ''}${formatted}`;
            }
        },
        {
            url: 'https://zj.v.api.aa1.cn/api/wenan-wm/?type=json',
            method: 'GET',
            weight: 20,
            maxRetry: 3,
            handler(data) {
                const text = data.msg || '';
                return text.length <= 100 ? text : null;
            }
        },
        {
            url: 'https://zj.v.api.aa1.cn/api/wenan-mj/?type=json',
            method: 'GET',
            weight: 30,
            maxRetry: 3,
            handler(data) {
                const text = data.msg || '';
                return text.length <= 100 ? text : null;
            }
        },
        {
            url: 'https://api.mu-jie.cc/stray-birds/range?type=json',
            method: 'GET',
            weight: 20,
            maxRetry: 5,
            handler(data) {
                const cnLength = data.cn?.length || 0;
                const enLength = data.en?.length || 0;
                if (cnLength > 100) return null;
                if (enLength * 0.5 + cnLength <= 100) return `${data.en}（${data.cn}）——泰戈尔`;
                return `${data.cn}——泰戈尔`;
            }
        }
    ],

    init() {
        this.fetch();
        this.startTimer();
        this.bindClickRefresh();
    },

    startTimer() {
        this.stopTimer();
        const interval = Number(window.App.State?.intervalDuration) || 15000;
        window.App.Timers.phrase = setInterval(() => this.fetch(), interval);
    },

    stopTimer() {
        if (window.App.Timers.phrase) {
            clearInterval(window.App.Timers.phrase);
            window.App.Timers.phrase = null;
        }
    },

    async fetchWithRetry(api, retry = 0) {
        try {
            const res = await fetch(api.url, { method: api.method || 'GET' });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const text = api.handler(await res.json());
            if (text !== null && text !== '') return text;

            if (retry < api.maxRetry) return this.fetchWithRetry(api, retry + 1);
            throw new Error('超过最大重试次数');
        } catch (err) {
            if (retry < api.maxRetry) return this.fetchWithRetry(api, retry + 1);
            throw err;
        }
    },

    selectRandomAPI() {
        const total = this.apiConfigs.reduce((sum, api) => sum + api.weight, 0);
        let random = Math.random() * total;

        for (const api of this.apiConfigs) {
            if (random < api.weight) return api;
            random -= api.weight;
        }
        return this.apiConfigs[0];
    },

    async fetch() {
        const probability = Number(window.App.State?.apiProbability ?? 50);
        if (Math.random() >= probability / 100) return this.showLocal();

        try {
            const text = await this.fetchWithRetry(this.selectRandomAPI());
            this.updateDisplay(text);
        } catch (err) {
            console.warn('联网金句获取失败，改用本地金句：', err);
            this.showLocal();
        }
    },

    updateDisplay(text) {
        const container = document.getElementById('goldenPhrase');
        if (!container) return;

        const finalText = text === undefined || text === null ? '' : String(text);
        const animationEnabled = document.getElementById('animationSwitch')?.checked !== false;
        const formatted = this.escapeHTML(finalText).replace(/\n/g, '<br>');

        const apply = () => {
            container.innerHTML = `「 ${formatted} 」`;
            container.style.opacity = '1';
        };

        if (animationEnabled) {
            container.style.opacity = '0';
            setTimeout(apply, 500);
        } else {
            apply();
        }
    },

    showLocal() {
        const data = window.localPhrases || { high: [], medium: [], low: [] };
        const toArray = value => (Array.isArray(value) ? value : []);
        const onlyOriginal = document.getElementById('originalSwitch')?.checked || false;
        const filter = list => (onlyOriginal ? list.filter(p => String(p).trim().endsWith('🌟')) : list);

        const high = filter(toArray(data.high));
        const medium = filter(toArray(data.medium));
        const low = filter(toArray(data.low));
        const all = [...high, ...medium, ...low];

        if (!all.length) return this.updateDisplay('🎯 没有找到金句');

        const last = window.App.State.lastPhrase;
        const pick = list => {
            const candidates = list.filter(p => p !== last);
            const pool = candidates.length ? candidates : list;
            return pool[Math.floor(Math.random() * pool.length)];
        };

        let selected;

        // high 45% / medium 35% / low 20%
        if (!onlyOriginal) {
            const pools = [];
            if (high.length) pools.push({ list: high, weight: 45 });
            if (medium.length) pools.push({ list: medium, weight: 35 });
            if (low.length) pools.push({ list: low, weight: 20 });

            const total = pools.reduce((sum, pool) => sum + pool.weight, 0);
            let random = Math.random() * total;

            for (const pool of pools) {
                if (random < pool.weight) {
                    selected = pick(pool.list);
                    break;
                }
                random -= pool.weight;
            }
        }

        if (!selected) {
            const candidates = all.filter(p => p !== last);
            const pool = candidates.length ? candidates : all;
            selected = pool[Math.floor(Math.random() * pool.length)];
        }

        window.App.State.lastPhrase = selected;
        this.updateDisplay(selected);
    },

    bindClickRefresh() {
        const container = document.getElementById('goldenPhrase');
        if (!container) return;

        container.addEventListener('click', () => {
            if (!document.getElementById('clickRefreshSwitch')?.checked) return;

            const animationEnabled = document.getElementById('animationSwitch')?.checked !== false;

            if (animationEnabled) {
                container.style.transform = 'scale(0.98)';
                setTimeout(() => {
                    container.style.transform = 'scale(1)';
                    this.fetch();
                }, 300);
            } else {
                this.fetch();
            }

            if (document.getElementById('goldenSwitch')?.checked) this.startTimer();
        });
    },

    escapeHTML(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
};

```

## 14 `js/features/main.js`
```js
window.onload = function () {
    const safeInit = (name, fn) => {
        try {
            if (typeof fn === 'function') fn();
            else console.warn(`⚠️ 模块 ${name} 未找到或 init 不是函数`);
        } catch (e) {
            console.error(`❌ 模块 ${name} 初始化失败:`, e);
        }
    };

    // 核心功能模块
    safeInit('Clock', () => window.App.Clock?.init());
    safeInit('Weather', () => window.App.Weather?.init());
    safeInit('DailyImage', () => window.App.DailyImage?.init());
    safeInit('Timeline', () => window.App.Timeline?.init());
    safeInit('ExamCountdown', () => window.App.ExamCountdown?.init());
    safeInit('SchoolSchedule', () => window.App.SchoolSchedule?.init());
    safeInit('GoldenPhrase', () => window.App.GoldenPhrase?.init());
    safeInit('AutoRefresh', () => window.App.AutoRefresh?.init());

    // 弹窗交互模块
    safeInit('ModalCore', () => window.App.ModalCore?.init());
    safeInit('ModalSettings', () => window.App.ModalSettings?.init());
    safeInit('ModalLostFound', () => window.App.ModalLostFound?.init());
    safeInit('ModalNotification', () => window.App.ModalNotification?.init());
    safeInit('ModalPhrase', () => window.App.ModalPhrase?.init());

    // 显示主界面
    const loadingOverlay = document.getElementById('loadingOverlay');
    const pageContent = document.getElementById('pageContent');
    if (loadingOverlay) loadingOverlay.style.display = 'none';
    if (pageContent) pageContent.style.display = 'block';
};

window.addEventListener('unload', () => {
    try {
        if (window.App.Timers?.phrase) clearInterval(window.App.Timers.phrase);
    } catch (e) {
        /* 忽略卸载时的错误 */
    }
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

        ['maximizeNotification', 'maximizeLostAndFound'].forEach(id => {
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

## 16 `js/features/modal_lost_found.js`
```js
window.App.ModalLostFound = {
    init() {
        this.bindEvents();
        this.initFontSizeControl();
    },

    bindEvents() {
        const list = document.getElementById('lostAndFoundList');
        if (!list) return;

        // 点击文字 -> 行内编辑
        list.addEventListener('click', e => {
            const target = e.target;
            if (!target.classList.contains('editable')) return;

            const input = document.createElement('input');
            input.className = 'edit-input';
            input.value = target.textContent;
            input.style.width = target.offsetWidth + 'px';

            input.addEventListener('blur', function () {
                target.textContent = this.value;
                target.style.display = 'inline';
                input.remove();
            });

            input.addEventListener('input', function () {
                this.style.width = this.value.length * 20 + 30 + 'px';
            });

            target.style.display = 'none';
            target.parentNode.insertBefore(input, target);
            input.focus();
        });

        // 新增卡片
        const addBtn = document.querySelector('#lostAndFoundList .add-button');
        addBtn?.addEventListener('click', () => {
            const newCard = document.createElement('div');
            newCard.className = 'announcement-card';
            newCard.innerHTML = `
                <div class="announcement-body" style="position:relative; text-align: center; font-family: STZhongsong, serif;">
                    <span class="editable" data-type="name" style="color: #1E90FF;">同学</span>
                    <span class="static-text">的</span>
                    <span class="editable" data-type="item" style="color: #1E90FF;">物品</span>
                    <button class="delete-btn">删除</button>
                </div>
            `;
            list.appendChild(newCard);

            newCard.querySelectorAll('.editable, .static-text').forEach(item => {
                item.style.fontSize = `${window.App.State.lostAndFoundFontSize}px`;
            });
        });

        // 删除（二次确认）
        list.addEventListener('click', e => {
            if (!e.target.classList.contains('delete-btn')) return;

            if (e.target.textContent === '删除') {
                e.target.textContent = '确认删除';
                e.target.style.background = '#d32f2f';
            } else {
                e.target.closest('.announcement-card').remove();
            }
        });

        // 点击其他区域重置删除按钮
        document.addEventListener('click', e => {
            if (!e.target.classList.contains('delete-btn')) {
                document.querySelectorAll('#lostAndFoundList .delete-btn').forEach(btn => {
                    btn.textContent = '删除';
                    btn.style.background = '#f44';
                });
            }
        });
    },

    initFontSizeControl() {
        const slider = document.getElementById('lostAndFoundFontSizeSlider');
        const valueInput = document.getElementById('lostAndFoundFontSizeValue');
        if (!slider || !valueInput) return;

        slider.addEventListener('input', () => this.updateFontSize(parseInt(slider.value, 10)));

        valueInput.addEventListener('input', () => {
            let val = parseInt(valueInput.value, 10) || 28;
            val = Math.min(120, Math.max(12, val));
            this.updateFontSize(val);
        });

        this.updateFontSize(28);
    },

    updateFontSize(size) {
        window.App.State.lostAndFoundFontSize = size;

        const slider = document.getElementById('lostAndFoundFontSizeSlider');
        const valueInput = document.getElementById('lostAndFoundFontSizeValue');
        if (slider) slider.value = size;
        if (valueInput) valueInput.value = size;

        document.querySelectorAll('#lostAndFoundList .editable, #lostAndFoundList .static-text').forEach(item => {
            item.style.fontSize = `${size}px`;
        });
    }
};

```

## 17 `js/features/modal_notification.js`
```js
window.App.ModalNotification = {
    init() {
        this.bindEvents();
        this.render();
    },

    adjustTextareaHeight(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = Math.max(100, textarea.scrollHeight) + 'px';
    },

    render() {
        const content = document.getElementById('notificationContent');
        if (!content) return;

        content.innerHTML = '';

        if (window.App.State.notifications.length === 0) {
            content.innerHTML = '<div class="empty-notification">暂无通知，点击下方按钮添加</div>';
            return;
        }

        const currentFontSize = content.style.fontSize || '16px';

        window.App.State.notifications.forEach((text, index) => {
            const item = document.createElement('div');
            item.className = 'notification-item';
            item.dataset.index = index;
            item.innerHTML = text.replace(/\n/g, '<br>');
            item.style.fontSize = currentFontSize;

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-notification-btn';
            deleteBtn.textContent = '删除';
            deleteBtn.dataset.index = index;
            item.appendChild(deleteBtn);

            deleteBtn.addEventListener('click', e => {
                e.stopPropagation();
                if (e.target.textContent === '删除') {
                    e.target.textContent = '确认删除';
                    e.target.style.background = '#d32f2f';
                } else {
                    window.App.State.notifications.splice(e.target.dataset.index, 1);
                    this.render();
                }
            });

            item.addEventListener('click', e => {
                if (e.target.classList.contains('delete-notification-btn')) return;

                const idx = item.dataset.index;
                const textarea = document.createElement('textarea');
                textarea.className = 'notification-editable';
                textarea.value = window.App.State.notifications[idx];
                textarea.style.fontSize = currentFontSize;

                item.innerHTML = '';
                item.appendChild(textarea);
                this.adjustTextareaHeight(textarea);
                textarea.focus();

                textarea.addEventListener('input', () => this.adjustTextareaHeight(textarea));

                textarea.addEventListener('keydown', evt => {
                    if (evt.key === 'Enter' && !evt.shiftKey) {
                        evt.preventDefault();
                        const start = textarea.selectionStart;
                        const end = textarea.selectionEnd;
                        textarea.value =
                            textarea.value.substring(0, start) + '\n' + textarea.value.substring(end);
                        textarea.selectionStart = textarea.selectionEnd = start + 1;
                        this.adjustTextareaHeight(textarea);
                    }
                });

                textarea.addEventListener('blur', () => {
                    window.App.State.notifications[idx] = textarea.value;
                    this.render();
                });
            });

            content.appendChild(item);
        });
    },

    bindEvents() {
        const addBtn = document.getElementById('addNotificationBtn');
        const content = document.getElementById('notificationContent');
        const slider = document.getElementById('fontSizeSlider');
        const valueInput = document.getElementById('fontSizeValue');

        addBtn?.addEventListener('click', () => {
            window.App.State.notifications.push('新通知 - 点击编辑内容');
            this.render();
            if (content) content.scrollTop = content.scrollHeight;
        });

        if (slider && valueInput && content) {
            slider.addEventListener('input', () => {
                content.style.fontSize = slider.value + 'px';
                valueInput.value = slider.value;
                this.render();
            });

            valueInput.addEventListener('input', () => {
                let val = parseInt(valueInput.value, 10) || 16;
                val = Math.min(120, Math.max(12, val));
                content.style.fontSize = val + 'px';
                slider.value = val;
                this.render();
            });
        }

        document.addEventListener('click', e => {
            if (!e.target.classList.contains('delete-notification-btn')) {
                document.querySelectorAll('.delete-notification-btn').forEach(btn => {
                    btn.textContent = '删除';
                    btn.style.background = '#f44';
                });
            }
        });
    }
};

```

## 18 `js/features/modal_phrase.js`
```js
window.App.ModalPhrase = {
    init() {
        const openBtn = document.getElementById('phraseSelectButton');
        const modal = document.getElementById('phraseModal');
        const closeBtn = document.getElementById('closePhrase');

        openBtn?.addEventListener('click', () => {
            this.populateList();
            modal.classList.add('active');
        });

        closeBtn?.addEventListener('click', () => modal.classList.remove('active'));
    },

    populateList() {
        const container = document.getElementById('phraseList');
        if (!container) return;

        const data = window.localPhrases || {};
        const allPhrases = [
            ...(data.high || []),
            ...(data.medium || []),
            ...(data.low || [])
        ];

        container.innerHTML = '';
        const fragment = document.createDocumentFragment();

        allPhrases.forEach(phrase => {
            const item = document.createElement('div');
            item.className = 'phrase-item';
            item.innerHTML = String(phrase).replace(/\n/g, '<br>');

            item.addEventListener('click', () => {
                item.classList.add('phrase-click-effect');
                setTimeout(() => item.classList.remove('phrase-click-effect'), 400);

                window.App.GoldenPhrase?.updateDisplay(phrase);

                document.getElementById('phraseModal')?.classList.remove('active');

                if (document.getElementById('goldenSwitch')?.checked && window.App.GoldenPhrase) {
                    window.App.GoldenPhrase.stopTimer();
                    window.App.GoldenPhrase.startTimer();
                }
            });

            fragment.appendChild(item);
        });

        container.appendChild(fragment);
    }
};

```

## 19 `js/features/modal_settings.js`
```js
window.App.ModalSettings = {
    init() {
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

    setProbability(value) {
        const finalValue = this.clamp(value, 0, 100, 50);

        const slider = document.getElementById('apiProbability');
        const number = document.getElementById('apiProbabilityValue');
        if (slider) slider.value = finalValue;
        if (number) number.value = finalValue;
        if (window.App.State) window.App.State.apiProbability = finalValue;
    },

    setIntervalDuration(value) {
        const finalValue = this.clamp(value, 1, 60, 15);

        const slider = document.getElementById('intervalSlider');
        const number = document.getElementById('intervalValue');
        if (slider) slider.value = finalValue;
        if (number) number.value = finalValue;
        if (window.App.State) window.App.State.intervalDuration = finalValue * 1000;

        if (document.getElementById('goldenSwitch')?.checked) {
            window.App.GoldenPhrase?.startTimer();
        }
    },

    // 把一个 range 和一个 number 输入框双向绑定
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

        apply(range?.value ?? number?.value ?? fallback);
    },

    bindProbability() {
        this.bindPair('apiProbability', 'apiProbabilityValue', {
            min: 0,
            max: 100,
            fallback: 50,
            onInput: value => {
                if (window.App.State) window.App.State.apiProbability = value;
            }
        });
    },

    bindInterval() {
        this.bindPair('intervalSlider', 'intervalValue', {
            min: 1,
            max: 60,
            fallback: 15,
            onInput: value => {
                if (window.App.State) window.App.State.intervalDuration = value * 1000;
                if (document.getElementById('goldenSwitch')?.checked) {
                    window.App.GoldenPhrase?.startTimer();
                }
            }
        });
    },

    bindSwitches() {
        document.getElementById('goldenSwitch')?.addEventListener('change', e => {
            if (!window.App.GoldenPhrase) return;
            e.target.checked ? window.App.GoldenPhrase.startTimer() : window.App.GoldenPhrase.stopTimer();
        });

        document.getElementById('imageSwitch')?.addEventListener('change', e => {
            const image = document.getElementById('apiImage');
            if (!image) return;

            if (e.target.checked) {
                image.style.display = 'block';
                window.App.DailyImage?.init();
            } else {
                image.style.display = 'none';
                if (window.App.Timers.image) {
                    clearInterval(window.App.Timers.image);
                    window.App.Timers.image = null;
                }
            }
        });

        document.getElementById('animationSwitch')?.addEventListener('change', e => {
            document.getElementById('goldenPhrase')?.classList.toggle('no-animation', !e.target.checked);
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
        return typeof schedule !== 'undefined' ? schedule : window.schedule || {};
    },

    getTimetableData() {
        return typeof timetable !== 'undefined' ? timetable : window.timetable || {};
    },

    getTodaySchedule(day) {
        const data = this.getScheduleData();
        if (day === 5) return data.friday;
        if (day === 0) return data.sunday;
        return data.weekday;
    },

    getCourseName(day, lessonIndex) {
        const courses = this.getTimetableData()[this.DAYS[day]] || [];
        // 周日只有晚自习；周一至周五需整体 +1（第 0 项是早自习）
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

        if (day === 6) return { current: '周末', nextLesson: '' };

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

            if (isInRange) {
                current = name;
                currentIndex = i;
                break;
            }
        }

        let nextLesson = '';
        if (currentIndex >= 0) {
            for (let i = currentIndex + 1; i < todaySchedule.length; i++) {
                const name = todaySchedule[i][1];
                if (this.isCourseSchedule(name)) {
                    nextLesson = name;
                    break;
                }
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
            nextElement.textContent = result.nextLesson === '无'
                ? '无'
                : this.getCourseDisplayName(day, result.nextLesson);
        }

        this.renderTimetable(day);
    },

    renderTimetable(day) {
        const container = document.getElementById('todayTimetable');
        if (!container) return;

        const centered = (text) =>
            `<div class="timetable-item" style="font-family: STZhongSong, cursive; font-size:24px; text-align:center;">${text}</div>`;

        if (day === 6) {
            container.innerHTML = centered('周末无课表');
            return;
        }

        const courses = this.getTimetableData()[this.DAYS[day]] || [];
        if (!courses.length) {
            container.innerHTML = centered('暂无数据');
            return;
        }

        container.innerHTML = courses.map((course, index) => {
            let label = '';
            let showDivider = false;

            if (day === 0) {
                label = `晚${index + 1}`;
            } else if (index === 0) {
                label = '早';
                showDivider = true;
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

## 21 `js/features/timeline.js`
```js
window.App.Timeline = {
    init() {
        const currentYear = new Date().getFullYear();
        this.updateSolarTermsDates(currentYear);
        this.generateMarkers();
        this.updateColor();

        // 点击空白处关闭所有节气卡片
        document.addEventListener('click', () => {
            document.querySelectorAll('.solar-card').forEach(c => c.classList.remove('active'));
            document.querySelectorAll('.solar-term-marker').forEach(m => (m.style.zIndex = '2'));
        });

        setInterval(() => this.updateColor(), 1000);

        setInterval(() => {
            this.updateSolarTermsDates(new Date().getFullYear());
            this.generateMarkers();
        }, 86400000);
    },

    generateMarkers() {
        const currentYear = new Date().getFullYear();
        const gradYear = 2028;

        const springStart = solarTerms.find(t => t.name === '立春');
        if (!springStart) return;

        const startDate = new Date(currentYear, springStart.month - 1, springStart.day);
        const endMarkerEl = document.querySelector('.end-marker');
        let endDate;

        if (currentYear === gradYear) {
            endDate = new Date(gradYear, 5, 7);
            endMarkerEl.style.display = 'block';
            document.getElementById('timelineEndTitle').textContent = '高考日';
            document.getElementById('timelineEndDate').textContent = '6月7日';
        } else {
            endDate = new Date(currentYear, 11, 31);
            endMarkerEl.style.display = 'none';
        }

        const totalDays = (endDate - startDate) / 86400000;
        const timeline = document.getElementById('timeline');

        document.querySelectorAll('.solar-term-marker').forEach(m => m.remove());

        solarTerms.forEach((term, index) => {
            const termDate = new Date(currentYear, term.month - 1, term.day);
            if (termDate < startDate || termDate > endDate) return;

            const position = ((termDate - startDate) / 86400000 / totalDays) * 100;
            const isPast = termDate < new Date();
            const isTop = index % 2 === 0;
            const topPosition = isTop ? '-45px' : '25px';

            const marker = document.createElement('div');
            marker.className = 'solar-term-marker';
            marker.style.left = `${position}%`;
            marker.style.top = topPosition;

            const lineStyle = isTop
                ? 'height: 15px; border-left: 1px dashed #999; position: absolute; bottom: -15px; left: 50%;'
                : 'height: 15px; border-left: 1px dashed #999; position: absolute; top: -15px; left: 50%;';

            marker.innerHTML = `
                <div style="color: ${isPast ? '#666' : term.color}; font-weight: ${isPast ? 'normal' : '600'};">
                    ${term.name}
                </div>
                <div style="font-size:0.9em; color: ${isPast ? '#999' : '#666'}; margin-top: 3px">
                    ${term.month}月${term.day}日
                </div>
                <div style="${lineStyle}"></div>
            `;

            const card = document.createElement('div');
            card.className = 'solar-card';

            if (!isTop) {
                card.style.top = 'auto';
                card.style.bottom = '100%';
                card.style.marginBottom = '20px';
                card.style.transformOrigin = 'bottom center';
            }

            card.innerHTML = `
                <h3 style="margin:0 0 10px;">${term.name} <small style="font-size:0.6em;color:#666">${currentYear}年${term.month}月${term.day}日</small></h3>
                <div style="display:flex; gap:15px;">
                    <img src="${term.image}" style="width:140px;height:120px;object-fit:cover;border-radius:6px;flex-shrink:0;">
                    <p style="text-indent:2em;margin:0;font-size:14px;">${term.desc}</p>
                </div>
            `;

            marker.appendChild(card);

            marker.addEventListener('click', e => {
                e.stopPropagation();
                document.querySelectorAll('.solar-card').forEach(c => c.classList.remove('active'));
                document.querySelectorAll('.solar-term-marker').forEach(m => (m.style.zIndex = '2'));
                card.classList.add('active');
                marker.style.zIndex = '999';
            });

            timeline.appendChild(marker);
        });
    },

    updateColor() {
        const currentYear = new Date().getFullYear();
        const gradYear = 2028;
        const springStart = solarTerms.find(t => t.name === '立春');
        if (!springStart) return;

        const startDate = new Date(currentYear, springStart.month - 1, springStart.day);
        const endDate = currentYear === gradYear
            ? new Date(gradYear, 5, 7)
            : new Date(currentYear, 11, 31);

        const progress = Math.min(1, Math.max(0, (new Date() - startDate) / (endDate - startDate)));
        const timeline = document.getElementById('timeline');
        if (timeline) timeline.style.setProperty('--progress-percent', `${progress * 100}%`);
    },

    // 21 世纪寿星天文历公式：[Y*D+C]-L
    updateSolarTermsDates(year) {
        const cMap = {
            '小寒': 5.4055, '大寒': 20.12, '立春': 3.87, '雨水': 18.73,
            '惊蛰': 5.63, '春分': 20.646, '清明': 4.81, '谷雨': 20.1,
            '立夏': 5.52, '小满': 21.04, '芒种': 5.678, '夏至': 21.37,
            '小暑': 7.108, '大暑': 22.83, '立秋': 7.5, '处暑': 23.13,
            '白露': 7.646, '秋分': 23.042, '寒露': 8.318, '霜降': 23.438,
            '立冬': 7.438, '小雪': 22.385, '大雪': 7.18, '冬至': 21.94
        };

        const monthMap = {
            '小寒': 1, '大寒': 1, '立春': 2, '雨水': 2,
            '惊蛰': 3, '春分': 3, '清明': 4, '谷雨': 4,
            '立夏': 5, '小满': 5, '芒种': 6, '夏至': 6,
            '小暑': 7, '大暑': 7, '立秋': 8, '处暑': 8,
            '白露': 9, '秋分': 9, '寒露': 10, '霜降': 10,
            '立冬': 11, '小雪': 11, '大雪': 12, '冬至': 12
        };

        const y = year % 100;
        const D = 0.2422;
        const leapCount = Math.floor(y / 4);

        solarTerms.forEach(term => {
            if (!cMap[term.name]) return;
            term.day = Math.floor(y * D + cMap[term.name]) - leapCount;
            term.month = monthMap[term.name];
        });
    }
};

```

## 22 `js/features/weather.js`
```js
window.App.Weather = {
    init() {
        this.fetch();
        clearInterval(window.App.Timers.weather);
        window.App.Timers.weather = setInterval(() => this.fetch(), 60000);
    },

    async fetch() {
        const el = document.getElementById('weatherInfo');
        if (!el) return;

        try {
            const locRes = await fetch('https://ipwho.is/');
            if (!locRes.ok) throw new Error('地理位置请求失败');

            const loc = await locRes.json();
            if (loc.success !== true || typeof loc.latitude !== 'number' || typeof loc.longitude !== 'number') {
                throw new Error(loc.message || '地理位置数据无效');
            }

            const tz = loc.timezone?.id || 'auto';
            const url =
                'https://api.open-meteo.com/v1/forecast' +
                `?latitude=${encodeURIComponent(loc.latitude)}` +
                `&longitude=${encodeURIComponent(loc.longitude)}` +
                '&current=weather_code' +
                '&daily=temperature_2m_min,temperature_2m_max' +
                '&forecast_days=1' +
                `&timezone=${encodeURIComponent(tz)}`;

            const res = await fetch(url);
            if (!res.ok) throw new Error('天气数据请求失败');

            const { current, daily } = await res.json();
            if (!current || (daily && (!Array.isArray(daily.temperature_2m_min) || !Array.isArray(daily.temperature_2m_max)))) {
                throw new Error('天气数据格式错误');
            }

            const low = this.formatTemperature(daily.temperature_2m_min[0]);
            const high = this.formatTemperature(daily.temperature_2m_max[0]);
            el.textContent = `${this.getWeatherName(current.weather_code)} ${low}~${high}℃`;
        } catch (err) {
            console.error('天气加载失败:', err);
            el.textContent = '天气暂不可用';
        }
    },

    formatTemperature(value) {
        const t = Number(value);
        if (!Number.isFinite(t)) return '--';
        return Number.isInteger(t) ? String(t) : t.toFixed(1);
    },

    getWeatherName(code) {
        const map = {
            0: '晴', 1: '大部晴朗', 2: '局部多云', 3: '阴', 45: '雾', 48: '雾凇',
            51: '小毛毛雨', 53: '毛毛雨', 55: '大毛毛雨', 56: '冻毛毛雨', 57: '强冻毛毛雨',
            61: '小雨', 63: '中雨', 65: '大雨', 66: '冻雨', 67: '强冻雨',
            71: '小雪', 73: '中雪', 75: '大雪', 77: '雪粒',
            80: '小阵雨', 81: '中阵雨', 82: '强阵雨', 85: '小阵雪', 86: '强阵雪',
            95: '雷雨', 96: '雷雨伴冰雹', 99: '强雷雨伴冰雹'
        };
        return map[code] || '未知天气';
    }
};

```

这是我网站，现在这个网站所有数据都是直接存在服务器端（cloudflare pages 静态托管）的，这会引发若干问题：1. 无法自行修改数据，如，想修改课表必须登录后台修改；2. 一些临时数据如通知、寻物等无法保留，一刷新就没了。我想将所有用户数据全部存到用户本地而不是服务器端，方便修改。因为考虑到学校电脑 C 盘会还原而 D 盘不会，且浏览器缓存等本地数据存储在 C 盘，因此我们不能使用浏览器缓存，而是应该将数据实时存入 D 盘（必须在有修改时实时存入，以防意外关机）。具体实现方式为编写一个 exe 本地 HTTP 小服务（该 exe 不应该依赖任何原生 windows 没有的东西，双击就能直接启动，且应当支持 win7 及以上，最好使用 c++，需要后台静默运行，无窗口），并放到每台学校电脑 D 盘上，让它监听 127.0.0.1，网页直接 fetch 调用它来读写磁盘。现在请你帮我完成修改：1. 修改网页，让 /js/data 里的东西全部从本地（exe 服务所在文件夹）读取，并存在本地（exe 服务所在文件夹）；2. 修改网页，让所有临时数据（设置项、寻物、通知等）也全部进入该本地目录，实现刷新网页也不丢失）；3. 编写这个本地小 exe 服务；4.若有其他需补充的请你补充。请你直接在对话框给出需要修改/添加的文件的完整代码，而不是进行工作区操作。