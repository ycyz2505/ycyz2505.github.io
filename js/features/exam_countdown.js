// ============================================================
// js/features/exam_countdown.js
// 首页倒计日：默认高考倒计时，支持多个自定义倒计日
// - 高考倒计日为固定项，不可删除/修改
// - 首页在倒计日区域左右滑动（或点击圆点）切换
// - 列表与“当前展示”均持久化在 App.Store 的 settings 中
// ============================================================

window.App.ExamCountdown = {
    // 固定倒计日：高考
    FIXED: {
        id: 'gaokao',
        name: '2028年高考',
        date: '2028-06-07',
        fixed: true
    },

    _timer: null,
    _swipeBound: false,
    _suppressClickUntil: 0,

    init() {
        this.syncStore();
        this.bindSwipe();
        this.update();
        this.renderDots();
    },

    // ---------- 数据层 ----------

    getList() {
        const raw = window.App.Store ? window.App.Store.getSetting('countdowns') : null;
        return this._normalize(raw);
    },

    getActiveId() {
        const raw = window.App.Store ? window.App.Store.getSetting('activeCountdownId') : '';
        return this._resolveActiveId(raw);
    },

    getActive() {
        const list = this.getList();
        const id = this.getActiveId();
        return list.find(x => x.id === id) || list[0];
    },

    // 切换当前展示的倒计日（options.direction 可选，用于播放切换动画）
    setActive(id, options) {
        const list = this.getList();
        if (!list.some(x => x.id === id)) return;

        const oldId = this.getActiveId();
        if (oldId === id) return;

        if (window.App.Store) {
            window.App.Store.setSetting('activeCountdownId', id);
        }

        let direction = options && options.direction;
        if (typeof direction !== 'number') {
            const from = list.findIndex(x => x.id === oldId);
            const to = list.findIndex(x => x.id === id);
            direction = to >= from ? 1 : -1;
        }

        this.update();
        this.renderDots();
        this._animateSwitch(direction);
    },

    // 前后切换：dir = 1 下一个 / -1 上一个（供滑动调用）
    step(dir) {
        const list = this.getList();
        if (list.length < 2) return;

        const current = Math.max(0, list.findIndex(x => x.id === this.getActiveId()));
        const next = (current + dir + list.length) % list.length;
        this.setActive(list[next].id, { direction: dir });
    },

    // ---------- 增删改（供自定义倒计日弹窗调用） ----------

    addCountdown(name, date) {
        const cleanName = String(name || '').trim();
        const isoDate = this.parseDate(date);

        if (!cleanName) return { ok: false, error: '请输入名称' };
        if (cleanName.length > 20) return { ok: false, error: '名称最多 20 个字符' };
        if (!isoDate) return { ok: false, error: '请选择正确的日期' };

        const list = this.getList();
        const item = { id: this._newId(), name: cleanName, date: isoDate };
        list.push(item);
        this._persistList(list);
        this.update();
        this.renderDots();

        return { ok: true, item };
    },

    updateCountdown(id, name, date) {
        const list = this.getList();
        const item = list.find(x => x.id === id);
        if (!item || item.fixed) return { ok: false, error: '该倒计日不可修改' };

        const cleanName = String(name || '').trim();
        const isoDate = this.parseDate(date);

        if (!cleanName) return { ok: false, error: '请输入名称' };
        if (cleanName.length > 20) return { ok: false, error: '名称最多 20 个字符' };
        if (!isoDate) return { ok: false, error: '请选择正确的日期' };

        item.name = cleanName;
        item.date = isoDate;
        this._persistList(list);
        this.update();
        this.renderDots();

        return { ok: true, item };
    },

    removeCountdown(id) {
        const list = this.getList();
        const item = list.find(x => x.id === id);
        if (!item || item.fixed) return { ok: false, error: '该倒计日不可删除' };

        this._persistList(list.filter(x => x.id !== id));

        if (this.getActiveId() === id) {
            if (window.App.Store) {
                window.App.Store.setSetting('activeCountdownId', this.FIXED.id);
            }
        }

        this.update();
        this.renderDots();
        return { ok: true };
    },

    // ---------- 持久化辅助 ----------

    // 让存储中的列表/当前项始终合法（首次运行、数据损坏时自动修复）
    syncStore() {
        if (!window.App.Store) return;

        const raw = window.App.Store.getSetting('countdowns');
        const stored = this._toStored(this._normalize(raw));
        if (JSON.stringify(stored) !== JSON.stringify(raw || null)) {
            window.App.Store.setSetting('countdowns', stored);
        }

        const rawActive = window.App.Store.getSetting('activeCountdownId');
        const activeId = this._resolveActiveId(rawActive);
        if (rawActive !== activeId) {
            window.App.Store.setSetting('activeCountdownId', activeId);
        }
    },

    _persistList(list) {
        if (window.App.Store) {
            window.App.Store.setSetting('countdowns', this._toStored(list));
        }
    },

    // 规范化：固定项永远存在且名称/日期不可被篡改，其余项过滤非法数据
    _normalize(raw) {
        const list = [Object.assign({}, this.FIXED)];

        if (Array.isArray(raw)) {
            raw.forEach(item => {
                if (!item || typeof item !== 'object') return;

                const id = String(item.id || '').trim();
                if (!id || id === this.FIXED.id) return;
                if (list.some(x => x.id === id)) return;

                const name = String(item.name || '').trim();
                const date = this.parseDate(item.date);
                if (!name || !date) return;

                list.push({ id, name, date });
            });
        }

        return list;
    },

    _toStored(list) {
        return list.map(item => ({
            id: item.id,
            name: item.name,
            date: item.date
        }));
    },

    _resolveActiveId(raw) {
        const id = String(raw || '');
        const list = this.getList();
        return list.some(x => x.id === id) ? id : this.FIXED.id;
    },

    _newId() {
        return 'cd_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
    },

    // ---------- 日期工具 ----------

    // 支持 2028-06-07 / 2028.6.7 / 2028年6月7日 等写法，返回标准 ISO 字符串；非法返回 null
    parseDate(value) {
        if (typeof value !== 'string') return null;

        const m = value.trim().match(/^(\d{4})[-/.年](\d{1,2})[-/.月](\d{1,2})日?$/);
        if (!m) return null;

        const year = Number(m[1]);
        const month = Number(m[2]);
        const day = Number(m[3]);
        if (year < 1900 || year > 2200 || month < 1 || month > 12 || day < 1 || day > 31) return null;

        const d = new Date(year, month - 1, day);
        if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return null;

        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    },

    // 显示用：2028-06-07 → 2028.6.7
    formatDate(iso) {
        const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (!m) return String(iso || '');
        return `${m[1]}.${Number(m[2])}.${Number(m[3])}`;
    },

    _dateOf(iso) {
        const parts = String(iso || '').split('-').map(Number);
        return new Date(parts[0], parts[1] - 1, parts[2]);
    },

    // ---------- 首页展示 ----------

    update() {
        if (this._timer) {
            clearTimeout(this._timer);
            this._timer = null;
        }

        const active = this.getActive();
        const titleEl = document.getElementById('countdownTitle');
        const daysEl = document.getElementById('daysUntil');

        if (titleEl) titleEl.textContent = `距离${active.name}仅剩`;

        const now = window.App.Utils.now();
        const diff = this._dateOf(active.date) - now;
        const days = Math.max(0, Math.ceil(diff / 86400000));
        if (daysEl) daysEl.textContent = `${days}天`;

        // 下一个“业务时间”的午夜
        const nextMidnight = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() + 1
        );
        this._timer = setTimeout(() => this.update(), nextMidnight - now);
    },

    renderDots() {
        const nav = document.getElementById('countdownNav');
        const dots = document.getElementById('countdownDots');
        if (!nav || !dots) return;

        const list = this.getList();
        if (list.length <= 1) {
            nav.classList.remove('visible');
            dots.innerHTML = '';
            return;
        }

        const activeId = this.getActiveId();
        const esc = window.App.Utils.escapeHtml;
        dots.innerHTML = list.map(item =>
            `<span class="countdown-dot${item.id === activeId ? ' active' : ''}"` +
            ` data-id="${esc(item.id)}" title="${esc(item.name)}"></span>`
        ).join('');
        nav.classList.add('visible');
    },

    _animateSwitch(direction) {
        const cls = direction >= 0 ? 'countdown-swap-next' : 'countdown-swap-prev';

        ['countdownTitle', 'daysUntil'].forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            el.classList.remove('countdown-swap-next', 'countdown-swap-prev');
            void el.offsetWidth; // 强制重排以重新触发动画
            el.classList.add(cls);
        });
    },

    // ---------- 滑动切换 ----------

    bindSwipe() {
        const zone = document.getElementById('countdownZone');
        if (!zone || this._swipeBound) return;
        this._swipeBound = true;

        let startX = 0;
        let startY = 0;
        let tracking = false;
        let switched = false;

        const onPointerDown = e => {
            if (tracking) return;
            if (e.pointerType === 'mouse' && e.button !== 0) return;
            tracking = true;
            switched = false;
            startX = e.clientX;
            startY = e.clientY;
            try { zone.setPointerCapture(e.pointerId); } catch (err) { /* 忽略 */ }
        };

        const onPointerMove = e => {
            if (!tracking || switched) return;

            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.2) return;

            switched = true;
            this._suppressClickUntil = Date.now() + 400; // 滑动后短暂屏蔽 click
            this.step(dx < 0 ? 1 : -1);
        };

        const onPointerUp = e => {
            tracking = false;
            switched = false;
            try { zone.releasePointerCapture(e.pointerId); } catch (err) { /* 忽略 */ }
        };

        zone.addEventListener('pointerdown', onPointerDown);
        zone.addEventListener('pointermove', onPointerMove);
        zone.addEventListener('pointerup', onPointerUp);
        zone.addEventListener('pointercancel', onPointerUp);

        zone.addEventListener('click', e => {
            if (Date.now() < this._suppressClickUntil) {
                e.stopPropagation();
                e.preventDefault();
            }
        }, true);

        document.getElementById('countdownDots')?.addEventListener('click', e => {
            const dot = e.target.closest('.countdown-dot');
            if (!dot) return;
            if (Date.now() < this._suppressClickUntil) return;
            this.setActive(dot.dataset.id);
        });
    }
};
