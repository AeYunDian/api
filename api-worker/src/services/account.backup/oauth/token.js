// oauth/token.js —— 由 ayOnline.js 拆分而来（逐行搬运，未改逻辑）
// OAuth 2.0 令牌流程：授权码交换、refresh_token 续期、撤销。

import { OAUTH_REFRESH_TOKEN_TTL } from "../config.js";
import { signAccessToken } from "../auth/jwt.js";
import { createKvStore } from "../../../shared/kvWithD1.js";
import { storeRefreshToken, deleteRefreshToken, getUserIdFromRefreshToken } from "../auth/tokens.js";
import { generateToken } from "../../../shared/utils.js";

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
    .prepare("SELECT * FROM oauth_clients WHERE client_id = ?")
    .bind(clientId)
    .first();
  if (!client || client.client_secret !== clientSecret) {
    return {
      success: false,
      error: "invalid_client",
      error_description: "Invalid client credentials",
    };
  }

  const userId = await getUserIdFromRefreshToken(createKvStore(env.db), refreshToken);
  if (!userId) {
    return {
      success: false,
      error: "invalid_grant",
      error_description: "Invalid or expired refresh token",
    };
  }

  const user = await env.db
    .prepare(
      "SELECT sub, username, email, banned, ban_reason, gender, avatar, description FROM online_users WHERE sub = ?",
    )
    .bind(userId)
    .first();
  if (!user) {
    await deleteRefreshToken(createKvStore(env.db), refreshToken);
    return {
      success: false,
      error: "invalid_grant",
      error_description: "User not found",
    };
  }

  if (user.banned === 1) {
    const banReason = user.ban_reason || null;
    return {
      success: false,
      error: "access_denied",
      error_description: `User account is banned. Reason: ${banReason}.  You can read ban_reason to get full message.`,
      ban_reason: banReason,
    };
  }

  // 生成新的 access_token
  const newAccessToken = await signAccessToken(
    {
      sub: user.sub,
      username: user.username,
      email: user.email,
      gender: user.gender,
      avatar: user.avatar,
      description: user.description,
    },
    env.JWT_KEY,
  );

  // 返回响应
  return {
    success: true,
    data: {
      access_token: newAccessToken,
      token_type: "Bearer",
      expires_in: 600,
      scope: client.scope,
    },
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
      error: "invalid_request",
      error_description: "Missing required parameters",
    };
  }
  const client = await env.db
    .prepare("SELECT * FROM oauth_clients WHERE client_id = ?")
    .bind(clientId)
    .first();

  if (!client || client.client_secret !== clientSecret) {
    return {
      success: false,
      error: "invalid_client",
      error_description: "Invalid client credentials",
    };
  }

  const authCode = await env.db
    .prepare(
      `SELECT * FROM oauth_auth_codes 
             WHERE code = ? AND used = 0 AND expires_at > ?`,
    )
    .bind(code, Math.floor(Date.now() / 1000))
    .first();

  if (!authCode) {
    return {
      success: false,
      error: "invalid_grant",
      error_description: "Invalid or expired authorization code",
    };
  }

  // 验证 redirect_uri 是否匹配
  if (authCode.redirect_uri !== redirectUri) {
    return {
      success: false,
      error: "invalid_grant",
      error_description: "Redirect URI mismatch",
    };
  }

  // 验证 state（如果提供）
  if (state && authCode.state && authCode.state !== state) {
    return {
      success: false,
      error: "invalid_grant",
      error_description: "State mismatch",
    };
  }

  await env.db
    .prepare("DELETE FROM oauth_auth_codes WHERE code = ?")
    .bind(code)
    .run();

  // 获取用户信息
  const user = await env.db
    .prepare(
      "SELECT sub, username, email, banned, ban_reason, gender, avatar, description FROM online_users WHERE sub = ?",
    )
    .bind(authCode.user_sub)
    .first();

  if (!user) {
    return {
      success: false,
      error: "invalid_grant",
      error_description: "User not found",
    };
  }
  if (user.banned === 1) {
    const banReason = user.ban_reason || null;
    return {
      success: false,
      error: "access_denied",
      error_description: `User account is banned. Reason: ${banReason}. You can read ban_reason to get full message.`,
      ban_reason: banReason,
    };
  }
  // 生成访问令牌
  const accessToken = await signAccessToken(
    {
      sub: user.sub,
      username: user.username,
      email: user.email,
      gender: user.gender,
      avatar: user.avatar,
      description: user.description,
      client_id: clientId,
      scope: authCode.scope || client.scope,
    },
    env.JWT_KEY,
  );

  // 生成刷新令牌
  const refreshToken = generateToken();
  await storeRefreshToken(
    createKvStore(env.db),
    refreshToken,
    user.sub,
    OAUTH_REFRESH_TOKEN_TTL,
    clientId,
  );

  const scopes = (authCode.scope || "").split(" ").filter((s) => s);
  const userData = { sub: user.sub };
  // 仅当请求了 profile 或 openid scope 时才返回 username
  if (scopes.includes("profile") || scopes.includes("openid")) {
    userData.username = user.username;
  }
  // 仅当请求了 email scope 时才返回 email
  if (scopes.includes("email")) {
    userData.email = user.email;
  }

  return {
    success: true,
    data: {
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: 600,
      refresh_token: refreshToken,
      scope: authCode.scope || client.scope,
      user: userData,
    },
  };
}
/**
 * 撤销刷新令牌
 * @param {object} kv - KV 适配器实例（createKvStore(env.db)）
 * @param {string} token - 要撤销的 refresh_token
 * @param {string} clientId - 客户端 ID
 * @param {string} clientSecret - 客户端密钥
 * @param {Env} env - 环境变量
 * @param {string} tokenTypeHint - 可选，'access_token' 或 'refresh_token'
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function revokeRefreshToken(
  kv,
  token,
  clientId,
  clientSecret,
  env,
  tokenTypeHint = "refresh_token",
) {
  // 如果提示是 access_token，直接返回成功
  if (tokenTypeHint === "access_token") {
    return { success: true };
  }

  // 验证客户端身份
  const client = await env.db
    .prepare(
      "SELECT * FROM oauth_clients WHERE client_id = ? AND client_secret = ?",
    )
    .bind(clientId, clientSecret)
    .first();
  if (!client) {
    return { success: false, error: "invalid_client" };
  }
  if (token) {
    await deleteRefreshToken(kv, token);
  }
  return { success: true };
}

export { refreshAccessToken };
