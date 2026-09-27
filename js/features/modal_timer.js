// ============================================================
// js/features/modal_timer.js
// 模态框定时关闭
// 自动为除操作类之外的所有 .settings-modal 注入倒计时控件
// ============================================================

window.App = window.App || {};

window.App.ModalTimer = {
    // modalId -> { timerId, updateId, endTime }
    instances: new Map(),

    // 不需要定时关闭的模态框（操作类）
    EXCLUDE: ['settingsModal', 'phraseModal'],

    init() {
        document.querySelectorAll('.settings-modal').forEach(modal => {
            if (!modal.id) return;
            if (this.EXCLUDE.includes(modal.id)) return;
            this.attach(modal);
        });

        // 全局点击：关闭所有已展开的面板
        document.addEventListener('click', () => {
            document
                .querySelectorAll('.modal-timer.open')
                .forEach(el => el.classList.remove('open'));
        });
    },

    attach(modal) {
        const header = modal.querySelector('.settings-header');
        if (!header) return;
        if (header.querySelector('.modal-timer')) return;

        const closeBtn = header.querySelector('.close-btn');
        if (!closeBtn) return;

        // 优先插到最大化按钮左边；没有最大化按钮时插到关闭按钮左边
        const maximizeBtn = header.querySelector('.maximize-btn');
        const anchor = maximizeBtn || closeBtn;

        // ---------- 构建 UI ----------
        const wrap = document.createElement('div');
        wrap.className = 'modal-timer';
        wrap.innerHTML = `
            <span class="modal-timer-btn" title="定时关闭">⏱</span>
            <div class="modal-timer-panel">
                <div class="modal-timer-presets">
                    <button type="button" data-seconds="60">1分</button>
                    <button type="button" data-seconds="180">3分</button>
                    <button type="button" data-seconds="300">5分</button>
                    <button type="button" data-seconds="600">10分</button>
                </div>
                <div class="modal-timer-custom">
                    <input type="number" min="5" max="3600" step="5" value="30">
                    <span>秒</span>
                    <button type="button" data-action="start">开始</button>
                </div>
                <div class="modal-timer-hint">时间到自动关闭</div>
            </div>
        `;

        anchor.parentNode.insertBefore(wrap, anchor);

        const btn = wrap.querySelector('.modal-timer-btn');
        const panel = wrap.querySelector('.modal-timer-panel');
        const customInput = wrap.querySelector('.modal-timer-custom input');
        const startBtn = wrap.querySelector('[data-action="start"]');

        // ---------- 事件 ----------
        // 面板内点击不冒泡到 document
        panel.addEventListener('click', e => e.stopPropagation());

        // 快捷预设
        wrap.querySelectorAll('.modal-timer-presets button').forEach(b => {
            b.addEventListener('click', e => {
                e.stopPropagation();
                this.start(modal, Number(b.dataset.seconds));
                wrap.classList.remove('open');
            });
        });

        // 自定义
        startBtn.addEventListener('click', e => {
            e.stopPropagation();
            const val = Math.max(5, Math.min(3600, Number(customInput.value) || 30));
            customInput.value = val;
            this.start(modal, val);
            wrap.classList.remove('open');
        });

        // 主按钮：倒计时中点一次取消，否则开关面板
        btn.addEventListener('click', e => {
            e.stopPropagation();
            const state = this.instances.get(modal.id);
            if (state && state.timerId) {
                this.stop(modal);
                return;
            }
            wrap.classList.toggle('open');
        });

        // 模态框关闭后（transition 结束）清理
        modal.addEventListener('transitionend', () => {
            if (!modal.classList.contains('active')) {
                this.stop(modal);
                wrap.classList.remove('open');
            }
        });
    },

    // ---------- 开始倒计时 ----------
    start(modal, seconds) {
        // 先清理旧状态
        this.stop(modal);

        const wrap = modal.querySelector('.modal-timer');
        if (!wrap) return;

        const btn = wrap.querySelector('.modal-timer-btn');
        const endTime = Date.now() + seconds * 1000;

        wrap.classList.add('counting');

        // 先声明 state，闭包引用
        const state = {
            timerId: null,
            updateId: null,
            endTime
        };

        const finish = () => {
            this.stop(modal);
            this.closeModal(modal);
        };

        const update = () => {
            const remain = Math.max(0, endTime - Date.now());
            const total = Math.ceil(remain / 1000);
            const mm = String(Math.floor(total / 60)).padStart(2, '0');
            const ss = String(total % 60).padStart(2, '0');
            btn.textContent = `${mm}:${ss}`;
            state.updateId = setTimeout(update, 250);
        };

        state.timerId = setTimeout(finish, seconds * 1000);
        this.instances.set(modal.id, state);

        update();
    },

    // ---------- 停止倒计时（幂等） ----------
    stop(modal) {
        const state = this.instances.get(modal.id);
        if (!state) {
            this._resetButton(modal);
            return;
        }

        if (state.timerId) clearTimeout(state.timerId);
        if (state.updateId) clearTimeout(state.updateId);

        this.instances.delete(modal.id);
        this._resetButton(modal);
    },

    _resetButton(modal) {
        const wrap = modal.querySelector('.modal-timer');
        if (!wrap) return;
        const btn = wrap.querySelector('.modal-timer-btn');
        if (btn) btn.textContent = '⏱';
        wrap.classList.remove('counting', 'open');
    },

    // ---------- 关闭模态框 ----------
    closeModal(modal) {
        modal.classList.remove('active');
        if (window.App.ModalCore?.resetFullscreen) {
            window.App.ModalCore.resetFullscreen(modal.id);
        }
    }
};