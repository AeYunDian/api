import { USER_AGENT } from './utils.js';

// ---------- 配置 ----------

// jsdelivr 允许的路径前缀
const JSDELIVR_PREFIXES = [
    '/npm/', '/gh/', '/file/', '/files/', '/wordpress/', '/combine/',
];

// Google Fonts CSS 入口（精确匹配，后面可带 query）
const GOOGLEAPIS_PATHS = new Set(['/css', '/css2']);

// Google Fonts 字体文件前缀（gstatic）
const GSTATIC_PREFIXES = ['/s/', '/l/', '/earlyaccess/'];

// 不转发给上游的请求头
const STRIP_HEADERS = [
    'host', 'cookie', 'authorization',
    'cf-connecting-ip', 'cf-ipcountry', 'cf-ray', 'cf-visitor',
    'x-forwarded-for', 'x-forwarded-proto', 'x-real-ip',
];

// ---------- 工具 ----------

function errorPage(status, title, paddingLines = 6) {
    const padding =
        '<!-- a padding to disable MSIE and Chrome friendly error page -->\n'.repeat(paddingLines);
    const html =
        `<html>\n<head><title>${status} ${title}</title></head>\n<body>\n` +
        `<center><h1>${status} ${title}</h1></center>\n` +
        `<hr><center>nginx</center>\n</body>\n</html>\n${padding}`;
    return new Response(html, {
        status,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
}

function buildProxyHeaders(request, { replaceUA }) {
    const headers = new Headers(request.headers);
    for (const h of STRIP_HEADERS) headers.delete(h);
    if (replaceUA) headers.set('User-Agent', USER_AGENT);
    return headers;
}

function withCORS(response) {
    const r = new Response(response.body, response);
    r.headers.set('Access-Control-Allow-Origin', '*');
    r.headers.set('Access-Control-Expose-Headers', '*');
    return r;
}

// 把 CSS 里 fonts.gstatic.com 的绝对/协议相对 URL 重写成本域
async function rewriteGoogleFontsCSS(response, origin) {
    const css = await response.text();
    const rewritten = css.replace(
        /(?:https?:)?\/\/fonts\.gstatic\.com/g,
        origin,
    );
    const headers = new Headers(response.headers);
    headers.delete('Content-Length');   // body 已变
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Expose-Headers', '*');
    return new Response(rewritten, {
        status: response.status,
        statusText: response.statusText,
        headers,
    });
}

// ---------- 代理处理器 ----------

async function proxyJsdelivr(request, url, env) {
    if (!JSDELIVR_PREFIXES.some((p) => url.pathname.startsWith(p))) {
        return errorPage(403, 'Forbidden');
    }

    const target = `${url.protocol}//cdn.jsdelivr.net${url.pathname}${url.search}`;
    const hasBody = request.method !== 'GET' && request.method !== 'HEAD';

    const proxyRequest = new Request(target, {
        method: request.method,
        headers: buildProxyHeaders(request, { replaceUA: true }),
        body: hasBody ? request.body : undefined,
        redirect: 'follow',
    });

    try {
        return withCORS(await fetch(proxyRequest));
    } catch (error) {
        if (env.DEBUG) console.error('[cdn] jsdelivr upstream error:', error.message);
        return errorPage(502, 'Bad Gateway');
    }
}

async function proxyGoogleFontsCSS(request, url, env) {
    const target = `https://fonts.googleapis.com${url.pathname}${url.search}`;
    const hasBody = request.method !== 'GET' && request.method !== 'HEAD';

    // UA 必须透传：Google Fonts 按 UA 决定返回 woff2 / woff / ttf
    const proxyRequest = new Request(target, {
        method: request.method,
        headers: buildProxyHeaders(request, { replaceUA: false }),
        body: hasBody ? request.body : undefined,
        redirect: 'follow',
    });

    try {
        const response = await fetch(proxyRequest);
        const ct = response.headers.get('Content-Type') || '';

        if (response.ok && ct.includes('text/css')) {
            return rewriteGoogleFontsCSS(response, url.origin);
        }
        return withCORS(response);
    } catch (error) {
        if (env.DEBUG) console.error('[cdn] googleapis upstream error:', error.message);
        return errorPage(502, 'Bad Gateway');
    }
}

async function proxyGstatic(request, url, env) {
    const target = `https://fonts.gstatic.com${url.pathname}${url.search}`;
    const hasBody = request.method !== 'GET' && request.method !== 'HEAD';

    const proxyRequest = new Request(target, {
        method: request.method,
        headers: buildProxyHeaders(request, { replaceUA: false }),
        body: hasBody ? request.body : undefined,
        redirect: 'follow',
    });

    try {
        return withCORS(await fetch(proxyRequest));
    } catch (error) {
        if (env.DEBUG) console.error('[cdn] gstatic upstream error:', error.message);
        return errorPage(502, 'Bad Gateway');
    }
}

// ---------- 主入口 ----------

export default {
    async fetch(request, env) {
        try {
            return await handle(request, env);
        } catch (err) {
            if (env.DEBUG) console.error('[cdn] unhandled:', err);
            return errorPage(500, 'Internal Server Error');
        }
    },
};

async function handle(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // 根路径 → 静态资源
    if (pathname === '/') {
        if (env.assets) {
            const newUrl = new URL(request.url);
            newUrl.pathname = '/cdn/';
            return env.assets.fetch(new Request(newUrl, request));
        }
        return new Response('Welcome to cdn.undz.cn', {
            status: 200,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
    }

    // CORS 预检
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
                'Access-Control-Allow-Headers': '*',
                'Access-Control-Max-Age': '86400',
            },
        });
    }

    // Google Fonts CSS：/css、/css2
    if (GOOGLEAPIS_PATHS.has(pathname)) {
        return proxyGoogleFontsCSS(request, url, env);
    }

    // Google Fonts 字体文件：/s/、/l/、/earlyaccess/
    if (GSTATIC_PREFIXES.some((p) => pathname.startsWith(p))) {
        return proxyGstatic(request, url, env);
    }

    // jsdelivr
    return proxyJsdelivr(request, url, env);
}