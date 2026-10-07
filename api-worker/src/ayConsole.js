// console.undz.cn.js
import {
  checkAuth,
  TAG_LOGGEDIN,
  TAG_BANNED,
  TAG_NOT_LOGGEDIN,
} from "./ayOnline.js";
import { generateToken } from "./utils.js";

const ALLOWED_ORIGINS = [
  "https://online.undz.cn",
  "https://console.undz.cn",
  "https://online-dev.undz.cn",
  "https://console-dev.undz.cn",
  "https://mysites.undz.cn",
  "https://mysites-dev.undz.cn",
];

function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...extraHeaders,
    },
  });
}
function corsHeaders(request) {
  const origin = request.headers.get("Origin");
  const headers = {
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-app-id, x-sdk-ver",
    "Access-Control-Max-Age": "86400",
  };
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  } else {
    headers["Access-Control-Allow-Origin"] = "null";
  }
  return headers;
}
function parseBool(v) {
  if (v === true || v === 1) return true;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    return s === "true" || s === "1" || s === "yes";
  }
  return false;
}

function normalizePath(input) {
  if (typeof input !== "string") return null;
  let p = input.trim();
  if (!p) return null;
  p = p.replace(/\\/g, "/");
  if (!p.startsWith("/")) p = "/" + p;
  p = p.replace(/\/+/g, "/");
  while (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  if (p.split("/").some((seg) => seg === "..")) return null;
  if (p.length > 512) return null;
  if (/[\x00-\x1f]/.test(p)) return null;
  return p;
}

async function readUploadBody(request) {
  const ct = request.headers.get("Content-Type") || "";
  let fields = {};
  let file = null;
  if (ct.includes("multipart/form-data")) {
    const form = await request.formData().catch(() => null);
    if (!form) return { fields: null, file: null };
    for (const [k, v] of form.entries()) {
      if (typeof v === "string") {
        fields[k] = v;
      } else if (
        v &&
        typeof v === "object" &&
        typeof v.arrayBuffer === "function"
      ) {
        if (k === "file") file = v;
        else fields[k] = v;
      }
    }
  } else {
    const body = await request.json().catch(() => null);
    if (!body) return { fields: null, file: null };
    fields = body;
  }
  return { fields, file };
}
// ========== 主 Worker ==========
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    const cors = corsHeaders(request);
    if (method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: cors,
      });
    }

    if (path.startsWith("/api/console/")) {
      try {
        const [authStatus, user] = await checkAuth(request, env);
        if (authStatus === TAG_NOT_LOGGEDIN) {
          return jsonResponse({ error: "Unauthorized" }, 401, cors);
        }
        if (authStatus === TAG_BANNED) {
          return jsonResponse(
            { error: "Account banned", ban_reason: user.ban_reason },
            403,
            cors,
          );
        }

        const isAdmin = user.sub === 1;

        // ---------- 注册 OAuth 客户端 ----------
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
        // ---------- 删除客户端 ----------
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

        // ---------- 封禁/解封用户 ----------
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

        // ---------- 获取用户列表 ----------
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

        // ---------- 获取当前用户信息 ----------
        if (path === "/api/console/me" && method === "GET") {
          return jsonResponse({ user }, 200, cors);
        }

        // 修改提交反馈路由，增加数量限制
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

        // 删除反馈（用户可删自己的，管理员可删任何）
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

        // 转移反馈所有者
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

        // 管理员回复反馈
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
        // 转移 OAuth 应用所有者
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

        // ---------- 网站分析：站点管理 ----------
        // 注意：isAdmin 与 user 已在块顶部取得

        // 列出站点（管理员看全部，普通用户只看自己）
        if (path === "/api/console/sites" && method === "GET") {
          let sql =
            "SELECT id, token, user_sub, domain, name, created_at, updated_at FROM analytics_sites";
          const params = [];
          if (!isAdmin) {
            sql += " WHERE user_sub = ?";
            params.push(user.sub);
          }
          sql += " ORDER BY created_at DESC";
          const rows = await env.db
            .prepare(sql)
            .bind(...params)
            .all();

          let result = rows.results || [];
          if (isAdmin && result.length) {
            const creatorIds = [
              ...new Set(result.map((s) => s.user_sub).filter((x) => x)),
            ];
            if (creatorIds.length) {
              const placeholders = creatorIds.map(() => "?").join(",");
              const creators = await env.db
                .prepare(
                  `SELECT sub, username FROM online_users WHERE sub IN (${placeholders})`,
                )
                .bind(...creatorIds)
                .all();
              const map = Object.fromEntries(
                (creators.results || []).map((c) => [c.sub, c.username]),
              );
              result = result.map((s) => ({
                ...s,
                creator_username: map[s.user_sub] || null,
              }));
            }
          }
          return jsonResponse({ sites: result }, 200, cors);
        }

        // 注册站点：与 OAuth 应用共用 generateToken() 生成客户端 ID
        if (path === "/api/console/sites" && method === "POST") {
          const body = await request.json().catch(() => null);
          if (!body || !body.domain) {
            return jsonResponse({ error: "Missing domain" }, 400, cors);
          }

          // 规范化并校验域名
          const domain = String(body.domain)
            .trim()
            .toLowerCase()
            .replace(/^https?:\/\//, "")
            .replace(/^www\./, "")
            .replace(/\/.*$/, "");
          if (
            !domain ||
            !/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(
              domain,
            )
          ) {
            return jsonResponse({ error: "Invalid domain format" }, 400, cors);
          }

          const name =
            String(body.name || domain)
              .trim()
              .slice(0, 100) || domain;

          // 数量限制：user 1 不限，其他最多 5 个
          if (user.sub !== 1) {
            const cnt = await env.db
              .prepare(
                "SELECT COUNT(*) AS cnt FROM analytics_sites WHERE user_sub = ?",
              )
              .bind(user.sub)
              .first();
            if (cnt.cnt >= 5) {
              return jsonResponse(
                { error: "Maximum 5 sites per user" },
                403,
                cors,
              );
            }
          }

          // 域名唯一
          const exists = await env.db
            .prepare("SELECT id FROM analytics_sites WHERE domain = ?")
            .bind(domain)
            .first();
          if (exists) {
            return jsonResponse(
              { error: "Domain already registered" },
              409,
              cors,
            );
          }

          // ← 与 OAuth 应用同一个生成函数
          const token = generateToken();
          const now = Math.floor(Date.now() / 1000);

          const inserted = await env.db
            .prepare(
              `INSERT INTO analytics_sites (token, user_sub, domain, name, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?)`,
            )
            .bind(token, user.sub, domain, name, now, now)
            .run();

          return jsonResponse(
            {
              success: true,
              site: {
                id: inserted.meta.last_row_id,
                token,
                user_sub: user.sub,
                domain,
                name,
                created_at: now,
                updated_at: now,
              },
            },
            201,
            cors,
          );
        }

        // 删除站点
        if (path.startsWith("/api/console/sites/") && method === "DELETE") {
          const id = parseInt(path.split("/").pop(), 10);
          if (!id) return jsonResponse({ error: "Invalid id" }, 400, cors);

          const site = await env.db
            .prepare("SELECT user_sub, token FROM analytics_sites WHERE id = ?")
            .bind(id)
            .first();
          if (!site)
            return jsonResponse({ error: "Site not found" }, 404, cors);
          if (!isAdmin && site.user_sub !== user.sub) {
            return jsonResponse({ error: "Permission denied" }, 403, cors);
          }

          await env.db.batch([
            env.db
              .prepare("DELETE FROM analytics_events WHERE site_token = ?")
              .bind(site.token),
            env.db.prepare("DELETE FROM analytics_sites WHERE id = ?").bind(id),
          ]);
          return jsonResponse(
            { success: true, message: "Site deleted" },
            200,
            cors,
          );
        }

        // 转移站点所有者（仅管理员）
        if (path === "/api/console/sites/transfer" && method === "PUT") {
          if (!isAdmin) return jsonResponse({ error: "Admin only" }, 403, cors);
          const body = await request.json().catch(() => null);
          if (!body || !body.site_id || !body.target_user_id) {
            return jsonResponse(
              { error: "Missing site_id or target_user_id" },
              400,
              cors,
            );
          }
          const siteId = parseInt(body.site_id, 10);
          const targetUserId = parseInt(body.target_user_id, 10);

          const site = await env.db
            .prepare("SELECT id FROM analytics_sites WHERE id = ?")
            .bind(siteId)
            .first();
          if (!site)
            return jsonResponse({ error: "Site not found" }, 404, cors);

          const target = await env.db
            .prepare("SELECT sub, username FROM online_users WHERE sub = ?")
            .bind(targetUserId)
            .first();
          if (!target)
            return jsonResponse({ error: "Target user not found" }, 404, cors);

          const now = Math.floor(Date.now() / 1000);
          await env.db
            .prepare(
              "UPDATE analytics_sites SET user_sub = ?, updated_at = ? WHERE id = ?",
            )
            .bind(targetUserId, now, siteId)
            .run();

          return jsonResponse(
            {
              success: true,
              message: "Site owner transferred",
              target_username: target.username,
            },
            200,
            cors,
          );
        }
      } catch (error) {
        if (env.DEBUG) console.error("API error:", error);
        return jsonResponse({ error: "Internal server error" }, 500, cors);
      }
    }
    if (path === "/api/filesmanager/" || path === "/api/filesmanager") {
      try {
        const [authStatus, user] = await checkAuth(request, env);
        if (authStatus === TAG_NOT_LOGGEDIN) {
          return jsonResponse({ error: "Unauthorized" }, 401, cors);
        }
        if (authStatus === TAG_BANNED) {
          return jsonResponse(
            { error: "Account banned", ban_reason: user.ban_reason },
            403,
            cors,
          );
        }
        if (!user || user.sub !== 1) {
          return jsonResponse({ error: "Admin only" }, 403, cors);
        }

        // ---------- POST 上传 ----------
        if (method === "POST") {
          const { fields, file } = await readUploadBody(request);
          if (!fields) {
            return jsonResponse({ error: "Invalid request body" }, 400, cors);
          }
          if (!fields.path) {
            return jsonResponse({ error: "Missing path" }, 400, cors);
          }
          if (!file) {
            return jsonResponse({ error: "Missing file" }, 400, cors);
          }

          const normalized = normalizePath(fields.path);
          if (!normalized) {
            return jsonResponse({ error: "Invalid path" }, 400, cors);
          }

          const existing = await env.db
            .prepare("SELECT id FROM file_manager WHERE path = ?")
            .bind(normalized)
            .first();
          if (existing) {
            return jsonResponse(
              { error: "Path already exists, use PUT to update" },
              409,
              cors,
            );
          }

          let code = fields.code ? String(fields.code).trim() : generateToken();
          if (!/^[A-Za-z0-9_-]{4,128}$/.test(code)) {
            return jsonResponse(
              { error: "Invalid code (4-128 chars, [A-Za-z0-9_-])" },
              400,
              cors,
            );
          }
          const codeExists = await env.db
            .prepare("SELECT id FROM file_manager WHERE code = ?")
            .bind(code)
            .first();
          if (codeExists) {
            return jsonResponse({ error: "Code already in use" }, 409, cors);
          }

          const needPassword = parseBool(fields.needPassword);
          const password = needPassword
            ? String(fields.password || "").trim()
            : null;
          if (needPassword && !password) {
            return jsonResponse(
              { error: "Password is required when needPassword is true" },
              400,
              cors,
            );
          }

          let expirationAt = null;
          if (
            fields.expirationat !== undefined &&
            fields.expirationat !== null &&
            fields.expirationat !== ""
          ) {
            const n = parseInt(fields.expirationat, 10);
            if (!isNaN(n) && n > 0) expirationAt = n;
          }

          const now = Math.floor(Date.now() / 1000);
          const r2Key = `files${normalized}`;
          const mimeType = file.type || "application/octet-stream";
          const size = file.size;

          await env.STORAGE_BUCKET.put(r2Key, await file.arrayBuffer(), {
            httpMetadata: { contentType: mimeType },
          });

          try {
            const res = await env.db
              .prepare(
                `INSERT INTO file_manager
              (path, code, need_password, password, expiration_at, r2_key, size, mime_type, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              )
              .bind(
                normalized,
                code,
                needPassword ? 1 : 0,
                password,
                expirationAt,
                r2Key,
                size,
                mimeType,
                now,
                now,
              )
              .run();

            return jsonResponse(
              {
                success: true,
                id: res.meta?.last_row_id,
                path: normalized,
                code,
                url: `https://files.undz.cn/files/${code}`,
                need_password: needPassword,
                expiration_at: expirationAt,
                size,
                mime_type: mimeType,
              },
              201,
              cors,
            );
          } catch (err) {
            await env.STORAGE_BUCKET.delete(r2Key).catch(() => {});
            throw err;
          }
        }

        // ---------- PUT 更新（不存在不创建） ----------
        if (method === "PUT") {
          const { fields, file } = await readUploadBody(request);
          if (!fields) {
            return jsonResponse({ error: "Invalid request body" }, 400, cors);
          }
          if (!fields.path) {
            return jsonResponse({ error: "Missing path" }, 400, cors);
          }
          if (!file) {
            return jsonResponse({ error: "Missing file" }, 400, cors);
          }

          const normalized = normalizePath(fields.path);
          if (!normalized) {
            return jsonResponse({ error: "Invalid path" }, 400, cors);
          }

          const existing = await env.db
            .prepare("SELECT * FROM file_manager WHERE path = ?")
            .bind(normalized)
            .first();
          if (!existing) {
            return jsonResponse({ error: "File not found" }, 404, cors);
          }

          let code = existing.code;
          if (fields.code !== undefined && String(fields.code).trim() !== "") {
            code = String(fields.code).trim();
            if (!/^[A-Za-z0-9_-]{4,128}$/.test(code)) {
              return jsonResponse(
                { error: "Invalid code (4-128 chars, [A-Za-z0-9_-])" },
                400,
                cors,
              );
            }
            if (code !== existing.code) {
              const dup = await env.db
                .prepare(
                  "SELECT id FROM file_manager WHERE code = ? AND id != ?",
                )
                .bind(code, existing.id)
                .first();
              if (dup) {
                return jsonResponse(
                  { error: "Code already in use" },
                  409,
                  cors,
                );
              }
            }
          }

          const needPassword =
            fields.needPassword !== undefined
              ? parseBool(fields.needPassword)
              : !!existing.need_password;

          let password = null;
          if (needPassword) {
            password =
              fields.password !== undefined
                ? String(fields.password).trim()
                : existing.password;
            if (!password) {
              return jsonResponse(
                { error: "Password is required when needPassword is true" },
                400,
                cors,
              );
            }
          }

          let expirationAt = existing.expiration_at;
          if (fields.expirationat !== undefined) {
            if (fields.expirationat === null || fields.expirationat === "") {
              expirationAt = null;
            } else {
              const n = parseInt(fields.expirationat, 10);
              if (!isNaN(n) && n > 0) expirationAt = n;
            }
          }

          const now = Math.floor(Date.now() / 1000);
          const mimeType =
            file.type || existing.mime_type || "application/octet-stream";
          const size = file.size;

          await env.STORAGE_BUCKET.put(
            existing.r2_key,
            await file.arrayBuffer(),
            {
              httpMetadata: { contentType: mimeType },
            },
          );

          await env.db
            .prepare(
              `UPDATE file_manager
             SET code = ?, need_password = ?, password = ?, expiration_at = ?,
                 size = ?, mime_type = ?, updated_at = ?
           WHERE id = ?`,
            )
            .bind(
              code,
              needPassword ? 1 : 0,
              password,
              expirationAt,
              size,
              mimeType,
              now,
              existing.id,
            )
            .run();

          return jsonResponse(
            {
              success: true,
              path: normalized,
              code,
              need_password: needPassword,
              expiration_at: expirationAt,
              size,
              mime_type: mimeType,
            },
            200,
            cors,
          );
        }

        // ---------- GET 取文件 / 列目录 ----------
        if (method === "GET") {
          let pathParam = url.searchParams.get("path");
          if (!pathParam) {
            const body = await request.json().catch(() => null);
            if (body && body.path) pathParam = body.path;
          }
          if (!pathParam) {
            return jsonResponse({ error: "Missing path" }, 400, cors);
          }

          const isDir =
            pathParam === "/" || pathParam === "" || pathParam.endsWith("/");

          if (isDir) {
            const dir = normalizePath(pathParam) || "/";
            const prefix = dir === "/" ? "/" : dir + "/";
            const escaped = prefix.replace(/[%_\\]/g, "\\$&");
            const rows = await env.db
              .prepare(
                `SELECT id, path, code, need_password, expiration_at, size, mime_type, created_at, updated_at
               FROM file_manager
              WHERE path LIKE ? ESCAPE '\\'
              ORDER BY path`,
              )
              .bind(escaped + "%")
              .all();
            return jsonResponse(
              { path: dir, files: rows.results || [] },
              200,
              cors,
            );
          }

          const normalized = normalizePath(pathParam);
          if (!normalized) {
            return jsonResponse({ error: "Invalid path" }, 400, cors);
          }

          const rec = await env.db
            .prepare("SELECT * FROM file_manager WHERE path = ?")
            .bind(normalized)
            .first();
          if (!rec) {
            return jsonResponse({ error: "File not found" }, 404, cors);
          }

          const obj = await env.STORAGE_BUCKET.get(rec.r2_key);
          if (!obj) {
            return jsonResponse(
              { error: "File missing in storage" },
              404,
              cors,
            );
          }

          const filename = rec.path.split("/").pop() || "file";
          const headers = {
            ...cors,
            "Content-Type": rec.mime_type || "application/octet-stream",
            "Content-Disposition":
              `attachment; filename="${filename}"; filename*=UTF-8''` +
              encodeURIComponent(filename),
          };
          if (obj.size) headers["Content-Length"] = String(obj.size);
          return new Response(obj.body, { status: 200, headers });
        }

        // ---------- DELETE 删文件 / 删目录 ----------
        if (method === "DELETE") {
          let pathParam = url.searchParams.get("path");
          if (!pathParam) {
            const body = await request.json().catch(() => null);
            if (body && body.path) pathParam = body.path;
          }
          if (!pathParam) {
            return jsonResponse({ error: "Missing path" }, 400, cors);
          }

          const isDir = pathParam === "/" || pathParam.endsWith("/");

          if (isDir) {
            const dir = normalizePath(pathParam) || "/";
            const prefix = dir === "/" ? "/" : dir + "/";
            const escaped = prefix.replace(/[%_\\]/g, "\\$&");
            const rows = await env.db
              .prepare(
                `SELECT id, r2_key FROM file_manager WHERE path LIKE ? ESCAPE '\\'`,
              )
              .bind(escaped + "%")
              .all();
            const list = rows.results || [];
            if (!list.length) {
              return jsonResponse(
                { error: "No files under directory" },
                404,
                cors,
              );
            }
            for (const r of list) {
              await env.STORAGE_BUCKET.delete(r.r2_key).catch(() => {});
            }
            await env.db
              .prepare(`DELETE FROM file_manager WHERE path LIKE ? ESCAPE '\\'`)
              .bind(escaped + "%")
              .run();
            return jsonResponse(
              { success: true, deleted: list.length, path: dir },
              200,
              cors,
            );
          }

          const normalized = normalizePath(pathParam);
          if (!normalized) {
            return jsonResponse({ error: "Invalid path" }, 400, cors);
          }

          const rec = await env.db
            .prepare("SELECT * FROM file_manager WHERE path = ?")
            .bind(normalized)
            .first();
          if (!rec) {
            return jsonResponse({ error: "File not found" }, 404, cors);
          }

          await env.STORAGE_BUCKET.delete(rec.r2_key).catch(() => {});
          await env.db
            .prepare("DELETE FROM file_manager WHERE id = ?")
            .bind(rec.id)
            .run();

          return jsonResponse(
            { success: true, message: "File deleted", path: normalized },
            200,
            cors,
          );
        }

        return jsonResponse({ error: "Method not allowed" }, 405, cors);
      } catch (error) {
        if (env.DEBUG) console.error("filesmanager API error:", error);
        return jsonResponse({ error: "Internal server error" }, 500, cors);
      }
    }
    try {
      return env.assets.fetch(request);
    } catch (err) {
      if (env.DEBUG) console.error(err);
      return new Response(
        `Worker threw exception: ${err.message}\nStack: ${err.stack || "no stack"}`,
        {
          status: 500,
          headers: { "Content-Type": "text/plain" },
        },
      );
    }
  },
};
