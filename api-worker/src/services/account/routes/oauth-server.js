// routes/oauth-server.js —— 由 ayOnline.js 拆分而来（逐行搬运，未改逻辑）
// /api/oauth/* —— 作为授权服务器对外提供的端点：authorize / token / userinfo / consent。

import { jsonResponse } from "../http.js";
import {
  checkAuth,
  verifyBearerToken,
} from "../auth/jwt.js";
import { getKv } from "../auth/kv.js";
import {
  getOAuthClient,
  validateRedirectUri,
} from "../oauth/clients.js";
import {
  exchangeOAuthToken,
  refreshAccessToken,
  revokeRefreshToken,
} from "../oauth/token.js";
import { serialize } from "cookie";
import { generateToken } from "../../../shared/utils.js";
import {
  DEFAULT_OAUTH_CLIENT_SCOPE,
  OAUTH_TOKEN_EXPIRES_IN,
  TAG_BANNED,
  TAG_LOGGEDIN,
} from "../config.js";

export async function handleOAuthServer({ request, env, url, path, method, cors }) {
      if (path.startsWith("/api/oauth/")) {
        if (path === "/api/oauth/authorize" && method === "GET") {
          const query = url.searchParams;
          const clientId = query.get("client_id");
          const redirectUri = query.get("redirect_uri");
          const responseType = query.get("response_type");
          const state = query.get("state") || "";
          const scope = query.get("scope") || DEFAULT_OAUTH_CLIENT_SCOPE;

          if (!clientId || !redirectUri || responseType !== "code") {
            const errorUrl = new URL("/oauth2/invalid_request", url.origin);
            return new Response(null, {
              status: 302,
              headers: {
                Location: errorUrl.toString(),
                ...cors,
              },
            });
          }
          const client = await env.db
            .prepare(
              "SELECT sub, name, redirect_uris, scope, trusted FROM oauth_clients WHERE client_id = ?",
            )
            .bind(clientId)
            .first();
          // 应用未注册 -> 跳转至 invalid_client
          if (!client) {
            const errorUrl = new URL("/oauth2/invalid_client", url.origin);
            return new Response(null, {
              status: 302,
              headers: {
                Location: errorUrl.toString(),
                ...cors,
              },
            });
          }
          if (!validateRedirectUri(client.redirect_uris, redirectUri)) {
            const errorUrl = new URL(
              "/oauth2/invalid_redirect_uri",
              url.origin,
            );
            return new Response(null, {
              status: 302,
              headers: {
                Location: errorUrl.toString(),
                ...cors,
              },
            });
          }

          const [authStatus, user] = await checkAuth(request, env);
          if (authStatus !== TAG_LOGGEDIN) {
            const clearOptions = {
              domain: ".undz.cn",
              path: "/",
              httpOnly: true,
              secure: true,
              sameSite: "Lax",
              maxAge: 0,
            };
            const loginUrl = new URL("/oauth2/login", url.origin);
            loginUrl.searchParams.set("redirect_url", request.url);
            loginUrl.searchParams.set("client_id", clientId);
            loginUrl.searchParams.set("scope", scope);
            if (state) loginUrl.searchParams.set("state", state);
            const client = await getOAuthClient(env.db, clientId);
            if (client) loginUrl.searchParams.set("client_name", client.name);
            const headers = new Headers({
              Location: loginUrl.toString(),
              ...cors,
            });
            if (authStatus === TAG_BANNED) {
              headers.append(
                "Set-Cookie",
                serialize("access_token", "", clearOptions),
              );
              headers.append(
                "Set-Cookie",
                serialize("refresh_token", "", clearOptions),
              );
            }
            return new Response(null, { status: 302, headers });
          }
          if (authStatus === TAG_LOGGEDIN) {
            const clientScopeArray = (
              client.scope || DEFAULT_OAUTH_CLIENT_SCOPE
            )
              .split(" ")
              .filter((s) => s);
            const requestScopeArray = scope.split(" ").filter((s) => s);
            let finalScopeArray = requestScopeArray.filter((s) =>
              clientScopeArray.includes(s),
            );
            if (finalScopeArray.length === 0) {
              finalScopeArray = clientScopeArray;
            }
            const finalScope = finalScopeArray.join(" ");
            if (client.trusted === 1) {
              const code = generateToken();
              const expiresAt =
                Math.floor(Date.now() / 1000) + OAUTH_TOKEN_EXPIRES_IN;
              await env.db
                .prepare(
                  `INSERT INTO oauth_auth_codes (code, client_id, user_sub, redirect_uri, scope, state, expires_at, used)
             VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
                )
                .bind(
                  code,
                  clientId,
                  user.sub,
                  redirectUri,
                  finalScope,
                  state,
                  expiresAt,
                )
                .run();

              const redirectUrl = new URL(redirectUri);
              redirectUrl.searchParams.set("code", code);
              if (state) redirectUrl.searchParams.set("state", state);
              return new Response(null, {
                status: 302,
                headers: { Location: redirectUrl.toString(), ...cors },
              });
            } else {
              const requestId = generateToken();
              const consentToken = generateToken();
              const now = Math.floor(Date.now() / 1000);
              const expiresAt = now + OAUTH_TOKEN_EXPIRES_IN;
              await env.db
                .prepare(
                  `INSERT INTO oauth_consent_requests 
             (sub, client_id, redirect_uri, scope, state, user_sub, created_at, expires_at, status, consent_token)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
                )
                .bind(
                  requestId,
                  clientId,
                  redirectUri,
                  finalScope,
                  state,
                  user.sub,
                  now,
                  expiresAt,
                  consentToken,
                )
                .run();

              const consentUrl = new URL("/oauth2/consent", url.origin);
              consentUrl.searchParams.set("request_id", requestId);
              return new Response(null, {
                status: 302,
                headers: { Location: consentUrl.toString(), ...cors },
              });
            }
          }
        }
        if (path === "/api/oauth/token" && method === "POST") {
          const contentType = request.headers.get("Content-Type") || "";
          let body;
          if (contentType.includes("application/json")) {
            body = await request.json().catch(() => null);
          } else {
            const formData = await request.formData();
            body = {};
            for (const [key, value] of formData.entries()) {
              body[key] = value;
            }
          }
          if (!body) {
            return jsonResponse({ error: "invalid_request" }, 400, cors);
          }

          const grantType = body.grant_type;
          const clientId = body.client_id;
          const clientSecret = body.client_secret;

          if (grantType === "authorization_code") {
            const result = await exchangeOAuthToken(
              {
                code: body.code,
                clientId,
                clientSecret,
                redirectUri: body.redirect_uri,
                state: body.state || null,
              },
              env,
            );
            if (!result.success) {
              // 构建基础错误体
              const errorBody = {
                error: result.error,
                error_description: result.error_description,
              };
              if (result.ban_reason) {
                errorBody.ban_reason = result.ban_reason;
              }
              // 根据错误类型选择合适的 HTTP 状态码
              let statusCode = 400;
              if (result.error === "invalid_client") {
                statusCode = 401;
              } else if (result.error === "access_denied") {
                statusCode = 403; // 封禁时使用 403 Forbidden
              }
              return jsonResponse(errorBody, statusCode, cors);
            }
            return jsonResponse(result.data, 200, cors);
          } else if (grantType === "refresh_token") {
            const refreshToken = body.refresh_token;
            if (!refreshToken) {
              return jsonResponse(
                {
                  error: "invalid_request",
                  error_description: "Missing refresh_token",
                },
                400,
                cors,
              );
            }
            const result = await refreshAccessToken(
              refreshToken,
              clientId,
              clientSecret,
              env,
            );
            if (!result.success) {
              const errorBody = {
                error: result.error,
                error_description: result.error_description,
              };
              if (result.ban_reason) {
                errorBody.ban_reason = result.ban_reason;
              }
              let statusCode = 400;
              if (result.error === "invalid_client") {
                statusCode = 401;
              } else if (result.error === "access_denied") {
                statusCode = 403;
              }
              return jsonResponse(errorBody, statusCode, cors);
            }
            return jsonResponse(result.data, 200, cors);
          } else {
            return jsonResponse({ error: "unsupported_grant_type" }, 400, cors);
          }
        }
        if (path === "/api/oauth/userinfo" && method === "GET") {
          const result = await verifyBearerToken(request, env);
          if (!result.valid) {
            return jsonResponse({ error: result.error }, 401, cors);
          }

          const scopeList = (result.user.scope || "").split(" ");
          const hasOpenID = scopeList.includes("openid");
          const hasProfile = scopeList.includes("profile");
          const hasEmail = scopeList.includes("email");

          if (!hasOpenID || (!hasProfile && !hasEmail)) {
            return jsonResponse(
              {
                error: "insufficient_scope",
                error_description:
                  "Missing required scope: openid/profile or email",
              },
              403,
              cors,
            );
          }

          const response = {};
          if (hasProfile) {
            response.sub = result.user.sub;
            response.username = result.user.username;
            if (result.user.gender !== "unknown") {
              response.gender = result.user.gender;
            }
            response.avatar = result.user.avatar;
            response.description = result.user.description;
          }
          if (hasEmail) {
            response.email = result.user.email;
          }
          return jsonResponse(response, 200, cors);
        }
        if (path === "/api/oauth/user/profile" && method === "GET") {
          const result = await verifyBearerToken(request, env);
          if (!result.valid) {
            return jsonResponse({ error: result.error }, 401, cors);
          }
          const scopeList = (result.user.scope || "").split(" ");
          if (!scopeList.includes("profile") && !scopeList.includes("openid")) {
            return jsonResponse(
              {
                message:
                  "这个接口预计将在2026-10-01弃用，请转用 /api/oauth/userinfo 端点，具体请看文档",
                error: "insufficient_scope",
                error_description: "Missing required scope: profile or openid",
              },
              403,
              cors,
            );
          }
          return jsonResponse(
            {
              id: result.user.sub,
              username: result.user.username,
              message:
                "这个接口预计将在2026-10-01弃用，请转用 /api/oauth/userinfo 端点，具体请看文档",
            },
            200,
            cors,
          );
        }

        if (path === "/api/oauth/user/email" && method === "GET") {
          const result = await verifyBearerToken(request, env);
          if (!result.valid) {
            return jsonResponse({ error: result.error }, 401, cors);
          }
          const scopeList = (result.user.scope || "").split(" ");
          if (!scopeList.includes("email")) {
            return jsonResponse(
              {
                message:
                  "这个接口预计将在2026-10-01弃用，请转用 /api/oauth/userinfo 端点，具体请看文档",
                error: "insufficient_scope",
                error_description: "Missing required scope: email",
              },
              403,
              cors,
            );
          }
          return jsonResponse(
            {
              message:
                "这个接口预计将在2026-10-01弃用，请转用 /api/oauth/userinfo 端点，具体请看文档",
              email: result.user.email,
            },
            200,
            cors,
          );
        }
        if (path === "/api/oauth/consent-data" && method === "GET") {
          const requestId = url.searchParams.get("request_id");
          if (!requestId)
            return jsonResponse({ error: "missing_request_id" }, 400, cors);

          // 验证用户登录
          const [authStatus, user] = await checkAuth(request, env);
          if (authStatus !== TAG_LOGGEDIN)
            return jsonResponse({ error: "unauthorized" }, 401, cors);

          // 查询请求记录
          const req = await env.db
            .prepare(
              `SELECT * FROM oauth_consent_requests WHERE sub = ? AND status = 'pending' AND expires_at > ?`,
            )
            .bind(requestId, Math.floor(Date.now() / 1000))
            .first();
          if (!req)
            return jsonResponse({ error: "invalid_request" }, 400, cors);
          if (req.user_sub !== user.sub)
            return jsonResponse({ error: "forbidden" }, 403, cors);

          // 查询应用名称
          const client = await env.db
            .prepare(`SELECT name FROM oauth_clients WHERE client_id = ?`)
            .bind(req.client_id)
            .first();
          return jsonResponse(
            {
              client_name: client ? client.name : req.client_id,
              scope: req.scope || "",
              consent_token: req.consent_token,
              client_id: req.client_id,
              redirect_uri: req.redirect_uri,
              state: req.state || "",
            },
            200,
            cors,
          );
        }
        if (path === "/api/oauth/consent/approve" && method === "POST") {
          const body = await request.json().catch(() => null);
          const requestId = body?.request_id;
          const consentToken = body?.consent_token;
          if (!requestId || !consentToken)
            return jsonResponse({ error: "missing_parameters" }, 400, cors);

          const [authStatus, user] = await checkAuth(request, env);
          if (authStatus !== TAG_LOGGEDIN)
            return jsonResponse({ error: "unauthorized" }, 401, cors);

          // 查询并校验 token
          const req = await env.db
            .prepare(
              `SELECT * FROM oauth_consent_requests WHERE sub = ? AND consent_token = ? AND status = 'pending' AND expires_at > ?`,
            )
            .bind(requestId, consentToken, Math.floor(Date.now() / 1000))
            .first();
          if (!req)
            return jsonResponse({ error: "invalid_request" }, 400, cors);
          if (req.user_sub !== user.sub)
            return jsonResponse({ error: "forbidden" }, 403, cors);

          // 生成授权码
          const code = generateToken();
          const expiresAt =
            Math.floor(Date.now() / 1000) + OAUTH_TOKEN_EXPIRES_IN;
          await env.db
            .prepare(
              `INSERT INTO oauth_auth_codes (code, client_id, user_sub, redirect_uri, scope, state, expires_at, used)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
            )
            .bind(
              code,
              req.client_id,
              user.sub,
              req.redirect_uri,
              req.scope,
              req.state,
              expiresAt,
            )
            .run();

          await env.db
            .prepare(`DELETE FROM oauth_consent_requests WHERE sub = ?`)
            .bind(requestId)
            .run();

          const redirectUrl = new URL(req.redirect_uri);
          redirectUrl.searchParams.set("code", code);
          if (req.state) redirectUrl.searchParams.set("state", req.state);
          return jsonResponse(
            { redirect_url: redirectUrl.toString() },
            200,
            cors,
          );
        }
        if (path === "/api/oauth/consent/deny" && method === "POST") {
          const body = await request.json().catch(() => null);
          const requestId = body?.request_id;
          const consentToken = body?.consent_token;
          if (!requestId || !consentToken)
            return jsonResponse({ error: "missing_parameters" }, 400, cors);

          const [authStatus, user] = await checkAuth(request, env);
          if (authStatus !== TAG_LOGGEDIN)
            return jsonResponse({ error: "unauthorized" }, 401, cors);

          const req = await env.db
            .prepare(
              `SELECT * FROM oauth_consent_requests WHERE sub = ? AND consent_token = ? AND status = 'pending' AND expires_at > ?`,
            )
            .bind(requestId, consentToken, Math.floor(Date.now() / 1000))
            .first();
          if (!req)
            return jsonResponse({ error: "invalid_request" }, 400, cors);
          if (req.user_sub !== user.sub)
            return jsonResponse({ error: "forbidden" }, 403, cors);
          await env.db
            .prepare(`DELETE FROM oauth_consent_requests WHERE sub = ?`)
            .bind(requestId)
            .run();

          const redirectUrl = new URL(req.redirect_uri);
          redirectUrl.searchParams.set("error", "access_denied");
          if (req.state) redirectUrl.searchParams.set("state", req.state);
          return jsonResponse(
            { redirect_url: redirectUrl.toString() },
            200,
            cors,
          );
        }
        if (path === "/api/oauth/verify" && method === "GET") {
          const result = await verifyBearerToken(request, env);
          if (!result.valid) {
            return jsonResponse(
              { valid: false, error: result.error },
              401,
              cors,
            );
          }
          return jsonResponse({ valid: true, user: result.user }, 200, cors);
        }
        if (path === "/api/oauth/revoke" && method === "POST") {
          const contentType = request.headers.get("Content-Type") || "";
          let body;
          if (contentType.includes("application/json")) {
            body = await request.json().catch(() => null);
          } else {
            const formData = await request.formData();
            body = {};
            for (const [key, value] of formData.entries()) {
              body[key] = value;
            }
          }
          if (!body) {
            return jsonResponse({ error: "invalid_request" }, 400, cors);
          }

          const token = body.token;
          const tokenTypeHint = body.token_type_hint;
          const clientId = body.client_id;
          const clientSecret = body.client_secret;

          if (!clientId || !clientSecret) {
            return jsonResponse({ error: "invalid_client" }, 401, cors);
          }

          const result = await revokeRefreshToken(
            getKv(),
            token,
            clientId,
            clientSecret,
            env,
            tokenTypeHint,
          );
          if (!result.success) {
            return jsonResponse({ error: result.error }, 401, cors);
          }
          return jsonResponse({}, 200, cors);
        }
      }

  return null;
}
