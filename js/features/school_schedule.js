window.App.SchoolSchedule = {
    init() {
        setInterval(() => this.updateDisplay(), 1000);
        this.updateCountdownDisplay();
    },

    // 获取课程名称
    getCourseName(day, lessonIndex) {
        const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
        // 尝试从全局变量获取，兼容 const 和 window. 定义
        const currentTimetable = (typeof timetable !== 'undefined') ? timetable : (window.timetable || {});
        const timetableDay = currentTimetable[days[day]]; 
        return timetableDay ? timetableDay[lessonIndex] : "";
    },

    // 获取周一返校时间
    getNextSchoolDayTime(now) {
        const target = new Date(now);
        const day = target.getDay(); // 0是周日, 6是周六
        
        // 计算距离周日还有几天
        let daysUntilSunday = 0;
        if (day === 5) daysUntilSunday = 2; // 周五
        if (day === 6) daysUntilSunday = 1; // 周六
        if (day === 0) daysUntilSunday = 0; // 周日
        
        target.setDate(target.getDate() + daysUntilSunday);
        target.setHours(17, 30, 0, 0); // 设定为周日 17:30
        
        return { endTime: target, label: "周日返校" };
    },

    getCurrentSchedule() {
        const now = new Date();
        const day = now.getDay();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const utils = window.App.Utils;

        // 尝试从全局获取 schedule 数据
        const scheduleData = (typeof schedule !== 'undefined') ? schedule : (window.schedule || {});

        // 周六全天是周末
        if(day === 6) return {current: "周末", nextLesson: ""};
        
        // 周日 17:30 之前算“周末”，之后算“上课”
        if(day === 0 && currentMinutes < utils.timeToMinutes("17:30")) {
            return {current: "周末", nextLesson: "第一节晚自习"};
        }

        // 根据星期几选择对应的作息表
        let todaySchedule;
        if (day === 5) todaySchedule = scheduleData.friday;
        else if (day === 0) todaySchedule = scheduleData.sunday; 
        else todaySchedule = scheduleData.weekday;

        // 防止数据未加载导致报错
        if (!todaySchedule) return {current: "加载中...", nextLesson: ""};

        let current = "";
        let nextLesson = "";

        // 处理跨天时段（21:30-6:30）
        if(currentMinutes >= utils.timeToMinutes("21:30") || currentMinutes < utils.timeToMinutes("6:30")) {
            return {current: "睡觉", nextLesson: "无"};
        }

        // 查找当前时间段
        let currentIndex = -1;
        for(let i = 0; i < todaySchedule.length; i++) {
            const [timeRange, name] = todaySchedule[i];
            const [start, end] = timeRange.split('-');
            
            let s = utils.timeToMinutes(start);
            let e = utils.timeToMinutes(end);
            
            // 跨天处理
            if (e < s) {
               if (currentMinutes >= s || currentMinutes < e) {
                   current = name;
                   currentIndex = i;
                   break;
               }
            } else {
               if(currentMinutes >= s && currentMinutes < e) {
                   current = name;
                   currentIndex = i;
                   break;
               }
            }
        }

        // 查找下一个"节课"
        if(currentIndex >= 0) {
            for(let i = currentIndex + 1; i < todaySchedule.length; i++) {
                if(todaySchedule[i][1].includes("节课") || todaySchedule[i][1].includes("晚自习") || todaySchedule[i][1].endsWith("考试")) {
                    nextLesson = todaySchedule[i][1];
                    break;
                }
            }
            if(!nextLesson) nextLesson = "无";
        }
        
        // 兜底：如果没匹配到（比如周五放学后），显示放学
        if (!current && day === 5) return {current: "放学", nextLesson: "无"};

        return {current: current || "休息", nextLesson};
    },

    updateDisplay() {
        const now = new Date();
        const day = now.getDay();  
        const {current, nextLesson} = this.getCurrentSchedule();
        const scheduleData = (typeof schedule !== 'undefined') ? schedule : (window.schedule || {});
        
        // 当前作息
        let currentText = current;
        if(current.includes(" 课")) {
            const weekdaySchedule = scheduleData.weekday || [];
            const lessonItems = weekdaySchedule.filter(item => 
                item[1].endsWith("节课") || item[1].endsWith("考试"));
            const currentLessonIndex = lessonItems.findIndex(item => item[1] === current);
            if(currentLessonIndex >=0 && currentLessonIndex <9) {
                currentText = this.getCourseName(day, currentLessonIndex);
            }
        }
        document.getElementById('currentSchedule').textContent = currentText;
        
        // 下节课
        let nextText = nextLesson;
        if(nextLesson && nextLesson !== "无") {
            const weekdaySchedule = scheduleData.weekday || [];
            const lessonItems = weekdaySchedule.filter(item => 
                item[1].endsWith("节课") || item[1].endsWith("考试"));
            const nextLessonIndex = lessonItems.findIndex(item => item[1] === nextLesson);
            if(nextLessonIndex >=0 && nextLessonIndex <9) {
                nextText = this.getCourseName(day, nextLessonIndex);
            }
        }
        document.getElementById('nextSchedule').textContent = nextText || "无";
        
        // ================== 课表渲染逻辑 ==================
        const timetableContainer = document.getElementById('todayTimetable');
        
        if (day === 6) {
            // 周六
            timetableContainer.innerHTML = '<div class="timetable-item" style="font-family: STZhongSong, cursive; font-size:24px; text-align:center;">周末无课表</div>';
        } else {
            const key = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][day];
            
            // 安全读取课表数据
            let courses = [];
            // 优先读取 window 对象，其次尝试直接读取变量
            if (typeof timetable !== 'undefined') courses = timetable[key];
            else if (window.timetable) courses = window.timetable[key];

            if (!courses || courses.length === 0) {
                 timetableContainer.innerHTML = '<div class="timetable-item" style="font-family: STZhongSong, cursive; font-size:24px; text-align:center;">暂无数据</div>';
            } else {
                timetableContainer.innerHTML = courses.map((c, i) => {
                    let label = "";
                    let showDivider = false;

                    if (day === 0) {
                        // 周日：第1-4节晚自习 (逻辑：i+1)
                        label = `晚${i + 1}`;
                    } else {
                        // 周一至周五
                        if (i === 0) {
                            label = "早";
                            showDivider = true; // 早自习后加线
                        } else if (i <= 8) {
                            label = i.toString(); // 第1-8节
                            if (i === 4 || i === 8) showDivider = true; // 第4、8节后加线
                        } else {
                            label = `晚${i - 8}`; // 晚自习
                        }
                    }

                    // 容器样式：Flex布局，24px字体，还原华文中宋字体
                    let itemStyle = "display:flex; align-items:center; font-family: STZhongSong, cursive; font-size:24px; line-height:1; padding: 2px 0;";
                    
                    // 分割线样式
                    if (showDivider) {
                        itemStyle += "border-bottom: 2px dashed #ddd; margin-bottom: 6px; padding-bottom: 6px;";
                    }

                    return `
                        <div style="${itemStyle}">
                            <!-- 左侧标号：右对齐，绿色 -->
                            <div style="width: 42%; text-align: right; padding-right: 15px; color: #8bc34a; font-weight: bold;">
                                ${label}
                            </div>
                            <!-- 右侧科目：左对齐，黑色 -->
                            <div style="width: 58%; text-align: left; padding-left: 5px; color: #333;">
                                ${c}
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }
    },

    getNextScheduleInfo() {
        const now = new Date();
        const day = now.getDay();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const utils = window.App.Utils;
        const scheduleData = (typeof schedule !== 'undefined') ? schedule : (window.schedule || {});
        
        // 获取当前作息表
        let todaySchedule;
        if (day === 5) todaySchedule = scheduleData.friday;
        else if (day === 0) todaySchedule = scheduleData.sunday;
        else todaySchedule = scheduleData.weekday;
        
        if (!todaySchedule) return { endTime: "23:59", label: "加载中" };

        const { current } = this.getCurrentSchedule();

        // 周五放学、周六、或者周日白天(17:30前) -> 倒计时到周日返校
        if (current === "放学" || day === 6 || (day === 0 && current === "周末")) {
            return this.getNextSchoolDayTime(now);
        }

        if (current === "午休") {
            const inFirstPart = currentMinutes < utils.timeToMinutes("13:10");
            return {
                endTime: inFirstPart ? "13:10" : "13:40",
                label: inFirstPart ? "熄灯" : "起床"
            };
        }

        // 找到当前时间段在 schedule 里的位置
        let currentIndex = todaySchedule.findIndex(([timeRange]) => {
            const [start, end] = timeRange.split('-');
            let s = utils.timeToMinutes(start);
            let e = utils.timeToMinutes(end);
            if (e < s) return currentMinutes >= s || currentMinutes < e;
            return currentMinutes >= s && currentMinutes < e;
        });

        if (currentIndex === -1) return { endTime: "23:59", label: "新的一天" };

        if (current.includes("课间")) {
            return { 
                endTime: todaySchedule[currentIndex][0].split('-')[1], 
                label: "上课" 
            };
        }

        if (current.includes("节课") || current.includes("晚自习") || current.includes("早读")) {
             return {
                endTime: todaySchedule[currentIndex][0].split('-')[1],
                label: "下课"
            };
        }
        
        const nextIndex = currentIndex + 1;
        if (nextIndex < todaySchedule.length) {
            return {
                endTime: todaySchedule[nextIndex][0].split('-')[0],
                label: todaySchedule[nextIndex][1]
            };
        }

        return { endTime: "23:59", label: "新的一天" };
    },

    updateCountdownDisplay() {
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