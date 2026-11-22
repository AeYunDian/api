export const config = {
  /* ---------------------------------------------------------------- *
   * 域名
   * ---------------------------------------------------------------- */

  /** 默认主域（不传 ?d= 时使用） */
  baseDomain: 'lanzouq.com',

  /**
   * ?d= 允许的备用主域。蓝奏云被 DNS 污染时会轮换这些域名。
   * 键是小写的 d 值，值是完整主域；不在表里的一律 BAD_DOMAIN。
   */
  domains: {
    x: 'lanzoux.com',
    i: 'lanzoui.com',
    w: 'lanzouw.com',
    y: 'lanzouy.com',
    v: 'lanzouv.com',
    j: 'lanzouj.com',
    t: 'lanzout.com',
    q: 'lanzouq.com',
    p: 'lanzoup.com',
    0: 'lanzou.com',
  },

  /* ---------------------------------------------------------------- *
   * 请求
   * ---------------------------------------------------------------- */

  /** 桌面 UA：分享页 / 密码页 / 接口 / 直链 */
  userAgent:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) ' +
    'Chrome/126.0.0.0 Safari/537.36',

  /** 移动端 UA：文件夹列表接口必须用它，换桌面 UA 结构会变 */
  mobileUserAgent:
    'Mozilla/5.0 (Linux; U; Android 8.1.0; zh-cn; Redmi 6 Pro Build/OPM1.171019.019) ' +
    'AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/61.0.3163.128 ' +
    'Mobile Safari/537.36 XiaoMi/MiuiBrowser/9.8.7',

  /** 单次上游请求超时（毫秒） */
  requestTimeoutMs: 15_000,

  /** ?p / ?ps 下载文件的超时（毫秒） */
  proxyTimeoutMs: 120_000,

  /** 直链兜底主机：非标准端口 + 直连，用来绕开 DNS 污染 */
  fallbackHost: 'https://developer2oss.lanzouc.com:661',

  /** 文件夹最多翻多少页 */
  maxFolderPages: 50,

  /* ---------------------------------------------------------------- *
   * 查询参数别名
   * ---------------------------------------------------------------- */

  params: {
    /** 提取密码 */
    password: ['q', 'pw'],
    /** 返回 JSON 而不是 302 */
    json: ['json'],
    /** 由 Worker 下载后 200 返回 */
    proxy: ['p', 'ps'],
    /** 强制按文件夹解析 */
    folder: ['f', 'folder'],
    /** 直链追加普通下载通道参数 */
    toolsdown: ['td', 'toolsdown'],
    /** 指定备用主域 */
    domain: ['d', 'D'],
  },

  /** toolsdown 追加到直链上的参数名 */
  toolsdownQuery: 'toolsdown',

  /* ---------------------------------------------------------------- *
   * 响应
   * ---------------------------------------------------------------- */

  cors: {
    allowOrigin: '*',
  },
};

export default config;
