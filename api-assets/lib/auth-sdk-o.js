'v1.4.1 AyAccountSDK';

const VERSION = '1.4.1';
const PRODUCE = false;
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
    'error.1018': '服务器错误',
    'error.1019': 'appId 无效',
    'error.1020': '验证码校验失败',
    'error.1021': '验证ID无效',
    'error.1022': '验证码二次校验失败',
    'error.1023': '需要通过人机验证',
    'error.1024': '您已取消验证',
    'error.modal_already_open': '登录窗口已打开，请勿重复操作',
    'error.aytoast_not_found': 'AyToast 组件未成功加载，请您重载',
    'common.network_error': '网络请求失败，请检查网络',
    'common.unknown_error': '未知错误，请稍后重试',
    'common.success': '操作成功',
    'common.complete_verification': '请完成验证',
    'login.success': '登录成功',
    'logout.success': '已登出',
    'register.success': '注册成功',
    'refresh.success': '令牌已刷新',
    'loading': '加载中...',
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
    'login.success': 'Login successful',
    'logout.success': 'Logged out',
    'register.success': 'Registration successful',
    'refresh.success': 'Token refreshed',
    'loading': 'loading...',
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
    'common.success': '操作成功',
    'login.success': '登錄成功',
    'logout.success': '已登出',
    'register.success': '註冊成功',
    'refresh.success': '令牌已刷新',
    'loading': '載入中...',
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
   * @param {string} config.appId - 应用标识（目前仅用于日志/统计）
   * @param {string|Object} config.i18n - 语言配置
   *   - 字符串：'zh-cn' | 'en-us' | 'zh-hk'
   *   - 对象：{ lang?: string, translations?: Record<string, string> }
   *     translations 中的键会覆盖内置翻译（所有语言共享）
   */
  constructor(config) {

    if (!config) {
      throw new Error('[AyAccountSDK] config is required');
    }
    this.appId = config.appId || 'default';
    this._iframe = null;            // 当前 iframe 元素
    this._iframeContainer = null;   // 包裹 iframe 的 div
    this._messageHandler = null;    // 绑定的消息监听函数（用于移除）
    this._modalPromise = null;      // 用于防止并发调用（可选）
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

    // 校验语言是否支持
    if (!BUILTIN_TRANSLATIONS[lang]) {
      console.warn(`[AyAccountSDK] Unsupported language "${lang}", fallback to "zh-cn"`);
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

    return key; // 未找到返回键名，这是想要的效果
  }

  /**
   * 切换当前语言
   * @param {string} lang - 'zh-cn' | 'en-us' | 'zh-hk'
   */
  changeLanguage(lang) {
    if (!BUILTIN_TRANSLATIONS[lang]) {
      console.warn(`[AyAccountSDK] Unsupported language "${lang}", ignoring`);
      return;
    }
    this.lang = lang;
  }

  // ---------- 统一请求方法 ----------
  async _request(path, options = {}) {
    const url = `https://online.undz.cn${path}`;
    const fetchOptions = {
      credentials: 'include', // 自动携带 Cookie
      headers: {
        'Content-Type': 'application/json',
        'X-App-Id': this.appId,
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
        // 优先使用服务端返回的消息，否则翻译
        let message = rawMessage;
        // 如果服务端返回了 error_code，用翻译替换
        if (errorCode !== undefined) {
          const key = `error.${errorCode}`;
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
  _openModal(mode) {
    if (this._iframe) {
      throw new Error(this._t('error.modal_already_open') || 'Modal already open');
    }
    if (!AyShowResult || !AyCloseToast) {
      throw new Error(this._t('error.aytoast_not_found') || '找不到AyToast组件，请重新加载');
    }

    return new Promise((resolve, reject) => {
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
      iframe.style.transition = "background-color 200ms linear";
      iframe.style.display = "block";


      this._iframe = iframe;
      this._iframeContainer = iframediv;

      let userInfo = null;

      const handler = (event) => {
        if (event.source !== iframe.contentWindow) return;
        try {
          const data = JSON.parse(event.data);
          switch (data.action) {
            case 'isReady':
              AyCloseToast();
              break;
            case 'closeWindow':
              this._closeModal();
              resolve(userInfo);
              break;
            case 'register':
              this._register(data.username, data.email, data.password)
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
              this._login(data.username, data.password)
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

  /**
   * 关闭模态框，清理资源
   */
  _closeModal() {
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
    return this._openModal('register');
  }


  /**
   * 用户注册
   * @param {string} username
   * @param {string} email
   * @param {string} password
   * @returns {Promise}
   */
  async _register(username, email, password) {
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
            product: 'bind'
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
    return this._openModal('login');
  }
  /**
   * 用户登录
   * @param {string} usernameOrEmail
   * @param {string} password
   * @returns {Promise<{ user: {id, username, email}, code: number }>}
   */
  async _login(usernameOrEmail, password) {
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
            product: 'bind'
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
            product: 'bind'
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
