// ============================================================
// js/features/m_prefs.js
// 音源分配：音频 / 歌词 / 封面 可以分别指定来源
// 例：音频用 B 站，歌词和封面用咪咕
// 配置存在本地伴生服务的 data/m/prefs.json，改完立即生效
// ============================================================

window.App = window.App || {};

(function () {
    'use strict';

    const LABEL = {
        auto: '自动',
        netease: '网易云',
        qq: 'QQ',
        kugou: '酷狗',
        kuwo: '酷我',
        migu: '咪咕',
        qianqian: '千千',
        soda: '汽水',
        bilibili: 'B站'
    };

    // 下拉里的顺序：auto 之后按「音质/曲库实用性」排
    const ORDER = [
        'auto', 'kugou', 'kuwo', 'qq', 'netease',
        'migu', 'soda', 'bilibili', 'qianqian'
    ];

    const P = {
        data: null,
        inited: false,
        saving: false
    };

    function $(id) {
        return document.getElementById(id);
    }

    async function api(path, options) {
        const base = await window.App.MOnline?.probe?.();
        if (!base) throw new Error('本地服务未启动');

        const res = await fetch(base + path, Object.assign({
            cache: 'no-store'
        }, options || {}));

        if (!res.ok) {
            let msg = 'HTTP ' + res.status;
            try {
                const j = await res.json();
                if (j && j.error) msg = j.error;
            } catch (e) { /* 忽略 */ }
            throw new Error(msg);
        }
        return res.json();
    }

    function setStatus(text) {
        const el = $('mPrefStatus');
        if (el) el.textContent = text || '';
    }

    function fillSelect(sel, value) {
        if (!sel) return;

        sel.innerHTML = ORDER.map(s => {
            const hint = s === 'auto' ? ' title="跟随音频源"' : '';
            return '<option value="' + s + '"' + hint +
                (s === value ? ' selected' : '') + '>' + LABEL[s] + '</option>';
        }).join('');
    }

    function render() {
        const p = P.data || { audio: 'auto', lyric: 'auto', cover: 'auto' };
        fillSelect($('mPrefAudio'), p.audio);
        fillSelect($('mPrefLyric'), p.lyric);
        fillSelect($('mPrefCover'), p.cover);
    }

    async function load() {
        try {
            const data = await api('/api/m/prefs');
            P.data = data.prefs || null;
            render();
            setStatus('');
        } catch (e) {
            const msg = String(e.message || e);
            setStatus(
                (msg.indexOf('not found') !== -1 || msg.indexOf('404') !== -1)
                    ? '本地服务版本过旧，请更新 m-server.exe'
                    : '读取失败：' + msg
            );
        }
    }

    async function save() {
        if (P.saving) return;
        P.saving = true;
        setStatus('保存中…');

        try {
            const body = {
                audio: $('mPrefAudio')?.value || 'auto',
                lyric: $('mPrefLyric')?.value || 'auto',
                cover: $('mPrefCover')?.value || 'auto'
            };

            const data = await api('/api/m/prefs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            P.data = data.prefs || body;
            render();
            setStatus('已保存，下次播放/下载生效');
        } catch (e) {
            setStatus('保存失败：' + (e.message || e));
        } finally {
            P.saving = false;
        }
    }

    function bindUI() {
        $('mPrefSave')?.addEventListener('click', save);
    }

    window.App.MPrefs = {
        LABEL,

        init() {
            if (P.inited) return;
            P.inited = true;
            bindUI();
        },

        open() {
            // 先铺静态选项，这样本地服务没起时下拉也不会是空的
            if (!P.data) render();
            load();
        },

        load,
        save,

        get data() {
            return P.data;
        },

        label(src) {
            return LABEL[src] || src || '自动';
        }
    };
})();
