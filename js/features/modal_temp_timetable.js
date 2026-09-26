// ============================================================
//  js/features/modal_temp_timetable.js
//  临时编辑今日课表
//  数据存 Store 的 tempTimetable：{ date: 'YYYY-MM-DD', courses: [...] }
//  仅当 date 等于今天时生效，第二天自动恢复原始课表
// ============================================================
window.App.ModalTempTimetable = {
    // 编辑中的副本（数组，元素为课程名）
    editing: [],

    init() {
        document.getElementById('editTempTimetableBtn')?.addEventListener('click', () => {
            // 先关掉设置模态框，视觉上更干净
            document.getElementById('settingsModal')?.classList.remove('active');
            this.open();
        });

        document.getElementById('closeTempTimetable')?.addEventListener('click', () => {
            document.getElementById('tempTimetableModal')?.classList.remove('active');
        });

        document.getElementById('addTempCourseBtn')?.addEventListener('click', () => {
            this.editing.push('');
            this.render();
            // 滚到底部方便输入
            const list = document.getElementById('tempTimetableList');
            if (list) list.scrollTop = list.scrollHeight;
            // 自动聚焦新建的输入框
            const rows = list?.querySelectorAll('.temp-course-input');
            rows?.[rows.length - 1]?.focus();
        });

        document.getElementById('saveTempTimetableBtn')?.addEventListener('click', () => {
            this.save();
        });

        document.getElementById('resetTempTimetableBtn')?.addEventListener('click', () => {
            this.reset();
        });
    },

    // ---------- 工具 ----------
    todayKey() {
        const d = new Date();
        const pad = n => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    },

    // 根据课程索引返回标签（与 SchoolSchedule.renderTimetable 保持一致）
    getLabelForIndex(day, index) {
        if (day === 0) return `晚${index + 1}`;       // 周日只有晚自习
        if (index === 0) return '早';                 // 周一~周五第 0 项是早读
        if (index <= 8) return String(index);         // 1~8 节课
        return `晚${index - 8}`;                       // 晚自习
    },

    // ---------- 打开 / 关闭 ----------
    open() {
        const day = new Date().getDay();
        const key = this.todayKey();
        const temp = window.App.Store?.get('tempTimetable');

        if (temp && temp.date === key && Array.isArray(temp.courses)) {
            // 已有今日临时课表 → 继续编辑
            this.editing = temp.courses.slice();
        } else {
            // 载入原始课表（深拷贝）
            const base = window.App.SchoolSchedule?.getBaseCourses(day) || [];
            this.editing = base.slice();
        }

        this.render();
        this.updateHint();
        document.getElementById('tempTimetableModal')?.classList.add('active');
    },

    // ---------- 渲染 ----------
    render() {
        const day = new Date().getDay();
        const container = document.getElementById('tempTimetableList');
        if (!container) return;

        container.innerHTML = '';
        const frag = document.createDocumentFragment();

        if (this.editing.length === 0) {
            const empty = document.createElement('div');
            empty.style.cssText = 'text-align:center;color:#999;padding:30px;font-style:italic;';
            empty.textContent = '今日暂无课程，点击下方「+ 添加一节课」开始编辑';
            container.appendChild(empty);
            return;
        }

        this.editing.forEach((course, idx) => {
            const row = document.createElement('div');
            row.className = 'temp-course-row';

            const label = document.createElement('span');
            label.className = 'temp-course-label';
            label.textContent = this.getLabelForIndex(day, idx);

            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'temp-course-input';
            input.value = course;
            input.placeholder = '输入课程名，如：数学';
            input.addEventListener('input', () => {
                this.editing[idx] = input.value;
            });

            const del = document.createElement('button');
            del.className = 'temp-course-del';
            del.textContent = '删除';
            del.addEventListener('click', () => {
                this.editing.splice(idx, 1);
                this.render();
            });

            row.appendChild(label);
            row.appendChild(input);
            row.appendChild(del);
            frag.appendChild(row);
        });

        container.appendChild(frag);
    },

    updateHint() {
        const hint = document.getElementById('tempTimetableHint');
        if (!hint) return;

        const key = this.todayKey();
        const temp = window.App.Store?.get('tempTimetable');

        if (temp && temp.date === key && Array.isArray(temp.courses)) {
            hint.innerHTML =
                `<span style="color:#ff9800;">● 当前正在使用 <b>${key}</b> 的临时课表。</span><br>` +
                `修改后点击「保存」生效；点击「恢复原始课表」可撤销。第二天打开网页会自动恢复。`;
        } else {
            hint.innerHTML =
                `<span style="color:#4CAF50;">● 当前显示的是原始课表。</span><br>` +
                `修改后点击「保存」，今日课表将被临时覆盖，第二天自动恢复。`;
        }
    },

    // ---------- 保存 ----------
    save() {
        const key = this.todayKey();
        const courses = this.editing.map(c => String(c ?? '').trim());

        if (window.App.Store) {
            window.App.Store.set('tempTimetable', {
                date: key,
                courses: courses
            });
        }

        // 通知课表模块重渲染
        window.App.SchoolSchedule?.updateDisplay();

        document.getElementById('tempTimetableModal')?.classList.remove('active');
    },

    // ---------- 恢复原始 ----------
    reset() {
        if (window.App.Store) {
            window.App.Store.set('tempTimetable', null);
        }

        const day = new Date().getDay();
        const base = window.App.SchoolSchedule?.getBaseCourses(day) || [];
        this.editing = base.slice();

        this.render();
        this.updateHint();

        window.App.SchoolSchedule?.updateDisplay();
    }
};