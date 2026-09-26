window.App.ModalLostFound = {
    init() {
        this.bindEvents();
        this.initFontSizeControl();
        this.render();
    },

    render() {
        const container = document.getElementById('lostAndFoundList');
        if (!container) return;

        const list = (window.App.Store && window.App.Store.get('lostfound')) || [];
        const esc = this.escapeHTML;

        container.innerHTML = list.map((entry, idx) => `
            <div class="announcement-card">
                <div class="announcement-body" style="position:relative; text-align: center; font-family: STZhongsong, serif;">
                    <span class="editable" data-type="name" data-index="${idx}" style="color: #1E90FF;">${esc(entry.name || '')}</span>
                    <span class="static-text">的</span>
                    <span class="editable" data-type="item" data-index="${idx}" style="color: #1E90FF;">${esc(entry.item || '')}</span>
                    <button class="delete-btn" data-index="${idx}">删除</button>
                </div>
            </div>
        `).join('');

        // 应用当前字号
        const size = window.App.State.lostAndFoundFontSize || 28;
        container.style.setProperty('--laf-font-size', size + 'px');
    },

    bindEvents() {
        const list = document.getElementById('lostAndFoundList');
        const addBtn = document.getElementById('addLostFoundBtn');
        if (!list) return;

        // 行内编辑
        list.addEventListener('click', e => {
            const target = e.target;
            if (!target.classList.contains('editable')) return;

            const idx = Number(target.dataset.index);
            const type = target.dataset.type;
            const arr = window.App.Store.get('lostfound');
            if (!arr || !arr[idx]) return;

            const input = document.createElement('input');
            input.className = 'edit-input';
            input.value = arr[idx][type] || '';
            input.style.width = Math.max(80, target.offsetWidth) + 'px';

            input.addEventListener('input', function () {
                this.style.width = Math.max(80, this.value.length * 20 + 30) + 'px';
            });

            input.addEventListener('blur', () => {
                const value = input.value.trim() || (type === 'name' ? '同学' : '物品');
                arr[idx][type] = value;
                window.App.Store.touch('lostfound');
                this.render();
            });

            target.style.display = 'none';
            target.parentNode.insertBefore(input, target);
            input.focus();
        });

        // 删除
        list.addEventListener('click', e => {
            if (!e.target.classList.contains('delete-btn')) return;
            const idx = Number(e.target.dataset.index);
            const arr = window.App.Store.get('lostfound');
            if (!arr || !arr[idx]) return;

            if (e.target.textContent === '删除') {
                e.target.textContent = '确认删除';
                e.target.style.background = '#d32f2f';
            } else {
                arr.splice(idx, 1);
                window.App.Store.touch('lostfound');
                this.render();
            }
        });

        // 点击其它地方复位删除按钮
        document.addEventListener('click', e => {
            if (!e.target.classList.contains('delete-btn')) {
                document.querySelectorAll('#lostAndFoundList .delete-btn').forEach(btn => {
                    btn.textContent = '删除';
                    btn.style.background = '#f44';
                });
            }
        });

        // 新增
        addBtn?.addEventListener('click', () => {
            const arr = window.App.Store.get('lostfound') || [];
            arr.push({ name: '同学', item: '物品' });
            window.App.Store.touch('lostfound');
            this.render();
        });
    },

    initFontSizeControl() {
        const slider = document.getElementById('lostAndFoundFontSizeSlider');
        const valueInput = document.getElementById('lostAndFoundFontSizeValue');
        if (!slider || !valueInput) return;

        const saved = window.App.State.lostAndFoundFontSize || 28;
        slider.value = saved;
        valueInput.value = saved;

        slider.addEventListener('input', () => this.updateFontSize(parseInt(slider.value, 10)));
        valueInput.addEventListener('input', () => {
            let val = parseInt(valueInput.value, 10) || 28;
            val = Math.min(120, Math.max(12, val));
            this.updateFontSize(val);
        });

        this.updateFontSize(saved);
    },

    updateFontSize(size) {
        window.App.State.lostAndFoundFontSize = size;   // 通过 setter 落盘
        const container = document.getElementById('lostAndFoundList');
        if (container) container.style.setProperty('--laf-font-size', size + 'px');

        const slider = document.getElementById('lostAndFoundFontSizeSlider');
        const valueInput = document.getElementById('lostAndFoundFontSizeValue');
        if (slider) slider.value = size;
        if (valueInput) valueInput.value = size;
    },

    escapeHTML(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
};