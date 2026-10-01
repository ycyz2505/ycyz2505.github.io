window.App.ModalSettings = {
    init() {
        this.applyFromStore();
        this.bindProbability();
        this.bindInterval();
        this.bindSwitches();
        this.bindVirtualTime();
        this.bindPreviewSlider();

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

        // clickRefresh / autoRefresh 的持久化分别在 golden_phrase.js / auto_refresh.js 中完成
        document.getElementById('clickRefreshSwitch')?.addEventListener('change', e => {
            saveSetting('clickRefreshSwitch', e.target.checked);
        });
    },

    // ---------- 虚拟时间 ----------

    // 把 Date 转成 <input type="datetime-local"> 需要的本地时间字符串
    toLocalInputValue(date) {
        const pad = n => String(n).padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
               `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    },

    formatOffset(ms) {
        const abs = Math.abs(ms);
        const sign = ms >= 0 ? '+' : '-';
        const days = Math.floor(abs / 86400000);
        const hours = Math.floor((abs % 86400000) / 3600000);
        const mins = Math.floor((abs % 3600000) / 60000);
        const parts = [];
        if (days) parts.push(`${days}天`);
        if (hours) parts.push(`${hours}小时`);
        if (mins) parts.push(`${mins}分`);
        if (!parts.length) parts.push('不到1分钟');
        return sign + parts.join('');
    },

    bindVirtualTime() {
        const input = document.getElementById('virtualTimeInput');
        const applyBtn = document.getElementById('applyVirtualTime');
        const resetBtn = document.getElementById('resetVirtualTime');
        const statusEl = document.getElementById('timeOffsetStatus');
        const hintEl = document.getElementById('timeOffsetHint');
        if (!input) return;

        const currentOffset = window.App.Utils.getTimeOffset();

        // 输入框初值 = 当前"业务时间"
        input.value = this.toLocalInputValue(window.App.Utils.now());

        if (statusEl) {
            statusEl.textContent = currentOffset === 0
                ? '当前跟随系统时间'
                : `已偏移 ${this.formatOffset(currentOffset)}`;
        }

        if (hintEl) {
            hintEl.textContent = currentOffset === 0
                ? ''
                : `实际系统时间：${new Date().toLocaleString('zh-CN')}`;
        }

        applyBtn?.addEventListener('click', async () => {
            const val = input.value;
            if (!val) return;

            const target = new Date(val);
            if (isNaN(target.getTime())) {
                if (hintEl) hintEl.textContent = '时间格式无效';
                return;
            }

            const offset = target.getTime() - Date.now();
            window.App.Utils.setTimeOffset(offset);

            // 等写盘完成再刷新，最多等 500ms，避免请求慢时卡太久
            if (window.App.Store) {
                await Promise.race([
                    window.App.Store.flush(),
                    new Promise(r => setTimeout(r, 500))
                ]).catch(() => {});
            }

            location.reload();
        });

        resetBtn?.addEventListener('click', async () => {
            window.App.Utils.setTimeOffset(0);

            if (window.App.Store) {
                await Promise.race([
                    window.App.Store.flush(),
                    new Promise(r => setTimeout(r, 500))
                ]).catch(() => {});
            }

            location.reload();
        });
    },

    // ---------- 时间预览滑动条 ----------

    bindPreviewSlider() {
        const zone = document.getElementById('previewSliderZone');
        const slider = document.getElementById('previewSlider');
        const labelStart = document.getElementById('previewSliderLabelStart');
        const labelEnd = document.getElementById('previewSliderLabelEnd');
        const currentEl = document.getElementById('previewSliderCurrent');
        const modal = document.getElementById('settingsModal');
        if (!zone || !slider || !modal) return;

        // 以"当前虚拟时间"所在的年份作为滑动范围：1/1 ~ 12/31
        const now = window.App.Utils.now();
        const year = now.getFullYear();
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31);
        const totalDays = Math.round((endDate - startDate) / 86400000);

        slider.min = 0;
        slider.max = totalDays;

        // 初始滑块位置 = 当前业务时间在一年中的第几天
        const initialOffset = Math.round((now - startDate) / 86400000);
        slider.value = Math.max(0, Math.min(totalDays, initialOffset));

        if (labelStart) labelStart.textContent = `${year}/1/1`;
        if (labelEnd) labelEnd.textContent = `${year}/12/31`;

        const DAY_NAMES = '日一二三四五六';

        // 把滑块位置换算成预览日期（时分秒继承当前业务时间，这样作息状态也直观）
        const getPreviewDate = () => {
            const dayIndex = Number(slider.value) || 0;
            const base = new Date(year, 0, 1 + dayIndex);
            const vNow = window.App.Utils.now();
            base.setHours(
                vNow.getHours(),
                vNow.getMinutes(),
                vNow.getSeconds(),
                0
            );
            return base;
        };

        const refreshLabel = () => {
            const date = getPreviewDate();
            if (currentEl) {
                currentEl.textContent =
                    `预览：${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} 周${DAY_NAMES[date.getDay()]}`;
            }
        };

        // 拖动过程：只改内存偏移 + 轻量实时刷新（A 档，80ms 节流）
        const applyPreviewLight = () => {
            const preview = getPreviewDate();
            const offset = preview.getTime() - Date.now();

            window.App.Utils.setTimeOffset(offset, { persist: false });
            window.App.Utils.refreshAll();   // 轻量：文本/颜色/进度
            refreshLabel();
        };

        // 松手：持久化 + 完整刷新（A 档 + B 档）
        const applyPreviewFull = () => {
            const preview = getPreviewDate();
            const offset = preview.getTime() - Date.now();

            window.App.Utils.setTimeOffset(offset, { persist: true });
            window.App.Utils.refreshAllFull();   // 完整：含课表 HTML 重建
            refreshLabel();
        };

        // 拖动过程：实时应用 + 淡化模态框
        slider.addEventListener('input', () => {
            modal.classList.add('previewing');
            applyPreviewLight();
        });

        // 松手：完整刷新一次 + 恢复模态框
        slider.addEventListener('change', () => {
            applyPreviewFull();
            modal.classList.remove('previewing');
        });

        // 鼠标离开/失焦时兜底，避免 previewing 卡住
        slider.addEventListener('mouseleave', () => {
            if (slider.matches(':active')) return;
            modal.classList.remove('previewing');
        });

        // 键盘操作时（方向键），input 和 change 会同时触发，
        // 用 rAF 稍微延后移除 previewing，避免视觉闪烁
        slider.addEventListener('keyup', () => {
            requestAnimationFrame(() => {
                if (!slider.matches(':active')) {
                    modal.classList.remove('previewing');
                }
            });
        });

        refreshLabel();

        // 关闭设置面板时也要清掉 previewing 状态
        document.getElementById('closeSettings')?.addEventListener('click', () => {
            modal.classList.remove('previewing');
        });
    }
};