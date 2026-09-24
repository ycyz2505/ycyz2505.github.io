window.App.ModalSettings = {
    init() {
        this.bindSettingsRanges();
        this.bindOtherSettings();
        this.bindAllRangeControls();

        /*
         * 让外部 HTML 的 onclick="resetProbability()"
         * 和 onclick="resetInterval()" 可以正常调用。
         */
        window.resetProbability = () => {
            this.setProbability(50);
        };

        window.resetInterval = () => {
            this.setIntervalDuration(15);
        };
    },

    clamp(value, min, max, fallback) {
        const number = Number(value);

        if (!Number.isFinite(number)) {
            return fallback;
        }

        return Math.min(max, Math.max(min, number));
    },

    setProbability(value) {
        const finalValue = this.clamp(value, 0, 100, 50);

        const slider = document.getElementById('apiProbability');
        const number = document.getElementById('apiProbabilityValue');

        if (slider) {
            slider.value = finalValue;
        }

        if (number) {
            number.value = finalValue;
        }

        if (window.App.State) {
            window.App.State.apiProbability = finalValue;
        }
    },

    setIntervalDuration(value) {
        const finalValue = this.clamp(value, 1, 60, 15);

        const slider = document.getElementById('intervalSlider');
        const number = document.getElementById('intervalValue');

        if (slider) {
            slider.value = finalValue;
        }

        if (number) {
            number.value = finalValue;
        }

        if (window.App.State) {
            window.App.State.intervalDuration =
                finalValue * 1000;
        }

        const goldenSwitch =
            document.getElementById('goldenSwitch');

        if (
            goldenSwitch &&
            goldenSwitch.checked &&
            window.App.GoldenPhrase
        ) {
            window.App.GoldenPhrase.startTimer();
        }
    },

    bindSettingsRanges() {
        const probabilitySlider =
            document.getElementById('apiProbability');

        const probabilityValue =
            document.getElementById('apiProbabilityValue');

        if (probabilitySlider) {
            probabilitySlider.addEventListener('input', event => {
                this.setProbability(event.target.value);
            });
        }

        if (probabilityValue) {
            probabilityValue.addEventListener('input', event => {
                this.setProbability(event.target.value);
            });

            probabilityValue.addEventListener('change', event => {
                this.setProbability(event.target.value);
            });
        }

        const intervalSlider =
            document.getElementById('intervalSlider');

        const intervalValue =
            document.getElementById('intervalValue');

        if (intervalSlider) {
            intervalSlider.addEventListener('input', event => {
                this.setIntervalDuration(event.target.value);
            });
        }

        if (intervalValue) {
            intervalValue.addEventListener('input', event => {
                this.setIntervalDuration(event.target.value);
            });

            intervalValue.addEventListener('change', event => {
                this.setIntervalDuration(event.target.value);
            });
        }

        /*
         * 根据 HTML 中的初始值初始化 State。
         */
        this.setProbability(
            probabilitySlider
                ? probabilitySlider.value
                : 50
        );

        this.setIntervalDuration(
            intervalSlider
                ? intervalSlider.value
                : 15
        );
    },

    bindOtherSettings() {
        const goldenSwitch =
            document.getElementById('goldenSwitch');

        if (goldenSwitch) {
            goldenSwitch.addEventListener('change', event => {
                if (!window.App.GoldenPhrase) return;

                if (event.target.checked) {
                    window.App.GoldenPhrase.startTimer();
                } else {
                    window.App.GoldenPhrase.stopTimer();
                }
            });
        }

        const imageSwitch =
            document.getElementById('imageSwitch');

        if (imageSwitch) {
            imageSwitch.addEventListener('change', event => {
                const image =
                    document.getElementById('apiImage');

                if (!image) return;

                if (event.target.checked) {
                    image.style.display = 'block';

                    if (window.App.DailyImage) {
                        window.App.DailyImage.init();
                    }
                } else {
                    image.style.display = 'none';

                    if (
                        window.App.Timers &&
                        window.App.Timers.image
                    ) {
                        clearInterval(window.App.Timers.image);
                        window.App.Timers.image = null;
                    }
                }
            });
        }

        const animationSwitch =
            document.getElementById('animationSwitch');

        if (animationSwitch) {
            animationSwitch.addEventListener('change', event => {
                const phrase =
                    document.getElementById('goldenPhrase');

                if (!phrase) return;

                phrase.classList.toggle(
                    'no-animation',
                    !event.target.checked
                );
            });
        }
    },

    bindRangePair(rangeId, numberId, options = {}) {
        const range = document.getElementById(rangeId);
        const number = document.getElementById(numberId);

        if (!range && !number) return;

        const min = Number(
            options.min ??
            range?.min ??
            number?.min ??
            0
        );

        const max = Number(
            options.max ??
            range?.max ??
            number?.max ??
            100
        );

        const fallback = Number(
            options.fallback ??
            range?.value ??
            number?.value ??
            min
        );

        const apply = value => {
            const result = this.clamp(
                value,
                min,
                max,
                fallback
            );

            if (range && range.value !== String(result)) {
                range.value = result;
            }

            if (number && number.value !== String(result)) {
                number.value = result;
            }

            if (typeof options.onInput === 'function') {
                options.onInput(result);
            }
        };

        if (range) {
            range.addEventListener('input', event => {
                apply(event.target.value);
            });

            range.addEventListener('change', event => {
                apply(event.target.value);
            });
        }

        if (number) {
            number.addEventListener('input', event => {
                apply(event.target.value);
            });

            number.addEventListener('change', event => {
                apply(event.target.value);
            });
        }

        apply(
            range?.value ??
            number?.value ??
            fallback
        );
    },

    bindAllRangeControls() {
        /*
         * 通知字体大小滑块。
         */
        this.bindRangePair(
            'fontSizeSlider',
            'fontSizeValue',
            {
                min: 12,
                max: 120,
                fallback: 16,
                onInput: value => {
                    const content =
                        document.getElementById(
                            'notificationContent'
                        );

                    if (content) {
                        content.style.fontSize = `${value}px`;
                    }
                }
            }
        );

        /*
         * 寻物字体大小滑块。
         */
        this.bindRangePair(
            'lostAndFoundFontSizeSlider',
            'lostAndFoundFontSizeValue',
            {
                min: 12,
                max: 120,
                fallback: 28,
                onInput: value => {
                    const list =
                        document.getElementById(
                            'lostAndFoundList'
                        );

                    if (list) {
                        list.style.fontSize = `${value}px`;
                    }
                }
            }
        );
    }
};