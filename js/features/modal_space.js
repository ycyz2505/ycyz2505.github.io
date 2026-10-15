// ============================================================
// js/features/modal_space.js
// 个人空间：资料展示、编辑资料、关注 / 粉丝列表、修改密码
//
// 左栏是广场卡片组件的放大版，编辑时实时联动（所见即所得）。
// 别人的空间是只读的，只在左栏多一颗关注按钮。
// ============================================================

window.App = window.App || {};

(function () {
    'use strict';

    var App = window.App;

    var MONTHS = 12;
    var DAYS = 31;

    App.ModalSpace = {
        el: {},
        studentId: null,
        tab: 'profile',
        mode: 'view',        // view | edit | password
        draft: null,
        busy: false,
        _inited: false,

        // ------------------------------------------------------
        // 初始化
        // ------------------------------------------------------

        init() {
            if (this._inited) return;

            this.el.modal = document.getElementById('spaceModal');
            this.el.title = document.getElementById('spaceTitle');
            this.el.close = document.getElementById('closeSpace');
            this.el.side = document.getElementById('spaceCardHolder');
            this.el.sideActions = document.getElementById('spaceSideActions');
            this.el.tabs = document.getElementById('spaceTabs');
            this.el.panel = document.getElementById('spacePanel');

            this.bind();

            var self = this;
            App.Plaza.on(function () {
                if (!self.el.modal?.classList.contains('active')) return;
                // 正在编辑资料 / 改密码时不要重绘，否则用户敲了一半的表单会被冲掉
                if (self.mode === 'edit' || self.mode === 'password') return;
                self.render();
            });

            this._inited = true;
        },

        bind() {
            var self = this;

            this.el.close?.addEventListener('click', function () {
                // 空间不在 ModalCore 的注册表里，关闭要自己来
                self.el.modal?.classList.remove('active');
                self.mode = 'view';
                self.draft = null;
                setTimeout(function () { App.ModalPlaza?.checkSessionAlive(); }, 0);
            });

            this.el.tabs?.addEventListener('click', function (e) {
                var btn = e.target.closest('.space-tab');
                if (!btn) return;
                self.tab = btn.dataset.tab;
                self.mode = 'view';
                self.render();
            });

            this.el.side?.addEventListener('click', function () {
                // 预览卡片是纯展示，不响应点击
            });

            this.el.sideActions?.addEventListener('click', function (e) {
                var btn = e.target.closest('[data-act]');
                if (!btn) return;
                self.onSideAction(btn.dataset.act);
            });

            this.el.panel?.addEventListener('click', function (e) {
                self.onPanelClick(e);
            });

            this.el.panel?.addEventListener('change', function (e) {
                self.onPanelChange(e);
            });
        },

        // ------------------------------------------------------
        // 打开
        // ------------------------------------------------------

        open(studentId) {
            var st = App.Plaza.getById(studentId);
            if (!st) return;

            this.studentId = studentId;
            this.tab = 'profile';
            this.mode = 'view';
            this.draft = null;

            // 本人登录 / 管理员解锁时，先把能解的密文都解出来
            if (App.Plaza.me() || App.Plaza.adminUnlocked) {
                App.Plaza.warmSecrets().then(() => this.render());
            }

            this.el.modal?.classList.add('active');
            this.render();
        },

        openPasswordPanel() {
            var me = App.Plaza.me();
            if (!me) {
                App.ModalPlaza?.openLogin();
                return;
            }

            this.open(me.id);
            this.mode = 'password';
            this.render();
        },

        isSelf() {
            var me = App.Plaza.me();
            return !!me && me.id === this.studentId;
        },

        // 本人，或者已解锁的管理员
        canEdit() {
            return App.Plaza.canEdit(this.current());
        },

        current() {
            return App.Plaza.getById(this.studentId);
        },

        // ------------------------------------------------------
        // 渲染
        // ------------------------------------------------------

        render() {
            var st = this.current();
            if (!st) return;

            var esc = App.Plaza.escape;
            var self = this;

            if (this.el.title) {
                this.el.title.textContent = '个人空间 · ' + App.Plaza.displayName(st) +
                    (this.isSelf() ? '' : (App.Plaza.adminUnlocked ? '（管理员视图）' : ''));
            }

            if (this.el.side) {
                this.el.side.innerHTML = App.ModalPlaza.cardHtml(st, 0, { inert: true, big: true });
            }

            this.renderSideActions();
            this.renderTabs();

            if (this.mode === 'password') {
                this.renderPasswordPanel();
                return;
            }

            if (this.tab === 'following') {
                this.el.panel.innerHTML = this.personListHtml(
                    App.Plaza.followingList(st),
                    '你还没有关注任何人',
                    'following'
                );
                return;
            }

            if (this.tab === 'followers') {
                this.el.panel.innerHTML = this.personListHtml(
                    App.Plaza.followerList(st.id),
                    this.isSelf() ? '还没有人关注你' : '还没有人关注他',
                    'followers'
                );
                return;
            }

            this.el.panel.innerHTML = this.mode === 'edit'
                ? this.editFormHtml()
                : this.profileHtml();

            if (this.mode === 'edit') this.afterEditFormRender();
        },

        renderSideActions() {
            var host = this.el.sideActions;
            if (!host) return;

            var me = App.Plaza.me();
            var st = this.current();
            var html = '';

            if (!this.isSelf()) {
                var following = me && App.Plaza.isFollowing(me, st.id);
                var mutual = me && App.Plaza.isMutual(me, st);

                html += '<button type="button" class="plaza-btn primary space-wide" data-act="follow">' +
                    (mutual ? '互相关注' : (following ? '已关注' : '+ 关注')) +
                    '</button>';
            }

            if (this.canEdit()) {
                html += '<button type="button" class="plaza-btn primary space-wide" data-act="edit">' +
                    '✏️ 编辑资料</button>';

                html += this.isSelf()
                    ? '<button type="button" class="plaza-btn space-wide" data-act="password">🔑 修改密码</button>'
                    : '<button type="button" class="plaza-btn space-wide" data-act="reset-pwd">🔑 重置密码</button>';
            }

            host.innerHTML = html;
        },

        renderTabs() {
            var host = this.el.tabs;
            if (!host) return;

            var st = this.current();

            var counts = {
                following: App.Plaza.followingList(st).length,
                followers: App.Plaza.followerList(st.id).length
            };

            var tabs = [
                { key: 'profile', label: '资料', count: null },
                { key: 'following', label: '关注', count: counts.following },
                { key: 'followers', label: '粉丝', count: counts.followers }
            ];

            var active = this.mode === 'edit' || this.mode === 'password' ? 'profile' : this.tab;

            host.innerHTML = tabs.map(function (t) {
                return '<button type="button" class="space-tab' + (t.key === active ? ' active' : '') +
                    '" data-tab="' + t.key + '">' + t.label +
                    (t.count === null ? '' : ' ' + t.count) + '</button>';
            }).join('');
        },

        // 只刷新左栏卡片和标签页计数，不动右侧列表
        // （取关后行还在做淡出动画，整体重绘会把动画打断）
        refreshChrome() {
            var st = this.current();
            if (!st) return;

            if (this.el.side) {
                this.el.side.innerHTML = App.ModalPlaza.cardHtml(st, 0, { inert: true, big: true });
            }

            this.renderSideActions();
            this.renderTabs();
        },

        onSideAction(act) {
            var st = this.current();

            if (act === 'follow') {
                var me = App.Plaza.me();
                if (!me) { App.ModalPlaza?.openLogin(); return; }
                App.Plaza.toggleFollow(this.studentId);
                return;
            }

            if (act === 'edit') {
                this.startEdit();
                return;
            }

            if (act === 'password') {
                this.mode = 'password';
                this.render();
                return;
            }

            if (act === 'reset-pwd') {
                this.resetPasswordFor(st);
            }
        },

        // 管理员给某位同学发一份新密码
        async resetPasswordFor(st) {
            if (!st || this._resetting) return;

            var hasSecret = !!st.secret;

            var ok = window.confirm(
                '给「' + App.Plaza.displayName(st) + '」生成一份新的初始密码？\n' +
                (hasSecret
                    ? '他隐藏的生日会自动用新密码重新加密，不受影响。'
                    : '')
            );

            if (!ok) return;

            this._resetting = true;

            try {
                var pwd = await App.Plaza.issuePassword(st, 8);
                App.Plaza.toast('新密码：' + pwd + '（请发给他）', 6000);
                this.render();
            } catch (e) {
                console.error('[Plaza] 重置密码失败:', e);
                App.Plaza.toast('重置失败，请重试');
            } finally {
                this._resetting = false;
            }
        },

        // ------------------------------------------------------
        // 资料：只读
        // ------------------------------------------------------

        profileHtml() {
            var st = this.current();
            var esc = App.Plaza.escape;
            var self = this;
            var mine = this.isSelf();
            var me = App.Plaza.me();

            function value(text, unset) {
                if (!text) return '<span class="space-unset">未设置</span>';
                return esc(text);
            }

            var birthday = App.Plaza.formatBirthday(App.Plaza.birthdayForDisplay(st));
            var readable = App.Plaza.canReadBirthday(st);
            var hidden = st.birthdayVisible === false && !!st.secret;
            var birthdayHtml;

            if (mine) {
                if (!readable) {
                    birthdayHtml = '<span class="space-warn">此前的加密数据已失效，请重新填写</span>';
                } else if (birthday) {
                    birthdayHtml = esc(birthday);
                } else {
                    birthdayHtml = '<span class="space-unset">未设置</span>';
                }

                birthdayHtml += '<label class="space-switch">' +
                    '<span>在广场中展示</span>' +
                    '<input type="checkbox" data-act="toggle-birthday"' +
                        (st.birthdayVisible !== false ? ' checked' : '') +
                        (App.PlazaCrypto.isAvailable() ? '' : ' disabled') + '>' +
                    '<i></i></label>';
            } else if (this.canEdit()) {
                // 管理员：本人隐藏的生日也看得到
                if (!readable) {
                    birthdayHtml = '<span class="space-warn">密文无法解开（可能是密码被重置过）</span>';
                } else {
                    birthdayHtml = birthday ? esc(birthday) : '<span class="space-unset">未设置</span>';
                }

                if (hidden) {
                    birthdayHtml += '<span class="space-lock">🔒 本人已隐藏，仅管理员可见</span>';
                }
            } else {
                birthdayHtml = App.Plaza.birthdayVisibleTo(st, me)
                    ? esc(birthday || '')
                    : '<span class="space-unset">未公开</span>';
            }

            var avatar = App.Plaza.avatarUrl(st);
            var cover = App.Plaza.coverUrl(st);

            var rows = [
                { label: '真实姓名', value: value(st.realName), lock: true },
                { label: '性别', value: value(this.genderText(st.gender)), lock: true },
                { label: '学号', value: value(st.studentNo), lock: true },
                { label: '昵称', value: value(st.nickname) },
                { label: '生日', html: birthdayHtml },
                { label: '个性签名', value: value(st.signature) },
                { label: '个人介绍', value: value(st.intro) },
                {
                    label: '头像',
                    html: '<span class="space-thumb" style="' + App.ModalPlaza.avatarStyle(st) + '">' +
                        App.ModalPlaza.avatarInner(st) + '</span>'
                },
                {
                    label: '背景图',
                    html: cover
                        ? '<span class="space-thumb wide" style="background-image:url(\'' +
                            cover.replace(/'/g, '%27') + '\')"></span>'
                        : '<span class="space-thumb wide is-plain"><i>未设置（纯白）</i></span>'
                },
                { label: '关注', value: App.Plaza.followingList(st).length + ' 人' },
                { label: '粉丝', value: App.Plaza.followerList(st.id).length + ' 人' },
                { label: '点赞量', value: App.Plaza.likeCount(st) }
            ];

            return '<div class="space-info">' + rows.map(function (r) {
                return '<div class="space-info-row">' +
                    '<div class="space-info-label">' + r.label + '</div>' +
                    '<div class="space-info-value">' +
                        (r.html !== undefined ? r.html : r.value) +
                        (r.lock ? '<span class="space-lock">🔒 由系统设置</span>' : '') +
                    '</div>' +
                '</div>';
            }).join('') + '</div>';
        },

        genderText(g) {
            if (g === 'male') return '男';
            if (g === 'female') return '女';
            return '';
        },

        // ------------------------------------------------------
        // 资料：编辑
        // ------------------------------------------------------

        startEdit() {
            var st = this.current();
            var birthday = App.Plaza.birthdayForDisplay(st) || '';
            var m = /^(\d{1,2})-(\d{1,2})$/.exec(birthday);

            // 编辑表单永远挂在「资料」标签页下，先把标签切回去
            this.tab = 'profile';

            this.draft = {
                nickname: st.nickname || '',
                birthdayMonth: m ? Number(m[1]) : 0,
                birthdayDay: m ? Number(m[2]) : 0,
                birthdayVisible: st.birthdayVisible !== false,
                signature: st.signature || '',
                intro: st.intro || '',
                avatar: App.Plaza.avatarUrl(st),
                cover: App.Plaza.mediaOf(st.id).cover || '',
                avatarChanged: false,
                coverChanged: false
            };

            this.mode = 'edit';
            this.render();
        },

        editFormHtml() {
            var d = this.draft;
            var esc = App.Plaza.escape;
            var st = this.current();
            var self = this;

            var monthOpts = '<option value="0">--</option>';
            for (var i = 1; i <= MONTHS; i++) {
                monthOpts += '<option value="' + i + '"' + (d.birthdayMonth === i ? ' selected' : '') +
                    '>' + i + ' 月</option>';
            }

            var dayOpts = '<option value="0">--</option>';
            for (var j = 1; j <= DAYS; j++) {
                dayOpts += '<option value="' + j + '"' + (d.birthdayDay === j ? ' selected' : '') +
                    '>' + j + ' 日</option>';
            }

            var coverPresets = App.Plaza.COVER_PRESETS.map(function (name) {
                var url = 'images/' + name + '.webp';
                var on = d.cover === url ? ' on' : '';

                return '<button type="button" class="cover-preset' + on + '" data-act="cover-preset" ' +
                    'data-url="' + esc(url) + '" title="' + esc(name) + '" ' +
                    'style="background-image:url(\'' + url + '\')"></button>';
            }).join('');

            return '' +
                '<div class="plaza-field">' +
                    '<div class="plaza-field-label">头像</div>' +
                    '<div class="plaza-field-body">' +
                        '<div class="media-row">' +
                            '<span class="space-thumb" style="' + App.ModalPlaza.avatarStyle(st) + '">' +
                                (d.avatar
                                    ? '<img src="' + esc(d.avatar) + '" alt="">'
                                    : '<span class="plaza-avatar-text">' + esc(App.Plaza.initialsOf(st)) + '</span>') +
                            '</span>' +
                            '<button type="button" class="plaza-btn small" data-act="pick-avatar">上传</button>' +
                            '<button type="button" class="plaza-btn small" data-act="clear-avatar">恢复默认</button>' +
                        '</div>' +
                        '<div class="plaza-hint">会自动裁成正方形并压缩，建议用清晰的人像或图案</div>' +
                    '</div>' +
                '</div>' +

                '<div class="plaza-field">' +
                    '<div class="plaza-field-label">背景图</div>' +
                    '<div class="plaza-field-body">' +
                        '<div class="media-row">' +
                            (d.cover
                                ? '<span class="space-thumb wide" style="background-image:url(\'' +
                                    d.cover.replace(/'/g, '%27') + '\')"></span>'
                                : '<span class="space-thumb wide is-plain"><i>未设置（纯白）</i></span>') +
                            '<button type="button" class="plaza-btn small" data-act="pick-cover">上传</button>' +
                            '<button type="button" class="plaza-btn small" data-act="clear-cover">用默认（白）</button>' +
                        '</div>' +
                        '<div class="plaza-hint">不设就是纯白。也可以直接从下面挑一张节气图</div>' +
                        '<div class="cover-presets">' + coverPresets + '</div>' +
                    '</div>' +
                '</div>' +

                '<div class="plaza-field">' +
                    '<div class="plaza-field-label">昵称</div>' +
                    '<div class="plaza-field-body">' +
                        '<input type="text" class="plaza-input" id="spaceNickname" maxlength="' +
                            App.Plaza.MAX_NICKNAME + '" value="' + esc(d.nickname) + '" ' +
                            'placeholder="1–12 个字，全站唯一；留空则显示真实姓名">' +
                    '</div>' +
                '</div>' +

                '<div class="plaza-field">' +
                    '<div class="plaza-field-label">生日</div>' +
                    '<div class="plaza-field-body">' +
                        '<div class="birthday-row">' +
                            '<select class="plaza-input compact" id="spaceBirthdayMonth">' + monthOpts + '</select>' +
                            '<select class="plaza-input compact" id="spaceBirthdayDay">' + dayOpts + '</select>' +
                            '<label class="space-switch">' +
                                '<span>在广场中展示</span>' +
                                '<input type="checkbox" id="spaceBirthdayVisible"' +
                                    (d.birthdayVisible ? ' checked' : '') + '>' +
                                '<i></i>' +
                            '</label>' +
                        '</div>' +
                        '<div class="plaza-hint">不展示时，生日会用你自己的密码加密后再存进文件</div>' +
                    '</div>' +
                '</div>' +

                '<div class="plaza-field">' +
                    '<div class="plaza-field-label">个性签名</div>' +
                    '<div class="plaza-field-body">' +
                        '<input type="text" class="plaza-input" id="spaceSignature" maxlength="' +
                            App.Plaza.MAX_SIGNATURE + '" value="' + esc(d.signature) + '" ' +
                            'placeholder="一句话，最多 ' + App.Plaza.MAX_SIGNATURE + ' 字">' +
                    '</div>' +
                '</div>' +

                '<div class="plaza-field">' +
                    '<div class="plaza-field-label">个人介绍</div>' +
                    '<div class="plaza-field-body">' +
                        '<textarea class="plaza-input" id="spaceIntro" maxlength="' +
                            App.Plaza.MAX_INTRO + '" placeholder="最多 ' + App.Plaza.MAX_INTRO + ' 字">' +
                            esc(d.intro) + '</textarea>' +
                        '<div class="plaza-hint" id="spaceIntroCount"></div>' +
                    '</div>' +
                '</div>' +

                '<div class="space-edit-actions">' +
                    '<button type="button" class="plaza-btn" data-act="cancel-edit">取消</button>' +
                    '<button type="button" class="plaza-btn primary" data-act="save-edit">保存</button>' +
                '</div>';
        },

        afterEditFormRender() {
            var intro = document.getElementById('spaceIntro');
            var count = document.getElementById('spaceIntroCount');
            if (!intro || !count) return;

            var update = function () {
                count.textContent = intro.value.length + ' / ' + App.Plaza.MAX_INTRO;
            };

            update();
            intro.addEventListener('input', update);
        },

        // ------------------------------------------------------
        // 修改密码
        // ------------------------------------------------------

        renderPasswordPanel() {
            var st = this.current();

            this.el.panel.innerHTML = '' +
                '<div class="pwd-panel">' +
                    '<div class="plaza-field">' +
                        '<div class="plaza-field-label">当前密码</div>' +
                        '<div class="plaza-field-body">' +
                            '<input type="password" class="plaza-input" id="pwdCurrent" ' +
                                'inputmode="numeric" autocomplete="off">' +
                            '<div class="plaza-hint">同样支持防偷窥：前面随便多打几个字也没关系</div>' +
                        '</div>' +
                    '</div>' +

                    '<div class="plaza-field">' +
                        '<div class="plaza-field-label">新密码</div>' +
                        '<div class="plaza-field-body">' +
                            '<input type="password" class="plaza-input" id="pwdNew" ' +
                                'inputmode="numeric" autocomplete="off" ' +
                                'placeholder="纯数字，' + App.Plaza.MIN_PASSWORD + '–' +
                                App.Plaza.MAX_PASSWORD + ' 位">' +
                            '<div class="plaza-hint">想更好地保护你隐藏的生日，建议用 10 位以上</div>' +
                        '</div>' +
                    '</div>' +

                    '<div class="plaza-field">' +
                        '<div class="plaza-field-label">确认新密码</div>' +
                        '<div class="plaza-field-body">' +
                            '<input type="password" class="plaza-input" id="pwdConfirm" ' +
                                'inputmode="numeric" autocomplete="off">' +
                        '</div>' +
                    '</div>' +

                    '<div class="space-edit-actions">' +
                        '<button type="button" class="plaza-btn" data-act="cancel-edit">取消</button>' +
                        '<button type="button" class="plaza-btn primary" data-act="save-password">保存</button>' +
                    '</div>' +

                    '<div class="pwd-note">' +
                        '注意：密码是「隐藏生日」唯一的一把钥匙。忘记后只能由管理员重置，' +
                        '重置后隐藏的生日会失效，需要重新填写一次。' +
                    '</div>' +
                '</div>';
        },

        // ------------------------------------------------------
        // 关注 / 粉丝列表
        // ------------------------------------------------------

        personListHtml(people, emptyText, kind) {
            var esc = App.Plaza.escape;
            var me = App.Plaza.me();
            var mine = this.isSelf();

            if (!people.length) {
                return '<div class="space-empty">' + esc(emptyText) + '</div>';
            }

            return '<div class="space-people">' + people.map(function (st) {
                var following = me && App.Plaza.isFollowing(me, st.id);
                var mutual = me && App.Plaza.isMutual(me, st);

                var action = '';

                if (!me) {
                    action = '<button type="button" class="plaza-btn small" data-act="need-login">+ 关注</button>';
                } else if (me.id === st.id) {
                    action = '<span class="plaza-follow self">这是你</span>';
                } else {
                    action = '<button type="button" class="plaza-btn small' +
                        (following ? ' ghost' : ' primary') +
                        '" data-act="toggle-follow" data-id="' + esc(st.id) + '">' +
                        (following ? '取关' : '+ 关注') + '</button>';
                }

                return '<div class="space-person" data-id="' + esc(st.id) + '">' +
                    '<span class="space-person-avatar" style="' + App.ModalPlaza.avatarStyle(st) + '">' +
                        App.ModalPlaza.avatarInner(st) +
                    '</span>' +
                    '<span class="space-person-info" data-act="open-space">' +
                        '<span class="space-person-name">' + esc(App.Plaza.displayName(st)) + '</span>' +
                        '<span class="space-person-real">' +
                            esc(App.Plaza.hasNickname(st) ? (st.realName || '未设置') : (st.studentNo || '未设置学号')) +
                        '</span>' +
                    '</span>' +
                    (mutual ? '<span class="plaza-badge-mutual inline">互相关注</span>' : '') +
                    action +
                '</div>';
            }).join('') + '</div>';
        },

        // ------------------------------------------------------
        // 事件
        // ------------------------------------------------------

        onPanelClick(e) {
            var btn = e.target.closest('[data-act]');
            if (!btn) return;

            var act = btn.dataset.act;

            if (act === 'edit' || act === 'cancel-edit') {
                this.mode = act === 'edit' ? 'edit' : 'view';
                if (act === 'edit') this.startEdit();
                else { this.draft = null; this.render(); }
                return;
            }

            if (act === 'save-edit') { this.saveEdit(); return; }
            if (act === 'save-password') { this.savePassword(); return; }

            if (act === 'pick-avatar') { this.pickMedia('avatar'); return; }
            if (act === 'pick-cover') { this.pickMedia('cover'); return; }

            if (act === 'clear-avatar') {
                this.draft.avatar = '';
                this.draft.avatarChanged = true;
                this.render();
                return;
            }

            if (act === 'clear-cover') {
                this.draft.cover = '';
                this.draft.coverChanged = true;
                this.render();
                return;
            }

            if (act === 'cover-preset') {
                this.draft.cover = btn.dataset.url;
                this.draft.coverChanged = true;
                this.render();
                return;
            }

            if (act === 'open-space') {
                var row = btn.closest('.space-person');
                if (row) this.open(row.dataset.id);
                return;
            }

            if (act === 'need-login') {
                App.ModalPlaza?.openLogin();
                return;
            }

            if (act === 'toggle-follow') {
                var id = btn.dataset.id;
                var me = App.Plaza.me();

                if (!me) { App.ModalPlaza?.openLogin(); return; }

                // 取关要二次确认，触摸屏上太容易误触了
                if (App.Plaza.isFollowing(me, id) && btn.dataset.confirm !== '1') {
                    btn.dataset.confirm = '1';
                    btn.classList.add('confirming');
                    btn.textContent = '确认取关';

                    setTimeout(function () {
                        if (!btn.isConnected || btn.dataset.confirm !== '1') return;
                        btn.dataset.confirm = '';
                        btn.classList.remove('confirming');
                        btn.textContent = App.Plaza.isFollowing(App.Plaza.me(), id) ? '取关' : '+ 关注';
                    }, 3000);
                    return;
                }

                App.Plaza.toggleFollow(id);

                var following = App.Plaza.isFollowing(App.Plaza.me(), id);

                // 在「自己的关注」页里取关，这个人就该从列表里消失；
                // 在「粉丝」页里他只是被我取关、仍然是粉丝，行要留着、按钮变回「+ 关注」。
                // 看别人的空间时列表是对方的，怎么点都不该动，整体重绘即可。
                if (this.isSelf() && this.tab === 'following' && !following) {
                    var row = btn.closest('.space-person');

                    if (row) {
                        row.classList.add('leaving');
                        setTimeout(function () {
                            if (row.parentNode) row.parentNode.removeChild(row);
                        }, 260);
                    }

                    this.refreshChrome();
                } else {
                    this.render();
                }

                return;
            }
        },

        onPanelChange(e) {
            var el = e.target;

            if (el.dataset && el.dataset.act === 'toggle-birthday') {
                this.toggleBirthday(el.checked, el);
                return;
            }

            if (!this.draft) return;

            if (el.id === 'spaceNickname') this.draft.nickname = el.value;
            if (el.id === 'spaceSignature') this.draft.signature = el.value;
            if (el.id === 'spaceIntro') this.draft.intro = el.value;
            if (el.id === 'spaceBirthdayMonth') this.draft.birthdayMonth = Number(el.value) || 0;
            if (el.id === 'spaceBirthdayDay') this.draft.birthdayDay = Number(el.value) || 0;
            if (el.id === 'spaceBirthdayVisible') this.draft.birthdayVisible = el.checked;
        },

        async toggleBirthday(visible, el) {
            var st = this.current();

            if (!App.PlazaCrypto.isAvailable()) {
                el.checked = !visible;
                App.Plaza.toast('当前浏览器不支持加密，无法隐藏生日');
                return;
            }

            var mmdd = App.Plaza.birthdayForDisplay(st) || '';
            var result = await App.Plaza.setBirthdayFor(st, mmdd, visible);

            if (!result.ok) {
                el.checked = !visible;

                if (result.reason === 'needself') {
                    App.Plaza.toast('隐藏生日需要本人操作');
                } else if (result.reason === 'nokey') {
                    App.Plaza.toast('请先登录');
                } else if (result.reason === 'nocrypto') {
                    App.Plaza.toast('当前浏览器不支持加密');
                } else {
                    App.Plaza.toast('操作失败');
                }
                return;
            }

            App.Plaza.toast(visible ? '生日会在广场上展示' : '生日已加密隐藏');
            this.render();
        },

        // ------------------------------------------------------
        // 图片
        // ------------------------------------------------------

        pickMedia(kind) {
            var self = this;

            var input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';

            input.addEventListener('change', async function () {
                var file = input.files && input.files[0];
                if (!file) return;

                var opts = kind === 'avatar' ? App.Plaza.AVATAR_OPTS : App.Plaza.COVER_OPTS;

                try {
                    var result = await App.Plaza.compressImage(file, opts);

                    if (result.tooBig) {
                        App.Plaza.toast('图片压缩后仍然过大，请换一张');
                        return;
                    }

                    if (kind === 'avatar') {
                        self.draft.avatar = result.data;
                        self.draft.avatarChanged = true;
                    } else {
                        self.draft.cover = result.data;
                        self.draft.coverChanged = true;
                    }

                    self.render();
                } catch (e) {
                    console.error('[Plaza] 图片处理失败:', e);
                    App.Plaza.toast('图片处理失败，请换一张试试');
                }
            });

            input.click();
        },

        // ------------------------------------------------------
        // 保存
        // ------------------------------------------------------

        async saveEdit() {
            if (this.busy) return;

            var st = this.current();
            var d = this.draft;
            if (!st || !d) return;

            // 表单里的值以 DOM 为准（用户可能没触发 change 就点了保存）
            var nickEl = document.getElementById('spaceNickname');
            var signEl = document.getElementById('spaceSignature');
            var introEl = document.getElementById('spaceIntro');
            var monthEl = document.getElementById('spaceBirthdayMonth');
            var dayEl = document.getElementById('spaceBirthdayDay');
            var visibleEl = document.getElementById('spaceBirthdayVisible');

            if (nickEl) d.nickname = nickEl.value;
            if (signEl) d.signature = signEl.value;
            if (introEl) d.intro = introEl.value;
            if (monthEl) d.birthdayMonth = Number(monthEl.value) || 0;
            if (dayEl) d.birthdayDay = Number(dayEl.value) || 0;
            if (visibleEl) d.birthdayVisible = visibleEl.checked;

            var nickname = d.nickname.trim();

            if (nickname.length > App.Plaza.MAX_NICKNAME) {
                App.Plaza.toast('昵称最多 ' + App.Plaza.MAX_NICKNAME + ' 个字');
                return;
            }

            if (/[\r\n]/.test(nickname)) {
                App.Plaza.toast('昵称不能换行');
                return;
            }

            // 昵称必须唯一——登录列表就是靠它来区分人的
            if (nickname) {
                var clash = App.Plaza.students().filter(function (s) {
                    return s.id !== st.id &&
                        String(s.nickname || '').trim().toLowerCase() === nickname.toLowerCase();
                })[0];

                if (clash) {
                    App.Plaza.toast('「' + nickname + '」已经被 ' + App.Plaza.displayName(clash) + ' 使用了，请换一个');
                    return;
                }
            }

            if (d.signature.trim().length > App.Plaza.MAX_SIGNATURE) {
                App.Plaza.toast('个性签名最多 ' + App.Plaza.MAX_SIGNATURE + ' 个字');
                return;
            }

            if (d.intro.trim().length > App.Plaza.MAX_INTRO) {
                App.Plaza.toast('个人介绍最多 ' + App.Plaza.MAX_INTRO + ' 个字');
                return;
            }

            this.busy = true;
            this.setSaving(true);

            try {
                st.nickname = nickname;
                st.signature = d.signature.trim();
                st.intro = d.intro.trim();

                // 图片
                var mediaPatch = {};
                if (d.avatarChanged) mediaPatch.avatar = d.avatar;
                if (d.coverChanged) mediaPatch.cover = d.cover;

                if (Object.keys(mediaPatch).length) {
                    App.Plaza.setMedia(st.id, mediaPatch);
                }

                // 生日：公开/隐藏 + 月日，一起交给数据层处理
                var birthday = (d.birthdayMonth && d.birthdayDay)
                    ? pad(d.birthdayMonth) + '-' + pad(d.birthdayDay)
                    : '';

                var res = await App.Plaza.setBirthdayFor(st, birthday, d.birthdayVisible);

                if (!res.ok) {
                    var msg = '保存生日失败';

                    if (res.reason === 'needself') {
                        msg = '只有本人能隐藏自己的生日；要帮他改的话，把展示开关打开即可';
                    } else if (res.reason === 'nocrypto') {
                        msg = '当前浏览器不支持加密';
                    } else if (res.reason === 'nokey') {
                        msg = '请先登录';
                    }

                    App.Plaza.toast(msg);
                    this.setSaving(false);
                    this.busy = false;
                    return;
                }

                App.Plaza.save();

                this.mode = 'view';
                this.draft = null;
                this.render();
                App.Plaza.toast('已保存');
            } catch (e) {
                console.error('[Plaza] 保存资料失败:', e);
                App.Plaza.toast('保存失败，请重试');
            } finally {
                this.busy = false;
                this.setSaving(false);
            }

            function pad(n) {
                return (n < 10 ? '0' : '') + n;
            }
        },

        setSaving(on) {
            var btns = this.el.panel?.querySelectorAll('[data-act="save-edit"],[data-act="save-password"]');
            if (!btns) return;

            btns.forEach(function (b) {
                b.disabled = !!on;
                if (on) b.textContent = '保存中…';
            });
        },

        async savePassword() {
            if (this.busy) return;

            var currentEl = document.getElementById('pwdCurrent');
            var newEl = document.getElementById('pwdNew');
            var confirmEl = document.getElementById('pwdConfirm');

            if (!currentEl || !newEl || !confirmEl) return;

            var current = currentEl.value;
            var next = newEl.value.trim();
            var again = confirmEl.value.trim();

            if (!current.trim()) { App.Plaza.toast('请输入当前密码'); return; }

            if (!/^\d+$/.test(next)) { App.Plaza.toast('新密码只能是纯数字'); return; }

            if (next.length < App.Plaza.MIN_PASSWORD || next.length > App.Plaza.MAX_PASSWORD) {
                App.Plaza.toast('新密码需要 ' + App.Plaza.MIN_PASSWORD + '–' +
                    App.Plaza.MAX_PASSWORD + ' 位');
                return;
            }

            if (next !== again) { App.Plaza.toast('两次输入的新密码不一致'); return; }

            this.busy = true;
            this.setSaving(true);

            var result = await App.Plaza.changePassword(current, next);

            this.busy = false;
            this.setSaving(false);

            currentEl.value = '';
            newEl.value = '';
            confirmEl.value = '';

            if (!result.ok) {
                if (result.reason === 'orphaned') {
                    App.Plaza.toast('旧密码不对，或此前的加密数据已失效');
                } else if (result.reason === 'locked') {
                    App.Plaza.toast('输错次数太多，请等 30 秒再试');
                } else {
                    App.Plaza.toast('当前密码不正确');
                }
                return;
            }

            App.Plaza.toast('密码已修改');
            this.mode = 'view';
            this.render();
        }
    };
})();
