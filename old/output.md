## 1 `css/style.css`
```css
body,html{overflow:hidden;margin:0;padding:0;width:100%;height:100%;font-family:'Microsoft YaHei',sans-serif;background:linear-gradient(to bottom right,#f5fff5,#e8f5e9)}
/* @font-face{font-family:'Ximai';src:url('fonts/字制区喜脉喜欢体.ttf') format('truetype');font-weight:400;font-style:normal;font-display:block} */

/* 加载华文中宋 (两种名称指向同一个文件) */
@font-face {
    font-family: 'STZhongsong';
    src: url('../fonts/STZhongsong.ttf') format('truetype');
    font-weight: normal;
    font-style: normal;
    font-display: swap;
}
@font-face {
    font-family: 'STZhongSong';
    src: url('../fonts/STZhongsong.ttf') format('truetype');
    font-weight: normal;
    font-style: normal;
    font-display: swap;
}

/* 加载华文楷书 */
@font-face {
    font-family: 'STKaiti';
    src: url('../fonts/STKaiti.ttf') format('truetype');
    font-weight: normal;
    font-style: normal;
    font-display: swap;
}

/* 加载华文行书 */
@font-face {
    font-family: 'STXingkai';
    src: url('../fonts/STXingkai.ttf') format('truetype');
    font-weight: normal;
    font-style: normal;
    font-display: swap;
}



/* 核心布局与弹窗 */
/* #warningMessage{display:none;text-align:center;font-size:50px;color:red;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)} */
.settings-modal{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.5);display:flex;justify-content:center;align-items:center;opacity:0;visibility:hidden;transition:all .3s;z-index:999}
.settings-modal.active{opacity:1;visibility:visible}
.settings-content{background:#fff;width:60%;height:75%;border-radius:12px;transform:scale(.8);opacity:0;transition:all .3s;position:relative;padding:20px;overflow:hidden;display:flex;flex-direction:column}
.settings-modal.active .settings-content{transform:scale(1);opacity:1}
.settings-modal.fullscreen .settings-content{width:100%;height:100%;max-width:none;max-height:none;border-radius:0}
.changelog-modal .settings-content{max-width:600px}
.settings-header{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #eee;padding-bottom:10px;margin-bottom:20px}
.settings-header h3{margin:0;font-size:24px;color:#333}
.settings-body{display:flex;flex-direction:column;gap:10px;padding:20px;overflow-y:auto;height:calc(100% - 60px)}
.text-content{padding:15px;white-space:pre-wrap;overflow-y:auto;height:calc(100% - 50px)}

/* 通用按钮类合并 */
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

/* 节气卡片与时间板块 */
.solar-card{position:absolute;top:calc(100% + 20px);left:50%;transform:translateX(-50%);width:500px;background:rgba(255,255,255,.96);border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,.15);padding:20px;opacity:0;visibility:hidden;transition:all .3s;z-index:10;display:flex;align-items:center;gap:20px}
.solar-card::before{content:'';position:absolute;bottom:100%;left:50%;transform:translateX(-50%);border:10px solid transparent;border-bottom-color:rgba(255,255,255,.96)}
.solar-card.active{opacity:1;visibility:visible;transform:translate(-50%,0)}
.solar-card h3{text-align:center;margin:0 0 15px;font-size:24px;color:#1b5e20;font-family:STZhongsong,serif}
.solar-card img{width:160px;height:140px;object-fit:cover;border-radius:8px}
.solar-card p{font-size:16px;line-height:1.6;color:#444;margin:0;font-family:'Microsoft YaHei';flex-grow:1;text-indent:2em}
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

/* 导航栏与倒计时 */
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
/* 每日60s：采用绝对定位 + 垂直居中变换 (top:50% + translateY) */
.right-image-container{position:absolute;right:50px;top:45%;transform:translateY(-50%);z-index:5;background:#fff;padding:10px;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,.1);display:flex}
/* 强制图片高度为 800px (在1080px的总高度下，这会留出上下各约140px的空间，完全不会遮挡) */
.right-image-container img{height:800px;object-fit:cover;display:block;border-radius:6px;width:auto}

/* 金句与金句列表 */
/* 移除了 margin 的具体数值，改为 JS 控制，初始设为 0 */
#goldenPhrase{text-align:center;margin:0 auto;width:760px;font-size:26px;color:#1b5e20;min-height:40px;font-family:STZhongSong,cursive;text-shadow:1px 1px 2px rgba(0,0,0,.1);transition:opacity .5s,transform .3s;position:relative;top:0;cursor:pointer;z-index:5;}
#goldenPhrase:active{transform:scale(.98)}
#goldenPhrase.no-animation{transition:none!important}
#goldenPhrase.no-animation:active{transform:none!important}
#phraseList{padding:15px;overflow-y:auto;height:calc(100% - 50px)}
.phrase-item{padding:12px;margin:8px 0;border-radius:6px;background:#f8f8f8;cursor:pointer;transition:all .3s ease;font-family:STZhongSong,cursive;color:#1b5e20}
.phrase-item:hover{background:#e8f5e9;transform:translateX(5px);box-shadow:0 2px 8px rgba(0,0,0,.1)}
.phrase-item:active{transform:scale(.97);background:#e0f2f1!important}
.phrase-click-effect{animation:phraseClickWave .4s ease-out;position:relative}
@keyframes phraseClickWave{0%{box-shadow:0 0 0 0 rgba(139,195,74,.3)}100%{box-shadow:0 0 0 10px rgba(139,195,74,0)}}

/* 滑块与开关 (极度压缩合并版) */
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

/* 公告与通知 */
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

/* 寻物板与特定按钮特效 */
.editable{cursor:pointer;transition:all .3s;padding:2px 5px;border-radius:4px;font-family:STZhongsong,serif;color:#1e90ff;text-shadow:0 0 2px rgba(0,0,0,.2);border-bottom:2px solid #ffd700}
.editable:hover{background:#f0f0f0}
.edit-input{width:120px;padding:5px;border:2px solid #8bc34a;border-radius:4px;font-size:28px;text-align:center;color:#1e90ff;margin:0 5px;font-family:STZhongsong,serif}
#lostAndFoundList .announcement-card{padding:12px;margin:8px 10px}
#lostAndFoundList .announcement-body{line-height:1.1}
#lostAndFoundList .editable{margin:1px 0;padding:2px 4px}
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
    <!-- (此处保留你原有的 <div id="loadingOverlay"> 和 <div id="pageContent"> 的全部 DOM 结构) -->
    <!-- <div id="loadingOverlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: white; z-index: 9999; display: flex; justify-content: center; align-items: center;">
        <div style="font-size: 24px; color: #1b5e20;">正在加载字体，请稍候...</div>
    </div> -->

    <div id="pageContent" style="display: none;">
        <!-- 导航栏 -->
        <header>
            <nav class="navbar">
                <div class="brand">杨村一中&nbsp;高二（22）班</div>
                <!-- <a href="https://c2201.github.io/">首页</a>
                <a href="https://c2201.github.io/countdown/">新&nbsp;·&nbsp;二十四节气中考倒计时</a> -->
                <!-- <a href="https://c2201.github.io/wheel/">转盘</a> -->
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
     
        <!-- 中考倒计时 -->
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
                <div class="announcement-content">
                    <!-- <div class="announcement-card">
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
                    </div> -->
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

    <!-- <div id="warningMessage">按下&nbsp;Alt&nbsp;+&nbsp;Shift&nbsp;+&nbsp;G&nbsp;解锁彩蛋</div> -->
    
    <!-- 1. 引入基础数据 -->
    <script src="js/data/solarterms.js"></script>
    <script src="js/data/timetable.js"></script>
    <script src="js/data/schedule.js"></script>
    <script src="js/data/phrases.js"></script>

    <!-- 2. 引入状态与工具 (必须优先加载) -->
    <script src="js/features/00_state.js"></script>
    <script src="js/features/01_utils.js"></script>

    <!-- 3. 引入独立功能模块 (一个文件只做一件事) -->
    <script src="js/features/clock.js"></script>
    <script src="js/features/weather.js"></script>
    <script src="js/features/daily_image.js"></script>
    <script src="js/features/timeline.js"></script>
    <script src="js/features/exam_countdown.js"></script>
    <script src="js/features/school_schedule.js"></script>
    <script src="js/features/golden_phrase.js"></script>
    <script src="js/features/auto_refresh.js"></script>
    <!-- <script src="js/features/graduation.js"></script> -->

    <!-- 4. 引入各类弹窗交互模块 -->
    <script src="js/features/modal_core.js"></script>
    <script src="js/features/modal_settings.js"></script>
    <script src="js/features/modal_lost_found.js"></script>
    <script src="js/features/modal_notification.js"></script>
    <script src="js/features/modal_phrase.js"></script>

    <script>
        (function() {
            const targetWidth = 1920;
            function resize() {
                const currentWidth = document.documentElement.clientWidth || document.body.clientWidth;
                const scale = currentWidth / targetWidth;
                const pageContent = document.getElementById('pageContent');
                if (pageContent) {
                    pageContent.style.zoom = scale;
                    pageContent.style.width = targetWidth + 'px';
                    
                    // ★新增：强制设定高度为 1080px (假设这是你的设计基准)
                    // 这样 absolute top:50% 才会基于 1080px 计算，而不是基于内容高度
                    pageContent.style.height = '1080px'; 
                    pageContent.style.position = 'relative'; // 确保子元素的 absolute 也就是相对于它
                    pageContent.style.overflow = 'hidden';   // 防止内容溢出
                    
                    document.body.style.overflowX = 'hidden';
                }
            }
            resize();
            window.addEventListener('resize', resize);
        })();
    </script>

    <!-- 5. 引入主入口启动程序 (必须最后加载) -->
    <script src="js/features/main.js"></script>
</body>
</html>
```

## 3 `js/features/00_state.js`
```js
// 初始化全局命名空间
window.App = window.App || {};

// 全局状态与配置中心
window.App.State = {
    intervalDuration: 15 * 1000,
    apiProbability: 50,
    // isWarning: false,
    lostAndFoundFontSize: 28,
    notifications: [],
    lastPhrase: null
};

// 全局定时器引用中心
window.App.Timers = {
    phrase: null,
    weather: null,
    refresh: null,
    image: null
};
```

## 4 `js/features/01_utils.js`
```js
window.App.Utils = {
    // 时间转分钟数
    timeToMinutes(time) {
        if (time instanceof Date) return time.getHours() * 60 + time.getMinutes();
        if(time === "23:59") return 1439;
        const [h, m] = time.split(':').map(Number);
        return h * 60 + m;
    }
};
```

## 5 `js/features/auto_refresh.js`
```js
window.App.AutoRefresh = {
    interval: 15 * 60 * 1000, // 15分钟

    init() {
        const switchBtn = document.getElementById('autoRefreshSwitch');
        if (!switchBtn) return;

        // 监听开关切换
        switchBtn.addEventListener('change', (e) => {
            if (e.target.checked) {
                this.start();
            } else {
                this.stop();
            }
        });

        // 初始化启动（如果开关默认开启）
        if (switchBtn.checked) {
            this.start();
        }
    },

    start() {
        this.stop(); // 先清除可能存在的旧定时器
        window.App.Timers.refresh = setTimeout(() => {
            location.reload();
        }, this.interval);
    },

    stop() {
        if (window.App.Timers.refresh) {
            clearTimeout(window.App.Timers.refresh);
            window.App.Timers.refresh = null;
        }
    }
};
```

## 6 `js/features/clock.js`
```js
window.App.Clock = {
    init() {
        this.update();
    },
    update() {
        const date = new Date();
        const weekDays = ['日','一','二','三','四','五','六'];
        const hh = date.getHours().toString().padStart(2, '0');
        const mm = date.getMinutes().toString().padStart(2, '0');
        const ss = date.getSeconds().toString().padStart(2, '0');
        const yyyy = date.getFullYear(); 
        const m = (date.getMonth() + 1).toString().padStart(2, '0');
        const d = date.getDate().toString().padStart(2, '0');
        const week = weekDays[date.getDay()];
        
        document.getElementById('currentDateTime').innerHTML = `
            <div class="time-section">${hh}:${mm}:${ss}</div>
            <div class="date-section">${yyyy}/${m}/${d} 周${week}</div>
        `;
        requestAnimationFrame(() => this.update());
    }
};
```

## 7 `js/features/daily_image.js`
```js
window.App.DailyImage = {
    init() {
        const switchBtn = document.getElementById('imageSwitch');
        if (switchBtn && !switchBtn.checked) {
            const container = document.querySelector('.right-image-container');
            if(container) container.style.display = 'none';
            return;
        }
        
        this.updateImage();
        // 每天自动刷新
        window.App.Timers.image = setInterval(() => this.updateImage(), 86400000);
    },
    
    updateImage() {
        const img = document.getElementById('apiImage');
        const container = document.querySelector('.right-image-container');
        if (!img || !container) return;

        container.style.display = 'flex';
        
        // 加时间戳防缓存
        const t = new Date().getTime();
        const src = `https://v.api.aa1.cn/api/60s-v3/?t=${t}`;
        
        // 简单的预加载
        const temp = new Image();
        temp.onload = () => {
            img.src = src;
            img.style.opacity = '1';
        };
        
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.5s';
        temp.src = src;

        // 备用接口逻辑
        temp.onerror = () => {
            img.src = `https://api.03c3.cn/zb/api.php?t=${t}`;
            img.style.opacity = '1';
        };
    }
};
```

## 8 `js/features/exam_countdown.js`
```js
window.App.ExamCountdown = {
    init() {
        this.update();
    },

    update() {
        // 目标日期：2025年6月18日 (注意月份是从 0 开始的，5 代表 6 月)
        const target = new Date(2028, 5, 7);
        const diff = target - new Date();
        const days = Math.max(0, Math.ceil(diff / 86400000));
        
        const daysUntilElement = document.getElementById('daysUntil');
        if (daysUntilElement) {
            daysUntilElement.textContent = `${days}天`;
        }

        // 计算距离明天凌晨还有多少毫秒，精准设置下一次更新的定时器
        const now = new Date();
        const msToNextDay = 86400000 - (now % 86400000);
        setTimeout(() => this.update(), msToNextDay);
    }
};
```

## 9 `js/features/golden_phrase.js`
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

                let title = data.data.title || '';
                title = title.replace(/\s*·\s*/g, '·');

                const hasBookMarks =
                    /^《(.+)》$/.test(title);

                const formattedTitle = hasBookMarks
                    ? title
                    : `《${title}》`;

                return (
                    `${data.data.quotes || ''}` +
                    `——${data.data.author || ''}` +
                    `${formattedTitle}`
                );
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
                const chineseLength = data.cn?.length || 0;
                const englishLength = data.en?.length || 0;

                if (chineseLength > 100) {
                    return null;
                }

                const totalLength =
                    englishLength * 0.5 + chineseLength;

                if (totalLength <= 100) {
                    return `${data.en}（${data.cn}）——泰戈尔`;
                }

                return `${data.cn}——泰戈尔`;
            }
        }
    ],

    init() {
        this.updateClassInformation();
        this.bindPhraseSelector();
        this.fetch();
        this.startTimer();
        this.bindClickRefresh();
    },

    startTimer() {
        if (
            window.App.Timers &&
            window.App.Timers.phrase
        ) {
            clearInterval(window.App.Timers.phrase);
        }

        const interval =
            Number(window.App.State?.intervalDuration) ||
            15000;

        window.App.Timers.phrase = setInterval(() => {
            this.fetch();
        }, interval);
    },

    stopTimer() {
        if (
            window.App.Timers &&
            window.App.Timers.phrase
        ) {
            clearInterval(window.App.Timers.phrase);
            window.App.Timers.phrase = null;
        }
    },

    async fetchWithRetry(apiConfig, retryCount = 0) {
        try {
            const response = await fetch(apiConfig.url, {
                method: apiConfig.method || 'GET'
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            const processed = apiConfig.handler(data);

            if (processed !== null && processed !== '') {
                return processed;
            }

            if (retryCount < apiConfig.maxRetry) {
                return this.fetchWithRetry(
                    apiConfig,
                    retryCount + 1
                );
            }

            throw new Error('超过最大重试次数');
        } catch (error) {
            if (retryCount < apiConfig.maxRetry) {
                return this.fetchWithRetry(
                    apiConfig,
                    retryCount + 1
                );
            }

            throw error;
        }
    },

    selectRandomAPI() {
        const totalWeight = this.apiConfigs.reduce(
            (sum, api) => sum + api.weight,
            0
        );

        let random = Math.random() * totalWeight;

        for (const api of this.apiConfigs) {
            if (random < api.weight) {
                return api;
            }

            random -= api.weight;
        }

        return this.apiConfigs[0];
    },

    async fetch() {
        const probability = Number(
            window.App.State?.apiProbability ?? 50
        );

        const shouldUseAPI =
            Math.random() < probability / 100;

        if (!shouldUseAPI) {
            this.showLocal();
            return;
        }

        try {
            const api = this.selectRandomAPI();
            const text = await this.fetchWithRetry(api);
            this.updateDisplay(text);
        } catch (error) {
            console.warn(
                '联网金句获取失败，改用本地金句：',
                error
            );

            this.showLocal();
        }
    },

    updateDisplay(text) {
        const container =
            document.getElementById('goldenPhrase');

        if (!container) return;

        const finalText =
            text === undefined || text === null
                ? ''
                : String(text);

        const animationSwitch =
            document.getElementById('animationSwitch');

        const animationEnabled =
            !animationSwitch ||
            animationSwitch.checked;

        const formatted =
            this.escapeHTML(finalText)
                .replace(/\n/g, '<br>');

        const updateContent = () => {
            container.innerHTML = `「 ${formatted} 」`;
            container.style.opacity = '1';
        };

        if (animationEnabled) {
            container.style.opacity = '0';

            setTimeout(() => {
                updateContent();
            }, 500);
        } else {
            updateContent();
        }
    },

    showLocal() {
        /*
         * 不能直接使用未定义的 localPhrases，
         * 也不能直接读取不存在的 originalSwitch。
         */
        const localData =
            window.localPhrases || {
                high: [],
                medium: [],
                low: []
            };

        const high = Array.isArray(localData.high)
            ? localData.high
            : [];

        const medium = Array.isArray(localData.medium)
            ? localData.medium
            : [];

        const low = Array.isArray(localData.low)
            ? localData.low
            : [];

        const originalSwitch =
            document.getElementById('originalSwitch');

        const onlyOriginal =
            originalSwitch?.checked || false;

        const filterOriginal = list => {
            if (!onlyOriginal) {
                return list;
            }

            return list.filter(phrase => {
                return String(phrase)
                    .trim()
                    .endsWith('🌟');
            });
        };

        const filteredHigh = filterOriginal(high);
        const filteredMedium = filterOriginal(medium);
        const filteredLow = filterOriginal(low);

        const allPhrases = [
            ...filteredHigh,
            ...filteredMedium,
            ...filteredLow
        ];

        if (!allPhrases.length) {
            this.updateDisplay('🎯 没有找到金句');
            return;
        }

        let candidates = allPhrases.filter(phrase => {
            return phrase !== window.App.State.lastPhrase;
        });

        if (!candidates.length) {
            candidates = allPhrases;
        }

        let selectedPhrase;

        /*
         * 按照 high 45%、medium 35%、low 20%
         * 的比例选择本地金句。
         */
        if (!onlyOriginal) {
            const pools = [];

            if (filteredHigh.length) {
                pools.push({
                    list: filteredHigh,
                    weight: 45
                });
            }

            if (filteredMedium.length) {
                pools.push({
                    list: filteredMedium,
                    weight: 35
                });
            }

            if (filteredLow.length) {
                pools.push({
                    list: filteredLow,
                    weight: 20
                });
            }

            const totalWeight = pools.reduce(
                (sum, item) => sum + item.weight,
                0
            );

            let random = Math.random() * totalWeight;

            for (const pool of pools) {
                if (random < pool.weight) {
                    const poolCandidates =
                        pool.list.filter(phrase => {
                            return (
                                phrase !==
                                window.App.State.lastPhrase
                            );
                        });

                    const finalList =
                        poolCandidates.length
                            ? poolCandidates
                            : pool.list;

                    selectedPhrase =
                        finalList[
                            Math.floor(
                                Math.random() *
                                finalList.length
                            )
                        ];

                    break;
                }

                random -= pool.weight;
            }
        }

        /*
         * 当只有原创模式，或者权重池没有成功选出内容时，
         * 从候选列表中随机选择。
         */
        if (!selectedPhrase) {
            selectedPhrase =
                candidates[
                    Math.floor(
                        Math.random() * candidates.length
                    )
                ];
        }

        window.App.State.lastPhrase = selectedPhrase;
        this.updateDisplay(selectedPhrase);
    },

    bindPhraseSelector() {
        const openButton =
            document.getElementById('phraseSelectButton');

        const modal =
            document.getElementById('phraseModal');

        const closeButton =
            document.getElementById('closePhrase');

        if (!openButton || !modal) {
            return;
        }

        openButton.addEventListener('click', () => {
            this.populatePhraseList();
            modal.classList.add('active');
        });

        if (closeButton) {
            closeButton.addEventListener('click', () => {
                modal.classList.remove('active');
            });
        }

        modal.addEventListener('click', event => {
            if (event.target === modal) {
                modal.classList.remove('active');
            }
        });
    },

    populatePhraseList() {
        const container =
            document.getElementById('phraseList');

        if (!container) return;

        const localData =
            window.localPhrases || {
                high: [],
                medium: [],
                low: []
            };

        const allPhrases = [
            ...(Array.isArray(localData.high)
                ? localData.high
                : []),
            ...(Array.isArray(localData.medium)
                ? localData.medium
                : []),
            ...(Array.isArray(localData.low)
                ? localData.low
                : [])
        ];

        container.innerHTML = '';

        if (!allPhrases.length) {
            container.textContent = '暂无本地金句';
            return;
        }

        const fragment =
            document.createDocumentFragment();

        allPhrases.forEach(phrase => {
            const item = document.createElement('div');

            item.className = 'phrase-item';
            item.innerHTML = this.escapeHTML(
                String(phrase)
            ).replace(/\n/g, '<br>');

            item.addEventListener('click', () => {
                this.updateDisplay(phrase);

                const modal =
                    document.getElementById('phraseModal');

                if (modal) {
                    modal.classList.remove('active');
                }

                window.App.State.lastPhrase = phrase;

                const goldenSwitch =
                    document.getElementById('goldenSwitch');

                if (
                    goldenSwitch?.checked
                ) {
                    this.startTimer();
                }
            });

            fragment.appendChild(item);
        });

        container.appendChild(fragment);
    },

    bindClickRefresh() {
        const container =
            document.getElementById('goldenPhrase');

        if (!container) return;

        container.addEventListener('click', () => {
            const clickSwitch =
                document.getElementById(
                    'clickRefreshSwitch'
                );

            if (!clickSwitch?.checked) {
                return;
            }

            const animationSwitch =
                document.getElementById('animationSwitch');

            const animationEnabled =
                !animationSwitch ||
                animationSwitch.checked;

            if (animationEnabled) {
                container.style.transform = 'scale(0.98)';

                setTimeout(() => {
                    container.style.transform = 'scale(1)';
                    this.fetch();
                }, 300);
            } else {
                this.fetch();
            }

            const goldenSwitch =
                document.getElementById('goldenSwitch');

            if (goldenSwitch?.checked) {
                this.startTimer();
            }
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

## 10 `js/features/graduation.js`
```js
// window.App.Graduation = {
//     init() {
//         this.bindEvents();
//     },

//     isGraduated() {
//         const graduationDate = new Date(2025, 5, 20, 10, 40); // 2025年6月20日 10:40
//         return new Date() >= graduationDate;
//     },

//     triggerGraduation() {
//         // 这个方法会被 main.js 调用
//         const font = new FontFace('Ximai', 'url(fonts/字制区喜脉喜欢体.ttf)');
//         font.load().then(() => {
//             document.getElementById('pageContent').style.display = 'block';
//             document.getElementById('loadingOverlay').style.display = 'none';
//             this.showWarning();
//         }).catch(err => {
//             console.error('字体加载失败:', err);
//             document.getElementById('pageContent').style.display = 'block';
//             document.getElementById('loadingOverlay').style.display = 'none';
//             this.showWarning();
//         });
//     },

//     showWarning() {
//         window.App.State.isWarning = true;
//         document.getElementById('warningMessage').style.display = 'block';
//         document.getElementById('pageContent').style.display = 'none';
//     },

//     showGraduationState() {
//         // 修改大标题和小标题
//         document.querySelector('.small-title').textContent = '三载春秋，与光同行；一路奔赴，皆是星辰！';
//         const daysUntil = document.getElementById('daysUntil');
//         daysUntil.textContent = '我们毕业啦';
//         daysUntil.style.fontFamily = 'Ximai';
//         daysUntil.style.fontSize = '180px';

//         // 修改作息显示
//         document.getElementById('currentSchedule').textContent = '毕业';
//         document.getElementById('nextSchedule').textContent = '无';
//         document.getElementById('countdownName').textContent = '下一次重逢：';
//         document.getElementById('countdownTimer').textContent = '繁花盛开时';
//         document.getElementById('countdownTimer').style.fontSize = '25px';
//         document.getElementById('todayTimetable').innerHTML = '<div class="timetable-item">毕业快乐！</div>';

//         // 修改金句并停止轮播
//         if (window.App.Timers.phrase) {
//             clearInterval(window.App.Timers.phrase);
//             window.App.Timers.phrase = null;
//         }
//         document.getElementById('goldenPhrase').innerHTML = '「 🎓愿我们的未来，如六月的栀子花开，洁白芬芳；似七月的星河长明，璀璨无垠！ 」';
//         const goldenSwitch = document.getElementById('goldenSwitch');
//         if(goldenSwitch) goldenSwitch.checked = false;
//     },

//     bindEvents() {
//         // 快捷键监听
//         document.addEventListener('keydown', (event) => {
//             if (window.App.State.isWarning && event.altKey && event.shiftKey && event.key === 'G') {
//                 window.App.State.isWarning = false;
//                 document.getElementById('warningMessage').style.display = 'none';
//                 document.getElementById('pageContent').style.display = 'block';
//                 this.showGraduationState();
//             }
//         });
//     }
// };


window.App.Graduation = {
    init() {
        console.log("🛠️ [调试] Graduation.init() 成功执行，准备绑定事件...");
        this.bindEvents();
    },

    isGraduated() {
        const graduationDate = new Date(2025, 5, 20, 10, 40); // 2025年6月20日 10:40
        const isGrad = new Date() >= graduationDate;
        console.log(`🛠️ [调试] 检查是否毕业: ${isGrad} (当前系统时间: ${new Date()})`);
        return isGrad;
    },

    triggerGraduation() {
        console.log("🛠️ [调试] 触发 triggerGraduation()...");
        const font = new FontFace('Ximai', 'url(fonts/字制区喜脉喜欢体.ttf)');
        
        font.load().then((loadedFont) => {
            console.log("🛠️ [调试] 字体加载成功");
            document.fonts.add(loadedFont);
        }).catch(err => {
            console.warn('⚠️ [调试] 字体加载失败 (忽略该错误，继续执行):', err);
        }).finally(() => {
            console.log("🛠️ [调试] 准备显示锁定警告画面...");
            const pageContent = document.getElementById('pageContent');
            const loadingOverlay = document.getElementById('loadingOverlay');
            if (pageContent) pageContent.style.display = 'block';
            if (loadingOverlay) loadingOverlay.style.display = 'none';
            this.showWarning();
        });
    },

    showWarning() {
        console.log("🛠️ [调试] showWarning() 被调用，正在将 State.isWarning 设为 true");
        window.App.State.isWarning = true;
        
        const warningEl = document.getElementById('warningMessage');
        const pageContentEl = document.getElementById('pageContent');
        
        if (warningEl) {
            warningEl.style.display = 'block';
            console.log("🛠️ [调试] 成功显示 #warningMessage 元素");
        } else {
            console.error("❌ [致命错误] 找不到 #warningMessage 元素！请检查 index.html");
        }
        
        if (pageContentEl) pageContentEl.style.display = 'none';
    },

    showGraduationState() {
        console.log("🎉 [调试] 成功进入 showGraduationState()，正在修改页面内容...");
        document.querySelector('.small-title').textContent = '三载春秋，与光同行；一路奔赴，皆是星辰！';
        const daysUntil = document.getElementById('daysUntil');
        daysUntil.textContent = '我们毕业啦';
        daysUntil.style.fontFamily = 'Ximai';
        daysUntil.style.fontSize = '180px';

        document.getElementById('currentSchedule').textContent = '毕业';
        document.getElementById('nextSchedule').textContent = '无';
        document.getElementById('countdownName').textContent = '下一次重逢：';
        document.getElementById('countdownTimer').textContent = '繁花盛开时';
        document.getElementById('countdownTimer').style.fontSize = '25px';
        document.getElementById('todayTimetable').innerHTML = '<div class="timetable-item">毕业快乐！</div>';

        if (window.App.Timers.phrase) {
            clearInterval(window.App.Timers.phrase);
            window.App.Timers.phrase = null;
        }
        document.getElementById('goldenPhrase').innerHTML = '「 🎓愿我们的未来，如六月的栀子花开，洁白芬芳；似七月的星河长明，璀璨无垠！ 」';
        const goldenSwitch = document.getElementById('goldenSwitch');
        if(goldenSwitch) goldenSwitch.checked = false;
    },

    bindEvents() {
        console.log("🛠️ [调试] 键盘事件监听器已注册完毕。");
        
        document.addEventListener('keydown', (event) => {
            // ==== 核心调试打印：把浏览器接收到的所有按键信息打印出来 ====
            console.log(`⌨️ [按键被按下] 
                key: "${event.key}", 
                code: "${event.code}", 
                altKey: ${event.altKey}, 
                shiftKey: ${event.shiftKey}, 
                ctrlKey: ${event.ctrlKey}, 
                isWarning状态: ${window.App.State.isWarning}`
            );

            // 你的原版快捷键判定：必须处于警告状态 + 包含 Alt + 包含 Shift + 按下 G
            // (这里我改用 code === 'KeyG' 规避大小写问题)
            if (window.App.State.isWarning && event.altKey && event.shiftKey && event.code === 'KeyG') {
                console.log("✅ [解锁成功] 满足所有条件，执行解锁逻辑！");
                
                event.preventDefault(); // 阻止默认行为
                
                window.App.State.isWarning = false;
                document.getElementById('warningMessage').style.display = 'none';
                document.getElementById('pageContent').style.display = 'block';
                this.showGraduationState();
            }
        });
    }
};
```

## 11 `js/features/main.js`
```js
window.onload = function() {
    // 定义辅助函数来安全地初始化模块
    const safeInit = (moduleName, initFunc) => {
        try {
            if (initFunc && typeof initFunc === 'function') {
                initFunc();
            } else {
                console.warn(`⚠️ 模块 ${moduleName} 未找到或 init 不是函数`);
            }
        } catch (e) {
            console.error(`❌ 模块 ${moduleName} 初始化失败:`, e);
        }
    };

    // 1. 初始化所有核心功能模块
    safeInit('Clock', () => window.App.Clock && window.App.Clock.init());
    safeInit('Weather', () => window.App.Weather && window.App.Weather.init());
    safeInit('DailyImage', () => window.App.DailyImage && window.App.DailyImage.init());
    safeInit('Timeline', () => window.App.Timeline && window.App.Timeline.init());
    safeInit('ExamCountdown', () => window.App.ExamCountdown && window.App.ExamCountdown.init());
    safeInit('SchoolSchedule', () => window.App.SchoolSchedule && window.App.SchoolSchedule.init());
    safeInit('GoldenPhrase', () => window.App.GoldenPhrase && window.App.GoldenPhrase.init());
    safeInit('AutoRefresh', () => window.App.AutoRefresh && window.App.AutoRefresh.init());
    safeInit('ModalPhrase', () => window.App.ModalPhrase && window.App.ModalPhrase.init());
    
    // 2. 初始化弹窗交互模块
    safeInit('ModalCore', () => window.App.ModalCore && window.App.ModalCore.init());
    safeInit('ModalSettings', () => window.App.ModalSettings && window.App.ModalSettings.init());
    safeInit('ModalLostFound', () => window.App.ModalLostFound && window.App.ModalLostFound.init());
    safeInit('ModalNotification', () => window.App.ModalNotification && window.App.ModalNotification.init());

    // 3. 直接显示正常界面
    const loadingOverlay = document.getElementById('loadingOverlay');
    const pageContent = document.getElementById('pageContent');
    if (loadingOverlay) loadingOverlay.style.display = 'none';
    if (pageContent) pageContent.style.display = 'block';
};

// 离开页面清理
window.addEventListener('unload', () => {
    try {
        if(window.App.Timers && window.App.Timers.phrase) {
            clearInterval(window.App.Timers.phrase);
        }
    } catch(e) {
        // 忽略卸载时的错误
    }
});


```

## 12 `js/features/modal_core.js`
```js
window.App.ModalCore = {
    init() {
        const modals = [
            { btn: 'settingsButton', modal: 'settingsModal', close: 'closeSettings' },
            { btn: 'changelogButton', modal: 'changelogModal', close: 'closeChangelog' },
            { btn: 'announcementButton', modal: 'announcementModal', close: 'closeAnnouncement' },
            { btn: 'lostAndFoundButton', modal: 'lostAndFoundModal', close: 'closeLostAndFound' },
            { btn: 'notificationButton', modal: 'notificationModal', close: 'closeNotification' },
            { btn: 'phraseSelectButton', modal: 'phraseModal', close: 'closePhrase' }   // 新增这一行
        ];

        modals.forEach(({btn, modal, close}) => {
            document.getElementById(btn).addEventListener('click', () => {
                document.getElementById(modal).classList.add('active');
            });
            document.getElementById(close).addEventListener('click', () => {
                document.getElementById(modal).classList.remove('active');
                this.resetFullscreen(modal);
            });
        });

        // 最大化按钮逻辑
        ['maximizeNotification', 'maximizeLostAndFound'].forEach(id => {
            const btn = document.getElementById(id);
            if(btn) btn.addEventListener('click', function() {
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

## 13 `js/features/modal_lost_found.js`
```js
window.App.ModalLostFound = {
    init() {
        this.bindEvents();
        this.initFontSizeControl();
    },

    bindEvents() {
        const list = document.getElementById('lostAndFoundList');
        if (!list) return;

        // 1. 点击文字变输入框的编辑功能 (事件委托)
        list.addEventListener('click', (e) => {
            const target = e.target;
            if (target.classList.contains('editable')) {
                const originalText = target.textContent;
                const input = document.createElement('input');
                input.className = 'edit-input';
                input.value = originalText;
                input.style.width = target.offsetWidth + 'px';
                
                input.addEventListener('blur', function() {
                    target.textContent = this.value;
                    target.style.display = 'inline';
                    input.remove();
                });

                input.addEventListener('input', function() {
                    this.style.width = (this.value.length * 20 + 30) + 'px';
                });

                target.style.display = 'none';
                target.parentNode.insertBefore(input, target);
                input.focus();
            }
        });

        // 2. 添加卡片功能
        const addBtn = document.querySelector('#lostAndFoundList .add-button');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
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
                
                // 应用当前字体大小
                const editables = newCard.querySelectorAll('.editable, .static-text');
                editables.forEach(item => {
                    item.style.fontSize = `${window.App.State.lostAndFoundFontSize}px`;
                });
            });
        }

        // 3. 删除功能（二次确认）
        list.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-btn')) {
                if (e.target.textContent === '删除') {
                    e.target.textContent = '确认删除';
                    e.target.style.background = '#d32f2f';
                } else {
                    e.target.closest('.announcement-card').remove();
                }
            }
        });

        // 4. 点击其他地方时重置所有删除按钮状态
        document.addEventListener('click', (e) => {
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
        
        if (slider && valueInput) {
            slider.addEventListener('input', () => {
                this.updateFontSize(parseInt(slider.value));
            });

            valueInput.addEventListener('input', () => {
                let val = parseInt(valueInput.value) || 28;
                if (val < 12) val = 12;
                if (val > 120) val = 120;
                this.updateFontSize(val);
            });
            
            // 初始化
            this.updateFontSize(28);
        }
    },

    updateFontSize(size) {
        window.App.State.lostAndFoundFontSize = size;
        const slider = document.getElementById('lostAndFoundFontSizeSlider');
        const valueInput = document.getElementById('lostAndFoundFontSizeValue');
        
        if (slider) slider.value = size;
        if (valueInput) valueInput.value = size;
        
        const items = document.querySelectorAll('#lostAndFoundList .editable, #lostAndFoundList .static-text');
        items.forEach(item => {
            item.style.fontSize = `${size}px`;
        });
    }
};
```

## 14 `js/features/modal_notification.js`
```js
window.App.ModalNotification = {
    init() {
        this.bindEvents();
        this.render();
    },

    adjustTextareaHeight(textarea) {
        const minHeight = 100;
        textarea.style.height = 'auto';
        const height = Math.max(minHeight, textarea.scrollHeight);
        textarea.style.height = height + 'px';
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
            
            // 删除按钮
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-notification-btn';
            deleteBtn.textContent = '删除';
            deleteBtn.dataset.index = index;
            item.appendChild(deleteBtn);
            
            // 删除事件
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // 阻止冒泡触发编辑
                const idx = e.target.dataset.index;
                if (e.target.textContent === '删除') {
                    e.target.textContent = '确认删除';
                    e.target.style.background = '#d32f2f';
                } else {
                    window.App.State.notifications.splice(idx, 1);
                    this.render();
                }
            });
            
            // 点击进入编辑模式
            item.addEventListener('click', (e) => {
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
                
                // 处理回车换行
                textarea.addEventListener('keydown', (evt) => {
                    if (evt.key === 'Enter' && !evt.shiftKey) {
                        evt.preventDefault();
                        const start = textarea.selectionStart;
                        const end = textarea.selectionEnd;
                        textarea.value = textarea.value.substring(0, start) + '\n' + textarea.value.substring(end);
                        textarea.selectionStart = textarea.selectionEnd = start + 1;
                        this.adjustTextareaHeight(textarea);
                    }
                });
                
                // 失去焦点保存
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

        // 添加通知
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                window.App.State.notifications.push("新通知 - 点击编辑内容");
                this.render();
                if (content) content.scrollTop = content.scrollHeight;
            });
        }

        // 字体滑块
        if (slider && valueInput && content) {
            slider.addEventListener('input', () => {
                content.style.fontSize = slider.value + 'px';
                valueInput.value = slider.value;
                this.render();
            });
            
            valueInput.addEventListener('input', () => {
                let val = parseInt(valueInput.value) || 16;
                if (val < 12) val = 12;
                if (val > 120) val = 120;
                content.style.fontSize = val + 'px';
                slider.value = val;
                this.render();
            });
        }

        // 点击其他区域恢复删除按钮状态
        document.addEventListener('click', (e) => {
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

## 15 `js/features/modal_phrase.js`
```js
window.App.ModalPhrase = {
    init() {
        this.bindEvents();
    },

    bindEvents() {
        const openBtn = document.getElementById('phraseSelectButton');
        const modal = document.getElementById('phraseModal');
        const closeBtn = document.getElementById('closePhrase');

        if (openBtn) {
            openBtn.addEventListener('click', () => {
                this.populateList();
                modal.classList.add('active');
            });
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.classList.remove('active');
            });
        }
    },

    populateList() {
        const container = document.getElementById('phraseList');
        if (!container) return;

        // 获取所有本地金句（来自 phrases.js）
        const allPhrases = [
            ...(window.localPhrases?.high || []),
            ...(window.localPhrases?.medium || []),
            ...(window.localPhrases?.low || [])
        ];

        container.innerHTML = '';
        const fragment = document.createDocumentFragment();

        allPhrases.forEach(phrase => {
            const item = document.createElement('div');
            item.className = 'phrase-item';
            // 支持换行符转换为 <br>
            item.innerHTML = phrase.replace(/\n/g, '<br>');

            item.addEventListener('click', () => {
                // 添加点击波纹效果（可选）
                item.classList.add('phrase-click-effect');
                setTimeout(() => item.classList.remove('phrase-click-effect'), 400);

                // 显示选中的金句
                if (window.App.GoldenPhrase && window.App.GoldenPhrase.updateDisplay) {
                    window.App.GoldenPhrase.updateDisplay(phrase);
                } else {
                    // 兼容直接调用全局 updatePhraseDisplay（若存在）
                    const container = document.getElementById('goldenPhrase');
                    if (container) {
                        const formatted = phrase.replace(/\n/g, '<br>');
                        container.innerHTML = `「 ${formatted} 」`;
                    }
                }

                // 关闭模态框
                const modal = document.getElementById('phraseModal');
                if (modal) modal.classList.remove('active');

                // 如果金句自动轮播是开启的，重置定时器
                const goldenSwitch = document.getElementById('goldenSwitch');
                if (goldenSwitch && goldenSwitch.checked && window.App.GoldenPhrase) {
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

## 16 `js/features/modal_settings.js`
```js
window.App.ModalSettings = {
    init() {
        this.bindSettingsRanges();
        this.bindOtherSettings();
        this.bindAllRangeControls();

        /*
         * 让外部 HTML 的 onclick="resetProbability()"
         * 和 onclick="resetInterval()" 可以正常调用。
         */
        window.resetProbability = () => {
            this.setProbability(50);
        };

        window.resetInterval = () => {
            this.setIntervalDuration(15);
        };
    },

    clamp(value, min, max, fallback) {
        const number = Number(value);

        if (!Number.isFinite(number)) {
            return fallback;
        }

        return Math.min(max, Math.max(min, number));
    },

    setProbability(value) {
        const finalValue = this.clamp(value, 0, 100, 50);

        const slider = document.getElementById('apiProbability');
        const number = document.getElementById('apiProbabilityValue');

        if (slider) {
            slider.value = finalValue;
        }

        if (number) {
            number.value = finalValue;
        }

        if (window.App.State) {
            window.App.State.apiProbability = finalValue;
        }
    },

    setIntervalDuration(value) {
        const finalValue = this.clamp(value, 1, 60, 15);

        const slider = document.getElementById('intervalSlider');
        const number = document.getElementById('intervalValue');

        if (slider) {
            slider.value = finalValue;
        }

        if (number) {
            number.value = finalValue;
        }

        if (window.App.State) {
            window.App.State.intervalDuration =
                finalValue * 1000;
        }

        const goldenSwitch =
            document.getElementById('goldenSwitch');

        if (
            goldenSwitch &&
            goldenSwitch.checked &&
            window.App.GoldenPhrase
        ) {
            window.App.GoldenPhrase.startTimer();
        }
    },

    bindSettingsRanges() {
        const probabilitySlider =
            document.getElementById('apiProbability');

        const probabilityValue =
            document.getElementById('apiProbabilityValue');

        if (probabilitySlider) {
            probabilitySlider.addEventListener('input', event => {
                this.setProbability(event.target.value);
            });
        }

        if (probabilityValue) {
            probabilityValue.addEventListener('input', event => {
                this.setProbability(event.target.value);
            });

            probabilityValue.addEventListener('change', event => {
                this.setProbability(event.target.value);
            });
        }

        const intervalSlider =
            document.getElementById('intervalSlider');

        const intervalValue =
            document.getElementById('intervalValue');

        if (intervalSlider) {
            intervalSlider.addEventListener('input', event => {
                this.setIntervalDuration(event.target.value);
            });
        }

        if (intervalValue) {
            intervalValue.addEventListener('input', event => {
                this.setIntervalDuration(event.target.value);
            });

            intervalValue.addEventListener('change', event => {
                this.setIntervalDuration(event.target.value);
            });
        }

        /*
         * 根据 HTML 中的初始值初始化 State。
         */
        this.setProbability(
            probabilitySlider
                ? probabilitySlider.value
                : 50
        );

        this.setIntervalDuration(
            intervalSlider
                ? intervalSlider.value
                : 15
        );
    },

    bindOtherSettings() {
        const goldenSwitch =
            document.getElementById('goldenSwitch');

        if (goldenSwitch) {
            goldenSwitch.addEventListener('change', event => {
                if (!window.App.GoldenPhrase) return;

                if (event.target.checked) {
                    window.App.GoldenPhrase.startTimer();
                } else {
                    window.App.GoldenPhrase.stopTimer();
                }
            });
        }

        const imageSwitch =
            document.getElementById('imageSwitch');

        if (imageSwitch) {
            imageSwitch.addEventListener('change', event => {
                const image =
                    document.getElementById('apiImage');

                if (!image) return;

                if (event.target.checked) {
                    image.style.display = 'block';

                    if (window.App.DailyImage) {
                        window.App.DailyImage.init();
                    }
                } else {
                    image.style.display = 'none';

                    if (
                        window.App.Timers &&
                        window.App.Timers.image
                    ) {
                        clearInterval(window.App.Timers.image);
                        window.App.Timers.image = null;
                    }
                }
            });
        }

        const animationSwitch =
            document.getElementById('animationSwitch');

        if (animationSwitch) {
            animationSwitch.addEventListener('change', event => {
                const phrase =
                    document.getElementById('goldenPhrase');

                if (!phrase) return;

                phrase.classList.toggle(
                    'no-animation',
                    !event.target.checked
                );
            });
        }
    },

    bindRangePair(rangeId, numberId, options = {}) {
        const range = document.getElementById(rangeId);
        const number = document.getElementById(numberId);

        if (!range && !number) return;

        const min = Number(
            options.min ??
            range?.min ??
            number?.min ??
            0
        );

        const max = Number(
            options.max ??
            range?.max ??
            number?.max ??
            100
        );

        const fallback = Number(
            options.fallback ??
            range?.value ??
            number?.value ??
            min
        );

        const apply = value => {
            const result = this.clamp(
                value,
                min,
                max,
                fallback
            );

            if (range && range.value !== String(result)) {
                range.value = result;
            }

            if (number && number.value !== String(result)) {
                number.value = result;
            }

            if (typeof options.onInput === 'function') {
                options.onInput(result);
            }
        };

        if (range) {
            range.addEventListener('input', event => {
                apply(event.target.value);
            });

            range.addEventListener('change', event => {
                apply(event.target.value);
            });
        }

        if (number) {
            number.addEventListener('input', event => {
                apply(event.target.value);
            });

            number.addEventListener('change', event => {
                apply(event.target.value);
            });
        }

        apply(
            range?.value ??
            number?.value ??
            fallback
        );
    },

    bindAllRangeControls() {
        /*
         * 通知字体大小滑块。
         */
        this.bindRangePair(
            'fontSizeSlider',
            'fontSizeValue',
            {
                min: 12,
                max: 120,
                fallback: 16,
                onInput: value => {
                    const content =
                        document.getElementById(
                            'notificationContent'
                        );

                    if (content) {
                        content.style.fontSize = `${value}px`;
                    }
                }
            }
        );

        /*
         * 寻物字体大小滑块。
         */
        this.bindRangePair(
            'lostAndFoundFontSizeSlider',
            'lostAndFoundFontSizeValue',
            {
                min: 12,
                max: 120,
                fallback: 28,
                onInput: value => {
                    const list =
                        document.getElementById(
                            'lostAndFoundList'
                        );

                    if (list) {
                        list.style.fontSize = `${value}px`;
                    }
                }
            }
        );
    }
};
```

## 17 `js/features/school_schedule.js`
```js
window.App.SchoolSchedule = {
    init() {
        if (window.App.Timers.schoolSchedule) {
            clearInterval(window.App.Timers.schoolSchedule);
        }

        window.App.Timers.schoolSchedule = setInterval(() => {
            this.updateDisplay();
            this.updateCountdownDisplay();
        }, 1000);

        this.updateDisplay();
        this.updateCountdownDisplay();
    },

    getScheduleData() {
        return typeof schedule !== 'undefined'
            ? schedule
            : window.schedule || {};
    },

    getTimetableData() {
        return typeof timetable !== 'undefined'
            ? timetable
            : window.timetable || {};
    },

    getCourseName(day, lessonIndex) {
        const days = [
            'sunday',
            'monday',
            'tuesday',
            'wednesday',
            'thursday',
            'friday',
            'saturday'
        ];

        const timetableData = this.getTimetableData();
        const dayName = days[day];
        const courses = timetableData[dayName] || [];

        /*
         * 周日课表只有晚自习，课表下标从 0 开始。
         */
        if (day === 0) {
            return courses[lessonIndex] || '';
        }

        /*
         * 周一至周五的课表结构：
         *
         * timetable:
         * 0     早自习
         * 1-8   第一节至第八节课
         * 9-12  晚自习
         *
         * schedule 中的 lessonIndex 只统计：
         * 第一节课、第二节课……晚自习
         *
         * 因此需要整体加 1。
         */
        const timetableIndex = lessonIndex + 1;

        return courses[timetableIndex] || '';
    },

    isCourseSchedule(name) {
        if (!name) return false;

        return (
            name.includes('节课') ||
            name.includes('晚自习') ||
            name.endsWith('考试')
        );
    },

    getLessonItems(todaySchedule) {
        if (!Array.isArray(todaySchedule)) {
            return [];
        }

        return todaySchedule.filter(item => {
            const name = item[1];
            return this.isCourseSchedule(name);
        });
    },

    getNextSchoolDayTime(now) {
        const target = new Date(now);
        const day = target.getDay();

        let daysUntilSunday = 0;

        if (day === 5) {
            daysUntilSunday = 2;
        } else if (day === 6) {
            daysUntilSunday = 1;
        } else if (day === 0) {
            daysUntilSunday = 0;
        }

        target.setDate(target.getDate() + daysUntilSunday);
        target.setHours(17, 30, 0, 0);

        return {
            endTime: target,
            label: '周日返校'
        };
    },

    getCurrentSchedule() {
        const now = new Date();
        const day = now.getDay();
        const currentMinutes =
            now.getHours() * 60 + now.getMinutes();

        const utils = window.App.Utils;
        const scheduleData = this.getScheduleData();

        if (day === 6) {
            return {
                current: '周末',
                nextLesson: ''
            };
        }

        if (
            day === 0 &&
            currentMinutes < utils.timeToMinutes('17:30')
        ) {
            return {
                current: '周末',
                nextLesson: '第一节晚自习'
            };
        }

        let todaySchedule;

        if (day === 5) {
            todaySchedule = scheduleData.friday;
        } else if (day === 0) {
            todaySchedule = scheduleData.sunday;
        } else {
            todaySchedule = scheduleData.weekday;
        }

        if (!todaySchedule) {
            return {
                current: '加载中...',
                nextLesson: ''
            };
        }

        /*
         * 特别处理跨天睡觉时间。
         */
        if (
            currentMinutes >= utils.timeToMinutes('21:30') ||
            currentMinutes < utils.timeToMinutes('6:30')
        ) {
            return {
                current: '睡觉',
                nextLesson: '无'
            };
        }

        let current = '';
        let currentIndex = -1;

        for (let i = 0; i < todaySchedule.length; i++) {
            const [timeRange, name] = todaySchedule[i];
            const [start, end] = timeRange.split('-');

            const startMinutes = utils.timeToMinutes(start);
            const endMinutes = utils.timeToMinutes(end);

            let isInRange = false;

            if (endMinutes < startMinutes) {
                isInRange =
                    currentMinutes >= startMinutes ||
                    currentMinutes < endMinutes;
            } else {
                isInRange =
                    currentMinutes >= startMinutes &&
                    currentMinutes < endMinutes;
            }

            if (isInRange) {
                current = name;
                currentIndex = i;
                break;
            }
        }

        let nextLesson = '';

        /*
         * 这里不能简单地把当前项目的下一项作为“下一节课”，
         * 因为早读、课间、大课间等都不是课程。
         *
         * 例如：
         * 早读 -> 第一节课
         * 第一节课 -> 第二节课
         */
        if (currentIndex >= 0) {
            for (
                let i = currentIndex + 1;
                i < todaySchedule.length;
                i++
            ) {
                const name = todaySchedule[i][1];

                if (this.isCourseSchedule(name)) {
                    nextLesson = name;
                    break;
                }
            }
        }

        if (!current && day === 5) {
            return {
                current: '放学',
                nextLesson: '无'
            };
        }

        return {
            current: current || '休息',
            nextLesson: nextLesson || '无'
        };
    },

    getCourseDisplayName(day, scheduleName) {
        if (!this.isCourseSchedule(scheduleName)) {
            return scheduleName;
        }

        const scheduleData = this.getScheduleData();

        let todaySchedule;

        if (day === 5) {
            todaySchedule = scheduleData.friday;
        } else if (day === 0) {
            todaySchedule = scheduleData.sunday;
        } else {
            todaySchedule = scheduleData.weekday;
        }

        const lessonItems = this.getLessonItems(todaySchedule);
        const lessonIndex = lessonItems.findIndex(item => {
            return item[1] === scheduleName;
        });

        if (lessonIndex < 0) {
            return scheduleName;
        }

        return this.getCourseName(day, lessonIndex) || scheduleName;
    },

    updateDisplay() {
        const day = new Date().getDay();
        const result = this.getCurrentSchedule();

        const currentElement =
            document.getElementById('currentSchedule');

        const nextElement =
            document.getElementById('nextSchedule');

        if (currentElement) {
            currentElement.textContent = this.getCourseDisplayName(
                day,
                result.current
            );
        }

        if (nextElement) {
            nextElement.textContent =
                result.nextLesson === '无'
                    ? '无'
                    : this.getCourseDisplayName(
                        day,
                        result.nextLesson
                    );
        }

        this.renderTimetable(day);
    },

    renderTimetable(day) {
        const container =
            document.getElementById('todayTimetable');

        if (!container) return;

        if (day === 6) {
            container.innerHTML =
                '<div class="timetable-item" ' +
                'style="font-family: STZhongSong, cursive; ' +
                'font-size:24px; text-align:center;">' +
                '周末无课表</div>';

            return;
        }

        const days = [
            'sunday',
            'monday',
            'tuesday',
            'wednesday',
            'thursday',
            'friday',
            'saturday'
        ];

        const timetableData = this.getTimetableData();
        const courses = timetableData[days[day]] || [];

        if (!courses.length) {
            container.innerHTML =
                '<div class="timetable-item" ' +
                'style="font-family: STZhongSong, cursive; ' +
                'font-size:24px; text-align:center;">' +
                '暂无数据</div>';

            return;
        }

        container.innerHTML = courses.map((course, index) => {
            let label = '';
            let showDivider = false;

            if (day === 0) {
                label = `晚${index + 1}`;
            } else {
                if (index === 0) {
                    label = '早';
                    showDivider = true;
                } else if (index <= 8) {
                    label = String(index);

                    if (index === 4 || index === 8) {
                        showDivider = true;
                    }
                } else {
                    label = `晚${index - 8}`;
                }
            }

            let itemStyle =
                'display:flex;' +
                'align-items:center;' +
                'font-family:STZhongSong,cursive;' +
                'font-size:24px;' +
                'line-height:1;' +
                'padding:2px 0;';

            if (showDivider) {
                itemStyle +=
                    'border-bottom:2px dashed #ddd;' +
                    'margin-bottom:6px;' +
                    'padding-bottom:6px;';
            }

            return `
                <div style="${itemStyle}">
                    <div style="
                        width:42%;
                        text-align:right;
                        padding-right:15px;
                        color:#8bc34a;
                        font-weight:bold;
                    ">
                        ${label}
                    </div>

                    <div style="
                        width:58%;
                        text-align:left;
                        padding-left:5px;
                        color:#333;
                    ">
                        ${course}
                    </div>
                </div>
            `;
        }).join('');
    },

    getNextScheduleInfo() {
        const now = new Date();
        const day = now.getDay();
        const currentMinutes =
            now.getHours() * 60 + now.getMinutes();

        const utils = window.App.Utils;
        const scheduleData = this.getScheduleData();

        let todaySchedule;

        if (day === 5) {
            todaySchedule = scheduleData.friday;
        } else if (day === 0) {
            todaySchedule = scheduleData.sunday;
        } else {
            todaySchedule = scheduleData.weekday;
        }

        if (!todaySchedule) {
            return {
                endTime: '23:59',
                label: '加载中'
            };
        }

        const currentResult = this.getCurrentSchedule();
        const current = currentResult.current;

        if (
            current === '放学' ||
            day === 6 ||
            (day === 0 && current === '周末')
        ) {
            return this.getNextSchoolDayTime(now);
        }

        if (current === '午休') {
            const firstPart =
                currentMinutes < utils.timeToMinutes('13:10');

            return {
                endTime: firstPart ? '13:10' : '13:40',
                label: firstPart ? '熄灯' : '起床'
            };
        }

        let currentIndex = todaySchedule.findIndex(([timeRange]) => {
            const [start, end] = timeRange.split('-');

            const startMinutes = utils.timeToMinutes(start);
            const endMinutes = utils.timeToMinutes(end);

            if (endMinutes < startMinutes) {
                return (
                    currentMinutes >= startMinutes ||
                    currentMinutes < endMinutes
                );
            }

            return (
                currentMinutes >= startMinutes &&
                currentMinutes < endMinutes
            );
        });

        if (currentIndex === -1) {
            return {
                endTime: '23:59',
                label: '新的一天'
            };
        }

        const currentItem = todaySchedule[currentIndex];
        const currentRange = currentItem[0];
        const currentName = currentItem[1];

        if (currentName.includes('课间')) {
            return {
                endTime: currentRange.split('-')[1],
                label: '上课'
            };
        }

        if (
            currentName.includes('节课') ||
            currentName.includes('晚自习') ||
            currentName.includes('早读') ||
            currentName.endsWith('考试')
        ) {
            return {
                endTime: currentRange.split('-')[1],
                label: '下课'
            };
        }

        const nextIndex = currentIndex + 1;

        if (nextIndex < todaySchedule.length) {
            return {
                endTime: todaySchedule[nextIndex][0].split('-')[0],
                label: todaySchedule[nextIndex][1]
            };
        }

        return {
            endTime: '23:59',
            label: '新的一天'
        };
    },

    updateCountdownDisplay() {
        const result = this.getNextScheduleInfo();
        const now = new Date();

        let target;
        let label = result.label;

        if (result.endTime instanceof Date) {
            target = result.endTime;
        } else {
            const [hour, minute] =
                result.endTime.split(':').map(Number);

            target = new Date(now);
            target.setHours(hour, minute, 0, 0);

            if (target < now) {
                target.setDate(target.getDate() + 1);
            }
        }

        let difference = target - now;

        if (difference < 0) {
            difference = 0;
        }

        const totalSeconds = Math.floor(difference / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor(
            (totalSeconds % 3600) / 60
        );
        const seconds = totalSeconds % 60;

        const timerElement =
            document.getElementById('countdownTimer');

        const labelElement =
            document.getElementById('countdownName');

        if (labelElement) {
            labelElement.textContent = `距离${label}还有：`;
        }

        if (timerElement) {
            if (hours > 0) {
                timerElement.textContent =
                    `${String(hours).padStart(2, '0')}:` +
                    `${String(minutes).padStart(2, '0')}:` +
                    `${String(seconds).padStart(2, '0')}`;
            } else {
                timerElement.textContent =
                    `${String(minutes).padStart(2, '0')}:` +
                    `${String(seconds).padStart(2, '0')}`;
            }
        }
    }
};
```

## 18 `js/features/timeline.js`
```js
window.App.Timeline = {
    init() {
        // 1. 获取当前年份
        const currentYear = new Date().getFullYear();
        
        // 2. 实时计算今年的节气日期并更新到全局数据中
        this.updateSolarTermsDates(currentYear);

        // 3. 生成界面
        this.generateMarkers();
        this.updateColor();
        
        // 每天刷新一次
        setInterval(() => {
            const newYear = new Date().getFullYear();
            this.updateSolarTermsDates(newYear);
            this.generateMarkers();
        }, 86400000);
    },

    generateMarkers() {
        const currentYear = new Date().getFullYear();
        const gradYear = 2028; // 设定毕业年份
        
        // 确保立春数据已更新
        const springStart = solarTerms.find(t => t.name === '立春');
        if (!springStart) return;

        // 确定起止时间
        const startDate = new Date(currentYear, springStart.month - 1, springStart.day); // 注意：month在数据里通常是1-12，Date需0-11
        let endDate;
        
        const endMarkerEl = document.querySelector('.end-marker'); // 获取终点元素

        if (currentYear === gradYear) {
            endDate = new Date(gradYear, 5, 7); // 6月7日
            // 显示终点标记并更新文字
            endMarkerEl.style.display = 'block'; 
            document.getElementById('timelineEndTitle').textContent = "高考日";
            document.getElementById('timelineEndDate').textContent = "6月7日";
        } else {
            endDate = new Date(currentYear, 11, 31);
            // 非毕业年份，隐藏终点标记（虽然计算进度条还需要endDate，但界面上不显示）
            endMarkerEl.style.display = 'none';
        }


        const totalDays = (endDate - startDate) / 86400000;
        const timeline = document.getElementById('timeline');
        
        // 清除旧标记
        document.querySelectorAll('.solar-term-marker').forEach(m => m.remove()); 

        solarTerms.forEach((term, index) => {
            // 注意：数据文件里的 month 如果是 1 代表 1月，Date对象需要 0
            const termDate = new Date(currentYear, term.month - 1, term.day); 
            
            // 超出范围的不显示
            if (termDate < startDate || termDate > endDate) return;

            const position = ((termDate - startDate) / 86400000 / totalDays) * 100;
            const isPast = termDate < new Date();
            
            // === 核心修改：上下交错排列逻辑 ===
            const isTop = index % 2 === 0; // 偶数在上方，奇数在下方
            const topPosition = isTop ? '-45px' : '25px'; // 上方位置不变，下方位置下移
            
            const marker = document.createElement('div'); 
            marker.className = 'solar-term-marker';
            marker.style.left = `${position}%`;
            marker.style.top = topPosition; // 应用动态高度
            
            // 增加 vertical-line 连接线效果（可选，用简单的 border 实现）
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
                <!-- 连接线 -->
                <div style="${lineStyle}"></div>
            `;
            
            // === 卡片逻辑优化 ===
            // 如果标签在下方，卡片应该显示在标签上方，防止遮挡
            // 如果标签在上方，卡片显示在下方
            const card = document.createElement('div');
            card.className = 'solar-card';
            
            if (!isTop) {
                // 底部标签：卡片向上弹出
                card.style.top = 'auto';
                card.style.bottom = '100%';
                card.style.marginBottom = '20px'; // 留出间距
                // 修改小三角方向
                // 注意：这里需要配合 CSS 修改，或者直接用 JS 覆盖样式
                // 简单起见，这里让底部标签的卡片也悬浮在合适位置，或者统一居中
            }
            
            // 重新填入卡片内容
            card.innerHTML = `
                <h3 style="margin:0 0 10px;">${term.name} <small style="font-size:0.6em;color:#666">${currentYear}年${term.month}月${term.day}日</small></h3>
                <div style="display:flex; gap:15px;">
                    <img src="${term.image}" style="width:140px;height:120px;object-fit:cover;border-radius:6px;flex-shrink:0;">
                    <p style="text-indent:2em;margin:0;font-size:14px;">${term.desc}</p>
                </div>
            `;
            
            // 修正底部卡片的三角箭头 (简单处理：移除默认三角，使用 box-shadow)
            if (!isTop) {
                 // 动态创建一个样式覆盖
                 card.style.transformOrigin = "bottom center";
            }

            marker.appendChild(card);
            
            marker.addEventListener('click', (e) => {
                e.stopPropagation();
                
                // 1. 关闭所有卡片
                document.querySelectorAll('.solar-card').forEach(c => c.classList.remove('active'));
                
                // 2. ★核心修复★：重置所有标记点的 z-index 为默认值 2
                document.querySelectorAll('.solar-term-marker').forEach(m => m.style.zIndex = '2');

                // 3. 显示当前卡片
                card.classList.add('active');
                
                // 4. ★核心修复★：将当前点击的标记点层级设为最高，防止被隔壁标记遮挡
                marker.style.zIndex = '999';
            });
            timeline.appendChild(marker); 
        });

        // 点击空白处关闭
        document.addEventListener('click', () => {
            document.querySelectorAll('.solar-card').forEach(c => c.classList.remove('active'));
            // 还原所有标记点的层级
            document.querySelectorAll('.solar-term-marker').forEach(m => m.style.zIndex = '2');
        });
    },

    updateColor() {
        const currentYear = new Date().getFullYear();
        const gradYear = 2028;
        const springStart = solarTerms.find(t => t.name === '立春');
        
        // 容错处理
        if (!springStart) return;

        const startDate = new Date(currentYear, springStart.month - 1, springStart.day); 
        let endDate;

        if (currentYear === gradYear) {
            endDate = new Date(gradYear, 5, 7);
        } else {
            endDate = new Date(currentYear, 11, 31);
        }
        
        const progress = Math.min(1, Math.max(0, (new Date() - startDate) / (endDate - startDate)));
        const timeline = document.getElementById('timeline');
        if(timeline) {
            timeline.style.setProperty('--progress-percent', `${progress * 100}%`);
        }
        requestAnimationFrame(() => this.updateColor());
    },

    // === 新增：寿星天文历算法（21世纪适用版） ===
    // 用于根据年份动态计算节气日期，不再依赖写死的 2025 数据
    updateSolarTermsDates(year) {
        // 21世纪(2000-2099)各节气C值常量表
        // 顺序：小寒, 大寒, 立春, 雨水, 惊蛰, 春分, 清明, 谷雨, 立夏, 小满, 芒种, 夏至, 小暑, 大暑, 立秋, 处暑, 白露, 秋分, 寒露, 霜降, 立冬, 小雪, 大雪, 冬至
        const c_map = {
            "小寒": 5.4055, "大寒": 20.12, "立春": 3.87, "雨水": 18.73, 
            "惊蛰": 5.63, "春分": 20.646, "清明": 4.81, "谷雨": 20.1, 
            "立夏": 5.52, "小满": 21.04, "芒种": 5.678, "夏至": 21.37, 
            "小暑": 7.108, "大暑": 22.83, "立秋": 7.5, "处暑": 23.13, 
            "白露": 7.646, "秋分": 23.042, "寒露": 8.318, "霜降": 23.438, 
            "立冬": 7.438, "小雪": 22.385, "大雪": 7.18, "冬至": 21.94
        };
        
        // 月份映射表 (小寒是1月)
        const month_map = {
            "小寒": 1, "大寒": 1, "立春": 2, "雨水": 2, 
            "惊蛰": 3, "春分": 3, "清明": 4, "谷雨": 4, 
            "立夏": 5, "小满": 5, "芒种": 6, "夏至": 6, 
            "小暑": 7, "大暑": 7, "立秋": 8, "处暑": 8, 
            "白露": 9, "秋分": 9, "寒露": 10, "霜降": 10, 
            "立冬": 11, "小雪": 11, "大雪": 12, "冬至": 12
        };

        // 算法公式：[Y*D+C]-L
        // Y=年份后2位, D=0.2422, L=闰年数, C=常量
        const y = year % 100;
        const D = 0.2422;
        
        solarTerms.forEach(term => {
            if (c_map[term.name]) {
                const C = c_map[term.name];
                // 计算该节气在当年的日期 (日)
                // 21世纪闰年数计算修正: int(y/4)
                const leapCount = Math.floor(y / 4);
                let day = Math.floor(y * D + C) - leapCount;
                
                // 赋值更新
                term.day = day;
                term.month = month_map[term.name];
                
                // 特殊年份修正（经验修正，可选）
                // 2026年立春可能是3号，公式计算通常准确，极个别差1天，这里暂时忽略微小误差，
                // 对于高中倒计时展示来说，寿星公式精度足够。
            }
        });
        
        // 重新按时间排序，确保“小寒”在最前，“冬至”在最后（如果原数组乱序的话）
        // solarTerms.sort((a, b) => (a.month * 100 + a.day) - (b.month * 100 + b.day));
    }
};
```

## 19 `js/features/weather.js`
```js
window.App.Weather = {
    init() {
        this.fetch();

        // 设置为 60000 毫秒（1分钟）更新一次
        if (window.App.Timers.weather) {
            clearInterval(window.App.Timers.weather);
        }

        window.App.Timers.weather = setInterval(() => {
            this.fetch();
        }, 60000);
    },

    async fetch() {
        const weatherElement =
            document.getElementById('weatherInfo');

        if (!weatherElement) {
            return;
        }

        try {
            // 第一步：通过 ipwho.is 获取地理位置
            const locationResponse = await fetch(
                'https://ipwho.is/'
            );

            if (!locationResponse.ok) {
                throw new Error('地理位置请求失败');
            }

            const locationData =
                await locationResponse.json();

            if (
                locationData.success !== true ||
                typeof locationData.latitude !== 'number' ||
                typeof locationData.longitude !== 'number'
            ) {
                throw new Error(
                    locationData.message || '地理位置数据无效'
                );
            }

            const latitude = locationData.latitude;
            const longitude = locationData.longitude;

            const timezone =
                locationData.timezone &&
                locationData.timezone.id
                    ? locationData.timezone.id
                    : 'auto';

            // 第二步：通过 Open-Meteo 获取天气和今日最高/最低温度
            const weatherUrl =
                'https://api.open-meteo.com/v1/forecast' +
                `?latitude=${encodeURIComponent(latitude)}` +
                `&longitude=${encodeURIComponent(longitude)}` +
                '&current=weather_code' +
                '&daily=temperature_2m_min,temperature_2m_max' +
                '&forecast_days=1' +
                `&timezone=${encodeURIComponent(timezone)}`;

            const weatherResponse =
                await fetch(weatherUrl);

            if (!weatherResponse.ok) {
                throw new Error('天气数据请求失败');
            }

            const weatherData =
                await weatherResponse.json();

            const current = weatherData.current;
            const daily = weatherData.daily;

            if (
                !current ||
                daily &&
                (
                    !Array.isArray(daily.temperature_2m_min) ||
                    !Array.isArray(daily.temperature_2m_max)
                )
            ) {
                throw new Error('天气数据格式错误');
            }

            const weatherCode = current.weather_code;
            const type = this.getWeatherName(weatherCode);

            const low = this.formatTemperature(
                daily.temperature_2m_min[0]
            );

            const high = this.formatTemperature(
                daily.temperature_2m_max[0]
            );

            /*
             * 保持原有显示格式：
             * 天气：小雨 19.9~24.6℃
             *
             * 原代码中虽然获取了 location，
             * 但实际 weatherString 并没有显示位置名称。
             */
            const weatherString =
                `${type} ${low}~${high}℃`;

            weatherElement.textContent = weatherString;
        } catch (error) {
            console.error('天气加载失败:', error);
            weatherElement.textContent = '天气暂不可用';
        }
    },

    formatTemperature(value) {
        const temperature = Number(value);

        if (!Number.isFinite(temperature)) {
            return '--';
        }

        return Number.isInteger(temperature)
            ? String(temperature)
            : temperature.toFixed(1);
    },

    getWeatherName(code) {
        const weatherMap = {
            0: '晴',
            1: '大部晴朗',
            2: '局部多云',
            3: '阴',
            45: '雾',
            48: '雾凇',
            51: '小毛毛雨',
            53: '毛毛雨',
            55: '大毛毛雨',
            56: '冻毛毛雨',
            57: '强冻毛毛雨',
            61: '小雨',
            63: '中雨',
            65: '大雨',
            66: '冻雨',
            67: '强冻雨',
            71: '小雪',
            73: '中雪',
            75: '大雪',
            77: '雪粒',
            80: '小阵雨',
            81: '中阵雨',
            82: '强阵雨',
            85: '小阵雪',
            86: '强阵雪',
            95: '雷雨',
            96: '雷雨伴冰雹',
            99: '强雷雨伴冰雹'
        };

        return weatherMap[code] || '未知天气';
    }
};
```

