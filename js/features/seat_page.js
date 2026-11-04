// ============================================================
// js/features/seat_page.js
// 座位表页：不再是模态框，而是从主页面下滑进入的整页。
// 下滑主页面 / 点击底部「座位表」→ 打开；
// 上滑座位表 / 点击右下角「返回」→ 关闭。
// ============================================================

window.App = window.App || {};

window.App.SeatPage = {
    _inited: false,
    _tracking: null,

    init() {
        if (this._inited) return;
        this._inited = true;

        document.getElementById('seatingButton')?.addEventListener('click', () => this.open());
        document.getElementById('seatPageBack')?.addEventListener('click', () => this.close());

        this.bindGestures();
    },

    isOpen() {
        return !!document.getElementById('seatingModal')?.classList.contains('active');
    },

    open() {
        if (this.isOpen()) return;
        // 设置面板 / 其他模态框打开时不让下滑穿透
        if (document.querySelector('.settings-modal.active')) return;

        document.getElementById('seatingModal')?.classList.add('active');
    },

    close() {
        if (!this.isOpen()) return;
        document.getElementById('seatingModal')?.classList.remove('active');
    },

    bindGestures() {
        const OPEN_BLOCKED = [
            'button', 'a', 'input', 'select', 'textarea',
            '.settings-modal', '.seat-grid', '.seat-side', '.seat-palette',
            '.seat-panel', '.seat-search', '.seat-keyboard', '.seat-bar',
            '.seat-toolbar', '.seat-trash', '.seat-pick-overlay', '.seat-chip',
            '.seat-block'
        ].join(',');

        const CLOSE_BLOCKED = [
            'button', 'a', 'input', 'select', 'textarea',
            '.seat-grid', '.seat-side', '.seat-palette', '.seat-panel',
            '.seat-search', '.seat-keyboard', '.seat-bar', '.seat-toolbar',
            '.seat-trash', '.seat-pick-overlay', '.seat-chip', '.seat-block'
        ].join(',');

        const start = event => {
            if (event.pointerType === 'mouse' && event.button !== 0) return;

            if (this.isOpen()) {
                if (!event.target.closest('#seatingModal')) return;
                if (event.target.closest(CLOSE_BLOCKED)) return;

                this._tracking = {
                    x: event.clientX,
                    y: event.clientY,
                    mode: 'close'
                };
                return;
            }

            if (document.querySelector('.settings-modal.active')) return;
            if (event.target.closest('#seatingModal')) return;
            if (event.target.closest(OPEN_BLOCKED)) return;

            this._tracking = {
                x: event.clientX,
                y: event.clientY,
                mode: 'open'
            };
        };

        const finish = event => {
            const tracking = this._tracking;
            this._tracking = null;
            if (!tracking) return;

            const dy = event.clientY - tracking.y;
            const dx = event.clientX - tracking.x;

            if (Math.abs(dy) < 90) return;
            if (Math.abs(dy) < Math.abs(dx) * 1.4) return;

            if (tracking.mode === 'open' && dy > 0) this.open();
            if (tracking.mode === 'close' && dy < 0) this.close();
        };

        document.addEventListener('pointerdown', start, true);
        document.addEventListener('pointerup', finish, true);
        document.addEventListener('pointercancel', () => { this._tracking = null; }, true);
    }
};
