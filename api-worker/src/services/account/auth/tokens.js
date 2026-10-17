// auth/tokens.js —— 由 ayOnline.js 拆分而来（逐行搬运，未改逻辑）
// 刷新令牌在 KV 里的存取与撤销。
// 每个用户的 token 另外维护一份列表，用于「退出所有设备 / 撤销某应用」。

import { KV_PREFIX, REFRESH_TOKEN_TTL } from "../config.js";

async function storeRefreshToken(
  kv,
  token,
  userId,
  ttlSeconds,
  clientId = null,
) {
  let value;
  if (clientId) {
    value = JSON.stringify({
      userId,
      clientId,
      createdAt: Math.floor(Date.now() / 1000),
    });
  } else {
    value = JSON.stringify({
      userId,
      createdAt: Math.floor(Date.now() / 1000),
    });
  }
  await kv.put(`${KV_PREFIX.REFRESH}${token}`, value, {
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
  const stored = await kv.get(`${KV_PREFIX.REFRESH}${token}`);
  if (!stored) return null;
  try {
    const parsed = JSON.parse(stored);
    if (parsed && typeof parsed.userId === "number") {
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
  await kv.delete(`${KV_PREFIX.REFRESH}${token}`);
  if (userId) {
    await removeRefreshTokenFromUserList(kv, userId, token);
  }
}
// ---------- 用户 Refresh Token 列表管理（用于批量撤销） ----------
async function addRefreshTokenForUser(kv, userId, token) {
  const key = `${KV_PREFIX.USER_TOKENS}${userId}`;
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
  await kv.deleteByKeyAndValue(`${KV_PREFIX.REFRESH}%`, String(userId));
  await kv.delete(`${KV_PREFIX.USER_TOKENS}${userId}`);
}

// 登出时单独移除某个 token
async function removeRefreshTokenFromUserList(kv, userId, token) {
  const key = `${KV_PREFIX.USER_TOKENS}${userId}`;
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

export { storeRefreshToken, isVersionValid, getUserIdFromRefreshToken, deleteRefreshToken, addRefreshTokenForUser, revokeAllUserRefreshTokens, removeRefreshTokenFromUserList };
