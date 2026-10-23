// routes/third-party.js —— 由 ayOnline.js 拆分而来（逐行搬运，未改逻辑）
// 第三方登录入口：/api/auth/yzhyzxy/start（发起授权）与 /api/oauth/callback（回调）。

import {
  corsHeaders,
  jsonResponse,
} from "../http.js";
import {
  checkAuth,
  signAccessToken,
} from "../auth/jwt.js";
import { getKv } from "../auth/kv.js";
import { storeRefreshToken } from "../auth/tokens.js";
import { serialize } from "cookie";
import {
  generatePKCEPair,
  generateToken,
} from "../../../shared/utils.js";
import {
  KV_PREFIX,
  REFRESH_TOKEN_TTL,
  TAG_LOGGEDIN,
  YZHYZXY_AUTH_URL,
  YZHYZXY_REDIRECT_URI,
  YZHYZXY_REVOKE_URL,
  YZHYZXY_SCOPE,
  YZHYZXY_TOKEN_URL,
  YZHYZXY_USERINFO_URL,
} from "../config.js";
import { savePending } from "../oauth-pending.js";

export async function handleThirdPartyAuth({ request, env, url, path, method, cors }) {
      if (path === "/api/auth/yzhyzxy/start" && method === "GET") {
        const { verifier, challenge } = await generatePKCEPair();
        const state = generateToken();
        const mode = url.searchParams.get("mode") || "login";

        await getKv().put(
          `${KV_PREFIX.OAUTH_PKCE}${state}`,
          JSON.stringify({ verifier, mode }),
          {
            expirationTtl: 600,
          },
        );

        const authUrl = new URL(YZHYZXY_AUTH_URL);
        authUrl.searchParams.set("client_id", env.YZHYZXY_CLIENT_ID);
        authUrl.searchParams.set("response_type", "code");
        authUrl.searchParams.set("redirect_uri", YZHYZXY_REDIRECT_URI);
        authUrl.searchParams.set("state", state);
        authUrl.searchParams.set("scope", YZHYZXY_SCOPE);
        authUrl.searchParams.set("code_challenge", challenge);
        authUrl.searchParams.set("code_challenge_method", "S256");
        return jsonResponse(
          { url: authUrl.toString() },
          200,
          corsHeaders(request),
        );
      }
      if (path === "/api/oauth/callback" && method === "GET") {
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const error = url.searchParams.get("error");

        if (error) {
          return new Response(`授权失败: ${error}`, { status: 400 });
        }
        if (!code || !state) {
          return new Response("Missing code or state", { status: 400 });
        }

        const storedData = await getKv().get(`${KV_PREFIX.OAUTH_PKCE}${state}`);
        if (!storedData) {
          return new Response("Invalid or expired state", { status: 400 });
        }
        const { verifier, mode } = JSON.parse(storedData);
        await getKv().delete(`${KV_PREFIX.OAUTH_PKCE}${state}`);

        const tokenBody = new URLSearchParams({
          grant_type: "authorization_code",
          client_id: env.YZHYZXY_CLIENT_ID,
          code: code,
          code_verifier: verifier,
          redirect_uri: YZHYZXY_REDIRECT_URI,
        });

        const tokenRes = await fetch(YZHYZXY_TOKEN_URL, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: tokenBody,
        });
        const tokenData = await tokenRes.json();
        if (!tokenData.access_token) {
          if (env.DEBUG) console.error("Token exchange failed:", tokenData);
          return new Response(
            "Failed to exchange token: " + JSON.stringify(tokenData),
            { status: 500 },
          );
        }
        const userRes = await fetch(YZHYZXY_USERINFO_URL, {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        const userData = await userRes.json();
        if (!userData.openid) {
          if (env.DEBUG) console.error("Failed to get userinfo:", userData);
          return new Response("Failed to get userinfo", { status: 500 });
        }

        // 立即吊销 refresh_token
        if (tokenData.refresh_token) {
          try {
            const revokeBody = new URLSearchParams({
              token: tokenData.refresh_token,
              token_type_hint: "refresh_token",
              client_id: env.YZHYZXY_CLIENT_ID,
              client_secret: env.YZHYZXY_CLIENT_SECRET,
            });
            await fetch(YZHYZXY_REVOKE_URL, {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: revokeBody,
            });
            if (env.DEBUG) console.log("yzhyzxy refresh_token revoked");
          } catch (err) {
            if (env.DEBUG)
              console.error("Failed to revoke yzhyzxy refresh_token:", err);
          }
        }

        // 处理登录/注册逻辑
        const openid = userData.openid;
        const provider = "yzhyzxy";
        const username =
          userData.username || userData.nickname || `yz_${openid.slice(-8)}`;
        const avatar = userData.avatar || "";

        let localUser = await env.db
          .prepare(
            "SELECT user_sub FROM oauth_connections WHERE provider = ? AND openid = ?",
          )
          .bind(provider, openid)
          .first();

        if (mode === "login") {
          if (localUser) {
            const userId = localUser.user_sub;
            const user = await env.db
              .prepare(
                "SELECT sub, username, email, banned, ban_reason, gender, avatar, description  FROM online_users WHERE sub = ?",
              )
              .bind(userId)
              .first();

            if (user.banned) {
              return new Response(null, {
                status: 302,
                headers: {
                  Location: `/oauth2/account_banned?code=${generateToken()}&countdown=0x1770&ban_reason=${user.ban_reason}`,
                },
              });
            }

            const accessToken = await signAccessToken(
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
            const setCookieHeaders = [
              serialize("access_token", accessToken, cookieOptions),
              serialize("refresh_token", refreshToken, cookieOptions),
            ];

            const html = `<!DOCTYPE html><html><body><p style="text-align:center;">登录成功，窗口即将关闭...</p><script>if (window.opener) {window.opener.postMessage({action: 'login_success',provider: 'yzhyzxy',user: { sub: ${user.sub}, username: "${user.username}", email: "${user.email}" }}, '*');}window.close();<\/script></body></html>`;
            return new Response(html, {
              status: 200,
              headers: {
                "Content-Type": "text/html; charset=utf-8",
                "Set-Cookie": setCookieHeaders.join(", "),
              },
            });
          }

          // 未绑定：有真实邮箱就走通用的「注册确认」中间页
          if (userData.email) {
            const pendingEmail = String(userData.email).toLowerCase();
            const emailExists = await env.db
              .prepare("SELECT sub FROM online_users WHERE email = ?")
              .bind(pendingEmail)
              .first();

            const { token } = await savePending(env, {
              provider,
              openid,
              login: username,
              email: pendingEmail,
              avatar,
              bio: userData.description || userData.bio || "",
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

          // 没有邮箱时保留原来的「账户未绑定」页面
          return new Response(null, {
            status: 302,
            headers: {
              Location: `/oauth2/account_notlinked?code=${generateToken()}&countdown=0x1770&account_provider=${provider}`,
            },
          });
        }

        if (mode === "register") {
          if (mode === "register") {
            // 1. 检查用户是否已登录（绑定操作要求用户已登录）
            const [authStatus, user] = await checkAuth(request, env);
            if (authStatus !== TAG_LOGGEDIN) {
              // 未登录：提示用户先登录
              return new Response(null, {
                status: 302,
                headers: {
                  Location: `/oauth2/bind_notloggedin?code=${generateToken()}&countdown=0x1770`,
                },
              });
            }

            if (localUser) {
              if (localUser.user_sub === user.sub) {
                return new Response(null, {
                  status: 302,
                  headers: {
                    Location: `/oauth2/bind_bound?code=${generateToken()}&countdown=0x1770&`,
                  },
                });
              } else {
                return new Response(null, {
                  status: 302,
                  headers: {
                    Location: `/oauth2/bind_already_bound?code=${generateToken()}&countdown=0x1770`,
                  },
                });
              }
            }

            const now = Date.now();
            await env.db
              .prepare(
                `INSERT INTO oauth_connections (provider, openid, user_sub, created_at)
             VALUES (?, ?, ?, ?)`,
              )
              .bind(provider, openid, user.sub, now)
              .run();

            return new Response(
              `<!DOCTYPE html><html><body><p style="text-align:center;">绑定成功，窗口即将关闭...</p><script>if (window.opener) {window.opener.postMessage({action: 'bind_success',provider: '${provider}',user: { sub: ${user.sub}, username: "${user.username}" }}, '*');}window.close(); <\/script></body></html>`,
              {
                status: 200,
                headers: { "Content-Type": "text/html; charset=utf-8" },
              },
            );
          }
        }

        return new Response("Invalid mode", { status: 400 });
      }

  return null;
}
