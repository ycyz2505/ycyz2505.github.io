window.App.Weather = {
    init() {
        this.fetch();

        if (window.App.Timers.weather) {
            clearInterval(window.App.Timers.weather);
        }

        window.App.Timers.weather = setInterval(() => {
            this.fetch();
        }, 60000);
    },

    async fetch() {
        const weatherElement = document.getElementById('weatherInfo');

        if (!weatherElement) return;

        weatherElement.textContent = '加载中...';

        try {
            /*
             * GitHub Pages 通常使用 HTTPS，
             * 因此这里使用 HTTPS 版本，避免 Mixed Content。
             */
            const locationResponse = await fetch(
                'https://ip-api.com/json/?fields=status,message,country,countryCode,regionName,city,timezone,lat,lon'
            );

            if (!locationResponse.ok) {
                throw new Error('地理位置请求失败');
            }

            const locationData = await locationResponse.json();

            if (
                locationData.status !== 'success' ||
                typeof locationData.lat !== 'number' ||
                typeof locationData.lon !== 'number'
            ) {
                throw new Error(locationData.message || '无法获取地理位置');
            }

            const latitude = locationData.lat;
            const longitude = locationData.lon;
            const timezone = locationData.timezone || 'auto';

            const weatherUrl =
                'https://api.open-meteo.com/v1/forecast' +
                `?latitude=${encodeURIComponent(latitude)}` +
                `&longitude=${encodeURIComponent(longitude)}` +
                '&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m' +
                `&timezone=${encodeURIComponent(timezone)}`;

            const weatherResponse = await fetch(weatherUrl);

            if (!weatherResponse.ok) {
                throw new Error('天气数据请求失败');
            }

            const weatherData = await weatherResponse.json();

            if (!weatherData.current) {
                throw new Error('天气数据格式错误');
            }

            const current = weatherData.current;

            const location =
                locationData.city ||
                locationData.regionName ||
                locationData.country ||
                '本地';

            const weatherName = this.getWeatherName(current.weather_code);

            const temperature = this.formatNumber(current.temperature_2m);
            const apparentTemperature = this.formatNumber(
                current.apparent_temperature
            );
            const humidity = this.formatNumber(
                current.relative_humidity_2m
            );
            const windSpeed = this.formatNumber(current.wind_speed_10m);

            /*
             * 显示格式：
             * 武清区 晴 25℃ 体感26℃ 湿度60% 风速8km/h
             */
            weatherElement.textContent =
                `${location} ${weatherName} ${temperature}℃ ` +
                `体感${apparentTemperature}℃ ` +
                `湿度${humidity}% ` +
                `风速${windSpeed}km/h`;
        } catch (error) {
            console.error('天气加载失败：', error);
            weatherElement.textContent = '天气暂不可用';
        }
    },

    formatNumber(value) {
        const number = Number(value);

        if (!Number.isFinite(number)) {
            return '--';
        }

        return Number.isInteger(number)
            ? String(number)
            : number.toFixed(1);
    },

    getWeatherName(code) {
        const weatherMap = {
            0: '晴',
            1: '大部晴朗',
            2: '局部多云',
            3: '阴',
            45: '雾',
            48: '雾凇',
            51: '小毛毛雨',
            53: '毛毛雨',
            55: '大毛毛雨',
            56: '冻毛毛雨',
            57: '强冻毛毛雨',
            61: '小雨',
            63: '中雨',
            65: '大雨',
            66: '冻雨',
            67: '强冻雨',
            71: '小雪',
            73: '中雪',
            75: '大雪',
            77: '雪粒',
            80: '小阵雨',
            81: '中阵雨',
            82: '强阵雨',
            85: '小阵雪',
            86: '强阵雪',
            95: '雷雨',
            96: '雷雨伴冰雹',
            99: '强雷雨伴冰雹'
        };

        return weatherMap[code] || '未知天气';
    }
};