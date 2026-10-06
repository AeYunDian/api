// mysites.undz.cn — 网站分析
// ─────────────────────────────────────────────────────────
// 跟踪器脚本（ES5 + XHR）+ 事件接收 + 认证统计查询
// 复用 online.undz.cn 的统一账号体系（checkAuth + .undz.cn Cookie）
// ─────────────────────────────────────────────────────────

import {
  checkAuth,
  TAG_LOGGEDIN,
  TAG_BANNED,
  TAG_NOT_LOGGEDIN,
} from "./ayOnline.js";

const ALLOWED_ORIGINS = [
  "https://online.undz.cn",
  "https://console.undz.cn",
  "https://online-dev.undz.cn",
  "https://console-dev.undz.cn",
  "https://mysites.undz.cn",
  "https://mysites-dev.undz.cn",
];

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{20,80}$/;
const DOMAIN_PATTERN =
  /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/;
const MAX_BODY_BYTES = 4096;

/* ───────────────────────── helpers ───────────────────────── */

function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...extraHeaders },
  });
}

function corsHeaders(request) {
  const origin = request.headers.get("Origin");
  const headers = {
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  } else {
    headers["Access-Control-Allow-Origin"] = "null";
  }
  return headers;
}

/** 事件接收是公开的（来自任意第三方站点），CORS 放开 */
const CORS_OPEN = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

function normalizeDomain(raw) {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "")
    .slice(0, 255);
}

function clamp(v, n) {
  const s = String(v == null ? "" : v);
  return s.length > n ? s.slice(0, n) : s;
}

/* ─────────────────────── UA 解析 ─────────────────────── */

const BOT_RE =
  /bot|crawler|spider|slurp|headless|phantom|puppeteer|playwright|lighthouse|pingdom|uptime|monitor|scanner|curl\/|wget\/|python-requests|go-http-client|axios\/|node-fetch|okhttp|java\/|libwww|facebookexternalhit|embedly|quora link preview|preview|fetcher|archiver|validator|feedburner|semrush|ahrefs|mj12|dotbot|petalbot|bytespider|gptbot|ccbot|claudebot|perplexity|amazonbot|applebot/i;

function parseUa(ua) {
  if (!ua || BOT_RE.test(ua)) return null;

  let browser = "Other";
  if (/\bEdg(?:e|A|iOS)?\//.test(ua)) browser = "Edge";
  else if (/\bOPR\/|\bOpera\b/.test(ua)) browser = "Opera";
  else if (/\bFirefox\/|\bFxiOS\//.test(ua)) browser = "Firefox";
  else if (/\bCriOS\//.test(ua)) browser = "Chrome";
  else if (/\bChrome\/|\bChromium\//.test(ua)) browser = "Chrome";
  else if (/\bSafari\//.test(ua)) browser = "Safari";

  let os = "Other";
  if (/\bWindows NT\b/.test(ua)) os = "Windows";
  else if (/\bAndroid\b/.test(ua)) os = "Android";
  else if (/\b(?:iPhone|iPad|iPod)\b/.test(ua)) os = "iOS";
  else if (/\bMac OS X\b|\bMacintosh\b/.test(ua)) os = "macOS";
  else if (/\bLinux\b|\bX11\b/.test(ua)) os = "Linux";

  let device = "Desktop";
  if (/\biPad\b|\bTablet\b|\bPlayBook\b|\bAndroid(?!.*Mobile)\b/.test(ua))
    device = "Tablet";
  else if (/\bMobi\b|\bMobile\b|\biPhone\b|\biPod\b|\bAndroid\b/.test(ua))
    device = "Mobile";

  return { browser, os, device };
}

function screenBucket(raw) {
  const w = typeof raw === "number" ? raw : parseInt(String(raw || ""), 10);
  if (!isFinite(w) || w <= 0) return "";
  if (w >= 1440) return "≥1440";
  if (w >= 1024) return "1024-1439";
  if (w >= 768) return "768-1023";
  return "<768";
}

/* ─────────────────────── 访客哈希 ─────────────────────── */
// sha256(day ‖ site_token ‖ ip ‖ ua)，每日轮换，IP/UA 从不落库。
async function visitorHash(day, siteToken, ip, ua) {
  const material = `ay-analytics:${day}:${siteToken}:${ip}:${ua}`;
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(material),
  );
  const bytes = new Uint8Array(buf).slice(0, 12);
  let out = "";
  for (let i = 0; i < bytes.length; i++)
    out += bytes[i].toString(16).padStart(2, "0");
  return out;
}

/* ─────────────────────── 跟踪器脚本 ─────────────────────── */
// ES5 语法 + XMLHttpRequest。
// token 来源：src 的 ?token= 或 data-token，两者若同时出现必须一致，否则拒绝上报。
const TRACKER_JS =
  "(function(){\n" +
  "  var script = document.currentScript;\n" +
  "  if (!script) return;\n" +
  "  var src = script.src || '';\n" +
  "  var dataToken = script.getAttribute('data-token');\n" +
  "  var queryToken = null;\n" +
  "  var m = src.match(/[?&]token=([^&]+)/);\n" +
  "  if (m) queryToken = decodeURIComponent(m[1]);\n" +
  "  if (dataToken && queryToken && dataToken !== queryToken) return;\n" +
  "  var token = dataToken || queryToken;\n" +
  "  if (!token) return;\n" +
  "  var endpoint;\n" +
  "  try {\n" +
  "    var u = new URL(src, location.href);\n" +
  "    endpoint = u.origin + '/api/event';\n" +
  "  } catch (e) { return; }\n" +
  "  var domain = script.getAttribute('data-domain') || location.hostname;\n" +
  "  var lastPath = null;\n" +
  "  function send(name) {\n" +
  "    var body = JSON.stringify({\n" +
  "      n: String(name || 'event'),\n" +
  "      t: token,\n" +
  "      d: domain,\n" +
  "      u: location.href,\n" +
  "      r: document.referrer || '',\n" +
  "      w: window.innerWidth || 0\n" +
  "    });\n" +
  "    try {\n" +
  "      var xhr = new XMLHttpRequest();\n" +
  "      xhr.open('POST', endpoint, true);\n" +
  "      xhr.setRequestHeader('Content-Type', 'application/json');\n" +
  "      xhr.send(body);\n" +
  "    } catch (e) {}\n" +
  "  }\n" +
  "  function pageview() {\n" +
  "    if (location.pathname === lastPath) return;\n" +
  "    lastPath = location.pathname;\n" +
  "    send('pageview');\n" +
  "  }\n" +
  "  window.ayAnalytics = function(name) { send(String(name || 'event')); };\n" +
  "  var hist = window.history;\n" +
  "  if (hist && hist.pushState) {\n" +
  "    var push = hist.pushState;\n" +
  "    hist.pushState = function() {\n" +
  "      push.apply(this, arguments);\n" +
  "      pageview();\n" +
  "    };\n" +
  "    window.addEventListener('popstate', pageview);\n" +
  "  }\n" +
  "  if (document.visibilityState === 'prerender') {\n" +
  "    document.addEventListener('visibilitychange', function() {\n" +
  "      if (document.visibilityState === 'visible') pageview();\n" +
  "    });\n" +
  "  } else {\n" +
  "    pageview();\n" +
  "  }\n" +
  "})();";

/* ─────────────────────── 事件接收 ─────────────────────── */

async function handleIngest(request, env) {
  // 限流
  const ip = request.headers.get("cf-connecting-ip") || "0.0.0.0";
  if (env.limiter) {
    const { success } = await env.limiter.limit({ key: `evt:${ip}` });
    if (!success)
      return new Response(null, { status: 429, headers: CORS_OPEN });
  }

  const lenHeader = Number(request.headers.get("content-length") || "0");
  if (lenHeader > MAX_BODY_BYTES) {
    return new Response(null, { status: 413, headers: CORS_OPEN });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(null, { status: 400, headers: CORS_OPEN });
  }
  if (!body || typeof body !== "object") {
    return new Response(null, { status: 400, headers: CORS_OPEN });
  }

  const token = typeof body.t === "string" ? body.t : "";
  if (!token || !TOKEN_PATTERN.test(token)) {
    return new Response(null, { status: 400, headers: CORS_OPEN });
  }

  if (typeof body.d !== "string" || typeof body.u !== "string") {
    return new Response(null, { status: 400, headers: CORS_OPEN });
  }

  // 站点存在性
  const site = await env.db
    .prepare("SELECT domain FROM analytics_sites WHERE token = ?")
    .bind(token)
    .first();
  if (!site) return new Response(null, { status: 404, headers: CORS_OPEN });

  // 域名匹配
  const domain = normalizeDomain(body.d);
  const siteDomain = normalizeDomain(site.domain);
  if (!domain || domain !== siteDomain) {
    return new Response(null, { status: 403, headers: CORS_OPEN });
  }

  // UA 解析 + 机器人过滤
  const ua = request.headers.get("user-agent") || "";
  const uaInfo = parseUa(ua);
  if (!uaInfo) return new Response(null, { status: 204, headers: CORS_OPEN });

  // URL 解析
  let target;
  try {
    target = new URL(body.u);
  } catch {
    return new Response(null, { status: 400, headers: CORS_OPEN });
  }

  // 访客哈希
  const nowSec = Math.floor(Date.now() / 1000);
  const day = new Date(nowSec * 1000).toISOString().slice(0, 10);
  const visitor = await visitorHash(day, token, ip, ua);

  // referrer 只保留 host
  let ref = "";
  if (typeof body.r === "string" && body.r) {
    try {
      const refHost = new URL(body.r).hostname
        .toLowerCase()
        .replace(/^www\./, "");
      if (refHost && refHost !== siteDomain) ref = clamp(refHost, 255);
    } catch {
      /* ignore */
    }
  }

  const params = target.searchParams;
  const name =
    typeof body.n === "string" && body.n ? clamp(body.n, 64) : "pageview";
  const country =
    request.cf && request.cf.country ? String(request.cf.country) : "";

  let path = target.pathname || "/";
  if (path.length > 512) path = path.slice(0, 512);

  await env.db
    .prepare(
      `INSERT INTO analytics_events
             (site_token, ts, visitor, name, path, ref, country,
              browser, os, device, screen,
              utm_source, utm_medium, utm_campaign)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    )
    .bind(
      token,
      nowSec,
      visitor,
      name,
      path,
      ref,
      clamp(country, 8),
      uaInfo.browser,
      uaInfo.os,
      uaInfo.device,
      screenBucket(body.w),
      clamp(params.get("utm_source") || "", 255),
      clamp(params.get("utm_medium") || "", 255),
      clamp(params.get("utm_campaign") || "", 255),
    )
    .run();

  return new Response(null, { status: 204, headers: CORS_OPEN });
}

/* ─────────────────────── 日期工具 ─────────────────────── */

function dayStr(d) {
  const y = String(d.getUTCFullYear());
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function shiftDay(day, delta) {
  const t = Date.parse(day + "T00:00:00Z") + delta * 86400000;
  return dayStr(new Date(t));
}

function resolveRange(rangeId) {
  const now = new Date();
  const today = dayStr(now);
  switch (rangeId) {
    case "today":
      return { from: today, to: today, granularity: "hour" };
    case "7d":
      return { from: shiftDay(today, -6), to: today, granularity: "day" };
    case "30d":
      return { from: shiftDay(today, -29), to: today, granularity: "day" };
    case "90d":
      return { from: shiftDay(today, -89), to: today, granularity: "day" };
    default:
      return null;
  }
}

/* ─────────────────────── 统计查询 ─────────────────────── */

async function handleStats(request, env, user, siteId) {
  const url = new URL(request.url);
  const rangeId = url.searchParams.get("range") || "7d";
  const range = resolveRange(rangeId);
  if (!range) return jsonResponse({ error: "invalid_range" }, 400);

  const site = await env.db
    .prepare(
      "SELECT id, token, domain, name, user_sub, created_at FROM analytics_sites WHERE id = ?",
    )
    .bind(siteId)
    .first();
  if (!site) return jsonResponse({ error: "not_found" }, 404);
  if (user.sub !== 1 && site.user_sub !== user.sub) {
    return jsonResponse({ error: "forbidden" }, 403);
  }

  const fromTs = Math.floor(Date.parse(range.from + "T00:00:00Z") / 1000);
  const toTs = Math.floor(Date.parse(range.to + "T23:59:59Z") / 1000);

  const bindArgs = [site.token, fromTs, toTs];
  const stmts = [
    // totals
    env.db
      .prepare(
        `SELECT COUNT(*) AS pageviews, COUNT(DISTINCT visitor) AS visitors
                 FROM analytics_events
                 WHERE site_token = ? AND name = 'pageview' AND ts BETWEEN ? AND ?`,
      )
      .bind(...bindArgs),
    // series
    env.db
      .prepare(
        `SELECT date(ts,'unixepoch') AS day,
                        COUNT(*) AS pageviews,
                        COUNT(DISTINCT visitor) AS visitors
                 FROM analytics_events
                 WHERE site_token = ? AND name = 'pageview' AND ts BETWEEN ? AND ?
                 GROUP BY day ORDER BY day`,
      )
      .bind(...bindArgs),
    // path
    env.db
      .prepare(
        `SELECT path AS val, COUNT(*) AS pageviews, COUNT(DISTINCT visitor) AS visitors
                 FROM analytics_events
                 WHERE site_token = ? AND name = 'pageview' AND ts BETWEEN ? AND ?
                 GROUP BY path ORDER BY pageviews DESC LIMIT 20`,
      )
      .bind(...bindArgs),
    // referrer
    env.db
      .prepare(
        `SELECT CASE WHEN ref = '' THEN '__direct__' ELSE ref END AS val,
                        COUNT(*) AS pageviews, COUNT(DISTINCT visitor) AS visitors
                 FROM analytics_events
                 WHERE site_token = ? AND name = 'pageview' AND ts BETWEEN ? AND ?
                 GROUP BY ref ORDER BY pageviews DESC LIMIT 20`,
      )
      .bind(...bindArgs),
    // country
    env.db
      .prepare(
        `SELECT country AS val, COUNT(*) AS pageviews, COUNT(DISTINCT visitor) AS visitors
                 FROM analytics_events
                 WHERE site_token = ? AND name = 'pageview' AND ts BETWEEN ? AND ? AND country <> ''
                 GROUP BY country ORDER BY pageviews DESC LIMIT 20`,
      )
      .bind(...bindArgs),
    // browser
    env.db
      .prepare(
        `SELECT browser AS val, COUNT(*) AS pageviews, COUNT(DISTINCT visitor) AS visitors
                 FROM analytics_events
                 WHERE site_token = ? AND name = 'pageview' AND ts BETWEEN ? AND ?
                 GROUP BY browser ORDER BY pageviews DESC LIMIT 20`,
      )
      .bind(...bindArgs),
    // os
    env.db
      .prepare(
        `SELECT os AS val, COUNT(*) AS pageviews, COUNT(DISTINCT visitor) AS visitors
                 FROM analytics_events
                 WHERE site_token = ? AND name = 'pageview' AND ts BETWEEN ? AND ?
                 GROUP BY os ORDER BY pageviews DESC LIMIT 20`,
      )
      .bind(...bindArgs),
    // device
    env.db
      .prepare(
        `SELECT device AS val, COUNT(*) AS pageviews, COUNT(DISTINCT visitor) AS visitors
                 FROM analytics_events
                 WHERE site_token = ? AND name = 'pageview' AND ts BETWEEN ? AND ?
                 GROUP BY device ORDER BY pageviews DESC LIMIT 20`,
      )
      .bind(...bindArgs),
    // events
    env.db
      .prepare(
        `SELECT name AS val, COUNT(*) AS pageviews, COUNT(DISTINCT visitor) AS visitors
                 FROM analytics_events
                 WHERE site_token = ? AND name <> 'pageview' AND ts BETWEEN ? AND ?
                 GROUP BY name ORDER BY pageviews DESC LIMIT 20`,
      )
      .bind(...bindArgs),
  ];

  const r = await env.db.batch(stmts);

  // 补齐 series 空日期
  const seriesMap = {};
  (r[1].results || []).forEach((row) => {
    seriesMap[row.day] = row;
  });
  const series = [];
  for (let d = range.from; d <= range.to; d = shiftDay(d, 1)) {
    const hit = seriesMap[d];
    series.push({
      label: d,
      pageviews: hit ? hit.pageviews : 0,
      visitors: hit ? hit.visitors : 0,
    });
  }

  return jsonResponse(
    {
      site: {
        id: site.id,
        domain: site.domain,
        name: site.name,
        token: site.token,
      },
      range: {
        id: rangeId,
        from: range.from,
        to: range.to,
        granularity: range.granularity,
      },
      totals: r[0].results[0] || { pageviews: 0, visitors: 0 },
      series,
      breakdowns: {
        path: r[2].results || [],
        referrer: r[3].results || [],
        country: r[4].results || [],
        browser: r[5].results || [],
        os: r[6].results || [],
        device: r[7].results || [],
        event: r[8].results || [],
      },
    },
    200,
    { "Cache-Control": "no-store" },
  );
}

async function handleRealtime(request, env, user, siteId) {
  const site = await env.db
    .prepare("SELECT id, token, user_sub FROM analytics_sites WHERE id = ?")
    .bind(siteId)
    .first();
  if (!site) return jsonResponse({ error: "not_found" }, 404);
  if (user.sub !== 1 && site.user_sub !== user.sub) {
    return jsonResponse({ error: "forbidden" }, 403);
  }

  const now = Math.floor(Date.now() / 1000);
  const since = now - 1800;

  const { results } = await env.db
    .prepare(
      `SELECT ts, path, country, visitor FROM analytics_events
             WHERE site_token = ? AND ts >= ? AND name = 'pageview'
             ORDER BY ts DESC LIMIT 2000`,
    )
    .bind(site.token, since)
    .all();

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
    "Cache-Control": "no-store",
  });
}

/* ─────────────────────── 主入口 ─────────────────────── */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // 跟踪器脚本
    if (path === "/analytics.js" && method === "GET") {
      return new Response(TRACKER_JS, {
        status: 200,
        headers: {
          "Content-Type": "text/javascript; charset=utf-8",
          "Cache-Control": "public, max-age=3600, must-revalidate",
          "Access-Control-Allow-Origin": "*",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    // 事件接收 CORS 预检
    if (path === "/api/event" && method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_OPEN });
    }
    if (path === "/api/event" && method === "POST") {
      try {
        return await handleIngest(request, env);
      } catch (err) {
        if (env.DEBUG) console.error("[analytics] ingest error:", err);
        return new Response(null, { status: 500, headers: CORS_OPEN });
      }
    }

    if (method === "OPTIONS") {
      const origin = request.headers.get("Origin");
      const corsHeaders = {
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, x-app-id, x-sdk-ver",
        "Access-Control-Max-Age": "86400",
      };
      // 回显合法的 Origin
      if (origin && ALLOWED_ORIGINS.includes(origin)) {
        corsHeaders["Access-Control-Allow-Origin"] = origin;
      }
      // 注意：对于预检请求，返回 204 且带 CORS 头即可，无需进入业务逻辑
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
      if (path.startsWith("/api/")) {
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

        const statsMatch = path.match(/^\/api\/sites\/(\d+)\/stats$/);
        if (statsMatch && method === "GET") {
          if (env.limiter) {
            const { success } = await env.limiter.limit({
              key: `stats:${user.sub}`,
            });
            if (!success)
              return jsonResponse({ error: "rate_limited" }, 429, cors);
          }
          return await handleStats(
            request,
            env,
            user,
            parseInt(statsMatch[1], 10),
          );
        }

        const rtMatch = path.match(/^\/api\/sites\/(\d+)\/realtime$/);
        if (rtMatch && method === "GET") {
          if (env.limiter) {
            const { success } = await env.limiter.limit({
              key: `rt:${user.sub}`,
            });
            if (!success)
              return jsonResponse({ error: "rate_limited" }, 429, cors);
          }
          return await handleRealtime(
            request,
            env,
            user,
            parseInt(rtMatch[1], 10),
          );
        }

        if (path === "/api/me" && method === "GET") {
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
      }

      return env.assets.fetch(request);
    } catch (error) {
      if (env.DEBUG) console.error("analytics API error:", error);
      return jsonResponse({ error: "Internal Server Error" }, 500, cors);
    }
  },
};
