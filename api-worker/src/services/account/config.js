// config.js —— 由 ayOnline.js 拆分而来（逐行搬运，未改逻辑）
// 账号中心的全部静态配置：TTL、PBKDF2 参数、OAuth 常量、白名单。
// 纯数据，无副作用；改这里等于改线上行为，改完记得同步前端 env。

const SDK_VER = "2.0.8";
const JWT_ALG = "HS256";
const ACCESS_TOKEN_EXPIRES_IN = "10m"; // 访问令牌有效期
const OAUTH_TOKEN_EXPIRES_IN = 300; // Oauth token 有效期 5m
const REFRESH_TOKEN_TTL = 60 * 60 * 24 * 30; // 刷新令牌有效期（秒），30天
const OAUTH_REFRESH_TOKEN_TTL = 60 * 60 * 24 * 15; // OAuth客户端刷新令牌有效期（秒），15天
const PBKDF2_ITERATIONS = 100000;
const PBKDF2_HASH = "SHA-256";
const SALT_LENGTH = 16; // 字节
const DEFAULT_OAUTH_CLIENT_SCOPE = "openid profile email";
const MIN_PASSWORD_LENGTH = 6;
const MAX_PASSWORD_LENGTH = 32;
const MIN_USERNAME_LENGTH = 4;
const MAX_USERNAME_LENGTH = 20;
const VERIFY_CODE_EXPDATA = 300;
export const TAG_LOGGEDIN = "logged_in";
export const TAG_NOT_LOGGEDIN = "not_logged_in";
export const TAG_BANNED = "banned";
const YZHYZXY_AUTH_URL = "https://yzhyzxy.cn/oauth/authorize";
const YZHYZXY_TOKEN_URL = "https://yzhyzxy.cn/oauth/token";
const YZHYZXY_USERINFO_URL = "https://yzhyzxy.cn/oauth/userinfo";
const YZHYZXY_REVOKE_URL = "https://yzhyzxy.cn/api/oauth/revoke";
const YZHYZXY_REDIRECT_URI = "https://online.undz.cn/api/oauth/callback";
const YZHYZXY_SCOPE = "openid profile email";
const DEFAULT_USER_DESC = "这片星空，只有流行划过……";
const DEFAULT_USER_AVATAR = "https://online.undz.cn/default-avatar.svg";
const KV_PREFIX = {
  REFRESH: "refresh:",
  TOKEN: "token:",
  USER_TOKENS: "user_refresh_tokens:",
  OAUTH_PKCE: "oauth_pkce:",
};

// 平台名称映射
const providerMap = {
  yzhyzxy: { name: "Yzhyzxy", icon: "https://online.undz.cn/yzhyzxy.svg" },
  github: { name: "GitHub", icon: "https://online.undz.cn/github.svg" },
  google: { name: "Google", icon: "https://online.undz.cn/google.svg" },
};
const allowedEmailDomains = [
  "aliyun.com", // 虽然国内已不开放个人注册业务，但还是支持
  "qq.com",
  "163.com",
  "126.com",
  "foxmail.com",
  "sina.com",
  "sina.cn",
  "sohu.com",
  "139.com",
  "189.cn",
  "21cn.com",
  "tom.com",
  "yeah.net",
  "263.net",
  "vip.qq.com",
  "vip.163.com",
  "vip.sina.com",
  "vip.sina.cn",
  "gmail.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "msn.com",
  "yahoo.com",
  "yahoo.co.jp",
  "yahoo.com.hk",
  "yahoo.com.tw",
  "icloud.com",
  "me.com",
  "mac.com",
  "aol.com",
  "protonmail.com",
  "mail.com",
  "gmx.com",
  "zoho.com",
  "yandex.com",
  "rambler.ru",
  "undz.cn",
  "io.hb.cn",
  "2x.nz",
  "edu.cn",
  "gov.cn",
  "yzhyzxy.cn",
];
// 允许跨域的子服务域名（白名单）
const ALLOWED_ORIGINS = [
  "https://api.undz.cn",
  "https://chat.undz.cn",
  "https://editor.undz.cn",
  "https://cdn.undz.cn",
  "https://online.undz.cn",
  "https://online-dev.undz.cn",
  "https://console-dev.undz.cn",
  "https://c.undz.cn",
  "https://console.undz.cn",
  "https://mysites.undz.cn",
  "https://mysites-dev.undz.cn",
  "https://undz.cn",
  "https://io.hb.cn",
  "https://www.undz.cn",
  "https://ayd2.eu.cc",
  "https://main.net2.eu.cc",
  "https://www.io.hb.cn",
  "https://main.net3.eu.cc",
  "https://main.exm2.eu.cc",
  "https://main.zyy2.eu.cc",
  "https://test.undz.cn",
  "https://zyy.undz.cn",
  "https://zyy.io.hb.cn",
  "https://zyyos.io.hb.cn",
  "https://z.net2.eu.cc",
  "https://zyyos.undz.cn",
  "https://z.ayd2.eu.cc",
  "https://z.net3.eu.cc",
  "https://zyy2.eu.cc",
  "https://zyy.exm2.eu.cc",
  "https://zyyos.exm2.eu.cc",
];

export { SDK_VER, JWT_ALG, ACCESS_TOKEN_EXPIRES_IN, OAUTH_TOKEN_EXPIRES_IN, REFRESH_TOKEN_TTL, OAUTH_REFRESH_TOKEN_TTL, PBKDF2_ITERATIONS, PBKDF2_HASH, SALT_LENGTH, DEFAULT_OAUTH_CLIENT_SCOPE, MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH, MIN_USERNAME_LENGTH, MAX_USERNAME_LENGTH, VERIFY_CODE_EXPDATA, YZHYZXY_AUTH_URL, YZHYZXY_TOKEN_URL, YZHYZXY_USERINFO_URL, YZHYZXY_REVOKE_URL, YZHYZXY_REDIRECT_URI, YZHYZXY_SCOPE, DEFAULT_USER_DESC, DEFAULT_USER_AVATAR, KV_PREFIX, providerMap, allowedEmailDomains, ALLOWED_ORIGINS };
