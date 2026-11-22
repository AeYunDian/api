import { config } from './config.js';

/**
 * 蓝奏云解析核心（新版 ajaxfile.php / filemoreajax.php 模板）。
 *
 * 纯 fetch 实现，无第三方依赖，可直接跑在 Cloudflare Workers（ESM，无构建步骤）。
 * 所有可调项都在 config.js。
 * 流程：
 *   文件：GET 分享页 → 抠 iframe → GET /fn?token → 抠 sign/websignkey/domain1/domain2
 *         → POST downprocess → dom + /file/ + url → 302 的 Location 即直链
 *   文件夹：GET 文件夹页（移动端 UA）→ 抠 data:{...} 里的 lx/fid/uid/puid/t/k
 *           → POST filemoreajax.php，pg++ 翻页，zt=4 表示到底
 */

/**
 * @typedef {Object} ResolvedFile
 * @property {string} link CDN 直链（带时效签名，拿到就要用）
 * @property {string} name 文件名
 * @property {string} size 文件大小，文件接口通常不给，留空
 *
 * @typedef {Object} FolderFile
 * @property {string} id
 * @property {string} name
 * @property {string} size
 * @property {string} time
 */

export class LanzouError extends Error {
  /**
   * @param {string} message
   * @param {string} code
   * @param {number} [status]
   */
  constructor(message, code, status = 502) {
    super(message);
    this.name = 'LanzouError';
    this.code = code;
    this.status = status;
  }
}

const UA_DESKTOP = config.userAgent;
const UA_MOBILE = config.mobileUserAgent;
const FALLBACK_HOST = config.fallbackHost;
const TIMEOUT_MS = config.requestTimeoutMs;
const ACCEPT_LANGUAGE = config.acceptLanguage;

/* ------------------------------------------------------------------ *
 * 文件：公开入口
 * ------------------------------------------------------------------ */

/**
 * @param {string} shareUrl
 * @param {string} [password]
 * @param {boolean} [toolsdown]
 * @returns {Promise<ResolvedFile>}
 */
export async function resolveFile(shareUrl, password, toolsdown = false) {
  const { text: html, finalUrl } = await getText(shareUrl);
  const iframeSrc = findIframeSrc(html);

  // 没有 iframe = 密码页
  if (!iframeSrc) {
    if (!password) {
      throw new LanzouError('需要提取密码', 'PASSWORD_REQUIRED', 403);
    }
    const file = await resolveByPassword(html, finalUrl, password);
    return applyToolsdown(file, toolsdown);
  }

  const iframeUrl = new URL(iframeSrc, finalUrl).toString();
  const { text: iframeHtml } = await getText(iframeUrl, finalUrl);

  const sign = grab(iframeHtml, /wp_sign\s*=\s*'([^']+)'/i);
  if (!sign) {
    throw new LanzouError('页面结构已变更：未找到 wp_sign', 'TEMPLATE_CHANGED', 502);
  }

  const websignkey = grab(iframeHtml, /ajaxdata\s*=\s*'([^']*)'/i) ?? '';
  const domain1 = grab(iframeHtml, /domain1\s*=\s*'([^']*)'/i);
  const domain2 = grab(iframeHtml, /domain2\s*=\s*'([^']*)'/i);
  const killDns = (grab(iframeHtml, /kdns\s*=\s*(\d+)/i) ?? '1') !== '0';

  const endpoints = [domain1, domain2]
    .map((value) => value?.trim())
    .filter((value) => !!value);

  const payload = await downProcess(
    endpoints,
    {
      action: 'downprocess',
      websignkey,
      signs: websignkey,
      sign,
      websign: '',
      ves: '1',
    },
    killDns,
    iframeUrl,
  );

  const link = await resolveLocation(buildCandidates(payload, killDns), iframeUrl);

  return applyToolsdown({ link, name: nameFromLink(link, '文件'), size: '' }, toolsdown);
}

/* ------------------------------------------------------------------ *
 * 文件：有密码分支
 * ------------------------------------------------------------------ */

/**
 * 密码页的真实逻辑：
 *   POST https://apifile.woozooo.com/ajaxfile.php?file=<fid>
 *   data : { 'action':'downprocess', 'sign':isngis, 'kd':kdns, 'p':密码 }
 * 注意是 p 不是 pwd，接口是 ajaxfile.php 不是 ajaxm.php。
 *
 * @param {string} shareHtml
 * @param {string} shareUrl
 * @param {string} password
 * @returns {Promise<ResolvedFile>}
 */
async function resolveByPassword(shareHtml, shareUrl, password) {
  const fid =
    grab(shareHtml, /var\s+fid\s*=\s*(\d+)/i) ??
    grab(shareHtml, /ajax(?:m|file)\.php\?file=(\d+)/i);

  if (!fid) throw new LanzouError('密码页里找不到 fid', 'TEMPLATE_CHANGED', 502);

  const block = dataBlock(shareHtml, 'sign');
  if (!block) throw new LanzouError('密码页里找不到提交参数', 'TEMPLATE_CHANGED', 502);

  const sign = resolveToken(block, shareHtml, 'sign');
  if (!sign) throw new LanzouError('密码页里找不到 sign 令牌', 'TEMPLATE_CHANGED', 502);

  const kd = resolveToken(block, shareHtml, 'kd') ?? '1';

  const apiPath =
    grab(shareHtml, /url\s*:\s*'([^']*ajaxfile\.php[^']*)'/i) ?? `/ajaxfile.php?file=${fid}`;
  const api = new URL(apiPath, shareUrl).toString();

  const payload = await postJson(api, { action: 'downprocess', sign, kd, p: password }, shareUrl);

  if (String(payload?.zt) !== '1') {
    throw new LanzouError(`无法下载：${rejectionMessage(payload)}`, 'DOWNLOAD_REJECTED', 403);
  }

  const link = await resolveLocation(buildCandidates(payload, kd !== '0'), shareUrl);
  const name =
    typeof payload?.inf === 'string' && payload.inf.length > 0
      ? payload.inf
      : nameFromLink(link, '文件');

  return { link, name, size: '' };
}

/* ------------------------------------------------------------------ *
 * 文件夹
 * ------------------------------------------------------------------ */

/**
 * @param {string} folderUrl
 * @param {string} [password]
 * @param {number} [maxPages]
 * @returns {Promise<FolderFile[]>}
 */
export async function resolveFolder(folderUrl, password, maxPages = config.maxFolderPages) {
  const { text: html, finalUrl } = await getText(folderUrl, undefined, UA_MOBILE);
  const block = dataBlock(html, 'fid');

  if (!block) {
    throw new LanzouError('文件夹页里找不到 filemoreajax 的提交参数', 'TEMPLATE_CHANGED', 502);
  }

  const fid = field(block, 'fid');
  if (!fid) throw new LanzouError('文件夹页里找不到 fid', 'TEMPLATE_CHANGED', 502);

  const lx = field(block, 'lx') ?? '0';
  const uid = field(block, 'uid') ?? '';
  const puid = field(block, 'puid') ?? '';
  const rep = field(block, 'rep') ?? '0';
  const up = field(block, 'up') ?? '1';

  const t = resolveToken(block, html, 't');
  const k = resolveToken(block, html, 'k');
  if (!t || !k) {
    throw new LanzouError('文件夹页里找不到 t/k 令牌', 'TEMPLATE_CHANGED', 502);
  }

  const ajaxPath =
    grab(html, /url\s*:\s*'([^']*filemoreajax[^']*)'/i) ?? `/filemoreajax.php?file=${fid}`;
  const api = new URL(ajaxPath, finalUrl).toString();

  const firstPage = Number.parseInt(grab(html, /pgs\s*=\s*(\d+)/i) ?? '1', 10) || 1;
  const files = [];

  for (let page = firstPage; page < firstPage + maxPages; page++) {
    const payload = await postJson(
      api,
      {
        lx,
        fid,
        uid,
        puid,
        pg: String(page),
        rep,
        t,
        k,
        up,
        ...(password ? { pwd: password } : {}),
      },
      finalUrl,
    );

    if (String(payload?.zt) !== '1') {
      // 首页就失败 = 密码错 / 令牌过期；后面页失败 = 已经到底（实测 zt=4）
      if (page === firstPage) {
        throw new LanzouError(
          `文件夹接口拒绝：${rejectionMessage(payload)}`,
          'FOLDER_REJECTED',
          403,
        );
      }
      break;
    }

    const items = Array.isArray(payload?.text) ? payload.text : [];
    if (items.length === 0) break;

    for (const item of items) {
      files.push({
        id: String(item?.id ?? ''),
        name: String(item?.name_all ?? item?.name ?? ''),
        size: String(item?.size ?? ''),
        time: String(item?.time ?? ''),
      });
    }
  }

  return files;
}

/* ------------------------------------------------------------------ *
 * 换地址（downprocess）
 * ------------------------------------------------------------------ */

/**
 * @param {string[]} endpoints
 * @param {Record<string, string>} form
 * @param {boolean} preferKd
 * @param {string} referer
 * @returns {Promise<any>}
 */
async function downProcess(endpoints, form, preferKd, referer) {
  if (endpoints.length === 0) {
    throw new LanzouError('页面里没有 downprocess 接口地址', 'TEMPLATE_CHANGED', 502);
  }

  const errors = [];
  const kdRounds = preferKd ? ['1', '0'] : ['0', '1'];

  for (const kd of kdRounds) {
    let answered = false;

    for (const endpoint of endpoints) {
      try {
        const payload = await postJson(endpoint, { ...form, kd }, referer);
        answered = true;

        if (String(payload?.zt) === '1') return payload;

        errors.push(rejectionMessage(payload));
      } catch (err) {
        errors.push(err instanceof Error ? err.message : String(err));
      }
    }

    // 一轮下来全是网络错误/超时（没有任何 HTTP 响应），再来一轮只会更慢
    if (!answered) break;
  }

  throw new LanzouError(
    `换地址失败：${errors.join(' | ').slice(0, 300)}`,
    'DOWNPROCESS_FAILED',
    502,
  );
}

/**
 * dom + "/file/" + url，外加一条绕过 DNS 污染的备用主机
 * @param {any} payload
 * @param {boolean} killDns
 * @returns {string[]}
 */
function buildCandidates(payload, killDns) {
  const dom = typeof payload?.dom === 'string' ? payload.dom : '';
  const path = typeof payload?.url === 'string' ? payload.url : '';

  if (!path) throw new LanzouError('接口没有返回 url 字段', 'BAD_RESPONSE', 502);
  if (/^https?:\/\//i.test(path)) return [path];

  const join = (host, value) => `${host.replace(/\/+$/, '')}/file/${value.replace(/^\/+/, '')}`;

  const candidates = [];
  if (!killDns) candidates.push(join(FALLBACK_HOST, path));
  if (dom) candidates.push(join(dom, path));

  const fallback = join(FALLBACK_HOST, path);
  if (!candidates.includes(fallback)) candidates.push(fallback);

  return candidates;
}

/* ------------------------------------------------------------------ *
 * 从下载页拿 302 的 Location
 * ------------------------------------------------------------------ */

/**
 * 拿 302 的 Location。
 *
 * 两个候选（`dom` 主机、`:661` 兜底主机）**并发竞速**，谁先给出直链用谁：
 * - 顺序试的话，一个候选挂住就要白等一整个超时，再叠上下一个；
 * - 实测 `developer4.lanrar.com` 基本只回挑战页，真正能用的是 `:661`，
 *   而这个非标端口从 Cloudflare 出口偶尔会卡住，竞速能把最坏等待压到一个超时。
 *
 * @param {string[]} candidates
 * @param {string} referer
 * @returns {Promise<string>}
 */
async function resolveLocation(candidates, referer) {
  const headers = {
    'user-agent': UA_DESKTOP,
    accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'accept-language': ACCEPT_LANGUAGE,
    referer,
  };

  const attempt = async (candidate) => {
    const res = await fetch(candidate, {
      method: 'GET',
      redirect: 'manual',
      headers,
      signal: timeoutSignal(TIMEOUT_MS),
    });

    const status = res.status;
    const location = res.headers.get('location');
    const contentType = (res.headers.get('content-type') ?? '').toLowerCase();

    await discard(res);

    // 正常情况：302 + Location
    if (status >= 300 && status < 400 && location) {
      return new URL(location, candidate).toString();
    }

    // 没有重定向、直接给文件（非 HTML）→ 这个地址本身就是直链
    if (status === 200 && contentType.length > 0 && !contentType.includes('text/html')) {
      return candidate;
    }

    throw new Error(
      `${hostOf(candidate)} → HTTP ${status}${contentType.includes('text/html') ? '（挑战页）' : ''}`,
    );
  };

  try {
    return await Promise.any(candidates.map(attempt));
  } catch (err) {
    const reasons =
      err && typeof err === 'object' && Array.isArray(err.errors)
        ? err.errors.map(errText)
        : [errText(err)];

    const failed = reasons.join(' | ').slice(0, 300);

    if (reasons.length > 0 && reasons.every(isTimeoutText)) {
      throw new LanzouError(`获取直链超时：${failed}`, 'TIMEOUT', 504);
    }

    throw new LanzouError(`未能获取直链：${failed}`, 'NO_LOCATION', 502);
  }
}

/** 不读完 body，直接丢弃连接 */
async function discard(res) {
  try {
    await res.body?.cancel();
  } catch {
    /* 忽略 */
  }
}

/** @param {string} url */
function hostOf(url) {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

/** @param {unknown} err */
function errText(err) {
  return err instanceof Error ? err.message : String(err);
}

/** @param {string} text */
function isTimeoutText(text) {
  return text === 'TimeoutError' || /aborted due to timeout|timed? ?out/i.test(text);
}

/** @param {unknown} err */
export function isTimeoutError(err) {
  const name = err && typeof err === 'object' && 'name' in err ? String(err.name) : '';
  const message = err && typeof err === 'object' && 'message' in err ? String(err.message) : '';
  return name === 'TimeoutError' || name === 'AbortError' || /aborted due to timeout/i.test(message);
}

/* ------------------------------------------------------------------ *
 * HTTP
 * ------------------------------------------------------------------ */

/**
 * @param {string} url
 * @param {string} [referer]
 * @param {string} [ua]
 * @returns {Promise<{ text: string, finalUrl: string }>}
 */
async function getText(url, referer, ua = UA_DESKTOP) {
  const res = await fetch(url, {
    redirect: 'follow',
    headers: {
      'user-agent': ua,
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'accept-language': ACCEPT_LANGUAGE,
      ...(referer ? { referer } : {}),
    },
    signal: timeoutSignal(TIMEOUT_MS),
  });

  if (!res.ok) {
    throw new LanzouError(`上游返回 HTTP ${res.status}`, 'UPSTREAM_HTTP', 502);
  }

  return { text: await res.text(), finalUrl: res.url || url };
}

/**
 * @param {string} url
 * @param {Record<string, string>} form
 * @param {string} [referer]
 * @returns {Promise<any>}
 */
async function postJson(url, form, referer) {
  const res = await fetch(url, {
    method: 'POST',
    body: new URLSearchParams(form),
    redirect: 'follow',
    headers: {
      'user-agent': UA_DESKTOP,
      accept: 'application/json, text/javascript, */*; q=0.01',
      'x-requested-with': 'XMLHttpRequest',
      'accept-language': ACCEPT_LANGUAGE,
      ...(referer ? { referer } : {}),
    },
    signal: timeoutSignal(TIMEOUT_MS),
  });

  const text = await res.text();
  const payload = parseJsonLoose(text);

  if (payload === null) {
    const contentType = res.headers.get('content-type') ?? '无 content-type';
    throw new LanzouError(
      `接口返回无法解析（${contentType}，HTTP ${res.status}）：${snippet(text)}`,
      'BAD_RESPONSE',
      502,
    );
  }

  return payload;
}

/**
 * 宽松解析：上游有时会带 UTF-8 BOM，或在 JSON 前后塞网关日志/挑战脚本，
 * 直接 JSON.parse 会整串失败，所以先剥 BOM，再兜底抠第一段 {...}。
 *
 * @param {string} text
 * @returns {any | null}
 */
function parseJsonLoose(text) {
  const cleaned = text.replace(/^\uFEFF/, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    /* 继续尝试下面的兜底 */
  }

  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');

  if (start >= 0 && end > start) {
    try {
      return JSON.parse(cleaned.slice(start, end + 1));
    } catch {
      /* 兜底也失败 */
    }
  }

  return null;
}

/**
 * 上游拒绝时把原因捞出来：蓝奏云/网关可能给 inf、info、Message、message 或 error。
 * @param {any} payload
 * @returns {string}
 */
function rejectionMessage(payload) {
  if (payload && typeof payload === 'object') {
    for (const key of ['inf', 'info', 'Message', 'message', 'error', 'errorMessage']) {
      const value = payload[key];
      if (typeof value === 'string' && value.length > 0) return value;
    }
    if (payload.zt !== undefined) return `zt=${payload.zt}`;
  }

  return '上游未给出原因';
}

/* ------------------------------------------------------------------ *
 * 页面解析工具
 * ------------------------------------------------------------------ */

/**
 * @param {string} html
 * @returns {string | null}
 */
function findIframeSrc(html) {
  const tags = html.match(/<iframe\b[^>]*>/gi) ?? [];

  let firstAny = null;
  for (const tag of tags) {
    const src = attr(tag, 'src');
    if (!src) continue;
    if (/ifr2/i.test(tag)) return src;
    firstAny ??= src;
  }

  return firstAny;
}

/**
 * @param {string} tag
 * @param {string} name
 * @returns {string | null}
 */
function attr(tag, name) {
  const m = new RegExp(`${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i').exec(tag);
  if (!m) return null;
  if (m[1] !== undefined) return m[1];
  if (m[2] !== undefined) return m[2];
  return m[3] ?? null;
}

/**
 * 取 data : { … } 这一段；mustContain 用来确认是老少通用的那个对象
 * @param {string} html
 * @param {string} mustContain
 * @returns {string | null}
 */
function dataBlock(html, mustContain) {
  const re = new RegExp(`data\\s*:\\s*\\{([^}]*'${escapeRe(mustContain)}'[^}]*)\\}`, 'i');
  const m = re.exec(html);
  return m ? m[1] : null;
}

/**
 * 从 data 块里取字段，兼容 '字面量' / "字面量" / 裸值
 * @param {string} block
 * @param {string} name
 * @returns {string | null}
 */
function field(block, name) {
  const re = new RegExp(
    `'${escapeRe(name)}'\\s*:\\s*(?:'([^']*)'|"([^"]*)"|([^,}\\s]+))`,
    'i',
  );
  const m = re.exec(block);
  if (!m) return null;
  if (m[1] !== undefined) return m[1];
  if (m[2] !== undefined) return m[2];
  return m[3] ?? '';
}

/**
 * t / k / sign 是个间接引用：页面上写 't':ib0egb，真值在 var ib0egb = '…' 里。
 * 页面还常把同一个变量声明两次（var isngis = ''; var isngis = '真值';），
 * 所以必须取**最后一个非空**赋值，取第一个会拿到空串。
 *
 * @param {string} block
 * @param {string} html
 * @param {string} name
 * @returns {string | null}
 */
function resolveToken(block, html, name) {
  const raw = field(block, name);
  if (!raw) return null;

  // 不是合法标识符 → 已经是字面量
  if (!/^[A-Za-z_$][\w$]*$/.test(raw)) return raw;

  let last = null;
  for (const m of html.matchAll(new RegExp(`\\b${escapeRe(raw)}\\s*=\\s*'([^']*)'`, 'g'))) {
    if (m[1]) last = m[1];
  }
  if (last) return last;

  // 也可能是个数字，比如 var kdns =1;
  return grab(html, new RegExp(`\\b${escapeRe(raw)}\\s*=\\s*(\\d+)`, 'i'));
}

/**
 * 直链带 ?fn=文件名，优先用它当文件名
 * @param {string} link
 * @param {string} fallback
 * @returns {string}
 */
function nameFromLink(link, fallback) {
  try {
    const url = new URL(link);
    const fn = url.searchParams.get('fn');
    if (fn) return fn;

    const last = url.pathname.split('/').filter(Boolean).pop();
    if (last) return decodeURIComponent(last);
  } catch {
    /* 忽略 */
  }

  return fallback;
}

/**
 * @param {ResolvedFile} file
 * @param {boolean} enabled
 * @returns {ResolvedFile}
 */
function applyToolsdown(file, enabled) {
  const query = config.toolsdownQuery;

  if (!enabled || file.link.toLowerCase().includes(query.toLowerCase())) return file;

  const sep = file.link.includes('?') ? '&' : '?';
  return { ...file, link: `${file.link}${sep}${query}` };
}

/**
 * @param {string} text
 * @param {RegExp} re
 * @returns {string | null}
 */
function grab(text, re) {
  const m = re.exec(text);
  return m && m[1] !== undefined ? m[1] : null;
}

/** @param {string} value */
function escapeRe(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** @param {string} text */
function snippet(text) {
  const one = text.replace(/\s+/g, ' ').trim();
  return one.length <= 160 ? one : `${one.slice(0, 160)}…`;
}

/**
 * @param {number} ms
 * @returns {AbortSignal | undefined}
 */
function timeoutSignal(ms) {
  const factory = AbortSignal.timeout;
  return typeof factory === 'function' ? factory.call(AbortSignal, ms) : undefined;
}
