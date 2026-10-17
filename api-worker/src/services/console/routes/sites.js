// routes/sites.js —— 由 ayConsole.js 拆分而来（逐行搬运，未改逻辑）

import { jsonResponse } from "../http.js";
import { generateToken } from "../../../shared/utils.js";

export async function handleSitesRoutes({ request, env, url, path, method, cors, user, isAdmin }) {
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

  return null;
}
