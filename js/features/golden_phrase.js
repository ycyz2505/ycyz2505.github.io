window.App.GoldenPhrase = {
    apiConfigs: [
        {
            url: 'https://zj.v.api.aa1.cn/api/wenan-shici/?type=json',
            method: 'GET', weight: 15, maxRetry: 3,
            handler(data) { const t = data.msg || ''; return t.length <= 100 ? t : null; }
        },
        {
            url: 'https://api.songzixian.com/api/daily-poem?dataSource=LOCAL_DAILY_POEM',
            method: 'GET', weight: 15, maxRetry: 3,
            handler(data) {
                if (!data.data) return null;
                const title = (data.data.title || '').replace(/\s*·\s*/g, '·');
                const formatted = /^《(.+)》$/.test(title) ? title : `《${title}》`;
                return `${data.data.quotes || ''}——${data.data.author || ''}${formatted}`;
            }
        },
        {
            url: 'https://zj.v.api.aa1.cn/api/wenan-wm/?type=json',
            method: 'GET', weight: 20, maxRetry: 3,
            handler(data) { const t = data.msg || ''; return t.length <= 100 ? t : null; }
        },
        {
            url: 'https://zj.v.api.aa1.cn/api/wenan-mj/?type=json',
            method: 'GET', weight: 30, maxRetry: 3,
            handler(data) { const t = data.msg || ''; return t.length <= 100 ? t : null; }
        },
        {
            url: 'https://api.mu-jie.cc/stray-birds/range?type=json',
            method: 'GET', weight: 20, maxRetry: 5,
            handler(data) {
                const cnLength = data.cn?.length || 0;
                const enLength = data.en?.length || 0;
                if (cnLength > 100) return null;
                if (enLength * 0.5 + cnLength <= 100) return `${data.en}（${data.cn}）——泰戈尔`;
                return `${data.cn}——泰戈尔`;
            }
        }
    ],

    init() {
        this.fetch();
        this.startTimer();
        this.bindClickRefresh();
    },

    startTimer() {
        this.stopTimer();
        const interval = Number(window.App.State?.intervalDuration) || 15000;
        window.App.Timers.phrase = setInterval(() => this.fetch(), interval);
    },

    stopTimer() {
        if (window.App.Timers.phrase) {
            clearInterval(window.App.Timers.phrase);
            window.App.Timers.phrase = null;
        }
    },

    async fetchWithRetry(api, retry = 0) {
        try {
            const res = await fetch(api.url, { method: api.method || 'GET' });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const text = api.handler(await res.json());
            if (text !== null && text !== '') return text;
            if (retry < api.maxRetry) return this.fetchWithRetry(api, retry + 1);
            throw new Error('超过最大重试次数');
        } catch (err) {
            if (retry < api.maxRetry) return this.fetchWithRetry(api, retry + 1);
            throw err;
        }
    },

    selectRandomAPI() {
        const total = this.apiConfigs.reduce((sum, api) => sum + api.weight, 0);
        let random = Math.random() * total;
        for (const api of this.apiConfigs) {
            if (random < api.weight) return api;
            random -= api.weight;
        }
        return this.apiConfigs[0];
    },

    async fetch() {
        const probability = Number(window.App.State?.apiProbability ?? 50);
        if (Math.random() >= probability / 100) return this.showLocal();
        try {
            const text = await this.fetchWithRetry(this.selectRandomAPI());
            this.updateDisplay(text);
        } catch (err) {
            console.warn('联网金句获取失败，改用本地金句：', err);
            this.showLocal();
        }
    },

    updateDisplay(text) {
        const container = document.getElementById('goldenPhrase');
        if (!container) return;

        const finalText = text === undefined || text === null ? '' : String(text);
        const animationEnabled = document.getElementById('animationSwitch')?.checked !== false;
        const formatted = this.escapeHTML(finalText).replace(/\n/g, '<br>');

        const apply = () => {
            container.innerHTML = `「 ${formatted} 」`;
            container.style.opacity = '1';
        };

        if (animationEnabled) {
            container.style.opacity = '0';
            setTimeout(apply, 500);
        } else {
            apply();
        }
    },

    showLocal() {
        // ★ 从本地存储读取金句库
        const data = (window.App.Store && window.App.Store.get('phrases'))
                  || window.localPhrases
                  || { high: [], medium: [], low: [] };

        const toArray = value => (Array.isArray(value) ? value : []);
        const onlyOriginal = document.getElementById('originalSwitch')?.checked || false;
        const filter = list => (onlyOriginal ? list.filter(p => String(p).trim().endsWith('🌟')) : list);

        const high = filter(toArray(data.high));
        const medium = filter(toArray(data.medium));
        const low = filter(toArray(data.low));
        const all = [...high, ...medium, ...low];

        if (!all.length) return this.updateDisplay('🎯 没有找到金句');

        const last = window.App.State.lastPhrase;
        const pick = list => {
            const candidates = list.filter(p => p !== last);
            const pool = candidates.length ? candidates : list;
            return pool[Math.floor(Math.random() * pool.length)];
        };

        let selected;

        if (!onlyOriginal) {
            const pools = [];
            if (high.length) pools.push({ list: high, weight: 45 });
            if (medium.length) pools.push({ list: medium, weight: 35 });
            if (low.length) pools.push({ list: low, weight: 20 });

            const total = pools.reduce((sum, pool) => sum + pool.weight, 0);
            let random = Math.random() * total;

            for (const pool of pools) {
                if (random < pool.weight) { selected = pick(pool.list); break; }
                random -= pool.weight;
            }
        }

        if (!selected) {
            const candidates = all.filter(p => p !== last);
            const pool = candidates.length ? candidates : all;
            selected = pool[Math.floor(Math.random() * pool.length)];
        }

        window.App.State.lastPhrase = selected;
        this.updateDisplay(selected);
    },

    bindClickRefresh() {
        const container = document.getElementById('goldenPhrase');
        if (!container) return;

        container.addEventListener('click', () => {
            if (!document.getElementById('clickRefreshSwitch')?.checked) return;

            const animationEnabled = document.getElementById('animationSwitch')?.checked !== false;

            if (animationEnabled) {
                container.style.transform = 'scale(0.98)';
                setTimeout(() => {
                    container.style.transform = 'scale(1)';
                    this.fetch();
                }, 300);
            } else {
                this.fetch();
            }

            if (document.getElementById('goldenSwitch')?.checked) this.startTimer();
        });
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