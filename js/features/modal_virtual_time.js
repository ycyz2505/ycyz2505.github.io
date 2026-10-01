// ============================================================
// js/features/modal_virtual_time.js
// 虚拟时间独立模态框
// - 设置/恢复网站的虚拟时间（时钟、倒计时、作息、课表、节气都按此计算）
// - 时间预览滑动条：拖动 → 轻量刷新；松手 → 完整刷新并落盘
// ============================================================

window.App = window.App || {};

window.App.ModalVirtualTime = {
    // 拖动预览时，所有模态框一起淡化（含背后的设置模态框），
    // 只让滑条区域浮到最上层，避免"设置"面板遮挡视线。
    _setAllModalsPreviewing(on) {
        document.querySelectorAll('.settings-modal').forEach(m => {
            m.classList.toggle('previewing', on);
        });
    },

    init() {
        this.bindVirtualTime();
        this.bindPreviewSlider();
        this.bindEntryRefresh();
        this.refreshUI();
    },

    // ---------- 通用：把 Date 转成 <input type="datetime-local"> 需要的本地字符串 ----------
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

    // ---------- 打开虚拟时间面板时刷新一下 UI（避免长时间停留后数据过期） ----------
    bindEntryRefresh() {
        document.getElementById('openVirtualTimeModal')?.addEventListener('click', () => {
            // 让 ModalCore 先加好 active，再刷新输入框
            window.setTimeout(() => this.refreshUI(), 0);
        });
    },

    refreshUI() {
        const input = document.getElementById('virtualTimeInput');
        const statusEl = document.getElementById('timeOffsetStatus');
        const hintEl = document.getElementById('timeOffsetHint');

        const offset = window.App.Utils.getTimeOffset();

        if (input) input.value = this.toLocalInputValue(window.App.Utils.now());

        if (statusEl) {
            statusEl.textContent = offset === 0
                ? '当前跟随系统时间'
                : `已偏移 ${this.formatOffset(offset)}`;
        }

        if (hintEl) {
            hintEl.textContent = offset === 0
                ? ''
                : `实际系统时间：${new Date().toLocaleString('zh-CN')}`;
        }
    },

    // ---------- 虚拟时间设置 ----------
    bindVirtualTime() {
        const input = document.getElementById('virtualTimeInput');
        const applyBtn = document.getElementById('applyVirtualTime');
        const resetBtn = document.getElementById('resetVirtualTime');
        const hintEl = document.getElementById('timeOffsetHint');
        if (!input) return;

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
        const modal = document.getElementById('virtualTimeModal');
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

        // 拖动过程：实时应用 + 所有模态框一起淡化
        slider.addEventListener('input', () => {
            this._setAllModalsPreviewing(true);
            applyPreviewLight();
        });

        // 松手：完整刷新一次 + 恢复所有模态框
        slider.addEventListener('change', () => {
            applyPreviewFull();
            this._setAllModalsPreviewing(false);
        });

        // 鼠标离开/失焦时兜底，避免 previewing 卡住
        slider.addEventListener('mouseleave', () => {
            if (slider.matches(':active')) return;
            this._setAllModalsPreviewing(false);
        });

        // 键盘操作时（方向键），input 和 change 会同时触发，
        // 用 rAF 稍微延后移除 previewing，避免视觉闪烁
        slider.addEventListener('keyup', () => {
            requestAnimationFrame(() => {
                if (!slider.matches(':active')) {
                    this._setAllModalsPreviewing(false);
                }
            });
        });

        refreshLabel();

        // 关闭虚拟时间面板时也要清掉 previewing 状态
        document.getElementById('closeVirtualTime')?.addEventListener('click', () => {
            this._setAllModalsPreviewing(false);
        });
    }
};