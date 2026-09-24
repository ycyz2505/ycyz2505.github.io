window.App.DailyImage = {
    init() {
        const switchBtn = document.getElementById('imageSwitch');
        if (switchBtn && !switchBtn.checked) {
            const container = document.querySelector('.right-image-container');
            if (container) container.style.display = 'none';
            return;
        }

        this.updateImage();
        clearInterval(window.App.Timers.image);
        window.App.Timers.image = setInterval(() => this.updateImage(), 86400000);
    },

    updateImage() {
        const img = document.getElementById('apiImage');
        const container = document.querySelector('.right-image-container');
        if (!img || !container) return;

        container.style.display = 'flex';
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
