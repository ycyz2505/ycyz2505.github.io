// ============================================================
// js/features/modal_seating.js
// 座位表：展示 / 编辑（拖动、增删、批量生成）
//         CSV 导入导出 / 人名搜索（中文 + 拼音首字母）/ 随机抽人
//
// 数据存储：settings.seating —— 由 Store 统一写入本地 data/settings.json
//
// 数据模型：
//   { version: 1, rows: [ [ { t: 'n', n: '张三' }, { t: 'a' }, { t: 'p' } ], ... ] }
//   t = 'n' 人名块（横向占 2 格） | 'a' 过道块（占 1 格） | 'p' 讲台块（占 2 格）
//   行顺序 = 座位表从上到下的顺序，上方是教室前侧（黑板 / 讲台）
// ============================================================

window.App = window.App || {};

window.App.ModalSeating = {
    /* ======================= 常量 ======================= */
    SPAN: { n: 2, a: 1, p: 2 },       // 各类块占用的横向单元格数
    KEY: 'seating',                   // 在 settings 中的存储键
    MAX_ROWS: 40,                     // 最多行数
    MAX_BLOCKS: 60,                   // 每行最多块数
    MAX_NAME: 12,                     // 人名最长字符数
    PICK_TOTAL: 6000,                 // 随机抽取总时长（ms）
    PICK_STEPS: 34,                   // 随机抽取高亮次数

    /* ======================= 状态 ======================= */
    data: { rows: [] },
    mode: 'view',                     // 'view' 展示 | 'edit' 编辑
    el: {},
    editing: null,                    // 正在改名的人名块
    drag: null,                       // 拖动状态
    menuRow: null,                    // 行操作菜单对应的行
    rolling: false,                   // 随机抽取进行中
    rollTimers: [],
    rollEl: null,
    winnerEl: null,
    statusTimer: null,
    layoutTimer: null,
    suppressClick: false,

    /* ======================= 初始化 ======================= */
    init() {
        this.cacheEls();
        this.load();
        this.bind();
        this.render();
        this.setMode('view', true);
        this.el.csvText.value = this.rowsToCsv(this.data.rows);
    },

    cacheEls() {
        const $ = id => document.getElementById(id);

        this.el = {
            modal: $('seatingModal'),
            button: $('seatingButton'),
            content: document.querySelector('#seatingModal .settings-content'),
            close: $('closeSeating'),
            maximize: $('maximizeSeating'),
            modeBtns: Array.prototype.slice.call(document.querySelectorAll('#seatModeSwitch .seat-mode-btn')),
            count: $('seatCount'),
            status: $('seatStatus'),

            viewBar: $('seatViewToolbar'),
            searchInput: $('seatSearchInput'),
            searchClear: $('seatSearchClear'),
            searchHint: $('seatSearchHint'),
            pickBtn: $('seatPickBtn'),

            editBar: $('seatEditToolbar'),
            addRow: $('seatAddRow'),
            addPodiumRow: $('seatAddPodiumRow'),
            genToggle: $('seatGenToggle'),
            csvToggle: $('seatCsvToggle'),
            clearBtn: $('seatClear'),

            stage: $('seatStage'),
            grid: $('seatGrid'),
            empty: $('seatEmpty'),

            genPanel: $('seatGenPanel'),
            genRows: $('seatGenRows'),
            genPerRow: $('seatGenPerRow'),
            genGroup: $('seatGenGroup'),
            genPodium: $('seatGenPodium'),
            genApply: $('seatGenApply'),

            csvPanel: $('seatCsvPanel'),
            csvText: $('seatCsvText'),
            csvFile: $('seatCsvFile'),
            csvFileBtn: $('seatCsvFileBtn'),
            csvReload: $('seatCsvReload'),
            csvImport: $('seatCsvImport'),
            csvCopy: $('seatCsvCopy'),
            csvDownload: $('seatCsvDownload'),

            rowMenu: $('seatRowMenu'),

            pickOverlay: $('seatPickOverlay'),
            pickName: $('seatPickName'),
            pickAgain: $('seatPickAgain'),
            pickClose: $('seatPickClose'),
            emptyDemo: $('seatEmptyDemo'),
            emptyGen: $('seatEmptyGen'),
            emptyCsv: $('seatEmptyCsv')
        };
    },

    bind() {
        const el = this.el;
        // 容错绑定：页面中缺少某个元素时不影响其余功能
        const on = (target, ev, fn) => { if (target) target.addEventListener(ev, fn); };

        /* ----- 开关 & 模式 ----- */
        on(el.button, 'click', () => this.open());
        on(el.close, 'click', () => this.onClose());
        on(el.maximize, 'click', () => this.scheduleLayout(80));
        el.modeBtns.forEach(btn => on(btn, 'click', () => this.setMode(btn.dataset.mode)));

        /* ----- 展示工具条：搜索 ----- */
        on(el.searchInput, 'input', () => this.applySearch());
        on(el.searchInput, 'keydown', e => {
            e.stopPropagation();

            if (e.key === 'Enter') {
                e.preventDefault();
                this.scrollToFirstHit();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                this.clearSearch(true);
            }
        });
        on(el.searchClear, 'click', () => this.clearSearch(true));

        /* ----- 展示工具条：随机抽人 ----- */
        on(el.pickBtn, 'click', () => this.pick());
        on(el.pickAgain, 'click', () => { this.hideWinner(); this.pick(); });
        on(el.pickClose, 'click', () => this.hideWinner());
        on(el.pickOverlay, 'click', e => { if (e.target === el.pickOverlay) this.hideWinner(); });

        /* ----- 编辑工具条 ----- */
        on(el.addRow, 'click', () => this.addRow());
        on(el.addPodiumRow, 'click', () => this.addPodiumRow());
        on(el.genToggle, 'click', () => this.togglePanel('gen'));
        on(el.csvToggle, 'click', () => this.togglePanel('csv'));
        on(el.clearBtn, 'click', () => this.clearAll());
        on(el.genApply, 'click', () => this.quickGenerate());

        /* ----- CSV 面板 ----- */
        on(el.csvImport, 'click', () => this.applyCsv(el.csvText.value));
        on(el.csvReload, 'click', () => {
            el.csvText.value = this.rowsToCsv(this.data.rows);
            this.status('已载入当前座位表');
        });
        on(el.csvCopy, 'click', () => this.copyCsv());
        on(el.csvDownload, 'click', () => this.exportCsv());
        on(el.csvFileBtn, 'click', () => el.csvFile && el.csvFile.click());
        on(el.csvFile, 'change', () => this.readCsvFile());

        /* ----- 空状态 ----- */
        on(el.emptyCsv, 'click', () => { this.setMode('edit'); this.togglePanel('csv'); });
        on(el.emptyGen, 'click', () => { this.setMode('edit'); this.togglePanel('gen'); });
        on(el.emptyDemo, 'click', () => this.loadDemo());

        /* ----- 行操作菜单 ----- */
        on(el.rowMenu, 'click', e => {
            const btn = e.target.closest('button[data-act]');
            if (!btn) return;

            const r = this.menuRow;
            const act = btn.dataset.act;

            this.closeRowMenu();
            if (r === null || r === undefined) return;

            if (act === 'delrow') this.deleteRow(r);
            else this.addBlock(r, act);
        });

        /* ----- 网格（事件委托） ----- */
        on(el.grid, 'pointerdown', e => this.onGridPointerDown(e));
        on(el.grid, 'click', e => this.onGridClick(e));

        /* ----- 全局键盘 ----- */
        document.addEventListener('keydown', e => this.onKeydown(e));

        /* ----- 自适应 ----- */
        window.addEventListener('resize', () => this.scheduleLayout());

        if (window.ResizeObserver && el.stage) {
            this.resizeObserver = new ResizeObserver(() => this.scheduleLayout());
            this.resizeObserver.observe(el.stage);
        }
    },

    /* ======================= 打开 / 关闭 ======================= */
    open() {
        this.closeRowMenu();
        this.hideWinner();
        this.clearSearch();
        this.setMode('view', true);

        // 打开后多次重算尺寸，保证面板/全屏切换等过渡完成后表格刚好铺满
        this.scheduleLayout(120);
        [320, 700].forEach(delay => setTimeout(() => this.layout(), delay));
    },

    onClose() {
        this.stopRoll();
        this.hideWinner();
        this.closeRowMenu();
        this.cancelEdit(true);
        this.clearSearch();
    },

    /* ======================= 数据读写 ======================= */
    load() {
        this.data = this.normalize(App.Store.getSetting(this.KEY));
    },

    normalize(raw) {
        const rows = [];
        const src = raw && Array.isArray(raw.rows) ? raw.rows : [];

        src.slice(0, this.MAX_ROWS).forEach(row => {
            if (!Array.isArray(row)) return;

            const blocks = [];

            row.slice(0, this.MAX_BLOCKS).forEach(b => {
                const block = this.normalizeBlock(b);
                if (block) blocks.push(block);
            });

            if (blocks.length) rows.push(blocks);
        });

        return { rows: rows };
    },

    normalizeBlock(b) {
        if (!b || typeof b !== 'object') return null;

        const t = (b.t === 'n' || b.t === 'a' || b.t === 'p') ? b.t : null;
        if (!t) return null;
        if (t !== 'n') return { t: t };

        return { t: 'n', n: String(b.n == null ? '' : b.n).trim().slice(0, this.MAX_NAME) };
    },

    save() {
        this.data.rows = this.data.rows.filter(row => row.length);
        App.Store.setSetting(this.KEY, { version: 1, rows: this.data.rows });
        this.updateMeta();
    },

    updateMeta() {
        let people = 0;
        let seats = 0;
        let rows = 0;

        this.data.rows.forEach(row => {
            if (row.length) rows++;

            row.forEach(b => {
                if (b.t !== 'n') return;
                seats++;
                if (b.n) people++;
            });
        });

        this.el.count.textContent = `共 ${people} 人 · ${rows} 行`;
    },

    // 全部有名字的人名块（用于随机抽取）
    people() {
        const out = [];

        this.data.rows.forEach((row, r) => {
            row.forEach((b, c) => {
                if (b.t !== 'n' || !b.n) return;

                const el = this.blockEl(r, c);
                if (el) out.push({ name: b.n, r: r, c: c, el: el });
            });
        });

        return out;
    },

    blockEl(r, c) {
        return this.el.grid.querySelector('.seat-block[data-row="' + r + '"][data-col="' + c + '"]');
    },

    typeLabel(t) {
        return t === 'a' ? '过道块' : (t === 'p' ? '讲台块' : '人名块');
    },

    /* ======================= 渲染 ======================= */
    render() {
        const grid = this.el.grid;
        const rows = this.data.rows;

        grid.innerHTML = '';

        rows.forEach((row, r) => {
            const rowEl = document.createElement('div');
            rowEl.className = 'seat-row';
            rowEl.dataset.row = r;

            row.forEach((block, c) => rowEl.appendChild(this.createBlockEl(block, r, c)));

            if (this.mode === 'edit') {
                const tools = document.createElement('div');
                tools.className = 'seat-row-add';

                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'seat-add-btn';
                btn.dataset.row = r;
                btn.title = '添加块 / 删除本行';
                btn.textContent = '＋';

                tools.appendChild(btn);
                rowEl.appendChild(tools);
            }

            grid.appendChild(rowEl);
        });

        const hasData = rows.length > 0;
        this.el.empty.classList.toggle('active', !hasData);
        grid.style.display = hasData ? '' : 'none';

        this.updateMeta();
        this.layout();
        this.applySearch();
    },

    createBlockEl(block, r, c) {
        const el = document.createElement('div');
        const typeClass = block.t === 'n' ? 'name' : (block.t === 'a' ? 'aisle' : 'podium');

        el.className = 'seat-block seat-block-' + typeClass;
        el.dataset.row = r;
        el.dataset.col = c;
        el.dataset.type = block.t;

        if (block.t === 'a') {
            el.innerHTML = '<span class="seat-aisle-label">过道</span>';
        } else if (block.t === 'p') {
            el.textContent = '讲台';
        } else {
            el.dataset.name = block.n || '';

            if (block.n) {
                el.textContent = block.n;
            } else {
                el.classList.add('is-blank');
                const blank = document.createElement('span');
                blank.className = 'seat-block-blank';
                blank.textContent = this.mode === 'edit' ? '点击命名' : '空位';
                el.appendChild(blank);
            }
        }

        if (this.mode === 'edit') {
            const del = document.createElement('span');
            del.className = 'seat-block-del';
            del.title = '删除该块';
            del.textContent = '×';
            el.appendChild(del);
        }

        return el;
    },

    /* ======================= 尺寸自适应 ======================= */
    scheduleLayout(delay) {
        if (this.layoutTimer) clearTimeout(this.layoutTimer);

        this.layoutTimer = setTimeout(() => {
            this.layoutTimer = null;
            this.layout();
        }, delay || 30);
    },

    layout() {
        const grid = this.el.grid;
        const stage = this.el.stage;
        const width = grid.clientWidth || stage.clientWidth;

        if (!width) return;

        let maxCells = 1;

        this.data.rows.forEach(row => {
            const cells = row.reduce((sum, b) => sum + (this.SPAN[b.t] || 1), 0);
            if (cells > maxCells) maxCells = cells;
        });

        const rowGap = 12;
        const rows = Math.max(1, this.data.rows.length);

        // 先按宽度算单元格尺寸
        const gap0 = 6;
        let cell = (width - gap0 * (maxCells - 1) - 4) / maxCells;
        const gap = Math.max(4, Math.min(10, cell * 0.1));

        cell = (width - gap * (maxCells - 1) - 4) / maxCells;

        // 再按高度收一收，尽量让整张表一屏放下（小屏幕 / 行数多时）
        const stageH = stage.clientHeight;

        if (stageH) {
            const availH = stageH - 36 - 40 - 36 - rowGap * (rows - 1);
            const cellByHeight = availH > 0 ? (availH / rows) / 1.05 : 0;

            if (cellByHeight > 0 && cellByHeight < cell) cell = cellByHeight;
        }

        cell = Math.max(16, Math.min(cell, 104));

        grid.style.setProperty('--seat-cell', cell.toFixed(2) + 'px');
        grid.style.setProperty('--seat-gap', gap.toFixed(2) + 'px');
        grid.style.setProperty('--seat-height', Math.max(34, Math.min(92, cell * 1.05)).toFixed(2) + 'px');
        grid.style.setProperty('--seat-font', Math.max(12, Math.min(32, cell * 0.52)).toFixed(2) + 'px');
    },

    /* ======================= 模式切换 ======================= */
    setMode(mode, silent) {
        this.mode = mode === 'edit' ? 'edit' : 'view';

        const editing = this.mode === 'edit';

        this.el.content.classList.toggle('seat-edit', editing);
        this.el.content.classList.toggle('seat-view', !editing);
        this.el.modeBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.mode === this.mode));
        this.el.viewBar.style.display = editing ? 'none' : '';
        this.el.editBar.style.display = editing ? '' : 'none';

        if (!editing) {
            this.closeRowMenu();
            this.closePanel('gen');
            this.closePanel('csv');
        }

        this.render();

        if (!silent) this.status(editing ? '编辑模式：拖动块调整位置，点击人名可改名' : '展示模式');

        this.scheduleLayout(60);
    },

    togglePanel(which) {
        const isGen = which === 'gen';
        const panel = isGen ? this.el.genPanel : this.el.csvPanel;
        const opened = panel.classList.contains('active');

        this.closePanel('gen');
        this.closePanel('csv');

        if (opened) return;

        panel.classList.add('active');

        if (isGen) {
            this.el.genRows.focus();
        } else {
            if (!this.el.csvText.value.trim()) this.el.csvText.value = this.rowsToCsv(this.data.rows);
            this.el.csvText.focus();

            // 聚焦后回到开头，方便看到注释与第一行
            try {
                this.el.csvText.setSelectionRange(0, 0);
                this.el.csvText.scrollTop = 0;
            } catch (e) { /* 忽略 */ }
        }

        this.scheduleLayout(60);
    },

    closePanel(which) {
        const panel = which === 'gen' ? this.el.genPanel : this.el.csvPanel;
        if (panel) panel.classList.remove('active');
    },

    /* ======================= 编辑：增删 ======================= */
    addRow() {
        if (this.data.rows.length >= this.MAX_ROWS) {
            this.status('最多 ' + this.MAX_ROWS + ' 行', true);
            return;
        }

        // 新行放一个过道块占位，方便直接拖动或继续添加
        this.data.rows.push([{ t: 'a' }]);
        this.save();
        this.render();
        this.status('已在最后添加一行');
    },

    addPodiumRow() {
        if (this.data.rows.length >= this.MAX_ROWS) {
            this.status('最多 ' + this.MAX_ROWS + ' 行', true);
            return;
        }

        this.data.rows.unshift([{ t: 'p' }]);
        this.save();
        this.render();
        this.status('已在最前方添加讲台行');
    },

    addBlock(r, type) {
        const row = this.data.rows[r];
        if (!row) return;

        if (row.length >= this.MAX_BLOCKS) {
            this.status('一行最多 ' + this.MAX_BLOCKS + ' 个块', true);
            return;
        }

        row.push({ t: type });
        this.save();
        this.render();
        this.status('已添加' + this.typeLabel(type));

        if (type === 'n') setTimeout(() => this.startEdit(r, row.length - 1), 40);
    },

    deleteBlock(r, c) {
        const row = this.data.rows[r];
        if (!row || !row[c]) return;

        const removed = row.splice(c, 1)[0];

        if (!row.length && this.data.rows.length > 1) this.data.rows.splice(r, 1);

        this.save();
        this.render();
        this.status('已删除' + this.typeLabel(removed.t) + (removed.n ? '：' + removed.n : ''));
    },

    deleteRow(r) {
        if (!this.data.rows[r]) return;

        this.data.rows.splice(r, 1);
        this.save();
        this.render();
        this.status('已删除第 ' + (r + 1) + ' 行');
    },

    clearAll() {
        if (!confirm('确定清空整个座位表吗？该操作不可撤销（建议先导出 CSV 备份）。')) return;

        this.data.rows = [];
        this.save();
        this.render();
        this.status('座位表已清空');
    },

    loadDemo() {
        if (this.data.rows.length && !confirm('将替换当前座位表，确定继续吗？')) return;

        const names = [
            ['车一诺', '王梓萱', '李昊然', '张若溪', '陈嘉懿'],
            ['刘思远', '杨雨桐', '黄子轩', '周诗涵', '吴俊熙'],
            ['徐悦心', '孙浩然', '马晨曦', '朱静怡', '胡博文']
        ];

        const rows = [[{ t: 'p' }]];

        names.forEach(list => {
            const row = [];

            list.forEach((n, i) => {
                row.push({ t: 'n', n: n });
                if (i === 2) row.push({ t: 'a' });
            });

            rows.push(row);
        });

        this.data.rows = rows;
        this.save();
        this.render();
        this.status('已载入示例座位表');
    },

    /* ======================= 编辑：行操作菜单 ======================= */
    openRowMenu(r, btn) {
        const menu = this.el.rowMenu;
        const stage = this.el.stage;
        const rowEl = this.el.grid.querySelector('.seat-row[data-row="' + r + '"]');

        if (!menu || !stage || !rowEl) return;

        this.menuRow = r;

        // 直接挂到舞台内（舞台是定位容器），用布局坐标计算位置，避免各种包含块坑
        if (menu.parentElement !== stage) stage.appendChild(menu);

        menu.style.left = 'auto';
        menu.style.right = '12px';
        menu.style.top = '0px';
        menu.classList.add('active');

        const menuH = menu.offsetHeight;
        const rowTop = rowEl.offsetTop;
        const rowH = rowEl.offsetHeight;
        const stageH = stage.clientHeight;
        let top = rowTop + rowH + 6;

        // 下方放不下就向上弹
        if (top + menuH > stageH - 8) top = Math.max(8, rowTop - menuH - 6);

        menu.style.top = top + 'px';

        this.docClick = ev => {
            if (menu.contains(ev.target)) return;
            if (ev.target.closest && ev.target.closest('.seat-add-btn')) return;
            this.closeRowMenu();
        };

        setTimeout(() => document.addEventListener('click', this.docClick), 0);
    },

    closeRowMenu() {
        this.el.rowMenu.classList.remove('active');
        this.menuRow = null;

        if (this.docClick) {
            document.removeEventListener('click', this.docClick);
            this.docClick = null;
        }
    },

    /* ======================= 编辑：改名 ======================= */
    startEdit(r, c) {
        if (this.editing && this.editing.r === r && this.editing.c === c) return;
        if (this.editing) this.commitEdit();

        const block = (this.data.rows[r] || [])[c];
        const el = this.blockEl(r, c);

        if (!block || block.t !== 'n' || !el) return;

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'seat-block-input';
        input.maxLength = this.MAX_NAME;
        input.value = block.n || '';
        input.placeholder = '姓名';
        input.autocomplete = 'off';

        el.classList.add('editing');
        el.classList.remove('is-blank');
        el.innerHTML = '';
        el.appendChild(input);

        this.editing = { r: r, c: c, input: input, done: false };

        input.focus();
        input.select();

        input.addEventListener('keydown', ev => {
            ev.stopPropagation();

            if (ev.key === 'Enter') {
                ev.preventDefault();
                this.commitEdit();
            } else if (ev.key === 'Escape') {
                ev.preventDefault();
                this.cancelEdit();
            }
        });

        input.addEventListener('blur', () => this.commitEdit());
    },

    commitEdit() {
        const ed = this.editing;
        if (!ed || ed.done) return;

        ed.done = true;
        this.editing = null;

        const block = (this.data.rows[ed.r] || [])[ed.c];
        const name = String(ed.input.value || '').trim().slice(0, this.MAX_NAME);

        if (block && block.n !== name) {
            block.n = name;
            this.save();
        }

        this.render();
    },

    cancelEdit(silent) {
        const ed = this.editing;
        if (!ed) return;

        ed.done = true;
        this.editing = null;

        if (!silent) this.render();
    },

    /* ======================= 编辑：网格点击 ======================= */
    onGridClick(e) {
        if (this.suppressClick) return;

        // 删除单个块
        const del = e.target.closest('.seat-block-del');
        if (del) {
            const blockEl = del.closest('.seat-block');
            if (blockEl) this.deleteBlock(parseInt(blockEl.dataset.row, 10), parseInt(blockEl.dataset.col, 10));
            return;
        }

        // 行末尾的“＋”：添加块 / 删除本行
        const addBtn = e.target.closest('.seat-add-btn');
        if (addBtn) {
            this.openRowMenu(parseInt(addBtn.dataset.row, 10), addBtn);
            return;
        }

        if (this.mode !== 'edit') return;

        // 点击人名块 → 就地改名
        const block = e.target.closest('.seat-block');
        if (!block || block.dataset.type !== 'n') return;
        if (e.target.closest('.seat-block-input')) return;

        this.startEdit(parseInt(block.dataset.row, 10), parseInt(block.dataset.col, 10));
    },

    /* ======================= 编辑：拖动 ======================= */
    onGridPointerDown(e) {
        if (this.mode !== 'edit' || this.rolling || this.drag) return;
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        if (e.target.closest('.seat-block-del') || e.target.closest('.seat-row-add')) return;
        if (e.target.closest('.seat-block-input')) return;
        if (this.editing) return;

        const blockEl = e.target.closest('.seat-block');
        if (!blockEl) return;

        const r = parseInt(blockEl.dataset.row, 10);
        const c = parseInt(blockEl.dataset.col, 10);
        const startX = e.clientX;
        const startY = e.clientY;
        const pointerId = e.pointerId;
        let moved = false;

        const onMove = ev => {
            if (pointerId !== undefined && ev.pointerId !== pointerId) return;

            if (!moved) {
                if (Math.abs(ev.clientX - startX) + Math.abs(ev.clientY - startY) < 8) return;

                moved = true;
                this.suppressClick = true;
                this.beginDrag(blockEl, r, c, startX, startY);
            }

            this.updateDrag(ev.clientX, ev.clientY);
            ev.preventDefault();
        };

        const onUp = () => {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
            window.removeEventListener('pointercancel', onUp);

            if (moved) {
                this.endDrag();
                setTimeout(() => { this.suppressClick = false; }, 80);
            }
        };

        window.addEventListener('pointermove', onMove, { passive: false });
        window.addEventListener('pointerup', onUp);
        window.addEventListener('pointercancel', onUp);
    },

    // 拖动跟随浮层挂在 body 上（视口坐标，避免页面缩放 / 裁剪带来的偏移）
    beginDrag(el, r, c, x, y) {
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        const ghost = el.cloneNode(true);

        ghost.classList.remove('editing');
        ghost.classList.add('seat-drag-ghost');
        ghost.style.width = rect.width + 'px';
        ghost.style.height = rect.height + 'px';
        ghost.style.left = rect.left + 'px';
        ghost.style.top = rect.top + 'px';
        ghost.style.fontSize = style.fontSize;
        ghost.style.fontFamily = style.fontFamily;
        ghost.style.color = style.color;

        document.body.appendChild(ghost);
        el.classList.add('seat-dragging');

        this.drag = {
            el: el,
            r: r,
            c: c,
            ghost: ghost,
            offsetX: x - rect.left,
            offsetY: y - rect.top,
            target: null
        };
    },

    updateDrag(x, y) {
        const d = this.drag;
        if (!d) return;

        d.ghost.style.left = (x - d.offsetX) + 'px';
        d.ghost.style.top = (y - d.offsetY) + 'px';

        d.target = this.findDropTarget(x, y);
        this.markDrop(d.target);
    },

    findDropTarget(x, y) {
        const el = document.elementFromPoint(x, y);
        if (!el) return null;

        const block = el.closest ? el.closest('.seat-block') : null;
        const rowEl = block ? block.closest('.seat-row') : (el.closest ? el.closest('.seat-row') : null);

        if (rowEl) {
            const r = parseInt(rowEl.dataset.row, 10);
            return { r: r, index: this.indexInRow(rowEl, x) };
        }

        if (el.closest && el.closest('.seat-grid')) {
            const r = this.nearestRow(y);
            if (r !== null) return { r: r, index: this.data.rows[r].length };
        }

        return null;
    },

    indexInRow(rowEl, x) {
        const row = this.data.rows[parseInt(rowEl.dataset.row, 10)] || [];

        if (rowEl.classList.contains('seat-row')) {
            const blocks = Array.prototype.slice.call(rowEl.querySelectorAll('.seat-block'));

            for (let i = 0; i < blocks.length; i++) {
                const rect = blocks[i].getBoundingClientRect();
                if (x < rect.left + rect.width / 2) return i;
            }
        }

        return row.length;
    },

    nearestRow(y) {
        const rowsEl = this.el.grid.querySelectorAll('.seat-row');
        let best = null;
        let bestDist = Infinity;

        Array.prototype.forEach.call(rowsEl, rowEl => {
            const rect = rowEl.getBoundingClientRect();
            const dist = Math.abs(rect.top + rect.height / 2 - y);

            if (dist < bestDist) {
                bestDist = dist;
                best = parseInt(rowEl.dataset.row, 10);
            }
        });

        return best;
    },

    markDrop(target) {
        this.clearDropMarks();
        if (!target) return;

        const rowEl = this.el.grid.querySelector('.seat-row[data-row="' + target.r + '"]');
        if (!rowEl) return;

        rowEl.classList.add('seat-drop-row');

        const blocks = Array.prototype.slice.call(rowEl.querySelectorAll('.seat-block'));

        if (!blocks.length) return;

        if (target.index >= blocks.length) blocks[blocks.length - 1].classList.add('seat-drop-after');
        else blocks[target.index].classList.add('seat-drop-before');
    },

    clearDropMarks() {
        Array.prototype.forEach.call(this.el.grid.querySelectorAll('.seat-drop-before, .seat-drop-after'), el => {
            el.classList.remove('seat-drop-before', 'seat-drop-after');
        });

        Array.prototype.forEach.call(this.el.grid.querySelectorAll('.seat-drop-row'), el => {
            el.classList.remove('seat-drop-row');
        });
    },

    endDrag() {
        const d = this.drag;
        const target = d ? d.target : null;

        this.clearDropMarks();

        if (d) {
            d.ghost.remove();
            d.el.classList.remove('seat-dragging');
        }

        this.drag = null;

        if (!d || !target) return;

        const rows = this.data.rows;
        const from = rows[d.r];

        if (!from || !from[d.c]) return;

        const to = rows[target.r];
        if (!to) return;

        const block = from.splice(d.c, 1)[0];
        let index = target.index;

        if (target.r === d.r && index > d.c) index--;

        index = Math.max(0, Math.min(index, to.length));
        to.splice(index, 0, block);

        // 拖空的行直接移除
        if (!from.length && rows.length > 1) rows.splice(rows.indexOf(from), 1);

        this.save();
        this.render();

        this.status('已移动' + this.typeLabel(block.t) + (block.n ? '：' + block.n : ''));
    },

    /* ======================= CSV ======================= */
    // 把块数组转成 CSV 文本
    rowsToCsv(rows) {
        const lines = [
            '# 座位表 CSV —— 每行代表座位表的一行（第一行在教室最前方，讲台一侧）',
            '# 人名 = 人名块（横向占 2 格）；- 或留空 = 过道块（占 1 格）；讲台 = 讲台块（占 2 格）',
            '# 以 # 开头的行是注释，导入时会被忽略'
        ];

        (rows || []).forEach(row => {
            lines.push(row.map(b => {
                if (b.t === 'a') return '-';
                if (b.t === 'p') return '讲台';

                const name = b.n || '';

                return /[",\n]/.test(name) ? '"' + name.replace(/"/g, '""') + '"' : name;
            }).join(','));
        });

        return lines.join('\n');
    },

    // 解析 CSV 文本为块数组
    csvToRows(text) {
        const rows = [];

        String(text == null ? '' : text)
            .replace(/\r\n?/g, '\n')
            .split('\n')
            .forEach(rawLine => {
                const line = rawLine.trim();

                if (!line || line.startsWith('#')) return;

                const row = [];

                this.splitCsvLine(line).forEach(field => {
                    const value = field.trim();

                    if (!value || value === '-' || value === '--' || value === '—' || value === '－' || value === '　') {
                        row.push({ t: 'a' });
                    } else if (this.isPodiumName(value)) {
                        row.push({ t: 'p' });
                    } else {
                        row.push({ t: 'n', n: value.slice(0, this.MAX_NAME) });
                    }
                });

                if (row.length) rows.push(row);
            });

        return rows;
    },

    // 支持英文逗号 / 中文逗号 / 制表符，以及双引号包裹的字段
    splitCsvLine(line) {
        if (line.indexOf('"') === -1) return line.split(/[,，\t]/);

        const out = [];
        let cur = '';
        let quoted = false;

        for (let i = 0; i < line.length; i++) {
            const ch = line[i];

            if (quoted) {
                if (ch === '"') {
                    if (line[i + 1] === '"') {
                        cur += '"';
                        i++;
                    } else {
                        quoted = false;
                    }
                } else {
                    cur += ch;
                }
            } else if (ch === '"') {
                quoted = true;
            } else if (ch === ',' || ch === '，' || ch === '\t') {
                out.push(cur);
                cur = '';
            } else {
                cur += ch;
            }
        }

        out.push(cur);

        return out;
    },

    isPodiumName(value) {
        const v = String(value).trim().replace(/^#/, '').toLowerCase();

        return v === '讲台' || v === '講台' || v === '讲台块' || v === 'podium';
    },

    applyCsv(text) {
        const rows = this.csvToRows(text);

        if (!rows.length) {
            this.status('没有解析到有效内容，请检查 CSV 格式', true);
            return;
        }

        if (this.data.rows.length && !confirm('导入将替换当前座位表（可先导出备份），确定继续吗？')) return;

        this.data.rows = rows;
        this.save();
        this.render();
        this.el.csvText.value = this.rowsToCsv(rows);

        const seats = rows.reduce((sum, row) => sum + row.filter(b => b.t === 'n').length, 0);

        this.status(`导入成功：${rows.length} 行 / ${seats} 个座位`);
    },

    readCsvFile() {
        const file = this.el.csvFile.files && this.el.csvFile.files[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = () => {
            const text = String(reader.result || '').replace(/^\ufeff/, '');
            this.el.csvText.value = text;
            this.applyCsv(text);
        };

        reader.onerror = () => this.status('文件读取失败', true);
        reader.readAsText(file, 'utf-8');

        this.el.csvFile.value = '';
    },

    exportCsv() {
        const csv = this.rowsToCsv(this.data.rows);
        const blob = new Blob(['\ufeff' + csv + '\n'], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');

        a.href = url;
        a.download = '座位表-' + this.stamp() + '.csv';
        document.body.appendChild(a);
        a.click();
        a.remove();

        setTimeout(() => URL.revokeObjectURL(url), 2000);
        this.status('已导出 CSV 文件');
    },

    copyCsv() {
        const csv = this.rowsToCsv(this.data.rows);
        const done = () => this.status('CSV 已复制到剪贴板');
        const fail = () => this.status('复制失败，请手动选择文本复制', true);

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(csv).then(done, () => this.copyFallback(csv, done, fail));
        } else {
            this.copyFallback(csv, done, fail);
        }
    },

    copyFallback(text, done, fail) {
        try {
            const ta = document.createElement('textarea');

            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();

            const ok = document.execCommand('copy');

            ta.remove();
            (ok ? done : fail)();
        } catch (e) {
            fail();
        }
    },

    stamp() {
        const d = new Date();
        const p = n => String(n).padStart(2, '0');

        return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '-' + p(d.getHours()) + p(d.getMinutes());
    },

    /* ======================= 快速生成 ======================= */
    quickGenerate() {
        const rowsCount = this.clampInt(this.el.genRows.value, 1, this.MAX_ROWS, 6);
        const perRow = this.clampInt(this.el.genPerRow.value, 1, 24, 6);
        const group = this.clampInt(this.el.genGroup.value, 0, 12, 0);
        const withPodium = !!this.el.genPodium.checked;

        this.el.genRows.value = rowsCount;
        this.el.genPerRow.value = perRow;
        this.el.genGroup.value = group;

        if (this.data.rows.length && !confirm('将替换当前座位表（可先导出备份），确定继续吗？')) return;

        const rows = [];

        if (withPodium) rows.push([{ t: 'p' }]);

        for (let i = 0; i < rowsCount; i++) {
            const row = [];

            for (let j = 0; j < perRow; j++) {
                row.push({ t: 'n', n: '' });

                const needAisle = group > 0 && (j + 1) % group === 0 && j !== perRow - 1;
                if (needAisle) row.push({ t: 'a' });
            }

            rows.push(row);
        }

        this.data.rows = rows;
        this.save();
        this.render();
        this.status(`已生成 ${rowsCount} 行 × ${perRow} 座，点击“点击命名”的位置即可填写姓名`);
    },

    clampInt(value, min, max, def) {
        const n = parseInt(value, 10);

        if (!isFinite(n)) return def;

        return Math.max(min, Math.min(max, n));
    },

    /* ======================= 人名搜索 ======================= */
    applySearch() {
        const query = String(this.el.searchInput.value || '').trim();
        const blocks = this.el.grid.querySelectorAll('.seat-block-name');

        let hits = 0;

        Array.prototype.forEach.call(blocks, el => {
            const name = el.dataset.name || '';
            const hit = !!query && !!name && window.App.Pinyin.matchPrefix(name, query);

            el.classList.toggle('hit', hit);

            if (hit) hits++;
        });

        this.el.searchClear.style.display = query ? '' : 'none';

        if (!query) {
            this.el.searchHint.textContent = '';
            this.el.searchHint.classList.remove('empty');
        } else if (hits) {
            this.el.searchHint.textContent = `匹配 ${hits} 人`;
            this.el.searchHint.classList.remove('empty');
        } else {
            this.el.searchHint.textContent = '没有匹配的人名';
            this.el.searchHint.classList.add('empty');
        }

        return hits;
    },

    clearSearch(focus) {
        this.el.searchInput.value = '';
        this.applySearch();

        if (focus) this.el.searchInput.focus();
    },

    scrollToFirstHit() {
        const hit = this.el.grid.querySelector('.seat-block.hit');

        if (!hit) {
            this.status('没有匹配的人名', true);
            return;
        }

        try {
            hit.scrollIntoView({ block: 'center', behavior: 'smooth' });
        } catch (e) { /* 忽略 */ }

        hit.classList.add('flash');
        setTimeout(() => hit.classList.remove('flash'), 1400);
    },

    /* ======================= 随机抽人 ======================= */
    // 生成高亮时间点：间隔依次减小，总时长固定
    pickTimes(total, steps) {
        const hold = Math.max(150, Math.min(240, total * 0.03));
        const span = total - hold;
        const raw = [];

        for (let i = 0; i < steps; i++) {
            const t = steps > 1 ? i / (steps - 1) : 0;

            // 300ms 逐渐加速到约 45ms，并加入少量抖动让节奏更自然
            raw.push((300 - 252 * Math.pow(t, 1.35)) * (0.9 + Math.random() * 0.2));
        }

        const sum = raw.reduce((a, b) => a + b, 0) || 1;
        const times = [0];
        let acc = 0;

        raw.forEach(v => {
            acc += v * span / sum;
            times.push(acc);
        });

        return times;
    },

    pick() {
        if (this.rolling) return;

        const pool = this.people();

        if (!pool.length) {
            this.status('还没有人名，请先添加或导入座位表', true);
            return;
        }

        this.hideWinner();
        this.clearRollMarks();

        this.rolling = true;
        this.setRolling(true);

        const times = this.pickTimes(this.PICK_TOTAL, this.PICK_STEPS);
        const self = this;
        let last = null;

        this.rollTimers = times.map(t => setTimeout(() => {
            if (!self.rolling || !self.el.modal.classList.contains('active')) return;

            let person = pool[Math.floor(Math.random() * pool.length)];

            // 尽量不连续高亮同一个人，看起来更像抽奖
            if (pool.length > 2 && person === last) {
                person = pool[(pool.indexOf(person) + 1 + Math.floor(Math.random() * (pool.length - 1))) % pool.length];
            }

            last = person;
            self.highlightRoll(person);
        }, t));

        // 最后一次高亮后停顿一下再弹出结果
        this.rollTimers.push(setTimeout(() => {
            if (!self.rolling) return;

            self.rolling = false;
            self.setRolling(false);
            self.finishPick(last);
        }, this.PICK_TOTAL));
    },

    highlightRoll(person) {
        if (this.rollEl) this.rollEl.classList.remove('rolling');

        this.rollEl = person.el;
        this.rollEl.classList.add('rolling');
    },

    clearRollMarks() {
        if (this.rollEl) {
            this.rollEl.classList.remove('rolling');
            this.rollEl = null;
        }

        Array.prototype.forEach.call(this.el.grid.querySelectorAll('.rolling'), el => el.classList.remove('rolling'));
    },

    stopRoll() {
        this.rollTimers.forEach(t => clearTimeout(t));
        this.rollTimers = [];

        if (!this.rolling) return;

        this.rolling = false;
        this.setRolling(false);
        this.clearRollMarks();
    },

    setRolling(on) {
        this.el.content.classList.toggle('seat-rolling', !!on);
        this.el.pickBtn.disabled = !!on;
    },

    finishPick(person) {
        if (!person) return;

        this.clearRollMarks();

        person.el.classList.add('winner');
        this.winnerEl = person.el;

        try {
            person.el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        } catch (e) { /* 忽略 */ }

        this.showWinner(person.name);
    },

    showWinner(name) {
        const text = String(name);

        this.el.pickName.textContent = text;
        this.el.pickName.classList.toggle('long', Array.from(text).length > 3);
        this.el.pickOverlay.classList.add('active');

        this.makeConfetti();
    },

    hideWinner() {
        this.el.pickOverlay.classList.remove('active');

        if (this.winnerEl) {
            this.winnerEl.classList.remove('winner');
            this.winnerEl = null;
        }
    },

    makeConfetti() {
        const card = this.el.pickOverlay.querySelector('.seat-pick-card');
        const box = card ? card.querySelector('.seat-confetti') : null;

        if (!box) return;

        box.innerHTML = '';

        const colors = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff9f45', '#c084fc'];

        for (let i = 0; i < 18; i++) {
            const dot = document.createElement('span');
            const angle = (Math.PI * 2 * i) / 18 + Math.random() * 0.4;
            const dist = 130 + Math.random() * 130;

            dot.className = 'seat-confetti-dot';
            dot.style.background = colors[i % colors.length];
            dot.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
            dot.style.setProperty('--dy', Math.sin(angle) * dist - 30 + 'px');
            dot.style.animationDelay = (i * 18) + 'ms';

            box.appendChild(dot);
        }
    },

    /* ======================= 全局键盘 ======================= */
    onKeydown(e) {
        if (!this.el.modal.classList.contains('active')) return;

        const active = document.activeElement;
        const tag = active ? active.tagName : '';
        const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (active && active.isContentEditable);

        if (e.key === 'Escape') {
            if (this.el.pickOverlay.classList.contains('active')) {
                this.hideWinner();
                return;
            }

            if (this.rolling) {
                this.stopRoll();
                this.status('已取消抽取');
                return;
            }

            if (this.editing) {
                this.cancelEdit();
                return;
            }

            if (this.menuRow !== null) {
                this.closeRowMenu();
                return;
            }
        }

        if (e.ctrlKey || e.metaKey || e.altKey) return;
        if (typing || this.rolling || this.mode !== 'view') return;

        // 直接打字即可开始搜索（字母 / 数字）
        if (e.key.length !== 1) return;

        this.el.searchInput.focus();
        this.el.searchInput.value += e.key;
        this.applySearch();

        e.preventDefault();
    },

    /* ======================= 状态提示 ======================= */
    status(message, isError, duration) {
        const el = this.el.status;

        if (!message) {
            el.textContent = '';
            el.classList.remove('error', 'show');
            return;
        }

        el.textContent = message;
        el.classList.toggle('error', !!isError);
        el.classList.add('show');

        if (this.statusTimer) clearTimeout(this.statusTimer);

        this.statusTimer = setTimeout(() => {
            el.classList.remove('show');
            this.statusTimer = null;
        }, duration || (isError ? 2600 : 2000));
    }
};
