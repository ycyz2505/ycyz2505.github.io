window.App.DailyImage = {
    init() {
        const switchBtn = document.getElementById('imageSwitch');
        if (switchBtn && !switchBtn.checked) {
            const container = document.querySelector('.right-image-container');
            if(container) container.style.display = 'none';
            return;
        }
        
        this.updateImage();
        // 每天自动刷新
        window.App.Timers.image = setInterval(() => this.updateImage(), 86400000);
    },
    
    updateImage() {
        const img = document.getElementById('apiImage');
        const container = document.querySelector('.right-image-container');
        if (!img || !container) return;

        container.style.display = 'flex';
        
        // 加时间戳防缓存
        const t = new Date().getTime();
        const src = `https://v.api.aa1.cn/api/60s-v3/?t=${t}`;
        
        // 简单的预加载
        const temp = new Image();
        temp.onload = () => {
            img.src = src;
            img.style.opacity = '1';
        };
        
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.5s';
        temp.src = src;

        // 备用接口逻辑
        temp.onerror = () => {
            img.src = `https://api.03c3.cn/zb/api.php?t=${t}`;
            img.style.opacity = '1';
        };
    }
};