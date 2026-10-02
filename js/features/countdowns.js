// ============================================================
// js/features/countdown.js
// 首页倒计日展示 + 左右滑动切换
// - 数据来源：Store 的 countdowns 数据键
// - 当前展示哪一个：Store.settings.activeCountdownId
// - 兼容旧接口：window.App.ExamCountdown 指向本模块
// ============================================================

window.App = window.App || {};

window.App.Countdown = {
    _timer: null,

    init() {
        try {
            this.bindSwipe();
            this.bindDots();
        } catch (e) {
            console.warn('[Countdown] 交互绑定失败：', e);
        }

        this.update();
    },

    // ---------- 数据 ----------
    getDefaults() {
        if (typeof defaultCountdowns !== 'undefined' && Array.isArray(defaultCountdowns)) {
            return defaultCountdowns;
        }
        if (window.defaultCountdowns && Array.isArray(window.defaultCountdowns)) {
            return window.defaultCountdowns;
        }
        return [
            { id: 'gaokao', name: '2028年高考', date: '2028-06-07', locked: true }
        ];
    },

    getList() {
        let list = null;

        if (window.App.Store) {
            list = window.App.Store.get('countdowns');
        }

        if (Array.isArray(list) && list.length) return list;
        return this.getDefaults();
    },

    getActiveId() {
        const list = this.getList();
        let id = null;

        if (window.App.Store) {
            id = window.App.Store.getSetting('activeCountdownId');
        }

        if (id && list.some(item => item.id === id)) return id;
        return list.length ? list[0].id : null;
    },

    setActiveId(id) {
        if (window.App.Store) {
            window.App.Store.setSetting('activeCountdownId', id);
        }
    },

    getActiveItem() {
        const list = this.getList();
        if (!list.length) return null;

        const id = this.getActiveId();
        return list.find(item => item.id === id) || list[0];
    },

    // ---------- 渲染 ----------
    update() {
        if (this._timer) {
            clearTimeout(this._timer);
            this._timer = null;
        }

        const list = this.getList();
        const item = this.getActiveItem();

        if (!item) {
            const titleEl = document.getElementById('countdownTitle');
            const valueEl = document.getElementById('daysUntil');
            if (titleEl) titleEl.textContent = '';
            if (valueEl) valueEl.textContent = '—';
            this.renderDots(list, null);
            return;
        }

        this.renderItem(item);
        this.renderDots(list, item.id);

        // 到下一个虚拟午夜时刷新
        const now = window.App.Utils
            ? window.App.Utils.now()
            : new Date();

        const nextMidnight = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() + 1
        );

        this._timer = setTimeout(
            () => this.update(),
            Math.max(1000, nextMidnight - now)
        );
    },

    renderItem(item) {
        const titleEl = document.getElementById('countdownTitle');
        const valueEl = document.getElementById('daysUntil');
        if (!titleEl || !valueEl) return;

        const parts = String(item.date || '')
            .split('-')
            .map(Number);

        if (parts.length !== 3 || parts.some(n => !Number.isFinite(n))) {
            titleEl.textContent = item.name ? `距离${item.name}仅剩` : '';
            valueEl.textContent = '—';
            return;
        }

        const target = new Date(parts[0], parts[1] - 1, parts[2]);
        const now = window.App.Utils
            ? window.App.Utils.now()
            : new Date();

        const diff = target.getTime() - now.getTime();

        if (diff >= 0) {
            const days = Math.max(0, Math.ceil(diff / 86400000));
            titleEl.textContent = `距离${item.name}仅剩`;
            valueEl.textContent = `${days}天`;
        } else {
            const days = Math.max(1, Math.ceil(-diff / 86400000));
            titleEl.textContent = `${item.name}已过去`;
            valueEl.textContent = `${days}天`;
        }
    },

    renderDots(list, activeId) {
        const dotsEl = document.getElementById('countdownDots');
        if (!dotsEl) return;

        if (!list || list.length <= 1) {
            dotsEl.innerHTML = '';
            return;
        }

        dotsEl.innerHTML = list
            .map(item => {
                const active = item.id === activeId;
                return `<button type="button" class="countdown-dot${active ? ' active' : ''}" data-id="${this.escAttr(item.id)}" aria-label="${this.escAttr(item.name)}"></button>`;
            })
            .join('');
    },

    // ---------- 切换 ----------
    next() {
        const list = this.getList();
        if (list.length <= 1) return;

        const index = list.findIndex(item => item.id === this.getActiveId());
        const nextIndex = (index + 1) % list.length;
        this.switchTo(list[nextIndex].id, 1);
    },

    prev() {
        const list = this.getList();
        if (list.length <= 1) return;

        const index = list.findIndex(item => item.id === this.getActiveId());
        const prevIndex = (index - 1 + list.length) % list.length;
        this.switchTo(list[prevIndex].id, -1);
    },

    switchTo(id, direction) {
        if (!id || id === this.getActiveId()) return;

        this.setActiveId(id);

        const content = document.getElementById('countdownContent');

        // 没找到容器时直接渲染，不做动画
        if (!content) {
            this.update();
            return;
        }

        const dir = direction >= 0 ? 1 : -1;

        content.style.transition = 'opacity .18s ease, transform .18s ease';
        content.style.opacity = '0';
        content.style.transform = `translateX(${-20 * dir}px)`;

        window.setTimeout(() => {
            // 先更新文本
            this.update();

            // 无动画地瞬移到进入位置
            content.style.transition = 'none';
            content.style.transform = `translateX(${20 * dir}px)`;
            void content.offsetWidth;

            // 再动画滑入
            content.style.transition = 'opacity .22s ease, transform .22s ease';
            content.style.opacity = '1';
            content.style.transform = 'translateX(0)';
        }, 180);
    },

    // ---------- 交互绑定 ----------
    bindSwipe() {
        const area = document.getElementById('countdownArea');
        if (!area) return;

        let startX = 0;
        let startY = 0;
        let active = false;

        area.addEventListener('pointerdown', e => {
            if (e.pointerType === 'mouse' && e.button !== 0) return;
            startX = e.clientX;
            startY = e.clientY;
            active = true;
        });

        area.addEventListener('pointerup', e => {
            if (!active) return;
            active = false;

            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            if (Math.abs(dx) < 50) return;
            if (Math.abs(dx) < Math.abs(dy) * 1.5) return;

            if (dx < 0) this.next();
            else this.prev();
        });

        area.addEventListener('pointercancel', () => {
            active = false;
        });
    },

    bindDots() {
        const dotsEl = document.getElementById('countdownDots');
        if (!dotsEl) return;

        dotsEl.addEventListener('click', e => {
            const dot = e.target.closest('.countdown-dot');
            if (!dot) return;

            const id = dot.dataset.id;
            if (!id || id === this.getActiveId()) return;

            this.switchTo(id, 1);
        });
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

// 兼容旧接口（exam_countdown 相关引用）
window.App.ExamCountdown = window.App.Countdown;