// ============================================================
// js/features/plaza_core.js
// 广场的数据层与共享工具
//
// 数据文件（经 App.Store 读写）：
//   data/plaza.json        名单 + 社交关系 + 账号（小文件，频繁写）
//   data/plaza_media.json  头像与背景图（大文件，极少写、不订阅轮询）
//
// 拆成两个文件的理由：Store 的写盘是「整体 PUT + 回读校验」，
// 图片混进去以后每点一次赞都要传好几 MB。详见设计稿 §4.2。
//
// 关键设计：
//   · 粉丝数、点赞量、互关状态都不落盘，由 following / likes 现算，
//     杜绝「A 的关注里有 B、B 的粉丝里没有 A」这种不一致
//   · 点赞是「每人每天对每个人最多 50 次」的计数，不是开关
//   · 生日隐藏时用「数据密钥 DEK」模型加密（见下面 setBirthdayFor 的注释），
//     本人密码包一份、管理员公钥包一份，任一方都能解开
//   · 登录态只存在内存里，刷新即失效；退出时清掉明文密码和所有 AES 密钥
// ============================================================

window.App = window.App || {};

(function () {
    'use strict';

    var App = window.App;

    var KEY = 'plaza';
    var MEDIA_KEY = 'plazaMedia';
    var VERSION = 1;

    var MAX_NICKNAME = 12;
    var MAX_SIGNATURE = 30;
    var MAX_INTRO = 200;
    var MIN_PASSWORD = 4;
    var MAX_PASSWORD = 20;

    // 每人每天能对同一个人点的赞的上限
    var MAX_DAILY_LIKES = 50;

    // 点赞明细只保留最近几天，总量单独记着不会丢
    var KEEP_LIKE_DAYS = 3;

    // 背景图预设：仓库里现成的节气图，零新增体积
    var COVER_PRESETS = [
        '立春', '雨水', '惊蛰', '春分', '清明', '谷雨',
        '立夏', '芒种', '小满'
    ];

    // 自动生成头像的渐变色（按 id 哈希挑一个）
    var AVATAR_GRADIENTS = [
        ['#7ec8a0', '#4a9d76'],
        ['#8fb8e8', '#5a86c8'],
        ['#e8a5b8', '#c4708c'],
        ['#f0c07a', '#d19a44'],
        ['#a89ce0', '#7a68c0'],
        ['#7fd0d8', '#48a6b0'],
        ['#e89a7a', '#c47050'],
        ['#9fc46a', '#6f9a3c'],
        ['#d99ad0', '#b06aa8'],
        ['#7fa8b8', '#4d7a8c']
    ];

    App.Plaza = {
        KEY: KEY,
        MEDIA_KEY: MEDIA_KEY,
        VERSION: VERSION,

        MAX_NICKNAME: MAX_NICKNAME,
        MAX_SIGNATURE: MAX_SIGNATURE,
        MAX_INTRO: MAX_INTRO,
        MIN_PASSWORD: MIN_PASSWORD,
        MAX_PASSWORD: MAX_PASSWORD,
        MAX_DAILY_LIKES: MAX_DAILY_LIKES,
        COVER_PRESETS: COVER_PRESETS,

        // 当前登录的人：{ studentId, password, aesKey }
        // 只活在内存里，刷新页面即消失
        session: null,

        // 管理员是否已解锁名单管理；关闭名单管理即失效
        adminUnlocked: false,
        // 管理员密码派生出来的 AES 密钥，用来解开 admin.priv（私钥本身）
        adminKey: null,
        // 管理员的 RSA 公钥 / 私钥。公钥明文存盘，解锁前后都能用；
        // 私钥只在解锁后留在内存里，用来解开所有人的 secret.adm
        adminPublicKey: null,
        adminPrivateKey: null,

        // studentId → 解密出来的生日明文（"MM-DD"）
        // 退出登录 / 锁上管理员时清空
        secretCache: {},

        _listeners: [],
        _inited: false,

        // ------------------------------------------------------
        // 初始化
        // ------------------------------------------------------

        init() {
            if (this._inited) return;
            this._inited = true;

            this.sanitize();

            if (App.Store) {
                App.Store.watch(KEY, function () {
                    App.Plaza.sanitize();
                    App.Plaza.emit();
                });
            }
        },

        on(fn) {
            if (typeof fn === 'function' && this._listeners.indexOf(fn) === -1) {
                this._listeners.push(fn);
            }
        },

        emit() {
            var self = this;
            this._listeners.forEach(function (fn) {
                try {
                    fn();
                } catch (e) {
                    console.error('[Plaza] 订阅回调出错:', e);
                }
            });
        },

        // ------------------------------------------------------
        // 读写
        // ------------------------------------------------------

        data() {
            var d = App.Store ? App.Store.get(KEY) : null;

            if (!d || typeof d !== 'object' || Array.isArray(d)) {
                d = { version: VERSION, admin: null, students: [], meta: {} };
                // 写回缓存：否则每次调用都会拿到一个全新的临时对象，改动全丢
                if (App.Store) App.Store.cache[KEY] = d;
            }

            if (!Array.isArray(d.students)) d.students = [];
            if (typeof d.admin !== 'object') d.admin = d.admin || null;
            if (!d.meta || typeof d.meta !== 'object') d.meta = {};

            return d;
        },

        save() {
            var d = this.data();
            d.meta.updatedAt = Date.now();
            if (App.Store) App.Store.touch(KEY);
        },

        media() {
            var m = App.Store ? App.Store.get(MEDIA_KEY) : null;

            if (!m || typeof m !== 'object' || Array.isArray(m)) {
                m = { version: VERSION, media: {} };
                if (App.Store) App.Store.cache[MEDIA_KEY] = m;
            }
            if (!m.media || typeof m.media !== 'object') m.media = {};

            return m;
        },

        mediaOf(id) {
            var entry = this.media().media[id];
            return entry && typeof entry === 'object' ? entry : {};
        },

        setMedia(id, patch) {
            var m = this.media();
            var entry = m.media[id];

            if (!entry || typeof entry !== 'object') {
                entry = {};
                m.media[id] = entry;
            }

            Object.keys(patch).forEach(function (k) {
                var v = patch[k];
                if (v) entry[k] = v;
                else delete entry[k];
            });

            if (!entry.avatar && !entry.cover) delete m.media[id];

            if (App.Store) App.Store.touch(MEDIA_KEY);
        },

        // ------------------------------------------------------
        // 名单
        // ------------------------------------------------------

        students(includeArchived) {
            var list = this.data().students;

            if (includeArchived) return list;
            return list.filter(function (s) { return !s.archived; });
        },

        getById(id) {
            if (!id) return null;
            var list = this.data().students;

            for (var i = 0; i < list.length; i++) {
                if (list[i].id === id) return list[i];
            }
            return null;
        },

        _nextId() {
            var list = this.data().students;
            var max = 0;

            list.forEach(function (s) {
                var m = /^s(\d+)$/.exec(String(s.id || ''));
                if (m) max = Math.max(max, Number(m[1]));
            });

            var next = max + 1;
            return 's' + (next < 10 ? '0' + next : String(next));
        },

        addStudent(fields) {
            var st = this._blankStudent(this._nextId(), fields);
            this.data().students.push(st);
            this.save();
            return st;
        },

        _blankStudent(id, fields) {
            var src = fields || {};
            var list = this.data().students;

            return {
                id: id,
                order: typeof src.order === 'number' ? src.order : list.length + 1,

                realName: String(src.realName || '').trim(),
                gender: src.gender === 'male' || src.gender === 'female' ? src.gender : '',
                studentNo: String(src.studentNo || '').trim(),

                nickname: String(src.nickname || '').trim(),
                birthdayVisible: src.birthdayVisible !== false,
                birthday: '',
                signature: '',
                intro: '',

                // 私密字段（隐藏生日时才有）：见 setBirthdayFor
                secret: null,
                secretOrphaned: false,

                following: [],
                likes: { total: 0, days: {} },

                pwdSalt: '',
                pwdIters: App.PlazaCrypto.DEFAULT_ITERS,
                verifyKey: '',
                pwdLen: 0,
                pwdUpdatedAt: 0,

                archived: false
            };
        },

        removeStudent(id, hard) {
            var d = this.data();
            var st = this.getById(id);
            if (!st) return;

            if (hard) {
                d.students = d.students.filter(function (s) { return s.id !== id; });

                // 摘掉所有指向他的关系，避免悬空 id
                d.students.forEach(function (s) {
                    s.following = s.following.filter(function (x) { return x !== id; });

                    if (s.likes && s.likes.days) {
                        Object.keys(s.likes.days).forEach(function (day) {
                            var entry = s.likes.days[day];
                            if (!entry || typeof entry !== 'object') return;

                            var n = Number(entry[id]) || 0;
                            if (!n) return;

                            delete entry[id];
                            s.likes.total = Math.max(0, (Number(s.likes.total) || 0) - n);
                        });
                    }
                });

                var m = this.media();
                delete m.media[id];
                if (App.Store) App.Store.touch(MEDIA_KEY);

                delete this.secretCache[id];

                if (this.session && this.session.studentId === id) this.logout();
            } else {
                st.archived = true;
            }

            this.save();
        },

        // ------------------------------------------------------
        // 展示用的字段
        // ------------------------------------------------------

        displayName(st) {
            if (!st) return '未设置';
            var nick = String(st.nickname || '').trim();
            if (nick) return nick;
            var real = String(st.realName || '').trim();
            return real || '未设置';
        },

        hasNickname(st) {
            return !!(st && String(st.nickname || '').trim());
        },

        hasRealName(st) {
            return !!(st && String(st.realName || '').trim());
        },

        initialsOf(st) {
            var name = this.displayName(st);
            return name === '未设置' ? '?' : Array.from(name)[0] || '?';
        },

        _hash(st) {
            var key = String((st && st.id) || '');
            var hash = 0;

            for (var i = 0; i < key.length; i++) {
                hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
            }

            return hash;
        },

        gradientOf(st) {
            return AVATAR_GRADIENTS[this._hash(st) % AVATAR_GRADIENTS.length];
        },

        avatarUrl(st) {
            return this.mediaOf(st.id).avatar || '';
        },

        // 没设过就是空的，卡片那边显示成纯白
        // （想要图的同学可以在「编辑资料」里自己从节气图里挑一张）
        coverUrl(st) {
            return this.mediaOf(st.id).cover || '';
        },

        formatBirthday(mmdd) {
            var m = /^(\d{1,2})-(\d{1,2})$/.exec(String(mmdd || '').trim());
            if (!m) return '';
            return Number(m[1]) + '月' + Number(m[2]) + '日';
        },

        // ------------------------------------------------------
        // 社交关系
        // ------------------------------------------------------

        isFollowing(st, targetId) {
            return !!(st && Array.isArray(st.following) && st.following.indexOf(targetId) >= 0);
        },

        followingList(st) {
            var self = this;
            if (!st || !Array.isArray(st.following)) return [];

            return st.following
                .map(function (id) { return self.getById(id); })
                .filter(function (s) { return s && !s.archived; });
        },

        followerList(id) {
            return this.students().filter(function (s) {
                return Array.isArray(s.following) && s.following.indexOf(id) >= 0;
            });
        },

        isMutual(a, b) {
            if (!a || !b || a.id === b.id) return false;
            return this.isFollowing(a, b.id) && this.isFollowing(b, a.id);
        },

        toggleFollow(targetId) {
            var me = this.me();
            if (!me || me.id === targetId) return null;

            var target = this.getById(targetId);
            if (!target) return null;

            var idx = me.following.indexOf(targetId);

            if (idx >= 0) me.following.splice(idx, 1);
            else me.following.push(targetId);

            this.save();
            return idx < 0;
        },

        // ---------- 点赞：每人每天对每个人最多 50 次 ----------

        todayKey() {
            var d = App.Utils?.now ? App.Utils.now() : new Date();
            var pad = function (n) { return (n < 10 ? '0' : '') + n; };
            return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
        },

        likeCount(st) {
            return st && st.likes ? Number(st.likes.total) || 0 : 0;
        },

        // 今天这个 likerId 已经给他点了几个
        likesTodayFrom(st, likerId) {
            if (!st || !st.likes || !st.likes.days) return 0;
            var entry = st.likes.days[this.todayKey()];
            if (!entry || typeof entry !== 'object') return 0;
            return Number(entry[likerId]) || 0;
        },

        likesTodayTotal(st) {
            if (!st || !st.likes || !st.likes.days) return 0;
            var entry = st.likes.days[this.todayKey()];
            if (!entry || typeof entry !== 'object') return 0;

            var sum = 0;
            Object.keys(entry).forEach(function (k) { sum += Number(entry[k]) || 0; });
            return sum;
        },

        // 返回 { ok, total, today, reason }
        giveLike(targetId) {
            var me = this.me();
            if (!me) return { ok: false, reason: 'notlogin' };
            if (me.id === targetId) return { ok: false, reason: 'self' };

            var target = this.getById(targetId);
            if (!target) return { ok: false, reason: 'notfound' };

            if (!target.likes || typeof target.likes !== 'object') {
                target.likes = { total: 0, days: {} };
            }
            if (!target.likes.days || typeof target.likes.days !== 'object') {
                target.likes.days = {};
            }

            var day = this.todayKey();
            if (!target.likes.days[day] || typeof target.likes.days[day] !== 'object') {
                target.likes.days[day] = {};
            }

            var n = Number(target.likes.days[day][me.id]) || 0;

            if (n >= MAX_DAILY_LIKES) {
                return { ok: false, reason: 'limit', today: n, total: this.likeCount(target) };
            }

            target.likes.days[day][me.id] = n + 1;
            target.likes.total = this.likeCount(target) + 1;

            this.pruneLikeDays();
            this.save();

            return { ok: true, today: n + 1, total: target.likes.total };
        },

        // 明细只留最近几天，总量是单独累计的，不会因为清理而减少
        pruneLikeDays() {
            var keep = {};
            var now = App.Utils?.now ? App.Utils.now() : new Date();

            for (var i = 0; i < KEEP_LIKE_DAYS; i++) {
                var d = new Date(now.getTime() - i * 86400000);
                var pad = function (n) { return (n < 10 ? '0' : '') + n; };
                keep[d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())] = true;
            }

            this.data().students.forEach(function (st) {
                if (!st.likes || !st.likes.days) return;

                Object.keys(st.likes.days).forEach(function (day) {
                    if (!keep[day]) delete st.likes.days[day];
                });
            });
        },

        // ------------------------------------------------------
        // 登录态
        // ------------------------------------------------------

        isLoggedIn() {
            return !!(this.session && this.getById(this.session.studentId));
        },

        me() {
            if (!this.session) return null;
            return this.getById(this.session.studentId);
        },

        // 管理员解锁之后，可以编辑所有人的资料
        canEdit(st) {
            if (!st) return false;

            var me = this.me();
            if (me && me.id === st.id) return true;

            return !!this.adminUnlocked;
        },

        // 校验失败次数过多时的锁定（内存态，刷新即解除）
        _fails: {},

        isLocked(studentId) {
            var f = this._fails[studentId];
            return !!(f && f.until && f.until > Date.now());
        },

        _noteFail(studentId) {
            var f = this._fails[studentId] || { count: 0, until: 0 };
            f.count += 1;

            if (f.count >= 3) {
                f.count = 0;
                f.until = Date.now() + 30000;
            }

            this._fails[studentId] = f;
        },

        _clearFail(studentId) {
            delete this._fails[studentId];
        },

        async login(studentId, input) {
            var st = this.getById(studentId);
            if (!st) return { ok: false, reason: 'notfound' };
            if (!st.verifyKey) return { ok: false, reason: 'nopwd' };
            if (this.isLocked(studentId)) return { ok: false, reason: 'locked' };

            var cred = await App.PlazaCrypto.verifyInput(input, {
                pwdSalt: st.pwdSalt,
                pwdIters: st.pwdIters,
                verifyKey: st.verifyKey,
                pwdLen: st.pwdLen
            });

            if (!cred) {
                this._noteFail(studentId);
                return { ok: false, reason: 'bad' };
            }

            this._clearFail(studentId);
            this.session = {
                studentId: st.id,
                password: cred.password,
                aesKey: cred.aesKey
            };

            await this.warmSecrets();
            this.emit();

            return { ok: true };
        },

        logout() {
            // 明文密码和各种 AES 密钥只留在内存里，退出时必须清干净
            this.session = null;
            this.secretCache = {};
            this.emit();
        },

        // ------------------------------------------------------
        // 私密字段（隐藏的生日）
        //
        // 用「数据密钥」模型，而不是直接拿密码派生密钥加密内容：
        //   data = AES-GCM(明文, DEK)            DEK 是每人的一把随机密钥
        //   own  = AES-GCM(DEK, 本人密码派生的密钥)
        //   adm  = RSA-OAEP(DEK, 管理员公钥)
        //
        // 好处是改密码时只需重新包一份 DEK（内容不用动），
        // 而且管理员也能解开——两边拿到的是同一把 DEK。
        // 用公钥包 adm 还意味着：同学隐藏生日时不需要管理员在场解锁，
        // 只要管理员密码设过（公钥已经落盘）就行。
        // ------------------------------------------------------

        // 取这个人的 DEK。本人用自己的密码密钥解 own，管理员用私钥解 adm
        async _dataKeyFor(st, which) {
            if (!st || !st.secret) return null;

            if (which === 'adm') {
                if (!st.secret.adm || !this.adminPrivateKey) return null;

                var adminWrapped = await App.PlazaCrypto.decryptAsAdmin(
                    st.secret.adm,
                    this.adminPrivateKey
                );

                if (!adminWrapped || !adminWrapped.k) return null;

                return App.PlazaCrypto.importAesKey(adminWrapped.k);
            }

            var payload = st.secret.own;
            var key = this.session ? this.session.aesKey : null;

            if (!payload || !key) return null;

            var wrapped = await App.PlazaCrypto.decrypt(payload, key);
            if (!wrapped || !wrapped.k) return null;

            return App.PlazaCrypto.importAesKey(wrapped.k);
        },

        async _wrapDataKey(dataKeyB64, key) {
            if (!key) return '';
            return App.PlazaCrypto.encrypt({ k: dataKeyB64 }, key);
        },

        // 把所有能解的密文都解一遍，结果缓存进 secretCache
        async warmSecrets() {
            var self = this;
            var me = this.me();

            if (me && me.secret && this.session && this.session.aesKey) {
                await this._decryptInto(me, 'own');
            }

            if (this.adminUnlocked && this.adminPrivateKey) {
                var list = this.data().students;

                for (var i = 0; i < list.length; i++) {
                    if (list[i].secret && list[i].secret.adm) {
                        await this._decryptInto(list[i], 'adm');
                    }
                }
            }
        },

        async _decryptInto(st, which) {
            var dataKey = await this._dataKeyFor(st, which);

            if (!dataKey) {
                if (st.secret) st.secretOrphaned = true;
                // 顺手把缓存清掉，否则界面会一直显示上一次解出来的旧值
                delete this.secretCache[st.id];
                return null;
            }

            var obj = await App.PlazaCrypto.decrypt(st.secret.data, dataKey);

            if (!obj) {
                st.secretOrphaned = true;
                delete this.secretCache[st.id];
                return null;
            }

            st.secretOrphaned = false;
            this.secretCache[st.id] = String(obj.birthday || '');
            return this.secretCache[st.id];
        },

        // 展示用：缓存里有就用缓存，否则用明文
        birthdayForDisplay(st) {
            if (!st) return '';

            if (Object.prototype.hasOwnProperty.call(this.secretCache, st.id)) {
                return this.secretCache[st.id];
            }

            return st.birthday || '';
        },

        // 这个人现在能不能看到自己的生日（解不开时给个提示）
        canReadBirthday(st) {
            if (!st || !st.secret) return true;
            if (Object.prototype.hasOwnProperty.call(this.secretCache, st.id)) return true;
            return false;
        },

        birthdayVisibleTo(st, viewer) {
            if (!st) return false;
            if (viewer && viewer.id === st.id) return true;
            return st.birthdayVisible !== false && !!st.birthday;
        },

        // 读出这个人的生日明文（会写进 secretCache）
        async readBirthdayOf(st) {
            if (!st) return '';

            if (!st.secret) return st.birthday || '';

            if (Object.prototype.hasOwnProperty.call(this.secretCache, st.id)) {
                return this.secretCache[st.id];
            }

            var me = this.me();
            var which = (me && me.id === st.id && this.session && this.session.aesKey) ? 'own' : 'adm';

            await this._decryptInto(st, which);
            return this.secretCache[st.id] || '';
        },

        // 设置生日 + 是否公开。
        // 关掉展示时：随机生成一把 DEK，用它加密内容，
        // 再用本人密码的密钥包一份 own、用管理员公钥包一份 adm。
        // 返回 { ok, reason }
        async setBirthdayFor(st, mmdd, visible) {
            if (!st) return { ok: false, reason: 'notfound' };

            var me = this.me();
            var isSelf = me && me.id === st.id;
            var value = String(mmdd || '').trim();

            if (visible) {
                st.birthday = value;
                st.birthdayVisible = true;
                st.secret = null;
                st.secretOrphaned = false;
                this.secretCache[st.id] = value;
                this.save();
                return { ok: true };
            }

            if (!App.PlazaCrypto.isAvailable()) {
                return { ok: false, reason: 'nocrypto' };
            }

            // 已经是隐藏状态：只改内容，DEK 和两份包装都不用动
            if (st.secret && st.secret.data) {
                var dataKey = await this._dataKeyFor(st, isSelf ? 'own' : 'adm');

                if (!dataKey) {
                    // 解不开就换一把新的 DEK 重新来过（旧内容反正也读不出来）
                    dataKey = null;
                }

                if (dataKey) {
                    // 旧版本可能留下过空的 adm（隐藏时管理员密钥不在内存），
                    // 本人来改生日时顺手用公钥补一份
                    if (!st.secret.adm && isSelf && this.session && this.session.aesKey) {
                        var ownWrapped = await App.PlazaCrypto.decrypt(st.secret.own, this.session.aesKey);
                        var healPub = await this._adminPublicKeyForWrap();

                        if (ownWrapped && ownWrapped.k && healPub) {
                            st.secret.adm = await App.PlazaCrypto.encryptToAdmin({ k: ownWrapped.k }, healPub);
                        }
                    }

                    st.secret.data = await App.PlazaCrypto.encrypt({ birthday: value }, dataKey);
                    st.birthday = '';
                    st.birthdayVisible = false;
                    st.secretOrphaned = false;
                    this.secretCache[st.id] = value;
                    this.save();
                    return { ok: true };
                }
            }

            // 第一次隐藏：需要一把本人的密钥来包 own，还需要管理员公钥来包 adm。
            // 公钥在管理员设密码时就落盘了，所以这里只要求管理员密码「设过」，
            // 不要求管理员此刻解锁。
            if (!this.hasAdmin()) {
                return { ok: false, reason: 'noadm' };
            }

            var adminPub = await this._adminPublicKeyForWrap();

            if (!adminPub) {
                // 管理员密码是旧版本设的，还没有公钥；需要管理员解锁一次完成升级
                return { ok: false, reason: 'admigrate' };
            }

            // 管理员手里只有管理员私钥，包不了别人那份 own，所以只有本人能设置
            if (!isSelf) {
                return { ok: false, reason: 'needself' };
            }

            var ownKey = this.session ? this.session.aesKey : null;
            if (!ownKey) return { ok: false, reason: 'nokey' };

            var dekB64 = App.PlazaCrypto.newDataKey();
            var dek = await App.PlazaCrypto.importAesKey(dekB64);
            if (!dek) return { ok: false, reason: 'nocrypto' };

            var admWrapped = await App.PlazaCrypto.encryptToAdmin({ k: dekB64 }, adminPub);
            if (!admWrapped) return { ok: false, reason: 'nocrypto' };

            st.secret = {
                data: await App.PlazaCrypto.encrypt({ birthday: value }, dek),
                own: await this._wrapDataKey(dekB64, ownKey),
                adm: admWrapped
            };

            st.birthday = '';
            st.birthdayVisible = false;
            st.secretOrphaned = false;
            this.secretCache[st.id] = value;

            this.save();
            return { ok: true };
        },

        // 本人改密码：只重新包一份 own，内容和其他都不用动
        async changePassword(currentInput, newPassword) {
            var me = this.me();
            if (!me) return { ok: false, reason: 'notlogin' };
            if (this.isLocked(me.id)) return { ok: false, reason: 'locked' };

            var cred = await App.PlazaCrypto.verifyInput(currentInput, {
                pwdSalt: me.pwdSalt,
                pwdIters: me.pwdIters,
                verifyKey: me.verifyKey,
                pwdLen: me.pwdLen
            });

            if (!cred) {
                this._noteFail(me.id);
                return { ok: false, reason: 'bad' };
            }

            this._clearFail(me.id);

            var fresh = await App.PlazaCrypto.createCredential(newPassword);

            // 先把自己那份 DEK 解出来，再用新密码重新包一遍
            if (me.secret && me.secret.own) {
                var wrapped = await App.PlazaCrypto.decrypt(me.secret.own, cred.aesKey);

                if (!wrapped || !wrapped.k) {
                    me.secretOrphaned = true;
                    this.save();
                    return { ok: false, reason: 'orphaned' };
                }

                me.secret.own = await this._wrapDataKey(wrapped.k, fresh.aesKey);
                me.secretOrphaned = false;
            }

            me.pwdSalt = fresh.pwdSalt;
            me.pwdIters = fresh.pwdIters;
            me.verifyKey = fresh.verifyKey;
            me.pwdLen = fresh.pwdLen;
            me.pwdUpdatedAt = Date.now();

            this.session = {
                studentId: me.id,
                password: String(newPassword),
                aesKey: fresh.aesKey
            };

            this.save();
            return { ok: true };
        },

        // ------------------------------------------------------
        // 管理员
        // ------------------------------------------------------

        hasAdmin() {
            var a = this.data().admin;
            return !!(a && a.verifyKey && a.pwdSalt);
        },

        // 首次设置管理员密码
        async setAdminPassword(password) {
            var cred = await App.PlazaCrypto.createCredential(password);
            var pair = await App.PlazaCrypto.createAdminKeyPair();

            this.data().admin = {
                pwdSalt: cred.pwdSalt,
                pwdIters: cred.pwdIters,
                verifyKey: cred.verifyKey,
                pwdLen: cred.pwdLen,
                setAt: Date.now(),

                // 公钥明文存盘（同学隐藏生日时要拿它包 adm）；
                // 私钥用管理员密码派生的密钥加密后存盘
                pub: pair.pubB64,
                priv: await App.PlazaCrypto.encrypt({ k: pair.privB64 }, cred.aesKey)
            };

            this.adminKey = cred.aesKey;
            this.adminPublicKey = pair.publicKey;
            this.adminPrivateKey = pair.privateKey;
            this.adminUnlocked = true;
            this.save();
            await this.warmSecrets();
            return { ok: true };
        },

        // 解锁后把私钥装进内存；旧版本的数据顺便升级成公钥方案
        async _loadAdminKeyPair(aesKey) {
            var a = this.data().admin;
            if (!a) return;

            if (a.pub) {
                this.adminPublicKey = await App.PlazaCrypto.importAdminPublicKey(a.pub);

                var wrapped = a.priv
                    ? await App.PlazaCrypto.decrypt(a.priv, aesKey)
                    : null;

                this.adminPrivateKey = wrapped && wrapped.k
                    ? await App.PlazaCrypto.importAdminPrivateKey(wrapped.k)
                    : null;

                return;
            }

            // 旧格式：secret.adm 是用管理员密码派生的 AES 密钥直接包的。
            // 借这次解锁生成一对 RSA 密钥，把现有的 adm 全部改包一遍。
            var pair = await App.PlazaCrypto.createAdminKeyPair();
            var list = this.data().students;

            for (var i = 0; i < list.length; i++) {
                var st = list[i];
                if (!st.secret || !st.secret.adm) continue;

                var old = await App.PlazaCrypto.decrypt(st.secret.adm, aesKey);

                if (old && old.k) {
                    var rewrapped = await App.PlazaCrypto.encryptToAdmin({ k: old.k }, pair.publicKey);
                    if (rewrapped) st.secret.adm = rewrapped;
                } else {
                    // 解不开就保持原样，别把可能还有用的密文覆盖掉
                    st.secretOrphaned = true;
                }
            }

            a.pub = pair.pubB64;
            a.priv = await App.PlazaCrypto.encrypt({ k: pair.privB64 }, aesKey);
            this.adminPublicKey = pair.publicKey;
            this.adminPrivateKey = pair.privateKey;
            this.save();
        },

        // 拿管理员公钥来包 adm。公钥是明文存盘的，没解锁也能用
        async _adminPublicKeyForWrap() {
            if (this.adminPublicKey) return this.adminPublicKey;

            var a = this.data().admin;
            if (!a || !a.pub) return null;

            this.adminPublicKey = await App.PlazaCrypto.importAdminPublicKey(a.pub);
            return this.adminPublicKey;
        },

        // 修改管理员密码：只需用新密钥重新加密私钥；
        // 所有人的 secret.adm 是用公钥包的，不受管理员密码影响
        async changeAdminPassword(newPassword) {
            if (!this.adminUnlocked || !this.adminKey) {
                return { ok: false, reason: 'locked' };
            }

            var fresh = await App.PlazaCrypto.createCredential(newPassword);
            var a = this.data().admin || {};

            if (a.priv) {
                var wrapped = await App.PlazaCrypto.decrypt(a.priv, this.adminKey);

                // 私钥解不开就别改密码，否则旧密码失效后私钥就永久打不开了
                if (!wrapped || !wrapped.k) {
                    return { ok: false, reason: 'broken' };
                }

                a.priv = await App.PlazaCrypto.encrypt({ k: wrapped.k }, fresh.aesKey);
            }

            a.pwdSalt = fresh.pwdSalt;
            a.pwdIters = fresh.pwdIters;
            a.verifyKey = fresh.verifyKey;
            a.pwdLen = fresh.pwdLen;
            a.setAt = Date.now();
            this.data().admin = a;

            this.adminKey = fresh.aesKey;
            this.save();

            return { ok: true, broken: 0 };
        },

        async unlockAdmin(input) {
            var a = this.data().admin;
            if (!a) return { ok: false, reason: 'noadmin' };
            if (this.isLocked('__admin__')) return { ok: false, reason: 'locked' };

            var cred = await App.PlazaCrypto.verifyInput(input, {
                pwdSalt: a.pwdSalt,
                pwdIters: a.pwdIters,
                verifyKey: a.verifyKey,
                pwdLen: a.pwdLen
            });

            if (!cred) {
                this._noteFail('__admin__');
                return { ok: false, reason: 'bad' };
            }

            this._clearFail('__admin__');
            this.adminUnlocked = true;
            this.adminKey = cred.aesKey;

            await this._loadAdminKeyPair(cred.aesKey);
            await this.warmSecrets();
            this.emit();

            return { ok: true };
        },

        lockAdmin() {
            this.adminUnlocked = false;
            this.adminKey = null;
            this.adminPublicKey = null;
            this.adminPrivateKey = null;

            // 管理员解出来的那些明文不能留着
            this.secretCache = {};
            var me = this.me();
            if (me) this.warmSecrets();
        },

        // 发一份新密码。如果这位同学藏着生日，会顺手用新密码重新包一份 own，
        // 这样他拿到新密码后还能看到自己的生日（管理员那边本来就能看）
        async issuePassword(st, digits) {
            var len = Number(digits) || 8;
            var pwd = this.randomDigits(len);
            var cred = await App.PlazaCrypto.createCredential(pwd);

            if (st.secret && st.secret.adm) {
                // 用管理员私钥解出 DEK（没解锁就放弃重包）
                var wrapped = this.adminPrivateKey
                    ? await App.PlazaCrypto.decryptAsAdmin(st.secret.adm, this.adminPrivateKey)
                    : null;

                if (wrapped && wrapped.k) {
                    st.secret.own = await this._wrapDataKey(wrapped.k, cred.aesKey);
                    st.secretOrphaned = false;
                } else {
                    st.secretOrphaned = true;
                }
            }

            st.pwdSalt = cred.pwdSalt;
            st.pwdIters = cred.pwdIters;
            st.verifyKey = cred.verifyKey;
            st.pwdLen = cred.pwdLen;
            st.pwdUpdatedAt = Date.now();

            this.save();
            return pwd;
        },

        clearPassword(st) {
            if (st.secret) st.secretOrphaned = true;

            st.pwdSalt = '';
            st.verifyKey = '';
            st.pwdLen = 0;
            st.pwdUpdatedAt = Date.now();
            this.save();
        },

        // 纯数字，首位避开 0，避免被 Excel 当成数字吃掉前导零
        randomDigits(len) {
            var out = '';
            var first = '123456789';

            out += first[Math.floor(Math.random() * first.length)];
            for (var i = 1; i < len; i++) {
                out += String(Math.floor(Math.random() * 10));
            }

            return out;
        },

        // 把某个同学的密码设成指定值（批量初始化用）
        async setPasswordTo(st, pwd) {
            var cred = await App.PlazaCrypto.createCredential(pwd);

            if (st.secret && st.secret.adm && this.adminPrivateKey) {
                var wrapped = await App.PlazaCrypto.decryptAsAdmin(st.secret.adm, this.adminPrivateKey);

                if (wrapped && wrapped.k) {
                    st.secret.own = await this._wrapDataKey(wrapped.k, cred.aesKey);
                    st.secretOrphaned = false;
                }
            }

            st.pwdSalt = cred.pwdSalt;
            st.pwdIters = cred.pwdIters;
            st.verifyKey = cred.verifyKey;
            st.pwdLen = String(pwd).length;
            st.pwdUpdatedAt = Date.now();

            this.save();
            return pwd;
        },

        // ------------------------------------------------------
        // 清洗：任何一次读写之前都跑一遍，保证结构可用
        // ------------------------------------------------------

        sanitize() {
            var d = this.data();
            var seen = {};
            var list = d.students;

            list.forEach(function (st, index) {
                if (!st || typeof st !== 'object') {
                    list[index] = {};
                    st = list[index];
                }

                var id = String(st.id || '').trim();
                if (!id || seen[id]) {
                    id = 'tmp' + index + '_' + Math.random().toString(36).slice(2, 7);
                }
                seen[id] = true;
                st.id = id;

                if (typeof st.order !== 'number' || !isFinite(st.order)) st.order = index + 1;

                ['realName', 'studentNo', 'nickname', 'signature', 'intro', 'birthday']
                    .forEach(function (k) {
                        st[k] = String(st[k] == null ? '' : st[k]);
                    });

                st.gender = st.gender === 'male' || st.gender === 'female' ? st.gender : '';
                st.birthdayVisible = st.birthdayVisible !== false;
                st.archived = st.archived === true;
                st.secretOrphaned = st.secretOrphaned === true;

                st.pwdSalt = String(st.pwdSalt == null ? '' : st.pwdSalt);
                st.verifyKey = String(st.verifyKey == null ? '' : st.verifyKey);
                st.pwdLen = Number(st.pwdLen) || 0;
                st.pwdIters = Number(st.pwdIters) || App.PlazaCrypto.DEFAULT_ITERS;
                st.pwdUpdatedAt = Number(st.pwdUpdatedAt) || 0;

                if (!Array.isArray(st.following)) st.following = [];

                // ---- 密文结构 ----
                if (!st.secret || typeof st.secret !== 'object' || Array.isArray(st.secret)) {
                    st.secret = null;
                } else {
                    st.secret = {
                        data: String(st.secret.data || ''),
                        own: String(st.secret.own || ''),
                        adm: String(st.secret.adm || '')
                    };

                    if (!st.secret.data) st.secret = null;
                }

                if (st.birthdayVisible) {
                    st.secret = null;
                    st.secretOrphaned = false;
                } else if (!st.secret) {
                    // 开关关着却没有密文。旧版本「取消隐藏」漏改开关时会留下
                    // birthdayVisible=false + 明文生日 + 没有密文的状态：
                    // 生日还在就当作已公开，别把明文清掉。
                    if (st.birthday) {
                        st.birthdayVisible = true;
                    } else {
                        st.birthday = '';
                    }
                } else {
                    st.birthday = '';
                }

                // ---- 点赞：从旧的 likedBy 数组迁移过来 ----
                if (Array.isArray(st.likedBy)) {
                    if (!st.likes || typeof st.likes !== 'object') {
                        st.likes = { total: st.likedBy.length, days: {} };
                    }
                    delete st.likedBy;
                }

                if (!st.likes || typeof st.likes !== 'object' || Array.isArray(st.likes)) {
                    st.likes = { total: 0, days: {} };
                }

                st.likes.total = Number(st.likes.total) || 0;

                if (!st.likes.days || typeof st.likes.days !== 'object' || Array.isArray(st.likes.days)) {
                    st.likes.days = {};
                }
            });

            // 清掉指向不存在的人的关系，顺带去重、去自指
            var validIds = {};
            list.forEach(function (st) { validIds[st.id] = true; });

            list.forEach(function (st) {
                st.following = unique(st.following)
                    .filter(function (id) { return id !== st.id && validIds[id]; });

                Object.keys(st.likes.days).forEach(function (day) {
                    var entry = st.likes.days[day];

                    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
                        delete st.likes.days[day];
                        return;
                    }

                    Object.keys(entry).forEach(function (likerId) {
                        var n = Number(entry[likerId]) || 0;

                        if (likerId === st.id || !validIds[likerId] || n <= 0) {
                            delete entry[likerId];
                            return;
                        }

                        entry[likerId] = n;
                    });

                    if (!Object.keys(entry).length) delete st.likes.days[day];
                });
            });

            function unique(arr) {
                var out = [];
                arr.forEach(function (v) {
                    var s = String(v == null ? '' : v);
                    if (s && out.indexOf(s) === -1) out.push(s);
                });
                return out;
            }
        },

        // ------------------------------------------------------
        // 图片：读取 → 居中裁切 → 压成 WebP/JPEG 的 dataURL
        // ------------------------------------------------------

        AVATAR_OPTS: { width: 256, height: 256, quality: 0.8, maxBytes: 40960 },
        COVER_OPTS: { width: 960, height: 320, quality: 0.75, maxBytes: 122880 },

        _webpSupport: null,

        supportsWebp() {
            if (this._webpSupport !== null) return this._webpSupport;

            try {
                var c = document.createElement('canvas');
                c.width = 1;
                c.height = 1;
                this._webpSupport = c.toDataURL('image/webp').indexOf('data:image/webp') === 0;
            } catch (e) {
                this._webpSupport = false;
            }

            return this._webpSupport;
        },

        _readFile(file) {
            return new Promise(function (resolve, reject) {
                var reader = new FileReader();
                reader.onload = function () { resolve(reader.result); };
                reader.onerror = function () { reject(new Error('文件读取失败')); };
                reader.readAsDataURL(file);
            });
        },

        _loadImage(src) {
            return new Promise(function (resolve, reject) {
                var img = new Image();
                img.onload = function () { resolve(img); };
                img.onerror = function () { reject(new Error('图片解析失败')); };
                img.src = src;
            });
        },

        _dataUrlBytes(dataUrl) {
            var idx = dataUrl.indexOf(',');
            if (idx < 0) return 0;
            return Math.floor((dataUrl.length - idx - 1) * 3 / 4);
        },

        // 返回 { data, bytes, tooBig }
        async compressImage(file, opts) {
            var options = opts || this.AVATAR_OPTS;
            var raw = await this._readFile(file);
            var img = await this._loadImage(raw);

            var targetRatio = options.width / options.height;
            var srcRatio = img.width / img.height;
            var sw, sh, sx, sy;

            if (srcRatio > targetRatio) {
                sh = img.height;
                sw = sh * targetRatio;
                sx = (img.width - sw) / 2;
                sy = 0;
            } else {
                sw = img.width;
                sh = sw / targetRatio;
                sx = 0;
                sy = (img.height - sh) / 2;
            }

            var canvas = document.createElement('canvas');
            canvas.width = options.width;
            canvas.height = options.height;

            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, sx, sy, sw, sh, 0, 0, options.width, options.height);

            var mime = this.supportsWebp() ? 'image/webp' : 'image/jpeg';
            var quality = options.quality;
            var data = canvas.toDataURL(mime, quality);

            while (this._dataUrlBytes(data) > options.maxBytes && quality > 0.36) {
                quality -= 0.12;
                data = canvas.toDataURL(mime, quality);
            }

            var bytes = this._dataUrlBytes(data);

            return { data: data, bytes: bytes, tooBig: bytes > options.maxBytes };
        },

        // ------------------------------------------------------
        // 小工具
        // ------------------------------------------------------

        escape(value) {
            return App.Utils && App.Utils.escapeHtml
                ? App.Utils.escapeHtml(value)
                : String(value == null ? '' : value);
        },

        // 用于搜索：昵称 + 真实姓名 + 学号
        matches(st, query) {
            var q = String(query || '').trim();
            if (!q) return true;

            var pinyin = App.Pinyin;

            if (!pinyin || !pinyin.matchPrefix) {
                var low = q.toLowerCase();
                return [st.nickname, st.realName, st.studentNo].some(function (v) {
                    return String(v || '').toLowerCase().indexOf(low) >= 0;
                });
            }

            if (pinyin.matchPrefix(st.nickname || '', q)) return true;
            if (pinyin.matchPrefix(st.realName || '', q)) return true;

            return String(st.studentNo || '').indexOf(q) >= 0;
        },

        sortStudents(list, mode) {
            var self = this;
            var out = list.slice();

            if (mode === 'likes') {
                out.sort(function (a, b) { return self.likeCount(b) - self.likeCount(a); });
                return out;
            }

            if (mode === 'fans') {
                out.sort(function (a, b) {
                    return self.followerList(b.id).length - self.followerList(a.id).length;
                });
                return out;
            }

            if (mode === 'recent') {
                out.sort(function (a, b) { return (b.pwdUpdatedAt || 0) - (a.pwdUpdatedAt || 0); });
                return out;
            }

            if (mode === 'name') {
                out.sort(function (a, b) {
                    return self.displayName(a).localeCompare(self.displayName(b), 'zh-Hans-CN');
                });
                return out;
            }

            // 默认：按学号，没学号的排最后、按姓名拼音
            out.sort(function (a, b) {
                var na = String(a.studentNo || '').trim();
                var nb = String(b.studentNo || '').trim();

                if (na && nb) return na.localeCompare(nb, 'zh-Hans-CN');
                if (na) return -1;
                if (nb) return 1;

                return self.displayName(a).localeCompare(self.displayName(b), 'zh-Hans-CN');
            });

            return out;
        },

        // 轻提示
        //
        // 挂在 document.body 上而不是 #pageContent 里：
        // #pageContent 的高度被钉死在 1080px，而缩放只按宽度算，
        // 窗口比 16:9 更宽或更矮时页面底部会超出视口，
        // 挂在里面的浮层就会掉到屏幕外面去。body 上则是纯视口坐标，永远可见。
        toast(text, ms) {
            var host = document.body;
            if (!host) return;

            var el = document.createElement('div');
            el.className = 'plaza-toast';
            el.textContent = text;

            // 页面是整体缩放的，浮层在缩放之外，所以字号要手动跟着缩放，
            // 看起来才和页面里的文字一样大
            var page = document.getElementById('pageContent');
            var zoom = page ? (parseFloat(page.style.zoom) || 1) : 1;

            el.style.fontSize = (16 * zoom).toFixed(2) + 'px';
            el.style.padding = (13 * zoom).toFixed(2) + 'px ' + (26 * zoom).toFixed(2) + 'px';
            el.style.bottom = (90 * zoom).toFixed(2) + 'px';

            host.appendChild(el);

            requestAnimationFrame(function () { el.classList.add('show'); });

            setTimeout(function () {
                el.classList.remove('show');
                setTimeout(function () {
                    if (el.parentNode) el.parentNode.removeChild(el);
                }, 300);
            }, ms || 2000);
        }
    };
})();
