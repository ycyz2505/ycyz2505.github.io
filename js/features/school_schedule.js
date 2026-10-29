window.App.SchoolSchedule = {
    DAYS: [
        'sunday',
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday'
    ],

    // 显示用缩写表：只影响「当前」卡片和倒计时标题的文字，
    // 作息表原始名称一个字都不改，includes('课间') / includes('节课')
    // 这类时间判断逻辑完全不受影响。
    DISPLAY_ALIASES: {
        '晚自习预备':   '晚预',
        '第一节晚自习': '晚一',
        '第二节晚自习': '晚二',
        '第三节晚自习': '晚三',
        '第四节晚自习': '晚四',
        '放学回家':     '放学',
        '周日返校':     '返校',
        '新的一天':     '明天'
    },

    // 摘要卡数值的字号候选：比课表字号（26px）小 1px 起，内容长了再退档。
    // 行高由 CSS 固定，所以字号变化不会改变卡片尺寸。
    VALUE_SIZES: [25, 23, 21],

    init() {
        clearInterval(window.App.Timers.schoolSchedule);

        window.App.Timers.schoolSchedule = setInterval(() => {
            this.updateDisplay();
            this.updateCountdownDisplay();
        }, 1000);

        this.updateDisplay();
        this.updateCountdownDisplay();
    },

    getScheduleData() {
        if (window.App.Store) {
            return window.App.Store.get('schedule') || {};
        }

        return typeof schedule !== 'undefined'
            ? schedule
            : {};
    },

    getTimetableData() {
        if (window.App.Store) {
            return window.App.Store.get('timetable') || {};
        }

        return typeof timetable !== 'undefined'
            ? timetable
            : {};
    },

    getDateKey(date = window.App.Utils.now()) {
        const pad = value => String(value).padStart(2, '0');

        return [
            date.getFullYear(),
            pad(date.getMonth() + 1),
            pad(date.getDate())
        ].join('-');
    },

    getTemporaryTimetableOverride(day = window.App.Utils.now().getDay()) {
        const store = window.App.Store;

        if (!store) return null;

        const override = store.getSetting('temporaryTimetable');

        if (!override) return null;

        const isValid =
            override.date === this.getDateKey() &&
            Number(override.day) === Number(day) &&
            Array.isArray(override.courses);

        if (!isValid) {
            // 日期变化、星期变化或数据损坏时自动恢复原始课表
            store.setSetting('temporaryTimetable', null);
            return null;
        }

        return override;
    },

    getEffectiveCourses(day = window.App.Utils.now().getDay()) {
        const override = this.getTemporaryTimetableOverride(day);

        if (override) {
            return override.courses;
        }

        const courses =
            this.getTimetableData()[this.DAYS[day]] || [];

        return Array.isArray(courses) ? courses : [];
    },

    getTodaySchedule(day) {
        const data = this.getScheduleData();

        if (day === 5) {
            return data.friday;
        }

        if (day === 0) {
            return data.sunday;
        }

        return data.weekday;
    },

    // 下一个"当天第一个作息"（早餐 / 周末……）：{ endTime: Date, label: string }
    // 睡觉之后、周五放学之后的倒计时指向它，而不是笼统的"到午夜"。
    // 从今天开始找，取第一个还没到的 —— 凌晨 0:00 ~ 第一个作息之间
    // 目标其实是【今天】的第一个作息，不能一律按明天算。
    // 周六要单独取 saturday：getTodaySchedule 对周六会落到 weekday。
    getNextDayFirstScheduleInfo() {
        const now = window.App.Utils.now();
        const data = this.getScheduleData();

        for (let offset = 0; offset <= 1; offset++) {
            const day = new Date(now);
            day.setDate(day.getDate() + offset);

            const dow = day.getDay();
            const schedule = dow === 6
                ? data.saturday
                : this.getTodaySchedule(dow);

            if (!Array.isArray(schedule) || !schedule.length) continue;

            const [range, name] = schedule[0];
            const [hour, minute] =
                range.split('-')[0].split(':').map(Number);

            day.setHours(hour, minute, 0, 0);

            if (day > now) {
                return { endTime: day, label: name };
            }
        }

        return { endTime: '23:59', label: '新的一天' };
    },

    // 「当前」卡片的文字：查缩写表，查不到就原样显示
    getDisplayName(name) {
        if (!name) return name;

        return this.DISPLAY_ALIASES[name] || name;
    },

    // 倒计时标题的目标文字：先查缩写表，
    // 再把指向某节课的目标统一成"上课"
    getCountdownLabel(label) {
        if (!label) return label;

        const alias = this.DISPLAY_ALIASES[label];

        if (alias) return alias;

        if (/^第[一二三四五六七八九十]+节课$/.test(label)) {
            return '上课';
        }

        return label;
    },

    // ★ 修复：周日返校目标时间若已过去（如周日 17:40 之后），自动跳到下一个周日，
    //   避免出现"距离周日返校 23 小时"或"00:00"的错误显示。
    getNextSchoolDayTime(now) {
        const target = new Date(now);
        const day = target.getDay();

        const daysUntilSunday =
            day === 5 ? 2 :
            day === 6 ? 1 :
            0;

        target.setDate(target.getDate() + daysUntilSunday);
        target.setHours(17, 40, 0, 0);

        if (target <= now) {
            target.setDate(target.getDate() + 7);
        }

        return {
            endTime: target,
            label: '周日返校'
        };
    },

    getCurrentSchedule() {
        const now = window.App.Utils.now();
        const day = now.getDay();
        const currentMinutes =
            now.getHours() * 60 + now.getMinutes();

        const utils = window.App.Utils;

        if (day === 6) {
            return { current: '周末' };
        }

        // ★ 修复：作息表中"周末"到 17:40 才结束，原阈值 17:30 会让 17:30~17:40 落入通用分支
        if (
            day === 0 &&
            currentMinutes < utils.timeToMinutes('17:40')
        ) {
            return { current: '周末' };
        }

        const todaySchedule = this.getTodaySchedule(day);

        if (!todaySchedule) {
            return { current: '加载中...' };
        }

        if (
            currentMinutes >= utils.timeToMinutes('21:30') ||
            currentMinutes < utils.timeToMinutes('6:30')
        ) {
            return { current: '睡觉' };
        }

        let current = '';

        for (let i = 0; i < todaySchedule.length; i++) {
            const [timeRange, name] = todaySchedule[i];
            const [start, end] = timeRange.split('-');

            const startMinutes = utils.timeToMinutes(start);
            const endMinutes = utils.timeToMinutes(end);

            const isInRange =
                endMinutes < startMinutes
                    ? currentMinutes >= startMinutes ||
                      currentMinutes < endMinutes
                    : currentMinutes >= startMinutes &&
                      currentMinutes < endMinutes;

            if (isInRange) {
                current = name;
                break;
            }
        }

        if (!current && day === 5) {
            return { current: '放学' };
        }

        return { current: current || '休息' };
    },

    // options.renderTimetable === false 时只更新文字，
    // 跳过课表 HTML 重建（时间预览滑动时用，避免高频 DOM 重建）
    updateDisplay(options) {
        const day = window.App.Utils.now().getDay();
        const result = this.getCurrentSchedule();

        const currentElement =
            document.getElementById('currentSchedule');

        // '当前'只显示作息名称（第一节课 / 课间 / 早餐 等），不显示科目名。
        if (currentElement) {
            currentElement.textContent =
                this.getDisplayName(result.current);

            window.App.Utils.fitFontSize(
                currentElement,
                this.VALUE_SIZES
            );
        }

        if (!options || options.renderTimetable !== false) {
            this.renderTimetable(day);
        }
    },

    // 与课表每一行一一对应的作息时间段（早读 / 各节课 / 晚自习 / 考试），
    // 用来判断每节课是已过、进行中还是未到。
    getCourseSlots(day) {
        const todaySchedule = this.getTodaySchedule(day);

        if (!Array.isArray(todaySchedule)) return [];

        const utils = window.App.Utils;

        return todaySchedule
            .filter(([, name]) =>
                name.includes('早读') ||
                name.includes('节课') ||
                name.includes('节晚自习') ||
                name.endsWith('考试')
            )
            .map(([timeRange]) => {
                const [start, end] = timeRange.split('-');

                return {
                    start: utils.timeToMinutes(start),
                    end: utils.timeToMinutes(end)
                };
            });
    },

    renderTimetable(day) {
        const container =
            document.getElementById('todayTimetable');

        if (!container) return;

        const centered = text =>
            `<div class="timetable-item">${text}</div>`;

        if (day === 6) {
            container.innerHTML = centered('周末无课表');
            return;
        }

        const courses = this.getEffectiveCourses(day);

        if (!courses.length) {
            container.innerHTML = centered('暂无数据');
            return;
        }

        const now = window.App.Utils.now();
        const nowMinutes = now.getHours() * 60 + now.getMinutes();
        const slots = this.getCourseSlots(day);

        container.innerHTML = courses
            .map((course, index) => {
                let label = '';
                let showDivider = false;

                if (day === 0) {
                    label = `晚${index + 1}`;
                } else if (index === 0) {
                    label = '早';
                    showDivider = true;
                } else if (index <= 8) {
                    label = String(index);

                    if (index === 4 || index === 8) {
                        showDivider = true;
                    }
                } else {
                    label = `晚${index - 8}`;
                }

                // 已过 / 进行中 / 未到
                const slot = slots[index];
                let state = 'future';

                if (slot) {
                    if (nowMinutes >= slot.end) {
                        state = 'past';
                    } else if (nowMinutes >= slot.start) {
                        state = 'current';
                    }
                }

                const rowClass = [
                    'timetable-row',
                    showDivider ? 'timetable-row-divider' : '',
                    `timetable-row--${state}`
                ].filter(Boolean).join(' ');

                return `
                    <div class="${rowClass}">
                        <div class="timetable-label">${label}</div>
                        <div class="timetable-course">${course}</div>
                    </div>
                `;
            })
            .join('');
    },

    getNextScheduleInfo() {
        const now = window.App.Utils.now();
        const day = now.getDay();
        const currentMinutes =
            now.getHours() * 60 + now.getMinutes();

        const utils = window.App.Utils;
        const todaySchedule = this.getTodaySchedule(day);

        if (!todaySchedule) {
            return {
                endTime: '23:59',
                label: '加载中'
            };
        }

        const current = this.getCurrentSchedule().current;

        if (
            current === '放学' ||
            day === 6 ||
            (day === 0 && current === '周末')
        ) {
            return this.getNextSchoolDayTime(now);
        }

        const currentIndex = todaySchedule.findIndex(
            ([timeRange]) => {
                const [start, end] = timeRange.split('-');

                const startMinutes =
                    utils.timeToMinutes(start);

                const endMinutes =
                    utils.timeToMinutes(end);

                return endMinutes < startMinutes
                    ? currentMinutes >= startMinutes ||
                      currentMinutes < endMinutes
                    : currentMinutes >= startMinutes &&
                      currentMinutes < endMinutes;
            }
        );

        if (currentIndex === -1) {
            return this.getNextDayFirstScheduleInfo();
        }

        const currentItem = todaySchedule[currentIndex];
        const currentRange = currentItem[0];
        const currentName = currentItem[1];

        if (currentName.includes('课间')) {
            return {
                endTime: currentRange.split('-')[1],
                label: '上课'
            };
        }

        if (
            currentName.includes('节课') ||
            currentName.includes('晚自习') ||
            currentName.includes('早读') ||
            currentName.endsWith('考试')
        ) {
            return {
                endTime: currentRange.split('-')[1],
                label: '下课'
            };
        }

        const nextIndex = currentIndex + 1;

        if (nextIndex < todaySchedule.length) {
            return {
                endTime: todaySchedule[nextIndex][0].split('-')[0],
                label: todaySchedule[nextIndex][1]
            };
        }

        return this.getNextDayFirstScheduleInfo();
    },

    updateCountdownDisplay() {
        // 滚轮调音量时，这个数字暂时由播放器接管显示音量
        if (window.App.Music?.volumeHudActive?.()) return;

        const result = this.getNextScheduleInfo();
        const now = window.App.Utils.now();

        let target;

        if (result.endTime instanceof Date) {
            target = result.endTime;
        } else {
            const [hour, minute] =
                result.endTime.split(':').map(Number);

            target = new Date(now);
            target.setHours(hour, minute, 0, 0);

            if (target < now) {
                target.setDate(target.getDate() + 1);
            }
        }

        const difference = Math.max(0, target - now);
        const totalSeconds = Math.floor(difference / 1000);

        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor(
            (totalSeconds % 3600) / 60
        );
        const seconds = totalSeconds % 60;

        const pad = value =>
            String(value).padStart(2, '0');

        const timerElement =
            document.getElementById('countdownTimer');

        const labelElement =
            document.getElementById('countdownName');

        if (labelElement) {
            labelElement.textContent =
                `距离${this.getCountdownLabel(result.label)}`;
        }

        if (timerElement) {
            timerElement.textContent =
                hours > 0
                    ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
                    : `${pad(minutes)}:${pad(seconds)}`;

            window.App.Utils.fitFontSize(
                timerElement,
                this.VALUE_SIZES
            );
        }
    }
};