// ============================================================
// js/features/pinyin.js
// 拼音首字母检索工具（座位表人名搜索使用）
// 数据来自 js/data/pinyin.js（汉字 → 拼音首字母，多音字含全部首字母）
// ============================================================

window.App = window.App || {};

window.App.Pinyin = {
    // 汉字 → 首字母集合（小写），首次使用时构建
    _map: null,

    _build() {
        if (this._map) return this._map;

        const map = new Map();
        const table = window.AppPinyinInitials || {};

        Object.keys(table).forEach(letter => {
            const chars = table[letter];

            for (let i = 0; i < chars.length; i++) {
                const ch = chars[i];
                let set = map.get(ch);

                if (!set) {
                    set = new Set();
                    map.set(ch, set);
                }

                set.add(letter);
            }
        });

        this._map = map;

        return map;
    },

    // 取某个字符的全部拼音首字母，无拼音（非汉字/未收录）返回 null
    getInitials(ch) {
        const set = this._build().get(ch);

        return set ? Array.from(set) : null;
    },

    isHanzi(ch) {
        return /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/.test(ch);
    },

    // 前缀匹配：查询串的每个字符依次匹配人名的开头
    // 中文 → 直接比对汉字；字母 → 比对对应汉字的拼音首字母
    // 例如："cyn" / "车yn" / "车一诺" 都能匹配 "车一诺"
    matchPrefix(name, query) {
        const text = String(name == null ? '' : name);
        const q = String(query == null ? '' : query).trim();

        if (!q) return true;
        if (!text) return false;

        const nameChars = Array.from(text);
        const queryChars = Array.from(q);

        if (queryChars.length > nameChars.length) return false;

        for (let i = 0; i < queryChars.length; i++) {
            const qc = queryChars[i];
            const nc = nameChars[i];

            if (/[a-zA-Z]/.test(qc)) {
                const initials = this.getInitials(nc);

                // 汉字：比对拼音首字母；非汉字（英文名、数字等）：直接比对字符
                if (initials) {
                    if (initials.indexOf(qc.toLowerCase()) === -1) return false;
                } else if (qc.toLowerCase() !== nc.toLowerCase()) {
                    return false;
                }

                continue;
            }

            if (this.isHanzi(qc)) {
                if (qc !== nc) return false;
                continue;
            }

            // 其它字符（数字、符号、非汉字字母文字）直接比对
            if (qc.toLowerCase() !== nc.toLowerCase()) return false;
        }

        return true;
    }
};
