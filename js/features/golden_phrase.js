window.App.GoldenPhrase = {
    apiConfigs : [
        {
            url: 'https://zj.v.api.aa1.cn/api/wenan-shici/?type=json',
            method: 'GET',
            weight: 15,
            maxRetry: 3, // 最大重试次数
            handler: (data) => {
                const text = data.msg || '';
                return text.length <= 100 ? text : null;
            }
        },
        {
            url: 'https://api.songzixian.com/api/daily-poem?dataSource=LOCAL_DAILY_POEM',
            method: 'GET',
            weight: 15,
            maxRetry: 3,
            handler: (data) => {
                if (!data.data) return null;
                
                // 处理标题格式
                let title = data.data.title;
                // 去除标题中的空格点号
                title = title.replace(/\s*·\s*/g, '·');
                // 判断是否需要添加书名号
                const hasBookMarks = /^《(.+)》$/.test(title);
                const formattedTitle = hasBookMarks ? title : `《${title}》`;
                
                return `${data.data.quotes}——${data.data.author}${formattedTitle}`;
            }
        },
        {
            url: 'https://zj.v.api.aa1.cn/api/wenan-wm/?type=json',
            method: 'GET',
            weight: 20,
            maxRetry: 3,
            handler: (data) => {
                const text = data.msg || '';
                return text.length <= 100 ? text : null;
            }
        },
        {
            url: 'https://zj.v.api.aa1.cn/api/wenan-mj/?type=json',
            method: 'GET',
            weight: 30,
            maxRetry: 3,
            handler: (data) => {
                const text = data.msg || '';
                return text.length <= 100 ? text : null;
            }
        },
        {
            url: 'https://api.mu-jie.cc/stray-birds/range?type=json',
            method: 'GET',
            weight: 20,
            maxRetry: 5,
            handler: (data) => {
                const chLength = data.cn?.length || 0;
                const enLength = data.en?.length || 0;
                // 中文超长直接返回null触发重试
                if (chLength > 100) return null;
                // 计算总长度：英文按0.5倍计算
                const totalLength = (enLength * 0.5) + chLength;
                if (totalLength <= 100) {
                    return `${data.en}（${data.cn}）——泰戈尔`;
                }
                // 仅显示中文
                return `${data.cn}——泰戈尔`;
            }
        }
    ],

    init() {
        this.fetch();
        this.startTimer();
        this.bindClickRefresh();
        
        // ★新增：初始化位置调整
        // this.adjustPosition();
        // // ★新增：窗口大小改变时调整位置
        // window.addEventListener('resize', () => this.adjustPosition());
    },

    startTimer() {
        if (window.App.Timers.phrase) clearInterval(window.App.Timers.phrase);
        window.App.Timers.phrase = setInterval(() => this.fetch(), window.App.State.intervalDuration);
    },

    stopTimer() {
        if (window.App.Timers.phrase) {
            clearInterval(window.App.Timers.phrase);
            window.App.Timers.phrase = null;
        }
    },

    async fetchWithRetry(apiConfig, retryCount = 0) {
        try {
            const response = await fetch(apiConfig.url, { method: apiConfig.method });
            if (!response.ok) throw new Error('HTTP error');
            
            const data = await response.json();
            const processed = apiConfig.handler(data);
            
            if (processed !== null) return processed;
            if (retryCount < apiConfig.maxRetry) {
                return this.fetchWithRetry(apiConfig, retryCount + 1); // 修正：加上 this.
            }
            throw new Error('超出最大重试次数');
        } catch (error) {
            if (retryCount < apiConfig.maxRetry) {
                return this.fetchWithRetry(apiConfig, retryCount + 1); // 修正：加上 this.
            }
            throw error;
        }
    },

    selectRandomAPI() {
        // 修正：所有的 apiConfigs 前面都要加 this.
        const totalWeight = this.apiConfigs.reduce((sum, api) => sum + api.weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const api of this.apiConfigs) {
            if (random < api.weight) {
                return api;
            }
            random -= api.weight;
        }
        return this.apiConfigs[0];
    },

    async fetch() {
        if (Math.random() < window.App.State.apiProbability / 100) {
            try {
                const api = this.selectRandomAPI();
                const text = await this.fetchWithRetry(api);
                this.updateDisplay(text);
            } catch (error) { 
                this.showLocal(); 
            }
        } else {
            this.showLocal();
        }
    },

    updateDisplay(text) {
        const container = document.getElementById('goldenPhrase');
        const isAnim = document.getElementById('animationSwitch').checked;
        const formatted = text.replace(/\n/g, '<br>');
        
        const updateContent = () => {
            container.innerHTML = `「 ${formatted} 」`;
            container.style.opacity = 1;
            // ★新增：内容更新后重新计算位置 (因为文字行数可能变了)
            // setTimeout(() => this.adjustPosition(), 50); 
        };

        if (isAnim) {
            container.style.opacity = 0;
            setTimeout(updateContent, 500);
        } else {
            updateContent();
        }
    },

    showLocal() {
        const showOriginalOnly = document.getElementById('originalSwitch').checked;

        const filterOriginal = arr => showOriginalOnly ? 
            arr.filter(p => p.trim().endsWith('🌟')) : 
            arr;

        // 注意：这里的 localPhrases 变量来源于外部的 js/data/phrases.js，只要在 HTML 里引入了那个文件就能全局访问到
        const filtered = {
            high: filterOriginal(localPhrases.high),
            medium: filterOriginal(localPhrases.medium),
            low: filterOriginal(localPhrases.low)
        };

        if (showOriginalOnly) {
            const allOriginal = [
                ...filtered.high,
                ...filtered.medium,
                ...filtered.low
            ].filter(p => p !== window.App.State.lastPhrase);

            if (allOriginal.length === 0) {
                const fallbackList = [
                    ...filtered.high,
                    ...filtered.medium,
                    ...filtered.low
                ];
                if (fallbackList.length === 0) {
                    // 修正：改为调用 this.updateDisplay
                    return this.updateDisplay("🎯 没有原创金句");
                }
                const selected = fallbackList[Math.floor(Math.random() * fallbackList.length)];
                window.App.State.lastPhrase = selected;
                return this.updateDisplay(selected);
            }

            const selected = allOriginal[Math.floor(Math.random() * allOriginal.length)];
            window.App.State.lastPhrase = selected;
            return this.updateDisplay(selected);
        } else {
            const weights = {
                high: filtered.high.length ? 45 : 0,
                medium: filtered.medium.length ? 35 : 0,
                low: filtered.low.length ? 20 : 0
            };

            const totalWeight = weights.high + weights.medium + weights.low;
            if(totalWeight === 0) return this.updateDisplay("🎯 没有找到金句"); // 修正

            const buildPool = (list, weight) => {
                if(!weight || !list.length) return [];
                
                const validList = list.filter(p => p !== window.App.State.lastPhrase);
                const finalList = validList.length > 0 ? validList : list;
                
                return finalList.map(p => ({
                    p,
                    w: weight / finalList.length
                }));
            };

            const pool = [
                ...buildPool(filtered.high, weights.high),
                ...buildPool(filtered.medium, weights.medium),
                ...buildPool(filtered.low, weights.low)
            ];

            let random = Math.random() * totalWeight;
            let accumulated = 0;
            let selectedPhrase = pool[0]?.p || "🎲 金句加载中...";
            
            for(const item of pool) {
                accumulated += item.w;
                if(random <= accumulated) {
                    selectedPhrase = item.p;
                    break;
                }
            }

            window.App.State.lastPhrase = selectedPhrase;
            return this.updateDisplay(selectedPhrase); // 修正
        }
    },

    adjustPosition() {
        const phrase = document.getElementById('goldenPhrase');
        const timeline = document.querySelector('.timeline-container');
        const buttons = document.querySelector('.action-buttons');
        
        if (!phrase || !timeline || !buttons) return;

        // 获取时间轴底部的绝对位置
        const timelineRect = timeline.getBoundingClientRect();
        const timelineBottom = timelineRect.bottom;

        // 获取底部按钮顶部的绝对位置
        const buttonsRect = buttons.getBoundingClientRect();
        const buttonsTop = buttonsRect.top;

        // 获取可视区域高度，防止按钮太低测不准
        const viewportHeight = window.innerHeight;
        
        // 计算可用空间的高度
        // 如果 buttonsTop 很大（比如在屏幕外），限制在 viewportHeight - 60 (按钮大概高度)
        const limitBottom = Math.min(buttonsTop, viewportHeight - 80);
        const gap = limitBottom - timelineBottom;

        if (gap > 0) {
            const phraseHeight = phrase.offsetHeight;
            // 计算需要的 margin-top：(空隙 - 金句高度) / 2
            // 减去20px稍微偏上一点点，视觉更平衡，也可以不减
            let marginTop = (gap - phraseHeight) / 2 - 100;
            
            // 设置最小值，防止重叠
            if (marginTop < 20) marginTop = 20;

            // 应用样式：清除原有的 margin，只设置 top margin
            // 注意：style.css 里把 top 设为了 0，这里我们用 marginTop 控制垂直位置
            phrase.style.margin = `${marginTop}px auto 0`; 
        } else {
            // 空间不足时的保底
            phrase.style.margin = "20px auto";
        }
    },

    bindClickRefresh() {
        const phraseContainer = document.getElementById('goldenPhrase');
        
        phraseContainer.addEventListener('click', (e) => {
            if (!document.getElementById('clickRefreshSwitch').checked) return;

            const animationEnabled = document.getElementById('animationSwitch').checked;
            
            // 补充回原代码中的点击缩放动画
            if (animationEnabled) {
                phraseContainer.style.transform = 'scale(0.98)';
                setTimeout(() => {
                    phraseContainer.style.transform = 'scale(1)';
                    this.fetch();
                }, 300);
            } else {
                this.fetch();
            }
            
            // 如果自动轮播开着，就重置定时器
            if (document.getElementById('goldenSwitch').checked) {
                this.startTimer();
            }
        });
    }
};