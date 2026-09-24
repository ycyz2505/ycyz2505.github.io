window.App.ModalSettings = {
    init() {
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

    setProbability(value) {
        const finalValue = this.clamp(value, 0, 100, 50);

        const slider = document.getElementById('apiProbability');
        const number = document.getElementById('apiProbabilityValue');
        if (slider) slider.value = finalValue;
        if (number) number.value = finalValue;
        if (window.App.State) window.App.State.apiProbability = finalValue;
    },

    setIntervalDuration(value) {
        const finalValue = this.clamp(value, 1, 60, 15);

        const slider = document.getElementById('intervalSlider');
        const number = document.getElementById('intervalValue');
        if (slider) slider.value = finalValue;
        if (number) number.value = finalValue;
        if (window.App.State) window.App.State.intervalDuration = finalValue * 1000;

        if (document.getElementById('goldenSwitch')?.checked) {
            window.App.GoldenPhrase?.startTimer();
        }
    },

    // 把一个 range 和一个 number 输入框双向绑定
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

        apply(range?.value ?? number?.value ?? fallback);
    },

    bindProbability() {
        this.bindPair('apiProbability', 'apiProbabilityValue', {
            min: 0,
            max: 100,
            fallback: 50,
            onInput: value => {
                if (window.App.State) window.App.State.apiProbability = value;
            }
        });
    },

    bindInterval() {
        this.bindPair('intervalSlider', 'intervalValue', {
            min: 1,
            max: 60,
            fallback: 15,
            onInput: value => {
                if (window.App.State) window.App.State.intervalDuration = value * 1000;
                if (document.getElementById('goldenSwitch')?.checked) {
                    window.App.GoldenPhrase?.startTimer();
                }
            }
        });
    },

    bindSwitches() {
        document.getElementById('goldenSwitch')?.addEventListener('change', e => {
            if (!window.App.GoldenPhrase) return;
            e.target.checked ? window.App.GoldenPhrase.startTimer() : window.App.GoldenPhrase.stopTimer();
        });

        document.getElementById('imageSwitch')?.addEventListener('change', e => {
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
            document.getElementById('goldenPhrase')?.classList.toggle('no-animation', !e.target.checked);
        });
    }
};
