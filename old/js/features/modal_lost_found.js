window.App.ModalLostFound = {
    init() {
        this.bindEvents();
        this.initFontSizeControl();
    },

    bindEvents() {
        const list = document.getElementById('lostAndFoundList');
        if (!list) return;

        // 1. 点击文字变输入框的编辑功能 (事件委托)
        list.addEventListener('click', (e) => {
            const target = e.target;
            if (target.classList.contains('editable')) {
                const originalText = target.textContent;
                const input = document.createElement('input');
                input.className = 'edit-input';
                input.value = originalText;
                input.style.width = target.offsetWidth + 'px';
                
                input.addEventListener('blur', function() {
                    target.textContent = this.value;
                    target.style.display = 'inline';
                    input.remove();
                });

                input.addEventListener('input', function() {
                    this.style.width = (this.value.length * 20 + 30) + 'px';
                });

                target.style.display = 'none';
                target.parentNode.insertBefore(input, target);
                input.focus();
            }
        });

        // 2. 添加卡片功能
        const addBtn = document.querySelector('#lostAndFoundList .add-button');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                const newCard = document.createElement('div');
                newCard.className = 'announcement-card';
                newCard.innerHTML = `
                    <div class="announcement-body" style="position:relative; text-align: center; font-family: STZhongsong, serif;">
                        <span class="editable" data-type="name" style="color: #1E90FF;">同学</span>
                        <span class="static-text">的</span>
                        <span class="editable" data-type="item" style="color: #1E90FF;">物品</span>
                        <button class="delete-btn">删除</button>
                    </div>
                `;
                list.appendChild(newCard);
                
                // 应用当前字体大小
                const editables = newCard.querySelectorAll('.editable, .static-text');
                editables.forEach(item => {
                    item.style.fontSize = `${window.App.State.lostAndFoundFontSize}px`;
                });
            });
        }

        // 3. 删除功能（二次确认）
        list.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-btn')) {
                if (e.target.textContent === '删除') {
                    e.target.textContent = '确认删除';
                    e.target.style.background = '#d32f2f';
                } else {
                    e.target.closest('.announcement-card').remove();
                }
            }
        });

        // 4. 点击其他地方时重置所有删除按钮状态
        document.addEventListener('click', (e) => {
            if (!e.target.classList.contains('delete-btn')) {
                document.querySelectorAll('#lostAndFoundList .delete-btn').forEach(btn => {
                    btn.textContent = '删除';
                    btn.style.background = '#f44';
                });
            }
        });
    },

    initFontSizeControl() {
        const slider = document.getElementById('lostAndFoundFontSizeSlider');
        const valueInput = document.getElementById('lostAndFoundFontSizeValue');
        
        if (slider && valueInput) {
            slider.addEventListener('input', () => {
                this.updateFontSize(parseInt(slider.value));
            });

            valueInput.addEventListener('input', () => {
                let val = parseInt(valueInput.value) || 28;
                if (val < 12) val = 12;
                if (val > 120) val = 120;
                this.updateFontSize(val);
            });
            
            // 初始化
            this.updateFontSize(28);
        }
    },

    updateFontSize(size) {
        window.App.State.lostAndFoundFontSize = size;
        const slider = document.getElementById('lostAndFoundFontSizeSlider');
        const valueInput = document.getElementById('lostAndFoundFontSizeValue');
        
        if (slider) slider.value = size;
        if (valueInput) valueInput.value = size;
        
        const items = document.querySelectorAll('#lostAndFoundList .editable, #lostAndFoundList .static-text');
        items.forEach(item => {
            item.style.fontSize = `${size}px`;
        });
    }
};