// ============================================================
// js/features/palette.js
// 调色盘：把 :root 里的主题色变量改成用户自定义值，立即生效。
//
// 这些变量平时由 theme_background.js 按节气动态写入内联样式，
// 所以调色盘启用时由 ThemeBackground.update() 优先调用 Palette.apply()，
// 不再让节气配色覆盖用户的选择。
// ============================================================

window.App = window.App || {};

window.App.Palette = {
    COLORS: [
        { key: 'primary',       css: '--theme-primary',        label: '主色',     fallback: '#8bc34a' },
        { key: 'primaryHover',  css: '--theme-primary-hover',  label: '主色悬停', fallback: '#7cb342' },
        { key: 'primaryActive', css: '--theme-primary-active', label: '主色按下', fallback: '#689f38' },
        { key: 'dark',          css: '--theme-dark',           label: '深色标题', fallback: '#1b5e20' },
        { key: 'text',          css: '--theme-text',           label: '正文文字', fallback: '#2d2d2d' },
        { key: 'muted',         css: '--theme-muted',          label: '次要文字', fallback: '#666666' },
        { key: 'bgStart',       css: '--theme-bg-start',       label: '背景起点', fallback: '#f5fff5' },
        { key: 'bgEnd',         css: '--theme-bg-end',         label: '背景终点', fallback: '#e8f5e9' },
        { key: 'surfaceSolid',  css: '--theme-surface-solid',  label: '卡片背景', fallback: '#ffffff' },
        { key: 'surfaceSoft',   css: '--theme-surface-soft',   label: '浅色底块', fallback: '#f8f8f8' },
        { key: 'surfaceHover',  css: '--theme-surface-hover',  label: '悬停底块', fallback: '#e8f5e9' },
        { key: 'border',        css: '--theme-border',         label: '边框',     fallback: '#eeeeee' }
    ],

    get() {
        if (!window.App.Store) return null;
        const palette = window.App.Store.getSetting('palette');
        return palette && typeof palette === 'object' ? palette : null;
    },

    isActive() {
        return !!this.get();
    },

    defaults() {
        const out = {};
        this.COLORS.forEach(color => { out[color.key] = color.fallback; });
        return out;
    },

    // 把用户配色写进 <html> 的内联样式
    apply() {
        const palette = this.get();
        if (!palette) return false;

        const style = document.documentElement.style;

        this.COLORS.forEach(color => {
            const value = this.normalizeHex(palette[color.key]) || color.fallback;
            style.setProperty(color.css, value);
        });

        const rgb = this.hexToRgb(palette.primary || '#8bc34a');
        if (rgb) style.setProperty('--theme-primary-rgb', rgb.join(', '));

        style.setProperty(
            '--theme-surface',
            this.rgba(palette.surfaceSolid || '#ffffff', 0.9)
        );

        return true;
    },

    save(palette) {
        if (!window.App.Store) return;
        window.App.Store.setSetting('palette', palette);
        this.apply();
    },

    reset() {
        if (window.App.Store) window.App.Store.setSetting('palette', null);
        // 让 ThemeBackground 重新按节气渐变 / 默认值写回变量
        window.App.ThemeBackground?.update();
    },

    normalizeHex(value) {
        if (typeof value !== 'string') return null;
        let hex = value.trim();
        if (!/^#?[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(hex)) return null;
        if (hex[0] !== '#') hex = '#' + hex;
        if (hex.length === 4) {
            hex = '#' + hex.slice(1).split('').map(ch => ch + ch).join('');
        }
        return hex.toLowerCase();
    },

    hexToRgb(value) {
        const hex = this.normalizeHex(value);
        if (!hex) return null;
        const num = parseInt(hex.slice(1), 16);
        return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
    },

    rgba(value, alpha) {
        const rgb = this.hexToRgb(value);
        if (!rgb) return 'rgba(255, 255, 255, ' + alpha + ')';
        return `rgba(${rgb.join(', ')}, ${alpha})`;
    }
};

window.App.ModalPalette = {
    init() {
        document.getElementById('openPaletteModal')?.addEventListener('click', () => {
            this.populate();
            document.getElementById('paletteModal')?.classList.add('active');
        });

        document.getElementById('closePalette')?.addEventListener('click', () => {
            document.getElementById('paletteModal')?.classList.remove('active');
        });

        document.getElementById('paletteReset')?.addEventListener('click', () => {
            window.App.Palette.reset();
            this.populate();
            this.status('已恢复默认配色');
        });
    },

    populate() {
        const container = document.getElementById('paletteGrid');
        if (!container) return;

        const palette = window.App.Palette.get() || window.App.Palette.defaults();
        container.innerHTML = '';

        const fragment = document.createDocumentFragment();

        window.App.Palette.COLORS.forEach(color => {
            const value = window.App.Palette.normalizeHex(palette[color.key]) || color.fallback;

            const row = document.createElement('label');
            row.className = 'palette-row';

            const swatch = document.createElement('input');
            swatch.type = 'color';
            swatch.className = 'palette-swatch';
            swatch.value = value;
            swatch.setAttribute('aria-label', color.label);

            const info = document.createElement('span');
            info.className = 'palette-info';

            const label = document.createElement('span');
            label.className = 'palette-label';
            label.textContent = color.label;

            const hex = document.createElement('span');
            hex.className = 'palette-hex';
            hex.textContent = value;

            info.appendChild(label);
            info.appendChild(hex);
            row.appendChild(swatch);
            row.appendChild(info);

            swatch.addEventListener('input', e => {
                const next = window.App.Palette.get() || window.App.Palette.defaults();
                const normalized = window.App.Palette.normalizeHex(e.target.value) || color.fallback;
                next[color.key] = normalized;
                window.App.Palette.save(next);
                hex.textContent = normalized;
                this.status('已应用');
            });

            fragment.appendChild(row);
        });

        container.appendChild(fragment);
    },

    status(text) {
        const el = document.getElementById('paletteStatus');
        if (!el) return;
        el.textContent = text;
        clearTimeout(this._statusTimer);
        this._statusTimer = setTimeout(() => { el.textContent = ''; }, 2500);
    }
};
