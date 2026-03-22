window.App.SchoolSchedule = {
    init() {
        setInterval(() => this.updateDisplay(), 1000);
        this.updateCountdownDisplay();
    },

    // 补回原有的获取课程名称方法
    getCourseName(day, lessonIndex) {
        const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
        const timetableDay = timetable[days[day]]; // timetable 来自外部的 data 数据
        return timetableDay ? timetableDay[lessonIndex] : "";
    },

    // 补回原有的获取周一返校时间方法
    getNextSchoolDayTime(now) {
        const target = new Date(now);
        let daysUntilMonday = (1 + 7 - target.getDay()) % 7; 
        if (target.getDay() === 1 && target.getHours() < 7) daysUntilMonday = 0;
        target.setDate(target.getDate() + daysUntilMonday);
        target.setHours(7, 0, 0, 0);
        return { endTime: target, label: "周一返校" };
    },

    getCurrentSchedule() {
        const now = new Date();
        const day = now.getDay();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const utils = window.App.Utils; // 引用工具类

        // 如果是周末
        if(day === 0 || day === 6) return {current: "周末", nextLesson: ""};
        const todaySchedule = (day === 5) ? schedule.friday : schedule.weekday;
        let current = "";
        let nextLesson = "";

        // 处理跨天时段（22:20-7:00）
        if(currentMinutes >= utils.timeToMinutes("22:20") || currentMinutes < utils.timeToMinutes("7:00")) {
            return {current: "洗漱睡觉", nextLesson: "无"};
        }

        // 查找当前时间段
        let currentIndex = -1;
        for(let i = 0; i < todaySchedule.length; i++) {
            const [start, end] = todaySchedule[i][0].split('-');
            if(currentMinutes >= utils.timeToMinutes(start) && currentMinutes < utils.timeToMinutes(end)) {
                current = todaySchedule[i][1];
                currentIndex = i;
                break;
            }
        }

        // 查找下一个"节课"
        if(currentIndex >= 0) {
            for(let i = currentIndex + 1; i < todaySchedule.length; i++) {
                if(todaySchedule[i][1].endsWith("节课") || todaySchedule[i][1].endsWith("考试")) {
                    nextLesson = todaySchedule[i][1];
                    break;
                }
            }
            if(!nextLesson) nextLesson = "无";
        }
        return {current, nextLesson};
    },

    updateDisplay() {
        const now = new Date();
        const day = now.getDay();  
        // 修正: 必须加 this.
        const {current, nextLesson} = this.getCurrentSchedule();
        
        // 当前作息
        let currentText = current;
        if(current.includes(" 课")) {
            const lessonItems = schedule.weekday.filter(item => 
                item[1].endsWith("节课") || item[1].endsWith("考试"));
            const currentLessonIndex = lessonItems.findIndex(item => item[1] === current);
            if(currentLessonIndex >=0 && currentLessonIndex <9) {
                // 修正: 必须加 this.
                currentText = this.getCourseName(day, currentLessonIndex);
            }
        }
        document.getElementById('currentSchedule').textContent = currentText;
        
        // 下节课
        let nextText = nextLesson;
        if(nextLesson && nextLesson !== "无") {
            const lessonItems = schedule.weekday.filter(item => 
                item[1].endsWith("节课") || item[1].endsWith("考试"));
            const nextLessonIndex = lessonItems.findIndex(item => item[1] === nextLesson);
            if(nextLessonIndex >=0 && nextLessonIndex <9) {
                // 修正: 必须加 this.
                nextText = this.getCourseName(day, nextLessonIndex);
            }
        }
        document.getElementById('nextSchedule').textContent = nextText || "无";
        
        // 课表
        if(day >=1 && day <=5) {
            const courses = timetable[Object.keys(timetable)[day-1]];
            document.getElementById('todayTimetable').innerHTML = courses.map((c,i) => 
                `<div class="timetable-item">${i+1}&nbsp;${c}</div>`
            ).join('');
        } else {
            document.getElementById('todayTimetable').innerHTML = 
                '<div class="timetable-item">周末无课表</div>';
        }
    },

    getNextScheduleInfo() {
        const now = new Date();
        const day = now.getDay();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const todaySchedule = (day === 5) ? schedule.friday : schedule.weekday;
        const utils = window.App.Utils; // 引用工具类
        
        // 修正: 必须加 this.
        const { current } = this.getCurrentSchedule();

        if (current === "放学" || day === 0 || day === 6) {
            // 修正: 必须加 this.
            return this.getNextSchoolDayTime(now);
        }

        if (current === "午休") {
            const inFirstPart = currentMinutes < utils.timeToMinutes("13:10");
            return {
                endTime: inFirstPart ? "13:10" : "13:40",
                label: inFirstPart ? "熄灯" : "起床"
            };
        }

        let currentIndex = todaySchedule.findIndex(([timeRange]) => {
            const [start, end] = timeRange.split('-');
            return currentMinutes >= utils.timeToMinutes(start) && 
                   currentMinutes < utils.timeToMinutes(end);
        });

        if (current === "课间") {
            const currentRange = todaySchedule[currentIndex][0];
            if (currentRange === "13:50-14:00") return { endTime: "14:00", label: "课前唱结束" };
            if (currentRange === "15:30-15:40") return { endTime: "15:40", label: "考前准备" };
            return { 
                endTime: todaySchedule[currentIndex][0].split('-')[1], 
                label: "上课" 
            };
        }

        const labelMap = {
            "早餐": "早读开始",
            "早读": "早读结束",
            "午餐": "午休静校",
            "政史背记": "晚自习开始",
            "考前准备": "考试开始",
            "考试": "考试结束",
            "晚餐": "政史背记开始",
            "洗漱睡觉": "起床"
        };

        if (current.includes("节课")) {
            const nextEvent = todaySchedule[currentIndex + 1]?.[1] || "";
            return {
                endTime: todaySchedule[currentIndex][0].split('-')[1],
                label: nextEvent.includes("课间") ? "下课" : "休息"
            };
        }

        const nextIndex = currentIndex + 1;
        if (nextIndex < todaySchedule.length) {
            return {
                endTime: todaySchedule[nextIndex][0].split('-')[0],
                label: labelMap[current] || todaySchedule[nextIndex][1]
            };
        }

        return { endTime: "23:59", label: "新的一天" };
    },

    updateCountdownDisplay() {
        // 修正: 必须加 this.
        const result = this.getNextScheduleInfo();
        const now = new Date();
        let target, label;

        if (result.endTime instanceof Date) {
            target = result.endTime;
            label = result.label;
        } else {
            label = result.label;
            const [endHour, endMinute] = result.endTime.split(':').map(Number);
            target = new Date(now);
            target.setHours(endHour, endMinute, 0, 0);
            if (target < now) target.setDate(target.getDate() + 1);
        }

        let diff = target - now;
        if (diff < 0) diff = 0;
        
        const seconds = Math.floor(diff / 1000);
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;

        const timerElement = document.getElementById('countdownTimer');
        const labelElement = document.getElementById('countdownName');

        if(labelElement) labelElement.textContent = `距离${label}还有：`;
        
        if(timerElement) {
            if (h > 0) {
                timerElement.textContent = 
                    `${h.toString().padStart(2, '0')}:` +
                    `${m.toString().padStart(2, '0')}:` +
                    `${s.toString().padStart(2, '0')}`;
            } else {
                timerElement.textContent = 
                    `${m.toString().padStart(2, '0')}:` +
                    `${s.toString().padStart(2, '0')}`;
            }
        }

        setTimeout(() => this.updateCountdownDisplay(), 1000);

        if (diff <= 0 && label === "周一返校") {
            setTimeout(() => {
                location.reload();
            }, 1000);
        }
    }
};