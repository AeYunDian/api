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