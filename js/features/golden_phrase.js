window.App.GoldenPhrase = {
    currentPhrase: null,
    pendingPhrase: null,
    prefetchController: null,
    cycleTimer: null,
    _animationTimer: null,

    // 音乐播放时的歌词接管，null 表示未接管
    _musicLyric: null,

    apiConfigs: [
        {
            url: 'https://zj.v.api.aa1.cn/api/wenan-shici/?type=json',
            method: 'GET',
            weight: 15,
            handler(data) {
                const t = data.msg || '';
                return t.length <= 100 ? t : null;
            }
        },
        {
            url: 'https://api.songzixian.com/api/daily-poem?dataSource=LOCAL_DAILY_POEM',
            method: 'GET',
            weight: 15,
            handler(data) {
                if (!data.data) return null;
                const title = (data.data.title || '').replace(/\s*·\s*/g, '·');
                const formatted = /^《(.+)》$/.test(title) ? title : `《${title}》`;
                return `${data.data.quotes || ''}——${data.data.author || ''}${formatted}`;
            }
        },
        {
            url: 'https://zj.v.api.aa1.cn/api/wenan-wm/?type=json',
            method: 'GET',
            weight: 20,
            handler(data) {
                const t = data.msg || '';
                return t.length <= 100 ? t : null;
            }
        },
        {
            url: 'https://zj.v.api.aa1.cn/api/wenan-mj/?type=json',
            method: 'GET',
            weight: 30,
            handler(data) {
                const t = data.msg || '';
                return t.length <= 100 ? t : null;
            }
        },
        {
            url: 'https://api.mu-jie.cc/stray-birds/range?type=json',
            method: 'GET',
            weight: 20,
            handler(data) {
                const cnLength = data.cn?.length || 0;
                const enLength = data.en?.length || 0;
                if (cnLength > 100) return null;
                if (enLength * 0.5 + cnLength <= 100) {
                    return `${data.en}（${data.cn}）——泰戈尔`;
                }
                return `${data.cn}——泰戈尔`;
            }
        }
    ],

    // ==================== 生命周期 ====================

    init() {
        if (!this.currentPhrase) {
            this.displayNext(this.pickLocalPhrase());
        }

        this.scheduleNextCycle();
        this.bindClickRefresh();
    },

    // ==================== 兼容旧接口 ====================

    startTimer() {
        this.scheduleNextCycle();
    },

    stopTimer() {
        this.stopCycle();
        this.cancelPrefetch();
    },

    fetch() {
        this.refreshNow();
    },

    showLocal() {
        this.displayNext(this.pickLocalPhrase());
    },

    // ==================== 音乐歌词接管 ====================

    // 音乐播放时，把歌词显示到金句位置
    showMusicLyric(text) {
        if (text === undefined || text === null || text === '') return;

        const str = String(text);
        this._musicLyric = str;

        const container = document.getElementById('goldenPhrase');
        if (!container) return;

        if (this._animationTimer) {
            clearTimeout(this._animationTimer);
            this._animationTimer = null;
        }

        const formatted = '「 ' + this.escapeHTML(str).replace(/\n/g, '<br>') + ' 」';

        const apply = () => {
            container.innerHTML = formatted;
            container.style.opacity = '1';
        };

        const animationEnabled = window.App.Store
            ? window.App.Store.getSetting('animationSwitch') !== false
            : (document.getElementById('animationSwitch')?.checked !== false);

        if (animationEnabled) {
            container.style.opacity = '0';
            this._animationTimer = setTimeout(() => {
                apply();
                this._animationTimer = null;
            }, 220);
        } else {
            apply();
        }
    },

    // 音乐暂停 / 结束，恢复金句轮播
    clearMusicLyric() {
        this._musicLyric = null;
    },

    // ==================== 轮播周期 ====================

    scheduleNextCycle() {
        this.stopCycle();

        const interval = Number(window.App.State?.intervalDuration) || 15000;

        this.prefetch();

        this.cycleTimer = setTimeout(() => this.onCycleEnd(), interval);
    },

    stopCycle() {
        if (this.cycleTimer) {
            clearTimeout(this.cycleTimer);
            this.cycleTimer = null;
        }
    },

    onCycleEnd() {
        let next;

        if (this.pendingPhrase) {
            next = this.pendingPhrase;
            this.pendingPhrase = null;
        } else {
            this.cancelPrefetch();
            next = this.pickLocalPhrase();
        }

        this.displayNext(next);
        this.scheduleNextCycle();
    },

    refreshNow() {
        this.stopCycle();

        let next;
        if (this.pendingPhrase) {
            next = this.pendingPhrase;
        } else {
            next = this.pickLocalPhrase();
        }

        this.cancelPrefetch();
        this.displayNext(next);

        if (document.getElementById('goldenSwitch')?.checked) {
            this.scheduleNextCycle();
        }
    },

    // ==================== 预取逻辑 ====================

    async prefetch() {
        if (this.prefetchController) {
            this.prefetchController.abort();
        }

        const controller = new AbortController();
        this.prefetchController = controller;
        this.pendingPhrase = null;

        const probability = Number(window.App.State?.apiProbability ?? 50);

        if (Math.random() >= probability / 100) {
            this.pendingPhrase = this.pickLocalPhrase();
            return;
        }

        const triedApis = new Set();

        while (!controller.signal.aborted) {
            let api = this.selectUntriedAPI(triedApis);
            if (!api) {
                triedApis.clear();
                api = this.selectRandomAPI();
            }
            triedApis.add(api.url);

            try {
                const text = await this.fetchOnce(api, controller.signal);

                if (controller.signal.aborted) return;
                if (this.prefetchController !== controller) return;

                this.pendingPhrase = text;
                return;
            } catch (err) {
                if (controller.signal.aborted) return;
                if (this.prefetchController !== controller) return;

                await this.sleep(800, controller.signal);
            }
        }
    },

    cancelPrefetch() {
        if (this.prefetchController) {
            this.prefetchController.abort();
            this.prefetchController = null;
        }
        this.pendingPhrase = null;
    },

    selectUntriedAPI(triedApis) {
        const candidates = this.apiConfigs.filter(api => !triedApis.has(api.url));
        if (!candidates.length) return null;

        const total = candidates.reduce((sum, api) => sum + api.weight, 0);
        let random = Math.random() * total;

        for (const api of candidates) {
            if (random < api.weight) return api;
            random -= api.weight;
        }
        return candidates[candidates.length - 1];
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

    async fetchOnce(api, outerSignal) {
        const controller = new AbortController();
        const onAbort = () => controller.abort();
        outerSignal.addEventListener('abort', onAbort, { once: true });

        const timeoutId = setTimeout(() => controller.abort(), 5000);

        try {
            const res = await fetch(api.url, {
                method: api.method || 'GET',
                signal: controller.signal
            });

            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const data = await res.json();
            const text = api.handler(data);

            if (text === null || text === '') throw new Error('空结果');

            return text;
        } finally {
            clearTimeout(timeoutId);
            outerSignal.removeEventListener('abort', onAbort);
        }
    },

    sleep(ms, signal) {
        return new Promise(resolve => {
            const timer = setTimeout(resolve, ms);

            if (!signal) return;

            if (signal.aborted) {
                clearTimeout(timer);
                resolve();
                return;
            }

            signal.addEventListener('abort', () => {
                clearTimeout(timer);
                resolve();
            }, { once: true });
        });
    },

    // ==================== 本地金句 ====================

    pickLocalPhrase() {
        const data = (window.App.Store && window.App.Store.get('phrases'))
                  || window.localPhrases
                  || { high: [], medium: [], low: [] };

        const toArray = value => (Array.isArray(value) ? value : []);
        const high = toArray(data.high);
        const medium = toArray(data.medium);
        const low = toArray(data.low);
        const all = [...high, ...medium, ...low];

        if (!all.length) return '🎯 没有找到金句';

        const last = window.App.State.lastPhrase;
        const pick = list => {
            const candidates = list.filter(p => p !== last);
            const pool = candidates.length ? candidates : list;
            return pool[Math.floor(Math.random() * pool.length)];
        };

        const pools = [];
        if (high.length) pools.push({ list: high, weight: 45 });
        if (medium.length) pools.push({ list: medium, weight: 35 });
        if (low.length) pools.push({ list: low, weight: 20 });

        const total = pools.reduce((sum, pool) => sum + pool.weight, 0);
        let random = Math.random() * total;

        for (const pool of pools) {
            if (random < pool.weight) return pick(pool.list);
            random -= pool.weight;
        }

        return pick(all);
    },

    // ==================== 显示 ====================

    displayNext(text) {
        // 音乐歌词正在接管，跳过本轮更新
        if (this._musicLyric !== null) return;

        window.App.State.lastPhrase = text;
        this.currentPhrase = text;
        this.updateDisplay(text);
    },

    updateDisplay(text) {
        // 音乐歌词正在接管，普通金句不覆盖
        if (this._musicLyric !== null) return;

        const container = document.getElementById('goldenPhrase');
        if (!container) return;

        if (this._animationTimer) {
            clearTimeout(this._animationTimer);
            this._animationTimer = null;
        }

        const finalText = text === undefined || text === null ? '' : String(text);

        const animationEnabled = window.App.Store
            ? window.App.Store.getSetting('animationSwitch') !== false
            : (document.getElementById('animationSwitch')?.checked !== false);

        const formatted = this.escapeHTML(finalText).replace(/\n/g, '<br>');

        const apply = () => {
            container.innerHTML = `「 ${formatted} 」`;
            container.style.opacity = '1';
        };

        if (animationEnabled) {
            container.style.opacity = '0';
            this._animationTimer = setTimeout(() => {
                apply();
                this._animationTimer = null;
            }, 500);
        } else {
            apply();
        }
    },

    // ==================== 点击刷新 ====================

    bindClickRefresh() {
        const container = document.getElementById('goldenPhrase');
        if (!container) return;

        container.addEventListener('click', () => {
            // 音乐歌词接管时，点击不切换
            if (this._musicLyric !== null) return;

            if (!document.getElementById('clickRefreshSwitch')?.checked) return;

            const animationEnabled = window.App.Store
                ? window.App.Store.getSetting('animationSwitch') !== false
                : (document.getElementById('animationSwitch')?.checked !== false);

            if (animationEnabled) {
                container.style.transform = 'scale(0.98)';
                setTimeout(() => {
                    container.style.transform = 'scale(1)';
                    this.refreshNow();
                }, 300);
            } else {
                this.refreshNow();
            }
        });
    },

    // ==================== 工具 ====================

    escapeHTML(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
};