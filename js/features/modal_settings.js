window.App.ModalSettings = {
    currentPage: 'general',

    init() {
        this.applyFromStore();
        this.bindProbability();
        this.bindInterval();
        this.bindSwitches();
        this.bindTabs();

        window.resetProbability = () => this.setProbability(50);
        window.resetInterval = () => this.setIntervalDuration(15);
    },

    clamp(value, min, max, fallback) {
        const number = Number(value);
        return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
    },

    // 把 Store 里的设置写回 DOM
    applyFromStore() {
        const s = (window.App.Store && window.App.Store.get('settings')) || {};

        const setChecked = (id, value, fallback) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.checked = (value === undefined) ? fallback : !!value;
        };
        setChecked('goldenSwitch', s.goldenSwitch, true);
        setChecked('imageSwitch', s.imageSwitch, false);
        setChecked('clickRefreshSwitch', s.clickRefreshSwitch, false);
        setChecked('animationSwitch', s.animationSwitch, true);
        setChecked('themeGradientSwitch', s.themeGradientSwitch, true);
        setChecked('autoRefreshSwitch', s.autoRefreshSwitch, false);

        const intervalSec = (s.intervalDuration ?? 15000) / 1000;
        const setVal = (id, value) => {
            const el = document.getElementById(id);
            if (el && value !== undefined) el.value = value;
        };
        setVal('apiProbability', s.apiProbability ?? 50);
        setVal('apiProbabilityValue', s.apiProbability ?? 50);
        setVal('intervalSlider', intervalSec);
        setVal('intervalValue', intervalSec);
        setVal('lostAndFoundFontSizeSlider', s.lostAndFoundFontSize ?? 28);
        setVal('lostAndFoundFontSizeValue', s.lostAndFoundFontSize ?? 28);
        setVal('fontSizeSlider', s.notificationFontSize ?? 16);
        setVal('fontSizeValue', s.notificationFontSize ?? 16);

        // 动画开关同步到元素 class
        document.getElementById('goldenPhrase')?.classList.toggle('no-animation', !(s.animationSwitch !== false));
    },

    setProbability(value) {
        const finalValue = this.clamp(value, 0, 100, 50);
        const slider = document.getElementById('apiProbability');
        const number = document.getElementById('apiProbabilityValue');
        if (slider) slider.value = finalValue;
        if (number) number.value = finalValue;
        window.App.State.apiProbability = finalValue;
    },

    setIntervalDuration(value) {
        const finalValue = this.clamp(value, 1, 60, 15);
        const slider = document.getElementById('intervalSlider');
        const number = document.getElementById('intervalValue');
        if (slider) slider.value = finalValue;
        if (number) number.value = finalValue;
        window.App.State.intervalDuration = finalValue * 1000;

        if (document.getElementById('goldenSwitch')?.checked) {
            window.App.GoldenPhrase?.startTimer();
        }
    },

    bindPair(rangeId, numberId, { min, max, fallback, onInput }) {
        const range = document.getElementById(rangeId);
        const number = document.getElementById(numberId);
        if (!range && !number) return;

        const apply = value => {
            const result = this.clamp(value, min, max, fallback);
            if (range && range.value !== String(result)) range.value = result;
            if (number && number.value !== String(result)) number.value = result;
            onInput?.(result);
        };

        [range, number].forEach(el => {
            if (!el) return;
            el.addEventListener('input', e => apply(e.target.value));
            el.addEventListener('change', e => apply(e.target.value));
        });
    },

    bindProbability() {
        this.bindPair('apiProbability', 'apiProbabilityValue', {
            min: 0, max: 100, fallback: 50,
            onInput: value => { window.App.State.apiProbability = value; }
        });
    },

    bindInterval() {
        this.bindPair('intervalSlider', 'intervalValue', {
            min: 1, max: 600, fallback: 15,
            onInput: value => {
                window.App.State.intervalDuration = value * 1000;
                if (document.getElementById('goldenSwitch')?.checked) {
                    window.App.GoldenPhrase?.startTimer();
                }
            }
        });
    },

    bindSwitches() {
        const saveSetting = (key, value) => {
            if (window.App.Store) window.App.Store.setSetting(key, value);
        };

        document.getElementById('goldenSwitch')?.addEventListener('change', e => {
            saveSetting('goldenSwitch', e.target.checked);
            if (!window.App.GoldenPhrase) return;
            e.target.checked ? window.App.GoldenPhrase.startTimer() : window.App.GoldenPhrase.stopTimer();
        });

        document.getElementById('imageSwitch')?.addEventListener('change', e => {
            saveSetting('imageSwitch', e.target.checked);
            // 全部交给 DailyImage 处理：它会读 Store 的最新值，决定显示/隐藏 + 定时器
            window.App.DailyImage?.init();
        });

        document.getElementById('animationSwitch')?.addEventListener('change', e => {
            saveSetting('animationSwitch', e.target.checked);
            document.getElementById('goldenPhrase')?.classList.toggle('no-animation', !e.target.checked);
        });

        document.getElementById('themeGradientSwitch')?.addEventListener('change', e => {
            saveSetting('themeGradientSwitch', e.target.checked);
            // 立刻重新计算/回退主题色，无需刷新页面
            window.App.ThemeBackground?.update();
        });

        // clickRefresh / autoRefresh 的持久化分别在 golden_phrase.js / auto_refresh.js 中完成
        document.getElementById('clickRefreshSwitch')?.addEventListener('change', e => {
            saveSetting('clickRefreshSwitch', e.target.checked);
        });
    },

    // ---------- 垂直标签页 ----------

    bindTabs() {
        const modal = document.getElementById('settingsModal');
        if (!modal) return;

        const tabs = Array.from(modal.querySelectorAll('.settings-tab'));
        const pages = Array.from(modal.querySelectorAll('.settings-page'));

        const activate = page => {
            const valid = pages.some(item => item.dataset.page === page) ? page : 'general';

            if (this.currentPage === 'roster' && valid !== 'roster') {
                window.App.ModalRoster?.onHide?.();
            }
            if (valid !== 'virtualTime') {
                window.App.ModalVirtualTime?._setAllModalsPreviewing?.(false);
            }
            if (valid !== 'palette') {
                window.App.ModalPalette?.setPreviewing(false);
            }

            this.currentPage = valid;

            tabs.forEach(tab => tab.classList.toggle('active', tab.dataset.page === valid));
            pages.forEach(item => item.classList.toggle('active', item.dataset.page === valid));
            modal.classList.toggle('virtual-tab', valid === 'virtualTime');

            this.refreshPage(valid);
        };

        this._activatePage = activate;

        tabs.forEach(tab => {
            tab.addEventListener('click', () => activate(tab.dataset.page));
        });

        document.getElementById('settingsButton')?.addEventListener('click', () => {
            // ModalCore 会先给设置模态框加 active，这里再刷新当前页
            window.setTimeout(() => activate(this.currentPage), 0);
        });

        document.getElementById('closeSettings')?.addEventListener('click', () => this.onClose());

        activate(this.currentPage);
    },

    refreshPage(page) {
        if (page === 'virtualTime') window.App.ModalVirtualTime?.onShow?.();
        if (page === 'timetable') window.App.ModalTimetable?.onShow?.();
        if (page === 'countdown') window.App.ModalCountdown?.onShow?.();
        if (page === 'palette') window.App.ModalPalette?.onShow?.();
        if (page === 'phraseHistory') window.App.ModalPhraseHistory?.onShow?.();
        if (page === 'roster') window.App.ModalRoster?.onShow?.();
    },

    onClose() {
        window.App.ModalVirtualTime?._setAllModalsPreviewing?.(false);
        window.App.ModalPalette?.setPreviewing(false);
        window.App.ModalRoster?.onHide?.();
    }
};
