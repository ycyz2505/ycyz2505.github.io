// ============================================================
// js/features/modal_countdown.js
// 自定义倒计日模态框
// - 添加 / 修改 / 删除倒计日
// - locked 条目（高考）不可修改 / 删除
// - 修改后自动保存到本地存储
// ============================================================

window.App = window.App || {};

window.App.ModalCountdown = {
    init() {
        this.bindEvents();
        this.render();
    },

    bindEvents() {
        document
            .getElementById('openCountdownModal')
            ?.addEventListener('click', () => {
                window.setTimeout(() => this.render(), 0);
            });

        document
            .getElementById('addCountdown')
            ?.addEventListener('click', () => {
                this.add();
            });

        // 点击其它地方时复位删除按钮
        document.addEventListener('click', e => {
            if (!e.target.closest('.countdown-del-btn')) {
                document
                    .querySelectorAll('#countdownList .countdown-del-btn')
                    .forEach(btn => {
                        btn.textContent = '删除';
                        btn.style.background = '';
                    });
            }
        });
    },

    // ---------- 数据 ----------
    getList() {
        if (window.App.Store) {
            const list = window.App.Store.get('countdowns');
            if (Array.isArray(list)) {
                return list.map(item => Object.assign({}, item));
            }
        }
        if (
            typeof defaultCountdowns !== 'undefined' &&
            Array.isArray(defaultCountdowns)
        ) {
            return defaultCountdowns.map(item => Object.assign({}, item));
        }
        return [];
    },

    saveList(list) {
        if (window.App.Store) window.App.Store.set('countdowns', list);
    },

    genId() {
        return (
            'c' +
            Date.now().toString(36) +
            Math.random().toString(36).slice(2, 7)
        );
    },

    formatDateForInput(dateStr) {
        if (!dateStr) return '';
        return String(dateStr).slice(0, 10);
    },

    // ---------- 渲染 ----------
    render() {
        const container = document.getElementById('countdownList');
        if (!container) return;

        const list = this.getList();
        const activeId = window.App.Countdown?.getActiveId?.() || null;

        if (!list.length) {
            container.innerHTML =
                '<div class="countdown-empty">还没有倒计日</div>';
            return;
        }

        container.innerHTML = list
            .map(item => {
                const locked = !!item.locked;
                const active = item.id === activeId;

                return `
                    <div class="countdown-row${active ? ' active' : ''}"
                         data-id="${this.escAttr(item.id)}">
                        <input
                            class="countdown-name-input"
                            type="text"
                            value="${this.escAttr(item.name)}"
                            placeholder="名称"
                            maxlength="24"
                            ${locked ? 'readonly' : ''}
                        >
                        <input
                            class="countdown-date-input"
                            type="date"
                            value="${this.escAttr(this.formatDateForInput(item.date))}"
                            ${locked ? 'readonly' : ''}
                        >
                        ${
                            locked
                                ? '<span class="countdown-locked">已锁定</span>'
                                : `<button type="button" class="countdown-del-btn" data-id="${this.escAttr(item.id)}">删除</button>`
                        }
                    </div>
                `;
            })
            .join('');

        this.bindItemEvents(container);
    },

    bindItemEvents(container) {
        container.querySelectorAll('.countdown-row').forEach(row => {
            const id = row.dataset.id;
            const nameInput = row.querySelector('.countdown-name-input');
            const dateInput = row.querySelector('.countdown-date-input');

            nameInput?.addEventListener('input', () => {
                const list = this.getList();
                const item = list.find(c => c.id === id);
                if (!item || item.locked) return;

                item.name = nameInput.value;
                this.saveList(list);
                window.App.Countdown?.update?.();
            });

            dateInput?.addEventListener('change', () => {
                const list = this.getList();
                const item = list.find(c => c.id === id);
                if (!item || item.locked) return;
                if (!dateInput.value) return;

                item.date = dateInput.value;
                this.saveList(list);
                window.App.Countdown?.update?.();
            });
        });

        container
            .querySelectorAll('.countdown-del-btn')
            .forEach(btn => {
                btn.addEventListener('click', e => {
                    e.stopPropagation();

                    const id = btn.dataset.id;
                    if (!id) return;

                    if (btn.textContent === '删除') {
                        btn.textContent = '确认删除';
                        btn.style.background = '#d32f2f';
                    } else {
                        this.remove(id);
                    }
                });
            });
    },

    // ---------- 添加 ----------
    add() {
        const list = this.getList();
        const today = window.App.Utils ? window.App.Utils.now() : new Date();
        const target = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate() + 30
        );

        const pad = n => String(n).padStart(2, '0');
        const dateStr = `${target.getFullYear()}-${pad(
            target.getMonth() + 1
        )}-${pad(target.getDate())}`;

        list.push({
            id: this.genId(),
            name: '新的倒计日',
            date: dateStr,
            locked: false
        });

        this.saveList(list);
        this.render();

        const container = document.getElementById('countdownList');
        if (container) {
            container.scrollTop = container.scrollHeight;

            const lastInput = container.querySelector(
                '.countdown-row:last-child .countdown-name-input'
            );

            if (lastInput) {
                lastInput.focus();
                if (lastInput.select) lastInput.select();
            }
        }
    },

    // ---------- 删除 ----------
    remove(id) {
        const list = this.getList();
        const index = list.findIndex(c => c.id === id);

        if (index < 0) return;
        if (list[index].locked) return;

        list.splice(index, 1);
        this.saveList(list);

        const activeId = window.App.Store?.getSetting('activeCountdownId');

        if (activeId === id) {
            window.App.Store?.setSetting(
                'activeCountdownId',
                list.length ? list[0].id : null
            );
        }

        this.render();
        window.App.Countdown?.update?.();
    },

    // ---------- 工具 ----------
    escAttr(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
};