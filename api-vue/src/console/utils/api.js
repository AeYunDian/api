// src/console/utils/api.js
const BASE_URL = import.meta.env.VITE_CONSOLE_API_BASE_URL || 'https://console.undz.cn';
const SDK_VERSION = import.meta.env.VITE_CONSOLE_APP_SDK_VER || '0';
const APP_ID = import.meta.env.VITE_CONSOLE_APP_ID;

/**
 * 通用 fetch 包装器
 * @param {string} endpoint - API 端点（如 'console/oauth/clients'）
 * @param {object} options - fetch 选项
 * @returns {Promise<any>}
 */
export async function request(endpoint, options = {}) {
    const url = `${BASE_URL}/api/${endpoint}`;

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    const response = await fetch(url, {
        method: options.method || 'GET',
        credentials: 'include', // 携带 Cookie（同域或跨子域自动带上）
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(data.error || data.message || `Request failed with status ${response.status}`);
    }
    return data;
}

// ========== OAuth 客户端管理 ==========

/**
 * 注册一个新的 OAuth 客户端
 * @param {object} params - 注册参数
 * @param {string} params.name - 应用名称
 * @param {string} params.redirect_uris - 回调地址（逗号分隔）
 * @param {string} [params.scope] - 权限范围（默认 'openid profile email'）
 * @param {boolean} [params.trusted] - 是否受信任
 * @returns {Promise<{ success: boolean, client_id: string, client_secret: string }>}
 */
export function registerClient({ name, redirect_uris, scope, trusted }) {
    return request('console/oauth/client/register', {
        method: 'POST',
        body: { name, redirect_uris, scope, trusted },
    });
}

/**
 * 获取当前用户的所有 OAuth 客户端（管理员可获取全部）
 * @returns {Promise<{ clients: Array }>}
 */
export function getClients() {
    return request('console/oauth/clients');
}

/**
 * 删除指定的 OAuth 客户端
 * @param {string} clientId - 客户端 ID
 * @returns {Promise<{ success: boolean }>}
 */
export function deleteClient(clientId) {
    return request(`console/oauth/client/${clientId}`, {
        method: 'DELETE',
    });
}

// ========== 用户管理（仅管理员） ==========

/**
 * 封禁/解封用户（仅管理员）
 * @param {number} userId - 目标用户 ID
 * @param {boolean} banned - true 封禁，false 解封
 * @param {string} [ban_reason] - 封禁原因
 * @returns {Promise<{ success: boolean }>}
 */
export function banUser(userId, banned = true, ban_reason = '') {
    return request('console/user/ban', {
        method: 'POST',
        body: { user_id: userId, banned, ban_reason },
    });
}

/**
 * 获取所有用户列表（仅管理员）
 * @returns {Promise<{ users: Array }>}
 */
export function getUsers() {
    return request('console/users');
}