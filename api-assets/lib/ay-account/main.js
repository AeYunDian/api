/**
 * @file AyAccountSDK — AyAccount login / registration surface
 * @version 3.2.1
 * @license MIT
 *
 * Public API is compatible with account-sdk.js 2.2.0:
 *   window.AyAccount, window.createAyAccount
 *   new AyAccount({ appId, i18n, theme? })
 *   login(config?), register(config?), logout(), testServer(), verify(),
 *   refresh(), changePassword(old, new), close(), updateI18n(), changeLanguage()
 *
 * Extra optional config (all backwards compatible):
 *   theme: "auto" | "light" | "dark"   (default "auto")
 *   lang: string                        (per-open language override)
 *   autoClose: boolean                  (default true)
 *   zIndex: number                      (fullscreen iframe stack)
 *   height: string                      (inline container height)
 *
 * Toast is integrated into this SDK (shadow DOM, no global AyShowResult).
 */
"use strict";

(function () {
  if (typeof window === "undefined") {
    throw new Error("AyAccountSDK requires browser environment");
  }

  const PRODUCE = false;

  const VERSION = "3.2.1";
  const ONLINE_BASE = "https://online.undz.cn";
  const API_BASE = ONLINE_BASE;
  const API_ORIGIN = new URL(API_BASE).origin;

  const SCRIPT_URL = (() => {
    try {
      const src = document.currentScript && document.currentScript.src;
      return src
        ? new URL(src, document.baseURI)
        : new URL("/lib/ay-account/main.js", document.baseURI);
    } catch {
      return new URL("/lib/ay-account/main.js", document.baseURI);
    }
  })();

  // PRODUCE=true: API + static assets all come from online.undz.cn.
  // PRODUCE=false: API still targets online.undz.cn, but static assets
  // (iframe page, Geetest, toast icons) are resolved relative to this script.
  const STATIC_ORIGIN = PRODUCE ? ONLINE_BASE : SCRIPT_URL.origin;
  const MODAL_URL = PRODUCE
    ? `${ONLINE_BASE}/lib/ay-account/login.html`
    : new URL("login.html", SCRIPT_URL).href;
  const MODAL_ORIGIN = new URL(MODAL_URL).origin;
  const GT4_URL = new URL("/lib/gt4.js", STATIC_ORIGIN).href;

  const URLPATH = {
    BASE: API_BASE,
    API: {
      REGISTER: "/api/ayonline/register",
      REGISTER_START: "/api/ayonline/register/verification/start",
      REGISTER_QUERY: "/api/ayonline/register/verification/query",
      LOGIN: "/api/ayonline/login",
      LOGOUT: "/api/ayonline/logout",
      TEST: "/api/ayonline/test",
      VERIFY: "/api/ayonline/verify",
      REFRESH: "/api/ayonline/refresh",
      CHANGEPASSWORD: "/api/ayonline/change-password",
      SENDMAILCODE: "/api/ayonline/send-verification",
    },
    MODALPAGE: {
      PAGE: MODAL_URL,
      LOGIN_YZH_OAUTH: "/api/auth/yzhyzxy/start?mode=login",
      LOGIN_GITHUB_OAUTH: "/api/auth/github/start?mode=login",
    },
    LIBRARY: {
      GT4: GT4_URL,
    },
  };

  const DEFAULT_WINDOW_CONFIG = {
    hideOauthClient: false,
    hideClose: false,
    hideFaq: false,
    hideSwitch: false,
    only: null,
    theme: "auto",
    autoClose: true,
    scrim: true,
    loadingToast: null,
  };
  const MAX_CUSTOM_STYLE_LENGTH = 20000;

  const allowedEmailDomains = [
    "aliyun.com",
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

  const BUILTIN_TRANSLATIONS = {
    "zh-cn": {
      "title.login": "登录",
      "nav.login": "&nbsp;登录&nbsp;",
      "nav.reg": "&nbsp;注册&nbsp;",
      "nav.login.plain": "登录",
      "nav.reg.plain": "注册",
      "nav.login.bartf": "94.6px",
      "nav.reg.bartf": "213.5px",
      "link.faq": "https://online.undz.cn/login/faq/zh-cn",
      "reg.username": "用户名",
      "reg.email": "邮箱",
      "reg.emailCode": "验证码",
      "reg.password": "密码",
      "reg.passwordConfirm": "请再次输入密码",
      "agreement.prefix": "我已阅读并同意",
      privacy_policy: "《隐私政策》",
      cookie_policy: "《Cookie 政策》",
      terms: "《服务条款》",
      "btn.login.oauth.yzhyzxy": "使用 Yzhyzxy 账号登入",
      "btn.login.oauth.github": "使用 GitHub 账号登入",
      "privacy_policy.link": "https://go.undz.cn/privacy/zh-cn",
      "terms.link": "https://go.undz.cn/terms/zh-cn",
      "btn.reg": "注册",
      "login.usernameoremail": "用户名/邮箱",
      "login.password": "密码",
      "btn.login": "登录",
      "btn.haveQuestion": "常见问题",
      loading: "加载中...",
      "agreement.and1": "和",
      "error.1000": "邮箱格式无效",
      "error.1001": "密码长度须在6~32之间，仅允许 a-z A-Z 0-9 -_=+@#$%",
      "error.1002": "用户名或邮箱已存在",
      "error.1003": "用户名/邮箱或密码错误",
      "error.1005":
        "新密码格式不合法（长度须在6~32之间，仅允许 a-z A-Z 0-9 -_=+@#$%）",
      "error.1006": "旧密码错误",
      "error.1007": "缺少必填字段",
      "error.1008": "用户名必须在4~20之间",
      "error.1009": "请提供用户名/邮箱和密码",
      "error.1010": "未授权，请先登录",
      "error.1011": "令牌无效或已过期",
      "error.1012": "缺少旧密码或新密码",
      "error.1013": "未提供令牌",
      "error.1014": "刷新令牌缺失",
      "error.1015": "刷新令牌无效或已过期",
      "error.1016": "用户不存在",
      "error.1017": "账号已被封禁",
      "error.1018": "服务器错误",
      "error.1019": "appId 无效",
      "error.1020": "验证码校验失败",
      "error.1021": "验证ID无效",
      "error.1022": "验证码二次校验失败",
      "error.1023": "需要通过人机验证",
      "error.1024": "您已取消验证",
      "error.1025": "验证码错误",
      "error.1026": "不支持的邮箱域名",
      "error.1027": "发送验证码过于频繁",
      "error.1028": "请求发送时失败",
      "error.1029": "请填写邮箱",
      "error.1030": "服务器错误：无可用发送途径",
      "error.1031": "邮件服务器不可用",
      "error.1032": "发送邮件失败",
      "error.1033": "发件服务器出现内部错误",
      "error.1034": "获取授权链接失败",
      "error.1035": "弹窗被拦截，请允许弹窗跳转",
      "error.1036": "登入失败",
      "error.1037": "未知错误",
      "error.1038": "登陆视窗已关闭",
      "error.1039": "登录超时，请重试",
      "error.1044": "邮件验证服务暂不可用，请稍后再试",
      "error.1045": "验证方式不匹配，请重新注册",
      "error.1046": "验证已过期，请重新获取",
      "error.1047": "请先完成邮箱验证",
      "common.send_email_code_success": "发送验证码成功",
      "common.send_email_code_failure": "发送验证码失败",
      "error.modal_already_open": "登录窗口已打开，请勿重复操作",
      "error.aytoast_not_found": "AyToast 组件未成功加载，请您重载",
      "common.register_success": "注册成功",
      "common.login_success": "登录成功",
      "common.login_failure": "登录失败",
      "common.register_failure": "注册失败",
      "common.network_error": "网络请求失败，请检查网络",
      "common.unknown_error": "未知错误，请稍后重试",
      "common.reg_email_code_length": "邮箱验证码长度错误",
      "common.enter_username_or_email": "请输入用户名/邮箱",
      "common.please_read_and_agree": "请您阅读并同意协议",
      "common.password_min_length": "密码至少6位",
      "common.password_max_length": "密码最多32位",
      "common.username_min_length": "用户名至少4位",
      "common.username_max_length": "用户名最多20位",
      "common.enter_password": "请输入密码",
      "common.invalid_email_format": "邮箱格式不正确",
      "common.enter_username": "请输入用户名",
      "common.enter_email": "请输入邮箱",
      "common.enter_email_code": "请输入邮箱验证码",
      "common.password_mismatch": "密码输入不一致",
      "common.no_account_register": "没有账号？去注册",
      "common.have_account_login": "已有账号？去登录",
      "common.success": "操作成功",
      "common.complete_verification": "请完成验证",
      "common.please_wait": "请稍后...",
      "common.close": "关闭",
      "common.back": "返回",
      "common.send_code": "获取验证码",
      "common.copy": "复制",
      "common.copied": "已复制",
      "common.copy_failed": "复制失败",
      "verify.email.title": "验证邮箱",
      "verify.email.sent": "验证码已发送至",
      "verify.submit": "完成注册",
      "verify.back": "返回修改",
      "verify.reverse.title": "验证邮箱",
      "verify.reverse.desc":
        "请用注册邮箱向下面地址发送一封邮件，正文填写验证码（主题随意）。",
      "verify.address": "收件地址",
      "verify.code": "邮件正文",
      "verify.mailto": "使用邮件客户端发送",
      "verify.waiting": "等待邮件…",
      "verify.checking": "正在检查…",
      "verify.verified": "验证通过，正在注册…",
      "verify.expired": "验证已过期，请返回修改",
      "verify.expires": "有效期剩余",
      "verify.emailMismatch": "邮箱与本次注册不一致",
      "verify.actionMismatch": "验证任务类型不匹配",
      "common.please_get_code": "请先获取邮箱验证码",
      "common.oauth_opening": "正在打开授权窗口…",
      "subtitle.account": "使用你的 AyAccount",
      "register.subtitle": "创建你的 AyAccount",
      "oauth.expand": "展开第三方登录",
      "oauth.title": "第三方账号登录",
      "oauth.description": "使用第三方账号登录或注册 AyAccount。",
      "oauth.back": "返回账号登录",
      "oauth.yzhyzxy.name": "Yzhyzxy",
      "oauth.yzhyzxy.hint": "使用 Yzhyzxy 账号继续",
      "oauth.github.name": "GitHub",
      "oauth.github.hint": "使用 GitHub 账号继续",
      "login.success": "登录成功",
      "logout.success": "已登出",
      "register.success": "注册成功",
      "refresh.success": "令牌已刷新",
      "password.change.success": "密码已修改，请重新登录",
    },
    "en-us": {
      "title.login": "Login",
      "nav.login": "Login",
      "nav.reg": "Register",
      "nav.login.plain": "Login",
      "nav.reg.plain": "Register",
      "nav.login.bartf": "85px",
      "nav.reg.bartf": "215px",
      "reg.username": "Username",
      "reg.email": "Email",
      "reg.password": "Password",
      "reg.passwordConfirm": "Re-enter password",
      "agreement.prefix": "I have read and agree to the",
      privacy_policy: "“Privacy Policy”",
      cookie_policy: "“Cookie Policy”",
      terms: "“Terms of Service”",
      "btn.reg": "Register",
      "login.usernameoremail": "Username/Email",
      "login.password": "Password",
      "btn.login": "Login",
      "btn.haveQuestion": "FAQ",
      loading: "Loading...",
      "btn.login.oauth.yzhyzxy": "Login with Yzhyzxy account",
      "btn.login.oauth.github": "Login with GitHub",
      "agreement.and1": "and",
      "link.faq": "https://online.undz.cn/login/faq/en-us",
      "privacy_policy.link": "https://go.undz.cn/privacy/en-us",
      "terms.link": "https://go.undz.cn/terms/en-us",
      "error.1000": "Invalid email format",
      "error.1001":
        "Password must be between 4 and 20 characters and contain only a-z A-Z 0-9 -_=+@#$%",
      "error.1002": "Username or email already exists",
      "error.1003": "Invalid credentials",
      "error.1005":
        "New password must be between 4 and 20 characters and contain only a-z A-Z 0-9 -_=+@#$%",
      "error.1006": "Old password is incorrect",
      "error.1007": "Missing required fields",
      "error.1008": "Username must be between 4 and 20 characters",
      "error.1009": "Username/email and password are required",
      "error.1010": "Unauthorized, please login",
      "error.1011": "Invalid or expired token",
      "error.1012": "Missing oldPassword or newPassword",
      "error.1013": "No token provided",
      "error.1014": "Refresh token missing",
      "error.1015": "Invalid or expired refresh token",
      "error.1016": "User not found",
      "error.1017": "Account banned",
      "error.1018": "Server Error",
      "error.1019": "appId is invalid",
      "error.1020": "Verification code check failed",
      "error.1021": "Invalid verification ID",
      "error.1022": "Verification code check failed again",
      "error.1023": "You need to pass a human verification",
      "error.1024": "Verification cancelled, please retry",
      "error.1025": "Invalid verification code",
      "error.1026": "Email domain not supported",
      "error.1027": "Verification code sent too frequently",
      "error.1028": "Failed to send request",
      "error.1029": "Please enter your email",
      "error.1030": "Server error: no available sending method",
      "error.1031": "Email server unavailable",
      "error.1032": "Failed to send email",
      "error.1033": "Internal error in the sending server",
      "error.1034": "Failed to obtain authorization link.",
      "error.1035": "Popup blocked. Please allow popups.",
      "error.1036": "Login failed.",
      "error.1037": "Unknown error.",
      "error.1038": "Login window has been closed.",
      "error.1039": "Login timed out. Please try again.",
      "error.1044": "Email verification service is temporarily unavailable.",
      "error.1045": "Verification method mismatch. Please register again.",
      "error.1046": "Verification has expired. Please request a new one.",
      "error.1047": "Please complete email verification first.",
      "error.modal_already_open":
        "Login modal is already open, please do not repeat",
      "error.aytoast_not_found":
        "The AyToast component failed to load, please reload.",
      "common.network_error":
        "Network request failed, please check your connection",
      "common.unknown_error": "Unknown error, please try again later",
      "common.success": "Operation successful",
      "common.complete_verification": "Please complete the verification",
      "common.register_success": "Registration successful",
      "common.login_success": "Login successful",
      "common.login_failure": "Login failed",
      "common.register_failure": "Registration failed",
      "common.enter_username_or_email": "Please enter username/email",
      "common.please_read_and_agree": "Please read and agree to the terms",
      "common.password_min_length": "Password must be at least 6 characters",
      "common.password_max_length": "Password must be at most 32 characters",
      "common.username_min_length": "Username must be at least 4 characters",
      "common.username_max_length": "Username must be at most 20 characters",
      "common.enter_password": "Please enter your password",
      "common.no_account_register": "No account? Sign up",
      "common.have_account_login": "Already have an account? Log in",
      "common.invalid_email_format": "Invalid email format",
      "common.enter_username": "Please enter username",
      "common.enter_email": "Please enter email",
      "common.enter_email_code": "Please enter the email verification code",
      "common.password_mismatch": "Passwords do not match",
      "common.please_wait": "Please wait...",
      "common.close": "Close",
      "common.back": "Back",
      "common.send_code": "Send code",
      "common.copy": "Copy",
      "common.copied": "Copied",
      "common.copy_failed": "Copy failed",
      "verify.email.title": "Verify email",
      "verify.email.sent": "Verification code sent to",
      "verify.submit": "Complete registration",
      "verify.back": "Back",
      "verify.reverse.title": "Verify email",
      "verify.reverse.desc":
        "Send an email from your registered address to the address below. Put the code in the body (subject can be anything).",
      "verify.address": "Send to",
      "verify.code": "Email body",
      "verify.mailto": "Open mail app",
      "verify.waiting": "Waiting for email…",
      "verify.checking": "Checking…",
      "verify.verified": "Verified. Registering…",
      "verify.expired": "Verification expired. Please go back.",
      "verify.expires": "Expires in",
      "verify.emailMismatch": "Email does not match this registration",
      "verify.actionMismatch": "Verification action mismatch",
      "common.please_get_code": "Please request an email code first",
      "common.oauth_opening": "Opening authorization window…",
      "subtitle.account": "Use your AyAccount",
      "register.subtitle": "Create your AyAccount",
      "oauth.expand": "More sign-in options",
      "oauth.title": "Sign in with a provider",
      "oauth.description":
        "Use a third-party account to sign in to or create an AyAccount.",
      "oauth.back": "Back to account sign-in",
      "oauth.yzhyzxy.name": "Yzhyzxy",
      "oauth.yzhyzxy.hint": "Continue with your Yzhyzxy account",
      "oauth.github.name": "GitHub",
      "oauth.github.hint": "Continue with your GitHub account",
      "login.success": "Login successful",
      "logout.success": "Logged out",
      "register.success": "Registration successful",
      "refresh.success": "Token refreshed",
      "password.change.success": "Password changed, please login again",
      "reg.emailCode": "Verification Code",
      "common.send_email_code_success": "Verification code sent successfully",
      "common.send_email_code_failure": "Failed to send verification code",
      "common.reg_email_code_length": "Verification code length is invalid",
    },
    "zh-hk": {
      "title.login": "登錄",
      "nav.login": "&nbsp;登錄&nbsp;",
      "nav.reg": "&nbsp;註冊&nbsp;",
      "nav.login.plain": "登錄",
      "nav.reg.plain": "註冊",
      "nav.login.bartf": "94.6px",
      "nav.reg.bartf": "213.5px",
      "reg.username": "用戶名",
      "reg.email": "電郵",
      "reg.password": "密碼",
      "reg.passwordConfirm": "請再次輸入密碼",
      "agreement.prefix": "我已閱讀並同意",
      privacy_policy: "《隱私政策》",
      cookie_policy: "《Cookie 政策》",
      terms: "《服務條款》",
      "link.faq": "https://online.undz.cn/login/faq/zh-hk",
      "privacy_policy.link": "https://go.undz.cn/privacy/zh-hk",
      "terms.link": "https://go.undz.cn/terms/zh-hk",
      "btn.reg": "註冊",
      "login.usernameoremail": "用戶名/電郵",
      "login.password": "密碼",
      "btn.login": "登錄",
      "btn.login.oauth.yzhyzxy": "使用 Yzhyzxy 賬號登錄",
      "btn.login.oauth.github": "使用 GitHub 賬號登錄",
      "btn.haveQuestion": "常見問題",
      loading: "載入中...",
      "agreement.and1": "和",
      "error.1000": "電郵格式無效",
      "error.1001": "密碼長度在6~32之间，僅允許 a-z A-Z 0-9 -_=+@#$%",
      "error.1002": "用戶名或電郵已存在",
      "error.1003": "用戶名/電郵或密碼錯誤",
      "error.1005":
        "新密碼格式不合法（在6~32之间，僅允許 a-z A-Z 0-9 -_=+@#$%）",
      "error.1006": "舊密碼錯誤",
      "error.1007": "缺少必填欄位",
      "error.1008": "用戶名长度需要在4~20之间",
      "error.1009": "請提供用戶名/電郵和密碼",
      "error.1010": "未授權，請先登錄",
      "error.1011": "令牌無效或已過期",
      "error.1012": "缺少舊密碼或新密碼",
      "error.1013": "未提供令牌",
      "error.1014": "刷新令牌缺失",
      "error.1015": "刷新令牌無效或已過期",
      "error.1016": "用戶不存在",
      "error.1017": "賬號已被封禁",
      "error.1018": "伺服器錯誤",
      "error.1019": "appId 無效",
      "error.1020": "驗證碼驗證失敗",
      "error.1021": "驗證ID無效",
      "error.1022": "驗證碼第二次驗證失敗",
      "error.1023": "需要通過人機驗證",
      "error.1024": "驗證已取消，請重試",
      "error.1025": "驗證碼錯誤",
      "error.1026": "不支援的電郵域名",
      "error.1027": "發送驗證碼過頻繁",
      "error.1028": "發送時請求失敗",
      "error.1029": "請輸入您的電子郵件地址",
      "error.1030": "伺服器錯誤:無可用傳送路徑",
      "error.1031": "郵件伺服器無法使用",
      "error.1032": "Failed to send email",
      "error.1033": "發送伺服器內部錯誤",
      "error.1034": "獲取授權連結失敗",
      "error.1035": "彈窗被攔截，請允許彈窗跳轉",
      "error.1036": "登入失敗",
      "error.1037": "未知錯誤",
      "error.1038": "登入視窗已關閉",
      "error.1039": "登入超時，請重試",
      "error.1044": "郵件驗證服務暫不可用，請稍後再試",
      "error.1045": "驗證方式不匹配，請重新註冊",
      "error.1046": "驗證已過期，請重新獲取",
      "error.1047": "請先完成郵箱驗證",
      "error.modal_already_open": "登錄視窗已打開，請勿重複操作",
      "error.aytoast_not_found": "AyToast 組件未成功加載，請你重載",
      "common.network_error": "網絡請求失敗，請檢查網絡",
      "common.unknown_error": "未知錯誤，請稍後重試",
      "common.complete_verification": "麻煩完成驗證",
      "common.please_wait": "請稍後...",
      "common.success": "操作成功",
      "common.register_success": "註冊成功",
      "common.login_success": "登錄成功",
      "common.enter_username_or_email": "請輸入用戶名/電郵",
      "common.please_read_and_agree": "請您閱讀並同意協議",
      "common.password_min_length": "密碼至少6位",
      "common.password_max_length": "密碼最多6位",
      "common.username_min_length": "用戶名至少4位",
      "common.username_max_length": "用戶名最多20位",
      "common.enter_password": "請輸入密碼",
      "common.invalid_email_format": "電郵格式不正確",
      "common.enter_username": "請輸入用戶名",
      "common.enter_email": "請輸入電郵",
      "common.enter_email_code": "請輸入郵箱驗證碼",
      "common.password_mismatch": "密碼輸入不一致",
      "common.no_account_register": "沒有賬號？去註冊",
      "common.have_account_login": "已有賬號？去登錄",
      "common.login_failure": "登錄失敗",
      "common.register_failure": "註冊失敗",
      "common.close": "關閉",
      "common.back": "返回",
      "common.send_code": "獲取驗證碼",
      "common.copy": "複製",
      "common.copied": "已複製",
      "common.copy_failed": "複製失敗",
      "verify.email.title": "驗證郵箱",
      "verify.email.sent": "驗證碼已發送至",
      "verify.submit": "完成註冊",
      "verify.back": "返回修改",
      "verify.reverse.title": "驗證郵箱",
      "verify.reverse.desc":
        "請用註冊郵箱向下面地址發送一封郵件，正文填寫驗證碼（主題隨意）。",
      "verify.address": "收件地址",
      "verify.code": "郵件正文",
      "verify.mailto": "使用郵件客戶端發送",
      "verify.waiting": "等待郵件…",
      "verify.checking": "正在檢查…",
      "verify.verified": "驗證通過，正在註冊…",
      "verify.expired": "驗證已過期，請返回修改",
      "verify.expires": "有效期剩餘",
      "verify.emailMismatch": "郵箱與本次註冊不一致",
      "verify.actionMismatch": "驗證任務類型不匹配",
      "common.please_get_code": "請先獲取郵箱驗證碼",
      "common.oauth_opening": "正在打開授權視窗…",
      "subtitle.account": "使用你的 AyAccount",
      "register.subtitle": "創建你的 AyAccount",
      "oauth.expand": "展開第三方登入",
      "oauth.title": "第三方帳號登入",
      "oauth.description": "使用第三方帳號登入或註冊 AyAccount。",
      "oauth.back": "返回帳號登入",
      "oauth.yzhyzxy.name": "Yzhyzxy",
      "oauth.yzhyzxy.hint": "使用 Yzhyzxy 帳號繼續",
      "oauth.github.name": "GitHub",
      "oauth.github.hint": "使用 GitHub 帳號繼續",
      "login.success": "登錄成功",
      "logout.success": "已登出",
      "register.success": "註冊成功",
      "refresh.success": "令牌已刷新",
      "password.change.success": "密碼已修改，請重新登錄",
      "reg.emailCode": "驗證碼",
      "common.send_email_code_success": "發送驗證碼成功",
      "common.send_email_code_failure": "發送驗證碼失敗",
      "common.reg_email_code_length": "郵箱驗證碼長度錯誤",
    },
  };

  /* ---------------- helpers ---------------- */

  function isPlainObject(obj) {
    return Object.prototype.toString.call(obj) === "[object Object]";
  }

  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function normalizeTheme(theme) {
    return theme === "light" || theme === "dark" || theme === "auto"
      ? theme
      : "auto";
  }

  const ENTER_ANIMATIONS = ["next", "back", "up", "down", "none"];

  function normalizeEnterAnimation(value, isMobile) {
    let direction = value;
    if (direction && typeof direction === "object") {
      direction = isMobile ? direction.mobile : direction.desktop;
    }
    if (!direction) return "next";
    return ENTER_ANIMATIONS.includes(direction) ? direction : "next";
  }

  function normalizeCustomStyle(style) {
    if (!style) return "";
    let css = "";
    if (typeof style === "string") {
      css = style;
    } else if (typeof style === "object") {
      const toKebab = (name) =>
        name.startsWith("--")
          ? name
          : name.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
      for (const [selector, rules] of Object.entries(style)) {
        if (!selector || rules == null) continue;
        if (selector.startsWith("--")) {
          css += `:root{${selector}:${String(rules)};}`;
          continue;
        }
        if (typeof rules === "string") {
          css += `${selector}{${rules}}`;
          continue;
        }
        if (typeof rules !== "object") continue;
        let body = "";
        for (const [prop, value] of Object.entries(rules)) {
          if (value == null) continue;
          body += `${toKebab(prop)}:${String(value)};`;
        }
        if (body) css += `${selector}{${body}}`;
      }
    }
    return css
      .replace(/@import[\s\S]*?;/gi, "")
      .replace(/expression\s*\(/gi, "(")
      .replace(/javascript\s*:/gi, "")
      .slice(0, MAX_CUSTOM_STYLE_LENGTH);
  }

  function utf8ToBase64(str) {
    const bytes = new TextEncoder().encode(str);
    let binary = "";
    for (let i = 0; i < bytes.length; i += 1) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  function assetUrl(path) {
    return PRODUCE
      ? `${ONLINE_BASE}/lib/ay-account/${path}`
      : new URL(path, SCRIPT_URL).href;
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener("error", () => reject(new Error("script")), {
          once: true,
        });
        return;
      }
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("script"));
      document.head.appendChild(script);
    });
  }

  function getGeetestLang(lang) {
    const normalized = String(lang || "zh-cn")
      .trim()
      .toLowerCase()
      .replace(/_/g, "-");
    const map = {
      "zh-cn": "zho",
      "zh-hans": "zho",
      "zh-sg": "zho",
      zh: "zho",
      "zh-tw": "zho-tw",
      "zh-hant": "zho-tw",
      "zh-hant-tw": "zho-tw",
      "zh-hk": "zho-hk",
      "zh-mo": "zho-hk",
      "zh-hant-hk": "zho-hk",
      en: "eng",
      "en-us": "eng",
      "en-gb": "eng",
      "en-au": "eng",
      "en-ca": "eng",
      ja: "jpn",
      "ja-jp": "jpn",
      id: "ind",
      "id-id": "ind",
      ko: "kor",
      "ko-kr": "kor",
      ru: "rus",
      "ru-ru": "rus",
      ar: "ara",
      "ar-sa": "ara",
      "ar-eg": "ara",
      es: "spa",
      "es-es": "spa",
      "es-mx": "spa",
      "pt-br": "pon",
      pt: "por",
      "pt-pt": "por",
      fr: "fra",
      "fr-fr": "fra",
      "fr-ca": "fra",
      de: "deu",
      "de-de": "deu",
      ug: "udm",
      "ug-cn": "udm",
    };
    if (map[normalized]) return map[normalized];
    const main = normalized.split("-")[0];
    return map[main] || "eng";
  }

  function removeUselessTestLogo() {
    const observer = new MutationObserver(() => {
      const nodes = document.querySelectorAll(
        ".geetest_box_logo, .geetest_feedback",
      );
      if (!nodes.length) return;
      nodes.forEach((el) => {
        el.style.display = "none";
      });
      observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  /* ---------------- integrated toast (shadow DOM, no global pollution) ---------------- */

  const TOAST_CSS = `
    :host { all: initial; }
    .ay-toast-layer {
      position: fixed;
      inset-block-start: 50%;
      inset-inline: 0;
      display: flex;
      justify-content: center;
      z-index: 1;
      pointer-events: none;
      font-family: "Roboto", "Noto Sans SC", "PingFang SC",
        "Microsoft YaHei", system-ui, -apple-system, "Segoe UI", sans-serif;
    }
    .ay-popup.ay-toast {
      max-height: 100%;
      padding: 12px 20px;
      width: fit-content;
      min-width: 130px;
      max-width: 80%;
      box-sizing: border-box;
      display: none;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.7);
      color: #fff;
      font-size: 14px;
      line-height: 1.6;
      text-align: center;
      border-radius: 8px;
      word-break: break-word;
      white-space: normal;
    }
    .ay-popup.ay-toast.is-visible { display: flex; }
    i.ay-icon { position: relative; display: inline-block; }
    .ay-icon__image {
      width: 20px;
      height: 20px;
      margin-inline-end: 4px;
      vertical-align: middle;
      overflow: clip;
      overflow-clip-margin: content-box;
    }
    .ay-icon__image--loading { animation: ay-toast-spin 2s linear infinite; }
    .ay-icon__image--error { filter: invert(1); display: none; }
    .ay-toast__text { margin-block-start: 0; }
    @keyframes ay-toast-spin { to { transform: rotate(1turn); } }
  `;

  function toastMarkup() {
    return `
      <div class="ay-toast-layer">
        <div role="dialog" tabindex="0" class="ay-popup ay-toast" aria-live="polite">
          <i class="ay-icon">
            <img class="ay-icon__image ay-icon__image--loading" alt=""
              src="${assetUrl("toast-loading.svg")}" />
          </i>
          <i class="ay-icon">
            <img class="ay-icon__image ay-icon__image--error" alt=""
              src="${assetUrl("toast-error.svg")}" />
          </i>
          <div class="ay-toast__text">Loading...</div>
        </div>
      </div>
    `;
  }

  class AyToast {
    constructor() {
      this.host = null;
      this.root = null;
      this.text = null;
      this.loadingIcon = null;
      this.errorIcon = null;
      this.timer = null;
    }

    ensure() {
      if (this.host) return;
      const host = document.createElement("div");
      host.setAttribute("data-ay-account-toast", "");
      host.style.position = "fixed";
      host.style.inset = "0";
      host.style.zIndex = "20000001";
      host.style.pointerEvents = "none";
      const root = host.attachShadow({ mode: "open" });
      root.innerHTML = `<style>${TOAST_CSS}</style>${toastMarkup()}`;
      document.body.appendChild(host);
      this.host = host;
      this.root = root.querySelector(".ay-popup.ay-toast");
      this.text = root.querySelector(".ay-toast__text");
      this.loadingIcon = root.querySelector(".ay-icon__image--loading");
      this.errorIcon = root.querySelector(".ay-icon__image--error");
    }

    show(message, type = "info", timeout = 1400) {
      this.ensure();
      if (!this.root || !this.text) return;
      this.text.textContent = message == null ? "" : String(message);
      if (this.loadingIcon) {
        this.loadingIcon.style.display = type === "loading" ? "block" : "none";
      }
      if (this.errorIcon) {
        this.errorIcon.style.display = type === "error" ? "block" : "none";
      }
      this.root.classList.add("is-visible");
      this.clearTimer();
      if (timeout > 0) {
        this.timer = setTimeout(() => this.hide(), timeout);
      }
    }

    loading(message) {
      this.show(message, "loading", 0);
    }

    success(message) {
      this.show(message, "info", 1400);
    }

    error(message) {
      this.show(message, "error", 2200);
    }

    hide() {
      if (this.root) this.root.classList.remove("is-visible");
      this.clearTimer();
    }

    clearTimer() {
      if (this.timer) {
        clearTimeout(this.timer);
        this.timer = null;
      }
    }
  }

  /* ---------------- SDK ---------------- */

  class AyAccount {
    constructor(config) {
      if (!config) throw new Error("[AyAccountSDK] config is required");

      const priv = { appId: config.appId || "default" };
      this._private = priv;
      this._iframe = null;
      this._iframeContainer = null;
      this._messageHandler = null;
      this._modalPromise = null;
      this._modalResolve = null;
      this._modalInline = false;
      this._modalSheet = false;
      this._modalSheetEl = null;
      this._modalConfig = null;
      this._oauthPopup = null;
      this._loadingToastTimer = null;
      this._toast = new AyToast();
      this.toast = this._toast;
      this.theme = normalizeTheme(config.theme);

      let lang = "zh-cn";
      let fallbackLang = "zh-cn";
      let translations = {};

      const i18n = config.i18n;
      if (typeof i18n === "string") {
        lang = i18n;
      } else if (isPlainObject(i18n)) {
        lang = i18n.lang || "zh-cn";
        fallbackLang = i18n.fallbackLang || "zh-cn";
        translations = i18n.translations || {};
      }

      if (!BUILTIN_TRANSLATIONS[fallbackLang]) {
        console.warn(
          `[AyAccountSDK] Unsupported fallback language "${fallbackLang}", fallback to "zh-cn"`,
        );
        fallbackLang = "zh-cn";
      }

      this.lang = lang;
      this.fallbackLang = fallbackLang;
      this.translations = translations;

      console.info(
        `%c AyAccountSDK %c v${VERSION} `,
        "padding: 2px 6px; border-radius: 3px 0 0 3px; color: #fff; background: #00aaff; font-weight: bold;",
        "padding: 2px 6px; border-radius: 0 3px 3px 0; color: #fff; background: #00ccff; font-weight: bold;",
      );
    }

    _t(key) {
      const currentCustom = this.translations[this.lang];
      if (currentCustom && currentCustom[key] !== undefined) {
        return currentCustom[key];
      }
      const currentBuiltin = BUILTIN_TRANSLATIONS[this.lang];
      if (currentBuiltin && currentBuiltin[key] !== undefined) {
        return currentBuiltin[key];
      }
      const fallbackCustom = this.translations[this.fallbackLang];
      if (fallbackCustom && fallbackCustom[key] !== undefined) {
        return fallbackCustom[key];
      }
      const fallbackBuiltin = BUILTIN_TRANSLATIONS[this.fallbackLang];
      if (fallbackBuiltin && fallbackBuiltin[key] !== undefined) {
        return fallbackBuiltin[key];
      }
      return key;
    }

    _getFullTranslationMap() {
      const allKeys = new Set();
      const collect = (obj) => {
        if (obj) Object.keys(obj).forEach((key) => allKeys.add(key));
      };
      collect(BUILTIN_TRANSLATIONS[this.lang]);
      collect(BUILTIN_TRANSLATIONS[this.fallbackLang]);
      collect(this.translations[this.lang]);
      collect(this.translations[this.fallbackLang]);
      const map = {};
      allKeys.forEach((key) => {
        map[key] = this._t(key);
      });
      return map;
    }

    updateI18n(options) {
      if (!options) return;
      if (options.lang !== undefined) this.lang = options.lang;
      if (options.fallbackLang !== undefined) {
        if (!BUILTIN_TRANSLATIONS[options.fallbackLang]) {
          console.warn(
            `[AyAccountSDK] Unsupported fallback language "${options.fallbackLang}", ignoring.`,
          );
        } else {
          this.fallbackLang = options.fallbackLang;
        }
      }
      if (options.translations !== undefined) {
        this.translations = { ...this.translations, ...options.translations };
      }
      const translationMap = this._getFullTranslationMap();
      this._postToIframe({
        action: "updateTranslations",
        payload: translationMap,
      });
      this._postToIframe({ action: "changeLanguage" });
      this._postToIframe({
        action: "configWindow",
        config: {
          lang: this.lang,
          theme: this.theme,
          translations: translationMap,
        },
      });
      if (this._modalConfig) {
        this._modalConfig.lang = this.lang;
        this._modalConfig.translations = translationMap;
      }
    }

    changeLanguage(lang) {
      this.updateI18n({ lang });
    }

    setTheme(theme) {
      this.theme = normalizeTheme(theme);
      this._postToIframe({
        action: "configWindow",
        config: { theme: this.theme },
      });
    }

    getTheme() {
      return this.theme;
    }

    _postToIframe(message) {
      if (!this._iframe || !this._iframe.contentWindow) return;
      this._iframe.contentWindow.postMessage(
        JSON.stringify(message),
        MODAL_ORIGIN,
      );
    }

    async _request(path, options = {}) {
      const url = `${API_BASE}${path}`;
      const { body, headers, ...rest } = options;
      const fetchOptions = {
        credentials: "include",
        ...rest,
        headers: {
          "Content-Type": "application/json",
          "X-App-Id": this._private.appId,
          "X-SDK-VER": VERSION,
          "X-App-Ver": VERSION,
          ...(headers || {}),
        },
      };
      if (body !== undefined) fetchOptions.body = JSON.stringify(body);

      try {
        const response = await fetch(url, fetchOptions);
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          const errorCode = data.error_code || data.code || "unknown";
          const rawMessage = data.error || data.message || "";
          const banReason = data.ban_reason || "";
          let message = rawMessage;
          if (errorCode !== undefined) {
            if (errorCode === 1017) {
              const baseMsg = this._t("error.1017");
              message = banReason ? `${baseMsg}: ${banReason}` : baseMsg;
            } else {
              const key = `error.${errorCode}`;
              const translated = this._t(key);
              if (translated !== key) message = translated;
              else if (!message) message = this._t("common.unknown_error");
            }
          } else {
            message = this._t("common.unknown_error");
          }
          const err = new Error(message);
          err.error_code = errorCode || "unknown";
          err.response = response;
          err.data = data;
          throw err;
        }
        return data;
      } catch (error) {
        if (error instanceof Error && !error.error_code) {
          const err = new Error(this._t("common.network_error"));
          err.error_code = "network_error";
          err.originalError = error;
          throw err;
        }
        throw error;
      }
    }

    async _ensureGeetest() {
      if (typeof window.initGeetest4 === "function") return;
      await loadScript(GT4_URL);
      if (typeof window.initGeetest4 !== "function") {
        throw new Error(
          `${this._t("common.unknown_error")}: Geetest4 not loaded`,
        );
      }
    }

    async _showGeetest(gtCode) {
      await this._ensureGeetest();
      return new Promise((resolve, reject) => {
        let instance = null;
        const cleanup = () => {
          if (instance && typeof instance.destroy === "function") {
            instance.destroy();
          }
          instance = null;
        };
        window.initGeetest4(
          {
            captchaId: gtCode,
            product: "bind",
            language: getGeetestLang(this.lang),
          },
          (captcha) => {
            instance = captcha;
            captcha
              .onReady(() => {
                removeUselessTestLogo();
                if (typeof captcha.showBox === "function") captcha.showBox();
              })
              .onSuccess(() => {
                const result = captcha.getValidate();
                if (!result) {
                  cleanup();
                  reject(new Error(this._t("common.complete_verification")));
                  return;
                }
                result.captcha_id = gtCode;
                const payload = utf8ToBase64(JSON.stringify(result));
                cleanup();
                resolve(payload);
              })
              .onError(() => {
                cleanup();
                reject(new Error("Geetest Error"));
              })
              .onClose(() => {
                cleanup();
                const err = new Error(this._t("error.1024"));
                err.error_code = 1024;
                reject(err);
              });
          },
        );
      });
    }

    async _withCaptcha(run) {
      try {
        return await run(null);
      } catch (err) {
        if (
          Number(err && err.error_code) === 1023 &&
          err.data &&
          err.data.gt_code
        ) {
          const gt = await this._showGeetest(err.data.gt_code);
          return run(gt);
        }
        throw err;
      }
    }

    _openModal(mode, config = DEFAULT_WINDOW_CONFIG) {
      if (this._iframe) {
        throw new Error(
          this._t("error.modal_already_open") || "Modal already open",
        );
      }

      const opts = { ...DEFAULT_WINDOW_CONFIG, ...(config || {}) };
      const theme = normalizeTheme(opts.theme || this.theme);
      const openLang = opts.lang || this.lang;
      const only =
        opts.only === "login" || opts.only === "register" ? opts.only : null;
      const initialMode = only || (mode === "register" ? "register" : "login");
      const isMobileSheet =
        window.matchMedia &&
        (window.matchMedia("(max-width: 720px)").matches ||
          (window.matchMedia("(pointer: coarse)").matches &&
            window.innerWidth <= 1024));
      const isMobileUI = Boolean(
        window.matchMedia && window.matchMedia("(max-width: 720px)").matches,
      );
      const enterAnimation = normalizeEnterAnimation(
        opts.enter !== undefined
          ? opts.enter
          : opts.enterAnimation !== undefined
            ? opts.enterAnimation
            : opts.animation,
        isMobileUI,
      );
      this.theme = theme;
      this.lang = openLang;

      return new Promise((resolve, reject) => {
        const target =
          typeof opts.container === "string"
            ? document.querySelector(opts.container)
            : opts.container;
        const inline = Boolean(
          target && typeof target.appendChild === "function",
        );
        const fill = inline
          ? (opts.fill !== undefined ? opts.fill : opts.fullSize) !== false
          : (opts.fill !== undefined ? opts.fill : opts.fullSize) === true;
        const customStyle = normalizeCustomStyle(opts.style);
        const showLoadingToast =
          opts.loadingToast === undefined || opts.loadingToast === null
            ? !inline
            : Boolean(opts.loadingToast);
        if (showLoadingToast) this._showLoadingToast();

        if (!inline && document.body) document.body.style.overflow = "hidden";

        const iframediv = document.createElement("div");
        iframediv.className = inline ? "ay-account-inline" : "ay-account-modal";

        const iframe = document.createElement("iframe");
        iframe.title = "AyAccount";
        iframe.setAttribute("allow", "clipboard-write");
        iframe.textContent = "";
        const modalUrl = new URL(URLPATH.MODALPAGE.PAGE);
        modalUrl.searchParams.set("tab", initialMode);
        modalUrl.searchParams.set("mode", inline ? "inline" : "full");
        modalUrl.searchParams.set("theme", theme);
        modalUrl.searchParams.set("lang", openLang);
        modalUrl.searchParams.set("only", only || "");
        modalUrl.searchParams.set("fill", fill ? "1" : "0");
        modalUrl.searchParams.set("enter", enterAnimation);
        if (PRODUCE) modalUrl.searchParams.set("min", "1");
        modalUrl.searchParams.set("v", VERSION);
        iframe.src = modalUrl.href;

        let sheet = null;

        if (inline) {
          if (window.getComputedStyle(target).position === "static") {
            target.style.position = "relative";
          }
          target.style.overflow = "hidden";
          iframediv.style.position = "relative";
          iframediv.style.width = "100%";
          iframediv.style.height = opts.height || "100%";
          iframediv.style.minHeight = opts.minHeight || "600px";
          iframediv.style.overflow = "hidden";
          iframediv.style.borderRadius = "inherit";

          iframe.style.position = "absolute";
          iframe.style.inset = "0";
          iframe.style.width = "100%";
          iframe.style.height = "100%";
          iframe.style.border = "none";
          iframe.style.backgroundColor = "transparent";
          iframe.style.display = "block";
        } else {
          const zIndex = String(opts.zIndex || 20000000);
          iframediv.style.position = "fixed";
          iframediv.style.inset = "0";
          iframediv.style.zIndex = zIndex;
          iframediv.style.overflow = "hidden";
          iframediv.style.backgroundColor =
            opts.scrim === false ? "transparent" : "rgba(0, 0, 0, 0.32)";
          iframediv.style.opacity = "0";
          iframediv.style.transition =
            "opacity 200ms cubic-bezier(0.2, 0, 0, 1)";
          iframediv.style.willChange = "opacity";

          sheet = document.createElement("div");
          sheet.style.position = "absolute";
          sheet.style.inset = "0";
          sheet.style.overflow = "hidden";
          sheet.style.backgroundColor = "transparent";
          if (isMobileSheet) {
            sheet.style.transform = "translateY(100%)";
            sheet.style.transition =
              "transform 320ms cubic-bezier(0.2, 0, 0, 1)";
            sheet.style.willChange = "transform";
          }

          iframe.style.position = "absolute";
          iframe.style.inset = "0";
          iframe.style.width = "100%";
          iframe.style.height = "100%";
          iframe.style.border = "none";
          iframe.style.backgroundColor = "transparent";
          iframe.style.display = "block";
        }

        this._iframe = iframe;
        this._iframeContainer = iframediv;
        this._modalInline = inline;
        this._modalSheet = !inline && isMobileSheet;
        this._modalSheetEl = sheet;
        this._modalConfig = {
          appId: this._private.appId,
          sdkVersion: VERSION,
          apiBase: API_BASE,
          inline,
          theme,
          lang: openLang,
          hideOauthClient: !!opts.hideOauthClient,
          hideClose: !!opts.hideClose,
          hideFaq: !!opts.hideFaq,
          hideSwitch: !!opts.hideSwitch,
          only,
          fill,
          enterAnimation,
          customStyle,
          autoClose: opts.autoClose !== false,
          translations: this._getFullTranslationMap(),
        };

        let userInfo = null;

        const handler = async (event) => {
          if (event.source !== iframe.contentWindow) return;
          if (event.origin !== MODAL_ORIGIN) return;
          let data = event.data;
          if (typeof data === "string" && data.startsWith("{")) {
            try {
              data = JSON.parse(data);
            } catch {
              return;
            }
          }
          if (!data || typeof data !== "object" || !data.action) return;

          switch (data.action) {
            case "isReady":
              this._hideLoadingToast();
              this._postToIframe({
                action: "updateTranslations",
                payload: this._getFullTranslationMap(),
              });
              this._postToIframe({
                action: "configWindow",
                config: {
                  ...this._modalConfig,
                  translations: this._getFullTranslationMap(),
                },
              });
              break;

            case "closeWindow":
              this._postToIframe({ action: "beforeClose" });
              await this._animateOut();
              this._closeModal();
              resolve(userInfo);
              break;

            case "loginSuccess":
              if (data.result) userInfo = data.result;
              else if (data.user) userInfo = data.user;
              break;

            case "registerSuccess":
              if (data.result) userInfo = data.result;
              else if (data.user) userInfo = data.user;
              break;

            case "loginFailure":
            case "registerFailure":
              break;

            case "oauth_login":
              if (data.provider === "yzhyzxy" || data.provider === "github") {
                this._loginWithOAuthPopup(data.provider)
                  .then((result) => {
                    userInfo = result;
                    this._postToIframe({
                      action: "loginSuccess",
                      user: result,
                    });
                  })
                  .catch((err) => {
                    this._postToIframe({
                      action: "loginFailure",
                      message: err.message || this._t("common.login_failure"),
                      code: err.error_code || "unknown",
                    });
                  });
              }
              break;

            case "sendEmailCode":
              this._sendEmailCode(data.email)
                .then((result) => {
                  this._postToIframe({
                    action: "sendEmailCodeSuccess",
                    token: result.token,
                  });
                })
                .catch((err) => {
                  this._postToIframe({
                    action: "sendEmailCodeFailure",
                    message:
                      err.message || this._t("common.send_email_code_failure"),
                    code: err.error_code || "unknown",
                  });
                });
              break;

            case "login":
              this._login(data.username, data.password)
                .then((result) => {
                  userInfo = result;
                  this._postToIframe({
                    action: "loginSuccess",
                    user: result,
                  });
                })
                .catch((err) => {
                  this._postToIframe({
                    action: "loginFailure",
                    message: err.message || this._t("common.login_failure"),
                    code: err.error_code || "unknown",
                  });
                });
              break;

            case "registerStart":
              this._startRegisterVerification(data.email)
                .then((result) => {
                  this._postToIframe({
                    action: "registerStartSuccess",
                    messageId: data.messageId,
                    data: result,
                  });
                })
                .catch((err) => {
                  this._postToIframe({
                    action: "registerStartFailure",
                    messageId: data.messageId,
                    message:
                      err.message || this._t("common.register_failure"),
                    code: err.error_code || "unknown",
                  });
                });
              break;

            case "registerQuery":
              this._queryRegisterVerification(
                data.verifyRequestId,
                data.email,
              )
                .then((result) => {
                  this._postToIframe({
                    action: "registerQuerySuccess",
                    messageId: data.messageId,
                    data: result,
                  });
                })
                .catch((err) => {
                  this._postToIframe({
                    action: "registerQueryFailure",
                    messageId: data.messageId,
                    message:
                      err.message || this._t("common.network_error"),
                    code: err.error_code || "unknown",
                  });
                });
              break;

            case "registerComplete":
              this._completeRegistration(data.payload)
                .then((result) => {
                  userInfo = result;
                  this._postToIframe({
                    action: "registerCompleteSuccess",
                    messageId: data.messageId,
                    data: result,
                  });
                })
                .catch((err) => {
                  this._postToIframe({
                    action: "registerCompleteFailure",
                    messageId: data.messageId,
                    message:
                      err.message || this._t("common.register_failure"),
                    code: err.error_code || "unknown",
                  });
                });
              break;

            case "register":
              this._register(
                data.username,
                data.email,
                data.password,
                data.code,
                data.token,
              )
                .then((result) => {
                  userInfo = result;
                  this._postToIframe({
                    action: "registerSuccess",
                    result,
                  });
                })
                .catch((err) => {
                  this._postToIframe({
                    action: "registerFailure",
                    message: err.message || this._t("common.register_failure"),
                    code: err.error_code || "unknown",
                  });
                });
              break;

            case "getTranslation": {
              const key = data.key;
              this._postToIframe({
                action: "translationResponse",
                key,
                value: this._t(key),
              });
              break;
            }

            default:
              break;
          }
        };

        this._messageHandler = handler;
        window.addEventListener("message", handler);
        if (inline) {
          target.appendChild(iframediv);
          iframediv.appendChild(iframe);
        } else {
          sheet.appendChild(iframe);
          iframediv.appendChild(sheet);
          document.body.appendChild(iframediv);
          requestAnimationFrame(() => {
            iframediv.style.opacity = "1";
            if (isMobileSheet) {
              setTimeout(() => {
                sheet.style.transform = "translateY(0)";
              }, 220);
            }
          });
        }

        this._modalResolve = resolve;
        this._modalReject = reject;
      }).then((value) => {
        this._modalResolve = null;
        this._modalReject = null;
        return value;
      });
    }

    _animateOut() {
      const el = this._iframeContainer;
      if (!el || this._modalInline) return Promise.resolve();
      if (this._modalSheet && this._modalSheetEl) {
        this._modalSheetEl.style.transform = "translateY(100%)";
        return delay(320).then(() => {
          el.style.opacity = "0";
          return delay(200);
        });
      }
      el.style.transition = "opacity 200ms cubic-bezier(0.2, 0, 0, 1)";
      el.style.opacity = "0";
      return delay(200);
    }

    _showLoadingToast() {
      this._hideLoadingToast();
      this._toast.loading(this._t("loading"));
      this._loadingToastTimer = setTimeout(() => {
        this._loadingToastTimer = null;
        this._toast.hide();
      }, 20000);
    }

    _hideLoadingToast() {
      if (this._loadingToastTimer) {
        clearTimeout(this._loadingToastTimer);
        this._loadingToastTimer = null;
      }
      this._toast.hide();
    }

    _closeModal() {
      if (!this._modalInline && document.body) {
        document.body.style.overflow = "";
      }
      this._modalInline = false;
      this._modalSheet = false;
      this._modalSheetEl = null;
      if (this._oauthPopup && !this._oauthPopup.closed) {
        try {
          this._oauthPopup.close();
        } catch {
          /* ignore */
        }
      }
      this._oauthPopup = null;
      if (this._iframeContainer && this._iframeContainer.parentNode) {
        this._iframeContainer.parentNode.removeChild(this._iframeContainer);
      }
      if (this._messageHandler) {
        window.removeEventListener("message", this._messageHandler);
        this._messageHandler = null;
      }
      this._iframe = null;
      this._iframeContainer = null;
      this._modalConfig = null;
      this._hideLoadingToast();
    }

    async close() {
      if (!this._iframe) return;
      this._postToIframe({ action: "beforeClose" });
      await this._animateOut();
      const resolve = this._modalResolve;
      this._modalResolve = null;
      this._modalReject = null;
      this._closeModal();
      if (resolve) resolve(null);
    }

    _loginWithOAuthPopup(provider) {
      const self = this;
      const endpoints = {
        yzhyzxy: URLPATH.MODALPAGE.LOGIN_YZH_OAUTH,
        github: URLPATH.MODALPAGE.LOGIN_GITHUB_OAUTH,
      };
      if (!endpoints[provider])
        return Promise.reject(new Error("Unsupported provider"));
      const endpoint = endpoints[provider];

      return new Promise((resolve, reject) => {
        fetch(`${API_BASE}${endpoint}`, { credentials: "include" })
          .then((res) => {
            if (!res.ok) throw new Error(self._t("error.1034"));
            return res.json();
          })
          .then((data) => {
            if (!data.url) throw new Error(self._t("error.1034"));
            const width = (screen.availWidth / 4) * 3;
            const height = (screen.availHeight / 4) * 3;
            const left = (screen.availWidth - width) / 2;
            const top = (screen.availHeight - height) / 2;
            const popup = window.open(
              data.url,
              `${provider}_login`,
              `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`,
            );
            if (!popup) throw new Error(self._t("error.1035"));
            self._oauthPopup = popup;

            const finish = (fn) => {
              window.removeEventListener("message", handler);
              clearInterval(checkClosed);
              clearTimeout(timeout);
              if (popup && !popup.closed) popup.close();
              self._oauthPopup = null;
              fn();
            };

            const handler = (event) => {
              if (event.origin !== API_ORIGIN) return;
              if (!event.data) return;
              if (
                event.data.action === "login_success" &&
                event.data.provider === provider
              ) {
                finish(() =>
                  resolve({
                    action: "login",
                    success: true,
                    code: 200,
                    user: event.data.user,
                  }),
                );
              } else if (event.data.action === "login_fail") {
                finish(() => reject(new Error(self._t("error.1036"))));
              }
            };
            window.addEventListener("message", handler);
            const checkClosed = setInterval(() => {
              if (!popup.closed) return;
              finish(() => reject(new Error(self._t("error.1038"))));
            }, 500);
            const timeout = setTimeout(() => {
              finish(() => reject(new Error(self._t("error.1039"))));
            }, 600000);
          })
          .catch((err) => reject(err));
      });
    }

    register(config = DEFAULT_WINDOW_CONFIG) {
      return this._openModal("register", config);
    }

    login(config = DEFAULT_WINDOW_CONFIG) {
      return this._openModal("login", config);
    }

    async _sendEmailCode(email, action = "register") {
      const allowed = allowedEmailDomains.some((domain) =>
        String(email || "").endsWith(domain),
      );
      if (!allowed) throw new Error(this._t("error.1026"));
      return this._request(URLPATH.API.SENDMAILCODE, {
        method: "POST",
        body: { email, action },
      });
    }

    async _startRegisterVerification(email) {
      const allowed = allowedEmailDomains.some((domain) =>
        String(email || "").endsWith(domain),
      );
      if (!allowed) throw new Error(this._t("error.1026"));
      return this._withCaptcha((gt) =>
        this._request(URLPATH.API.REGISTER_START, {
          method: "POST",
          body: { email, ...(gt ? { gt } : {}) },
        }),
      );
    }

    _queryRegisterVerification(verifyRequestId, email) {
      return this._request(URLPATH.API.REGISTER_QUERY, {
        method: "POST",
        body: { requestId: verifyRequestId, email },
      });
    }

    _completeRegistration(payload) {
      return this._request(URLPATH.API.REGISTER, {
        method: "POST",
        body: payload || {},
      });
    }

    async _register(username, email, password, code, token) {
      return this._withCaptcha((gt) =>
        this._request(URLPATH.API.REGISTER, {
          method: "POST",
          body: {
            username,
            email,
            password,
            emailToken: token,
            emailCode: code,
            ...(gt ? { gt } : {}),
          },
        }),
      );
    }

    async _login(usernameOrEmail, password) {
      return this._withCaptcha((gt) =>
        this._request(URLPATH.API.LOGIN, {
          method: "POST",
          body: {
            username: usernameOrEmail,
            email: usernameOrEmail,
            password,
            ...(gt ? { gt } : {}),
          },
        }),
      );
    }

    logout() {
      return this._request(URLPATH.API.LOGOUT, { method: "POST" });
    }

    async testServer() {
      try {
        await this._request(URLPATH.API.TEST, { method: "POST" });
        return { success: true };
      } catch (err) {
        return { success: false, err };
      }
    }

    verify() {
      return this._request(URLPATH.API.VERIFY, { method: "GET" });
    }

    refresh() {
      return this._request(URLPATH.API.REFRESH, { method: "POST" });
    }

    async changePassword(oldPassword, newPassword) {
      return this._withCaptcha((gt) =>
        this._request(URLPATH.API.CHANGEPASSWORD, {
          method: "POST",
          body: {
            oldPassword,
            newPassword,
            ...(gt ? { gt } : {}),
          },
        }),
      );
    }
  }

  function createAyAccount(config) {
    return new AyAccount(config);
  }

  window.AyAccount = AyAccount;
  window.createAyAccount = createAyAccount;
})();
