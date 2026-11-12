// ============================================================
// js/features/palette.js
// 主题设置：预设主题 + 多套自定义主题 + 两种调色模式。
//
//   完整配色：分别调整主色、文字、背景、卡片、边框等变量
//   单色主题：只选一个主题色，其余颜色按节气配色的同一套公式生成
//
// 变量平时由 theme_background.js 按节气动态写入内联样式，
// 所以主题设置启用时由 ThemeBackground.update() 优先调用 Palette.apply()，
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

    DEFAULT_THEME_COLOR: '#8bc34a',

    // 一键切换的预设主题（单色主题，用节气同款公式生成整套颜色）
    PRESETS: [
        { id: 'fresh-green', name: '清风绿', color: '#8bc34a' },
        { id: 'sky-blue',    name: '天空蓝', color: '#4a90d9' },
        { id: 'sakura-pink', name: '樱花粉', color: '#e57399' },
        { id: 'sunset',      name: '暖阳橙', color: '#f5a623' },
        { id: 'quiet-violet',name: '静谧紫', color: '#7e57c2' },
        { id: 'sea-teal',    name: '海盐青', color: '#26a69a' },
        { id: 'graphite',    name: '石墨灰', color: '#607d8b' },
        { id: 'rose-red',    name: '玫瑰红', color: '#d9534f' }
    ],

    // ---------- 数据 ----------

    getSchemes() {
        const store = window.App.Store;
        const list = store ? store.getSetting('paletteSchemes') : null;
        return Array.isArray(list)
            ? list.filter(item => item && typeof item === 'object' && item.id)
            : [];
    },

    setSchemes(list) {
        if (window.App.Store) {
            window.App.Store.setSetting('paletteSchemes', Array.isArray(list) ? list : []);
        }
    },

    getActiveId() {
        return (window.App.Store && window.App.Store.getSetting('activePaletteSchemeId')) || '';
    },

    setActiveId(id) {
        if (window.App.Store) {
            window.App.Store.setSetting('activePaletteSchemeId', String(id || ''));
        }
    },

    getActiveScheme() {
        const list = this.getSchemes();
        const id = this.getActiveId();
        return list.find(item => item.id === id) || list[0] || null;
    },

    getMode() {
        const scheme = this.getActiveScheme();
        return scheme && scheme.mode === 'theme' ? 'theme' : 'full';
    },

    get() {
        const scheme = this.getActiveScheme();
        return scheme && scheme.mode !== 'theme' ? (scheme.colors || {}) : null;
    },

    getThemeColor() {
        const scheme = this.getActiveScheme();
        return this.normalizeHex(scheme && scheme.themeColor) || this.DEFAULT_THEME_COLOR;
    },

    isEnabled() {
        return !!(window.App.Store && window.App.Store.getSetting('paletteEnabled') === true);
    },

    isActive() {
        return this.isEnabled();
    },

    // ---------- 初始化 / 迁移 ----------

    init() {
        this.migrate();

        if (this.isEnabled()) {
            this.ensureScheme();
            this.apply();
        }
    },

    migrate() {
        const store = window.App.Store;
        if (!store) return;

        let schemes = this.getSchemes();

        if (!schemes.length) {
            const oldPalette = store.getSetting('palette');
            const oldMode = store.getSetting('paletteMode');
            const oldThemeColor = store.getSetting('paletteThemeColor');

            if (oldPalette && typeof oldPalette === 'object') {
                const scheme = this.makeScheme('我的主题', 'full', oldPalette, oldThemeColor, true);
                this.setSchemes([scheme]);
                this.setActiveId(scheme.id);
                // 旧版没有启用开关：存在自定义配色就视为启用，避免升级后突然回到绿色
                store.setSetting('paletteEnabled', true);
                schemes = [scheme];
            } else if (oldMode === 'theme' && this.normalizeHex(oldThemeColor)) {
                const scheme = this.makeScheme('我的主题', 'theme', null, oldThemeColor, false, true);
                this.setSchemes([scheme]);
                this.setActiveId(scheme.id);
                store.setSetting('paletteEnabled', true);
                schemes = [scheme];
            }
        }

        if (schemes.length && !schemes.some(item => item.id === this.getActiveId())) {
            this.setActiveId(schemes[0].id);
        }
    },

    // 没有方案时用「当前页面上实际应用的颜色」建一套，而不是 CSS 里的默认绿色
    ensureScheme() {
        let scheme = this.getActiveScheme();

        if (!scheme) {
            scheme = this.makeScheme(
                '我的主题',
                'full',
                this.captureCurrentColors(),
                this.captureCurrentPrimary()
            );
            this.setSchemes([scheme]);
            this.setActiveId(scheme.id);
            return scheme;
        }

        if (!this.getActiveId()) this.setActiveId(scheme.id);
        return scheme;
    },

    makeScheme(name, mode, colors, themeColor, colorsCustomized, themeCustomized) {
        return {
            id: 'ps_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7),
            name: String(name || '主题').slice(0, 20),
            mode: mode === 'theme' ? 'theme' : 'full',
            colors: this.normalizeColors(colors),
            themeColor: this.normalizeHex(themeColor) || this.DEFAULT_THEME_COLOR,
            colorsCustomized: !!colorsCustomized,
            themeCustomized: !!themeCustomized
        };
    },

    normalizeColors(colors) {
        // 缺的字段用当前实际颜色补，避免又退回 CSS 里的绿色
        const out = this.captureCurrentColors();

        if (colors && typeof colors === 'object') {
            this.COLORS.forEach(color => {
                const value = this.normalizeHex(colors[color.key]);
                if (value) out[color.key] = value;
            });
        }
        return out;
    },

    defaultColors() {
        const out = {};
        this.COLORS.forEach(color => { out[color.key] = color.fallback; });
        return out;
    },

    captureCurrentColors() {
        const out = this.defaultColors();

        if (typeof getComputedStyle !== 'function') return out;

        const style = getComputedStyle(document.documentElement);
        this.COLORS.forEach(color => {
            const value = this.cssColorToHex(style.getPropertyValue(color.css));
            if (value) out[color.key] = value;
        });
        return out;
    },

    captureCurrentPrimary() {
        if (typeof getComputedStyle !== 'function') return this.DEFAULT_THEME_COLOR;

        const style = getComputedStyle(document.documentElement);
        return this.cssColorToHex(style.getPropertyValue('--theme-primary')) ||
               this.DEFAULT_THEME_COLOR;
    },

    // ---------- 修改方案 ----------

    updateScheme(scheme, options) {
        if (!scheme) return;

        const list = this.getSchemes();
        const index = list.findIndex(item => item.id === scheme.id);

        if (index === -1) list.push(scheme);
        else list[index] = scheme;

        this.setSchemes(list);
        this.setActiveId(scheme.id);

        if (this.isEnabled() && !(options && options.skipApply)) this.apply();
    },

    setEnabled(enabled) {
        if (window.App.Store) {
            window.App.Store.setSetting('paletteEnabled', !!enabled);
        }

        if (enabled) {
            this.ensureScheme();
            this.apply();
        } else {
            window.App.ThemeBackground?.update();
        }
    },

    setMode(mode) {
        const scheme = this.ensureScheme();
        const nextMode = mode === 'theme' ? 'theme' : 'full';

        // 从单色主题切回完整配色时，默认色取当前实际应用的颜色
        if (nextMode === 'full' && !scheme.colorsCustomized) {
            scheme.colors = this.captureCurrentColors();
        }
        if (nextMode === 'theme' && !scheme.themeCustomized) {
            scheme.themeColor = this.captureCurrentPrimary();
        }

        scheme.mode = nextMode;
        this.updateScheme(scheme);
        return scheme;
    },

    setColor(key, value) {
        const scheme = this.ensureScheme();
        const normalized = this.normalizeHex(value);
        if (!normalized) return;

        // 只更新一个颜色。不要在这里调用 normalizeColors / getComputedStyle，
        // 否则取色器每移动一次都会把全部 12 个变量重新读一遍，非常卡。
        const colors = Object.assign({}, this.defaultColors(), scheme.colors || {});
        colors[key] = normalized;
        scheme.colors = colors;
        scheme.colorsCustomized = true;

        this.updateScheme(scheme, { skipApply: true });

        if (this.isEnabled()) this.applyColor(key, normalized);
    },

    setThemeColor(value) {
        const scheme = this.ensureScheme();
        const normalized = this.normalizeHex(value);
        if (!normalized) return;

        scheme.themeColor = normalized;
        scheme.themeCustomized = true;
        this.updateScheme(scheme, { skipApply: true });

        if (this.isEnabled()) this.apply();
    },

    // 完整配色模式下只写当前改动的 CSS 变量，避免拖色时重算整套主题
    applyColor(key, value) {
        if (!this.isEnabled()) return false;

        const color = this.COLORS.find(item => item.key === key);
        const normalized = this.normalizeHex(value);
        if (!color || !normalized) return false;

        const style = document.documentElement.style;
        style.setProperty(color.css, normalized);

        if (key === 'primary') {
            const rgb = this.hexToRgb(normalized);
            if (rgb) style.setProperty('--theme-primary-rgb', rgb.join(', '));
        }
        if (key === 'surfaceSolid') {
            style.setProperty('--theme-surface', this.rgba(normalized, 0.9));
        }

        return true;
    },

    // 一键应用预设主题：同名预设复用已有方案，编辑过也会重置回预设色
    usePreset(preset) {
        if (!preset || !preset.id) return null;

        const list = this.getSchemes();
        let scheme = list.find(item => item.presetId === preset.id);

        if (!scheme) {
            scheme = this.makeScheme(
                preset.name,
                'theme',
                null,
                preset.color,
                false,
                false
            );
            scheme.presetId = preset.id;
            list.push(scheme);
            this.setSchemes(list);
        } else {
            scheme.mode = 'theme';
            scheme.themeColor = preset.color;
            scheme.themeCustomized = false;
            scheme.name = preset.name;
            this.setSchemes(list);
        }

        this.setActiveId(scheme.id);

        if (window.App.Store) {
            window.App.Store.setSetting('paletteEnabled', true);
        }

        this.apply();
        return scheme;
    },

    selectScheme(id) {
        const scheme = this.getSchemes().find(item => item.id === id);
        if (!scheme) return null;

        this.setActiveId(id);
        if (this.isEnabled()) this.apply();
        return scheme;
    },

    createScheme(name) {
        const current = this.getActiveScheme();
        const scheme = this.makeScheme(
            name || '新主题',
            current ? current.mode : 'full',
            current ? current.colors : this.captureCurrentColors(),
            current ? current.themeColor : this.captureCurrentPrimary(),
            current ? current.colorsCustomized : false,
            current ? current.themeCustomized : false
        );

        const list = this.getSchemes();
        list.push(scheme);
        this.setSchemes(list);
        this.setActiveId(scheme.id);

        if (this.isEnabled()) this.apply();
        return scheme;
    },

    renameScheme(id, name) {
        const list = this.getSchemes();
        const scheme = list.find(item => item.id === id);
        if (!scheme) return false;

        const nextName = String(name || '').trim().slice(0, 20);
        if (!nextName) return false;

        scheme.name = nextName;
        this.setSchemes(list);
        return true;
    },

    deleteScheme(id) {
        const list = this.getSchemes();
        if (list.length <= 1) return false;

        const next = list.filter(item => item.id !== id);
        this.setSchemes(next);

        if (this.getActiveId() === id) {
            this.setActiveId(next[0].id);
            if (this.isEnabled()) this.apply();
        }
        return true;
    },

    // ---------- 应用 ----------

    apply() {
        if (!this.isEnabled()) return false;

        const scheme = this.ensureScheme();
        if (!scheme) return false;

        if (scheme.mode === 'theme') {
            const theme = window.App.ThemeBackground;
            const base = theme && theme.hexToOklch(scheme.themeColor);
            if (base) {
                theme.applyTheme(base);
                return true;
            }
        }

        return this.applyColors(scheme.colors || this.defaultColors());
    },

    applyColors(colors) {
        const style = document.documentElement.style;

        this.COLORS.forEach(color => {
            const value = this.normalizeHex(colors[color.key]) || color.fallback;
            style.setProperty(color.css, value);
        });

        const rgb = this.hexToRgb(colors.primary || this.DEFAULT_THEME_COLOR);
        if (rgb) style.setProperty('--theme-primary-rgb', rgb.join(', '));

        style.setProperty(
            '--theme-surface',
            this.rgba(colors.surfaceSolid || '#ffffff', 0.9)
        );

        return true;
    },

    // ---------- 颜色工具 ----------

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

    cssColorToHex(value) {
        if (typeof value !== 'string') return null;

        const text = value.trim();
        if (!text) return null;

        const hex = this.normalizeHex(text);
        if (hex) return hex;

        const match = text.match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i);
        if (!match) return null;

        const toHex = number => {
            const n = Math.max(0, Math.min(255, Math.round(Number(number))));
            return n.toString(16).padStart(2, '0');
        };

        return '#' + toHex(match[1]) + toHex(match[2]) + toHex(match[3]);
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
    _previewing: false,
    _previewTimer: null,
    _previewDismissBound: false,

    init() {
        this.bindControls();
    },

    // 设置页切到「主题设置」时调用
    onShow() {
        this.setPreviewing(false);
        window.App.Palette.ensureScheme();
        this.refreshUI();
        this.populate();
        window.App.ThemeWallpaperUI?.refresh?.();
    },

    bindControls() {
        document.getElementById('paletteEnabledSwitch')?.addEventListener('change', e => {
            window.App.Palette.setEnabled(e.target.checked);
            this.refreshUI();
            this.status(e.target.checked ? '已启用自定义主题' : '已恢复原本配色');
        });

        document.getElementById('paletteSchemeNew')?.addEventListener('click', () => {
            const count = window.App.Palette.getSchemes().length + 1;
            const name = prompt('新建主题名称', '新主题 ' + count);
            if (name === null) return;

            window.App.Palette.createScheme(name.trim() || ('新主题 ' + count));
            this.refreshUI();
            this.populate();
            this.status('已新建主题');
        });

        document.getElementById('paletteSchemeRename')?.addEventListener('click', () => {
            const scheme = window.App.Palette.getActiveScheme();
            if (!scheme) return;

            const name = prompt('重命名主题', scheme.name);
            if (name === null) return;

            if (window.App.Palette.renameScheme(scheme.id, name)) {
                this.refreshUI();
                this.status('已重命名');
            }
        });

        document.getElementById('paletteSchemeDelete')?.addEventListener('click', () => {
            const scheme = window.App.Palette.getActiveScheme();
            if (!scheme) return;

            if (window.App.Palette.getSchemes().length <= 1) {
                this.status('至少保留一个主题');
                return;
            }
            if (!confirm(`删除主题「${scheme.name}」？`)) return;

            window.App.Palette.deleteScheme(scheme.id);
            this.refreshUI();
            this.populate();
            this.status('已删除主题');
        });

        document.querySelectorAll('.palette-mode-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                window.App.Palette.setMode(tab.dataset.mode);
                this.refreshUI();
                this.populate();
            });
        });

        const themeInput = document.getElementById('paletteThemeColor');
        let themeRaf = null;
        let themeValue = themeInput ? themeInput.value : '';

        themeInput?.addEventListener('input', e => {
            if (!this._previewing) this.setPreviewing(true);
            themeValue = e.target.value;

            if (themeRaf) return;
            themeRaf = requestAnimationFrame(() => {
                themeRaf = null;
                window.App.Palette.setThemeColor(themeValue);
                this.syncThemeHex();
            });
        });

        themeInput?.addEventListener('change', () => {
            this.setPreviewing(false);
            this.status('已应用');
        });
    },

    renderPresets() {
        const grid = document.getElementById('themePresetGrid');
        if (!grid) return;

        const active = window.App.Palette.getActiveScheme();
        grid.innerHTML = '';

        window.App.Palette.PRESETS.forEach(preset => {
            const card = document.createElement('button');
            card.type = 'button';
            card.className = 'theme-preset-card' +
                (active && active.presetId === preset.id ? ' active' : '');
            card.style.setProperty('--preset-color', preset.color);

            const swatch = document.createElement('span');
            swatch.className = 'theme-preset-swatch';

            const name = document.createElement('span');
            name.className = 'theme-preset-name';
            name.textContent = preset.name;

            card.appendChild(swatch);
            card.appendChild(name);

            card.addEventListener('click', () => {
                window.App.Palette.usePreset(preset);
                this.refreshUI();
                this.populate();
                this.status(`已应用预设：${preset.name}`);
            });

            grid.appendChild(card);
        });
    },

    renderSchemeList(scheme) {
        const list = document.getElementById('themeSchemeList');
        if (!list) return;

        const schemes = window.App.Palette.getSchemes();
        list.innerHTML = '';

        schemes.forEach(item => {
            const primary = item.mode === 'theme'
                ? (window.App.Palette.normalizeHex(item.themeColor) || '#8bc34a')
                : (window.App.Palette.normalizeHex(item.colors && item.colors.primary) || '#8bc34a');
            const bg = item.mode === 'theme'
                ? '#f5fff5'
                : (window.App.Palette.normalizeHex(item.colors && item.colors.bgStart) || '#f5fff5');

            const card = document.createElement('button');
            card.type = 'button';
            card.className = 'theme-scheme-card' + (item.id === scheme.id ? ' active' : '');

            const swatch = document.createElement('span');
            swatch.className = 'theme-scheme-swatch';
            swatch.style.background = `linear-gradient(135deg, ${primary}, ${bg})`;

            const name = document.createElement('span');
            name.className = 'theme-scheme-name';
            name.textContent = item.name;

            const mode = document.createElement('span');
            mode.className = 'theme-scheme-mode';
            mode.textContent = item.mode === 'theme' ? '单色' : '完整';

            card.appendChild(swatch);
            card.appendChild(name);
            card.appendChild(mode);

            card.addEventListener('click', () => {
                window.App.Palette.selectScheme(item.id);
                this.refreshUI();
                this.populate();
            });

            list.appendChild(card);
        });
    },

    refreshUI() {
        const scheme = window.App.Palette.ensureScheme();
        if (!scheme) return;

        const schemes = window.App.Palette.getSchemes();
        const enabled = window.App.Palette.isEnabled();
        const mode = window.App.Palette.getMode();

        const enabledSwitch = document.getElementById('paletteEnabledSwitch');
        if (enabledSwitch) enabledSwitch.checked = enabled;

        const deleteBtn = document.getElementById('paletteSchemeDelete');
        if (deleteBtn) deleteBtn.disabled = schemes.length <= 1;

        this.renderPresets();
        this.renderSchemeList(scheme);

        const currentName = document.getElementById('themeCurrentName');
        if (currentName) currentName.textContent = scheme.name;

        document.querySelectorAll('.palette-mode-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.mode === mode);
        });

        document.querySelectorAll('.palette-mode-panel').forEach(panel => {
            panel.hidden = panel.dataset.modePanel !== mode;
        });

        const themeInput = document.getElementById('paletteThemeColor');
        if (themeInput) themeInput.value = window.App.Palette.getThemeColor();

        this.syncThemeHex();
    },

    syncThemeHex() {
        const hex = document.getElementById('paletteThemeHex');
        if (hex) hex.textContent = window.App.Palette.getThemeColor();
    },

    // 取色时把所有模态框一起淡出（和虚拟时间滑动条同一套做法），
    // 这样能直接看到页面上的真实配色，而不是被设置面板挡住。
    setPreviewing(on) {
        if (this._previewing === !!on) return;

        this._previewing = !!on;

        document.querySelectorAll('.settings-modal').forEach(modal => {
            modal.classList.toggle('previewing', this._previewing);
        });

        clearTimeout(this._previewTimer);

        if (!this._previewing) return;

        // 兜底：万一取色器没有触发 change，最多 60 秒后恢复面板
        this._previewTimer = setTimeout(() => this.setPreviewing(false), 60000);
        this.bindPreviewDismiss();
    },

    bindPreviewDismiss() {
        if (this._previewDismissBound) return;
        this._previewDismissBound = true;

        const dismiss = () => {
            if (this._previewing) this.setPreviewing(false);
        };

        // 取色器关闭后，用户在页面上的下一次点击/按键即可恢复面板
        window.addEventListener('pointerdown', dismiss, true);
        window.addEventListener('keydown', event => {
            if (event.key === 'Escape') dismiss();
        });
    },

    populate() {
        const container = document.getElementById('paletteGrid');
        if (!container) return;

        const scheme = window.App.Palette.ensureScheme();
        const colors = (scheme && scheme.colors) || window.App.Palette.defaultColors();

        container.innerHTML = '';

        const fragment = document.createDocumentFragment();

        window.App.Palette.COLORS.forEach(color => {
            const value = window.App.Palette.normalizeHex(colors[color.key]) || color.fallback;

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
                // 第一次移动颜色就淡出面板，让页面实时可见
                if (!this._previewing) this.setPreviewing(true);

                window.App.Palette.setColor(color.key, e.target.value);
                const normalized = window.App.Palette.normalizeHex(e.target.value) || color.fallback;
                hex.textContent = normalized;
            });

            // 取色器关闭 / 确认颜色后恢复面板
            swatch.addEventListener('change', () => {
                this.setPreviewing(false);
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
