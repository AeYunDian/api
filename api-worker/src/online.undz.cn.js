// ============================================================
// 统一身份认证中心 (online.undz.cn)
// 功能：注册、登录、登出、验证、刷新令牌
// 技术栈：Cloudflare Workers + D1 + KV + JWT (jose) + cookie
// ============================================================

import { SignJWT, jwtVerify } from 'jose';
import { serialize, parse } from 'cookie';
import { base64ToUtf8 } from './utils.js'

// ---------- 常量与配置 ----------
const JWT_ALG = 'HS256';
const ACCESS_TOKEN_EXPIRES_IN = '15m';          // 访问令牌有效期
const REFRESH_TOKEN_TTL = 60 * 60 * 24 * 30;    // 刷新令牌有效期（秒），30天
const PBKDF2_ITERATIONS = 100000;
const PBKDF2_HASH = 'SHA-256';
const SALT_LENGTH = 16;                        // 字节
const MIN_PASSWORD_LENGTH = 6;

// 允许跨域的子服务域名（白名单）
const ALLOWED_ORIGINS = [
    'https://api.undz.cn',
    'https://chat.undz.cn',
    'https://online.undz.cn',
    'https://c.undz.cn',
    'https://i0.undz.cn',
    'https://dev.undz.cn',
    'https://undz.cn',
    'https://io.hb.cn',
    'https://www.undz.cn',
    'https://ayd2.eu.cc',
    'https://main.net2.eu.cc',
    'https://www.io.hb.cn',
    'https://main.net3.eu.cc',
    'https://main.exm2.eu.cc',
    'https://main.zyy2.eu.cc',
    'https://test.undz.cn',
    'https://zyy.undz.cn',
    'https://zyy.io.hb.cn',
    'https://zyyos.io.hb.cn',
    'https://z.net2.eu.cc',
    'https://zyyos.undz.cn',
    'https://z.ayd2.eu.cc',
    'https://z.net3.eu.cc',
    'https://zyy2.eu.cc',
    'https://zyy.exm2.eu.cc',
    'https://zyyos.exm2.eu.cc',

];

// ---------- 工具函数 ----------
function generateRandomBytes(length) {
    const buffer = new Uint8Array(length);
    crypto.getRandomValues(buffer);
    return buffer;
}
async function hmacSha256(key, message) {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(key);
    const messageData = encoder.encode(message);
    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    return Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}
function toBase64(buffer) {
    return btoa(String.fromCharCode(...buffer));
}

function fromBase64(str) {
    const bin = atob(str);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) {
        bytes[i] = bin.charCodeAt(i);
    }
    return bytes;
}

async function hashPassword(password, salt) {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveBits']
    );
    const derived = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: PBKDF2_ITERATIONS,
            hash: PBKDF2_HASH,
        },
        keyMaterial,
        256
    );
    return new Uint8Array(derived);
}

function generateRefreshToken() {
    const bytes = generateRandomBytes(32);
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}
// ---------- 输入校验函数 ----------
function validateEmail(email) {
    const re = /^[A-Za-z0-9\u4e00-\u9fa5]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/;
    return re.test(email);
}

function validatePassword(password) {
    const allowed = /^[a-zA-Z0-9\-_=+@#$%]+$/;
    if (!allowed.test(password)) return false;
    if (password.length < MIN_PASSWORD_LENGTH) return false;
    return true;
}
function jsonResponse(data, status = 200, extraHeaders = {}) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            ...extraHeaders,
        },
    });
}

function corsHeaders(request) {
    const origin = request.headers.get('Origin');
    const headers = {
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
    };
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
        headers['Access-Control-Allow-Origin'] = origin;
    } else {
        headers['Access-Control-Allow-Origin'] = 'null';
    }
    return headers;
}

function handleOptions(request) {
    return new Response(null, {
        status: 204,
        headers: corsHeaders(request),
    });
}

// ---------- JWT 操作 ----------
async function signAccessToken(payload, secret) {
    const encoder = new TextEncoder();
    const key = encoder.encode(secret);
    const jwt = await new SignJWT(payload)
        .setProtectedHeader({ alg: JWT_ALG })
        .setIssuedAt()
        .setExpirationTime(ACCESS_TOKEN_EXPIRES_IN)
        .sign(key);
    return jwt;
}

async function verifyAccessToken(token, secret) {
    try {
        const encoder = new TextEncoder();
        const key = encoder.encode(secret);
        const { payload } = await jwtVerify(token, key);
        return payload;
    } catch {
        return null;
    }
}

// ---------- 数据库操作 ----------
async function initDatabase(db) {
    // 分别执行每条 DDL
    await db.prepare(`
        CREATE TABLE IF NOT EXISTS online_users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_salt TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            banned INTEGER DEFAULT 0,
            ban_reason TEXT DEFAULT ''
        )
    `).run();

    await db.prepare(
        `CREATE INDEX IF NOT EXISTS idx_username ON online_users(username)`
    ).run();

    await db.prepare(
        `CREATE INDEX IF NOT EXISTS idx_email ON online_users(email)`
    ).run();
}
async function registerUser(db, username, email, password) {
    if (!validateEmail(email)) {
        return { success: false, code: 400, error_code: 1000, message: 'Invalid email format' };
    }
    if (!validatePassword(password)) {
        return { success: false, code: 400, error_code: 1001, message: 'Password must be at least 8 characters and contain only a-z A-Z 0-9 -_=+@#$%' };
    }
    const existing = await db.prepare(
        'SELECT id FROM online_users WHERE username = ? OR email = ?'
    ).bind(username, email).first();
    if (existing) {
        return { success: false, code: 409, error_code: 1002, message: 'Username or email already exists' };
    }

    const salt = generateRandomBytes(SALT_LENGTH);
    const hashBytes = await hashPassword(password, salt);
    const saltBase64 = toBase64(salt);
    const hashBase64 = toBase64(hashBytes);

    const now = Date.now();
    await db.prepare(`
    INSERT INTO online_users (username, email, password_salt, password_hash, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(username, email, saltBase64, hashBase64, now, now).run();

    return { success: true, code: 200, message: 'User registered successfully' };
}

async function authenticateUser(db, usernameOrEmail, password) {
    const user = await db.prepare(
        'SELECT id, username, email, password_salt, password_hash FROM online_users WHERE username = ? OR email = ?'
    ).bind(usernameOrEmail, usernameOrEmail).first();

    if (!user) {
        return { success: false, code: 401, error_code: 1003, message: 'Invalid credentials' };
    }

    const salt = fromBase64(user.password_salt);
    const hashBytes = await hashPassword(password, salt);
    const hashBase64 = toBase64(hashBytes);

    if (hashBase64 !== user.password_hash) {
        return { success: false, code: 401, error_code: 1003, message: 'Invalid credentials' };
    }

    return {
        success: true,
        code: 200,
        user: {
            id: user.id,
            username: user.username,
            email: user.email,
        },
    };
}

// ---------- 刷新令牌 KV 操作 ----------
async function storeRefreshToken(kv, token, userId, ttlSeconds) {
    await kv.put(`refresh:${token}`, String(userId), { expirationTtl: ttlSeconds });
    await addRefreshTokenForUser(kv, userId, token);
}

async function getUserIdFromRefreshToken(kv, token) {
    const userId = await kv.get(`refresh:${token}`);
    if (!userId) return null;
    return parseInt(userId, 10);
}

async function deleteRefreshToken(kv, token) {
    // 先获取 userId
    const userId = await getUserIdFromRefreshToken(kv, token);
    await kv.delete(`refresh:${token}`);
    if (userId) {
        await removeRefreshTokenFromUserList(kv, userId, token);
    }
}
// ---------- 用户 Refresh Token 列表管理（用于批量撤销） ----------
async function addRefreshTokenForUser(kv, userId, token) {
    const key = `user_refresh_tokens:${userId}`;
    const existing = await kv.get(key);
    let list = existing ? JSON.parse(existing) : [];
    if (!list.includes(token)) {
        list.push(token);
        await kv.put(key, JSON.stringify(list), { expirationTtl: REFRESH_TOKEN_TTL });
    }
}

async function getRefreshTokensForUser(kv, userId) {
    const key = `user_refresh_tokens:${userId}`;
    const data = await kv.get(key);
    return data ? JSON.parse(data) : [];
}

async function revokeAllUserRefreshTokens(kv, userId) {
    const key = `user_refresh_tokens:${userId}`;
    const tokens = await getRefreshTokensForUser(kv, userId);
    for (const token of tokens) {
        await kv.delete(`refresh:${token}`);
    }
    await kv.delete(key);
}

// 登出时单独移除某个 token（可选，用于保持列表同步）
async function removeRefreshTokenFromUserList(kv, userId, token) {
    const key = `user_refresh_tokens:${userId}`;
    const existing = await kv.get(key);
    if (!existing) return;
    let list = JSON.parse(existing);
    list = list.filter(t => t !== token);
    if (list.length > 0) {
        await kv.put(key, JSON.stringify(list), { expirationTtl: REFRESH_TOKEN_TTL });
    } else {
        await kv.delete(key);
    }
}
// ---------- 改密码 ----------
async function changePassword(db, kv, userId, oldPassword, newPassword) {
    if (!validatePassword(newPassword)) {
        return { success: false, code: 400, error_code: 1005, message: 'New password must be at least 8 characters and contain only a-z A-Z 0-9 -_=+@#$%' };
    }

    const user = await db.prepare('SELECT password_salt, password_hash FROM online_users WHERE id = ?').bind(userId).first();
    if (!user) return { success: false, code: 404, message: 'User not found' };

    const salt = fromBase64(user.password_salt);
    const oldHashBytes = await hashPassword(oldPassword, salt);
    const oldHashBase64 = toBase64(oldHashBytes);

    if (oldHashBase64 !== user.password_hash) {
        return { success: false, code: 401, error_code: 1006, message: 'Old password incorrect' };
    }

    const newSalt = generateRandomBytes(SALT_LENGTH);
    const newHashBytes = await hashPassword(newPassword, newSalt);
    const newSaltBase64 = toBase64(newSalt);
    const newHashBase64 = toBase64(newHashBytes);

    const now = Date.now();
    await db.prepare('UPDATE online_users SET password_salt = ?, password_hash = ?, updated_at = ? WHERE id = ?')
        .bind(newSaltBase64, newHashBase64, now, userId).run();

    await revokeAllUserRefreshTokens(kv, userId);

    return { success: true, code: 200, message: 'Password updated. Please log in again.' };
}
// ---------- 请求处理 ----------
export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const path = url.pathname;
        const method = request.method;

        if (method === 'OPTIONS') {
            return handleOptions(request);
        }

        const cors = corsHeaders(request);

        try {
            // ---------- 初始化数据库（需 Admin Key） ----------
            if (path === '/api/ayonline/init' && method === 'POST') {
                const authKey = request.headers.get('X-Admin-Key');
                if (authKey !== env.KEY) {
                    return jsonResponse({ error: 'Unauthorized' }, 401, cors);
                }
                await initDatabase(env.db);
                return jsonResponse({ success: true, message: 'Database initialized' }, 200, cors);
            }


            if (path.startsWith('/api/')) {
                const appId = request.headers.get('X-App-Id') || '';
                if (!env.ALLOWED_APP_IDS.includes(appId)) {
                    return jsonResponse({ success: false, code: 403, error_code: 1019, message: 'appId is invalid' }, 403, cors);
                }
                if (path === '/api/ayonline/test') {
                    return jsonResponse({ success: true, message: 'Server is ready', code: 200 }, 200, cors);
                }
                // ---------- 用户注册 ----------
                if (path === '/api/ayonline/register' && method === 'POST') {

                    const body = await request.json().catch(() => null);
                    if (!body || !body.username || !body.password || !body.email) {
                        return jsonResponse({ error: 'Missing required fields', error_code: 1007 }, 400, cors);
                    }
                    if (body.gt) {
                        let gt;
                        try {
                            const jsonStr = base64ToUtf8(body.gt);
                            gt = JSON.parse(jsonStr);
                        } catch {
                            gt = null;
                        }//客户传来的是base64编码的json文本
                        if (gt === null) { return jsonResponse({ error: 'Missing required fields', error_code: 1007 }, 400, cors); }
                        const prikey = JSON.parse(env.GTCODEMAP)[gt.captcha_id];

                        if (!prikey) {
                            return jsonResponse({ code: 400, 'message': 'id is not in id pools ', error_code: 1021 }, 400, cors);
                        }
                        const sign_token = await hmacSha256(prikey, gt.lot_number);
                        const query = Object.assign(gt, { sign_token });
                        console.debug(gt)
                        const validateUrl = new URL('https://gcaptcha4.geetest.com/validate');
                        validateUrl.search = new URLSearchParams(query).toString();
                        try {
                            const geetestRes = await fetch(validateUrl);
                            const geetestData = await geetestRes.json();
                            if (geetestData.result === 'success') {
                                const result = await registerUser(env.db, body.username, body.email, body.password);
                                if (!result.success) {
                                    return jsonResponse({ error: result.message, error_code: result.error_code }, result.code, cors);
                                }
                                return jsonResponse({ success: true, message: result.message, code: 200 }, 201, cors);
                            } else {
                                return jsonResponse({ error_code: 1022, message: 'Verification failed' }, 400, cors);
                            }
                        } catch {
                            return jsonResponse({ error_code: 1020, message: 'GeeTest Server Error' }, 500, cors);
                        }
                        // await fetch(url).then(async (res) => {
                        //     if (res.result === 'success') {
                        //         const result = await registerUser(env.db, body.username, body.email, body.password);
                        //         if (!result.success) {
                        //             return jsonResponse({ error: result.message, error_code: result.error_code }, result.code, cors);
                        //         }
                        //         return jsonResponse({ success: true, message: result.message, code: 200 }, 201, cors);
                        //     } else {
                        //         return jsonResponse({ error_code: 1022, message: 'Verification code check failed again' }, 500, cors);
                        //     }
                        // }).catch(() => {
                        //     return jsonResponse({ error_code: 1020, message: 'GeeTest Server Error' }, 500, cors);
                        // })

                    } else {
                        return jsonResponse({ success: true, gt_code: JSON.parse(env.GTCODE)[0], message: '请求频繁，请稍后再试', error_code: 1023 }, 429, cors);
                    }

                }

                // ---------- 用户登录 ----------
                if (path === '/api/ayonline/login' && method === 'POST') {
                    const body = await request.json().catch(() => null);
                    if (!body || (!body.username && !body.email) || !body.password) {
                        return jsonResponse({ error_code: 1009, error: 'Username/email and password required' }, 400, cors);
                    }
                    if (body.gt) {
                        let gt;
                        try {
                            const jsonStr = base64ToUtf8(body.gt);
                            gt = JSON.parse(jsonStr);
                        } catch {
                            gt = null;
                        }//客户传来的是base64编码的json文本
                        if (gt === null) { return jsonResponse({ error: 'Missing required fields', error_code: 1007 }, 400, cors); }
                        const prikey = JSON.parse(env.GTCODEMAP)[gt.captcha_id];

                        if (!prikey) {
                            return jsonResponse({ code: 400, 'message': 'id is not in id pools ', error_code: 1021 }, 400, cors);
                        }
                        const sign_token = await hmacSha256(prikey, gt.lot_number);
                        const query = Object.assign(gt, { sign_token });
                        console.debug(gt)
                        const validateUrl = new URL('https://gcaptcha4.geetest.com/validate');
                        validateUrl.search = new URLSearchParams(query).toString();
                        try {
                            const geetestRes = await fetch(validateUrl);
                            const geetestData = await geetestRes.json();
                            if (geetestData.result === 'success') {
                                const login = body.username || body.email;
                                const authResult = await authenticateUser(env.db, login, body.password);
                                if (!authResult.success) {
                                    return jsonResponse({ error: authResult.message, error_code: authResult.error_code }, authResult.code, cors);
                                }

                                const user = authResult.user;

                                // 生成访问令牌
                                const accessToken = await signAccessToken(
                                    { sub: user.id, username: user.username, email: user.email },
                                    env.JWT_KEY
                                );
                                // 生成刷新令牌
                                const refreshToken = generateRefreshToken();
                                await storeRefreshToken(env.kv, refreshToken, user.id, REFRESH_TOKEN_TTL);

                                // 使用 cookie 库的 serialize 设置两个 Cookie
                                const cookieOptions = {
                                    domain: '.undz.cn',
                                    path: '/',
                                    httpOnly: true,
                                    secure: true,
                                    sameSite: 'Lax',
                                    maxAge: REFRESH_TOKEN_TTL,
                                };
                                const responseBody = {
                                    success: true,
                                    code: 200,
                                    user: { id: user.id, username: user.username, email: user.email },
                                };

                                const headers = new Headers(corsHeaders(request));
                                headers.set('Content-Type', 'application/json');
                                headers.append('Set-Cookie', serialize('access_token', accessToken, cookieOptions));
                                headers.append('Set-Cookie', serialize('refresh_token', refreshToken, cookieOptions));
                                return new Response(JSON.stringify(responseBody), {
                                    status: 200,
                                    headers: headers,
                                });

                            } else {
                                return jsonResponse({ error_code: 1022, message: 'Verification failed' }, 400, cors);
                            }
                        } catch {
                            return jsonResponse({ error_code: 1020, message: 'GeeTest Server Error' }, 500, cors);
                        }
                    } else {
                        return jsonResponse({ success: true, gt_code: JSON.parse(env.GTCODE)[1], message: '请求频繁，请稍后再试', error_code: 1023 }, 429, cors);
                    }
                }
                // ---------- 修改密码 ----------
                if (path === '/api/ayonline/change-password' && method === 'POST') {
                    // 从 Cookie 获取 access_token 验证身份（也可单独传 token）
                    const cookies = parse(request.headers.get('Cookie') || '');
                    const accessToken = cookies.access_token;
                    if (!accessToken) {
                        return jsonResponse({ error_code: 1010, error: 'Unauthorized' }, 401, cors);
                    }
                    const payload = await verifyAccessToken(accessToken, env.JWT_KEY);
                    if (!payload) {
                        return jsonResponse({ error_code: 1011, error: 'Invalid or expired token' }, 401, cors);
                    }

                    const body = await request.json().catch(() => null);
                    if (!body || !body.oldPassword || !body.newPassword) {
                        return jsonResponse({ error_code: 1012, error: 'Missing oldPassword or newPassword' }, 400, cors);
                    }
                    if (body.gt) {
                        let gt;
                        try {
                            const jsonStr = base64ToUtf8(body.gt);
                            gt = JSON.parse(jsonStr);
                        } catch {
                            gt = null;
                        }//客户传来的是base64编码的json文本
                        if (gt === null) { return jsonResponse({ error: 'Missing required fields', error_code: 1007 }, 400, cors); }
                        const prikey = JSON.parse(env.GTCODEMAP)[gt.captcha_id];

                        if (!prikey) {
                            return jsonResponse({ code: 400, 'message': 'id is not in id pools ', error_code: 1021 }, 400, cors);
                        }
                        const sign_token = await hmacSha256(prikey, gt.lot_number);
                        const query = Object.assign(gt, { sign_token });
                        console.debug(gt)
                        const validateUrl = new URL('https://gcaptcha4.geetest.com/validate');
                        validateUrl.search = new URLSearchParams(query).toString();
                        try {
                            const geetestRes = await fetch(validateUrl);
                            const geetestData = await geetestRes.json();
                            if (geetestData.result === 'success') {
                                const userId = parseInt(payload.sub, 10);
                                const result = await changePassword(env.db, env.kv, userId, body.oldPassword, body.newPassword);
                                if (!result.success) {
                                    return jsonResponse({ error_code: result.error_code, error: result.message }, result.code, cors);
                                }

                                // 清除当前设备的 Cookie（因为刷新令牌已被删除）
                                const clearOptions = {
                                    domain: '.undz.cn',
                                    path: '/',
                                    httpOnly: true,
                                    secure: true,
                                    sameSite: 'None',
                                    maxAge: 0,
                                };
                                const clearHeaders = [
                                    serialize('access_token', '', clearOptions),
                                    serialize('refresh_token', '', clearOptions),
                                ];

                                return jsonResponse({ success: true, message: result.message, code: 200 }, 200, {
                                    ...cors,
                                    'Set-Cookie': clearHeaders,
                                });

                            } else {
                                return jsonResponse({ error_code: 1022, message: 'Verification failed' }, 400, cors);
                            }
                        } catch {
                            return jsonResponse({ error_code: 1020, message: 'GeeTest Server Error' }, 500, cors);
                        }
                    } else {
                        return jsonResponse({ success: true, gt_code: JSON.parse(env.GTCODE)[1], message: '请求频繁，请稍后再试', error_code: 1023 }, 429, cors);
                    }

                }
                // ---------- 用户登出 ----------
                if (path === '/api/ayonline/logout' && method === 'POST') {
                    const cookies = parse(request.headers.get('Cookie') || '');
                    const refreshToken = cookies.refresh_token;
                    if (refreshToken) {
                        await deleteRefreshToken(env.kv, refreshToken);
                    }

                    // 清除 Cookie（maxAge=0）
                    const clearOptions = {
                        domain: '.undz.cn',
                        path: '/',
                        httpOnly: true,
                        secure: true,
                        sameSite: 'None',
                        maxAge: 0,
                    };
                    const clearHeaders = [
                        serialize('access_token', '', clearOptions),
                        serialize('refresh_token', '', clearOptions),
                    ];

                    return jsonResponse(
                        { success: true, message: 'Logged out', code: 200 },
                        200,
                        {
                            ...cors,
                            'Set-Cookie': clearHeaders,
                        }
                    );
                }

                // ---------- 验证令牌 ----------
                if (path === '/api/ayonline/verify' && method === 'GET') {
                    const cookies = parse(request.headers.get('Cookie') || '');
                    const accessToken = cookies.access_token;
                    if (!accessToken) {
                        return jsonResponse({ valid: false, error_code: 1013, error: 'No token' }, 401, cors);
                    }
                    const payload = await verifyAccessToken(accessToken, env.JWT_KEY);
                    if (!payload) {
                        return jsonResponse({ valid: false, error_code: 1015, error: 'Invalid or expired token' }, 401, cors);
                    }
                    return jsonResponse({
                        valid: true,
                        code: 200,
                        user: {
                            id: payload.sub,
                            username: payload.username,
                            email: payload.email,
                        },
                    }, 200, cors);
                }

                // ---------- 刷新访问令牌 ----------
                if (path === '/api/ayonline/refresh' && method === 'POST') {
                    const cookies = parse(request.headers.get('Cookie') || '');
                    const refreshToken = cookies.refresh_token;
                    if (!refreshToken) {
                        return jsonResponse({ error_code: 1014, error: 'Refresh token missing' }, 401, cors);
                    }

                    const userId = await getUserIdFromRefreshToken(env.kv, refreshToken);
                    if (!userId) {
                        return jsonResponse({ error_code: 1015, error: 'Invalid or expired refresh token' }, 401, cors);
                    }

                    const user = await env.db.prepare(
                        'SELECT id, username, email, banned, ban_reason FROM online_users WHERE id = ?'
                    ).bind(userId).first();

                    if (!user) {
                        await deleteRefreshToken(env.kv, refreshToken);
                        return jsonResponse({ error_code: 1016, error: 'User not found' }, 401, cors);
                    }

                    // 检查封禁状态
                    if (user.banned === 1) {
                        return jsonResponse({
                            error_code: 1017,
                            error: 'Account banned',
                            ban_reason: user.ban_reason || 'No reason provided'
                        }, 403, cors);
                    }

                    const newAccessToken = await signAccessToken(
                        { sub: user.id, username: user.username, email: user.email },
                        env.JWT_KEY
                    );

                    const cookieOptions = {
                        domain: '.undz.cn',
                        path: '/',
                        httpOnly: true,
                        secure: true,
                        sameSite: 'Lax',
                        maxAge: REFRESH_TOKEN_TTL,
                    };
                    const setCookie = serialize('access_token', newAccessToken, cookieOptions);

                    return jsonResponse(
                        { success: true, message: 'Token refreshed', code: 200 },
                        200,
                        {
                            ...cors,
                            'Set-Cookie': setCookie,
                        }
                    );
                }
                return jsonResponse({ error: 'API not found', error_code: 404 }, 404, cors);
            }

            return env.assets.fetch(request);
        } catch (error) {
            console.error('Unhandled error:', error);
            return jsonResponse({ error: 'Internal Server Error', error_code: 1018 }, 500, cors);
        }
    },
};