// ============================================================
// js/features/modal_seating.js
// 座位表：展示 / 积木式编辑（拖动积木盒里的块到格子）、
//        CSV 导入导出（文本框与座位表实时双向同步）、
//        人名搜索（中文 + 拼音首字母 + 屏幕键盘）、
//        180° 翻转、随机抽取。
//
// 布局：右侧控制区使用 column-reverse（DOM 靠前 → 渲染在下方）：
//   底部栏（模式切换 / 随机抽取 / 翻转）→ 状态 → 垃圾桶 →
//   展示工具栏（键盘 → 搜索框）/ 编辑工具栏（每行格数 → 工具按钮）→
//   积木盒 → 面板（生成 / CSV）；统计信息绝对定位在控制区右上角。
//
// 数据：data/seatmap.json（经 App.Store 读写）= { version: 2, cols, rows }
//   cols  每行格数（全局，所有行一致）
//   rows  每行是一个长度为 cols 的数组，格子（cell）取值：
//     null                  待决定的空位（占 1 格）
//     { t: 'n', n: '张三' } 人名块（占 2 格）
//     { t: 'p' }            讲台块（占 2 格）
//     { t: 's' }            续格：前一个 2 格块的第二个格子（渲染时被块覆盖）
// ============================================================

window.App = window.App || {};

(function () {
    'use strict';

    var App = window.App;

    var SPAN = { n: 2, p: 2 };
    var TYPE_LABEL = { n: '人名块', p: '讲台块' };
    var TYPE_TAG = { n: '人名', p: '讲台' };

    var MIN_COLS = 4;
    var MAX_COLS = 40;
    var MAX_ROWS = 40;
    var MAX_NAME = 12;
    var DEFAULT_COLS = 12;
    var TOOLS_W = 100;           // 行工具列宽（与 CSS --seat-tools-w 保持一致）
    var PICK_TOTAL = 6000;       // 随机抽取总时长（毫秒）
    var PICK_STEPS = 34;         // 中间抽取次数
    var CSV_LIVE_DELAY = 180;    // CSV 文本框输入 → 座位表实时应用的防抖时长（毫秒）

    App.ModalSeating = {
        KEY: 'seatmap',
        PICK_TOTAL: PICK_TOTAL,
        PICK_STEPS: PICK_STEPS,
        SPAN: SPAN,
        MIN_COLS: MIN_COLS,
        MAX_COLS: MAX_COLS,

        data: { version: 2, cols: DEFAULT_COLS, rows: [] },
        mode: 'view',
        edit: null,
        search: '',
        picked: null,
        drag: null,
        pendingDrag: null,
        rolling: false,
        timers: [],
        metrics: { cell: 64, gap: 8, rowH: 64 },

        el: {},
        _inited: false,
        _opened: false,
        _offlineNoticed: false,
        _lastDragEnd: 0,

        // ------------------------------------------------------
        // 初始化
        // ------------------------------------------------------

        init: function () {
            if (this._inited) return;

            this.cacheEls();
            this.bind();
            this.loadFromStore();
            this.watchModal();
            this.watchStore();

            if (this.el.content) {
                this.el.content.classList.add('seat-view');
                this.el.content.classList.remove('seat-edit');
            }

            this.buildKeyboard();
            this.render();
            this._inited = true;
        },

        cacheEls: function () {
            function id(x) { return document.getElementById(x); }

            var modal = id('seatingModal');

            this.el = {
                modal: modal,
                content: modal ? modal.querySelector('.settings-content') : null,
                stage: id('seatStage'),
                grid: id('seatGrid'),
                empty: id('seatEmpty'),
                modeSwitch: id('seatModeSwitch'),
                count: id('seatCount'),
                status: id('seatStatus'),
                viewToolbar: id('seatViewToolbar'),
                editToolbar: id('seatEditToolbar'),
                search: id('seatSearchInput'),
                searchClear: id('seatSearchClear'),
                searchHint: id('seatSearchHint'),
                keyboard: id('seatKeyboard'),
                kbBack: id('seatKbBack'),
                kbClear: id('seatKbClear'),
                pickBtn: id('seatPickBtn'),
                rotateBtn: id('seatRotate'),
                addRow: id('seatAddRow'),
                colsMinus: id('seatColsMinus'),
                colsPlus: id('seatColsPlus'),
                colsVal: id('seatColsVal'),
                clearBtn: id('seatClear'),
                genToggle: id('seatGenToggle'),
                csvToggle: id('seatCsvToggle'),
                palette: id('seatPalette'),
                trash: id('seatTrash'),
                genPanel: id('seatGenPanel'),
                genRows: id('seatGenRows'),
                genPerRow: id('seatGenPerRow'),
                genPodium: id('seatGenPodium'),
                genApply: id('seatGenApply'),
                csvPanel: id('seatCsvPanel'),
                csvText: id('seatCsvText'),
                csvDownload: id('seatCsvDownload'),
                csvFile: id('seatCsvFile'),
                overlay: id('seatPickOverlay'),
                overlayName: id('seatPickName'),
                againBtn: id('seatAgain'),
                doneBtn: id('seatDone'),
                emptyDemo: id('seatEmptyDemo'),
                emptyGen: id('seatEmptyGen'),
                emptyCsv: id('seatEmptyCsv')
            };
        },

        bind: function () {
            var self = this;

            function on(el, ev, fn) {
                if (el) el.addEventListener(ev, fn);
            }

            // 展示 / 编辑 模式切换
            if (this.el.modeSwitch) {
                Array.prototype.forEach.call(this.el.modeSwitch.querySelectorAll('.seat-mode-btn'), function (btn) {
                    on(btn, 'click', function () { self.setMode(btn.dataset.mode); });
                });
            }

            // 全屏按钮：尺寸变化后重排
            on(document.getElementById('maximizeSeating'), 'click', function () {
                setTimeout(function () { self.layout(); }, 60);
                setTimeout(function () { self.layout(); }, 320);
            });

            // 180° 翻转
            on(this.el.rotateBtn, 'click', function () { self.rotate180(); });

            // 搜索
            on(this.el.search, 'input', function () { self.applySearch(self.el.search.value); });
            on(this.el.search, 'keydown', function (ev) {
                if (ev.key === 'Enter') { ev.preventDefault(); self.jumpToFirst(); }
                else if (ev.key === 'Escape') {
                    ev.stopPropagation();
                    self.el.search.value = '';
                    self.applySearch('');
                }
            });
            on(this.el.searchClear, 'click', function () {
                if (self.el.search) { self.el.search.value = ''; self.el.search.focus(); }
                self.applySearch('');
            });

            // 搜索框右侧的退格 / 清空键：操作对象始终是搜索框
            on(this.el.kbBack, 'pointerdown', function (ev) { ev.preventDefault(); });
            on(this.el.kbBack, 'click', function () { self.onVirtualKey('__back'); });
            on(this.el.kbClear, 'pointerdown', function (ev) { ev.preventDefault(); });
            on(this.el.kbClear, 'click', function () { self.onVirtualKey('__clear'); });

            // 26 键屏幕键盘（事件委托）
            on(this.el.keyboard, 'pointerdown', function (ev) {
                // 阻止按键抢走输入框焦点
                if (ev.target.closest('.seat-kb-key')) ev.preventDefault();
            });
            on(this.el.keyboard, 'click', function (ev) {
                var key = ev.target.closest('.seat-kb-key');
                if (!key) return;
                self.onVirtualKey(key.dataset.key);
            });

            // 随机抽取
            on(this.el.pickBtn, 'click', function () { self.startPick(); });
            on(this.el.againBtn, 'click', function () { self.hideOverlay(); self.startPick(); });
            on(this.el.doneBtn, 'click', function () { self.hideOverlay(); });
            on(this.el.overlay, 'click', function (ev) {
                if (ev.target === self.el.overlay) self.hideOverlay();
            });

            // 编辑工具
            on(this.el.addRow, 'click', function () { self.addRow(); });
            on(this.el.colsMinus, 'click', function () { self.stepCols(-1); });
            on(this.el.colsPlus, 'click', function () { self.stepCols(1); });
            on(this.el.clearBtn, 'click', function () { self.clearAll(); });
            on(this.el.genToggle, 'click', function () { self.togglePanel('gen'); });
            on(this.el.csvToggle, 'click', function () { self.togglePanel('csv'); });
            on(this.el.genApply, 'click', function () { self.generate(); });
            on(this.el.csvDownload, 'click', function () { self.downloadCsv(); });
            on(this.el.csvFile, 'change', function () { self.importFile(); });

            // CSV 文本框：与左侧座位表实时双向同步
            // 输入 → 防抖后应用到座位表；输入法组词期间暂不应用，组词结束后再同步
            on(this.el.csvText, 'input', function () { self.scheduleCsvLive(); });
            on(this.el.csvText, 'compositionstart', function () { self._csvComposing = true; });
            on(this.el.csvText, 'compositionend', function () {
                self._csvComposing = false;
                self.scheduleCsvLive();
            });
            // 失焦后把文本框刷新成标准格式（与座位表完全一致）
            on(this.el.csvText, 'blur', function () {
                setTimeout(function () { self.refreshCsvPreview(true); }, 0);
            });

            // 空状态按钮
            on(this.el.emptyGen, 'click', function () { self.setMode('edit'); self.togglePanel('gen'); });
            on(this.el.emptyCsv, 'click', function () { self.setMode('edit'); self.togglePanel('csv'); });
            on(this.el.emptyDemo, 'click', function () { self.loadDemo(); });

            // 座位区：拖动块 / 点击处理
            on(this.el.grid, 'pointerdown', function (ev) { self.onGridPointerDown(ev); });
            on(this.el.grid, 'click', function (ev) { self.onGridClick(ev); });
            on(this.el.palette, 'pointerdown', function (ev) { self.onPalettePointerDown(ev); });

            // 键盘：Esc 取消拖动 / 取消抽取 / 关闭弹窗
            this._onKey = function (ev) { self.handleKey(ev); };
            document.addEventListener('keydown', this._onKey);

            // 尺寸变化
            this._onResize = function () { self.scheduleLayout(); };
            window.addEventListener('resize', this._onResize);
            if (window.ResizeObserver) {
                this._ro = new ResizeObserver(function () { self.scheduleLayout(); });
                if (this.el.stage) this._ro.observe(this.el.stage);
                if (this.el.content) this._ro.observe(this.el.content);
            }
        },

        // 观察模态框的开 / 关（modal_core 只负责加 .active 类）
        watchModal: function () {
            var self = this;
            var modal = this.el.modal;
            if (!modal || !window.MutationObserver) return;

            this._mo = new MutationObserver(function () {
                var open = modal.classList.contains('active');
                if (open && !self._opened) self.open();
                else if (!open && self._opened) self.close();
            });
            this._mo.observe(modal, { attributes: true, attributeFilter: ['class'] });

            if (modal.classList.contains('active')) this.open();
        },

        // ------------------------------------------------------
        // 打开 / 关闭
        // ------------------------------------------------------

        open: function () {
            if (this._opened) return;
            this._opened = true;

            this.loadFromStore();
            this.rolling = false;
            this.edit = null;
            this.picked = null;
            this.pendingDrag = null;
            this.drag = null;
            this.search = '';
            if (this.el.search) this.el.search.value = '';
            if (this.el.searchClear) this.el.searchClear.style.display = 'none';

            this.hideOverlay();
            this.closePanels();
            this.setTrashHot(false);
            this.setMode('view');
            this.status('');

            // 打开动画 / 字体就绪后重新计算尺寸
            this.scheduleLayout();
            var self = this;
            [80, 320, 720].forEach(function (ms) {
                setTimeout(function () { self.layout(); }, ms);
            });
        },

        close: function () {
            this._opened = false;
            clearTimeout(this._csvTimer);
            this._csvComposing = false;
            this.pendingDrag = null;
            this.drag = null;
            this.detachDragListeners();
            this.setTrashHot(false);
            this.cancelPick(true);
            this.hideOverlay();
            if (this.edit) {
                this.edit = null;
                this.render();
            }
            this.status('');
        },

        // ------------------------------------------------------
        // 存储 & 数据
        // ------------------------------------------------------

        loadFromStore: function () {
            var raw = null;
            try {
                raw = (App.Store && App.Store.get) ? App.Store.get(this.KEY) : null;
            } catch (e) { raw = null; }
            this.data = this.normalize(raw);
        },

        // 存到 data/seatmap.json（独立文件，保存座位表不会重写其它设置）
        save: function () {
            if (!App.Store || !App.Store.set) return;

            // 服务一直没连上时磁盘上的真实座位表还没读到，
            // 此时写盘会把真实数据覆盖成空表，先挡住
            if (App.Store.canWrite && !App.Store.canWrite(this.KEY)) {
                this.status('本地服务未连接，暂时无法保存座位表（请先启动 LocalDataServer）', true);
                return;
            }

            try {
                App.Store.set(this.KEY, {
                    version: 2,
                    cols: this.data.cols,
                    rows: this.data.rows
                });
                this._offlineNoticed = false;
            } catch (e) {
                this.status('保存座位表失败：' + ((e && e.message) || e), true);
                return;
            }

            // 本地服务没连上：改动只留在当前页面，这里明确提示一次
            if (!App.Store.available && !this._offlineNoticed) {
                this._offlineNoticed = true;
                this.status('本地服务未连接，改动会先留在页面，服务恢复后自动保存', true);
            }
        },

        // 别的窗口改了座位表：自动同步进来（拖动 / 改名 / 抽取过程中不打断）
        watchStore: function () {
            var self = this;
            if (!App.Store || !App.Store.watch) return;

            App.Store.watch(this.KEY, function (value) {
                if (self.drag || self.pendingDrag || self.edit || self.rolling) return;

                self.data = self.normalize(value);

                if (self._opened) {
                    self.render();
                    self.scheduleLayout();
                    self.refreshCsvPreview();
                }
            });
        },

        cols: function () {
            var c = parseInt(this.data && this.data.cols, 10) || 0;
            if (!c) c = DEFAULT_COLS;
            return Math.max(MIN_COLS, Math.min(MAX_COLS, c));
        },

        cleanName: function (v) {
            return String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, MAX_NAME);
        },

        // 单元格 → 内部形式（null / 块；续格与非法内容视为空位，续格随后重建）
        // 注：旧版本里的"过道块"（t:'a'）在解析时自动退化为待决定的空位
        parseCell: function (cell) {
            if (!cell || typeof cell !== 'object') return null;
            if (cell.t === 'n') return { t: 'n', n: this.cleanName(cell.n) };
            if (cell.t === 'p') return { t: 'p' };
            if (cell.t === 's') return { t: 's' };
            return null;
        },

        // v1 旧数据（每行是块数组，没有空位概念）→ 内部形式
        fromLegacyRow: function (row) {
            var self = this;
            var cells = [];
            row.forEach(function (b) {
                if (!b || typeof b !== 'object') return;
                if (b.t === 'n') cells.push({ t: 'n', n: self.cleanName(b.n) });
                else if (b.t === 'p') cells.push({ t: 'p' });
            });
            return cells;
        },

        // 把「格子 / 块序列」依次打包为长度 cols 的格子数组：
        // - 块按出现顺序紧挨着摆放；null = 待决定的空位，占 1 格
        // - { t:'s' } 是前一个 2 格块的续格，跳过、不额外占位、由块重新生成
        // - 放不下的块直接丢弃
        rebuildRow: function (cells, cols) {
            var out = new Array(cols).fill(null);
            var pos = 0;

            for (var i = 0; i < cells.length; i++) {
                var c = cells[i];
                if (c && c.t === 's') continue;

                var span = c ? (SPAN[c.t] || 1) : 1;
                if (pos + span > cols) break;

                if (c) {
                    out[pos] = c;
                    for (var k = 1; k < span; k++) out[pos + k] = { t: 's' };
                }
                pos += span;
            }

            return out;
        },

        normalize: function (raw) {
            var src = (raw && Array.isArray(raw.rows)) ? raw.rows.slice(0, MAX_ROWS) : [];
            var legacy = !raw || raw.version !== 2;
            var parsed = [];
            var centerRows = [];
            var needed = 0;

            src.forEach(function (row) {
                if (!Array.isArray(row)) return;

                var cells = legacy
                    ? this.fromLegacyRow(row)
                    : row.map(this.parseCell.bind(this));

                var blocks = 0;
                var end = 0;
                cells.forEach(function (c) {
                    if (!c) { end += 1; return; }          // 待决定的空位占 1 格
                    if (c.t === 's') return;               // 续格不额外占位
                    blocks += 1;
                    end += SPAN[c.t] || 1;
                });

                // 旧数据里只有一个讲台块的行：保持“居中”的观感（之后可随意拖动）
                if (legacy && blocks === 1 && cells.some(function (c) { return c && c.t === 'p'; })) {
                    centerRows.push(parsed.length);
                }

                needed = Math.max(needed, end);
                parsed.push(cells);
            }, this);

            var want = Math.max(parseInt(raw && raw.cols, 10) || 0, needed);
            var cols = want > 0 ? Math.max(MIN_COLS, Math.min(MAX_COLS, want)) : DEFAULT_COLS;

            var self = this;
            var rows = parsed.map(function (cells, idx) {
                if (centerRows.indexOf(idx) !== -1 && cols >= 2) {
                    var out = new Array(cols).fill(null);
                    var start = Math.max(0, Math.min(cols - 2, Math.floor((cols - 2) / 2)));
                    out[start] = { t: 'p' };
                    out[start + 1] = { t: 's' };
                    return out;
                }
                return self.rebuildRow(cells, cols);
            });

            return { version: 2, cols: cols, rows: rows };
        },

        // ------------------------------------------------------
        // 单元格操作
        // ------------------------------------------------------

        blockAt: function (r, c) {
            var cells = this.data.rows[r];
            if (!cells) return null;
            var cell = cells[c];
            return (cell && cell.t !== 's') ? cell : null;
        },

        placeBlock: function (r, start, block) {
            var cells = this.data.rows[r];
            if (!cells) return;
            var span = SPAN[block.t] || 1;
            cells[start] = block;
            for (var k = 1; k < span; k++) cells[start + k] = { t: 's' };
        },

        clearCells: function (r, start) {
            var cells = this.data.rows[r];
            if (!cells) return;
            var cell = cells[start];
            if (!cell || cell.t === 's') return;
            var span = SPAN[cell.t] || 1;
            for (var k = 0; k < span; k++) {
                if (start + k < cells.length) cells[start + k] = null;
            }
        },

        // ------------------------------------------------------
        // 渲染
        // ------------------------------------------------------

        render: function () {
            var grid = this.el.grid;
            if (!grid) return;

            var cols = this.cols();
            var rows = this.data.rows || [];

            grid.innerHTML = '';
            grid.style.setProperty('--seat-cols', cols);

            if (!rows.length) {
                if (this.el.empty) this.el.empty.classList.add('active');
                if (this.el.stage) this.el.stage.classList.add('is-empty');
                this.updateMeta();
                return;
            }
            if (this.el.empty) this.el.empty.classList.remove('active');
            if (this.el.stage) this.el.stage.classList.remove('is-empty');

            var template = 'repeat(' + cols + ', var(--seat-cell)) var(--seat-tools-w)';
            var self = this;

            rows.forEach(function (cells, r) {
                var rowEl = document.createElement('div');
                rowEl.className = 'seat-row';
                rowEl.dataset.row = r;
                rowEl.style.gridTemplateColumns = template;

                cells.forEach(function (cell, c) {
                    if (cell && cell.t === 's') return;    // 被前一个 2 格块覆盖
                    rowEl.appendChild(self.createCellEl(cell, r, c, cols));
                });

                if (self.mode === 'edit') rowEl.appendChild(self.createRowTools(r, cols));
                grid.appendChild(rowEl);
            });

            this.updateMeta();
            this.applySearch(this.search);
            this.refreshPick();
            this.refreshCsvPreview();
        },

        createCellEl: function (cell, r, c, cols) {
            var el;

            if (!cell) {
                el = document.createElement('div');
                el.className = 'seat-slot';
                el.dataset.row = r;
                el.dataset.col = c;
                el.style.gridColumn = (c + 1) + ' / span 1';
                el.title = this.mode === 'edit' ? '待决定的位置：从右侧积木盒拖一个块进来' : '';
                return el;
            }

            var span = SPAN[cell.t] || 1;

            el = document.createElement('div');
            el.className = 'seat-block t-' + cell.t;
            el.dataset.row = r;
            el.dataset.col = c;
            el.dataset.type = cell.t;
            el.style.gridColumn = (c + 1) + ' / span ' + span;

            if (cell.t === 'n') {
                var label = document.createElement('span');
                label.className = 'seat-label';
                if (cell.n) {
                    label.textContent = cell.n;
                } else {
                    label.classList.add('is-empty');
                    label.textContent = this.mode === 'edit' ? '点击命名' : '';
                }
                el.appendChild(label);
            } else {
                var tag = document.createElement('span');
                tag.className = 'seat-tag';
                tag.textContent = TYPE_TAG[cell.t] || '';
                el.appendChild(tag);
            }

            return el;
        },

        createRowTools: function (r, cols) {
            var box = document.createElement('div');
            box.className = 'seat-row-tools';
            box.style.gridColumn = String(cols + 1);

            var acts = [
                { act: 'up', text: '↑', title: '整行上移' },
                { act: 'down', text: '↓', title: '整行下移' },
                { act: 'del', text: '🗑', title: '删除整行' }
            ];

            acts.forEach(function (a) {
                var btn = document.createElement('button');
                btn.type = 'button';
                btn.dataset.act = a.act;
                btn.textContent = a.text;
                btn.title = a.title;
                box.appendChild(btn);
            });

            return box;
        },

        updateMeta: function () {
            var rows = this.data.rows || [];
            var cols = this.cols();
            var seats = 0;
            var named = 0;

            rows.forEach(function (cells) {
                (cells || []).forEach(function (cell) {
                    if (cell && cell.t === 'n') {
                        seats += 1;
                        if (cell.n) named += 1;
                    }
                });
            });

            if (this.el.colsVal) this.el.colsVal.textContent = String(cols);

            if (this.el.count) {
                if (!rows.length) {
                    this.el.count.textContent = '座位表还是空的';
                } else if (seats > named) {
                    this.el.count.textContent = '已填名 ' + named + '/' + seats + ' 人 · ' + rows.length + ' 行 · 每行 ' + cols + ' 格';
                } else {
                    this.el.count.textContent = '共 ' + named + ' 人 · ' + rows.length + ' 行 · 每行 ' + cols + ' 格';
                }
            }
        },

        status: function (msg, isError) {
            var el = this.el.status;
            if (!el) return;
            clearTimeout(this._statusTimer);
            el.textContent = msg || '';
            el.classList.toggle('show', !!msg);
            el.classList.toggle('error', !!isError);
            if (msg) {
                var self = this;
                this._statusTimer = setTimeout(function () { el.classList.remove('show'); }, isError ? 4200 : 2600);
            }
        },

        // ------------------------------------------------------
        // 模式 / 面板
        // ------------------------------------------------------

        setMode: function (mode) {
            var m = mode === 'edit' ? 'edit' : 'view';

            this.pendingDrag = null;
            this.endDrag(false);
            this.setTrashHot(false);
            if (this.edit) this.endEdit(false);

            this.mode = m;

            var c = this.el.content;
            if (c) {
                c.classList.toggle('seat-edit', m === 'edit');
                c.classList.toggle('seat-view', m === 'view');
            }

            if (this.el.modeSwitch) {
                Array.prototype.forEach.call(this.el.modeSwitch.querySelectorAll('.seat-mode-btn'), function (b) {
                    b.classList.toggle('active', b.dataset.mode === m);
                });
            }

            if (this.el.viewToolbar) this.el.viewToolbar.style.display = m === 'view' ? '' : 'none';
            if (this.el.editToolbar) this.el.editToolbar.style.display = m === 'edit' ? '' : 'none';

            if (m !== 'edit') {
                this.closePanels();
                this.search = '';
                if (this.el.search) this.el.search.value = '';
                if (this.el.searchClear) this.el.searchClear.style.display = 'none';
            }

            this.render();
            this.scheduleLayout();
        },

        togglePanel: function (which) {
            var gen = this.el.genPanel;
            var csv = this.el.csvPanel;
            var target = which === 'gen' ? gen : csv;
            if (!target) return;

            var willOpen = !target.classList.contains('active');

            if (gen) gen.classList.toggle('active', which === 'gen' && willOpen);
            if (csv) csv.classList.toggle('active', which === 'csv' && willOpen);
            if (this.el.genToggle) this.el.genToggle.classList.toggle('active', which === 'gen' && willOpen);
            if (this.el.csvToggle) this.el.csvToggle.classList.toggle('active', which === 'csv' && willOpen);

            if (willOpen && which === 'csv') this.refreshCsvPreview(true);
        },

        closePanels: function () {
            if (this.el.genPanel) this.el.genPanel.classList.remove('active');
            if (this.el.csvPanel) this.el.csvPanel.classList.remove('active');
            if (this.el.genToggle) this.el.genToggle.classList.remove('active');
            if (this.el.csvToggle) this.el.csvToggle.classList.remove('active');
        },

        // ------------------------------------------------------
        // 布局（左区尺寸只由模态框 / 窗口大小决定）
        // ------------------------------------------------------

        scheduleLayout: function () {
            var self = this;
            clearTimeout(this._layoutTimer);
            this._layoutTimer = setTimeout(function () { self.layout(); }, 60);
        },

        layout: function () {
            var stage = this.el.stage;
            var grid = this.el.grid;
            if (!stage || !grid) return;

            var rows = (this.data.rows || []).length;
            if (!rows) return;

            var cols = this.cols();
            var cs = window.getComputedStyle(stage);
            var padX = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
            var padY = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);

            var availW = Math.max(160, (stage.clientWidth || 0) - padX);

            var labelH = 0;
            Array.prototype.forEach.call(stage.querySelectorAll('.seat-front-label, .seat-back-label'), function (el) {
                labelH += el.offsetHeight || 0;
            });

            var availH = Math.max(100, (stage.clientHeight || 0) - padY - labelH - 44);

            // 列宽：先估计，再按 gap 修正
            var cell = ((availW - TOOLS_W) / cols) * 0.95;
            var gap = Math.max(4, Math.min(10, Math.round(cell * 0.12)));
            cell = (availW - TOOLS_W - cols * gap) / cols;
            cell = Math.max(14, cell);

            var rowH = cell * 1.06;
            var rowGap = Math.max(6, Math.round(rowH * 0.24));
            var maxRowH = (availH - rowGap * (rows - 1)) / rows;

            if (maxRowH > 12 && rowH > maxRowH) {
                var k = maxRowH / cell;
                cell = Math.max(12, cell * k);
                rowH = Math.max(14, maxRowH);
            }

            var font = Math.max(11, Math.min(30, Math.round(rowH * 0.42)));

            grid.style.setProperty('--seat-cell', cell.toFixed(2) + 'px');
            grid.style.setProperty('--seat-gap', gap.toFixed(2) + 'px');
            grid.style.setProperty('--seat-height', rowH.toFixed(2) + 'px');
            grid.style.setProperty('--seat-row-gap', rowGap + 'px');
            grid.style.setProperty('--seat-font', font + 'px');

            this.metrics = { cell: cell, gap: gap, rowH: rowH };
        },

        // 当前页面缩放（#pageContent 可能被 zoom 缩放；浮层挂在 body 上不受影响）
        _zoom: function () {
            var grid = this.el.grid;
            if (!grid) return 1;
            var rect = grid.getBoundingClientRect();
            var cols = this.cols();
            var units = cols * (this.metrics.cell + this.metrics.gap) + TOOLS_W;
            if (rect.width > 0 && units > 0) return rect.width / units;
            return 1;
        },

        // ------------------------------------------------------
        // 编辑名字 / 行操作
        // ------------------------------------------------------

        onGridClick: function (ev) {
            if (this.mode !== 'edit') return;

            var tool = ev.target.closest('.seat-row-tools button');
            if (tool) {
                var rowEl = tool.closest('.seat-row');
                if (rowEl) this.rowAction(tool.dataset.act, parseInt(rowEl.dataset.row, 10));
                return;
            }

            if (Date.now() - (this._lastDragEnd || 0) < 300) return;

            var block = ev.target.closest('.seat-block');
            if (block && block.dataset.type === 'n') {
                this.beginEdit(parseInt(block.dataset.row, 10), parseInt(block.dataset.col, 10));
                return;
            }

            if (ev.target.closest('.seat-slot')) {
                this.status('从右侧「积木盒」拖一个块到这里，来决定这个位置放什么');
            }
        },

        beginEdit: function (r, c) {
            if (this.mode !== 'edit' || this.rolling || this.drag || this.pendingDrag) return;

            var block = this.blockAt(r, c);
            if (!block || block.t !== 'n') return;

            if (this.edit && (this.edit.r !== r || this.edit.c !== c)) this.endEdit(true);

            this.edit = { r: r, c: c };
            this.render();

            var grid = this.el.grid;
            var label = grid ? grid.querySelector('.seat-block.t-n[data-row="' + r + '"][data-col="' + c + '"] .seat-label') : null;
            if (!label) { this.edit = null; return; }

            var self = this;
            label.classList.add('is-editing');
            label.contentEditable = 'true';
            label.textContent = block.n || '';
            label.focus();

            try {
                var range = document.createRange();
                range.selectNodeContents(label);
                var sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
            } catch (e) { /* 忽略选区错误 */ }

            label.onkeydown = function (ev) {
                ev.stopPropagation();
                if (ev.key === 'Enter') { ev.preventDefault(); self.endEdit(true); }
                else if (ev.key === 'Escape') { ev.preventDefault(); self.endEdit(false); }
            };
            label.onblur = function () { if (self.edit) self.endEdit(true); };
        },

        endEdit: function (commit) {
            var info = this.edit;
            this.edit = null;

            var label = this.el.grid ? this.el.grid.querySelector('.seat-label.is-editing') : null;
            var text = '';

            if (label) {
                text = this.cleanName(label.textContent);
                label.contentEditable = 'false';
                label.classList.remove('is-editing');
                label.onkeydown = null;
                label.onblur = null;
            }

            if (commit && info) {
                var block = this.blockAt(info.r, info.c);
                if (block && block.t === 'n' && (block.n || '') !== text) {
                    block.n = text;
                    this.save();
                }
            }

            this.render();
        },

        rowAction: function (act, r) {
            var rows = this.data.rows;
            if (!rows[r]) return;

            if (act === 'up') {
                if (r === 0) { this.status('已经是第一行了', true); return; }
                var a = rows[r - 1]; rows[r - 1] = rows[r]; rows[r] = a;
                this.save(); this.render(); this.scheduleLayout();
                this.status('已把第 ' + (r + 1) + ' 行上移');
            } else if (act === 'down') {
                if (r >= rows.length - 1) { this.status('已经是最后一行了', true); return; }
                var b = rows[r + 1]; rows[r + 1] = rows[r]; rows[r] = b;
                this.save(); this.render(); this.scheduleLayout();
                this.status('已把第 ' + (r + 1) + ' 行下移');
            } else if (act === 'del') {
                var hasBlock = rows[r].some(function (c) { return !!c; });
                if (hasBlock && !window.confirm('删除第 ' + (r + 1) + ' 行（包含里面的块）吗？')) return;
                rows.splice(r, 1);
                this.save(); this.render(); this.scheduleLayout();
                this.status('已删除第 ' + (r + 1) + ' 行');
            }
        },

        addRow: function () {
            if (this.data.rows.length >= MAX_ROWS) { this.status('最多 ' + MAX_ROWS + ' 行', true); return; }
            this.data.rows.push(new Array(this.cols()).fill(null));
            this.save();
            this.render();
            this.scheduleLayout();
            this.status('已添加一行空位（都是「待决定」，从积木盒拖块进来即可）');
        },

        stepCols: function (delta) {
            var cols = this.cols();
            var next = Math.max(MIN_COLS, Math.min(MAX_COLS, cols + delta));
            if (next === cols) {
                this.status(delta > 0 ? '已经到最大格数（' + MAX_COLS + '）' : '已经到最小格数（' + MIN_COLS + '）', true);
                return;
            }

            if (next < cols) {
                var overflow = this.data.rows.some(function (cells) {
                    return cells.slice(next).some(function (c) { return !!c; });
                });
                if (overflow) {
                    this.status('右侧还有块，先挪走或删除才能减少格数', true);
                    return;
                }
                this.data.rows.forEach(function (cells) { cells.length = next; });
            } else {
                this.data.rows.forEach(function (cells) {
                    while (cells.length < next) cells.push(null);
                });
            }

            this.data.cols = next;
            this.save();
            this.render();
            this.scheduleLayout();
            this.status('每行格数：' + cols + ' → ' + next);
        },

        clearAll: function () {
            if (!this.data.rows.length) { this.status('座位表本来就是空的'); return; }
            if (!window.confirm('清空整张座位表吗？（每行格数会保留）')) return;
            this.data.rows = [];
            this.save();
            this.render();
            this.scheduleLayout();
            this.status('已清空座位表');
        },

        // ------------------------------------------------------
        // 180° 翻转
        // ------------------------------------------------------

        // 把一行左右镜像（块的位置对称翻转，续格重建）
        mirrorRow: function (cells, cols) {
            var out = new Array(cols).fill(null);

            for (var c = 0; c < cols; c++) {
                var cell = cells[c];
                if (!cell || cell.t === 's') continue;

                var span = SPAN[cell.t] || 1;
                var start = cols - (c + span);
                if (start < 0) continue;

                out[start] = cell;
                for (var k = 1; k < span; k++) {
                    if (start + k < cols) out[start + k] = { t: 's' };
                }
            }

            return out;
        },

        rotate180: function () {
            var rows = this.data.rows;
            if (!rows.length) { this.status('座位表还是空的', true); return; }

            var cols = this.cols();
            var self = this;

            var mirrored = rows.slice().reverse().map(function (cells) {
                return self.mirrorRow(cells, cols);
            });

            this.data.rows = mirrored;
            this.save();
            this.render();
            this.scheduleLayout();
            this.status('已把座位表旋转 180°');
        },

        // ------------------------------------------------------
        // 快速生成 / 示例
        // ------------------------------------------------------

        generate: function () {
            var rowCount = this._intVal(this.el.genRows, 6, 1, MAX_ROWS);
            var perRow = this._intVal(this.el.genPerRow, 6, 1, 15);
            var withPodium = !!(this.el.genPodium && this.el.genPodium.checked);

            var cols = Math.max(MIN_COLS, Math.min(MAX_COLS, perRow * 2));
            var rows = [];

            if (withPodium) {
                var podiumRow = new Array(cols).fill(null);
                var start = Math.max(0, Math.min(cols - 2, Math.floor((cols - 2) / 2)));
                podiumRow[start] = { t: 'p' };
                podiumRow[start + 1] = { t: 's' };
                rows.push(podiumRow);
            }

            for (var r = 0; r < rowCount; r++) {
                var cells = new Array(cols).fill(null);
                var ci = 0;
                for (var i = 0; i < perRow; i++) {
                    if (ci + 2 > cols) break;
                    cells[ci] = { t: 'n', n: '' };
                    cells[ci + 1] = { t: 's' };
                    ci += 2;
                }
                rows.push(cells);
            }

            this.data = { version: 2, cols: cols, rows: rows };
            this.save();
            this.render();
            this.scheduleLayout();
            this.closePanels();
            this.status('已生成 ' + rows.length + ' 行 × 每行 ' + cols + ' 格：点座位即可填名字');
        },

        loadDemo: function () {
            var demoRows = [
                ['车一诺', '曾子墨', '单雯', '林清和', '沈亦然', '苏晚晴', '顾之澜', '许砚舟'],
                ['李知白', '周叙白', '陈砚秋', '郑南舟', '王云舒', '冯听澜', '唐屿', '霍云归'],
                ['吴青禾', '徐鹿鸣', '何星野', '罗照野', '高雨眠', '梁望舒', '叶知秋', '钟离']
            ];

            var cols = 2 * 8;          // 每行 8 人，每人占 2 格
            var rows = [];

            var podiumRow = new Array(cols).fill(null);
            var pStart = Math.floor((cols - 2) / 2);
            podiumRow[pStart] = { t: 'p' };
            podiumRow[pStart + 1] = { t: 's' };
            rows.push(podiumRow);

            demoRows.forEach(function (names) {
                var cells = new Array(cols).fill(null);
                var ci = 0;
                names.forEach(function (name) {
                    cells[ci] = { t: 'n', n: name };
                    cells[ci + 1] = { t: 's' };
                    ci += 2;
                });
                rows.push(cells);
            });

            this.data = { version: 2, cols: cols, rows: rows };
            this.save();
            this.closePanels();
            this.setMode('view');
            this.render();
            this.scheduleLayout();
            this.status('已载入示例座位表（可以在「✏️ 编辑」里拖动调整）');
        },

        _intVal: function (el, dflt, min, max) {
            var v = el ? parseInt(el.value, 10) : NaN;
            if (!isFinite(v)) v = dflt;
            return Math.max(min, Math.min(max, v));
        },

        // ------------------------------------------------------
        // 26 键屏幕键盘（标准键盘布局：等宽键帽，逐行向中间错位半格）
        // ------------------------------------------------------

        buildKeyboard: function () {
            var el = this.el.keyboard;
            if (!el || el.dataset.built === '1') return;

            // 20 个半格列：第一行 1 起；第二行错半格 2 起；第三行再错 1 格 4 起
            var layout = [
                { row: 1, start: 1, keys: 'qwertyuiop'.split('') },
                { row: 2, start: 2, keys: 'asdfghjkl'.split('') },
                { row: 3, start: 4, keys: 'zxcvbnm'.split('') }
            ];

            var html = layout.map(function (line) {
                return line.keys.map(function (ch, i) {
                    var col = line.start + i * 2;
                    return '<button type="button" class="seat-kb-key" data-key="' + ch +
                        '" style="grid-column:' + col + ' / span 2;grid-row:' + line.row + '">' +
                        ch.toUpperCase() + '</button>';
                }).join('');
            }).join('');

            el.innerHTML = html;
            el.dataset.built = '1';
        },

        // 键盘始终作用于搜索框：无论输入框是否处于激活状态，
        // 点一下键盘（或右侧的 ⌫ / 清空键）都会先把搜索框激活，再操作
        onVirtualKey: function (key) {
            var input = this.el.search;
            if (!input) return;

            if (key === '__clear') {
                input.value = '';
                input.focus();
                this.applySearch('');
                return;
            }

            if (key === '__back') {
                var v = input.value;
                if (!v) { input.focus(); return; }

                var focusedBack = document.activeElement === input;
                var backPos = (focusedBack && typeof input.selectionStart === 'number')
                    ? input.selectionStart
                    : v.length;
                if (backPos <= 0) backPos = v.length;

                input.value = v.slice(0, backPos - 1) + v.slice(backPos);
                input.focus();
                try { input.setSelectionRange(backPos - 1, backPos - 1); } catch (e) { /* 忽略 */ }

                this.applySearch(input.value);
                return;
            }

            var ch = String(key || '');
            if (!/^[a-z]$/.test(ch)) return;

            var value = input.value;
            var focused = document.activeElement === input;
            var caret = (focused && typeof input.selectionStart === 'number')
                ? input.selectionStart
                : value.length;

            input.value = value.slice(0, caret) + ch + value.slice(caret);
            input.focus();
            try { input.setSelectionRange(caret + 1, caret + 1); } catch (e) { /* 忽略 */ }

            this.applySearch(input.value);
        },

        // ------------------------------------------------------
        // 搜索（中文 / 拼音首字母，实时前缀高亮）
        // ------------------------------------------------------

        applySearch: function (raw) {
            this.search = String(raw == null ? '' : raw).trim().toLowerCase();

            var grid = this.el.grid;
            var q = this.search;
            var hits = 0;

            if (grid) {
                Array.prototype.forEach.call(grid.querySelectorAll('.seat-block'), function (blockEl) {
                    blockEl.classList.remove('seat-hit');
                    var label = blockEl.querySelector('.seat-label');
                    if (!q || blockEl.dataset.type !== 'n') return;

                    var name = label ? label.textContent.trim() : '';
                    if (!name) return;

                    if (App.ModalSeating.matchName(name, q)) {
                        hits += 1;
                        blockEl.classList.add('seat-hit');
                    }
                });
            }

            if (this.el.searchClear) this.el.searchClear.style.display = q ? 'block' : 'none';

            if (this.el.searchHint) {
                var hint = this.el.searchHint;
                if (!q) {
                    hint.textContent = '';
                    hint.style.display = 'none';
                } else if (!hits) {
                    hint.style.display = '';
                    hint.textContent = '没有匹配的人';
                } else {
                    hint.style.display = '';
                    hint.textContent = '匹配 ' + hits + ' 人（回车跳到第一个）';
                }
            }
        },

        matchName: function (name, q) {
            var P = App.Pinyin;
            if (P && typeof P.matchPrefix === 'function') {
                try { return !!P.matchPrefix(name, q); } catch (e) { /* 退回简单匹配 */ }
            }
            return name.toLowerCase().indexOf(q) === 0;
        },

        jumpToFirst: function () {
            var grid = this.el.grid;
            var el = grid ? grid.querySelector('.seat-block.seat-hit') : null;
            if (!el) return;

            try { el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' }); } catch (e) { el.scrollIntoView(); }

            el.classList.add('seat-flash');
            setTimeout(function () { el.classList.remove('seat-flash'); }, 1400);
        },

        // ------------------------------------------------------
        // 随机抽取（先快后慢，间隔越来越长，约 6 秒）
        // ------------------------------------------------------

        pool: function () {
            var out = [];
            (this.data.rows || []).forEach(function (cells, r) {
                (cells || []).forEach(function (cell, c) {
                    if (cell && cell.t === 'n' && cell.n) out.push({ r: r, c: c, name: cell.n });
                });
            });
            return out;
        },

        // 返回每次抽取的时间点（毫秒）；相邻间隔越来越大
        pickTimes: function (total, steps) {
            var n = Math.max(2, (steps | 0) || 2);
            var raw = [];
            var i;

            for (i = 0; i < n; i++) {
                var t = i / (n - 1);
                // 先快后慢：从约 45ms 逐渐拉长到约 320ms
                raw.push((45 + 275 * Math.pow(t, 1.25)) * (0.9 + Math.random() * 0.2));
            }

            // 保证间隔不回落（小抖动可能让曲线短暂变短）
            for (i = 1; i < n; i++) {
                if (raw[i] < raw[i - 1]) raw[i] = raw[i - 1] * (1 + Math.random() * 0.02);
            }

            var sum = raw.reduce(function (a, b) { return a + b; }, 0);
            var k = sum > 0 ? total / sum : 0;

            var times = [];
            var acc = 0;
            var prevStep = 0;

            for (i = 0; i < n; i++) {
                var step = Math.round(raw[i] * k);
                if (step < prevStep) step = prevStep;   // 间隔只增不减
                if (i === 0 && step < 1) step = 1;
                prevStep = step;
                acc += step;
                times.push(acc);
            }

            return times;
        },

        startPick: function () {
            if (this.rolling) return;

            if (this.mode !== 'view') this.setMode('view');

            var pool = this.pool();
            if (!pool.length) {
                this.status('还没有可以抽取的人名块，先在编辑模式里填几个名字吧', true);
                return;
            }

            this.hideOverlay();
            this.clearTimers();
            this.rolling = true;
            if (this.el.pickBtn) this.el.pickBtn.disabled = true;
            if (this.el.content) this.el.content.classList.add('seat-rolling');
            this.picked = null;
            this.refreshPick();

            var self = this;
            var holdMs = 900;
            var overlayMs = PICK_TOTAL - 250;
            var times = this.pickTimes(PICK_TOTAL - holdMs, PICK_STEPS);

            times.forEach(function (ms) {
                self.timers.push(setTimeout(function () {
                    if (!self.rolling) return;
                    var p = pool[Math.floor(Math.random() * pool.length)];
                    self.picked = { r: p.r, c: p.c, name: p.name };
                    self.refreshPick();
                }, ms));
            });

            this.timers.push(setTimeout(function () {
                if (!self.rolling) return;
                var p = pool[Math.floor(Math.random() * pool.length)];
                self.picked = { r: p.r, c: p.c, name: p.name };
                self.refreshPick();
            }, PICK_TOTAL - holdMs));

            this.timers.push(setTimeout(function () {
                if (!self.rolling) return;
                self.rolling = false;
                if (self.el.content) self.el.content.classList.remove('seat-rolling');
                if (self.el.pickBtn) self.el.pickBtn.disabled = false;
                self.showOverlay(self.picked);
            }, overlayMs));
        },

        refreshPick: function () {
            var grid = this.el.grid;
            if (!grid) return;

            Array.prototype.forEach.call(grid.querySelectorAll('.seat-picked'), function (el) {
                el.classList.remove('seat-picked');
            });

            if (!this.picked) return;
            var el = grid.querySelector('.seat-block.t-n[data-row="' + this.picked.r + '"][data-col="' + this.picked.c + '"]');
            if (el) el.classList.add('seat-picked');
        },

        showOverlay: function (picked) {
            var name = (picked && picked.name) || '（未命名）';

            if (this.el.overlayName) {
                this.el.overlayName.textContent = name;
                this.el.overlayName.classList.toggle('long', Array.from(name).length > 3);
            }

            var grid = this.el.grid;
            var el = (picked && grid) ? grid.querySelector('.seat-block.t-n[data-row="' + picked.r + '"][data-col="' + picked.c + '"]') : null;

            if (el) {
                try {
                    el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });
                } catch (e) { /* 忽略 */ }
            }

            if (this.el.overlay) this.el.overlay.classList.add('active');
            this.makeConfetti();
        },

        hideOverlay: function () {
            if (this.el.overlay) this.el.overlay.classList.remove('active');
            this.picked = null;
            this.refreshPick();
        },

        makeConfetti: function () {
            var card = this.el.overlay ? this.el.overlay.querySelector('.seat-pick-card') : null;
            var box = card ? card.querySelector('.seat-confetti') : null;

            if (!box) return;

            box.innerHTML = '';

            var colors = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff9f45', '#c084fc'];

            for (var i = 0; i < 18; i++) {
                var dot = document.createElement('span');
                var angle = (Math.PI * 2 * i) / 18 + Math.random() * 0.4;
                var dist = 130 + Math.random() * 130;

                dot.className = 'seat-confetti-dot';
                dot.style.background = colors[i % colors.length];
                dot.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
                dot.style.setProperty('--dy', Math.sin(angle) * dist - 30 + 'px');
                dot.style.animationDelay = (i * 18) + 'ms';

                box.appendChild(dot);
            }
        },

        clearTimers: function () {
            (this.timers || []).forEach(clearTimeout);
            this.timers = [];
        },

        cancelPick: function (silent) {
            var was = this.rolling;
            this.rolling = false;
            this.clearTimers();
            if (this.el.pickBtn) this.el.pickBtn.disabled = false;
            if (this.el.content) this.el.content.classList.remove('seat-rolling');
            this.picked = null;
            this.refreshPick();
            if (was && !silent) this.status('已取消抽取');
        },

        handleKey: function (ev) {
            var modal = this.el.modal;
            if (!modal || !modal.classList.contains('active')) return;
            if (ev.key !== 'Escape') return;

            if (this.pendingDrag || this.drag) { this.endDrag(false); return; }
            if (this.rolling) { this.cancelPick(); return; }
            if (this.el.overlay && this.el.overlay.classList.contains('active')) {
                this.hideOverlay();
                ev.stopPropagation();
            }
        },

        // ------------------------------------------------------
        // 拖动（积木盒 → 格子 / 格子 → 格子 / 格子 → 垃圾桶）
        // ------------------------------------------------------

        onPalettePointerDown: function (ev) {
            if (this.mode !== 'edit' || this.rolling || this.drag || this.pendingDrag) return;
            if (ev.pointerType === 'mouse' && ev.button !== 0) return;

            var chip = ev.target.closest('.seat-chip');
            if (!chip) return;

            if (this.edit) this.endEdit(true);

            var type = chip.dataset.type;
            this.pendingDrag = {
                kind: 'new',
                type: type,
                span: SPAN[type] || 1,
                srcEl: chip,
                x0: ev.clientX,
                y0: ev.clientY
            };
            this.attachDragListeners();
            ev.preventDefault();
        },

        onGridPointerDown: function (ev) {
            if (this.mode !== 'edit' || this.rolling || this.drag || this.pendingDrag) return;
            if (ev.pointerType === 'mouse' && ev.button !== 0) return;
            if (ev.target.closest('.seat-row-tools')) return;

            if (this.edit) this.endEdit(true);

            var blockEl = ev.target.closest('.seat-block');
            if (!blockEl) return;

            var type = blockEl.dataset.type;
            var rect = blockEl.getBoundingClientRect();

            this.pendingDrag = {
                kind: 'move',
                type: type,
                span: SPAN[type] || 1,
                from: {
                    r: parseInt(blockEl.dataset.row, 10),
                    c: parseInt(blockEl.dataset.col, 10)
                },
                srcEl: blockEl,
                x0: ev.clientX,
                y0: ev.clientY,
                grabX: ev.clientX - rect.left,
                grabY: ev.clientY - rect.top
            };
            this.attachDragListeners();
        },

        attachDragListeners: function () {
            if (this._dragBound) return;
            this._dragBound = true;

            var self = this;
            this._onMove = function (ev) { self.onDragMove(ev); };
            this._onUp = function () { self.endDrag(true); };

            document.addEventListener('pointermove', this._onMove, { passive: true });
            document.addEventListener('pointerup', this._onUp);
            document.addEventListener('pointercancel', this._onUp);
        },

        detachDragListeners: function () {
            if (!this._dragBound) return;
            this._dragBound = false;
            document.removeEventListener('pointermove', this._onMove);
            document.removeEventListener('pointerup', this._onUp);
            document.removeEventListener('pointercancel', this._onUp);
        },

        onDragMove: function (ev) {
            var p = this.pendingDrag;

            if (p) {
                if (Math.abs(ev.clientX - p.x0) + Math.abs(ev.clientY - p.y0) < 5) return;
                this.pendingDrag = null;
                if (p.kind === 'move') this.beginMoveDrag(p, ev);
                else this.beginNewDrag(p, ev);
            }

            if (this.drag) this.updateDrag(ev.clientX, ev.clientY);
        },

        beginMoveDrag: function (p, ev) {
            var block = this.blockAt(p.from.r, p.from.c);
            if (!block) { this.endDrag(false); return; }

            var rect = p.srcEl.getBoundingClientRect();
            var ghost = p.srcEl.cloneNode(true);
            ghost.classList.add('seat-drag-ghost');
            ghost.style.width = rect.width + 'px';
            ghost.style.height = rect.height + 'px';
            ghost.style.left = (ev.clientX - p.grabX) + 'px';
            ghost.style.top = (ev.clientY - p.grabY) + 'px';
            document.body.appendChild(ghost);

            p.srcEl.classList.add('seat-dragging');

            this.drag = {
                kind: 'move',
                type: block.t,
                span: SPAN[block.t] || 1,
                from: { r: p.from.r, c: p.from.c },
                ghost: ghost,
                srcEl: p.srcEl,
                grabX: p.grabX,
                grabY: p.grabY,
                target: null,
                inStage: false,
                overTrash: false
            };

            this.updateDrag(ev.clientX, ev.clientY);
        },

        beginNewDrag: function (p, ev) {
            var z = this._zoom();
            var m = this.metrics;
            var w = (p.span * m.cell + (p.span - 1) * m.gap) * z;
            var h = m.rowH * z;

            var ghost = document.createElement('div');
            ghost.className = 'seat-drag-ghost seat-block t-' + p.type;
            ghost.style.width = w + 'px';
            ghost.style.height = h + 'px';
            ghost.style.fontSize = Math.max(11, Math.min(30, Math.round(m.rowH * 0.42)) * z) + 'px';

            if (p.type === 'n') {
                var label = document.createElement('span');
                label.className = 'seat-label is-empty';
                label.textContent = '人名';
                ghost.appendChild(label);
            } else {
                var tag = document.createElement('span');
                tag.className = 'seat-tag';
                tag.textContent = TYPE_TAG[p.type] || '';
                ghost.appendChild(tag);
            }

            ghost.style.left = (ev.clientX - w / 2) + 'px';
            ghost.style.top = (ev.clientY - h / 2) + 'px';
            document.body.appendChild(ghost);

            this.drag = {
                kind: 'new',
                type: p.type,
                span: p.span,
                from: null,
                ghost: ghost,
                srcEl: p.srcEl,
                grabX: w / 2,
                grabY: h / 2,
                target: null,
                inStage: false,
                overTrash: false
            };

            this.updateDrag(ev.clientX, ev.clientY);
        },

        updateDrag: function (x, y) {
            var d = this.drag;
            if (!d) return;

            if (d.ghost) {
                d.ghost.style.left = (x - d.grabX) + 'px';
                d.ghost.style.top = (y - d.grabY) + 'px';
            }

            // 垃圾桶命中检测（只有从座位区拖起来的块可以删除）
            var overTrash = false;
            if (d.kind === 'move' && this.mode === 'edit' && this.el.trash) {
                var tr = this.el.trash.getBoundingClientRect();
                if (tr.width > 0 && tr.height > 0 &&
                    x >= tr.left && x <= tr.right &&
                    y >= tr.top && y <= tr.bottom) {
                    overTrash = true;
                }
            }

            d.overTrash = overTrash;
            this.setTrashHot(overTrash);

            if (overTrash) {
                d.inStage = false;
                d.target = null;
                this.paintDropMarks();
                return;
            }

            var stage = this.el.stage;
            var rect = stage ? stage.getBoundingClientRect() : null;

            d.inStage = !!rect && x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
            d.target = d.inStage ? this.findTarget(x, y) : null;

            this.paintDropMarks();
        },

        setTrashHot: function (on) {
            if (this.el.trash) this.el.trash.classList.toggle('hot', !!on);
        },

        // 找到指针附近最合适的落点：{ r, start }
        findTarget: function (x, y) {
            var grid = this.el.grid;
            if (!grid) return null;

            var rowEls = grid.querySelectorAll('.seat-row');
            if (!rowEls.length) return null;

            var best = null;
            var bestDist = Infinity;

            Array.prototype.forEach.call(rowEls, function (el) {
                var rect = el.getBoundingClientRect();
                var dist = y < rect.top ? rect.top - y : (y > rect.bottom ? y - rect.bottom : 0);
                if (dist < bestDist) { bestDist = dist; best = { el: el, rect: rect }; }
            });

            if (!best) return null;

            var r = parseInt(best.el.dataset.row, 10);
            var start = this.nearestStart(r, x, best.rect);
            if (start == null) return null;

            return { r: r, start: start };
        },

        // 行内空闲窗口：优先指针所在位置，其次离指针中心最近的窗口
        nearestStart: function (r, x, rowRect) {
            var cols = this.cols();
            var d = this.drag;
            var span = d ? d.span : 1;

            var cell = this.metrics.cell;
            var gap = this.metrics.gap;
            var contentUnits = cols * (cell + gap) + TOOLS_W;
            var z = (rowRect.width > 0 && contentUnits > 0) ? (rowRect.width / contentUnits) : 1;

            var pitch = (cell + gap) * z;
            var left0 = rowRect.left + (rowRect.width - contentUnits * z) / 2;
            var f = (x - left0) / pitch;
            var pointerIdx = Math.max(0, Math.min(cols - 1, Math.floor(f)));

            var free = this.freeMask(r);

            if (this.windowFree(free, pointerIdx, span, cols)) return pointerIdx;

            var bestStart = null;
            var bestDist = Infinity;

            for (var i = 0; i + span <= cols; i++) {
                if (!this.windowFree(free, i, span, cols)) continue;
                var dist = Math.abs((i + (span - 1) / 2) - f);
                if (dist < bestDist) { bestDist = dist; bestStart = i; }
            }

            return bestStart;
        },

        // 空闲掩码：true = 该格可以放下（空位，或拖动来源腾出的格子）
        freeMask: function (r) {
            var cols = this.cols();
            var cells = this.data.rows[r] || [];
            var d = this.drag;
            var src = (d && d.kind === 'move' && d.from && d.from.r === r) ? d.from : null;

            var mask = [];
            for (var c = 0; c < cols; c++) {
                if (src && c >= src.c && c < src.c + d.span) { mask.push(true); continue; }
                mask.push(!cells[c]);
            }
            return mask;
        },

        windowFree: function (mask, start, span, cols) {
            if (start < 0 || start + span > cols) return false;
            for (var k = 0; k < span; k++) {
                if (!mask[start + k]) return false;
            }
            return true;
        },

        paintDropMarks: function () {
            this.clearDropMarks();

            var d = this.drag;
            var grid = this.el.grid;
            if (!d || !grid) return;

            if (!d.target) {
                grid.classList.add('seat-drop-off');
                return;
            }

            var rowEl = grid.querySelector('.seat-row[data-row="' + d.target.r + '"]');
            if (rowEl) rowEl.classList.add('seat-drop-row');

            for (var c = d.target.start; c < d.target.start + d.span; c++) {
                var cellEl = grid.querySelector('[data-row="' + d.target.r + '"][data-col="' + c + '"]');
                if (cellEl) cellEl.classList.add('seat-drop-on');
            }
        },

        clearDropMarks: function () {
            var grid = this.el.grid;
            if (!grid) return;

            grid.classList.remove('seat-drop-off');
            Array.prototype.forEach.call(grid.querySelectorAll('.seat-drop-row, .seat-drop-on'), function (el) {
                el.classList.remove('seat-drop-row');
                el.classList.remove('seat-drop-on');
            });
        },

        endDrag: function (commit) {
            this.detachDragListeners();
            this.pendingDrag = null;

            var d = this.drag;
            if (!d) return;

            this.drag = null;
            this._lastDragEnd = Date.now();
            this.clearDropMarks();
            this.setTrashHot(false);

            if (d.ghost && d.ghost.parentNode) d.ghost.parentNode.removeChild(d.ghost);
            if (d.srcEl) d.srcEl.classList.remove('seat-dragging');

            if (!commit) return;

            // 拖到垃圾桶：删除该块（仅限从座位区拖起来的块）
            if (d.overTrash) {
                if (d.kind !== 'move' || !d.from) return;

                var old = this.blockAt(d.from.r, d.from.c);
                if (!old) return;

                this.clearCells(d.from.r, d.from.c);
                this.save();
                this.render();
                this.scheduleLayout();

                var extra = (old.t === 'n' && old.n) ? '（' + old.n + '）' : '';
                this.status('已删除' + (TYPE_LABEL[old.t] || '块') + extra + '，位置恢复成「待决定」');
                return;
            }

            if (!d.target) return;

            var r = d.target.r;
            var start = d.target.start;

            if (d.kind === 'move') {
                var block = this.blockAt(d.from.r, d.from.c);
                if (!block) return;

                this.clearCells(d.from.r, d.from.c);
                this.placeBlock(r, start, block);
                this.save();
                this.render();
                this.scheduleLayout();

                this.status('已把' + (TYPE_LABEL[block.t] || '块') + '移到第 ' + (r + 1) + ' 行第 ' + (start + 1) + ' 格');
            } else {
                var nb = { t: d.type };
                if (d.type === 'n') nb.n = '';

                this.placeBlock(r, start, nb);
                this.save();
                this.render();
                this.scheduleLayout();

                if (nb.t === 'n') {
                    this.beginEdit(r, start);
                } else {
                    this.status('已在第 ' + (r + 1) + ' 行第 ' + (start + 1) + ' 格放下' + (TYPE_LABEL[nb.t] || '块'));
                }
            }
        },

        // ------------------------------------------------------
        // CSV 导入 / 导出
        // 格式：一行 = 座位表的一行（第一行在教室最前方）
        //   文字      人名块（占 2 格）
        //   讲台      讲台块（占 2 格）
        //   空字段    待决定的空位（占 1 格）
        //   _         空人名块（占 2 格，还没有名字的座位）
        // 文本框与座位表实时双向同步：编辑文本框会自动应用；
        // 座位表有改动时文本框也会自动刷新（输入过程中不打扰光标）。
        // ------------------------------------------------------

        rowsToCsv: function (rows) {
            var lines = [];
            lines.push('# 座位表 CSV —— 每行 = 教室的一排，从上到下 = 从教室前方到后方');
            lines.push('# 字段从左到右 = 座位从左到右：文字 = 人名块（占 2 格）；讲台 = 讲台块（占 2 格）');
            lines.push('# 空字段 = 待决定的空位（占 1 格）；_ = 空人名块（还没有名字的座位）');
            lines.push('# 以 # 开头的行是注释，导入时忽略；分隔符支持英文/中文逗号或 Tab（可直接从 Excel 复制）');

            (rows || []).forEach(function (cells) {
                var fields = [];
                (cells || []).forEach(function (cell) {
                    if (!cell) { fields.push(''); return; }
                    if (cell.t === 's') return;
                    if (cell.t === 'p') { fields.push('讲台'); return; }
                    fields.push(cell.n ? cell.n : '_');
                });
                lines.push(fields.join(','));
            });

            return lines.join('\r\n') + '\r\n';
        },

        splitCsvLine: function (line) {
            var out = [];
            var cur = '';
            var inQ = false;

            for (var i = 0; i < line.length; i++) {
                var ch = line[i];
                if (inQ) {
                    if (ch === '"') {
                        if (line[i + 1] === '"') { cur += '"'; i += 1; }
                        else inQ = false;
                    } else {
                        cur += ch;
                    }
                } else if (ch === '"') {
                    inQ = true;
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

        csvToRows: function (text) {
            var rows = [];
            var self = this;

            String(text == null ? '' : text).replace(/\r\n?/g, '\n').split('\n').forEach(function (line) {
                var t = line.trim();
                if (!t || t.charAt(0) === '#') return;

                var cells = [];

                self.splitCsvLine(line).forEach(function (raw) {
                    var v = raw.trim();

                    if (!v || v === '　') { cells.push(null); return; }
                    // 兼容旧版导出的过道标记：统一退化为"待决定的空位"
                    if (/^[-—–－─]{1,4}$/.test(v) || v === '过道') { cells.push(null); return; }
                    if (v === '_' || v === '＿') { cells.push({ t: 'n', n: '' }); return; }
                    if (v === '讲台' || v === '講台' || v === '讲桌' || v.toLowerCase() === 'podium') { cells.push({ t: 'p' }); return; }

                    cells.push({ t: 'n', n: self.cleanName(v) });
                });

                rows.push(cells);
            });

            return rows;
        },

        applyCsv: function (live) {
            var text = this.el.csvText ? this.el.csvText.value : '';
            var rows = this.csvToRows(text);

            if (!rows.length) {
                if (!live) this.status('没有可导入的内容（空文本或全是注释）', true);
                return;
            }

            this.data = this.normalize({ version: 2, cols: 0, rows: rows });
            this.save();
            this.render();
            this.scheduleLayout();

            if (!live) {
                this.refreshCsvPreview(true);
                this.status('已导入 ' + this.data.rows.length + ' 行 · 每行 ' + this.data.cols + ' 格');
            }
        },

        // 文本框输入 → 座位表：防抖后实时应用（输入法组词期间跳过）
        scheduleCsvLive: function () {
            if (this._csvComposing) return;
            var self = this;
            clearTimeout(this._csvTimer);
            this._csvTimer = setTimeout(function () { self.applyCsv(true); }, CSV_LIVE_DELAY);
        },

        refreshCsvPreview: function (force) {
            var panel = this.el.csvPanel;
            var text = this.el.csvText;
            if (!panel || !text) return;
            if (!panel.classList.contains('active')) return;
            if (!force && document.activeElement === text) return;
            text.value = this.rowsToCsv(this.data.rows);
        },

        downloadCsv: function () {
            if (!this.el.csvText) return;

            // textarea 会把换行统一成 \n，下载时补回 Windows 风格的 CRLF
            var content = '\ufeff' + String(this.el.csvText.value || '').replace(/\r?\n/g, '\r\n');
            var blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
            var url = URL.createObjectURL(blob);

            var d = new Date();
            var pad = function (n) { return (n < 10 ? '0' : '') + n; };
            var name = '座位表-' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + '-' + pad(d.getHours()) + pad(d.getMinutes()) + '.csv';

            var a = document.createElement('a');
            a.href = url;
            a.download = name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(function () { URL.revokeObjectURL(url); }, 2000);

            this.status('已下载 ' + name);
        },

        importFile: function () {
            var input = this.el.csvFile;
            if (!input || !input.files || !input.files[0]) return;

            var self = this;
            var file = input.files[0];
            var reader = new FileReader();

            reader.onload = function () {
                if (self.el.csvText) self.el.csvText.value = String(reader.result || '');
                self.applyCsv();
            };
            reader.onerror = function () { self.status('读取文件失败', true); };
            reader.readAsText(file, 'utf-8');

            input.value = '';
        }
    };
})();
