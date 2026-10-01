## 1 `css/style.css`
```css
:root{
    /* ===== 主题色（由 theme_background.js 动态注入；此处为默认青绿主题回退值） ===== */
    --theme-primary:        #4f9d78;
    --theme-primary-hover:  #458c6b;
    --theme-primary-active: #3b7c5e;
    /* 主色的 RGB 分量（供 rgba() 半透明光晕使用） */
    --theme-primary-rgb:    79, 157, 120;
    --theme-dark:           #20463a;
    --theme-text:           #2f3d37;
    --theme-muted:          #6f827a;
    --theme-bg-start:       #f3faf6;
    --theme-bg-end:         #e6f3ec;
    --theme-surface:        rgba(255,255,255,.9);
    --theme-surface-solid:  #fcfffd;
    --theme-surface-soft:   #eef8f2;
    --theme-surface-hover:  #e0f1e8;
    --theme-border:         #dcebe2;
}

body,html{overflow:hidden;margin:0;padding:0;width:100%;height:100%;font-family:'Microsoft YaHei',sans-serif;background:linear-gradient(to bottom right,var(--theme-bg-start),var(--theme-bg-end))}

@font-face{font-family:'STZhongsong';src:url('../fonts/STZhongsong.ttf') format('truetype');font-weight:400;font-style:normal;font-display:swap}
@font-face{font-family:'STZhongSong';src:url('../fonts/STZhongsong.ttf') format('truetype');font-weight:400;font-style:normal;font-display:swap}
@font-face{font-family:'STKaiti';src:url('../fonts/STKaiti.ttf') format('truetype');font-weight:400;font-style:normal;font-display:swap}
@font-face{font-family:'STXingkai';src:url('../fonts/STXingkai.ttf') format('truetype');font-weight:400;font-style:normal;font-display:swap}

/* ===== 模态框 ===== */
.settings-modal{position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;justify-content:center;align-items:center;opacity:0;visibility:hidden;transition:all .3s;z-index:999}
.settings-modal.active{opacity:1;visibility:visible}
.settings-content{background:var(--theme-surface-solid);width:60%;height:75%;border-radius:12px;transform:scale(.8);opacity:0;transition:all .3s;position:relative;padding:20px;overflow:hidden;display:flex;flex-direction:column}
.settings-modal.active .settings-content{transform:scale(1);opacity:1}
.settings-modal.fullscreen .settings-content{width:100%;height:100%;max-width:none;max-height:none;border-radius:0}
.changelog-modal .settings-content{max-width:600px}
.settings-header{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--theme-border);padding-bottom:10px;margin-bottom:20px}
.settings-header h3{margin:0;font-size:24px;color:var(--theme-text)}
.settings-body{display:flex;flex-direction:column;gap:10px;padding:20px;overflow-y:auto;height:calc(100% - 60px)}
.text-content{padding:15px;white-space:pre-wrap;overflow-y:auto;height:calc(100% - 50px)}

/* ===== 时间预览滑动条 ===== */
.preview-slider-zone{position:absolute;left:50%;bottom:24px;transform:translateX(-50%);width:min(1440px,calc(100% - 60px));padding:14px 26px 12px;background:var(--theme-surface-solid);border-radius:12px;box-shadow:0 6px 28px rgba(0,0,0,.22),0 0 0 1px var(--theme-border);display:none;opacity:0;transition:opacity .25s ease,box-shadow .25s ease;z-index:5;font-family:'Microsoft YaHei',sans-serif}
.settings-modal.active .preview-slider-zone{display:block;opacity:1}
.settings-modal.previewing .preview-slider-zone{z-index:10001;box-shadow:0 12px 48px rgba(0,0,0,.45),0 0 0 2px var(--theme-primary);transition:none}
.settings-modal.previewing .settings-content{opacity:.05;transition:opacity .15s ease;pointer-events:none}
.preview-slider-header{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px;font-size:13px;color:var(--theme-muted)}
.preview-slider-label{white-space:nowrap;font-family:STZhongsong,serif}
.preview-slider-current{flex:1;text-align:center;color:var(--theme-dark);font-weight:600;font-size:15px;font-family:STZhongsong,serif}
.preview-slider{width:100%;height:6px;background:var(--theme-surface-soft);border-radius:3px;-webkit-appearance:none;appearance:none;outline:none;cursor:pointer;margin:0;padding:0;display:block}
.preview-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:22px;height:22px;background:var(--theme-primary);border-radius:50%;cursor:pointer;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.25)}
.preview-slider::-moz-range-thumb{width:22px;height:22px;background:var(--theme-primary);border-radius:50%;cursor:pointer;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.25)}
.preview-slider-hint{margin-top:8px;font-size:11px;color:var(--theme-muted);text-align:center}
@media(max-width:700px){
.preview-slider-zone{width:calc(100% - 24px);padding:12px 16px 10px}
}

/* ===== 按钮 ===== */
.action-button,.settings-button,.add-notification-btn,.reset-btn{background:var(--theme-primary);border:none;cursor:pointer;color:#fff;transition:all .3s}
.action-buttons,.settings-button{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);z-index:10}
.action-buttons{display:flex;gap:15px}
.action-button{padding:0 20px;height:40px;border-radius:20px;box-shadow:0 2px 8px rgba(0,0,0,.2);font-size:14px;display:flex;align-items:center;justify-content:center;white-space:nowrap}
.settings-button{width:40px;height:40px;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,.2);display:flex;align-items:center;justify-content:center;font-size:24px}
.add-notification-btn{padding:8px 15px;border-radius:4px;font-family:STZhongsong,serif;font-size:15px}
.reset-btn{padding:5px 12px;min-width:50px;white-space:nowrap;border-radius:4px;font-size:13px}
.action-button:hover,.add-notification-btn:hover{transform:scale(1.05)}
.settings-button:hover{transform:translateX(-50%) scale(1.1)}
.reset-btn:hover{background:var(--theme-primary-hover);transform:scale(1.05)}
.close-btn,.maximize-btn,.modal-timer-btn{cursor:pointer;padding:0 10px;color:var(--theme-muted);line-height:1;transition:all .2s}
.close-btn{font-size:28px}
.maximize-btn{font-size:24px;position:relative;z-index:100}
.close-btn:hover,.maximize-btn:hover,.modal-timer-btn:hover{color:var(--theme-text)}
.maximize-btn:hover,.modal-timer-btn:hover{transform:scale(1.1)}
.delete-btn,.delete-notification-btn{position:absolute;right:15px;top:50%;transform:translateY(-50%);padding:4px 12px;border-radius:15px;background:#f44;color:#fff;border:none;cursor:pointer;transition:all .3s}
.delete-notification-btn{font-family:STZhongsong,serif;font-size:14px}

/* ===== 节气卡片 ===== */
.solar-card{position:absolute;top:calc(100% + 20px);left:50%;transform:translateX(-50%);width:500px;background:var(--theme-surface);border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,.15);padding:20px;opacity:0;visibility:hidden;transition:all .3s;z-index:10;display:flex;align-items:center;gap:20px}
.solar-card::before{content:'';position:absolute;bottom:100%;left:50%;transform:translateX(-50%);border:10px solid transparent;border-bottom-color:var(--theme-surface)}
.solar-card.active{opacity:1;visibility:visible;transform:translate(-50%,0)}
.solar-card h3{text-align:center;margin:0 0 15px;font-size:24px;color:var(--theme-dark);font-family:STZhongsong,serif}
.solar-card img{width:160px;height:140px;object-fit:cover;border-radius:8px}
.solar-card p{font-size:16px;line-height:1.6;color:var(--theme-text);margin:0;font-family:'Microsoft YaHei';flex-grow:1;text-indent:2em}

/* ===== 时间 / 作息 ===== */
#currentDateTime,.schedule-container{position:absolute;left:25px;z-index:5;background:var(--theme-surface);border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.1)}
#currentDateTime{top:78px;padding:15px 25px;text-align:center;min-width:180px}
.schedule-container{top:225px;padding:15px 20px;min-width:190px}
.time-section{font-family:'Microsoft-Yahei',sans-serif;font-size:44px;color:var(--theme-dark);margin:8px 0;display:block;width:100%}
.date-section{font-family:'Microsoft YaHei',serif;font-size:22px;color:var(--theme-muted);letter-spacing:.5px;white-space:nowrap;display:block;width:100%}
.schedule-item{font-family:'STZhongSong',sans-serif;margin:8px 0}
.schedule-title{display:block;font-size:20px;color:var(--theme-dark);font-weight:600;line-height:.8}
.schedule-value{display:block;font-size:25px;color:var(--theme-text);text-align:center;margin:4px 0 0;padding:2px 0;line-height:.8}
.timetable{margin-top:10px;border-top:1px solid var(--theme-border);padding-top:8px}
.timetable-item{font-size:25px;font-family:STZhongSong,cursive;line-height:1.2;text-align:center}
.timetable-row{display:flex;align-items:center;font-family:STZhongSong,cursive;font-size:24px;line-height:1;padding:2px 0}
.timetable-row-divider{border-bottom:2px dashed var(--theme-border);margin-bottom:6px;padding-bottom:6px}
.timetable-label{width:42%;text-align:right;padding-right:15px;color:var(--theme-primary);font-weight:bold}
.timetable-course{width:58%;text-align:left;padding-left:5px;color:var(--theme-text)}

/* ===== 导航 / 倒计时 ===== */
.navbar{background-color:#333;overflow:hidden;width:100%;box-shadow:0 2px 10px rgba(0,0,0,.2);position:relative;z-index:6}
.brand{float:left;color:#fff;padding:14px 20px;font-size:20px;font-weight:700;text-decoration:none;letter-spacing:1px}
.navbar a{float:left;display:block;color:#f2f2f2;text-align:center;padding:14px 18px;text-decoration:none;font-size:16px;transition:all .3s}
.navbar a:hover{background:#ddd;color:#000}
.small-title{text-align:center;color:var(--theme-text);font-size:38px;font-family:STZhongsong,serif;margin-top:50px;text-shadow:1px 1px 2px rgba(0,0,0,.1)}
.big-title{text-align:center;color:var(--theme-dark);font-size:160px;font-family:STKaiti;margin:20px 0;text-shadow:2px 2px 4px rgba(0,0,0,.1)}
.timeline-container{max-width:750px;margin:50px auto;position:relative;height:120px;overflow:visible}
.timeline-progress{height:8px;background:none;border-radius:4px;position:relative;margin-top:60px}
.timeline-progress::before{content:'';position:absolute;left:0;right:0;top:7px;height:8px;border-radius:4px;background:linear-gradient(to right,var(--theme-primary) 0%,var(--theme-primary) var(--progress-percent),var(--theme-border) var(--progress-percent),var(--theme-border) 100%)}
.solar-term-marker{position:absolute;top:-45px;width:70px;text-align:center;transform:translateX(-50%);cursor:pointer;transition:all .3s;z-index:2}
.current-marker{position:absolute;left:0;top:-10px;width:3px;height:30px;background:#ff5722;transform:translateX(-50%);transition:left .5s ease-out;box-shadow:0 2px 4px rgba(255,87,34,.3)}
.end-marker{position:absolute;right:-15px;top:-45px;width:90px;text-align:center;color:#d32f2f;font-weight:700;text-shadow:0 2px 4px rgba(211,47,47,.2);transform:translateX(30%)}

/* ===== 每日 60s ===== */
.right-image-container{position:absolute;right:50px;top:45%;transform:translateY(-50%);z-index:5;background:var(--theme-surface-solid);padding:10px;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,.1);display:flex}
.right-image-container img{height:800px;object-fit:cover;display:block;border-radius:6px;width:auto}

/* ===== 金句 ===== */
#goldenPhrase{text-align:center;margin:0 auto;width:760px;font-size:26px;color:var(--theme-dark);min-height:40px;font-family:STZhongSong,cursive;text-shadow:1px 1px 2px rgba(0,0,0,.1);transition:opacity .5s,transform .3s;position:relative;top:0;cursor:pointer;z-index:5}
#goldenPhrase:active{transform:scale(.98)}
#goldenPhrase.no-animation{transition:none!important}
#goldenPhrase.no-animation:active{transform:none!important}
#phraseList{padding:15px;overflow-y:auto;height:calc(100% - 50px)}
.phrase-item{padding:12px;margin:8px 0;border-radius:6px;background:var(--theme-surface-soft);cursor:pointer;transition:all .3s ease;font-family:STZhongSong,cursive;color:var(--theme-dark)}
.phrase-item:hover{background:var(--theme-surface-hover);transform:translateX(5px);box-shadow:0 2px 8px rgba(0,0,0,.1)}
.phrase-item:active{transform:scale(.97);background:var(--theme-surface-hover)!important}
.phrase-click-effect{animation:phraseClickWave .4s ease-out;position:relative}
@keyframes phraseClickWave{0%{box-shadow:0 0 0 0 rgba(var(--theme-primary-rgb),.3)}100%{box-shadow:0 0 0 10px rgba(var(--theme-primary-rgb),0)}}

/* ===== 开关 / 滑块 ===== */
input[type="checkbox"]{position:absolute;opacity:0;cursor:pointer;height:0;width:0}
.switch-container{display:flex;flex-direction:column;gap:20px;margin-top:20px}
.switch{position:relative;display:flex;align-items:center;justify-content:space-between;width:100%}
.slider{position:relative;cursor:pointer;width:40px;height:24px;background-color:#ccc;transition:.4s;border-radius:24px}
.switch-text{font-size:14px;color:var(--theme-dark);display:inline-block}
.slider:before{position:absolute;content:"";height:20px;width:20px;left:2px;bottom:2px;background-color:#fff;transition:.4s;border-radius:50%}
input:checked+.slider{background-color:var(--theme-primary)}
input:checked+.slider:before{transform:translateX(16px)}
input:checked~.switch-text{color:var(--theme-primary)}
.probability-control{display:flex;align-items:center;gap:15px;width:100%;margin:12px 0}
.probability-control .switch-text{flex:1;font-size:14px;color:var(--theme-dark)}
.range-group{display:flex;align-items:center;gap:10px;width:40%;justify-content:flex-end}
.font-size-control{display:flex;align-items:center;gap:10px}
.font-size-label{font-size:14px;color:var(--theme-dark);font-family:STZhongsong,serif}
#apiProbability,#intervalSlider,#fontSizeSlider,#lostAndFoundFontSizeSlider{height:4px;background:#ddd;border-radius:2px;-webkit-appearance:none;margin:0 8px}
#apiProbability,#intervalSlider{width:100%}
#fontSizeSlider,#lostAndFoundFontSizeSlider{width:150px}
#apiProbability::-webkit-slider-thumb,#intervalSlider::-webkit-slider-thumb,#fontSizeSlider::-webkit-slider-thumb,#lostAndFoundFontSizeSlider::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;background:var(--theme-primary);border-radius:50%;cursor:pointer;border:none;box-shadow:none}
#apiProbability::-moz-range-thumb,#intervalSlider::-moz-range-thumb,#fontSizeSlider::-moz-range-thumb,#lostAndFoundFontSizeSlider::-moz-range-thumb{width:16px;height:16px;background:var(--theme-primary);border-radius:50%;border:none;cursor:pointer}
#apiProbabilityValue,#intervalValue,#fontSizeValue{width:50px;padding:5px;border:1px solid #ddd;border-radius:4px;text-align:center;font-size:13px;font-family:inherit}

/* ===== 公告 / 通知 ===== */
.announcement-card{background:var(--theme-surface-solid);border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.1);padding:20px;margin:15px;border:1px solid var(--theme-border)}
.announcement-title{font-size:1.6em;color:var(--theme-dark);font-weight:600;margin-bottom:8px;border-bottom:2px solid var(--theme-primary);padding-bottom:5px;text-align:center}
.announcement-time{font-size:.95em;color:var(--theme-muted);margin-bottom:15px;text-align:center}
.announcement-body{line-height:1.2;color:var(--theme-text);font-size:1.2em}
.announcement-body ul{margin:8px 0;padding-left:25px}
.announcement-body li{margin:6px 0}
.announcement-footnote{font-size:.85em;color:var(--theme-muted);margin-top:15px;border-top:1px dashed var(--theme-border);padding-top:10px}
.announcement-content{height:calc(100% - 60px);overflow-y:auto;padding:0 10px}
.announcement-content::-webkit-scrollbar{width:6px}
.announcement-content::-webkit-scrollbar-track{background:var(--theme-surface-soft);border-radius:3px}
.announcement-content::-webkit-scrollbar-thumb{background:var(--theme-border);border-radius:3px}
.announcement-content::-webkit-scrollbar-thumb:hover{background:var(--theme-primary)}
.notification-container{display:flex;flex-direction:column;height:100%;font-family:STZhongsong,serif}
#notificationContent{flex:1;overflow-y:auto;padding:15px;transition:font-size .3s ease;max-height:calc(100% - 70px)}
.notification-item{position:relative;margin-bottom:15px;padding:15px;background:var(--theme-surface-soft);border-radius:8px;cursor:pointer;transition:all .3s;min-height:40px;word-wrap:break-word;overflow-wrap:break-word;font-family:inherit;box-shadow:0 2px 5px rgba(0,0,0,.05)}
.notification-item:hover{background:var(--theme-surface-hover);box-shadow:0 3px 8px rgba(0,0,0,.1)}
.notification-editable{width:100%;min-height:60px;padding:10px;border:2px solid var(--theme-primary);border-radius:4px;font-size:inherit;box-sizing:border-box;font-family:inherit;resize:vertical;line-height:1.5}
.notification-footer{display:flex;justify-content:space-between;align-items:center;padding:15px;border-top:1px solid var(--theme-border);margin-top:10px;position:sticky;bottom:0;background:var(--theme-surface-solid);z-index:10;flex-shrink:0}
.empty-notification{text-align:center;padding:30px;color:var(--theme-muted);font-style:italic}

/* ===== 寻物 ===== */
.editable{cursor:pointer;transition:all .3s;padding:2px 5px;border-radius:4px;font-family:STZhongsong,serif;color:#1e90ff;text-shadow:0 0 2px rgba(0,0,0,.2);border-bottom:2px solid #ffd700}
.editable:hover{background:var(--theme-surface-soft)}
.edit-input{width:120px;padding:5px;border:2px solid var(--theme-primary);border-radius:4px;font-size:28px;text-align:center;color:#1e90ff;margin:0 5px;font-family:STZhongsong,serif}
#lostAndFoundList .announcement-card{padding:12px;margin:8px 10px}
#lostAndFoundList .announcement-body{line-height:1.1}
#lostAndFoundList .editable{margin:1px 0;padding:2px 4px}

/* ===== 添加按钮 ===== */
.add-button{position:fixed;bottom:30px;right:30px;width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,var(--theme-primary),var(--theme-primary-hover));color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.25),0 0 0 2px rgba(255,255,255,.8) inset;transition:all .3s ease;z-index:999;font-size:24px;font-weight:700;animation:button-pulse 2s infinite}
.add-button:hover{transform:scale(1.15);box-shadow:0 6px 16px rgba(0,0,0,.3),0 0 0 2px rgba(255,255,255,.9) inset}
.add-button:active{transform:scale(.85);box-shadow:0 2px 6px rgba(0,0,0,.2),0 0 0 3px rgba(255,255,255,.8) inset;background:linear-gradient(135deg,var(--theme-primary-hover),var(--theme-primary-active))}
@keyframes gradient-pulse{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
/* 加号按钮的呼吸光圈：原来关键帧全是透明色（等于没有动画），这里改成淡淡的主题色光圈 */
@keyframes button-pulse{0%,100%{box-shadow:0 0 0 0 rgba(var(--theme-primary-rgb),0)}70%{box-shadow:0 0 0 10px rgba(var(--theme-primary-rgb),.3)}}

/* ===== 寻物：字号通过 CSS 变量控制，方便整表重渲染 ===== */
#lostAndFoundList{--laf-font-size:28px}
#lostAndFoundList .editable,#lostAndFoundList .static-text{font-size:var(--laf-font-size)!important}

/* ===== 今日课表临时编辑 ===== */
.timetable-editor{margin-top:8px;padding:18px;border:1px solid var(--theme-border);border-radius:8px;background:var(--theme-surface-soft);box-shadow:0 2px 8px rgba(var(--theme-primary-rgb),.06)}
.timetable-editor-header{display:flex;align-items:center;justify-content:space-between;gap:15px;margin-bottom:6px}
.timetable-editor-title{margin:0;color:var(--theme-dark);font-size:19px;font-family:STZhongsong,serif;font-weight:600}
.timetable-editor-meta{color:var(--theme-muted);font-size:13px;white-space:nowrap}
.timetable-editor-note{margin:0 0 15px;color:var(--theme-muted);font-size:13px;line-height:1.6}
.timetable-editor-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px 14px;max-height:310px;overflow-y:auto;padding:2px}
.timetable-editor-grid::-webkit-scrollbar{width:6px}
.timetable-editor-grid::-webkit-scrollbar-track{background:var(--theme-surface-soft);border-radius:3px}
.timetable-editor-grid::-webkit-scrollbar-thumb{background:var(--theme-border);border-radius:3px}
.timetable-editor-grid::-webkit-scrollbar-thumb:hover{background:var(--theme-primary)}
.timetable-editor-row{display:flex;align-items:center;gap:9px;min-width:0}
.timetable-editor-label{flex:0 0 42px;color:var(--theme-primary);font-size:14px;font-weight:700;text-align:right}
.timetable-course-input{flex:1;min-width:0;height:34px;box-sizing:border-box;padding:5px 9px;border:1px solid var(--theme-border);border-radius:5px;outline:none;color:var(--theme-text);background:var(--theme-surface-solid);font-family:'Microsoft YaHei',sans-serif;font-size:14px;transition:border-color .2s,box-shadow .2s}
.timetable-course-input:focus{border-color:var(--theme-primary);box-shadow:0 0 0 3px rgba(var(--theme-primary-rgb),.15)}
.timetable-editor-actions{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:16px;padding-top:14px;border-top:1px solid var(--theme-border)}
.timetable-editor-buttons{display:flex;align-items:center;gap:9px}
.timetable-save-btn,.timetable-reset-btn{border:none;border-radius:5px;padding:8px 14px;cursor:pointer;font-size:13px;transition:all .2s}
.timetable-save-btn{background:var(--theme-primary);color:#fff;box-shadow:0 2px 5px rgba(var(--theme-primary-rgb),.25)}
.timetable-save-btn:hover{background:var(--theme-primary-hover);transform:translateY(-1px)}
.timetable-reset-btn{background:var(--theme-surface-soft);color:var(--theme-muted);border:1px solid var(--theme-border)}
.timetable-reset-btn:hover{background:var(--theme-surface-hover);color:var(--theme-dark)}
.timetable-save-btn:disabled,.timetable-reset-btn:disabled{cursor:not-allowed;opacity:.5;transform:none}
.timetable-editor-status{min-height:18px;color:var(--theme-muted);font-size:12px;text-align:right}
@media(max-width:700px){
.timetable-editor-header,.timetable-editor-actions{align-items:flex-start;flex-direction:column}
.timetable-editor-meta,.timetable-editor-status{text-align:left;white-space:normal}
.timetable-editor-grid{grid-template-columns:1fr}
}

/* ===== 虚拟时间 ===== */
.time-offset-panel{margin-top:8px;padding:18px;border:1px solid var(--theme-border);border-radius:8px;background:var(--theme-surface-soft);box-shadow:0 2px 8px rgba(var(--theme-primary-rgb),.06)}
.time-offset-header{display:flex;align-items:center;justify-content:space-between;gap:15px;margin-bottom:6px}
.time-offset-title{margin:0;color:var(--theme-dark);font-size:19px;font-family:STZhongsong,serif;font-weight:600}
.time-offset-meta{color:var(--theme-muted);font-size:13px;white-space:nowrap}
.time-offset-note{margin:0 0 15px;color:var(--theme-muted);font-size:13px;line-height:1.6}
.time-offset-actions{display:flex;align-items:center;gap:9px;flex-wrap:wrap}
.virtual-time-input{flex:1;min-width:220px;height:34px;box-sizing:border-box;padding:5px 9px;border:1px solid var(--theme-border);border-radius:5px;outline:none;color:var(--theme-text);background:var(--theme-surface-solid);font-family:'Microsoft YaHei',sans-serif;font-size:14px;transition:border-color .2s,box-shadow .2s}
.virtual-time-input:focus{border-color:var(--theme-primary);box-shadow:0 0 0 3px rgba(var(--theme-primary-rgb),.15)}
.time-offset-hint{min-height:18px;color:var(--theme-muted);font-size:12px;margin-top:8px}
@media(max-width:700px){
.time-offset-header{align-items:flex-start;flex-direction:column}
.time-offset-meta{text-align:left;white-space:normal}
}

/* ===== 模态框定时关闭 ===== */
.modal-timer{position:relative;display:inline-flex;align-items:center;margin-right:0;font-family:'Microsoft YaHei',sans-serif;flex-shrink:0;z-index:201}
.modal-timer-btn{display:inline-flex;align-items:center;justify-content:center;min-width:36px;height:36px;background:transparent;border:none;border-radius:4px;font:inherit;font-size:20px;font-variant-numeric:tabular-nums;line-height:1;white-space:nowrap}
.modal-timer-btn:focus-visible{outline:2px solid var(--theme-primary);outline-offset:2px}
.modal-timer.counting .modal-timer-btn{color:var(--theme-dark);font-weight:600}
.modal-timer-panel{position:absolute;top:calc(100% + 8px);right:0;width:220px;padding:12px;background:var(--theme-surface-solid);border:1px solid var(--theme-border);border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,.12);opacity:0;visibility:hidden;transform:translateY(-6px);transition:all .2s ease;z-index:200}
.modal-timer.open .modal-timer-panel{opacity:1;visibility:visible;transform:translateY(0)}
.modal-timer-presets{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:10px}
.modal-timer-presets button{padding:6px 0;font-size:13px;background:var(--theme-surface-soft);color:var(--theme-muted);border:1px solid var(--theme-border);border-radius:6px;cursor:pointer;transition:all .15s;font-family:inherit}
.modal-timer-presets button:hover{background:var(--theme-surface-hover);color:var(--theme-dark);border-color:var(--theme-primary)}
.modal-timer-custom{display:flex;align-items:center;gap:6px}
.modal-timer-custom input{flex:1;min-width:0;height:30px;box-sizing:border-box;padding:0 8px;border:1px solid var(--theme-border);border-radius:6px;font-size:13px;color:var(--theme-text);text-align:center;outline:none;transition:border-color .2s,box-shadow .2s;font-family:inherit;-moz-appearance:textfield}
.modal-timer-custom input::-webkit-outer-spin-button,.modal-timer-custom input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}
.modal-timer-custom input:focus{border-color:var(--theme-primary);box-shadow:0 0 0 3px rgba(var(--theme-primary-rgb),.15)}
.modal-timer-custom span{font-size:12px;color:var(--theme-muted)}
.modal-timer-custom button{height:30px;padding:0 12px;font-size:13px;background:var(--theme-primary);color:#fff;border:none;border-radius:6px;cursor:pointer;transition:all .15s;font-family:inherit}
.modal-timer-custom button:hover{background:var(--theme-primary-hover)}
.modal-timer-hint{margin-top:8px;font-size:11px;color:var(--theme-muted);text-align:center}
.settings-header-actions{display:flex;align-items:center}


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

    <div id="pageContent" style="display:none;">
        <header>
            <nav class="navbar">
                <div class="brand">杨村一中&nbsp;高二（22）班</div>
            </nav>
        </header>

        <div id="currentDateTime">
            <div class="time-section"></div>
            <div class="date-section"></div>
        </div>

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
                <span class="schedule-value" id="countdownTimer" style="font-size:28px;">--:--</span>
            </div>
            <div class="timetable" id="todayTimetable"></div>
        </div>

        <div class="small-title">距离2028年高考仅剩</div>
        <div id="daysUntil" class="big-title"></div>

        <div class="timeline-container">
            <div class="timeline-progress" id="timeline">
                <div class="end-marker">
                    <div id="timelineEndTitle" style="white-space:nowrap;">高考日</div>
                    <div id="timelineEndDate" style="font-size:.9em;margin-top:3px">6月7日</div>
                </div>
            </div>
        </div>

        <div id="goldenPhrase"></div>

        <div class="right-image-container">
            <img id="apiImage" src="" alt="每日60s">
        </div>

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
                    <!-- 虚拟时间 -->
                    <section class="time-offset-panel" id="virtualTimePanel">
                        <div class="time-offset-header">
                            <h4 class="time-offset-title">虚拟时间</h4>
                            <span class="time-offset-meta" id="timeOffsetStatus">当前跟随系统时间</span>
                        </div>

                        <p class="time-offset-note">
                            设置后，网站的所有时间判断（时钟、高考倒计时、作息、课表、节气）都会按此时间计算。设置会被保存，点击"恢复系统时间"即可关闭。
                        </p>

                        <div class="time-offset-actions">
                            <input
                                type="datetime-local"
                                id="virtualTimeInput"
                                class="virtual-time-input"
                                step="1"
                            >
                            <button type="button" class="timetable-save-btn" id="applyVirtualTime">
                                应用
                            </button>
                            <button type="button" class="timetable-reset-btn" id="resetVirtualTime">
                                恢复系统时间
                            </button>
                        </div>

                        <div class="time-offset-hint" id="timeOffsetHint"></div>
                    </section>

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
                                <input type="range" id="intervalSlider" min="1" max="600" value="15">
                                <input type="number" id="intervalValue" min="1" max="600" value="15">
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

                    <!-- 今日课表临时编辑 -->
                    <section class="timetable-editor" id="temporaryTimetablePanel">
                        <div class="timetable-editor-header">
                            <h4 class="timetable-editor-title">今日课表临时编辑</h4>
                            <span class="timetable-editor-meta" id="temporaryTimetableDate">加载中...</span>
                        </div>

                        <p class="timetable-editor-note">
                            修改只在今天生效，第二天会自动恢复原始课表。
                        </p>

                        <div class="timetable-editor-grid" id="temporaryTimetableEditor"></div>

                        <div class="timetable-editor-actions">
                            <div class="timetable-editor-buttons">
                                <button type="button" class="timetable-save-btn" id="saveTemporaryTimetable">
                                    保存今日课表
                                </button>
                                <button type="button" class="timetable-reset-btn" id="resetTemporaryTimetable">
                                    恢复原始课表
                                </button>
                            </div>
                            <span class="timetable-editor-status" id="temporaryTimetableStatus"></span>
                        </div>
                    </section>
                </div>
            </div>

            <!-- 时间预览滑动条（拖动时会浮到最上层） -->
            <div class="preview-slider-zone" id="previewSliderZone">
                <div class="preview-slider-header">
                    <span class="preview-slider-label" id="previewSliderLabelStart">--</span>
                    <span class="preview-slider-current" id="previewSliderCurrent">--</span>
                    <span class="preview-slider-label" id="previewSliderLabelEnd">--</span>
                </div>
                <input type="range" class="preview-slider" id="previewSlider" min="0" max="365" value="0" step="1">
                <div class="preview-slider-hint">左右拖动预览不同日期的网站效果，松开鼠标保存</div>
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

                    2026.10.1
                    1. 重新设计全部 24 节气的配色，改为贴合四季氛围的多色方案；
                    2. 新增"主题跟随节气"功能：背景、按钮、标题、边框等整站 UI 的颜色会随日期在一年中缓缓变化；
                    3. 新增虚拟时间功能，可在设置中修改网站显示的日期和时间（时钟、倒计时、作息、课表、节气均按此计算）；
                    4. 新增时间预览滑动条：拖动即可实时预览一年内不同日期的网站效果，拖动时轻量刷新（文本、颜色、进度），松手后完整刷新（节气标记、课表结构），避免长时间拖动卡顿；

                    2026.9.27
                    1. 修复金句不正常更新的 bug，优化金句轮播逻辑；
                    2. 将通知、寻物的字号最大值改为 240px，金句轮播时间间隔最大值改为 600s；
                    3. 新增模态框定时关闭功能；
                    4. 修复时间轴没有小寒、大寒的 bug，以及时间轴与节气标记竖直位置不对齐的 bug；

                    2026.9.26
                    1. 修复天气无法获取的 bug；
                    2. 更新课表与作息表；
                    3. 实现数据本地存储，新增运行在本地的 LocalDataServer.exe 用于启动本地 http 服务以实现网页直接读写本地磁盘；
                    4. 大幅精简现有代码，长度缩小 40%，提升运行效率；
                    5. 修复每次打开网页默认显示每日 60s 的 bug；
                    6. 修复周六课表无课时“下节课”不显示“无”的 bug；
                    7. 新增课表临时修改功能；
                </div>
            </div>
        </div>

        <!-- 公告板模态框 -->
        <div class="settings-modal" id="announcementModal">
            <div class="settings-content">
                <div class="settings-header" style="padding-bottom:8px;">
                    <h3 style="font-size:1.2em;">公告</h3>
                    <div style="display:flex;align-items:center;">
                        <span class="maximize-btn" id="maximizeAnnouncement">⛶</span>
                        <span class="close-btn" id="closeAnnouncement">&times;</span>
                    </div>
                </div>

                <div class="announcement-content">
                    <div class="announcement-card">
                        <div class="announcement-title">📢 倒计时网站征稿活动</div>
                        <div class="announcement-time">2026.9.26</div>
                        <div class="announcement-body">
                            22 班电子班牌底部金句轮播内容开始征稿了！投稿的作品可以放在网站上轮播展示。
                            <ul>
                                <li><strong>参与条件：</strong>拥有一个鼻子两只眼睛一个嘴巴</li>
                                <li><strong>时间：</strong>即日起至野生狗奶过期</li>
                                <li><strong>征稿内容：</strong>包括但不限于<strong>励志文字</strong>、<strong>优美作文素材</strong>、<strong>诗歌（含现代诗）</strong>或<strong>整活</strong>等，既可以原创，也可以投现有的，但是要<strong>标明出处</strong>，若是原创句子可选择展示时是否显示署名
                                <li><strong>展示概率：</strong>励志文字 ≈ 优美作文素材 ≈ 诗歌 > 整活，可根据具体情况调整，特别地，若原创句子写的<strong>过于精妙</strong>，可以<strong>提高展示概率</strong>）</li>
                                <li><strong>字数要求：</strong>1~80字（包含标点）</li>
                                <li><strong>提交方式：</strong>找 tqc</li>
                            </ul>
                            <p class="announcement-footnote">只要句子不是违规内容一般来者不拒，最终解释权归 tqc 所有</p>
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
                    <div style="display:flex;align-items:center;">
                        <span class="maximize-btn" id="maximizeLostAndFound">⛶</span>
                        <span class="close-btn" id="closeLostAndFound">&times;</span>
                    </div>
                </div>

                <div class="notification-container" style="display:flex;flex-direction:column;height:100%;">
                    <div class="big-title" style="
                        background:linear-gradient(135deg,#FF0000 0%,#FF6B00 25%,#FFD700 50%,#FF6B00 75%,#FF0000 100%);
                        -webkit-background-clip:text;
                        background-clip:text;
                        -webkit-text-fill-color:transparent;
                        background-size:200% 200%;
                        animation:gradient-pulse 4s ease infinite;
                        text-shadow:2px 2px 4px rgba(0,0,0,.3),0 0 10px rgba(255,107,0,.5);
                        font-size:120px;
                        font-family:STXingkai,cursive;
                        letter-spacing:4px;
                        width:100%;
                        text-align:center;
                        margin:-8px 0 0;
                        padding:0;
                        line-height:1.2;
                    ">寻物</div>

                    <div style="position:relative;flex:1;overflow:hidden;">
                        <div class="announcement-content" id="lostAndFoundList" style="
                            height:100%;overflow-y:auto;padding:10px;"></div>
                        <div class="add-button" id="addLostFoundBtn">+</div>
                    </div>

                    <div class="notification-footer" style="
                        position:sticky;
                        bottom:0;
                        background:white;
                        z-index:10;
                        padding:10px 15px;
                        border-top:1px solid #eee;">
                        <div class="font-size-control">
                            <span class="font-size-label">字体大小:</span>
                            <input type="range" id="lostAndFoundFontSizeSlider" min="12" max="240" value="28">
                            <input type="number" id="lostAndFoundFontSizeValue" min="12" max="240" value="28">
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
                    <div style="display:flex;align-items:center;">
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
                            <input type="range" id="fontSizeSlider" min="12" max="240" value="16">
                            <input type="number" id="fontSizeValue" min="12" max="240" value="16">
                            <span>px</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="js/data/solarterms.js"></script>
    <script src="js/data/timetable.js"></script>
    <script src="js/data/schedule.js"></script>
    <script src="js/data/phrases.js"></script>

    <script src="js/features/00_state.js"></script>
    <script src="js/features/01_utils.js"></script>
    <script src="js/features/store.js"></script>

    <script src="js/features/clock.js"></script>
    <script src="js/features/weather.js"></script>
    <script src="js/features/daily_image.js"></script>
    <script src="js/features/timeline.js"></script>
    <script src="js/features/exam_countdown.js"></script>
    <script src="js/features/school_schedule.js"></script>
    <script src="js/features/golden_phrase.js"></script>
    <script src="js/features/auto_refresh.js"></script>
    <script src="js/features/theme_background.js"></script>

    <script src="js/features/modal_core.js"></script>
    <script src="js/features/modal_settings.js"></script>
    <script src="js/features/modal_timetable.js"></script>
    <script src="js/features/modal_lost_found.js"></script>
    <script src="js/features/modal_notification.js"></script>
    <script src="js/features/modal_phrase.js"></script>
    <script src="js/features/modal_timer.js"></script>

    <script>
        (function () {
            const targetWidth = 1920;

            function resize() {
                const currentWidth =
                    document.documentElement.clientWidth ||
                    document.body.clientWidth;

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
// 二十四节气「年度色带」：这 24 个颜色会被 js/features/theme_background.js 取来，
// 在 OKLCH 空间做平滑插值，生成整站的主题色（背景、按钮、标题、边框……）。
//
// 设计原则：
//   1. 相邻节气的色相尽量接近，全年沿一条平滑色带流动：
//      早春柳芽绿 → 春青绿 → 初夏黄绿 → 盛夏金橙 → 秋琥珀棕
//      → 入冬经低饱和灰紫 → 冰蓝 → 冻青 → 回到柳芽绿；
//   2. 饱和度（鲜艳度）也参与过渡：春夏明快、秋冬素雅；
//   3. 想微调某个时段的观感，只改它前后一两个色值即可，中间会自动缓慢过渡。
const solarTerms = [
{
name: '立春',
month: 1,
day: 3,
color: '#a9c98b', // 柳芽黄绿
image: 'images/立春.png',
desc: '立春是二十四节气之首，标志着冬天的结束和春天的开始。此时气温开始回暖，万物复苏，东风送暖，柳树发芽，梅花绽放。古代有迎春仪式和咬春习俗，人们祈求新年吉祥如意。'
},
{
name: '雨水',
month: 1,
day: 18,
color: '#96c482', // 新草青
image: 'images/雨水.png',
desc: '雨水节气正值仲春之初，气温继续回升，降水增多，冰雪融化。这个时节适宜春耕备耕，农民开始忙碌农事。古人有"獭祭鱼"、"鸿雁来"等物候现象观察记载。'
},
{
name: '惊蛰',
month: 2,
day: 5,
color: '#82bd85', // 春草绿
image: 'images/惊蛰.png',
desc: '惊蛰时节春雷始鸣，蛰伏的昆虫被惊醒而出。此时桃花盛开，杏花怒放，田间地头一片繁忙景象。古有"桃始华"、"仓庚鸣"的物候特征。'
},
{
name: '春分',
month: 2,
day: 20,
color: '#74b98e', // 春分青绿
image: 'images/春分.png',
desc: '春分日昼夜平分，标志着春季中期。此时莺飞草长，小麦拔节孕穗，农事活动进入繁忙阶段。民间有竖蛋游戏和祭日习俗。'
},
{
name: '清明',
month: 3,
day: 4,
color: '#7ab697', // 碧玉青
image: 'images/清明.png',
desc: '清明时节气温升高，春雨绵绵滋润大地。这是扫墓祭祖的重要日子，也是踏青赏花的好时机。古代有蹴鞠、荡秋千等娱乐活动。'
},
{
name: '谷雨',
month: 3,
day: 20,
color: '#86ba87', // 雨润新绿
image: 'images/谷雨.png',
desc: '谷雨是春季最后一个节气，降雨量增加利于谷物生长。此时牡丹盛开，茶树抽新芽，农忙季节全面到来。有"萍始生"、"鸣鸠拂其羽"等物候现象。'
},
{
name: '立夏',
month: 4,
day: 5,
color: '#9cc484', // 初夏新叶
image: 'images/立夏.png',
desc: '立夏标志着夏季的开始，气温显著上升。此时蝼蝈鸣叫，蚯蚓出地面，王瓜开始生长。古代有"迎夏"仪式和尝新活动。'
},
{
name: '小满',
month: 4,
day: 21,
color: '#b6c25f', // 麦浪黄绿
image: 'images/小满.png',
desc: '小满时节麦类作物籽粒开始饱满但未成熟。此时蚕结茧，菜子成熟可以收割。农谚有"小满小满，麦粒渐满"的说法。'
},
{
name: '芒种',
month: 5,
day: 5,
color: '#ccb75a', // 麦熟金
image: 'images/芒种.png',
desc: '芒种是农忙时节，北方麦收南方插秧。此时梅子成熟，天气潮湿闷热。农谚说"芒种忙忙种"，抓紧时间播种作物。'
},
{
name: '夏至',
month: 5,
day: 21,
color: '#dcac52', // 盛夏金橙
image: '夏至.png',
desc: '夏至日北半球白昼最长，标志着盛夏到来。此时蝉鸣阵阵，荷花盛开，农作物生长旺盛。古人有祭天仪式和消夏活动。'
},
{
name: '小暑',
month: 6,
day: 7,
color: '#df9a4e', // 骄阳橙
image: '小暑.png',
desc: '小暑时节天气逐渐炎热，雷雨增多。此时蟋蟀开始在墙角鸣叫，鹰隼捕食更加频繁。农谚有"小暑大暑，灌死老鼠"的说法。'
},
{
name: '大暑',
month: 6,
day: 22,
color: '#dd8747', // 炎夏深橙
image: '大暑.png',
desc: '大暑是一年中最热的时节，高温酷暑考验着万物生长。此时荷花盛开至极，雷阵雨频繁出现。古人有饮伏茶、晒伏姜的习俗。'
},
{
name: '立秋',
month: 7,
day: 7,
color: '#d68a5a', // 初秋暖橙
image: '立秋.png',
desc: '立秋标志着秋天的开始，气温由热转凉。此时早晚温差加大，稻谷抽穗扬花。古人有"贴秋膘"、"啃秋"等习俗。'
},
{
name: '处暑',
month: 7,
day: 23,
color: '#ca8460', // 暑退陶土
image: '处暑.png',
desc: '处暑时节暑气消退，秋意渐浓。此时农作物进入成熟期，农民开始收割。古代有"祭蜡"和"迎秋"仪式。'
},
{
name: '白露',
month: 8,
day: 7,
color: '#c1846a', // 秋赭
image: '白露.png',
desc: '白露时节天气转凉，清晨露水凝结成霜。此时鸿雁南飞，菊花开放。农谚有"白露白茫茫，无谷满粮仓"的说法。'
},
{
name: '秋分',
month: 8,
day: 23,
color: '#c48c6a', // 秋分琥珀
image: '秋分.png',
desc: '秋分日昼夜平分，标志着秋季中期。此时秋高气爽，桂花飘香。古代有"竖蛋"和"送秋牛"的习俗。'
},
{
name: '寒露',
month: 9,
day: 8,
color: '#b98b6b', // 寒露棕
image: '寒露.png',
desc: '寒露时节气温降低，露水寒冷凝结。此时菊花盛开至极，农事进入抢收阶段。古人有赏菊和饮菊花酒的习俗。'
},
{
name: '霜降',
month: 9,
day: 23,
color: '#ad8668', // 霜叶褐
image: '霜降.png',
desc: '霜降是秋季最后一个节气，天气渐冷初霜出现。此时柿子成熟红透，枫叶变红。农谚有"霜降见霜，米谷满仓"的说法。'
},
{
name: '立冬',
month: 10,
day: 7,
color: '#a08a78', // 初冬灰棕
image: '立冬.png',
desc: '立冬标志着冬季的开始，气温明显下降。此时水始冰地始冻，农民开始准备越冬作物。古代有"贺冬"和"补冬"的习俗。'
},
{
name: '小雪',
month: 10,
day: 22,
color: '#b3aab8', // 雪前灰紫
image: '小雪.png',
desc: '小雪时节天气寒冷降雪开始。此时阴气下降阳气上升，农事进入冬闲时期。古人有腌制腊肉和观赏雪景的习俗。'
},
{
name: '大雪',
month: 11,
day: 7,
color: '#b3c1d6', // 落雪苍青
image: '大雪.png',
desc: '大雪时节降雪量增加天气更加寒冷。此时鹖鸟不鸣虎始交，农事基本结束进入农闲。古人有赏雪和制作腊肉的习俗。'
},
{
name: '冬至',
month: 11,
day: 21,
color: '#9db9d9', // 冬至冰蓝
image: '冬至.png',
desc: '冬至日北半球白昼最短标志着寒冬到来。此时蚯蚓结麋角解水泉动，古代有"冬至大如年"的说法和祭祀活动。'
},
{
name: '小寒',
month: 12,
day: 6,
color: '#aec8d2', // 小寒霜青
image: '小寒.png',
desc: '小寒时节天气寒冷但未达极点。此时雁北乡鹊始巢雉雊鸲，农事基本停止进入农闲。古人有"数九消寒"的习俗。'
},
{
name: '大寒',
month: 12,
day: 20,
color: '#abc6bd', // 大寒冻青
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
    // 轻量刷新的时间节流（毫秒）：拖动时最多每 80ms 执行一次
    _refreshThrottle: 80,
    _lastRefresh: 0,
    _pendingRefreshTimer: null,

    timeToMinutes(time) {
        if (time instanceof Date) return time.getHours() * 60 + time.getMinutes();
        if (time === '23:59') return 1439;
        const [h, m] = time.split(':').map(Number);
        return h * 60 + m;
    },

    // 返回当前"业务时间"：真实时间 + 用户设置的偏移量
    // 所有需要"当前日期/时间"的业务逻辑都应当使用此方法，
    // 而不是直接 new Date()，这样才能支持设置里改时间
    now() {
        const offset = this.getTimeOffset();
        return new Date(Date.now() + offset);
    },

    getTimeOffset() {
        if (!window.App.Store) return 0;
        const v = window.App.Store.getSetting('timeOffset');
        const n = Number(v);
        return Number.isFinite(n) ? n : 0;
    },

    // options.persist === false 时只改内存，不触发写盘（预览滑动时用）
    setTimeOffset(ms, options) {
        if (!window.App.Store) return;
        const n = Number(ms);
        const value = Number.isFinite(n) ? n : 0;
        window.App.Store.setSetting('timeOffset', value, options || {});
    },

    // ============================================================
    // 时间预览相关：拖动时实时刷新（轻量）
    // - 只做"文本/颜色/进度"级别的更新，不重建 DOM 结构
    // - 带时间节流，保证高频拖动时不会卡死
    // - 节流窗口内的最后一次调用会被补执行，避免漏掉终点值
    // ============================================================
    refreshAll() {
        const now = performance.now();
        const elapsed = now - this._lastRefresh;

        if (elapsed >= this._refreshThrottle) {
            this._lastRefresh = now;
            this._runLightRefresh();
            return;
        }

        // 节流窗口内：安排一次尾部执行
        if (this._pendingRefreshTimer) return;

        this._pendingRefreshTimer = setTimeout(() => {
            this._pendingRefreshTimer = null;
            this._lastRefresh = performance.now();
            this._runLightRefresh();
        }, this._refreshThrottle - elapsed);
    },

    // ============================================================
    // 松手时调用：一次性做完整刷新（轻量 + 重量）
    // - 会先清掉挂起的节流定时器，避免重复
    // - 包含 A 档全部 + B 档（节气标记重建、课表 HTML 重建、编辑器重建）
    // ============================================================
    refreshAllFull() {
        if (this._pendingRefreshTimer) {
            clearTimeout(this._pendingRefreshTimer);
            this._pendingRefreshTimer = null;
        }

        this._lastRefresh = performance.now();

        const safe = fn => {
            try { fn(); }
            catch (e) { console.warn('[refreshAllFull]', e); }
        };

        // A 档：与轻量刷新一致
        safe(() => window.App.ExamCountdown?.update?.());
        safe(() => window.App.SchoolSchedule?.updateDisplay?.());   // 默认含 renderTimetable
        safe(() => window.App.SchoolSchedule?.updateCountdownDisplay?.());
        safe(() => window.App.Timeline?.updateColor?.());
        safe(() => window.App.ThemeBackground?.update?.());

        // B 档：重量级 DOM 重建
        // 节气标记必须重建：isPast = termDate < now 依赖"当前业务时间"，
        // 拖动到不同日期后，哪些节气算"已过去"会变，颜色也要跟着变
        safe(() => window.App.Timeline?.generateMarkers?.());
        safe(() => window.App.ModalTimetable?.render?.());
    },

    // ---------- 内部：A 档轻量刷新 ----------
    _runLightRefresh() {
        const safe = fn => {
            try { fn(); }
            catch (e) { console.warn('[refreshAll]', e); }
        };

        // 1. 高考倒计时天数
        safe(() => window.App.ExamCountdown?.update?.());

        // 2 & 4. 当前/下节课文字 + 作息倒计时秒数
        //        传 renderTimetable:false 跳过课表 HTML 重建（B 档）
        safe(() => window.App.SchoolSchedule?.updateDisplay?.({ renderTimetable: false }));
        safe(() => window.App.SchoolSchedule?.updateCountdownDisplay?.());

        // 6. 时间轴进度条
        safe(() => window.App.Timeline?.updateColor?.());

        // 7. 主题色相 + 背景色
        safe(() => window.App.ThemeBackground?.update?.());

        // 注意：不调用 Timeline.generateMarkers()
        // 它涉及 24 个标记 + 24 张卡片 + 24 个 <img> 的 DOM 重建，
        // 放在滑动链里会严重拖慢拖动；改成松手后一次重建（见 refreshAllFull）。
        // 更不调用 ModalTimetable.render()，那也是 B 档。
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
            const d = window.App.Utils.now();
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
    // 判断当前"显示每日60s"是否开启（以 Store 为准，不再依赖 DOM）
    isEnabled() {
        if (window.App.Store) {
            // 注意：未显式设置时默认开启
            return window.App.Store.getSetting('imageSwitch') !== false;
        }
        const el = document.getElementById('imageSwitch');
        return el ? el.checked : true;
    },

    init() {
        const container = document.querySelector('.right-image-container');
        const img = document.getElementById('apiImage');

        // 先停掉旧的定时器，避免关闭后还在后台刷新
        if (window.App.Timers.image) {
            clearInterval(window.App.Timers.image);
            window.App.Timers.image = null;
        }

        // 若关闭：隐藏容器，并且不发起任何请求
        if (!this.isEnabled()) {
            if (container) container.style.display = 'none';
            if (img) img.style.display = 'none';
            return;
        }

        // 开启：立即加载并每 24 小时刷新
        if (img) img.style.display = 'block';
        this.updateImage();
        window.App.Timers.image = setInterval(() => {
            // 兜底：若期间被关闭，则不再刷新
            if (!this.isEnabled()) return;
            this.updateImage();
        }, 86400000);
    },

    updateImage() {
        if (!this.isEnabled()) return;

        const img = document.getElementById('apiImage');
        const container = document.querySelector('.right-image-container');
        if (!img || !container) return;

        container.style.display = 'flex';
        img.style.display = 'block';
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
    _timer: null,

    init() {
        this.update();
    },

    update() {
        // 先清掉旧定时器，避免拖动预览时反复叠加
        if (this._timer) {
            clearTimeout(this._timer);
            this._timer = null;
        }

        const now = window.App.Utils.now();
        const target = new Date(2028, 5, 7);
        const diff = target - now;
        const days = Math.max(0, Math.ceil(diff / 86400000));

        const el = document.getElementById('daysUntil');
        if (el) el.textContent = `${days}天`;

        // 下一个"业务时间"的午夜
        const nextMidnight = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() + 1
        );

        this._timer = setTimeout(() => this.update(), nextMidnight - now);
    }
};

```

## 13 `js/features/golden_phrase.js`
```js
window.App.GoldenPhrase = {
    // 当前正在显示的金句
    currentPhrase: null,

    // 已获取、等待显示的下一条金句
    pendingPhrase: null,

    // 正在进行的预取请求的 controller
    prefetchController: null,

    // 轮播周期定时器
    cycleTimer: null,

    // 显示动画定时器（防止动画 setTimeout 叠加导致旧内容覆盖新内容）
    _animationTimer: null,

    // 联网金句 API 配置
    apiConfigs: [
        {
            url: 'https://zj.v.api.aa1.cn/api/wenan-shici/?type=json',
            method: 'GET',
            weight: 15,
            handler(data) {
                const t = data.msg || '';
                return t.length <= 100 ? t : null;
            }
        },
        {
            url: 'https://api.songzixian.com/api/daily-poem?dataSource=LOCAL_DAILY_POEM',
            method: 'GET',
            weight: 15,
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
            handler(data) {
                const t = data.msg || '';
                return t.length <= 100 ? t : null;
            }
        },
        {
            url: 'https://zj.v.api.aa1.cn/api/wenan-mj/?type=json',
            method: 'GET',
            weight: 30,
            handler(data) {
                const t = data.msg || '';
                return t.length <= 100 ? t : null;
            }
        },
        {
            url: 'https://api.mu-jie.cc/stray-birds/range?type=json',
            method: 'GET',
            weight: 20,
            handler(data) {
                const cnLength = data.cn?.length || 0;
                const enLength = data.en?.length || 0;
                if (cnLength > 100) return null;
                if (enLength * 0.5 + cnLength <= 100) {
                    return `${data.en}（${data.cn}）——泰戈尔`;
                }
                return `${data.cn}——泰戈尔`;
            }
        }
    ],

    // ==================== 生命周期 ====================

    init() {
        // 首次进入：立即显示一条本地金句，避免空白
        if (!this.currentPhrase) {
            this.displayNext(this.pickLocalPhrase());
        }

        // 开始第一个轮播周期（内部会立刻发起预取）
        this.scheduleNextCycle();

        // 绑定点击刷新
        this.bindClickRefresh();
    },

    // ==================== 兼容旧接口 ====================

    // modal_settings.js 在 goldenSwitch 打开 / interval 变化时调用
    startTimer() {
        this.scheduleNextCycle();
    },

    // modal_settings.js 在 goldenSwitch 关闭时调用
    stopTimer() {
        this.stopCycle();
        this.cancelPrefetch();
    },

    // 兼容旧代码里可能出现的 fetch() 调用（等同于点击刷新）
    fetch() {
        this.refreshNow();
    },

    // 兼容旧接口：直接显示一条本地金句
    showLocal() {
        this.displayNext(this.pickLocalPhrase());
    },

    // ==================== 轮播周期 ====================

    scheduleNextCycle() {
        this.stopCycle();

        const interval = Number(window.App.State?.intervalDuration) || 15000;

        // 关键：立即启动预取，用整个间隔时间等待联网结果
        this.prefetch();

        // 时间到点后切换
        this.cycleTimer = setTimeout(() => this.onCycleEnd(), interval);
    },

    stopCycle() {
        if (this.cycleTimer) {
            clearTimeout(this.cycleTimer);
            this.cycleTimer = null;
        }
    },

    // 一个轮播周期结束：切换到下一条
    onCycleEnd() {
        let next;

        if (this.pendingPhrase) {
            // 预取已完成，直接用
            next = this.pendingPhrase;
            this.pendingPhrase = null;
        } else {
            // 时间到还没拿到联网结果：放弃本次预取，回退到本地
            this.cancelPrefetch();
            next = this.pickLocalPhrase();
        }

        this.displayNext(next);

        // 开启下一个周期
        this.scheduleNextCycle();
    },

    // 点击刷新 / 手动立即切换：不等间隔，直接换
    refreshNow() {
        this.stopCycle();

        let next;
        if (this.pendingPhrase) {
            // 有已准备好的下一条，优先用
            next = this.pendingPhrase;
        } else {
            // 否则用本地
            next = this.pickLocalPhrase();
        }

        // 清理当前预取（若 pendingPhrase 用了，也一起清掉）
        this.cancelPrefetch();

        this.displayNext(next);

        // 如果金句自动轮播还开着，重新开始周期
        if (document.getElementById('goldenSwitch')?.checked) {
            this.scheduleNextCycle();
        }
    },

    // ==================== 预取逻辑 ====================

    async prefetch() {
        // 若有正在进行的预取，先取消（防止两次预取并行）
        if (this.prefetchController) {
            this.prefetchController.abort();
        }

        const controller = new AbortController();
        this.prefetchController = controller;
        this.pendingPhrase = null;

        const probability = Number(window.App.State?.apiProbability ?? 50);

        // 概率决定直接使用本地金句
        if (Math.random() >= probability / 100) {
            this.pendingPhrase = this.pickLocalPhrase();
            return;
        }

        // 记录本轮预取已经尝试过的 API，避免反复撞同一个挂掉的 API
        const triedApis = new Set();

        // 在整个轮播间隔内持续尝试联网，直到成功或被 abort
        while (!controller.signal.aborted) {
            // 优先选择尚未尝试过的 API
            let api = this.selectUntriedAPI(triedApis);
            if (!api) {
                // 所有 API 都试过一遍了，重置，允许再来一轮
                triedApis.clear();
                api = this.selectRandomAPI();
            }
            triedApis.add(api.url);

            try {
                const text = await this.fetchOnce(api, controller.signal);

                // 已被取消 或 已被新的预取替换：丢弃结果
                if (controller.signal.aborted) return;
                if (this.prefetchController !== controller) return;

                this.pendingPhrase = text;
                return;
            } catch (err) {
                // 已被取消或已被替换：静默退出
                if (controller.signal.aborted) return;
                if (this.prefetchController !== controller) return;

                // 稍微等待再换下一个 API 重试，避免疯狂刷请求
                await this.sleep(800, controller.signal);
            }
        }
    },

    cancelPrefetch() {
        if (this.prefetchController) {
            this.prefetchController.abort();
            this.prefetchController = null;
        }
        this.pendingPhrase = null;
    },

    // 按权重从未尝试过的 API 里选一个
    selectUntriedAPI(triedApis) {
        const candidates = this.apiConfigs.filter(api => !triedApis.has(api.url));
        if (!candidates.length) return null;

        const total = candidates.reduce((sum, api) => sum + api.weight, 0);
        let random = Math.random() * total;

        for (const api of candidates) {
            if (random < api.weight) return api;
            random -= api.weight;
        }
        return candidates[candidates.length - 1];
    },

    // 按权重从所有 API 里随机选一个
    selectRandomAPI() {
        const total = this.apiConfigs.reduce((sum, api) => sum + api.weight, 0);
        let random = Math.random() * total;

        for (const api of this.apiConfigs) {
            if (random < api.weight) return api;
            random -= api.weight;
        }
        return this.apiConfigs[0];
    },

    // 单次请求（带 5s 超时 + 外部 abort 联动）
    async fetchOnce(api, outerSignal) {
        const controller = new AbortController();
        const onAbort = () => controller.abort();
        outerSignal.addEventListener('abort', onAbort, { once: true });

        const timeoutId = setTimeout(() => controller.abort(), 5000);

        try {
            const res = await fetch(api.url, {
                method: api.method || 'GET',
                signal: controller.signal
            });

            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const data = await res.json();
            const text = api.handler(data);

            if (text === null || text === '') throw new Error('空结果');

            return text;
        } finally {
            clearTimeout(timeoutId);
            outerSignal.removeEventListener('abort', onAbort);
        }
    },

    // 可被 abort 打断的 sleep
    sleep(ms, signal) {
        return new Promise(resolve => {
            const timer = setTimeout(resolve, ms);

            if (!signal) return;

            if (signal.aborted) {
                clearTimeout(timer);
                resolve();
                return;
            }

            signal.addEventListener('abort', () => {
                clearTimeout(timer);
                resolve();
            }, { once: true });
        });
    },

    // ==================== 本地金句 ====================

    pickLocalPhrase() {
        const data = (window.App.Store && window.App.Store.get('phrases'))
                  || window.localPhrases
                  || { high: [], medium: [], low: [] };

        const toArray = value => (Array.isArray(value) ? value : []);
        const high = toArray(data.high);
        const medium = toArray(data.medium);
        const low = toArray(data.low);
        const all = [...high, ...medium, ...low];

        if (!all.length) return '🎯 没有找到金句';

        const last = window.App.State.lastPhrase;
        const pick = list => {
            const candidates = list.filter(p => p !== last);
            const pool = candidates.length ? candidates : list;
            return pool[Math.floor(Math.random() * pool.length)];
        };

        const pools = [];
        if (high.length) pools.push({ list: high, weight: 45 });
        if (medium.length) pools.push({ list: medium, weight: 35 });
        if (low.length) pools.push({ list: low, weight: 20 });

        const total = pools.reduce((sum, pool) => sum + pool.weight, 0);
        let random = Math.random() * total;

        for (const pool of pools) {
            if (random < pool.weight) return pick(pool.list);
            random -= pool.weight;
        }

        return pick(all);
    },

    // ==================== 显示 ====================

    // 记录当前金句并渲染
    displayNext(text) {
        window.App.State.lastPhrase = text;
        this.currentPhrase = text;
        this.updateDisplay(text);
    },

    updateDisplay(text) {
        const container = document.getElementById('goldenPhrase');
        if (!container) return;

        // 关键：取消上一次未执行的动画定时器，避免旧内容覆盖新内容
        if (this._animationTimer) {
            clearTimeout(this._animationTimer);
            this._animationTimer = null;
        }

        const finalText = text === undefined || text === null ? '' : String(text);

        const animationEnabled = window.App.Store
            ? window.App.Store.getSetting('animationSwitch') !== false
            : (document.getElementById('animationSwitch')?.checked !== false);

        const formatted = this.escapeHTML(finalText).replace(/\n/g, '<br>');

        const apply = () => {
            container.innerHTML = `「 ${formatted} 」`;
            container.style.opacity = '1';
        };

        if (animationEnabled) {
            container.style.opacity = '0';
            this._animationTimer = setTimeout(() => {
                apply();
                this._animationTimer = null;
            }, 500);
        } else {
            apply();
        }
    },

    // ==================== 点击刷新 ====================

    bindClickRefresh() {
        const container = document.getElementById('goldenPhrase');
        if (!container) return;

        container.addEventListener('click', () => {
            // 默认关闭，需在设置里勾选“启用点击刷新金句”
            if (!document.getElementById('clickRefreshSwitch')?.checked) return;

            const animationEnabled = window.App.Store
                ? window.App.Store.getSetting('animationSwitch') !== false
                : (document.getElementById('animationSwitch')?.checked !== false);

            if (animationEnabled) {
                container.style.transform = 'scale(0.98)';
                setTimeout(() => {
                    container.style.transform = 'scale(1)';
                    this.refreshNow();
                }, 300);
            } else {
                this.refreshNow();
            }
        });
    },

    // ==================== 工具 ====================

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
    safeInit('ThemeBackground', () => window.App.ThemeBackground?.init());

    safeInit('ModalCore', () => window.App.ModalCore?.init());
    safeInit('ModalSettings', () => window.App.ModalSettings?.init());
    safeInit('ModalTimetable', () => window.App.ModalTimetable?.init());
    safeInit('ModalLostFound', () => window.App.ModalLostFound?.init());
    safeInit('ModalNotification', () => window.App.ModalNotification?.init());
    safeInit('ModalPhrase', () => window.App.ModalPhrase?.init());
    safeInit('ModalTimer', () => window.App.ModalTimer?.init());

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

## 16 `js/features/modal_lost_found.js`
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

## 17 `js/features/modal_notification.js`
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

        const data = (window.App.Store && window.App.Store.get('phrases'))
                  || window.localPhrases || {};

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
        this.applyFromStore();
        this.bindProbability();
        this.bindInterval();
        this.bindSwitches();
        this.bindVirtualTime();
        this.bindPreviewSlider();

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
            min: 1, max: 600, fallback: 15,
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
    },

    // ---------- 虚拟时间 ----------

    // 把 Date 转成 <input type="datetime-local"> 需要的本地时间字符串
    toLocalInputValue(date) {
        const pad = n => String(n).padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
               `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    },

    formatOffset(ms) {
        const abs = Math.abs(ms);
        const sign = ms >= 0 ? '+' : '-';
        const days = Math.floor(abs / 86400000);
        const hours = Math.floor((abs % 86400000) / 3600000);
        const mins = Math.floor((abs % 3600000) / 60000);
        const parts = [];
        if (days) parts.push(`${days}天`);
        if (hours) parts.push(`${hours}小时`);
        if (mins) parts.push(`${mins}分`);
        if (!parts.length) parts.push('不到1分钟');
        return sign + parts.join('');
    },

    bindVirtualTime() {
        const input = document.getElementById('virtualTimeInput');
        const applyBtn = document.getElementById('applyVirtualTime');
        const resetBtn = document.getElementById('resetVirtualTime');
        const statusEl = document.getElementById('timeOffsetStatus');
        const hintEl = document.getElementById('timeOffsetHint');
        if (!input) return;

        const currentOffset = window.App.Utils.getTimeOffset();

        // 输入框初值 = 当前"业务时间"
        input.value = this.toLocalInputValue(window.App.Utils.now());

        if (statusEl) {
            statusEl.textContent = currentOffset === 0
                ? '当前跟随系统时间'
                : `已偏移 ${this.formatOffset(currentOffset)}`;
        }

        if (hintEl) {
            hintEl.textContent = currentOffset === 0
                ? ''
                : `实际系统时间：${new Date().toLocaleString('zh-CN')}`;
        }

        applyBtn?.addEventListener('click', () => {
            const val = input.value;
            if (!val) return;

            const target = new Date(val);
            if (isNaN(target.getTime())) {
                if (hintEl) hintEl.textContent = '时间格式无效';
                return;
            }

            const offset = target.getTime() - Date.now();
            window.App.Utils.setTimeOffset(offset);

            // 直接刷新页面，让所有模块按新时间重新初始化
            location.reload();
        });

        resetBtn?.addEventListener('click', () => {
            window.App.Utils.setTimeOffset(0);
            location.reload();
        });
    },

    // ---------- 时间预览滑动条 ----------

    bindPreviewSlider() {
        const zone = document.getElementById('previewSliderZone');
        const slider = document.getElementById('previewSlider');
        const labelStart = document.getElementById('previewSliderLabelStart');
        const labelEnd = document.getElementById('previewSliderLabelEnd');
        const currentEl = document.getElementById('previewSliderCurrent');
        const modal = document.getElementById('settingsModal');
        if (!zone || !slider || !modal) return;

        // 以"当前虚拟时间"所在的年份作为滑动范围：1/1 ~ 12/31
        const now = window.App.Utils.now();
        const year = now.getFullYear();
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31);
        const totalDays = Math.round((endDate - startDate) / 86400000);

        slider.min = 0;
        slider.max = totalDays;

        // 初始滑块位置 = 当前业务时间在一年中的第几天
        const initialOffset = Math.round((now - startDate) / 86400000);
        slider.value = Math.max(0, Math.min(totalDays, initialOffset));

        if (labelStart) labelStart.textContent = `${year}/1/1`;
        if (labelEnd) labelEnd.textContent = `${year}/12/31`;

        const DAY_NAMES = '日一二三四五六';

        // 把滑块位置换算成预览日期（时分秒继承当前业务时间，这样作息状态也直观）
        const getPreviewDate = () => {
            const dayIndex = Number(slider.value) || 0;
            const base = new Date(year, 0, 1 + dayIndex);
            const vNow = window.App.Utils.now();
            base.setHours(
                vNow.getHours(),
                vNow.getMinutes(),
                vNow.getSeconds(),
                0
            );
            return base;
        };

        const refreshLabel = () => {
            const date = getPreviewDate();
            if (currentEl) {
                currentEl.textContent =
                    `预览：${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} 周${DAY_NAMES[date.getDay()]}`;
            }
        };

        // 拖动过程：只改内存偏移 + 轻量实时刷新（A 档，80ms 节流）
        const applyPreviewLight = () => {
            const preview = getPreviewDate();
            const offset = preview.getTime() - Date.now();

            window.App.Utils.setTimeOffset(offset, { persist: false });
            window.App.Utils.refreshAll();   // 轻量：文本/颜色/进度
            refreshLabel();
        };

        // 松手：持久化 + 完整刷新（A 档 + B 档）
        const applyPreviewFull = () => {
            const preview = getPreviewDate();
            const offset = preview.getTime() - Date.now();

            window.App.Utils.setTimeOffset(offset, { persist: true });
            window.App.Utils.refreshAllFull();   // 完整：含课表 HTML 重建
            refreshLabel();
        };

        // 拖动过程：实时应用 + 淡化模态框
        slider.addEventListener('input', () => {
            modal.classList.add('previewing');
            applyPreviewLight();
        });

        // 松手：完整刷新一次 + 恢复模态框
        slider.addEventListener('change', () => {
            applyPreviewFull();
            modal.classList.remove('previewing');
        });

        // 鼠标离开/失焦时兜底，避免 previewing 卡住
        slider.addEventListener('mouseleave', () => {
            if (slider.matches(':active')) return;
            modal.classList.remove('previewing');
        });

        // 键盘操作时（方向键），input 和 change 会同时触发，
        // 用 rAF 稍微延后移除 previewing，避免视觉闪烁
        slider.addEventListener('keyup', () => {
            requestAnimationFrame(() => {
                if (!slider.matches(':active')) {
                    modal.classList.remove('previewing');
                }
            });
        });

        refreshLabel();

        // 关闭设置面板时也要清掉 previewing 状态
        document.getElementById('closeSettings')?.addEventListener('click', () => {
            modal.classList.remove('previewing');
        });
    }
};

```

## 20 `js/features/modal_timer.js`
```js
// ============================================================
// js/features/modal_timer.js
// 模态框定时关闭
// 自动为除操作类之外的所有 .settings-modal 注入倒计时控件
// ============================================================

window.App = window.App || {};

window.App.ModalTimer = {
    // modalId -> { timerId, updateId, endTime }
    instances: new Map(),

    // 不需要定时关闭的模态框（操作类）
    EXCLUDE: ['settingsModal', 'phraseModal'],

    init() {
        document.querySelectorAll('.settings-modal').forEach(modal => {
            if (!modal.id) return;
            if (this.EXCLUDE.includes(modal.id)) return;
            this.attach(modal);
        });

        // 全局点击：关闭所有已展开的面板
        document.addEventListener('click', () => {
            document
                .querySelectorAll('.modal-timer.open')
                .forEach(el => {
                    el.classList.remove('open');
                    const button = el.querySelector('.modal-timer-btn');
                    if (button) {
                        button.setAttribute('aria-expanded', 'false');
                    }
                });
        });
    },

    attach(modal) {
        const header = modal.querySelector('.settings-header');
        if (!header) return;
        if (header.querySelector('.modal-timer')) return;

        const closeBtn = header.querySelector('.close-btn');
        if (!closeBtn) return;

        // ---------- 构建 UI ----------
        const wrap = document.createElement('div');
        wrap.className = 'modal-timer';
        wrap.innerHTML = `
            <button class="modal-timer-btn" type="button" title="定时关闭" aria-label="定时关闭" aria-expanded="false">⏱</button>
            <div class="modal-timer-panel">
                <div class="modal-timer-presets">
                    <button type="button" data-seconds="60">1分</button>
                    <button type="button" data-seconds="180">3分</button>
                    <button type="button" data-seconds="300">5分</button>
                    <button type="button" data-seconds="600">10分</button>
                </div>
                <div class="modal-timer-custom">
                    <input type="number" min="5" max="3600" step="5" value="30" aria-label="自定义关闭时间">
                    <span>秒</span>
                    <button type="button" data-action="start">开始</button>
                </div>
                <div class="modal-timer-hint">时间到自动关闭</div>
            </div>
        `;

        /*
         * 标题栏按钮顺序：
         * 定时关闭 -> 最大化 -> 关闭
         * 没有最大化按钮时：
         * 定时关闭 -> 关闭
         */
        const maximizeBtn = header.querySelector('.maximize-btn');

        if (maximizeBtn) {
            maximizeBtn.parentNode.insertBefore(wrap, maximizeBtn);
        } else {
            const actions = document.createElement('div');
            actions.className = 'settings-header-actions';
            actions.append(wrap, closeBtn);
            header.appendChild(actions);
        }

        const btn = wrap.querySelector('.modal-timer-btn');
        const panel = wrap.querySelector('.modal-timer-panel');
        const customInput = wrap.querySelector('.modal-timer-custom input');
        const startBtn = wrap.querySelector('[data-action="start"]');

        const setPanelOpen = open => {
            wrap.classList.toggle('open', open);
            btn.setAttribute('aria-expanded', String(open));
        };

        // ---------- 事件 ----------
        // 点击面板内不冒泡到 document
        panel.addEventListener('click', event => {
            event.stopPropagation();
        });

        // 快捷预设
        wrap.querySelectorAll('.modal-timer-presets button').forEach(presetBtn => {
            presetBtn.addEventListener('click', event => {
                event.stopPropagation();
                this.start(modal, Number(presetBtn.dataset.seconds));
                setPanelOpen(false);
            });
        });

        // 自定义时间
        startBtn.addEventListener('click', event => {
            event.stopPropagation();

            const value = Math.max(
                5,
                Math.min(3600, Number(customInput.value) || 30)
            );

            customInput.value = value;
            this.start(modal, value);
            setPanelOpen(false);
        });

        // 主按钮：倒计时中点击取消，否则打开或关闭面板
        btn.addEventListener('click', event => {
            event.stopPropagation();

            const state = this.instances.get(modal.id);

            if (state && state.timerId) {
                this.stop(modal);
                return;
            }

            setPanelOpen(!wrap.classList.contains('open'));
        });

        // 模态框关闭后清理倒计时
        modal.addEventListener('transitionend', () => {
            if (!modal.classList.contains('active')) {
                this.stop(modal);
                setPanelOpen(false);
            }
        });
    },

    // ---------- 开始倒计时 ----------
    start(modal, seconds) {
        this.stop(modal);

        const wrap = modal.querySelector('.modal-timer');
        if (!wrap) return;

        const btn = wrap.querySelector('.modal-timer-btn');
        const endTime = Date.now() + seconds * 1000;

        wrap.classList.add('counting');

        const state = {
            timerId: null,
            updateId: null,
            endTime
        };

        const finish = () => {
            this.stop(modal);
            this.closeModal(modal);
        };

        const update = () => {
            const remain = Math.max(0, endTime - Date.now());
            const total = Math.ceil(remain / 1000);
            const minutes = String(Math.floor(total / 60)).padStart(2, '0');
            const secondsText = String(total % 60).padStart(2, '0');

            btn.textContent = `${minutes}:${secondsText}`;

            if (remain > 0) {
                state.updateId = setTimeout(update, 250);
            }
        };

        state.timerId = setTimeout(finish, seconds * 1000);
        this.instances.set(modal.id, state);

        update();
    },

    // ---------- 停止倒计时（幂等） ----------
    stop(modal) {
        const state = this.instances.get(modal.id);

        if (!state) {
            this._resetButton(modal);
            return;
        }

        if (state.timerId) {
            clearTimeout(state.timerId);
        }

        if (state.updateId) {
            clearTimeout(state.updateId);
        }

        this.instances.delete(modal.id);
        this._resetButton(modal);
    },

    _resetButton(modal) {
        const wrap = modal.querySelector('.modal-timer');
        if (!wrap) return;

        const btn = wrap.querySelector('.modal-timer-btn');

        if (btn) {
            btn.textContent = '⏱';
            btn.setAttribute('aria-expanded', 'false');
        }

        wrap.classList.remove('counting', 'open');
    },

    // ---------- 关闭模态框 ----------
    closeModal(modal) {
        modal.classList.remove('active');

        if (window.App.ModalCore?.resetFullscreen) {
            window.App.ModalCore.resetFullscreen(modal.id);
        }
    }
};

```

## 21 `js/features/modal_timetable.js`
```js
window.App.ModalTimetable = {
    DAYS: [
        'sunday',
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday'
    ],

    init() {
        this.bindEvents();
        this.render();
    },

    bindEvents() {
        document
            .getElementById('settingsButton')
            ?.addEventListener('click', () => {
                // 设置弹窗打开时重新读取一次，确保跨天后界面同步
                window.setTimeout(() => this.render(), 0);
            });

        document
            .getElementById('saveTemporaryTimetable')
            ?.addEventListener('click', () => {
                this.save();
            });

        document
            .getElementById('resetTemporaryTimetable')
            ?.addEventListener('click', () => {
                this.reset();
            });
    },

    getDateKey(date = window.App.Utils.now()) {
        const pad = value =>
            String(value).padStart(2, '0');

        return [
            date.getFullYear(),
            pad(date.getMonth() + 1),
            pad(date.getDate())
        ].join('-');
    },

    getDateLabel(date = window.App.Utils.now()) {
        const dayNames = [
            '日',
            '一',
            '二',
            '三',
            '四',
            '五',
            '六'
        ];

        return `${date.getFullYear()}年${
            date.getMonth() + 1
        }月${date.getDate()}日 周${dayNames[date.getDay()]}`;
    },

    getOriginalCourses(day) {
        const schedule = window.App.SchoolSchedule;

        if (!schedule) return [];

        const data = schedule.getTimetableData();
        const courses = data[this.DAYS[day]] || [];

        return Array.isArray(courses)
            ? courses.slice()
            : [];
    },

    getValidOverride(day) {
        const store = window.App.Store;

        if (!store) return null;

        const override =
            store.getSetting('temporaryTimetable');

        if (!override) return null;

        const valid =
            override.date === this.getDateKey() &&
            Number(override.day) === Number(day) &&
            Array.isArray(override.courses);

        if (!valid) {
            store.setSetting(
                'temporaryTimetable',
                null
            );

            return null;
        }

        return override;
    },

    getCourseLabel(day, index) {
        if (day === 0) {
            return `晚${index + 1}`;
        }

        if (index === 0) {
            return '早';
        }

        if (index <= 8) {
            return String(index);
        }

        return `晚${index - 8}`;
    },

    escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    },

    render() {
        const editor =
            document.getElementById(
                'temporaryTimetableEditor'
            );

        const dateElement =
            document.getElementById(
                'temporaryTimetableDate'
            );

        const statusElement =
            document.getElementById(
                'temporaryTimetableStatus'
            );

        const saveButton =
            document.getElementById(
                'saveTemporaryTimetable'
            );

        const resetButton =
            document.getElementById(
                'resetTemporaryTimetable'
            );

        if (!editor) return;

        const date = window.App.Utils.now();
        const day = date.getDay();

        const originalCourses =
            this.getOriginalCourses(day);

        const override =
            this.getValidOverride(day);

        const courses = override
            ? override.courses.slice()
            : originalCourses.slice();

        if (dateElement) {
            dateElement.textContent =
                this.getDateLabel(date);
        }

        if (!courses.length) {
            editor.innerHTML = `
                <div class="timetable-editor-note">
                    今天暂无可编辑的课表数据。
                </div>
            `;

            if (saveButton) saveButton.disabled = true;
            if (resetButton) resetButton.disabled = true;

            if (statusElement) {
                statusElement.textContent = '';
            }

            return;
        }

        editor.innerHTML = courses
            .map((course, index) => `
                <label class="timetable-editor-row">
                    <span class="timetable-editor-label">
                        ${this.getCourseLabel(day, index)}
                    </span>
                    <input
                        class="timetable-course-input"
                        type="text"
                        data-course-index="${index}"
                        value="${this.escapeHtml(course)}"
                        maxlength="30"
                    >
                </label>
            `)
            .join('');

        if (saveButton) saveButton.disabled = false;
        if (resetButton) resetButton.disabled = !override;

        if (statusElement) {
            statusElement.textContent = override
                ? '今日临时课表已生效'
                : '当前使用原始课表';
        }
    },

    save() {
        const store = window.App.Store;
        const editor =
            document.getElementById(
                'temporaryTimetableEditor'
            );

        const statusElement =
            document.getElementById(
                'temporaryTimetableStatus'
            );

        if (!store || !editor) {
            if (statusElement) {
                statusElement.textContent =
                    '存储模块未初始化';
            }

            return;
        }

        const date = window.App.Utils.now();
        const day = date.getDay();

        const inputs = [
            ...editor.querySelectorAll(
                '.timetable-course-input'
            )
        ];

        if (!inputs.length) return;

        const courses = inputs.map(input =>
            input.value.trim()
        );

        store.setSetting('temporaryTimetable', {
            date: this.getDateKey(date),
            day,
            courses
        });

        window.App.SchoolSchedule?.updateDisplay();
        this.render();

        if (statusElement) {
            statusElement.textContent =
                '已保存，仅今天生效';
        }
    },

    reset() {
        const store = window.App.Store;

        if (!store) return;

        store.setSetting(
            'temporaryTimetable',
            null
        );

        window.App.SchoolSchedule?.updateDisplay();
        this.render();

        const statusElement =
            document.getElementById(
                'temporaryTimetableStatus'
            );

        if (statusElement) {
            statusElement.textContent =
                '已恢复原始课表';
        }
    }
};

```

## 22 `js/features/school_schedule.js`
```js
window.App.SchoolSchedule = {
    DAYS: [
        'sunday',
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday'
    ],

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
        if (window.App.Store) {
            return window.App.Store.get('schedule') || {};
        }

        return typeof schedule !== 'undefined'
            ? schedule
            : {};
    },

    getTimetableData() {
        if (window.App.Store) {
            return window.App.Store.get('timetable') || {};
        }

        return typeof timetable !== 'undefined'
            ? timetable
            : {};
    },

    getDateKey(date = window.App.Utils.now()) {
        const pad = value => String(value).padStart(2, '0');

        return [
            date.getFullYear(),
            pad(date.getMonth() + 1),
            pad(date.getDate())
        ].join('-');
    },

    getTemporaryTimetableOverride(day = window.App.Utils.now().getDay()) {
        const store = window.App.Store;

        if (!store) return null;

        const override = store.getSetting('temporaryTimetable');

        if (!override) return null;

        const isValid =
            override.date === this.getDateKey() &&
            Number(override.day) === Number(day) &&
            Array.isArray(override.courses);

        if (!isValid) {
            // 日期变化、星期变化或数据损坏时自动恢复原始课表
            store.setSetting('temporaryTimetable', null);
            return null;
        }

        return override;
    },

    getEffectiveCourses(day = window.App.Utils.now().getDay()) {
        const override = this.getTemporaryTimetableOverride(day);

        if (override) {
            return override.courses;
        }

        const courses =
            this.getTimetableData()[this.DAYS[day]] || [];

        return Array.isArray(courses) ? courses : [];
    },

    getTodaySchedule(day) {
        const data = this.getScheduleData();

        if (day === 5) {
            return data.friday;
        }

        if (day === 0) {
            return data.sunday;
        }

        return data.weekday;
    },

    getCourseName(day, lessonIndex) {
        const courses = this.getEffectiveCourses(day);

        return courses[
            day === 0
                ? lessonIndex
                : lessonIndex + 1
        ] || '';
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

        return todaySchedule.filter(item =>
            this.isCourseSchedule(item[1])
        );
    },

    getNextSchoolDayTime(now) {
        const target = new Date(now);
        const day = target.getDay();

        const daysUntilSunday =
            day === 5 ? 2 :
            day === 6 ? 1 :
            0;

        target.setDate(target.getDate() + daysUntilSunday);
        target.setHours(17, 30, 0, 0);

        return {
            endTime: target,
            label: '周日返校'
        };
    },

    getCurrentSchedule() {
        const now = window.App.Utils.now();
        const day = now.getDay();
        const currentMinutes =
            now.getHours() * 60 + now.getMinutes();

        const utils = window.App.Utils;

        if (day === 6) {
            return {
                current: '周末',
                nextLesson: '无'
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

        const todaySchedule = this.getTodaySchedule(day);

        if (!todaySchedule) {
            return {
                current: '加载中...',
                nextLesson: ''
            };
        }

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

            const isInRange =
                endMinutes < startMinutes
                    ? currentMinutes >= startMinutes ||
                      currentMinutes < endMinutes
                    : currentMinutes >= startMinutes &&
                      currentMinutes < endMinutes;

            if (isInRange) {
                current = name;
                currentIndex = i;
                break;
            }
        }

        let nextLesson = '';

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

        const lessonItems = this.getLessonItems(
            this.getTodaySchedule(day)
        );

        const lessonIndex = lessonItems.findIndex(
            item => item[1] === scheduleName
        );

        if (lessonIndex < 0) {
            return scheduleName;
        }

        return (
            this.getCourseName(day, lessonIndex) ||
            scheduleName
        );
    },

    // options.renderTimetable === false 时只更新文字，
    // 跳过课表 HTML 重建（时间预览滑动时用，避免高频 DOM 重建）
    updateDisplay(options) {
        const day = window.App.Utils.now().getDay();
        const result = this.getCurrentSchedule();

        const currentElement =
            document.getElementById('currentSchedule');

        const nextElement =
            document.getElementById('nextSchedule');

        if (currentElement) {
            currentElement.textContent =
                this.getCourseDisplayName(
                    day,
                    result.current
                );
        }

        if (nextElement) {
            const next = result.nextLesson;

            nextElement.textContent =
                !next || next === '无'
                    ? '无'
                    : this.getCourseDisplayName(day, next);
        }

        if (!options || options.renderTimetable !== false) {
            this.renderTimetable(day);
        }
    },

    renderTimetable(day) {
        const container =
            document.getElementById('todayTimetable');

        if (!container) return;

        const centered = text =>
            `<div class="timetable-item">${text}</div>`;

        if (day === 6) {
            container.innerHTML = centered('周末无课表');
            return;
        }

        const courses = this.getEffectiveCourses(day);

        if (!courses.length) {
            container.innerHTML = centered('暂无数据');
            return;
        }

        container.innerHTML = courses
            .map((course, index) => {
                let label = '';
                let showDivider = false;

                if (day === 0) {
                    label = `晚${index + 1}`;
                } else if (index === 0) {
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

                const rowClass = showDivider
                    ? 'timetable-row timetable-row-divider'
                    : 'timetable-row';

                return `
                    <div class="${rowClass}">
                        <div class="timetable-label">${label}</div>
                        <div class="timetable-course">${course}</div>
                    </div>
                `;
            })
            .join('');
    },

    getNextScheduleInfo() {
        const now = window.App.Utils.now();
        const day = now.getDay();
        const currentMinutes =
            now.getHours() * 60 + now.getMinutes();

        const utils = window.App.Utils;
        const todaySchedule = this.getTodaySchedule(day);

        if (!todaySchedule) {
            return {
                endTime: '23:59',
                label: '加载中'
            };
        }

        const current = this.getCurrentSchedule().current;

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

        const currentIndex = todaySchedule.findIndex(
            ([timeRange]) => {
                const [start, end] = timeRange.split('-');

                const startMinutes =
                    utils.timeToMinutes(start);

                const endMinutes =
                    utils.timeToMinutes(end);

                return endMinutes < startMinutes
                    ? currentMinutes >= startMinutes ||
                      currentMinutes < endMinutes
                    : currentMinutes >= startMinutes &&
                      currentMinutes < endMinutes;
            }
        );

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
        const now = window.App.Utils.now();

        let target;

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

        const difference = Math.max(0, target - now);
        const totalSeconds = Math.floor(difference / 1000);

        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor(
            (totalSeconds % 3600) / 60
        );
        const seconds = totalSeconds % 60;

        const pad = value =>
            String(value).padStart(2, '0');

        const timerElement =
            document.getElementById('countdownTimer');

        const labelElement =
            document.getElementById('countdownName');

        if (labelElement) {
            labelElement.textContent =
                `距离${result.label}还有：`;
        }

        if (timerElement) {
            timerElement.textContent =
                hours > 0
                    ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
                    : `${pad(minutes)}:${pad(seconds)}`;
        }
    }
};

```

## 23 `js/features/store.js`
```js
// ============================================================
// js/features/store.js
// 本地数据存储适配层
// 与本地 LocalDataServer.exe（127.0.0.1:17632~17641）通信
// ============================================================

window.App = window.App || {};

window.App.Store = {
    baseUrl: null,
    available: false,
    cache: {},
    writeTimers: {},
    initPromise: null,

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
            notificationFontSize: 16,

            // 今日课表临时覆盖，不修改 timetable 原始数据
            temporaryTimetable: null,

            // 虚拟时间偏移量（毫秒），0 表示跟随系统时间
            timeOffset: 0
        },

        timetable: {},
        schedule: {},
        phrases: {},
        solarterms: [],
        lostfound: [],
        notifications: []
    },

    init() {
        if (this.initPromise) return this.initPromise;

        this.initPromise = this._doInit();
        return this.initPromise;
    },

    async _doInit() {
        this.defaults.timetable =
            typeof timetable !== 'undefined' ? timetable : {};

        this.defaults.schedule =
            typeof schedule !== 'undefined' ? schedule : {};

        this.defaults.phrases =
            typeof localPhrases !== 'undefined' ? localPhrases : {};

        this.defaults.solarterms =
            typeof solarTerms !== 'undefined' ? solarTerms : [];

        await this._detectPort();
        await this._loadAll();
        this._updateBanner();

        console.info(
            this.available
                ? `[Store] 本地服务已连接：${this.baseUrl}`
                : '[Store] 本地服务未启动，运行在内存模式（修改不会被保存）'
        );
    },

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
            })
                .then(res => {
                    clearTimeout(timer);

                    if (!res.ok) {
                        resolve(false);
                        return;
                    }

                    res.json()
                        .then(data => {
                            resolve(
                                data &&
                                data.service === 'class-local-data'
                            );
                        })
                        .catch(() => resolve(false));
                })
                .catch(() => {
                    clearTimeout(timer);
                    resolve(false);
                });
        });
    },

    async _loadAll() {
        const names = [
            'settings',
            'timetable',
            'schedule',
            'phrases',
            'solarterms',
            'lostfound',
            'notifications'
        ];

        for (const name of names) {
            this.cache[name] = await this._load(
                name,
                this.defaults[name]
            );
        }
    },

    async _load(name, defaultValue) {
        const safeDefault = this._clone(defaultValue);

        if (!this.available) {
            return safeDefault;
        }

        try {
            const res = await fetch(
                `${this.baseUrl}/api/data/${name}`,
                { cache: 'no-store' }
            );

            if (res.ok) {
                const data = await res.json();

                if (
                    name === 'settings' &&
                    data &&
                    typeof data === 'object' &&
                    !Array.isArray(data)
                ) {
                    return Object.assign({}, safeDefault, data);
                }

                return data;
            }

            if (res.status === 404) {
                await this._writeNow(name, safeDefault);
                return safeDefault;
            }
        } catch (e) {
            console.warn(`[Store] 加载 ${name} 失败:`, e);
        }

        return safeDefault;
    },

    get(name) {
        return this.cache[name];
    },

    set(name, value) {
        this.cache[name] = value;
        this._scheduleWrite(name);
    },

    touch(name) {
        this._scheduleWrite(name);
    },

    getSetting(key) {
        const settings =
            this.cache.settings || this.defaults.settings;

        return settings[key];
    },

    // options.persist === false 时只改内存，不触发写盘
    setSetting(key, value, options) {
        if (!this.cache.settings) {
            this.cache.settings = this._clone(
                this.defaults.settings
            );
        }

        this.cache.settings[key] = value;

        if (!options || options.persist !== false) {
            this._scheduleWrite('settings');
        }
    },

    _scheduleWrite(name) {
        if (!this.available) return;

        if (this.writeTimers[name]) {
            clearTimeout(this.writeTimers[name]);
        }

        this.writeTimers[name] = setTimeout(() => {
            this._writeNow(name, this.cache[name]);
            this.writeTimers[name] = null;
        }, 150);
    },

    _writeNow(name, value) {
        if (!this.available) {
            return Promise.resolve();
        }

        return fetch(`${this.baseUrl}/api/data/${name}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(value)
        }).catch(err => {
            console.warn(`[Store] 保存 ${name} 失败:`, err);
        });
    },

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

    _clone(value) {
        try {
            return JSON.parse(JSON.stringify(value));
        } catch (e) {
            return value;
        }
    },

    _updateBanner() {
        const banner = document.getElementById('serviceBanner');

        if (!banner) return;

        if (this.available) {
            banner.style.display = 'none';
            return;
        }

        banner.style.display = 'block';
        banner.textContent =
            '本地服务未启动（D 盘 LocalDataServer.exe），修改不会被保存';

        setTimeout(() => {
            banner.style.opacity = '0';
            banner.style.transition = 'opacity .5s';
        }, 4000);
    }
};

window.addEventListener('pagehide', () => {
    window.App.Store.flush();
});

window.addEventListener('beforeunload', () => {
    window.App.Store.flush();
});

```

## 24 `js/features/theme_background.js`
```js
window.App = window.App || {};

window.App.ThemeBackground = {
    // 刷新间隔（毫秒）——10 分钟一次，让整套配色跟着时间缓缓流动
    REFRESH_INTERVAL: 10 * 60 * 1000,

    init() {
        this.update();
        setInterval(() => this.update(), this.REFRESH_INTERVAL);
    },

    getTerms() {
        if (window.App.Store) {
            return window.App.Store.get('solarterms') || [];
        }
        return typeof solarTerms !== 'undefined' ? solarTerms : [];
    },

    update() {
        const terms = this.getTerms();
        if (!terms.length) return;

        const base = this.getCurrentColor(terms);
        if (!base) return;

        this.applyTheme(base);
    },

    // 兼容旧接口：返回当前插值出的色相（0~360，OKLCH 色相角）
    getCurrentHue(terms) {
        const base = this.getCurrentColor(terms || this.getTerms());
        return base ? base.H : null;
    },

    // 兼容旧接口：返回某个颜色的色相（新版本为 OKLCH 色相角）
    hexToHue(hex) {
        const c = this.hexToOklch(hex);
        return c ? c.H : null;
    },

    // 找出当前日期落在哪两个节气色之间，对整份颜色（明度/彩度/色相）做插值
    getCurrentColor(terms) {
        const now = window.App.Utils.now();
        const year = now.getFullYear();

        const entries = terms
            .filter(t => t.month && t.day && t.color)
            .map(t => {
                const c = this.hexToOklch(t.color);
                return c ? { L: c.L, C: c.C, H: c.H, date: new Date(year, t.month - 1, t.day) } : null;
            })
            .filter(Boolean)
            .sort((a, b) => a.date - b.date);

        if (!entries.length) return null;

        // 接近无彩色的颜色没有稳定色相，让它们沿用上一个有效色相，避免色相乱跳
        const firstDefined = entries.find(e => e.C >= 0.004);
        let lastH = firstDefined ? firstDefined.H : 0;
        for (const e of entries) {
            if (e.C >= 0.004) lastH = e.H;
            else e.H = lastH;
        }

        let prev, next;

        if (now < entries[0].date) {
            // 早于今年第一个节气 → 用去年最后一个和今年第一个
            const last = entries[entries.length - 1];
            prev = { L: last.L, C: last.C, H: last.H, date: new Date(year - 1, last.date.getMonth(), last.date.getDate()) };
            next = entries[0];
        } else {
            for (let i = 0; i < entries.length; i++) {
                if (now >= entries[i].date) {
                    prev = entries[i];
                    if (i + 1 < entries.length) {
                        next = entries[i + 1];
                    } else {
                        // 晚于今年最后一个 → 用今年最后一个和明年第一个
                        const first = entries[0];
                        next = { L: first.L, C: first.C, H: first.H, date: new Date(year + 1, first.date.getMonth(), first.date.getDate()) };
                    }
                }
            }
            if (!prev) return entries[0];
        }

        const span = next.date - prev.date;
        if (span <= 0) return prev;

        const t = Math.max(0, Math.min(1, (now - prev.date) / span));
        return this.mixOklch(prev, next, t);
    },

    // 在 OKLCH 空间插值：明度、彩度线性过渡，色相走最短弧
    mixOklch(a, b, t) {
        let dh = b.H - a.H;
        if (dh > 180) dh -= 360;
        if (dh < -180) dh += 360;

        let H = a.H + dh * t;
        if (H < 0) H += 360;
        if (H >= 360) H -= 360;

        return {
            L: a.L + (b.L - a.L) * t,
            C: a.C + (b.C - a.C) * t,
            H
        };
    },

    // ===== 由插值颜色生成整套主题色 =====
    // 明度结构全年统一：无论什么季节，按钮白字、正文、背景的对比度都稳定，
    // 不再出现“黄色刺眼、蓝绿发闷”的问题；彩度随季节轻微起伏（冬素雅、夏明快）。
    applyTheme(base) {
        const H = base.H;
        const C0 = base.C;
        const root = document.documentElement;
        const set = (name, value) => root.style.setProperty(name, value);
        const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
        const color = (L, C, alpha) => this.cssOklch(L, Math.max(0, C), H, alpha);

        const primaryC = clamp(0.060 + C0 * 0.75, 0.095, 0.148);
        const darkC    = clamp(0.018 + C0 * 0.20, 0.018, 0.048);

        // 主色：按钮、滑块、开关、加号按钮、进度条（亮度压低一点，白字更清楚）
        const primaryRgb = this.cssOklchRgb(0.63, primaryC, H);
        set('--theme-primary',        `rgb(${primaryRgb.join(', ')})`);
        set('--theme-primary-hover',  color(0.575, primaryC));
        set('--theme-primary-active', color(0.52, primaryC));
        set('--theme-primary-rgb',    primaryRgb.join(', '));

        // 深色标题 / 大数字
        set('--theme-dark', color(0.30, darkC));

        // 正文 / 次要文字
        set('--theme-text',  color(0.34, 0.018));
        set('--theme-muted', color(0.57, 0.020));

        // 背景渐变两端
        set('--theme-bg-start', color(0.985, clamp(0.006 + C0 * 0.12, 0.006, 0.020)));
        set('--theme-bg-end',   color(0.955, clamp(0.012 + C0 * 0.30, 0.012, 0.050)));

        // 卡片表面
        set('--theme-surface',       color(0.990, 0.006, 0.9));
        set('--theme-surface-solid', color(0.995, 0.004));
        set('--theme-surface-soft',  color(0.975, clamp(0.008 + C0 * 0.15, 0.008, 0.024)));
        set('--theme-surface-hover', color(0.943, clamp(0.012 + C0 * 0.25, 0.012, 0.045)));

        // 边框 / 分隔线
        set('--theme-border', color(0.918, clamp(0.010 + C0 * 0.16, 0.010, 0.032)));
    },

    // 把 OKLCH 转成 CSS 颜色字符串（超出 sRGB 色域会自动降低彩度）
    cssOklch(L, C, H, alpha) {
        const [r, g, b] = this.cssOklchRgb(L, C, H);
        return alpha === undefined || alpha >= 1
            ? `rgb(${r}, ${g}, ${b})`
            : `rgba(${r}, ${g}, ${b}, ${alpha})`;
    },

    cssOklchRgb(L, C, H) {
        const rad = H * Math.PI / 180;
        let c = C;
        for (let i = 0; i < 16; i++) {
            const rgb = this.oklabToRgb(L, c * Math.cos(rad), c * Math.sin(rad));
            if (Math.min(rgb[0], rgb[1], rgb[2]) >= -0.001 && Math.max(rgb[0], rgb[1], rgb[2]) <= 1.001) {
                return rgb.map(v => Math.round(Math.min(1, Math.max(0, v)) * 255));
            }
            c *= 0.95; // 越界就退一点彩度再试
        }
        return this.oklabToRgb(L, 0, 0).map(v => Math.round(Math.min(1, Math.max(0, v)) * 255));
    },

    // ===== 颜色空间转换（OKLab / OKLCH，Björn Ottosson 公式）=====
    hexToOklch(hex) {
        if (typeof hex !== 'string') return null;
        const h = hex.replace('#', '');
        const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
        if (full.length !== 6) return null;

        const num = parseInt(full, 16);
        if (isNaN(num)) return null;

        const lin = v => v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        const R = lin(((num >> 16) & 255) / 255);
        const G = lin(((num >> 8) & 255) / 255);
        const B = lin((num & 255) / 255);

        const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
        const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
        const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);

        const L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s;
        const A = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s;
        const B2 = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s;

        const C = Math.sqrt(A * A + B2 * B2);
        let H = Math.atan2(B2, A) * 180 / Math.PI;
        if (H < 0) H += 360;

        return { L, C, H };
    },

    oklabToRgb(L, a, b) {
        const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
        const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
        const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

        const l = l_ * l_ * l_;
        const m = m_ * m_ * m_;
        const s = s_ * s_ * s_;

        const R = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
        const G = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
        const B = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

        const srgb = v => v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
        return [srgb(R), srgb(G), srgb(B)];
    }
};


```

## 25 `js/features/timeline.js`
```js
window.App.Timeline = {
    init() {
        const currentYear = window.App.Utils.now().getFullYear();
        this.updateSolarTermsDates(currentYear);
        this.generateMarkers();
        this.updateColor();

        document.addEventListener('click', () => {
            document.querySelectorAll('.solar-card').forEach(c => c.classList.remove('active'));
            document.querySelectorAll('.solar-term-marker').forEach(m => (m.style.zIndex = '2'));
        });

        setInterval(() => this.updateColor(), 1000);

        setInterval(() => {
            this.updateSolarTermsDates(window.App.Utils.now().getFullYear());
            this.generateMarkers();
        }, 86400000);
    },

    getSolarTerms() {
        if (window.App.Store) return window.App.Store.get('solarterms') || [];
        return (typeof solarTerms !== 'undefined') ? solarTerms : [];
    },

    // ★ 统一的时间轴起止：起点固定 1/1，终点高考年为 6/7、其余为 12/31
    getTimelineRange(currentYear) {
        const gradYear = 2028;
        const startDate = new Date(currentYear, 0, 1);        // 1 月 1 日
        const isGradYear = currentYear === gradYear;
        const endDate = isGradYear
            ? new Date(gradYear, 5, 7)                        // 高考年：6 月 7 日
            : new Date(currentYear, 11, 31);                  // 其余：12 月 31 日

        return { startDate, endDate, isGradYear };
    },

    generateMarkers() {
        const terms = this.getSolarTerms();
        if (!terms.length) return;

        const now = window.App.Utils.now();
        const currentYear = now.getFullYear();
        const { startDate, endDate, isGradYear } = this.getTimelineRange(currentYear);

        const endMarkerEl = document.querySelector('.end-marker');
        if (endMarkerEl) {
            if (isGradYear) {
                endMarkerEl.style.display = 'block';
                document.getElementById('timelineEndTitle').textContent = '高考日';
                document.getElementById('timelineEndDate').textContent = '6月7日';
            } else {
                endMarkerEl.style.display = 'none';
            }
        }

        const totalDays = (endDate - startDate) / 86400000;
        const timeline = document.getElementById('timeline');

        document.querySelectorAll('.solar-term-marker').forEach(m => m.remove());

        terms.forEach((term, index) => {
            const termDate = new Date(currentYear, term.month - 1, term.day);
            if (termDate < startDate || termDate > endDate) return;

            const position = ((termDate - startDate) / 86400000 / totalDays) * 100;
            const isPast = termDate < now;
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
        const terms = this.getSolarTerms();
        if (!terms.length) return;

        const now = window.App.Utils.now();
        const currentYear = now.getFullYear();
        const { startDate, endDate } = this.getTimelineRange(currentYear);

        const progress = Math.min(1, Math.max(0, (now - startDate) / (endDate - startDate)));
        const timeline = document.getElementById('timeline');
        if (timeline) timeline.style.setProperty('--progress-percent', `${progress * 100}%`);
    },

    // 21 世纪寿星天文历公式：[Y*D+C]-L
    updateSolarTermsDates(year) {
        const terms = this.getSolarTerms();
        if (!terms.length) return;

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

        terms.forEach(term => {
            if (!cMap[term.name]) return;
            term.day = Math.floor(y * D + cMap[term.name]) - leapCount;
            term.month = monthMap[term.name];
        });
    }
};

```

## 26 `js/features/weather.js`
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

