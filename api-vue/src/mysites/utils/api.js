// src/mysites/utils/api.js

// 站点统计与目录都在 mysites worker 上
const ANALYTICS_BASE = "https://mysites.undz.cn";

async function request(endpoint, options = {}) {
  const response = await fetch(`${ANALYTICS_BASE}/api/${endpoint}`, {
    method: options.method || "GET",
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers },
    body: options.body ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const err = new Error(
      data.error || data.message || `HTTP ${response.status}`,
    );
    err.status = response.status;
    throw err;
  }
  return data;
}

/**
 * 站点目录（免授权）：
 *   public —— 公开站点（普通用户不含自己的）
 *   mine   —— 自己的站点（未登录为空）
 */
export function getSites() {
  return request("sites");
}

/** 站点元信息：公开站点或登录后可见的站点 */
export function getSiteMeta(siteId, options = {}) {
  return request(`sites/${siteId}`, options);
}

/** 单站点统计（公开站点未登录也可读，按分享配置裁剪） */
export function getSiteStats(siteId, range = "7d", options = {}) {
  return request(
    `sites/${siteId}/stats?range=${encodeURIComponent(range)}`,
    options,
  );
}

export function getSiteRealtime(siteId, options = {}) {
  return request(`sites/${siteId}/realtime`, options);
}
