// src/utils/api.js
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://online.undz.cn';
const SDK_VERSION = import.meta.env.VITE_APP_SDK_VER || '0';
const APP_ID = import.meta.env.VITE_APP_ID;

/**
 * 通用 fetch 包装器
 */
async function request(endpoint, options = {}) {
    const url = `${BASE_URL}/api/ayonline/${endpoint}`;

    // 合并请求头，自动添加必需的头
    const headers = {
        'Content-Type': 'application/json',
        'X-App-Id': APP_ID,
        'X-Sdk-Ver': SDK_VERSION,
        ...options.headers,
    };

    const response = await fetch(url, {
        method: options.method || 'GET',
        credentials: 'include', // 携带 Cookie
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(data.error || data.message || `Request failed with status ${response.status}`);
    }
    return data;
}

// ---------- 导出各个接口 ----------
export function updateProfile(profileData) {
    return request('update-profile', {
        method: 'POST',
        body: profileData,
    });
}

export function getDeviceCount() {
    return request('device-count');
}

export function revokeAllDevices() {
    return request('revoke-all-devices', {
        method: 'POST',
    });
}

export function getOAuthApps() {
    return request('oauth-apps');
}

/**
 * 撤销所有 OAuth 授权设备的刷新令牌
 * 仅撤销通过 OAuth 2.0 授权流程签发的 token，不影响普通登录设备
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export async function revokeOAuthTokens() {
    return request('revoke-oauth-tokens', {
        method: 'POST',
    });
}
export async function revokeOAuthApp(clientId) {
    return request('revoke-oauth-app', {
        method: 'POST',
        body: { client_id: clientId },
    });
}
// src/utils/api.js

/**
 * 获取用户已绑定的第三方账号列表
 */
export function getBindings() {
    return request('oauth-bindings', { method: 'GET' });
}

/**
 * 解绑第三方账号
 * @param {string} provider - 平台名称（如 'yzhyzxy', 'github'）
 */
export function unbindProvider(provider) {
    return request('oauth-unbind', {
        method: 'POST',
        body: { provider },
    });
}

/**
 * 获取第三方绑定授权链接
 * @param {string} provider - 平台名称（如 'yzhyzxy'）
 * @param {string} mode - 'login' 或 'register'（绑定用 'register'）
 * @returns {Promise<string>} 授权 URL
 */
export async function getBindUrl(provider, mode = 'register') {
    const response = await fetch(
        `${BASE_URL}/api/auth/${provider}/start?mode=${mode}`,
        {
            credentials: 'include',
        }
    );
    const data = await response.json();
    if (!response.ok || !data.url) {
        throw new Error(data.error || '获取授权链接失败');
    }
    return data.url; // 返回 URL 字符串
}