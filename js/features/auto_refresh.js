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