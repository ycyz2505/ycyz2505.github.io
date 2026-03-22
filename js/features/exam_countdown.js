window.App.ExamCountdown = {
    init() {
        this.update();
    },

    update() {
        // 目标日期：2025年6月18日 (注意月份是从 0 开始的，5 代表 6 月)
        const target = new Date(2028, 5, 7);
        const diff = target - new Date();
        const days = Math.max(0, Math.ceil(diff / 86400000));
        
        const daysUntilElement = document.getElementById('daysUntil');
        if (daysUntilElement) {
            daysUntilElement.textContent = `${days}天`;
        }

        // 计算距离明天凌晨还有多少毫秒，精准设置下一次更新的定时器
        const now = new Date();
        const msToNextDay = 86400000 - (now % 86400000);
        setTimeout(() => this.update(), msToNextDay);
    }
};