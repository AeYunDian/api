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
 * 保留短码：go.undz.cn 上如果以后要挂运维端点，先用这些名字占位。
 * 校验时按**第一段**判断，所以 `admin/foo` 也会被挡住。
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
  "health",
  "test",
  "init",
  "console",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
  "_",
  "next",
]);

/** 把短码转成对外 URL：逐段 encodeURIComponent，保留 `/` 分隔 */
export function buildShortUrl(code) {
  const encoded = String(code)
    .split("/")
    .map((seg) => encodeURIComponent(seg))
    .join("/");
  return `${SHORTLINK_BASE_URL}/${encoded}`;
}
