/**
 * 全局错误码表
 * ============================================================
 * 所有对外返回的 error_code 都从这里取，不要再写裸数字。
 *
 * 用法：
 *   import { ERROR_CODES } from "../../shared/error-codes.js";
 *   return jsonResponse({ error_code: ERROR_CODES.INVALID_EMAIL }, 400, cors);
 *
 *   // 只想要一个数字常量也行（命名导出与表内 key 一一对应）：
 *   import { SERVER_DOWN } from "../../shared/error-codes.js";
 *
 *   // 新代码想统一响应体形状时：
 *   return jsonResponse(errorPayload(ERROR_CODES.INVALID_EMAIL), 400, cors);
 *
 * 【改号规则】
 *   数值是已经对外发布的契约（前端 SDK 会按号做文案映射，见
 *   api-vue/public/lib/account-sdk.js 里的 "error.1018" 等键），
 *   因此：只许新增，不许改号、不许复用已有号表示新语义。
 *
 * 【号段分配】新增时取本段下一个未用号，并同步更新这里的注释
 *   1000-1099  账号 / 鉴权      online.undz.cn
 *   1100-1199  控制台          console.undz.cn
 *   1200-1299  站点统计        mysites.undz.cn
 *   1300-1399  文件服务        files.undz.cn
 *   1400-1499  WS 中继         relay.undz.cn
 *   1500-1599  AI              ai.undz.cn
 *   1900-1999  通用 / 平台级
 *
 * 【已用号】1000-1023、1025、1026、1029、1040-1043
 * 【服务端不要占用】1024、1027-1039 —— 这些号由前端 SDK 内部使用
 *   （1024 取消人机验证；1027/1028 验证码发送；1030-1039 邮件与登录窗口），
 *   服务端一旦下发就会和客户端语义撞车。
 */

// ---------- 账号 / 鉴权（1000-1099） ----------

/** 邮箱格式不合法 */
export const INVALID_EMAIL = 1000;

/** 密码不合规（长度 6-32，字符集 a-zA-Z0-9-_=+@#$%） */
export const WEAK_PASSWORD = 1001;

/**
 * 注册时用户名或邮箱已被占用（一条 SQL 同时查两个字段，所以只有一个号）。
 * 改资料/改邮箱的场景分别用 EMAIL_ALREADY_EXISTS / USERNAME_ALREADY_EXISTS。
 */
export const ACCOUNT_ALREADY_EXISTS = 1002;

/** 用户名或密码错误（登录失败不区分具体是哪一个） */
export const INVALID_CREDENTIALS = 1003;

/**
 * 1004 空缺：历史上未使用，留空不复用。
 */

/** 新密码不合规（改密码时使用，与 1001 区分场景） */
export const WEAK_PASSWORD_NEW = 1005;

/** 旧密码不正确 */
export const OLD_PASSWORD_INCORRECT = 1006;

/** 缺少必填参数（注册表单、人机验证载荷缺失等） */
export const MISSING_PARAMS = 1007;

/** 用户名长度不在 4-20 */
export const INVALID_USERNAME_LENGTH = 1008;

/** 登录缺少用户名/邮箱或密码 */
export const MISSING_LOGIN_FIELDS = 1009;

/** 未登录（没有有效登录态） */
export const UNAUTHORIZED = 1010;

/** 访问令牌无效或已过期 */
export const INVALID_TOKEN = 1011;

/** 改密码缺少 oldPassword / newPassword */
export const MISSING_PASSWORD_FIELDS = 1012;

/** 请求里没有携带任何令牌（/api/ayonline/verify） */
export const MISSING_TOKEN = 1013;

/** 缺少 refresh_token */
export const MISSING_REFRESH_TOKEN = 1014;

/** refresh_token 无效或过期（/api/ayonline/verify 里的 access_token 失效也复用此号） */
export const INVALID_REFRESH_TOKEN = 1015;

/** 用户不存在 */
export const USER_NOT_FOUND = 1016;

/** 账号被封禁（响应里另外带 ban_reason） */
export const ACCOUNT_BANNED = 1017;

/**
 * 服务端异常（500 兜底）。SDK 侧文案为「服务器错误」。
 * SDK 版本过旧的情况已拆到 SDK_VERSION_OUTDATED(1040)。
 */
export const SERVER_DOWN = 1018;

/** X-App-Id 不在 ALLOWED_APP_IDS 白名单里 */
export const INVALID_APP_ID = 1019;

/** GeeTest 服务端校验请求异常（网络/上游错误） */
export const GEETEST_ERROR = 1020;

/** GeeTest 的 captcha_id 不在授权池中 */
export const GEETEST_INVALID_CAPTCHA_ID = 1021;

/** 人机验证二次校验未通过 */
export const GEETEST_VERIFY_FAILED = 1022;

/**
 * 需要人机验证 / 请求频繁。
 * SDK 收到 1023 且带 gt_code 时会自动拉起 GeeTest 弹窗，不要改号。
 */
export const NEED_HUMAN_VERIFICATION = 1023;

/**
 * 1024 由前端 SDK 内部使用（用户取消人机验证），服务端不下发；
 * 登记在这里只为排查时能对上号。
 */
export const HUMAN_VERIFICATION_CANCELLED = 1024;

/** 邮箱验证码无效或已过期 */
export const INVALID_VERIFICATION_CODE = 1025;

/** 邮箱域名不在允许列表（allowedEmailDomains） */
export const UNSUPPORTED_EMAIL_DOMAIN = 1026;

/** 1027、1028 由前端 SDK 使用（验证码发送过于频繁 / 发送失败），服务端不要占用。 */

/** 发送验证码时 action 缺失或不被支持 */
export const INVALID_ACTION = 1029;

// ---- 以下是拆号新增强的号（1002 / 1007 / 1018 语义过载，已按场景拆开） ----

/** 客户端 SDK 版本过旧（X-SDK-VER 低于服务端要求） */
export const SDK_VERSION_OUTDATED = 1040;

/** 邮箱已被其他账号占用（改邮箱 / 改资料时，原 1002 的场景之一） */
export const EMAIL_ALREADY_EXISTS = 1041;

/** 用户名已被占用（改资料时，原 1002 的场景之一） */
export const USERNAME_ALREADY_EXISTS = 1042;

/** 修改邮箱缺少验证码与凭证（原 1007 的场景之一） */
export const EMAIL_CHANGE_CODE_REQUIRED = 1043;

// ---------- 短链接（1100-1199，console.undz.cn） ----------

/** 已达单用户短链数量上限（普通用户 100 条，管理员不限） */
export const LINK_LIMIT_REACHED = 1100;

/** 目标 URL 非法（非 http(s)、超长、指向自身等） */
export const LINK_INVALID_TARGET = 1101;

/** 短码已被占用 */
export const LINK_CODE_TAKEN = 1102;

/** 短码格式非法（字符集 / 长度 / 保留字 / 空路径段） */
export const LINK_INVALID_CODE = 1103;

/** 短链不存在或不可见 */
export const LINK_NOT_FOUND = 1104;

/** 短链已过期（仅管理接口使用；公开访问统一 404） */
export const LINK_EXPIRED = 1105;

/** 需要密码才能访问 */
export const LINK_PASSWORD_REQUIRED = 1106;

/** 密码错误 */
export const LINK_PASSWORD_INCORRECT = 1107;

/** 短链已停用 */
export const LINK_DISABLED = 1108;

/** 无权操作该短链 */
export const LINK_PERMISSION_DENIED = 1109;

/** 触发限流 */
export const LINK_RATE_LIMITED = 1110;

/** 目标指向自身短链（形成循环） */
export const LINK_SELF_REFERENCE = 1111;

/** 过期时间非法 */
export const LINK_INVALID_EXPIRES = 1112;

/** 访问密码不符合要求（4-64 位） */
export const LINK_INVALID_PASSWORD = 1113;

// ------------------------------------------------------------
// 汇总表：给需要整体传递/遍历的场景用（例如统一错误中间件、文档生成）
// ------------------------------------------------------------

export const ERROR_CODES = Object.freeze({
  INVALID_EMAIL,
  WEAK_PASSWORD,
  ACCOUNT_ALREADY_EXISTS,
  INVALID_CREDENTIALS,
  WEAK_PASSWORD_NEW,
  OLD_PASSWORD_INCORRECT,
  MISSING_PARAMS,
  INVALID_USERNAME_LENGTH,
  MISSING_LOGIN_FIELDS,
  UNAUTHORIZED,
  INVALID_TOKEN,
  MISSING_PASSWORD_FIELDS,
  MISSING_TOKEN,
  MISSING_REFRESH_TOKEN,
  INVALID_REFRESH_TOKEN,
  USER_NOT_FOUND,
  ACCOUNT_BANNED,
  SERVER_DOWN,
  INVALID_APP_ID,
  GEETEST_ERROR,
  GEETEST_INVALID_CAPTCHA_ID,
  GEETEST_VERIFY_FAILED,
  NEED_HUMAN_VERIFICATION,
  HUMAN_VERIFICATION_CANCELLED,
  INVALID_VERIFICATION_CODE,
  UNSUPPORTED_EMAIL_DOMAIN,
  INVALID_ACTION,
  SDK_VERSION_OUTDATED,
  EMAIL_ALREADY_EXISTS,
  USERNAME_ALREADY_EXISTS,
  EMAIL_CHANGE_CODE_REQUIRED,
  LINK_LIMIT_REACHED,
  LINK_INVALID_TARGET,
  LINK_CODE_TAKEN,
  LINK_INVALID_CODE,
  LINK_NOT_FOUND,
  LINK_EXPIRED,
  LINK_PASSWORD_REQUIRED,
  LINK_PASSWORD_INCORRECT,
  LINK_DISABLED,
  LINK_PERMISSION_DENIED,
  LINK_RATE_LIMITED,
  LINK_SELF_REFERENCE,
  LINK_INVALID_EXPIRES,
  LINK_INVALID_PASSWORD,
});

/** 默认文案：新增号时务必一起补，前端没做映射时至少能显示一句人话 */
export const ERROR_MESSAGES = Object.freeze({
  [INVALID_EMAIL]: "Invalid email format",
  [WEAK_PASSWORD]: "Password does not meet the requirements",
  [ACCOUNT_ALREADY_EXISTS]: "Email or username already exists",
  [INVALID_CREDENTIALS]: "Invalid credentials",
  [WEAK_PASSWORD_NEW]: "New password does not meet the requirements",
  [OLD_PASSWORD_INCORRECT]: "Old password incorrect",
  [MISSING_PARAMS]: "Missing required fields",
  [INVALID_USERNAME_LENGTH]: "Username must be between 4 and 20 characters",
  [MISSING_LOGIN_FIELDS]: "Username/email and password required",
  [UNAUTHORIZED]: "Unauthorized",
  [INVALID_TOKEN]: "Invalid or expired token",
  [MISSING_PASSWORD_FIELDS]: "Missing oldPassword or newPassword",
  [MISSING_TOKEN]: "No token",
  [MISSING_REFRESH_TOKEN]: "Refresh token missing",
  [INVALID_REFRESH_TOKEN]: "Invalid or expired refresh token",
  [USER_NOT_FOUND]: "User not found",
  [ACCOUNT_BANNED]: "Account banned",
  [SERVER_DOWN]: "Internal Server Error",
  [INVALID_APP_ID]: "appId is invalid",
  [GEETEST_ERROR]: "GeeTest Server Error",
  [GEETEST_INVALID_CAPTCHA_ID]: "captcha_id is not in the allowed pool",
  [GEETEST_VERIFY_FAILED]: "Verification failed",
  [NEED_HUMAN_VERIFICATION]: "请求频繁，请稍后再试",
  [HUMAN_VERIFICATION_CANCELLED]: "User cancelled the verification",
  [INVALID_VERIFICATION_CODE]: "Invalid or expired verification code",
  [UNSUPPORTED_EMAIL_DOMAIN]: "Unsupported email domain",
  [INVALID_ACTION]: "Invalid action",
  [SDK_VERSION_OUTDATED]: "Client SDK version is outdated, please upgrade",
  [EMAIL_ALREADY_EXISTS]: "Email already exists",
  [USERNAME_ALREADY_EXISTS]: "Username already exists",
  [EMAIL_CHANGE_CODE_REQUIRED]: "Email change requires verification code and token",
  [LINK_LIMIT_REACHED]: "Short link limit reached",
  [LINK_INVALID_TARGET]: "Invalid target URL",
  [LINK_CODE_TAKEN]: "Short code already taken",
  [LINK_INVALID_CODE]: "Invalid short code",
  [LINK_NOT_FOUND]: "Short link not found",
  [LINK_EXPIRED]: "Short link has expired",
  [LINK_PASSWORD_REQUIRED]: "Password required",
  [LINK_PASSWORD_INCORRECT]: "Incorrect password",
  [LINK_DISABLED]: "Short link is disabled",
  [LINK_PERMISSION_DENIED]: "Permission denied",
  [LINK_RATE_LIMITED]: "Too many requests, please try again later",
  [LINK_SELF_REFERENCE]: "Target must not point to the short link service itself",
  [LINK_INVALID_EXPIRES]: "Invalid expiration time",
  [LINK_INVALID_PASSWORD]: "Password must be 4-64 characters",
});

/** 每个号建议搭配的 HTTP 状态码 */
export const ERROR_STATUS = Object.freeze({
  1000: 400, 1001: 400, 1002: 409, 1003: 401, 1005: 400, 1006: 401,
  1007: 400, 1008: 400, 1009: 400, 1010: 401, 1011: 401, 1012: 400,
  1013: 401, 1014: 400, 1015: 401, 1016: 404, 1017: 403, 1018: 500,
  1019: 403, 1020: 500, 1021: 400, 1022: 400, 1023: 429, 1024: 400,
  1025: 400, 1026: 400, 1029: 400,
  // 1040 暂维持 500：SDK 版本闸门原来就返回 500，改状态码会影响既有客户端。
  1040: 500, 1041: 409, 1042: 409, 1043: 400,
  // 短链接（1100-1199）
  1100: 403, 1101: 400, 1102: 409, 1103: 400, 1104: 404, 1105: 410,
  1106: 401, 1107: 403, 1108: 403, 1109: 403, 1110: 429, 1111: 400,
  1112: 400, 1113: 400,
});

/**
 * 生成统一响应体：{ error_code, message }
 * 需要保持旧响应形状时，用 overrides 覆盖字段名。
 *
 * @param {number} code ERROR_CODES 里的号
 * @param {Record<string, unknown>} [overrides] 追加/覆盖的字段
 */
export function errorPayload(code, overrides = {}) {
  const message = ERROR_MESSAGES[code] || "Unknown error";
  return { error_code: code, error: message, ...overrides };
}

/** 取某个号建议的 HTTP 状态码，未知号一律 500 */
export function httpStatusFor(code) {
  return ERROR_STATUS[code] || 500;
}

/** 是否是我们登记过的号（排查线上异常时用） */
export function isKnownErrorCode(code) {
  return Object.prototype.hasOwnProperty.call(ERROR_MESSAGES, code);
}

/** 反查：数字 → 常量名（日志里打印 ERROR_CODES.FOO 更好读） */
export const ERROR_NAMES = Object.freeze(
  Object.fromEntries(
    Object.entries(ERROR_CODES).map(([name, code]) => [code, name]),
  ),
);
