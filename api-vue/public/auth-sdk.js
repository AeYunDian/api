// auth-sdk.js
const ALLOWED_APP_IDS = ['chat', 'api', 'mainwebsite'];
const BUILTIN_TRANSLATIONS = {
  'zh-cn': {
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
    'common.network_error': '网络请求失败，请检查网络',
    'common.unknown_error': '未知错误，请稍后重试',
    'common.success': '操作成功',
    'login.success': '登录成功',
    'logout.success': '已登出',
    'register.success': '注册成功',
    'refresh.success': '令牌已刷新',
    'password.change.success': '密码已修改，请重新登录',
  },
  'en-us': {
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
    'common.network_error': 'Network request failed, please check your connection',
    'common.unknown_error': 'Unknown error, please try again later',
    'common.success': 'Operation successful',
    'login.success': 'Login successful',
    'logout.success': 'Logged out',
    'register.success': 'Registration successful',
    'refresh.success': 'Token refreshed',
    'password.change.success': 'Password changed, please login again',
  },
  'zh-hk': {
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
    'common.network_error': '網絡請求失敗，請檢查網絡',
    'common.unknown_error': '未知錯誤，請稍後重試',
    'common.success': '操作成功',
    'login.success': '登錄成功',
    'logout.success': '已登出',
    'register.success': '註冊成功',
    'refresh.success': '令牌已刷新',
    'password.change.success': '密碼已修改，請重新登錄',
  },
};

// ---------- 工具函数 ----------
function isPlainObject(obj) {
  return Object.prototype.toString.call(obj) === '[object Object]';
}

// ---------- AuthClient 类 ----------
class AuthClient {
  /**
   * @param {Object} config
   * @param {string} config.baseURL - 认证服务根地址，如 'https://online.undz.cn'
   * @param {string} config.appId - 应用标识（目前仅用于日志/统计）
   * @param {string|Object} config.i18n - 语言配置
   *   - 字符串：'zh-cn' | 'en-us' | 'zh-hk'
   *   - 对象：{ lang?: string, translations?: Record<string, string> }
   *     translations 中的键会覆盖内置翻译（所有语言共享）
   */
  constructor(config) {
    if (!config || !config.baseURL) {
      throw new Error('[AuthClient] baseURL is required');
    }
    this.baseURL = config.baseURL.replace(/\/+$/, '');
    this.appId = config.appId || 'default';

    // 解析 i18n
    let lang = 'zh-cn';
    let customTranslations = {};
    const i18n = config.i18n;
    if (typeof i18n === 'string') {
      lang = i18n;
    } else if (isPlainObject(i18n)) {
      lang = i18n.lang || 'zh-cn';
      customTranslations = i18n.translations || {};
    }
    if (!ALLOWED_APP_IDS.includes(this.appId)) {
      throw new Error(
        `[AuthClient] Invalid appId "${this.appId}"`
      );
    }
    // 校验语言是否支持
    if (!BUILTIN_TRANSLATIONS[lang]) {
      console.warn(`[AuthClient] Unsupported language "${lang}", fallback to "zh-cn"`);
      lang = 'zh-cn';
    }
    this.lang = lang;
    // 自定义翻译（全局覆盖）
    this.customTranslations = customTranslations;
  }

  // ---------- 翻译方法 ----------
  _t(key) {
    // 优先级：自定义 > 当前语言内置 > 英文内置（作为最终fallback）
    const custom = this.customTranslations[key];
    if (custom !== undefined) return custom;

    const langDict = BUILTIN_TRANSLATIONS[this.lang];
    if (langDict && langDict[key] !== undefined) return langDict[key];

    const fallbackDict = BUILTIN_TRANSLATIONS['en-us'];
    if (fallbackDict && fallbackDict[key] !== undefined) return fallbackDict[key];

    return key; // 未找到返回键名
  }

  /**
   * 切换当前语言
   * @param {string} lang - 'zh-cn' | 'en-us' | 'zh-hk'
   */
  changeLanguage(lang) {
    if (!BUILTIN_TRANSLATIONS[lang]) {
      console.warn(`[AuthClient] Unsupported language "${lang}", ignoring`);
      return;
    }
    this.lang = lang;
  }

  // ---------- 统一请求方法 ----------
  async _request(path, options = {}) {
    const url = `${this.baseURL}${path}`;
    const fetchOptions = {
      credentials: 'include', // 自动携带 Cookie
      headers: {
        'Content-Type': 'application/json',
        'X-App-Id': this.appId,
        ...(options.headers || {}),
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
        // 优先使用服务端返回的消息，否则翻译
        let message = rawMessage;
        // 如果服务端返回了 error_code，用翻译替换
        if (data.error_code !== undefined) {
          const key = `error.${data.error_code}`;
          const translated = this._t(key);
          if (translated !== key) {
            message = translated;
          }
        } else {
          // 没有错误码，尝试用通用翻译
          const fallbackKey = 'common.unknown_error';
          message = this._t(fallbackKey);
        }
        const err = new Error(message);
        err.error_code = data.error_code || 'unknown';
        err.response = response;
        err.data = data;
        throw err;
      }

      // 成功响应，可以翻译成功消息（如果有）
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
   * 用户注册
   * @param {string} username
   * @param {string} email
   * @param {string} password
   * @returns {Promise<Object>}
   */
  register(username, email, password) {
    return this._request('/api/ayonline/register', {
      method: 'POST',
      body: { username, email, password },
    });
  }

  /**
   * 用户登录
   * @param {string} usernameOrEmail
   * @param {string} password
   * @returns {Promise<{ user: {id, username, email}, code: number }>}
   */
  login(usernameOrEmail, password) {
    return this._request('/api/ayonline/login', {
      method: 'POST',
      body: { username: usernameOrEmail, email: usernameOrEmail, password },
    });
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
  changePassword(oldPassword, newPassword) {
    return this._request('/api/ayonline/change-password', {
      method: 'POST',
      body: { oldPassword, newPassword },
    });
  }
}

// ---------- 工厂函数 ----------
export function createAuthClient(config) {
  return new AuthClient(config);
}

// 如果使用 <script> 标签，暴露全局变量
if (typeof window !== 'undefined') {
  window.AuthClient = AuthClient;
  window.createAuthClient = createAuthClient;
}