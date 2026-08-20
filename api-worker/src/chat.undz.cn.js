import {
    chat_getIndexHtml,
    chat_getChatHtml,
    chat_getSettingLoginHtml,
    chat_getSettingHtml,
    chat_checkServiceSuspended,
    chat_isSuperAdmin,
    chat_verifyUserRequest,
    chat_createUserPublic,
    chat_handleAdminRequest,
    chat_sendMessage,
    chat_poll,
    chat_clean,
    chat_initTables,
    chat_userLogin,
    chat_getMobileTip,
} from './chat_room.js';
import { getMainPage, mobileRegex } from './utils.js';
import { parse, serialize } from 'cookie';
import { exchangeOAuthToken } from './online.undz.cn.js';  // 导入 token 交换函数

const corsHeaders_GO = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const path = url.pathname;
        const userAgent = request.headers.get('User-Agent') || '';
        const cookie = request.headers.get('Cookie') || '';
        const db = env.db;
        const isWechat = !!userAgent.match(/MicroMessenger/i);
        const clientIP = request.headers.get('CF-Connecting-IP');
        const isMobile = mobileRegex.test(userAgent) || false;
        const cookies = parse(cookie);

        if (request.method === 'OPTIONS') { return new Response(null, { headers: corsHeaders_GO }); }

        if (request.method === 'GET') {
            const keyParam = url.searchParams.get("key");
            const isSuper = chat_isSuperAdmin(env, keyParam);

            if (path === "/setting") {
                if (!isSuper) {
                    return new Response(chat_getSettingLoginHtml(), { headers: { "Content-Type": "text/html; charset=utf-8" } });
                }
                return new Response(chat_getSettingHtml(keyParam), { headers: { "Content-Type": "text/html; charset=utf-8" } });
            }

            if (path.startsWith("/api/admin/")) {
                const response = await chat_handleAdminRequest(db, path, url, isSuper);
                return response;
            }

            if (path === "/init") {
                const result = await chat_initTables(db, env.KEY, keyParam);
                return new Response(JSON.stringify(result), { headers: { "Content-Type": "application/json" } });
            }

            if (await chat_checkServiceSuspended(db)) { return new Response(JSON.stringify({ error: "503 Service Suspended" }), { status: 503, headers: { "Content-Type": "application/json" } }); }
            const hasNotSeenPrompt = cookies['CHAT_did_prompt_appear'] !== 'true';
            if ((isMobile || isWechat) && hasNotSeenPrompt) {
                const setCookie = serialize('CHAT_did_prompt_appear', 'true', {
                    secure: false,
                    sameSite: 'lax',
                    path: '/'
                });
                return new Response(chat_getMobileTip(), { headers: { "Content-Type": "text/html; charset=utf-8", "Set-Cookie": setCookie } });
            }

            if (path === "/create") {
                const response = await chat_createUserPublic(db, url, isSuper, keyParam);
                return response;
            }

            if (path === "/verify") {
                const response = await chat_verifyUserRequest(db, url);
                return response;
            }

            if (path === "/send") {
                const response = await chat_sendMessage(db, url, env);
                return response;
            }

            if (path === "/poll") {
                const response = await chat_poll(db, url);
                return response;
            }

            if (path === "/add_room") {
                const response = await chat_userLogin(clientIP, isSuper, url, db);
                return response;
            }

            if (path === "/clean") {
                const response = await chat_clean(db, url, isSuper);
                return response;
            }

            if (path === "/") {
                return new Response(chat_getIndexHtml(), { headers: { "Content-Type": "text/html; charset=utf-8" } });
            }
            if (path === "/oauth/callback") {
                const code = url.searchParams.get('code');
                const state = url.searchParams.get('state') || '';
                if (!code) {
                    return new Response('Missing code', { status: 400 });
                }

                // 构造模拟请求体（符合 OAuth 2.0 标准）
                const body = new URLSearchParams({
                    grant_type: 'authorization_code',
                    code,
                    client_id: 'app_chat',
                    client_secret: env.CHAT_OAUTH_CLIENT_SECRET || 'db3eb5507fc643e6b47065df2863bc9b',
                    redirect_uri: 'https://chat.undz.cn/oauth/callback',
                    state
                });

                // 构造一个假的 Request 对象，让 exchangeOAuthToken 可以解析
                const mockRequest = new Request('https://internal/token', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: body.toString()
                });

                // 调用已导出的 token 交换函数
                const resp = await exchangeOAuthToken(mockRequest, env);

                if (resp.status !== 200) {
                    const errorText = await resp.text();
                    return new Response('Token exchange failed: ' + errorText, { status: 500 });
                }

                const data = await resp.json();

                // 设置 access_token cookie
                const cookieOptions = {
                    domain: '.undz.cn',
                    path: '/',
                    httpOnly: true,
                    secure: true,
                    sameSite: 'Lax',
                    maxAge: 900 // 15 分钟，与 ACCESS_TOKEN_EXPIRES_IN 一致
                };
                const accessCookie = serialize('access_token', data.access_token, cookieOptions);

                let refreshCookie = '';
                if (data.refresh_token) {
                    const refreshOptions = { ...cookieOptions, maxAge: 60 * 60 * 24 * 30 }; // 30 天
                    refreshCookie = serialize('refresh_token', data.refresh_token, refreshOptions);
                }

                // 重定向到聊天室（登录成功）
                const headers = {
                    'Location': '/chat',
                    'Set-Cookie': accessCookie + (refreshCookie ? '; ' + refreshCookie : '')
                };
                return new Response(null, { status: 302, headers });
            }
            if (path === "/chat") return new Response(chat_getChatHtml(), { headers: { "Content-Type": "text/html; charset=utf-8" } });

            if (path.toLowerCase() === "/logo.png") {
                return env.assets.fetch(request);
            }

            return new Response(getMainPage("Ay Online Chat Room", "<h1>404 Not Found</h1>", "<p>The page you are looking for cannot be found, please check and try again.</p>"), { status: 404, headers: { 'Content-Type': 'text/html', ...corsHeaders_GO } });
        }
    }
}