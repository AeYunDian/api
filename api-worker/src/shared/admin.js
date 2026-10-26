// src/shared/admin.js
// 运维/测试后台：
//   GET  /  /admin         —— 有有效 cookie 显示测试页，否则显示登录页
//   POST /login            —— 校验 env.KEY，通过后用「当天派生密钥」签发 JWT
//   POST /api/refresh      —— 用未过期的旧 token 换新 token（续期 20 分钟）
//   POST /api/logout       —— 清除 cookie
//   POST /api/init         —— 凭 env.KEY 初始化 KV / PSP / 反向验证表
//   POST /api/reverse/*    —— 反向邮箱验证测试（create / query / by-email / delete）
//   /runtask  /initdb      —— 保留，兼容 X-Admin-Key 头部
//
// JWT：
//   - 载荷 { t: cookie 颁发时间(=iat) }，HS256，20 分钟过期。
//   - 签名密钥由当天 UTC 日期派生（见 getDailyAdminKey），每天 00:00 UTC 自动轮换。
//   - 登录口令仍为 env.KEY。

import { SignJWT, jwtVerify } from "jose";
import { parse, serialize } from "cookie";

import { cleanExpiredKv, initKvTable } from "./kvWithD1.js";
import { cleanExpiredPsp, initPspTables } from "../services/relay/wsRelay.js";
import {
  cleanExpiredReverseVerifications,
  initReverseVerifyTable,
  createReverseVerification,
  verifyReverseCode,
  getVerificationByEmail,
  deleteReverseVerification,
} from "./email-reverse-verify.js";

const TOKEN_COOKIE = "admin_token";
const TOKEN_TTL = 20 * 60; // 20 分钟
const TOKEN_ALG = "HS256";

// ------------------------- 通用小工具 -------------------------

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...extraHeaders,
    },
  });
}

function html(body, status = 200, extraHeaders = {}) {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      ...extraHeaders,
    },
  });
}

function escapeHtml(str) {
  return String(str).replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c],
  );
}

async function sha256Hex(str) {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(str),
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function readJsonBody(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

// ------------------------- 每日 JWT 密钥派生 -------------------------
//
// 例（2025-10-26）：
//   primary  = "10"+"26"+"2025"        = "10262025"
//   dd       = 26
//   newYear  = 2025-26                 = 1999
//   newDay   = 26-2                    = 24
//   → 1999-10-24
//   secondary= "99"+"10"+"24"+"19"     = "99102419"
//   hash8    = SHA-256(secondary)[0..8]
//   key      = "10262025"+hash8

function getShiftedDate(yyyy, mm, dd) {
  const newYear = yyyy - dd;
  const newDay = dd - 2;
  const d = new Date(Date.UTC(newYear, mm - 1, newDay));
  return {
    yyyy: d.getUTCFullYear(),
    mm: d.getUTCMonth() + 1,
    dd: d.getUTCDate(),
  };
}

async function deriveDailyKeyFromDate(yyyy, mm, dd) {
  const primary =
    String(mm).padStart(2, "0") + String(dd).padStart(2, "0") + String(yyyy);

  const s = getShiftedDate(yyyy, mm, dd);
  const sYYYY = String(s.yyyy);
  const secondary =
    sYYYY.slice(-2) +
    String(s.mm).padStart(2, "0") +
    String(s.dd).padStart(2, "0") +
    sYYYY.slice(0, 2);

  const hash8 = (await sha256Hex(secondary)).slice(0, 8);
  return { key: primary + hash8, primary, secondary, hash8 };
}

async function getDailyAdminKey() {
  const now = new Date();
  return deriveDailyKeyFromDate(
    now.getUTCFullYear(),
    now.getUTCMonth() + 1,
    now.getUTCDate(),
  );
}

// ------------------------- JWT 与 Cookie -------------------------

async function signAdminToken(secret, issuedAt) {
  return new SignJWT({ t: issuedAt })
    .setProtectedHeader({ alg: TOKEN_ALG })
    .setIssuedAt(issuedAt)
    .setExpirationTime(issuedAt + TOKEN_TTL)
    .sign(new TextEncoder().encode(secret));
}

async function verifyAdminToken(secret, token) {
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret),
      {
        algorithms: [TOKEN_ALG],
      },
    );
    return payload;
  } catch {
    return null;
  }
}

function cookieOptions(request) {
  const url = new URL(request.url);
  return {
    httpOnly: true,
    path: "/",
    sameSite: "Strict",
    secure: url.protocol === "https:",
  };
}

function setTokenCookie(request, token) {
  return serialize(TOKEN_COOKIE, token, {
    ...cookieOptions(request),
    maxAge: TOKEN_TTL,
  });
}

function clearTokenCookie(request) {
  return serialize(TOKEN_COOKIE, "", {
    ...cookieOptions(request),
    maxAge: 0,
  });
}

async function authorize(request, env) {
  const cookies = parse(request.headers.get("Cookie") || "");
  const token = cookies[TOKEN_COOKIE];
  if (token) {
    const { key } = await getDailyAdminKey();
    const payload = await verifyAdminToken(key, token);
    if (payload) return { valid: true, source: "cookie", payload };
  }

  const headerKey = request.headers.get("X-Admin-Key");
  if (headerKey && headerKey === env.KEY) {
    return { valid: true, source: "header", payload: null };
  }

  return { valid: false };
}

// ------------------------- 登录 / 刷新 / 登出 -------------------------

async function handleLogin(request, env) {
  const contentType = request.headers.get("Content-Type") || "";
  let password = "";
  let isForm = false;

  if (contentType.includes("application/json")) {
    const body = await request.json().catch(() => ({}));
    password = body.password || body.key || "";
  } else {
    isForm = true;
    const form = await request.formData().catch(() => null);
    password = form ? String(form.get("password") || "") : "";
  }

  if (!password || password !== env.KEY) {
    if (isForm) {
      return new Response(null, {
        status: 302,
        headers: { Location: "/?error=invalid" },
      });
    }
    return json({ error: "Unauthorized" }, 401);
  }

  const issuedAt = Math.floor(Date.now() / 1000);
  const { key } = await getDailyAdminKey();
  const token = await signAdminToken(key, issuedAt);
  const cookie = setTokenCookie(request, token);

  if (isForm) {
    return new Response(null, {
      status: 302,
      headers: { Location: "/", "Set-Cookie": cookie },
    });
  }

  return json({ success: true, ttl: TOKEN_TTL, issuedAt }, 200, {
    "Set-Cookie": cookie,
  });
}

async function handleRefresh(request, env) {
  const cookies = parse(request.headers.get("Cookie") || "");
  const token = cookies[TOKEN_COOKIE];
  if (!token) {
    return json({ error: "Unauthorized", detail: "no token" }, 401);
  }

  const { key } = await getDailyAdminKey();
  const payload = await verifyAdminToken(key, token);
  if (!payload) {
    return json(
      { error: "Unauthorized", detail: "invalid or expired token" },
      401,
    );
  }

  const issuedAt = Math.floor(Date.now() / 1000);
  const newToken = await signAdminToken(key, issuedAt);
  return json(
    {
      success: true,
      ttl: TOKEN_TTL,
      issuedAt,
      refreshedFrom: payload.t || null,
    },
    200,
    { "Set-Cookie": setTokenCookie(request, newToken) },
  );
}

// ------------------------- 初始化数据库（env.KEY 独立鉴权） -------------------------

const INIT_TARGETS = {
  kv: async (db) => {
    await initKvTable(db);
  },
  psp: async (db) => {
    await initPspTables(db);
  },
  reverse: async (db) => {
    await initReverseVerifyTable(db);
  },
  all: async (db) => {
    await initKvTable(db);
    await initPspTables(db);
    await initReverseVerifyTable(db);
  },
};

async function handleInit(request, env) {
  const body = await readJsonBody(request);
  const key = body.key || body.password || "";
  const target = body.target || "all";

  if (!key || key !== env.KEY) {
    return json({ error: "Unauthorized", detail: "env.KEY 不正确" }, 401);
  }

  const fn = INIT_TARGETS[target];
  if (!fn) {
    return json(
      {
        error: "Unknown target",
        detail: `target="${target}"`,
        allowed: Object.keys(INIT_TARGETS),
      },
      400,
    );
  }

  try {
    await fn(env.db);
    return json({ success: true, target, message: `Initialized: ${target}` });
  } catch (err) {
    return json(
      { error: "Init failed", target, detail: err.message, stack: err.stack },
      500,
    );
  }
}

// ------------------------- 反向邮箱验证测试 API -------------------------

const CREATE_ALLOWED_KEYS = [
  "targetEmail",
  "action",
  "prefix",
  "tokenLength",
  "useSubaddress",
  "codeLength",
  "ttl",
  "domain",
];

async function handleReverseCreate(request, env) {
  const body = await readJsonBody(request);
  const opts = {};
  for (const k of CREATE_ALLOWED_KEYS) {
    if (body[k] !== undefined && body[k] !== null && body[k] !== "") {
      opts[k] = body[k];
    }
  }
  try {
    const result = await createReverseVerification(env, opts);
    return json(result);
  } catch (err) {
    return json({ error: "Create failed", detail: err.message }, 400);
  }
}

async function handleReverseQuery(request, env) {
  const body = await readJsonBody(request);
  if (!body.requestId) return json({ error: "requestId required" }, 400);
  const result = await verifyReverseCode(
    env,
    body.requestId,
    body.action || null,
  );
  return json(result);
}

async function handleReverseByEmail(request, env) {
  const body = await readJsonBody(request);
  if (!body.email) return json({ error: "email required" }, 400);
  const result = await getVerificationByEmail(
    env,
    body.email,
    body.action || null,
  );
  return json(result);
}

async function handleReverseDelete(request, env) {
  const body = await readJsonBody(request);
  if (!body.requestId) return json({ error: "requestId required" }, 400);
  const ok = await deleteReverseVerification(env, body.requestId);
  return json({ success: ok });
}

// ------------------------- 页面 -------------------------

function loginPage(error = "") {
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Admin Login</title>
<style>
  body{font-family:system-ui,-apple-system,sans-serif;background:#f6f7f9;margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center}
  form{background:#fff;padding:2rem;border-radius:10px;box-shadow:0 4px 24px rgba(0,0,0,.08);width:min(360px,90vw)}
  h1{margin:0 0 1rem;font-size:1.2rem;color:#111}
  input{width:100%;padding:.55rem .7rem;font-size:1rem;border:1px solid #ccc;border-radius:6px;box-sizing:border-box}
  button{margin-top:1rem;width:100%;padding:.6rem;font-size:1rem;border:none;border-radius:6px;background:#2563eb;color:#fff;cursor:pointer}
  button:hover{background:#1d4ed8}
  .err{color:#c33;margin:.5rem 0 0;font-size:.9rem;min-height:1.2em}
  .muted{color:#888;font-size:.8rem;margin-top:1rem;line-height:1.4}
</style>
</head>
<body>
<form method="POST" action="/login">
  <h1>Admin Login</h1>
  <input type="password" name="password" placeholder="Admin Key" autofocus required autocomplete="current-password">
  <button type="submit">Login</button>
  <p class="err">${escapeHtml(error)}</p>
  <p class="muted">登录后签发 20 分钟有效的 Cookie；签名密钥按天派生，UTC 零点自动轮换。</p>
</form>
</body>
</html>`;
}

function adminPage(keyInfo) {
  const dateHint = keyInfo
    ? `今日派生：${escapeHtml(keyInfo.primary)} + hash(${escapeHtml(
        keyInfo.secondary,
      )}) → 密钥后 8 位 ${escapeHtml(keyInfo.hash8)}`
    : "";
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Reverse Email Verify Tester</title>
<style>
  body{font-family:system-ui,-apple-system,sans-serif;max-width:880px;margin:2rem auto;padding:0 1rem;color:#111}
  h1{margin:0 0 .25rem;font-size:1.4rem}
  .muted{color:#888;font-size:.85rem;margin:.25rem 0 1rem}
  fieldset{border:1px solid #d9dde3;border-radius:8px;margin-bottom:1rem;padding:.75rem 1rem 1rem;background:#fff}
  legend{padding:0 .5rem;font-weight:600;color:#333}
  label{display:block;margin:.35rem 0;font-size:.85rem;color:#444}
  input,select{width:100%;padding:.4rem .55rem;font-size:.9rem;border:1px solid #cbd2dc;border-radius:6px;box-sizing:border-box;background:#fff}
  .row{display:grid;grid-template-columns:1fr 1fr;gap:.75rem}
  button{padding:.45rem 1rem;font-size:.9rem;border:none;border-radius:6px;background:#2563eb;color:#fff;cursor:pointer;margin-right:.5rem;margin-bottom:.35rem}
  button.secondary{background:#6b7280}
  button.danger{background:#dc2626}
  button.success{background:#15803d}
  button:hover{filter:brightness(.94)}
  pre{background:#f4f5f7;padding:.75rem;overflow:auto;max-height:320px;border-radius:6px;font-size:.82rem;margin:.75rem 0 0}
  .status{font-size:.85rem;color:#444;margin-left:.5rem}
  .ok{color:#15803d}
  .err{color:#b91c1c}
  .keyinfo{font-family:ui-monospace,monospace;font-size:.8rem;color:#555;background:#f4f5f7;padding:.5rem .75rem;border-radius:6px;margin:0 0 1rem}
  .hint{color:#888;font-size:.8rem;margin:.15rem 0 .5rem}

  /* 等待验证面板 */
  .wait-panel{border:1px solid #d9dde3;border-left:4px solid #2563eb;border-radius:8px;padding:.75rem 1rem 1rem;background:#fff;margin-bottom:1rem}
  .wait-panel[hidden]{display:none}
  .wait-panel.state-success{border-left-color:#15803d;background:#f0fdf4}
  .wait-panel.state-expired{border-left-color:#dc2626;background:#fef2f2}
  .wait-panel.state-error{border-left-color:#d97706;background:#fffbeb}
  .wait-panel.state-consumed{border-left-color:#6b7280;background:#f9fafb}
  .wait-head{display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-bottom:.5rem}
  .wait-title{font-weight:600;font-size:.95rem;display:flex;align-items:center}
  .wait-badge{font-size:.75rem;padding:.15rem .5rem;border-radius:999px;background:#dbeafe;color:#1e40af;white-space:nowrap}
  .wait-badge.success{background:#dcfce7;color:#166534}
  .wait-badge.expired{background:#fee2e2;color:#991b1b}
  .wait-badge.error{background:#fef3c7;color:#92400e}
  .wait-badge.consumed{background:#e5e7eb;color:#374151}
  .wait-kv{display:grid;grid-template-columns:110px 1fr;gap:.35rem .75rem;font-size:.85rem;margin:.25rem 0 .5rem}
  .wait-kv dt{color:#666}
  .wait-kv dd{margin:0;font-family:ui-monospace,monospace;word-break:break-all;color:#111}
  .wait-foot{font-size:.8rem;color:#666;margin:.25rem 0 .5rem}
  .wait-actions{display:flex;flex-wrap:wrap;gap:.5rem;margin:0}
  .spinner{display:inline-block;width:14px;height:14px;border:2px solid #cbd5e1;border-top-color:#2563eb;border-radius:50%;animation:spin .8s linear infinite;margin-right:.4rem;vertical-align:-2px}
  @keyframes spin{to{transform:rotate(360deg)}}

  @media (max-width:560px){.row{grid-template-columns:1fr}}
</style>
</head>
<body>
  <!-- Action 预设（对应 shared/config.js 中的 ACTION_PRESETS）；输入框挂 list="actionPresets" 后既能下拉选择，也能手输任意值 -->
  <datalist id="actionPresets">
    <option value="global"></option>
    <option value="register"></option>
    <option value="login"></option>
    <option value="change_password"></option>
  </datalist>

  <h1>Reverse Email Verify Tester</h1>
  <p class="muted">通过 Cookie 中的 JWT 访问，20 分钟过期；签名密钥按 UTC 日期派生，跨零点自动失效。</p>
  <p class="keyinfo">${dateHint}</p>

  <p>
    <button id="refreshBtn">刷新 Token</button>
    <button id="logoutBtn" class="secondary">退出登录</button>
    <span id="status" class="status"></span>
  </p>

  <fieldset id="initFieldset">
    <legend>数据库初始化</legend>
    <p class="hint">填入 env.KEY 后点击对应按钮；此操作幂等（CREATE TABLE IF NOT EXISTS），可重复执行。</p>
    <label>env.KEY
      <input name="initKey" type="password" placeholder="输入 env.KEY" autocomplete="current-password">
    </label>
    <p style="margin-top:.75rem">
      <button data-target="kv">初始化 KV 表</button>
      <button data-target="psp">初始化中继 PSP 表</button>
      <button data-target="reverse">初始化反向验证表</button>
      <button data-target="all" class="success">全部初始化</button>
    </p>
    <pre id="initOut">—</pre>
  </fieldset>

  <fieldset id="createFieldset">
    <legend>创建反向验证任务</legend>
    <div class="row">
      <label>targetEmail（可选，留空则取实际发件人）
        <input name="targetEmail" placeholder="user@example.com">
      </label>
      <label>action（下拉选择或手动输入）
        <input name="action" value="global" list="actionPresets" placeholder="global / register / login / change_password">
      </label>
    </div>
    <div class="row">
      <label>prefix
        <input name="prefix" value="onecode">
      </label>
      <label>domain
        <input name="domain" value="services.undz.cn">
      </label>
    </div>
    <div class="row">
      <label>ttl（秒）
        <input name="ttl" type="number" min="10" value="300">
      </label>
      <label>codeLength（3-32）
        <input name="codeLength" type="number" min="3" max="32" value="6">
      </label>
    </div>
    <div class="row">
      <label>tokenLength
        <input name="tokenLength" type="number" min="1" value="3">
      </label>
      <label>useSubaddress
        <select name="useSubaddress">
          <option value="true">true（onecode+xxx@domain）</option>
          <option value="false">false（onecodexxx@domain）</option>
        </select>
      </label>
    </div>
    <p style="margin-top:.75rem">
      <button id="createBtn">创建任务</button>
    </p>
    <pre id="createOut">—</pre>
  </fieldset>

  <div id="waitPanel" class="wait-panel" hidden>
    <div class="wait-head">
      <div id="waitTitle" class="wait-title"></div>
      <span id="waitBadge" class="wait-badge"></span>
    </div>
    <div id="waitBody"></div>
  </div>

  <fieldset id="queryFieldset">
    <legend>查询 / 校验 / 删除</legend>
    <div class="row">
      <label>requestId
        <input name="requestId">
      </label>
      <label>action（可选，下拉选择或手动输入）
        <input name="queryAction" list="actionPresets" placeholder="不填则忽略 action 校验">
      </label>
    </div>
    <div class="row">
      <label>targetEmail（用于按邮箱反查，可选）
        <input name="email" placeholder="user@example.com">
      </label>
      <label>action（按邮箱反查用，可选，下拉选择或手动输入）
        <input name="emailAction" list="actionPresets">
      </label>
    </div>
    <p style="margin-top:.75rem">
      <button id="queryBtn">校验 requestId</button>
      <button id="byEmailBtn" class="secondary">按邮箱查询</button>
      <button id="deleteBtn" class="danger">删除</button>
    </p>
    <pre id="queryOut">—</pre>
  </fieldset>

<script>
(function () {
  var $ = function (sel) { return document.querySelector(sel); };
  var waitPanel = $("#waitPanel");
  var waitTitleEl = $("#waitTitle");
  var waitBadgeEl = $("#waitBadge");
  var waitBodyEl = $("#waitBody");

  // 轮询状态：只保留一份，一次只模拟一个等待验证
  var pollState = null;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function setStatus(text, ok) {
    var el = $("#status");
    el.textContent = text || "";
    el.className = "status " + (ok ? "ok" : "err");
  }

  function show(el, data) {
    el.textContent = JSON.stringify(data, null, 2);
  }

  function collect(fieldset) {
    var obj = {};
    fieldset.querySelectorAll("input, select").forEach(function (el) {
      if (!el.name) return;
      obj[el.name] = el.value;
    });
    return obj;
  }

  async function callApi(url, body) {
    var res = await fetch(url, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body || {}),
    });
    var text = await res.text();
    var data;
    try { data = JSON.parse(text); } catch (e) { data = { raw: text }; }
    if (res.status === 401) {
      setStatus("Token 已过期（或已跨零点），请刷新页面重新登录", false);
    }
    return { status: res.status, ok: res.ok, data: data };
  }

  function fmtDateTime(sec) {
    if (!sec) return "";
    return new Date(sec * 1000).toLocaleString("zh-CN", { hour12: false });
  }

  function fmtRemain(expiresAt) {
    var left = expiresAt - Math.floor(Date.now() / 1000);
    if (left <= 0) return "已过期";
    var m = Math.floor(left / 60);
    var s = left % 60;
    return (m > 0 ? m + " 分 " : "") + s + " 秒";
  }

  // ---------- 面板渲染 ----------
  function renderWaitPanel() {
    var s = pollState;
    if (!s || !s.info) {
      waitPanel.hidden = true;
      return;
    }
    waitPanel.hidden = false;

    var state, badgeText, titleText, badgeCls;
    if (s.consumed) {
      state = "consumed";
      badgeText = "已消费";
      badgeCls = "consumed";
      titleText = "记录已删除（模拟业务消费）";
    } else if (s.lastStatus === "success") {
      state = "success";
      badgeText = "已通过";
      badgeCls = "success";
      titleText = "邮箱验证通过";
    } else if (s.lastStatus === "expired") {
      state = "expired";
      badgeText = "已过期";
      badgeCls = "expired";
      titleText = "任务已过期或不存在";
    } else if (s.lastStatus === "error") {
      state = "error";
      badgeText = "异常";
      badgeCls = "error";
      titleText = "校验异常";
    } else {
      state = "waiting";
      badgeText = "等待中";
      badgeCls = "";
      titleText = "等待邮件验证…";
    }
    waitPanel.className = "wait-panel state-" + state;

    var info = s.info;
    var verifiedEmail = s.lastData && s.lastData.email ? s.lastData.email : null;

    var rows = [];
    if (verifiedEmail) rows.push(["已验证邮箱", verifiedEmail]);
    rows.push(["收件地址", info.email]);
    rows.push(["期望验证码", info.code]);
    rows.push(["requestId", info.requestId]);
    if (info.action || s.action) rows.push(["action", info.action || s.action]);
    rows.push(["过期时间", fmtDateTime(s.expiresAt)]);
    if (state === "waiting") rows.push(["剩余有效期", fmtRemain(s.expiresAt)]);
    rows.push(["轮询次数", String(s.pollCount) + " 次"]);
    if (s.lastPollAt) rows.push(["上次校验", new Date(s.lastPollAt).toLocaleString("zh-CN", { hour12: false })]);
    if (s.lastError && state !== "waiting") rows.push(["提示", s.lastError]);

    var kvHtml = rows.map(function (r) {
      return "<dt>" + esc(r[0]) + "</dt><dd>" + esc(r[1]) + "</dd>";
    }).join("");

    var spinner = state === "waiting" ? '<span class="spinner"></span>' : "";
    waitTitleEl.innerHTML = spinner + esc(titleText);

    waitBadgeEl.textContent = badgeText;
    waitBadgeEl.className = "wait-badge " + badgeCls;

    var nextHint = "";
    if (state === "waiting") {
      if (s.inFlight) {
        nextHint = "正在校验…";
      } else {
        var wait = 3 - (s.tick % 3);
        if (wait <= 0 || wait > 3) wait = 3;
        nextHint = "约 " + wait + " 秒后再次校验";
      }
    } else if (state === "success") {
      nextHint = "已停止轮询；可删除记录模拟业务消费（防止重放）";
    } else if (state === "expired") {
      nextHint = "任务过期后服务端会自动清理，无需手动处理";
    } else if (state === "consumed") {
      nextHint = "如需再次测试，请点击上方「创建任务」生成新任务";
    }

    var actions = [];
    if (state === "waiting") {
      actions.push('<button data-act="poll">立即校验</button>');
      actions.push('<button data-act="stop" class="secondary">停止轮询</button>');
    }
    if (state === "success") {
      actions.push('<button data-act="consume" class="danger">删除记录（模拟消费）</button>');
    }
    if (state !== "waiting") {
      actions.push('<button data-act="close" class="secondary">关闭面板</button>');
    }

    waitBodyEl.innerHTML =
      '<dl class="wait-kv">' + kvHtml + '</dl>' +
      '<p class="wait-foot">' + esc(nextHint) + '</p>' +
      '<p class="wait-actions">' + actions.join("") + '</p>';
  }

  // ---------- 轮询控制 ----------
  function stopPolling() {
    if (pollState && pollState.timer) {
      clearInterval(pollState.timer);
      pollState.timer = null;
    }
  }

  function startPolling(info) {
    stopPolling();
    pollState = {
      info: info,
      requestId: info.requestId,
      action: info.action || "global",
      expiresAt: info.expiresAt,
      pollCount: 0,
      tick: 0,
      inFlight: false,
      lastStatus: null,
      lastData: null,
      lastError: null,
      lastPollAt: 0,
      consumed: false,
      timer: null,
    };
    renderWaitPanel();
    pollState.timer = setInterval(tickOnce, 1000);
    // 首次立即校验，不必等 3 秒（给人"马上在查"的反馈）
    pollOnce();
  }

  function tickOnce() {
    if (!pollState || !pollState.timer) return;
    if (
      pollState.lastStatus === "success" ||
      pollState.lastStatus === "expired" ||
      pollState.lastStatus === "error" ||
      pollState.consumed
    ) {
      stopPolling();
      return;
    }
    pollState.tick++;
    if (pollState.tick % 3 === 0) {
      pollOnce();
    } else {
      renderWaitPanel();
    }
  }

  async function pollOnce() {
    if (!pollState) return;
    if (pollState.inFlight) return;
    if (
      pollState.lastStatus === "success" ||
      pollState.lastStatus === "expired" ||
      pollState.lastStatus === "error"
    ) {
      return;
    }

    pollState.inFlight = true;
    pollState.pollCount++;
    pollState.lastPollAt = Date.now();
    renderWaitPanel();

    try {
      var body = { requestId: pollState.requestId };
      if (pollState.action) body.action = pollState.action;

      var res = await fetch("/api/reverse/query", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      var data = await res.json().catch(function () { return {}; });

      if (res.status === 401) {
        pollState.lastStatus = "error";
        pollState.lastError = "会话已过期，请刷新页面重新登录";
        stopPolling();
        setStatus("Token 已过期", false);
        renderWaitPanel();
        return;
      }

      if (!res.ok) {
        pollState.lastError = "HTTP " + res.status + " " + (data.error || "");
        renderWaitPanel();
        return;
      }

      pollState.lastData = data;

      if (data.valid) {
        pollState.lastStatus = "success";
        stopPolling();
        renderWaitPanel();
        setStatus("邮箱验证通过：" + (data.email || ""), true);
        return;
      }

      if (data.error === "EXPIRED_OR_NOT_FOUND") {
        pollState.lastStatus = "expired";
        stopPolling();
        renderWaitPanel();
        setStatus("任务已过期或不存在", false);
        return;
      }

      if (data.error === "ACTION_MISMATCH") {
        pollState.lastStatus = "error";
        pollState.lastError =
          "action 不匹配（任务 action=" + (pollState.action || "-") + "）";
        stopPolling();
        renderWaitPanel();
        setStatus("action 不匹配", false);
        return;
      }

      // NOT_YET_VERIFIED → 继续等待
      pollState.lastError = null;
      renderWaitPanel();
    } finally {
      if (pollState) pollState.inFlight = false;
    }
  }

  async function consumeRecord() {
    if (!pollState || !pollState.requestId) return;
    var res = await fetch("/api/reverse/delete", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId: pollState.requestId }),
    });
    var data = await res.json().catch(function () { return {}; });
    if (res.ok && data.success) {
      pollState.consumed = true;
      stopPolling();
      renderWaitPanel();
      setStatus("已删除记录（模拟业务消费）", true);
    } else {
      setStatus("删除失败：" + (data.error || res.status), false);
    }
  }

  function closeWaitPanel() {
    stopPolling();
    pollState = null;
    waitPanel.hidden = true;
  }

  // 事件委托，按钮被 innerHTML 重建也不会丢监听
  waitBodyEl.addEventListener("click", function (e) {
    var btn = e.target.closest("button[data-act]");
    if (!btn) return;
    var act = btn.dataset.act;
    if (act === "poll") pollOnce();
    else if (act === "stop") {
      stopPolling();
      setStatus("已停止轮询", true);
      renderWaitPanel();
    } else if (act === "consume") consumeRecord();
    else if (act === "close") closeWaitPanel();
  });

  // ---------- 通用按钮 ----------
  $("#refreshBtn").addEventListener("click", async function () {
    var res = await fetch("/api/refresh", { method: "POST", credentials: "same-origin" });
    var data = await res.json().catch(function () { return {}; });
    if (res.ok) setStatus("Token 已续期 20 分钟", true);
    else setStatus("刷新失败：" + (data.detail || data.error || res.status), false);
  });

  $("#logoutBtn").addEventListener("click", async function () {
    await fetch("/api/logout", { method: "POST", credentials: "same-origin" });
    location.reload();
  });

  // ---------- 数据库初始化 ----------
  document.querySelectorAll("#initFieldset button[data-target]").forEach(function (btn) {
    btn.addEventListener("click", async function () {
      var keyInput = document.querySelector("#initFieldset [name=initKey]");
      var key = keyInput ? keyInput.value : "";
      if (!key) { setStatus("请先填写 env.KEY", false); return; }

      var target = btn.dataset.target;
      var out = $("#initOut");
      show(out, { pending: true, target: target });

      var res = await fetch("/api/init", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: key, target: target }),
      });
      var data = await res.json().catch(function () { return {}; });
      show(out, { status: res.status, data: data });
      if (res.ok) setStatus("初始化完成：" + target, true);
      else setStatus("初始化失败：" + (data.detail || data.error || res.status), false);
    });
  });

  // ---------- 创建任务 ----------
  $("#createBtn").addEventListener("click", async function () {
    var raw = collect($("#createFieldset"));
    var body = {};
    Object.keys(raw).forEach(function (k) {
      var v = raw[k];
      if (v === "" || v == null) return;
      if (k === "ttl" || k === "codeLength" || k === "tokenLength") body[k] = Number(v);
      else if (k === "useSubaddress") body[k] = v === "true";
      else body[k] = v;
    });

    var r = await callApi("/api/reverse/create", body);
    show($("#createOut"), { status: r.status, data: r.data });
    if (r.ok && r.data && r.data.requestId) {
      var reqInput = $("#queryFieldset [name=requestId]");
      if (reqInput && !reqInput.value) reqInput.value = r.data.requestId;
      setStatus("任务已创建：" + r.data.requestId, true);

      // 创建成功后启动等待面板，模拟真实产品"等待邮箱验证"
      startPolling({
        requestId: r.data.requestId,
        email: r.data.email,
        code: r.data.code,
        expiresAt: r.data.expiresAt,
        action: body.action || "global",
      });
    } else {
      setStatus("创建失败", false);
    }
  });

  // ---------- 手动查询 / 删除 ----------
  $("#queryBtn").addEventListener("click", async function () {
    var raw = collect($("#queryFieldset"));
    var body = { requestId: raw.requestId };
    if (raw.queryAction) body.action = raw.queryAction;
    var r = await callApi("/api/reverse/query", body);
    show($("#queryOut"), { status: r.status, data: r.data });
    if (r.ok && r.data && r.data.valid) setStatus("校验通过", true);
    else if (r.ok) setStatus("尚未通过：" + (r.data.error || "PENDING"), false);
  });

  $("#byEmailBtn").addEventListener("click", async function () {
    var raw = collect($("#queryFieldset"));
    var body = { email: raw.email };
    if (raw.emailAction) body.action = raw.emailAction;
    if (!body.email) { setStatus("请填写邮箱", false); return; }
    var r = await callApi("/api/reverse/by-email", body);
    show($("#queryOut"), { status: r.status, data: r.data });
  });

  $("#deleteBtn").addEventListener("click", async function () {
    var raw = collect($("#queryFieldset"));
    if (!raw.requestId) { setStatus("请填写 requestId", false); return; }
    var r = await callApi("/api/reverse/delete", { requestId: raw.requestId });
    show($("#queryOut"), { status: r.status, data: r.data });
    if (r.ok && r.data && r.data.success) setStatus("已删除", true);
    else setStatus("删除失败（记录可能未验证或已被消费）", false);
  });
})();
</script>
</body>
</html>`;
}

// ------------------------- 入口 -------------------------

async function handleFetch(request, env) {
  const url = new URL(request.url);
  const method = request.method;
  const path = url.pathname;

  if (method === "OPTIONS") return new Response(null, { status: 204 });

  // ---- 页面 ----
  if (method === "GET" && (path === "/" || path === "/admin")) {
    const auth = await authorize(request, env);
    if (auth.valid) {
      const keyInfo = await getDailyAdminKey();
      return html(adminPage(keyInfo));
    }
    const error = url.searchParams.get("error") === "invalid" ? "密码错误" : "";
    return html(loginPage(error));
  }

  // ---- 登录 / 刷新 / 登出 ----
  if (method === "POST" && (path === "/login" || path === "/auth/login")) {
    return handleLogin(request, env);
  }
  if (method === "POST" && path === "/api/logout") {
    return new Response(null, {
      status: 204,
      headers: { "Set-Cookie": clearTokenCookie(request) },
    });
  }
  if (method === "POST" && path === "/api/refresh") {
    return handleRefresh(request, env);
  }

  // ---- 初始化接口：只认 body.key === env.KEY，不走 cookie ----
  if (method === "POST" && path === "/api/init") {
    return handleInit(request, env);
  }

  // ---- 需要 cookie 鉴权的 API ----
  if (path.startsWith("/api/")) {
    const auth = await authorize(request, env);
    if (!auth.valid) return json({ error: "Unauthorized" }, 401);

    if (method === "POST" && path === "/api/reverse/create")
      return handleReverseCreate(request, env);
    if (method === "POST" && path === "/api/reverse/query")
      return handleReverseQuery(request, env);
    if (method === "POST" && path === "/api/reverse/by-email")
      return handleReverseByEmail(request, env);
    if (method === "POST" && path === "/api/reverse/delete")
      return handleReverseDelete(request, env);

    return json({ error: "Not Found" }, 404);
  }

  // ---- 老运维端点（保留 X-Admin-Key 兼容） ----
  if (path === "/runtask") {
    const auth = await authorize(request, env);
    if (!auth.valid) return json({ error: "Unauthorized" }, 401);
    try {
      await cleanExpiredKv(env.db);
      await cleanExpiredPsp(env.db);
      await cleanExpiredReverseVerifications(env.db);
      return json({ success: true, message: "task runed" });
    } catch (err) {
      return json(
        { error: "Task run failed", detail: err.message, stack: err.stack },
        500,
      );
    }
  }

  if (path === "/initdb") {
    const auth = await authorize(request, env);
    if (!auth.valid) return json({ error: "Unauthorized" }, 401);
    try {
      await initKvTable(env.db);
      await initPspTables(env.db);
      await initReverseVerifyTable(env.db);
      return json({ success: true, message: "Database initialized" });
    } catch (err) {
      return json(
        {
          error: "Database initialization failed",
          detail: err.message,
          stack: err.stack,
        },
        500,
      );
    }
  }

  return json({ error: "Not Found" }, 404);
}

export default {
  async fetch(request, env) {
    try {
      return await handleFetch(request, env);
    } catch (err) {
      return json({ error: "Internal Error", detail: err.message }, 500);
    }
  },
};
