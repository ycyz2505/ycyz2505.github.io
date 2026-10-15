// ============================================================
// js/features/modal_plaza.js
// 广场：卡片网格（搜索 / 筛选 / 排序）、关注与点赞、标题栏身份胶囊，
//       以及登录小模态框
//
// 依赖 plaza_core.js（数据层）。所有用户输入进 innerHTML 前都过 escape。
// ============================================================

window.App = window.App || {};

(function () {
    'use strict';

    var App = window.App;

    var PAGE_W = 1920;
    var PAGE_H = 1080;
    var POPOVER_W = 300;

    App.ModalPlaza = {
        el: {},
        query: '',
        filter: 'all',
        sort: 'default',

        _inited: false,
        _popover: null,
        _loginTarget: null,
        // 数字小键盘自己维护的插入位置（不聚焦输入框，见 onVirtualKey）
        _caret: 0,
        // 未登录时点了关注/点赞，登录成功后补上
        _pending: null,
        _busy: false,

        // ------------------------------------------------------
        // 初始化
        // ------------------------------------------------------

        init() {
            if (this._inited) return;

            this.cacheEls();
            this.bind();

            var self = this;
            App.Plaza.on(function () { self.refresh(); });

            this.refresh();
            this._inited = true;
        },

        cacheEls() {
            var ids = {
                modal: 'plazaModal',
                close: 'closePlaza',
                account: 'plazaAccount',
                search: 'plazaSearchInput',
                searchClear: 'plazaSearchClear',
                filter: 'plazaFilter',
                sort: 'plazaSort',
                count: 'plazaCount',
                grid: 'plazaGrid',
                empty: 'plazaEmpty',

                loginModal: 'plazaLoginModal',
                loginClose: 'closePlazaLogin',
                loginSearch: 'plazaLoginSearch',
                loginSelect: 'plazaLoginSelect',
                loginPassword: 'plazaLoginPassword',
                loginNote: 'plazaLoginNote',
                loginSubmit: 'plazaLoginSubmit',
                loginCancel: 'plazaLoginCancel',
                keypad: 'plazaKeypad'
            };

            var self = this;
            Object.keys(ids).forEach(function (k) {
                self.el[k] = document.getElementById(ids[k]);
            });
        },

        bind() {
            var self = this;

            // ---------- 广场 ----------

            this.el.search?.addEventListener('input', function (e) {
                self.query = e.target.value;
                if (self.el.searchClear) {
                    self.el.searchClear.style.display = self.query ? 'block' : 'none';
                }
                self.renderGrid();
            });

            this.el.searchClear?.addEventListener('click', function () {
                self.el.search.value = '';
                self.query = '';
                self.el.searchClear.style.display = 'none';
                self.renderGrid();
                self.el.search.focus();
            });

            this.el.filter?.addEventListener('change', function (e) {
                self.filter = e.target.value;
                self.renderGrid();
            });

            this.el.sort?.addEventListener('change', function (e) {
                self.sort = e.target.value;
                self.renderGrid();
            });

            this.el.grid?.addEventListener('click', function (e) {
                self.onGridClick(e);
            });

            this.el.account?.addEventListener('click', function (e) {
                self.onAccountClick(e);
            });

            // 每次打开广场都刷一遍：本地服务的连接状态可能已经变了
            document.getElementById('plazaButton')?.addEventListener('click', function () {
                self.refresh();
            });

            // 关闭广场：如果个人空间还开着就不退登，等空间也关掉才退
            this.el.close?.addEventListener('click', function () {
                setTimeout(function () { self.checkSessionAlive(); }, 0);
            });

            // ---------- 登录框 ----------

            this.el.loginSearch?.addEventListener('input', function () {
                self.renderLoginOptions();
            });

            this.el.loginSelect?.addEventListener('change', function () {
                self.selectLoginTarget(self.el.loginSelect.value);
            });

            // 数字小键盘：和座位表一样，键盘操作全程不聚焦输入框
            // （触屏设备一旦聚焦输入框就会弹出系统自带键盘）
            this.el.keypad?.addEventListener('click', function (e) {
                var btn = e.target.closest('[data-key]');
                if (!btn) return;
                e.preventDefault();
                self.onVirtualKey(btn.dataset.key);
            });

            // 用真实键盘打字时同步光标位置
            ['keyup', 'click', 'select', 'focus'].forEach(function (evt) {
                self.el.loginPassword?.addEventListener(evt, function () {
                    self.syncCaret();
                });
            });

            this.el.loginSubmit?.addEventListener('click', function () {
                self.submitLogin();
            });

            this.el.loginCancel?.addEventListener('click', function () {
                self.closeLogin();
            });

            this.el.loginClose?.addEventListener('click', function () {
                self.closeLogin();
            });

            this.el.loginPassword?.addEventListener('keydown', function (e) {
                if (e.key === 'Enter') self.submitLogin();
            });

            // 点空白处收起浮层
            document.addEventListener('click', function (e) {
                if (self._popover && !self._popover.contains(e.target) &&
                    !e.target.closest('.plaza-stat')) {
                    self.hidePopover();
                }
                if (e.target.closest('.plaza-identity-menu')) return;
                if (!e.target.closest('.plaza-more-btn')) self.hideIdentityMenu();
            });
        },

        // 关闭广场或空间后，两个都关掉了才退登
        checkSessionAlive() {
            var plaza = document.getElementById('plazaModal');
            var space = document.getElementById('spaceModal');

            var plazaOpen = plaza && plaza.classList.contains('active');
            var spaceOpen = space && space.classList.contains('active');

            if (!plazaOpen && !spaceOpen && App.Plaza.isLoggedIn()) {
                App.Plaza.logout();
                App.Plaza.toast('已退出登录');
            }
        },

        // ------------------------------------------------------
        // 刷新
        // ------------------------------------------------------

        refresh() {
            this.renderReadonlyBanner();
            this.renderAccount();
            this.renderGrid();
        },

        // 本地服务没起来时明确提示一句，免得同学以为关注成功了
        renderReadonlyBanner() {
            var el = document.getElementById('plazaReadonly');
            if (!el) return;

            var offline = App.Store && !App.Store.available;
            el.style.display = offline ? 'block' : 'none';
        },

        // ------------------------------------------------------
        // 标题栏：登录按钮 / 身份胶囊
        // ------------------------------------------------------

        renderAccount() {
            var host = this.el.account;
            if (!host) return;

            var esc = App.Plaza.escape;
            var me = App.Plaza.me();

            if (!me) {
                host.innerHTML =
                    '<button type="button" class="plaza-login-btn" data-act="open-login">登录</button>';
                return;
            }

            host.innerHTML =
                '<div class="plaza-identity">' +
                    '<span class="plaza-identity-avatar" style="' + this.avatarStyle(me) + '">' +
                        this.avatarInner(me) +
                    '</span>' +
                    '<span class="plaza-identity-name">' + esc(App.Plaza.displayName(me)) + '</span>' +
                    '<button type="button" class="plaza-space-btn" data-act="enter-space">🏠 进入空间</button>' +
                    '<button type="button" class="plaza-more-btn" data-act="toggle-menu" aria-label="更多">⌄</button>' +
                    '<div class="plaza-identity-menu">' +
                        '<button type="button" data-act="change-pwd">🔑 修改密码</button>' +
                        '<button type="button" data-act="logout">↩ 退出登录</button>' +
                    '</div>' +
                '</div>';
        },

        hideIdentityMenu() {
            var menu = this.el.account?.querySelector('.plaza-identity-menu');
            if (menu) menu.classList.remove('open');
        },

        onAccountClick(e) {
            var btn = e.target.closest('[data-act]');
            if (!btn) return;

            var act = btn.dataset.act;

            if (act === 'open-login') {
                this.openLogin();
                return;
            }

            if (act === 'toggle-menu') {
                var menu = this.el.account.querySelector('.plaza-identity-menu');
                if (menu) menu.classList.toggle('open');
                return;
            }

            if (act === 'enter-space') {
                this.hideIdentityMenu();
                App.ModalSpace?.open(App.Plaza.session.studentId);
                return;
            }

            if (act === 'change-pwd') {
                this.hideIdentityMenu();
                App.ModalSpace?.openPasswordPanel();
                return;
            }

            if (act === 'logout') {
                this.hideIdentityMenu();
                App.Plaza.logout();
                App.Plaza.toast('已退出登录');
            }
        },

        // ------------------------------------------------------
        // 卡片网格
        // ------------------------------------------------------

        visibleStudents() {
            var me = App.Plaza.me();
            var list = App.Plaza.students();
            var self = this;

            if (this.filter !== 'all' && me) {
                list = list.filter(function (st) {
                    if (st.id === me.id) return false;

                    if (self.filter === 'following') return App.Plaza.isFollowing(me, st.id);
                    if (self.filter === 'followers') return App.Plaza.isFollowing(st, me.id);
                    if (self.filter === 'mutual') return App.Plaza.isMutual(me, st);
                    if (self.filter === 'unfollowed') return !App.Plaza.isFollowing(me, st.id);

                    return true;
                });
            }

            if (this.query) {
                list = list.filter(function (st) { return App.Plaza.matches(st, self.query); });
            }

            return App.Plaza.sortStudents(list, this.sort);
        },

        renderGrid() {
            var grid = this.el.grid;
            var empty = this.el.empty;
            if (!grid) return;

            this.hidePopover();

            var all = App.Plaza.students();

            if (!all.length) {
                grid.innerHTML = '';
                grid.style.display = 'none';
                if (empty) {
                    empty.style.display = 'flex';
                    empty.innerHTML =
                        '<div class="plaza-empty-icon">🏛</div>' +
                        '<div>还没有同学名单</div>' +
                        '<div class="plaza-empty-sub">请到「设置 → 名单管理」里录入，<br>或在名单管理里点「从座位表导入」一键生成。</div>';
                }
                if (this.el.count) this.el.count.textContent = '';
                return;
            }

            var list = this.visibleStudents();

            if (!list.length) {
                grid.innerHTML = '';
                grid.style.display = 'none';
                if (empty) {
                    empty.style.display = 'flex';
                    empty.innerHTML =
                        '<div class="plaza-empty-icon">🔍</div>' +
                        '<div>' + (this.query ? '没有找到匹配的同学' : this.emptyFilterText()) + '</div>';
                }
                if (this.el.count) this.el.count.textContent = '';
                return;
            }

            grid.style.display = 'grid';
            if (empty) empty.style.display = 'none';

            // 跟随设置里的「金句动画效果」开关：关掉就整片不动画
            var animOn = App.Store ? App.Store.getSetting('animationSwitch') !== false : true;
            grid.classList.toggle('no-anim', !animOn);

            var self = this;
            grid.innerHTML = list.map(function (st, i) {
                return self.cardHtml(st, i);
            }).join('');

            if (this.el.count) {
                this.el.count.textContent = this.countText(list.length, all.length);
            }
        },

        emptyFilterText() {
            if (this.filter === 'following') return '你还没有关注任何人';
            if (this.filter === 'followers') return '还没有人关注你';
            if (this.filter === 'mutual') return '还没有互相关注的同学';
            if (this.filter === 'unfollowed') return '全班都被你关注了 🎉';
            return '没有找到匹配的同学';
        },

        countText(shown, total) {
            if (shown === total) return '共 ' + total + ' 人';
            return shown + ' / ' + total + ' 人';
        },

        // ------------------------------------------------------
        // 单张卡片
        // ------------------------------------------------------

        // opts.inert = true 时渲染成纯展示卡片（个人空间左栏的预览用）
        // opts.big   = true 时用放大版尺寸
        cardHtml(st, index, opts) {
            var options = opts || {};
            var inert = !!options.inert;
            var esc = App.Plaza.escape;
            var me = App.Plaza.me();
            var isSelf = !!me && me.id === st.id;
            var mutual = !!me && !isSelf && App.Plaza.isMutual(me, st);
            var following = !!me && !isSelf && App.Plaza.isFollowing(me, st.id);

            // 点赞是「每人每天对每个人最多 50 次」的计数，不是开关
            var myToday = me && !isSelf ? App.Plaza.likesTodayFrom(st, me.id) : 0;
            var atLimit = myToday >= App.Plaza.MAX_DAILY_LIKES;

            var name = App.Plaza.displayName(st);
            var nameUnset = name === '未设置';

            // 副行：真实姓名 · 性别 · 学号（昵称空时主标识已经是真实姓名，不重复）
            var parts = [];
            if (App.Plaza.hasNickname(st)) {
                parts.push({ text: st.realName || '未设置', unset: !st.realName });
            }
            parts.push({ text: this.genderText(st.gender), unset: !st.gender });
            parts.push({ text: st.studentNo || '未设置', unset: !st.studentNo });

            var metaHtml = parts.map(function (p) {
                return '<span' + (p.unset ? ' class="unset"' : '') + '>' + esc(p.text) + '</span>';
            }).join('<span class="sep">·</span>');

            // 生日：本人始终看得到（关掉展示后从内存里取解密结果）
            var birthday = App.Plaza.birthdayVisibleTo(st, me)
                ? App.Plaza.formatBirthday(App.Plaza.birthdayForDisplay(st))
                : '';

            var sign = String(st.signature || '').trim();
            var intro = String(st.intro || '').trim();

            // 自己的卡片永远是纯展示；别人的卡片在预览态（个人空间左栏）也是
            var cls, label;
            if (isSelf) {
                cls = 'plaza-follow self';
                label = '这是你';
            } else if (mutual) {
                cls = 'plaza-follow mutual';
                label = '互相关注';
            } else if (following) {
                cls = 'plaza-follow following';
                label = '已关注';
            } else {
                cls = 'plaza-follow';
                label = '+ 关注';
            }

            var followHtml = (inert || isSelf)
                ? '<span class="' + cls + '">' + label + '</span>'
                : '<button type="button" class="' + cls + '" data-act="follow">' + label + '</button>';

            var cover = App.Plaza.coverUrl(st);
            var coverStyle = cover
                ? 'background-image:url(\'' + cover.replace(/'/g, '%27') + '\')'
                : '';

            var stat = function (cls, act, title, inner) {
                return inert
                    ? '<span class="plaza-stat ' + cls + '" title="' + title + '">' + inner + '</span>'
                    : '<button type="button" class="plaza-stat ' + cls + '" data-act="' + act +
                        '" title="' + title + '">' + inner + '</button>';
            };

            var likeInner =
                '<span class="plaza-heart">' + (myToday > 0 ? '❤' : '♡') + '</span>' +
                '<b>' + App.Plaza.likeCount(st) + '</b>';

            var likeTitle = isSelf
                ? '这是你自己'
                : (atLimit
                    ? '今天已经给他点满 ' + App.Plaza.MAX_DAILY_LIKES + ' 个赞了'
                    : '点赞（今日已赞 ' + myToday + ' / ' + App.Plaza.MAX_DAILY_LIKES + '）');

            return '' +
                '<article class="plaza-card' + (options.big ? ' big' : '') + '" data-id="' + esc(st.id) +
                    '" data-index="' + index + '"' +
                    ' style="animation-delay:' + Math.min(index, 12) * 30 + 'ms">' +

                    '<div class="plaza-card-cover' + (cover ? '' : ' is-plain') +
                        '" style="' + coverStyle + '">' +
                        (mutual ? '<span class="plaza-badge-mutual">互相关注</span>' : '') +
                    '</div>' +

                    '<div class="plaza-card-head">' +
                        '<div class="plaza-avatar" style="' + this.avatarStyle(st) + '">' +
                            this.avatarInner(st) +
                            (st.gender ? '<i class="plaza-gender-dot ' + st.gender + '"></i>' : '') +
                        '</div>' +
                    '</div>' +

                    '<div class="plaza-card-info">' +
                        '<div class="plaza-card-name' + (nameUnset ? ' unset' : '') + '">' + esc(name) + '</div>' +
                        '<div class="plaza-card-meta">' + metaHtml + '</div>' +
                        (birthday ? '<div class="plaza-card-birth">🎂 ' + esc(birthday) + '</div>' : '') +
                        (sign ? '<div class="plaza-card-sign">「 ' + esc(sign) + ' 」</div>' : '') +
                    '</div>' +

                    '<div class="plaza-card-intro' + (intro ? '' : ' is-empty') + '">' +
                        esc(intro || '这个人很懒，什么都没写') +
                    '</div>' +

                    '<div class="plaza-card-foot">' +
                        '<div class="plaza-stats">' +
                            stat('plaza-like' + (myToday > 0 ? ' liked' : ''), 'like',
                                likeTitle, likeInner) +
                            stat('', 'following-list', '关注列表',
                                '关注 <b>' + App.Plaza.followingList(st).length + '</b>') +
                            stat('', 'follower-list', '粉丝列表',
                                '粉丝 <b>' + App.Plaza.followerList(st.id).length + '</b>') +
                        '</div>' +
                        '<div class="plaza-card-action">' + followHtml + '</div>' +
                    '</div>' +

                '</article>';
        },

        genderText(g) {
            if (g === 'male') return '男';
            if (g === 'female') return '女';
            return '未设置';
        },

        avatarStyle(st) {
            var g = App.Plaza.gradientOf(st);
            return 'background:linear-gradient(135deg,' + g[0] + ',' + g[1] + ')';
        },

        avatarInner(st) {
            var url = App.Plaza.avatarUrl(st);
            var esc = App.Plaza.escape;

            if (url) return '<img src="' + esc(url) + '" alt="">';
            return '<span class="plaza-avatar-text">' + esc(App.Plaza.initialsOf(st)) + '</span>';
        },

        // ------------------------------------------------------
        // 卡片上的交互
        // ------------------------------------------------------

        onGridClick(e) {
            var card = e.target.closest('.plaza-card');
            if (!card) return;

            var id = card.dataset.id;
            var actEl = e.target.closest('[data-act]');

            if (!actEl) {
                App.ModalSpace?.open(id);
                return;
            }

            var act = actEl.dataset.act;
            var me = App.Plaza.me();

            if (act === 'following-list') {
                var stA = App.Plaza.getById(id);
                this.showList(actEl, '关注列表', App.Plaza.followingList(stA));
                return;
            }

            if (act === 'follower-list') {
                this.showList(actEl, '粉丝列表', App.Plaza.followerList(id));
                return;
            }

            if (!me) {
                // 记下来，登录成功后自动补上这次操作
                this._pending = { act: act, id: id };
                this.openLogin();
                App.Plaza.toast('请先登录');
                return;
            }

            if (act === 'follow') {
                var result = App.Plaza.toggleFollow(id);
                if (result === null) return;

                // 关注会同时改动两张卡片（我的「关注」数、对方的「粉丝」数和互关徽章），
                // 只重绘这两张，不重建整个网格，避免 50 张卡片抖动、滚动位置丢失
                this.refreshCard(id);
                if (me.id !== id) this.refreshCard(me.id);
                return;
            }

            if (act === 'like') {
                var result = App.Plaza.giveLike(id);

                if (!result.ok) {
                    if (result.reason === 'self') App.Plaza.toast('不能给自己点赞');
                    else if (result.reason === 'limit') {
                        App.Plaza.toast('今天已经给他点满 ' + App.Plaza.MAX_DAILY_LIKES + ' 个赞了，明天再来');
                    } else if (result.reason === 'notlogin') {
                        App.ModalPlaza.openLogin();
                    }
                    return;
                }

                this.updateLike(actEl, id, result);
                return;
            }
        },

        // 只重绘一张卡片：关注会同时影响双方的状态，全网格重建太浪费，
        // 还会把滚动位置弄丢
        refreshCard(id) {
            var grid = this.el.grid;
            if (!grid) return;

            var el = grid.querySelector('.plaza-card[data-id="' + id + '"]');
            var st = App.Plaza.getById(id);
            if (!el || !st) return;

            var tmp = document.createElement('div');
            tmp.innerHTML = this.cardHtml(st, Number(el.dataset.index) || 0);

            var fresh = tmp.firstElementChild;
            if (!fresh) return;

            fresh.style.animation = 'none';   // 原地换掉，不要再淡入一次
            el.parentNode.replaceChild(fresh, el);

            var action = fresh.querySelector('.plaza-card-action');
            if (action) {
                action.classList.add('plaza-pulse');
                setTimeout(function () { action.classList.remove('plaza-pulse'); }, 400);
            }
        },

        // 点赞只更新这一张卡片，不重建整个网格
        updateLike(btn, id, result) {
            var st = App.Plaza.getById(id);
            if (!st) return;

            btn.classList.add('liked');
            btn.querySelector('.plaza-heart').textContent = '❤';
            btn.querySelector('b').textContent = result.total;
            btn.title = result.today >= App.Plaza.MAX_DAILY_LIKES
                ? '今天已经给他点满 ' + App.Plaza.MAX_DAILY_LIKES + ' 个赞了'
                : '点赞（今日已赞 ' + result.today + ' / ' + App.Plaza.MAX_DAILY_LIKES + '）';

            btn.classList.remove('pop');
            void btn.offsetWidth;
            btn.classList.add('pop');
        },

        // ------------------------------------------------------
        // 关注 / 粉丝名单浮层
        // ------------------------------------------------------

        showList(anchor, title, people) {
            this.hidePopover();

            var host = document.getElementById('pageContent');
            if (!host) return;

            var esc = App.Plaza.escape;
            var me = App.Plaza.me();
            var shown = people.slice(0, 12);

            var el = document.createElement('div');
            el.className = 'plaza-popover';
            el.innerHTML =
                '<div class="plaza-popover-title">' + esc(title) + ' · ' + people.length + ' 人</div>' +
                (shown.length
                    ? shown.map(function (st) {
                        var mutual = me && App.Plaza.isMutual(me, st);
                        var following = me && App.Plaza.isFollowing(me, st.id);

                        return '<div class="plaza-popover-item">' +
                            '<span class="plaza-popover-avatar" style="' + App.ModalPlaza.avatarStyle(st) + '">' +
                                App.ModalPlaza.avatarInner(st) +
                            '</span>' +
                            '<span class="plaza-popover-name">' + esc(App.Plaza.displayName(st)) + '</span>' +
                            (mutual ? '<span class="plaza-popover-badge">互关</span>' : '') +
                            (me && me.id !== st.id
                                ? '<button type="button" class="plaza-mini-btn' + (following ? ' on' : '') +
                                    '" data-pop-follow="' + esc(st.id) + '">' +
                                    (following ? '取关' : '关注') + '</button>'
                                : '') +
                        '</div>';
                    }).join('')
                    : '<div class="plaza-popover-empty">还没有人</div>') +
                (people.length > shown.length
                    ? '<div class="plaza-popover-more">还有 ' + (people.length - shown.length) + ' 人</div>'
                    : '');

            el.addEventListener('click', function (evt) {
                var btn = evt.target.closest('[data-pop-follow]');
                if (!btn) return;
                evt.stopPropagation();

                var id = btn.dataset.popFollow;
                var me = App.Plaza.me();

                if (!me) { App.ModalPlaza.openLogin(); return; }

                App.Plaza.toggleFollow(id);
                var now = App.Plaza.isFollowing(me, id);
                btn.classList.toggle('on', now);
                btn.textContent = now ? '取关' : '关注';

                // 浮层背后的卡片也要跟着更新
                App.ModalPlaza.refreshCard(id);
                App.ModalPlaza.refreshCard(me.id);
            });

            host.appendChild(el);

            var pageRect = host.getBoundingClientRect();
            var zoom = (pageRect.width / PAGE_W) || 1;
            var rect = anchor.getBoundingClientRect();

            var left = (rect.left - pageRect.left) / zoom - 40;
            var top = (rect.bottom - pageRect.top) / zoom + 8;

            left = Math.max(10, Math.min(left, PAGE_W - POPOVER_W - 10));

            // 页面高度被钉死在 1080px，但窗口不一定够高，
            // 所以翻转判断要用「真实可见区域」而不是页面自己的底边
            var visibleTop = Math.max(-pageRect.top / zoom, 0) + 10;
            var visibleBottom = Math.min((window.innerHeight - pageRect.top) / zoom, PAGE_H) - 10;

            if (top + el.offsetHeight > visibleBottom) {
                top = (rect.top - pageRect.top) / zoom - el.offsetHeight - 8;
            }

            el.style.left = left + 'px';
            el.style.top = Math.max(visibleTop, top) + 'px';

            this._popover = el;
        },

        hidePopover() {
            if (this._popover && this._popover.parentNode) {
                this._popover.parentNode.removeChild(this._popover);
            }
            this._popover = null;
        },

        // ------------------------------------------------------
        // 登录
        // ------------------------------------------------------

        openLogin() {
            var modal = this.el.loginModal;
            if (!modal) return;

            this._loginTarget = null;
            this._caret = 0;

            if (this.el.loginSearch) this.el.loginSearch.value = '';
            if (this.el.loginPassword) this.el.loginPassword.value = '';
            if (this.el.loginNote) {
                this.el.loginNote.style.display = 'none';
                this.el.loginNote.textContent = '';
            }
            if (this.el.loginSubmit) {
                this.el.loginSubmit.disabled = true;
                this.el.loginSubmit.textContent = '登录';
            }

            this.buildKeypad();
            this.renderLoginOptions();
            modal.classList.add('active');

            setTimeout(() => this.el.loginSearch?.focus(), 60);
        },

        closeLogin() {
            this.el.loginModal?.classList.remove('active');
            this._loginTarget = null;
            this._caret = 0;
            if (this.el.loginPassword) this.el.loginPassword.value = '';
        },

        // 下拉框里的一项：昵称 · 真实姓名（学号）
        _optionLabel(st) {
            var name = App.Plaza.displayName(st);
            var parts = [];

            if (App.Plaza.hasNickname(st) && App.Plaza.hasRealName(st)) parts.push(st.realName);
            if (st.studentNo) parts.push(st.studentNo);

            return name +
                (parts.length ? '（' + parts.join(' · ') + '）' : '') +
                (st.verifyKey ? '' : '（未发密码）');
        },

        renderLoginOptions() {
            var sel = this.el.loginSelect;
            if (!sel) return;

            var esc = App.Plaza.escape;
            var q = String(this.el.loginSearch?.value || '').trim();
            var self = this;
            var keep = this._loginTarget;

            var list = App.Plaza.sortStudents(
                App.Plaza.students().filter(function (st) {
                    return !q || App.Plaza.matches(st, q);
                }),
                'default'
            );

            var html = '<option value="">' +
                (q && !list.length ? '没有匹配的同学' : '请选择你自己…') + '</option>';

            html += list.map(function (st) {
                return '<option value="' + esc(st.id) + '"' +
                    (st.verifyKey ? '' : ' disabled') +
                    (st.id === keep ? ' selected' : '') + '>' +
                    esc(self._optionLabel(st)) + '</option>';
            }).join('');

            sel.innerHTML = html;

            // 搜索把当前选中的人过滤掉了，就一并清空选择
            if (keep && !list.some(function (s) { return s.id === keep; })) {
                sel.value = '';
                this.selectLoginTarget('');
            }
        },

        selectLoginTarget(id) {
            this._loginTarget = id || null;

            var st = id ? App.Plaza.getById(id) : null;
            var note = this.el.loginNote;
            var submit = this.el.loginSubmit;

            if (this.el.loginSelect) this.el.loginSelect.value = id || '';

            if (note) {
                note.style.display = 'none';
                note.textContent = '';
            }

            if (!st || !st.verifyKey) {
                if (note && st) {
                    note.style.display = 'block';
                    note.textContent = App.Plaza.displayName(st) +
                        ' 还没有初始密码。请联系管理员在「设置 → 名单管理」里发放。';
                }
                if (submit) submit.disabled = true;
                return;
            }

            if (submit) submit.disabled = false;
            this._caret = 0;
        },

        // ------------------------------------------------------
        // 数字小键盘
        //
        // 和座位表的屏幕键盘一样：键盘操作全程不聚焦输入框，
        // 否则触屏设备会弹出系统自带键盘把界面顶上去。
        // 插入位置由 _caret 自己维护，用真实键盘打字时再同步回来。
        // ------------------------------------------------------

        buildKeypad() {
            var host = this.el.keypad;
            if (!host || host.dataset.built === '1') return;

            var keys = [
                '1', '2', '3',
                '4', '5', '6',
                '7', '8', '9',
                { k: '__clear', label: '清空', fn: true },
                '0',
                { k: '__back', label: '⌫', fn: true }
            ];

            host.innerHTML = keys.map(function (item) {
                var isObj = typeof item === 'object';
                var key = isObj ? item.k : item;
                var label = isObj ? item.label : item;
                var cls = isObj && item.fn ? 'plaza-key fn' : 'plaza-key';

                return '<button type="button" class="' + cls + '" data-key="' + key + '">' +
                    label + '</button>';
            }).join('');

            host.dataset.built = '1';
        },

        syncCaret() {
            var input = this.el.loginPassword;
            if (!input) return;

            if (document.activeElement === input && typeof input.selectionStart === 'number') {
                this._caret = input.selectionStart;
            }
        },

        currentCaret(len) {
            var c = this._caret;
            if (typeof c !== 'number' || isNaN(c)) return len;
            return Math.max(0, Math.min(len, c));
        },

        onVirtualKey(key) {
            var input = this.el.loginPassword;
            if (!input) return;

            if (key === '__clear') {
                input.value = '';
                this._caret = 0;
                return;
            }

            var v = input.value;

            if (key === '__back') {
                if (!v) { this._caret = 0; return; }

                var backPos = this.currentCaret(v.length);
                if (backPos <= 0) backPos = v.length;

                input.value = v.slice(0, backPos - 1) + v.slice(backPos);
                this._caret = backPos - 1;
                return;
            }

            if (!/^\d$/.test(String(key))) return;

            var caret = this.currentCaret(v.length);
            input.value = v.slice(0, caret) + key + v.slice(caret);
            this._caret = caret + 1;
        },

        async submitLogin() {
            if (this._busy || !this._loginTarget) return;

            var st = App.Plaza.getById(this._loginTarget);
            if (!st || !st.verifyKey) return;

            var input = this.el.loginPassword?.value || '';

            if (!input.trim()) {
                this.showLoginNote('请输入密码');
                return;
            }

            var submit = this.el.loginSubmit;
            this._busy = true;

            if (submit) {
                submit.disabled = true;
                submit.textContent = '登录中…';
            }

            var result;

            try {
                result = await App.Plaza.login(this._loginTarget, input);
            } catch (e) {
                console.error('[Plaza] 登录出错:', e);
                result = { ok: false, reason: 'error' };
            }

            this._busy = false;

            // 无论成败都立刻清空输入框，不留残影
            if (this.el.loginPassword) this.el.loginPassword.value = '';

            if (submit) {
                submit.textContent = '登录';
                submit.disabled = false;
            }

            if (!result.ok) {
                if (result.reason === 'locked') {
                    this.showLoginNote('输错次数太多，请等 30 秒再试');
                } else if (result.reason === 'nopwd') {
                    this.showLoginNote('该同学还没有初始密码，请联系管理员');
                } else if (result.reason === 'error') {
                    this.showLoginNote('登录失败：当前浏览器不支持加密功能');
                } else {
                    this.showLoginNote('密码不正确');
                }
                return;
            }

            this.closeLogin();
            App.Plaza.toast('欢迎回来，' + App.Plaza.displayName(App.Plaza.me()));
            this.renderAccount();
            this.renderGrid();

            // 补上登录前那次被拦下的操作
            if (this._pending) {
                var p = this._pending;
                this._pending = null;

                if (p.act === 'follow') App.Plaza.toggleFollow(p.id);
                if (p.act === 'like') App.Plaza.giveLike(p.id);

                this.renderGrid();
            }
        },

        showLoginNote(text) {
            if (!this.el.loginNote) return;
            this.el.loginNote.style.display = 'block';
            this.el.loginNote.textContent = text;
        }
    };
})();
