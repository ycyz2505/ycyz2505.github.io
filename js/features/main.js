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
    safeInit('ModalVirtualTime', () => window.App.ModalVirtualTime?.init());
    safeInit('ModalTimetable', () => window.App.ModalTimetable?.init());
    safeInit('ModalCountdown', () => window.App.ModalCountdown?.init());
    safeInit('ModalLostFound', () => window.App.ModalLostFound?.init());
    safeInit('ModalNotification', () => window.App.ModalNotification?.init());
    safeInit('ModalAnnouncement', () => window.App.ModalAnnouncement?.init());
    safeInit('ModalPhrase', () => window.App.ModalPhrase?.init());
    safeInit('Calculator', () => window.App.Calculator?.init());
    safeInit('ModalTimer', () => window.App.ModalTimer?.init());
    safeInit('Music', () => window.App.Music?.init());
    safeInit('MOnline', () => window.App.MOnline?.init());
    safeInit('MLib', () => window.App.MLib?.init());
    safeInit('MPrefs', () => window.App.MPrefs?.init());
    safeInit('ModalSeating', () => window.App.ModalSeating?.init());

    // 广场：先建数据层，再建三个模态框
    safeInit('Plaza', () => window.App.Plaza?.init());
    safeInit('ModalRoster', () => window.App.ModalRoster?.init());
    safeInit('ModalPlaza', () => window.App.ModalPlaza?.init());
    safeInit('ModalSpace', () => window.App.ModalSpace?.init());

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