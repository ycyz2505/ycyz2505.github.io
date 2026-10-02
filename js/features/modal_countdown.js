// ============================================================
// js/features/modal_countdown.js
// 自定义倒计日管理弹窗：添加 / 修改 / 删除 / 切换首页展示
// 数据层由 App.ExamCountdown 提供，均保存在本地存储中
// ============================================================

window.App.ModalCountdown = {
    _editingId: null,
    _confirming: null,   // { id, timer }
    _statusTimer: null,

    init() {
        this.bindAddForm();
        this.bindList();
        this.render();

        // 每次打开弹窗时刷新列表（可能在首页滑动切换过）
        document.getElementById('openCountdownModal')?.addEventListener('click', () => {
            this._editingId = null;
            this.setStatus('');
            this.render();
        });
    },

    // ---------- 列表交互 ----------

    bindList() {
        const listEl = document.getElementById('countdownList');
        if (!listEl) return;

        listEl.addEventListener('click', e => {
            const row = e.target.closest('.countdown-row');
            if (!row) return;

            const id = row.dataset.id;
            const actionEl = e.target.closest('[data-action]');

            if (actionEl) {
                e.stopPropagation();
                const action = actionEl.dataset.action;
                if (action === 'edit') this.startEdit(id);
                else if (action === 'delete') this.confirmDelete(id);
                else if (action === 'save-edit') this.saveEdit(row);
                else if (action === 'cancel-edit') this.cancelEdit();
                return;
            }

            if (row.classList.contains('editing')) return;
            if (e.target.closest('input, button')) return;

            // 点击列表项 → 设为首页展示
            window.App.ExamCountdown.setActive(id);
            this.render();
        });

        // 编辑时按回车保存
        listEl.addEventListener('keydown', e => {
            if (e.key !== 'Enter') return;
            if (!e.target.closest('.countdown-row.editing')) return;
            e.preventDefault();
            const row = e.target.closest('.countdown-row');
            if (row) this.saveEdit(row);
        });
    },

    startEdit(id) {
        const item = window.App.ExamCountdown.getList().find(x => x.id === id);
        if (!item || item.fixed) return; // 固定项不可编辑

        this._editingId = id;
        this.setStatus('');
        this.render();

        const input = document.querySelector('#countdownList .countdown-row.editing .countdown-name-input');
        input?.focus();
    },

    cancelEdit() {
        if (!this._editingId) return;
        this._editingId = null;
        this.render();
    },

    saveEdit(row) {
        const id = row?.dataset.id;
        if (!id) return;

        const nameInput = row.querySelector('.countdown-name-input');
        const dateInput = row.querySelector('.countdown-date-input');
        const result = window.App.ExamCountdown.updateCountdown(id, nameInput?.value, dateInput?.value);

        if (!result.ok) {
            this.setStatus(result.error, true);
            return;
        }

        this._editingId = null;
        this.setStatus(`已保存“${result.item.name}”`);
        this.render();
    },

    confirmDelete(id) {
        const item = window.App.ExamCountdown.getList().find(x => x.id === id);
        if (!item || item.fixed) return; // 固定项不可删除

        // 两步确认，避免误触（3 秒后自动恢复）
        if (this._confirming && this._confirming.id === id) {
            clearTimeout(this._confirming.timer);
            this._confirming = null;
            window.App.ExamCountdown.removeCountdown(id);
            this.setStatus(`已删除“${item.name}”`);
            this.render();
            return;
        }

        if (this._confirming) clearTimeout(this._confirming.timer);
        this._confirming = {
            id,
            timer: setTimeout(() => {
                this._confirming = null;
                this.render();
            }, 3000)
        };
        this.render();
    },

    // ---------- 添加表单 ----------

    bindAddForm() {
        const addBtn = document.getElementById('countdownAddBtn');
        const form = document.getElementById('countdownAddForm');
        const confirmBtn = document.getElementById('countdownAddConfirm');
        const cancelBtn = document.getElementById('countdownAddCancel');
        const nameInput = document.getElementById('countdownNewName');
        const dateInput = document.getElementById('countdownNewDate');

        addBtn?.addEventListener('click', () => {
            this.cancelEdit();
            this.setStatus('');
            if (dateInput && !dateInput.value) dateInput.value = this._defaultDate();
            form?.classList.add('open');
            addBtn.style.display = 'none';
            nameInput?.focus();
        });

        cancelBtn?.addEventListener('click', () => this.hideAddForm());

        confirmBtn?.addEventListener('click', () => {
            const result = window.App.ExamCountdown.addCountdown(nameInput?.value, dateInput?.value);
            if (!result.ok) {
                this.setStatus(result.error, true);
                return;
            }

            if (nameInput) nameInput.value = '';
            if (dateInput) dateInput.value = '';
            this.hideAddForm();
            this.setStatus(`已添加“${result.item.name}”`);
            this.render();
        });

        nameInput?.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                e.preventDefault();
                confirmBtn?.click();
            }
        });
    },

    hideAddForm() {
        document.getElementById('countdownAddForm')?.classList.remove('open');
        const addBtn = document.getElementById('countdownAddBtn');
        if (addBtn) addBtn.style.display = '';
    },

    // 默认日期：30 天后（避免默认过去日期）
    _defaultDate() {
        const d = window.App.Utils.now();
        const target = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 30);
        const pad = n => String(n).padStart(2, '0');
        return `${target.getFullYear()}-${pad(target.getMonth() + 1)}-${pad(target.getDate())}`;
    },

    // ---------- 渲染 ----------

    render() {
        const listEl = document.getElementById('countdownList');
        if (!listEl) return;

        const countdown = window.App.ExamCountdown;
        const esc = window.App.Utils.escapeHtml;
        const list = countdown.getList();
        const activeId = countdown.getActiveId();

        if (this._editingId && !list.some(x => x.id === this._editingId)) {
            this._editingId = null;
        }

        listEl.innerHTML = list.map(item =>
            item.id === this._editingId
                ? this._renderEditRow(item, esc)
                : this._renderRow(item, item.id === activeId, esc)
        ).join('');

        const meta = document.getElementById('countdownEditorMeta');
        if (meta) {
            const active = list.find(x => x.id === activeId);
            meta.textContent = `共 ${list.length} 个 · 首页显示：${active ? active.name : '—'}`;
        }
    },

    _renderRow(item, isActive, esc) {
        const confirming = !!(this._confirming && this._confirming.id === item.id);

        const tags = [
            item.fixed ? '<span class="countdown-tag">固定</span>' : '',
            isActive ? '<span class="countdown-tag active-tag">首页显示中</span>' : ''
        ].join('');

        const actions = item.fixed ? '' : `
            <div class="countdown-row-actions">
                <button type="button" class="countdown-row-btn" data-action="edit">编辑</button>
                <button type="button" class="countdown-row-btn danger${confirming ? ' confirming' : ''}" data-action="delete">${confirming ? '确认删除？' : '删除'}</button>
            </div>`;

        return `
            <div class="countdown-row${isActive ? ' active' : ''}" data-id="${esc(item.id)}">
                <div class="countdown-row-info">
                    <div class="countdown-row-name">
                        <span class="countdown-row-name-text">${esc(item.name)}</span>
                        ${tags}
                    </div>
                    <div class="countdown-row-date">${esc(window.App.ExamCountdown.formatDate(item.date))}</div>
                </div>
                ${actions}
            </div>`;
    },

    _renderEditRow(item, esc) {
        return `
            <div class="countdown-row editing" data-id="${esc(item.id)}">
                <div class="countdown-edit-form">
                    <input type="text" class="countdown-input countdown-name-input" maxlength="20" value="${esc(item.name)}" placeholder="名称">
                    <input type="date" class="countdown-input countdown-date-input" value="${esc(item.date)}">
                </div>
                <div class="countdown-row-actions">
                    <button type="button" class="timetable-save-btn" data-action="save-edit">保存</button>
                    <button type="button" class="timetable-reset-btn" data-action="cancel-edit">取消</button>
                </div>
            </div>`;
    },

    // ---------- 状态提示 ----------

    setStatus(message, isError) {
        const el = document.getElementById('countdownStatus');
        if (!el) return;

        el.textContent = message || '';
        el.classList.toggle('error', !!isError);

        if (this._statusTimer) {
            clearTimeout(this._statusTimer);
            this._statusTimer = null;
        }
        if (message && !isError) {
            this._statusTimer = setTimeout(() => {
                this._statusTimer = null;
                el.textContent = '';
            }, 2500);
        }
    }
};
