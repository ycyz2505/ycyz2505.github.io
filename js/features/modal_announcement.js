// ============================================================
// js/features/modal_announcement.js
// 公告板：只负责底部那条字体大小调节
// （公告内容本身写在 index.html 里，改公告直接改 HTML）
//
// 和通知、寻物用的是同一套控件与存储方式，字号存在 settings.announcementFontSize。
// ============================================================

window.App = window.App || {};

(function () {
    'use strict';

    var App = window.App;

    var MIN = 12;
    var MAX = 120;
    var DEFAULT = 20;

    App.ModalAnnouncement = {
        el: {},
        _inited: false,

        init() {
            if (this._inited) return;

            this.el.content = document.getElementById('announcementContent');
            this.el.slider = document.getElementById('announcementFontSizeSlider');
            this.el.value = document.getElementById('announcementFontSizeValue');

            if (!this.el.content) return;

            var saved = Number(App.Store && App.Store.getSetting('announcementFontSize')) || DEFAULT;
            this.apply(saved);

            var self = this;

            this.el.slider?.addEventListener('input', function (e) {
                self.apply(Number(e.target.value));
            });

            this.el.value?.addEventListener('input', function (e) {
                self.apply(Number(e.target.value));
            });

            this._inited = true;
        },

        apply(size) {
            var n = Number(size);
            if (!isFinite(n)) n = DEFAULT;
            n = Math.min(MAX, Math.max(MIN, n));

            // 公告正文用 1em，所以直接改容器字号就是改正文大小；
            // 标题、时间、脚注都是 em，会跟着一起等比缩放
            this.el.content.style.setProperty('--ann-font-size', n + 'px');

            if (this.el.slider) this.el.slider.value = n;
            if (this.el.value) this.el.value.value = n;

            if (App.Store) App.Store.setSetting('announcementFontSize', n);
        }
    };
})();
