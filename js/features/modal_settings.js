window.App.ModalSettings = {
    init() {
        // 1. 金句间隔滑块
        document.getElementById('intervalSlider').addEventListener('input', (e) => {
            const val = Math.min(120, Math.max(1, parseInt(e.target.value) || 15));
            window.App.State.intervalDuration = val * 1000;
            document.getElementById('intervalValue').value = val;
            if (document.getElementById('goldenSwitch').checked) window.App.GoldenPhrase.startTimer();
        });

        // 2. 概率滑块
        document.getElementById('apiProbability').addEventListener('input', (e) => {
            window.App.State.apiProbability = parseInt(e.target.value);
            document.getElementById('apiProbabilityValue').value = window.App.State.apiProbability;
        });

        // 3. 自动轮播开关
        document.getElementById('goldenSwitch').addEventListener('change', function() {
            this.checked ? window.App.GoldenPhrase.startTimer() : window.App.GoldenPhrase.stopTimer();
        });

        // 4. 显示每日60s开关
        document.getElementById('imageSwitch').addEventListener('change', function() {
            const img = document.getElementById('apiImage');
            if (this.checked) {
                img.style.display = 'block';
                window.App.DailyImage.init();
            } else {
                img.style.display = 'none';
                clearInterval(window.App.Timers.image);
            }
        });

        // 5. 动画开关
        document.getElementById('animationSwitch').addEventListener('change', function() {
            const p = document.getElementById('goldenPhrase');
            this.checked ? p.classList.remove('no-animation') : p.classList.add('no-animation');
        });
    }
};