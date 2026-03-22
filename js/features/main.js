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

