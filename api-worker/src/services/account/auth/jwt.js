// auth/jwt.js —— 由 ayOnline.js 拆分而来（逐行搬运，未改逻辑）
// 访问令牌（JWT）签发/校验，以及两种身份识别入口：
//   checkAuth(request, env)         —— 读 Cookie 里的 access_token（同域子服务用）
//   verifyBearerToken(request, env) —— 读 Authorization: Bearer（跨域 SDK 用）

import { SignJWT, jwtVerify } from "jose";
import { parse } from "cookie";
import {
  JWT_ALG,
  ACCESS_TOKEN_EXPIRES_IN,
  TAG_NOT_LOGGEDIN,
  TAG_BANNED,
} from "../config.js";

/**
 * Oauth 检查传入的请求是否已登录授权
 * @param {Request} request - 原始的 HTTP 请求对象
 * @param {Env} env - Cloudflare Workers 的环境绑定
 * @returns {Promise<[string, Object|null]>} - 返回认证状态和用户信息
 */
export async function verifyBearerToken(request, env) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { valid: false, error: "missing_token" };
    }
    const token = authHeader.slice(7); // 去掉 "Bearer "
    const payload = await verifyAccessToken(token, env.JWT_KEY);

    if (!payload) {
      return { valid: false, error: "invalid_token" };
    }

    // 目前没有权限管理，空着
    // 检查 token 是否包含特定的 scope（权限）
    // const scope = payload.scope || '';
    // if (!scope.includes('read_user')) { return { valid: false, error: 'insufficient_scope' }; }
    return {
      valid: true,
      user: {
        sub: payload.sub,
        username: payload.username,
        email: payload.email,
        gender: payload.gender,
        avatar: payload.avatar,
        description: payload.description,
        client_id: payload.client_id, // 哪个应用在调用
        scope: payload.scope,
      },
    };
  } catch (error) {
    return { valid: false, error: "server_error" };
  }
}
/**
 * 检查传入的请求是否已登录授权
 * @param {Request} request - 原始的 HTTP 请求对象
 * @param {Env} env - Cloudflare Workers 的环境绑定
 * @returns {Promise<[string, Object|null]>} - 返回认证状态和用户信息
 */
export async function checkAuth(request, env) {
  try {
    const cookies = parse(request.headers.get("Cookie") || "");
    const accessToken = cookies.access_token;

    if (!accessToken) {
      return [TAG_NOT_LOGGEDIN, null];
    }

    const payload = await verifyAccessToken(accessToken, env.JWT_KEY);
    if (!payload) {
      return [TAG_NOT_LOGGEDIN, null];
    }

    const userId = parseInt(payload.sub, 10);
    const user = await env.db
      .prepare(
        "SELECT sub, username, email, banned, ban_reason, gender, avatar, description FROM online_users WHERE sub = ?",
      )
      .bind(userId)
      .first();

    if (!user) {
      return [TAG_NOT_LOGGEDIN, null];
    }

    if (user.banned == 1) {
      return [
        TAG_BANNED,
        {
          sub: user.sub,
          username: user.username,
          email: user.email,
          gender: user.gender,
          avatar: user.avatar,
          description: user.description,
          ban_reason: user.ban_reason || "",
        },
      ];
    }

    return [
      "logged_in",
      {
        sub: user.sub,
        username: user.username,
        email: user.email,
        gender: user.gender,
        avatar: user.avatar,
        description: user.description,
      },
    ];
  } catch (error) {
    if (env.DEBUG) console.error("checkAuth error:", error);
    // 遇到异常视为未登录
    return [TAG_NOT_LOGGEDIN, null];
  }
}

async function signAccessToken(payload, secret) {
  const encoder = new TextEncoder();
  const key = encoder.encode(secret);
  const jwt = await new SignJWT(payload)
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRES_IN)
    .sign(key);
  return jwt;
}

async function verifyAccessToken(token, secret) {
  try {
    const encoder = new TextEncoder();
    const key = encoder.encode(secret);
    const { payload } = await jwtVerify(token, key);
    return payload;
  } catch {
    return null;
  }
}

export { signAccessToken, verifyAccessToken };
