import qr from 'qr-image';
import { net_proxy } from './net_proxy.js';
import { getMainPage, md5Hex, escapeHtml, corsHeaders_GPO, mobileRegex } from './utils.js';
import { triggerWorkflow } from './trigger_workflow.js';
import text_save from './pass_the_text_v1.js';
import graduation_yearbook from './graduation_yearbook_v1.js';
import short_link from './short_link_v1.js';
import proxy_auth from './proxy_auth_v1.js';
import { handleSendVerification } from './mail_verify/send.js';
import { parse } from 'cookie';
import { handleVerifyCode } from './mail_verify/verify.js';
import { CreateAccount, InitDatabase, Login, PushUserBag, GetUserBag, Logout } from './crossfire/v1/crossfire.js';

export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const path = url.pathname;
        const userAgent = request.headers.get('User-Agent') || '';
        const cookie = request.headers.get('Cookie') || '';
        const clientIP = request.headers.get('CF-Connecting-IP');
        const isMobile = mobileRegex.test(userAgent) || false;
        const cookies = parse(cookie);

        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders_GPO });
        }

        if (request.method === 'GET') {
            if (path === "/") {
                return new Response(null, { status: 301, headers: { 'Content-Type': 'text/html', 'Location': 'https://open.undz.cn' } });
            }
            if (path === "/proxy/v1/auth") {
                return await proxy_auth.fetch(request, env);
            }
            if (path === "/qrcode") {
                return new Response(null,
                    {
                        status: 301, headers:
                            { 'Content-Type': 'text/html', 'Location': `https://api.undz.cn/qrcode/v1/generate${url.search}` }
                    });
            }
            if (path === "/qrcode/v1/generate") {
                const text = url.searchParams.get('text');
                const type = url.searchParams.get('type') || 'png';
                const ec_level = url.searchParams.get('level') || 'M';
                const margin = parseInt(url.searchParams.get('margin')) || 2;
                const size = parseInt(url.searchParams.get('size')) || 200;
                const parse_url = url.searchParams.get('parse_url') === 'true' ? true : false;
                if (!text) {
                    return new Response(getMainPage('Ay QR Code Online Generator', '<h1>QR Code Online Generator</h1>', `
<form>
  <input type="text" name="text" placeholder="请输入要生成二维码的内容" required />
  <div>
    <label for="type">格式：</label>
    <select name="type" id="type">
      <option value="png" selected>PNG（栅格图）</option>
      <option value="svg">SVG（矢量图）</option>
      <option value="pdf">PDF（文档）</option>
    </select>
  </div>
  <div>
    <label for="ec_level">纠错等级：</label>
    <select name="level" id="ec_level">
      <option value="L">L - 7%</option>
      <option value="M" selected>M - 15%（默认）</option>
      <option value="Q">Q - 25%</option>
      <option value="H">H - 30%</option>
    </select>
  </div>
  <div>
    <label for="size">尺寸（像素，仅 PNG）：</label>
    <input type="number" name="size" id="size" value="200" min="50" max="1000" step="10" />
    <small>仅对 PNG 输出有效</small>
  </div>
  <div>
    <label for="margin">边距（模块数）：</label>
    <input type="number" name="margin" id="margin" value="2" min="0" max="10" step="1" />
  </div>
  <div>
    <label for="parse_url">
      <input type="checkbox" name="parse_url" id="parse_url" value="true" />
      解析URL
    </label>
  </div>
  <button type="submit">生成二维码</button>
</form>
<style>
form > div { margin-bottom: 12px; }
label { display: inline-block; font-weight: bold; }
input, select { padding: 6px 10px; border-radius: 4px; border: 1px solid #ccc; }
button { padding: 8px 16px; background-color: #0073e6; color: white; border: none; border-radius: 4px; cursor: pointer; }
</style>
                `, null), { status: 200, headers: { 'Content-Type': 'text/html', 'charset': 'UTF-8', ...corsHeaders_GPO } });
                }
                if (type === 'png') {
                    const qr_png = qr.image(text, { type: 'png', margin: margin, ec_level: ec_level, size: size, parse_url: parse_url });
                    const chunks = [];
                    for await (const chunk of qr_png) {
                        chunks.push(chunk);
                    }
                    const qrBuffer = Buffer.concat(chunks);
                    return new Response(qrBuffer, {
                        headers: {
                            'Content-Type': 'image/png',
                            'Cache-Control': 'public, max-age=3600',
                        },
                    });
                }
                else if (type === 'svg') {
                    const qr_svg = qr.image(text, { type: 'svg', ec_level: ec_level, size: size, parse_url: parse_url });
                    const chunks = [];
                    for await (const chunk of qr_svg) {
                        chunks.push(chunk);
                    }
                    const qrBuffer = Buffer.concat(chunks);
                    return new Response(qrBuffer, {
                        headers: {
                            'Content-Type': 'image/svg+xml',
                            'Cache-Control': 'public, max-age=3600',
                        },
                    });
                }
                else if (type === 'pdf') {
                    const qr_pdf = qr.image(text, { type: 'pdf', ec_level: ec_level, parse_url: parse_url });
                    const chunks = [];
                    for await (const chunk of qr_pdf) {
                        chunks.push(chunk);
                    }
                    const qrBuffer = Buffer.concat(chunks);
                    return new Response(qrBuffer, {
                        headers: {
                            'Content-Type': 'application/pdf',
                            'Cache-Control': 'public, max-age=3600',
                        },
                    });
                }
                else {
                    return new Response(JSON.stringify({ code: 400, message: 'Invalid type parameter' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders_GPO } });
                }
            }
            if (path === "/ip") {
                return new Response(null,
                    {
                        status: 301, headers:
                            { 'Content-Type': 'text/html', 'Location': `https://api.undz.cn/ip/v1/get${url.search}` }
                    });
            }
            if (path === '/ip/v1/get') {
                const cf = request.cf;
                const queryIP = url.searchParams.get('ip');
                if (queryIP) {
                    const _temp = {
                        code: 405,
                        message: "The interface is temporarily closed",
                    };
                    return new Response(JSON.stringify(_temp), { status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders_GPO } });
                } else {
                    const info = {
                        code: 200,
                        ip: clientIP,
                        ...cf,
                    };
                    return new Response(JSON.stringify(info), { headers: { 'Content-Type': 'application/json', ...corsHeaders_GPO } });
                }
            }

            if (path.startsWith('/gy/v1/record/')) {
                const userId = path.split('/')[4];
                if (userId) {
                    return graduation_yearbook.handleGetRecord(userId, env);
                }
            }

            if (path === '/addqq') {
                return new Response(null,
                    {
                        status: 301, headers:
                            { 'Content-Type': 'text/html', 'Location': `https://api.undz.cn/addqq/v1/${url.searchParams.get('uid') || ''}` }
                    });
            }
            // 修复：使用 path.startsWith() 调用
            if (path.startsWith('/addqq/v1')) {
                const qquid = path.split('/')[3];
                if (!qquid) {
                    return new Response(JSON.stringify({ code: 400, message: "Missing uid parameter" }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders_GPO } });
                }
                const link = isMobile ? `mqqapi://card/show_pslcard?src_type=internal&version=1&uin=${qquid}&card_type=person&source=sharecard` : `tencent://ntqq-open?subCmd=profile&action=openMiniBuddyProfile&actionParams=${encodeURIComponent(JSON.stringify({ "uin": qquid, "sourceType": "QrCodeShareBuddyLink" }))}`;
                const html = `
              <html>
                <head>
                  <meta charset="UTF-8">
                  <meta http-equiv="refresh" content="0;url=${link}">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no">
                  <title>添加QQ好友</title>
                </head>
                <body style="display:flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: Arial, sans-serif;">
                  <p style="font-size: 18px; margin-bottom: 20px;">没有自动跳转？<a href="${link}">点击这里</a>，或手动搜索QQ号 ${escapeHtml(qquid)}</p>
                  <p style="font-size: 14px; ">下载最新版QQ？ <a href='https://im.qq.com/'> 一键直达 im.qq.com </a> </p>
                </body>
              </html>
            `;
                return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html', ...corsHeaders_GPO } });
            }
            if (path === '/go/parse') {
                return new Response(null,
                    {
                        status: 301, headers:
                            { 'Content-Type': 'text/html', 'Location': `https://api.undz.cn/shortlink/v1/parse${url.search || ''}` }
                    });
            }
            if (path === '/go/init') {
                return new Response(null,
                    {
                        status: 301, headers:
                            { 'Content-Type': 'text/html', 'Location': `https://api.undz.cn/addqq/v1/${url.search || ''}` }
                    });
            }

            if (path === '/shortlink/v1/parse') {
                return await short_link.parseLink(request, env);
            }
            if (path === '/shortlink/v1/init') {
                return await short_link.initLink(request, env);
            }
            if (path.startsWith('/gh/')) {
                return await net_proxy(url, false, true);
            }
            if (path.startsWith('/gh_fix/')) {
                return await net_proxy(url, true, true);
            }
            if (path.startsWith('/proxy/')) {
                if (!(cookies['undz_api_proxy'] === 'true') && !(cookies['undz_api_key'] === await md5Hex(clientIP + env.KEY))) {
                    return new Response(getMainPage("AyUndz API Service", "<h1>403 Forbidden</h1>", "<p>You are not authorized to access this resource.</p><a href=\"/proxy/v1/auth?redirect-to=" + encodeURIComponent(url.pathname + url.search) + "\">Click here to authenticate</a>"), { status: 403, headers: { 'Content-Type': 'text/html', ...corsHeaders_GPO } });
                }
                return await net_proxy(url, false, false);
            }
            if (path.startsWith('/proxy_fix/')) {
                if (!(cookies['undz_api_proxy'] === 'true') && !(cookies['undz_api_key'] === await md5Hex(clientIP + env.KEY))) {
                    return new Response(getMainPage("AyUndz API Service", "<h1>403 Forbidden</h1>", "<p>You are not authorized to access this resource.</p><a href=\"/proxy/v1/auth?redirect-to=" + encodeURIComponent(url.pathname + url.search) + "\">Click here to authenticate</a>"), { status: 403, headers: { 'Content-Type': 'text/html', ...corsHeaders_GPO } });
                }
                return await net_proxy(url, true, false);
            }

            if (path.startsWith('/sf/')) {
                return await text_save.handleGetText(path, env);
            }
            if (path === "/sf_init") {
                return await text_save.initDatabase(request, env);
            }

            if (path.toLowerCase() === "/logo.png") {
                return env.assets.fetch(request);
            }

            if (path === "/trigger") {
                return await triggerWorkflow(env);
            }

            return new Response(getMainPage("AyUndz API Service", "<h1>404 Not Found</h1>", "<p>The page you are trying to access cannot be found, please check and try again.</p>"), { status: 404, headers: { 'Content-Type': 'text/html', ...corsHeaders_GPO } });
        }

        // POST 路由
        if (request.method === 'POST') {
            let response = new Response(JSON.stringify({ error: "404 Not Found" }), { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders_GPO } });
            if (path === '/api/verifymail/v1/send') {
                response = await handleSendVerification(request, env);
            }
            if (path === '/api/sf/v1/save') {
                response = await text_save.handleSaveText(request, env);
            }
            if (path === '/api/sf/v1/delete') {
                response = await text_save.handleDeleteText(request, env);
            }
            if (path === '/api/verifymail/v1/verify') {
                response = await handleVerifyCode(request, env);
            }
            if (path === '/api/crossfire/v1/account/create') {
                response = await CreateAccount(request, env);
            }
            if (path === '/api/crossfire/v1/account/init') {
                response = await InitDatabase(request, env);
            }
            if (path === '/api/crossfire/v1/account/login') {
                response = await Login(request, env);
            }
            if (path === '/api/crossfire/v1/account/logout') {
                response = await Logout(request, env);
            }
            if (path === '/api/crossfire/v1/bag/get') {
                response = await GetUserBag(request, env);
            }
            if (path === '/api/crossfire/v1/bag/push') {
                response = await PushUserBag(request, env);
            }
            if (path === '/go/addlink') {
                response = await short_link.addLink(request, env);  // 修正方法名
            }
            if (path === '/gy/v1/verify') {
                return await graduation_yearbook.handleVerify(request, env);
            }
            if (path === '/gy/v1/submit') {
                return await graduation_yearbook.handleSubmit(request, env);
            }
            if (path === '/gy/v1/initdb') {
                return await graduation_yearbook.handleInitDB(env);
            }
            for (const [key, value] of Object.entries(corsHeaders_GPO)) {
                response.headers.set(key, value);
            }
            return response;
        }

        return new Response(getMainPage("AyUndz API Service", "<h1>404 Not Found</h1>", "<p>The page you are looking for cannot be found, please check and try again.</p>"), { status: 404, headers: { 'Content-Type': 'text/html', ...corsHeaders_GPO } });
    }
}