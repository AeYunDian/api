// services/analytics/utils.js
// 无副作用的通用小工具。

export function clamp(value, max) {
  const s = String(value == null ? "" : value);
  return s.length > max ? s.slice(0, max) : s;
}

export function safeParseArray(raw, fallback = []) {
  try {
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function safeParseObject(raw, fallback = {}) {
  try {
    const parsed = JSON.parse(raw || "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : fallback;
  } catch {
    return fallback;
  }
}

/** 客户端 IP（Cloudflare 注入，本地可能不存在） */
export function clientIp(request) {
  return request.headers.get("cf-connecting-ip") || "0.0.0.0";
}

export function nowSec() {
  return Math.floor(Date.now() / 1000);
}

export function dayStr(date = new Date()) {
  const y = String(date.getUTCFullYear());
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function shiftDay(day, delta) {
  const t = Date.parse(day + "T00:00:00Z") + delta * 86400000;
  return dayStr(new Date(t));
}

/** Cloudflare 限流器：binding 缺失时（本地）直接放行 */
export async function allowRequest(env, binding, key) {
  const limiter = env && env[binding];
  if (!limiter) return true;
  try {
    const { success } = await limiter.limit({ key });
    return success !== false;
  } catch {
    return true;
  }
}
