window.App.ModalPhrase = {
    init() {
        this.bindEvents();
    },

    bindEvents() {
        const openBtn = document.getElementById('phraseSelectButton');
        const modal = document.getElementById('phraseModal');
        const closeBtn = document.getElementById('closePhrase');

        if (openBtn) {
            openBtn.addEventListener('click', () => {
                this.populateList();
                modal.classList.add('active');
            });
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.classList.remove('active');
            });
        }
    },

    populateList() {
        const container = document.getElementById('phraseList');
        if (!container) return;

        // 获取所有本地金句（来自 phrases.js）
        const allPhrases = [
            ...(window.localPhrases?.high || []),
            ...(window.localPhrases?.medium || []),
            ...(window.localPhrases?.low || [])
        ];

        container.innerHTML = '';
        const fragment = document.createDocumentFragment();

        allPhrases.forEach(phrase => {
            const item = document.createElement('div');
            item.className = 'phrase-item';
            // 支持换行符转换为 <br>
            item.innerHTML = phrase.replace(/\n/g, '<br>');

            item.addEventListener('click', () => {
                // 添加点击波纹效果（可选）
                item.classList.add('phrase-click-effect');
                setTimeout(() => item.classList.remove('phrase-click-effect'), 400);

                // 显示选中的金句
                if (window.App.GoldenPhrase && window.App.GoldenPhrase.updateDisplay) {
                    window.App.GoldenPhrase.updateDisplay(phrase);
                } else {
                    // 兼容直接调用全局 updatePhraseDisplay（若存在）
                    const container = document.getElementById('goldenPhrase');
                    if (container) {
                        const formatted = phrase.replace(/\n/g, '<br>');
                        container.innerHTML = `「 ${formatted} 」`;
                    }
                }

                // 关闭模态框
                const modal = document.getElementById('phraseModal');
                if (modal) modal.classList.remove('active');

                // 如果金句自动轮播是开启的，重置定时器
                const goldenSwitch = document.getElementById('goldenSwitch');
                if (goldenSwitch && goldenSwitch.checked && window.App.GoldenPhrase) {
                    window.App.GoldenPhrase.stopTimer();
                    window.App.GoldenPhrase.startTimer();
                }
            });

            fragment.appendChild(item);
        });

        container.appendChild(fragment);
    }
};