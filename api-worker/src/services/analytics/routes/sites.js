// services/analytics/routes/sites.js
// GET /api/sites        —— 双区块脱敏列表（public + mine），免授权
// GET /api/sites/:id    —— 站点元信息，按可见性返回 200 / 401 / 404

import { LIMIT_KEYS, LIST_LIMIT } from "../config.js";
import { jsonResponse } from "../http.js";
import { allowRequest, clientIp, safeParseArray } from "../utils.js";
import {
  listPublicSites,
  listSitesByUser,
  findUserBySub,
} from "../db.js";
import { parseShareConfig, resolveAccessContext } from "../access.js";

function toListItem(row) {
  return {
    id: row.id,
    name: row.name,
    domains: safeParseArray(row.domains, [row.domain]),
  };
}

async function handleList({ env, request, cors, user, isAdmin }) {
  const ip = clientIp(request);
  if (!(await allowRequest(env, "limiter", `${LIMIT_KEYS.sites}:${ip}`))) {
    return jsonResponse({ error: "rate_limited" }, 429, cors);
  }

  const [publicRows, mineRows] = await Promise.all([
    listPublicSites(env.db, {
      viewerSub: user ? user.sub : null,
      isAdmin: !!isAdmin,
      limit: LIST_LIMIT,
    }),
    user ? listSitesByUser(env.db, user.sub, LIST_LIMIT) : { results: [] },
  ]);

  return jsonResponse(
    {
      public: (publicRows.results || []).map(toListItem),
      mine: (mineRows.results || []).map(toListItem),
    },
    200,
    cors,
  );
}

async function handleMeta({ env, request, cors, user, siteId }) {
  const ip = clientIp(request);
  if (!(await allowRequest(env, "limiter", `${LIMIT_KEYS.sites}:${ip}`))) {
    return jsonResponse({ error: "rate_limited" }, 429, cors);
  }

  const access = await resolveAccessContext(request, env.db, siteId, user);
  if (access.level === "denied") {
    return jsonResponse({ error: "not_found" }, 404, cors);
  }
  if (access.level === "need_login") {
    // 不泄露站点名
    return jsonResponse({ error: "login_required" }, 401, cors);
  }

  const { site } = access;
  const privileged = access.level === "owner";
  const isOwner = !!user && site.user_sub === user.sub;
  const storedConfig = parseShareConfig(site.share_config);

  let creatorUsername = null;
  if (privileged || storedConfig.creator) {
    const creator = await findUserBySub(env.db, site.user_sub);
    creatorUsername = creator ? creator.username : null;
  }

  return jsonResponse(
    {
      site: {
        id: site.id,
        name: site.name,
        domains: safeParseArray(site.domains, [site.domain]),
        creator_username: creatorUsername,
      },
      access: { level: access.level, is_owner: isOwner },
      share_config: privileged ? storedConfig : access.shareConfig,
    },
    200,
    cors,
  );
}

export async function handleSitesRoutes(ctx) {
  const { path, method } = ctx;
  if (method !== "GET") return null;

  if (path === "/api/sites") return handleList(ctx);

  const match = path.match(/^\/api\/sites\/(\d+)$/);
  if (match) return handleMeta({ ...ctx, siteId: parseInt(match[1], 10) });

  return null;
}
