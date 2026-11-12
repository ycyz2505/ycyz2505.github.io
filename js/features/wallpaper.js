// ============================================================
// js/features/wallpaper.js
// 背景壁纸：内置节气图 + 本地上传（自动压缩成 1920×1080 以内的 JPEG）
//
// 壁纸只改 body 的背景，不覆盖卡片 / 模态框的主题色；
// 另有一层可调的白色遮罩，保证浅色卡片和文字仍然清楚。
// ============================================================

window.App = window.App || {};

window.App.ThemeWallpaper = {
    DEFAULTS: {
        version: 1,
        enabled: false,
        image: '',
        dim: 35,
        name: ''
    },

    PRESETS: [
        { path: 'images/立春.webp', name: '立春' },
        { path: 'images/雨水.webp', name: '雨水' },
        { path: 'images/惊蛰.webp', name: '惊蛰' },
        { path: 'images/春分.webp', name: '春分' },
        { path: 'images/清明.webp', name: '清明' },
        { path: 'images/谷雨.webp', name: '谷雨' },
        { path: 'images/立夏.webp', name: '立夏' },
        { path: 'images/小满.webp', name: '小满' },
        { path: 'images/芒种.webp', name: '芒种' }
    ],

    get() {
        const data = window.App.Store
            ? window.App.Store.get('themeWallpaper')
            : null;

        return Object.assign({}, this.DEFAULTS,
            data && typeof data === 'object' ? data : {});
    },

    save(data) {
        if (window.App.Store) {
            window.App.Store.set('themeWallpaper', data);
        }
    },

    init() {
        this.apply();
    },

    apply() {
        if (!document.body) return;

        const data = this.get();
        const style = document.body.style;

        if (data.enabled && data.image) {
            const dim = Math.max(0, Math.min(80, Number(data.dim) || 0)) / 100;

            style.backgroundImage =
                `linear-gradient(rgba(255,255,255,${dim}), rgba(255,255,255,${dim})), ` +
                `url("${data.image}")`;
            style.backgroundSize = 'cover';
            style.backgroundPosition = 'center';
            style.backgroundAttachment = 'fixed';
            style.backgroundRepeat = 'no-repeat';
            return;
        }

        [
            'background-image',
            'background-size',
            'background-position',
            'background-attachment',
            'background-repeat'
        ].forEach(name => style.removeProperty(name));
    },

    setEnabled(on) {
        const data = this.get();
        data.enabled = !!on;
        this.save(data);
        this.apply();
        return data;
    },

    setDim(value) {
        const data = this.get();
        data.dim = Math.max(0, Math.min(80, Number(value) || 0));
        this.save(data);
        this.apply();
        return data;
    },

    setImage(image, name) {
        const data = this.get();
        data.image = String(image || '');
        data.name = String(name || '');
        data.enabled = !!data.image;
        this.save(data);
        this.apply();
        return data;
    },

    clear() {
        const data = this.get();
        data.enabled = false;
        data.image = '';
        data.name = '';
        this.save(data);
        this.apply();
        return data;
    },

    async loadFile(file) {
        if (!file || !/^image\//.test(file.type || '')) {
            throw new Error('请选择图片文件');
        }

        const dataUrl = await this.resize(file);
        if (!dataUrl) throw new Error('图片读取失败');

        this.setImage(dataUrl, file.name || '上传图片');
        return dataUrl;
    },

    resize(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onerror = () => reject(new Error('图片读取失败'));
            reader.onload = () => {
                const img = new Image();

                img.onerror = () => reject(new Error('图片无法解码'));
                img.onload = () => {
                    const naturalW = img.naturalWidth || img.width || 1920;
                    const naturalH = img.naturalHeight || img.height || 1080;
                    const maxW = 1920;
                    const maxH = 1080;
                    const scale = Math.min(1, maxW / naturalW, maxH / naturalH);
                    const width = Math.max(1, Math.round(naturalW * scale));
                    const height = Math.max(1, Math.round(naturalH * scale));

                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        reject(new Error('浏览器不支持图片处理'));
                        return;
                    }

                    // 透明图片铺白底，避免存成 JPEG 后发黑
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, width, height);
                    ctx.drawImage(img, 0, 0, width, height);

                    resolve(canvas.toDataURL('image/jpeg', 0.85));
                };

                img.src = reader.result;
            };

            reader.readAsDataURL(file);
        });
    }
};

window.App.ThemeWallpaperUI = {
    _built: false,

    init() {
        this.bind();
        this.buildPresets();
        this.refresh();
    },

    bind() {
        document.getElementById('wallpaperEnabledSwitch')?.addEventListener('change', e => {
            window.App.ThemeWallpaper.setEnabled(e.target.checked);
            this.refresh();
        });

        document.getElementById('wallpaperUploadBtn')?.addEventListener('click', () => {
            document.getElementById('wallpaperFile')?.click();
        });

        document.getElementById('wallpaperFile')?.addEventListener('change', async e => {
            const file = e.target.files && e.target.files[0];
            if (!file) return;

            try {
                await window.App.ThemeWallpaper.loadFile(file);
                this.refresh();
                window.App.ModalPalette?.status?.('壁纸已应用');
            } catch (err) {
                window.App.ModalPalette?.status?.(err.message || '壁纸加载失败');
            } finally {
                e.target.value = '';
            }
        });

        document.getElementById('wallpaperClearBtn')?.addEventListener('click', () => {
            window.App.ThemeWallpaper.clear();
            this.refresh();
            window.App.ModalPalette?.status?.('壁纸已清除');
        });

        document.getElementById('wallpaperDim')?.addEventListener('input', e => {
            window.App.ThemeWallpaper.setDim(e.target.value);
            this.syncDim();
        });
    },

    buildPresets() {
        const grid = document.getElementById('wallpaperPresetGrid');
        if (!grid || this._built) return;
        this._built = true;

        window.App.ThemeWallpaper.PRESETS.forEach(preset => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'wallpaper-preset';
            btn.dataset.path = preset.path;
            btn.title = preset.name;

            const img = document.createElement('img');
            img.src = preset.path;
            img.alt = preset.name;
            img.loading = 'lazy';

            const label = document.createElement('span');
            label.className = 'wallpaper-preset-name';
            label.textContent = preset.name;

            btn.appendChild(img);
            btn.appendChild(label);

            btn.addEventListener('click', () => {
                window.App.ThemeWallpaper.setImage(preset.path, preset.name);
                this.refresh();
                window.App.ModalPalette?.status?.(`已应用壁纸：${preset.name}`);
            });

            grid.appendChild(btn);
        });
    },

    refresh() {
        const data = window.App.ThemeWallpaper.get();

        const enabled = document.getElementById('wallpaperEnabledSwitch');
        if (enabled) enabled.checked = !!data.enabled;

        const dim = document.getElementById('wallpaperDim');
        if (dim) dim.value = data.dim;

        this.syncDim();

        const preview = document.getElementById('wallpaperPreview');
        if (preview) {
            preview.innerHTML = '';

            if (data.image) {
                const img = document.createElement('img');
                img.src = data.image;
                img.alt = '背景壁纸预览';
                preview.appendChild(img);
            } else {
                preview.textContent = '未选择壁纸';
            }
        }

        document.querySelectorAll('.wallpaper-preset').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.path === data.image);
        });
    },

    syncDim() {
        const data = window.App.ThemeWallpaper.get();
        const value = document.getElementById('wallpaperDimValue');
        if (value) value.textContent = Math.round(data.dim) + '%';
    }
};
