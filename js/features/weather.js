window.App.Weather = {
    init() {
        this.fetch();

        // 设置为 60000 毫秒（1分钟）更新一次
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

        try {
            // 第一步：通过 ipwho.is 获取地理位置
            const locationResponse = await fetch(
                'https://ipwho.is/'
            );

            if (!locationResponse.ok) {
                throw new Error('地理位置请求失败');
            }

            const locationData =
                await locationResponse.json();

            if (
                locationData.success !== true ||
                typeof locationData.latitude !== 'number' ||
                typeof locationData.longitude !== 'number'
            ) {
                throw new Error(
                    locationData.message || '地理位置数据无效'
                );
            }

            const latitude = locationData.latitude;
            const longitude = locationData.longitude;

            const timezone =
                locationData.timezone &&
                locationData.timezone.id
                    ? locationData.timezone.id
                    : 'auto';

            // 第二步：通过 Open-Meteo 获取天气和今日最高/最低温度
            const weatherUrl =
                'https://api.open-meteo.com/v1/forecast' +
                `?latitude=${encodeURIComponent(latitude)}` +
                `&longitude=${encodeURIComponent(longitude)}` +
                '&current=weather_code' +
                '&daily=temperature_2m_min,temperature_2m_max' +
                '&forecast_days=1' +
                `&timezone=${encodeURIComponent(timezone)}`;

            const weatherResponse =
                await fetch(weatherUrl);

            if (!weatherResponse.ok) {
                throw new Error('天气数据请求失败');
            }

            const weatherData =
                await weatherResponse.json();

            const current = weatherData.current;
            const daily = weatherData.daily;

            if (
                !current ||
                daily &&
                (
                    !Array.isArray(daily.temperature_2m_min) ||
                    !Array.isArray(daily.temperature_2m_max)
                )
            ) {
                throw new Error('天气数据格式错误');
            }

            const weatherCode = current.weather_code;
            const type = this.getWeatherName(weatherCode);

            const low = this.formatTemperature(
                daily.temperature_2m_min[0]
            );

            const high = this.formatTemperature(
                daily.temperature_2m_max[0]
            );

            /*
             * 保持原有显示格式：
             * 天气：小雨 19.9~24.6℃
             *
             * 原代码中虽然获取了 location，
             * 但实际 weatherString 并没有显示位置名称。
             */
            const weatherString =
                `${type} ${low}~${high}℃`;

            weatherElement.textContent = weatherString;
        } catch (error) {
            console.error('天气加载失败:', error);
            weatherElement.textContent = '天气暂不可用';
        }
    },

    formatTemperature(value) {
        const temperature = Number(value);

        if (!Number.isFinite(temperature)) {
            return '--';
        }

        return Number.isInteger(temperature)
            ? String(temperature)
            : temperature.toFixed(1);
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