// 初始化全局命名空间
window.App = window.App || {};

// 全局状态与配置中心
window.App.State = {
    intervalDuration: 15 * 1000,
    apiProbability: 50,
    // isWarning: false,
    lostAndFoundFontSize: 28,
    notifications: [],
    lastPhrase: null
};

// 全局定时器引用中心
window.App.Timers = {
    phrase: null,
    weather: null,
    refresh: null,
    image: null
};