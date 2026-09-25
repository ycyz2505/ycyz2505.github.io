window.App = window.App || {};

window.App.Store = {
    baseUrl: null,
    available: false,
    initPromise: null,
    cache: {},
    writeTimers: {},

    defaults: {
        settings: {
            autoRefresh: true,
            showWeather: true,
            showDailyImage: true
        },
        timetable: {},
        schedule: {},
        phrases: {},
        solarterms: [],
        lostfound: [],
        notifications: [],
        seatmap: {
            columns: 12,
            rows: 6,
            blocks: [
                { id: 'seat-1', type: 'person', name: '张三' },
                { id: 'seat-2', type: 'person', name: '李四' },
                { id: 'aisle-1', type: 'aisle' },
                { id: 'seat-3', type: 'person', name: '王五' },
                { id: 'seat-4', type: 'person', name: '赵六' },
                { id: 'seat-5', type: 'person', name: '陈同学' },
                { id: 'seat-6', type: 'person', name: '刘同学' },
                { id: 'aisle-2', type: 'aisle' },
                { id: 'seat-7', type: 'person', name: '周同学' },
                { id: 'seat-8', type: 'person', name: '吴同学' },
                { id: 'podium-1', type: 'podium', name: '讲台' }
            ]
        }
    },

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

        await this._detectPort();
        await this._loadAll();
        this._updateBanner();

        console.info(
            this.available
                ? `[Store] 本地服务已连接：${this.baseUrl}`
                : '[Store] 本地服务未启动，运行在内存模式（修改不会被保存）'
        );
    },

    async _detectPort() {
        for (let port = 17632; port <= 17641; port++) {
            const ok = await this._probe(port);

            if (ok) {
                this.baseUrl = `http://127.0.0.1:${port}`;
                this.available = true;
                return;
            }
        }

        this.baseUrl = null;
        this.available = false;
    },

    _probe(port) {
        return new Promise(resolve => {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 500);

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

    async _loadAll() {
        const names = [
            'settings',
            'timetable',
            'schedule',
            'phrases',
            'solarterms',
            'lostfound',
            'notifications',
            'seatmap'
        ];

        for (const name of names) {
            this.cache[name] = await this._load(
                name,
                this.defaults[name]
            );
        }
    },

    async _load(name, defaultValue) {
        const safeDefault = this._clone(defaultValue);

        if (!this.available) return safeDefault;

        try {
            const res = await fetch(
                `${this.baseUrl}/api/data/${name}`,
                { cache: 'no-store' }
            );

            if (res.ok) {
                const data = await res.json();

                if (
                    name === 'settings' &&
                    data &&
                    typeof data === 'object' &&
                    !Array.isArray(data)
                ) {
                    return Object.assign({}, safeDefault, data);
                }

                return data;
            }

            if (res.status === 404) {
                await this._writeNow(name, safeDefault);
                return safeDefault;
            }
        } catch (e) {
            console.warn(`[Store] 加载 ${name} 失败:`, e);
        }

        return safeDefault;
    },

    get(name) {
        return this.cache[name];
    },

    set(name, value) {
        this.cache[name] = value;
        this._scheduleWrite(name);
    },

    touch(name) {
        this._scheduleWrite(name);
    },

    getSetting(key) {
        const settings =
            this.cache.settings || this.defaults.settings;

        return settings[key];
    },

    setSetting(key, value) {
        if (!this.cache.settings) {
            this.cache.settings = this._clone(
                this.defaults.settings
            );
        }

        this.cache.settings[key] = value;
        this._scheduleWrite('settings');
    },

    _scheduleWrite(name) {
        if (!this.available) return;

        if (this.writeTimers[name]) {
            clearTimeout(this.writeTimers[name]);
        }

        this.writeTimers[name] = setTimeout(() => {
            this._writeNow(name, this.cache[name]);
            this.writeTimers[name] = null;
        }, 150);
    },

    _writeNow(name, value) {
        if (!this.available) return Promise.resolve();

        return fetch(`${this.baseUrl}/api/data/${name}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(value)
        }).catch(err => {
            console.warn(`[Store] 保存 ${name} 失败:`, err);
        });
    },

    flush() {
        if (!this.available) return;

        Object.keys(this.writeTimers).forEach(name => {
            if (this.writeTimers[name]) {
                clearTimeout(this.writeTimers[name]);
                this.writeTimers[name] = null;
                this._writeNow(name, this.cache[name]);
            }
        });
    },

    _clone(value) {
        try {
            return JSON.parse(JSON.stringify(value));
        } catch (e) {
            return value;
        }
    },

    _updateBanner() {
        const banner = document.getElementById('serviceBanner');
        if (!banner) return;

        if (this.available) {
            banner.style.display = 'none';
            return;
        }

        banner.style.display = 'block';
        banner.textContent =
            '本地服务未启动（D 盘 LocalDataServer.exe），修改不会被保存';

        setTimeout(() => {
            banner.style.opacity = '0';
            banner.style.transition = 'opacity .5s';
        }, 4000);
    }
};

window.addEventListener('pagehide', () => {
    window.App.Store.flush();
});

window.addEventListener('beforeunload', () => {
    window.App.Store.flush();
});