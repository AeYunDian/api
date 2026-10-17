// services/console/config.js
// 短链接服务的全部静态配置。改这里 = 改线上行为。
// 纯数据 + 纯函数，无副作用。

/** 普通用户最多可持有的短链数；管理员（sub === 1）不受限 */
export const MAX_LINKS_PER_USER = 100;

/** 短码长度：普通用户 3–250，管理员 1–250（均按解码后的原始字符数计） */
export const CODE_LEN_MIN_USER = 3;
export const CODE_LEN_MIN_ADMIN = 1;
export const CODE_LEN_MAX = 250;

/**
 * 短码字符集：
 *   普通用户  a-z 1-9 /
 *   管理员    额外允许 A-Z @ # $ % * ( )
 *
 * 注意 `#` 与 `%` 在 URL 路径里必须转义：`#` → `%23`、`%` → `%25`。
 * 对外展示的 short_url 由 buildShortUrl() 按路径段编码，直接复制即可访问。
 */
export const CODE_CHARS_USER = /^[a-z1-9/]+$/;
export const CODE_CHARS_ADMIN = /^[a-zA-Z1-9/@#$%*()]+$/;

/** 自动生成短码时使用的字符集（不含 0/O/1/l/I 等易混字符） */
export const CODE_ALPHABET = "abcdefghijklmnopqrstuvwxyz123456789";
export const CODE_LENGTH = 7;

/** 对外短链根地址（不要带结尾斜杠） */
export const SHORTLINK_BASE_URL = "https://go.undz.cn";

/** 密码保护 */
export const PASSWORD_MIN_LENGTH = 4;
export const PASSWORD_MAX_LENGTH = 64;
export const PASSWORD_COOKIE_TTL = 600; // 秒：输入正确后 10 分钟内免密
export const PASSWORD_MAX_ATTEMPTS = 10;
export const PASSWORD_WINDOW_MS = 10 * 60 * 1000;

/** 目标 URL */
export const TARGET_MAX_LEN = 2048;

/** 列表分页 */
export const LINK_PAGE_DEFAULT = 20;
export const LINK_PAGE_MAX = 100;

/**
 * 系统路径：go.undz.cn 实际提供的端点，任何人都不能拿来当短码。
 * 目前只有 /health。
 */
export const SYSTEM_CODES = new Set(["health"]);

/**
 * 保留名称：不占用真实路由，但为了避免和未来的运维/静态路径撞车，
 * 只允许管理员创建；普通用户使用会返回 LINK_INVALID_CODE。
 * 按**完整短码**匹配，所以 `test/showInfos` 不受这里的 `test` 影响。
 */
export const RESERVED_CODES = new Set([
  "api",
  "s",
  "admin",
  "static",
  "assets",
  "files",
  "login",
  "logout",
  "oauth",
  "callback",
  "test",
  "init",
  "console",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
  "_",
  "next",
]);

/**
 * 屏蔽词：非管理员创建的短码只要**包含**其中任意一段就拒绝（不区分大小写）。
 * 管理员不受限制。例如配置 "test" 后，普通用户不能创建 `test`、`test/showInfos`、
 * `mytest`，但管理员可以。改完需要重新部署。
 */
export const BLOCKED_CODE_KEYWORDS = ["test", "login", "logout"];

/** 把短码转成对外 URL：逐段 encodeURIComponent，保留 `/` 分隔 */
export function buildShortUrl(code) {
  const encoded = String(code)
    .split("/")
    .map((seg) => encodeURIComponent(seg))
    .join("/");
  return `${SHORTLINK_BASE_URL}/${encoded}`;
}
