// routes/oauth.js —— 由 ayConsole.js 拆分而来（逐行搬运，未改逻辑）

import { jsonResponse } from "../http.js";
import {
  TAG_LOGGEDIN,
  checkAuth,
} from "../../account/ayOnline.js";
import { generateToken } from "../../../shared/utils.js";

export async function handleOauthRoutes({ request, env, url, path, method, cors, user, isAdmin }) {
        if (
          path === "/api/console/oauth/client/register" &&
          method === "POST"
        ) {
          const body = await request.json().catch(() => null);
          if (!body) {
            return jsonResponse({ error: "Invalid request body" }, 400, cors);
          }
          const { name, redirect_uris, scope, trusted } = body;
          if (!name || !redirect_uris) {
            return jsonResponse(
              { error: "Missing required fields: name, redirect_uris" },
              400,
              cors,
            );
          }

          if (!isAdmin) {
            const countResult = await env.db
              .prepare(
                "SELECT COUNT(*) as cnt FROM oauth_clients WHERE user_sub = ?",
              )
              .bind(user.sub)
              .first();
            if (countResult.cnt >= 3) {
              return jsonResponse(
                { error: "Maximum 3 clients per user" },
                403,
                cors,
              );
            }
          }

          const clientId = generateToken();
          const clientSecret = generateToken();
          const now = Math.floor(Date.now() / 1000);

          await env.db
            .prepare(
              `INSERT INTO oauth_clients 
               (client_id, client_secret, name, redirect_uris, scope, trusted, created_at, updated_at, user_sub)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            )
            .bind(
              clientId,
              clientSecret,
              name,
              redirect_uris,
              scope || "openid profile email",
              trusted ? 1 : 0,
              now,
              now,
              user.sub,
            )
            .run();

          return jsonResponse(
            {
              success: true,
              client_id: clientId,
              client_secret: clientSecret,
              message: "Client registered",
            },
            201,
            cors,
          );
        }

        if (path === "/api/console/oauth/clients" && method === "GET") {
          let query = "SELECT * FROM oauth_clients";
          const params = [];
          if (!isAdmin) {
            query += " WHERE user_sub = ?";
            params.push(user.sub);
          }
          const clients = await env.db
            .prepare(query + " ORDER BY created_at DESC")
            .bind(...params)
            .all();

          let result = clients.results;
          if (isAdmin && result.length) {
            const creatorIds = [
              ...new Set(result.map((c) => c.user_sub).filter((id) => id)),
            ];
            if (creatorIds.length) {
              const placeholders = creatorIds.map(() => "?").join(",");
              const creators = await env.db
                .prepare(
                  `SELECT sub, username FROM online_users WHERE sub IN (${placeholders})`,
                )
                .bind(...creatorIds)
                .all();
              const creatorMap = Object.fromEntries(
                (creators.results || []).map((c) => [c.sub, c.username]),
              );
              result = result.map((c) => ({
                ...c,
                creator_username: creatorMap[c.user_sub] || null,
              }));
            }
          }

          return jsonResponse({ clients: result }, 200, cors);
        }

        if (
          path.startsWith("/api/console/oauth/client/") &&
          method === "DELETE"
        ) {
          const clientId = path.split("/").pop();
          if (!clientId) {
            return jsonResponse({ error: "Missing client_id" }, 400, cors);
          }

          const client = await env.db
            .prepare("SELECT user_sub FROM oauth_clients WHERE client_id = ?")
            .bind(clientId)
            .first();
          if (!client) {
            return jsonResponse({ error: "Client not found" }, 404, cors);
          }
          if (!isAdmin && client.user_sub !== user.sub) {
            return jsonResponse({ error: "Permission denied" }, 403, cors);
          }

          await env.db
            .prepare("DELETE FROM oauth_clients WHERE client_id = ?")
            .bind(clientId)
            .run();

          return jsonResponse(
            { success: true, message: "Client deleted" },
            200,
            cors,
          );
        }

        if (path === "/api/console/oauth/client/transfer" && method === "PUT") {
          const [authStatus, admin] = await checkAuth(request, env);
          if (authStatus !== TAG_LOGGEDIN || admin.sub !== 1) {
            return jsonResponse({ error: "Forbidden" }, 403, cors);
          }
          const body = await request.json().catch(() => null);
          if (!body || !body.client_id || !body.target_user_id) {
            return jsonResponse(
              { error: "Missing client_id or target_user_id" },
              400,
              cors,
            );
          }
          const clientId = body.client_id;
          const targetUserId = parseInt(body.target_user_id, 10);
          const targetUser = await env.db
            .prepare(`SELECT sub, username FROM online_users WHERE sub = ?`)
            .bind(targetUserId)
            .first();
          if (!targetUser) {
            return jsonResponse({ error: "Target user not found" }, 404, cors);
          }
          const client = await env.db
            .prepare(`SELECT client_id FROM oauth_clients WHERE client_id = ?`)
            .bind(clientId)
            .first();
          if (!client) {
            return jsonResponse({ error: "OAuth client not found" }, 404, cors);
          }
          const now = Math.floor(Date.now() / 1000);
          await env.db
            .prepare(
              `UPDATE oauth_clients SET user_sub = ?, updated_at = ? WHERE client_id = ?`,
            )
            .bind(targetUserId, now, clientId)
            .run();
          return jsonResponse(
            { success: true, message: "OAuth client owner transferred" },
            200,
            cors,
          );
        }

  return null;
}
