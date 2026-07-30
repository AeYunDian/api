'v1.4.6 AyAccountSDK';

const VERSION = '1.4.6';
const PRODUCE = false;
const privateData = new WeakMap();
const BUILTIN_TRANSLATIONS = {
  'zh-cn': {
    'title.login': '登录',
    'nav.login': '&nbsp;登录&nbsp;',
    'nav.reg': '&nbsp;注册&nbsp;',
    'nav.login.bartf': '94.6px',
    'nav.reg.bartf': '213.5px',
    'link.faq': 'https://online.undz.cn/login/faq/zh-cn.html',
    'reg.username': '用户名',
    'reg.email': '邮箱',
    'reg.password': '密码',
    'reg.passwordConfirm': '请再次输入密码',
    'agreement.prefix': '我已阅读并同意',
    'privacy_policy': '《隐私政策》',
    'cookie_policy': '《Cookie 政策》',
    'terms': '《服务条款》',
    'privacy_policy.link': 'https://undz.cn/privacy_policy/zh-cn.html',
    'cookie_policy.link': 'https://undz.cn/cookie_policy/zh-cn.html',
    'terms.link': 'https://undz.cn/terms/zh-cn.html',
    'btn.reg': '注册',
    'login.usernameoremail': '用户名/邮箱',
    'login.password': '密码',
    'btn.login': '登录',
    'btn.haveQuestion': '常见问题',
    'loading': '加载中...',
    'agreement.and1': '、',
    'agreement.and2': '和',
    'error.1000': '邮箱格式无效',
    'error.1001': '密码长度至少 6 位，仅允许 a-z A-Z 0-9 -_=+@#$%',
    'error.1002': '用户名或邮箱已存在',
    'error.1003': '用户名/邮箱或密码错误',
    'error.1005': '新密码格式不合法（至少 6 位，仅允许 a-z A-Z 0-9 -_=+@#$%）',
    'error.1006': '旧密码错误',
    'error.1007': '缺少必填字段',
    'error.1009': '请提供用户名/邮箱和密码',
    'error.1010': '未授权，请先登录',
    'error.1011': '令牌无效或已过期',
    'error.1012': '缺少旧密码或新密码',
    'error.1013': '未提供令牌',
    'error.1014': '刷新令牌缺失',
    'error.1015': '刷新令牌无效或已过期',
    'error.1016': '用户不存在',
    'error.1017': '账号已被封禁',
    'error.1018': '服务器错误',
    'error.1019': 'appId 无效',
    'error.1020': '验证码校验失败',
    'error.1021': '验证ID无效',
    'error.1022': '验证码二次校验失败',
    'error.1023': '需要通过人机验证',
    'error.1024': '您已取消验证',
    'error.modal_already_open': '登录窗口已打开，请勿重复操作',
    'error.aytoast_not_found': 'AyToast 组件未成功加载，请您重载',
    'common.register_success': '注册成功',
    'common.login_success': '登录成功',
    'common.login_failure': '登录失败',
    'common.register_failure': '注册失败',
    'common.network_error': '网络请求失败，请检查网络',
    'common.unknown_error': '未知错误，请稍后重试',
    'common.enter_username_or_email': '请输入用户名/邮箱',
    'common.please_read_and_agree': '请您阅读并同意协议',
    'common.password_min_length': '密码至少6位',
    'common.enter_password': '请输入密码',
    'common.invalid_email_format': '邮箱格式不正确',
    'common.enter_username': '请输入用户名',
    'common.enter_email': '请输入邮箱',
    'common.password_mismatch': '密码输入不一致',
    'common.no_account_register': '没有账号？去注册',
    'common.have_account_login': '已有账号？去登录',
    'common.success': '操作成功',
    'common.complete_verification': '请完成验证',
    'common.please_wait': '请稍后...',
    'login.success': '登录成功',
    'logout.success': '已登出',
    'register.success': '注册成功',
    'refresh.success': '令牌已刷新',
    'password.change.success': '密码已修改，请重新登录',
  },
  'en-us': {
    'title.login': 'Login',
    'nav.login': 'Login',
    'nav.reg': 'Register',
    'nav.login.bartf': '85px',
    'nav.reg.bartf': '215px',
    'reg.username': 'Username',
    'reg.email': 'Email',
    'reg.password': 'Password',
    'reg.passwordConfirm': 'Re-enter password',
    'agreement.prefix': 'I have read and agree to the',
    'privacy_policy': '“Privacy Policy”',
    'cookie_policy': '“Cookie Policy”',
    'terms': '“Terms of Service”',
    'btn.reg': 'Register',
    'login.usernameoremail': 'Username/Email',
    'login.password': 'Password',
    'btn.login': 'Login',
    'btn.haveQuestion': 'FAQ',
    'loading': 'Loading...',
    'agreement.and1': ', ',
    'agreement.and2': 'and',
    'link.faq': 'https://online.undz.cn/login/faq/en-us.html',
    'privacy_policy.link': 'https://undz.cn/privacy_policy/en-us.html',
    'cookie_policy.link': 'https://undz.cn/cookie_policy/en-us.html',
    'terms.link': 'https://undz.cn/terms/en-us.html',
    'error.1000': 'Invalid email format',
    'error.1001': 'Password must be at least 6 characters and contain only a-z A-Z 0-9 -_=+@#$%',
    'error.1002': 'Username or email already exists',
    'error.1003': 'Invalid credentials',
    'error.1005': 'New password must be at least 6 characters and contain only a-z A-Z 0-9 -_=+@#$%',
    'error.1006': 'Old password is incorrect',
    'error.1007': 'Missing required fields',
    'error.1009': 'Username/email and password are required',
    'error.1010': 'Unauthorized, please login',
    'error.1011': 'Invalid or expired token',
    'error.1012': 'Missing oldPassword or newPassword',
    'error.1013': 'No token provided',
    'error.1014': 'Refresh token missing',
    'error.1015': 'Invalid or expired refresh token',
    'error.1016': 'User not found',
    'error.1017': 'Account banned',
    'error.1018': 'Server Error',
    'error.1019': 'appId is invalid',
    'error.1020': 'Verification code check failed',
    'error.1021': 'Invalid verification ID',
    'error.1022': 'Verification code check failed again',
    'error.1023': 'You need to pass a human verification',
    'error.1024': 'Verification cancelled, please retry',
    'error.modal_already_open': 'Login modal is already open, please do not repeat',
    'error.aytoast_not_found': 'The AyToast component failed to load, please reload.',
    'common.network_error': 'Network request failed, please check your connection',
    'common.unknown_error': 'Unknown error, please try again later',
    'common.success': 'Operation successful',
    'common.complete_verification': 'Please complete the verification',
    'common.register_success': 'Registration successful',
    'common.login_success': 'Login successful',
    'common.login_failure': 'Login failed',
    'common.register_failure': 'Registration failed',
    'common.enter_username_or_email': 'Please enter username/email',
    'common.please_read_and_agree': 'Please read and agree to the terms',
    'common.password_min_length': 'Password must be at least 6 characters',
    'common.enter_password': 'Please enter your password',
    'common.no_account_register': 'No account? Sign up',
    'common.have_account_login': 'Already have an account? Log in',
    'common.invalid_email_format': 'Invalid email format',
    'common.enter_username': 'Please enter username',
    'common.enter_email': 'Please enter email',
    'common.password_mismatch': 'Passwords do not match',
    'common.please_wait': 'Please wait...',
    'login.success': 'Login successful',
    'logout.success': 'Logged out',
    'register.success': 'Registration successful',
    'refresh.success': 'Token refreshed',
    'password.change.success': 'Password changed, please login again',
  },
  'zh-hk': {
    'title.login': '登錄',
    'nav.login': '&nbsp;登錄&nbsp;',
    'nav.reg': '&nbsp;註冊&nbsp;',
    'nav.login.bartf': '94.6px',
    'nav.reg.bartf': '213.5px',
    'reg.username': '用戶名',
    'reg.email': '電郵',
    'reg.password': '密碼',
    'reg.passwordConfirm': '請再次輸入密碼',
    'agreement.prefix': '我已閱讀並同意',
    'privacy_policy': '《隱私政策》',
    'cookie_policy': '《Cookie 政策》',
    'terms': '《服務條款》',
    'link.faq': 'https://online.undz.cn/login/faq/zh-hk.html',
    'privacy_policy.link': 'https://undz.cn/privacy_policy/zh-hk.html',
    'cookie_policy.link': 'https://undz.cn/cookie_policy/zh-hk.html',
    'terms.link': 'https://undz.cn/terms/zh-hk.html',
    'btn.reg': '註冊',
    'login.usernameoremail': '用戶名/電郵',
    'login.password': '密碼',
    'btn.login': '登錄',
    'btn.haveQuestion': '常見問題',
    'loading': '載入中...',
    'agreement.and1': '、',
    'agreement.and2': '和',
    'error.1000': '電郵格式無效',
    'error.1001': '密碼長度至少 6 位，僅允許 a-z A-Z 0-9 -_=+@#$%',
    'error.1002': '用戶名或電郵已存在',
    'error.1003': '用戶名/電郵或密碼錯誤',
    'error.1005': '新密碼格式不合法（至少 6 位，僅允許 a-z A-Z 0-9 -_=+@#$%）',
    'error.1006': '舊密碼錯誤',
    'error.1007': '缺少必填欄位',
    'error.1009': '請提供用戶名/電郵和密碼',
    'error.1010': '未授權，請先登錄',
    'error.1011': '令牌無效或已過期',
    'error.1012': '缺少舊密碼或新密碼',
    'error.1013': '未提供令牌',
    'error.1014': '刷新令牌缺失',
    'error.1015': '刷新令牌無效或已過期',
    'error.1016': '用戶不存在',
    'error.1017': '賬號已被封禁',
    'error.1018': '伺服器錯誤',
    'error.1019': 'appId 無效',
    'error.1020': '驗證碼驗證失敗',
    'error.1021': '驗證ID無效',
    'error.1022': '驗證碼第二次驗證失敗',
    'error.1023': '需要通過人機驗證',
    'error.1024': '驗證已取消，請重試',
    'error.modal_already_open': '登錄視窗已打開，請勿重複操作',
    'error.aytoast_not_found': 'AyToast 組件未成功加載，請你重載',
    'common.network_error': '網絡請求失敗，請檢查網絡',
    'common.unknown_error': '未知錯誤，請稍後重試',
    'common.complete_verification': '麻煩完成驗證',
    'common.please_wait': '請稍後...',
    'common.success': '操作成功',
    'common.register_success': '註冊成功',
    'common.login_success': '登錄成功',
    'common.enter_username_or_email': '請輸入用戶名/電郵',
    'common.please_read_and_agree': '請您閱讀並同意協議',
    'common.password_min_length': '密碼至少6位',
    'common.enter_password': '請輸入密碼',
    'common.invalid_email_format': '電郵格式不正確',
    'common.enter_username': '請輸入用戶名',
    'common.enter_email': '請輸入電郵',
    'common.password_mismatch': '密碼輸入不一致',
    'common.no_account_register': '沒有賬號？去註冊',
    'common.have_account_login': '已有賬號？去登錄',
    'common.login_failure': '登錄失敗',
    'common.register_failure': '註冊失敗',
    'login.success': '登錄成功',
    'logout.success': '已登出',
    'register.success': '註冊成功',
    'refresh.success': '令牌已刷新',
    'password.change.success': '密碼已修改，請重新登錄',

  },
};
function isMobile() {
  const userAgentInfo = navigator.userAgent;
  const mobileAgents = ["Android", "iPhone", "SymbianOS", "Windows Phone", "iPad", "iPod"];
  return mobileAgents.some(agent => userAgentInfo.includes(agent));
}
// ---------- 工具函数 ----------
function utf8ToBase64(str) {
  // 将字符串编码为 UTF-8 字节数组
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);  // Uint8Array
  // 将字节数组转换为二进制字符串（每个字节转成对应字符）
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  // 最后 Base64 编码
  return btoa(binary);
}
function removeUselessTestLogo() {
  const observer = new MutationObserver(() => {
    const els = document.querySelectorAll('.geetest_box_logo, .geetest_feedback');
    if (els.length) {
      els.forEach(el => el.style.display = 'none');
      observer.disconnect(); // 隐藏后停止观察，避免重复执行
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}
function isPlainObject(obj) {
  return Object.prototype.toString.call(obj) === '[object Object]';
}
(() => {
  // 动态加载 Geetest SDK（仅在浏览器环境中）
  if (typeof window !== 'undefined' && typeof window.initGeetest4 === 'undefined') {
    window.addEventListener("load", function () {
      const script = document.createElement('script');
      script.src = PRODUCE ? 'https://online.undz.cn/lib/gt4.js' : '/lib/gt4.js';
      script.async = true;        // 异步加载，不阻塞页面
      script.onload = () => console.log('[AyAccountSDK] Geetest loaded');
      script.onerror = () => console.warn('[AyAccountSDK] Failed to load Geetest');
      document.head.appendChild(script);
    });
  }
  if (typeof window !== 'undefined') {
    window.addEventListener("load", function () {
      const toastscript = document.createElement('script');
      toastscript.src = PRODUCE ? 'https://online.undz.cn/login/toast.js' : '/login/toast.js';
      toastscript.async = true;        // 异步加载，不阻塞页面
      toastscript.onload = () => console.log('[AyAccountSDK] AyWebToast loaded');
      toastscript.onerror = () => console.warn('[AyAccountSDK] Failed to load AyWebToast');
      document.head.appendChild(toastscript);
      const toastcss = document.createElement('link');
      toastcss.rel = 'stylesheet';
      toastcss.href = PRODUCE ? 'https://online.undz.cn/login/toast.css' : '/login/toast.css';
      document.head.appendChild(toastcss);
      const toastDiv = document.createElement("div");
      toastDiv.className = 'ay-popup ay-toast service-loading';
      toastDiv.innerHTML = `
      <i class="ay-icon">
        <img
          class="ay-icon__image ay-icon__image--loading"
          src="data:image/png;base64,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"
        />
      </i>
      <i class="ay-icon">
        <img
          class="ay-icon__image ay-icon__image--error"
          style="display: none"
          src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAABZUlEQVR4nM3S7VHCQBhF4ZsKtAOxAtcOoINQgXRgrECtwFiBWoFrBdCBSwVCB1ABnpeEj4QNCBlmPDNP/sDsDSSJzty/GLhDV5IrWaHk8YXG9g2keEFH+5tIeoDHTgli2cEZjimHDVWKDdgX73FKr8iwrj6Q4hNt6sNjWX3gBx21ayLpGssSrBpIekOsZ2S4gDVHjkfE6sOjMvCu4pWs94wnFa/oSEVdFa/pk+IjHxiIEqz6hkO9GXoIcLACHIa4RL2AW1QGFmhqhh4CLIchLtFUguJStkBTc3RVHRhp80xiLc9eXsoCblBv+3AHK8BhpPjIGPZ5ZeBd8Yfs0YfDEFYPAZ9IUe8DA1GCVQM1v6YeXW3+8xlGih9u2Q15VAasiaQrtGmKjsoSbJfCfnab1ndv1QesHPc4pVdkWBcbsHIcO7JzuNU0YKXIceiZTJHBY6cEh0pLDjewxgjwpcb+MtCqsw/8AhmlSBngmo1XAAAAAElFTkSuQmCC"
        />
      </i>
      <div class="ay-toast__text">加载中...</div>
      `;
      toastDiv.style.display = 'none';
      toastDiv.role = 'dialog';
      toastDiv.tabIndex = 0;
      toastDiv.style.zIndex = 20000010;
      document.body.appendChild(toastDiv);
    });
  }

  console.info(`%c AyAccountSDK %c v${VERSION} `,
    "padding: 2px 6px; border-radius: 3px 0 0 3px; color: #fff; background: #00aaff; font-weight: bold;",
    "padding: 2px 6px; border-radius: 0 3px 3px 0; color: #fff; background: #00ccff; font-weight: bold;");
})();
// ---------- AyAccount 类 ----------
class AyAccount {
  /**
   * @param {Object} config
   * @param {string} config.appId - 应用标识（用于请求头与统计）
   * @param {string|Object} config.i18n - 国际化配置
   *   - 字符串：内置支持的语言代码（'zh-cn' | 'en-us' | 'zh-hk'）
   *   - 对象：{
   *       lang?: string,               // 当前使用语言的标识（任意字符串，例如 'ja', 'zh-tw'）
   *       fallbackLang?: string,       // 回退语言，当 lang 的翻译缺失时使用（默认为 'zh-cn'）
   *       translations?: {             // 自定义多语言翻译包
   *         [languageCode: string]: {  // 语言代码（须与 lang / fallbackLang 对应）
   *           [key: string]: string    // 翻译键值对
   *         }
   *       }
   *     }
   *     - 翻译查找优先级：custom(lang) → builtin(lang) → custom(fallback) → builtin(fallback) → key 本身
   *     - fallbackLang 必须为内置支持的语言，否则会警告并回退到 'zh-cn'
   * 
   * @example
   * // 使用内置语言
   * new AyAccount({ appId: 'xxx', i18n: 'zh-cn' });
   * 
   * // 使用自定义日语，回退到简体中文
   * new AyAccount({
   *   appId: 'xxx',
   *   i18n: {
   *     lang: 'ja',
   *     fallbackLang: 'zh-cn',
   *     translations: {
   *       ja: { 'title.login': 'ログイン', 'btn.login': 'ログイン' }
   *     }
   *   }
   * });
   * 
   * // 支持繁体中文，回退英文
   * new AyAccount({
   *   appId: 'xxx',
   *   i18n: {
   *     lang: 'zh-tw',
   *     fallbackLang: 'en-us',
   *     translations: {
   *       'zh-tw': { 'title.login': '登入' }
   *     }
   *   }
   * });
   * 
   * // 初始化后动态更新语言（使用 changeLanguage 或 updateI18n）
   * const account = new AyAccount({ appId: 'xxx', i18n: 'zh-cn' });
   * account.changeLanguage('ja'); // 需事先在 translations 中提供日语翻译
   * // 或直接更新配置：
   * account.updateI18n({ lang: 'ja', translations: { ja: { ... } } });
   */
  constructor(config) {
    if (!config) throw new Error('[AyAccountSDK] config is required');

    const priv = { appId: config.appId || 'default' };
    privateData.set(this, priv);

    this._iframe = null;
    this._iframeContainer = null;
    this._messageHandler = null;
    this._modalPromise = null;

    // 默认值
    let lang = 'zh-cn';
    let fallbackLang = 'zh-cn';
    let translations = {};

    const i18n = config.i18n;
    if (typeof i18n === 'string') {
      lang = i18n;
    } else if (isPlainObject(i18n)) {
      lang = i18n.lang || 'zh-cn';
      fallbackLang = i18n.fallbackLang || 'zh-cn';
      translations = i18n.translations || {};
    }

    // 确保 fallbackLang 是内置支持的语言（否则警告并修正）
    if (!BUILTIN_TRANSLATIONS[fallbackLang]) {
      console.warn(`[AyAccountSDK] Unsupported fallback language "${fallbackLang}", fallback to "zh-cn"`);
      fallbackLang = 'zh-cn';
    }

    this.lang = lang;
    this.fallbackLang = fallbackLang;
    this.translations = translations;     // 多语言翻译包

    window.__ayt = this._t.bind(this);
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
  #getGeeTestLang() {
    const normalized = this.lang.trim().toLowerCase().replace(/_/g, '-');
    // 精确映射表（键为小写标签，值为 GeeTest 代码）
    const map = {
      // 简体中文
      'zh-cn': 'zho',
      'zh-hans': 'zho',
      'zh-sg': 'zho',
      'zh': 'zho', // 无区域时默认简体
      // 繁体中文（台湾）
      'zh-tw': 'zho-tw',
      'zh-hant': 'zho-tw', // 通常表示繁体，默认为台湾
      'zh-hant-tw': 'zho-tw',
      // 繁体中文（香港）
      'zh-hk': 'zho-hk',
      'zh-mo': 'zho-hk', // 澳门也可使用香港代码
      'zh-hant-hk': 'zho-hk',
      // 英文
      'en': 'eng',
      'en-us': 'eng',
      'en-gb': 'eng',
      'en-au': 'eng',
      'en-ca': 'eng',
      // 日文
      'ja': 'jpn',
      'ja-jp': 'jpn',
      // 印尼语
      'id': 'ind',
      'id-id': 'ind',
      // 韩语
      'ko': 'kor',
      'ko-kr': 'kor',
      // 俄语
      'ru': 'rus',
      'ru-ru': 'rus',
      // 阿拉伯语
      'ar': 'ara',
      'ar-sa': 'ara',
      'ar-eg': 'ara',
      // 西班牙语
      'es': 'spa',
      'es-es': 'spa',
      'es-mx': 'spa',
      // 巴西葡萄牙语
      'pt-br': 'pon',
      // 欧洲葡萄牙语（默认葡萄牙语）
      'pt': 'por',
      'pt-pt': 'por',
      // 法语
      'fr': 'fra',
      'fr-fr': 'fra',
      'fr-ca': 'fra',
      // 德语
      'de': 'deu',
      'de-de': 'deu',
      // 维吾尔语（输入通常为 'ug'，映射到 GeeTest 的 'udm'）
      'ug': 'udm',
      'ug-cn': 'udm',
    };
    if (map[normalized]) {
      return map[normalized];
    }

    const mainLang = normalized.split('-')[0];
    if (map[mainLang]) {
      return map[mainLang];
    }

    return 'eng';
  }
  /**
   * 批量更新国际化配置
   * @param {Object} options
   * @param {string} [options.lang] - 新语言
   * @param {string} [options.fallbackLang] - 新回退语言（需内置支持）
   * @param {Object} [options.translations] - 新翻译包（会与现有合并）
   */
  updateI18n(options) {
    if (!options) return;

    if (options.lang !== undefined) {
      // 可以设置任意语言，不强制校验
      this.lang = options.lang;
    }

    if (options.fallbackLang !== undefined) {
      if (!BUILTIN_TRANSLATIONS[options.fallbackLang]) {
        console.warn(`[AyAccountSDK] Unsupported fallback language "${options.fallbackLang}", ignoring.`);
      } else {
        this.fallbackLang = options.fallbackLang;
      }
    }

    if (options.translations !== undefined) {
      // 合并翻译（浅合并，也可以考虑深合并但通常不必要）
      this.translations = { ...this.translations, ...options.translations };
    }
    if (this._iframe) {
      const translationMap = this._getFullTranslationMap();
      this._iframe.contentWindow.postMessage(JSON.stringify({
        action: 'updateTranslations',
        payload: translationMap
      }), '*');
    }
    // 如果 iframe 已打开，通知 iframe 刷新翻译
    if (this._iframe) {
      try {
        this._iframe.contentWindow.postMessage(
          JSON.stringify({ action: 'changeLanguage' }),
          '*'
        );
      } catch { }
    }
  }
  // 在 AyAccount 类中添加
  _getFullTranslationMap() {
    // 收集所有可能的键（内置语言的所有键 + 自定义翻译的所有键）
    const allKeys = new Set();

    // 内置翻译的键（从当前语言和 fallback 语言中收集）
    const builtinLang = BUILTIN_TRANSLATIONS[this.lang] || {};
    const builtinFallback = BUILTIN_TRANSLATIONS[this.fallbackLang] || {};
    Object.keys(builtinLang).forEach(k => allKeys.add(k));
    Object.keys(builtinFallback).forEach(k => allKeys.add(k));

    // 自定义翻译的键
    const customLang = this.translations[this.lang] || {};
    const customFallback = this.translations[this.fallbackLang] || {};
    Object.keys(customLang).forEach(k => allKeys.add(k));
    Object.keys(customFallback).forEach(k => allKeys.add(k));

    // 构建最终映射表
    const map = {};
    allKeys.forEach(key => {
      map[key] = this._t(key); // 利用现有 _t 方法获取最终值
    });
    return map;
  }
  /**
   * 切换当前界面语言
   * @param {string} lang - 目标语言代码（任意字符串，但需要确保有相应的翻译）
   */
  changeLanguage(lang) {
    this.updateI18n({ lang });
  }

  // ---------- 统一请求方法 ----------
  async _request(path, options = {}) {
    const url = `https://online.undz.cn${path}`;
    const fetchOptions = {
      credentials: 'include', // 自动携带 Cookie
      headers: {
        'Content-Type': 'application/json',
        'X-App-Id': privateData.get(this).appId,
        'X-SDK-VER': VERSION,
        ...options.headers,
      },
      ...options,
    };
    if (options.body) {
      fetchOptions.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(url, fetchOptions);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        // 尝试从响应中提取错误码和消息
        const errorCode = data.error_code || data.code || 'unknown';
        const rawMessage = data.error || data.message || '';
        const banReason = data.ban_reason || '';

        // 优先使用服务端返回的消息，否则翻译
        let message = rawMessage;
        // 如果服务端返回了 error_code，用翻译替换
        if (errorCode !== undefined) {
          const key = `error.${errorCode}`;
          const translated = this._t(key);
          if (translated !== key) {
            message = translated;
          }
        } else if (errorCode === 1017) {
          const baseMsg = this._t('error.1017');
          if (banReason) {
            message = baseMsg + ': ' + banReason;
          } else {
            message = baseMsg;
          }
        } else {
          // 没有错误码，尝试用通用翻译
          const fallbackKey = 'common.unknown_error';
          message = this._t(fallbackKey);
        }
        const err = new Error(message);
        err.error_code = errorCode || 'unknown';
        err.response = response;
        err.data = data;
        throw err;
      }

      // 成功响应，可以翻译成功消息
      if (data.message) {
        // 不修改原数据，但可添加翻译字段，我们返回原始数据
      }
      return data;
    } catch (error) {
      // 网络异常等
      if (error instanceof Error && !error.error_code) {
        const err = new Error(this._t('common.network_error'));
        err.error_code = 'network_error';
        err.originalError = error;
        throw err;
      }
      throw error; // 已包装的错误直接抛出
    }
  }

  // ---------- API 方法 ----------
  /**
     * 打开模态框，等待用户操作直至关闭
     * @param {string} mode 仅用于日志或后续扩展，实际业务由 iframe 内消息决定
     * @returns {Promise<Object|null>} 返回用户信息或 null
     */
  #_openModal(mode) {
    if (this._iframe) {
      throw new Error(this._t('error.modal_already_open') || 'Modal already open');
    }
    if (!AyShowResult || !AyCloseToast) {
      throw new Error(this._t('error.aytoast_not_found') || '找不到AyToast组件，请重新加载');
    }

    return new Promise((resolve, reject) => {
      if (document.body) document.body.style.overflow = 'hidden';
      AyShowResult(this._t('loading'), 'loading', 0)
      const iframediv = document.createElement('div');
      iframediv.className = 'iframe-level-1';
      const iframe = document.createElement('iframe');
      iframe.textContent = '';

      // 根据模式设置不同的 URL 参数
      const baseUrl = isMobile() ? (PRODUCE ? 'https://online.undz.cn/login/mobile.html' : '/login/mobile.html') : (PRODUCE ? 'https://online.undz.cn/login/index.html' : '/login/index.html');
      iframe.src = mode === 'register' ? `${baseUrl}?tab=register` : `${baseUrl}?tab=login`;

      iframe.style.position = "fixed";
      iframe.style.top = "0";
      iframe.style.left = "0";
      iframe.style.width = "100%";
      iframe.style.height = "100%";
      iframe.style.border = "none";
      iframe.style.zIndex = "20000000";
      iframe.style.backgroundColor = "rgba(0, 0, 0, 0.4)";
      iframe.style.opacity = "1";
      iframe.style.pointerEvents = "auto";
      iframe.style.display = "block";


      this._iframe = iframe;
      this._iframeContainer = iframediv;

      let userInfo = null;

      const handler = (event) => {
        if (event.source !== iframe.contentWindow) return;
        try {
          let data = event.data;
          if (typeof data === 'string' && data.startsWith('{')) {
            try { data = JSON.parse(data); } catch (e) { return; }
          }
          if (typeof data !== 'object' || !data.action) return;
          switch (data.action) {
            case 'isReady':
              AyCloseToast();
              const translationMap = this._getFullTranslationMap();
              iframe.contentWindow.postMessage(JSON.stringify({
                action: 'updateTranslations',
                payload: translationMap
              }), '*');
              break;
            case 'closeWindow':
              this.#_closeModal();
              resolve(userInfo);
              break;
            case 'register':
              this.#_register(data.username, data.email, data.password)
                .then((result) => {
                  userInfo = result;
                  iframe.contentWindow.postMessage('registerSuccess', '*');
                })
                .catch((err) => {
                  console.error('注册失败:', err);
                  const errorMsg = err.message || '注册失败';
                  const errorCode = err.error_code || 'unknown';
                  iframe.contentWindow.postMessage(
                    JSON.stringify({
                      action: 'registerFailure',
                      message: errorMsg,
                      code: errorCode
                    }),
                    '*'
                  );
                });
              break;
            case 'login':
              this.#_login(data.username, data.password)
                .then((result) => {
                  userInfo = result;
                  iframe.contentWindow.postMessage('loginSuccess', '*');
                })
                .catch((err) => {
                  console.error('登录失败:', err);
                  const errorMsg = err.message || '登录失败';
                  const errorCode = err.error_code || 'unknown';
                  iframe.contentWindow.postMessage(
                    JSON.stringify({
                      action: 'loginFailure',
                      message: errorMsg,
                      code: errorCode
                    }),
                    '*'
                  );
                });
              break;
            case 'getTranslation':
              const key = data.key;
              const translation = this._t(key);   // 使用实例的翻译方法
              console.log('[SDK] Sending translation:', key, '=>', translation);
              iframe.contentWindow.postMessage(JSON.stringify({
                action: 'translationResponse',
                key: key,
                value: translation
              }), '*');
              break;
            default:
              break;
          }
        } catch (e) {
          // 忽略非 JSON 消息
        }
      };

      this._messageHandler = handler;
      window.addEventListener('message', handler);

      document.body.appendChild(iframediv);
      iframediv.appendChild(iframe);
    });
  }
  _sendTranslationsToIframe() {
    if (!this._iframe) return;
    // 构建完整翻译对象（内置 + 自定义）
    const allTranslations = {
      ...BUILTIN_TRANSLATIONS[this.lang] || {},
      ...BUILTIN_TRANSLATIONS[this.fallbackLang] || {},
      ...this.translations[this.lang] || {},
      ...this.translations[this.fallbackLang] || {}
    };
    // 由于子窗口只关注当前语言，我们只发送当前语言 + fallback 的合并
    // 但更好的做法是发送完整的翻译包，让子窗口自行按优先级查找
    // 这里我们发送全部自定义 + 内置（以当前语言为主）
    const fullTranslation = {
      ...BUILTIN_TRANSLATIONS[this.fallbackLang] || {},
      ...this.translations[this.fallbackLang] || {},
      ...BUILTIN_TRANSLATIONS[this.lang] || {},
      ...this.translations[this.lang] || {}
    };
    this._iframe.contentWindow.postMessage(JSON.stringify({
      action: 'updateTranslations',
      payload: fullTranslation
    }), '*');
  }
  /**
   * 关闭模态框，清理资源
   */
  #_closeModal() {
    if (document.body) document.body.style.overflow = '';
    // 移除 DOM
    if (this._iframeContainer && this._iframeContainer.parentNode) {
      this._iframeContainer.parentNode.removeChild(this._iframeContainer);
    }
    // 移除事件监听
    if (this._messageHandler) {
      window.removeEventListener('message', this._messageHandler);
      this._messageHandler = null;
    }
    // 清空引用
    this._iframe = null;
    this._iframeContainer = null;
  }

  /**
   * 用户注册（弹出模态框）
   * @returns {Promise<Object|null>} 成功返回用户信息，关闭返回 null
   */
  register() {
    return this.#_openModal('register');
  }


  /**
   * 用户注册
   * @param {string} username
   * @param {string} email
   * @param {string} password
   * @returns {Promise}
   */
  async #_register(username, email, password) {
    const self = this;                     // 缓存 this 实例
    const endpoint = '/api/ayonline/register'; // 定义常量

    try {
      // 首次请求，可能返回 1023 触发验证
      const res = await this._request(endpoint, {
        method: 'POST',
        body: { username, email, password },
      });
      return res; // 无需验证，直接返回
    } catch (err) {
      // 3. 判断是否需要人机验证（检查错误码和返回的 gt_code）
      if (err.error_code === 1023 && err.data?.gt_code) {
        const gt_code = err.data.gt_code;
        // 检查极验脚本是否加载
        if (typeof initGeetest4 === 'undefined') {
          throw new Error(this._t('common.unknown_error') + ': Geetest4 not loaded');
        }
        // 4. 返回一个新的 Promise，让外部可以 await 等待验证结果
        return new Promise((resolve, reject) => {

          initGeetest4({
            captchaId: gt_code,
            product: 'bind',
            language: this.#getGeeTestLang()
          }, function (captcha) {
            // 绑定事件
            captcha.onReady(function () {
              removeUselessTestLogo();
              captcha.showBox(); // 显示验证码
            }).onSuccess(async function () {
              const result = captcha.getValidate();
              if (!result) {
                alert(self._t('common.complete_verification'));
                reject(new Error(self._t('common.complete_verification')));
                return;
              }
              result.captcha_id = gt_code;

              // 5. 带上验证结果重新请求注册（这里使用 self 和 endpoint）
              try {
                const retryRes = await self._request(endpoint, {
                  method: 'POST',
                  body: {
                    username,
                    email,
                    password,
                    gt: utf8ToBase64(JSON.stringify(result))
                  },
                });
                resolve(retryRes); // 成功返回
              } catch (retryErr) {
                reject(retryErr);  // 失败抛出
              } finally {
                if (captcha && typeof captcha.destroy === 'function') {
                  captcha.destroy();
                  captcha = null;
                }
              }
            }).onError(function (error) {
              reject(new Error('Geetest Error: ' + JSON.stringify(error)));
            }).onClose(function () {
              const cancelErr = new Error(self._t('error.1024'));
              cancelErr.error_code = 1024;
              reject(cancelErr);
            });
          });
        });
      }
      // 其他错误直接抛出
      throw err;
    }
  }
  /**
  * 用户登录（弹出模态框）
  * @returns {Promise<Object|null>} 成功返回用户信息，关闭返回 null
  */
  login() {
    return this.#_openModal('login');
  }
  /**
   * 用户登录
   * @param {string} usernameOrEmail
   * @param {string} password
   * @returns {Promise<{ user: {id, username, email}, code: number }>}
   */
  async #_login(usernameOrEmail, password) {
    const self = this;                     // 缓存 this 实例
    const endpoint = '/api/ayonline/login'; // 定义常量

    try {
      const res = await this._request(endpoint, {
        method: 'POST',
        body: { username: usernameOrEmail, email: usernameOrEmail, password },
      });
      return res;
    } catch (err) {
      // 判断是否需要人机验证（检查错误码和返回的 gt_code）
      if (err.error_code === 1023 && err.data?.gt_code) {
        const gt_code = err.data.gt_code;
        // 检查极验脚本是否加载
        if (typeof initGeetest4 === 'undefined') {
          throw new Error(this._t('common.unknown_error') + ': Geetest4 not loaded');
        }
        // 返回一个新的 Promise，让外部可以 await 等待验证结果
        return new Promise((resolve, reject) => {
          initGeetest4({
            captchaId: gt_code,
            product: 'bind',
            language: this.#getGeeTestLang()
          }, function (captcha) {
            // 绑定事件
            captcha.onReady(function () {
              removeUselessTestLogo();
              captcha.showBox(); // 显示验证码
            }).onSuccess(async function () {
              const result = captcha.getValidate();
              if (!result) {
                alert(self._t('common.complete_verification'));
                reject(new Error(self._t('common.complete_verification')));
                return;
              }
              result.captcha_id = gt_code;

              // 带上验证结果重新请求登录（这里使用 self 和 endpoint）
              try {
                const retryRes = await self._request(endpoint, {
                  method: 'POST',
                  body: { username: usernameOrEmail, email: usernameOrEmail, password, gt: utf8ToBase64(JSON.stringify(result)) },
                });
                resolve(retryRes); // 成功返回

              } catch (retryErr) {
                reject(retryErr);  // 失败抛出

              } finally {
                if (captcha && typeof captcha.destroy === 'function') {
                  captcha.destroy();
                  captcha = null;
                }
              }
            }).onError(function (error) {
              reject(new Error('Geetest Error: ' + JSON.stringify(error)));
            }).onClose(function () {
              // 用户主动关闭验证码 → 视为取消
              const cancelErr = new Error(self._t('error.1024'));
              cancelErr.error_code = 1024;
              reject(cancelErr);
            });
          });
        });
      }
      // 其他错误直接抛出
      throw err;
    }
  }

  /**
   * 用户登出
   * @returns {Promise<Object>}
   */
  logout() {
    return this._request('/api/ayonline/logout', {
      method: 'POST',
    });
  }

  /**
   * 测试服务端
   * @return boolen
   */
  async testServer() {
    try {
      await this._request('/api/ayonline/test', {
        method: 'POST',
      });
      return { success: true };
    } catch (err) {
      return { success: false, err };
    }
  }

  /**
   * 验证当前 access_token 是否有效
   * @returns {Promise<{ valid: boolean, user?: {id, username, email} }>}
   */
  verify() {
    return this._request('/api/ayonline/verify', {
      method: 'GET',
    });
  }

  /**
   * 刷新 access_token（使用 refresh_token Cookie）
   * @returns {Promise<Object>}
   */
  refresh() {
    return this._request('/api/ayonline/refresh', {
      method: 'POST',
    });
  }

  /**
   * 修改密码（会撤销所有 refresh_token）
   * @param {string} oldPassword
   * @param {string} newPassword
   * @returns {Promise<Object>}
   */
  async changePassword(oldPassword, newPassword) {
    const self = this;                     // 缓存 this 实例
    const endpoint = '/api/ayonline/change-password'; // 定义常量

    try {
      const res = await this._request(endpoint, {
        method: 'POST',
        body: { oldPassword, newPassword },
      });
      return res;
    } catch (err) {
      // 判断是否需要人机验证（检查错误码和返回的 gt_code）
      if (err.error_code === 1023 && err.data?.gt_code) {
        const gt_code = err.data.gt_code;
        // 检查极验脚本是否加载
        if (typeof initGeetest4 === 'undefined') {
          throw new Error(this._t('common.unknown_error') + ': Geetest4 not loaded');
        }
        // 返回一个新的 Promise，让外部可以 await 等待验证结果
        return new Promise((resolve, reject) => {
          initGeetest4({
            captchaId: gt_code,
            product: 'bind',
            language: this.#getGeeTestLang()
          }, function (captcha) {
            // 绑定事件
            captcha.onReady(function () {
              removeUselessTestLogo();
              captcha.showBox(); // 显示验证码
            }).onSuccess(async function () {
              const result = captcha.getValidate();
              if (!result) {
                alert(self._t('common.complete_verification'));
                reject(new Error(self._t('common.complete_verification')));
                return;
              }
              result.captcha_id = gt_code;

              // 带上验证结果重新请求注册（这里使用 self 和 endpoint）
              try {
                const retryRes = await self._request(endpoint, {
                  method: 'POST',
                  body: { oldPassword, newPassword, gt: utf8ToBase64(JSON.stringify(result)) },
                });
                resolve(retryRes); // 成功返回

              } catch (retryErr) {
                reject(retryErr);  // 失败抛出

              } finally {
                if (captcha && typeof captcha.destroy === 'function') {
                  captcha.destroy();
                  captcha = null;
                }
              }
            }).onError(function (error) {
              reject(new Error('Geetest Error: ' + JSON.stringify(error)));
            }).onClose(function () {
              const cancelErr = new Error(self._t('error.1024'));
              cancelErr.error_code = 1024;
              reject(cancelErr);
            });
          });
        });
      }
      // 其他错误直接抛出
      throw err;
    }
  }
}

function createAyAccount(config) {
  return new AyAccount(config);
}

// 暴露全局变量
if (typeof window !== 'undefined') {
  window.AyAccount = AyAccount;
  window.createAyAccount = createAyAccount;
}
