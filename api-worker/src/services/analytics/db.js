// services/analytics/db.js
// 分析服务的全部 SQL。表名统一走 config.TABLES，别处不要写裸表名。
//
// 安全约定：
//   - SQL 里的 `${}` 只允许拼接「常量表名」或「白名单列名」，禁止拼接任何请求数据；
//   - 所有用户输入一律通过 .bind() 传参，不得进入 SQL 字符串。

import { TABLES } from "./config.js";

/** 站点表允许被 UPDATE 的列（白名单，禁止外部传列名进来） */
const SITE_UPDATABLE_COLUMNS = new Set([
  "name",
  "domain",
  "domains",
  "visibility",
  "listed",
  "share_config",
  "updated_at",
]);

/* ─────────────────────── 站点 ─────────────────────── */

const SITE_COLUMNS = `id, token, user_sub, domain, domains, name,
  visibility, listed, share_config, created_at, updated_at`;

export function findSiteByToken(db, token) {
  return db
    .prepare(`SELECT ${SITE_COLUMNS} FROM ${TABLES.sites} WHERE token = ?`)
    .bind(token)
    .first();
}

export function findSiteById(db, id) {
  return db
    .prepare(`SELECT ${SITE_COLUMNS} FROM ${TABLES.sites} WHERE id = ?`)
    .bind(id)
    .first();
}

export async function countSitesByUser(db, userSub) {
  const row = await db
    .prepare(`SELECT COUNT(*) AS cnt FROM ${TABLES.sites} WHERE user_sub = ?`)
    .bind(userSub)
    .first();
  return row ? row.cnt : 0;
}

/** 全局域名唯一性：返回占用的站点（排除 excludeId） */
export function findDomainConflict(db, domain, excludeId = 0) {
  return db
    .prepare(
      `SELECT s.id, s.name
         FROM ${TABLES.sites} s, json_each(s.domains) j
        WHERE lower(j.value) = ? AND s.id <> ?
        LIMIT 1`,
    )
    .bind(domain, excludeId)
    .first();
}

/** 管理员：全部站点；普通用户：自己的 + 他人 listed 且非 private 的 */
export function listConsoleSites(db, userSub, isAdmin) {
  if (isAdmin) {
    return db
      .prepare(
        `SELECT ${SITE_COLUMNS} FROM ${TABLES.sites} ORDER BY created_at DESC`,
      )
      .all();
  }
  return db
    .prepare(
      `SELECT ${SITE_COLUMNS} FROM ${TABLES.sites}
        WHERE user_sub = ?
           OR (listed = 1 AND visibility IN ('logged_in', 'public'))
        ORDER BY created_at DESC`,
    )
    .bind(userSub)
    .all();
}

/**
 * 公开区块：
 * - 管理员：全部站点，不过滤自己
 * - 登录用户：public + listed，排除自己
 * - 匿名：public + listed
 */
export function listPublicSites(db, { viewerSub = null, isAdmin = false, limit }) {
  if (isAdmin) {
    return db
      .prepare(
        `SELECT id, name, domain, domains FROM ${TABLES.sites}
          ORDER BY created_at DESC LIMIT ?`,
      )
      .bind(limit)
      .all();
  }
  if (viewerSub) {
    return db
      .prepare(
        `SELECT id, name, domain, domains FROM ${TABLES.sites}
          WHERE listed = 1 AND visibility = 'public' AND user_sub <> ?
          ORDER BY created_at DESC LIMIT ?`,
      )
      .bind(viewerSub, limit)
      .all();
  }
  return db
    .prepare(
      `SELECT id, name, domain, domains FROM ${TABLES.sites}
        WHERE listed = 1 AND visibility = 'public'
        ORDER BY created_at DESC LIMIT ?`,
    )
    .bind(limit)
    .all();
}

/** 「我的站点」区块 */
export function listSitesByUser(db, userSub, limit) {
  return db
    .prepare(
      `SELECT id, name, domain, domains FROM ${TABLES.sites}
        WHERE user_sub = ? ORDER BY created_at DESC LIMIT ?`,
    )
    .bind(userSub, limit)
    .all();
}

export function insertSite(db, site) {
  return db
    .prepare(
      `INSERT INTO ${TABLES.sites}
         (token, user_sub, domain, domains, name, visibility, listed,
          share_config, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      site.token,
      site.user_sub,
      site.domain,
      site.domains,
      site.name,
      site.visibility,
      site.listed,
      site.share_config,
      site.created_at,
      site.updated_at,
    )
    .run();
}

/**
 * 动态 UPDATE：只允许白名单列，列名不来自请求，值一律 bind。
 * 传入未知列直接抛错，避免有人把用户可控的 key 递进来。
 */
export function updateSite(db, id, fields) {
  const keys = Object.keys(fields);
  const illegal = keys.filter((k) => !SITE_UPDATABLE_COLUMNS.has(k));
  if (illegal.length) {
    throw new Error(`updateSite: illegal column(s): ${illegal.join(", ")}`);
  }
  if (!keys.length) throw new Error("updateSite: no fields");

  const sets = keys.map((k) => `${k} = ?`).join(", ");
  const values = keys.map((k) => fields[k]);
  return db
    .prepare(`UPDATE ${TABLES.sites} SET ${sets} WHERE id = ?`)
    .bind(...values, id)
    .run();
}

export async function deleteSite(db, id, token) {
  return db.batch([
    db.prepare(`DELETE FROM ${TABLES.events} WHERE site_token = ?`).bind(token),
    db.prepare(`DELETE FROM ${TABLES.sites} WHERE id = ?`).bind(id),
  ]);
}

export function transferSite(db, id, targetSub, updatedAt) {
  return db
    .prepare(
      `UPDATE ${TABLES.sites} SET user_sub = ?, updated_at = ? WHERE id = ?`,
    )
    .bind(targetSub, updatedAt, id)
    .run();
}

/** 批量取用户名（列表页展示创建者） */
export async function usernamesBySubs(db, subs) {
  if (!subs.length) return {};
  const placeholders = subs.map(() => "?").join(",");
  const rows = await db
    .prepare(
      `SELECT sub, username FROM online_users WHERE sub IN (${placeholders})`,
    )
    .bind(...subs)
    .all();
  return Object.fromEntries((rows.results || []).map((r) => [r.sub, r.username]));
}

export function findUserBySub(db, sub) {
  return db
    .prepare("SELECT sub, username FROM online_users WHERE sub = ?")
    .bind(sub)
    .first();
}

/* ─────────────────────── 事件 ─────────────────────── */

export function insertEvent(db, e) {
  return db
    .prepare(
      `INSERT INTO ${TABLES.events}
         (site_token, ts, visitor, session_id, name, path, ref,
          country, province, browser, browser_version, os, os_version,
          device, screen, touch_points, utm_source, utm_medium,
          utm_campaign, utm_term, utm_content)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    )
    .bind(
      e.site_token,
      e.ts,
      e.visitor,
      e.session_id,
      e.name,
      e.path,
      e.ref,
      e.country,
      e.province,
      e.browser,
      e.browser_version,
      e.os,
      e.os_version,
      e.device,
      e.screen,
      e.touch_points,
      e.utm_source,
      e.utm_medium,
      e.utm_campaign,
      e.utm_term,
      e.utm_content,
    )
    .run();
}

const RANGE_WHERE = `site_token = ? AND ts BETWEEN ? AND ?`;

export function queryTotals(db, token, from, to) {
  return db
    .prepare(
      `SELECT COUNT(*) AS pageviews,
              COUNT(DISTINCT visitor) AS visitors,
              COUNT(DISTINCT CASE WHEN session_id <> '' THEN session_id END) AS sessions
         FROM ${TABLES.events}
        WHERE ${RANGE_WHERE} AND name = 'pageview'`,
    )
    .bind(token, from, to);
}

export function querySeries(db, token, from, to) {
  return db
    .prepare(
      `SELECT date(ts, 'unixepoch') AS day,
              COUNT(*) AS pageviews,
              COUNT(DISTINCT visitor) AS visitors,
              COUNT(DISTINCT CASE WHEN session_id <> '' THEN session_id END) AS sessions
         FROM ${TABLES.events}
        WHERE ${RANGE_WHERE} AND name = 'pageview'
        GROUP BY day ORDER BY day`,
    )
    .bind(token, from, to);
}

/** 固定维度的聚合 SQL；dimension 只能来自白名单，避免拼接注入 */
const BREAKDOWNS = {
  path: {
    select: `path AS val, COUNT(*) AS pageviews, COUNT(DISTINCT visitor) AS visitors`,
    where: `name = 'pageview'`,
    group: `path`,
  },
  referrer: {
    select: `CASE WHEN ref = '' THEN '__direct__' ELSE ref END AS val,
             COUNT(*) AS pageviews, COUNT(DISTINCT visitor) AS visitors`,
    where: `name = 'pageview'`,
    group: `ref`,
  },
  country: {
    select: `country AS val, COUNT(*) AS pageviews, COUNT(DISTINCT visitor) AS visitors`,
    where: `name = 'pageview' AND country <> ''`,
    group: `country`,
  },
  province: {
    select: `province AS val, COUNT(*) AS pageviews, COUNT(DISTINCT visitor) AS visitors`,
    where: `name = 'pageview' AND country = 'CN' AND province <> ''`,
    group: `province`,
  },
  browser: {
    select: `browser AS val, COUNT(*) AS pageviews, COUNT(DISTINCT visitor) AS visitors`,
    where: `name = 'pageview'`,
    group: `browser`,
  },
  os: {
    select: `os AS val, COUNT(*) AS pageviews, COUNT(DISTINCT visitor) AS visitors`,
    where: `name = 'pageview'`,
    group: `os`,
  },
  device: {
    select: `device AS val, COUNT(*) AS pageviews, COUNT(DISTINCT visitor) AS visitors`,
    where: `name = 'pageview'`,
    group: `device`,
  },
  event: {
    select: `name AS val, COUNT(*) AS pageviews, COUNT(DISTINCT visitor) AS visitors`,
    where: `name <> 'pageview'`,
    group: `name`,
  },
};

export function queryBreakdown(db, token, from, to, dimension, { cnOnly = false } = {}) {
  const spec = BREAKDOWNS[dimension];
  if (!spec) return null;
  let where = spec.where;
  if (cnOnly && dimension === "country") where += ` AND country = 'CN'`;
  return db
    .prepare(
      `SELECT ${spec.select}
         FROM ${TABLES.events}
        WHERE ${RANGE_WHERE} AND ${where}
        GROUP BY ${spec.group} ORDER BY pageviews DESC LIMIT 20`,
    )
    .bind(token, from, to);
}

export function queryRealtimeEvents(db, token, since) {
  return db
    .prepare(
      `SELECT ts, path, country, visitor FROM ${TABLES.events}
        WHERE site_token = ? AND ts >= ? AND name = 'pageview'
        ORDER BY ts DESC LIMIT 2000`,
    )
    .bind(token, since)
    .all();
}

export const BREAKDOWN_KEYS = Object.keys(BREAKDOWNS);
