window.App.GoldenPhrase = {
    // 当前正在显示的金句
    currentPhrase: null,

    // 已获取、等待显示的下一条金句
    pendingPhrase: null,

    // 正在进行的预取请求的 controller
    prefetchController: null,

    // 轮播周期定时器
    cycleTimer: null,

    // 显示动画定时器（防止动画 setTimeout 叠加导致旧内容覆盖新内容）
    _animationTimer: null,

    // 联网金句 API 配置
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
        // 首次进入：立即显示一条本地金句，避免空白
        if (!this.currentPhrase) {
            this.displayNext(this.pickLocalPhrase());
        }

        // 开始第一个轮播周期（内部会立刻发起预取）
        this.scheduleNextCycle();

        // 绑定点击刷新
        this.bindClickRefresh();
    },

    // ==================== 兼容旧接口 ====================

    // modal_settings.js 在 goldenSwitch 打开 / interval 变化时调用
    startTimer() {
        this.scheduleNextCycle();
    },

    // modal_settings.js 在 goldenSwitch 关闭时调用
    stopTimer() {
        this.stopCycle();
        this.cancelPrefetch();
    },

    // 兼容旧代码里可能出现的 fetch() 调用（等同于点击刷新）
    fetch() {
        this.refreshNow();
    },

    // 兼容旧接口：直接显示一条本地金句
    showLocal() {
        this.displayNext(this.pickLocalPhrase());
    },

    // ==================== 轮播周期 ====================

    scheduleNextCycle() {
        this.stopCycle();

        const interval = Number(window.App.State?.intervalDuration) || 15000;

        // 关键：立即启动预取，用整个间隔时间等待联网结果
        this.prefetch();

        // 时间到点后切换
        this.cycleTimer = setTimeout(() => this.onCycleEnd(), interval);
    },

    stopCycle() {
        if (this.cycleTimer) {
            clearTimeout(this.cycleTimer);
            this.cycleTimer = null;
        }
    },

    // 一个轮播周期结束：切换到下一条
    onCycleEnd() {
        let next;

        if (this.pendingPhrase) {
            // 预取已完成，直接用
            next = this.pendingPhrase;
            this.pendingPhrase = null;
        } else {
            // 时间到还没拿到联网结果：放弃本次预取，回退到本地
            this.cancelPrefetch();
            next = this.pickLocalPhrase();
        }

        this.displayNext(next);

        // 开启下一个周期
        this.scheduleNextCycle();
    },

    // 点击刷新 / 手动立即切换：不等间隔，直接换
    refreshNow() {
        this.stopCycle();

        let next;
        if (this.pendingPhrase) {
            // 有已准备好的下一条，优先用
            next = this.pendingPhrase;
        } else {
            // 否则用本地
            next = this.pickLocalPhrase();
        }

        // 清理当前预取（若 pendingPhrase 用了，也一起清掉）
        this.cancelPrefetch();

        this.displayNext(next);

        // 如果金句自动轮播还开着，重新开始周期
        if (document.getElementById('goldenSwitch')?.checked) {
            this.scheduleNextCycle();
        }
    },

    // ==================== 预取逻辑 ====================

    async prefetch() {
        // 若有正在进行的预取，先取消（防止两次预取并行）
        if (this.prefetchController) {
            this.prefetchController.abort();
        }

        const controller = new AbortController();
        this.prefetchController = controller;
        this.pendingPhrase = null;

        const probability = Number(window.App.State?.apiProbability ?? 50);

        // 概率决定直接使用本地金句
        if (Math.random() >= probability / 100) {
            this.pendingPhrase = this.pickLocalPhrase();
            return;
        }

        // 记录本轮预取已经尝试过的 API，避免反复撞同一个挂掉的 API
        const triedApis = new Set();

        // 在整个轮播间隔内持续尝试联网，直到成功或被 abort
        while (!controller.signal.aborted) {
            // 优先选择尚未尝试过的 API
            let api = this.selectUntriedAPI(triedApis);
            if (!api) {
                // 所有 API 都试过一遍了，重置，允许再来一轮
                triedApis.clear();
                api = this.selectRandomAPI();
            }
            triedApis.add(api.url);

            try {
                const text = await this.fetchOnce(api, controller.signal);

                // 已被取消 或 已被新的预取替换：丢弃结果
                if (controller.signal.aborted) return;
                if (this.prefetchController !== controller) return;

                this.pendingPhrase = text;
                return;
            } catch (err) {
                // 已被取消或已被替换：静默退出
                if (controller.signal.aborted) return;
                if (this.prefetchController !== controller) return;

                // 稍微等待再换下一个 API 重试，避免疯狂刷请求
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

    // 按权重从未尝试过的 API 里选一个
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

    // 按权重从所有 API 里随机选一个
    selectRandomAPI() {
        const total = this.apiConfigs.reduce((sum, api) => sum + api.weight, 0);
        let random = Math.random() * total;

        for (const api of this.apiConfigs) {
            if (random < api.weight) return api;
            random -= api.weight;
        }
        return this.apiConfigs[0];
    },

    // 单次请求（带 5s 超时 + 外部 abort 联动）
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

    // 可被 abort 打断的 sleep
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

    // 记录当前金句并渲染
    displayNext(text) {
        window.App.State.lastPhrase = text;
        this.currentPhrase = text;
        this.updateDisplay(text);
    },

    updateDisplay(text) {
        const container = document.getElementById('goldenPhrase');
        if (!container) return;

        // 关键：取消上一次未执行的动画定时器，避免旧内容覆盖新内容
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
            // 默认关闭，需在设置里勾选“启用点击刷新金句”
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