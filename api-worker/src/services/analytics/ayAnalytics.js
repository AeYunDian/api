// mysites.undz.cn — 网站分析服务入口
// 只做路由分流与认证，业务在 routes/*，SQL 在 db.js。
// 认证不强制：只有 /api/me 需要登录，其余接口按可见性自行判断。

import {
  checkAuth,
  TAG_BANNED,
  TAG_NOT_LOGGEDIN,
} from "../account/ayOnline.js";
import { buildTrackerScript } from "./tracker.js";
import { corsHeaders, CORS_OPEN, jsonResponse } from "./http.js";
import { handleIngest } from "./routes/ingest.js";
import { handleSitesRoutes } from "./routes/sites.js";
import { handleStatsRoutes } from "./routes/stats.js";
import { handleMeRoutes } from "./routes/me.js";

// 顺序即匹配顺序
const API_ROUTES = [handleSitesRoutes, handleStatsRoutes, handleMeRoutes];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // 跟踪器脚本（每次请求重新生成，DEBUG 下返回可读版本）
    if (path === "/analytics.js" && method === "GET") {
      return new Response(buildTrackerScript(env), {
        status: 200,
        headers: {
          "Content-Type": "text/javascript; charset=utf-8",
          "Cache-Control": "public, max-age=3600, must-revalidate",
          "Access-Control-Allow-Origin": "*",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    // 上报的 CORS 预检（全开）
    if (path === "/api/event" && method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_OPEN });
    }

    // 上报：POST（XHR）+ GET（IE Image beacon），不需要登录
    if (path === "/api/event") {
      if (method !== "GET" && method !== "POST") {
        return new Response(null, { status: 405, headers: CORS_OPEN });
      }
      try {
        return await handleIngest({ request, env, url });
      } catch (err) {
        if (env.DEBUG) console.error("[analytics] ingest error:", err);
        return new Response(null, { status: 500, headers: CORS_OPEN });
      }
    }

    const cors = corsHeaders(request);

    // 其余接口统一预检
    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    try {
      // 没带 Cookie 就不查会话；带了但过期按匿名处理，不强制跳登录
      let authStatus = TAG_NOT_LOGGEDIN;
      let user = null;
      if (request.headers.has("Cookie")) {
        [authStatus, user] = await checkAuth(request, env);
      }

      if (authStatus === TAG_BANNED) {
        return jsonResponse(
          { error: "Account banned", ban_reason: user.ban_reason },
          403,
          cors,
        );
      }

      const ctx = {
        request,
        env,
        url,
        path,
        method,
        cors,
        user,
        isAdmin: !!user && user.sub === 1,
      };

      for (const handler of API_ROUTES) {
        const res = await handler(ctx);
        if (res) return res;
      }

      return env.assets.fetch(request);
    } catch (error) {
      if (env.DEBUG) console.error("analytics API error:", error);
      return jsonResponse({ error: "Internal Server Error" }, 500, cors);
    }
  },
};
