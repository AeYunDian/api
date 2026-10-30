// oauth/clients.js —— 由 ayOnline.js 拆分而来（逐行搬运，未改逻辑）
// OAuth 客户端（第三方应用）的注册与查询。

import { DEFAULT_OAUTH_CLIENT_SCOPE } from "../config.js";

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
 * await registerOAuthClient(
 *   db,
 *   'app_chat',
 *   generateToken(),
 *   '聊天助手',
 *   'https://chat.undz.cn/oauth/callback,http://test.undz.cn:8080/callback'
 * );
 */
async function registerOAuthClient(
  db,
  clientId,
  clientSecret,
  name,
  redirectUris,
  userId,
  scope = DEFAULT_OAUTH_CLIENT_SCOPE,
  trusted = 0,
  user_sub,
) {
  const now = Math.floor(Date.now() / 1000);
  await db
    .prepare(
      `INSERT INTO oauth_clients (client_id, client_secret, name, redirect_uris, scope, trusted, user_id, created_at, updated_at, user_sub)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      clientId,
      clientSecret,
      name,
      redirectUris,
      scope,
      trusted,
      userId,
      now,
      now,
      user_sub,
    )
    .run();
}

async function getOAuthClient(db, clientId) {
  const client = await db
    .prepare("SELECT * FROM oauth_clients WHERE client_id = ?")
    .bind(clientId)
    .first();
  return client;
}
function validateRedirectUri(allowedUris, redirectUri) {
  // allowedUris 是逗号分隔的字符串，转为数组
  const uris = allowedUris.split(",").map((u) => u.trim());
  return uris.includes(redirectUri);
}

export { registerOAuthClient, getOAuthClient, validateRedirectUri };
