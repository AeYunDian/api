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

            if (path === "/chat") return new Response(chat_getChatHtml(), { headers: { "Content-Type": "text/html; charset=utf-8" } });

            if (path.toLowerCase() === "/logo.png") {
                return env.assets.fetch(request);
            }

            return new Response(getMainPage("Ay Online Chat Room", "<h1>404 Not Found</h1>", "<p>The page you are looking for cannot be found, please check and try again.</p>"), { status: 404, headers: { 'Content-Type': 'text/html', ...corsHeaders_GO } });
        }
    }
}