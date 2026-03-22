window.App.ModalNotification = {
    init() {
        this.bindEvents();
        this.render();
    },

    adjustTextareaHeight(textarea) {
        const minHeight = 100;
        textarea.style.height = 'auto';
        const height = Math.max(minHeight, textarea.scrollHeight);
        textarea.style.height = height + 'px';
    },

    render() {
        const content = document.getElementById('notificationContent');
        if (!content) return;

        content.innerHTML = '';
        
        if (window.App.State.notifications.length === 0) {
            content.innerHTML = '<div class="empty-notification">暂无通知，点击下方按钮添加</div>';
            return;
        }
        
        const currentFontSize = content.style.fontSize || '16px';
        
        window.App.State.notifications.forEach((text, index) => {
            const item = document.createElement('div');
            item.className = 'notification-item';
            item.dataset.index = index;
            item.innerHTML = text.replace(/\n/g, '<br>');
            item.style.fontSize = currentFontSize;
            
            // 删除按钮
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-notification-btn';
            deleteBtn.textContent = '删除';
            deleteBtn.dataset.index = index;
            item.appendChild(deleteBtn);
            
            // 删除事件
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // 阻止冒泡触发编辑
                const idx = e.target.dataset.index;
                if (e.target.textContent === '删除') {
                    e.target.textContent = '确认删除';
                    e.target.style.background = '#d32f2f';
                } else {
                    window.App.State.notifications.splice(idx, 1);
                    this.render();
                }
            });
            
            // 点击进入编辑模式
            item.addEventListener('click', (e) => {
                if (e.target.classList.contains('delete-notification-btn')) return;
                
                const idx = item.dataset.index;
                const textarea = document.createElement('textarea');
                textarea.className = 'notification-editable';
                textarea.value = window.App.State.notifications[idx];
                textarea.style.fontSize = currentFontSize;
                
                item.innerHTML = '';
                item.appendChild(textarea);
                this.adjustTextareaHeight(textarea);
                textarea.focus();
                
                textarea.addEventListener('input', () => this.adjustTextareaHeight(textarea));
                
                // 处理回车换行
                textarea.addEventListener('keydown', (evt) => {
                    if (evt.key === 'Enter' && !evt.shiftKey) {
                        evt.preventDefault();
                        const start = textarea.selectionStart;
                        const end = textarea.selectionEnd;
                        textarea.value = textarea.value.substring(0, start) + '\n' + textarea.value.substring(end);
                        textarea.selectionStart = textarea.selectionEnd = start + 1;
                        this.adjustTextareaHeight(textarea);
                    }
                });
                
                // 失去焦点保存
                textarea.addEventListener('blur', () => {
                    window.App.State.notifications[idx] = textarea.value;
                    this.render();
                });
            });
            
            content.appendChild(item);
        });
    },

    bindEvents() {
        const addBtn = document.getElementById('addNotificationBtn');
        const content = document.getElementById('notificationContent');
        const slider = document.getElementById('fontSizeSlider');
        const valueInput = document.getElementById('fontSizeValue');

        // 添加通知
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                window.App.State.notifications.push("新通知 - 点击编辑内容");
                this.render();
                if (content) content.scrollTop = content.scrollHeight;
            });
        }

        // 字体滑块
        if (slider && valueInput && content) {
            slider.addEventListener('input', () => {
                content.style.fontSize = slider.value + 'px';
                valueInput.value = slider.value;
                this.render();
            });
            
            valueInput.addEventListener('input', () => {
                let val = parseInt(valueInput.value) || 16;
                if (val < 12) val = 12;
                if (val > 120) val = 120;
                content.style.fontSize = val + 'px';
                slider.value = val;
                this.render();
            });
        }

        // 点击其他区域恢复删除按钮状态
        document.addEventListener('click', (e) => {
            if (!e.target.classList.contains('delete-notification-btn')) {
                document.querySelectorAll('.delete-notification-btn').forEach(btn => {
                    btn.textContent = '删除';
                    btn.style.background = '#f44';
                });
            }
        });
    }
};