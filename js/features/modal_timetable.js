window.App.ModalTimetable = {
    DAYS: [
        'sunday',
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday'
    ],

    init() {
        this.bindEvents();
        this.render();
    },

    bindEvents() {
        document
            .getElementById('settingsButton')
            ?.addEventListener('click', () => {
                // 设置弹窗打开时重新读取一次，确保跨天后界面同步
                window.setTimeout(() => this.render(), 0);
            });

        document
            .getElementById('saveTemporaryTimetable')
            ?.addEventListener('click', () => {
                this.save();
            });

        document
            .getElementById('resetTemporaryTimetable')
            ?.addEventListener('click', () => {
                this.reset();
            });
    },

    getDateKey(date = new Date()) {
        const pad = value =>
            String(value).padStart(2, '0');

        return [
            date.getFullYear(),
            pad(date.getMonth() + 1),
            pad(date.getDate())
        ].join('-');
    },

    getDateLabel(date = new Date()) {
        const dayNames = [
            '日',
            '一',
            '二',
            '三',
            '四',
            '五',
            '六'
        ];

        return `${date.getFullYear()}年${
            date.getMonth() + 1
        }月${date.getDate()}日 周${dayNames[date.getDay()]}`;
    },

    getOriginalCourses(day) {
        const schedule = window.App.SchoolSchedule;

        if (!schedule) return [];

        const data = schedule.getTimetableData();
        const courses = data[this.DAYS[day]] || [];

        return Array.isArray(courses)
            ? courses.slice()
            : [];
    },

    getValidOverride(day) {
        const store = window.App.Store;

        if (!store) return null;

        const override =
            store.getSetting('temporaryTimetable');

        if (!override) return null;

        const valid =
            override.date === this.getDateKey() &&
            Number(override.day) === Number(day) &&
            Array.isArray(override.courses);

        if (!valid) {
            store.setSetting(
                'temporaryTimetable',
                null
            );

            return null;
        }

        return override;
    },

    getCourseLabel(day, index) {
        if (day === 0) {
            return `晚${index + 1}`;
        }

        if (index === 0) {
            return '早';
        }

        if (index <= 8) {
            return String(index);
        }

        return `晚${index - 8}`;
    },

    escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    },

    render() {
        const editor =
            document.getElementById(
                'temporaryTimetableEditor'
            );

        const dateElement =
            document.getElementById(
                'temporaryTimetableDate'
            );

        const statusElement =
            document.getElementById(
                'temporaryTimetableStatus'
            );

        const saveButton =
            document.getElementById(
                'saveTemporaryTimetable'
            );

        const resetButton =
            document.getElementById(
                'resetTemporaryTimetable'
            );

        if (!editor) return;

        const date = new Date();
        const day = date.getDay();

        const originalCourses =
            this.getOriginalCourses(day);

        const override =
            this.getValidOverride(day);

        const courses = override
            ? override.courses.slice()
            : originalCourses.slice();

        if (dateElement) {
            dateElement.textContent =
                this.getDateLabel(date);
        }

        if (!courses.length) {
            editor.innerHTML = `
                <div class="timetable-editor-note">
                    今天暂无可编辑的课表数据。
                </div>
            `;

            if (saveButton) saveButton.disabled = true;
            if (resetButton) resetButton.disabled = true;

            if (statusElement) {
                statusElement.textContent = '';
            }

            return;
        }

        editor.innerHTML = courses
            .map((course, index) => `
                <label class="timetable-editor-row">
                    <span class="timetable-editor-label">
                        ${this.getCourseLabel(day, index)}
                    </span>
                    <input
                        class="timetable-course-input"
                        type="text"
                        data-course-index="${index}"
                        value="${this.escapeHtml(course)}"
                        maxlength="30"
                    >
                </label>
            `)
            .join('');

        if (saveButton) saveButton.disabled = false;
        if (resetButton) resetButton.disabled = !override;

        if (statusElement) {
            statusElement.textContent = override
                ? '今日临时课表已生效'
                : '当前使用原始课表';
        }
    },

    save() {
        const store = window.App.Store;
        const editor =
            document.getElementById(
                'temporaryTimetableEditor'
            );

        const statusElement =
            document.getElementById(
                'temporaryTimetableStatus'
            );

        if (!store || !editor) {
            if (statusElement) {
                statusElement.textContent =
                    '存储模块未初始化';
            }

            return;
        }

        const date = new Date();
        const day = date.getDay();

        const inputs = [
            ...editor.querySelectorAll(
                '.timetable-course-input'
            )
        ];

        if (!inputs.length) return;

        const courses = inputs.map(input =>
            input.value.trim()
        );

        store.setSetting('temporaryTimetable', {
            date: this.getDateKey(date),
            day,
            courses
        });

        window.App.SchoolSchedule?.updateDisplay();
        this.render();

        if (statusElement) {
            statusElement.textContent =
                '已保存，仅今天生效';
        }
    },

    reset() {
        const store = window.App.Store;

        if (!store) return;

        store.setSetting(
            'temporaryTimetable',
            null
        );

        window.App.SchoolSchedule?.updateDisplay();
        this.render();

        const statusElement =
            document.getElementById(
                'temporaryTimetableStatus'
            );

        if (statusElement) {
            statusElement.textContent =
                '已恢复原始课表';
        }
    }
};