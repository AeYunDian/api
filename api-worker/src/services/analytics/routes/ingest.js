// services/analytics/routes/ingest.js
// GET /api/event（IE Image beacon）、POST /api/event（现代浏览器）

import {
  MAX_BODY_BYTES,
  TOKEN_PATTERN,
  EVENT_NAME_MAX,
  EVENT_PATH_MAX,
  EVENT_REF_MAX,
  EVENT_UTM_MAX,
  VISITOR_HASH_BYTES,
} from "../config.js";
import { CORS_OPEN } from "../http.js";
import { clamp, clientIp, dayStr, nowSec, allowRequest } from "../utils.js";
import { getSiteDomains, normalizeDomain } from "../domains.js";
import { findSiteByToken, insertEvent } from "../db.js";
import { parseUa, screenBucket, touchPointsBucket, regionToProvince } from "../ua.js";

const SESSION_RE = /^[0-9a-f]{12}$/;

function empty(status, extra = {}) {
  return new Response(null, { status, headers: { ...CORS_OPEN, ...extra } });
}

/** sha256(day ‖ site_token ‖ ip ‖ ua) 前 12 字节 hex，每日轮换，IP/UA 不落库 */
async function visitorHash(day, siteToken, ip, ua) {
  const material = `ay-analytics:${day}:${siteToken}:${ip}:${ua}`;
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(material),
  );
  const bytes = new Uint8Array(buf).slice(0, VISITOR_HASH_BYTES);
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i].toString(16).padStart(2, "0");
  }
  return out;
}

function readGetBody(url) {
  return {
    n: url.searchParams.get("n") || "pageview",
    t: url.searchParams.get("t") || "",
    d: url.searchParams.get("d") || "",
    u: url.searchParams.get("u") || "",
    r: url.searchParams.get("r") || "",
    w: url.searchParams.get("w") || "",
    s: url.searchParams.get("s") || "",
    tp: url.searchParams.get("tp") || "",
  };
}

async function readPostBody(request, url) {
  const lenHeader = Number(request.headers.get("content-length") || "0");
  if (lenHeader > MAX_BODY_BYTES) return { error: 413 };
  let body;
  try {
    body = await request.json();
  } catch {
    return { error: 400 };
  }
  if (!body || typeof body !== "object") return { error: 400 };
  // 允许 s / tp 从 query 补充（部分 beacon 只带 query）
  if (body.s == null) body.s = url.searchParams.get("s") || "";
  if (body.tp == null) body.tp = url.searchParams.get("tp") || "";
  return { body };
}

export async function handleIngest({ request, env, url }) {
  const isGet = request.method === "GET";

  let body;
  if (isGet) {
    body = readGetBody(url);
  } else {
    const parsed = await readPostBody(request, url);
    if (parsed.error) return empty(parsed.error);
    body = parsed.body;
  }

  const token = typeof body.t === "string" ? body.t : "";
  if (!token || !TOKEN_PATTERN.test(token)) return empty(400);
  if (typeof body.d !== "string" || typeof body.u !== "string") return empty(400);

  // 限流：analy_limiter 只服务上报；超限返回 201 但丢弃（迷惑性）
  const ip = clientIp(request);
  const allowed = await allowRequest(env, "analy_limiter", `evt:${ip}`);
  if (!allowed) {
    if (env.DEBUG) console.warn("[analytics] ingest_dropped", { ip });
    const headers = {};
    if (env.DEBUG && request.headers.get("x-ay-debug") === "1") {
      headers["x-ay-drop"] = "1";
    }
    return empty(201, headers);
  }

  const site = await findSiteByToken(env.db, token);
  if (!site) return empty(404);

  const allowedDomains = getSiteDomains(site);
  const domain = normalizeDomain(body.d);
  if (!domain || !allowedDomains.includes(domain)) return empty(403);

  const ua = request.headers.get("user-agent") || "";
  const uaInfo = parseUa(ua);
  if (!uaInfo) return empty(204);

  let target;
  try {
    target = new URL(body.u);
  } catch {
    return empty(400);
  }

  const now = nowSec();
  const visitor = await visitorHash(dayStr(new Date(now * 1000)), token, ip, ua);

  let ref = "";
  if (typeof body.r === "string" && body.r) {
    try {
      const refHost = new URL(body.r).hostname
        .toLowerCase()
        .replace(/^www\./, "");
      if (refHost && !allowedDomains.includes(refHost)) ref = clamp(refHost, EVENT_REF_MAX);
    } catch {
      /* ignore */
    }
  }

  const params = target.searchParams;
  const name =
    typeof body.n === "string" && body.n ? clamp(body.n, EVENT_NAME_MAX) : "pageview";
  const country =
    request.cf && request.cf.country ? String(request.cf.country) : "";

  let path = target.pathname || "/";
  if (path.length > EVENT_PATH_MAX) path = path.slice(0, EVENT_PATH_MAX);

  const sessionId =
    typeof body.s === "string" && SESSION_RE.test(body.s) ? body.s : "";

  await insertEvent(env.db, {
    site_token: token,
    ts: now,
    visitor,
    session_id: sessionId,
    name,
    path,
    ref,
    country: clamp(country, 8),
    province:
      country === "CN"
        ? regionToProvince(request.cf && request.cf.region, request.cf && request.cf.regionCode)
        : "",
    browser: clamp(uaInfo.browser, 32),
    browser_version: clamp(uaInfo.browserVersion, 8),
    os: clamp(uaInfo.os, 32),
    os_version: clamp(uaInfo.osVersion, 8),
    device: clamp(uaInfo.device, 16),
    screen: screenBucket(body.w),
    touch_points: touchPointsBucket(body.tp),
    utm_source: clamp(params.get("utm_source") || "", EVENT_UTM_MAX),
    utm_medium: clamp(params.get("utm_medium") || "", EVENT_UTM_MAX),
    utm_campaign: clamp(params.get("utm_campaign") || "", EVENT_UTM_MAX),
    utm_term: clamp(params.get("utm_term") || "", EVENT_UTM_MAX),
    utm_content: clamp(params.get("utm_content") || "", EVENT_UTM_MAX),
  });

  return empty(204);
}
