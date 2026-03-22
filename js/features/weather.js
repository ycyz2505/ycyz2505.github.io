window.App.Weather = {
    init() {
        this.fetch();
        // 设置为 60000 毫秒（1分钟）更新一次
        window.App.Timers.weather = setInterval(() => this.fetch(), 60000);
    },

    fetch() {
        // 使用支持 IP 自动定位的 API
        fetch('https://uapis.cn/api/v1/misc/weather?forecast=true')
            .then(response => {
                // 检查 HTTP 状态码
                if (response.ok) return response.json();
                throw new Error('网络响应异常');
            })
            .then(data => {
                // 检查数据完整性
                if (data.weather && data.temp_min !== undefined && data.temp_max !== undefined) {
                    
                    // 1. 获取位置名称 (优先用 'district' 如:武清区，没有则用 'city')
                    const location = data.district || data.city || '本地';
                    
                    // 2. 获取天气状况 (如: 霾)
                    const type = data.weather;
                    
                    // 3. 获取最高/最低温 (API直接返回了数字，无需处理)
                    const low = data.temp_min;
                    const high = data.temp_max;

                    // 4. 组合显示格式：武清区 霾 6~21℃
                    const weatherString = `${type} ${low}~${high}℃`;

                    document.getElementById('weatherInfo').textContent = weatherString;
                }
            })
            .catch(error => {
                console.error('天气加载失败:', error);
                // 失败时的保底显示
                document.getElementById('weatherInfo').textContent = '天气暂不可用';
            });
    }
};