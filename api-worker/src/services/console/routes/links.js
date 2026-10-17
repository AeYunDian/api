// routes/links.js —— 短链接管理接口（console.undz.cn）
// 全部端点已在 ayConsole.js 里经过 checkAuth，这里只做归属/管理员校验。

import { jsonResponse } from "../http.js";
import {
  BLOCKED_CODE_KEYWORDS,
  CODE_CHARS_ADMIN,
  CODE_CHARS_USER,
  CODE_LEN_MAX,
  CODE_LEN_MIN_ADMIN,
  CODE_LEN_MIN_USER,
  CODE_ALPHABET,
  CODE_LENGTH,
  LINK_PAGE_DEFAULT,
  LINK_PAGE_MAX,
  MAX_LINKS_PER_USER,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  RESERVED_CODES,
  SYSTEM_CODES,
  TARGET_MAX_LEN,
  buildShortUrl,
} from "../config.js";
import {
  ERROR_CODES,
  ERROR_MESSAGES,
  httpStatusFor,
} from "../../../shared/error-codes.js";
import { hashPassword, toBase64 } from "../../account/auth/crypto.js";

const TITLE_MAX = 100;

/* ───────────────────────── 小工具 ───────────────────────── */

function nowSec() {
  return Math.floor(Date.now() / 1000);
}

function fail(cors, code, extra) {
  return jsonResponse(
    { error_code: code, error: ERROR_MESSAGES[code] || "Error", ...extra },
    httpStatusFor(code),
    cors,
  );
}

function isAdminUser(user) {
  return user?.sub === 1;
}

function canManage(rec, user, isAdmin) {
  return isAdmin || rec.user_sub === user.sub;
}

function publicLink(rec, isAdmin) {
  const now = nowSec();
  return {
    id: rec.id,
    code: rec.code,
    short_url: buildShortUrl(rec.code),
    target: rec.target,
    title: rec.title || "",
    has_password: Boolean(rec.password_hash),
    expires_at: rec.expires_at ?? null,
    expired: Boolean(rec.expires_at && rec.expires_at <= now),
    status: rec.status,
    click_count: rec.click_count ?? 0,
    last_clicked_at: rec.last_clicked_at ?? null,
    user_sub: rec.user_sub,
    created_at: rec.created_at,
    updated_at: rec.updated_at,
    ...(isAdmin ? { creator_username: rec.creator_username ?? null } : {}),
  };
}

function generateCode(length = CODE_LENGTH) {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  let out = "";
  for (const byte of bytes) out += CODE_ALPHABET[byte % CODE_ALPHABET.length];
  return out;
}

function invalidCode(message) {
  return { code: ERROR_CODES.LINK_INVALID_CODE, message };
}

/** 校验短码；合法返回 null，非法返回 { code, message } */
function validateCode(code, isAdmin) {
  if (typeof code !== "string") return invalidCode("短码不合法");

  const min = isAdmin ? CODE_LEN_MIN_ADMIN : CODE_LEN_MIN_USER;
  if (code.length < min || code.length > CODE_LEN_MAX) {
    return invalidCode(
      isAdmin
        ? `短码需 1–${CODE_LEN_MAX} 位`
        : `短码需 ${CODE_LEN_MIN_USER}–${CODE_LEN_MAX} 位`,
    );
  }

  if (code.startsWith("/") || code.endsWith("/") || code.includes("//")) {
    return invalidCode("短码不能以 / 开头或结尾，也不能包含 //");
  }

  // 真实存在的系统路径，任何人都不能占用
  if (SYSTEM_CODES.has(code)) {
    return invalidCode(`${code} 是系统路径，不能作为短码`);
  }

  // 保留名称只对普通用户关闭；管理员可以创建
  if (!isAdmin && RESERVED_CODES.has(code)) {
    return invalidCode("该短码为保留名称，仅管理员可以创建");
  }

  // 屏蔽词：包含即拒绝，管理员不受限
  if (!isAdmin) {
    const lower = code.toLowerCase();
    const hit = BLOCKED_CODE_KEYWORDS.find(
      (word) => word && lower.includes(String(word).toLowerCase()),
    );
    if (hit) {
      return invalidCode(`短码包含屏蔽词「${hit}」，仅管理员可以创建`);
    }
  }

  // 字符集放在最后：这样命中屏蔽词的短码会给出更贴近意图的提示
  const pattern = isAdmin ? CODE_CHARS_ADMIN : CODE_CHARS_USER;
  if (!pattern.test(code)) {
    return invalidCode(
      isAdmin
        ? "短码可用 a-z A-Z 1-9 / - @ # $ % * ( )"
        : "短码仅限 a-z、数字 1-9、/ 和 -",
    );
  }

  return null;
}

/** 校验并规范化目标 URL；返回 { url } 或 { error } */
function normalizeTarget(raw, env) {
  if (typeof raw !== "string") return { error: ERROR_CODES.LINK_INVALID_TARGET };
  const target = raw.trim();
  if (!target || target.length > TARGET_MAX_LEN) {
    return { error: ERROR_CODES.LINK_INVALID_TARGET };
  }

  let parsed;
  try {
    parsed = new URL(target);
  } catch {
    return { error: ERROR_CODES.LINK_INVALID_TARGET };
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { error: ERROR_CODES.LINK_INVALID_TARGET };
  }

  // 禁止短链套短链
  if (parsed.hostname.toLowerCase() === "go.undz.cn") {
    return { error: ERROR_CODES.LINK_SELF_REFERENCE };
  }

  const blocked = String(env.SHORTLINK_BLOCKED_HOSTS || "")
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
  if (blocked.includes(parsed.hostname.toLowerCase())) {
    return { error: ERROR_CODES.LINK_INVALID_TARGET };
  }

  return { url: parsed.toString() };
}

function parseExpiresAt(raw) {
  if (raw === undefined || raw === null || raw === "") return { value: null };
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) {
    return { error: ERROR_CODES.LINK_INVALID_EXPIRES };
  }
  if (n <= nowSec()) {
    return { error: ERROR_CODES.LINK_INVALID_EXPIRES };
  }
  return { value: n };
}

async function hashLinkPassword(password) {
  if (
    typeof password !== "string" ||
    password.length < PASSWORD_MIN_LENGTH ||
    password.length > PASSWORD_MAX_LENGTH
  ) {
    return { error: ERROR_CODES.LINK_INVALID_PASSWORD };
  }
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const derived = await hashPassword(password, salt);
  return { hash: toBase64(derived), salt: toBase64(salt) };
}

function escapeLike(value) {
  return value.replace(/[\\%_]/g, (m) => `\\${m}`);
}

async function countUserLinks(env, sub) {
  const row = await env.db
    .prepare(
      "SELECT COUNT(*) AS cnt FROM short_links WHERE user_sub = ? AND status != 'deleted'",
    )
    .bind(sub)
    .first();
  return row?.cnt || 0;
}

async function getLinkById(env, id) {
  return env.db
    .prepare("SELECT * FROM short_links WHERE id = ?")
    .bind(id)
    .first();
}

/* ───────────────────────── 路由 ───────────────────────── */

export async function handleLinksRoutes({
  request,
  env,
  url,
  path,
  method,
  cors,
  user,
  isAdmin,
}) {
  const admin = isAdmin ?? isAdminUser(user);

  /* ---------- 列表 ---------- */
  if (path === "/api/console/links" && method === "GET") {
    const limitRaw = Number.parseInt(url.searchParams.get("limit"), 10);
    const limit = Number.isFinite(limitRaw)
      ? Math.min(Math.max(limitRaw, 1), LINK_PAGE_MAX)
      : LINK_PAGE_DEFAULT;

    const cursorRaw = Number.parseInt(url.searchParams.get("cursor"), 10);
    const cursor = Number.isFinite(cursorRaw) ? cursorRaw : null;

    const status = url.searchParams.get("status") || "all";
    const q = (url.searchParams.get("q") || "").trim();

    const where = [];
    const params = [];
    const now = nowSec();

    if (!admin) {
      where.push("l.user_sub = ?");
      params.push(user.sub);
    }

    if (status === "active") {
      where.push(
        "l.status = 'active' AND (l.expires_at IS NULL OR l.expires_at > ?)",
      );
      params.push(now);
    } else if (status === "expired") {
      where.push(
        "l.status = 'active' AND l.expires_at IS NOT NULL AND l.expires_at <= ?",
      );
      params.push(now);
    } else if (status === "disabled") {
      where.push("l.status = 'disabled'");
    } else if (status === "deleted") {
      where.push("l.status = 'deleted'");
    } else {
      // 默认「全部」不包含已删除，避免列表被历史数据淹没
      where.push("l.status != 'deleted'");
    }

    if (cursor) {
      where.push("l.id < ?");
      params.push(cursor);
    }

    if (q) {
      const like = `%${escapeLike(q)}%`;
      where.push(
        "(l.code LIKE ? ESCAPE '\\' OR l.target LIKE ? ESCAPE '\\' OR l.title LIKE ? ESCAPE '\\')",
      );
      params.push(like, like, like);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const rows = await env.db
      .prepare(
        `SELECT l.*, u.username AS creator_username
           FROM short_links l
           LEFT JOIN online_users u ON u.sub = l.user_sub
           ${whereSql}
          ORDER BY l.id DESC
          LIMIT ?`,
      )
      .bind(...params, limit + 1)
      .all();

    const list = rows.results || [];
    const hasMore = list.length > limit;
    const page = hasMore ? list.slice(0, limit) : list;

    const used = admin ? null : await countUserLinks(env, user.sub);

    return jsonResponse(
      {
        links: page.map((row) => publicLink(row, admin)),
        next_cursor: hasMore ? page[page.length - 1].id : null,
        quota: {
          used: used ?? null,
          limit: admin ? null : MAX_LINKS_PER_USER,
        },
      },
      200,
      cors,
    );
  }

  /* ---------- 创建 ---------- */
  if (path === "/api/console/links" && method === "POST") {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return fail(cors, ERROR_CODES.LINK_INVALID_TARGET);
    }

    const targetResult = normalizeTarget(body.target, env);
    if (targetResult.error) return fail(cors, targetResult.error);

    let code = null;
    if (body.code !== undefined && body.code !== null && body.code !== "") {
      code = String(body.code).trim();
      const codeError = validateCode(code, admin);
      if (codeError) {
        return fail(cors, codeError.code, { error: codeError.message });
      }
    }

    let passwordHash = null;
    let passwordSalt = null;
    if (body.password !== undefined && body.password !== null && body.password !== "") {
      const hashed = await hashLinkPassword(String(body.password));
      if (hashed.error) return fail(cors, hashed.error);
      passwordHash = hashed.hash;
      passwordSalt = hashed.salt;
    }

    let expiresAt = null;
    if (body.expires_at !== undefined) {
      const expiresResult = parseExpiresAt(body.expires_at);
      if (expiresResult.error) return fail(cors, expiresResult.error);
      expiresAt = expiresResult.value;
    }

    const title = String(body.title || "")
      .trim()
      .slice(0, TITLE_MAX);
    const now = nowSec();

    // 自定义码：单次尝试；自动码：冲突时重试
    const attempts = code ? 1 : 5;
    let lastError = null;
    let insertedId = null;
    let finalCode = code;

    for (let i = 0; i < attempts; i++) {
      const candidate = code || generateCode();
      try {
        const result = admin
          ? await env.db
              .prepare(
                `INSERT INTO short_links
                   (code, target, user_sub, title, password_hash, password_salt,
                    expires_at, status, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
              )
              .bind(
                candidate,
                targetResult.url,
                user.sub,
                title,
                passwordHash,
                passwordSalt,
                expiresAt,
                now,
                now,
              )
              .run()
          : await env.db
              .prepare(
                `INSERT INTO short_links
                   (code, target, user_sub, title, password_hash, password_salt,
                    expires_at, status, created_at, updated_at)
                 SELECT ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?
                  WHERE (SELECT COUNT(*) FROM short_links
                          WHERE user_sub = ? AND status != 'deleted') < ?`,
              )
              .bind(
                candidate,
                targetResult.url,
                user.sub,
                title,
                passwordHash,
                passwordSalt,
                expiresAt,
                now,
                now,
                user.sub,
                MAX_LINKS_PER_USER,
              )
              .run();

        if (!result.meta || result.meta.changes === 0) {
          return fail(cors, ERROR_CODES.LINK_LIMIT_REACHED);
        }
        insertedId = result.meta.last_row_id;
        finalCode = candidate;
        break;
      } catch (err) {
        const message = String(err?.message || "");
        if (message.includes("UNIQUE") || message.includes("constraint")) {
          lastError = ERROR_CODES.LINK_CODE_TAKEN;
          if (code) break;
          continue; // 自动码换一个再试
        }
        throw err;
      }
    }

    if (lastError) return fail(cors, lastError);

    let created = insertedId ? await getLinkById(env, insertedId) : null;
    if (!created && finalCode) {
      created = await env.db
        .prepare("SELECT * FROM short_links WHERE code = ?")
        .bind(finalCode)
        .first();
    }
    if (!created) return fail(cors, ERROR_CODES.LINK_NOT_FOUND);

    return jsonResponse({ link: publicLink(created, admin) }, 201, cors);
  }

  /* ---------- 单条：/{id} 或 /{id}/rotate|transfer ---------- */
  const match = path.match(
    /^\/api\/console\/links\/(\d+)(?:\/(rotate|transfer))?$/,
  );
  if (!match) return null;

  const id = Number.parseInt(match[1], 10);
  const action = match[2];
  const rec = await getLinkById(env, id);
  if (!rec) return fail(cors, ERROR_CODES.LINK_NOT_FOUND);

  /* ---------- 详情 ---------- */
  if (!action && method === "GET") {
    if (!canManage(rec, user, admin)) {
      return fail(cors, ERROR_CODES.LINK_NOT_FOUND);
    }
    return jsonResponse({ link: publicLink(rec, admin) }, 200, cors);
  }

  /* ---------- 修改 ---------- */
  if (!action && (method === "PATCH" || method === "PUT")) {
    if (!canManage(rec, user, admin)) {
      return fail(cors, ERROR_CODES.LINK_PERMISSION_DENIED);
    }
    if (rec.status === "deleted") {
      return fail(cors, ERROR_CODES.LINK_NOT_FOUND);
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return fail(cors, ERROR_CODES.INVALID_ACTION);
    }

    const sets = [];
    const params = [];

    if (body.target !== undefined) {
      const targetResult = normalizeTarget(body.target, env);
      if (targetResult.error) return fail(cors, targetResult.error);
      sets.push("target = ?");
      params.push(targetResult.url);
    }

    if (body.title !== undefined) {
      sets.push("title = ?");
      params.push(
        String(body.title || "")
          .trim()
          .slice(0, TITLE_MAX),
      );
    }

    if (body.code !== undefined) {
      const newCode = String(body.code).trim();
      if (newCode !== rec.code) {
        const codeError = validateCode(newCode, admin);
        if (codeError) {
          return fail(cors, codeError.code, { error: codeError.message });
        }
        sets.push("code = ?");
        params.push(newCode);
      }
    }

    if (body.clear_password === true) {
      sets.push("password_hash = NULL", "password_salt = NULL");
    } else if (body.password !== undefined && body.password !== null && body.password !== "") {
      const hashed = await hashLinkPassword(String(body.password));
      if (hashed.error) return fail(cors, hashed.error);
      sets.push("password_hash = ?", "password_salt = ?");
      params.push(hashed.hash, hashed.salt);
    }

    if (body.clear_expires === true) {
      sets.push("expires_at = NULL");
    } else if (body.expires_at !== undefined && body.expires_at !== null) {
      const expiresResult = parseExpiresAt(body.expires_at);
      if (expiresResult.error) return fail(cors, expiresResult.error);
      sets.push("expires_at = ?");
      params.push(expiresResult.value);
    }

    if (body.status !== undefined) {
      if (body.status !== "active" && body.status !== "disabled") {
        return fail(cors, ERROR_CODES.INVALID_ACTION);
      }
      sets.push("status = ?");
      params.push(body.status);
    }

    if (!sets.length) {
      return jsonResponse({ link: publicLink(rec, admin) }, 200, cors);
    }

    sets.push("updated_at = ?");
    params.push(nowSec());

    try {
      await env.db
        .prepare(
          `UPDATE short_links SET ${sets.join(", ")} WHERE id = ?`,
        )
        .bind(...params, id)
        .run();
    } catch (err) {
      if (String(err?.message || "").includes("UNIQUE")) {
        return fail(cors, ERROR_CODES.LINK_CODE_TAKEN);
      }
      throw err;
    }

    const updated = await getLinkById(env, id);
    return jsonResponse({ link: publicLink(updated, admin) }, 200, cors);
  }

  /* ---------- 软删除 ---------- */
  if (!action && method === "DELETE") {
    if (!canManage(rec, user, admin)) {
      return fail(cors, ERROR_CODES.LINK_PERMISSION_DENIED);
    }
    await env.db
      .prepare(
        "UPDATE short_links SET status = 'deleted', updated_at = ? WHERE id = ?",
      )
      .bind(nowSec(), id)
      .run();
    return jsonResponse({ success: true, message: "Link deleted" }, 200, cors);
  }

  /* ---------- 换短码 ---------- */
  if (action === "rotate" && method === "POST") {
    if (!canManage(rec, user, admin)) {
      return fail(cors, ERROR_CODES.LINK_PERMISSION_DENIED);
    }
    if (rec.status === "deleted") {
      return fail(cors, ERROR_CODES.LINK_NOT_FOUND);
    }

    let newCode = null;
    for (let i = 0; i < 5; i++) {
      const candidate = generateCode();
      try {
        await env.db
          .prepare(
            "UPDATE short_links SET code = ?, updated_at = ? WHERE id = ?",
          )
          .bind(candidate, nowSec(), id)
          .run();
        newCode = candidate;
        break;
      } catch (err) {
        if (!String(err?.message || "").includes("UNIQUE")) throw err;
      }
    }
    if (!newCode) return fail(cors, ERROR_CODES.LINK_CODE_TAKEN);

    const updated = await getLinkById(env, id);
    return jsonResponse({ link: publicLink(updated, admin) }, 200, cors);
  }

  /* ---------- 转移（管理员） ---------- */
  if (action === "transfer" && (method === "PUT" || method === "POST")) {
    if (!admin) return fail(cors, ERROR_CODES.LINK_PERMISSION_DENIED);

    const body = await request.json().catch(() => null);
    const targetUserId = Number.parseInt(body?.target_user_id, 10);
    if (!Number.isFinite(targetUserId)) {
      return fail(cors, ERROR_CODES.MISSING_PARAMS);
    }

    const targetUser = await env.db
      .prepare("SELECT sub, username FROM online_users WHERE sub = ?")
      .bind(targetUserId)
      .first();
    if (!targetUser) {
      return fail(cors, ERROR_CODES.USER_NOT_FOUND);
    }

    if (targetUserId !== 1) {
      const count = await countUserLinks(env, targetUserId);
      if (count >= MAX_LINKS_PER_USER) {
        return fail(cors, ERROR_CODES.LINK_LIMIT_REACHED);
      }
    }

    await env.db
      .prepare("UPDATE short_links SET user_sub = ?, updated_at = ? WHERE id = ?")
      .bind(targetUserId, nowSec(), id)
      .run();

    return jsonResponse(
      {
        success: true,
        message: "Link owner transferred",
        target_username: targetUser.username,
      },
      200,
      cors,
    );
  }

  return null;
}
