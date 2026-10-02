window.App.Utils = {
    // HTML 转义：把用户输入安全地插入 innerHTML 时使用
    escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    },

    // 轻量刷新的时间节流（毫秒）：拖动时最多每 80ms 执行一次
    _refreshThrottle: 80,
    _lastRefresh: 0,
    _pendingRefreshTimer: null,

    timeToMinutes(time) {
        if (time instanceof Date) return time.getHours() * 60 + time.getMinutes();
        if (time === '23:59') return 1439;
        const [h, m] = time.split(':').map(Number);
        return h * 60 + m;
    },

    // 返回当前"业务时间"：真实时间 + 用户设置的偏移量
    // 所有需要"当前日期/时间"的业务逻辑都应当使用此方法，
    // 而不是直接 new Date()，这样才能支持设置里改时间
    now() {
        const offset = this.getTimeOffset();
        return new Date(Date.now() + offset);
    },

    getTimeOffset() {
        if (!window.App.Store) return 0;
        const v = window.App.Store.getSetting('timeOffset');
        const n = Number(v);
        return Number.isFinite(n) ? n : 0;
    },

    // options.persist === false 时只改内存，不触发写盘（预览滑动时用）
    setTimeOffset(ms, options) {
        if (!window.App.Store) return;
        const n = Number(ms);
        const value = Number.isFinite(n) ? n : 0;
        window.App.Store.setSetting('timeOffset', value, options || {});
    },

    // ============================================================
    // 时间预览相关：拖动时实时刷新（轻量）
    // - 只做"文本/颜色/进度"级别的更新，不重建 DOM 结构
    // - 带时间节流，保证高频拖动时不会卡死
    // - 节流窗口内的最后一次调用会被补执行，避免漏掉终点值
    // ============================================================
    refreshAll() {
        const now = performance.now();
        const elapsed = now - this._lastRefresh;

        if (elapsed >= this._refreshThrottle) {
            this._lastRefresh = now;
            this._runLightRefresh();
            return;
        }

        // 节流窗口内：安排一次尾部执行
        if (this._pendingRefreshTimer) return;

        this._pendingRefreshTimer = setTimeout(() => {
            this._pendingRefreshTimer = null;
            this._lastRefresh = performance.now();
            this._runLightRefresh();
        }, this._refreshThrottle - elapsed);
    },

    // ============================================================
    // 松手时调用：一次性做完整刷新（轻量 + 重量）
    // - 会先清掉挂起的节流定时器，避免重复
    // - 包含 A 档全部 + B 档（节气标记重建、课表 HTML 重建、编辑器重建）
    // ============================================================
    refreshAllFull() {
        if (this._pendingRefreshTimer) {
            clearTimeout(this._pendingRefreshTimer);
            this._pendingRefreshTimer = null;
        }

        this._lastRefresh = performance.now();

        const safe = fn => {
            try { fn(); }
            catch (e) { console.warn('[refreshAllFull]', e); }
        };

        // A 档：与轻量刷新一致
        safe(() => window.App.ExamCountdown?.update?.());
        safe(() => window.App.SchoolSchedule?.updateDisplay?.());   // 默认含 renderTimetable
        safe(() => window.App.SchoolSchedule?.updateCountdownDisplay?.());
        safe(() => window.App.Timeline?.updateColor?.());
        safe(() => window.App.ThemeBackground?.update?.());

        // B 档：重量级 DOM 重建
        // 节气标记必须重建：isPast = termDate < now 依赖"当前业务时间"，
        // 拖动到不同日期后，哪些节气算"已过去"会变，颜色也要跟着变
        safe(() => window.App.Timeline?.generateMarkers?.());
        safe(() => window.App.ModalTimetable?.render?.());
    },

    // ---------- 内部：A 档轻量刷新 ----------
    _runLightRefresh() {
        const safe = fn => {
            try { fn(); }
            catch (e) { console.warn('[refreshAll]', e); }
        };

        // 1. 高考倒计时天数
        safe(() => window.App.ExamCountdown?.update?.());

        // 2 & 4. 当前/下节课文字 + 作息倒计时秒数
        //        传 renderTimetable:false 跳过课表 HTML 重建（B 档）
        safe(() => window.App.SchoolSchedule?.updateDisplay?.({ renderTimetable: false }));
        safe(() => window.App.SchoolSchedule?.updateCountdownDisplay?.());

        // 6. 时间轴进度条
        safe(() => window.App.Timeline?.updateColor?.());

        // 7. 主题色相 + 背景色
        safe(() => window.App.ThemeBackground?.update?.());

        // 注意：不调用 Timeline.generateMarkers()
        // 它涉及 24 个标记 + 24 张卡片 + 24 个 <img> 的 DOM 重建，
        // 放在滑动链里会严重拖慢拖动；改成松手后一次重建（见 refreshAllFull）。
        // 更不调用 ModalTimetable.render()，那也是 B 档。
    }
};