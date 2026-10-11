window.App.Clock = (() => {
    let lastTime = '';
    let lastDate = '';
    const pad = n => String(n).padStart(2, '0');

    return {
        init() {
            this.update();
        },

        // 只更新时钟自身的两个子元素，
        // 不再整体重写 #currentDateTime 的 innerHTML（天气行也在其中）
        update() {
            const d = window.App.Utils.now();

            const time =
                `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

            const date =
                `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} 周${'日一二三四五六'[d.getDay()]}`;

            const timeEl = document.querySelector('#currentDateTime .time-section');
            const dateEl = document.querySelector('#currentDateTime .date-section');

            if (timeEl && time !== lastTime) {
                lastTime = time;
                timeEl.textContent = time;
            }

            if (dateEl && date !== lastDate) {
                lastDate = date;
                dateEl.textContent = date;
            }

            requestAnimationFrame(() => this.update());
        }
    };
})();