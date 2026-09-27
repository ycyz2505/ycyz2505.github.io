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
                .forEach(el => {
                    el.classList.remove('open');
                    const button = el.querySelector('.modal-timer-btn');
                    if (button) {
                        button.setAttribute('aria-expanded', 'false');
                    }
                });
        });
    },

    attach(modal) {
        const header = modal.querySelector('.settings-header');
        if (!header) return;
        if (header.querySelector('.modal-timer')) return;

        const closeBtn = header.querySelector('.close-btn');
        if (!closeBtn) return;

        // ---------- 构建 UI ----------
        const wrap = document.createElement('div');
        wrap.className = 'modal-timer';
        wrap.innerHTML = `
            <button class="modal-timer-btn" type="button" title="定时关闭" aria-label="定时关闭" aria-expanded="false">⏱</button>
            <div class="modal-timer-panel">
                <div class="modal-timer-presets">
                    <button type="button" data-seconds="60">1分</button>
                    <button type="button" data-seconds="180">3分</button>
                    <button type="button" data-seconds="300">5分</button>
                    <button type="button" data-seconds="600">10分</button>
                </div>
                <div class="modal-timer-custom">
                    <input type="number" min="5" max="3600" step="5" value="30" aria-label="自定义关闭时间">
                    <span>秒</span>
                    <button type="button" data-action="start">开始</button>
                </div>
                <div class="modal-timer-hint">时间到自动关闭</div>
            </div>
        `;

        /*
         * 标题栏按钮顺序：
         * 定时关闭 -> 最大化 -> 关闭
         * 没有最大化按钮时：
         * 定时关闭 -> 关闭
         */
        const maximizeBtn = header.querySelector('.maximize-btn');

        if (maximizeBtn) {
            maximizeBtn.parentNode.insertBefore(wrap, maximizeBtn);
        } else {
            const actions = document.createElement('div');
            actions.className = 'settings-header-actions';
            actions.append(wrap, closeBtn);
            header.appendChild(actions);
        }

        const btn = wrap.querySelector('.modal-timer-btn');
        const panel = wrap.querySelector('.modal-timer-panel');
        const customInput = wrap.querySelector('.modal-timer-custom input');
        const startBtn = wrap.querySelector('[data-action="start"]');

        const setPanelOpen = open => {
            wrap.classList.toggle('open', open);
            btn.setAttribute('aria-expanded', String(open));
        };

        // ---------- 事件 ----------
        // 点击面板内不冒泡到 document
        panel.addEventListener('click', event => {
            event.stopPropagation();
        });

        // 快捷预设
        wrap.querySelectorAll('.modal-timer-presets button').forEach(presetBtn => {
            presetBtn.addEventListener('click', event => {
                event.stopPropagation();
                this.start(modal, Number(presetBtn.dataset.seconds));
                setPanelOpen(false);
            });
        });

        // 自定义时间
        startBtn.addEventListener('click', event => {
            event.stopPropagation();

            const value = Math.max(
                5,
                Math.min(3600, Number(customInput.value) || 30)
            );

            customInput.value = value;
            this.start(modal, value);
            setPanelOpen(false);
        });

        // 主按钮：倒计时中点击取消，否则打开或关闭面板
        btn.addEventListener('click', event => {
            event.stopPropagation();

            const state = this.instances.get(modal.id);

            if (state && state.timerId) {
                this.stop(modal);
                return;
            }

            setPanelOpen(!wrap.classList.contains('open'));
        });

        // 模态框关闭后清理倒计时
        modal.addEventListener('transitionend', () => {
            if (!modal.classList.contains('active')) {
                this.stop(modal);
                setPanelOpen(false);
            }
        });
    },

    // ---------- 开始倒计时 ----------
    start(modal, seconds) {
        this.stop(modal);

        const wrap = modal.querySelector('.modal-timer');
        if (!wrap) return;

        const btn = wrap.querySelector('.modal-timer-btn');
        const endTime = Date.now() + seconds * 1000;

        wrap.classList.add('counting');

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
            const minutes = String(Math.floor(total / 60)).padStart(2, '0');
            const secondsText = String(total % 60).padStart(2, '0');

            btn.textContent = `${minutes}:${secondsText}`;

            if (remain > 0) {
                state.updateId = setTimeout(update, 250);
            }
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

        if (state.timerId) {
            clearTimeout(state.timerId);
        }

        if (state.updateId) {
            clearTimeout(state.updateId);
        }

        this.instances.delete(modal.id);
        this._resetButton(modal);
    },

    _resetButton(modal) {
        const wrap = modal.querySelector('.modal-timer');
        if (!wrap) return;

        const btn = wrap.querySelector('.modal-timer-btn');

        if (btn) {
            btn.textContent = '⏱';
            btn.setAttribute('aria-expanded', 'false');
        }

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