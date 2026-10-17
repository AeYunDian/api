// routes/account-admin.js —— 由 account-api.js 拆分而来（逐行搬运，未改逻辑）
// /api/ayonline/init（X-Admin-Key）与 /api/ayonline/test（健康检查）。
// 这两个端点位于 appId / SDK 版本闸门之前，调用顺序不能挪。

import { jsonResponse } from "../http.js";
import { initDatabase } from "../db/schema.js";

export async function handleAdminRoutes({ request, env, url, path, method, cors }) {
        if (path === "/api/ayonline/init" && method === "POST") {
          const authKey = request.headers.get("X-Admin-Key");
          if (authKey !== env.KEY) {
            return jsonResponse({ error: "Unauthorized" }, 401, cors);
          }
          try {
            await initDatabase(env.db);
            return jsonResponse(
              { success: true, message: "Database initialized" },
              200,
              cors,
            );
          } catch (err) {
            if (env.DEBUG) console.error("Init failed:", err);
            // 返回更详细的错误信息便于调试
            return jsonResponse(
              {
                success: false,
                error: "Database initialization failed",
                detail: err.message,
                stack: err.stack,
              },
              500,
              cors,
            );
          }
        }

        if (path === "/api/ayonline/test") {
          return jsonResponse(
            { success: true, message: "Server is ready", code: 200 },
            200,
            cors,
          );
        }

  return null;
}
