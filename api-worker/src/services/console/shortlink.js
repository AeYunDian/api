// services/console/shortlink.js
// go.undz.cn —— 短链公开跳转 + 可选密码页。
// 只读短链表，不提供任何写操作；写操作在 routes/links.js（console.undz.cn）。

import { hashPassword, fromBase64, hmacSha256 } from "../account/auth/crypto.js";
import {
  CODE_CHARS_ADMIN,
  CODE_LEN_MAX,
  PASSWORD_COOKIE_TTL,
  PASSWORD_MAX_ATTEMPTS,
  PASSWORD_WINDOW_MS,
} from "./config.js";

const SERVICE_NAME = "AyShortLink";

/* ───────────────────────── 小工具 ───────────────────────── */

function nowSec() {
  return Math.floor(Date.now() / 1000);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}

function getCookie(request, name) {
  const raw = request.headers.get("Cookie");
  if (!raw) return null;
  for (const part of raw.split(/;\s*/)) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() !== name) continue;
    const value = part.slice(eq + 1);
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }
  return null;
}

/** 短码 → 稳定的 Cookie 名（短码可能含 `/`，不能直接做 Cookie 名） */
function cookieNameFor(code) {
  let hash = 5381;
  for (let i = 0; i < code.length; i++) {
    hash = ((hash << 5) + hash + code.charCodeAt(i)) | 0;
  }
  return `SL_${(hash >>> 0).toString(36)}`;
}

function constantTimeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

function bytesEqual(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

/* ───────────────────────── 页面 ───────────────────────── */

const PAGE_CSS = `
*{box-sizing:border-box}
html,body{height:100%;margin:0}
body{display:table;width:100%;height:100%;background:#f4f2f9;
  font-family:Roboto,-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif;
  -webkit-font-smoothing:antialiased;color:#1d1b20}
.wrap{display:table-cell;vertical-align:middle;text-align:center;padding:24px}
.card{display:inline-block;width:100%;max-width:420px;text-align:left;background:#fef7ff;
  border:1px solid #eaddf2;border-radius:28px;padding:36px 28px 30px;
  box-shadow:0 1px 2px rgba(0,0,0,.06),0 12px 24px rgba(103,80,164,.10)}
.badge{width:56px;height:56px;margin:0 auto 14px;border-radius:50%;
  display:flex;align-items:center;justify-content:center;
  background:#e8def8;color:#6750a4}
.badge svg{width:28px;height:28px}
h1{margin:0 0 6px;font-size:20px;font-weight:500;text-align:center;line-height:1.5}
p.sub{margin:0 0 20px;font-size:13px;line-height:1.6;text-align:center;color:#49454f}
input[type=password]{width:100%;padding:12px 14px;border:1px solid #79747e;border-radius:12px;
  background:transparent;color:inherit;font-size:15px;font-family:inherit;outline:none}
input[type=password]:focus{border-color:#6750a4;box-shadow:0 0 0 2px rgba(103,80,164,.16)}
button{width:100%;margin-top:14px;padding:12px;border:none;border-radius:100px;
  background:#6750a4;color:#fff;font-size:15px;font-weight:500;font-family:inherit;
  letter-spacing:.4px;cursor:pointer}
button:hover{background:#7c66b5}
button:active{background:#4f378a}
.error{margin-bottom:14px;padding:10px 12px;border-radius:12px;background:#fce8e6;
  border:1px solid #f5c6cb;color:#b3261e;font-size:13px;line-height:1.5;text-align:center}
.footer{position:fixed;bottom:0;left:0;width:100%;padding:12px 16px;text-align:center;
  font-size:12px;color:rgba(0,0,0,.54)}
@media(prefers-color-scheme:dark){
  body{background:#141218;color:#e6e0e9}
  .card{background:#1d1b20;border-color:#49454f;box-shadow:0 12px 24px rgba(0,0,0,.5)}
  .badge{background:#4a4458;color:#d0bcff}
  p.sub{color:#cac4d0}
  input[type=password]{border-color:#8e8698}
  input[type=password]:focus{border-color:#d0bcff;box-shadow:0 0 0 2px rgba(208,188,255,.2)}
  button{background:#d0bcff;color:#381e72}
  button:hover{background:#e8def8}
  button:active{background:#b69df8}
  .error{background:rgba(179,38,30,.2);border-color:rgba(242,184,181,.4);color:#f2b8b5}
  .footer{color:rgba(255,255,255,.54)}
}`;

const LOCK_ICON = `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
<path d="M7 10V7a5 5 0 0 1 10 0v3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
<rect x="4.5" y="10" width="15" height="11" rx="3" stroke="currentColor" stroke-width="1.6"/>
<circle cx="12" cy="15.5" r="1.4" fill="currentColor"/>
</svg>`;

const LINK_ICON = `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
<path d="M10 13a5 5 0 0 0 7.07 0l2.12-2.12a5 5 0 0 0-7.07-7.07L10.7 5.23"
 stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
<path d="M14 11a5 5 0 0 0-7.07 0L4.8 13.12a5 5 0 0 0 7.07 7.07l1.42-1.42"
 stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
</svg>`;

function renderPage({ status, title, heading, sub, body, icon }) {
  const html = `<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>${escapeHtml(title)} - ${SERVICE_NAME}</title>
<style>${PAGE_CSS}</style></head>
<body><div class="wrap"><div class="card">
<div class="badge">${icon || LINK_ICON}</div>
<h1>${escapeHtml(heading)}</h1>
${sub ? `<p class="sub">${escapeHtml(sub)}</p>` : ""}
${body || ""}
</div></div><div class="footer">© AeYunDian ${SERVICE_NAME}. All rights reserved.</div>
</body></html>`;
  return new Response(html, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

function notFoundPage() {
  return renderPage({
    status: 404,
    title: "链接不存在",
    heading: "链接不存在或已失效",
    sub: "请检查地址是否输入正确，或联系分享者确认链接是否仍然有效。",
  });
}

function passwordPage(hasError) {
  const body = `
${hasError ? '<div class="error">密码错误，请重试</div>' : ""}
<form method="POST" action="">
  <input type="password" name="password" placeholder="请输入访问密码" required autofocus
         autocomplete="current-password" maxlength="64">
  <button type="submit">继续访问</button>
</form>`;
  return renderPage({
    status: hasError ? 403 : 401,
    title: "受保护的短链接",
    heading: "此链接需要密码",
    sub: "该短链接已开启访问保护，请输入密码后继续。",
    body,
    icon: LOCK_ICON,
  });
}

/* ───────────────────────── 短码与密码 ───────────────────────── */

/** 查询用：接受管理员的超集字符集，长度 1–250 */
function isLookupableCode(code) {
  return (
    typeof code === "string" &&
    code.length > 0 &&
    code.length <= CODE_LEN_MAX &&
    CODE_CHARS_ADMIN.test(code) &&
    !code.includes("//")
  );
}

/** 用 code 做 HMAC 的免密 Cookie，避免一个链接的凭证被拿去开另一个 */
async function issueUnlockToken(env, code) {
  const exp = nowSec() + PASSWORD_COOKIE_TTL;
  const sig = await hmacSha256(env.JWT_KEY || "", `${code}.${exp}`);
  return `${exp}.${sig}`;
}

async function verifyUnlockToken(env, code, token) {
  if (typeof token !== "string") return false;
  const dot = token.indexOf(".");
  if (dot <= 0) return false;
  const exp = Number.parseInt(token.slice(0, dot), 10);
  if (!Number.isFinite(exp) || exp < nowSec()) return false;
  const expected = await hmacSha256(env.JWT_KEY || "", `${code}.${exp}`);
  return constantTimeEqual(expected, token.slice(dot + 1));
}

async function verifyPassword(rec, password) {
  if (!rec.password_hash || !rec.password_salt) return false;
  try {
    const salt = fromBase64(rec.password_salt);
    const derived = await hashPassword(password, salt);
    return bytesEqual(derived, fromBase64(rec.password_hash));
  } catch {
    return false;
  }
}

async function readPassword(request) {
  const contentType = (request.headers.get("Content-Type") || "").toLowerCase();
  try {
    if (contentType.includes("application/json")) {
      const body = await request.json();
      return typeof body?.password === "string" ? body.password : null;
    }
    const form = await request.formData();
    const value = form.get("password");
    return typeof value === "string" ? value : null;
  } catch {
    return null;
  }
}

/* ───────────────────────── 密码尝试限流（进程内软限制） ───────────────────────── */

const attemptBuckets = new Map();

function tooManyAttempts(key) {
  const bucket = attemptBuckets.get(key);
  return Boolean(
    bucket &&
      bucket.reset > Date.now() &&
      bucket.count >= PASSWORD_MAX_ATTEMPTS,
  );
}

function recordFailure(key) {
  const now = Date.now();
  let bucket = attemptBuckets.get(key);
  if (!bucket || bucket.reset <= now) {
    bucket = { count: 0, reset: now + PASSWORD_WINDOW_MS };
    attemptBuckets.set(key, bucket);
  }
  bucket.count += 1;

  // 简单的容量保护：避免 Map 无限增长
  if (attemptBuckets.size > 2000) {
    for (const [k, v] of attemptBuckets) {
      if (v.reset <= now) attemptBuckets.delete(k);
    }
  }
}

/* ───────────────────────── 跳转 ───────────────────────── */

function redirectTo(target) {
  return new Response(null, {
    status: 302,
    headers: {
      Location: target,
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

async function bumpClick(env, id) {
  try {
    await env.db
      .prepare(
        "UPDATE short_links SET click_count = click_count + 1, last_clicked_at = ? WHERE id = ?",
      )
      .bind(nowSec(), id)
      .run();
  } catch {
    /* 计数失败不影响跳转 */
  }
}

function scheduleClick(env, ctx, id) {
  const task = bumpClick(env, id);
  if (ctx && typeof ctx.waitUntil === "function") {
    ctx.waitUntil(task);
  }
}

function safeTarget(target) {
  try {
    const url = new URL(target);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

/* ───────────────────────── 入口 ───────────────────────── */

export async function handleShortLink(request, env, ctx) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  if (method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }

  if (path === "/health") {
    return jsonResponse({ ok: true, service: "shortlink" });
  }

  if (method !== "GET" && method !== "HEAD" && method !== "POST") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: { Allow: "GET, HEAD, POST, OPTIONS" },
    });
  }

  // 取 path 的第一段之后的所有内容作为短码；解码失败按不存在处理
  let code;
  try {
    code = decodeURIComponent(path.slice(1));
  } catch {
    return notFoundPage();
  }
  code = code.replace(/\/+$/, "");

  if (!isLookupableCode(code)) {
    return notFoundPage();
  }

  let rec;
  try {
    rec = await env.db
      .prepare(
        `SELECT id, code, target, password_hash, password_salt, expires_at, status
           FROM short_links WHERE code = ?`,
      )
      .bind(code)
      .first();
  } catch {
    return notFoundPage();
  }

  if (!rec || rec.status !== "active") {
    return notFoundPage();
  }
  if (rec.expires_at && rec.expires_at <= nowSec()) {
    return notFoundPage();
  }

  const target = safeTarget(rec.target);
  if (!target) {
    return notFoundPage();
  }

  const hasPassword = Boolean(rec.password_hash && rec.password_salt);
  const cookieName = cookieNameFor(code);

  /* —— 无密码：直接跳 —— */
  if (!hasPassword) {
    if (method === "POST") return notFoundPage();
    scheduleClick(env, ctx, rec.id);
    if (method === "HEAD") {
      return new Response(null, {
        status: 302,
        headers: {
          Location: target,
          "Cache-Control": "no-store",
          "Referrer-Policy": "no-referrer",
          "X-Robots-Tag": "noindex, nofollow",
        },
      });
    }
    return redirectTo(target);
  }

  /* —— 有密码 —— */
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";

  if (method === "POST") {
    if (tooManyAttempts(`${code}|${ip}`)) {
      return renderPage({
        status: 429,
        title: "请求过于频繁",
        heading: "尝试次数过多",
        sub: "请稍后再试。",
        icon: LOCK_ICON,
      });
    }

    const password = await readPassword(request);
    if (password === null) {
      return passwordPage(false);
    }
    if (!(await verifyPassword(rec, password))) {
      recordFailure(`${code}|${ip}`);
      return passwordPage(true);
    }

    const token = await issueUnlockToken(env, code);
    const headers = {
      Location: target,
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
      "X-Robots-Tag": "noindex, nofollow",
      "Set-Cookie": `${cookieName}=${encodeURIComponent(token)}; Path=/; Max-Age=${PASSWORD_COOKIE_TTL}; HttpOnly; Secure; SameSite=Lax`,
    };
    scheduleClick(env, ctx, rec.id);
    return new Response(null, { status: 302, headers });
  }

  const token = getCookie(request, cookieName);
  if (token && (await verifyUnlockToken(env, code, token))) {
    scheduleClick(env, ctx, rec.id);
    return redirectTo(target);
  }

  return passwordPage(false);
}
