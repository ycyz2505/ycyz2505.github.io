window.App.Clock = {
    init() {
        this.update();
    },
    update() {
        const date = new Date();
        const weekDays = ['日','一','二','三','四','五','六'];
        const hh = date.getHours().toString().padStart(2, '0');
        const mm = date.getMinutes().toString().padStart(2, '0');
        const ss = date.getSeconds().toString().padStart(2, '0');
        const yyyy = date.getFullYear(); 
        const m = (date.getMonth() + 1).toString().padStart(2, '0');
        const d = date.getDate().toString().padStart(2, '0');
        const week = weekDays[date.getDay()];
        
        document.getElementById('currentDateTime').innerHTML = `
            <div class="time-section">${hh}:${mm}:${ss}</div>
            <div class="date-section">${yyyy}/${m}/${d} 周${week}</div>
        `;
        requestAnimationFrame(() => this.update());
    }
};