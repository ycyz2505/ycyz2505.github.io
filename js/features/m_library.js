// ============================================================
// js/features/m_library.js
// 本地歌单：新建 / 改名 / 删除 / 移除单曲 / 体检
// 数据与文件都由本地伴生服务管理（data/m/library.json + 每首歌一个子文件夹）
// ============================================================

window.App = window.App || {};

(function () {
    'use strict';

    const L = {
        lib: null,
        currentId: '',
        loading: false,
        inited: false
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

    function setStatus(text) {
        const el = $('mListStatus');
        if (el) el.textContent = text || '';
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

    function mediaUrl(rel) {
        const base = window.App.MOnline?.base;
        if (!base || !rel) return '';
        return base + '/api/m/media?path=' + encodeURIComponent(rel);
    }

    // ---------------- 渲染 ----------------

    function currentPlaylist() {
        if (!L.lib || !Array.isArray(L.lib.playlists)) return null;
        return L.lib.playlists.find(p => p.id === L.currentId) || L.lib.playlists[0] || null;
    }

    function renderSelect() {
        const sel = $('mListSelect');
        if (!sel) return;

        const lists = L.lib?.playlists || [];
        sel.innerHTML = lists.map(p =>
            '<option value="' + esc(p.id) + '"' +
            (p.id === L.currentId ? ' selected' : '') + '>' +
            esc(p.name) + '（' + (p.songs?.length || 0) + '）</option>'
        ).join('');

        if (!L.currentId && lists.length) {
            L.currentId = lists[0].id;
            sel.value = L.currentId;
        }
    }

    function renderSongs() {
        const wrap = $('mListSongs');
        if (!wrap) return;

        const pl = currentPlaylist();
        if (!pl) {
            wrap.innerHTML = '<div class="m-empty">还没有歌单</div>';
            return;
        }
        if (!pl.songs || !pl.songs.length) {
            wrap.innerHTML = '<div class="m-empty">这个歌单还是空的，去搜索页点「＋」加入</div>';
            return;
        }

        wrap.innerHTML = pl.songs.map((s, i) => {
            const cov = s.cover
                ? '<img src="' + esc(mediaUrl(s.cover)) + '" alt="" loading="lazy">'
                : '♪';
            const warn = (s.warnings && s.warnings.length)
                ? '<span class="m-warn" title="' + esc(s.warnings.join('；')) + '">!</span>'
                : '';
            return '' +
                '<div class="m-row" data-i="' + i + '">' +
                    '<div class="m-row-cover">' + cov + '</div>' +
                    '<div class="m-row-main">' +
                        '<div class="m-row-title">' + esc(s.name) + warn + '</div>' +
                        '<div class="m-row-sub">' +
                            esc([s.artist, s.album].filter(Boolean).join(' · ')) +
                        '</div>' +
                    '</div>' +
                    '<span class="m-badge">' + (Number(s.quality) || 0) + '</span>' +
                    '<span class="m-row-dur">' + fmtTime(s.duration) + '</span>' +
                    '<button type="button" class="m-row-btn" data-act="play" title="播放">▶</button>' +
                    '<button type="button" class="m-row-btn" data-act="del" title="移出歌单">×</button>' +
                '</div>';
        }).join('');
    }

    function toQueueSong(s) {
        return {
            kind: 'm',
            ready: true,
            source: s.source,
            id: s.id,
            name: s.name,
            artist: s.artist || '',
            album: s.album || '',
            duration: Number(s.duration) || 0,
            title: s.name,
            sub: [s.artist, '本地'].filter(Boolean).join(' · '),
            audioUrl: mediaUrl(s.audio),
            coverUrl: mediaUrl(s.cover),
            lyricUrl: mediaUrl(s.lyric),
            warnings: s.warnings || []
        };
    }

    // ---------------- 数据操作 ----------------

    async function refresh() {
        if (L.loading) return;
        L.loading = true;
        try {
            const data = await api('/api/m/library');
            L.lib = data.library;
            const lists = L.lib?.playlists || [];
            if (!lists.some(p => p.id === L.currentId)) {
                L.currentId = lists[0]?.id || '';
            }
            renderSelect();
            renderSongs();
        } catch (e) {
            setStatus('读取歌单失败：' + (e.message || e));
            const wrap = $('mListSongs');
            if (wrap) wrap.innerHTML = '<div class="m-empty">本地服务未启动（需要 m-server.exe）</div>';
        } finally {
            L.loading = false;
        }
    }

    async function playlistOp(action, payload) {
        const data = await api('/api/m/library/playlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(Object.assign({ action }, payload || {}))
        });
        L.lib = data.library;
        renderSelect();
        renderSongs();
        return data;
    }

    async function addSong(raw) {
        if (!L.lib) await refresh();

        const pl = currentPlaylist();
        if (!pl) {
            await refresh();
        }
        const target = currentPlaylist();
        if (!target) throw new Error('还没有歌单');

        setStatus('正在下载并校验…');

        const data = await api('/api/m/library/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                playlistId: target.id,
                song: {
                    id: raw.id,
                    source: raw.source,
                    name: raw.name,
                    artist: raw.artist || '',
                    album: raw.album || '',
                    duration: Number(raw.duration) || 0,
                    cover: raw.cover || '',
                    ext: raw.ext || '',
                    extra: raw.extra || null
                }
            })
        });

        if (!data.ok) {
            setStatus('下载失败：' + (data.error || '未知原因'));
            throw new Error(data.error || '下载失败');
        }

        await refresh();

        if (data.duplicated) {
            return '已经在「' + target.name + '」里了';
        }

        const q = Number(data.song?.quality) || 0;
        const warn = (data.song?.warnings || []).join('、');
        return '已加入「' + target.name + '」' +
            (q ? '（质量 ' + q + ' 分' : '') +
            (warn ? '，' + warn + '）' : (q ? '）' : ''));
    }

    // ---------------- 事件 ----------------

    function bindUI() {
        $('mListSelect')?.addEventListener('change', e => {
            L.currentId = e.target.value;
            renderSongs();
        });

        $('mListNew')?.addEventListener('click', async () => {
            const name = window.prompt('新歌单名称', '新歌单');
            if (!name) return;
            try {
                await playlistOp('create', { name });
                setStatus('已创建「' + name + '」');
            } catch (e) {
                setStatus('创建失败：' + (e.message || e));
            }
        });

        $('mListRename')?.addEventListener('click', async () => {
            const pl = currentPlaylist();
            if (!pl) return;
            const name = window.prompt('重命名为', pl.name);
            if (!name || name === pl.name) return;
            try {
                await playlistOp('rename', { id: pl.id, name });
                setStatus('已重命名');
            } catch (e) {
                setStatus('重命名失败：' + (e.message || e));
            }
        });

        $('mListDel')?.addEventListener('click', async () => {
            const pl = currentPlaylist();
            if (!pl) return;
            if (!window.confirm('删除歌单「' + pl.name + '」及其全部本地文件？')) return;
            try {
                await playlistOp('delete', { id: pl.id });
                L.currentId = '';
                await refresh();
                setStatus('已删除');
            } catch (e) {
                setStatus('删除失败：' + (e.message || e));
            }
        });

        $('mListVerify')?.addEventListener('click', async () => {
            setStatus('体检中…');
            try {
                const data = await api('/api/m/library/verify', { method: 'POST' });
                const issues = data.issues || [];
                if (!issues.length) {
                    setStatus('全部正常');
                    return;
                }
                setStatus('发现 ' + issues.length + ' 个问题：' +
                    issues.slice(0, 3).map(x => x.name + '（' + x.problem + '）').join('；'));
            } catch (e) {
                setStatus('体检失败：' + (e.message || e));
            }
        });

        $('mListSongs')?.addEventListener('click', async e => {
            const row = e.target.closest('.m-row');
            if (!row) return;

            const pl = currentPlaylist();
            if (!pl) return;

            const i = Number(row.dataset.i);
            if (isNaN(i) || !pl.songs[i]) return;

            const btn = e.target.closest('.m-row-btn');
            const act = btn ? btn.dataset.act : 'play';

            if (act === 'del') {
                try {
                    const data = await api('/api/m/library/remove', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ playlistId: pl.id, key: pl.songs[i].key })
                    });
                    L.lib = data.library;
                    renderSelect();
                    renderSongs();
                    setStatus('已移出');
                } catch (err) {
                    setStatus('移出失败：' + (err.message || err));
                }
                return;
            }

            const queue = pl.songs.map(toQueueSong);
            window.App.Music?.playOnline?.(queue, i);
        });
    }

    window.App.MLib = {
        init() {
            if (L.inited) return;
            L.inited = true;
            bindUI();
        },

        open() {
            refresh();
        },

        refresh,
        addSong,

        get library() { return L.lib; },
        get currentId() { return L.currentId; }
    };
})();
