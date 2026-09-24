window.App.SchoolSchedule = {
    DAYS: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],

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
        return typeof schedule !== 'undefined' ? schedule : window.schedule || {};
    },

    getTimetableData() {
        return typeof timetable !== 'undefined' ? timetable : window.timetable || {};
    },

    getTodaySchedule(day) {
        const data = this.getScheduleData();
        if (day === 5) return data.friday;
        if (day === 0) return data.sunday;
        return data.weekday;
    },

    getCourseName(day, lessonIndex) {
        const courses = this.getTimetableData()[this.DAYS[day]] || [];
        // 周日只有晚自习；周一至周五需整体 +1（第 0 项是早自习）
        return courses[day === 0 ? lessonIndex : lessonIndex + 1] || '';
    },

    isCourseSchedule(name) {
        if (!name) return false;
        return name.includes('节课') || name.includes('晚自习') || name.endsWith('考试');
    },

    getLessonItems(todaySchedule) {
        if (!Array.isArray(todaySchedule)) return [];
        return todaySchedule.filter(item => this.isCourseSchedule(item[1]));
    },

    getNextSchoolDayTime(now) {
        const target = new Date(now);
        const day = target.getDay();
        const daysUntilSunday = day === 5 ? 2 : day === 6 ? 1 : 0;

        target.setDate(target.getDate() + daysUntilSunday);
        target.setHours(17, 30, 0, 0);

        return { endTime: target, label: '周日返校' };
    },

    getCurrentSchedule() {
        const now = new Date();
        const day = now.getDay();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const utils = window.App.Utils;

        if (day === 6) return { current: '周末', nextLesson: '' };

        if (day === 0 && currentMinutes < utils.timeToMinutes('17:30')) {
            return { current: '周末', nextLesson: '第一节晚自习' };
        }

        const todaySchedule = this.getTodaySchedule(day);
        if (!todaySchedule) return { current: '加载中...', nextLesson: '' };

        if (currentMinutes >= utils.timeToMinutes('21:30') || currentMinutes < utils.timeToMinutes('6:30')) {
            return { current: '睡觉', nextLesson: '无' };
        }

        let current = '';
        let currentIndex = -1;

        for (let i = 0; i < todaySchedule.length; i++) {
            const [timeRange, name] = todaySchedule[i];
            const [start, end] = timeRange.split('-');
            const startMinutes = utils.timeToMinutes(start);
            const endMinutes = utils.timeToMinutes(end);

            const isInRange = endMinutes < startMinutes
                ? currentMinutes >= startMinutes || currentMinutes < endMinutes
                : currentMinutes >= startMinutes && currentMinutes < endMinutes;

            if (isInRange) {
                current = name;
                currentIndex = i;
                break;
            }
        }

        let nextLesson = '';
        if (currentIndex >= 0) {
            for (let i = currentIndex + 1; i < todaySchedule.length; i++) {
                const name = todaySchedule[i][1];
                if (this.isCourseSchedule(name)) {
                    nextLesson = name;
                    break;
                }
            }
        }

        if (!current && day === 5) return { current: '放学', nextLesson: '无' };

        return { current: current || '休息', nextLesson: nextLesson || '无' };
    },

    getCourseDisplayName(day, scheduleName) {
        if (!this.isCourseSchedule(scheduleName)) return scheduleName;

        const lessonItems = this.getLessonItems(this.getTodaySchedule(day));
        const lessonIndex = lessonItems.findIndex(item => item[1] === scheduleName);

        return lessonIndex < 0 ? scheduleName : (this.getCourseName(day, lessonIndex) || scheduleName);
    },

    updateDisplay() {
        const day = new Date().getDay();
        const result = this.getCurrentSchedule();

        const currentElement = document.getElementById('currentSchedule');
        const nextElement = document.getElementById('nextSchedule');

        if (currentElement) currentElement.textContent = this.getCourseDisplayName(day, result.current);
        if (nextElement) {
            nextElement.textContent = result.nextLesson === '无'
                ? '无'
                : this.getCourseDisplayName(day, result.nextLesson);
        }

        this.renderTimetable(day);
    },

    renderTimetable(day) {
        const container = document.getElementById('todayTimetable');
        if (!container) return;

        const centered = (text) =>
            `<div class="timetable-item" style="font-family: STZhongSong, cursive; font-size:24px; text-align:center;">${text}</div>`;

        if (day === 6) {
            container.innerHTML = centered('周末无课表');
            return;
        }

        const courses = this.getTimetableData()[this.DAYS[day]] || [];
        if (!courses.length) {
            container.innerHTML = centered('暂无数据');
            return;
        }

        container.innerHTML = courses.map((course, index) => {
            let label = '';
            let showDivider = false;

            if (day === 0) {
                label = `晚${index + 1}`;
            } else if (index === 0) {
                label = '早';
                showDivider = true;
            } else if (index <= 8) {
                label = String(index);
                if (index === 4 || index === 8) showDivider = true;
            } else {
                label = `晚${index - 8}`;
            }

            let itemStyle =
                'display:flex;align-items:center;font-family:STZhongSong,cursive;' +
                'font-size:24px;line-height:1;padding:2px 0;';

            if (showDivider) {
                itemStyle += 'border-bottom:2px dashed #ddd;margin-bottom:6px;padding-bottom:6px;';
            }

            return `
                <div style="${itemStyle}">
                    <div style="width:42%;text-align:right;padding-right:15px;color:#8bc34a;font-weight:bold;">
                        ${label}
                    </div>
                    <div style="width:58%;text-align:left;padding-left:5px;color:#333;">
                        ${course}
                    </div>
                </div>
            `;
        }).join('');
    },

    getNextScheduleInfo() {
        const now = new Date();
        const day = now.getDay();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const utils = window.App.Utils;

        const todaySchedule = this.getTodaySchedule(day);
        if (!todaySchedule) return { endTime: '23:59', label: '加载中' };

        const current = this.getCurrentSchedule().current;

        if (current === '放学' || day === 6 || (day === 0 && current === '周末')) {
            return this.getNextSchoolDayTime(now);
        }

        if (current === '午休') {
            const firstPart = currentMinutes < utils.timeToMinutes('13:10');
            return {
                endTime: firstPart ? '13:10' : '13:40',
                label: firstPart ? '熄灯' : '起床'
            };
        }

        const currentIndex = todaySchedule.findIndex(([timeRange]) => {
            const [start, end] = timeRange.split('-');
            const startMinutes = utils.timeToMinutes(start);
            const endMinutes = utils.timeToMinutes(end);

            return endMinutes < startMinutes
                ? currentMinutes >= startMinutes || currentMinutes < endMinutes
                : currentMinutes >= startMinutes && currentMinutes < endMinutes;
        });

        if (currentIndex === -1) return { endTime: '23:59', label: '新的一天' };

        const currentItem = todaySchedule[currentIndex];
        const currentRange = currentItem[0];
        const currentName = currentItem[1];

        if (currentName.includes('课间')) {
            return { endTime: currentRange.split('-')[1], label: '上课' };
        }

        if (
            currentName.includes('节课') ||
            currentName.includes('晚自习') ||
            currentName.includes('早读') ||
            currentName.endsWith('考试')
        ) {
            return { endTime: currentRange.split('-')[1], label: '下课' };
        }

        const nextIndex = currentIndex + 1;
        if (nextIndex < todaySchedule.length) {
            return {
                endTime: todaySchedule[nextIndex][0].split('-')[0],
                label: todaySchedule[nextIndex][1]
            };
        }

        return { endTime: '23:59', label: '新的一天' };
    },

    updateCountdownDisplay() {
        const result = this.getNextScheduleInfo();
        const now = new Date();

        let target;
        if (result.endTime instanceof Date) {
            target = result.endTime;
        } else {
            const [hour, minute] = result.endTime.split(':').map(Number);
            target = new Date(now);
            target.setHours(hour, minute, 0, 0);
            if (target < now) target.setDate(target.getDate() + 1);
        }

        const difference = Math.max(0, target - now);
        const totalSeconds = Math.floor(difference / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        const pad = n => String(n).padStart(2, '0');

        const timerElement = document.getElementById('countdownTimer');
        const labelElement = document.getElementById('countdownName');

        if (labelElement) labelElement.textContent = `距离${result.label}还有：`;

        if (timerElement) {
            timerElement.textContent = hours > 0
                ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
                : `${pad(minutes)}:${pad(seconds)}`;
        }
    }
};
