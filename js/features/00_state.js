window.App = window.App || {};

window.App.State = {
    // 仅内存，不需要持久化
    lastPhrase: null,

    // ---------- 设置项：通过 App.Store 持久化 ----------
    get intervalDuration() {
        if (window.App.Store) return window.App.Store.getSetting('intervalDuration');
        return 15000;
    },
    set intervalDuration(v) {
        if (window.App.Store) window.App.Store.setSetting('intervalDuration', v);
    },

    get apiProbability() {
        if (window.App.Store) return window.App.Store.getSetting('apiProbability');
        return 50;
    },
    set apiProbability(v) {
        if (window.App.Store) window.App.Store.setSetting('apiProbability', v);
    },

    get lostAndFoundFontSize() {
        if (window.App.Store) return window.App.Store.getSetting('lostAndFoundFontSize');
        return 28;
    },
    set lostAndFoundFontSize(v) {
        if (window.App.Store) window.App.Store.setSetting('lostAndFoundFontSize', v);
    },

    // ---------- 通知列表 ----------
    get notifications() {
        if (window.App.Store) return window.App.Store.get('notifications') || [];
        return this._fallbackNotifications || (this._fallbackNotifications = []);
    },
    set notifications(v) {
        if (window.App.Store) window.App.Store.set('notifications', v);
        else this._fallbackNotifications = v;
    }
};

window.App.Timers = {
    phrase: null,
    weather: null,
    refresh: null,
    image: null,
    schoolSchedule: null
};