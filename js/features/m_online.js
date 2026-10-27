// ============================================================
// js/features/m_online.js
// 在线搜索：与本地伴生服务（127.0.0.1:17650~17659）通信
// - 探测端口、多源搜索、解析播放、歌词与封面代理
// - 播放队列交给 m_player.js 的 playOnline()
// - 所有音频/封面/歌词都只在内存里中转，不落盘
// ============================================================

window.App = window.App || {};

(function () {
    'use strict';

    const PORTS = [
        17650, 17651, 17652, 17653, 17654,
        17655, 17656, 17657, 17658, 17659
    ];

    const LABEL = {
        netease: '网易云',
        qq: 'QQ',
        kugou: '酷狗',
        kuwo: '酷我',
        migu: '咪咕',
        qianqian: '千千',
        soda: '汽水',
        bilibili: 'B站'
    };

    const DEFAULT_SOURCES = ['netease', 'qq', 'kugou', 'kuwo', 'qianqian'];
    const OPTIONAL_SOURCES = ['migu', 'qianqian', 'soda', 'bilibili'];

    const M = {
        base: null,
        probing: null,
        probingAt: 0,
        picked: new Set(DEFAULT_SOURCES),
        results: [],
        searching: false,
        inited: false,
        status: ''
    };

    function $(id) {
        return document.getElementById(id);
    }

    function esc(v) {
        return window.App.Utils?.escapeHtml
            ? window.App.Utils.escapeHtml(v)
            : String(v == null ? '' : v);
    }

    function fmtTime(sec) {
        const s = Math.max(0, Math.floor(Number(sec) || 0));
        return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
    }

    // ---------------- 端口探测 ----------------

    function probeOne(port) {
        return new Promise(resolve => {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 700);

            fetch('http://127.0.0.1:' + port + '/api/m/ping', {
                signal: controller.signal,
                cache: 'no-store'
            })
                .then(res => (res.ok ? res.json() : null))
                .then(data => {
                    clearTimeout(timer);
                    if (data && data.service === 'class-m-online') {
                        resolve({ base: 'http://127.0.0.1:' + port, info: data });
                    } else {
                        resolve(null);
                    }
                })
                .catch(() => {
                    clearTimeout(timer);
                    resolve(null);
                });
        });
    }

    function probe(force) {
        if (!force && M.base) return Promise.resolve(M.base);
        if (M.probing) return M.probing;

        if (!force && Date.now() - M.probingAt < 4000) {
            return Promise.resolve(null);
        }
        M.probingAt = Date.now();

        M.probing = (async () => {
            for (const port of PORTS) {
                const hit = await probeOne(port);
                if (hit) {
                    M.base = hit.base;
                    M.info = hit.info;
                    if (Array.isArray(hit.info.sources) && hit.info.sources.length) {
                        hit.info.sources.forEach(s => M.picked.add(s));
                    }
                    return M.base;
                }
            }
            M.base = null;
            return null;
        })().finally(() => {
            M.probing = null;
        });

        return M.probing;
    }

    async function api(path, options) {
        const base = await probe();
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
        return res;
    }

    // ---------------- 数据转换 ----------------

    function toQueue(raw) {
        return {
            kind: 'm',
            source: raw.source,
            id: raw.id,
            name: raw.name,
            artist: raw.artist || '',
            album: raw.album || '',
            duration: Number(raw.duration) || 0,
            cover: raw.cover || '',
            extra: raw.extra || null,
            title: raw.name,
            sub: [raw.artist, LABEL[raw.source] || raw.source]
                .filter(Boolean).join(' · '),
            sid: '',
            ext: raw.ext || '',
            quality: null,
            warnings: []
        };
    }

    function coverUrl(song) {
        if (!song || !song.cover || !M.base) return '';
        return M.base + '/api/m/cover?url=' +
            encodeURIComponent(song.cover) +
            '&source=' + encodeURIComponent(song.source || '');
    }

    function streamUrl(sid) {
        if (!M.base || !sid) return '';
        return M.base + '/api/m/stream?sid=' + encodeURIComponent(sid);
    }

    function songQuery(song) {
        const p = new URLSearchParams();
        p.set('id', song.id || '');
        p.set('source', song.source || '');
        p.set('name', song.name || song.title || '');
        p.set('artist', song.artist || '');
        p.set('album', song.album || '');
        p.set('duration', String(song.duration || 0));
        if (song.cover) p.set('cover', song.cover);
        if (song.ext) p.set('ext', song.ext);
        if (song.extra) {
            try { p.set('extra', JSON.stringify(song.extra)); } catch (e) { /* 忽略 */ }
        }
        return p.toString();
    }

    // ---------------- 对外接口 ----------------

    async function search(keyword) {
        const q = String(keyword || '').trim();
        if (!q) return { ok: false, songs: [], error: '请输入关键词' };

        const sources = Array.from(M.picked);
        if (!sources.length) return { ok: false, songs: [], error: '至少选择一个音源' };

        const res = await api('/api/m/search?q=' + encodeURIComponent(q) +
            '&sources=' + encodeURIComponent(sources.join(',')) +
            '&limit=12');

        const data = await res.json();
        return {
            ok: !!data.ok,
            songs: Array.isArray(data.songs) ? data.songs : [],
            groups: Array.isArray(data.groups) ? data.groups : [],
            errors: Array.isArray(data.errors) ? data.errors : []
        };
    }

    async function resolve(song) {
        const res = await api('/api/m/resolve?' + songQuery(song));
        return res.json();
    }

    async function lyricText(song) {
        try {
            const res = await api('/api/m/lyric?' + songQuery(song));
            return await res.text();
        } catch (e) {
            return '';
        }
    }

    // ---------------- 界面 ----------------

    function setStatus(text) {
        M.status = text || '';
        const el = $('mSearchStatus');
        if (el) el.textContent = M.status;
    }

    function renderSources() {
        const wrap = $('mSrcRow');
        if (!wrap) return;

        const list = [];
        DEFAULT_SOURCES.forEach(s => list.push(s));
        OPTIONAL_SOURCES.forEach(s => {
            if (list.indexOf(s) === -1) list.push(s);
        });

        wrap.innerHTML = list.map(s => {
            const on = M.picked.has(s);
            return '<button type="button" class="m-chip' + (on ? ' on' : '') +
                '" data-src="' + esc(s) + '">' + esc(LABEL[s] || s) + '</button>';
        }).join('');
    }

    function renderResults() {
        const wrap = $('mResults');
        if (!wrap) return;

        if (!M.results.length) {
            wrap.innerHTML = '<div class="m-empty">' +
                (M.status ? '' : '输入关键词开始搜索') + '</div>';
            return;
        }

        wrap.innerHTML = M.results.map((raw, i) => {
            const cov = raw.cover
                ? '<img src="' + esc(coverUrl(raw)) + '" alt="" loading="lazy">'
                : '♪';
            return '' +
                '<div class="m-row" data-i="' + i + '">' +
                    '<div class="m-row-cover">' + cov + '</div>' +
                    '<div class="m-row-main">' +
                        '<div class="m-row-title">' + esc(raw.name) + '</div>' +
                        '<div class="m-row-sub">' +
                            esc([raw.artist, raw.album].filter(Boolean).join(' · ')) +
                        '</div>' +
                    '</div>' +
                    '<span class="m-badge">' + esc(LABEL[raw.source] || raw.source) + '</span>' +
                    '<span class="m-row-dur">' + fmtTime(raw.duration) + '</span>' +
                    '<button type="button" class="m-row-btn" data-act="play" title="播放">▶</button>' +
                    '<button type="button" class="m-row-btn" data-act="add" title="加入歌单">＋</button>' +
                '</div>';
        }).join('');
    }

    async function doSearch() {
        if (M.searching) return;

        const input = $('mSearchInput');
        const keyword = input ? input.value.trim() : '';
        if (!keyword) return;

        M.searching = true;
        setStatus('搜索中…');
        renderResults();

        try {
            const base = await probe(false);
            if (!base) {
                setStatus('本地服务未启动（需要 m-server.exe）');
                M.results = [];
                renderResults();
                return;
            }

            const out = await search(keyword);
            M.results = out.songs || [];
            renderResults();

            if (!M.results.length) {
                setStatus('没有找到结果');
            } else {
                const slow = (out.errors || []).length;
                setStatus('共 ' + M.results.length + ' 首' +
                    (slow ? '（' + slow + ' 个音源无响应）' : ''));
            }
        } catch (e) {
            console.warn('[M] 搜索失败：', e);
            setStatus('搜索失败：' + (e.message || e));
            M.results = [];
            renderResults();
        } finally {
            M.searching = false;
        }
    }

    function bindUI() {
        $('mSearchBtn')?.addEventListener('click', doSearch);

        $('mSearchInput')?.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                e.preventDefault();
                doSearch();
            }
        });

        $('mSrcRow')?.addEventListener('click', e => {
            const btn = e.target.closest('.m-chip');
            if (!btn) return;
            const src = btn.dataset.src;
            if (!src) return;

            if (M.picked.has(src)) {
                if (M.picked.size <= 1) return;
                M.picked.delete(src);
            } else {
                M.picked.add(src);
            }
            renderSources();
        });

        $('mResults')?.addEventListener('click', async e => {
            const row = e.target.closest('.m-row');
            if (!row) return;

            const i = Number(row.dataset.i);
            if (isNaN(i)) return;

            const raw = M.results[i];
            if (!raw) return;

            const btn = e.target.closest('.m-row-btn');
            const act = btn ? btn.dataset.act : 'play';

            if (act === 'add') {
                if (btn) btn.disabled = true;
                try {
                    const msg = await window.App.MLib?.addSong?.(raw);
                    if (btn) btn.textContent = '✓';
                    setStatus(msg || '已加入歌单');
                } catch (err) {
                    if (btn) btn.disabled = false;
                    setStatus('加入失败：' + (err.message || err));
                }
                return;
            }

            const queue = M.results.map(toQueue);
            window.App.Music?.playOnline?.(queue, i);
        });
    }

    // ---------------- 导出 ----------------

    window.App.MOnline = {
        LABEL,
        DEFAULT_SOURCES,

        init() {
            if (M.inited) return;
            M.inited = true;

            renderSources();
            bindUI();
        },

        open() {
            renderSources();
            renderResults();

            probe(false).then(base => {
                if (!base) {
                    setStatus('本地服务未启动（需要 m-server.exe）');
                } else if (!M.results.length && !M.searching) {
                    setStatus('');
                }
            });
        },

        get base() { return M.base; },
        available() { return !!M.base; },
        probe,

        search,
        resolve,
        lyricText,
        coverUrl,
        streamUrl,
        toQueue,
        songQuery,

        label(src) { return LABEL[src] || src; }
    };
})();
