// online.undz.cn.js
// ============================================================
// AY 统一身份认证中心 (online.undz.cn)
// 功能：注册、登录、登出、验证、刷新令牌、OAUTH
// 技术栈：Cloudflare Workers + D1 + KV + JWT (jose) + cookie
// ============================================================

import { getMainPage } from "../../shared/utils.js";
import { jsonResponse, corsHeaders, handleOptions } from "./http.js";
import { setKv } from "./auth/kv.js";
import { TAG_LOGGEDIN, TAG_NOT_LOGGEDIN, TAG_BANNED } from "./config.js";
import { handleThirdPartyAuth } from "./routes/third-party.js";
import { handleGithubAuth } from "./routes/github.js";
import { handleAccountApi } from "./routes/account-api.js";
import { handleOAuthServer } from "./routes/oauth-server.js";

// 对外契约（勿随意改动）：console / ai / analytics / chat 都从这里导入。
export { TAG_LOGGEDIN, TAG_NOT_LOGGEDIN, TAG_BANNED };
export { checkAuth, verifyBearerToken } from "./auth/jwt.js";
export { exchangeOAuthToken, revokeRefreshToken } from "./oauth/token.js";
export { initDatabase } from "./db/schema.js";
import { ERROR_CODES } from "../../shared/error-codes.js";

// ---------- 请求处理 ----------
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    const cors = corsHeaders(request);

    // 线上 500 且 wallTime≈0 的最常见原因：部署时丢了 D1 绑定，env.db 为 undefined，
    // 之后任何 db.prepare 都会同步抛 TypeError。这里提前讲清楚。
    if (!env.db) {
      console.error(
        "[account] 缺少 D1 绑定：env.db 未定义，请检查 wrangler.toml 的 [[d1_databases]]",
      );
      return jsonResponse(
        { error_code: ERROR_CODES.SERVER_DOWN, error: "D1 binding missing" },
        500,
        cors,
      );
    }

    // 注意：setKv 内部会自己 createKvStore，这里只能传 env.db。
    // 早期误写成 setKv(createKvStore(env.db)) 会包两层，运行时报 "db.prepare is not a function"。
    setKv(env.db);

    if (env.block === "true") {
      return new Response(
        getMainPage(
          "Ay Account Center",
          "<h1>503 Service Unavailable</h1>",
          `<p>服务器在计划内维护，预计 ${env.blocktime ? env.blocktime : "30"} 分钟后恢复，请您稍等。</p>`,
        ),
        {
          status: 503,
          headers: { "Content-Type": "text/html" },
        },
      );
    }

    if (method === "OPTIONS") {
      return handleOptions(request);
    }

    try {
      const thirdParty = await handleThirdPartyAuth({ request, env, url, path, method, cors });
      if (thirdParty) return thirdParty;

      const github = await handleGithubAuth({ request, env, url, path, method, cors });
      if (github) return github;

      const accountApi = await handleAccountApi({ request, env, url, path, method, cors });
      if (accountApi) return accountApi;
      const oauthServer = await handleOAuthServer({ request, env, url, path, method, cors });
      if (oauthServer) return oauthServer;
      return env.assets.fetch(request);
    } catch (error) {
      console.error(
        `[account] unhandled ${request.method} ${path}:`,
        error && error.stack ? error.stack : error,
      );
      return jsonResponse(
        { action: "none", error: "Internal Server Error", error_code: ERROR_CODES.SERVER_DOWN },
        500,
        cors,
      );
    }
  },
};
