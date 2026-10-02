// ============================================================
// js/features/modal_calculator.js
// 科学计算器
// - 支持 + − × ÷ ^ % ! ( ) π e
// - 支持 sin/cos/tan/asin/acos/atan/ln/log/√/∛/exp/abs 等
// - 角度制 / 弧度制切换、2nd 第二功能切换
// - 实时预览结果，回车 / = 求值，支持物理键盘
// - 打开 / 关闭由 ModalCore 统一挂载
// - 度数模式下识别特殊角：tan(90°)=未定义、sin(180°)=0、cos(90°)=0 等
// ============================================================

window.App = window.App || {};

(function () {
    'use strict';

    const toRad   = deg => (deg ? Math.PI / 180 : 1);
    const fromRad = deg => (deg ? 180 / Math.PI : 1);

    // 判断度数是否（在极小容差内）是 angle 的整数倍
    const isMultipleOf = (deg, angle) => {
        const r = ((deg % angle) + angle) % angle;
        return r < 1e-9 || Math.abs(r - angle) < 1e-9;
    };

    const FUNCTIONS = {
        sin: (x, d) => {
            if (d && isMultipleOf(x, 180)) return 0;
            return Math.sin(x * toRad(d));
        },
        cos: (x, d) => {
            if (d && isMultipleOf(x - 90, 180)) return 0;
            return Math.cos(x * toRad(d));
        },
        tan: (x, d) => {
            if (d && isMultipleOf(x - 90, 180)) return NaN;   // 90° + k·180° 无定义
            if (d && isMultipleOf(x, 180))       return 0;    // 0° + k·180° = 0
            return Math.tan(x * toRad(d));
        },
        asin: (x, d) => Math.asin(x) * fromRad(d),
        acos: (x, d) => Math.acos(x) * fromRad(d),
        atan: (x, d) => Math.atan(x) * fromRad(d),
        sinh: x => Math.sinh(x),
        cosh: x => Math.cosh(x),
        tanh: x => Math.tanh(x),
        ln:   x => Math.log(x),
        log:  x => Math.log10(x),
        lg:   x => Math.log10(x),
        sqrt: x => Math.sqrt(x),
        cbrt: x => Math.cbrt(x),
        abs:  x => Math.abs(x),
        exp:  x => Math.exp(x)
    };

    function factorial(n) {
        if (!Number.isFinite(n)) return NaN;
        if (n < 0 || !Number.isInteger(n)) return NaN;
        if (n > 170) return Infinity;
        let r = 1;
        for (let k = 2; k <= n; k++) r *= k;
        return r;
    }

    window.App.Calculator = {
        state: {
            expr: '',
            result: null,
            justEvaluated: false,
            angleMode: 'deg',
            second: false
        },

        // ==================== 初始化 ====================
        init() {
            this.bindPad();
            this.bindKeyboard();
            this.syncAngleKey();
            this.updateDisplay();

            // 打开时再刷新一次显示（首次打开也要正确渲染）
            // 打开/关闭动作本身由 ModalCore 负责
            document.getElementById('calculatorButton')?.addEventListener('click', () => {
                window.setTimeout(() => this.updateDisplay(), 0);
            });
        },

        bindPad() {
            const pad = document.getElementById('calcPad');
            if (!pad) return;

            pad.addEventListener('click', e => {
                const btn = e.target.closest('.calc-key');
                if (!btn) return;
                this.handleKey(btn);
            });
        },

        handleKey(btn) {
            const action = btn.dataset.action;

            if (action === 'clear')     return this.clear();
            if (action === 'backspace') return this.backspace();
            if (action === 'equals')    return this.equals();
            if (action === 'second')    return this.toggleSecond();
            if (action === 'angle')     return this.toggleAngle();

            const insert = (this.state.second && btn.dataset.insert2)
                ? btn.dataset.insert2
                : btn.dataset.insert;

            if (insert !== undefined) this.insert(insert);
        },

        // ==================== 输入 ====================
        insert(text) {
            const s = this.state;

            if (s.justEvaluated) {
                s.justEvaluated = false;
                // 只有运算符 / 后缀才接在结果后面继续算
                const continues = /^[+\-−×÷^%!]/.test(text);
                if (!continues) s.expr = '';
            }

            s.expr += text;
            this.updateDisplay();
        },

        backspace() {
            const s = this.state;

            if (s.justEvaluated) {
                s.justEvaluated = false;
                s.expr = '';
                this.updateDisplay();
                return;
            }

            if (!s.expr) return;

            // 函数名 + "(" 整块删除，体验更好
            const m = /(?:asin|acos|atan|sqrt|cbrt|sin|cos|tan|log|ln|exp|abs)\($/.exec(s.expr);
            s.expr = m
                ? s.expr.slice(0, -m[0].length)
                : s.expr.slice(0, -1);

            this.updateDisplay();
        },

        clear() {
            const s = this.state;
            s.expr = '';
            s.result = null;
            s.justEvaluated = false;
            this.updateDisplay();
        },

        // ==================== 求值 ====================
        equals() {
            const s = this.state;
            const expr = s.expr.trim();

            if (!expr || s.justEvaluated) return;

            let value;
            try {
                value = this.evaluate(expr);
            } catch (err) {
                this.flashError();
                return;
            }

            // 数学上"无定义"（如 tan 90°、√-1、ln 负数、0/0…）
            if (Number.isNaN(value)) {
                const el = document.getElementById('calcExpression');
                if (el) el.textContent = '未定义';
                s.expr = '';
                s.result = null;
                s.justEvaluated = true;
                this.updateDisplay();
                return;
            }

            // 溢出：如 1/0、e^1000
            if (!Number.isFinite(value)) {
                this.flashError();
                return;
            }

            s.result = value;
            s.expr = this.formatNumber(value);
            s.justEvaluated = true;
            this.updateDisplay();
        },

        // ==================== 解析器 ====================
        normalize(str) {
            let s = String(str)
                .replace(/\s+/g, '')
                .replace(/×/g, '*')
                .replace(/÷/g, '/')
                .replace(/[−–—]/g, '-')
                .replace(/％/g, '%');

            // 自动补全缺失的右括号
            let depth = 0;
            for (const ch of s) {
                if (ch === '(') depth++;
                else if (ch === ')') depth = Math.max(0, depth - 1);
            }
            if (depth > 0) s += ')'.repeat(depth);

            return s;
        },

        evaluate(raw) {
            const s = this.normalize(raw);
            if (!s) throw new Error('空表达式');

            const deg = this.state.angleMode === 'deg';
            let pos = 0;

            const skip = () => { while (pos < s.length && s[pos] === ' ') pos++; };
            const fail = msg => { throw new Error(msg); };

            function parseExpression() {
                let v = parseTerm();
                for (;;) {
                    skip();
                    const c = s[pos];
                    if (c === '+') { pos++; v += parseTerm(); }
                    else if (c === '-') { pos++; v -= parseTerm(); }
                    else break;
                }
                return v;
            }

            function parseTerm() {
                let v = parseUnary();
                for (;;) {
                    skip();
                    const c = s[pos];
                    if (c === '*') { pos++; v *= parseUnary(); }
                    else if (c === '/') { pos++; v /= parseUnary(); }
                    // 隐式乘法：2π、3(4+5)、2sin(30)…
                    else if (c && /[0-9.a-zA-Z(π√∛]/.test(c)) { v *= parseUnary(); }
                    else break;
                }
                return v;
            }

            function parseUnary() {
                skip();
                const c = s[pos];
                if (c === '-') { pos++; return -parseUnary(); }
                if (c === '+') { pos++; return parseUnary(); }
                if (c === '√') { pos++; return Math.sqrt(parseUnary()); }
                if (c === '∛') { pos++; return Math.cbrt(parseUnary()); }
                return parsePower();
            }

            function parsePower() {
                const base = parsePostfix();
                skip();
                if (s[pos] === '^') {
                    pos++;
                    return Math.pow(base, parseUnary());   // 右结合
                }
                return base;
            }

            function parsePostfix() {
                let v = parsePrimary();
                for (;;) {
                    skip();
                    const c = s[pos];
                    if (c === '!') { pos++; v = factorial(v); }
                    else if (c === '%') { pos++; v = v / 100; }
                    else break;
                }
                return v;
            }

            function parsePrimary() {
                skip();
                if (pos >= s.length) fail('表达式不完整');

                const c = s[pos];

                if (c === '(') {
                    pos++;
                    const v = parseExpression();
                    skip();
                    if (s[pos] !== ')') fail('括号不匹配');
                    pos++;
                    return v;
                }

                if (c === 'π') { pos++; return Math.PI; }

                const numMatch = /^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/.exec(s.slice(pos));
                if (numMatch) {
                    pos += numMatch[0].length;
                    return parseFloat(numMatch[0]);
                }

                const idMatch = /^[a-zA-Z]+/.exec(s.slice(pos));
                if (idMatch) {
                    const name = idMatch[0].toLowerCase();
                    pos += idMatch[0].length;

                    if (name === 'pi') return Math.PI;
                    if (name === 'e')  return Math.E;

                    const fn = FUNCTIONS[name];
                    if (!fn) fail('未知函数：' + idMatch[0]);

                    skip();
                    let arg;
                    if (s[pos] === '(') {
                        pos++;
                        arg = parseExpression();
                        skip();
                        if (s[pos] !== ')') fail('括号不匹配');
                        pos++;
                    } else {
                        arg = parseUnary();
                    }
                    return fn(arg, deg);
                }

                fail('无法识别：' + c);
            }

            const value = parseExpression();
            skip();
            if (pos < s.length) fail('表达式不完整');

            return value;
        },

        // ==================== 数字格式化 ====================
        formatNumber(value) {
            if (!Number.isFinite(value)) {
                if (Number.isNaN(value)) return '未定义';
                return value > 0 ? '∞' : '-∞';
            }

            if (value === 0) return '0';

            const abs = Math.abs(value);

            if (abs >= 1e13 || abs < 1e-9) {
                return value.toExponential(8)
                    .replace(/\.?0+e/, 'e')
                    .replace('e+', 'e');
            }

            // 抹掉 0.1 + 0.2 这类浮点误差
            return String(parseFloat(value.toPrecision(12)));
        },

        // ==================== 显示 ====================
        updateDisplay() {
            const exprEl = document.getElementById('calcExpression');
            const previewEl = document.getElementById('calcPreview');
            if (!exprEl) return;

            const expr = this.state.expr;

            exprEl.textContent = expr || '0';
            exprEl.classList.toggle('calc-small', expr.length > 18 && expr.length <= 30);
            exprEl.classList.toggle('calc-tiny', expr.length > 30);

            if (previewEl) {
                let text = '';
                if (expr && !this.state.justEvaluated) {
                    try {
                        const v = this.evaluate(expr);
                        if (Number.isNaN(v)) {
                            text = '未定义';
                        } else if (Number.isFinite(v)) {
                            const formatted = this.formatNumber(v);
                            if (formatted !== expr) text = '= ' + formatted;
                        }
                    } catch (e) {
                        text = '';
                    }
                }
                previewEl.textContent = text;
            }

            requestAnimationFrame(() => {
                exprEl.scrollLeft = exprEl.scrollWidth;
            });
        },

        flashError() {
            const el = document.getElementById('calcExpression');
            if (!el) return;

            el.classList.remove('calc-shake');
            void el.offsetWidth;
            el.classList.add('calc-shake');

            window.setTimeout(() => el.classList.remove('calc-shake'), 400);
        },

        // ==================== 功能键 ====================
        toggleSecond() {
            this.state.second = !this.state.second;
            const on = this.state.second;

            document.getElementById('calcSecondKey')?.classList.toggle('active', on);

            document.querySelectorAll('#calcPad [data-label2]').forEach(btn => {
                if (!btn.dataset.label1) btn.dataset.label1 = btn.textContent;
                btn.textContent = on ? btn.dataset.label2 : btn.dataset.label1;
            });
        },

        toggleAngle() {
            this.state.angleMode = this.state.angleMode === 'deg' ? 'rad' : 'deg';
            this.syncAngleKey();
            this.updateDisplay();
        },

        syncAngleKey() {
            const key = document.getElementById('calcAngleKey');
            if (key) key.textContent = this.state.angleMode === 'deg' ? 'DEG' : 'RAD';
        },

        // ==================== 物理键盘 ====================
        bindKeyboard() {
            document.addEventListener('keydown', e => {
                const modal = document.getElementById('calculatorModal');
                if (!modal || !modal.classList.contains('active')) return;

                const tag = document.activeElement?.tagName;
                if (tag === 'INPUT' || tag === 'TEXTAREA') return;

                const k = e.key;
                let handled = true;

                if (/^[0-9]$/.test(k))            this.insert(k);
                else if (k === '.')               this.insert('.');
                else if (k === '+')               this.insert('+');
                else if (k === '-')               this.insert('−');
                else if (k === '*')               this.insert('×');
                else if (k === '/')               this.insert('÷');
                else if (k === '(' || k === ')')  this.insert(k);
                else if (k === '^')               this.insert('^');
                else if (k === '%')               this.insert('%');
                else if (k === '!')               this.insert('!');
                else if (k === 'Enter' || k === '=') this.equals();
                else if (k === 'Backspace')       this.backspace();
                else if (k === 'Escape')          this.clear();
                else if (k === 'Delete')          this.clear();
                else handled = false;

                if (handled) e.preventDefault();
            });
        }
    };
})();