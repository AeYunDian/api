// services/analytics/routes/stats.js
// GET /api/sites/:id/stats     —— 统计（owner 全量，shared 按 share_config 裁剪）
// GET /api/sites/:id/realtime  —— 实时

import { DEFAULT_RANGE, LIMIT_KEYS } from "../config.js";
import { jsonResponse } from "../http.js";
import {
  allowRequest,
  clientIp,
  dayStr,
  shiftDay,
  safeParseArray,
} from "../utils.js";
import {
  BREAKDOWN_KEYS,
  findUserBySub,
  queryBreakdown,
  queryRealtimeEvents,
  querySeries,
  queryTotals,
} from "../db.js";
import { resolveAccessContext } from "../access.js";

const RANGE_MAP = {
  today: { days: 0, granularity: "hour" },
  "7d": { days: 6, granularity: "day" },
  "30d": { days: 29, granularity: "day" },
  "90d": { days: 89, granularity: "day" },
};

function resolveRange(rangeId) {
  const spec = RANGE_MAP[rangeId || DEFAULT_RANGE];
  if (!spec) return null;
  const today = dayStr();
  return {
    id: rangeId || DEFAULT_RANGE,
    from: shiftDay(today, -spec.days),
    to: today,
    granularity: spec.granularity,
  };
}

/** 限流 key：登录按用户，匿名按 IP */
function limitKey(kind, user, ip) {
  return user ? `${kind}:${user.sub}` : `${kind}:anon:${ip}`;
}

async function creatorName(env, site) {
  const creator = await findUserBySub(env.db, site.user_sub);
  return creator ? creator.username : null;
}

async function handleStats(ctx, siteId) {
  const { request, env, url, cors, user } = ctx;

  const range = resolveRange(url.searchParams.get("range"));
  if (!range) return jsonResponse({ error: "invalid_range" }, 400, cors);

  const asGuest = url.searchParams.get("as_guest") === "1";
  const access = await resolveAccessContext(request, env.db, siteId, user, {
    asGuest,
  });
  if (access.level === "denied") {
    return jsonResponse({ error: "not_found" }, 404, cors);
  }
  if (access.level === "need_login") {
    return jsonResponse({ error: "login_required" }, 401, cors);
  }

  if (
    !(await allowRequest(
      env,
      "limiter",
      limitKey(LIMIT_KEYS.stats, user, clientIp(request)),
    ))
  ) {
    return jsonResponse({ error: "rate_limited" }, 429, cors);
  }

  const { site } = access;
  const cfg = access.shareConfig;
  const privileged = access.level === "owner";
  const isOwner = !!user && site.user_sub === user.sub;
  const fromTs = Math.floor(Date.parse(range.from + "T00:00:00Z") / 1000);
  const toTs = Math.floor(Date.parse(range.to + "T23:59:59Z") / 1000);

  // 只执行被允许的聚合，隐藏维度不查库
  const stmts = [];
  const slot = {};
  const anyTotals =
    cfg.totals.pageviews || cfg.totals.visitors || cfg.totals.sessions;
  if (anyTotals) {
    slot.totals = stmts.length;
    stmts.push(queryTotals(env.db, site.token, fromTs, toTs));
  }
  if (cfg.series) {
    slot.series = stmts.length;
    stmts.push(querySeries(env.db, site.token, fromTs, toTs));
  }
  for (const key of BREAKDOWN_KEYS) {
    if (!cfg.breakdowns[key]) continue;
    const stmt = queryBreakdown(env.db, site.token, fromTs, toTs, key, {
      cnOnly: cfg.breakdowns.province === "CN_ONLY",
    });
    if (stmt) {
      slot[key] = stmts.length;
      stmts.push(stmt);
    }
  }

  const results = stmts.length ? await env.db.batch(stmts) : [];

  const totals = { pageviews: null, visitors: null, sessions: null };
  if (slot.totals !== undefined) {
    const row = (results[slot.totals].results || [])[0] || {};
    for (const key of Object.keys(totals)) {
      if (cfg.totals[key]) totals[key] = row[key] || 0;
    }
  }

  let series = null;
  if (slot.series !== undefined) {
    const byDay = {};
    ((results[slot.series] || {}).results || []).forEach((row) => {
      byDay[row.day] = row;
    });
    series = [];
    for (let d = range.from; d <= range.to; d = shiftDay(d, 1)) {
      const hit = byDay[d];
      series.push({
        label: d,
        pageviews: hit ? hit.pageviews : 0,
        visitors: hit ? hit.visitors : 0,
        sessions: hit ? hit.sessions : 0,
      });
    }
  }

  const breakdowns = {};
  for (const key of BREAKDOWN_KEYS) {
    breakdowns[key] =
      slot[key] !== undefined ? (results[slot[key]].results || []) : null;
  }

  let creator = null;
  if (privileged || cfg.creator) creator = await creatorName(env, site);

  return jsonResponse(
    {
      site: {
        id: site.id,
        name: site.name,
        domain: site.domain,
        domains: safeParseArray(site.domains, [site.domain]),
        visibility: site.visibility,
        listed: !!site.listed,
        creator_username: creator,
        token: privileged ? site.token : "",
      },
      range,
      access: { level: access.level, is_owner: isOwner },
      totals,
      series,
      breakdowns,
    },
    200,
    { ...cors, "Cache-Control": "no-store" },
  );
}

async function handleRealtime(ctx, siteId) {
  const { request, env, url, cors, user } = ctx;

  const asGuest = url.searchParams.get("as_guest") === "1";
  const access = await resolveAccessContext(request, env.db, siteId, user, {
    asGuest,
  });
  if (access.level === "denied") {
    return jsonResponse({ error: "not_found" }, 404, cors);
  }
  if (access.level === "need_login") {
    return jsonResponse({ error: "login_required" }, 401, cors);
  }
  if (access.level === "shared" && !access.shareConfig.realtime) {
    return jsonResponse({ error: "not_shared" }, 403, cors);
  }

  if (
    !(await allowRequest(
      env,
      "limiter",
      limitKey(LIMIT_KEYS.realtime, user, clientIp(request)),
    ))
  ) {
    return jsonResponse({ error: "rate_limited" }, 429, cors);
  }

  const { site } = access;
  const now = Math.floor(Date.now() / 1000);
  const since = now - 1800;
  const { results } = await queryRealtimeEvents(env.db, site.token, since);

  const minutes = [];
  for (let i = 29; i >= 0; i--) minutes.push({ label: i + "m", cur: 0 });

  const active = new Set();
  const recent = [];
  const nowMinute = Math.floor(now / 60);

  for (const row of results) {
    const mIdx = 29 - (nowMinute - Math.floor(row.ts / 60));
    if (mIdx >= 0 && mIdx < 30) minutes[mIdx].cur += 1;
    if (row.ts >= now - 300) active.add(row.visitor);
    if (recent.length < 8) {
      recent.push({ ts: row.ts, path: row.path, country: row.country || "" });
    }
  }

  return jsonResponse({ online: active.size, minutes, recent }, 200, {
    ...cors,
    "Cache-Control": "no-store",
  });
}

export async function handleStatsRoutes(ctx) {
  const { path, method } = ctx;
  if (method !== "GET") return null;

  const stats = path.match(/^\/api\/sites\/(\d+)\/stats$/);
  if (stats) return handleStats(ctx, parseInt(stats[1], 10));

  const rt = path.match(/^\/api\/sites\/(\d+)\/realtime$/);
  if (rt) return handleRealtime(ctx, parseInt(rt[1], 10));

  return null;
}
