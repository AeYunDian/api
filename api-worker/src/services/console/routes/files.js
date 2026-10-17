// routes/files.js —— 由 ayConsole.js 拆分而来（逐行搬运，未改逻辑）
// /api/filesmanager：R2 文件管理（上传 / 更新 / 列表 / 下载 / 删除），自带管理员校验。

import { jsonResponse } from "../http.js";
import {
  normalizePath,
  parseBool,
  readUploadBody,
} from "../utils.js";
import {
  TAG_BANNED,
  TAG_NOT_LOGGEDIN,
  checkAuth,
} from "../../account/ayOnline.js";
import { generateToken } from "../../../shared/utils.js";

export async function handleFilesAdmin({ request, env, url, path, method, cors }) {
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

  return null;
}
