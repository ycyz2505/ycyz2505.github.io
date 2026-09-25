window.App.AutoRefresh = {
    interval: 15 * 60 * 1000,

    init() {
        const switchBtn = document.getElementById('autoRefreshSwitch');
        if (!switchBtn) return;

        switchBtn.addEventListener('change', e => {
            if (window.App.Store) {
                window.App.Store.setSetting('autoRefreshSwitch', e.target.checked);
            }
            e.target.checked ? this.start() : this.stop();
        });

        // 以 Store 为准：Store 已初始化，getSetting 返回磁盘上的值
        const enabled = window.App.Store
            ? window.App.Store.getSetting('autoRefreshSwitch') === true
            : switchBtn.checked;

        if (enabled) this.start();
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