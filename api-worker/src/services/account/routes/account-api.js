// routes/account-api.js —— /api/ayonline/* 分发器
// 顺序：前缀判定 → init/test（闸门之前）→ appId + SDK 版本闸门 → 三组业务路由。
// 具体端点在 account-admin.js / account-session.js / account-profile.js / account-oauth-apps.js。
import { jsonResponse } from "../http.js";
import { isVersionValid } from "../auth/tokens.js";
import { SDK_VER } from "../config.js";
import { ERROR_CODES } from "../../../shared/error-codes.js";
import { handleAdminRoutes } from "./account-admin.js";
import { handleSessionRoutes } from "./account-session.js";
import { handleProfileRoutes } from "./account-profile.js";
import { handleOauthAppRoutes } from "./account-oauth-apps.js";

const ROUTES = [handleSessionRoutes, handleProfileRoutes, handleOauthAppRoutes];

export async function handleAccountApi({ request, env, url, path, method, cors }) {
  if (!path.startsWith("/api/ayonline/")) return null;

  const ctx = { request, env, url, path, method, cors };

  // 管理 / 健康检查：不经过 appId 与 SDK 版本闸门
  const admin = await handleAdminRoutes(ctx);
  if (admin) return admin;

const appId = request.headers.get("X-App-Id") || "";
        if (!env.ALLOWED_APP_IDS.includes(appId)) {
          return jsonResponse(
            {
              success: false,
              code: 403,
              error_code: ERROR_CODES.INVALID_APP_ID,
              message: "appId is invalid",
            },
            403,
            cors,
          );
        }
        const sdkVer = request.headers.get("X-SDK-VER") || "";
        if (!sdkVer || !isVersionValid(sdkVer, SDK_VER)) {
          return jsonResponse(
            {
              success: false,
              code: 500,
              error_code: ERROR_CODES.SDK_VERSION_OUTDATED,
              message: "SDK version outdated, please upgrade",
            },
            500,
            cors,
          );
        }

  for (const handler of ROUTES) {
    const res = await handler(ctx);
    if (res) return res;
  }

  return null;
}
