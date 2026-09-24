window.App.SchoolSchedule = {
    init() {
        if (window.App.Timers.schoolSchedule) {
            clearInterval(window.App.Timers.schoolSchedule);
        }

        window.App.Timers.schoolSchedule = setInterval(() => {
            this.updateDisplay();
            this.updateCountdownDisplay();
        }, 1000);

        this.updateDisplay();
        this.updateCountdownDisplay();
    },

    getScheduleData() {
        return typeof schedule !== 'undefined'
            ? schedule
            : window.schedule || {};
    },

    getTimetableData() {
        return typeof timetable !== 'undefined'
            ? timetable
            : window.timetable || {};
    },

    getCourseName(day, lessonIndex) {
        const days = [
            'sunday',
            'monday',
            'tuesday',
            'wednesday',
            'thursday',
            'friday',
            'saturday'
        ];

        const timetableData = this.getTimetableData();
        const dayName = days[day];
        const courses = timetableData[dayName] || [];

        /*
         * 周日课表只有晚自习，课表下标从 0 开始。
         */
        if (day === 0) {
            return courses[lessonIndex] || '';
        }

        /*
         * 周一至周五的课表结构：
         *
         * timetable:
         * 0     早自习
         * 1-8   第一节至第八节课
         * 9-12  晚自习
         *
         * schedule 中的 lessonIndex 只统计：
         * 第一节课、第二节课……晚自习
         *
         * 因此需要整体加 1。
         */
        const timetableIndex = lessonIndex + 1;

        return courses[timetableIndex] || '';
    },

    isCourseSchedule(name) {
        if (!name) return false;

        return (
            name.includes('节课') ||
            name.includes('晚自习') ||
            name.endsWith('考试')
        );
    },

    getLessonItems(todaySchedule) {
        if (!Array.isArray(todaySchedule)) {
            return [];
        }

        return todaySchedule.filter(item => {
            const name = item[1];
            return this.isCourseSchedule(name);
        });
    },

    getNextSchoolDayTime(now) {
        const target = new Date(now);
        const day = target.getDay();

        let daysUntilSunday = 0;

        if (day === 5) {
            daysUntilSunday = 2;
        } else if (day === 6) {
            daysUntilSunday = 1;
        } else if (day === 0) {
            daysUntilSunday = 0;
        }

        target.setDate(target.getDate() + daysUntilSunday);
        target.setHours(17, 30, 0, 0);

        return {
            endTime: target,
            label: '周日返校'
        };
    },

    getCurrentSchedule() {
        const now = new Date();
        const day = now.getDay();
        const currentMinutes =
            now.getHours() * 60 + now.getMinutes();

        const utils = window.App.Utils;
        const scheduleData = this.getScheduleData();

        if (day === 6) {
            return {
                current: '周末',
                nextLesson: ''
            };
        }

        if (
            day === 0 &&
            currentMinutes < utils.timeToMinutes('17:30')
        ) {
            return {
                current: '周末',
                nextLesson: '第一节晚自习'
            };
        }

        let todaySchedule;

        if (day === 5) {
            todaySchedule = scheduleData.friday;
        } else if (day === 0) {
            todaySchedule = scheduleData.sunday;
        } else {
            todaySchedule = scheduleData.weekday;
        }

        if (!todaySchedule) {
            return {
                current: '加载中...',
                nextLesson: ''
            };
        }

        /*
         * 特别处理跨天睡觉时间。
         */
        if (
            currentMinutes >= utils.timeToMinutes('21:30') ||
            currentMinutes < utils.timeToMinutes('6:30')
        ) {
            return {
                current: '睡觉',
                nextLesson: '无'
            };
        }

        let current = '';
        let currentIndex = -1;

        for (let i = 0; i < todaySchedule.length; i++) {
            const [timeRange, name] = todaySchedule[i];
            const [start, end] = timeRange.split('-');

            const startMinutes = utils.timeToMinutes(start);
            const endMinutes = utils.timeToMinutes(end);

            let isInRange = false;

            if (endMinutes < startMinutes) {
                isInRange =
                    currentMinutes >= startMinutes ||
                    currentMinutes < endMinutes;
            } else {
                isInRange =
                    currentMinutes >= startMinutes &&
                    currentMinutes < endMinutes;
            }

            if (isInRange) {
                current = name;
                currentIndex = i;
                break;
            }
        }

        let nextLesson = '';

        /*
         * 这里不能简单地把当前项目的下一项作为“下一节课”，
         * 因为早读、课间、大课间等都不是课程。
         *
         * 例如：
         * 早读 -> 第一节课
         * 第一节课 -> 第二节课
         */
        if (currentIndex >= 0) {
            for (
                let i = currentIndex + 1;
                i < todaySchedule.length;
                i++
            ) {
                const name = todaySchedule[i][1];

                if (this.isCourseSchedule(name)) {
                    nextLesson = name;
                    break;
                }
            }
        }

        if (!current && day === 5) {
            return {
                current: '放学',
                nextLesson: '无'
            };
        }

        return {
            current: current || '休息',
            nextLesson: nextLesson || '无'
        };
    },

    getCourseDisplayName(day, scheduleName) {
        if (!this.isCourseSchedule(scheduleName)) {
            return scheduleName;
        }

        const scheduleData = this.getScheduleData();

        let todaySchedule;

        if (day === 5) {
            todaySchedule = scheduleData.friday;
        } else if (day === 0) {
            todaySchedule = scheduleData.sunday;
        } else {
            todaySchedule = scheduleData.weekday;
        }

        const lessonItems = this.getLessonItems(todaySchedule);
        const lessonIndex = lessonItems.findIndex(item => {
            return item[1] === scheduleName;
        });

        if (lessonIndex < 0) {
            return scheduleName;
        }

        return this.getCourseName(day, lessonIndex) || scheduleName;
    },

    updateDisplay() {
        const day = new Date().getDay();
        const result = this.getCurrentSchedule();

        const currentElement =
            document.getElementById('currentSchedule');

        const nextElement =
            document.getElementById('nextSchedule');

        if (currentElement) {
            currentElement.textContent = this.getCourseDisplayName(
                day,
                result.current
            );
        }

        if (nextElement) {
            nextElement.textContent =
                result.nextLesson === '无'
                    ? '无'
                    : this.getCourseDisplayName(
                        day,
                        result.nextLesson
                    );
        }

        this.renderTimetable(day);
    },

    renderTimetable(day) {
        const container =
            document.getElementById('todayTimetable');

        if (!container) return;

        if (day === 6) {
            container.innerHTML =
                '<div class="timetable-item" ' +
                'style="font-family: STZhongSong, cursive; ' +
                'font-size:24px; text-align:center;">' +
                '周末无课表</div>';

            return;
        }

        const days = [
            'sunday',
            'monday',
            'tuesday',
            'wednesday',
            'thursday',
            'friday',
            'saturday'
        ];

        const timetableData = this.getTimetableData();
        const courses = timetableData[days[day]] || [];

        if (!courses.length) {
            container.innerHTML =
                '<div class="timetable-item" ' +
                'style="font-family: STZhongSong, cursive; ' +
                'font-size:24px; text-align:center;">' +
                '暂无数据</div>';

            return;
        }

        container.innerHTML = courses.map((course, index) => {
            let label = '';
            let showDivider = false;

            if (day === 0) {
                label = `晚${index + 1}`;
            } else {
                if (index === 0) {
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
            }

            let itemStyle =
                'display:flex;' +
                'align-items:center;' +
                'font-family:STZhongSong,cursive;' +
                'font-size:24px;' +
                'line-height:1;' +
                'padding:2px 0;';

            if (showDivider) {
                itemStyle +=
                    'border-bottom:2px dashed #ddd;' +
                    'margin-bottom:6px;' +
                    'padding-bottom:6px;';
            }

            return `
                <div style="${itemStyle}">
                    <div style="
                        width:42%;
                        text-align:right;
                        padding-right:15px;
                        color:#8bc34a;
                        font-weight:bold;
                    ">
                        ${label}
                    </div>

                    <div style="
                        width:58%;
                        text-align:left;
                        padding-left:5px;
                        color:#333;
                    ">
                        ${course}
                    </div>
                </div>
            `;
        }).join('');
    },

    getNextScheduleInfo() {
        const now = new Date();
        const day = now.getDay();
        const currentMinutes =
            now.getHours() * 60 + now.getMinutes();

        const utils = window.App.Utils;
        const scheduleData = this.getScheduleData();

        let todaySchedule;

        if (day === 5) {
            todaySchedule = scheduleData.friday;
        } else if (day === 0) {
            todaySchedule = scheduleData.sunday;
        } else {
            todaySchedule = scheduleData.weekday;
        }

        if (!todaySchedule) {
            return {
                endTime: '23:59',
                label: '加载中'
            };
        }

        const currentResult = this.getCurrentSchedule();
        const current = currentResult.current;

        if (
            current === '放学' ||
            day === 6 ||
            (day === 0 && current === '周末')
        ) {
            return this.getNextSchoolDayTime(now);
        }

        if (current === '午休') {
            const firstPart =
                currentMinutes < utils.timeToMinutes('13:10');

            return {
                endTime: firstPart ? '13:10' : '13:40',
                label: firstPart ? '熄灯' : '起床'
            };
        }

        let currentIndex = todaySchedule.findIndex(([timeRange]) => {
            const [start, end] = timeRange.split('-');

            const startMinutes = utils.timeToMinutes(start);
            const endMinutes = utils.timeToMinutes(end);

            if (endMinutes < startMinutes) {
                return (
                    currentMinutes >= startMinutes ||
                    currentMinutes < endMinutes
                );
            }

            return (
                currentMinutes >= startMinutes &&
                currentMinutes < endMinutes
            );
        });

        if (currentIndex === -1) {
            return {
                endTime: '23:59',
                label: '新的一天'
            };
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

        return {
            endTime: '23:59',
            label: '新的一天'
        };
    },

    updateCountdownDisplay() {
        const result = this.getNextScheduleInfo();
        const now = new Date();

        let target;
        let label = result.label;

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

        let difference = target - now;

        if (difference < 0) {
            difference = 0;
        }

        const totalSeconds = Math.floor(difference / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor(
            (totalSeconds % 3600) / 60
        );
        const seconds = totalSeconds % 60;

        const timerElement =
            document.getElementById('countdownTimer');

        const labelElement =
            document.getElementById('countdownName');

        if (labelElement) {
            labelElement.textContent = `距离${label}还有：`;
        }

        if (timerElement) {
            if (hours > 0) {
                timerElement.textContent =
                    `${String(hours).padStart(2, '0')}:` +
                    `${String(minutes).padStart(2, '0')}:` +
                    `${String(seconds).padStart(2, '0')}`;
            } else {
                timerElement.textContent =
                    `${String(minutes).padStart(2, '0')}:` +
                    `${String(seconds).padStart(2, '0')}`;
            }
        }
    }
};