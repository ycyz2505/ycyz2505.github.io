// ============================================================
//  js/features/modal_seat_map.js
//  座位表：展示、编辑、搜索、随机抽人、CSV 导入导出
//  数据存 Store 的 seatmap：{ columns, rows, blocks: [...] }
// ============================================================
window.App = window.App || {};

window.App.SeatMap = {
    data: null,
    editing: false,
    drawing: false,
    draggedId: null,
    selectedId: null,
    resultTimer: null,
    modal: null,
    board: null,
    searchInput: null,
    statusEl: null,
    fileInput: null,
    selectionPanel: null,

    // ---------- 初始化 ----------
    init() {
        this.modal = document.getElementById('seatMapModal');
        this.board = document.getElementById('seatBoard');
        this.searchInput = document.getElementById('seatSearchInput');
        this.statusEl = document.getElementById('seatMapStatus');
        this.fileInput = document.getElementById('seatCsvFile');
        this.selectionPanel = document.getElementById('seatSelectionPanel');

        if (!this.modal || !this.board) {
            console.warn('[SeatMap] 关键 DOM 未找到，跳过初始化');
            return;
        }

        this.data = this.normalizeData(window.App.Store?.get('seatmap'));
        this.bindEvents();
        this.render();
    },

    normalizeData(value) {
        const source = (value && typeof value === 'object') ? value : {};
        return {
            columns: this.clampNumber(source.columns, 4, 24, 12),
            rows: this.clampNumber(source.rows, 2, 20, 8),
            blocks: Array.isArray(source.blocks)
                ? source.blocks
                    .filter(item => item && ['person', 'aisle', 'podium'].includes(item.type))
                    .map(item => ({
                        id: String(item.id || `${item.type}-${this.makeId()}`),
                        type: item.type,
                        name: String(item.name || (item.type === 'podium' ? '讲台' : '')).trim()
                    }))
                : []
        };
    },

    clampNumber(value, min, max, fallback) {
        const n = parseInt(value, 10);
        return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
    },

    // ---------- 事件绑定 ----------
    bindEvents() {
        document.getElementById('seatMapButton')?.addEventListener('click', () => this.open());
        document.getElementById('closeSeatMap')?.addEventListener('click', () => this.close());

        document.getElementById('maximizeSeatMap')?.addEventListener('click', function () {
            const modal = this.closest('.settings-modal');
            if (!modal) return;
            modal.classList.toggle('fullscreen');
            this.textContent = modal.classList.contains('fullscreen') ? '🗗' : '⛶';
        });

        this.modal.addEventListener('click', e => {
            if (e.target === this.modal && !this.drawing) this.close();
        });

        this.searchInput?.addEventListener('input', () => this.applySearch());

        document.getElementById('toggleSeatEdit')?.addEventListener('click', () => this.toggleEditing());
        document.getElementById('addSeatPerson')?.addEventListener('click', () => this.promptAddPerson());
        document.getElementById('addSeatAisle')?.addEventListener('click', () => this.addBlock('aisle', ''));
        document.getElementById('addSeatPodium')?.addEventListener('click', () => this.addBlock('podium', '讲台'));
        document.getElementById('deleteSelectedSeat')?.addEventListener('click', () => this.deleteSelected());
        document.getElementById('applySeatMapSize')?.addEventListener('click', () => this.applySize());

        document.getElementById('importSeatCsv')?.addEventListener('click', () => this.fileInput?.click());
        this.fileInput?.addEventListener('change', e => {
            const file = e.target.files?.[0];
            if (file) this.importCsv(file);
            e.target.value = '';
        });
        document.getElementById('exportSeatCsv')?.addEventListener('click', () => this.exportCsv());

        document.getElementById('drawSeatPerson')?.addEventListener('click', () => this.randomDraw());
        document.getElementById('closeSeatResult')?.addEventListener('click', () => this.closeResult());
        document.getElementById('seatResultOverlay')?.addEventListener('click', e => {
            if (e.target.id === 'seatResultOverlay') this.closeResult();
        });

        // 拖拽排序
        this.board.addEventListener('dragstart', e => this.onDragStart(e));
        this.board.addEventListener('dragend', e => this.onDragEnd(e));
        this.board.addEventListener('dragover', e => this.onDragOver(e));
        this.board.addEventListener('drop', e => this.onDrop(e));

        // 点击块：选中 / 删除
        this.board.addEventListener('click', e => this.onBlockClick(e));
    },

    // ---------- 打开 / 关闭 ----------
    open() {
        this.data = this.normalizeData(window.App.Store?.get('seatmap'));
        this.selectedId = null;
        this.render();
        this.modal.classList.add('active');
        setTimeout(() => this.searchInput?.focus(), 250);
    },

    close() {
        if (this.drawing) return;
        this.modal.classList.remove('active');
        this.modal.classList.remove('fullscreen');
        const maxBtn = this.modal.querySelector('.maximize-btn');
        if (maxBtn) maxBtn.textContent = '⛶';
        this.editing = false;
        this.selectedId = null;
        this.closeResult();
    },

    // ---------- 编辑模式 ----------
    toggleEditing() {
        if (this.drawing) return;
        this.editing = !this.editing;

        const btn = document.getElementById('toggleSeatEdit');
        if (btn) {
            btn.textContent = this.editing ? '完成编辑' : '编辑模式';
            btn.classList.toggle('primary', this.editing);
        }

        if (!this.editing) this.selectedId = null;

        this.render();
        this.setStatus(this.editing
            ? '拖动块可调整顺序；点击块选中后可改名或删除'
            : '座位表已保存');
    },

    // ---------- 新增块 ----------
    promptAddPerson() {
        const name = window.prompt('请输入姓名：', '');
        if (name === null) return;
        const trimmed = name.trim();
        if (!trimmed) return;
        this.addBlock('person', trimmed);
    },

    addBlock(type, name) {
        this.data.blocks.push({
            id: `${type}-${this.makeId()}`,
            type,
            name: name || (type === 'podium' ? '讲台' : '')
        });
        this.save();
        this.render();
        this.setStatus(type === 'person' ? `已添加：${name}` : '已添加');
    },

    // ---------- 删除 ----------
    deleteBlock(id) {
        this.data.blocks = this.data.blocks.filter(b => b.id !== id);
        if (this.selectedId === id) this.selectedId = null;
        this.save();
        this.render();
    },

    deleteSelected() {
        if (!this.selectedId) {
            this.setStatus('请先点击一个块进行选中');
            return;
        }
        this.deleteBlock(this.selectedId);
        this.setStatus('已删除');
    },

    // ---------- 尺寸 ----------
    applySize() {
        const rowsInput = document.getElementById('seatMapRows');
        const colsInput = document.getElementById('seatMapCols');
        if (!rowsInput || !colsInput) return;

        const rows = this.clampNumber(rowsInput.value, 2, 20, 8);
        const cols = this.clampNumber(colsInput.value, 4, 24, 12);

        rowsInput.value = rows;
        colsInput.value = cols;

        this.data.rows = rows;
        this.data.columns = cols;
        this.save();
        this.render();
        this.setStatus(`尺寸已更新：${rows} 行 × ${cols} 列`);
    },

    // ---------- 渲染 ----------
    render() {
        if (!this.board || !this.data) return;

        this.board.innerHTML = '';
        this.board.style.setProperty('--seat-columns', this.data.columns);
        this.board.style.setProperty('--seat-rows', this.data.rows);

        const rowsInput = document.getElementById('seatMapRows');
        const colsInput = document.getElementById('seatMapCols');
        if (rowsInput) rowsInput.value = this.data.rows;
        if (colsInput) colsInput.value = this.data.columns;

        if (!this.data.blocks.length) {
            const empty = document.createElement('div');
            empty.className = 'seat-empty';
            empty.innerHTML = '座位表还是空的<br>进入编辑模式后可添加人名块、过道块或讲台块';
            this.board.appendChild(empty);
            this.renderSelection();
            return;
        }

        const frag = document.createDocumentFragment();

        this.data.blocks.forEach(item => {
            const block = document.createElement('div');
            block.className = `seat-block ${item.type}`;
            block.dataset.id = item.id;

            if (this.editing) {
                block.classList.add('editing');
                block.draggable = true;
            }

            if (item.type === 'person') {
                block.textContent = item.name || '未命名';
                block.dataset.searchName = this.normalizeSearch(item.name);
                block.dataset.initials = this.getPinyinInitials(item.name);
            } else if (item.type === 'podium') {
                block.textContent = item.name || '讲台';
            } else {
                block.textContent = '过道';
            }

            if (this.editing) {
                const del = document.createElement('button');
                del.type = 'button';
                del.className = 'seat-delete-mark';
                del.dataset.id = item.id;
                del.title = '删除';
                del.textContent = '×';
                block.appendChild(del);
            }

            if (this.selectedId === item.id) {
                block.classList.add('selected');
            }

            frag.appendChild(block);
        });

        this.board.appendChild(frag);

        this.applySearch();
        this.renderSelection();
    },

    renderSelection() {
        if (!this.selectionPanel) return;

        const block = this.selectedId
            ? this.data.blocks.find(b => b.id === this.selectedId)
            : null;

        let html = '<h4>当前选中</h4>';

        if (!block) {
            html += '<div class="seat-empty-selection">编辑模式下点击一个块进行编辑</div>';
        } else {
            const typeName = { person: '人名', aisle: '过道', podium: '讲台' }[block.type];
            const displayName = block.type === 'aisle' ? '过道块' : (block.name || typeName);

            html += `<div class="seat-selected-name">${this.escapeHtml(displayName)}</div>`;
            html += `<div style="font-size:12px;color:#888;">类型：${typeName}</div>`;
            html += '<div class="seat-selected-actions">';
            if (block.type !== 'aisle') {
                html += '<button type="button" data-action="rename">改名</button>';
            }
            html += '<button type="button" data-action="delete">删除</button>';
            html += '</div>';
        }

        this.selectionPanel.innerHTML = html;

        if (block) {
            this.selectionPanel.querySelector('[data-action="rename"]')?.addEventListener('click', () => {
                const newName = window.prompt('修改名称：', block.name || '');
                if (newName === null) return;
                block.name = newName.trim() || (block.type === 'podium' ? '讲台' : '未命名');
                this.save();
                this.render();
            });

            this.selectionPanel.querySelector('[data-action="delete"]')?.addEventListener('click', () => {
                this.deleteBlock(block.id);
            });
        }
    },

    // ---------- 点击块 ----------
    onBlockClick(e) {
        const del = e.target.closest('.seat-delete-mark');
        if (del && this.editing) {
            e.stopPropagation();
            this.deleteBlock(del.dataset.id);
            return;
        }

        const blockEl = e.target.closest('.seat-block');
        if (!blockEl || !this.editing) return;

        const id = blockEl.dataset.id;
        this.selectedId = (this.selectedId === id) ? null : id;

        this.board.querySelectorAll('.seat-block.selected').forEach(el => el.classList.remove('selected'));
        if (this.selectedId) {
            this.board.querySelector(`[data-id="${this.selectedId}"]`)?.classList.add('selected');
        }

        this.renderSelection();
    },

    // ---------- 拖拽 ----------
    onDragStart(e) {
        if (!this.editing) { e.preventDefault(); return; }
        const blockEl = e.target.closest('.seat-block');
        if (!blockEl) return;

        this.draggedId = blockEl.dataset.id;
        blockEl.classList.add('dragging');

        if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', this.draggedId);
        }
    },

    onDragEnd(e) {
        e.target.closest('.seat-block')?.classList.remove('dragging');
        this.board.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
        this.draggedId = null;
    },

    onDragOver(e) {
        if (!this.editing) return;
        const target = e.target.closest('.seat-block');
        if (!target || target.dataset.id === this.draggedId) return;
        e.preventDefault();
        this.board.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
        target.classList.add('drag-over');
    },

    onDrop(e) {
        if (!this.editing) return;
        const target = e.target.closest('.seat-block');
        const sourceId = this.draggedId || e.dataTransfer?.getData('text/plain');
        if (!target || !sourceId) return;
        e.preventDefault();

        const sourceIdx = this.data.blocks.findIndex(b => b.id === sourceId);
        const targetIdx = this.data.blocks.findIndex(b => b.id === target.dataset.id);
        if (sourceIdx < 0 || targetIdx < 0 || sourceIdx === targetIdx) return;

        const [moved] = this.data.blocks.splice(sourceIdx, 1);
        this.data.blocks.splice(targetIdx, 0, moved);

        this.save();
        this.render();
    },

    // ---------- 搜索 ----------
    applySearch() {
        const query = this.normalizeSearch(this.searchInput?.value || '');

        this.board.querySelectorAll('.seat-block.person').forEach(el => {
            const name = el.dataset.searchName || '';
            const initials = el.dataset.initials || '';
            const match = Boolean(query) && (name.startsWith(query) || initials.startsWith(query));
            el.classList.toggle('search-match', match);
        });
    },

    normalizeSearch(value) {
        return String(value || '').trim().toLowerCase().replace(/\s+/g, '');
    },

    getPinyinInitials(name) {
        const collator = new Intl.Collator('zh-Hans-u-co-pinyin');
        const boundaries = [
            ['a', '阿'], ['b', '八'], ['c', '嚓'], ['d', '搭'],
            ['e', '蛾'], ['f', '发'], ['g', '噶'], ['h', '哈'],
            ['j', '击'], ['k', '喀'], ['l', '垃'], ['m', '妈'],
            ['n', '拿'], ['o', '哦'], ['p', '啪'], ['q', '期'],
            ['r', '然'], ['s', '撒'], ['t', '塌'], ['w', '挖'],
            ['x', '昔'], ['y', '压'], ['z', '匝']
        ];

        return Array.from(this.normalizeSearch(name)).map(ch => {
            if (/[a-z0-9]/.test(ch)) return ch;
            for (let i = boundaries.length - 1; i >= 0; i--) {
                if (collator.compare(ch, boundaries[i][1]) >= 0) return boundaries[i][0];
            }
            return '';
        }).join('');
    },

    // ---------- 随机抽人 ----------
    async randomDraw() {
        if (this.drawing) return;

        const people = this.data.blocks.filter(b => b.type === 'person' && b.name.trim());
        if (!people.length) {
            this.setStatus('座位表中还没有可抽取的人');
            return;
        }

        this.drawing = true;
        if (this.editing) this.toggleEditing();
        if (this.searchInput) this.searchInput.value = '';
        this.applySearch();
        this.setStatus('正在随机抽取……');

        const duration = 6000;
        const intervals = [];
        let elapsed = 0;
        let interval = 430;

        while (elapsed + interval < duration - 650) {
            intervals.push(interval);
            elapsed += interval;
            interval = Math.max(70, interval * 0.84);
        }
        intervals.push(Math.max(70, duration - elapsed));

        let lastPerson = null;

        for (let i = 0; i < intervals.length; i++) {
            const isLast = (i === intervals.length - 1);
            let person = people[Math.floor(Math.random() * people.length)];

            if (!isLast && people.length > 1 && person === lastPerson) {
                person = people[(people.indexOf(person) + 1) % people.length];
            }

            lastPerson = person;
            this.highlightPerson(person.id);
            await this.wait(intervals[i]);
        }

        this.drawing = false;
        this.setStatus(`抽取结果：${lastPerson.name}`);
        this.showResult(lastPerson.name);
    },

    highlightPerson(id) {
        this.board.querySelectorAll('.random-active').forEach(el => el.classList.remove('random-active'));
        this.board.querySelector(`.seat-block.person[data-id="${id}"]`)?.classList.add('random-active');
    },

    showResult(name) {
        const overlay = document.getElementById('seatResultOverlay');
        const nameEl = document.getElementById('seatResultName');
        if (!overlay || !nameEl) return;

        nameEl.textContent = name;
        overlay.classList.add('active');

        clearTimeout(this.resultTimer);
        this.resultTimer = setTimeout(() => this.closeResult(), 5000);
    },

    closeResult() {
        clearTimeout(this.resultTimer);
        document.getElementById('seatResultOverlay')?.classList.remove('active');
    },

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    // ---------- CSV 导入导出 ----------
    importCsv(file) {
        const reader = new FileReader();

        reader.onload = () => {
            try {
                const parsed = this.parseCsv(String(reader.result || ''));
                if (!parsed.blocks.length) throw new Error('CSV 中没有有效的块');

                this.data = parsed;
                this.selectedId = null;
                this.save();
                this.render();
                this.setStatus('CSV 导入成功');
            } catch (err) {
                alert(`导入失败：${err.message}`);
            }
        };

        reader.onerror = () => alert('文件读取失败');
        reader.readAsText(file, 'UTF-8');
    },

    parseCsv(text) {
        const lines = text
            .replace(/^\uFEFF/, '')
            .split(/\r?\n/)
            .map(l => l.trim())
            .filter(Boolean);

        let columns = 12;
        let rows = 8;
        const blocks = [];

        lines.forEach((line, i) => {
            const fields = this.parseCsvLine(line);
            const type = (fields[0] || '').toLowerCase();

            if (i === 0 && type === 'type') return;

            if (type === 'config') {
                columns = this.clampNumber(fields[1], 4, 24, columns);
                rows = this.clampNumber(fields[2], 2, 20, rows);
                return;
            }

            if (!['person', 'aisle', 'podium'].includes(type)) {
                throw new Error(`第 ${i + 1} 行类型无效：${fields[0]}`);
            }

            const name = String(fields[1] || '').trim();
            if (type === 'person' && !name) {
                throw new Error(`第 ${i + 1} 行缺少人名`);
            }

            blocks.push({
                id: `${type}-${this.makeId()}-${i}`,
                type,
                name: name || (type === 'podium' ? '讲台' : '')
            });
        });

        return { columns, rows, blocks };
    },

    parseCsvLine(line) {
        const result = [];
        let current = '';
        let quoted = false;

        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '"') {
                if (quoted && line[i + 1] === '"') {
                    current += '"';
                    i++;
                } else {
                    quoted = !quoted;
                }
            } else if (ch === ',' && !quoted) {
                result.push(current.trim());
                current = '';
            } else {
                current += ch;
            }
        }
        result.push(current.trim());

        if (quoted) throw new Error('CSV 中存在未闭合的双引号');
        return result;
    },

    exportCsv() {
        const lines = [
            'type,name',
            `config,${this.data.columns},${this.data.rows}`
        ];

        this.data.blocks.forEach(b => {
            lines.push([b.type, this.csvEscape(b.name || '')].join(','));
        });

        const blob = new Blob(['\uFEFF' + lines.join('\r\n')], {
            type: 'text/csv;charset=utf-8'
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = '座位表.csv';
        document.body.appendChild(link);
        link.click();
        link.remove();

        setTimeout(() => URL.revokeObjectURL(url), 1000);
        this.setStatus('CSV 已导出');
    },

    csvEscape(value) {
        const text = String(value);
        return /[",\r\n]/.test(text)
            ? `"${text.replace(/"/g, '""')}"`
            : text;
    },

    // ---------- 工具 ----------
    save() {
        if (!window.App.Store) return;
        window.App.Store.set('seatmap', {
            columns: this.data.columns,
            rows: this.data.rows,
            blocks: this.data.blocks.map(b => ({ ...b }))
        });
    },

    setStatus(message) {
        if (this.statusEl) this.statusEl.textContent = message;
    },

    makeId() {
        if (window.crypto && typeof window.crypto.randomUUID === 'function') {
            return window.crypto.randomUUID();
        }
        return Date.now().toString(36) + Math.random().toString(36).slice(2);
    },

    escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
};