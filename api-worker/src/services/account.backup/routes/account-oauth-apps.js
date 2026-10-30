// account-oauth-apps.js —— 由 account-api.js 拆分而来（逐行搬运，未改逻辑）

import { jsonResponse } from "../http.js";
import { checkAuth } from "../auth/jwt.js";
import { getKv } from "../auth/kv.js";
import {
  KV_PREFIX,
  REFRESH_TOKEN_TTL,
  TAG_LOGGEDIN,
} from "../config.js";
import { ERROR_CODES } from "../../../shared/error-codes.js";

export async function handleOauthAppRoutes({ request, env, url, path, method, cors }) {
        if (path === "/api/ayonline/revoke-oauth-tokens" && method === "POST") {
          const [authStatus, user] = await checkAuth(request, env);
          if (authStatus !== TAG_LOGGEDIN) {
            return jsonResponse({ error: "Unauthorized" }, 401, cors);
          }

          // 1) 只删该用户的 OAuth token（value 中有 clientId）
          const result = await env.db
            .prepare(
              `DELETE FROM app_kv_store
       WHERE key LIKE ?
         AND json_extract(value, '$.userId') = ?
         AND json_extract(value, '$.clientId') IS NOT NULL`,
            )
            .bind(`${KV_PREFIX.REFRESH}%`, user.sub)
            .run();

          const deletedCount = result.meta?.changes || 0;

          // 2) 更新 USER_TOKENS 列表：剔除已删除的 token
          const listKey = `${KV_PREFIX.USER_TOKENS}${user.sub}`;
          const remaining = await env.db
            .prepare(
              `SELECT key FROM app_kv_store
       WHERE key LIKE ?
         AND json_extract(value, '$.userId') = ?`,
            )
            .bind(`${KV_PREFIX.REFRESH}%`, user.sub)
            .all();

          const tokenList = (remaining.results || []).map((r) =>
            r.key.replace(KV_PREFIX.REFRESH, ""),
          );

          if (tokenList.length > 0) {
            await getKv().put(listKey, JSON.stringify(tokenList), {
              expirationTtl: REFRESH_TOKEN_TTL,
            });
          } else {
            await getKv().delete(listKey);
          }

          return jsonResponse(
            {
              success: true,
              message: `${deletedCount} OAuth refresh tokens revoked`,
            },
            200,
            cors,
          );
        }

        if (path === "/api/ayonline/revoke-oauth-app" && method === "POST") {
          try {
            const [authStatus, user] = await checkAuth(request, env);
            if (authStatus !== TAG_LOGGEDIN) {
              return jsonResponse({ error: "Unauthorized" }, 401, cors);
            }
            const body = await request.json().catch(() => null);
            if (!body || !body.client_id) {
              return jsonResponse({ error: "Missing client_id" }, 400, cors);
            }
            const clientId = body.client_id;
            const client = await env.db
              .prepare(
                "SELECT client_id FROM oauth_clients WHERE client_id = ?",
              )
              .bind(clientId)
              .first();
            if (!client) {
              return jsonResponse({ error: "Invalid client_id" }, 400, cors);
            }
            const result = await env.db
              .prepare(
                `DELETE FROM app_kv_store
         WHERE key LIKE ?
           AND json_extract(value, '$.userId') = ?
           AND json_extract(value, '$.clientId') = ?`,
              )
              .bind(`${KV_PREFIX.REFRESH}%`, user.sub, clientId)
              .run();
            const deletedCount = result.meta?.changes || 0;
            return jsonResponse(
              {
                success: true,
                message: `Revoked ${deletedCount} tokens for client ${clientId}`,
              },
              200,
              cors,
            );
          } catch (err) {
            console.error("[revoke-oauth-app] error:", err);
            return jsonResponse(
              {
                error: "Internal Server Error",
                error_code: ERROR_CODES.SERVER_DOWN,
                detail: env.DEBUG ? err.message : undefined,
              },
              500,
              cors,
            );
          }
        }

        if (path === "/api/ayonline/oauth-apps" && method === "GET") {
          const [authStatus, user] = await checkAuth(request, env);
          if (authStatus !== TAG_LOGGEDIN) {
            return jsonResponse({ error: "Unauthorized" }, 401, cors);
          }

          const now = Math.floor(Date.now() / 1000);

          // SQL 层过滤 + 聚合，只拉当前用户的 OAuth token
          const stats = await env.db
            .prepare(
              `SELECT
                json_extract(value, '$.clientId')  AS client_id,
                MIN(json_extract(value, '$.createdAt')) AS first_created_at,
                COUNT(*)                            AS token_count
             FROM app_kv_store
             WHERE key LIKE ?
               AND expires_at > ?
               AND json_extract(value, '$.userId') = ?
               AND json_extract(value, '$.clientId') IS NOT NULL
             GROUP BY json_extract(value, '$.clientId')`,
            )
            .bind(`${KV_PREFIX.REFRESH}%`, now, user.sub)
            .all();

          const statsArr = stats.results || [];
          if (statsArr.length === 0) {
            return jsonResponse({ apps: [] }, 200, cors);
          }

          const statMap = Object.fromEntries(
            statsArr.map((r) => [r.client_id, r]),
          );

          const clientIds = Object.keys(statMap);
          const placeholders = clientIds.map(() => "?").join(",");
          const clients = await env.db
            .prepare(
              `SELECT client_id, name, scope, trusted, created_at
             FROM oauth_clients
             WHERE client_id IN (${placeholders})`,
            )
            .bind(...clientIds)
            .all();

          const result = (clients.results || []).map((client) => {
            const stat = statMap[client.client_id];
            return {
              client_id: client.client_id,
              name: client.name,
              scope: client.scope,
              trusted: Boolean(client.trusted),
              created_at: client.created_at,
              authorized_at: stat?.first_created_at ?? null,
              token_count: stat?.token_count ?? 0,
            };
          });

          return jsonResponse({ apps: result }, 200, cors);
        }

        if (path === "/api/ayonline/oauth/revoke-client" && method === "POST") {
          const [authStatus, user] = await checkAuth(request, env);
          if (authStatus !== TAG_LOGGEDIN) {
            return jsonResponse({ error: "Unauthorized" }, 401, cors);
          }
          const body = await request.json().catch(() => null);
          if (!body || !body.client_id) {
            return jsonResponse({ error: "Missing client_id" }, 400, cors);
          }
          const clientId = body.client_id;
          const client = await env.db
            .prepare("SELECT client_id FROM oauth_clients WHERE client_id = ?")
            .bind(clientId)
            .first();
          if (!client) {
            return jsonResponse({ error: "Invalid client_id" }, 400, cors);
          }
          const deleteResult = await env.db
            .prepare(
              `DELETE FROM app_kv_store 
             WHERE key LIKE '${KV_PREFIX.REFRESH}%' 
               AND json_extract(value, '$.userId') = ? 
               AND json_extract(value, '$.clientId') = ?`,
            )
            .bind(user.sub, clientId)
            .run();
          const listKey = `${KV_PREFIX.USER_TOKENS}${user.sub}`;
          // 查询所有仍然有效的 refresh token（userId 匹配）
          const remainingRows = await env.db
            .prepare(
              `SELECT key FROM app_kv_store 
             WHERE key LIKE '${KV_PREFIX.REFRESH}%' 
               AND json_extract(value, '$.userId') = ?`,
            )
            .bind(user.sub)
            .all();
          const newTokenList = remainingRows.results.map((row) =>
            row.key.replace(KV_PREFIX.REFRESH, ""),
          );
          if (newTokenList.length > 0) {
            await getKv().put(listKey, JSON.stringify(newTokenList), {
              expirationTtl: REFRESH_TOKEN_TTL,
            });
          } else {
            await getKv().delete(listKey);
          }

          // 6. 返回成功
          return jsonResponse(
            {
              success: true,
              message: `Revoked all tokens for client ${clientId}`,
              deleted_count: deleteResult.meta?.changes || 0,
            },
            200,
            cors,
          );
        }

  return null;
}
