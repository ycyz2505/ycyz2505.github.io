window.App.Weather = {
    _retryTimer: null,
    _isRetrying: false,

    // 最近一次成功获取到的行政区划名（用于 tooltip）
    location: '',

    init() {
        this.fetch();

        clearInterval(window.App.Timers.weather);
        window.App.Timers.weather = setInterval(() => this.fetch(), 60000);

        this.bindLocationTip();
    },

    async fetch(retryCount = 0) {
        const el = document.getElementById('weatherInfo');
        if (!el) return;

        // 定时器触发的 fetch 如果撞上正在进行的重试链，就跳过这一次
        if (retryCount === 0 && this._isRetrying) return;

        try {
            const locRes = await fetch('https://ipwho.is/');
            if (!locRes.ok) throw new Error('地理位置请求失败');

            const loc = await locRes.json();
            if (loc.success !== true || typeof loc.latitude !== 'number' || typeof loc.longitude !== 'number') {
                throw new Error(loc.message || '地理位置数据无效');
            }

            // 记录行政区划，去重相邻重复项（例如 country/region/city 都是 Beijing）
            const pieces = [];
            [loc.country, loc.region, loc.city].forEach(v => {
                if (v && v !== pieces[pieces.length - 1]) pieces.push(v);
            });
            this.location = pieces.join(' ') || '位置未知';

            const tz = loc.timezone?.id || 'auto';
            const url =
                'https://api.open-meteo.com/v1/forecast' +
                `?latitude=${encodeURIComponent(loc.latitude)}` +
                `&longitude=${encodeURIComponent(loc.longitude)}` +
                '&current=weather_code,temperature_2m' +
                `&timezone=${encodeURIComponent(tz)}`;

            const res = await fetch(url);
            if (!res.ok) throw new Error('天气数据请求失败');

            const { current } = await res.json();
            if (!current || typeof current.temperature_2m !== 'number') {
                throw new Error('天气数据格式错误');
            }

            const temp = this.formatTemperature(current.temperature_2m);
            el.textContent = `${this.getWeatherName(current.weather_code)} ${temp}℃`;

            // 成功 → 结束重试状态
            this._isRetrying = false;
            if (this._retryTimer) {
                clearTimeout(this._retryTimer);
                this._retryTimer = null;
            }
        } catch (err) {
            console.error('天气加载失败:', err);

            if (retryCount < 3) {
                // 指数退避：2s → 4s → 8s
                this._isRetrying = true;
                const delay = 2000 * Math.pow(2, retryCount);

                if (this._retryTimer) clearTimeout(this._retryTimer);
                this._retryTimer = setTimeout(() => {
                    this._retryTimer = null;
                    this.fetch(retryCount + 1);
                }, delay);

                // 只在第一次失败时改文案，避免后续重试闪烁
                if (retryCount === 0) el.textContent = '天气加载中...';
            } else {
                this._isRetrying = false;
                el.textContent = '天气暂不可用';
            }
        }
    },

    formatTemperature(value) {
        const t = Number(value);
        if (!Number.isFinite(t)) return '--';
        return Number.isInteger(t) ? String(t) : t.toFixed(1);
    },

    getWeatherName(code) {
        const map = {
            0: '晴', 1: '大部晴朗', 2: '局部多云', 3: '阴', 45: '雾', 48: '雾凇',
            51: '小毛毛雨', 53: '毛毛雨', 55: '大毛毛雨', 56: '冻毛毛雨', 57: '强冻毛毛雨',
            61: '小雨', 63: '中雨', 65: '大雨', 66: '冻雨', 67: '强冻雨',
            71: '小雪', 73: '中雪', 75: '大雪', 77: '雪粒',
            80: '小阵雨', 81: '中阵雨', 82: '强阵雨', 85: '小阵雪', 86: '强阵雪',
            95: '雷雨', 96: '雷雨伴冰雹', 99: '强雷雨伴冰雹'
        };
        return map[code] || '未知天气';
    },

    // ---------- 位置提示 ----------
    bindLocationTip() {
        const weatherInfo = document.getElementById('weatherInfo');
        if (!weatherInfo) return;

        // 把 tooltip 插入到"天气"所在那一行（.schedule-item 已设置 position:relative）
        const row = weatherInfo.closest('.schedule-item') || weatherInfo.parentNode;
        if (row && !row.querySelector('#weatherLocationTip')) {
            const tip = document.createElement('div');
            tip.id = 'weatherLocationTip';
            tip.className = 'weather-location-tip';
            row.appendChild(tip);
        }

        weatherInfo.style.cursor = 'pointer';

        weatherInfo.addEventListener('click', () => {
            const tip = document.getElementById('weatherLocationTip');
            if (!tip) return;

            // 再次点击相同位置 → 收起
            if (tip.classList.contains('active')) {
                tip.classList.remove('active');
                return;
            }

            if (!this.location) return;

            tip.textContent = this.location;
            tip.classList.add('active');
        });

        // 点击其他位置 → 消失
        document.addEventListener('click', e => {
            if (e.target.closest('#weatherInfo')) return;
            document.getElementById('weatherLocationTip')?.classList.remove('active');
        });
    }
};