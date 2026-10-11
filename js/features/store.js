// ============================================================
// js/features/store.js
// 本地数据存储适配层
// 与本地 LocalDataServer.exe（127.0.0.1:17632~17641）通信
//
// 数据文件（EClassDisplay/data/）：
//   settings.json     各类标量设置（不含座位表 / 倒计日）
//   seatmap.json      座位表 { version: 2, cols, rows }
//   countdowns.json   倒计日 { version: 2, items, activeId }
//   timetable.json / schedule.json / phrases.json / solarterms.json
//   lostfound.json / notifications.json
//
// 可靠性设计：
//   1) 每个数据集一个独立文件：保存座位表不会重写别的设置，反之亦然
//   2) 串行化：同一个文件同一时刻只有一个写入请求在途
//   3) 写后校验：回读内容不一致（写坏 / 被其他窗口覆盖）自动重写
//   4) 掉线兜底：服务没起来时改动留在内存并标脏，连上后自动补写
//   5) 轮询同步：定时回读磁盘，其他窗口的修改会自动同步进来（watch）
//   6) 坏文件自愈：磁盘上的 JSON 损坏时，用内存中的副本修复它
//   7) 一次性迁移：旧版存在 settings.seating / settings.countdowns
//      里的数据会自动搬到独立文件（迁移前会另存备份）
// ============================================================

window.App = window.App || {};

var STORE_WRITE_DELAY = 150;      // 连续修改合并写入的防抖时长（毫秒）
var STORE_POLL_INTERVAL = 4000;   // 轮询磁盘内容的间隔（毫秒）
var STORE_PROBE_TIMEOUT = 500;    // 单个端口的探测超时（毫秒）
var STORE_DETECT_COOLDOWN = 4000; // 两次端口探测之间的最短间隔（毫秒）
var STORE_PORT_START = 17632;
var STORE_PORT_END = 17641;
var STORE_RETRY_MAX = 8;          // 单次改动的最多重试次数

window.App.Store = {
    baseUrl: null,
    port: 0,
    available: false,
    cache: {},
    defaults: {
        settings: {
            goldenSwitch: true,
            imageSwitch: true,
            apiProbability: 50,
            intervalDuration: 15000,
            clickRefreshSwitch: false,
            animationSwitch: true,
            themeGradientSwitch: true,
            autoRefreshSwitch: false,
            lostAndFoundFontSize: 28,
            notificationFontSize: 16,

            // 今日课表临时覆盖，不修改 timetable 原始数据
            temporaryTimetable: null,

            // 虚拟时间偏移量（毫秒），0 表示跟随系统时间
            timeOffset: 0
        },

        // 座位表：见 modal_seating.js
        seatmap: { version: 2, cols: 12, rows: [] },

        // 倒计日：见 exam_countdown.js（第一项固定为高考，不可删除）
        countdowns: { version: 2, items: [], activeId: '' },

        timetable: {},
        schedule: {},
        phrases: {},
        solarterms: [],
        lostfound: [],
        notifications: []
    },

    // ---------- 内部状态 ----------
    _dirty: {},        // name → 有未落盘的改动
    _seq: {},          // name → 改动序号（判断写入期间是否又被改过）
    _tries: {},        // name → 已重试次数
    _writeTimers: {},
    _inFlight: {},     // name → 是否有写入在途
    _lastText: {},     // name → 最近一次已知的磁盘内容
    _loadedOk: {},     // name → 是否成功读过/写过磁盘
    _neverLoaded: {},  // name → 磁盘数据一直没读到（内存里只是默认值）
    _watchers: {},     // name → [回调]
    _pollTimer: null,
    _pollFail: 0,
    _detecting: null,
    _lastDetectAt: 0,
    _bannerTimer: null,
    _unloading: false,
    initPromise: null,

    // ---------- 初始化 ----------

    init() {
        if (this.initPromise) return this.initPromise;

        this.initPromise = this._doInit();
        return this.initPromise;
    },

    async _doInit() {
        this.defaults.timetable =
            typeof timetable !== 'undefined' ? timetable : {};

        this.defaults.schedule =
            typeof schedule !== 'undefined' ? schedule : {};

        this.defaults.phrases =
            typeof localPhrases !== 'undefined' ? localPhrases : {};

        this.defaults.solarterms =
            typeof solarTerms !== 'undefined' ? solarTerms : [];

        this._bindUnload();

        await this._detectPort();
        await this._loadAll();
        await this._migrate();
        this._updateBanner();
        this._startPolling();

        console.info(
            this.available
                ? `[Store] 本地服务已连接：${this.baseUrl}`
                : '[Store] 本地服务未启动，运行在内存模式（服务恢复后会自动补写）'
        );
    },

    async _detectPort() {
        for (let port = STORE_PORT_START; port <= STORE_PORT_END; port++) {
            const ok = await this._probe(port);

            if (ok) {
                this.baseUrl = `http://127.0.0.1:${port}`;
                this.port = port;
                this.available = true;
                return true;
            }
        }

        this.baseUrl = null;
        this.port = 0;
        this.available = false;
        return false;
    },

    _probe(port) {
        return new Promise(resolve => {
            const controller = new AbortController();
            const timer = setTimeout(
                () => controller.abort(),
                STORE_PROBE_TIMEOUT
            );

            fetch(`http://127.0.0.1:${port}/api/ping`, {
                signal: controller.signal,
                cache: 'no-store'
            })
                .then(res => {
                    clearTimeout(timer);

                    if (!res.ok) {
                        resolve(false);
                        return;
                    }

                    res.json()
                        .then(data => {
                            resolve(
                                data &&
                                data.service === 'class-local-data'
                            );
                        })
                        .catch(() => resolve(false));
                })
                .catch(() => {
                    clearTimeout(timer);
                    resolve(false);
                });
        });
    },

    // 服务没连上时按一定间隔重试探测；连上后把积压的改动补写、把没读到的数据补读
    async _ensureAvailable() {
        if (this.available) return true;

        if (this._detecting) return this._detecting;

        const now = Date.now();
        if (now - this._lastDetectAt < STORE_DETECT_COOLDOWN) return false;
        this._lastDetectAt = now;

        const self = this;

        this._detecting = (async function () {
            try {
                const ok = await self._detectPort();
                if (!ok) return false;

                self._pollFail = 0;
                self._updateBanner(false);
                console.info(`[Store] 本地服务已连接：${self.baseUrl}`);

                await self._resyncAfterConnect();
                self._flushAllDirty();
                return true;
            } finally {
                self._detecting = null;
            }
        })();

        return this._detecting;
    },

    _setUnavailable() {
        if (!this.available && this.baseUrl === null) return;

        this.available = false;
        this._updateBanner(true);
        console.warn('[Store] 本地服务连接中断，改动会留在页面等待恢复');
    },

    // 连上服务后：
    //   1) 掉线期间基于「已读到的真实数据」做的改动 → 保留，稍后补写
    //   2) 一直没读到磁盘数据（内存里只是默认值）→ 以磁盘为准，丢弃基于空表产生的改动
    //   3) 从没成功读过的数据集 → 重新读一遍
    async _resyncAfterConnect() {
        for (const name of Object.keys(this.defaults)) {
            if (this._loadedOk[name]) continue;
            if (this._dirty[name] && !this._neverLoaded[name]) continue;

            // 记下「这次读之前是不是只有内存默认值」，读完再判断
            const wasNeverLoaded = this._neverLoaded[name] === true;

            const data = await this._load(name, this.defaults[name]);
            this.cache[name] = data;

            // 磁盘上确实有数据：丢掉基于空默认值产生的改动，以磁盘为准；
            // 磁盘上还没这个文件（404）时保留改动，照常把默认值建出来
            if (wasNeverLoaded && this._loadedOk[name]) {
                this._dirty[name] = false;
                this._neverLoaded[name] = false;

                if (this._writeTimers[name]) {
                    clearTimeout(this._writeTimers[name]);
                    this._writeTimers[name] = null;
                }
            }

            this._notify(name, data);
        }

        await this._migrate();
    },

    // ---------- 读取 ----------

    async _loadAll() {
        for (const name of Object.keys(this.defaults)) {
            this.cache[name] = await this._load(
                name,
                this.defaults[name]
            );
        }
    },

    async _load(name, defaultValue) {
        const safeDefault = this._clone(defaultValue);

        if (!this.available) {
            this._neverLoaded[name] = true;
            return safeDefault;
        }

        let res;

        try {
            res = await fetch(
                `${this.baseUrl}/api/data/${name}`,
                { cache: 'no-store' }
            );
        } catch (e) {
            console.warn(`[Store] 读取 ${name} 失败（连接异常）:`, e);
            this._setUnavailable();
            this._neverLoaded[name] = true;
            return safeDefault;
        }

        if (res.status === 404) {
            // 首次运行：先把默认值放到内存，随后写盘
            this._markDirty(name);
            this._scheduleWrite(name);
            return safeDefault;
        }

        if (!res.ok) {
            console.warn(`[Store] 读取 ${name} 失败：HTTP ${res.status}`);
            return safeDefault;
        }

        const text = await res.text();

        try {
            const data = JSON.parse(text);

            this._lastText[name] = text;
            this._loadedOk[name] = true;
            this._neverLoaded[name] = false;

            if (
                name === 'settings' &&
                data &&
                typeof data === 'object' &&
                !Array.isArray(data)
            ) {
                return Object.assign({}, safeDefault, data);
            }

            return data;
        } catch (e) {
            // 磁盘上的内容坏了：备份坏文件，之后用默认值重建
            console.error(`[Store] ${name}.json 解析失败，将用默认值重建:`, e);
            this._archiveRaw(`${name}_corrupt_backup`, text);
            this._markDirty(name);
            this._scheduleWrite(name);
            return safeDefault;
        }
    },

    get(name) {
        return this.cache[name];
    },

    set(name, value) {
        this.cache[name] = value;
        this._markDirty(name);
        this._scheduleWrite(name);
    },

    // 对象内容就地改过之后调用，触发写盘
    touch(name) {
        this._markDirty(name);
        this._scheduleWrite(name);
    },

    getSetting(key) {
        const settings =
            this.cache.settings || this.defaults.settings;

        return settings[key];
    },

    // options.persist === false 时只改内存，不触发写盘
    setSetting(key, value, options) {
        if (!this.cache.settings) {
            this.cache.settings = this._clone(
                this.defaults.settings
            );
        }

        this.cache.settings[key] = value;

        if (!options || options.persist !== false) {
            this._markDirty('settings');
            this._scheduleWrite('settings');
        }
    },

    // 能不能安全地修改某个数据集：
    //   服务在线 → 可以
    //   服务掉线，但数据是从磁盘读来的 → 可以（改动先留内存，连上后自动补写）
    //   服务一直没连上，内存里只是默认值 → 不可以
    //   （否则会把磁盘上的真实数据整体覆盖掉）
    canWrite(name) {
        if (this.available) return true;
        return this._loadedOk[name] === true;
    },

    // 监听某个数据集被磁盘上的其他改动更新（跨窗口同步）
    watch(name, fn) {
        if (typeof fn !== 'function') return;

        if (!this._watchers[name]) this._watchers[name] = [];
        if (this._watchers[name].indexOf(fn) === -1) {
            this._watchers[name].push(fn);
        }
    },

    // ---------- 写入 ----------

    _markDirty(name) {
        this._dirty[name] = true;
        this._seq[name] = (this._seq[name] || 0) + 1;
    },

    _scheduleWrite(name) {
        const self = this;

        if (this._writeTimers[name]) {
            clearTimeout(this._writeTimers[name]);
        }

        this._writeTimers[name] = setTimeout(() => {
            self._writeTimers[name] = null;
            self._flush(name);
        }, STORE_WRITE_DELAY);
    },

    async _flush(name) {
        if (!this._dirty[name]) return;
        if (this._inFlight[name]) return;   // 在途写入结束后会由新调度再触发

        if (!this.available && !(await this._ensureAvailable())) {
            return;   // 服务还没起来：脏标记保留，连上后补写
        }

        let value = this.cache[name];
        if (value === undefined) value = this.defaults[name];
        if (value === undefined) {
            this._dirty[name] = false;
            return;
        }

        const text = JSON.stringify(value);
        const seq = this._seq[name] || 0;

        this._inFlight[name] = true;

        let ok = false;

        try {
            ok = await this._put(name, text);

            if (ok) ok = await this._verify(name, text);

            // 内容不一致（被别的窗口覆盖 / 写坏）时再写一次
            if (!ok && !this._unloading) {
                ok = await this._put(name, text);
                if (ok) ok = await this._verify(name, text);
            }
        } catch (e) {
            console.warn(`[Store] 保存 ${name} 失败:`, e);
        } finally {
            this._inFlight[name] = false;
        }

        if (ok) {
            this._tries[name] = 0;
            if ((this._seq[name] || 0) === seq) this._dirty[name] = false;
            return;
        }

        // 失败：保留脏标记，按次数退避重试
        if (this._unloading) return;

        this._tries[name] = (this._tries[name] || 0) + 1;
        this._updateBanner(true);

        if (this._tries[name] > STORE_RETRY_MAX) {
            console.warn(
                `[Store] ${name} 多次保存失败，等本地服务恢复后再试`
            );
            return;
        }

        const self = this;
        setTimeout(
            () => self._flush(name),
            Math.min(2000 * this._tries[name], 15000)
        );
    },

    _put(name, text, options) {
        const opts = options || {};

        return fetch(`${this.baseUrl}/api/data/${name}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: text,
            cache: 'no-store',
            keepalive: !!opts.keepalive
        })
            .then(res => {
                if (!res.ok) return false;

                this._lastText[name] = text;
                this._loadedOk[name] = true;
                this._neverLoaded[name] = false;
                this.available = true;
                this._pollFail = 0;
                return true;
            })
            .catch(err => {
                if (!opts.silent) {
                    console.warn(`[Store] 保存 ${name} 失败:`, err);
                    this._setUnavailable();
                }
                return false;
            });
    },

    // 写后回读校验：内容一致才算写成功
    async _verify(name, text) {
        if (this._unloading) return true;

        try {
            const res = await fetch(
                `${this.baseUrl}/api/data/${name}?_=${Date.now()}`,
                { cache: 'no-store' }
            );

            if (!res.ok) return true;   // 读不回来不算写入失败，避免误报

            const cur = await res.text();
            if (cur === text) return true;

            console.warn(`[Store] ${name} 写入校验不一致，准备重写`);
            return false;
        } catch (e) {
            return true;
        }
    },

    _flushAllDirty() {
        for (const name of Object.keys(this._dirty)) {
            if (this._dirty[name]) this._flush(name);
        }
    },

    // 页面关闭前把所有未落盘的改动一起送出去
    flush() {
        this._unloading = true;

        const names = {};

        Object.keys(this._dirty).forEach(name => {
            if (this._dirty[name]) names[name] = true;
        });

        Object.keys(this._writeTimers).forEach(name => {
            if (this._writeTimers[name]) {
                clearTimeout(this._writeTimers[name]);
                this._writeTimers[name] = null;
                names[name] = true;
            }
        });

        if (!this.available) return Promise.resolve();

        const tasks = Object.keys(names).map(name => {
            let value = this.cache[name];
            if (value === undefined) value = this.defaults[name];
            if (value === undefined) return Promise.resolve(false);

            this._dirty[name] = false;
            return this._put(name, JSON.stringify(value), {
                keepalive: true,
                silent: true
            });
        });

        return Promise.all(tasks);
    },

    // ---------- 轮询：跟随磁盘上的外部改动 ----------

    _startPolling() {
        if (this._pollTimer) return;

        const self = this;

        this._pollTimer = setInterval(
            () => self._tick(),
            STORE_POLL_INTERVAL
        );

        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) self._tick();
        });

        window.addEventListener('online', () => self._tick());
    },

    async _tick() {
        if (this._unloading) return;

        if (!this.available) {
            await this._ensureAvailable();
            return;
        }

        const names = Object.keys(this._watchers);

        if (!names.length) {
            // 没有订阅者时至少确认服务还活着
            const alive = await this._probe(this.port);
            if (!alive) this._setUnavailable();
            return;
        }

        let ok = true;

        for (const name of names) {
            if (this._dirty[name] || this._inFlight[name]) continue;
            const result = await this._syncFromDisk(name);
            if (!result) ok = false;
        }

        if (ok) {
            this._pollFail = 0;
            return;
        }

        this._pollFail += 1;

        if (this._pollFail >= 3) {
            this._pollFail = 0;
            this._setUnavailable();
        }
    },

    async _syncFromDisk(name) {
        let res;

        try {
            res = await fetch(
                `${this.baseUrl}/api/data/${name}?_=${Date.now()}`,
                { cache: 'no-store' }
            );
        } catch (e) {
            return false;
        }

        if (!res.ok) return true;

        const text = await res.text();
        if (text === this._lastText[name]) return true;

        this._lastText[name] = text;

        try {
            const data = JSON.parse(text);

            this.cache[name] =
                name === 'settings' &&
                data &&
                typeof data === 'object' &&
                !Array.isArray(data)
                    ? Object.assign(
                        {},
                        this._clone(this.defaults.settings),
                        data
                    )
                    : data;

            this._loadedOk[name] = true;
            this._notify(name, this.cache[name]);
        } catch (e) {
            // 文件被写坏了：内存里有可用副本就把它修复回去
            if (this._loadedOk[name] && this.cache[name] !== undefined) {
                console.warn(
                    `[Store] ${name}.json 内容损坏，正在用内存副本修复`
                );
                this._archiveRaw(`${name}_corrupt_backup`, text);
                this._markDirty(name);
                this._flush(name);
            }
        }

        return true;
    },

    _notify(name, value) {
        const list = this._watchers[name];
        if (!list || !list.length) return;

        list.forEach(fn => {
            try {
                fn(value, name);
            } catch (e) {
                console.error('[Store] watch 回调出错:', e);
            }
        });
    },

    // ---------- 一次性迁移 ----------

    // 旧版本把座位表、倒计日放在 settings.json 里，
    // 这里搬到各自的文件；更早版本的 seatmap.json 会先备份
    async _migrate() {
        const settings = this.cache.settings;

        if (settings && typeof settings === 'object') {
            let settingsChanged = false;

            // ---- 座位表：settings.seating → seatmap.json ----
            const legacySeat = settings.seating;

            if (legacySeat && typeof legacySeat === 'object') {
                const cur = this.cache.seatmap;
                const legacyOk =
                    legacySeat.version === 2 &&
                    Array.isArray(legacySeat.rows) &&
                    legacySeat.rows.length > 0;
                const curOk =
                    cur &&
                    cur.version === 2 &&
                    Array.isArray(cur.rows) &&
                    cur.rows.length > 0;

                if (legacyOk && !curOk) {
                    if (cur && !curOk) {
                        this._archiveRaw(
                            'seatmap_v0_backup',
                            JSON.stringify(cur)
                        );
                    }

                    this.cache.seatmap = this._clone({
                        version: 2,
                        cols: legacySeat.cols,
                        rows: legacySeat.rows
                    });

                    this._markDirty('seatmap');
                    this._scheduleWrite('seatmap');
                }

                delete settings.seating;
                settingsChanged = true;
            }

            // ---- 倒计日：settings.countdowns → countdowns.json ----
            const legacyList = settings.countdowns;
            const legacyActive = settings.activeCountdownId;

            if (Array.isArray(legacyList) || legacyActive !== undefined) {
                const file = this._countdownFile(this.cache.countdowns);

                if (Array.isArray(legacyList)) {
                    legacyList.forEach(item => {
                        if (!item || typeof item !== 'object') return;

                        const id = String(item.id || '').trim();
                        const name = String(item.name || '').trim();
                        const date = String(item.date || '').trim();

                        if (!id || !name || !date) return;
                        if (file.items.some(x => x.id === id)) return;
                        if (
                            file.items.some(
                                x => x.name === name && x.date === date
                            )
                        ) {
                            return;
                        }

                        file.items.push({
                            id: id,
                            name: name,
                            date: date
                        });
                    });
                }

                if (
                    !file.activeId &&
                    typeof legacyActive === 'string' &&
                    legacyActive
                ) {
                    file.activeId = legacyActive;
                }

                this.cache.countdowns = file;
                this._markDirty('countdowns');
                this._scheduleWrite('countdowns');

                delete settings.countdowns;
                delete settings.activeCountdownId;
                settingsChanged = true;
            }

            if (settingsChanged) {
                this._markDirty('settings');
                this._scheduleWrite('settings');
            }
        }

        this._migrateCountdownFile();
    },

    // 更早版本的 countdowns.json 是裸数组，这里统一升级成 { version, items, activeId }
    _migrateCountdownFile() {
        if (!this._loadedOk.countdowns) return;

        const file = this._countdownFile(this.cache.countdowns);
        this.cache.countdowns = file;

        if (JSON.stringify(file) !== this._lastText.countdowns) {
            this._markDirty('countdowns');
            this._scheduleWrite('countdowns');
        }
    },

    // 把任意形态的倒计日数据整理成 { version: 2, items, activeId }
    _countdownFile(raw) {
        const out = { version: 2, items: [], activeId: '' };

        if (Array.isArray(raw)) {
            out.items = raw;
        } else if (raw && typeof raw === 'object') {
            if (Array.isArray(raw.items)) out.items = raw.items;
            if (typeof raw.activeId === 'string') out.activeId = raw.activeId;
        }

        out.items = out.items
            .filter(item => item && typeof item === 'object')
            .map(item => ({
                id: String(item.id || '').trim(),
                name: String(item.name || '').trim(),
                date: String(item.date || '').trim()
            }))
            .filter(item => item.id && item.name);

        return out;
    },

    // 把内容另存为 <name>.json（用于留档：旧格式、损坏内容）
    _archiveRaw(name, text) {
        if (!this.available) return;

        const res = this._put(name, text, { silent: true });

        if (res && res.catch) {
            res.catch(() => { /* 留档失败不影响主流程 */ });
        }
    },

    // ---------- 工具 ----------

    _clone(value) {
        try {
            return JSON.parse(JSON.stringify(value));
        } catch (e) {
            return value;
        }
    },

    _updateBanner(forceShow) {
        const banner = document.getElementById('serviceBanner');
        if (!banner) return;

        // 服务可用：整条提示隐藏
        if (this.available) {
            if (this._bannerTimer) {
                clearTimeout(this._bannerTimer);
                this._bannerTimer = null;
            }

            banner.style.display = 'none';
            return;
        }

        // 服务不可用：显示提示条（含下载按钮），自动淡出；
        // 保存失败时再次唤起，提醒用户改动还没落盘
        banner.style.display = 'flex';
        banner.style.opacity = '1';
        banner.style.transition = '';

        const textEl = document.getElementById('serviceBannerText');
        if (textEl) {
            textEl.textContent =
                '本地服务未启动（改动会先留在页面，服务恢复后自动保存）';
        }

        if (this._bannerTimer) {
            clearTimeout(this._bannerTimer);
            this._bannerTimer = null;
        }

        this._bannerTimer = setTimeout(() => {
            this._bannerTimer = null;
            banner.style.transition = 'opacity .5s';
            banner.style.opacity = '0';
            // 等淡出动画走完再彻底隐藏
            setTimeout(() => {
                if (banner.style.opacity === '0') {
                    banner.style.display = 'none';
                }
            }, 500);
        }, forceShow ? 6000 : 10000);
    },

    _bindUnload() {
        const flush = () => this.flush();

        window.addEventListener('pagehide', flush);
        window.addEventListener('beforeunload', flush);
    }
};
