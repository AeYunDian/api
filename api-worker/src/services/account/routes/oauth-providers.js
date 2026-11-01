// routes/oauth-providers.js —— 通用 OAuth 2.0 提供商（Google / Cloudflare /
// 极狐 GitLab / Facebook / Discord / 阿里云）
//
// 统一回调：/api/auth/{provider}/callback
// 统一流程：start 302 到授权页 → callback 换 token、取用户信息 →
//   已绑定登录；未绑定且邮箱命中白名单 → 注册中间页；
//   无邮箱 → account_notlinked；邮箱不在白名单 → email_not_supported。

import { checkAuth } from "../auth/jwt.js";
import { getKv } from "../auth/kv.js";
import { jsonResponse } from "../http.js";
import { TAG_LOGGEDIN, isAllowedEmailDomain } from "../config.js";
import { generateToken } from "../../../shared/utils.js";
import { ERROR_CODES } from "../../../shared/error-codes.js";
import { savePending } from "../oauth-pending.js";
import {
  bindFailPage,
  failPage,
  loginResponse,
  messagePage,
} from "./github.js";

const ONLINE_BASE = "https://online.undz.cn";
const USER_AGENT = "AyServices OAuth Bot/1.0";

const PROVIDERS = {
  google: {
    name: "Google",
    authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    userInfoUrl: "https://openidconnect.googleapis.com/v1/userinfo",
    scope: "openid email profile",
    callbackKey: "google",
    tokenAuth: "post",
  },
  cloudflare: {
    name: "Cloudflare",
    authorizeUrl: "https://dash.cloudflare.com/oauth2/auth",
    tokenUrl: "https://dash.cloudflare.com/oauth2/token",
    userInfoUrl: "https://api.cloudflare.com/client/v4/user",
    scope: "user-details.read",
    callbackKey: "cloudflare",
    tokenAuth: "basic",
  },
  jihulab: {
    name: "极狐 GitLab",
    authorizeUrl: "https://jihulab.com/oauth/authorize",
    tokenUrl: "https://jihulab.com/oauth/token",
    userInfoUrl: "https://jihulab.com/api/v4/user",
    scope: "openid profile email",
    callbackKey: "gitlab-cn",
    tokenAuth: "post",
  },
  facebook: {
    name: "Facebook",
    authorizeUrl: "https://www.facebook.com/v23.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v23.0/oauth/access_token",
    userInfoUrl:
      "https://graph.facebook.com/me?fields=id,name,email,picture.type(large)",
    scope: "email,public_profile",
    callbackKey: "facebook",
    tokenAuth: "post",
  },
  discord: {
    name: "Discord",
    authorizeUrl: "https://discord.com/oauth2/authorize",
    tokenUrl: "https://discord.com/api/oauth2/token",
    userInfoUrl: "https://discord.com/api/users/@me",
    scope: "identify email",
    callbackKey: "discord",
    tokenAuth: "post",
  },
  aliyun: {
    name: "阿里云",
    authorizeUrl: "https://signin.aliyun.com/oauth2/v1/auth",
    tokenUrl: "https://oauth.aliyun.com/v1/token",
    userInfoUrl: "https://oauth.aliyun.com/v1/userinfo",
    scope: "openid aliuid profile",
    callbackKey: "aliyun",
    tokenAuth: "post",
  },
};

function envName(key, suffix) {
  return `${key.replace(/[^a-z0-9]/gi, "_").toUpperCase()}_${suffix}`;
}

/** 读取 {PROVIDER}_CLIENT_ID 等环境变量，兼容配置了 .env 前缀的写法 */
function envValue(env, key, suffix) {
  const name = envName(key, suffix);
  return env[name] || env[`${name}_`] || env[`.env.${name}`] || "";
}

function redirectUri(env, key, provider) {
  const override = envValue(env, key, "REDIRECT_URI");
  return override || `${ONLINE_BASE}/api/auth/${provider.callbackKey}/callback`;
}

function providerForPath(path, suffix) {
  for (const [key, provider] of Object.entries(PROVIDERS)) {
    if (
      path === `/api/auth/${key}/${suffix}` ||
      path === `/api/auth/${provider.callbackKey}/${suffix}`
    ) {
      return { key, provider };
    }
  }
  return null;
}

function isAllowedEmail(email) {
  return isAllowedEmailDomain(email);
}

async function exchangeCode(env, key, provider, code) {
  const clientId = envValue(env, key, "CLIENT_ID");
  const clientSecret = envValue(env, key, "CLIENT_SECRET");
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: redirectUri(env, key, provider),
    grant_type: "authorization_code",
  });
  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
    Accept: "application/json",
    "User-Agent": USER_AGENT,
  };
  if (provider.tokenAuth === "basic") {
    headers.Authorization = `Basic ${btoa(`${clientId}:${clientSecret}`)}`;
    body.delete("client_secret");
  }

  const res = await fetch(provider.tokenUrl, {
    method: "POST",
    headers,
    body,
  });
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  return data && data.access_token ? data : null;
}

async function fetchUser(env, key, provider, accessToken) {
  const res = await fetch(provider.userInfoUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      "User-Agent": USER_AGENT,
    },
  });
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  if (!data) return null;

  if (key === "cloudflare") {
    const user = data.result || data;
    if (!user || !user.id) return null;
    return {
      openid: String(user.id),
      login: user.username || String(user.email || "").split("@")[0],
      email: user.email ? String(user.email).toLowerCase() : null,
      avatar: "",
      bio: "",
    };
  }

  if (key === "google") {
    if (!data.sub) return null;
    return {
      openid: String(data.sub),
      login: data.name || String(data.email || "").split("@")[0],
      email: data.email ? String(data.email).toLowerCase() : null,
      avatar: data.picture || "",
      bio: "",
    };
  }

  if (key === "jihulab") {
    if (!data.id) return null;
    return {
      openid: String(data.id),
      login:
        data.username || data.name || String(data.email || "").split("@")[0],
      email: data.email ? String(data.email).toLowerCase() : null,
      avatar: data.avatar_url || "",
      bio: data.bio || "",
    };
  }

  if (key === "facebook") {
    if (!data.id) return null;
    return {
      openid: String(data.id),
      login: data.name || String(data.email || "").split("@")[0],
      email: data.email ? String(data.email).toLowerCase() : null,
      avatar: data.picture?.data?.url || "",
      bio: "",
    };
  }

  if (key === "discord") {
    if (!data.id) return null;
    return {
      openid: String(data.id),
      login: data.global_name || data.username || `discord_${data.id}`,
      email: data.email ? String(data.email).toLowerCase() : null,
      avatar: data.avatar
        ? `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png?size=128`
        : "",
      bio: "",
    };
  }

  if (key === "aliyun") {
    if (!data.sub) return null;
    // 阿里云 OAuth 不返回可收信邮箱，只能走 account_notlinked
    return {
      openid: String(data.sub),
      login: data.login_name || data.upn || data.name || `aliyun_${data.sub}`,
      email: null,
      avatar: "",
      bio: "",
    };
  }

  return null;
}

async function findUser(env, sub) {
  return env.db
    .prepare(
      "SELECT sub, username, email, banned, ban_reason, gender, avatar, description, created_at FROM online_users WHERE sub = ?",
    )
    .bind(sub)
    .first();
}

export async function handleOAuthProviders({
  request,
  env,
  url,
  path,
  method,
  cors,
}) {
  const startMatch = providerForPath(path, "start");
  if (startMatch && method === "GET") {
    const { key, provider } = startMatch;
    const clientId = envValue(env, key, "CLIENT_ID");
    const clientSecret = envValue(env, key, "CLIENT_SECRET");
    if (!clientId || !clientSecret) {
      return jsonResponse(
        {
          error_code: ERROR_CODES.GITHUB_NOT_CONFIGURED,
          error: `${provider.name} OAuth is not configured`,
        },
        503,
        cors,
      );
    }

    const mode =
      url.searchParams.get("mode") === "bind" ||
      url.searchParams.get("mode") === "register"
        ? "bind"
        : "login";
    const state = generateToken();
    await getKv().put(
      `oauth_state:${state}`,
      JSON.stringify({ provider: key, mode }),
      { expirationTtl: 600 },
    );

    const authorizeUrl = new URL(provider.authorizeUrl);
    authorizeUrl.searchParams.set("client_id", clientId);
    authorizeUrl.searchParams.set(
      "redirect_uri",
      redirectUri(env, key, provider),
    );
    authorizeUrl.searchParams.set("response_type", "code");
    authorizeUrl.searchParams.set("scope", provider.scope);
    authorizeUrl.searchParams.set("state", state);

    return jsonResponse({ url: authorizeUrl.toString() }, 200, cors);
  }

  const callbackMatch = providerForPath(path, "callback");
  if (callbackMatch && method === "GET") {
    const { key, provider } = callbackMatch;

    const oauthError = url.searchParams.get("error");
    if (oauthError) {
      return failPage(
        url.searchParams.get("error_description") ||
          `${provider.name} 授权被取消`,
        ERROR_CODES.GITHUB_CODE_INVALID,
        400,
        key,
      );
    }

    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    if (!code || !state) {
      return failPage(
        "缺少 code 或 state",
        ERROR_CODES.GITHUB_CODE_INVALID,
        400,
        key,
      );
    }

    const stored = await getKv().get(`oauth_state:${state}`);
    if (!stored) {
      return failPage(
        "登录状态已过期，请重试",
        ERROR_CODES.GITHUB_STATE_INVALID,
        400,
        key,
      );
    }
    await getKv().delete(`oauth_state:${state}`);

    let mode = "login";
    try {
      mode = JSON.parse(stored).mode || "login";
    } catch {
      /* ignore */
    }

    const tokenData = await exchangeCode(env, key, provider, code);
    if (!tokenData) {
      return failPage(
        `${provider.name} 授权失败，请重试`,
        ERROR_CODES.GITHUB_UPSTREAM_ERROR,
        502,
        key,
      );
    }

    const oauthUser = await fetchUser(
      env,
      key,
      provider,
      tokenData.access_token,
    );
    if (!oauthUser) {
      return failPage(
        `获取 ${provider.name} 用户信息失败`,
        ERROR_CODES.GITHUB_UPSTREAM_ERROR,
        502,
        key,
      );
    }

    const connection = await env.db
      .prepare(
        "SELECT user_sub FROM oauth_connections WHERE provider = ? AND openid = ?",
      )
      .bind(key, oauthUser.openid)
      .first();

    if (mode === "bind") {
      const [authStatus, currentUser] = await checkAuth(request, env);
      if (authStatus !== TAG_LOGGEDIN) {
        return bindFailPage(
          `请先登录 AyAccount 后再绑定 ${provider.name}`,
          "not_logged_in",
          ERROR_CODES.UNAUTHORIZED,
          401,
          key,
        );
      }
      if (connection) {
        if (connection.user_sub === currentUser.sub) {
          return messagePage({
            action: "bind_success",
            provider: key,
            user: {
              sub: currentUser.sub,
              username: currentUser.username,
              email: currentUser.email,
            },
          });
        }
        return bindFailPage(
          `该 ${provider.name} 账号已绑定其他 AyAccount`,
          "already_bound",
          ERROR_CODES.GITHUB_ALREADY_BOUND,
          409,
          key,
        );
      }

      await env.db
        .prepare(
          `INSERT INTO oauth_connections (provider, openid, user_sub, created_at)
           VALUES (?, ?, ?, ?)`,
        )
        .bind(key, oauthUser.openid, currentUser.sub, Date.now())
        .run();

      return messagePage({
        action: "bind_success",
        provider: key,
        user: {
          sub: currentUser.sub,
          username: currentUser.username,
          email: currentUser.email,
        },
      });
    }

    if (connection) {
      const user = await findUser(env, connection.user_sub);
      if (!user) {
        return failPage(
          "绑定关系失效，请重新登录",
          ERROR_CODES.GITHUB_STATE_INVALID,
          400,
          key,
        );
      }
      if (user.banned) {
        return failPage(
          `账号已被封禁：${user.ban_reason || "未提供原因"}`,
          ERROR_CODES.ACCOUNT_BANNED,
          403,
          key,
        );
      }
      return loginResponse(env, user, false, key);
    }

    if (!oauthUser.email) {
      return new Response(null, {
        status: 302,
        headers: {
          Location: `/oauth2/account_notlinked?code=${generateToken()}&countdown=0x1770&account_provider=${key}`,
          "Cache-Control": "no-store",
        },
      });
    }

    if (!isAllowedEmail(oauthUser.email)) {
      return new Response(null, {
        status: 302,
        headers: {
          Location: `/oauth2/email_not_supported?provider=${encodeURIComponent(key)}&email=${encodeURIComponent(oauthUser.email)}`,
          "Cache-Control": "no-store",
        },
      });
    }

    const emailExists = await env.db
      .prepare("SELECT sub FROM online_users WHERE email = ?")
      .bind(oauthUser.email)
      .first();
    const { token } = await savePending(env, {
      provider: key,
      openid: oauthUser.openid,
      login: oauthUser.login,
      email: oauthUser.email,
      avatar: oauthUser.avatar,
      bio: oauthUser.bio,
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

  return null;
}
