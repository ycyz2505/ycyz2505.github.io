window.App.ModalSettings = {
    init() {
        this.applyFromStore();
        this.bindProbability();
        this.bindInterval();
        this.bindSwitches();

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
        setChecked('imageSwitch', s.imageSwitch, true);
        setChecked('clickRefreshSwitch', s.clickRefreshSwitch, false);
        setChecked('animationSwitch', s.animationSwitch, true);
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
            min: 1, max: 60, fallback: 15,
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
            const image = document.getElementById('apiImage');
            if (!image) return;
            if (e.target.checked) {
                image.style.display = 'block';
                window.App.DailyImage?.init();
            } else {
                image.style.display = 'none';
                if (window.App.Timers.image) {
                    clearInterval(window.App.Timers.image);
                    window.App.Timers.image = null;
                }
            }
        });

        document.getElementById('animationSwitch')?.addEventListener('change', e => {
            saveSetting('animationSwitch', e.target.checked);
            document.getElementById('goldenPhrase')?.classList.toggle('no-animation', !e.target.checked);
        });

        // clickRefresh / autoRefresh 的持久化分别在 golden_phrase.js / auto_refresh.js 中完成
        document.getElementById('clickRefreshSwitch')?.addEventListener('change', e => {
            saveSetting('clickRefreshSwitch', e.target.checked);
        });
    }
};