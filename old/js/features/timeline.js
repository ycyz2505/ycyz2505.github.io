window.App.Timeline = {
    init() {
        // 1. 获取当前年份
        const currentYear = new Date().getFullYear();
        
        // 2. 实时计算今年的节气日期并更新到全局数据中
        this.updateSolarTermsDates(currentYear);

        // 3. 生成界面
        this.generateMarkers();
        this.updateColor();
        
        // 每天刷新一次
        setInterval(() => {
            const newYear = new Date().getFullYear();
            this.updateSolarTermsDates(newYear);
            this.generateMarkers();
        }, 86400000);
    },

    generateMarkers() {
        const currentYear = new Date().getFullYear();
        const gradYear = 2028; // 设定毕业年份
        
        // 确保立春数据已更新
        const springStart = solarTerms.find(t => t.name === '立春');
        if (!springStart) return;

        // 确定起止时间
        const startDate = new Date(currentYear, springStart.month - 1, springStart.day); // 注意：month在数据里通常是1-12，Date需0-11
        let endDate;
        
        const endMarkerEl = document.querySelector('.end-marker'); // 获取终点元素

        if (currentYear === gradYear) {
            endDate = new Date(gradYear, 5, 7); // 6月7日
            // 显示终点标记并更新文字
            endMarkerEl.style.display = 'block'; 
            document.getElementById('timelineEndTitle').textContent = "高考日";
            document.getElementById('timelineEndDate').textContent = "6月7日";
        } else {
            endDate = new Date(currentYear, 11, 31);
            // 非毕业年份，隐藏终点标记（虽然计算进度条还需要endDate，但界面上不显示）
            endMarkerEl.style.display = 'none';
        }


        const totalDays = (endDate - startDate) / 86400000;
        const timeline = document.getElementById('timeline');
        
        // 清除旧标记
        document.querySelectorAll('.solar-term-marker').forEach(m => m.remove()); 

        solarTerms.forEach((term, index) => {
            // 注意：数据文件里的 month 如果是 1 代表 1月，Date对象需要 0
            const termDate = new Date(currentYear, term.month - 1, term.day); 
            
            // 超出范围的不显示
            if (termDate < startDate || termDate > endDate) return;

            const position = ((termDate - startDate) / 86400000 / totalDays) * 100;
            const isPast = termDate < new Date();
            
            // === 核心修改：上下交错排列逻辑 ===
            const isTop = index % 2 === 0; // 偶数在上方，奇数在下方
            const topPosition = isTop ? '-45px' : '25px'; // 上方位置不变，下方位置下移
            
            const marker = document.createElement('div'); 
            marker.className = 'solar-term-marker';
            marker.style.left = `${position}%`;
            marker.style.top = topPosition; // 应用动态高度
            
            // 增加 vertical-line 连接线效果（可选，用简单的 border 实现）
            const lineStyle = isTop 
                ? 'height: 15px; border-left: 1px dashed #999; position: absolute; bottom: -15px; left: 50%;' 
                : 'height: 15px; border-left: 1px dashed #999; position: absolute; top: -15px; left: 50%;';

            marker.innerHTML = `
                <div style="color: ${isPast ? '#666' : term.color}; font-weight: ${isPast ? 'normal' : '600'};">
                    ${term.name} 
                </div>
                <div style="font-size:0.9em; color: ${isPast ? '#999' : '#666'}; margin-top: 3px">
                    ${term.month}月${term.day}日 
                </div>
                <!-- 连接线 -->
                <div style="${lineStyle}"></div>
            `;
            
            // === 卡片逻辑优化 ===
            // 如果标签在下方，卡片应该显示在标签上方，防止遮挡
            // 如果标签在上方，卡片显示在下方
            const card = document.createElement('div');
            card.className = 'solar-card';
            
            if (!isTop) {
                // 底部标签：卡片向上弹出
                card.style.top = 'auto';
                card.style.bottom = '100%';
                card.style.marginBottom = '20px'; // 留出间距
                // 修改小三角方向
                // 注意：这里需要配合 CSS 修改，或者直接用 JS 覆盖样式
                // 简单起见，这里让底部标签的卡片也悬浮在合适位置，或者统一居中
            }
            
            // 重新填入卡片内容
            card.innerHTML = `
                <h3 style="margin:0 0 10px;">${term.name} <small style="font-size:0.6em;color:#666">${currentYear}年${term.month}月${term.day}日</small></h3>
                <div style="display:flex; gap:15px;">
                    <img src="${term.image}" style="width:140px;height:120px;object-fit:cover;border-radius:6px;flex-shrink:0;">
                    <p style="text-indent:2em;margin:0;font-size:14px;">${term.desc}</p>
                </div>
            `;
            
            // 修正底部卡片的三角箭头 (简单处理：移除默认三角，使用 box-shadow)
            if (!isTop) {
                 // 动态创建一个样式覆盖
                 card.style.transformOrigin = "bottom center";
            }

            marker.appendChild(card);
            
            marker.addEventListener('click', (e) => {
                e.stopPropagation();
                
                // 1. 关闭所有卡片
                document.querySelectorAll('.solar-card').forEach(c => c.classList.remove('active'));
                
                // 2. ★核心修复★：重置所有标记点的 z-index 为默认值 2
                document.querySelectorAll('.solar-term-marker').forEach(m => m.style.zIndex = '2');

                // 3. 显示当前卡片
                card.classList.add('active');
                
                // 4. ★核心修复★：将当前点击的标记点层级设为最高，防止被隔壁标记遮挡
                marker.style.zIndex = '999';
            });
            timeline.appendChild(marker); 
        });

        // 点击空白处关闭
        document.addEventListener('click', () => {
            document.querySelectorAll('.solar-card').forEach(c => c.classList.remove('active'));
            // 还原所有标记点的层级
            document.querySelectorAll('.solar-term-marker').forEach(m => m.style.zIndex = '2');
        });
    },

    updateColor() {
        const currentYear = new Date().getFullYear();
        const gradYear = 2028;
        const springStart = solarTerms.find(t => t.name === '立春');
        
        // 容错处理
        if (!springStart) return;

        const startDate = new Date(currentYear, springStart.month - 1, springStart.day); 
        let endDate;

        if (currentYear === gradYear) {
            endDate = new Date(gradYear, 5, 7);
        } else {
            endDate = new Date(currentYear, 11, 31);
        }
        
        const progress = Math.min(1, Math.max(0, (new Date() - startDate) / (endDate - startDate)));
        const timeline = document.getElementById('timeline');
        if(timeline) {
            timeline.style.setProperty('--progress-percent', `${progress * 100}%`);
        }
        requestAnimationFrame(() => this.updateColor());
    },

    // === 新增：寿星天文历算法（21世纪适用版） ===
    // 用于根据年份动态计算节气日期，不再依赖写死的 2025 数据
    updateSolarTermsDates(year) {
        // 21世纪(2000-2099)各节气C值常量表
        // 顺序：小寒, 大寒, 立春, 雨水, 惊蛰, 春分, 清明, 谷雨, 立夏, 小满, 芒种, 夏至, 小暑, 大暑, 立秋, 处暑, 白露, 秋分, 寒露, 霜降, 立冬, 小雪, 大雪, 冬至
        const c_map = {
            "小寒": 5.4055, "大寒": 20.12, "立春": 3.87, "雨水": 18.73, 
            "惊蛰": 5.63, "春分": 20.646, "清明": 4.81, "谷雨": 20.1, 
            "立夏": 5.52, "小满": 21.04, "芒种": 5.678, "夏至": 21.37, 
            "小暑": 7.108, "大暑": 22.83, "立秋": 7.5, "处暑": 23.13, 
            "白露": 7.646, "秋分": 23.042, "寒露": 8.318, "霜降": 23.438, 
            "立冬": 7.438, "小雪": 22.385, "大雪": 7.18, "冬至": 21.94
        };
        
        // 月份映射表 (小寒是1月)
        const month_map = {
            "小寒": 1, "大寒": 1, "立春": 2, "雨水": 2, 
            "惊蛰": 3, "春分": 3, "清明": 4, "谷雨": 4, 
            "立夏": 5, "小满": 5, "芒种": 6, "夏至": 6, 
            "小暑": 7, "大暑": 7, "立秋": 8, "处暑": 8, 
            "白露": 9, "秋分": 9, "寒露": 10, "霜降": 10, 
            "立冬": 11, "小雪": 11, "大雪": 12, "冬至": 12
        };

        // 算法公式：[Y*D+C]-L
        // Y=年份后2位, D=0.2422, L=闰年数, C=常量
        const y = year % 100;
        const D = 0.2422;
        
        solarTerms.forEach(term => {
            if (c_map[term.name]) {
                const C = c_map[term.name];
                // 计算该节气在当年的日期 (日)
                // 21世纪闰年数计算修正: int(y/4)
                const leapCount = Math.floor(y / 4);
                let day = Math.floor(y * D + C) - leapCount;
                
                // 赋值更新
                term.day = day;
                term.month = month_map[term.name];
                
                // 特殊年份修正（经验修正，可选）
                // 2026年立春可能是3号，公式计算通常准确，极个别差1天，这里暂时忽略微小误差，
                // 对于高中倒计时展示来说，寿星公式精度足够。
            }
        });
        
        // 重新按时间排序，确保“小寒”在最前，“冬至”在最后（如果原数组乱序的话）
        // solarTerms.sort((a, b) => (a.month * 100 + a.day) - (b.month * 100 + b.day));
    }
};