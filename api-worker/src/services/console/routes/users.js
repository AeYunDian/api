// routes/users.js —— 由 ayConsole.js 拆分而来（逐行搬运，未改逻辑）

import { jsonResponse } from "../http.js";

export async function handleUserRoutes({ request, env, url, path, method, cors, user, isAdmin }) {
        if (path === "/api/console/user/ban" && method === "POST") {
          if (!isAdmin) {
            return jsonResponse({ error: "Admin only" }, 403, cors);
          }
          const body = await request.json().catch(() => null);
          if (!body || !body.user_id) {
            return jsonResponse({ error: "Missing user_id" }, 400, cors);
          }
          const targetUserId = parseInt(body.user_id, 10);
          if (targetUserId === 1) {
            return jsonResponse({ error: "Cannot ban super admin" }, 403, cors);
          }
          const banReason = body.ban_reason || "Banned by admin";
          const banned = body.banned === undefined ? 1 : body.banned ? 1 : 0;

          await env.db
            .prepare(
              "UPDATE online_users SET banned = ?, ban_reason = ? WHERE sub = ?",
            )
            .bind(banned, banReason, targetUserId)
            .run();

          return jsonResponse(
            {
              success: true,
              message: `User ${banned ? "banned" : "unbanned"}`,
            },
            200,
            cors,
          );
        }

        if (path === "/api/console/users" && method === "GET") {
          if (!isAdmin) {
            return jsonResponse({ error: "Admin only" }, 403, cors);
          }
          const users = await env.db
            .prepare(
              "SELECT sub, username, email, banned, ban_reason, created_at FROM online_users ORDER BY sub",
            )
            .all();
          return jsonResponse({ users: users.results }, 200, cors);
        }

        if (path === "/api/console/me" && method === "GET") {
          return jsonResponse({ user }, 200, cors);
        }

  return null;
}
