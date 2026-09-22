window.App.GoldenPhrase = {
    apiConfigs: [
        {
            url: 'https://zj.v.api.aa1.cn/api/wenan-shici/?type=json',
            method: 'GET',
            weight: 15,
            maxRetry: 3,
            handler(data) {
                const text = data.msg || '';
                return text.length <= 100 ? text : null;
            }
        },
        {
            url: 'https://api.songzixian.com/api/daily-poem?dataSource=LOCAL_DAILY_POEM',
            method: 'GET',
            weight: 15,
            maxRetry: 3,
            handler(data) {
                if (!data.data) return null;

                let title = data.data.title || '';
                title = title.replace(/\s*·\s*/g, '·');

                const hasBookMarks =
                    /^《(.+)》$/.test(title);

                const formattedTitle = hasBookMarks
                    ? title
                    : `《${title}》`;

                return (
                    `${data.data.quotes || ''}` +
                    `——${data.data.author || ''}` +
                    `${formattedTitle}`
                );
            }
        },
        {
            url: 'https://zj.v.api.aa1.cn/api/wenan-wm/?type=json',
            method: 'GET',
            weight: 20,
            maxRetry: 3,
            handler(data) {
                const text = data.msg || '';
                return text.length <= 100 ? text : null;
            }
        },
        {
            url: 'https://zj.v.api.aa1.cn/api/wenan-mj/?type=json',
            method: 'GET',
            weight: 30,
            maxRetry: 3,
            handler(data) {
                const text = data.msg || '';
                return text.length <= 100 ? text : null;
            }
        },
        {
            url: 'https://api.mu-jie.cc/stray-birds/range?type=json',
            method: 'GET',
            weight: 20,
            maxRetry: 5,
            handler(data) {
                const chineseLength = data.cn?.length || 0;
                const englishLength = data.en?.length || 0;

                if (chineseLength > 100) {
                    return null;
                }

                const totalLength =
                    englishLength * 0.5 + chineseLength;

                if (totalLength <= 100) {
                    return `${data.en}（${data.cn}）——泰戈尔`;
                }

                return `${data.cn}——泰戈尔`;
            }
        }
    ],

    init() {
        this.updateClassInformation();
        this.bindPhraseSelector();
        this.fetch();
        this.startTimer();
        this.bindClickRefresh();
    },

    updateClassInformation() {
        document.title =
            '高考倒计时 - 高二（22）班 | 高考必胜';

        const brand = document.querySelector('.brand');

        if (brand) {
            brand.textContent =
                '杨村一中　高二（22）班（2522班）';
        }
    },

    startTimer() {
        if (
            window.App.Timers &&
            window.App.Timers.phrase
        ) {
            clearInterval(window.App.Timers.phrase);
        }

        const interval =
            Number(window.App.State?.intervalDuration) ||
            15000;

        window.App.Timers.phrase = setInterval(() => {
            this.fetch();
        }, interval);
    },

    stopTimer() {
        if (
            window.App.Timers &&
            window.App.Timers.phrase
        ) {
            clearInterval(window.App.Timers.phrase);
            window.App.Timers.phrase = null;
        }
    },

    async fetchWithRetry(apiConfig, retryCount = 0) {
        try {
            const response = await fetch(apiConfig.url, {
                method: apiConfig.method || 'GET'
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            const processed = apiConfig.handler(data);

            if (processed !== null && processed !== '') {
                return processed;
            }

            if (retryCount < apiConfig.maxRetry) {
                return this.fetchWithRetry(
                    apiConfig,
                    retryCount + 1
                );
            }

            throw new Error('超过最大重试次数');
        } catch (error) {
            if (retryCount < apiConfig.maxRetry) {
                return this.fetchWithRetry(
                    apiConfig,
                    retryCount + 1
                );
            }

            throw error;
        }
    },

    selectRandomAPI() {
        const totalWeight = this.apiConfigs.reduce(
            (sum, api) => sum + api.weight,
            0
        );

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
        const probability = Number(
            window.App.State?.apiProbability ?? 50
        );

        const shouldUseAPI =
            Math.random() < probability / 100;

        if (!shouldUseAPI) {
            this.showLocal();
            return;
        }

        try {
            const api = this.selectRandomAPI();
            const text = await this.fetchWithRetry(api);
            this.updateDisplay(text);
        } catch (error) {
            console.warn(
                '联网金句获取失败，改用本地金句：',
                error
            );

            this.showLocal();
        }
    },

    updateDisplay(text) {
        const container =
            document.getElementById('goldenPhrase');

        if (!container) return;

        const finalText =
            text === undefined || text === null
                ? ''
                : String(text);

        const animationSwitch =
            document.getElementById('animationSwitch');

        const animationEnabled =
            !animationSwitch ||
            animationSwitch.checked;

        const formatted =
            this.escapeHTML(finalText)
                .replace(/\n/g, '<br>');

        const updateContent = () => {
            container.innerHTML = `「 ${formatted} 」`;
            container.style.opacity = '1';
        };

        if (animationEnabled) {
            container.style.opacity = '0';

            setTimeout(() => {
                updateContent();
            }, 500);
        } else {
            updateContent();
        }
    },

    showLocal() {
        /*
         * 不能直接使用未定义的 localPhrases，
         * 也不能直接读取不存在的 originalSwitch。
         */
        const localData =
            window.localPhrases || {
                high: [],
                medium: [],
                low: []
            };

        const high = Array.isArray(localData.high)
            ? localData.high
            : [];

        const medium = Array.isArray(localData.medium)
            ? localData.medium
            : [];

        const low = Array.isArray(localData.low)
            ? localData.low
            : [];

        const originalSwitch =
            document.getElementById('originalSwitch');

        const onlyOriginal =
            originalSwitch?.checked || false;

        const filterOriginal = list => {
            if (!onlyOriginal) {
                return list;
            }

            return list.filter(phrase => {
                return String(phrase)
                    .trim()
                    .endsWith('🌟');
            });
        };

        const filteredHigh = filterOriginal(high);
        const filteredMedium = filterOriginal(medium);
        const filteredLow = filterOriginal(low);

        const allPhrases = [
            ...filteredHigh,
            ...filteredMedium,
            ...filteredLow
        ];

        if (!allPhrases.length) {
            this.updateDisplay('🎯 没有找到金句');
            return;
        }

        let candidates = allPhrases.filter(phrase => {
            return phrase !== window.App.State.lastPhrase;
        });

        if (!candidates.length) {
            candidates = allPhrases;
        }

        let selectedPhrase;

        /*
         * 按照 high 45%、medium 35%、low 20%
         * 的比例选择本地金句。
         */
        if (!onlyOriginal) {
            const pools = [];

            if (filteredHigh.length) {
                pools.push({
                    list: filteredHigh,
                    weight: 45
                });
            }

            if (filteredMedium.length) {
                pools.push({
                    list: filteredMedium,
                    weight: 35
                });
            }

            if (filteredLow.length) {
                pools.push({
                    list: filteredLow,
                    weight: 20
                });
            }

            const totalWeight = pools.reduce(
                (sum, item) => sum + item.weight,
                0
            );

            let random = Math.random() * totalWeight;

            for (const pool of pools) {
                if (random < pool.weight) {
                    const poolCandidates =
                        pool.list.filter(phrase => {
                            return (
                                phrase !==
                                window.App.State.lastPhrase
                            );
                        });

                    const finalList =
                        poolCandidates.length
                            ? poolCandidates
                            : pool.list;

                    selectedPhrase =
                        finalList[
                            Math.floor(
                                Math.random() *
                                finalList.length
                            )
                        ];

                    break;
                }

                random -= pool.weight;
            }
        }

        /*
         * 当只有原创模式，或者权重池没有成功选出内容时，
         * 从候选列表中随机选择。
         */
        if (!selectedPhrase) {
            selectedPhrase =
                candidates[
                    Math.floor(
                        Math.random() * candidates.length
                    )
                ];
        }

        window.App.State.lastPhrase = selectedPhrase;
        this.updateDisplay(selectedPhrase);
    },

    bindPhraseSelector() {
        const openButton =
            document.getElementById('phraseSelectButton');

        const modal =
            document.getElementById('phraseModal');

        const closeButton =
            document.getElementById('closePhrase');

        if (!openButton || !modal) {
            return;
        }

        openButton.addEventListener('click', () => {
            this.populatePhraseList();
            modal.classList.add('active');
        });

        if (closeButton) {
            closeButton.addEventListener('click', () => {
                modal.classList.remove('active');
            });
        }

        modal.addEventListener('click', event => {
            if (event.target === modal) {
                modal.classList.remove('active');
            }
        });
    },

    populatePhraseList() {
        const container =
            document.getElementById('phraseList');

        if (!container) return;

        const localData =
            window.localPhrases || {
                high: [],
                medium: [],
                low: []
            };

        const allPhrases = [
            ...(Array.isArray(localData.high)
                ? localData.high
                : []),
            ...(Array.isArray(localData.medium)
                ? localData.medium
                : []),
            ...(Array.isArray(localData.low)
                ? localData.low
                : [])
        ];

        container.innerHTML = '';

        if (!allPhrases.length) {
            container.textContent = '暂无本地金句';
            return;
        }

        const fragment =
            document.createDocumentFragment();

        allPhrases.forEach(phrase => {
            const item = document.createElement('div');

            item.className = 'phrase-item';
            item.innerHTML = this.escapeHTML(
                String(phrase)
            ).replace(/\n/g, '<br>');

            item.addEventListener('click', () => {
                this.updateDisplay(phrase);

                const modal =
                    document.getElementById('phraseModal');

                if (modal) {
                    modal.classList.remove('active');
                }

                window.App.State.lastPhrase = phrase;

                const goldenSwitch =
                    document.getElementById('goldenSwitch');

                if (
                    goldenSwitch?.checked
                ) {
                    this.startTimer();
                }
            });

            fragment.appendChild(item);
        });

        container.appendChild(fragment);
    },

    bindClickRefresh() {
        const container =
            document.getElementById('goldenPhrase');

        if (!container) return;

        container.addEventListener('click', () => {
            const clickSwitch =
                document.getElementById(
                    'clickRefreshSwitch'
                );

            if (!clickSwitch?.checked) {
                return;
            }

            const animationSwitch =
                document.getElementById('animationSwitch');

            const animationEnabled =
                !animationSwitch ||
                animationSwitch.checked;

            if (animationEnabled) {
                container.style.transform = 'scale(0.98)';

                setTimeout(() => {
                    container.style.transform = 'scale(1)';
                    this.fetch();
                }, 300);
            } else {
                this.fetch();
            }

            const goldenSwitch =
                document.getElementById('goldenSwitch');

            if (goldenSwitch?.checked) {
                this.startTimer();
            }
        });
    },

    escapeHTML(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
};