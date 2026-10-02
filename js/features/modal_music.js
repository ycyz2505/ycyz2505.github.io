// ============================================================
// js/features/modal_music.js
// 音乐播放器
// - 入口：在计算器中连续输入 SECRET_CODE（暗码）
// - 歌曲来源：data/music/ 目录（通过 LocalDataServer 读取）
// - 树形目录展示，自动识别同目录图片作为封面
// - 歌词支持逐行 / 逐字两种 LRC 格式
// - 没有歌词文件的歌照样能播：播放器里显示“歌词缺失”，金句继续轮播
// - 有歌曲在播放时，首页按钮区右侧出现“关闭音乐”按钮
// ============================================================

window.App = window.App || {};

(function () {
    'use strict';

    // ------------------------------------------------------------
    // ★★★  暗码（在此处修改）  ★★★
    // ------------------------------------------------------------
    const SECRET_CODE = '114514///';

    // ------------------------------------------------------------
    // 支持的音频扩展名
    // ------------------------------------------------------------
    const AUDIO_EXT = [
        'mp3', 'flac', 'wav', 'm4a', 'aac',
        'ogg', 'opus', 'wma', 'ape', 'mp4'
    ];

    // 封面优先名（小写前缀匹配）
    const COVER_PRIORITY = [
        'cover', 'folder', 'front', 'album',
        'poster', '封面', '专辑', '专辑封面'
    ];

    // ------------------------------------------------------------
    // 内部状态
    // ------------------------------------------------------------
    const S = {
        tree: null,
        songs: [],
        index: -1,

        lyricToken: 0,
        lyrics: [],
        lyricIndex: -1,

        loading: false,
        error: '',

        mode: 'order',      // order | loop | single | shuffle

        sleepUntil: 0,
        sleepTimerId: null,
        sleepTickId: null,

        volume: 0.8,

        inited: false,

        expanded: new Set(),
        pathToIndex: new Map()
    };

    let audio = null;
    let seekDragging = false;

    // ------------------------------------------------------------
    // 工具
    // ------------------------------------------------------------
    function esc(v) {
        return String(v == null ? '' : v)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function fmtTime(sec) {
        if (!isFinite(sec) || sec < 0) sec = 0;
        sec = Math.floor(sec);
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return m + ':' + String(s).padStart(2, '0');
    }

    function baseUrl() {
        const st = window.App.Store;
        return (st && st.available && st.baseUrl) ? st.baseUrl : '';
    }

    function mediaUrl(relPath) {
        return baseUrl() + '/api/music/media?path=' + encodeURIComponent(relPath);
    }

    function $(id) {
        return document.getElementById(id);
    }

    // ------------------------------------------------------------
    // LRC 解析（逐行 + 逐字）
    // ------------------------------------------------------------
    const TIME_TAG = /\[(\d{1,3}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g;

    function toSeconds(mm, ss, frac) {
        let ms = 0;
        if (frac !== undefined && frac !== '') {
            if (frac.length === 1) ms = parseInt(frac, 10) * 100;
            else if (frac.length === 2) ms = parseInt(frac, 10) * 10;
            else ms = parseInt(frac.slice(0, 3), 10);
            if (!isFinite(ms)) ms = 0;
        }
        const m = parseInt(mm, 10) || 0;
        const s = parseInt(ss, 10) || 0;
        return m * 60 + s + ms / 1000;
    }

    function parseLRC(text) {
        const out = [];
        const lines = String(text).split(/\r?\n/);

        for (let li = 0; li < lines.length; li++) {
            const line = lines[li].trim();
            if (!line) continue;
            if (/^\[[a-zA-Z]+:/.test(line)) continue;

            TIME_TAG.lastIndex = 0;
            const tags = [];
            let m;
            while ((m = TIME_TAG.exec(line)) !== null) {
                tags.push({
                    time: toSeconds(m[1], m[2], m[3]),
                    start: m.index,
                    end: TIME_TAG.lastIndex
                });
            }
            if (!tags.length) continue;

            if (tags.length === 1) {
                const content = line.slice(tags[0].end).trim();
                if (content) out.push({ time: tags[0].time, text: content });
                continue;
            }

            let allGapsEmpty = true;
            for (let i = 0; i < tags.length - 1; i++) {
                const gap = line.slice(tags[i].end, tags[i + 1].start).trim();
                if (gap) { allGapsEmpty = false; break; }
            }

            if (allGapsEmpty) {
                const last = tags[tags.length - 1];
                const content = line.slice(last.end).trim();
                if (!content) continue;
                for (let i = 0; i < tags.length; i++) {
                    out.push({ time: tags[i].time, text: content });
                }
            } else {
                let text = '';
                for (let i = 0; i < tags.length; i++) {
                    const from = tags[i].end;
                    const to = (i + 1 < tags.length) ? tags[i + 1].start : line.length;
                    text += line.slice(from, to);
                }
                text = text.replace(/\s+/g, ' ').trim();
                if (text) out.push({ time: tags[0].time, text: text });
            }
        }

        out.sort((a, b) => a.time - b.time);

        const dedup = [];
        for (let i = 0; i < out.length; i++) {
            const prev = dedup[dedup.length - 1];
            if (prev && prev.text === out[i].text &&
                out[i].time - prev.time < 0.05) continue;
            dedup.push(out[i]);
        }
        return dedup;
    }

    // ------------------------------------------------------------
    // 目录树 -> 歌曲列表
    // ------------------------------------------------------------
    function pickCover(imageFiles) {
        if (!imageFiles || !imageFiles.length) return null;
        const lower = f => String(f.name || '').toLowerCase();

        for (let i = 0; i < COVER_PRIORITY.length; i++) {
            const key = COVER_PRIORITY[i];
            for (let j = 0; j < imageFiles.length; j++) {
                const name = lower(imageFiles[j]);
                if (name.indexOf(key) === 0) return imageFiles[j].path;
            }
        }
        return imageFiles[0].path;
    }

    // parents：从根到当前分类目录的层级路径
    function flattenTree(nodes, parents, out) {
        if (!Array.isArray(nodes)) return;

        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            if (!node || node.type !== 'folder') continue;

            const children = Array.isArray(node.children) ? node.children : [];

            const audioFiles = children.filter(c =>
                c.type === 'audio' &&
                AUDIO_EXT.indexOf(String(c.ext || '').toLowerCase()) !== -1
            );
            const lyricFile = children.find(c => c.type === 'lyric');
            const imageFiles = children.filter(c => c.type === 'image');
            const coverPath = pickCover(imageFiles);

            if (audioFiles.length) {
                const single = audioFiles.length === 1;
                for (let k = 0; k < audioFiles.length; k++) {
                    const af = audioFiles[k];
                    out.push({
                        title: single
                            ? node.name
                            : af.name.replace(/\.[^.]+$/, ''),
                        folderName: node.name,
                        parents: parents.slice(),
                        chain: parents.concat(node.name),
                        audio: af.path,
                        // 没有 lrc 就是 null，后续按“歌词缺失”处理
                        lyric: lyricFile ? lyricFile.path : null,
                        // 没有封面图片就是 null，播放时用 “♪” 兜底
                        cover: coverPath,
                        key: af.path
                    });
                }
            }

            const subFolders = children.filter(c => c.type === 'folder');
            if (subFolders.length) {
                flattenTree(subFolders, parents.concat(node.name), out);
            }
        }
    }

    function subtitleOf(song) {
        let parents = song.parents || [];
        parents = parents.filter((v, i) => i === 0 || v !== parents[i - 1]);
        if (!parents.length) return '本地音乐';
        return parents.join(' · ');
    }

    // ------------------------------------------------------------
    // 加载目录树
    // ------------------------------------------------------------
    function loadTree(force) {
        const treeEl = $('musicTree');
        if (!treeEl) return;

        const base = baseUrl();
        if (!base) {
            S.error = '本地服务未启动，无法加载歌曲';
            S.songs = [];
            renderTree();
            return;
        }

        if (S.tree && !force) return;
        if (S.loading) return;

        S.loading = true;
        S.error = '';
        treeEl.innerHTML = '<div class="music-empty">正在加载歌曲…</div>';

        fetch(base + '/api/music/tree', { cache: 'no-store' })
            .then(res => {
                if (!res.ok) throw new Error('HTTP ' + res.status);
                return res.json();
            })
            .then(tree => {
                S.tree = tree;

                S.songs = [];
                S.pathToIndex.clear();
                flattenTree(tree, [], S.songs);
                S.songs.forEach((s, i) => S.pathToIndex.set(s.audio, i));

                S.expanded.clear();
                expandAllFolders(tree);

                S.loading = false;
                if (!S.songs.length) {
                    S.error = '还没有歌曲，把音乐放进 data\\music\\ 里吧';
                }
                renderTree();
            })
            .catch(err => {
                console.warn('[Music] 加载歌曲失败：', err);
                S.loading = false;
                S.error = '歌曲列表加载失败';
                S.songs = [];
                renderTree();
            });
    }

    function expandAllFolders(nodes) {
        if (!Array.isArray(nodes)) return;
        for (let i = 0; i < nodes.length; i++) {
            const n = nodes[i];
            if (!n || n.type !== 'folder') continue;

            const children = Array.isArray(n.children) ? n.children : [];
            const subFolders = children.filter(c => c.type === 'folder');

            if (subFolders.length) {
                S.expanded.add(n.path);
                expandAllFolders(subFolders);
            }
        }
    }

    // ------------------------------------------------------------
    // 渲染目录树
    // ------------------------------------------------------------
    function countSongsIn(node) {
        let count = 0;
        const children = Array.isArray(node.children) ? node.children : [];
        for (let i = 0; i < children.length; i++) {
            const c = children[i];
            if (c.type === 'folder') count += countSongsIn(c);
            else if (c.type === 'audio' &&
                     AUDIO_EXT.indexOf(String(c.ext || '').toLowerCase()) !== -1) {
                count++;
            }
        }
        return count;
    }

    function renderSongNode(song, idx) {
        const active = (idx === S.index);
        // 没封面时用音符字符兜底
        const cover = song.cover
            ? '<img src="' + mediaUrl(song.cover) + '" alt="">'
            : '♪';

        return '' +
            '<div class="music-tree-node song' + (active ? ' active' : '') +
                '" data-index="' + idx + '">' +
                '<div class="music-tree-label">' +
                    '<span class="music-tree-icon cover">' + cover + '</span>' +
                    '<span class="music-tree-text">' +
                        '<span class="music-tree-name">' + esc(song.title) + '</span>' +
                        '<span class="music-tree-sub">' + esc(subtitleOf(song)) + '</span>' +
                    '</span>' +
                '</div>' +
            '</div>';
    }

    function renderTreeNode(node) {
        if (!node || node.type !== 'folder') return '';

        const children = Array.isArray(node.children) ? node.children : [];
        const subFolders = children.filter(c => c.type === 'folder');
        const audioFiles = children.filter(c =>
            c.type === 'audio' &&
            AUDIO_EXT.indexOf(String(c.ext || '').toLowerCase()) !== -1
        );

        if (audioFiles.length) {
            const idx = S.pathToIndex.get(audioFiles[0].path);
            if (idx === undefined) return '';
            return renderSongNode(S.songs[idx], idx);
        }

        if (!subFolders.length) return '';

        const subHtml = subFolders
            .map(sub => renderTreeNode(sub))
            .filter(Boolean)
            .join('');

        if (!subHtml) return '';

        const path = node.path;
        const isOpen = S.expanded.has(path);
        const count = countSongsIn(node);

        return '' +
            '<div class="music-tree-node folder' + (isOpen ? ' open' : '') +
                '" data-path="' + esc(path) + '">' +
                '<div class="music-tree-label">' +
                    '<span class="music-tree-toggle">▶</span>' +
                    '<span class="music-tree-icon">📁</span>' +
                    '<span class="music-tree-text">' +
                        '<span class="music-tree-name">' + esc(node.name) + '</span>' +
                    '</span>' +
                    (count ? '<span class="music-tree-count">' + count + '</span>' : '') +
                '</div>' +
                '<div class="music-tree-children">' + subHtml + '</div>' +
            '</div>';
    }

    function renderTree() {
        const treeEl = $('musicTree');
        if (!treeEl) return;

        if (!S.tree || !S.songs.length) {
            treeEl.innerHTML = '<div class="music-empty">' +
                esc(S.error || '暂无歌曲') + '</div>';
            return;
        }

        const html = S.tree
            .map(node => renderTreeNode(node))
            .filter(Boolean)
            .join('');

        treeEl.innerHTML = html || '<div class="music-empty">' +
            esc(S.error || '暂无歌曲') + '</div>';
    }

    // ------------------------------------------------------------
    // 首页“关闭音乐”按钮：随播放状态显隐
    // ------------------------------------------------------------
    function updateHomeButton() {
        const btn = $('musicStopButton');
        if (!btn) return;

        // 有歌曲被选中就显示（无论正在播放还是暂停），方便随时清掉
        const show = S.index >= 0;
        btn.style.display = show ? '' : 'none';
    }

    // ------------------------------------------------------------
    // 播放控制
    // ------------------------------------------------------------
    function playIndex(i) {
        if (!S.songs.length) return;
        if (i < 0) i = 0;
        if (i >= S.songs.length) i = S.songs.length - 1;

        const song = S.songs[i];
        if (!song) return;

        S.index = i;

        S.lyricToken++;
        S.lyrics = [];
        S.lyricIndex = -1;

        updateLyricUI();
        updateBar();
        updateHomeButton();

        const base = baseUrl();
        if (!base) return;

        audio.src = mediaUrl(song.audio);
        audio.load();

        const p = audio.play();
        if (p && p.catch) {
            p.catch(err => console.warn('[Music] 播放失败：', err));
        }

        // 无 lrc 时 loadLyric 直接返回，S.lyrics 保持空，金句继续轮播
        loadLyric(song.lyric, S.lyricToken);
        renderTree();
    }

    function togglePlay() {
        if (!S.songs.length) return;

        if (S.index < 0) {
            playIndex(0);
            return;
        }

        if (audio.paused) {
            const p = audio.play();
            if (p && p.catch) p.catch(() => {});
        } else {
            audio.pause();
        }
    }

    function playNext(auto) {
        if (!S.songs.length) return;

        if (S.mode === 'single' && auto) {
            audio.currentTime = 0;
            const p = audio.play();
            if (p && p.catch) p.catch(() => {});
            return;
        }

        let next;

        if (S.mode === 'shuffle') {
            if (S.songs.length === 1) next = 0;
            else {
                do { next = Math.floor(Math.random() * S.songs.length); }
                while (next === S.index);
            }
        } else {
            next = S.index + 1;
            if (next >= S.songs.length) {
                if (S.mode === 'order' && auto) {
                    audio.pause();
                    audio.currentTime = 0;
                    return;
                }
                next = 0;
            }
        }

        playIndex(next);
    }

    function playPrev() {
        if (!S.songs.length) return;

        if (audio.currentTime > 3) {
            audio.currentTime = 0;
            return;
        }

        let prev = S.index - 1;
        if (prev < 0) prev = S.songs.length - 1;
        playIndex(prev);
    }

    // ------------------------------------------------------------
    // 完全停止并清空当前播放
    // ------------------------------------------------------------
        function stopMusic() {
        if (audio) {
            try { audio.pause(); } catch (e) {}
            try { audio.currentTime = 0; } catch (e) {}
        }

        S.index = -1;
        S.lyrics = [];
        S.lyricIndex = -1;
        S.lyricToken++;

        // 交还金句控制权
        window.App.GoldenPhrase?.clearMusicLyric();

        updateLyricUI();
        updateBar();
        renderTree();
        updateHomeButton();

        // 关闭音乐后立刻刷新一条金句，不用等下一个轮播周期
        window.App.GoldenPhrase?.refreshNow?.();
    }

    // ------------------------------------------------------------
    // 歌词
    // ------------------------------------------------------------
    function loadLyric(relPath, token) {
        // 没有歌词文件：保持空数组，播放条显示“歌词缺失”，金句照常轮播
        if (!relPath) {
            if (token === S.lyricToken) updateLyricUI();
            return;
        }

        const base = baseUrl();
        if (!base) return;

        fetch(mediaUrl(relPath), { cache: 'no-store' })
            .then(res => {
                if (!res.ok) throw new Error('HTTP ' + res.status);
                return res.text();
            })
            .then(text => {
                if (token !== S.lyricToken) return;
                S.lyrics = parseLRC(text);
                S.lyricIndex = -1;
                updateLyricUI();
                syncLyric(audio.currentTime);
            })
            .catch(err => {
                console.warn('[Music] 歌词加载失败：', err);
                if (token !== S.lyricToken) return;
                S.lyrics = [];
                S.lyricIndex = -1;
                updateLyricUI();
            });
    }

    function findLyricIndex(t) {
        const arr = S.lyrics;
        if (!arr.length) return -1;

        let lo = 0, hi = arr.length - 1, res = -1;
        while (lo <= hi) {
            const mid = (lo + hi) >> 1;
            if (arr[mid].time <= t) {
                res = mid;
                lo = mid + 1;
            } else {
                hi = mid - 1;
            }
        }
        return res;
    }

    function syncLyric(t) {
        // 没有歌词：直接返回，不接管金句，让金句继续轮播
        if (!S.lyrics.length) return;

        const i = findLyricIndex(t);
        if (i === S.lyricIndex) return;

        S.lyricIndex = i;
        updateLyricUI();

        if (i >= 0 && i < S.lyrics.length) {
            const text = S.lyrics[i].text;
            if (text && !audio.paused) {
                window.App.GoldenPhrase?.showMusicLyric(text);
            }
        }
    }

    function updateLyricUI() {
        const prevEl = $('musicLyricPrev');
        const curEl = $('musicLyricCur');
        const nextEl = $('musicLyricNext');
        if (!curEl) return;

        const arr = S.lyrics;

        if (!arr.length) {
            if (prevEl) prevEl.textContent = '';
            // 选中歌曲但没有歌词 → 显示“歌词缺失”
            curEl.textContent = S.index >= 0
                ? '歌词缺失'
                : '♪ 选择一首歌开始播放';
            if (nextEl) nextEl.textContent = '';
            return;
        }

        const i = S.lyricIndex;

        if (prevEl) prevEl.textContent = (i > 0) ? arr[i - 1].text : '';
        curEl.textContent = (i >= 0 && i < arr.length) ? arr[i].text : '♪';
        if (nextEl) nextEl.textContent =
            (i >= 0 && i + 1 < arr.length) ? arr[i + 1].text : '';
    }

    // ------------------------------------------------------------
    // 播放条 UI
    // ------------------------------------------------------------
    function updateBar() {
        const song = S.songs[S.index];

        const titleEl = $('musicNowTitle');
        const subEl = $('musicNowSub');
        const coverEl = $('musicCover');
        const totalEl = $('musicTimeTotal');

        if (titleEl) titleEl.textContent = song ? song.title : '未播放';
        if (subEl) subEl.textContent = song ? subtitleOf(song) : '—';
        if (totalEl && !song) totalEl.textContent = '0:00';

        if (coverEl) {
            if (song && song.cover) {
                coverEl.innerHTML =
                    '<img src="' + mediaUrl(song.cover) + '" alt="">';
            } else {
                // 没封面 → “♪” 兜底
                coverEl.textContent = '♪';
            }
        }

        updatePlayButton();
        updateProgressUI(audio ? audio.currentTime : 0);
    }

    function updatePlayButton() {
        const btn = $('musicPlayBtn');
        const cover = $('musicCover');
        if (!btn) return;

        const playing = audio && !audio.paused && S.index >= 0;
        btn.textContent = playing ? '⏸' : '▶';

        if (cover) cover.classList.toggle('spin', !!playing);
    }

    function updateProgressUI(t) {
        const playedEl = $('musicPlayed');
        const curEl = $('musicTimeCur');
        const totalEl = $('musicTimeTotal');

        const dur = audio && isFinite(audio.duration) ? audio.duration : 0;
        const ratio = dur > 0 ? Math.max(0, Math.min(1, t / dur)) : 0;

        if (playedEl) playedEl.style.width = (ratio * 100) + '%';
        if (curEl) curEl.textContent = fmtTime(t);
        if (totalEl) totalEl.textContent = dur > 0 ? fmtTime(dur) : '0:00';
    }

    function updateBufferUI() {
        const bufEl = $('musicBuffer');
        if (!bufEl || !audio) return;

        const dur = isFinite(audio.duration) ? audio.duration : 0;
        if (dur <= 0 || !audio.buffered || !audio.buffered.length) {
            bufEl.style.width = '0';
            return;
        }

        try {
            const end = audio.buffered.end(audio.buffered.length - 1);
            bufEl.style.width = Math.max(0, Math.min(1, end / dur)) * 100 + '%';
        } catch (e) {
            bufEl.style.width = '0';
        }
    }

    // ------------------------------------------------------------
    // 进度条拖动
    // ------------------------------------------------------------
    function seekFromEvent(e) {
        const el = $('musicProgress');
        if (!el || !audio) return;

        const dur = audio.duration;
        if (!isFinite(dur) || dur <= 0) return;

        const rect = el.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const t = ratio * dur;

        audio.currentTime = t;
        updateProgressUI(t);
    }

    function bindProgress() {
        const el = $('musicProgress');
        if (!el) return;

        el.addEventListener('pointerdown', e => {
            seekDragging = true;
            el.classList.add('dragging');
            if (el.setPointerCapture) {
                try { el.setPointerCapture(e.pointerId); } catch (err) {}
            }
            seekFromEvent(e);
        });

        el.addEventListener('pointermove', e => {
            if (seekDragging) seekFromEvent(e);
        });

        const end = () => {
            seekDragging = false;
            el.classList.remove('dragging');
        };

        el.addEventListener('pointerup', end);
        el.addEventListener('pointercancel', end);
        window.addEventListener('pointerup', end);
    }

    // ------------------------------------------------------------
    // 定时关闭
    // ------------------------------------------------------------
    function clearSleep() {
        if (S.sleepTimerId) {
            clearTimeout(S.sleepTimerId);
            S.sleepTimerId = null;
        }
        if (S.sleepTickId) {
            clearInterval(S.sleepTickId);
            S.sleepTickId = null;
        }
        S.sleepUntil = 0;
        updateSleepStatus();
        syncSleepQuickButtons();
    }

    function startSleep(seconds) {
        clearSleep();

        if (!seconds || seconds <= 0) return;

        S.sleepUntil = Date.now() + seconds * 1000;

        if (seconds > 86400) {
            S.sleepUntil = Date.now() + 86400 * 1000;
        }

        S.sleepTimerId = setTimeout(() => {
            if (audio) audio.pause();
            clearSleep();
        }, Math.max(0, S.sleepUntil - Date.now()));

        S.sleepTickId = setInterval(updateSleepStatus, 1000);
        updateSleepStatus();
        syncSleepQuickButtons();
    }

    function startSleepAtClock(hh, mm, ss) {
        const now = new Date();
        const target = new Date(now);
        target.setHours(hh, mm, ss || 0, 0);

        if (target <= now) {
            target.setDate(target.getDate() + 1);
        }

        const seconds = Math.round((target - now) / 1000);
        startSleep(seconds);
    }

    function updateSleepStatus() {
        const el = $('musicSleepStatus');
        if (!el) return;

        if (!S.sleepUntil) {
            el.textContent = '';
            return;
        }

        const remain = Math.max(0, Math.round((S.sleepUntil - Date.now()) / 1000));
        const h = Math.floor(remain / 3600);
        const m = Math.floor((remain % 3600) / 60);
        const s = remain % 60;

        let text;
        if (h > 0) {
            text = h + ':' + String(m).padStart(2, '0') +
                   ':' + String(s).padStart(2, '0');
        } else {
            text = m + ':' + String(s).padStart(2, '0');
        }

        el.textContent = '将在 ' + text + ' 后停止播放';
    }

    function syncSleepQuickButtons() {
        const wrap = $('musicSleepQuick');
        if (!wrap) return;

        let matched = null;

        if (S.sleepUntil) {
            const remain = Math.round((S.sleepUntil - Date.now()) / 1000);
            const presets = [300, 600, 900, 1800, 3600];
            for (let i = 0; i < presets.length; i++) {
                if (remain === presets[i]) { matched = presets[i]; break; }
            }
            if (matched === null) matched = -1;
        } else {
            matched = 0;
        }

        wrap.querySelectorAll('button').forEach(btn => {
            const sec = Number(btn.dataset.sec) || 0;
            btn.classList.toggle('off', sec === matched);
        });
    }

    // ------------------------------------------------------------
    // 播放模式
    // ------------------------------------------------------------
    const MODE_ICON = {
        order:   '➡️',
        loop:    '🔁',
        single:  '🔂',
        shuffle: '🔀'
    };

    const MODE_LABEL = {
        order:   '顺序播放',
        loop:    '列表循环',
        single:  '单曲循环',
        shuffle: '随机播放'
    };

    function applyMode(mode) {
        S.mode = MODE_ICON[mode] ? mode : 'order';

        const btn = $('musicModeBtn');
        if (btn) {
            btn.textContent = MODE_ICON[S.mode];
            btn.title = '播放模式：' + MODE_LABEL[S.mode];
        }
    }

    // ------------------------------------------------------------
    // 音量
    // ------------------------------------------------------------
    function applyVolume(v, updateSlider) {
        v = Math.max(0, Math.min(1, Number(v)));
        if (!isFinite(v)) v = 0.8;

        S.volume = v;
        if (audio) audio.volume = v;

        const slider = $('musicVolume');
        if (slider) {
            const pct = Math.round(v * 100);

            if (updateSlider !== false) slider.value = pct;
            slider.style.setProperty('--vol-pct', pct + '%');
        }

        const icon = $('musicVolumeIcon');
        if (icon) {
            icon.textContent = v <= 0.001 ? '🔇'
                            : (v < 0.4 ? '🔉' : '🔊');
        }
    }

    // ------------------------------------------------------------
    // 事件绑定
    // ------------------------------------------------------------
    function bindAudio() {
        audio = $('musicAudio');
        if (!audio) return;

        applyVolume(S.volume, true);

        audio.addEventListener('timeupdate', () => {
            updateProgressUI(audio.currentTime);
            syncLyric(audio.currentTime);
        });

        audio.addEventListener('progress', updateBufferUI);

        audio.addEventListener('loadedmetadata', () => {
            updateProgressUI(audio.currentTime);
            updateBufferUI();
        });

        audio.addEventListener('play', () => {
            updatePlayButton();
            renderTree();
            updateHomeButton();

            // 有歌词才接管金句；无歌词则什么都不做，让金句继续轮播
            if (S.lyrics.length &&
                S.lyricIndex >= 0 &&
                S.lyrics[S.lyricIndex]) {
                window.App.GoldenPhrase?.showMusicLyric(
                    S.lyrics[S.lyricIndex].text
                );
            }
        });

        audio.addEventListener('pause', () => {
            updatePlayButton();
            renderTree();
            updateHomeButton();
            window.App.GoldenPhrase?.clearMusicLyric();
        });

        audio.addEventListener('ended', () => {
            window.App.GoldenPhrase?.clearMusicLyric();
            playNext(true);
        });

        audio.addEventListener('error', () => {
            console.warn('[Music] 音频加载出错');
            window.App.GoldenPhrase?.clearMusicLyric();
        });
    }

    function bindUI() {
        // ---- 歌曲树 ----
        const treeEl = $('musicTree');

        treeEl?.addEventListener('click', e => {
            const songNode = e.target.closest('.music-tree-node.song');
            if (songNode) {
                const i = Number(songNode.dataset.index);
                if (isNaN(i)) return;

                if (i === S.index) {
                    togglePlay();
                } else {
                    playIndex(i);
                }
                return;
            }

            const folderNode = e.target.closest('.music-tree-node.folder');
            if (folderNode) {
                const path = folderNode.dataset.path;
                if (!path) return;

                if (S.expanded.has(path)) S.expanded.delete(path);
                else S.expanded.add(path);

                folderNode.classList.toggle('open', S.expanded.has(path));
            }
        });

        // ---- 播放控制 ----
        $('musicPlayBtn')?.addEventListener('click', togglePlay);
        $('musicNextBtn')?.addEventListener('click', () => playNext(false));
        $('musicPrevBtn')?.addEventListener('click', playPrev);

        // ---- 首页“关闭音乐”按钮 ----
        $('musicStopButton')?.addEventListener('click', () => {
            stopMusic();
        });

        // ---- 音量 ----
        const vol = $('musicVolume');
        vol?.addEventListener('input', e =>
            applyVolume(Number(e.target.value) / 100, false)
        );

        $('musicVolumeIcon')?.addEventListener('click', () => {
            if (S.volume > 0.001) {
                S._lastVolume = S.volume;
                applyVolume(0);
            } else {
                applyVolume(S._lastVolume || 0.8);
            }
        });

        // ---- 播放模式按钮 ----
        $('musicModeBtn')?.addEventListener('click', () => {
            const order = ['order', 'loop', 'single', 'shuffle'];
            const i = order.indexOf(S.mode);
            applyMode(order[(i + 1) % order.length]);
        });

        // ---- 设置面板 ----
        const panel = $('musicSettingsPanel');
        const fab = $('musicSettingsFab');

        const closePanel = () => {
            panel?.classList.remove('open');
            fab?.classList.remove('active');
        };

        fab?.addEventListener('click', e => {
            e.stopPropagation();
            if (!panel) return;
            const open = panel.classList.toggle('open');
            fab.classList.toggle('active', open);
        });

        $('musicSettingsClose')?.addEventListener('click', e => {
            e.stopPropagation();
            closePanel();
        });

        panel?.addEventListener('click', e => e.stopPropagation());

        document.addEventListener('click', () => closePanel());

        // ---- 定时关闭：快捷按钮 ----
        $('musicSleepQuick')?.addEventListener('click', e => {
            const btn = e.target.closest('button');
            if (!btn) return;

            const sec = Number(btn.dataset.sec) || 0;
            if (sec === 0) clearSleep();
            else startSleep(sec);
        });

        // ---- 定时关闭：自定义秒数 ----
        const customInput = $('musicSleepCustom');

        const applyCustom = () => {
            if (!customInput) return;
            const v = Number(customInput.value);
            if (!isFinite(v) || v <= 0) return;

            startSleep(v);
            customInput.value = '';
        };

        $('musicSleepCustomStart')?.addEventListener('click', applyCustom);
        customInput?.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                e.preventDefault();
                applyCustom();
            }
        });

        // ---- 定时关闭：指定时刻 ----
        const timeInput = $('musicSleepTime');

        const applyClock = () => {
            if (!timeInput || !timeInput.value) return;

            const parts = timeInput.value.split(':');
            const hh = parseInt(parts[0], 10);
            const mm = parseInt(parts[1], 10);
            const ss = parts[2] !== undefined ? parseInt(parts[2], 10) : 0;

            if (!isFinite(hh) || !isFinite(mm)) return;

            startSleepAtClock(hh, mm, ss);
            timeInput.value = '';
        };

        $('musicSleepTimeStart')?.addEventListener('click', applyClock);
        timeInput?.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                e.preventDefault();
                applyClock();
            }
        });

        // ---- 关闭 / 最大化 ----
        $('closeMusic')?.addEventListener('click', () => {
            closePanel();
            $('musicModal')?.classList.remove('active');
            window.App.ModalCore?.resetFullscreen('musicModal');
        });

        $('maximizeMusic')?.addEventListener('click', function () {
            const modal = $('musicModal');
            if (!modal) return;
            modal.classList.toggle('fullscreen');
            this.textContent = modal.classList.contains('fullscreen')
                ? '🗗' : '⛶';
        });

        bindProgress();
    }

    // ------------------------------------------------------------
    // 对外接口
    // ------------------------------------------------------------
    window.App.Music = {
        SECRET_CODE: SECRET_CODE,

        init() {
            if (S.inited) return;
            S.inited = true;

            bindAudio();
            bindUI();
            applyMode('order');
            loadTree(false);

            // 初始状态：首页关闭按钮隐藏
            updateHomeButton();
        },

        open() {
            const modal = $('musicModal');
            if (!modal) return;

            modal.classList.add('active');
            loadTree(false);
            renderTree();
            updateBar();
            applyVolume(S.volume, true);
            updateHomeButton();

            window.App.Calculator?.clear?.();
        },

        isPlaying() {
            return !!(audio && !audio.paused && S.index >= 0);
        },

        // 供外部调用：完全停止播放
        stop() {
            stopMusic();
        }
    };
})();