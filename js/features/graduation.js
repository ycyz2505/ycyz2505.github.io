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