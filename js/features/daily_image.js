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