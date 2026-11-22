import { config } from './config.js';
import { LanzouError, isTimeoutError, resolveFile, resolveFolder } from './lanzou.js';

/** 任一参数存在即算 */
function hasAny(search, names) {
  return names.some((name) => search.has(name));
}

/** 任一同名参数取第一个非 null 的值 */
function getAny(search, names) {
  for (const name of names) {
    const value = search.get(name);
    if (value !== null) return value;
  }
  return null;
}

export default {
  /**
   * @param {Request} request
   * @returns {Promise<Response>}
   */
  async fetch(request) {
    // 兜底：任何未预料的异常也返回 JSON，而不是裸的 "Worker threw exception"
    try {
      return await handleRequest(request);
    } catch (err) {
      return errorResponse(err);
    }
  },
};

/**
 * @param {Request} request
 * @returns {Promise<Response>}
 */
async function handleRequest(request) {
  const reqUrl = new URL(request.url);
  const search = reqUrl.searchParams;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors() });
  }

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return errorResponse(new LanzouError('只支持 GET / HEAD', 'METHOD_NOT_ALLOWED', 405));
  }

  const segs = reqUrl.pathname.split('/').filter(Boolean);

  if (segs.length === 0) return indexResponse(reqUrl);
  if (segs.length !== 2) {
    return errorResponse(new LanzouError('路径格式错误', 'BAD_PATH', 400));
  }

  const [sub, id] = segs;

  // 只允许拼出 lanzou 的子域，避免被当成任意站点的代理（SSRF）
  if (!/^[a-z0-9-]{1,63}$/i.test(sub)) {
    return errorResponse(new LanzouError('子域参数不合法', 'BAD_PATH', 400));
  }
  if (!/^[0-9a-z_]{4,64}$/i.test(id)) {
    return errorResponse(new LanzouError('分享 ID 不合法', 'BAD_PATH', 400));
  }

  let baseDomain = config.baseDomain;

  // 参数别名全部来自 config.params
  const password = getAny(search, config.params.password);
  const wantJson = hasAny(search, config.params.json);
  const wantProxy = hasAny(search, config.params.proxy);
  const wantToolsdown = hasAny(search, config.params.toolsdown);
  const forceFolder = hasAny(search, config.params.folder);

  // ?d= 切换备用主域；不在 config.domains 里直接报错
  const domainParam = getAny(search, config.params.domain);
  if (domainParam !== null) {
    const suffix = domainParam.trim().toLowerCase();

    if (!Object.hasOwn(config.domains, suffix)) {
      return errorResponse(new LanzouError('d 参数不在白名单', 'BAD_DOMAIN', 400));
    }

    baseDomain = config.domains[suffix];
  }

  const shareUrl = `https://${sub}.${baseDomain}/${id}`;

  // 蓝奏云文件外链是 /iXXXX，文件夹是 /bXXXX
  const isFolder = forceFolder || /^b[0-9a-z]+$/i.test(id);

  try {
    if (isFolder) {
      const files = await resolveFolder(shareUrl, password);
      const lanzouOrigin = new URL(shareUrl).origin;

      return json({
        ok: true,
        type: 'folder',
        folder: shareUrl,
        count: files.length,
        files: files.map((file) => ({
          ...file,
          share: `${lanzouOrigin}/${file.id}`,
          url: `${reqUrl.origin}/${sub}/${file.id}`,
        })),
      });
    }

    if (wantProxy) {
      const file = await resolveFile(shareUrl, password, wantToolsdown);
      return await proxyDownload(file, request);
    }

    const resolved = await resolveFile(shareUrl, password, wantToolsdown);

    if (wantJson) {
      return json({
        ok: true,
        type: 'file',
        link: resolved.link,
        name: resolved.name,
        size: resolved.size,
        toolsdown: wantToolsdown,
      });
    }

    return new Response(null, {
      status: 302,
      headers: {
        location: resolved.link,
        'content-disposition': contentDisposition(resolved.name),
        'cache-control': 'no-store',
        ...cors(),
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}

/* ------------------------------------------------------------------ *
 * ?p / ?ps —— 服务端抓回文件再以 200 吐给客户端
 * ------------------------------------------------------------------ */

/**
 * @param {{ link: string, name: string, size: string }} file
 * @param {Request} request
 */
async function proxyDownload(file, request) {
  const range = request.headers.get('range');

  const upstream = await fetch(file.link, {
    method: 'GET',
    redirect: 'follow',
    headers: {
      'user-agent': config.userAgent,
      'accept-language': config.acceptLanguage,
      ...(range ? { range } : {}),
    },
    signal: timeoutSignal(config.proxyTimeoutMs),
  });

  if (!upstream.ok && upstream.status !== 206) {
    return errorResponse(
      new LanzouError(`文件下载失败：HTTP ${upstream.status}`, 'UPSTREAM_HTTP', 502),
    );
  }

  const headers = new Headers();
  headers.set('content-type', upstream.headers.get('content-type') ?? 'application/octet-stream');
  headers.set('content-disposition', contentDisposition(file.name));
  headers.set('cache-control', 'no-store');

  const length = upstream.headers.get('content-length');
  if (length) headers.set('content-length', length);

  const contentRange = upstream.headers.get('content-range');
  if (contentRange) headers.set('content-range', contentRange);

  for (const [key, value] of Object.entries(cors())) headers.set(key, value);

  const status = upstream.status === 206 ? 206 : 200;

  if (request.method === 'HEAD') {
    try {
      await upstream.body?.cancel();
    } catch {
      /* 忽略 */
    }
    return new Response(null, { status, headers });
  }

  return new Response(upstream.body, { status, headers });
}

/* ------------------------------------------------------------------ *
 * 响应工具
 * ------------------------------------------------------------------ */

function cors() {
  return {
    'access-control-allow-origin': config.cors.allowOrigin,
    'access-control-allow-methods': 'GET, HEAD, OPTIONS',
    'access-control-expose-headers': 'content-disposition, content-length, content-range',
  };
}

/**
 * @param {unknown} body
 * @param {number} [status]
 */
function json(body, status = 200) {
  const headers = new Headers({
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  });
  for (const [key, value] of Object.entries(cors())) headers.set(key, value);
  return new Response(JSON.stringify(body, null, 2), { status, headers });
}

/** @param {unknown} err */
function errorResponse(err) {
  if (err instanceof LanzouError) {
    return json({ ok: false, error: { code: err.code, message: err.message } }, err.status);
  }

  // fetch 被 AbortSignal.timeout 掐断时抛的是 TimeoutError/AbortError，
  // 别让它变成通用的 INTERNAL
  if (isTimeoutError(err)) {
    return json({ ok: false, error: { code: 'TIMEOUT', message: '上游请求超时' } }, 504);
  }

  const message = err instanceof Error ? err.message : String(err);
  return json({ ok: false, error: { code: 'INTERNAL', message } }, 500);
}

/**
 * 根路径只给路由形状，用法说明一律放在 README
 * @param {URL} reqUrl
 */
function indexResponse(reqUrl) {
  return json({
    ok: true,
    name: 'lanzou-go',
    routes: {
      file: `${reqUrl.origin}/{子域}/{分享ID}`,
      folder: `${reqUrl.origin}/{子域}/{文件夹ID}`,
    },
  });
}

/* ------------------------------------------------------------------ *
 * 杂项
 * ------------------------------------------------------------------ */

/**
 * 跨运行时安全地拿一个带超时的 AbortSignal
 * @param {number} ms
 * @returns {AbortSignal | undefined}
 */
function timeoutSignal(ms) {
  const factory = AbortSignal.timeout;
  return typeof factory === 'function' ? factory.call(AbortSignal, ms) : undefined;
}

/**
 * RFC 5987 的 Content-Disposition，非 ASCII 文件名走 filename*
 * @param {string} name
 */
function contentDisposition(name) {
  const safeFallback = (name || 'download').replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_')
    || 'download';

  const encoded = encodeURIComponent(name || 'download').replace(
    /['()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  );

  return `attachment; filename="${safeFallback}"; filename*=UTF-8''${encoded}`;
}
