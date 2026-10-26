// account-profile.js —— 由 account-api.js 拆分而来（逐行搬运，未改逻辑）

import {
  corsHeaders,
  jsonResponse,
} from "../http.js";
import { handleVerifyCode } from "../mail_verify/verify.js";
import {
  checkAuth,
  signAccessToken,
} from "../auth/jwt.js";
import { getKv } from "../auth/kv.js";
import { serialize } from "cookie";
import {
  KV_PREFIX,
  REFRESH_TOKEN_TTL,
  TAG_LOGGEDIN,
  allowedEmailDomains,
  providerMap,
} from "../config.js";
import { ERROR_CODES } from "../../../shared/error-codes.js";
import { ACTION_PRESETS } from "../../../shared/config.js";
import {
  createReverseVerification,
  deleteReverseVerification,
  verifyReverseCode,
} from "../../../shared/email-reverse-verify.js";

export async function handleProfileRoutes({ request, env, url, path, method, cors }) {
        if (path === "/api/ayonline/oauth-unbind" && method === "POST") {
          const [authStatus, user] = await checkAuth(request, env);
          if (authStatus !== TAG_LOGGEDIN) {
            return jsonResponse({ error: "Unauthorized" }, 401, cors);
          }

          const body = await request.json().catch(() => null);
          if (!body || !body.provider) {
            return jsonResponse({ error: "Missing provider" }, 400, cors);
          }

          const result = await env.db
            .prepare(
              `DELETE FROM oauth_connections 
             WHERE user_sub = ? AND provider = ?`,
            )
            .bind(user.sub, body.provider)
            .run();

          if (result.meta?.changes === 0) {
            return jsonResponse({ error: "Binding not found" }, 404, cors);
          }

          return jsonResponse(
            { success: true, message: `Unbound ${body.provider}` },
            200,
            cors,
          );
        }

        if (path === "/api/ayonline/revoke-all-devices" && method === "POST") {
          const [authStatus, user] = await checkAuth(request, env);
          if (authStatus !== TAG_LOGGEDIN) {
            return jsonResponse({ error: "Unauthorized" }, 401, cors);
          }

          // 精确匹配 userId，避免 "1" 误匹配 "12"/"123"
          const result = await env.db
            .prepare(
              `DELETE FROM app_kv_store
             WHERE key LIKE ?
               AND json_extract(value, '$.userId') = ?`,
            )
            .bind(`${KV_PREFIX.REFRESH}%`, user.sub)
            .run();

          const deletedCount = result.meta?.changes || 0;

          // 清空用户的 token 索引
          await getKv().delete(`${KV_PREFIX.USER_TOKENS}${user.sub}`);

          // 清除当前设备的 Cookie
          const clearOptions = {
            domain: ".undz.cn",
            path: "/",
            httpOnly: true,
            secure: true,
            sameSite: "None",
            maxAge: 0,
          };

          const headers = new Headers(cors);
          headers.set("Content-Type", "application/json");
          headers.append(
            "Set-Cookie",
            serialize("access_token", "", clearOptions),
          );
          headers.append(
            "Set-Cookie",
            serialize("refresh_token", "", clearOptions),
          );

          return new Response(
            JSON.stringify({
              success: true,
              message: `All devices logged out (${deletedCount} tokens revoked)`,
              deletedCount,
            }),
            { status: 200, headers },
          );
        }

        if (path === "/api/ayonline/device-count" && method === "GET") {
          const [authStatus, user] = await checkAuth(request, env);
          if (authStatus !== TAG_LOGGEDIN) {
            return jsonResponse({ error: "Unauthorized" }, 401, cors);
          }

          const now = Math.floor(Date.now() / 1000);
          const result = await env.db
            .prepare(
              `SELECT COUNT(*) as count FROM app_kv_store
             WHERE key LIKE ?
               AND json_extract(value, '$.userId') = ?
               AND expires_at > ?`,
            )
            .bind(`${KV_PREFIX.REFRESH}%`, user.sub, now)
            .first();

          return jsonResponse({ count: result?.count || 0 }, 200, cors);
        }

        // 修改邮箱第一步：创建一个反向邮件验证任务。
        // 返回 { requestId, email, code, expiresAt }，前端把 email/code 展示给用户，
        // 用户用新邮箱向 email 发送正文为 code 的邮件，Worker 的 email() 入口负责匹配。
        if (path === "/api/ayonline/email-verify/create" && method === "POST") {
          const [authStatus, user] = await checkAuth(request, env);
          if (authStatus !== TAG_LOGGEDIN) {
            return jsonResponse(
              { error: "Unauthorized", error_code: ERROR_CODES.UNAUTHORIZED },
              401,
              cors,
            );
          }

          const body = await request.json().catch(() => null);
          const email =
            typeof body?.email === "string"
              ? body.email.trim().toLowerCase()
              : "";
          if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return jsonResponse(
              { error: "Invalid email", error_code: ERROR_CODES.INVALID_EMAIL },
              400,
              cors,
            );
          }
          if (!allowedEmailDomains.some((domain) => email.endsWith(domain))) {
            return jsonResponse(
              {
                error: "Unsupported email domain",
                error_code: ERROR_CODES.UNSUPPORTED_EMAIL_DOMAIN,
              },
              400,
              cors,
            );
          }

          const existing = await env.db
            .prepare(
              "SELECT sub FROM online_users WHERE email = ? AND sub != ?",
            )
            .bind(email, user.sub)
            .first();
          if (existing) {
            return jsonResponse(
              {
                error: "Email already exists",
                error_code: ERROR_CODES.EMAIL_ALREADY_EXISTS,
              },
              409,
              cors,
            );
          }

          try {
            const ticket = await createReverseVerification(env, {
              targetEmail: email,
              action: ACTION_PRESETS.CHANGE_EMAIL,
            });
            return jsonResponse(ticket, 200, cors);
          } catch (err) {
            return jsonResponse(
              {
                error: "Failed to create email verification",
                error_code: ERROR_CODES.SERVER_DOWN,
                detail: err.message,
              },
              500,
              cors,
            );
          }
        }

        // 修改邮箱第二步：前端轮询任务状态。只有任务 action 与 targetEmail 都对上才返回 valid。
        if (path === "/api/ayonline/email-verify/query" && method === "POST") {
          const [authStatus] = await checkAuth(request, env);
          if (authStatus !== TAG_LOGGEDIN) {
            return jsonResponse(
              { error: "Unauthorized", error_code: ERROR_CODES.UNAUTHORIZED },
              401,
              cors,
            );
          }

          const body = await request.json().catch(() => null);
          const requestId =
            typeof body?.requestId === "string" ? body.requestId.trim() : "";
          const email =
            typeof body?.email === "string"
              ? body.email.trim().toLowerCase()
              : "";
          if (!requestId || !email) {
            return jsonResponse(
              {
                error: "requestId and email required",
                error_code: ERROR_CODES.MISSING_PARAMS,
              },
              400,
              cors,
            );
          }

          const result = await verifyReverseCode(
            env,
            requestId,
            ACTION_PRESETS.CHANGE_EMAIL,
          );
          if (
            result.valid &&
            String(result.email || "").toLowerCase() !== email
          ) {
            return jsonResponse(
              { valid: false, error: "EMAIL_MISMATCH" },
              200,
              cors,
            );
          }
          return jsonResponse(result, 200, cors);
        }

        // 修改邮箱第三步（新增接口，不改动 update-profile 的既有契约）：
        // 前端带上反向验证 ticket 的 requestId，服务端复核后消费 ticket 并写库。
        if (path === "/api/ayonline/change-email" && method === "POST") {
          const [authStatus, user] = await checkAuth(request, env);
          if (authStatus !== TAG_LOGGEDIN) {
            return jsonResponse(
              { error: "Unauthorized", error_code: ERROR_CODES.UNAUTHORIZED },
              401,
              cors,
            );
          }

          const body = await request.json().catch(() => null);
          if (!body || typeof body !== "object") {
            return jsonResponse(
              {
                error: "Invalid request body",
                error_code: ERROR_CODES.MISSING_PARAMS,
              },
              400,
              cors,
            );
          }

          const email =
            typeof body.email === "string"
              ? body.email.trim().toLowerCase()
              : "";
          const emailVerifyId =
            typeof body.emailVerifyId === "string"
              ? body.emailVerifyId.trim()
              : "";

          if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return jsonResponse(
              { error: "Invalid email", error_code: ERROR_CODES.INVALID_EMAIL },
              400,
              cors,
            );
          }
          if (!allowedEmailDomains.some((domain) => email.endsWith(domain))) {
            return jsonResponse(
              {
                error: "Unsupported email domain",
                error_code: ERROR_CODES.UNSUPPORTED_EMAIL_DOMAIN,
              },
              400,
              cors,
            );
          }
          if (!emailVerifyId) {
            return jsonResponse(
              {
                error: "Email change requires email verification",
                error_code: ERROR_CODES.EMAIL_CHANGE_CODE_REQUIRED,
              },
              400,
              cors,
            );
          }

          // 二次校验：verifyReverseCode 只读不删，避免仅凭前端轮询结果绕过。
          const verifyResult = await verifyReverseCode(
            env,
            emailVerifyId,
            ACTION_PRESETS.CHANGE_EMAIL,
          );
          if (
            !verifyResult.valid ||
            String(verifyResult.email || "").toLowerCase() !== email
          ) {
            return jsonResponse(
              {
                error: "Invalid or expired email verification",
                error_code: ERROR_CODES.INVALID_VERIFICATION_CODE,
              },
              400,
              cors,
            );
          }

          const existing = await env.db
            .prepare(
              "SELECT sub FROM online_users WHERE email = ? AND sub != ?",
            )
            .bind(email, user.sub)
            .first();
          if (existing) {
            return jsonResponse(
              {
                error: "Email already exists",
                error_code: ERROR_CODES.EMAIL_ALREADY_EXISTS,
              },
              409,
              cors,
            );
          }

          // 一次性凭证：先消费再写库，防止同一 ticket 在保留期内被重复使用。
          const consumed = await deleteReverseVerification(env, emailVerifyId);
          if (!consumed) {
            return jsonResponse(
              {
                error: "Email verification already used or expired",
                error_code: ERROR_CODES.INVALID_VERIFICATION_CODE,
              },
              400,
              cors,
            );
          }

          await env.db
            .prepare(
              "UPDATE online_users SET email = ?, updated_at = ? WHERE sub = ?",
            )
            .bind(email, Date.now(), user.sub)
            .run();

          const newUser = await env.db
            .prepare(
              "SELECT sub, username, email, banned, ban_reason, gender, avatar, description, created_at FROM online_users WHERE sub = ?",
            )
            .bind(user.sub)
            .first();

          // 邮箱已变化，重签 access_token 让 Cookie 里的登录态同步更新。
          const newAccessToken = await signAccessToken(
            {
              sub: newUser.sub,
              username: newUser.username,
              email: newUser.email,
              gender: newUser.gender,
              avatar: newUser.avatar,
              description: newUser.description,
              created_at: newUser.created_at,
            },
            env.JWT_KEY,
          );

          const cookieOptions = {
            domain: ".undz.cn",
            path: "/",
            httpOnly: true,
            secure: true,
            sameSite: "Lax",
            maxAge: REFRESH_TOKEN_TTL,
          };
          const headers = new Headers(corsHeaders(request));
          headers.set("Content-Type", "application/json");
          headers.append(
            "Set-Cookie",
            serialize("access_token", newAccessToken, cookieOptions),
          );

          return new Response(
            JSON.stringify({
              success: true,
              message: "Email updated",
              user: {
                sub: newUser.sub,
                username: newUser.username,
                email: newUser.email,
                gender: newUser.gender,
                avatar: newUser.avatar,
                description: newUser.description,
                created_at: newUser.created_at,
              },
            }),
            { status: 200, headers },
          );
        }

        if (path === "/api/ayonline/update-profile" && method === "POST") {
          const [authStatus, user] = await checkAuth(request, env);
          if (authStatus !== TAG_LOGGEDIN) {
            return jsonResponse({ error: "Unauthorized" }, 401, cors);
          }

          const body = await request.json().catch(() => null);
          if (!body || typeof body !== "object") {
            return jsonResponse({ error: "Invalid request body" }, 400, cors);
          }
          if (body.email) {
            const { code, token } = body;
            if (!code || !token) {
              return jsonResponse(
                {
                  error: "Email change requires verification code and token",
                  error_code: ERROR_CODES.EMAIL_CHANGE_CODE_REQUIRED,
                },
                400,
                cors,
              );
            }
            if (
              !allowedEmailDomains.some((domain) => body.email.endsWith(domain))
            ) {
              return jsonResponse(
                {
                  error: "Unsupported email domain",
                  error_code: ERROR_CODES.UNSUPPORTED_EMAIL_DOMAIN,
                },
                400,
                cors,
              );
            }
            // 验证验证码
            const verifyResult = await handleVerifyCode(code, token, env);
            if (!verifyResult.valid) {
              return jsonResponse(
                {
                  error:
                    verifyResult.error ||
                    "Invalid or expired verification code",
                  error_code: ERROR_CODES.INVALID_VERIFICATION_CODE,
                },
                400,
                cors,
              );
            }

            // 检查邮箱是否已被使用
            const existing = await env.db
              .prepare(
                "SELECT sub FROM online_users WHERE email = ? AND sub != ?",
              )
              .bind(body.email, user.sub)
              .first();
            if (existing) {
              return jsonResponse(
                {
                  error: "Email already exists",
                  error_code: ERROR_CODES.EMAIL_ALREADY_EXISTS,
                },
                409,
                cors,
              );
            }
          }
          // 允许更新的字段白名单
          const allowedFields = [
            "username",
            "gender",
            "avatar",
            "description",
            "email",
          ];
          const updates = {};
          for (const field of allowedFields) {
            if (body[field] !== undefined) {
              updates[field] = body[field];
            }
          }
          delete body.code;
          delete body.token;
          if (Object.keys(updates).length === 0) {
            return jsonResponse(
              { error: "No valid fields to update" },
              400,
              cors,
            );
          }

          // 唯一性检查
          if (updates.email) {
            const existing = await env.db
              .prepare(
                "SELECT sub FROM online_users WHERE email = ? AND sub != ?",
              )
              .bind(updates.email, user.sub)
              .first();
            if (existing) {
              return jsonResponse(
                { error: "Email already exists", error_code: ERROR_CODES.EMAIL_ALREADY_EXISTS },
                409,
                cors,
              );
            }
          }

          if (updates.username) {
            const existing = await env.db
              .prepare(
                "SELECT sub FROM online_users WHERE username = ? AND sub != ?",
              )
              .bind(updates.username, user.sub)
              .first();
            if (existing) {
              return jsonResponse(
                { error: "Username already exists", error_code: ERROR_CODES.USERNAME_ALREADY_EXISTS },
                409,
                cors,
              );
            }
          }

          // 构建动态 SET 子句
          const setClauses = [];
          const values = [];
          for (const [key, val] of Object.entries(updates)) {
            setClauses.push(`${key} = ?`);
            values.push(val);
          }
          setClauses.push("updated_at = ?");
          values.push(Date.now());
          values.push(user.sub);

          const sql = `UPDATE online_users SET ${setClauses.join(", ")} WHERE sub = ?`;
          await env.db
            .prepare(sql)
            .bind(...values)
            .run();

          // 获取最新用户信息
          const newUser = await env.db
            .prepare(
              "SELECT sub, username, email, banned, ban_reason, gender, avatar, description, created_at FROM online_users WHERE sub = ?",
            )
            .bind(user.sub)
            .first();

          // 签发新的 access_token
          const newAccessToken = await signAccessToken(
            {
              sub: newUser.sub,
              username: newUser.username,
              email: newUser.email,
              gender: newUser.gender,
              avatar: newUser.avatar,
              description: newUser.description,
              created_at: newUser.created_at,
            },
            env.JWT_KEY,
          );

          const cookieOptions = {
            domain: ".undz.cn",
            path: "/",
            httpOnly: true,
            secure: true,
            sameSite: "Lax",
            maxAge: REFRESH_TOKEN_TTL,
          };
          const headers = new Headers(corsHeaders(request));
          headers.set("Content-Type", "application/json");
          headers.append(
            "Set-Cookie",
            serialize("access_token", newAccessToken, cookieOptions),
          );

          return new Response(
            JSON.stringify({
              success: true,
              message: "Profile updated",
              user: {
                sub: newUser.sub,
                username: newUser.username,
                email: newUser.email,
                gender: newUser.gender,
                avatar: newUser.avatar,
                description: newUser.description,
                created_at: newUser.created_at,
              },
            }),
            { status: 200, headers },
          );
        }

        if (path === "/api/ayonline/oauth-bindings" && method === "GET") {
          const [authStatus, user] = await checkAuth(request, env);
          if (authStatus !== TAG_LOGGEDIN) {
            return jsonResponse({ error: "Unauthorized" }, 401, cors);
          }

          const bindings = await env.db
            .prepare(
              `SELECT provider, openid, created_at 
             FROM oauth_connections 
             WHERE user_sub = ?`,
            )
            .bind(user.sub)
            .all();

          const result = (bindings.results || []).map((row) => ({
            provider: row.provider,
            openid: row.openid,
            created_at: row.created_at,
            name: providerMap[row.provider]?.name || row.provider,
            icon: providerMap[row.provider]?.icon || "",
          }));

          return jsonResponse({ bindings: result }, 200, cors);
        }

  return null;
}
