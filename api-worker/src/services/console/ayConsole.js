// console.undz.cn —— 入口：CORS/OPTIONS、登录态校验、按前缀分发到 routes/*
import {
  checkAuth,
  TAG_BANNED,
  TAG_NOT_LOGGEDIN,
} from "../account/ayOnline.js";
import { jsonResponse, corsHeaders } from "./http.js";
import { handleOauthRoutes } from "./routes/oauth.js";
import { handleUserRoutes } from "./routes/users.js";
import { handleFeedbackRoutes } from "./routes/feedback.js";
import { handleSitesRoutes } from "./routes/sites.js";
import { handleLinksRoutes } from "./routes/links.js";
import { handleFilesAdmin } from "./routes/files.js";

// /api/console/* 的处理链（顺序即匹配顺序；各模块内部仍保持原文件里的块顺序）
const CONSOLE_ROUTES = [
  handleOauthRoutes,
  handleUserRoutes,
  handleFeedbackRoutes,
  handleSitesRoutes,
  handleLinksRoutes,
];

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
        const ctx = { request, env, url, path, method, cors, user, isAdmin };

        for (const handler of CONSOLE_ROUTES) {
          const res = await handler(ctx);
          if (res) return res;
        }
      } catch (error) {
        if (env.DEBUG) console.error("API error:", error);
        return jsonResponse({ error: "Internal server error" }, 500, cors);
      }
    }

    // /api/filesmanager —— 自带管理员校验与 try/catch
    const filesRes = await handleFilesAdmin({
      request,
      env,
      url,
      path,
      method,
      cors,
    });
    if (filesRes) return filesRes;

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
