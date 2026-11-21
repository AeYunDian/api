// services/analytics/config.js
// 分析服务的静态配置：CORS 白名单、上报约束、表名、分享配置默认值。
// 纯数据，不 import 任何业务模块（避免环依赖）。

/** 允许携带 Cookie 的前端来源（统计/管理接口） */
export const ALLOWED_ORIGINS = [
  "https://online.undz.cn",
  "https://console.undz.cn",
  "https://online-dev.undz.cn",
  "https://console-dev.undz.cn",
  "https://mysites.undz.cn",
  "https://mysites-dev.undz.cn",
];

/** 站点 token：32 字节 hex，留出兼容余量 */
export const TOKEN_PATTERN = /^[A-Za-z0-9_-]{20,80}$/;

/** 上报请求体上限（字节） */
export const MAX_BODY_BYTES = 4096;

/** 单站点域名上限 */
export const MAX_DOMAINS_PER_SITE = 10;

/** 普通用户站点上限；管理员（sub === 1）不限 */
export const MAX_SITES_PER_USER = 5;

/** 列表类接口单次返回上限 */
export const LIST_LIMIT = 50;

/** 站点相关字段长度 */
export const SITE_NAME_MAX = 100;
export const DOMAIN_MAX = 255;

/** 事件字段长度 */
export const EVENT_NAME_MAX = 64;
export const EVENT_PATH_MAX = 512;
export const EVENT_REF_MAX = 255;
export const EVENT_UTM_MAX = 255;
export const VISITOR_HASH_BYTES = 12;

/** 事件表 / 站点表（改表名只改这里） */
export const TABLES = {
  sites: "analytics_sites_v2",
  events: "analytics_events_v2",
};

/** 可见性白名单 */
export const VISIBILITY_VALUES = ["private", "logged_in", "public"];

/** 仅这两个状态的站点允许 listed = 1 */
export const LISTABLE_VISIBILITY = ["logged_in", "public"];

/** 分享配置默认值：只开 creator，避免公开页完全空白 */
export const DEFAULT_SHARE_CONFIG = {
  totals: { pageviews: false, visitors: false, sessions: false },
  series: false,
  realtime: false,
  creator: true,
  breakdowns: {
    path: false,
    referrer: false,
    country: false,
    province: false,
    browser: false,
    os: false,
    device: false,
    event: false,
  },
};

/** owner / admin 视角：所有维度可见 */
export const FULL_SHARE_CONFIG = {
  totals: { pageviews: true, visitors: true, sessions: true },
  series: true,
  realtime: true,
  creator: true,
  breakdowns: {
    path: true,
    referrer: true,
    country: true,
    province: true,
    browser: true,
    os: true,
    device: true,
    event: true,
  },
};

/** 统计范围 */
export const RANGE_IDS = ["today", "7d", "30d", "90d"];
export const DEFAULT_RANGE = "7d";

/** 限流 key 前缀 */
export const LIMIT_KEYS = {
  ingest: "evt",
  stats: "stats",
  realtime: "rt",
  sites: "sites",
};
