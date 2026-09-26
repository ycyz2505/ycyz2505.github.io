window.App.ModalNotification = {
    init() {
        this.applySavedFontSize();
        this.bindEvents();
        this.render();
    },

    applySavedFontSize() {
        const content = document.getElementById('notificationContent');
        const slider = document.getElementById('fontSizeSlider');
        const valueInput = document.getElementById('fontSizeValue');
        if (!content) return;

        const saved = (window.App.Store && window.App.Store.getSetting('notificationFontSize')) || 16;
        content.style.fontSize = saved + 'px';
        if (slider) slider.value = saved;
        if (valueInput) valueInput.value = saved;
    },

    adjustTextareaHeight(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = Math.max(100, textarea.scrollHeight) + 'px';
    },

    render() {
        const content = document.getElementById('notificationContent');
        if (!content) return;

        const notifications = window.App.State.notifications || [];
        content.innerHTML = '';

        if (notifications.length === 0) {
            content.innerHTML = '<div class="empty-notification">暂无通知，点击下方按钮添加</div>';
            return;
        }

        const currentFontSize = content.style.fontSize || '16px';

        notifications.forEach((text, index) => {
            const item = document.createElement('div');
            item.className = 'notification-item';
            item.dataset.index = index;
            item.innerHTML = text.replace(/\n/g, '<br>');
            item.style.fontSize = currentFontSize;

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-notification-btn';
            deleteBtn.textContent = '删除';
            deleteBtn.dataset.index = index;
            item.appendChild(deleteBtn);

            deleteBtn.addEventListener('click', e => {
                e.stopPropagation();
                if (e.target.textContent === '删除') {
                    e.target.textContent = '确认删除';
                    e.target.style.background = '#d32f2f';
                } else {
                    const arr = window.App.State.notifications;
                    arr.splice(Number(e.target.dataset.index), 1);
                    window.App.Store.touch('notifications');
                    this.render();
                }
            });

            item.addEventListener('click', e => {
                if (e.target.classList.contains('delete-notification-btn')) return;

                const idx = Number(item.dataset.index);
                const textarea = document.createElement('textarea');
                textarea.className = 'notification-editable';
                textarea.value = window.App.State.notifications[idx];
                textarea.style.fontSize = currentFontSize;

                item.innerHTML = '';
                item.appendChild(textarea);
                this.adjustTextareaHeight(textarea);
                textarea.focus();

                textarea.addEventListener('input', () => this.adjustTextareaHeight(textarea));

                textarea.addEventListener('keydown', evt => {
                    if (evt.key === 'Enter' && !evt.shiftKey) {
                        evt.preventDefault();
                        const start = textarea.selectionStart;
                        const end = textarea.selectionEnd;
                        textarea.value =
                            textarea.value.substring(0, start) + '\n' + textarea.value.substring(end);
                        textarea.selectionStart = textarea.selectionEnd = start + 1;
                        this.adjustTextareaHeight(textarea);
                    }
                });

                textarea.addEventListener('blur', () => {
                    window.App.State.notifications[idx] = textarea.value;
                    window.App.Store.touch('notifications');
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

        addBtn?.addEventListener('click', () => {
            window.App.State.notifications.push('新通知 - 点击编辑内容');
            window.App.Store.touch('notifications');
            this.render();
            if (content) content.scrollTop = content.scrollHeight;
        });

        if (slider && valueInput && content) {
            slider.addEventListener('input', () => {
                content.style.fontSize = slider.value + 'px';
                valueInput.value = slider.value;
                if (window.App.Store) window.App.Store.setSetting('notificationFontSize', Number(slider.value));
                this.render();
            });

            valueInput.addEventListener('input', () => {
                let val = parseInt(valueInput.value, 10) || 16;
                val = Math.min(120, Math.max(12, val));
                content.style.fontSize = val + 'px';
                slider.value = val;
                if (window.App.Store) window.App.Store.setSetting('notificationFontSize', val);
                this.render();
            });
        }

        document.addEventListener('click', e => {
            if (!e.target.classList.contains('delete-notification-btn')) {
                document.querySelectorAll('.delete-notification-btn').forEach(btn => {
                    btn.textContent = '删除';
                    btn.style.background = '#f44';
                });
            }
        });
    }
};