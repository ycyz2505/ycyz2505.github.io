window.App.Clock = (() => {
    let lastHTML = '';
    const pad = n => String(n).padStart(2, '0');

    return {
        init() {
            this.update();
        },

        update() {
            const d = new Date();
            const html =
                `<div class="time-section">${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}</div>` +
                `<div class="date-section">${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} 周${'日一二三四五六'[d.getDay()]}</div>`;

            if (html !== lastHTML) {
                lastHTML = html;
                const el = document.getElementById('currentDateTime');
                if (el) el.innerHTML = html;
            }

            requestAnimationFrame(() => this.update());
        }
    };
})();
