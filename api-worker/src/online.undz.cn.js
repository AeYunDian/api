// online.undz.cn.js
// ============================================================
// AY 统一身份认证中心 (online.undz.cn)
// 功能：注册、登录、登出、验证、刷新令牌、OAUTH
// 技术栈：Cloudflare Workers + D1 + KV + JWT (jose) + cookie
// ============================================================

import { SignJWT, jwtVerify } from "jose";
import { serialize, parse } from "cookie";
import { base64ToUtf8, generateToken, generateRandomBytes, getMainPage, generatePKCEPair } from "./utils.js";
import { handleVerifyCode } from "./mail_verify/verify.js";
import { REG_TEMPLATE, handleSendVerification } from "./mail_verify/send.js";


import { createKvStore } from './kvWithD1.js';


var kvStore = null;

// ---------- 常量与配置 ----------
const SDK_VER = "2.0.2";
const JWT_ALG = "HS256";
const ACCESS_TOKEN_EXPIRES_IN = "15m"; // 访问令牌有效期
const OAUTH_TOKEN_EXPIRES_IN = 300; // Oauth token 有效期 5m
const REFRESH_TOKEN_TTL = 60 * 60 * 24 * 30; // 刷新令牌有效期（秒），30天
const OAUTH_REFRESH_TOKEN_TTL = 60 * 60 * 24 * 15; // OAuth客户端刷新令牌有效期（秒），15天
const PBKDF2_ITERATIONS = 100000;
const PBKDF2_HASH = "SHA-256";
const SALT_LENGTH = 16; // 字节
const DEFAULT_OAUTH_CLIENT_SCOPE = 'openid profile email'
const MIN_PASSWORD_LENGTH = 6;
const MAX_PASSWORD_LENGTH = 32;
const MIN_USERNAME_LENGTH = 4;
const MAX_USERNAME_LENGTH = 20;
const VERIFY_CODE_EXPDATA = 300;
export const TAG_LOGGEDIN = "logged_in";
export const TAG_NOT_LOGGEDIN = "not_logged_in";
export const TAG_BANNED = "banned";
const YZHYZXY_AUTH_URL = 'https://yzhyzxy.cn/oauth/authorize';
const YZHYZXY_TOKEN_URL = 'https://yzhyzxy.cn/oauth/token';
const YZHYZXY_USERINFO_URL = 'https://yzhyzxy.cn/oauth/userinfo';
const YZHYZXY_REVOKE_URL = 'https://yzhyzxy.cn/api/oauth/revoke';
const YZHYZXY_REDIRECT_URI = 'https://online.undz.cn/api/oauth/callback';
const YZHYZXY_SCOPE = 'openid profile email';

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
    "https://console.undz.cn",
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

// ---------- 输入校验函数 ----------
function validateEmail(email) {
    const re = /^[A-Za-z0-9\u4e00-\u9fa5]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/;
    return re.test(email);
}

function validatePassword(password) {
    const allowed = /^[a-zA-Z0-9\-_=+@#$%]+$/;
    if (!allowed.test(password)) return false;
    if (password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) return false;
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
    try {
        await db
            .prepare(
                `CREATE TABLE IF NOT EXISTS online_users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_salt TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            banned INTEGER DEFAULT 0,
            ban_reason TEXT DEFAULT ''
        )`,
            ).run();
        await db
            .prepare(
                `CREATE TABLE IF NOT EXISTS oauth_clients (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                client_id TEXT UNIQUE NOT NULL,
                client_secret TEXT NOT NULL,
                name TEXT NOT NULL,
                redirect_uris TEXT NOT NULL,
                scope TEXT DEFAULT '${DEFAULT_OAUTH_CLIENT_SCOPE}',
                trusted BOOLEAN DEFAULT 0,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            )`
            ).run();

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
            ).run();
        await db
            .prepare(`
    CREATE TABLE IF NOT EXISTS oauth_consent_requests (
        id TEXT PRIMARY KEY,
        client_id TEXT NOT NULL,
        redirect_uri TEXT NOT NULL,
        scope TEXT,
        state TEXT,
        user_id INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        expires_at INTEGER NOT NULL,
        status TEXT DEFAULT 'pending',
        consent_token TEXT NOT NULL
    )`).run();
        await db
            .prepare(
                `CREATE TABLE IF NOT EXISTS oauth_connections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            provider TEXT NOT NULL,
            openid TEXT NOT NULL,
            user_id INTEGER NOT NULL,
            created_at INTEGER NOT NULL,
            UNIQUE(provider, openid)
        )`
            )
            .run();
        await db
            .prepare(`CREATE INDEX IF NOT EXISTS idx_oauth_connections_user ON oauth_connections(user_id)`)
            .run();
        await db
            .prepare(`CREATE INDEX IF NOT EXISTS idx_consent_requests_expires ON oauth_consent_requests(expires_at)`)
            .run();
        await db
            .prepare(`CREATE INDEX IF NOT EXISTS idx_consent_requests_status ON oauth_consent_requests(status)`)
            .run();
        await db
            .prepare(`CREATE INDEX IF NOT EXISTS idx_oauth_codes_used ON oauth_auth_codes(used)`)
            .run();
        await db
            .prepare(`CREATE INDEX IF NOT EXISTS idx_oauth_codes_expires ON oauth_auth_codes(expires_at)`)
            .run();
        await db
            .prepare(
                `CREATE INDEX IF NOT EXISTS idx_username ON online_users(username)`)
            .run();
        await db
            .prepare(`CREATE INDEX IF NOT EXISTS idx_email ON online_users(email)`)
            .run();
        const clientExists = await db.prepare(`SELECT COUNT(*) as cnt FROM oauth_clients WHERE client_id = 'app_chat'`).first();
        if (!clientExists || clientExists.cnt === 0) {
            const now = Math.floor(Date.now() / 1000);
            await db.prepare(`
                INSERT INTO oauth_clients (client_id, client_secret, name, redirect_uris, scope, trusted, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `).bind('app_chat', generateToken(), '聊天助手', 'https://chat.undz.cn/oauth/callback,http://test.undz.cn:8080/callback', DEFAULT_OAUTH_CLIENT_SCOPE, 0, now, now).run();
        }
        return { success: true, message: 'Database initialized' };
    } catch (err) {
        console.error('initDatabase error:', err);
        throw err; // 向上抛出，由上层处理
    }
}
/**
 * 注册一个新的 OAuth 客户端应用。
 * 
 * 此函数向 `oauth_clients` 表中插入一条客户端记录，用于 OAuth 2.0 授权流程。
 * 通常在系统初始化时或通过管理后台调用。
 * 
 * @param {import('@cloudflare/workers-types').D1Database} db - Cloudflare D1 数据库实例
 * @param {string} clientId - 客户端唯一标识符（由调用方生成，如 `generateToken()`）
 * @param {string} clientSecret - 客户端密钥（用于令牌交换时的认证，应妥善保管）
 * @param {string} name - 应用名称（显示在授权确认页面等场景）
 * @param {string} redirectUris - 允许的回调地址，多个以逗号分隔（如 'https://app.com/callback,http://localhost:8080/callback'）
 * @param {string} [scope=DEFAULT_OAUTH_CLIENT_SCOPE] - 默认请求的权限范围（空格分隔）
 * @param {number} [trusted=0] - 是否信任该客户端（1=信任，0=不信任，影响某些安全策略，当前未使用）
 * @returns {Promise<void>} 无返回值（插入操作异步完成）
 * 
 * @throws {Error} 如果客户端 ID 已存在，D1 会抛出 UNIQUE 约束错误，调用方需捕获处理。
 * 
 * @example
 * // 在 initDatabase 中调用
 * await registerOAuthClient(
 *   db,
 *   'app_chat',
 *   generateToken(),
 *   '聊天助手',
 *   'https://chat.undz.cn/oauth/callback,http://test.undz.cn:8080/callback'
 * );
 */
async function registerOAuthClient(db, clientId, clientSecret, name, redirectUris, scope = DEFAULT_OAUTH_CLIENT_SCOPE, trusted = 0) {
    const now = Math.floor(Date.now() / 1000);
    await db
        .prepare(
            `INSERT INTO oauth_clients (client_id, client_secret, name, redirect_uris, scope, trusted, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(clientId, clientSecret, name, redirectUris, scope, trusted, now, now)
        .run();
}
/**
 * 使用 refresh_token 刷新访问令牌
 * @param {string} refreshToken - 刷新令牌
 * @param {string} clientId - 客户端 ID
 * @param {string} clientSecret - 客户端密钥
 * @param {Env} env - 环境
 * @returns {Promise<Object>} 返回新令牌或错误
 */
async function refreshAccessToken(refreshToken, clientId, clientSecret, env) {
    const client = await env.db
        .prepare('SELECT * FROM oauth_clients WHERE client_id = ?')
        .bind(clientId)
        .first();
    if (!client || client.client_secret !== clientSecret) {
        return {
            success: false,
            error: 'invalid_client',
            error_description: 'Invalid client credentials'
        };
    }

    const userId = await getUserIdFromRefreshToken(kvStore, refreshToken);
    if (!userId) {
        return {
            success: false,
            error: 'invalid_grant',
            error_description: 'Invalid or expired refresh token'
        };
    }

    const user = await env.db
        .prepare('SELECT id, username, email, banned, ban_reason FROM online_users WHERE id = ?')
        .bind(userId)
        .first();
    if (!user) {
        await deleteRefreshToken(kvStore, refreshToken);
        return {
            success: false,
            error: 'invalid_grant',
            error_description: 'User not found'
        };
    }

    if (user.banned === 1) {
        const banReason = user.ban_reason || null;
        return {
            success: false,
            error: 'access_denied',
            error_description: `User account is banned. Reason: ${banReason}.  You can read ban_reason to get full message.`,
            ban_reason: banReason
        };
    }

    // 生成新的 access_token
    const newAccessToken = await signAccessToken(
        { sub: user.id, username: user.username, email: user.email },
        env.JWT_KEY
    );

    // 返回响应
    return {
        success: true,
        data: {
            access_token: newAccessToken,
            token_type: 'Bearer',
            expires_in: 900,
            scope: client.scope
        }
    };
}
/**
 * 交换授权码为访问令牌
 * @param {Object} params - 参数对象
 * @param {string} params.code - 授权码
 * @param {string} params.clientId - 应用 ID
 * @param {string} params.clientSecret - 应用密钥
 * @param {string} params.redirectUri - 回调地址
 * @param {string} params.state - 状态参数（可选）
 * @param {Env} env - Cloudflare Workers 环境
 * @returns {Promise<Object>} 返回交换结果
 */
export async function exchangeOAuthToken(params, env) {
    const { code, clientId, clientSecret, redirectUri, state } = params;
    if (!code || !clientId || !clientSecret) {
        return {
            success: false,
            error: 'invalid_request',
            error_description: 'Missing required parameters'
        };
    }
    const client = await env.db
        .prepare('SELECT * FROM oauth_clients WHERE client_id = ?')
        .bind(clientId)
        .first();

    if (!client || client.client_secret !== clientSecret) {
        return {
            success: false,
            error: 'invalid_client',
            error_description: 'Invalid client credentials'
        };
    }

    const authCode = await env.db
        .prepare(
            `SELECT * FROM oauth_auth_codes 
             WHERE code = ? AND used = 0 AND expires_at > ?`
        )
        .bind(code, Math.floor(Date.now() / 1000))
        .first();

    if (!authCode) {
        return {
            success: false,
            error: 'invalid_grant',
            error_description: 'Invalid or expired authorization code'
        };
    }

    // 验证 redirect_uri 是否匹配
    if (authCode.redirect_uri !== redirectUri) {
        return {
            success: false,
            error: 'invalid_grant',
            error_description: 'Redirect URI mismatch'
        };
    }

    // 验证 state（如果提供）
    if (state && authCode.state && authCode.state !== state) {
        return {
            success: false,
            error: 'invalid_grant',
            error_description: 'State mismatch'
        };
    }

    await env.db
        .prepare('DELETE FROM oauth_auth_codes WHERE code = ?')
        .bind(code)
        .run();

    // 获取用户信息
    const user = await env.db
        .prepare('SELECT id, username, email, banned, ban_reason FROM online_users WHERE id = ?')
        .bind(authCode.user_id)
        .first();

    if (!user) {
        return {
            success: false,
            error: 'invalid_grant',
            error_description: 'User not found'
        };
    }
    if (user.banned === 1) {
        const banReason = user.ban_reason || null;
        return {
            success: false,
            error: 'access_denied',
            error_description: `User account is banned. Reason: ${banReason}. You can read ban_reason to get full message.`,
            ban_reason: banReason
        };
    }
    // 生成访问令牌
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

    // 生成刷新令牌
    const refreshToken = generateToken();
    await storeRefreshToken(
        kvStore,
        refreshToken,
        user.id,
        OAUTH_REFRESH_TOKEN_TTL,
        clientId
    );

    const scopes = (authCode.scope || '').split(' ').filter(s => s);
    const userData = { id: user.id };
    // 仅当请求了 profile 或 openid scope 时才返回 username
    if (scopes.includes('profile') || scopes.includes('openid')) {
        userData.username = user.username;
    }
    // 仅当请求了 email scope 时才返回 email
    if (scopes.includes('email')) {
        userData.email = user.email;
    }

    return {
        success: true,
        data: {
            access_token: accessToken,
            token_type: 'Bearer',
            expires_in: 900,
            refresh_token: refreshToken,
            scope: authCode.scope || client.scope,
            user: userData
        }
    };
}
/**
 * 撤销刷新令牌
 * @param {object} kv - kvStore 实例
 * @param {string} token - 要撤销的 refresh_token
 * @param {string} clientId - 客户端 ID
 * @param {string} clientSecret - 客户端密钥
 * @param {Env} env - 环境变量
 * @param {string} tokenTypeHint - 可选，'access_token' 或 'refresh_token'
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function revokeRefreshToken(kv, token, clientId, clientSecret, env, tokenTypeHint = 'refresh_token') {
    // 如果提示是 access_token，直接返回成功
    if (tokenTypeHint === 'access_token') {
        return { success: true };
    }

    // 验证客户端身份
    const client = await env.db
        .prepare('SELECT * FROM oauth_clients WHERE client_id = ? AND client_secret = ?')
        .bind(clientId, clientSecret)
        .first();
    if (!client) {
        return { success: false, error: 'invalid_client' };
    }
    if (token) {
        await deleteRefreshToken(kv, token);
    }
    return { success: true };
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
    if (username.length < MIN_USERNAME_LENGTH || username.length > MAX_USERNAME_LENGTH) {
        return {
            success: false,
            action: "register",
            code: 400,
            error_code: 1008,
            message: "Username must be between 4 and 20 characters"
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
async function storeRefreshToken(kv, token, userId, ttlSeconds, clientId = null) {
    let value;
    if (clientId) {
        value = JSON.stringify({ userId, clientId });
    } else {
        value = String(userId);
    }
    await kv.put(`refresh:${token}`, value, {
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
    const stored = await kv.get(`refresh:${token}`);
    if (!stored) return null;
    try {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed.userId === 'number') {
            return parsed.userId;
        }
        return parseInt(stored, 10);
    } catch {
        // 不是 JSON，直接转为数字
        return parseInt(stored, 10);
    }
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

async function revokeAllUserRefreshTokens(kv, userId) {
    await kv.deleteByKeyAndValue('refresh:%', String(userId));
    await kv.delete(`user_refresh_tokens:${userId}`);
}

// 登出时单独移除某个 token
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
        kvStore = createKvStore(env.db);
        if (method === "OPTIONS") {
            return handleOptions(request);
        }

        const cors = corsHeaders(request);

        try {
            if (path === "/api/auth/yzhyzxy/start" && method === "GET") {
                const { verifier, challenge } = await generatePKCEPair();
                const state = generateToken();
                const mode = url.searchParams.get('mode') || 'login';

                await kvStore.put(`oauth_pkce:${state}`, JSON.stringify({ verifier, mode }), {
                    expirationTtl: 600
                });

                const authUrl = new URL(YZHYZXY_AUTH_URL);
                authUrl.searchParams.set('client_id', env.YZHYZXY_CLIENT_ID);
                authUrl.searchParams.set('response_type', 'code');
                authUrl.searchParams.set('redirect_uri', YZHYZXY_REDIRECT_URI);
                authUrl.searchParams.set('state', state);
                authUrl.searchParams.set('scope', YZHYZXY_SCOPE);
                authUrl.searchParams.set('code_challenge', challenge);
                authUrl.searchParams.set('code_challenge_method', 'S256');

                // 返回 JSON，不是 HTML
                return jsonResponse({ url: authUrl.toString() }, 200, corsHeaders(request));
            }
            if (path === "/api/oauth/callback" && method === "GET") {
                const code = url.searchParams.get('code');
                const state = url.searchParams.get('state');
                const error = url.searchParams.get('error');

                if (error) {
                    return new Response(`授权失败: ${error}`, { status: 400 });
                }
                if (!code || !state) {
                    return new Response('Missing code or state', { status: 400 });
                }

                const storedData = await kvStore.get(`oauth_pkce:${state}`);
                if (!storedData) {
                    return new Response('Invalid or expired state', { status: 400 });
                }
                const { verifier, mode } = JSON.parse(storedData);
                await kvStore.delete(`oauth_pkce:${state}`);

                // 换取 access_token（PKCE 方式）
                const tokenBody = new URLSearchParams({
                    grant_type: 'authorization_code',
                    client_id: env.YZHYZXY_CLIENT_ID,
                    code: code,
                    code_verifier: verifier,
                    redirect_uri: YZHYZXY_REDIRECT_URI
                });

                const tokenRes = await fetch(YZHYZXY_TOKEN_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: tokenBody
                });
                const tokenData = await tokenRes.json();
                if (!tokenData.access_token) {
                    console.error('Token exchange failed:', tokenData);
                    return new Response('Failed to exchange token: ' + JSON.stringify(tokenData), { status: 500 });
                }

                // 获取用户信息（包含 openid、username、nickname、avatar、email）
                const userRes = await fetch(YZHYZXY_USERINFO_URL, {
                    headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
                });
                const userData = await userRes.json();
                if (!userData.openid) {
                    console.error('Failed to get userinfo:', userData);
                    return new Response('Failed to get userinfo', { status: 500 });
                }

                // 立即吊销 refresh_token（一次性使用）
                if (tokenData.refresh_token) {
                    try {
                        const revokeBody = new URLSearchParams({
                            token: tokenData.refresh_token,
                            token_type_hint: 'refresh_token',
                            client_id: env.YZHYZXY_CLIENT_ID,
                            client_secret: env.YZHYZXY_CLIENT_SECRET
                        });
                        await fetch(YZHYZXY_REVOKE_URL, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                            body: revokeBody
                        });
                        console.log('yzhyzxy refresh_token revoked');
                    } catch (err) {
                        console.error('Failed to revoke yzhyzxy refresh_token:', err);
                    }
                }

                // 处理登录/注册逻辑
                const openid = userData.openid;
                const provider = 'yzhyzxy';
                const username = userData.username || userData.nickname || `yz_${openid.slice(-8)}`;
                const email = userData.email || `${openid}@yzhyzxy.local`;
                const avatar = userData.avatar || '';

                let localUser = await env.db
                    .prepare('SELECT user_id FROM oauth_connections WHERE provider = ? AND openid = ?')
                    .bind(provider, openid)
                    .first();

                if (mode === 'login') {
                    if (localUser) {
                        const userId = localUser.user_id;
                        const user = await env.db
                            .prepare('SELECT id, username, email, banned, ban_reason FROM online_users WHERE id = ?')
                            .bind(userId)
                            .first();

                        if (user.banned) {
                            return new Response('账号已被封禁', { status: 403 });
                        }

                        const accessToken = await signAccessToken(
                            { sub: user.id, username: user.username, email: user.email },
                            env.JWT_KEY
                        );
                        const refreshToken = generateToken();
                        await storeRefreshToken(kvStore, refreshToken, user.id, REFRESH_TOKEN_TTL);

                        const cookieOptions = { domain: ".undz.cn", path: "/", httpOnly: true, secure: true, sameSite: "Lax", maxAge: REFRESH_TOKEN_TTL };
                        const setCookieHeaders = [
                            serialize('access_token', accessToken, cookieOptions),
                            serialize('refresh_token', refreshToken, cookieOptions)
                        ];

                        // 弹窗版 HTML：使用 window.opener 通知主窗口，然后自动关闭
                        const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>登录成功</title></head>
<body>
    <p style="text-align:center;margin-top:100px;font-size:18px;color:#1a73e8;">✅ 登录成功，窗口即将关闭...</p>
    <script>
        if (window.opener) {
            window.opener.postMessage({
                action: 'login_success',
                provider: 'yzhyzxy',
                user: { id: ${user.id}, username: "${user.username}", email: "${user.email}" }
            }, '*');
        }
        setTimeout(function() { window.close(); }, 1500);
    <\/script>
</body>
</html>
            `;

                        return new Response(html, {
                            status: 200,
                            headers: {
                                'Content-Type': 'text/html; charset=utf-8',
                                'Set-Cookie': setCookieHeaders.join(', ')
                            }
                        });
                    }

                    // 未关联账号：跳转到注册页面
                    const registerUrl = `/oauth2/login?tab=register&oauth_provider=yzhyzxy&openid=${openid}&username=${encodeURIComponent(username)}&email=${encodeURIComponent(email)}&avatar=${encodeURIComponent(avatar)}`;
                    return new Response(null, {
                        status: 302,
                        headers: { 'Location': registerUrl }
                    });
                }

                if (mode === 'register') {
                    if (localUser) {
                        // 已关联：跳转到登录页
                        const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>已注册</title></head>
<body>
    <p style="text-align:center;margin-top:100px;font-size:18px;">该账号已注册，请登录</p>
    <script>
        if (window.opener) {
            window.opener.postMessage({
                action: 'oauth_already_registered',
                provider: 'yzhyzxy',
                openid: "${openid}"
            }, '*');
        }
        setTimeout(function() { window.location.href = '/oauth2/login?tab=login'; }, 1500);
    <\/script>
</body>
</html>
            `;
                        return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
                    }

                    // 未注册：跳转到注册页面，自动填充信息
                    const registerUrl = `/oauth2/login?tab=register&oauth_provider=yzhyzxy&openid=${openid}&username=${encodeURIComponent(username)}&email=${encodeURIComponent(email)}&avatar=${encodeURIComponent(avatar)}`;
                    return new Response(null, {
                        status: 302,
                        headers: { 'Location': registerUrl }
                    });
                }

                return new Response('Invalid mode', { status: 400 });
            }
            if (path.startsWith("/api/ayonline/")) {
                if (path === "/api/ayonline/oauth/revoke-client" && method === "POST") {
                    const [authStatus, user] = await checkAuth(request, env);
                    if (authStatus !== TAG_LOGGEDIN) {
                        return jsonResponse({ error: "Unauthorized" }, 401, cors);
                    }
                    const body = await request.json().catch(() => null);
                    if (!body || !body.client_id) {
                        return jsonResponse({ error: "Missing client_id" }, 400, cors);
                    }
                    const clientId = body.client_id;
                    const client = await env.db
                        .prepare('SELECT client_id FROM oauth_clients WHERE client_id = ?')
                        .bind(clientId)
                        .first();
                    if (!client) {
                        return jsonResponse({ error: "Invalid client_id" }, 400, cors);
                    }
                    const deleteResult = await env.db
                        .prepare(
                            `DELETE FROM app_kv_store 
             WHERE key LIKE 'refresh:%' 
               AND json_extract(value, '$.userId') = ? 
               AND json_extract(value, '$.clientId') = ?`
                        )
                        .bind(user.id, clientId)
                        .run();
                    const listKey = `user_refresh_tokens:${user.id}`;
                    // 查询所有仍然有效的 refresh token（userId 匹配）
                    const remainingRows = await env.db
                        .prepare(
                            `SELECT key FROM app_kv_store 
             WHERE key LIKE 'refresh:%' 
               AND json_extract(value, '$.userId') = ?`
                        )
                        .bind(user.id)
                        .all();
                    const newTokenList = remainingRows.results.map(row => row.key.replace('refresh:', ''));
                    if (newTokenList.length > 0) {
                        await kvStore.put(listKey, JSON.stringify(newTokenList), {
                            expirationTtl: REFRESH_TOKEN_TTL
                        });
                    } else {
                        await kvStore.delete(listKey);
                    }

                    // 6. 返回成功
                    return jsonResponse({
                        success: true,
                        message: `Revoked all tokens for client ${clientId}`,
                        deleted_count: deleteResult.meta?.changes || 0
                    }, 200, cors);
                }
                if (path === "/api/ayonline/register-oauth-client" && method === "POST") {
                    const [authStatus, user] = await checkAuth(request, env);
                    if (authStatus !== TAG_LOGGEDIN) {
                        return jsonResponse({ error: "Unauthorized" }, 401, cors);
                    }
                    if (user.id !== 1) {
                        return jsonResponse({ error: "Forbidden: Admin only" }, 403, cors);
                    }

                    const body = await request.json().catch(() => null);
                    if (!body) {
                        return jsonResponse({ error: "Invalid JSON body" }, 400, cors);
                    }

                    const { client_id, client_secret, name, redirect_uris, scope, trusted } = body;
                    if (!client_id || !client_secret || !name || !redirect_uris) {
                        return jsonResponse({
                            error: "Missing required fields: client_id, client_secret, name, redirect_uris"
                        }, 400, cors);
                    }

                    const existing = await env.db
                        .prepare("SELECT client_id FROM oauth_clients WHERE client_id = ?")
                        .bind(client_id)
                        .first();
                    if (existing) {
                        return jsonResponse({
                            error: "Client ID already exists"
                        }, 409, cors);
                    }

                    try {
                        await registerOAuthClient(
                            env.db,
                            client_id,
                            client_secret,
                            name,
                            redirect_uris,
                            scope || DEFAULT_OAUTH_CLIENT_SCOPE,
                            trusted ? 1 : 0
                        );
                        return jsonResponse({
                            success: true,
                            message: "OAuth client registered successfully"
                        }, 201, cors);
                    } catch (err) {
                        console.error("Register OAuth client error:", err);
                        return jsonResponse({
                            error: "Failed to register client",
                            detail: err.message
                        }, 500, cors);
                    }
                }
                // ---------- 初始化数据库（需 Admin Key） ----------
                if (path === "/api/ayonline/init" && method === "POST") {
                    const authKey = request.headers.get("X-Admin-Key");
                    if (authKey !== env.KEY) {
                        return jsonResponse({ error: "Unauthorized" }, 401, cors);
                    }
                    try {
                        await initDatabase(env.db);
                        return jsonResponse({ success: true, message: "Database initialized" }, 200, cors);
                    } catch (err) {
                        console.error('Init failed:', err);
                        // 返回更详细的错误信息便于调试
                        return jsonResponse({
                            success: false,
                            error: 'Database initialization failed',
                            detail: err.message,
                            stack: err.stack
                        }, 500, cors);
                    }
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
                                const refreshToken = generateToken();
                                await storeRefreshToken(
                                    kvStore,
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
                                    kvStore,
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
                        await deleteRefreshToken(kvStore, refreshToken);
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
                    const userId = parseInt(payload.sub, 10);
                    const user = await env.db
                        .prepare("SELECT banned, ban_reason FROM online_users WHERE id = ?")
                        .bind(userId)
                        .first();
                    if (user && user.banned === 1) {
                        return jsonResponse({
                            valid: false,
                            banned: true,
                            error_code: 1017,
                            error: "Account banned",
                            ban_reason: user.ban_reason || "",
                        }, 403, cors);
                    }
                    return jsonResponse({
                        valid: true,
                        code: 200,
                        banned: false,
                        user: {
                            id: payload.sub,
                            username: payload.username,
                            email: payload.email,
                        },
                    }, 200, cors);
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

                    const userId = await getUserIdFromRefreshToken(kvStore, refreshToken);
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
                        await deleteRefreshToken(kvStore, refreshToken);
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

                // ---------- oauth 用户注册 ----------
                if (path === "/api/ayonline/register-oauth" && method === "POST") {
                    const body = await request.json().catch(() => null);
                    if (!body || !body.provider || !body.openid || !body.username || !body.email || !body.password) {
                        return jsonResponse({ error: "Missing required fields" }, 400, cors);
                    }

                    const { provider, openid, username, email, password, avatar } = body;

                    // 检查是否已被关联
                    const existing = await env.db
                        .prepare('SELECT user_id FROM oauth_connections WHERE provider = ? AND openid = ?')
                        .bind(provider, openid)
                        .first();
                    if (existing) {
                        return jsonResponse({ error: "This account is already linked" }, 409, cors);
                    }
                    // 注册用户
                    const registerResult = await registerUser(env.db, username, email, password);
                    if (!registerResult.success) {
                        return jsonResponse(registerResult, registerResult.code, cors);
                    }
                    // 获取用户 ID
                    const user = await env.db
                        .prepare('SELECT id FROM online_users WHERE username = ? OR email = ?')
                        .bind(username, email)
                        .first();
                    if (!user) {
                        return jsonResponse({ error: "User not found" }, 500, cors);
                    }
                    // 创建关联
                    const now = Date.now();
                    await env.db
                        .prepare(`INSERT INTO oauth_connections (provider, openid, user_id, created_at) VALUES (?, ?, ?, ?)`)
                        .bind(provider, openid, user.id, now)
                        .run();
                    // 生成令牌并登录
                    const accessToken = await signAccessToken(
                        { sub: user.id, username: username, email: email },
                        env.JWT_KEY
                    );
                    const refreshToken = generateToken();
                    await storeRefreshToken(kvStore, refreshToken, user.id, REFRESH_TOKEN_TTL);
                    const cookieOptions = { domain: ".undz.cn", path: "/", httpOnly: true, secure: true, sameSite: "Lax", maxAge: REFRESH_TOKEN_TTL };
                    const headers = new Headers(cors);
                    headers.append('Set-Cookie', serialize('access_token', accessToken, cookieOptions));
                    headers.append('Set-Cookie', serialize('refresh_token', refreshToken, cookieOptions));

                    return jsonResponse({
                        success: true,
                        action: 'register',
                        code: 200,
                        user: { id: user.id, username, email }
                    }, 200, headers);
                }
                return new Response(
                    getMainPage("Ay Account Center", "<h1>404 Not Found</h1>",
                        "<p>The page you are looking for cannot be found, please check and try again.</p>"),
                    {
                        status: 404, headers: { 'Content-Type': 'text/html', ...cors }
                    });
            }
            if (path.startsWith("/api/oauth/")) {
                if (path === "/api/oauth/authorize" && method === 'GET') {
                    const query = url.searchParams;
                    const clientId = query.get('client_id');
                    const redirectUri = query.get('redirect_uri');
                    const responseType = query.get('response_type');
                    const state = query.get('state') || '';
                    const scope = query.get('scope') || DEFAULT_OAUTH_CLIENT_SCOPE;

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
                        .prepare('SELECT id, name, redirect_uris, scope, trusted FROM oauth_clients WHERE client_id = ?')
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
                        const clearOptions = {
                            domain: ".undz.cn",
                            path: "/",
                            httpOnly: true,
                            secure: true,
                            sameSite: "Lax",
                            maxAge: 0,
                        };
                        const loginUrl = new URL('/oauth2/login', url.origin);
                        loginUrl.searchParams.set('redirect_url', request.url);
                        loginUrl.searchParams.set('client_id', clientId);
                        loginUrl.searchParams.set('scope', scope);
                        if (state) loginUrl.searchParams.set('state', state);
                        const client = await getOAuthClient(env.db, clientId);
                        if (client) loginUrl.searchParams.set('client_name', client.name);
                        const headers = new Headers({
                            Location: loginUrl.toString(),
                            ...cors
                        });
                        if (authStatus === TAG_BANNED) {
                            headers.append('Set-Cookie', serialize('access_token', '', clearOptions));
                            headers.append('Set-Cookie', serialize('refresh_token', '', clearOptions));
                        }
                        return new Response(null, { status: 302, headers });
                    }
                    if (authStatus === TAG_LOGGEDIN) {
                        const clientScopeArray = (client.scope || DEFAULT_OAUTH_CLIENT_SCOPE).split(' ').filter(s => s);
                        const requestScopeArray = scope.split(' ').filter(s => s);
                        let finalScopeArray = requestScopeArray.filter(s => clientScopeArray.includes(s));
                        if (finalScopeArray.length === 0) {
                            finalScopeArray = clientScopeArray;
                        }
                        const finalScope = finalScopeArray.join(' ');
                        if (client.trusted === 1) {
                            const code = generateToken();
                            const expiresAt = Math.floor(Date.now() / 1000) + OAUTH_TOKEN_EXPIRES_IN;
                            await env.db.prepare(
                                `INSERT INTO oauth_auth_codes (code, client_id, user_id, redirect_uri, scope, state, expires_at, used)
             VALUES (?, ?, ?, ?, ?, ?, ?, 0)`
                            ).bind(code, clientId, user.id, redirectUri, finalScope, state, expiresAt).run();

                            const redirectUrl = new URL(redirectUri);
                            redirectUrl.searchParams.set('code', code);
                            if (state) redirectUrl.searchParams.set('state', state);
                            return new Response(null, {
                                status: 302,
                                headers: { Location: redirectUrl.toString(), ...cors }
                            });
                        } else {
                            const requestId = generateToken();
                            const consentToken = generateToken();
                            const now = Math.floor(Date.now() / 1000);
                            const expiresAt = now + OAUTH_TOKEN_EXPIRES_IN;
                            await env.db.prepare(
                                `INSERT INTO oauth_consent_requests 
             (id, client_id, redirect_uri, scope, state, user_id, created_at, expires_at, status, consent_token)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`
                            ).bind(requestId, clientId, redirectUri, finalScope, state, user.id, now, expiresAt, consentToken).run();

                            const consentUrl = new URL('/oauth2/consent', url.origin);
                            consentUrl.searchParams.set('request_id', requestId);
                            return new Response(null, {
                                status: 302,
                                headers: { Location: consentUrl.toString(), ...cors }
                            });
                        }
                    }
                }
                if (path === "/api/oauth/token" && method === 'POST') {
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
                    const clientId = body.client_id;
                    const clientSecret = body.client_secret;

                    if (grantType === 'authorization_code') {
                        const result = await exchangeOAuthToken({
                            code: body.code,
                            clientId,
                            clientSecret,
                            redirectUri: body.redirect_uri,
                            state: body.state || null
                        }, env);
                        if (!result.success) {
                            // 构建基础错误体
                            const errorBody = {
                                error: result.error,
                                error_description: result.error_description
                            };
                            if (result.ban_reason) {
                                errorBody.ban_reason = result.ban_reason;
                            }
                            // 根据错误类型选择合适的 HTTP 状态码
                            let statusCode = 400;
                            if (result.error === 'invalid_client') {
                                statusCode = 401;
                            } else if (result.error === 'access_denied') {
                                statusCode = 403;  // 封禁时使用 403 Forbidden
                            }
                            return jsonResponse(errorBody, statusCode, cors);
                        }
                        return jsonResponse(result.data, 200, cors);
                    }
                    else if (grantType === 'refresh_token') {
                        const refreshToken = body.refresh_token;
                        if (!refreshToken) {
                            return jsonResponse({ error: 'invalid_request', error_description: 'Missing refresh_token' }, 400, cors);
                        }
                        const result = await refreshAccessToken(refreshToken, clientId, clientSecret, env);
                        if (!result.success) {
                            const errorBody = {
                                error: result.error,
                                error_description: result.error_description
                            };
                            if (result.ban_reason) {
                                errorBody.ban_reason = result.ban_reason;
                            }
                            let statusCode = 400;
                            if (result.error === 'invalid_client') {
                                statusCode = 401;
                            } else if (result.error === 'access_denied') {
                                statusCode = 403;
                            }
                            return jsonResponse(errorBody, statusCode, cors);
                        }
                        return jsonResponse(result.data, 200, cors);
                    }
                    else {
                        return jsonResponse({ error: 'unsupported_grant_type' }, 400, cors);
                    }
                }
                if (path === "/api/oauth/user/profile" && method === "GET") {
                    const result = await verifyBearerToken(request, env);
                    if (!result.valid) {
                        return jsonResponse({ error: result.error }, 401, cors);
                    }
                    const scopeList = (result.user.scope || '').split(' ');
                    if (!scopeList.includes('profile') && !scopeList.includes('openid')) {
                        return jsonResponse({
                            error: 'insufficient_scope',
                            error_description: 'Missing required scope: profile or openid'
                        }, 403, cors);
                    }
                    return jsonResponse({
                        id: result.user.id,
                        username: result.user.username,
                        // 此处可扩展
                    }, 200, cors);
                }

                if (path === "/api/oauth/user/email" && method === "GET") {
                    const result = await verifyBearerToken(request, env);
                    if (!result.valid) {
                        return jsonResponse({ error: result.error }, 401, cors);
                    }
                    const scopeList = (result.user.scope || '').split(' ');
                    if (!scopeList.includes('email')) {
                        return jsonResponse({
                            error: 'insufficient_scope',
                            error_description: 'Missing required scope: email'
                        }, 403, cors);
                    }
                    return jsonResponse({
                        email: result.user.email
                    }, 200, cors);
                }
                if (path === "/api/oauth/consent-data" && method === "GET") {
                    const requestId = url.searchParams.get('request_id');
                    if (!requestId) return jsonResponse({ error: 'missing_request_id' }, 400, cors);

                    // 验证用户登录
                    const [authStatus, user] = await checkAuth(request, env);
                    if (authStatus !== TAG_LOGGEDIN) return jsonResponse({ error: 'unauthorized' }, 401, cors);

                    // 查询请求记录
                    const req = await env.db.prepare(
                        `SELECT * FROM oauth_consent_requests WHERE id = ? AND status = 'pending' AND expires_at > ?`
                    ).bind(requestId, Math.floor(Date.now() / 1000)).first();
                    if (!req) return jsonResponse({ error: 'invalid_request' }, 400, cors);
                    if (req.user_id !== user.id) return jsonResponse({ error: 'forbidden' }, 403, cors);

                    // 查询应用名称
                    const client = await env.db.prepare(`SELECT name FROM oauth_clients WHERE client_id = ?`).bind(req.client_id).first();
                    return jsonResponse({
                        client_name: client ? client.name : req.client_id,
                        scope: req.scope || '',
                        consent_token: req.consent_token,
                        client_id: req.client_id,
                        redirect_uri: req.redirect_uri,
                        state: req.state || ''
                    }, 200, cors);
                }
                if (path === "/api/oauth/consent/approve" && method === "POST") {
                    const body = await request.json().catch(() => null);
                    const requestId = body?.request_id;
                    const consentToken = body?.consent_token;
                    if (!requestId || !consentToken) return jsonResponse({ error: 'missing_parameters' }, 400, cors);

                    const [authStatus, user] = await checkAuth(request, env);
                    if (authStatus !== TAG_LOGGEDIN) return jsonResponse({ error: 'unauthorized' }, 401, cors);

                    // 查询并校验 token
                    const req = await env.db.prepare(
                        `SELECT * FROM oauth_consent_requests WHERE id = ? AND consent_token = ? AND status = 'pending' AND expires_at > ?`
                    ).bind(requestId, consentToken, Math.floor(Date.now() / 1000)).first();
                    if (!req) return jsonResponse({ error: 'invalid_request' }, 400, cors);
                    if (req.user_id !== user.id) return jsonResponse({ error: 'forbidden' }, 403, cors);

                    // 生成授权码
                    const code = generateToken();
                    const expiresAt = Math.floor(Date.now() / 1000) + OAUTH_TOKEN_EXPIRES_IN;
                    await env.db.prepare(
                        `INSERT INTO oauth_auth_codes (code, client_id, user_id, redirect_uri, scope, state, expires_at, used)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0)`
                    ).bind(code, req.client_id, user.id, req.redirect_uri, req.scope, req.state, expiresAt).run();

                    await env.db.prepare(`DELETE FROM oauth_consent_requests WHERE id = ?`).bind(requestId).run();

                    const redirectUrl = new URL(req.redirect_uri);
                    redirectUrl.searchParams.set('code', code);
                    if (req.state) redirectUrl.searchParams.set('state', req.state);
                    return jsonResponse({ redirect_url: redirectUrl.toString() }, 200, cors);
                }
                if (path === "/api/oauth/consent/deny" && method === "POST") {
                    const body = await request.json().catch(() => null);
                    const requestId = body?.request_id;
                    const consentToken = body?.consent_token;
                    if (!requestId || !consentToken) return jsonResponse({ error: 'missing_parameters' }, 400, cors);

                    const [authStatus, user] = await checkAuth(request, env);
                    if (authStatus !== TAG_LOGGEDIN) return jsonResponse({ error: 'unauthorized' }, 401, cors);

                    const req = await env.db.prepare(
                        `SELECT * FROM oauth_consent_requests WHERE id = ? AND consent_token = ? AND status = 'pending' AND expires_at > ?`
                    ).bind(requestId, consentToken, Math.floor(Date.now() / 1000)).first();
                    if (!req) return jsonResponse({ error: 'invalid_request' }, 400, cors);
                    if (req.user_id !== user.id) return jsonResponse({ error: 'forbidden' }, 403, cors);
                    await env.db.prepare(`DELETE FROM oauth_consent_requests WHERE id = ?`).bind(requestId).run();

                    const redirectUrl = new URL(req.redirect_uri);
                    redirectUrl.searchParams.set('error', 'access_denied');
                    if (req.state) redirectUrl.searchParams.set('state', req.state);
                    return jsonResponse({ redirect_url: redirectUrl.toString() }, 200, cors);
                }
                if (path === "/api/oauth/verify" && method === "GET") {
                    const result = await verifyBearerToken(request, env);
                    if (!result.valid) {
                        return jsonResponse({ valid: false, error: result.error }, 401, cors);
                    }
                    return jsonResponse({ valid: true, user: result.user }, 200, cors);
                }
                if (path === "/api/oauth/revoke" && method === "POST") {
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

                    const token = body.token;
                    const tokenTypeHint = body.token_type_hint;
                    const clientId = body.client_id;
                    const clientSecret = body.client_secret;

                    if (!clientId || !clientSecret) {
                        return jsonResponse({ error: 'invalid_client' }, 401, cors);
                    }

                    const result = await revokeRefreshToken(kvStore, token, clientId, clientSecret, env, tokenTypeHint);
                    if (!result.success) {
                        return jsonResponse({ error: result.error }, 401, cors);
                    }
                    return jsonResponse({}, 200, cors);
                }
                return new Response(
                    getMainPage("Ay OAuth2.0 Center", "<h1>404 Not Found</h1>",
                        "<p>The page you are looking for cannot be found, please check and try again.</p>"),
                    {
                        status: 404, headers: { 'Content-Type': 'text/html', ...cors }
                    });

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
