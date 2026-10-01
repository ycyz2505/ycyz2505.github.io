window.App = window.App || {};

window.App.ThemeBackground = {
    // 刷新间隔（毫秒）——10 分钟一次，让整套配色跟着时间缓缓流动
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

    // 主题渐变是否开启（读取用户设置，默认开启）
    isGradientEnabled() {
        if (window.App.Store) {
            return window.App.Store.getSetting('themeGradientSwitch') !== false;
        }
        return true;
    },

    update() {
        // 关闭时：清除内联变量，回退到 CSS 里写死的默认绿色主题
        if (!this.isGradientEnabled()) {
            this.resetTheme();
            return;
        }

        const terms = this.getTerms();
        if (!terms.length) return;

        const base = this.getCurrentColor(terms);
        if (!base) return;

        this.applyTheme(base);
    },

    // 移除所有动态注入的主题变量，让 :root 里的默认值重新生效
    resetTheme() {
        const root = document.documentElement;
        [
            '--theme-primary',
            '--theme-primary-hover',
            '--theme-primary-active',
            '--theme-primary-rgb',
            '--theme-dark',
            '--theme-text',
            '--theme-muted',
            '--theme-bg-start',
            '--theme-bg-end',
            '--theme-surface',
            '--theme-surface-solid',
            '--theme-surface-soft',
            '--theme-surface-hover',
            '--theme-border'
        ].forEach(name => root.style.removeProperty(name));
    },

    // 兼容旧接口：返回当前插值出的色相（0~360，OKLCH 色相角）
    getCurrentHue(terms) {
        const base = this.getCurrentColor(terms || this.getTerms());
        return base ? base.H : null;
    },

    // 兼容旧接口：返回某个颜色的色相（新版本为 OKLCH 色相角）
    hexToHue(hex) {
        const c = this.hexToOklch(hex);
        return c ? c.H : null;
    },

    // 找出当前日期落在哪两个节气色之间，对整份颜色（明度/彩度/色相）做插值
    getCurrentColor(terms) {
        const now = window.App.Utils.now();
        const year = now.getFullYear();

        const entries = terms
            .filter(t => t.month && t.day && t.color)
            .map(t => {
                const c = this.hexToOklch(t.color);
                return c ? { L: c.L, C: c.C, H: c.H, date: new Date(year, t.month - 1, t.day) } : null;
            })
            .filter(Boolean)
            .sort((a, b) => a.date - b.date);

        if (!entries.length) return null;

        // 接近无彩色的颜色没有稳定色相，让它们沿用上一个有效色相，避免色相乱跳
        const firstDefined = entries.find(e => e.C >= 0.004);
        let lastH = firstDefined ? firstDefined.H : 0;
        for (const e of entries) {
            if (e.C >= 0.004) lastH = e.H;
            else e.H = lastH;
        }

        let prev, next;

        if (now < entries[0].date) {
            // 早于今年第一个节气 → 用去年最后一个和今年第一个
            const last = entries[entries.length - 1];
            prev = { L: last.L, C: last.C, H: last.H, date: new Date(year - 1, last.date.getMonth(), last.date.getDate()) };
            next = entries[0];
        } else {
            for (let i = 0; i < entries.length; i++) {
                if (now >= entries[i].date) {
                    prev = entries[i];
                    if (i + 1 < entries.length) {
                        next = entries[i + 1];
                    } else {
                        // 晚于今年最后一个 → 用今年最后一个和明年第一个
                        const first = entries[0];
                        next = { L: first.L, C: first.C, H: first.H, date: new Date(year + 1, first.date.getMonth(), first.date.getDate()) };
                    }
                }
            }
            if (!prev) return entries[0];
        }

        const span = next.date - prev.date;
        if (span <= 0) return prev;

        const t = Math.max(0, Math.min(1, (now - prev.date) / span));
        return this.mixOklch(prev, next, t);
    },

    // 在 OKLCH 空间插值：明度、彩度线性过渡，色相走最短弧
    mixOklch(a, b, t) {
        let dh = b.H - a.H;
        if (dh > 180) dh -= 360;
        if (dh < -180) dh += 360;

        let H = a.H + dh * t;
        if (H < 0) H += 360;
        if (H >= 360) H -= 360;

        return {
            L: a.L + (b.L - a.L) * t,
            C: a.C + (b.C - a.C) * t,
            H
        };
    },

    // ===== 由插值颜色生成整套主题色 =====
    // 明度结构全年统一：无论什么季节，按钮白字、正文、背景的对比度都稳定，
    // 不再出现“黄色刺眼、蓝绿发闷”的问题；彩度随季节轻微起伏（冬素雅、夏明快）。
    applyTheme(base) {
        const H = base.H;
        const C0 = base.C;
        const root = document.documentElement;
        const set = (name, value) => root.style.setProperty(name, value);
        const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
        const color = (L, C, alpha) => this.cssOklch(L, Math.max(0, C), H, alpha);

        const primaryC = clamp(0.060 + C0 * 0.75, 0.095, 0.148);
        const darkC    = clamp(0.018 + C0 * 0.20, 0.018, 0.048);

        // 主色：按钮、滑块、开关、加号按钮、进度条（亮度压低一点，白字更清楚）
        const primaryRgb = this.cssOklchRgb(0.63, primaryC, H);
        set('--theme-primary',        `rgb(${primaryRgb.join(', ')})`);
        set('--theme-primary-hover',  color(0.575, primaryC));
        set('--theme-primary-active', color(0.52, primaryC));
        set('--theme-primary-rgb',    primaryRgb.join(', '));

        // 深色标题 / 大数字
        set('--theme-dark', color(0.30, darkC));

        // 正文 / 次要文字
        set('--theme-text',  color(0.34, 0.018));
        set('--theme-muted', color(0.57, 0.020));

        // 背景渐变两端
        set('--theme-bg-start', color(0.985, clamp(0.006 + C0 * 0.12, 0.006, 0.020)));
        set('--theme-bg-end',   color(0.955, clamp(0.012 + C0 * 0.30, 0.012, 0.050)));

        // 卡片表面
        set('--theme-surface',       color(0.990, 0.006, 0.9));
        set('--theme-surface-solid', color(0.995, 0.004));
        set('--theme-surface-soft',  color(0.975, clamp(0.008 + C0 * 0.15, 0.008, 0.024)));
        set('--theme-surface-hover', color(0.943, clamp(0.012 + C0 * 0.25, 0.012, 0.045)));

        // 边框 / 分隔线
        set('--theme-border', color(0.918, clamp(0.010 + C0 * 0.16, 0.010, 0.032)));
    },

    // 把 OKLCH 转成 CSS 颜色字符串（超出 sRGB 色域会自动降低彩度）
    cssOklch(L, C, H, alpha) {
        const [r, g, b] = this.cssOklchRgb(L, C, H);
        return alpha === undefined || alpha >= 1
            ? `rgb(${r}, ${g}, ${b})`
            : `rgba(${r}, ${g}, ${b}, ${alpha})`;
    },

    cssOklchRgb(L, C, H) {
        const rad = H * Math.PI / 180;
        let c = C;
        for (let i = 0; i < 16; i++) {
            const rgb = this.oklabToRgb(L, c * Math.cos(rad), c * Math.sin(rad));
            if (Math.min(rgb[0], rgb[1], rgb[2]) >= -0.001 && Math.max(rgb[0], rgb[1], rgb[2]) <= 1.001) {
                return rgb.map(v => Math.round(Math.min(1, Math.max(0, v)) * 255));
            }
            c *= 0.95; // 越界就退一点彩度再试
        }
        return this.oklabToRgb(L, 0, 0).map(v => Math.round(Math.min(1, Math.max(0, v)) * 255));
    },

    // ===== 颜色空间转换（OKLab / OKLCH，Björn Ottosson 公式）=====
    hexToOklch(hex) {
        if (typeof hex !== 'string') return null;
        const h = hex.replace('#', '');
        const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
        if (full.length !== 6) return null;

        const num = parseInt(full, 16);
        if (isNaN(num)) return null;

        const lin = v => v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        const R = lin(((num >> 16) & 255) / 255);
        const G = lin(((num >> 8) & 255) / 255);
        const B = lin((num & 255) / 255);

        const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
        const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
        const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);

        const L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s;
        const A = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s;
        const B2 = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s;

        const C = Math.sqrt(A * A + B2 * B2);
        let H = Math.atan2(B2, A) * 180 / Math.PI;
        if (H < 0) H += 360;

        return { L, C, H };
    },

    oklabToRgb(L, a, b) {
        const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
        const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
        const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

        const l = l_ * l_ * l_;
        const m = m_ * m_ * m_;
        const s = s_ * s_ * s_;

        const R = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
        const G = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
        const B = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

        const srgb = v => v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
        return [srgb(R), srgb(G), srgb(B)];
    }
};
