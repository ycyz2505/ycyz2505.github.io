window.App.Utils = {
    // 时间转分钟数
    timeToMinutes(time) {
        if (time instanceof Date) return time.getHours() * 60 + time.getMinutes();
        if(time === "23:59") return 1439;
        const [h, m] = time.split(':').map(Number);
        return h * 60 + m;
    }
};