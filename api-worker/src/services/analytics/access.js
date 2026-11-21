// services/analytics/access.js
// 权限解析与分享配置归一化。所有「谁能看什么」的判断只在这里。

import { DEFAULT_SHARE_CONFIG, FULL_SHARE_CONFIG } from "./config.js";
import { findSiteById } from "./db.js";
import { safeParseObject } from "./utils.js";

const bool = (v) => v === true;

/**
 * 把任意输入归一化成完整的 share_config：
 * - 白名单合并，schema 外的键丢弃
 * - creator 缺省为 true
 * - 全关时兜底打开 creator（避免公开页完全空白）
 */
export function sanitizeShareConfig(input) {
  const src = input && typeof input === "object" ? input : {};
  const t = src.totals && typeof src.totals === "object" ? src.totals : {};
  const b =
    src.breakdowns && typeof src.breakdowns === "object" ? src.breakdowns : {};

  const config = {
    totals: {
      pageviews: bool(t.pageviews),
      visitors: bool(t.visitors),
      sessions: bool(t.sessions),
    },
    series: bool(src.series),
    realtime: bool(src.realtime),
    creator: src.creator === undefined ? true : bool(src.creator),
    breakdowns: {
      path: bool(b.path),
      referrer: bool(b.referrer),
      country: bool(b.country),
      province: b.province === "CN_ONLY" ? "CN_ONLY" : bool(b.province),
      browser: bool(b.browser),
      os: bool(b.os),
      device: bool(b.device),
      event: bool(b.event),
    },
  };

  // 省份依赖国家/地区维度：国家/地区关闭时不保留省份配置
  if (!config.breakdowns.country) config.breakdowns.province = false;

  const anyOn =
    config.series ||
    config.realtime ||
    config.creator ||
    config.totals.pageviews ||
    config.totals.visitors ||
    config.totals.sessions ||
    Object.values(config.breakdowns).some(Boolean);
  if (!anyOn) config.creator = true;

  return config;
}

/** 读取库里存的 JSON（坏的按默认值处理） */
export function parseShareConfig(raw) {
  return sanitizeShareConfig(safeParseObject(raw, {}));
}

/**
 * 解析访问上下文。
 * @returns {{level: "owner"|"shared"|"need_login"|"denied", site?, shareConfig?, storedShareConfig?}}
 *   shareConfig 为「本次响应实际生效的配置」：owner/admin 是全开，shared 是站点配置。
 */
export async function resolveAccessContext(
  request,
  db,
  siteId,
  user,
  options = {},
) {
  const site = await findSiteById(db, siteId);
  if (!site) return { level: "denied" };

  const isAdmin = !!user && user.sub === 1;
  const isOwner = !!user && user.sub === site.user_sub;
  const storedShareConfig = parseShareConfig(site.share_config);

  if ((isOwner || isAdmin) && options.asGuest !== true) {
    return {
      level: "owner",
      site,
      isAdmin,
      isOwner,
      shareConfig: FULL_SHARE_CONFIG,
      storedShareConfig,
    };
  }

  if (site.visibility === "private") return { level: "denied", site };

  if (site.visibility === "logged_in") {
    if (!user) return { level: "need_login", site };
    return { level: "shared", site, shareConfig: storedShareConfig };
  }

  if (site.visibility === "public") {
    return { level: "shared", site, shareConfig: storedShareConfig };
  }

  return { level: "denied", site };
}

export { DEFAULT_SHARE_CONFIG };
