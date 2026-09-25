window.App.ModalCore = {
    initialized: false,
    timers: new WeakMap(),
    closingModals: new WeakSet(),
    modalObserver: null,

    init() {
        if (this.initialized) return;
        this.initialized = true;

        this.injectAutoCloseStyles();

        // 金句选择弹窗由 ModalPhrase 独立处理
        const modals = [
            {
                btn: 'settingsButton',
                modal: 'settingsModal',
                close: 'closeSettings'
            },
            {
                btn: 'changelogButton',
                modal: 'changelogModal',
                close: 'closeChangelog'
            },
            {
                btn: 'announcementButton',
                modal: 'announcementModal',
                close: 'closeAnnouncement'
            },
            {
                btn: 'lostAndFoundButton',
                modal: 'lostAndFoundModal',
                close: 'closeLostAndFound'
            },
            {
                btn: 'notificationButton',
                modal: 'notificationModal',
                close: 'closeNotification'
            }
        ];

        modals.forEach(({ btn, modal, close }) => {
            const openButton = document.getElementById(btn);
            const modalElement = document.getElementById(modal);
            const closeButton = document.getElementById(close);

            openButton?.addEventListener('click', () => {
                if (!modalElement) return;

                modalElement.classList.add('active');
                this.setupAutoClose(modalElement);
            });

            closeButton?.addEventListener('click', () => {
                if (!modalElement) return;
                this.closeModal(modalElement);
            });
        });

        [
            'maximizeNotification',
            'maximizeLostAndFound',
            'maximizeAnnouncement'
        ].forEach(id => {
            document.getElementById(id)?.addEventListener('click', function () {
                const modal = this.closest('.settings-modal');
                if (!modal) return;

                modal.classList.toggle('fullscreen');
                this.textContent =
                    modal.classList.contains('fullscreen') ? '🗗' : '⛶';
            });
        });

        document.querySelectorAll('.settings-modal').forEach(modal => {
            this.setupAutoClose(modal);
        });

        this.bindGlobalAutoCloseEvents();
        this.observeModals();
    },

    /**
     * 默认排除：
     * 1. 设置模态框
     * 2. 金句选择模态框
     *
     * 后续新增的 .settings-modal 会自动启用。
     * 如需排除，可添加 data-auto-close="false"。
     */
    shouldEnableAutoClose(modal) {
        if (!modal) return false;
        if (modal.dataset.autoClose === 'false') return false;

        return ![
            'settingsModal',
            'phraseModal'
        ].includes(modal.id);
    },

    setupAutoClose(modal) {
        if (!this.shouldEnableAutoClose(modal)) return;
        if (modal.dataset.autoCloseReady === 'true') return;

        const header = modal.querySelector('.settings-header');
        if (!header) return;

        modal.dataset.autoCloseReady = 'true';
        header.classList.add('has-auto-close');

        const control = document.createElement('div');
        control.className = 'modal-auto-close';

        control.innerHTML = `
            <button
                type="button"
                class="modal-auto-close-trigger"
                aria-label="设置自动关闭倒计时"
                aria-expanded="false"
                title="设置自动关闭倒计时"
            >
                <span class="modal-auto-close-icon" aria-hidden="true">⏱</span>
                <span class="modal-auto-close-text">自动关闭</span>
            </button>

            <div
                class="modal-auto-close-panel"
                role="dialog"
                aria-label="自动关闭设置"
            >
                <div class="modal-auto-close-panel-title">自动关闭</div>

                <div class="modal-auto-close-panel-description">
                    设置倒计时，时间结束后自动关闭此窗口
                </div>

                <div class="modal-auto-close-input-row">
                    <input
                        type="number"
                        class="modal-auto-close-input"
                        min="1"
                        max="1440"
                        value="30"
                        inputmode="numeric"
                        aria-label="倒计时时长"
                    >

                    <select
                        class="modal-auto-close-unit"
                        aria-label="倒计时时间单位"
                    >
                        <option value="1">秒</option>
                        <option value="60">分钟</option>
                    </select>
                </div>

                <div class="modal-auto-close-presets">
                    <button type="button" data-seconds="30">30秒</button>
                    <button type="button" data-seconds="60">1分钟</button>
                    <button type="button" data-seconds="300">5分钟</button>
                </div>

                <div class="modal-auto-close-actions">
                    <button
                        type="button"
                        class="modal-auto-close-cancel"
                    >
                        取消计时
                    </button>

                    <button
                        type="button"
                        class="modal-auto-close-start"
                    >
                        开始计时
                    </button>
                </div>
            </div>
        `;

        const lastHeaderItem = header.lastElementChild;

        if (lastHeaderItem) {
            header.insertBefore(control, lastHeaderItem);
        } else {
            header.appendChild(control);
        }

        const trigger = control.querySelector(
            '.modal-auto-close-trigger'
        );
        const panel = control.querySelector(
            '.modal-auto-close-panel'
        );
        const input = control.querySelector(
            '.modal-auto-close-input'
        );
        const unit = control.querySelector(
            '.modal-auto-close-unit'
        );
        const startButton = control.querySelector(
            '.modal-auto-close-start'
        );
        const cancelButton = control.querySelector(
            '.modal-auto-close-cancel'
        );

        trigger.addEventListener('click', event => {
            event.stopPropagation();

            const willOpen = !panel.classList.contains('is-open');

            this.closeAllAutoClosePanels();

            if (willOpen) {
                panel.classList.add('is-open');
                trigger.setAttribute('aria-expanded', 'true');
            }
        });

        panel.addEventListener('click', event => {
            event.stopPropagation();
        });

        startButton.addEventListener('click', () => {
            this.startAutoCloseFromControl(modal);
        });

        cancelButton.addEventListener('click', () => {
            this.stopAutoClose(modal);
            this.closeAutoClosePanel(modal);
        });

        input.addEventListener('keydown', event => {
            if (event.key !== 'Enter') return;

            event.preventDefault();
            this.startAutoCloseFromControl(modal);
        });

        input.addEventListener('input', () => {
            input.classList.remove('has-error');
        });

        control
            .querySelectorAll('.modal-auto-close-presets button')
            .forEach(button => {
                button.addEventListener('click', () => {
                    const seconds = Number(button.dataset.seconds);

                    if (seconds < 60) {
                        input.value = seconds;
                        unit.value = '1';
                    } else {
                        input.value = seconds / 60;
                        unit.value = '60';
                    }

                    this.startAutoClose(modal, seconds);
                });
            });

        this.updateAutoCloseUI(modal);
    },

    startAutoCloseFromControl(modal) {
        const control = modal.querySelector('.modal-auto-close');
        if (!control) return;

        const input = control.querySelector(
            '.modal-auto-close-input'
        );
        const unit = control.querySelector(
            '.modal-auto-close-unit'
        );

        const amount = Number(input.value);
        const multiplier = Number(unit.value);

        if (
            !Number.isFinite(amount) ||
            amount < 1 ||
            !Number.isFinite(multiplier)
        ) {
            input.classList.add('has-error');
            input.focus();
            return;
        }

        input.classList.remove('has-error');

        // 最长允许设置为 24 小时
        const seconds = Math.min(
            24 * 60 * 60,
            Math.max(1, Math.round(amount * multiplier))
        );

        this.startAutoClose(modal, seconds);
    },

    startAutoClose(modal, seconds) {
        if (
            !modal ||
            !Number.isFinite(seconds) ||
            seconds <= 0
        ) {
            return;
        }

        this.stopAutoClose(modal);

        const state = {
            endTime: Date.now() + seconds * 1000,
            intervalId: null
        };

        const update = () => {
            // 如果模态框已经被其他模块关闭，立即停止计时
            if (!modal.classList.contains('active')) {
                this.stopAutoClose(modal);
                return;
            }

            const remaining = Math.max(
                0,
                Math.ceil((state.endTime - Date.now()) / 1000)
            );

            if (remaining <= 0) {
                this.stopAutoClose(modal);
                this.requestAutomaticClose(modal);
                return;
            }

            this.updateAutoCloseUI(modal, remaining);
        };

        state.intervalId = window.setInterval(update, 250);
        this.timers.set(modal, state);

        if (!modal.classList.contains('auto-close-running')) {
            modal.classList.add('auto-close-running');
        }

        this.closeAutoClosePanel(modal);
        update();
    },

    stopAutoClose(modal) {
        if (!modal) return;

        const state = this.timers.get(modal);

        if (state?.intervalId !== null) {
            window.clearInterval(state.intervalId);
        }

        if (state) {
            this.timers.delete(modal);
        }

        /*
         * 必须先判断类名是否存在。
         * 避免 MutationObserver 因重复写入 class 而无限触发。
         */
        if (modal.classList.contains('auto-close-running')) {
            modal.classList.remove('auto-close-running');
        }

        this.updateAutoCloseUI(modal);
    },

    updateAutoCloseUI(modal, remainingSeconds = null) {
        const control = modal?.querySelector('.modal-auto-close');
        if (!control) return;

        const trigger = control.querySelector(
            '.modal-auto-close-trigger'
        );
        const text = control.querySelector(
            '.modal-auto-close-text'
        );
        const startButton = control.querySelector(
            '.modal-auto-close-start'
        );
        const cancelButton = control.querySelector(
            '.modal-auto-close-cancel'
        );

        const isRunning =
            this.timers.has(modal) &&
            Number.isFinite(remainingSeconds);

        trigger.classList.toggle('is-running', isRunning);
        cancelButton.classList.toggle('is-visible', isRunning);

        if (isRunning) {
            const duration = this.formatDuration(remainingSeconds);

            text.textContent = duration;
            startButton.textContent = '重新计时';
            trigger.title = `将在 ${duration} 后自动关闭`;
            trigger.setAttribute(
                'aria-label',
                `将在 ${duration} 后自动关闭，点击修改`
            );
        } else {
            text.textContent = '自动关闭';
            startButton.textContent = '开始计时';
            trigger.title = '设置自动关闭倒计时';
            trigger.setAttribute(
                'aria-label',
                '设置自动关闭倒计时'
            );
        }
    },

    formatDuration(totalSeconds) {
        const seconds = Math.max(
            0,
            Math.floor(totalSeconds)
        );
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainder = seconds % 60;

        if (hours > 0) {
            return [
                String(hours).padStart(2, '0'),
                String(minutes).padStart(2, '0'),
                String(remainder).padStart(2, '0')
            ].join(':');
        }

        return [
            String(minutes).padStart(2, '0'),
            String(remainder).padStart(2, '0')
        ].join(':');
    },

    requestAutomaticClose(modal) {
        if (!modal) return;

        const autoCloseEvent = new CustomEvent(
            'modal:auto-close',
            {
                bubbles: true,
                cancelable: true,
                detail: {
                    modalId: modal.id || null
                }
            }
        );

        // 其他模块可以通过 preventDefault() 阻止自动关闭
        if (!modal.dispatchEvent(autoCloseEvent)) return;

        /*
         * 直接关闭模态框。
         * 不再调用 closeButton.click()，避免再次触发关闭事件。
         */
        this.closeModal(modal);
    },

    closeModal(modal) {
        if (typeof modal === 'string') {
            modal = document.getElementById(modal);
        }

        if (!modal) return;

        // 防止其他事件处理器同步重复调用关闭逻辑
        if (this.closingModals.has(modal)) return;

        this.closingModals.add(modal);

        try {
            this.stopAutoClose(modal);
            this.closeAutoClosePanel(modal);

            if (modal.classList.contains('active')) {
                modal.classList.remove('active');
            }

            if (modal.id) {
                this.resetFullscreen(modal.id);
            }
        } finally {
            this.closingModals.delete(modal);
        }
    },

    closeAutoClosePanel(modal) {
        const control = modal?.querySelector('.modal-auto-close');
        if (!control) return;

        const panel = control.querySelector(
            '.modal-auto-close-panel'
        );
        const trigger = control.querySelector(
            '.modal-auto-close-trigger'
        );

        if (panel?.classList.contains('is-open')) {
            panel.classList.remove('is-open');
        }

        trigger?.setAttribute('aria-expanded', 'false');
    },

    closeAllAutoClosePanels() {
        document
            .querySelectorAll('.modal-auto-close-panel.is-open')
            .forEach(panel => {
                panel.classList.remove('is-open');

                panel
                    .closest('.modal-auto-close')
                    ?.querySelector('.modal-auto-close-trigger')
                    ?.setAttribute('aria-expanded', 'false');
            });
    },

    bindGlobalAutoCloseEvents() {
        document.addEventListener('click', event => {
            if (!event.target.closest('.modal-auto-close')) {
                this.closeAllAutoClosePanels();
            }
        });

        document.addEventListener('keydown', event => {
            if (event.key === 'Escape') {
                this.closeAllAutoClosePanels();
            }
        });
    },

    observeModals() {
        if (!document.body || this.modalObserver) return;

        this.modalObserver = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        if (!(node instanceof Element)) return;

                        if (node.matches('.settings-modal')) {
                            this.setupAutoClose(node);
                        }

                        node
                            .querySelectorAll?.('.settings-modal')
                            .forEach(modal => {
                                this.setupAutoClose(modal);
                            });
                    });

                    return;
                }

                if (
                    mutation.type !== 'attributes' ||
                    !(mutation.target instanceof Element) ||
                    !mutation.target.matches('.settings-modal')
                ) {
                    return;
                }

                const modal = mutation.target;
                const oldClasses = mutation.oldValue || '';

                const wasActive = oldClasses
                    .split(/\s+/)
                    .includes('active');

                const isActive =
                    modal.classList.contains('active');

                /*
                 * 只在 active 确实从“存在”变成“不存在”时处理。
                 * auto-close-running 等其他类名变化不会触发关闭处理。
                 */
                if (wasActive && !isActive) {
                    this.stopAutoClose(modal);
                    this.closeAutoClosePanel(modal);

                    if (modal.id) {
                        this.resetFullscreen(modal.id);
                    }
                }
            });
        });

        this.modalObserver.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class'],
            attributeOldValue: true
        });
    },

    resetFullscreen(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        if (modal.classList.contains('fullscreen')) {
            modal.classList.remove('fullscreen');
        }

        const maxButton = modal.querySelector('.maximize-btn');

        if (maxButton) {
            maxButton.textContent = '⛶';
        }
    },

    injectAutoCloseStyles() {
        if (document.getElementById('modalAutoCloseStyles')) return;

        const style = document.createElement('style');
        style.id = 'modalAutoCloseStyles';

        style.textContent = `
            .settings-header.has-auto-close {
                overflow: visible;
            }

            .modal-auto-close {
                position: relative;
                display: flex;
                align-items: center;
                margin-left: auto;
                margin-right: 10px;
                font-size: 14px;
                line-height: 1;
                flex-shrink: 0;
            }

            .modal-auto-close-trigger {
                height: 34px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
                padding: 0 12px;
                border: 1px solid #dfe5ec;
                border-radius: 9px;
                background: #f7f9fc;
                color: #586574;
                font-family: inherit;
                font-size: 13px;
                cursor: pointer;
                outline: none;
                white-space: nowrap;
                transition:
                    color .2s ease,
                    border-color .2s ease,
                    background .2s ease,
                    box-shadow .2s ease,
                    transform .2s ease;
            }

            .modal-auto-close-trigger:hover {
                color: #2878e8;
                border-color: #9bc2f5;
                background: #eef6ff;
                box-shadow:
                    0 3px 10px rgba(40, 120, 232, .12);
            }

            .modal-auto-close-trigger:active {
                transform: translateY(1px);
            }

            .modal-auto-close-trigger:focus-visible {
                border-color: #2878e8;
                box-shadow:
                    0 0 0 3px rgba(40, 120, 232, .16);
            }

            .modal-auto-close-trigger.is-running {
                color: #fff;
                border-color: #2878e8;
                background:
                    linear-gradient(135deg, #438cf5, #216bd5);
                box-shadow:
                    0 4px 12px rgba(40, 120, 232, .24);
            }

            .modal-auto-close-icon {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                font-size: 15px;
            }

            .modal-auto-close-trigger.is-running
            .modal-auto-close-icon {
                animation:
                    modal-timer-pulse 1.4s ease-in-out infinite;
            }

            .modal-auto-close-text {
                min-width: 52px;
                text-align: center;
                font-variant-numeric: tabular-nums;
            }

            .modal-auto-close-panel {
                position: absolute;
                top: calc(100% + 10px);
                right: 0;
                z-index: 100002;
                width: 270px;
                padding: 16px;
                border:
                    1px solid rgba(24, 39, 58, .1);
                border-radius: 13px;
                background: rgba(255, 255, 255, .98);
                box-shadow:
                    0 18px 45px rgba(30, 45, 65, .18),
                    0 4px 12px rgba(30, 45, 65, .08);
                box-sizing: border-box;
                opacity: 0;
                visibility: hidden;
                pointer-events: none;
                transform: translateY(-6px) scale(.98);
                transform-origin: top right;
                transition:
                    opacity .18s ease,
                    visibility .18s ease,
                    transform .18s ease;
                backdrop-filter: blur(10px);
            }

            .modal-auto-close-panel::before {
                content: "";
                position: absolute;
                top: -6px;
                right: 25px;
                width: 11px;
                height: 11px;
                border-top:
                    1px solid rgba(24, 39, 58, .1);
                border-left:
                    1px solid rgba(24, 39, 58, .1);
                background: #fff;
                transform: rotate(45deg);
            }

            .modal-auto-close-panel.is-open {
                opacity: 1;
                visibility: visible;
                pointer-events: auto;
                transform: translateY(0) scale(1);
            }

            .modal-auto-close-panel-title {
                position: relative;
                z-index: 1;
                margin-bottom: 5px;
                color: #263445;
                font-size: 15px;
                font-weight: 600;
                line-height: 1.4;
            }

            .modal-auto-close-panel-description {
                margin-bottom: 13px;
                color: #8a96a5;
                font-size: 12px;
                line-height: 1.5;
            }

            .modal-auto-close-input-row {
                display: grid;
                grid-template-columns:
                    minmax(0, 1fr) 86px;
                gap: 8px;
            }

            .modal-auto-close-input,
            .modal-auto-close-unit {
                width: 100%;
                height: 38px;
                padding: 0 11px;
                border: 1px solid #dce3eb;
                border-radius: 8px;
                background: #fff;
                color: #344154;
                font-family: inherit;
                font-size: 14px;
                box-sizing: border-box;
                outline: none;
                transition:
                    border-color .2s ease,
                    box-shadow .2s ease;
            }

            .modal-auto-close-input:focus,
            .modal-auto-close-unit:focus {
                border-color: #438cf5;
                box-shadow:
                    0 0 0 3px rgba(67, 140, 245, .14);
            }

            .modal-auto-close-input.has-error {
                border-color: #ef5350;
                box-shadow:
                    0 0 0 3px rgba(239, 83, 80, .13);
            }

            .modal-auto-close-unit {
                cursor: pointer;
            }

            .modal-auto-close-presets {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 7px;
                margin-top: 10px;
            }

            .modal-auto-close-presets button {
                height: 30px;
                padding: 0 6px;
                border: 1px solid #e1e7ee;
                border-radius: 7px;
                background: #f7f9fc;
                color: #667386;
                font-family: inherit;
                font-size: 12px;
                cursor: pointer;
                transition:
                    color .2s ease,
                    border-color .2s ease,
                    background .2s ease;
            }

            .modal-auto-close-presets button:hover {
                color: #2878e8;
                border-color: #acd0fb;
                background: #edf6ff;
            }

            .modal-auto-close-actions {
                display: flex;
                justify-content: flex-end;
                gap: 8px;
                margin-top: 15px;
            }

            .modal-auto-close-actions button {
                height: 34px;
                padding: 0 13px;
                border-radius: 8px;
                font-family: inherit;
                font-size: 13px;
                cursor: pointer;
                transition:
                    background .2s ease,
                    border-color .2s ease,
                    color .2s ease;
            }

            .modal-auto-close-cancel {
                display: none;
                border: 1px solid #e1e6ec;
                background: #fff;
                color: #687587;
            }

            .modal-auto-close-cancel.is-visible {
                display: inline-flex;
                align-items: center;
                justify-content: center;
            }

            .modal-auto-close-cancel:hover {
                color: #e14b4b;
                border-color: #f0b0b0;
                background: #fff6f6;
            }

            .modal-auto-close-start {
                border: 1px solid #2878e8;
                background:
                    linear-gradient(135deg, #438cf5, #216bd5);
                color: #fff;
                box-shadow:
                    0 3px 8px rgba(40, 120, 232, .2);
            }

            .modal-auto-close-start:hover {
                border-color: #1f67c9;
                background:
                    linear-gradient(135deg, #3883ee, #195fc5);
            }

            @keyframes modal-timer-pulse {
                0%,
                100% {
                    opacity: 1;
                    transform: scale(1);
                }

                50% {
                    opacity: .68;
                    transform: scale(.9);
                }
            }

            @media (max-width: 720px) {
                .modal-auto-close {
                    margin-right: 6px;
                }

                .modal-auto-close-trigger {
                    width: 34px;
                    padding: 0;
                }

                .modal-auto-close-text {
                    display: none;
                }

                .modal-auto-close-panel {
                    right: -42px;
                    width: 250px;
                }
            }
        `;

        document.head.appendChild(style);
    }
};