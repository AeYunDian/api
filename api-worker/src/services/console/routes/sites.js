// routes/sites.js —— 网站分析的站点管理（console.undz.cn）
// 表：analytics_sites_v2 / analytics_events_v2（见 services/analytics/config.js）

import { jsonResponse } from "../http.js";
import { generateToken } from "../../../shared/utils.js";
import {
  MAX_SITES_PER_USER,
  SITE_NAME_MAX,
  VISIBILITY_VALUES,
} from "../../analytics/config.js";
import {
  parseShareConfig,
  sanitizeShareConfig,
} from "../../analytics/access.js";
import { buildDomainsList, findConflict } from "../../analytics/domains.js";
import {
  countSitesByUser,
  deleteSite,
  findSiteById,
  findUserBySub,
  insertSite,
  listConsoleSites,
  transferSite,
  updateSite,
  usernamesBySubs,
} from "../../analytics/db.js";
import { safeParseArray, clamp } from "../../analytics/utils.js";

function normalizeVisibility(value) {
  return VISIBILITY_VALUES.includes(value) ? value : "private";
}

function normalizeListed(visibility, requested) {
  if (visibility === "private") return 0;
  return requested === true ? 1 : 0;
}

function serializeSite(s) {
  return {
    id: s.id,
    token: s.token,
    user_sub: s.user_sub,
    domain: s.domain,
    domains: safeParseArray(s.domains, [s.domain]),
    name: s.name,
    visibility: s.visibility,
    listed: !!s.listed,
    share_config: parseShareConfig(s.share_config),
    created_at: s.created_at,
    updated_at: s.updated_at,
  };
}

export async function handleSitesRoutes({
  request,
  env,
  path,
  method,
  cors,
  user,
  isAdmin,
}) {
  if (path === "/api/console/sites" && method === "GET") {
    const rows = await listConsoleSites(env.db, user.sub, isAdmin);
    const list = rows.results || [];

    const subs = [...new Set(list.map((s) => s.user_sub))];
    const names = await usernamesBySubs(env.db, subs);

    const sites = list.map((s) => {
      const owner = s.user_sub === user.sub;
      const privileged = owner || isAdmin;
      return {
        ...serializeSite(s),
        token: privileged ? s.token : "",
        creator_username: privileged ? names[s.user_sub] || null : null,
        is_owner: owner,
      };
    });

    return jsonResponse({ sites }, 200, cors);
  }

  if (path === "/api/console/sites" && method === "POST") {
    const body = await request.json().catch(() => null);
    if (!body) return jsonResponse({ error: "invalid_body" }, 400, cors);

    const allowLocal = !!env.DEBUG;
    const domains = buildDomainsList(body, { allowLocal });
    if (!domains.length) {
      return jsonResponse({ error: "invalid_domain" }, 400, cors);
    }

    if (!isAdmin) {
      const count = await countSitesByUser(env.db, user.sub);
      if (count >= MAX_SITES_PER_USER) {
        return jsonResponse({ error: "site_limit" }, 403, cors);
      }
    }

    const conflict = await findConflict(env.db, domains, 0);
    if (conflict) {
      return jsonResponse(
        {
          error: "domain_taken",
          domain: conflict.domain,
          site: conflict.site,
        },
        409,
        cors,
      );
    }

    const visibility = normalizeVisibility(body.visibility);
    const listed = normalizeListed(visibility, body.listed);
    const shareConfig = sanitizeShareConfig(body.share_config);
    const name =
      clamp(String(body.name || domains[0]).trim(), SITE_NAME_MAX) || domains[0];
    const now = Math.floor(Date.now() / 1000);
    const token = generateToken();

    const inserted = await insertSite(env.db, {
      token,
      user_sub: user.sub,
      domain: domains[0],
      domains: JSON.stringify(domains),
      name,
      visibility,
      listed,
      share_config: JSON.stringify(shareConfig),
      created_at: now,
      updated_at: now,
    });

    return jsonResponse(
      {
        success: true,
        site: {
          id: inserted.meta.last_row_id,
          token,
          user_sub: user.sub,
          domain: domains[0],
          domains,
          name,
          visibility,
          listed: !!listed,
          share_config: shareConfig,
          created_at: now,
          updated_at: now,
        },
      },
      201,
      cors,
    );
  }

  if (path.match(/^\/api\/console\/sites\/\d+$/) && method === "PUT") {
    const id = parseInt(path.split("/").pop(), 10);
    const site = await findSiteById(env.db, id);
    if (!site) return jsonResponse({ error: "not_found" }, 404, cors);
    if (!isAdmin && site.user_sub !== user.sub) {
      return jsonResponse({ error: "permission_denied" }, 403, cors);
    }

    const body = await request.json().catch(() => null);
    if (!body) return jsonResponse({ error: "invalid_body" }, 400, cors);

    const fields = {};

    if (typeof body.name === "string" && body.name.trim()) {
      fields.name = clamp(body.name.trim(), SITE_NAME_MAX);
    }

    const wantsVisibility = VISIBILITY_VALUES.includes(body.visibility);
    const wantsListed = typeof body.listed === "boolean";
    const targetVisibility = wantsVisibility ? body.visibility : site.visibility;

    if (wantsVisibility) fields.visibility = targetVisibility;
    if (wantsVisibility || wantsListed) {
      const requested = wantsListed ? body.listed : site.listed === 1;
      fields.listed = normalizeListed(targetVisibility, requested);
    }

    if (body.share_config !== undefined) {
      fields.share_config = JSON.stringify(sanitizeShareConfig(body.share_config));
    }

    if (body.domains !== undefined || body.domain !== undefined) {
      const domains = buildDomainsList(body, { allowLocal: !!env.DEBUG });
      if (!domains.length) {
        return jsonResponse({ error: "invalid_domain" }, 400, cors);
      }
      const conflict = await findConflict(env.db, domains, id);
      if (conflict) {
        return jsonResponse(
          {
            error: "domain_taken",
            domain: conflict.domain,
            site: conflict.site,
          },
          409,
          cors,
        );
      }
      fields.domains = JSON.stringify(domains);
      fields.domain = domains[0];
    }

    if (!Object.keys(fields).length) {
      return jsonResponse({ error: "nothing_to_update" }, 400, cors);
    }

    fields.updated_at = Math.floor(Date.now() / 1000);
    await updateSite(env.db, id, fields);

    const updated = await findSiteById(env.db, id);
    const creator = await findUserBySub(env.db, updated.user_sub);

    return jsonResponse(
      {
        success: true,
        site: {
          ...serializeSite(updated),
          creator_username: creator ? creator.username : null,
          is_owner: updated.user_sub === user.sub,
        },
      },
      200,
      cors,
    );
  }

  if (path.startsWith("/api/console/sites/") && method === "DELETE") {
    const id = parseInt(path.split("/").pop(), 10);
    if (!id) return jsonResponse({ error: "Invalid id" }, 400, cors);

    const site = await findSiteById(env.db, id);
    if (!site) return jsonResponse({ error: "not_found" }, 404, cors);
    if (!isAdmin && site.user_sub !== user.sub) {
      return jsonResponse({ error: "permission_denied" }, 403, cors);
    }

    await deleteSite(env.db, id, site.token);
    return jsonResponse({ success: true, message: "Site deleted" }, 200, cors);
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

    const site = await findSiteById(env.db, siteId);
    if (!site) return jsonResponse({ error: "Site not found" }, 404, cors);

    const target = await findUserBySub(env.db, targetUserId);
    if (!target) {
      return jsonResponse({ error: "Target user not found" }, 404, cors);
    }

    await transferSite(
      env.db,
      siteId,
      targetUserId,
      Math.floor(Date.now() / 1000),
    );

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
