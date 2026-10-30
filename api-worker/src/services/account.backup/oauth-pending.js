// oauth-pending.js —— OAuth 登录未绑定时的「待注册」票据
// 由 GitHub / Yzhyzxy 的 callback 写入，注册中间页读取并消费。

import { getKv } from "./auth/kv.js";
import { generateToken } from "../../shared/utils.js";

export function normalizeLogin(login, id) {
  let base = String(login || "")
    .replace(/[^a-zA-Z0-9_]/g, "_")
    .slice(0, 20);
  if (base.length < 4) base = `u_${id}`.slice(0, 20);
  return base;
}

export async function pickUsername(db, login, id) {
  const base = normalizeLogin(login, id);
  const candidates = [base];
  for (let i = 1; i <= 20; i++) {
    candidates.push(
      `${base.slice(0, 12)}_${String(id).slice(-4)}${i}`.slice(0, 20),
    );
  }
  for (const candidate of candidates) {
    const exists = await db
      .prepare("SELECT sub FROM online_users WHERE username = ?")
      .bind(candidate)
      .first();
    if (!exists) return candidate;
  }
  return `u_${String(id).slice(-10)}`;
}

/** 保存待注册资料，返回一次性 token（10 分钟） */
export async function savePending(env, data) {
  const token = generateToken();
  const proposedUsername = await pickUsername(
    env.db,
    data.login,
    data.openid,
  );
  const pending = {
    provider: data.provider,
    openid: data.openid,
    login: data.login,
    email: data.email,
    avatar: data.avatar || "",
    bio: data.bio || "",
    email_exists: Boolean(data.email_exists),
    proposed_username: proposedUsername,
    created_at: Date.now(),
  };

  await getKv().put(`oauth_pending:${token}`, JSON.stringify(pending), {
    expirationTtl: 600,
  });

  return { token, pending };
}

export async function readPending(env, token) {
  const stored = await getKv().get(`oauth_pending:${token}`);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export async function deletePending(env, token) {
  await getKv().delete(`oauth_pending:${token}`);
}
