window.App.ModalPhrase = {
    init() {
        const openBtn = document.getElementById('phraseSelectButton');
        const modal = document.getElementById('phraseModal');
        const closeBtn = document.getElementById('closePhrase');

        openBtn?.addEventListener('click', () => {
            this.populateList();
            modal.classList.add('active');
        });

        closeBtn?.addEventListener('click', () => modal.classList.remove('active'));
    },

    populateList() {
        const container = document.getElementById('phraseList');
        if (!container) return;

        const data = (window.App.Store && window.App.Store.get('phrases'))
                  || window.localPhrases || {};

        const allPhrases = [
            ...(data.high || []),
            ...(data.medium || []),
            ...(data.low || [])
        ];

        container.innerHTML = '';
        const fragment = document.createDocumentFragment();

        allPhrases.forEach(phrase => {
            const item = document.createElement('div');
            item.className = 'phrase-item';
            item.innerHTML = String(phrase).replace(/\n/g, '<br>');

            item.addEventListener('click', () => {
                item.classList.add('phrase-click-effect');
                setTimeout(() => item.classList.remove('phrase-click-effect'), 400);

                window.App.GoldenPhrase?.updateDisplay(phrase);

                document.getElementById('phraseModal')?.classList.remove('active');

                if (document.getElementById('goldenSwitch')?.checked && window.App.GoldenPhrase) {
                    window.App.GoldenPhrase.stopTimer();
                    window.App.GoldenPhrase.startTimer();
                }
            });

            fragment.appendChild(item);
        });

        container.appendChild(fragment);
    }
};