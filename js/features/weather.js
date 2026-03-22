window.App.Weather = {
    init() {
        this.fetch();
        window.App.Timers.weather = setInterval(() => this.fetch(), 15000);
    },
    fetch() {
        fetch('https://v2.api-m.com/api/weather?city=%E5%B2%B3%E9%BA%93%E5%8C%BA')
            .then(response => response.ok ? response.json() : Promise.reject('网络异常'))
            .then(data => {
                if (data.code === 200) {
                    const currentDay = '周' + ['日','一','二','三','四','五','六'][new Date().getDay()];
                    const todayWeather = data.data.data.find(item => item.date === currentDay);
                    if (todayWeather) {
                        const tempRange = todayWeather.temperature.replace('-', '~');
                        document.getElementById('weatherInfo').textContent = `${todayWeather.weather} ${tempRange}`;
                    }
                }
            })
            .catch(() => document.getElementById('weatherInfo').textContent = '天气获取失败');
    }
};