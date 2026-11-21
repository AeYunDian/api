// services/analytics/routes/me.js
// GET /api/me —— 唯一强制登录的接口

import { jsonResponse } from "../http.js";

export async function handleMeRoutes(ctx) {
  const { path, method, cors, user } = ctx;
  if (path !== "/api/me" || method !== "GET") return null;
  if (!user) return jsonResponse({ error: "Unauthorized" }, 401, cors);
  return jsonResponse(
    {
      user: {
        sub: user.sub,
        username: user.username,
        email: user.email,
      },
    },
    200,
    cors,
  );
}
