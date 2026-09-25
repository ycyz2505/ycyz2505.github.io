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
#lostAndFoundList{--laf-font-size:28px}
#lostAndFoundList .editable,#lostAndFoundList .static-text{font-size:var(--laf-font-size)!important}

/* ===== 今日课表临时编辑 ===== */
.timetable-editor{margin-top:8px;padding:18px;border:1px solid #e3eee3;border-radius:8px;background:#fbfdfb;box-shadow:0 2px 8px rgba(27,94,32,.05)}
.timetable-editor-header{display:flex;align-items:center;justify-content:space-between;gap:15px;margin-bottom:6px}
.timetable-editor-title{margin:0;color:#1b5e20;font-size:19px;font-family:STZhongsong,serif;font-weight:600}
.timetable-editor-meta{color:#777;font-size:13px;white-space:nowrap}
.timetable-editor-note{margin:0 0 15px;color:#777;font-size:13px;line-height:1.6}
.timetable-editor-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px 14px;max-height:310px;overflow-y:auto;padding:2px}
.timetable-editor-grid::-webkit-scrollbar{width:6px}
.timetable-editor-grid::-webkit-scrollbar-track{background:#f1f5f1;border-radius:3px}
.timetable-editor-grid::-webkit-scrollbar-thumb{background:#c6d8c6;border-radius:3px}
.timetable-editor-grid::-webkit-scrollbar-thumb:hover{background:#8bc34a}
.timetable-editor-row{display:flex;align-items:center;gap:9px;min-width:0}
.timetable-editor-label{flex:0 0 42px;color:#8bc34a;font-size:14px;font-weight:700;text-align:right}
.timetable-course-input{flex:1;min-width:0;height:34px;box-sizing:border-box;padding:5px 9px;border:1px solid #d8e5d8;border-radius:5px;outline:none;color:#333;background:#fff;font-family:'Microsoft YaHei',sans-serif;font-size:14px;transition:border-color .2s,box-shadow .2s}
.timetable-course-input:focus{border-color:#8bc34a;box-shadow:0 0 0 3px rgba(139,195,74,.15)}
.timetable-editor-actions{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:16px;padding-top:14px;border-top:1px solid #e8eee8}
.timetable-editor-buttons{display:flex;align-items:center;gap:9px}
.timetable-save-btn,.timetable-reset-btn{border:none;border-radius:5px;padding:8px 14px;cursor:pointer;font-size:13px;transition:all .2s}
.timetable-save-btn{background:#8bc34a;color:#fff;box-shadow:0 2px 5px rgba(139,195,74,.25)}
.timetable-save-btn:hover{background:#7cb342;transform:translateY(-1px)}
.timetable-reset-btn{background:#f1f5f1;color:#56705a;border:1px solid #d7e3d7}
.timetable-reset-btn:hover{background:#e8f5e9;color:#1b5e20}
.timetable-save-btn:disabled,.timetable-reset-btn:disabled{cursor:not-allowed;opacity:.5;transform:none}
.timetable-editor-status{min-height:18px;color:#777;font-size:12px;text-align:right}
@media(max-width:700px){
.timetable-editor-header,.timetable-editor-actions{align-items:flex-start;flex-direction:column}
.timetable-editor-meta,.timetable-editor-status{text-align:left;white-space:normal}
.timetable-editor-grid{grid-template-columns:1fr}
}

```

## 2 `js/features/main.js`
```js
window.onload = async function () {
    try {
        await window.App.Store.init();
    } catch (e) {
        console.error('本地存储初始化失败：', e);
    }

    const safeInit = (name, fn) => {
        try {
            if (typeof fn === 'function') {
                fn();
            } else {
                console.warn(
                    `模块 ${name} 未找到或 init 不是函数`
                );
            }
        } catch (e) {
            console.error(
                `模块 ${name} 初始化失败:`,
                e
            );
        }
    };

    safeInit('Clock', () => window.App.Clock?.init());
    safeInit('Weather', () => window.App.Weather?.init());
    safeInit('DailyImage', () => window.App.DailyImage?.init());
    safeInit('Timeline', () => window.App.Timeline?.init());
    safeInit('ExamCountdown', () => window.App.ExamCountdown?.init());
    safeInit('SchoolSchedule', () => window.App.SchoolSchedule?.init());
    safeInit('GoldenPhrase', () => window.App.GoldenPhrase?.init());
    safeInit('AutoRefresh', () => window.App.AutoRefresh?.init());

    safeInit('ModalCore', () => window.App.ModalCore?.init());
    safeInit('ModalSettings', () => window.App.ModalSettings?.init());
    safeInit('ModalTimetable', () => window.App.ModalTimetable?.init());
    safeInit('ModalLostFound', () => window.App.ModalLostFound?.init());
    safeInit('ModalNotification', () => window.App.ModalNotification?.init());
    safeInit('ModalPhrase', () => window.App.ModalPhrase?.init());

    const loadingOverlay =
        document.getElementById('loadingOverlay');

    const pageContent =
        document.getElementById('pageContent');

    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }

    if (pageContent) {
        pageContent.style.display = 'block';
    }
};

window.addEventListener('unload', () => {
    try {
        if (window.App.Timers?.phrase) {
            clearInterval(window.App.Timers.phrase);
        }

        window.App.Store?.flush();
    } catch (e) {
        // 忽略页面关闭阶段的异常
    }
});

```

## 3 `js/features/modal_core.js`
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

## 4 `js/features/modal_lost_found.js`
```js
window.App.ModalLostFound = {
    init() {
        this.bindEvents();
        this.initFontSizeControl();
        this.render();
    },

    render() {
        const container = document.getElementById('lostAndFoundList');
        if (!container) return;

        const list = (window.App.Store && window.App.Store.get('lostfound')) || [];
        const esc = this.escapeHTML;

        container.innerHTML = list.map((entry, idx) => `
            <div class="announcement-card">
                <div class="announcement-body" style="position:relative; text-align: center; font-family: STZhongsong, serif;">
                    <span class="editable" data-type="name" data-index="${idx}" style="color: #1E90FF;">${esc(entry.name || '')}</span>
                    <span class="static-text">的</span>
                    <span class="editable" data-type="item" data-index="${idx}" style="color: #1E90FF;">${esc(entry.item || '')}</span>
                    <button class="delete-btn" data-index="${idx}">删除</button>
                </div>
            </div>
        `).join('');

        // 应用当前字号
        const size = window.App.State.lostAndFoundFontSize || 28;
        container.style.setProperty('--laf-font-size', size + 'px');
    },

    bindEvents() {
        const list = document.getElementById('lostAndFoundList');
        const addBtn = document.getElementById('addLostFoundBtn');
        if (!list) return;

        // 行内编辑
        list.addEventListener('click', e => {
            const target = e.target;
            if (!target.classList.contains('editable')) return;

            const idx = Number(target.dataset.index);
            const type = target.dataset.type;
            const arr = window.App.Store.get('lostfound');
            if (!arr || !arr[idx]) return;

            const input = document.createElement('input');
            input.className = 'edit-input';
            input.value = arr[idx][type] || '';
            input.style.width = Math.max(80, target.offsetWidth) + 'px';

            input.addEventListener('input', function () {
                this.style.width = Math.max(80, this.value.length * 20 + 30) + 'px';
            });

            input.addEventListener('blur', () => {
                const value = input.value.trim() || (type === 'name' ? '同学' : '物品');
                arr[idx][type] = value;
                window.App.Store.touch('lostfound');
                this.render();
            });

            target.style.display = 'none';
            target.parentNode.insertBefore(input, target);
            input.focus();
        });

        // 删除
        list.addEventListener('click', e => {
            if (!e.target.classList.contains('delete-btn')) return;
            const idx = Number(e.target.dataset.index);
            const arr = window.App.Store.get('lostfound');
            if (!arr || !arr[idx]) return;

            if (e.target.textContent === '删除') {
                e.target.textContent = '确认删除';
                e.target.style.background = '#d32f2f';
            } else {
                arr.splice(idx, 1);
                window.App.Store.touch('lostfound');
                this.render();
            }
        });

        // 点击其它地方复位删除按钮
        document.addEventListener('click', e => {
            if (!e.target.classList.contains('delete-btn')) {
                document.querySelectorAll('#lostAndFoundList .delete-btn').forEach(btn => {
                    btn.textContent = '删除';
                    btn.style.background = '#f44';
                });
            }
        });

        // 新增
        addBtn?.addEventListener('click', () => {
            const arr = window.App.Store.get('lostfound') || [];
            arr.push({ name: '同学', item: '物品' });
            window.App.Store.touch('lostfound');
            this.render();
        });
    },

    initFontSizeControl() {
        const slider = document.getElementById('lostAndFoundFontSizeSlider');
        const valueInput = document.getElementById('lostAndFoundFontSizeValue');
        if (!slider || !valueInput) return;

        const saved = window.App.State.lostAndFoundFontSize || 28;
        slider.value = saved;
        valueInput.value = saved;

        slider.addEventListener('input', () => this.updateFontSize(parseInt(slider.value, 10)));
        valueInput.addEventListener('input', () => {
            let val = parseInt(valueInput.value, 10) || 28;
            val = Math.min(120, Math.max(12, val));
            this.updateFontSize(val);
        });

        this.updateFontSize(saved);
    },

    updateFontSize(size) {
        window.App.State.lostAndFoundFontSize = size;   // 通过 setter 落盘
        const container = document.getElementById('lostAndFoundList');
        if (container) container.style.setProperty('--laf-font-size', size + 'px');

        const slider = document.getElementById('lostAndFoundFontSizeSlider');
        const valueInput = document.getElementById('lostAndFoundFontSizeValue');
        if (slider) slider.value = size;
        if (valueInput) valueInput.value = size;
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

## 5 `js/features/modal_notification.js`
```js
window.App.ModalNotification = {
    init() {
        this.applySavedFontSize();
        this.bindEvents();
        this.render();
    },

    applySavedFontSize() {
        const content = document.getElementById('notificationContent');
        const slider = document.getElementById('fontSizeSlider');
        const valueInput = document.getElementById('fontSizeValue');
        if (!content) return;

        const saved = (window.App.Store && window.App.Store.getSetting('notificationFontSize')) || 16;
        content.style.fontSize = saved + 'px';
        if (slider) slider.value = saved;
        if (valueInput) valueInput.value = saved;
    },

    adjustTextareaHeight(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = Math.max(100, textarea.scrollHeight) + 'px';
    },

    render() {
        const content = document.getElementById('notificationContent');
        if (!content) return;

        const notifications = window.App.State.notifications || [];
        content.innerHTML = '';

        if (notifications.length === 0) {
            content.innerHTML = '<div class="empty-notification">暂无通知，点击下方按钮添加</div>';
            return;
        }

        const currentFontSize = content.style.fontSize || '16px';

        notifications.forEach((text, index) => {
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
                    const arr = window.App.State.notifications;
                    arr.splice(Number(e.target.dataset.index), 1);
                    window.App.Store.touch('notifications');
                    this.render();
                }
            });

            item.addEventListener('click', e => {
                if (e.target.classList.contains('delete-notification-btn')) return;

                const idx = Number(item.dataset.index);
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
                    window.App.Store.touch('notifications');
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
            window.App.Store.touch('notifications');
            this.render();
            if (content) content.scrollTop = content.scrollHeight;
        });

        if (slider && valueInput && content) {
            slider.addEventListener('input', () => {
                content.style.fontSize = slider.value + 'px';
                valueInput.value = slider.value;
                if (window.App.Store) window.App.Store.setSetting('notificationFontSize', Number(slider.value));
                this.render();
            });

            valueInput.addEventListener('input', () => {
                let val = parseInt(valueInput.value, 10) || 16;
                val = Math.min(120, Math.max(12, val));
                content.style.fontSize = val + 'px';
                slider.value = val;
                if (window.App.Store) window.App.Store.setSetting('notificationFontSize', val);
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

