import qr from 'qr-image';
import { getMainPage, escapeHtml, corsHeaders_GPO, mobileRegex } from './utils.js';
import graduation_yearbook from './graduation_yearbook_v1.js';
import short_link from './short_link_v1.js';
import {
    CreateAccount, InitDatabase, Login,
    PushUserBag, GetUserBag, Logout,
} from './crossfire/v1/crossfire.js';

// ---------- 响应助手 ----------
const JSON_HEADERS = { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders_GPO };
const HTML_HEADERS = { 'Content-Type': 'text/html; charset=utf-8', ...corsHeaders_GPO };

const json = (data, status = 200) =>
    new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });

const notFound = () => json({ error: '404 Not Found' }, 404);

const methodNotAllowed = (allowed) =>
    new Response(JSON.stringify({ error: '405 Method Not Allowed' }), {
        status: 405,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Allow': [...allowed, 'OPTIONS'].join(', '),
            ...corsHeaders_GPO,
        },
    });

// 收集可读流为 Uint8Array（避免依赖 Buffer）
async function streamToBytes(stream) {
    const chunks = [];
    let total = 0;
    for await (const chunk of stream) {
        const u8 = chunk instanceof Uint8Array ? chunk : new Uint8Array(chunk);
        chunks.push(u8);
        total += u8.byteLength;
    }
    const out = new Uint8Array(total);
    let offset = 0;
    for (const c of chunks) {
        out.set(c, offset);
        offset += c.byteLength;
    }
    return out;
}

// ---------- 路由表 ----------
const exactRoutes = {
    '/qrcode': ['GET'],
    '/qrcode/v1/generate': ['GET'],
    '/ip': ['GET'],
    '/ip/v1/get': ['GET'],
    '/addqq': ['GET'],

    '/api/crossfire/v1/account/create': ['POST'],
    '/api/crossfire/v1/account/init': ['POST'],
    '/api/crossfire/v1/account/login': ['POST'],
    '/api/crossfire/v1/account/logout': ['POST'],
    '/api/crossfire/v1/bag/get': ['POST'],
    '/api/crossfire/v1/bag/push': ['POST'],
    '/go/addlink': ['POST'],
    '/api/v1/verify': ['POST'],
    '/api/v1/submit': ['POST'],

    '/gy/v1/initdb': [], // 拒绝访问
};

const prefixRoutes = [
    { prefix: '/gy/v1/record/', methods: ['GET'] },
    { prefix: '/addqq/v1/', methods: ['GET'] },
];

function getAllowedMethods(path) {
    const exact = exactRoutes[path];
    if (exact) return exact;
    for (const { prefix, methods } of prefixRoutes) {
        if (path.startsWith(prefix)) return methods;
    }
    return null;
}

// ---------- 主入口 ----------
export default {
    async fetch(request, env) {
        try {
            return await route(request, env);
        } catch (err) {
            console.error('[worker] unhandled error:', err);
            // 统一兜底，保留 CORS 头，避免前端只看到 CORS 报错
            return json({ error: 'Internal Server Error' }, 500);
        }
    },
};

async function route(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    if (method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders_GPO });
    }

    const allowed = getAllowedMethods(path);
    if (allowed && !allowed.includes(method)) {
        return methodNotAllowed(allowed);
    }

    if (method === 'GET') return handleGet(path, url, request, env);

    if (method === 'POST') {
        const response = await handlePost(path, request, env);
        for (const [k, v] of Object.entries(corsHeaders_GPO)) {
            response.headers.set(k, v);
        }
        return response;
    }

    return notFound();
}

// ---------- 管理员鉴权 ----------
// 若 env.ADMIN_TOKEN 未配置则放行（保持向后兼容）；
// 配置后必须匹配 X-Admin-Token，否则 401。
function requireAdmin(request, env) {
    if (!env.ADMIN_TOKEN) return null;
    const token = request.headers.get('X-Admin-Token');
    if (token !== env.ADMIN_TOKEN) {
        return json({ error: 'Unauthorized' }, 401);
    }
    return null;
}

// ---------- GET 路由 ----------
function handleGet(path, url, request, env) {
    switch (path) {
        case '/qrcode':
        case '/qrcode/v1/generate':
            return handleQRCodeRequest(url);

        case '/ip':
        case '/ip/v1/get':
            return handleIPRequest(request);

        case '/addqq': {
            const uid = url.searchParams.get('uid') || '';
            return new Response(null, {
                status: 308,
                headers: {
                    'Content-Type': 'text/html; charset=utf-8',
                    // encodeURIComponent 保证 Location 合法，避免 `#`/`?`/空格 污染路径
                    'Location': `${url.origin}/addqq/v1/${encodeURIComponent(uid)}`,
                },
            });
        }
    }

    if (path.startsWith('/gy/v1/record/')) {
        const userId = path.slice('/gy/v1/record/'.length);
        if (userId) return graduation_yearbook.handleGetRecord(userId, env);
    }

    if (path.startsWith('/addqq/v1/')) {
        const isMobile = mobileRegex.test(request.headers.get('User-Agent') || '');
        return handleAddQQRequest(path, isMobile);
    }

    return notFound();
}

// ---------- POST 路由 ----------
async function handlePost(path, request, env) {
    switch (path) {
        case '/api/crossfire/v1/account/create': return CreateAccount(request, env);
        case '/api/crossfire/v1/account/init': {
            const deny = requireAdmin(request, env);
            if (deny) return deny;
            return InitDatabase(request, env);
        }
        case '/api/crossfire/v1/account/login': return Login(request, env);
        case '/api/crossfire/v1/account/logout': return Logout(request, env);
        case '/api/crossfire/v1/bag/get': return GetUserBag(request, env);
        case '/api/crossfire/v1/bag/push': return PushUserBag(request, env);
        case '/go/addlink': return short_link.addLink(request, env);
        case '/api/v1/verify': return graduation_yearbook.handleVerify(request, env);
        case '/api/v1/submit': return graduation_yearbook.handleSubmit(request, env);
        case '/gy/v1/initdb': {
            const deny = requireAdmin(request, env);
            if (deny) return deny;
            return graduation_yearbook.handleInitDB(env);
        }
    }
    return notFound();
}

// ---------- 添加 QQ ----------
function handleAddQQRequest(path, isMobile) {
    const qquid = path.slice('/addqq/v1/'.length).split('/')[0];

    // 白名单校验，杜绝属性注入 & 非法 uid
    if (!qquid || !/^\d{5,12}$/.test(qquid)) {
        return json({ code: 400, message: 'Missing or invalid uid parameter' }, 400);
    }

    const link = isMobile
        ? `mqqapi://card/show_pslcard?src_type=internal&version=1&uin=${qquid}&card_type=person&source=sharecard`
        : `tencent://ntqq-open?subCmd=profile&action=openMiniBuddyProfile&actionParams=${encodeURIComponent(JSON.stringify({ uin: qquid, sourceType: 'QrCodeShareBuddyLink' }))
        }`;

    const safeLink = escapeHtml(link);
    const safeUid = escapeHtml(qquid);

    const html =
        `<html><head><meta charset="UTF-8">` +
        `<meta http-equiv="refresh" content="0;url=${safeLink}">` +
        `<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,minimum-scale=1.0,user-scalable=no">` +
        `<title>添加QQ好友</title></head>` +
        `<body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:Arial,sans-serif">` +
        `<p style="font-size:18px;margin-bottom:20px">没有自动跳转？<a href="${safeLink}">点击这里</a>，或手动搜索QQ号 ${safeUid}</p>` +
        `<p style="font-size:14px">下载最新版QQ？ <a href="https://im.qq.com/">一键直达 im.qq.com</a></p>` +
        `</body></html>`;

    return new Response(html, { status: 200, headers: HTML_HEADERS });
}

// ---------- IP ----------
function handleIPRequest(request) {
    return json({
        code: 200,
        ip: request.headers.get('CF-Connecting-IP'),
        ...request.cf,
    });
}


// ---------- 二维码 ----------
const QR_FORM_HTML =
    `<form><input type="text" name="text" placeholder="请输入要生成二维码的内容" required />` +
    `<div><label for="type">格式：</label><select name="type" id="type">` +
    `<option value="png" selected>PNG（栅格图）</option>` +
    `<option value="svg">SVG（矢量图）</option>` +
    `<option value="pdf">PDF（文档）</option></select></div>` +
    `<div><label for="ec_level">纠错等级：</label><select name="level" id="ec_level">` +
    `<option value="L">L - 7%</option><option value="M" selected>M - 15%（默认）</option>` +
    `<option value="Q">Q - 25%</option><option value="H">H - 30%</option></select></div>` +
    `<div><label for="size">尺寸（像素，仅 PNG）：</label>` +
    `<input type="number" name="size" id="size" value="200" min="50" max="1000" step="10" />` +
    `<small>仅对 PNG 输出有效</small></div>` +
    `<div><label for="margin">边距（模块数）：</label>` +
    `<input type="number" name="margin" id="margin" value="2" min="0" max="10" step="1" /></div>` +
    `<div><label for="parse_url"><input type="checkbox" name="parse_url" id="parse_url" value="true" />解析URL</label></div>` +
    `<button type="submit">生成二维码</button></form>` +
    `<style>form>div{margin-bottom:12px}label{display:inline-block;font-weight:bold}` +
    `input,select{padding:6px 10px;border-radius:4px;border:1px solid #ccc}` +
    `button{padding:8px 16px;background-color:#0073e6;color:#fff;border:none;border-radius:4px;cursor:pointer}</style>`;

const VALID_LEVELS = new Set(['L', 'M', 'Q', 'H']);
const QR_MIME = {
    png: 'image/png',
    svg: 'image/svg+xml',
    pdf: 'application/pdf',
};
const TEXT_MAX = 2000;

const clamp = (n, min, max, fallback) =>
    Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;

// 兼容 true / 1 / on
function parseBool(v) {
    return v === 'true' || v === '1' || v === 'on';
}

async function handleQRCodeRequest(url) {
    const text = url.searchParams.get('text');

    if (!text) {
        const page = getMainPage(
            'Ay QR Code Online Generator',
            '<h1>QR Code Online Generator</h1>',
            QR_FORM_HTML,
            null,
        );
        return new Response(page, { status: 200, headers: HTML_HEADERS });
    }

    if (text.length > TEXT_MAX) {
        return json({ code: 400, message: `text too long (max ${TEXT_MAX} chars)` }, 400);
    }

    const type = (url.searchParams.get('type') || 'png').toLowerCase();
    if (!QR_MIME[type]) {
        return json({ code: 400, message: 'Invalid type parameter' }, 400);
    }

    const level = url.searchParams.get('level') || 'M';
    const ec_level = VALID_LEVELS.has(level) ? level : 'M';

    const margin = clamp(parseInt(url.searchParams.get('margin'), 10), 0, 10, 2);
    const size = clamp(parseInt(url.searchParams.get('size'), 10), 50, 1000, 200);
    const parse_url = parseBool(url.searchParams.get('parse_url'));

    const options = { type, ec_level, parse_url };
    if (type === 'png') {
        options.margin = margin;
        options.size = size;
    }

    const bytes = await streamToBytes(qr.image(text, options));

    return new Response(bytes, {
        headers: {
            'Content-Type': QR_MIME[type],
            'Cache-Control': 'public, max-age=3600',
            // 补 CORS，便于前端 fetch 拿 blob 下载
            ...corsHeaders_GPO,
        },
    });
}