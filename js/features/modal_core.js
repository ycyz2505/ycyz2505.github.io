window.App.ModalCore = {
    init() {
        const modals = [
            { btn: 'settingsButton', modal: 'settingsModal', close: 'closeSettings' },
            { btn: 'changelogButton', modal: 'changelogModal', close: 'closeChangelog' },
            { btn: 'announcementButton', modal: 'announcementModal', close: 'closeAnnouncement' },
            { btn: 'lostAndFoundButton', modal: 'lostAndFoundModal', close: 'closeLostAndFound' },
            { btn: 'notificationButton', modal: 'notificationModal', close: 'closeNotification' }
        ];

        modals.forEach(({btn, modal, close}) => {
            document.getElementById(btn).addEventListener('click', () => {
                document.getElementById(modal).classList.add('active');
            });
            document.getElementById(close).addEventListener('click', () => {
                document.getElementById(modal).classList.remove('active');
                this.resetFullscreen(modal);
            });
        });

        // 最大化按钮逻辑
        ['maximizeNotification', 'maximizeLostAndFound'].forEach(id => {
            const btn = document.getElementById(id);
            if(btn) btn.addEventListener('click', function() {
                const modal = this.closest('.settings-modal');
                modal.classList.toggle('fullscreen');
                this.textContent = modal.classList.contains('fullscreen') ? '🗗' : '⛶';
            });
        });
    },
    resetFullscreen(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.remove('fullscreen');
        const maxBtn = modal.querySelector('.maximize-btn');
        if (maxBtn) maxBtn.textContent = '⛶';
    }
};