// ============================================================
// js/features/phrase_history.js
// 金句轮播历史：记录近 24 小时内所有展示到金句区的句子。
//
// 数据存在 Store 的 phraseHistory 数据集（data/phraseHistory.json），
// 与 settings.json 分开，避免每次轮播都重写设置文件。
// ============================================================

window.App = window.App || {};

window.App.PhraseHistory = {
    WINDOW_MS: 24 * 60 * 60 * 1000,
    // 默认 15 秒轮播时，24 小时约 5760 条；上限给足，避免文件无限增长
    MAX_ITEMS: 6000,

    SOURCE_LABELS: {
        api: '联网',
        local: '本地',
        manual: '手动',
        auto: '自动'
    },

    getData() {
        const data = window.App.Store
            ? window.App.Store.get('phraseHistory')
            : null;

        if (data && Array.isArray(data.items)) {
            return { version: 1, items: data.items };
        }
        return { version: 1, items: [] };
    },

    prune(items, now) {
        const cutoff = (now || Date.now()) - this.WINDOW_MS;
        return items.filter(item =>
            item &&
            typeof item.text === 'string' &&
            Number(item.ts) > cutoff
        );
    },

    record(text, source) {
        const value = String(text === undefined || text === null ? '' : text).trim();
        if (!value || value.indexOf('没有找到金句') !== -1) return;

        const now = Date.now();
        let items = this.prune(this.getData().items.slice(), now);

        // 同一句话在 3 秒内重复展示（例如连点）只记一次
        const last = items[items.length - 1];
        if (last && last.text === value && now - Number(last.ts) < 3000) return;

        items.push({
            text: value,
            ts: now,
            source: source || 'auto'
        });

        if (items.length > this.MAX_ITEMS) {
            items = items.slice(items.length - this.MAX_ITEMS);
        }

        if (window.App.Store) {
            window.App.Store.set('phraseHistory', { version: 1, items });
        }
    },

    // 最新的排在前面
    list() {
        return this.prune(this.getData().items.slice()).reverse();
    },

    sourceLabel(source) {
        return this.SOURCE_LABELS[source] || '自动';
    }
};

window.App.ModalPhraseHistory = {
    init() {
        document.getElementById('openPhraseHistoryModal')?.addEventListener('click', () => {
            this.populate();
            document.getElementById('phraseHistoryModal')?.classList.add('active');
        });

        document.getElementById('closePhraseHistory')?.addEventListener('click', () => {
            document.getElementById('phraseHistoryModal')?.classList.remove('active');
        });
    },

    populate() {
        const container = document.getElementById('phraseHistoryList');
        if (!container) return;

        const items = window.App.PhraseHistory.list();
        container.innerHTML = '';

        if (!items.length) {
            const empty = document.createElement('div');
            empty.className = 'phrase-history-empty';
            empty.textContent = '近 24 小时还没有轮播记录';
            container.appendChild(empty);
            return;
        }

        const fragment = document.createDocumentFragment();

        items.forEach(item => {
            const row = document.createElement('div');
            row.className = 'phrase-history-item';

            const meta = document.createElement('div');
            meta.className = 'phrase-history-meta';

            const time = document.createElement('span');
            time.className = 'phrase-history-time';
            time.textContent = this.formatTime(item.ts);

            const badge = document.createElement('span');
            badge.className = 'phrase-history-source';
            badge.textContent = window.App.PhraseHistory.sourceLabel(item.source);

            const text = document.createElement('div');
            text.className = 'phrase-history-text';
            text.textContent = item.text;

            meta.appendChild(time);
            meta.appendChild(badge);
            row.appendChild(meta);
            row.appendChild(text);

            row.addEventListener('click', () => {
                window.App.GoldenPhrase?.updateDisplay(item.text, 'manual');
                document.getElementById('phraseHistoryModal')?.classList.remove('active');

                if (document.getElementById('goldenSwitch')?.checked &&
                    window.App.GoldenPhrase) {
                    window.App.GoldenPhrase.stopTimer();
                    window.App.GoldenPhrase.startTimer();
                }
            });

            fragment.appendChild(row);
        });

        container.appendChild(fragment);
    },

    formatTime(ts) {
        const date = new Date(Number(ts) || Date.now());
        const pad = n => String(n).padStart(2, '0');
        return `${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
               `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    }
};
