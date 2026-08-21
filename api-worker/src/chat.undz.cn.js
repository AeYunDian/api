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
import { getMainPage, mobileRegex, generateToken } from './utils.js';
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

            // if (await chat_checkServiceSuspended(db)) { return new Response(JSON.stringify({ error: "503 Service Suspended" }), { status: 503, headers: { "Content-Type": "application/json" } }); }
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

                const result = await exchangeOAuthToken({
                    code: code,
                    clientId: 'app_chat',
                    clientSecret: env.CHAT_OAUTH_CLIENT_SECRET || null,
                    redirectUri: 'https://chat.undz.cn/oauth/callback',
                    state: state
                }, env);

                if (!result.success) {
                    if (result.error === 'access_denied' && result.ban_reason) {
                        const banReason = result.ban_reason || '未提供具体原因';
                        const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>账号已封禁 - AyOnlineChatRoom</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: #f4f2f9;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            padding: 20px;
        }
        .md3-card {
            background: #FEF7FF;
            border-radius: 28px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05), 0 12px 24px rgba(103, 80, 164, 0.10);
            max-width: 520px;
            width: 100%;
            padding: 48px 40px 32px;
            text-align: center;
            border: 1px solid #EADDF2;
        }
        .md3-icon-wrapper svg { width: 48px; height: 48px; }
        .md3-title {
            font-size: 24px;
            font-weight: 500;
            color: #1D1B20;
            margin: 16px 0 8px;
        }
        .md3-subtitle {
            font-size: 14px;
            color: #49454F;
            line-height: 1.6;
            margin-bottom: 24px;
        }
        .md3-btn {
            background: #6750A4;
            color: #FFFFFF;
            border: none;
            padding: 12px 32px;
            border-radius: 100px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: background 0.2s ease;
            text-decoration: none;
            display: inline-block;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }
        .md3-btn:hover { background: #4F378A; }
        .error-icon { color: #b3261e; }
    </style>
</head>
<body>
    <div class="md3-card">
        <div class="md3-icon-wrapper error-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="#b3261e"/>
            </svg>
        </div>
        <h1 class="md3-title">账号已被封禁</h1>
        <p class="md3-subtitle">原因：${escapeHtml(banReason)}<br>如需申诉，请联系管理员。</p>
        <a href="/" class="md3-btn">回到首页</a>
    </div>
</body>
</html>
            `;
                        return new Response(html, { headers: { 'Content-Type': 'text/html' } });
                    }
                    return new Response(
                        'Token exchange failed: ' + (result.error_description || result.error),
                        { status: 500 }
                    );
                }

                if (result.data.user && result.data.user.banned) {
                    const banReason = result.data.user.ban_reason || '';
                    const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>账号已封禁 - AyOnlineChatRoom</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: #f4f2f9;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            padding: 20px;
        }
        .md3-card {
            background: #FEF7FF;
            border-radius: 28px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05), 0 12px 24px rgba(103, 80, 164, 0.10);
            max-width: 520px;
            width: 100%;
            padding: 48px 40px 32px;
            text-align: center;
            border: 1px solid #EADDF2;
        }
        .md3-icon-wrapper svg { width: 48px; height: 48px; }
        .md3-title {
            font-size: 24px;
            font-weight: 500;
            color: #1D1B20;
            margin: 16px 0 8px;
        }
        .md3-subtitle {
            font-size: 14px;
            color: #49454F;
            line-height: 1.6;
            margin-bottom: 24px;
        }
        .md3-btn {
            background: #6750A4;
            color: #FFFFFF;
            border: none;
            padding: 12px 32px;
            border-radius: 100px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: background 0.2s ease;
            text-decoration: none;
            display: inline-block;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }
        .md3-btn:hover { background: #4F378A; }
        .error-icon { color: #b3261e; }
    </style>
</head>
<body>
    <div class="md3-card">
        <div class="md3-icon-wrapper error-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="#b3261e"/>
            </svg>
        </div>
        <h1 class="md3-title">账号已被封禁</h1>
        <p class="md3-subtitle">原因：${escapeHtml(banReason)}<br>如需申诉，请联系管理员。</p>
        <a href="/" class="md3-btn">回到首页</a>
    </div>
</body>
</html>
        `;
                    return new Response(html, { headers: { 'Content-Type': 'text/html' } });
                }

                const redirectUrl = `/chat?room=main&nick=${encodeURIComponent(result.data.user.username)}&code=${generateToken()}${generateToken()}`;
                return new Response(null, {
                    status: 302,
                    headers: { 'Location': redirectUrl }
                });
            }
            if (path === "/chat") return new Response(chat_getChatHtml(), { headers: { "Content-Type": "text/html; charset=utf-8" } });

            if (path.toLowerCase() === "/logo.png") {
                return env.assets.fetch(request);
            }

            return new Response(getMainPage("Ay Online Chat Room", "<h1>404 Not Found</h1>", "<p>The page you are looking for cannot be found, please check and try again.</p>"), { status: 404, headers: { 'Content-Type': 'text/html', ...corsHeaders_GO } });
        }
    }
}