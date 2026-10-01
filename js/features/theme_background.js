window.App = window.App || {};

window.App.ThemeBackground = {
    // 刷新间隔（毫秒）——10 分钟一次，让色相跟着时间缓缓流动
    REFRESH_INTERVAL: 10 * 60 * 1000,

    init() {
        this.update();
        setInterval(() => this.update(), this.REFRESH_INTERVAL);
    },

    getTerms() {
        if (window.App.Store) {
            return window.App.Store.get('solarterms') || [];
        }
        return typeof solarTerms !== 'undefined' ? solarTerms : [];
    },

    update() {
        const terms = this.getTerms();
        if (!terms.length) return;

        const hue = this.getCurrentHue(terms);
        if (hue === null) return;

        this.applyTheme(hue);
    },

    // 找出当前日期落在哪两个节气之间，对"色相"做环形插值
    getCurrentHue(terms) {
        const now = window.App.Utils.now();
        const year = now.getFullYear();

        const entries = terms
            .filter(t => t.month && t.day && t.color)
            .map(t => ({
                hue: this.hexToHue(t.color),
                date: new Date(year, t.month - 1, t.day)
            }))
            .filter(t => t.hue !== null)
            .sort((a, b) => a.date - b.date);

        if (!entries.length) return null;

        let prev, next;

        if (now < entries[0].date) {
            // 早于今年第一个节气 → 用去年最后一个和今年第一个
            const last = entries[entries.length - 1];
            prev = {
                hue: last.hue,
                date: new Date(year - 1, last.date.getMonth(), last.date.getDate())
            };
            next = entries[0];
        } else {
            let found = false;
            for (let i = 0; i < entries.length; i++) {
                if (now >= entries[i].date) {
                    prev = entries[i];
                    if (i + 1 < entries.length) {
                        next = entries[i + 1];
                    } else {
                        // 晚于今年最后一个 → 用今年最后一个和明年第一个
                        const first = entries[0];
                        next = {
                            hue: first.hue,
                            date: new Date(year + 1, first.date.getMonth(), first.date.getDate())
                        };
                    }
                    found = true;
                }
            }
            if (!found) return entries[0].hue;
        }

        const span = next.date - prev.date;
        if (span <= 0) return prev.hue;

        const t = Math.max(0, Math.min(1, (now - prev.date) / span));

        // 色相是 0~360 的环，需要走"最短弧"插值，避免 350°→10° 时绕远路
        let delta = next.hue - prev.hue;
        if (delta > 180) delta -= 360;
        if (delta < -180) delta += 360;

        let h = prev.hue + delta * t;
        if (h < 0) h += 360;
        if (h >= 360) h -= 360;

        return h;
    },

    // 从 #RRGGBB 提取色相（0~360 度）；纯灰色返回 null
    hexToHue(hex) {
        if (typeof hex !== 'string') return null;
        const h = hex.replace('#', '');
        const full = h.length === 3
            ? h.split('').map(c => c + c).join('')
            : h;
        if (full.length !== 6) return null;

        const num = parseInt(full, 16);
        if (isNaN(num)) return null;

        const r = ((num >> 16) & 255) / 255;
        const g = ((num >> 8) & 255) / 255;
        const b = (num & 255) / 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const delta = max - min;

        if (delta === 0) return null;

        let hue;
        if (max === r) {
            hue = 60 * (((g - b) / delta) % 6);
        } else if (max === g) {
            hue = 60 * ((b - r) / delta + 2);
        } else {
            hue = 60 * ((r - g) / delta + 4);
        }

        if (hue < 0) hue += 360;
        return hue;
    },

    // 用色相生成一整套主题色，写入 CSS 变量
    // 只让色相流动，明度/饱和度的结构固定，确保一年四季对比度稳定、文字可读
    applyTheme(hue) {
        const h = Math.round(hue * 10) / 10;
        const root = document.documentElement;

        const set = (name, value) => root.style.setProperty(name, value);

        // 主色：按钮、滑块、开关、加号按钮、进度条
        set('--theme-primary',        `hsl(${h}, 45%, 55%)`);
        set('--theme-primary-hover',  `hsl(${h}, 45%, 48%)`);
        set('--theme-primary-active', `hsl(${h}, 45%, 42%)`);

        // 深色标题：亮度封顶 20%，避免黄色类节气偏亮看不清
        set('--theme-dark', `hsl(${h}, 35%, 20%)`);

        // 正文 / 次要文字
        set('--theme-text',  `hsl(${h}, 15%, 25%)`);
        set('--theme-muted', `hsl(${h}, 12%, 45%)`);

        // 背景渐变两端：始终保持在 93% 以上亮度，保证黑字可读
        set('--theme-bg-start', `hsl(${h}, 30%, 97%)`);
        set('--theme-bg-end',   `hsl(${h}, 25%, 93%)`);

        // 卡片表面
        set('--theme-surface',       `hsla(${h}, 30%, 98%, .9)`);
        set('--theme-surface-solid', `hsl(${h}, 15%, 99%)`);
        set('--theme-surface-soft',  `hsl(${h}, 20%, 96%)`);
        set('--theme-surface-hover', `hsl(${h}, 30%, 93%)`);

        // 边框 / 分隔线
        set('--theme-border', `hsl(${h}, 20%, 90%)`);
    }
};