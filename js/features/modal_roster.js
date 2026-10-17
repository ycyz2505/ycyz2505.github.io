// ============================================================
// js/features/modal_roster.js
// 名单管理（管理员）：录入真实姓名 / 性别 / 学号，发放初始密码
//
// 打开先过一道管理员密码（密文存本地、支持防偷窥的包含式输入），
// 关闭即失效——全班共用的机器，不留后门。
//
// 管理员密码不参与任何加密，只是一把门锁：拿到它的人能改名单，
// 但看不到任何同学「隐藏的生日」（那些只由同学自己的密码加密）。
// ============================================================

window.App = window.App || {};

(function () {
    'use strict';

    var App = window.App;

    var DIGIT_CHOICES = [4, 6, 8, 10, 12];
    var DEFAULT_DIGITS = 8;

    App.ModalRoster = {
        el: {},
        state: 'locked',        // setup | locked | list
        query: '',
        digits: DEFAULT_DIGITS,
        issued: {},             // id → 刚生成的明文密码（只在内存里，用于导出）
        batchOpen: false,
        csvOpen: false,
        _inited: false,
        _busy: false,

        // ------------------------------------------------------
        // 初始化
        // ------------------------------------------------------

        init() {
            if (this._inited) return;

            this.el.modal = document.getElementById('rosterModal');
            this.el.close = document.getElementById('closeRoster');
            this.el.body = document.getElementById('rosterBody');

            this.bind();

            var self = this;
            App.Plaza.on(function () {
                if (self.state !== 'list') return;
                if (!self.el.modal?.classList.contains('active')) return;

                // 光标还在表格里打字时就别重绘了，否则焦点和输入位置都会丢
                var active = document.activeElement;
                if (active && self.el.body && self.el.body.contains(active)) return;

                self.renderList();
            });

            this._inited = true;
        },

        bind() {
            var self = this;

            this.el.close?.addEventListener('click', function () {
                // 关闭即锁上
                App.Plaza.lockAdmin();
                self.state = App.Plaza.hasAdmin() ? 'locked' : 'setup';
                self.issued = {};
                self.batchOpen = false;
                self.csvOpen = false;
            });

            // 打开时决定进入哪个状态
            document.getElementById('openRosterModal')?.addEventListener('click', function () {
                self.state = App.Plaza.adminUnlocked
                    ? 'list'
                    : (App.Plaza.hasAdmin() ? 'locked' : 'setup');
                self.query = '';
                self.render();
            });

            this.el.body?.addEventListener('click', function (e) {
                self.onClick(e);
            });

            this.el.body?.addEventListener('change', function (e) {
                self.onChange(e);
            });

            this.el.body?.addEventListener('input', function (e) {
                self.onInput(e);
            });

            this.el.body?.addEventListener('keydown', function (e) {
                if (e.target.id === 'rosterAdminPwd' && e.key === 'Enter') {
                    self.submitAdmin();
                }
            });
        },

        // ------------------------------------------------------
        // 渲染入口
        // ------------------------------------------------------

        render() {
            if (this.state === 'setup') return this.renderSetup();
            if (this.state === 'locked') return this.renderLocked();
            return this.renderList();
        },

        // ------------------------------------------------------
        // 状态一：还没设过管理员密码
        // ------------------------------------------------------

        renderSetup() {
            var self = this;

            this.el.body.innerHTML = '' +
                '<div class="roster-gate">' +
                    '<div class="roster-gate-icon">🔐</div>' +
                    '<div class="roster-gate-title">设置管理员密码</div>' +
                    '<div class="roster-gate-desc">' +
                        '第一次打开名单管理，请先设一个管理员密码。<br>' +
                        '它只会拦住别人打开这个界面，不参与任何加密。' +
                    '</div>' +
                    '<input type="password" class="plaza-input" id="rosterAdminPwd" ' +
                        'placeholder="8–32 位，建议混合大小写和数字" autocomplete="new-password">' +
                    '<input type="password" class="plaza-input" id="rosterAdminPwd2" ' +
                        'placeholder="再输一次" autocomplete="new-password">' +
                    '<div class="roster-gate-note" id="rosterGateNote"></div>' +
                    '<button type="button" class="plaza-btn primary" data-act="setup-admin">设置并进入</button>' +
                    '<div class="roster-gate-warn">' +
                        '忘了也没关系：手动删掉 data/plaza.json 里的 admin 字段就能重新设置，' +
                        '不会丢任何数据。' +
                    '</div>' +
                '</div>';
        },

        async submitSetup() {
            var a = document.getElementById('rosterAdminPwd');
            var b = document.getElementById('rosterAdminPwd2');
            var note = document.getElementById('rosterGateNote');

            if (!a || !b) return;

            var pwd = a.value.trim();
            var again = b.value.trim();

            if (pwd.length < 8 || pwd.length > 32) {
                if (note) note.textContent = '管理员密码需要 8–32 位';
                return;
            }

            if (/^(.)\1*$/.test(pwd)) {
                if (note) note.textContent = '不能全是同一个字符';
                return;
            }

            if (pwd !== again) {
                if (note) note.textContent = '两次输入不一致';
                return;
            }

            if (!App.PlazaCrypto.isAvailable()) {
                if (note) note.textContent = '当前浏览器不支持加密功能，无法设置密码';
                return;
            }

            this.setBusy(true, 'setup-admin');

            try {
                await App.Plaza.setAdminPassword(pwd);
                this.state = 'list';
                this.render();
                App.Plaza.toast('管理员密码已设置');
            } catch (e) {
                console.error('[Roster] 设置管理员密码失败:', e);
                if (note) note.textContent = '设置失败，请重试';
            } finally {
                this.setBusy(false, 'setup-admin');
            }
        },

        // ------------------------------------------------------
        // 状态二：需要管理员密码
        // ------------------------------------------------------

        renderLocked() {
            this.el.body.innerHTML = '' +
                '<div class="roster-gate">' +
                    '<div class="roster-gate-icon">🔒</div>' +
                    '<div class="roster-gate-title">需要管理员密码</div>' +
                    '<input type="password" class="plaza-input" id="rosterAdminPwd" ' +
                        'placeholder="输入管理员密码" autocomplete="current-password">' +
                    '<div class="roster-gate-hint">' +
                        '随便在前面多打几个字也没关系，只要里面含有正确密码就能进入。' +
                    '</div>' +
                    '<div class="roster-gate-note" id="rosterGateNote"></div>' +
                    '<button type="button" class="plaza-btn primary" data-act="unlock-admin">进入</button>' +
                '</div>';

            setTimeout(function () {
                document.getElementById('rosterAdminPwd')?.focus();
            }, 60);
        },

        async submitUnlock() {
            var input = document.getElementById('rosterAdminPwd');
            var note = document.getElementById('rosterGateNote');

            if (!input) return;

            if (!input.value.trim()) {
                if (note) note.textContent = '请输入管理员密码';
                return;
            }

            this.setBusy(true, 'unlock-admin');

            var result;

            try {
                result = await App.Plaza.unlockAdmin(input.value);
            } catch (e) {
                console.error('[Roster] 管理员验证出错:', e);
                result = { ok: false, reason: 'error' };
            }

            this.setBusy(false, 'unlock-admin');
            input.value = '';

            if (!result.ok) {
                if (note) {
                    note.textContent = result.reason === 'locked'
                        ? '输错次数太多，请等 30 秒再试'
                        : (result.reason === 'error'
                            ? '当前浏览器不支持加密功能'
                            : '密码不正确');
                }
                return;
            }

            this.state = 'list';
            this.render();
        },

        // ------------------------------------------------------
        // 状态三：名单表格
        // ------------------------------------------------------

        renderList() {
            var esc = App.Plaza.escape;
            var self = this;

            var list = App.Plaza.sortStudents(
                App.Plaza.students(true).filter(function (st) {
                    if (!self.query) return true;
                    return App.Plaza.matches(st, self.query) ||
                        String(st.studentNo || '').indexOf(self.query) >= 0;
                }),
                'default'
            );

            var all = App.Plaza.students(true);
            var withPwd = all.filter(function (s) { return !!s.verifyKey; }).length;
            var hidden = all.filter(function (s) { return !!s.secret; }).length;

            var rows = list.map(function (st) {
                return self.rowHtml(st);
            }).join('');

            var digitOptions = DIGIT_CHOICES.map(function (n) {
                return '<option value="' + n + '"' + (self.digits === n ? ' selected' : '') +
                    '>' + n + ' 位</option>';
            }).join('');

            this.el.body.innerHTML = '' +
                '<div class="roster-toolbar">' +
                    '<div class="plaza-search roster-search">' +
                        '<span class="plaza-search-icon">🔍</span>' +
                        '<input type="text" id="rosterSearchInput" placeholder="搜索姓名 / 昵称 / 学号" ' +
                            'value="' + esc(this.query) + '" autocomplete="off">' +
                    '</div>' +
                    '<button type="button" class="plaza-btn small" data-act="add-student">＋ 添加同学</button>' +
                    '<button type="button" class="plaza-btn small" data-act="import-seating">📄 从座位表导入</button>' +
                    '<button type="button" class="plaza-btn small" data-act="toggle-csv">📄 CSV 导入 / 导出</button>' +
                    '<button type="button" class="plaza-btn small" data-act="toggle-batch">🔑 批量生成密码</button>' +
                    '<button type="button" class="plaza-btn small" data-act="change-admin">🔐 改管理员密码</button>' +
                '</div>' +

                (this.csvOpen ? this.csvPanelHtml() : '') +
                (this.batchOpen ? this.batchPanelHtml(digitOptions) : '') +

                '<div class="roster-table">' +
                    '<div class="roster-row head">' +
                        '<div>学号</div><div>真实姓名</div><div>性别</div>' +
                        '<div>昵称</div><div>密码</div><div>操作</div>' +
                    '</div>' +
                    (rows || '<div class="roster-empty">没有匹配的同学</div>') +
                '</div>' +

                '<div class="roster-foot">' +
                    '共 <b>' + all.length + '</b> 人 · 已发密码 <b>' + withPwd + '</b> 人 · ' +
                    '隐藏生日 <b>' + hidden + '</b> 人' +
                    '<span class="roster-foot-note">（具体内容要点进该同学的个人空间查看）</span>' +
                '</div>';
        },

        rowHtml(st) {
            var esc = App.Plaza.escape;
            var issued = this.issued[st.id];

            var pwdCell = st.verifyKey
                ? '<span class="roster-pwd on">● 已设</span>'
                : '<span class="roster-pwd">○ 未设</span>';

            if (issued) {
                pwdCell += '<span class="roster-pwd-new" title="刚生成的密码">' + esc(issued) + '</span>';
            }

            return '' +
                '<div class="roster-row' + (st.archived ? ' archived' : '') + '" data-id="' + esc(st.id) + '">' +
                    '<input class="plaza-input tight" data-field="studentNo" value="' + esc(st.studentNo) +
                        '" placeholder="未设置" autocomplete="off">' +
                    '<input class="plaza-input tight" data-field="realName" value="' + esc(st.realName) +
                        '" placeholder="未设置" autocomplete="off">' +
                    '<select class="plaza-input tight" data-field="gender">' +
                        '<option value=""' + (st.gender ? '' : ' selected') + '>未设置</option>' +
                        '<option value="male"' + (st.gender === 'male' ? ' selected' : '') + '>男</option>' +
                        '<option value="female"' + (st.gender === 'female' ? ' selected' : '') + '>女</option>' +
                    '</select>' +
                    '<input class="plaza-input tight" data-field="nickname" value="' + esc(st.nickname) +
                        '" placeholder="未设置" autocomplete="off">' +
                    '<div class="roster-pwd-cell">' + pwdCell + '</div>' +
                    '<div class="roster-ops">' +
                        '<button type="button" class="plaza-mini-btn" data-act="edit-student">编辑</button>' +
                        '<button type="button" class="plaza-mini-btn" data-act="issue-pwd">重置</button>' +
                        '<button type="button" class="plaza-mini-btn" data-act="toggle-archive">' +
                            (st.archived ? '恢复' : '隐藏') + '</button>' +
                        '<button type="button" class="plaza-mini-btn danger" data-act="remove">删除</button>' +
                    '</div>' +
                '</div>';
        },

        csvPanelHtml() {
            return '' +
                '<div class="roster-panel">' +
                    '<div class="roster-panel-head">CSV 导入 / 导出</div>' +
                    '<div class="plaza-hint">' +
                        '字段顺序：<b>学号,真实姓名,性别,昵称,初始密码</b>。' +
                        '第一行可以是表头（会被忽略）。支持英文逗号、中文逗号、制表符，' +
                        '可直接从 Excel / WPS 复制粘贴。以 <b>#</b> 开头的行是注释。' +
                    '</div>' +
                    '<textarea class="plaza-input" id="rosterCsvText" placeholder="20220215,车一诺,女,小诺,12345678"></textarea>' +
                    '<div class="roster-panel-actions">' +
                        '<button type="button" class="plaza-btn small primary" data-act="csv-apply">导入</button>' +
                        '<button type="button" class="plaza-btn small" data-act="csv-export">导出当前名单</button>' +
                        '<button type="button" class="plaza-btn small" data-act="csv-export-pwd">导出初始密码表</button>' +
                        '<button type="button" class="plaza-btn small" data-act="csv-close">收起</button>' +
                    '</div>' +
                '</div>';
        },

        batchPanelHtml(digitOptions) {
            return '' +
                '<div class="roster-panel">' +
                    '<div class="roster-panel-head">批量设置初始密码</div>' +
                    '<div class="roster-panel-actions">' +
                        '<select class="plaza-input tight" id="rosterDigits">' + digitOptions + '</select>' +
                        '<button type="button" class="plaza-btn small primary" data-act="gen-missing">' +
                            '只给还没密码的同学生成</button>' +
                        '<button type="button" class="plaza-btn small danger" data-act="gen-all">' +
                            '给全班重新生成</button>' +
                        '<button type="button" class="plaza-btn small" data-act="set-same">' +
                            '全班设为同一个密码</button>' +
                        '<button type="button" class="plaza-btn small" data-act="export-issued">' +
                            '导出密码表 CSV</button>' +
                        '<button type="button" class="plaza-btn small" data-act="batch-close">收起</button>' +
                    '</div>' +
                    '<div class="plaza-hint">' +
                        '纯数字、首位不为 0。位数越多越难被穷举：8 位挡得住同学写的脚本（约 77 天），' +
                        '10 位以上才挡得住显卡。<br>' +
                        '<b>重置密码不会丢数据</b>：隐藏的生日会自动用新密码重新加密，本人拿到新密码后照样能看。' +
                    '</div>' +
                '</div>';
        },

        // ------------------------------------------------------
        // 事件
        // ------------------------------------------------------

        onClick(e) {
            var btn = e.target.closest('[data-act]');
            if (!btn) return;

            var act = btn.dataset.act;
            var row = btn.closest('.roster-row');
            var id = row?.dataset.id;
            var st = id ? App.Plaza.getById(id) : null;

            switch (act) {
                case 'setup-admin': this.submitSetup(); break;
                case 'unlock-admin': this.submitUnlock(); break;

                case 'add-student': {
                    var created = App.Plaza.addStudent({});
                    this.state = 'list';
                    this.render();
                    var input = this.el.body.querySelector(
                        '.roster-row[data-id="' + created.id + '"] [data-field="studentNo"]');
                    input?.focus();
                    break;
                }

                case 'import-seating': this.importFromSeating(); break;
                case 'toggle-csv': this.csvOpen = !this.csvOpen; this.renderList(); break;
                case 'csv-close': this.csvOpen = false; this.renderList(); break;
                case 'csv-apply': this.applyCsv(); break;
                case 'csv-export': this.exportCsv(false); break;
                case 'csv-export-pwd': this.exportCsv(true); break;

                case 'toggle-batch': this.batchOpen = !this.batchOpen; this.renderList(); break;
                case 'batch-close': this.batchOpen = false; this.renderList(); break;
                case 'gen-missing': this.generatePasswords(false); break;
                case 'gen-all': this.generatePasswords(true); break;
                case 'set-same': this.setSamePassword(); break;
                case 'export-issued': this.exportIssued(); break;

                case 'change-admin': this.changeAdminPassword(); break;

                case 'edit-student':
                    // 关掉名单管理，打开这位同学的空间（管理员视图，能看能改）
                    if (st) {
                        this.el.modal?.classList.remove('active');
                        App.ModalSpace?.open(st.id);
                    }
                    break;

                case 'issue-pwd':
                    if (st) this.issueOne(st);
                    break;

                case 'toggle-archive':
                    if (st) {
                        st.archived = !st.archived;
                        App.Plaza.save();
                        this.renderList();
                    }
                    break;

                case 'remove':
                    if (st) this.confirmRemove(st, btn);
                    break;
            }
        },

        onChange(e) {
            var el = e.target;
            var row = el.closest('.roster-row');

            if (!row) {
                if (el.id === 'rosterDigits') this.digits = Number(el.value) || DEFAULT_DIGITS;
                return;
            }

            var st = App.Plaza.getById(row.dataset.id);
            if (!st || !el.dataset.field) return;

            var field = el.dataset.field;
            var value = el.value.trim();

            if (field === 'gender') {
                st.gender = value === 'male' || value === 'female' ? value : '';
            } else if (field === 'nickname') {
                // 昵称要全站唯一，否则登录列表会出现两个一样的主标识
                if (value) {
                    var clash = App.Plaza.students().filter(function (s) {
                        return s.id !== st.id &&
                            String(s.nickname || '').trim().toLowerCase() === value.toLowerCase();
                    })[0];

                    if (clash) {
                        App.Plaza.toast('「' + value + '」已经被 ' + App.Plaza.displayName(clash) + ' 使用了');
                        el.value = st.nickname || '';
                        return;
                    }
                }
                st.nickname = value;
            } else {
                st[field] = value;
            }

            App.Plaza.save();
        },

        onInput(e) {
            var el = e.target;

            if (el.id === 'rosterSearchInput') {
                this.query = el.value;
                this.renderList();
                // 重绘会丢焦点，把光标放回去
                var box = document.getElementById('rosterSearchInput');
                if (box) {
                    box.focus();
                    box.setSelectionRange(box.value.length, box.value.length);
                }
                return;
            }

            var row = el.closest('.roster-row');
            if (!row || !el.dataset.field || el.dataset.field === 'gender') return;

            var st = App.Plaza.getById(row.dataset.id);
            if (!st) return;

            st[el.dataset.field] = el.value.trim();
            App.Plaza.save();
        },

        // ------------------------------------------------------
        // 从座位表导入
        // ------------------------------------------------------

        importFromSeating() {
            var data = App.ModalSeating?.data;

            if (!data || !Array.isArray(data.rows) || !data.rows.length) {
                App.Plaza.toast('还没有座位表，先去「🪑 座位表」里排一下吧');
                return;
            }

            var names = [];

            data.rows.forEach(function (row) {
                (row || []).forEach(function (cell) {
                    if (cell && cell.t === 'n' && cell.n) {
                        var n = String(cell.n).trim();
                        if (n && names.indexOf(n) === -1) names.push(n);
                    }
                });
            });

            if (!names.length) {
                App.Plaza.toast('座位表里还没有人名');
                return;
            }

            var existing = {};
            App.Plaza.students(true).forEach(function (s) {
                existing[String(s.realName || '').trim()] = true;
            });

            var added = 0;

            names.forEach(function (name) {
                if (existing[name]) return;
                App.Plaza.addStudent({ realName: name });
                added += 1;
            });

            App.Plaza.save();
            this.renderList();

            App.Plaza.toast(added
                ? '从座位表导入了 ' + added + ' 位同学'
                : '座位表里的人都已经在名单里了');
        },

        // ------------------------------------------------------
        // 密码
        // ------------------------------------------------------

        async issueOne(st) {
            if (this._busy) return;

            var answer = window.prompt(
                '为 ' + App.Plaza.displayName(st) + ' 生成新的初始密码，位数：',
                String(this.digits)
            );

            if (answer === null) return;

            var n = Number(String(answer).trim());
            if (!DIGIT_CHOICES.includes(n)) {
                App.Plaza.toast('位数只能是 4 / 6 / 8 / 10 / 12');
                return;
            }

            this._busy = true;
            var pwd = await App.Plaza.issuePassword(st, n);
            this._busy = false;

            this.issued[st.id] = pwd;
            this.renderList();

            App.Plaza.toast('已生成：' + pwd + '（记得发给他）', 4000);
        },

        async generatePasswords(force) {
            if (this._busy) return;

            var digits = Number(document.getElementById('rosterDigits')?.value) || DEFAULT_DIGITS;
            this.digits = digits;

            var targets = App.Plaza.students().filter(function (s) {
                return force || !s.verifyKey;
            });

            if (!targets.length) {
                App.Plaza.toast('所有同学都已经有密码了');
                return;
            }

            var message = force
                ? '给全班 ' + targets.length + ' 人重新生成 ' + digits + ' 位密码？\n' +
                  '所有人当前的密码都会作废（隐藏的生日会自动重新加密，不会丢）。'
                : '为 ' + targets.length + ' 位还没密码的同学生成 ' + digits + ' 位密码？';

            if (!window.confirm(message)) return;

            this._busy = true;

            for (var i = 0; i < targets.length; i++) {
                var pwd = await App.Plaza.issuePassword(targets[i], digits);
                this.issued[targets[i].id] = pwd;
            }

            this._busy = false;
            this.renderList();

            App.Plaza.toast('已生成 ' + targets.length + ' 个密码，点「导出密码表 CSV」拿走', 4000);
        },

        // 全班设成同一个密码（比如刚开始统一发 12345678）
        async setSamePassword() {
            if (this._busy) return;

            var answer = window.prompt('把全班（含已隐藏资料的同学）的密码统一设为：', '12345678');
            if (answer === null) return;

            var pwd = String(answer).trim();

            if (!/^\d+$/.test(pwd) || pwd.length < App.Plaza.MIN_PASSWORD || pwd.length > App.Plaza.MAX_PASSWORD) {
                App.Plaza.toast('密码要是 ' + App.Plaza.MIN_PASSWORD + '–' +
                    App.Plaza.MAX_PASSWORD + ' 位纯数字');
                return;
            }

            var targets = App.Plaza.students();

            if (!window.confirm('把 ' + targets.length + ' 位同学的密码统一设为 ' + pwd + '？\n' +
                '隐藏的生日会自动重新加密，不会丢。')) {
                return;
            }

            this._busy = true;

            for (var i = 0; i < targets.length; i++) {
                await App.Plaza.setPasswordTo(targets[i], pwd);
                this.issued[targets[i].id] = pwd;
            }

            this._busy = false;
            this.renderList();

            App.Plaza.toast('全班密码已统一设为 ' + pwd, 4000);
        },

        async changeAdminPassword() {
            var a = window.prompt('输入新的管理员密码（8–32 位）：');
            if (a === null) return;

            var pwd = String(a).trim();

            if (pwd.length < 8 || pwd.length > 32) {
                App.Plaza.toast('管理员密码需要 8–32 位');
                return;
            }

            if (/^(.)\1*$/.test(pwd)) {
                App.Plaza.toast('不能全是同一个字符');
                return;
            }

            if (!window.confirm('确认修改管理员密码？\n隐藏生日的管理员副本由公钥保护，不受影响，不会丢数据。')) return;

            var r = await App.Plaza.changeAdminPassword(pwd);

            if (!r.ok) {
                App.Plaza.toast(r.reason === 'broken'
                    ? '管理员私钥解不开，密码没有修改；请重新设置一次管理员密码'
                    : '请先重新解锁名单管理');
                return;
            }

            App.Plaza.toast('管理员密码已修改');
        },

        // ------------------------------------------------------
        // 删除
        // ------------------------------------------------------

        confirmRemove(st, btn) {
            if (btn.dataset.confirm !== '1') {
                btn.dataset.confirm = '1';
                btn.classList.add('danger-solid');
                btn.textContent = '确认删除';

                setTimeout(function () {
                    if (!btn.isConnected) return;
                    btn.dataset.confirm = '';
                    btn.classList.remove('danger-solid');
                    btn.textContent = '删除';
                }, 3000);
                return;
            }

            var hard = window.confirm(
                '彻底删除「' + App.Plaza.displayName(st) + '」？\n\n' +
                '确定 = 连同他的关注、点赞记录一起删掉，不可恢复\n' +
                '取消 = 只从广场隐藏，数据保留（之后可以「恢复」）'
            );

            App.Plaza.removeStudent(st.id, hard);
            delete this.issued[st.id];
            this.renderList();

            App.Plaza.toast(hard ? '已彻底删除' : '已从广场隐藏');
        },

        // ------------------------------------------------------
        // CSV
        // ------------------------------------------------------

        parseCsvLine(line) {
            var out = [];
            var cur = '';
            var inQuote = false;

            for (var i = 0; i < line.length; i++) {
                var ch = line[i];

                if (inQuote) {
                    if (ch === '"') {
                        if (line[i + 1] === '"') { cur += '"'; i++; }
                        else inQuote = false;
                    } else {
                        cur += ch;
                    }
                    continue;
                }

                if (ch === '"') inQuote = true;
                else if (ch === ',' || ch === '\t' || ch === '，') { out.push(cur); cur = ''; }
                else cur += ch;
            }

            out.push(cur);

            return out.map(function (s) { return String(s).trim(); });
        },

        async applyCsv() {
            var box = document.getElementById('rosterCsvText');
            if (!box) return;

            var lines = box.value.split(/\r?\n/);
            var added = 0;
            var updated = 0;
            var skipped = 0;

            for (var i = 0; i < lines.length; i++) {
                var line = lines[i].trim();
                if (!line || line.charAt(0) === '#') continue;

                var cells = this.parseCsvLine(line);
                if (!cells.length) continue;

                // 表头行：第一格是「学号」之类的中文标题就跳过
                if (i === 0 && /^(学号|姓名|真实姓名)$/.test(cells[0])) continue;

                var studentNo = cells[0] || '';
                var realName = cells[1] || '';
                var genderRaw = (cells[2] || '').toLowerCase();
                var nickname = cells[3] || '';
                var pwd = (cells[4] || '').trim();

                if (!realName && !studentNo) { skipped += 1; continue; }

                var gender = '';
                if (/^(男|m|male)$/.test(genderRaw)) gender = 'male';
                else if (/^(女|f|female)$/.test(genderRaw)) gender = 'female';

                // 先按学号找，再按真实姓名找
                var target = null;

                if (studentNo) {
                    target = App.Plaza.students(true).filter(function (s) {
                        return String(s.studentNo || '') === studentNo;
                    })[0] || null;
                }

                if (!target && realName) {
                    target = App.Plaza.students(true).filter(function (s) {
                        return String(s.realName || '') === realName;
                    })[0] || null;
                }

                if (target) {
                    if (studentNo) target.studentNo = studentNo;
                    if (realName) target.realName = realName;
                    if (gender) target.gender = gender;
                    if (nickname) target.nickname = nickname;
                    updated += 1;
                } else {
                    target = App.Plaza.addStudent({
                        studentNo: studentNo,
                        realName: realName,
                        gender: gender,
                        nickname: nickname
                    });
                    added += 1;
                }

                if (pwd && /^\d+$/.test(pwd) && pwd.length >= App.Plaza.MIN_PASSWORD) {
                    await this.applyImportedPassword(target, pwd);
                }
            }

            App.Plaza.save();
            this.renderList();

            App.Plaza.toast('导入完成：新增 ' + added + ' 人，更新 ' + updated + ' 人' +
                (skipped ? '，跳过 ' + skipped + ' 行' : ''), 3500);
        },

        async applyImportedPassword(st, pwd) {
            await App.Plaza.setPasswordTo(st, pwd);
            this.issued[st.id] = pwd;
        },

        _download(filename, text) {
            var blob = new Blob(['﻿' + text], { type: 'text/csv;charset=utf-8' });
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');

            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
        },

        _stamp() {
            var d = App.Utils?.now ? App.Utils.now() : new Date();
            var pad = function (n) { return (n < 10 ? '0' : '') + n; };

            return '' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) +
                '-' + pad(d.getHours()) + pad(d.getMinutes());
        },

        exportCsv(withPasswords) {
            var lines = ['学号,真实姓名,性别,昵称,初始密码'];
            var issued = this.issued;

            App.Plaza.sortStudents(App.Plaza.students(true), 'default').forEach(function (st) {
                var gender = st.gender === 'male' ? '男' : (st.gender === 'female' ? '女' : '');
                var pwd = withPasswords ? (issued[st.id] || '') : '';

                lines.push([
                    st.studentNo || '',
                    csvCell(st.realName || ''),
                    gender,
                    csvCell(st.nickname || ''),
                    pwd
                ].join(','));
            });

            function csvCell(v) {
                var s = String(v || '');
                return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
            }

            this._download(
                (withPasswords ? '名单与初始密码-' : '名单-') + this._stamp() + '.csv',
                lines.join('\n')
            );

            if (withPasswords && !Object.keys(issued).length) {
                App.Plaza.toast('还没有生成过密码，密码列是空的');
            }
        },

        exportIssued() {
            var issued = this.issued;
            var ids = Object.keys(issued);

            if (!ids.length) {
                App.Plaza.toast('还没有生成过密码');
                return;
            }

            var lines = ['学号,真实姓名,昵称,初始密码'];

            App.Plaza.sortStudents(App.Plaza.students(true), 'default').forEach(function (st) {
                if (!issued[st.id]) return;
                lines.push([st.studentNo || '', st.realName || '', st.nickname || '', issued[st.id]].join(','));
            });

            this._download('初始密码-' + this._stamp() + '.csv', lines.join('\n'));
            App.Plaza.toast('已导出 ' + ids.length + ' 条密码，发完记得删掉文件', 3500);
        },

        setBusy(on, act) {
            var btn = this.el.body?.querySelector('[data-act="' + act + '"]');
            if (!btn) return;

            btn.disabled = !!on;

            if (on) {
                btn.dataset.label = btn.textContent;
                btn.textContent = '处理中…';
            } else if (btn.dataset.label) {
                btn.textContent = btn.dataset.label;
                delete btn.dataset.label;
            }
        }
    };
})();
