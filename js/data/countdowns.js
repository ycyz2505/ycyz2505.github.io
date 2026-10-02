// ============================================================
// js/data/countdowns.js
// 默认倒计日列表
// locked: true 的条目在设置里不可修改 / 删除（例如高考倒计日）
// ============================================================

const defaultCountdowns = [
    {
        id: 'gaokao',
        name: '2028年高考',
        date: '2028-06-07',
        locked: true
    }
];

if (typeof window !== 'undefined') {
    window.defaultCountdowns = defaultCountdowns;
}