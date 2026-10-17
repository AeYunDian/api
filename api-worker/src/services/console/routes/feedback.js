// routes/feedback.js —— 由 ayConsole.js 拆分而来（逐行搬运，未改逻辑）

import { jsonResponse } from "../http.js";
import {
  TAG_LOGGEDIN,
  checkAuth,
} from "../../account/ayOnline.js";

export async function handleFeedbackRoutes({ request, env, url, path, method, cors, user, isAdmin }) {
        if (path === "/api/console/feedback/list" && method === "GET") {
          const [authStatus, user] = await checkAuth(request, env);
          if (authStatus !== TAG_LOGGEDIN) {
            return jsonResponse({ error: "Unauthorized" }, 401, cors);
          }
          const url = new URL(request.url);
          const statusFilter = url.searchParams.get("status");
          let sql = `SELECT * FROM feedbacks`;
          const params = [];
          if (!(user.sub === 1)) {
            sql += ` WHERE user_sub = ?`;
            params.push(user.sub);
          }
          if (statusFilter) {
            if (params.length > 0) {
              sql += ` AND status = ?`;
            } else {
              sql += ` WHERE status = ?`;
            }
            params.push(statusFilter);
          }
          sql += ` ORDER BY created_at DESC`;
          const { results } = await env.db
            .prepare(sql)
            .bind(...params)
            .all();
          return jsonResponse({ feedbacks: results }, 200, cors);
        }

        if (path === "/api/console/feedback/submit" && method === "POST") {
          const [authStatus, user] = await checkAuth(request, env);
          if (authStatus !== TAG_LOGGEDIN) {
            return jsonResponse({ error: "Unauthorized" }, 401, cors);
          }
          const key = `rl:v1:action:feedback`;
          if (env.limiter) {
            const { success } = await env.limiter.limit({ key });
            if (!success) {
              if (env.DEBUG)
                console.warn(
                  JSON.stringify({
                    event: "rate_limited",
                    policy: "feedback_submit",
                    user: user.sub,
                  }),
                );
              return jsonResponse(
                { error: "Too many requests, please slow down." },
                429,
                { ...cors, "Retry-After": "10" },
              );
            }
          }
          const body = await request.json().catch(() => null);
          if (!body || !body.content || body.content.trim() === "") {
            return jsonResponse({ error: "Content is required" }, 400, cors);
          }

          // 如果是普通用户，检查数量限制
          if (user.sub !== 1) {
            // 检查 pending/processing 数量
            const pendingCount = await env.db
              .prepare(
                `SELECT COUNT(*) as cnt FROM feedbacks WHERE user_sub = ? AND status IN ('pending', 'processing')`,
              )
              .bind(user.sub)
              .first();
            if (pendingCount.cnt >= 5) {
              return jsonResponse(
                {
                  error:
                    "You have too many pending/processing feedbacks (max 5)",
                },
                403,
                cors,
              );
            }
            // 检查总数量
            const totalCount = await env.db
              .prepare(
                `SELECT COUNT(*) as cnt FROM feedbacks WHERE user_sub = ?`,
              )
              .bind(user.sub)
              .first();
            if (totalCount.cnt >= 50) {
              return jsonResponse(
                { error: "You have reached the maximum total feedbacks (50)" },
                403,
                cors,
              );
            }
          }

          const now = Math.floor(Date.now() / 1000);
          const result = await env.db
            .prepare(
              `INSERT INTO feedbacks (user_sub, username, content, status, created_at, updated_at)
                  VALUES (?, ?, ?, 'pending', ?, ?)`,
            )
            .bind(user.sub, user.username, body.content.trim(), now, now)
            .run();
          const id = result.meta?.last_row_id;
          return jsonResponse({ success: true, id }, 201, cors);
        }

        if (
          path.startsWith("/api/console/feedback/delete/") &&
          method === "DELETE"
        ) {
          const id = parseInt(path.split("/").pop(), 10);
          if (!id) {
            return jsonResponse({ error: "Invalid id" }, 400, cors);
          }
          const [authStatus, user] = await checkAuth(request, env);
          if (authStatus !== TAG_LOGGEDIN) {
            return jsonResponse({ error: "Unauthorized" }, 401, cors);
          }
          const feedback = await env.db
            .prepare(`SELECT user_sub FROM feedbacks WHERE id = ?`)
            .bind(id)
            .first();
          if (!feedback) {
            return jsonResponse({ error: "Feedback not found" }, 404, cors);
          }
          if (!(user.sub === 1) && feedback.user_sub !== user.sub) {
            return jsonResponse({ error: "Forbidden" }, 403, cors);
          }

          await env.db
            .prepare(`DELETE FROM feedbacks WHERE id = ?`)
            .bind(id)
            .run();
          return jsonResponse(
            { success: true, message: "Feedback deleted" },
            200,
            cors,
          );
        }

        if (path === "/api/console/feedback/transfer" && method === "PUT") {
          const [authStatus, admin] = await checkAuth(request, env);
          if (authStatus !== TAG_LOGGEDIN || admin.sub !== 1) {
            return jsonResponse({ error: "Forbidden" }, 403, cors);
          }
          const body = await request.json().catch(() => null);
          if (!body || !body.feedback_id || !body.target_user_id) {
            return jsonResponse(
              { error: "Missing feedback_id or target_user_id" },
              400,
              cors,
            );
          }
          const feedbackId = parseInt(body.feedback_id, 10);
          const targetUserId = parseInt(body.target_user_id, 10);
          // 检查目标用户是否存在
          const targetUser = await env.db
            .prepare(`SELECT sub, username FROM online_users WHERE sub = ?`)
            .bind(targetUserId)
            .first();
          if (!targetUser) {
            return jsonResponse({ error: "Target user not found" }, 404, cors);
          }
          // 检查反馈是否存在
          const feedback = await env.db
            .prepare(`SELECT id FROM feedbacks WHERE id = ?`)
            .bind(feedbackId)
            .first();
          if (!feedback) {
            return jsonResponse({ error: "Feedback not found" }, 404, cors);
          }
          const now = Math.floor(Date.now() / 1000);
          await env.db
            .prepare(
              `UPDATE feedbacks SET user_sub = ?, username = ?, updated_at = ? WHERE id = ?`,
            )
            .bind(targetUser.sub, targetUser.username, now, feedbackId)
            .run();
          return jsonResponse(
            { success: true, message: "Feedback owner transferred" },
            200,
            cors,
          );
        }

        if (
          path.startsWith("/api/console/feedback/detail/") &&
          method === "GET"
        ) {
          const id = path.split("/").pop();
          if (!id || isNaN(parseInt(id))) {
            return jsonResponse({ error: "Invalid id" }, 400, cors);
          }
          const [authStatus, user] = await checkAuth(request, env);
          if (authStatus !== TAG_LOGGEDIN) {
            return jsonResponse({ error: "Unauthorized" }, 401, cors);
          }
          const feedback = await env.db
            .prepare(`SELECT * FROM feedbacks WHERE id = ?`)
            .bind(parseInt(id))
            .first();
          if (!feedback) {
            return jsonResponse({ error: "Feedback not found" }, 404, cors);
          }
          if (!(user.sub === 1) && feedback.user_sub !== user.sub) {
            return jsonResponse({ error: "Forbidden" }, 403, cors);
          }
          return jsonResponse({ feedback }, 200, cors);
        }

        if (
          path === "/api/console/feedback/update-status" &&
          method === "PUT"
        ) {
          const [authStatus, user] = await checkAuth(request, env);
          if (authStatus !== TAG_LOGGEDIN || user.sub !== 1) {
            return jsonResponse({ error: "Forbidden" }, 403, cors);
          }
          const body = await request.json().catch(() => null);
          if (!body || !body.id || !body.status) {
            return jsonResponse({ error: "Missing id or status" }, 400, cors);
          }
          const allowed = ["pending", "processing", "resolved", "closed"];
          if (!allowed.includes(body.status)) {
            return jsonResponse({ error: "Invalid status" }, 400, cors);
          }
          const now = Math.floor(Date.now() / 1000);
          let resolved_at = null;
          if (body.status === "resolved") {
            resolved_at = now;
          }
          await env.db
            .prepare(
              `UPDATE feedbacks SET status = ?, updated_at = ?, resolved_at = ? WHERE id = ?`,
            )
            .bind(body.status, now, resolved_at, body.id)
            .run();
          return jsonResponse({ success: true }, 200, cors);
        }

        if (path === "/api/console/feedback/reply" && method === "PUT") {
          const [authStatus, user] = await checkAuth(request, env);
          if (authStatus !== TAG_LOGGEDIN || user.sub !== 1) {
            return jsonResponse({ error: "Forbidden" }, 403, cors);
          }
          const body = await request.json().catch(() => null);
          if (!body || !body.id || !body.reply) {
            return jsonResponse({ error: "Missing id or reply" }, 400, cors);
          }
          const now = Math.floor(Date.now() / 1000);
          await env.db
            .prepare(
              `UPDATE feedbacks SET admin_reply = ?, updated_at = ? WHERE id = ?`,
            )
            .bind(body.reply.trim(), now, body.id)
            .run();
          return jsonResponse({ success: true }, 200, cors);
        }

  return null;
}
