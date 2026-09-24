window.App = window.App || {};

window.App.State = {
    intervalDuration: 15000,
    apiProbability: 50,
    lostAndFoundFontSize: 28,
    notifications: [],
    lastPhrase: null
};

window.App.Timers = {
    phrase: null,
    weather: null,
    refresh: null,
    image: null
};
