// ============================================================
// js/features/plaza_crypto.js
// 广场的密码学工具：密码派生、防偷窥校验、AES-256-GCM 加解密
//
// 方案：
//   salt      = 32 字节密码学随机数（每人独立）
//   iters     = 200,000（PBKDF2-SHA256，走 WebCrypto 原生实现）
//   dk        = PBKDF2(password, salt, iters) 输出 64 字节，切成两半
//   aesKey    = dk[0..31]    → AES-256-GCM 密钥，只留在内存，从不落盘
//   verifyKey = dk[32..63]   → base64 后落盘，仅用于验证密码
//
// 密钥分离的意义：文件里泄露的只是「能不能验证一次猜测」，
// 拿不到 AES 密钥本身，也杜绝了「存下来的值被当成密钥用」的隐患。
//
// 注意：这是「防偷看」，不是「防破解」。
// 整体强度由密码熵决定——纯数字 6 位只有约 20 bit，一台游戏显卡
// 几十秒就能穷举完；10 位以上才谈得上门槛。详见设计稿 §3.3。
// ============================================================

window.App = window.App || {};

(function () {
    'use strict';

    var App = window.App;

    var DEFAULT_ITERS = 200000;
    var SALT_BYTES = 32;
    var IV_BYTES = 12;
    var KEY_BYTES = 32;
    var DK_BYTES = 64;

    // 浏览器的密码学能力。file:// 和 https:// 都算安全上下文，
    // Chrome 37 起就有 crypto.subtle，缺失时上层会关掉「隐藏生日」。
    var subtle = (window.crypto && window.crypto.subtle) || null;

    // ---------- base64 与字节数组互转 ----------

    function bytesToBase64(bytes) {
        var s = '';
        for (var i = 0; i < bytes.length; i++) {
            s += String.fromCharCode(bytes[i]);
        }
        return btoa(s);
    }

    function base64ToBytes(b64) {
        var s = atob(b64);
        var out = new Uint8Array(s.length);
        for (var i = 0; i < s.length; i++) {
            out[i] = s.charCodeAt(i);
        }
        return out;
    }

    function bytesEqual(a, b) {
        if (a.length !== b.length) return false;
        var diff = 0;
        for (var i = 0; i < a.length; i++) {
            diff |= a[i] ^ b[i];
        }
        return diff === 0;
    }

    App.PlazaCrypto = {
        DEFAULT_ITERS: DEFAULT_ITERS,

        isAvailable() {
            return !!subtle;
        },

        randomBytes(n) {
            var buf = new Uint8Array(n);
            window.crypto.getRandomValues(buf);
            return buf;
        },

        randomBase64(n) {
            return bytesToBase64(this.randomBytes(n));
        },

        bytesToBase64: bytesToBase64,
        base64ToBytes: base64ToBytes,

        // ------------------------------------------------------
        // 派生：密码 + 盐 → 64 字节，前 32 字节当 AES 密钥
        // ------------------------------------------------------
        async _deriveRaw(password, saltBase64, iters) {
            var enc = new TextEncoder();
            var baseKey = await subtle.importKey(
                'raw',
                enc.encode(password),
                'PBKDF2',
                false,
                ['deriveBits']
            );

            var bits = await subtle.deriveBits(
                {
                    name: 'PBKDF2',
                    salt: base64ToBytes(saltBase64),
                    iterations: iters,
                    hash: 'SHA-256'
                },
                baseKey,
                DK_BYTES * 8
            );

            return new Uint8Array(bits);
        },

        async _importAesKey(rawBytes) {
            return subtle.importKey(
                'raw',
                rawBytes,
                { name: 'AES-GCM' },
                false,
                ['encrypt', 'decrypt']
            );
        },

        // 把一段 base64 的原始密钥（数据密钥 DEK）导入成可用的 AES 密钥
        async importAesKey(base64) {
            if (!subtle) return null;

            try {
                return await this._importAesKey(base64ToBytes(base64));
            } catch (e) {
                return null;
            }
        },

        // 生成一把全新的数据密钥（base64）
        newDataKey() {
            return this.randomBase64(KEY_BYTES);
        },

        // ------------------------------------------------------
        // 新建一份凭据（首次设密码 / 改密码时用）
        // 返回的对象里 aesKey 是 CryptoKey，绝不能写进 JSON
        // ------------------------------------------------------
        async createCredential(password, iters) {
            if (!subtle) throw new Error('当前浏览器不支持加密功能');

            var pwd = String(password == null ? '' : password).trim();
            var salt = this.randomBase64(SALT_BYTES);
            var rounds = Number(iters) || this.DEFAULT_ITERS;
            var dk = await this._deriveRaw(pwd, salt, rounds);

            return {
                pwdSalt: salt,
                pwdIters: rounds,
                verifyKey: bytesToBase64(dk.subarray(KEY_BYTES, DK_BYTES)),
                pwdLen: pwd.length,
                aesKey: await this._importAesKey(dk.slice(0, KEY_BYTES))
            };
        },

        // ------------------------------------------------------
        // 防偷窥校验：只要输入里含有正确密码就通过
        //
        // 知道密码长度后，一个 20 字的输入只需试 13 个窗口左右，
        // 而不是 17 个长度 × 20 个窗口。这是把登录压在 1 秒内的关键。
        //
        // 命中时连明文密码一起返回——「隐藏生日」的 AES 密钥就是从它
        // 派生的，校验和派生密钥是同一个动作。
        // ------------------------------------------------------
        async verifyInput(input, rec) {
            if (!subtle || !rec || !rec.pwdSalt || !rec.verifyKey) return null;

            var text = String(input == null ? '' : input).trim();
            var len = Number(rec.pwdLen) || 0;
            if (!text || len < 1 || text.length < len) return null;

            var iters = Number(rec.pwdIters) || this.DEFAULT_ITERS;
            var target = base64ToBytes(rec.verifyKey);

            for (var i = 0; i + len <= text.length; i++) {
                var window = text.substr(i, len);
                var dk;

                try {
                    dk = await this._deriveRaw(window, rec.pwdSalt, iters);
                } catch (e) {
                    return null;
                }

                if (bytesEqual(dk.subarray(KEY_BYTES, DK_BYTES), target)) {
                    return {
                        password: window,
                        aesKey: await this._importAesKey(dk.slice(0, KEY_BYTES))
                    };
                }
            }

            return null;
        },

        // ------------------------------------------------------
        // 管理员公钥：把 DEK 包给管理员，不需要管理员此刻在场
        //
        //   pub  = RSA-OAEP 公钥（SPKI，明文存盘，谁都能用来加密）
        //   priv = AES-GCM(PKCS8 私钥, 管理员密码派生的 aesKey)
        //
        // 这样同学隐藏生日时只要管理员密码「设过」就够了：
        // 用公钥包一份 adm，管理员以后解锁时再用私钥解开。
        // ------------------------------------------------------
        async createAdminKeyPair() {
            if (!subtle) throw new Error('当前浏览器不支持加密功能');

            var pair = await subtle.generateKey(
                {
                    name: 'RSA-OAEP',
                    modulusLength: 2048,
                    publicExponent: new Uint8Array([1, 0, 1]),
                    hash: 'SHA-256'
                },
                true,
                ['encrypt', 'decrypt']
            );

            var pub = await subtle.exportKey('spki', pair.publicKey);
            var priv = await subtle.exportKey('pkcs8', pair.privateKey);

            return {
                publicKey: pair.publicKey,
                privateKey: pair.privateKey,
                pubB64: bytesToBase64(new Uint8Array(pub)),
                privB64: bytesToBase64(new Uint8Array(priv))
            };
        },

        async importAdminPublicKey(base64) {
            if (!subtle || !base64) return null;

            try {
                return await subtle.importKey(
                    'spki',
                    base64ToBytes(base64),
                    { name: 'RSA-OAEP', hash: 'SHA-256' },
                    false,
                    ['encrypt']
                );
            } catch (e) {
                return null;
            }
        },

        async importAdminPrivateKey(base64) {
            if (!subtle || !base64) return null;

            try {
                return await subtle.importKey(
                    'pkcs8',
                    base64ToBytes(base64),
                    { name: 'RSA-OAEP', hash: 'SHA-256' },
                    false,
                    ['decrypt']
                );
            } catch (e) {
                return null;
            }
        },

        // 用管理员公钥加密一个小对象（DEK），返回 base64
        async encryptToAdmin(value, publicKey) {
            if (!subtle || !publicKey) return '';

            try {
                var data = new TextEncoder().encode(JSON.stringify(value));
                var cipher = await subtle.encrypt({ name: 'RSA-OAEP' }, publicKey, data);
                return bytesToBase64(new Uint8Array(cipher));
            } catch (e) {
                return '';
            }
        },

        async decryptAsAdmin(payload, privateKey) {
            if (!subtle || !privateKey || !payload) return null;

            try {
                var plain = await subtle.decrypt(
                    { name: 'RSA-OAEP' },
                    privateKey,
                    base64ToBytes(payload)
                );

                return JSON.parse(new TextDecoder().decode(plain));
            } catch (e) {
                return null;
            }
        },

        // ------------------------------------------------------
        // AES-256-GCM：密文格式 = iv(12字节) || 认证密文，整体 base64
        // ------------------------------------------------------
        async encrypt(value, aesKey) {
            if (!subtle || !aesKey) return '';

            var iv = this.randomBytes(IV_BYTES);
            var data = new TextEncoder().encode(JSON.stringify(value));
            var cipher = await subtle.encrypt({ name: 'AES-GCM', iv: iv }, aesKey, data);

            var out = new Uint8Array(iv.length + cipher.byteLength);
            out.set(iv, 0);
            out.set(new Uint8Array(cipher), iv.length);

            return bytesToBase64(out);
        },

        async decrypt(payload, aesKey) {
            if (!subtle || !aesKey || !payload) return null;

            try {
                var bytes = base64ToBytes(payload);
                if (bytes.length <= IV_BYTES) return null;

                var plain = await subtle.decrypt(
                    { name: 'AES-GCM', iv: bytes.subarray(0, IV_BYTES) },
                    aesKey,
                    bytes.subarray(IV_BYTES)
                );

                return JSON.parse(new TextDecoder().decode(plain));
            } catch (e) {
                // 密码被重置、密文被篡改、密钥不对，都走到这里
                return null;
            }
        }
    };
})();
