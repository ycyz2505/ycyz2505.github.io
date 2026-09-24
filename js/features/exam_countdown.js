window.App.ExamCountdown = {
    init() {
        this.update();
    },

    update() {
        const target = new Date(2028, 5, 7);
        const diff = target - new Date();
        const days = Math.max(0, Math.ceil(diff / 86400000));

        const el = document.getElementById('daysUntil');
        if (el) el.textContent = `${days}天`;

        const now = new Date();
        setTimeout(() => this.update(), 86400000 - (now % 86400000));
    }
};
