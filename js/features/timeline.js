window.App.Timeline = {
    init() {
        const currentYear = window.App.Utils.now().getFullYear();
        this.updateSolarTermsDates(currentYear);
        this.generateMarkers();
        this.updateColor();

        document.addEventListener('click', () => {
            document.querySelectorAll('.solar-card').forEach(c => c.classList.remove('active'));
            document.querySelectorAll('.solar-term-marker').forEach(m => (m.style.zIndex = '2'));
        });

        setInterval(() => this.updateColor(), 1000);

        setInterval(() => {
            this.updateSolarTermsDates(window.App.Utils.now().getFullYear());
            this.generateMarkers();
        }, 86400000);
    },

    getSolarTerms() {
        if (window.App.Store) return window.App.Store.get('solarterms') || [];
        return (typeof solarTerms !== 'undefined') ? solarTerms : [];
    },

    // ★ 统一的时间轴起止：起点固定 1/1，终点高考年为 6/7、其余为 12/31
    getTimelineRange(currentYear) {
        const gradYear = 2028;
        const startDate = new Date(currentYear, 0, 1);        // 1 月 1 日
        const isGradYear = currentYear === gradYear;
        const endDate = isGradYear
            ? new Date(gradYear, 5, 7)                        // 高考年：6 月 7 日
            : new Date(currentYear, 11, 31);                  // 其余：12 月 31 日

        return { startDate, endDate, isGradYear };
    },

    generateMarkers() {
        const terms = this.getSolarTerms();
        if (!terms.length) return;

        const now = window.App.Utils.now();
        const currentYear = now.getFullYear();
        const { startDate, endDate, isGradYear } = this.getTimelineRange(currentYear);

        const endMarkerEl = document.querySelector('.end-marker');
        if (endMarkerEl) {
            if (isGradYear) {
                endMarkerEl.style.display = 'block';
                document.getElementById('timelineEndTitle').textContent = '高考日';
                document.getElementById('timelineEndDate').textContent = '6月7日';
            } else {
                endMarkerEl.style.display = 'none';
            }
        }

        const totalDays = (endDate - startDate) / 86400000;
        const timeline = document.getElementById('timeline');

        document.querySelectorAll('.solar-term-marker').forEach(m => m.remove());

        terms.forEach((term, index) => {
            const termDate = new Date(currentYear, term.month - 1, term.day);
            if (termDate < startDate || termDate > endDate) return;

            const position = ((termDate - startDate) / 86400000 / totalDays) * 100;
            const isPast = termDate < now;
            const isTop = index % 2 === 0;
            const topPosition = isTop ? '-45px' : '25px';

            const marker = document.createElement('div');
            marker.className = 'solar-term-marker';
            marker.style.left = `${position}%`;
            marker.style.top = topPosition;

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
                <div style="${lineStyle}"></div>
            `;

            const card = document.createElement('div');
            card.className = 'solar-card';

            if (!isTop) {
                card.style.top = 'auto';
                card.style.bottom = '100%';
                card.style.marginBottom = '20px';
                card.style.transformOrigin = 'bottom center';
                // ★ 卡片位于标记上方，箭头改为指向下方
                card.classList.add('solar-card--above');
            }

            card.innerHTML = `
                <h3 style="margin:0 0 10px;">${term.name} <small style="font-size:0.6em;color:#666">${currentYear}年${term.month}月${term.day}日</small></h3>
                <div style="display:flex; gap:15px;">
                    <img src="${term.image}" style="width:140px;height:120px;object-fit:cover;border-radius:6px;flex-shrink:0;">
                    <p style="text-indent:2em;margin:0;font-size:14px;">${term.desc}</p>
                </div>
            `;

            marker.appendChild(card);

            marker.addEventListener('click', e => {
                e.stopPropagation();
                document.querySelectorAll('.solar-card').forEach(c => c.classList.remove('active'));
                document.querySelectorAll('.solar-term-marker').forEach(m => (m.style.zIndex = '2'));
                card.classList.add('active');
                marker.style.zIndex = '999';
            });

            timeline.appendChild(marker);
        });
    },

    updateColor() {
        const terms = this.getSolarTerms();
        if (!terms.length) return;

        const now = window.App.Utils.now();
        const currentYear = now.getFullYear();
        const { startDate, endDate } = this.getTimelineRange(currentYear);

        const progress = Math.min(1, Math.max(0, (now - startDate) / (endDate - startDate)));
        const timeline = document.getElementById('timeline');
        if (timeline) timeline.style.setProperty('--progress-percent', `${progress * 100}%`);
    },

    // 21 世纪寿星天文历公式：[Y*D+C]-L
    updateSolarTermsDates(year) {
        const terms = this.getSolarTerms();
        if (!terms.length) return;

        const cMap = {
            '小寒': 5.4055, '大寒': 20.12, '立春': 3.87, '雨水': 18.73,
            '惊蛰': 5.63, '春分': 20.646, '清明': 4.81, '谷雨': 20.1,
            '立夏': 5.52, '小满': 21.04, '芒种': 5.678, '夏至': 21.37,
            '小暑': 7.108, '大暑': 22.83, '立秋': 7.5, '处暑': 23.13,
            '白露': 7.646, '秋分': 23.042, '寒露': 8.318, '霜降': 23.438,
            '立冬': 7.438, '小雪': 22.385, '大雪': 7.18, '冬至': 21.94
        };

        const monthMap = {
            '小寒': 1, '大寒': 1, '立春': 2, '雨水': 2,
            '惊蛰': 3, '春分': 3, '清明': 4, '谷雨': 4,
            '立夏': 5, '小满': 5, '芒种': 6, '夏至': 6,
            '小暑': 7, '大暑': 7, '立秋': 8, '处暑': 8,
            '白露': 9, '秋分': 9, '寒露': 10, '霜降': 10,
            '立冬': 11, '小雪': 11, '大雪': 12, '冬至': 12
        };

        const y = year % 100;
        const D = 0.2422;
        const leapCount = Math.floor(y / 4);

        terms.forEach(term => {
            if (!cMap[term.name]) return;
            term.day = Math.floor(y * D + cMap[term.name]) - leapCount;
            term.month = monthMap[term.name];
        });
    }
};