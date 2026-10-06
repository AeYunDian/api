// src/mysites/utils/api.js

// 站点管理接口在 console worker 上
const CONSOLE_BASE = import.meta.env.PROD
  ? "https://console.undz.cn"
  : "https://console-dev.undz.cn";

// 统计数据接口在 mysites worker 上（与本页同源）
const ANALYTICS_BASE = import.meta.env.PROD
  ? "https://mysites.undz.cn"
  : "https://mysites-dev.undz.cn";

async function request(base, endpoint, options = {}) {
  const response = await fetch(`${base}/api/${endpoint}`, {
    method: options.method || "GET",
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers },
    body: options.body ? JSON.stringify(options.body) : undefined,
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

// —— 站点列表（来自 console） ——
export function getSites() {
  return request(CONSOLE_BASE, "console/sites");
}

// —— 单站点统计（来自 mysites worker） ——
export function getSiteStats(siteId, range = "7d") {
  return request(
    ANALYTICS_BASE,
    `sites/${siteId}/stats?range=${encodeURIComponent(range)}`,
  );
}

export function getSiteRealtime(siteId) {
  return request(ANALYTICS_BASE, `sites/${siteId}/realtime`);
}
