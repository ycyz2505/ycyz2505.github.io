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
