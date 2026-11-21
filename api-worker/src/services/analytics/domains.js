// services/analytics/domains.js
// 域名规范化、列表构建、站点域名解析。唯一性查询走 db.js。

import { MAX_DOMAINS_PER_SITE, DOMAIN_MAX } from "./config.js";
import { findDomainConflict } from "./db.js";

const DOMAIN_RE =
  /^(?=.{4,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

/**
 * 归一化域名：
 * - 补协议后交给 URL，自动处理 IDN → punycode、端口、路径、大小写
 * - 去掉结尾的点与开头的 www.
 */
export function normalizeDomain(raw) {
  let s = String(raw || "")
    .trim()
    .toLowerCase();
  if (!s) return "";
  if (!/^[a-z][a-z0-9+.-]*:\/\//.test(s)) s = "http://" + s;
  try {
    s = new URL(s).hostname;
  } catch {
    return "";
  }
  return s
    .replace(/\.$/, "")
    .replace(/^www\./, "")
    .slice(0, DOMAIN_MAX);
}

function isLocalHost(domain) {
  return (
    domain === "localhost" ||
    domain === "127.0.0.1" ||
    domain.endsWith(".local")
  );
}

export function isValidDomain(domain, { allowLocal = false } = {}) {
  if (!domain) return false;
  if (allowLocal && isLocalHost(domain)) return true;
  return DOMAIN_RE.test(domain);
}

/**
 * 从创建/编辑请求体构建域名列表。
 * domains 优先，其次 domain；非法项丢弃；去重；截断到 10 条。
 */
export function buildDomainsList(body, { allowLocal = false } = {}) {
  const source = body || {};
  let raw;
  if (Array.isArray(source.domains)) raw = source.domains;
  else if (typeof source.domains === "string") raw = source.domains.split(/\r?\n/);
  else raw = [];

  if (!raw.length) raw = [source.domain];

  const seen = new Set();
  const out = [];
  for (const item of raw) {
    const domain = normalizeDomain(item);
    if (!isValidDomain(domain, { allowLocal })) continue;
    if (seen.has(domain)) continue;
    seen.add(domain);
    out.push(domain);
    if (out.length >= MAX_DOMAINS_PER_SITE) break;
  }
  return out;
}

/** 站点允许上报的域名：优先 domains，旧数据回落 domain */
export function getSiteDomains(site) {
  let list = [];
  try {
    list = JSON.parse(site.domains || "[]");
  } catch {
    list = [];
  }
  if (!Array.isArray(list) || !list.length) list = [site.domain];
  return list.map(normalizeDomain).filter(Boolean);
}

/**
 * 全局唯一性：返回第一个被其他站点占用的域名（含占用者信息），没有冲突返回 null。
 * excludeId 用于编辑时排除自身。
 */
export async function findConflict(db, domains, excludeId = 0) {
  for (const domain of domains) {
    const hit = await findDomainConflict(db, domain, excludeId);
    if (hit) return { domain, site: { id: hit.id, name: hit.name } };
  }
  return null;
}
