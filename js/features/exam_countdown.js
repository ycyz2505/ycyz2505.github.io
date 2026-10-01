window.App.ExamCountdown = {
    _timer: null,

    init() {
        this.update();
    },

    update() {
        // 先清掉旧定时器，避免拖动预览时反复叠加
        if (this._timer) {
            clearTimeout(this._timer);
            this._timer = null;
        }

        const now = window.App.Utils.now();
        const target = new Date(2028, 5, 7);
        const diff = target - now;
        const days = Math.max(0, Math.ceil(diff / 86400000));

        const el = document.getElementById('daysUntil');
        if (el) el.textContent = `${days}天`;

        // 下一个"业务时间"的午夜
        const nextMidnight = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() + 1
        );

        this._timer = setTimeout(() => this.update(), nextMidnight - now);
    }
};