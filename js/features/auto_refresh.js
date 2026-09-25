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