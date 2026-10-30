// routes/github.js —— OAuth 登录（GitHub / Yzhyzxy 共用注册中间页）
// 流程：/start 返回授权 URL → 用户授权 → /callback 换 token
//   - 已绑定：直接登录
//   - 未绑定：跳 /oauth2/github_register 中间页，让用户填用户名/密码后注册
// 该模块同时承载 GitHub 的授权端点和通用的待注册/注册端点。

import { checkAuth, signAccessToken } from "../auth/jwt.js";
import { getKv } from "../auth/kv.js";
import { storeRefreshToken } from "../auth/tokens.js";
import { jsonResponse } from "../http.js";
import { serialize } from "cookie";
import {
  DEFAULT_USER_AVATAR,
  DEFAULT_USER_DESC,
  MAX_USERNAME_LENGTH,
  MIN_USERNAME_LENGTH,
  REFRESH_TOKEN_TTL,
  SALT_LENGTH,
  TAG_LOGGEDIN,
} from "../config.js";
import { hashPassword, toBase64, validatePassword } from "../auth/crypto.js";
import {
  generateRandomBytes,
  generateToken,
} from "../../../shared/utils.js";
import { ERROR_CODES } from "../../../shared/error-codes.js";
import {
  deletePending,
  pickUsername,
  readPending,
  savePending,
} from "../oauth-pending.js";

const PROVIDER = "github";
const GITHUB_AUTHORIZE = "https://github.com/login/oauth/authorize";
const GITHUB_TOKEN = "https://github.com/login/oauth/access_token";
const GITHUB_USER = "https://api.github.com/user";
const GITHUB_EMAILS = "https://api.github.com/user/emails";
const USER_AGENT = "ay-api/1.0";

/* ───────────────────────── 小工具 ───────────────────────── */

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** 内联到 <script> 里的 JSON：把 < 转义，避免 </script> 截断 */
function scriptJson(value) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

function htmlHeaders(cookies = []) {
  const headers = new Headers({
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
  });
  for (const cookie of cookies) headers.append("Set-Cookie", cookie);
  return headers;
}

function jsonHeaders(cookies = []) {
  const headers = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  for (const cookie of cookies) headers.append("Set-Cookie", cookie);
  return headers;
}

/**
 * 在弹窗里给 opener 发消息并关闭。
 * action: login_success | login_fail | bind_success | bind_failed
 */
function messagePage({
  action,
  provider = PROVIDER,
  user = null,
  registered = false,
  message = "",
  error = "",
  code = null,
  status = 200,
  cookies = [],
}) {
  const payload = {
    action,
    provider,
    ...(user ? { user } : {}),
    ...(registered ? { registered: true } : {}),
    ...(message ? { message } : {}),
    ...(error ? { error } : {}),
    ...(code ? { code } : {}),
  };

  const title =
    action === "login_success"
      ? "登录成功"
      : action === "bind_success"
        ? "绑定成功"
        : "操作失败";
  const hint =
    action === "login_fail" || action === "bind_failed"
      ? `${escapeHtml(message || "操作失败")}，窗口即将关闭…`
      : `${title}，窗口即将关闭…`;

  const html = `<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} - AyAccount</title>
<style>
*{box-sizing:border-box}html,body{height:100%;margin:0}
body{display:flex;align-items:center;justify-content:center;background:#f4f2f9;
  font-family:Roboto,-apple-system,"PingFang SC","Microsoft YaHei",sans-serif;color:#1d1b20}
.card{max-width:360px;padding:32px;text-align:center;background:#fef7ff;border:1px solid #eaddf2;
  border-radius:24px;box-shadow:0 12px 24px rgba(103,80,164,.1)}
h1{font-size:18px;font-weight:500;margin:0 0 8px}
p{font-size:13px;line-height:1.6;color:#49454f;margin:0}
</style></head>
<body><div class="card"><h1>${title}</h1><p>${hint}</p></div>
<script>
(function () {
  var payload = ${scriptJson(payload)};
  try {
    if (window.opener) window.opener.postMessage(payload, "*");
  } catch (e) {}
  setTimeout(function () { window.close(); }, 300);
})();
</script>
</body></html>`;

  return new Response(html, { status, headers: htmlHeaders(cookies) });
}

function failPage(message, code, status = 400, provider = PROVIDER) {
  return messagePage({ action: "login_fail", provider, message, code, status });
}

function bindFailPage(message, error, code, status = 400, provider = PROVIDER) {
  return messagePage({
    action: "bind_failed",
    provider,
    message,
    error,
    code,
    status,
  });
}

/* ───────────────────────── Token / 建号 ───────────────────────── */

async function issueTokens(env, user) {
  const accessToken = await signAccessToken(
    {
      sub: user.sub,
      username: user.username,
      email: user.email,
      gender: user.gender,
      avatar: user.avatar,
      description: user.description,
      created_at: user.created_at,
    },
    env.JWT_KEY,
  );

  const refreshToken = generateToken();
  await storeRefreshToken(
    getKv(),
    refreshToken,
    user.sub,
    REFRESH_TOKEN_TTL,
  );

  const cookieOptions = {
    domain: ".undz.cn",
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    maxAge: REFRESH_TOKEN_TTL,
  };

  return {
    accessToken,
    refreshToken,
    cookies: [
      serialize("access_token", accessToken, cookieOptions),
      serialize("refresh_token", refreshToken, cookieOptions),
    ],
  };
}

async function loginResponse(env, user, registered = false, provider = PROVIDER) {
  const tokens = await issueTokens(env, user);
  return messagePage({
    action: "login_success",
    provider,
    registered,
    user: {
      sub: user.sub,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
    },
    cookies: tokens.cookies,
  });
}

async function loginJsonResponse(
  env,
  user,
  registered = false,
  provider = PROVIDER,
) {
  const tokens = await issueTokens(env, user);
  return new Response(
    JSON.stringify({
      success: true,
      provider,
      registered,
      user: {
        sub: user.sub,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
      },
    }),
    { status: 200, headers: jsonHeaders(tokens.cookies) },
  );
}

async function createUserFromPending(db, pending, username, password) {
  const finalUsername =
    username ||
    pending.proposed_username ||
    (await pickUsername(db, pending.login, pending.openid));

  const finalPassword =
    password ||
    Array.from(generateRandomBytes(24))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

  const now = Date.now();
  const salt = generateRandomBytes(SALT_LENGTH);
  const hash = await hashPassword(finalPassword, salt);

  const result = await db
    .prepare(
      `INSERT INTO online_users
         (username, email, gender, avatar, description,
          password_salt, password_hash, created_at, updated_at)
       VALUES (?, ?, 'unknown', ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      finalUsername,
      pending.email,
      pending.avatar || DEFAULT_USER_AVATAR,
      pending.bio || DEFAULT_USER_DESC,
      toBase64(salt),
      toBase64(hash),
      now,
      now,
    )
    .run();

  const sub = result.meta.last_row_id;
  await db
    .prepare(
      `INSERT INTO oauth_connections (provider, openid, user_sub, created_at)
       VALUES (?, ?, ?, ?)`,
    )
    .bind(pending.provider, pending.openid, sub, now)
    .run();

  return db
    .prepare(
      "SELECT sub, username, email, gender, avatar, description, created_at FROM online_users WHERE sub = ?",
    )
    .bind(sub)
    .first();
}

/* ───────────────────────── GitHub API ───────────────────────── */

async function exchangeCode(env, code) {
  const res = await fetch(GITHUB_TOKEN, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      "User-Agent": USER_AGENT,
    },
    body: new URLSearchParams({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: env.GITHUB_REDIRECT_URI,
    }),
  });
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  return data && data.access_token ? data : null;
}

async function fetchGithubUser(accessToken) {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/vnd.github+json",
    "User-Agent": USER_AGENT,
  };
  const userRes = await fetch(GITHUB_USER, { headers });
  if (!userRes.ok) return null;
  const user = await userRes.json().catch(() => null);
  if (!user || !user.id) return null;

  let email = null;
  const emailRes = await fetch(GITHUB_EMAILS, { headers });
  if (emailRes.ok) {
    const list = await emailRes.json().catch(() => []);
    if (Array.isArray(list)) {
      const primary =
        list.find((item) => item.primary && item.verified) ||
        list.find((item) => item.verified);
      email = primary?.email || null;
    }
  }
  if (!email && user.email) email = user.email;

  return {
    id: String(user.id),
    login: user.login,
    name: user.name || user.login,
    email: email ? String(email).toLowerCase() : null,
    avatar: user.avatar_url || "",
    bio: user.bio || "",
  };
}

/* ───────────────────────── 入口 ───────────────────────── */

export async function handleGithubAuth({
  request,
  env,
  url,
  path,
  method,
  cors,
}) {
  /* ---------- 发起 GitHub 授权 ---------- */
  if (path === "/api/auth/github/start" && method === "GET") {
    const mode = url.searchParams.get("mode") === "bind" ? "bind" : "login";
    if (
      !env.GITHUB_CLIENT_ID ||
      !env.GITHUB_CLIENT_SECRET ||
      !env.GITHUB_REDIRECT_URI
    ) {
      return jsonResponse(
        {
          error_code: ERROR_CODES.GITHUB_NOT_CONFIGURED,
          error: "GitHub OAuth is not configured",
        },
        503,
        cors,
      );
    }

    const state = generateToken();
    await getKv().put(
      `github_state:${state}`,
      JSON.stringify({ mode }),
      { expirationTtl: 600 },
    );

    const authUrl = new URL(GITHUB_AUTHORIZE);
    authUrl.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
    authUrl.searchParams.set("redirect_uri", env.GITHUB_REDIRECT_URI);
    authUrl.searchParams.set("scope", "read:user user:email");
    authUrl.searchParams.set("state", state);

    return jsonResponse({ url: authUrl.toString() }, 200, cors);
  }

  /* ---------- GitHub 回调 ---------- */
  if (path === "/api/auth/github/callback" && method === "GET") {
    const oauthError = url.searchParams.get("error");
    if (oauthError) {
      return failPage(
        url.searchParams.get("error_description") || "GitHub 授权被取消",
        ERROR_CODES.GITHUB_CODE_INVALID,
        400,
      );
    }

    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    if (!code || !state) {
      return failPage("缺少 code 或 state", ERROR_CODES.GITHUB_CODE_INVALID);
    }

    const stored = await getKv().get(`github_state:${state}`);
    if (!stored) {
      return failPage(
        "登录状态已过期，请重试",
        ERROR_CODES.GITHUB_STATE_INVALID,
        400,
      );
    }
    await getKv().delete(`github_state:${state}`);

    let mode = "login";
    try {
      mode = JSON.parse(stored).mode || "login";
    } catch {
      /* ignore */
    }

    const tokenData = await exchangeCode(env, code);
    if (!tokenData) {
      return failPage(
        "GitHub 授权失败，请重试",
        ERROR_CODES.GITHUB_UPSTREAM_ERROR,
        502,
      );
    }

    const ghUser = await fetchGithubUser(tokenData.access_token);
    if (!ghUser) {
      return failPage(
        "获取 GitHub 用户信息失败",
        ERROR_CODES.GITHUB_UPSTREAM_ERROR,
        502,
      );
    }
    if (!ghUser.email) {
      return failPage(
        "GitHub 没有返回已验证邮箱，无法创建账号",
        ERROR_CODES.GITHUB_EMAIL_UNAVAILABLE,
        400,
      );
    }

    const connection = await env.db
      .prepare(
        "SELECT user_sub FROM oauth_connections WHERE provider = ? AND openid = ?",
      )
      .bind(PROVIDER, ghUser.id)
      .first();

    /* ---- 绑定模式：要求已登录 ---- */
    if (mode === "bind") {
      const [authStatus, currentUser] = await checkAuth(request, env);
      if (authStatus !== TAG_LOGGEDIN) {
        return bindFailPage(
          "请先登录 AyAccount 后再绑定 GitHub",
          "not_logged_in",
          ERROR_CODES.UNAUTHORIZED,
          401,
        );
      }
      if (connection) {
        if (connection.user_sub === currentUser.sub) {
          return messagePage({
            action: "bind_success",
            user: {
              sub: currentUser.sub,
              username: currentUser.username,
              email: currentUser.email,
            },
          });
        }
        return bindFailPage(
          "该 GitHub 已绑定其他 AyAccount",
          "already_bound",
          ERROR_CODES.GITHUB_ALREADY_BOUND,
          409,
        );
      }

      await env.db
        .prepare(
          `INSERT INTO oauth_connections (provider, openid, user_sub, created_at)
           VALUES (?, ?, ?, ?)`,
        )
        .bind(PROVIDER, ghUser.id, currentUser.sub, Date.now())
        .run();

      return messagePage({
        action: "bind_success",
        user: {
          sub: currentUser.sub,
          username: currentUser.username,
          email: currentUser.email,
        },
      });
    }

    /* ---- 已绑定：直接登录 ---- */
    if (connection) {
      const user = await env.db
        .prepare(
          "SELECT sub, username, email, banned, ban_reason, gender, avatar, description, created_at FROM online_users WHERE sub = ?",
        )
        .bind(connection.user_sub)
        .first();
      if (!user) {
        return failPage("绑定关系失效，请重新登录", ERROR_CODES.GITHUB_STATE_INVALID);
      }
      if (user.banned) {
        return failPage(
          `账号已被封禁：${user.ban_reason || "未提供原因"}`,
          ERROR_CODES.ACCOUNT_BANNED,
          403,
        );
      }
      return loginResponse(env, user, false);
    }

    /* ---- 未绑定：跳中间页，用户填用户名/密码后注册 ---- */
    const emailExists = await env.db
      .prepare("SELECT sub FROM online_users WHERE email = ?")
      .bind(ghUser.email)
      .first();

    const { token } = await savePending(env, {
      provider: PROVIDER,
      openid: ghUser.id,
      login: ghUser.login,
      email: ghUser.email,
      avatar: ghUser.avatar,
      bio: ghUser.bio,
      email_exists: Boolean(emailExists),
    });

    return new Response(null, {
      status: 302,
      headers: {
        Location: `/oauth2/github_register?token=${encodeURIComponent(token)}`,
        "Cache-Control": "no-store",
      },
    });
  }

  /* ---------- 中间页读取待注册信息（GitHub / Yzhyzxy 通用） ---------- */
  if (
    (path === "/api/auth/oauth/pending" ||
      path === "/api/auth/github/pending") &&
    method === "GET"
  ) {
    const token = url.searchParams.get("token") || "";
    if (!token) {
      return jsonResponse(
        {
          error_code: ERROR_CODES.GITHUB_PENDING_INVALID,
          error: "Missing token",
        },
        400,
        cors,
      );
    }

    const pending = await readPending(env, token);
    if (!pending) {
      return jsonResponse(
        {
          error_code: ERROR_CODES.GITHUB_PENDING_INVALID,
          error: "Registration session is invalid or expired",
        },
        401,
        cors,
      );
    }

    return jsonResponse(
      {
        provider: pending.provider,
        login: pending.login,
        email: pending.email,
        avatar: pending.avatar,
        bio: pending.bio,
        email_exists: Boolean(pending.email_exists),
        proposed_username: pending.proposed_username,
      },
      200,
      cors,
    );
  }

  /* ---------- 用户确认注册（自定义用户名 + 密码） ---------- */
  if (
    (path === "/api/auth/oauth/register" ||
      path === "/api/auth/github/register") &&
    method === "POST"
  ) {
    const wantsJson = (request.headers.get("Accept") || "").includes(
      "application/json",
    );
    const contentType = request.headers.get("Content-Type") || "";
    let token = null;
    let username = "";
    let password = "";

    if (contentType.includes("application/json")) {
      const body = await request.json().catch(() => null);
      token = body?.token || null;
      username = body?.username || "";
      password = body?.password || "";
    } else {
      const form = await request.formData().catch(() => null);
      token = form?.get("token") || null;
      username = form?.get("username") || "";
      password = form?.get("password") || "";
    }

    const registerFail = (message, code, status = 400) => {
      if (wantsJson) {
        return jsonResponse(
          { error_code: code, error: message },
          status,
          cors,
        );
      }
      return failPage(message, code, status);
    };

    if (!token) {
      return registerFail("缺少注册凭证", ERROR_CODES.GITHUB_PENDING_INVALID, 400);
    }

    const pending = await readPending(env, token);
    if (!pending) {
      return registerFail(
        "注册会话已过期，请重新登录",
        ERROR_CODES.GITHUB_PENDING_INVALID,
        401,
      );
    }

    const provider = pending.provider || PROVIDER;

    if (pending.email_exists) {
      return registerFail(
        "该邮箱已注册 AyAccount，请先登录后在账号设置中绑定",
        ERROR_CODES.GITHUB_EMAIL_REGISTERED,
        409,
      );
    }

    const emailOwner = await env.db
      .prepare("SELECT sub FROM online_users WHERE email = ?")
      .bind(pending.email)
      .first();
    if (emailOwner) {
      return registerFail(
        "该邮箱已注册 AyAccount，请先登录后在账号设置中绑定",
        ERROR_CODES.GITHUB_EMAIL_REGISTERED,
        409,
      );
    }

    const existingConnection = await env.db
      .prepare(
        "SELECT user_sub FROM oauth_connections WHERE provider = ? AND openid = ?",
      )
      .bind(provider, pending.openid)
      .first();
    if (existingConnection) {
      const user = await env.db
        .prepare(
          "SELECT sub, username, email, banned, ban_reason, gender, avatar, description, created_at FROM online_users WHERE sub = ?",
        )
        .bind(existingConnection.user_sub)
        .first();
      if (user) {
        if (user.banned) {
          return registerFail(
            `账号已被封禁：${user.ban_reason || "未提供原因"}`,
            ERROR_CODES.ACCOUNT_BANNED,
            403,
          );
        }
        await deletePending(env, token);
        return wantsJson
          ? loginJsonResponse(env, user, false, provider)
          : loginResponse(env, user, false, provider);
      }
    }

    const finalUsername = String(
      username || pending.proposed_username || "",
    ).trim();
    if (
      finalUsername.length < MIN_USERNAME_LENGTH ||
      finalUsername.length > MAX_USERNAME_LENGTH
    ) {
      return registerFail(
        `用户名需 ${MIN_USERNAME_LENGTH}–${MAX_USERNAME_LENGTH} 位`,
        ERROR_CODES.INVALID_USERNAME_LENGTH,
        400,
      );
    }
    if (/\s/.test(finalUsername)) {
      return registerFail(
        "用户名不能包含空白字符",
        ERROR_CODES.INVALID_USERNAME_LENGTH,
        400,
      );
    }

    const usernameOwner = await env.db
      .prepare("SELECT sub FROM online_users WHERE username = ?")
      .bind(finalUsername)
      .first();
    if (usernameOwner) {
      return registerFail(
        "该用户名已被占用",
        ERROR_CODES.USERNAME_ALREADY_EXISTS,
        409,
      );
    }

    if (!password || !validatePassword(password)) {
      return registerFail(
        "密码需 6–32 位，且只能包含 a-z A-Z 0-9 - _ = + @ # $ %",
        ERROR_CODES.WEAK_PASSWORD,
        400,
      );
    }

    let user;
    try {
      user = await createUserFromPending(
        env.db,
        { ...pending, provider },
        finalUsername,
        password,
      );
    } catch (err) {
      if (env.DEBUG) console.error("[oauth] create user failed:", err);
      return registerFail(
        "注册失败，用户名或邮箱可能已被占用",
        ERROR_CODES.SERVER_DOWN,
        500,
      );
    }

    await deletePending(env, token);
    return wantsJson
      ? loginJsonResponse(env, user, true, provider)
      : loginResponse(env, user, true, provider);
  }

  return null;
}
