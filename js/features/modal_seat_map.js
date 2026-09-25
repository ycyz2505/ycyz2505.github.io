(function () {
    window.App = window.App || {};

    const SeatMap = {
        data: null,
        editing: false,
        drawing: false,
        draggedId: null,
        resultTimer: null,

        init() {
            this.modal = document.getElementById('seatMapModal');
            this.content = document.getElementById('seatMapContent');
            this.grid = document.getElementById('seatMapGrid');
            this.searchInput = document.getElementById('seatSearchInput');
            this.status = document.getElementById('seatStatus');
            this.fileInput = document.getElementById('seatCsvFile');

            if (!this.modal || !this.grid) return;

            this.data = this.normalizeData(
                window.App.Store.get('seatmap')
            );

            this.bindEvents();
            this.render();
        },

        normalizeData(value) {
            const source = value && typeof value === 'object'
                ? value
                : {};

            return {
                columns: this.clampNumber(source.columns, 4, 30, 12),
                rows: this.clampNumber(source.rows, 1, 30, 6),
                blocks: Array.isArray(source.blocks)
                    ? source.blocks
                        .filter(item =>
                            item &&
                            ['person', 'aisle', 'podium']
                                .includes(item.type)
                        )
                        .map(item => ({
                            id: String(
                                item.id ||
                                `${item.type}-${this.makeId()}`
                            ),
                            type: item.type,
                            name: String(
                                item.name ||
                                (item.type === 'podium' ? '讲台' : '')
                            ).trim()
                        }))
                    : []
            };
        },

        clampNumber(value, min, max, fallback) {
            const number = parseInt(value, 10);
            return Number.isFinite(number)
                ? Math.min(max, Math.max(min, number))
                : fallback;
        },

        bindEvents() {
            document
                .getElementById('seatMapNav')
                ?.addEventListener('click', event => {
                    event.preventDefault();
                    this.open();
                });

            document
                .getElementById('seatMapClose')
                ?.addEventListener('click', () => this.close());

            document
                .getElementById('seatMapMaximize')
                ?.addEventListener('click', () => {
                    this.modal.classList.toggle('fullscreen');
                });

            this.modal.addEventListener('click', event => {
                if (event.target === this.modal) this.close();
            });

            this.searchInput?.addEventListener('input', () => {
                this.applySearch();
            });

            document
                .getElementById('seatEditToggle')
                ?.addEventListener('click', () => {
                    this.setEditing(!this.editing);
                });

            document
                .getElementById('seatRandomButton')
                ?.addEventListener('click', () => {
                    this.randomDraw();
                });

            document
                .getElementById('seatAddPerson')
                ?.addEventListener('click', () => {
                    const input =
                        document.getElementById('seatNewPersonName');

                    const name = input.value.trim();

                    if (!name) {
                        input.focus();
                        this.setStatus('请先输入人名');
                        return;
                    }

                    this.addBlock('person', name);
                    input.value = '';
                });

            document
                .getElementById('seatAddAisle')
                ?.addEventListener('click', () => {
                    this.addBlock('aisle', '');
                });

            document
                .getElementById('seatAddPodium')
                ?.addEventListener('click', () => {
                    this.addBlock('podium', '讲台');
                });

            document
                .getElementById('seatClearButton')
                ?.addEventListener('click', () => {
                    if (!confirm('确定清空整个座位表吗？')) return;
                    this.data.blocks = [];
                    this.save();
                    this.render();
                });

            document
                .getElementById('seatColumnsInput')
                ?.addEventListener('change', event => {
                    this.data.columns = this.clampNumber(
                        event.target.value,
                        4,
                        30,
                        12
                    );
                    event.target.value = this.data.columns;
                    this.save();
                    this.render();
                });

            document
                .getElementById('seatRowsInput')
                ?.addEventListener('change', event => {
                    this.data.rows = this.clampNumber(
                        event.target.value,
                        1,
                        30,
                        6
                    );
                    event.target.value = this.data.rows;
                    this.save();
                    this.render();
                });

            document
                .getElementById('seatImportButton')
                ?.addEventListener('click', () => {
                    this.fileInput.click();
                });

            this.fileInput?.addEventListener('change', event => {
                const file = event.target.files?.[0];
                if (file) this.importCsv(file);
                event.target.value = '';
            });

            document
                .getElementById('seatExportButton')
                ?.addEventListener('click', () => {
                    this.exportCsv();
                });

            this.grid.addEventListener('dragstart', event => {
                if (!this.editing) {
                    event.preventDefault();
                    return;
                }

                const block = event.target.closest('.seat-block');
                if (!block) return;

                this.draggedId = block.dataset.id;
                block.classList.add('dragging');

                if (event.dataTransfer) {
                    event.dataTransfer.effectAllowed = 'move';
                    event.dataTransfer.setData(
                        'text/plain',
                        this.draggedId
                    );
                }
            });

            this.grid.addEventListener('dragend', event => {
                event.target
                    .closest('.seat-block')
                    ?.classList.remove('dragging');

                this.grid
                    .querySelectorAll('.drag-over')
                    .forEach(item =>
                        item.classList.remove('drag-over')
                    );

                this.draggedId = null;
            });

            this.grid.addEventListener('dragover', event => {
                if (!this.editing) return;

                const target = event.target.closest('.seat-block');
                if (!target || target.dataset.id === this.draggedId) {
                    return;
                }

                event.preventDefault();

                this.grid
                    .querySelectorAll('.drag-over')
                    .forEach(item =>
                        item.classList.remove('drag-over')
                    );

                target.classList.add('drag-over');
            });

            this.grid.addEventListener('drop', event => {
                if (!this.editing) return;

                const target = event.target.closest('.seat-block');
                const sourceId =
                    this.draggedId ||
                    event.dataTransfer?.getData('text/plain');

                if (!target || !sourceId) return;

                event.preventDefault();
                this.moveBlock(sourceId, target.dataset.id);
            });

            this.grid.addEventListener('click', event => {
                const deleteButton =
                    event.target.closest('.seat-delete-mark');

                if (!deleteButton || !this.editing) return;

                event.stopPropagation();
                this.deleteBlock(deleteButton.dataset.id);
            });

            document
                .getElementById('seatResultOverlay')
                ?.addEventListener('click', () => {
                    this.closeResult();
                });
        },

        open() {
            this.data = this.normalizeData(
                window.App.Store.get('seatmap')
            );

            this.render();
            this.modal.classList.add('active');

            setTimeout(() => {
                this.searchInput?.focus();
            }, 250);
        },

        close() {
            if (this.drawing) return;

            this.modal.classList.remove('active');
            this.modal.classList.remove('fullscreen');
            this.closeResult();
        },

        setEditing(enabled) {
            if (this.drawing) return;

            this.editing = enabled;
            this.content.classList.toggle('edit-mode', enabled);

            const button =
                document.getElementById('seatEditToggle');

            if (button) {
                button.textContent = enabled
                    ? '完成编辑'
                    : '编辑座位表';
            }

            this.render();
            this.setStatus(
                enabled
                    ? '拖动块可调整顺序，右上角按钮可删除'
                    : '座位表已保存'
            );
        },

        addBlock(type, name) {
            this.data.blocks.push({
                id: `${type}-${this.makeId()}`,
                type,
                name
            });

            this.save();
            this.render();
        },

        deleteBlock(id) {
            this.data.blocks =
                this.data.blocks.filter(item => item.id !== id);

            this.save();
            this.render();
        },

        moveBlock(sourceId, targetId) {
            const sourceIndex =
                this.data.blocks.findIndex(item =>
                    item.id === sourceId
                );

            const targetIndex =
                this.data.blocks.findIndex(item =>
                    item.id === targetId
                );

            if (
                sourceIndex < 0 ||
                targetIndex < 0 ||
                sourceIndex === targetIndex
            ) {
                return;
            }

            const [block] =
                this.data.blocks.splice(sourceIndex, 1);

            this.data.blocks.splice(targetIndex, 0, block);
            this.save();
            this.render();
        },

        save() {
            window.App.Store.set('seatmap', {
                columns: this.data.columns,
                rows: this.data.rows,
                blocks: this.data.blocks.map(item => ({ ...item }))
            });
        },

        render() {
            if (!this.grid || !this.data) return;

            this.grid.innerHTML = '';
            this.grid.style.setProperty(
                '--seat-columns',
                this.data.columns
            );

            this.grid.style.gridTemplateRows =
                `repeat(${this.data.rows}, 68px)`;

            this.grid.classList.toggle(
                'editing',
                this.editing
            );

            const columnsInput =
                document.getElementById('seatColumnsInput');

            const rowsInput =
                document.getElementById('seatRowsInput');

            if (columnsInput) {
                columnsInput.value = this.data.columns;
            }

            if (rowsInput) {
                rowsInput.value = this.data.rows;
            }

            if (!this.data.blocks.length) {
                const empty = document.createElement('div');
                empty.className = 'seat-empty';
                empty.innerHTML =
                    '座位表还是空的<br>进入编辑模式添加人名、过道或讲台';
                this.grid.appendChild(empty);
                return;
            }

            this.data.blocks.forEach(item => {
                const block = document.createElement('div');
                block.className = `seat-block ${item.type}`;
                block.dataset.id = item.id;
                block.draggable = this.editing;

                if (item.type === 'person') {
                    block.textContent = item.name || '未命名';
                    block.dataset.searchName =
                        this.normalizeSearch(item.name);
                    block.dataset.initials =
                        this.getPinyinInitials(item.name);
                } else if (item.type === 'podium') {
                    block.textContent = item.name || '讲台';
                } else {
                    block.textContent = '过道';
                }

                if (this.editing) {
                    const remove = document.createElement('button');
                    remove.type = 'button';
                    remove.className = 'seat-delete-mark';
                    remove.dataset.id = item.id;
                    remove.title = '删除';
                    remove.textContent = '×';
                    block.appendChild(remove);
                }

                this.grid.appendChild(block);
            });

            this.applySearch();
        },

        applySearch() {
            const query = this.normalizeSearch(
                this.searchInput?.value || ''
            );

            this.grid
                .querySelectorAll('.seat-block.person')
                .forEach(block => {
                    const name = block.dataset.searchName || '';
                    const initials = block.dataset.initials || '';

                    block.classList.toggle(
                        'search-match',
                        Boolean(query) &&
                        (
                            name.startsWith(query) ||
                            initials.startsWith(query)
                        )
                    );
                });
        },

        normalizeSearch(value) {
            return String(value || '')
                .trim()
                .toLowerCase()
                .replace(/\s+/g, '');
        },

        getPinyinInitials(name) {
            const collator = new Intl.Collator(
                'zh-Hans-u-co-pinyin'
            );

            const boundaries = [
                ['a', '阿'], ['b', '八'], ['c', '嚓'],
                ['d', '搭'], ['e', '蛾'], ['f', '发'],
                ['g', '噶'], ['h', '哈'], ['j', '击'],
                ['k', '喀'], ['l', '垃'], ['m', '妈'],
                ['n', '拿'], ['o', '哦'], ['p', '啪'],
                ['q', '期'], ['r', '然'], ['s', '撒'],
                ['t', '塌'], ['w', '挖'], ['x', '昔'],
                ['y', '压'], ['z', '匝']
            ];

            return Array.from(
                this.normalizeSearch(name)
            ).map(character => {
                if (/[a-z0-9]/.test(character)) {
                    return character;
                }

                for (
                    let index = boundaries.length - 1;
                    index >= 0;
                    index--
                ) {
                    if (
                        collator.compare(
                            character,
                            boundaries[index][1]
                        ) >= 0
                    ) {
                        return boundaries[index][0];
                    }
                }

                return '';
            }).join('');
        },

        async randomDraw() {
            if (this.drawing) return;

            const people =
                this.data.blocks.filter(item =>
                    item.type === 'person' &&
                    item.name.trim()
                );

            if (!people.length) {
                this.setStatus('座位表中还没有可抽取的人');
                return;
            }

            this.drawing = true;
            this.setEditing(false);
            this.searchInput.value = '';
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

            for (let index = 0; index < intervals.length; index++) {
                const isLast = index === intervals.length - 1;

                let person =
                    people[Math.floor(Math.random() * people.length)];

                if (
                    !isLast &&
                    people.length > 1 &&
                    person === lastPerson
                ) {
                    person =
                        people[
                            (people.indexOf(person) + 1) %
                            people.length
                        ];
                }

                lastPerson = person;
                this.highlightPerson(person.id);

                await this.wait(intervals[index]);
            }

            this.drawing = false;
            this.setStatus(`抽取结果：${lastPerson.name}`);
            this.showResult(lastPerson.name);
        },

        highlightPerson(id) {
            this.grid
                .querySelectorAll('.random-active')
                .forEach(item =>
                    item.classList.remove('random-active')
                );

            const target = Array.from(
                this.grid.querySelectorAll('.seat-block.person')
            ).find(item => item.dataset.id === id);

            target?.classList.add('random-active');
        },

        showResult(name) {
            const overlay =
                document.getElementById('seatResultOverlay');

            const nameElement =
                document.getElementById('seatResultName');

            if (!overlay || !nameElement) return;

            nameElement.textContent = name;
            overlay.classList.add('active');

            clearTimeout(this.resultTimer);
            this.resultTimer = setTimeout(() => {
                this.closeResult();
            }, 5000);
        },

        closeResult() {
            clearTimeout(this.resultTimer);

            document
                .getElementById('seatResultOverlay')
                ?.classList.remove('active');
        },

        wait(milliseconds) {
            return new Promise(resolve => {
                setTimeout(resolve, milliseconds);
            });
        },

        importCsv(file) {
            const reader = new FileReader();

            reader.onload = () => {
                try {
                    const parsed = this.parseCsv(
                        String(reader.result || '')
                    );

                    if (!parsed.blocks.length) {
                        throw new Error('CSV 中没有有效的块');
                    }

                    this.data = parsed;
                    this.save();
                    this.render();
                    this.setStatus('CSV 导入成功');
                } catch (error) {
                    alert(`导入失败：${error.message}`);
                }
            };

            reader.onerror = () => {
                alert('文件读取失败');
            };

            reader.readAsText(file, 'UTF-8');
        },

        parseCsv(text) {
            const lines = text
                .replace(/^\uFEFF/, '')
                .split(/\r?\n/)
                .map(line => line.trim())
                .filter(Boolean);

            let columns = 12;
            let rows = 6;
            const blocks = [];

            lines.forEach((line, index) => {
                const fields = this.parseCsvLine(line);
                const type = (fields[0] || '').toLowerCase();

                if (
                    index === 0 &&
                    type === 'type'
                ) {
                    return;
                }

                if (type === 'config') {
                    columns = this.clampNumber(
                        fields[1],
                        4,
                        30,
                        columns
                    );

                    rows = this.clampNumber(
                        fields[2],
                        1,
                        30,
                        rows
                    );
                    return;
                }

                if (!['person', 'aisle', 'podium'].includes(type)) {
                    throw new Error(
                        `第 ${index + 1} 行类型无效：${fields[0]}`
                    );
                }

                const name = String(fields[1] || '').trim();

                if (type === 'person' && !name) {
                    throw new Error(
                        `第 ${index + 1} 行缺少人名`
                    );
                }

                blocks.push({
                    id: `${type}-${this.makeId()}-${index}`,
                    type,
                    name:
                        name ||
                        (type === 'podium' ? '讲台' : '')
                });
            });

            return { columns, rows, blocks };
        },

        parseCsvLine(line) {
            const result = [];
            let current = '';
            let quoted = false;

            for (let index = 0; index < line.length; index++) {
                const character = line[index];

                if (character === '"') {
                    if (
                        quoted &&
                        line[index + 1] === '"'
                    ) {
                        current += '"';
                        index++;
                    } else {
                        quoted = !quoted;
                    }
                } else if (character === ',' && !quoted) {
                    result.push(current.trim());
                    current = '';
                } else {
                    current += character;
                }
            }

            result.push(current.trim());

            if (quoted) {
                throw new Error('CSV 中存在未闭合的双引号');
            }

            return result;
        },

        exportCsv() {
            const lines = [
                'type,name',
                `config,${this.data.columns},${this.data.rows}`
            ];

            this.data.blocks.forEach(item => {
                lines.push([
                    item.type,
                    this.csvEscape(item.name || '')
                ].join(','));
            });

            const blob = new Blob(
                ['\uFEFF' + lines.join('\r\n')],
                { type: 'text/csv;charset=utf-8' }
            );

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

            if (/[",\r\n]/.test(text)) {
                return `"${text.replace(/"/g, '""')}"`;
            }

            return text;
        },

        setStatus(message) {
            if (this.status) this.status.textContent = message;
        },

        makeId() {
            if (
                window.crypto &&
                typeof window.crypto.randomUUID === 'function'
            ) {
                return window.crypto.randomUUID();
            }

            return (
                Date.now().toString(36) +
                Math.random().toString(36).slice(2)
            );
        }
    };

    window.App.SeatMap = SeatMap;

    document.addEventListener('DOMContentLoaded', async () => {
        await window.App.Store.init();
        SeatMap.init();
    });
})();