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
        const weatherElement =
            document.getElementById('weatherInfo');

        if (!weatherElement) {
            return;
        }

        weatherElement.textContent = '加载中...';

        try {
            // 通过 ipwho.is 获取当前访问者的地理位置
            const locationResponse = await fetch(
                'https://ipwho.is/',
                {
                    method: 'GET',
                    cache: 'no-store'
                }
            );

            if (!locationResponse.ok) {
                throw new Error(
                    `地理位置请求失败：HTTP ${locationResponse.status}`
                );
            }

            const locationData =
                await locationResponse.json();

            if (
                locationData.success !== true ||
                typeof locationData.latitude !== 'number' ||
                typeof locationData.longitude !== 'number'
            ) {
                throw new Error(
                    locationData.message ||
                    '无法获取有效地理位置'
                );
            }

            const latitude = locationData.latitude;
            const longitude = locationData.longitude;

            const timezone =
                locationData.timezone &&
                locationData.timezone.id
                    ? locationData.timezone.id
                    : 'auto';

            const weatherUrl =
                'https://api.open-meteo.com/v1/forecast' +
                `?latitude=${encodeURIComponent(latitude)}` +
                `&longitude=${encodeURIComponent(longitude)}` +
                '&current=' +
                'temperature_2m,' +
                'relative_humidity_2m,' +
                'apparent_temperature,' +
                'weather_code,' +
                'wind_speed_10m' +
                `&timezone=${encodeURIComponent(timezone)}`;

            // 根据经纬度获取天气数据
            const weatherResponse = await fetch(
                weatherUrl,
                {
                    method: 'GET',
                    cache: 'no-store'
                }
            );

            if (!weatherResponse.ok) {
                throw new Error(
                    `天气请求失败：HTTP ${weatherResponse.status}`
                );
            }

            const weatherData =
                await weatherResponse.json();

            const current = weatherData.current;

            if (
                !current ||
                typeof current.temperature_2m !== 'number'
            ) {
                throw new Error('天气数据格式错误');
            }

            const location =
                locationData.city ||
                locationData.region ||
                locationData.country ||
                '本地';

            const weatherName =
                this.getWeatherName(current.weather_code);

            const temperature =
                this.formatNumber(current.temperature_2m);

            const apparentTemperature =
                this.formatNumber(
                    current.apparent_temperature
                );

            const humidity =
                this.formatNumber(
                    current.relative_humidity_2m
                );

            const windSpeed =
                this.formatNumber(
                    current.wind_speed_10m
                );

            weatherElement.textContent =
                `${location} ${weatherName} ` +
                `${temperature}℃ ` +
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