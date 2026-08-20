// ============================================================
// 统一身份认证中心 (online.undz.cn)
// 功能：注册、登录、登出、验证、刷新令牌
// 技术栈：Cloudflare Workers + D1 + KV + JWT (jose) + cookie
// ============================================================

import { SignJWT, jwtVerify } from "jose";
import { serialize, parse } from "cookie";
import { base64ToUtf8 } from "./utils.js";
import { handleVerifyCode } from "./mail_verify/verify.js";
import { REG_TEMPLATE, handleSendVerification } from "./mail_verify/send.js";
import { generateToken } from './utils'
// ---------- 常量与配置 ----------
const SDK_VER = "2.0.1";
const JWT_ALG = "HS256";
const ACCESS_TOKEN_EXPIRES_IN = "15m"; // 访问令牌有效期
const OAUTH_TOKEN_EXPIRES_IN = 300; // Oauth token 有效期 5m
const REFRESH_TOKEN_TTL = 60 * 60 * 24 * 30; // 刷新令牌有效期（秒），30天
const PBKDF2_ITERATIONS = 100000;
const PBKDF2_HASH = "SHA-256";
const SALT_LENGTH = 16; // 字节
const MIN_PASSWORD_LENGTH = 6;
const VERIFY_CODE_EXPDATA = 300;
export const TAG_LOGGEDIN = "logged_in";
export const TAG_NOT_LOGGEDIN = "not_logged_in";
export const TAG_BANNED = "banned";

/**
 * Oauth 检查传入的请求是否已登录授权
 * @param {Request} request - 原始的 HTTP 请求对象
 * @param {Env} env - Cloudflare Workers 的环境绑定
 * @returns {Promise<[string, Object|null]>} - 返回认证状态和用户信息
 */
export async function verifyBearerToken(request, env) {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return { valid: false, error: 'missing_token' };
        }
        const token = authHeader.slice(7); // 去掉 "Bearer "
        const payload = await verifyAccessToken(token, env.JWT_KEY);

        if (!payload) {
            return { valid: false, error: 'invalid_token' };
        }

        // 目前没有权限管理，空着
        // 检查 token 是否包含特定的 scope（权限）
        // const scope = payload.scope || '';
        // if (!scope.includes('read_user')) { return { valid: false, error: 'insufficient_scope' }; }
        return {
            valid: true,
            user: {
                id: payload.sub,
                username: payload.username,
                email: payload.email,
                client_id: payload.client_id, // 哪个应用在调用
                scope: payload.scope
            }
        };
    } catch (error) {
        return { valid: false, error: 'server_error' };
    }
}
/**
 * 检查传入的请求是否已登录授权
 * @param {Request} request - 原始的 HTTP 请求对象
 * @param {Env} env - Cloudflare Workers 的环境绑定
 * @returns {Promise<[string, Object|null]>} - 返回认证状态和用户信息
 */
export async function checkAuth(request, env) {
    try {
        const cookies = parse(request.headers.get("Cookie") || "");
        const accessToken = cookies.access_token;

        if (!accessToken) {
            return [TAG_NOT_LOGGEDIN, null];
        }

        const payload = await verifyAccessToken(accessToken, env.JWT_KEY);
        if (!payload) {
            return [TAG_NOT_LOGGEDIN, null];
        }

        const userId = parseInt(payload.sub, 10);
        const user = await env.db
            .prepare(
                "SELECT id, username, email, banned, ban_reason FROM online_users WHERE id = ?",
            )
            .bind(userId)
            .first();

        if (!user) {
            return [TAG_NOT_LOGGEDIN, null];
        }

        if (user.banned == 1) {
            return [
                TAG_BANNED,
                {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    ban_reason: user.ban_reason || "",
                },
            ];
        }

        return [
            "logged_in",
            {
                id: user.id,
                username: user.username,
                email: user.email,
            },
        ];
    } catch (error) {
        console.error("checkAuth error:", error);
        // 遇到异常视为未登录
        return [TAG_NOT_LOGGEDIN, null];
    }
}
const allowedEmailDomains = [
    'qq.com',
    '163.com',
    '126.com',
    'foxmail.com',
    'sina.com',
    'sohu.com',
    '139.com',
    '189.cn',
    '21cn.com',
    'tom.com',
    'yeah.net',
    '263.net',
    'vip.qq.com',
    'vip.163.com',
    'vip.sina.com',
    'gmail.com',
    'outlook.com',
    'hotmail.com',
    'live.com',
    'msn.com',
    'yahoo.com',
    'yahoo.co.jp',
    'yahoo.com.hk',
    'yahoo.com.tw',
    'icloud.com',
    'me.com',
    'mac.com',
    'aol.com',
    'protonmail.com',
    'mail.com',
    'gmx.com',
    'zoho.com',
    'yandex.com',
    'rambler.ru',
    'undz.cn',
    'io.hb.cn',
    '2x.nz'
];
// 允许跨域的子服务域名（白名单）
const ALLOWED_ORIGINS = [
    "https://api.undz.cn",
    "https://chat.undz.cn",
    "https://editor.undz.cn",
    "https://cdn.undz.cn",
    "https://online.undz.cn",
    "https://c.undz.cn",
    "https://i0.undz.cn",
    "https://i1.undz.cn",
    "https://i2.undz.cn",
    "http://test.undz.cn:8080",
    "https://undz.cn",
    "https://io.hb.cn",
    "https://www.undz.cn",
    "https://ayd2.eu.cc",
    "https://main.net2.eu.cc",
    "https://www.io.hb.cn",
    "https://main.net3.eu.cc",
    "https://main.exm2.eu.cc",
    "https://main.zyy2.eu.cc",
    "https://test.undz.cn",
    "https://zyy.undz.cn",
    "https://zyy.io.hb.cn",
    "https://zyyos.io.hb.cn",
    "https://z.net2.eu.cc",
    "https://zyyos.undz.cn",
    "https://z.ayd2.eu.cc",
    "https://z.net3.eu.cc",
    "https://zyy2.eu.cc",
    "https://zyy.exm2.eu.cc",
    "https://zyyos.exm2.eu.cc",
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
        "raw",
        keyData,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"],
    );
    const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
    return Array.from(new Uint8Array(signature))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
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
        "raw",
        encoder.encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveBits"],
    );
    const derived = await crypto.subtle.deriveBits(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: PBKDF2_ITERATIONS,
            hash: PBKDF2_HASH,
        },
        keyMaterial,
        256,
    );
    return new Uint8Array(derived);
}

function generateRefreshToken() {
    const bytes = generateRandomBytes(32);
    return Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
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
            "Content-Type": "application/json",
            ...extraHeaders,
        },
    });
}

function corsHeaders(request) {
    const origin = request.headers.get("Origin");
    const headers = {
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, x-app-id, x-sdk-ver",
        "Access-Control-Max-Age": "86400",
    };
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
        headers["Access-Control-Allow-Origin"] = origin;
    } else {
        headers["Access-Control-Allow-Origin"] = "null";
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
    await db
        .prepare(
            `
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
    `,
        )
        .run();
    await db
        .prepare(
            `CREATE TABLE IF NOT EXISTS oauth_clients (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                client_id TEXT UNIQUE NOT NULL,
                client_secret TEXT NOT NULL,
                name TEXT NOT NULL,
                redirect_uris TEXT NOT NULL,
                scope TEXT DEFAULT 'openid profile email',
                trusted BOOLEAN DEFAULT 0,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            )`
        )
        .run();

    await db
        .prepare(
            `CREATE TABLE IF NOT EXISTS oauth_auth_codes (
                code TEXT PRIMARY KEY,
                client_id TEXT NOT NULL,
                user_id INTEGER NOT NULL,
                redirect_uri TEXT NOT NULL,
                scope TEXT,
                state TEXT,
                expires_at INTEGER NOT NULL,
                used BOOLEAN DEFAULT 0
            )`
        )
        .run();

    await db
        .prepare(`CREATE INDEX IF NOT EXISTS idx_oauth_codes_used ON oauth_auth_codes(used)`)
        .run();
    await db
        .prepare(`CREATE INDEX IF NOT EXISTS idx_oauth_codes_expires ON oauth_auth_codes(expires_at)`)
        .run();
    await db
        .prepare(
            `CREATE INDEX IF NOT EXISTS idx_username ON online_users(username)`,
        )
        .run();

    await db
        .prepare(`CREATE INDEX IF NOT EXISTS idx_email ON online_users(email)`)
        .run();
    await registerOAuthClient(db, 'app_chat', generateToken(), '聊天助手', 'https://chat.undz.cn/oauth/callback,http://test.undz.cn:8080/callback');
}
async function registerOAuthClient(db, clientId, clientSecret, name, redirectUris, scope = 'openid profile email', trusted = 0) {
    const now = Math.floor(Date.now() / 1000);
    await db
        .prepare(
            `INSERT INTO oauth_clients (client_id, client_secret, name, redirect_uris, scope, trusted, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(clientId, clientSecret, name, redirectUris, scope, trusted, now, now)
        .run();
}
export async function exchangeOAuthToken(request, env) {
    // OAuth 2.0 标准要求使用 application/x-www-form-urlencoded
    const contentType = request.headers.get('Content-Type') || '';
    let body;
    if (contentType.includes('application/json')) {
        body = await request.json().catch(() => null);
    } else {
        const formData = await request.formData();
        body = {};
        for (const [key, value] of formData.entries()) {
            body[key] = value;
        }
    }
    if (!body) {
        return jsonResponse({ error: 'invalid_request' }, 400, cors);
    }
    const grantType = body.grant_type;
    const code = body.code;
    const state = body.state || null;
    const redirectUri = body.redirect_uri;
    const clientId = body.client_id;
    const clientSecret = body.client_secret;
    if (grantType !== 'authorization_code') {
        return jsonResponse({ error: 'unsupported_grant_type' }, 400, cors);
    }
    if (!code || !clientId || !clientSecret) {
        return jsonResponse({ error: 'invalid_request' }, 400, cors);
    }
    const client = await env.db
        .prepare('SELECT * FROM oauth_clients WHERE client_id = ?')
        .bind(clientId)
        .first();

    if (!client || client.client_secret !== clientSecret) {
        return jsonResponse({ error: 'invalid_client' }, 401, cors);
    }
    const authCode = await env.db
        .prepare(
            `SELECT * FROM oauth_auth_codes 
             WHERE code = ? AND used = 0 AND expires_at > ?`
        )
        .bind(code, Math.floor(Date.now() / 1000))
        .first();

    if (!authCode) {
        return jsonResponse({ error: 'invalid_grant' }, 400, cors);
    }
    if (authCode.redirect_uri !== redirectUri) {
        return jsonResponse({ error: 'invalid_grant' }, 400, cors);
    }
    if (state && authCode.state && authCode.state !== state) {
        return jsonResponse({ error: 'invalid_grant' }, 400, cors);
    }
    await env.db
        .prepare('DELETE FROM oauth_auth_codes WHERE code = ?')
        .bind(code)
        .run();
    const user = await env.db
        .prepare('SELECT id, username, email FROM online_users WHERE id = ?')
        .bind(authCode.user_id)
        .first();

    if (!user) {
        return jsonResponse({ error: 'invalid_grant' }, 400, cors);
    }
    const accessToken = await signAccessToken(
        {
            sub: user.id,
            username: user.username,
            email: user.email,
            client_id: clientId,
            scope: authCode.scope || client.scope
        },
        env.JWT_KEY
    );
    const refreshToken = generateRefreshToken();
    await storeRefreshToken(
        env.kv,
        refreshToken,
        user.id,
        REFRESH_TOKEN_TTL
    );
    const response = {
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: 900, // 15分钟，与 ACCESS_TOKEN_EXPIRES_IN 保持一致
        refresh_token: refreshToken,
        scope: authCode.scope || client.scope
    };

    return jsonResponse(response, 200, cors);
}
async function getOAuthClient(db, clientId) {
    const client = await db
        .prepare('SELECT * FROM oauth_clients WHERE client_id = ?')
        .bind(clientId)
        .first();
    return client;
}
function validateRedirectUri(allowedUris, redirectUri) {
    // allowedUris 是逗号分隔的字符串，转为数组
    const uris = allowedUris.split(',').map(u => u.trim());
    return uris.includes(redirectUri);
}
async function registerUser(db, username, email, password) {
    if (!validateEmail(email)) {
        return {
            success: false,
            action: "register",
            code: 400,
            error_code: 1000,
            message: "Invalid email format",
        };
    }
    if (!validatePassword(password)) {
        return {
            success: false,
            action: "register",
            code: 400,
            error_code: 1001,
            message:
                "Password must be at least 6 characters and contain only a-z A-Z 0-9 -_=+@#$%",
        };
    }
    const existing = await db
        .prepare("SELECT id FROM online_users WHERE username = ? OR email = ?")
        .bind(username, email)
        .first();
    if (existing) {
        return {
            success: false,
            action: "register",
            code: 409,
            error_code: 1002,
            message: "Username or email already exists",
        };
    }

    const salt = generateRandomBytes(SALT_LENGTH);
    const hashBytes = await hashPassword(password, salt);
    const saltBase64 = toBase64(salt);
    const hashBase64 = toBase64(hashBytes);

    const now = Date.now();
    await db
        .prepare(
            `
    INSERT INTO online_users (username, email, password_salt, password_hash, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `,
        )
        .bind(username, email, saltBase64, hashBase64, now, now)
        .run();

    return {
        success: true,
        action: "register",
        code: 200,
        message: "User registered successfully",
    };
}

async function authenticateUser(db, usernameOrEmail, password) {
    const user = await db
        .prepare(
            "SELECT id, username, email, password_salt, password_hash, banned, ban_reason FROM online_users WHERE username = ? OR email = ?",
        )
        .bind(usernameOrEmail, usernameOrEmail)
        .first();

    if (!user) {
        return {
            success: false,
            action: "login",
            code: 401,
            error_code: 1003,
            message: "Invalid credentials",
        };
    }

    const salt = fromBase64(user.password_salt);
    const hashBytes = await hashPassword(password, salt);
    const hashBase64 = toBase64(hashBytes);

    if (hashBase64 !== user.password_hash) {
        return {
            success: false,
            action: "login",
            code: 401,
            error_code: 1003,
            message: "Invalid credentials",
        };
    }

    return {
        success: true,
        action: "login",
        code: 200,
        user: {
            id: user.id,
            username: user.username,
            email: user.email,
            banned: user.banned,
            ban_reason: user.ban_reason || "",
        },
    };
}

// ---------- 刷新令牌 KV 操作 ----------
async function storeRefreshToken(kv, token, userId, ttlSeconds) {
    await kv.put(`refresh:${token}`, String(userId), {
        expirationTtl: ttlSeconds,
    });
    await addRefreshTokenForUser(kv, userId, token);
}
function isVersionValid(current, required) {
    const parts = current.split(".").map(Number);
    const reqParts = required.split(".").map(Number);
    for (let i = 0; i < Math.max(parts.length, reqParts.length); i++) {
        const p = parts[i] || 0;
        const r = reqParts[i] || 0;
        if (p !== r) return p >= r;
    }
    return true;
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
        await kv.put(key, JSON.stringify(list), {
            expirationTtl: REFRESH_TOKEN_TTL,
        });
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
    list = list.filter((t) => t !== token);
    if (list.length > 0) {
        await kv.put(key, JSON.stringify(list), {
            expirationTtl: REFRESH_TOKEN_TTL,
        });
    } else {
        await kv.delete(key);
    }
}
// ---------- 改密码 ----------
async function changePassword(db, kv, userId, oldPassword, newPassword) {
    if (!validatePassword(newPassword)) {
        return {
            success: false,
            code: 400,
            action: "changePassword",
            error_code: 1005,
            message:
                "New password must be at least 6 characters and contain only a-z A-Z 0-9 -_=+@#$%",
        };
    }

    const user = await db
        .prepare(
            "SELECT password_salt, password_hash FROM online_users WHERE id = ?",
        )
        .bind(userId)
        .first();
    if (!user)
        return {
            success: false,
            code: 404,
            action: "changePassword",
            message: "User not found",
        };

    const salt = fromBase64(user.password_salt);
    const oldHashBytes = await hashPassword(oldPassword, salt);
    const oldHashBase64 = toBase64(oldHashBytes);

    if (oldHashBase64 !== user.password_hash) {
        return {
            success: false,
            code: 401,
            action: "changePassword",
            error_code: 1006,
            message: "Old password incorrect",
        };
    }

    const newSalt = generateRandomBytes(SALT_LENGTH);
    const newHashBytes = await hashPassword(newPassword, newSalt);
    const newSaltBase64 = toBase64(newSalt);
    const newHashBase64 = toBase64(newHashBytes);

    const now = Date.now();
    await db
        .prepare(
            "UPDATE online_users SET password_salt = ?, password_hash = ?, updated_at = ? WHERE id = ?",
        )
        .bind(newSaltBase64, newHashBase64, now, userId)
        .run();

    await revokeAllUserRefreshTokens(kv, userId);

    return {
        success: true,
        code: 200,
        action: "changePassword",
        message: "Password updated. Please log in again.",
    };
}
// ---------- 请求处理 ----------
export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const path = url.pathname;
        const method = request.method;

        if (method === "OPTIONS") {
            return handleOptions(request);
        }

        const cors = corsHeaders(request);

        try {
            // ---------- 初始化数据库（需 Admin Key） ----------

            if (path.startsWith("/api/ayonline/")) {
                if (path === "/api/ayonline/init" && method === "POST") {
                    const authKey = request.headers.get("X-Admin-Key");
                    if (authKey !== env.KEY) {
                        return jsonResponse({ error: "Unauthorized" }, 401, cors);
                    }
                    await initDatabase(env.db);
                    return jsonResponse(
                        { success: true, message: "Database initialized" },
                        200,
                        cors,
                    );
                }

                const appId = request.headers.get("X-App-Id") || "";
                if (!env.ALLOWED_APP_IDS.includes(appId)) {
                    return jsonResponse(
                        {
                            success: false,
                            code: 403,
                            error_code: 1019,
                            message: "appId is invalid",
                        },
                        403,
                        cors,
                    );
                }
                const sdkVer = request.headers.get("X-SDK-VER") || "";
                if (!sdkVer || !isVersionValid(sdkVer, SDK_VER)) {
                    return jsonResponse(
                        {
                            success: false,
                            code: 500,
                            error_code: 1018,
                            message: "SDK version outdated, please upgrade",
                        },
                        500,
                        cors,
                    );
                }
                if (path === "/api/ayonline/test") {
                    return jsonResponse(
                        { success: true, message: "Server is ready", code: 200 },
                        200,
                        cors,
                    );
                }
                if (path === "/api/ayonline/send-verification" && method === "POST") {
                    const body = await request.json().catch(() => null);
                    if (!body || !body.email) {
                        return jsonResponse(
                            { error: "Email required", error_code: 1029 },
                            400,
                            cors,
                        );
                    }
                    const result = await handleSendVerification(
                        env,
                        body.email,
                        VERIFY_CODE_EXPDATA,
                        "AyService",
                        REG_TEMPLATE,
                    );
                    if (result.msg === "OK") {
                        return jsonResponse({ token: result.token }, 200, cors);
                    } else {
                        // 映射错误信息
                        const msgMap = {
                            EMAIL_REQUIRED: "Email required",
                            CONFIG_ERROR: "Server config error",
                            FAILED_SEND_EMAIL: "Failed to send email",
                            INVALID_RESPONSE: "Mail service error",
                            ERR429: "Too frequent",
                            ERR500: "Send mail server down"
                        };
                        const codeMap = {
                            EMAIL_REQUIRED: 1029,
                            CONFIG_ERROR: 1030,
                            FAILED_SEND_EMAIL: 1032,
                            INVALID_RESPONSE: 1031,
                            ERR429: 1027,
                            ERR500: 1033
                        };
                        return jsonResponse(
                            {
                                error: msgMap[result.msg] || "Unknown error",
                                error_code: codeMap[result.msg] || 1028,
                            },
                            500,
                            cors,
                        );
                    }
                }
                // ---------- 用户注册 ----------
                if (path === "/api/ayonline/register" && method === "POST") {
                    const body = await request.json().catch(() => null);
                    if (!body || !body.username || !body.password || !body.email || !body.emailToken || !body.emailCode) {
                        return jsonResponse(
                            { error: "Missing required fields", error_code: 1007 },
                            400,
                            cors,
                        );
                    }
                    if (!allowedEmailDomains.some(domain => body.email.endsWith('@' + domain))) return jsonResponse({
                        action: 'register',
                        error: 'Invalid email',
                        error_code: 1000
                    }, 400, cors);
                    if (body.gt) {
                        const verifyResult = await handleVerifyCode(body.emailCode, body.emailToken, env);
                        if (!verifyResult.valid) {
                            return jsonResponse({
                                action: 'register',
                                error: verifyResult.error || 'Invalid or expired verification code',
                                error_code: 1025
                            }, 400, cors);
                        }
                        let gt;
                        try {
                            const jsonStr = base64ToUtf8(body.gt);
                            gt = JSON.parse(jsonStr);
                        } catch {
                            gt = null;
                        } //客户传来的是base64编码的json文本
                        if (gt === null) {
                            return jsonResponse(
                                {
                                    action: "register",
                                    error: "Missing required fields",
                                    error_code: 1007,
                                },
                                400,
                                cors,
                            );
                        }
                        const prikey = JSON.parse(env.GTCODEMAP)[gt.captcha_id];

                        if (!prikey) {
                            return jsonResponse(
                                {
                                    action: "register",
                                    code: 400,
                                    message: "id is not in id pools ",
                                    error_code: 1021,
                                },
                                400,
                                cors,
                            );
                        }
                        const sign_token = await hmacSha256(prikey, gt.lot_number);
                        const query = Object.assign(gt, { sign_token });
                        console.debug(gt);
                        const validateUrl = new URL(
                            "https://gcaptcha4.geetest.com/validate",
                        );
                        validateUrl.search = new URLSearchParams(query).toString();
                        try {

                            const geetestRes = await fetch(validateUrl);
                            const geetestData = await geetestRes.json();
                            if (geetestData.result === "success") {
                                const result = await registerUser(
                                    env.db,
                                    body.username,
                                    body.email,
                                    body.password,
                                );
                                if (!result.success) {
                                    return jsonResponse(
                                        {
                                            action: "register",
                                            error: result.message,
                                            error_code: result.error_code,
                                        },
                                        result.code,
                                        cors,
                                    );
                                }
                                return jsonResponse(
                                    {
                                        action: "register",
                                        success: true,
                                        message: result.message,
                                        code: 200,
                                    },
                                    201,
                                    cors,
                                );
                            } else {
                                return jsonResponse(
                                    {
                                        action: "register",
                                        error_code: 1022,
                                        message: "Verification failed",
                                    },
                                    400,
                                    cors,
                                );
                            }
                        } catch {
                            return jsonResponse(
                                {
                                    action: "register",
                                    error_code: 1020,
                                    message: "GeeTest Server Error",
                                },
                                500,
                                cors,
                            );
                        }
                    } else {
                        return jsonResponse(
                            {
                                action: "register",
                                success: true,
                                gt_code: JSON.parse(env.GTCODE)[0],
                                message: "请求频繁，请稍后再试",
                                error_code: 1023,
                            },
                            429,
                            cors,
                        );
                    }
                }

                // ---------- 用户登录 ----------
                if (path === "/api/ayonline/login" && method === "POST") {
                    const body = await request.json().catch(() => null);
                    if (!body || (!body.username && !body.email) || !body.password) {
                        return jsonResponse(
                            {
                                action: "login",
                                error_code: 1009,
                                error: "Username/email and password required",
                            },
                            400,
                            cors,
                        );
                    }
                    if (body.gt) {
                        let gt;
                        try {
                            const jsonStr = base64ToUtf8(body.gt);
                            gt = JSON.parse(jsonStr);
                        } catch {
                            gt = null;
                        } //客户传来的是base64编码的json文本
                        if (gt === null) {
                            return jsonResponse(
                                {
                                    action: "login",
                                    error: "Missing required fields",
                                    error_code: 1007,
                                },
                                400,
                                cors,
                            );
                        }
                        const prikey = JSON.parse(env.GTCODEMAP)[gt.captcha_id];

                        if (!prikey) {
                            return jsonResponse(
                                {
                                    action: "login",
                                    code: 400,
                                    message: "id is not in id pools ",
                                    error_code: 1021,
                                },
                                400,
                                cors,
                            );
                        }
                        const sign_token = await hmacSha256(prikey, gt.lot_number);
                        const query = Object.assign(gt, { sign_token });
                        console.debug(gt);
                        const validateUrl = new URL(
                            "https://gcaptcha4.geetest.com/validate",
                        );
                        validateUrl.search = new URLSearchParams(query).toString();
                        try {
                            const geetestRes = await fetch(validateUrl);
                            const geetestData = await geetestRes.json();
                            if (geetestData.result === "success") {
                                const login = body.username || body.email;
                                const authResult = await authenticateUser(
                                    env.db,
                                    login,
                                    body.password,
                                );
                                if (!authResult.success) {
                                    return jsonResponse(
                                        {
                                            error: authResult.message,
                                            error_code: authResult.error_code,
                                        },
                                        authResult.code,
                                        cors,
                                    );
                                }

                                const user = authResult.user;
                                if (user.banned == 1) {
                                    return jsonResponse(
                                        {
                                            action: "login",
                                            error_code: 1017,
                                            error: "Account banned",
                                            ban_reason: user.ban_reason || "",
                                        },
                                        403,
                                        cors,
                                    );
                                }
                                // 生成访问令牌
                                const accessToken = await signAccessToken(
                                    { sub: user.id, username: user.username, email: user.email },
                                    env.JWT_KEY,
                                );
                                // 生成刷新令牌
                                const refreshToken = generateRefreshToken();
                                await storeRefreshToken(
                                    env.kv,
                                    refreshToken,
                                    user.id,
                                    REFRESH_TOKEN_TTL,
                                );

                                // 使用 cookie 库的 serialize 设置两个 Cookie
                                const cookieOptions = {
                                    domain: ".undz.cn",
                                    path: "/",
                                    httpOnly: true,
                                    secure: true,
                                    sameSite: "Lax",
                                    maxAge: REFRESH_TOKEN_TTL,
                                };
                                const responseBody = {
                                    action: "login",
                                    success: true,
                                    code: 200,
                                    user: {
                                        id: user.id,
                                        username: user.username,
                                        email: user.email,
                                    },
                                };

                                const headers = new Headers(corsHeaders(request));
                                headers.set("Content-Type", "application/json");
                                headers.append(
                                    "Set-Cookie",
                                    serialize("access_token", accessToken, cookieOptions),
                                );
                                headers.append(
                                    "Set-Cookie",
                                    serialize("refresh_token", refreshToken, cookieOptions),
                                );
                                return new Response(JSON.stringify(responseBody), {
                                    status: 200,
                                    headers: headers,
                                });
                            } else {
                                return jsonResponse(
                                    {
                                        action: "login",
                                        error_code: 1022,
                                        message: "Verification failed",
                                    },
                                    400,
                                    cors,
                                );
                            }
                        } catch {
                            return jsonResponse(
                                {
                                    action: "login",
                                    error_code: 1020,
                                    message: "GeeTest Server Error",
                                },
                                500,
                                cors,
                            );
                        }
                    } else {
                        return jsonResponse(
                            {
                                action: "login",
                                success: true,
                                gt_code: JSON.parse(env.GTCODE)[1],
                                message: "请求频繁，请稍后再试",
                                error_code: 1023,
                            },
                            429,
                            cors,
                        );
                    }
                }
                // ---------- 修改密码 ----------
                if (path === "/api/ayonline/change-password" && method === "POST") {
                    const cookies = parse(request.headers.get("Cookie") || "");
                    const accessToken = cookies.access_token;
                    if (!accessToken) {
                        return jsonResponse(
                            {
                                action: "changePassword",
                                error_code: 1010,
                                error: "Unauthorized",
                            },
                            401,
                            cors,
                        );
                    }
                    const payload = await verifyAccessToken(accessToken, env.JWT_KEY);
                    if (!payload) {
                        return jsonResponse(
                            {
                                action: "changePassword",
                                error_code: 1011,
                                error: "Invalid or expired token",
                            },
                            401,
                            cors,
                        );
                    }

                    const body = await request.json().catch(() => null);
                    if (!body || !body.oldPassword || !body.newPassword) {
                        return jsonResponse(
                            {
                                action: "changePassword",
                                error_code: 1012,
                                error: "Missing oldPassword or newPassword",
                            },
                            400,
                            cors,
                        );
                    }
                    if (body.gt) {
                        let gt;
                        try {
                            const jsonStr = base64ToUtf8(body.gt);
                            gt = JSON.parse(jsonStr);
                        } catch {
                            gt = null;
                        } //客户传来的是base64编码的json文本
                        if (gt === null) {
                            return jsonResponse(
                                {
                                    action: "changePassword",
                                    error: "Missing required fields",
                                    error_code: 1007,
                                },
                                400,
                                cors,
                            );
                        }
                        const prikey = JSON.parse(env.GTCODEMAP)[gt.captcha_id];

                        if (!prikey) {
                            return jsonResponse(
                                {
                                    action: "changePassword",
                                    code: 400,
                                    message: "id is not in id pools ",
                                    error_code: 1021,
                                },
                                400,
                                cors,
                            );
                        }
                        const sign_token = await hmacSha256(prikey, gt.lot_number);
                        const query = Object.assign(gt, { sign_token });
                        console.debug(gt);
                        const validateUrl = new URL(
                            "https://gcaptcha4.geetest.com/validate",
                        );
                        validateUrl.search = new URLSearchParams(query).toString();
                        try {
                            const geetestRes = await fetch(validateUrl);
                            const geetestData = await geetestRes.json();
                            if (geetestData.result === "success") {
                                const userId = parseInt(payload.sub, 10);
                                const result = await changePassword(
                                    env.db,
                                    env.kv,
                                    userId,
                                    body.oldPassword,
                                    body.newPassword,
                                );
                                if (!result.success) {
                                    return jsonResponse(
                                        {
                                            action: "changePassword",
                                            error_code: result.error_code,
                                            error: result.message,
                                        },
                                        result.code,
                                        cors,
                                    );
                                }

                                // 清除当前设备的 Cookie（因为刷新令牌已被删除）
                                const clearOptions = {
                                    domain: ".undz.cn",
                                    path: "/",
                                    httpOnly: true,
                                    secure: true,
                                    sameSite: "None",
                                    maxAge: 0,
                                };
                                const clearHeaders = [
                                    serialize("access_token", "", clearOptions),
                                    serialize("refresh_token", "", clearOptions),
                                ];

                                return jsonResponse(
                                    {
                                        action: "changePassword",
                                        success: true,
                                        message: result.message,
                                        code: 200,
                                    },
                                    200,
                                    {
                                        ...cors,
                                        "Set-Cookie": clearHeaders,
                                    },
                                );
                            } else {
                                return jsonResponse(
                                    {
                                        action: "changePassword",
                                        error_code: 1022,
                                        message: "Verification failed",
                                    },
                                    400,
                                    cors,
                                );
                            }
                        } catch {
                            return jsonResponse(
                                {
                                    action: "changePassword",
                                    error_code: 1020,
                                    message: "GeeTest Server Error",
                                },
                                500,
                                cors,
                            );
                        }
                    } else {
                        return jsonResponse(
                            {
                                action: "changePassword",
                                success: true,
                                gt_code: JSON.parse(env.GTCODE)[1],
                                message: "请求频繁，请稍后再试",
                                error_code: 1023,
                            },
                            429,
                            cors,
                        );
                    }
                }
                // ---------- 用户登出 ----------
                if (path === "/api/ayonline/logout" && method === "POST") {
                    const cookies = parse(request.headers.get("Cookie") || "");
                    const refreshToken = cookies.refresh_token;
                    if (refreshToken) {
                        await deleteRefreshToken(env.kv, refreshToken);
                    }

                    // 清除 Cookie（maxAge=0）
                    const clearOptions = {
                        domain: ".undz.cn",
                        path: "/",
                        httpOnly: true,
                        secure: true,
                        sameSite: "None",
                        maxAge: 0,
                    };
                    const clearHeaders = [
                        serialize("access_token", "", clearOptions),
                        serialize("refresh_token", "", clearOptions),
                    ];

                    return jsonResponse(
                        {
                            action: "logout",
                            success: true,
                            message: "Logged out",
                            code: 200,
                        },
                        200,
                        {
                            ...cors,
                            "Set-Cookie": clearHeaders,
                        },
                    );
                }

                // ---------- 验证令牌 ----------
                if (path === "/api/ayonline/verify" && method === "GET") {
                    const cookies = parse(request.headers.get("Cookie") || "");
                    const accessToken = cookies.access_token;
                    if (!accessToken) {
                        return jsonResponse(
                            { valid: false, error_code: 1013, error: "No token" },
                            401,
                            cors,
                        );
                    }
                    const payload = await verifyAccessToken(accessToken, env.JWT_KEY);
                    if (!payload) {
                        return jsonResponse(
                            {
                                valid: false,
                                error_code: 1015,
                                error: "Invalid or expired token",
                            },
                            401,
                            cors,
                        );
                    }
                    return jsonResponse(
                        {
                            valid: true,
                            code: 200,
                            user: {
                                id: payload.sub,
                                username: payload.username,
                                email: payload.email,
                            },
                        },
                        200,
                        cors,
                    );
                }

                // ---------- 刷新访问令牌 ----------
                if (path === "/api/ayonline/refresh" && method === "POST") {
                    const cookies = parse(request.headers.get("Cookie") || "");
                    const refreshToken = cookies.refresh_token;
                    if (!refreshToken) {
                        return jsonResponse(
                            { error_code: 1014, error: "Refresh token missing" },
                            401,
                            cors,
                        );
                    }

                    const userId = await getUserIdFromRefreshToken(env.kv, refreshToken);
                    if (!userId) {
                        return jsonResponse(
                            { error_code: 1015, error: "Invalid or expired refresh token" },
                            401,
                            cors,
                        );
                    }

                    const user = await env.db
                        .prepare(
                            "SELECT id, username, email, banned, ban_reason FROM online_users WHERE id = ?",
                        )
                        .bind(userId)
                        .first();

                    if (!user) {
                        await deleteRefreshToken(env.kv, refreshToken);
                        return jsonResponse(
                            { error_code: 1016, error: "User not found" },
                            401,
                            cors,
                        );
                    }

                    // 检查封禁状态
                    if (user.banned == 1) {
                        return jsonResponse(
                            {
                                error_code: 1017,
                                error: "Account banned",
                                ban_reason: user.ban_reason || "",
                            },
                            403,
                            cors,
                        );
                    }

                    const newAccessToken = await signAccessToken(
                        { sub: user.id, username: user.username, email: user.email },
                        env.JWT_KEY,
                    );

                    const cookieOptions = {
                        domain: ".undz.cn",
                        path: "/",
                        httpOnly: true,
                        secure: true,
                        sameSite: "Lax",
                        maxAge: REFRESH_TOKEN_TTL,
                    };
                    const setCookie = serialize(
                        "access_token",
                        newAccessToken,
                        cookieOptions,
                    );

                    return jsonResponse(
                        {
                            action: "refresh",
                            success: true,
                            message: "Token refreshed",
                            code: 200,
                        },
                        200,
                        {
                            ...cors,
                            "Set-Cookie": setCookie,
                        },
                    );
                }
                return jsonResponse(
                    { action: "refresh", error: "API not found", error_code: 404 },
                    404,
                    cors,
                );
            }
            if (path.startsWith("/api/oauth/")) {
                // 开发中
                if (path === "/api/oauth/authorize" && method === 'GET') {
                    const query = url.searchParams;
                    const clientId = query.get('client_id');
                    const redirectUri = query.get('redirect_uri');
                    const responseType = query.get('response_type');
                    const state = query.get('state') || '';
                    const scope = query.get('scope') || 'openid profile email';

                    if (!clientId || !redirectUri || responseType !== 'code') {
                        const errorUrl = new URL('/oauth2/invalid_request', url.origin);
                        return new Response(null, {
                            status: 302,
                            headers: {
                                Location: errorUrl.toString(),
                                ...cors
                            }
                        });
                    }
                    const client = await env.db
                        .prepare('SELECT id, name, redirect_uris, scope FROM oauth_clients WHERE client_id = ?')
                        .bind(clientId)
                        .first();
                    // 应用未注册 -> 跳转至 invalid_client
                    if (!client) {
                        const errorUrl = new URL('/oauth2/invalid_client', url.origin);
                        return new Response(null, {
                            status: 302,
                            headers: {
                                Location: errorUrl.toString(),
                                ...cors
                            }
                        });
                    }
                    if (!validateRedirectUri(client.redirect_uris, redirectUri)) {
                        const errorUrl = new URL('/oauth2/invalid_redirect_uri', url.origin);
                        return new Response(null, {
                            status: 302,
                            headers: {
                                Location: errorUrl.toString(),
                                ...cors
                            }
                        });
                    }

                    const [authStatus, user] = await checkAuth(request, env);
                    if (authStatus !== TAG_LOGGEDIN) {
                        const loginUrl = new URL('/oauth2/login', url.origin);
                        loginUrl.searchParams.set('redirect_url', request.url);
                        return new Response(null, {
                            status: 302,
                            headers: {
                                Location: loginUrl.toString(),
                                ...cors
                            }
                        });
                    }
                    if (authStatus === TAG_LOGGEDIN) {
                        const consentUrl = new URL('/oauth2/consent', url.origin);
                        consentUrl.searchParams.set('client_id', clientId);
                        consentUrl.searchParams.set('redirect_uri', redirectUri);
                        consentUrl.searchParams.set('scope', scope);
                        if (state) consentUrl.searchParams.set('state', state);
                        return new Response(null, {
                            status: 302,
                            headers: {
                                Location: consentUrl.toString(),
                                ...cors
                            }
                        });
                        //             const code = generateToken();
                        //             const expiresAt = Math.floor(Date.now() / 1000) + OAUTH_TOKEN_EXPIRES_IN;

                        //             await env.db
                        //                 .prepare(
                        //                     `INSERT INTO oauth_auth_codes (code, client_id, user_id, redirect_uri, scope, state, expires_at, used)
                        //  VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
                        //                 )
                        //                 .bind(code, clientId, user.id, redirectUri, scope, state, expiresAt, 0)
                        //                 .run();

                        //             // 3. 重定向回客户端
                        //             const redirectUrl = new URL(redirectUri);
                        //             redirectUrl.searchParams.set('code', code);
                        //             if (state) redirectUrl.searchParams.set('state', state);

                        //             return new Response(null, {
                        //                 status: 302,
                        //                 headers: { Location: redirectUrl.toString(), ...cors }
                        //             });
                    }
                }
                if (path === "/api/oauth/consent" && method === "POST") {
                    const formData = await request.formData();
                    const action = formData.get('action');
                    const clientId = formData.get('client_id');
                    const redirectUri = formData.get('redirect_uri');
                    const scope = formData.get('scope') || 'openid profile email';
                    const state = formData.get('state') || '';

                    // 1. 验证用户登录
                    const [authStatus, user] = await checkAuth(request, env);
                    if (authStatus !== TAG_LOGGEDIN) {
                        return jsonResponse({ error: 'unauthorized' }, 401, cors);
                    }

                    // 2. 验证 client_id 和 redirect_uri
                    const client = await getOAuthClient(env.db, clientId);
                    if (!client || !validateRedirectUri(client.redirect_uris, redirectUri)) {
                        return jsonResponse({ error: 'invalid_request' }, 400, cors);
                    }

                    if (action === 'deny') {
                        // 用户拒绝：重定向回应用并携带 error=access_denied
                        const errorUrl = new URL(redirectUri);
                        errorUrl.searchParams.set('error', 'access_denied');
                        if (state) errorUrl.searchParams.set('state', state);
                        return new Response(null, {
                            status: 302,
                            headers: { Location: errorUrl.toString(), ...cors }
                        });
                    }

                    if (action === 'allow') {
                        // 用户允许：生成授权码
                        const code = generateToken();
                        const expiresAt = Math.floor(Date.now() / 1000) + OAUTH_TOKEN_EXPIRES_IN;
                        await env.db
                            .prepare(
                                `INSERT INTO oauth_auth_codes (code, client_id, user_id, redirect_uri, scope, state, expires_at, used)
                 VALUES (?, ?, ?, ?, ?, ?, ?, 0)`
                            )
                            .bind(code, clientId, user.id, redirectUri, scope, state, expiresAt)
                            .run();

                        // 重定向回应用
                        const redirectUrl = new URL(redirectUri);
                        redirectUrl.searchParams.set('code', code);
                        if (state) redirectUrl.searchParams.set('state', state);
                        return new Response(null, {
                            status: 302,
                            headers: { Location: redirectUrl.toString(), ...cors }
                        });
                    }

                    // 未知 action
                    return jsonResponse({ error: 'invalid_action' }, 400, cors);
                }
                if (path === "/api/oauth/client-info" && method === "GET") {
                    const clientId = url.searchParams.get('client_id');
                    if (!clientId) {
                        return jsonResponse({ error: 'missing_client_id' }, 400, cors);
                    }
                    const client = await getOAuthClient(env.db, clientId);
                    if (!client) {
                        return jsonResponse({ error: 'invalid_client' }, 404, cors);
                    }
                    return jsonResponse({
                        name: client.name,
                        scope: client.scope || 'openid profile email'
                    }, 200, cors);
                }
                if (path === "/api/oauth/token" && method === 'POST') {
                    return exchangeOAuthToken(request, env);
                }
                if (path === "/api/oauth/verify" && method === "GET") {
                    const result = await verifyBearerToken(request, env);
                    if (!result.valid) {
                        return jsonResponse({ valid: false, error: result.error }, 401, cors);
                    }
                    return jsonResponse({ valid: true, user: result.user }, 200, cors);
                }
            }

            if (path === "/oauth2/consent" && method === "GET") {
                const [authStatus, user] = await checkAuth(request, env);
                if (authStatus !== TAG_LOGGEDIN) {
                    const loginUrl = new URL('/oauth2/login', url.origin);
                    loginUrl.searchParams.set('redirect_url', request.url);
                    return new Response(null, {
                        status: 302,
                        headers: { Location: loginUrl.toString(), ...cors }
                    });
                }
                const clientId = url.searchParams.get('client_id');
                if (clientId) {
                    const client = await getOAuthClient(env.db, clientId);
                    if (!client) {
                        return new Response(null, {
                            status: 302,
                            headers: { Location: '/oauth2/invalid_client', ...cors }
                        });
                    }
                }
                const staticUrl = new URL('/oauth2/consent.html', url.origin);
                staticUrl.search = url.search;
                return env.assets.fetch(new Request(staticUrl.toString(), request));
            }
            return env.assets.fetch(request);
        } catch (error) {
            console.error("Unhandled error:", error);
            return jsonResponse(
                { action: "none", error: "Internal Server Error", error_code: 1018 },
                500,
                cors,
            );
        }
    },
};
