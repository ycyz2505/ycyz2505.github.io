window.App.DailyImage = {
    init() {
        this.fetch();
        window.App.Timers.image = setInterval(() => this.fetch(), 86400000);
    },
    fetch() {
        fetch('https://api.cenguigui.cn/api/60s/')
            .then(response => response.blob()) 
            .then(blob => {
                const img = document.getElementById('apiImage'); 
                img.src = URL.createObjectURL(blob); 
                img.style.height = '80vh';
            })
            .catch(error => console.error('图片加载失败:', error));
    }
};