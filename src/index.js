// 导入处理函数
import { handleSendVerification } from './mail_verify/send.js';
import { handleVerifyCode } from './mail_verify/verify.js';
import { sl_parseLink } from './short_link/parse_link.js';
import { sl_addLink } from './short_link/add_link.js';
import { sl_initLink } from './short_link/init_database.js';
import { getMainPage, escapeHtml, proxyStaticFile, md5Hex } from './utils.js';
import { CreateAccount, InitDatabase, Login, PushUserBag, GetUserBag, Logout } from './crossfire/v1/crossfire.js';
import { triggerWorkflow } from './trigger_workflow.js';
import { net_proxy, getProxyAuthPage } from './net_proxy.js';
import { parse, serialize } from 'cookie';
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
import { handleSaveText, handleDeleteText, handleGetText, pt_initDatabase } from './pass_the_text.js';


const corsHeaders_GPO = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const corsHeaders_GO = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
const mobileRegex = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|windows phone|phone|webos|kindle|tablet/i;

export default {
  async scheduled(controller, env) {
    await triggerWorkflow(env);
  },

  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const userAgent = request.headers.get('User-Agent') || '';
    const platform = request.headers.get('sec-ch-ua-platform') || '';
    const hostname = url.hostname;
    const cookie = request.headers.get('Cookie') || '';
    const db = env.db;
    const kv = env.kv;
    const isWechat = !!userAgent.match(/MicroMessenger/i);
    const clientIP = request.headers.get('CF-Connecting-IP');
    const isMobile = mobileRegex.test(userAgent) || false;
    const cookies = parse(cookie);

    try {
      if (path.toLowerCase() === "/favicon.ico") {
        const response = await proxyStaticFile("https://r1.undz.cn/favicon.ico", url.protocol);
        return response;
      }
      if (hostname === 'api.undz.cn' || hostname === 'api.io.hb.cn') {
        if (request.method === 'OPTIONS') {
          return new Response(null, { headers: corsHeaders_GPO });
        }

        if (request.method === 'GET') {

          if (path === "/") {
            return new Response(getMainPage(), { headers: { 'Content-Type': 'text/html' } });
          }
          if (path === "/auth-proxy") {
            const key = url.searchParams.get("key") || '';
            if (key === env.KEY || key === env.Bac2) {
              const setCookie = serialize('undz_api_proxy', 'true', {
                secure: true,
                httpOnly: true,
                maxAge: 7 * 24 * 60 * 60, // 7天
                sameSite: 'lax',
                path: '/'
              });
              const setKey = serialize('undz_api_key', await md5Hex(clientIP + env.KEY), {
                secure: true,
                httpOnly: true,
                maxAge: 7 * 24 * 60 * 60, // 7天
                sameSite: 'lax',
                path: '/'
              });
              return new Response(getMainPage("Authorization successful!", "<h1>Authorization successful!</h1>", `<p>You have successfully obtained 7-day access to this API. </p>
                <div id="returnSection">
                  <p id="returnMessage">Will return after 5s.</p>
                  <a href="#" onclick="cancelReturn()" id="cancelReturnLBL">Cancel return?</a> <a href="#" onclick="returnImmediately()" id="returnImmediatelyLBL">Return immediately?</a>
                </div>
                <script>
                  let cancelAutoReturn = false;
                  function cancelReturn() {
                    document.getElementById('cancelReturnLBL').style.display = 'none';
                    document.getElementById('returnMessage').textContent = 'Automatic return has been canceled. You can close this page or click back.';
                    document.getElementById('returnImmediatelyLBL').textContent = 'Return';
                    cancelAutoReturn = true;
                  }
                  function returnImmediately() {
                    window.location.href = "${escapeHtml(url.searchParams.get("redirect-to") || "/")}"
                  }
                  setTimeout(() => {
                    if (cancelAutoReturn) return;
                    window.location.href = "${escapeHtml(url.searchParams.get("redirect-to") || "/")}"
                  }, 5000);
                  if ("${escapeHtml(url.searchParams.get("redirect-to") || "/")}" === "/") {
                    cancelAutoReturn = true;
                    document.getElementById('returnSection').style.display = 'none';
                  }
                </script>
                `), { headers: { 'Content-Type': 'text/html', 'Set-Cookie': `${setCookie}; ${setKey}` } });
            } else if (key !== '') {
              const setCookie = serialize('undz_api_proxy', '', {
                secure: true,
                httpOnly: true,
                maxAge: 0,
                sameSite: 'lax',
                path: '/'
              });
              const setKey = serialize('undz_api_key', '', {
                secure: true,
                maxAge: 0,
                httpOnly: true,
                sameSite: 'lax',
                path: '/'
              });
              return new Response(getProxyAuthPage("密钥不正确", null), { headers: { 'Content-Type': 'text/html', "Set-Cookie": `${setCookie}; ${setKey}` } });
            }
            return new Response(getProxyAuthPage(null, escapeHtml(url.searchParams.get("redirect-to") || null)), { headers: { 'Content-Type': 'text/html' } });
          }
          if (path === '/ip') {
            const cf = request.cf;
            const queryIP = url.searchParams.get('ip');
            if (queryIP) {
              const _temp = {
                code: 405,
                message: "The interface is temporarily closed",
              };
              return new Response(JSON.stringify(_temp), { status: 405, headers: { 'Content-Type': 'application/json'} });

              // const selfReq = new Request(request.url, {
              //   headers: { 'CF-Connecting-IP': queryIP },
              //   method: 'GET',
              // });
              // selfReq.cf = {}
              // const selfRes = await fetch(selfReq);
              // const data = await selfRes.json();
              // return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json', } });
            } else {
              const info = {
                code: 200,
                ip: clientIP,
                ...cf,
              };
              return new Response(JSON.stringify(info), { headers: { 'Content-Type': 'application/json', } });
            }
          }
          if (path === '/addqq') {
            const qquid = url.searchParams.get('uid');
            if (!qquid) {
              return new Response(JSON.stringify({ code: 400, message: "Missing uid parameter" }), { status: 400, headers: { 'Content-Type': 'application/json' } });
            }
            if (isMobile) {
              return new Response({ status: 302, headers: { 'Location': `mqqapi://card/show_pslcard?src_type=internal&version=1&uin=${qquid}&card_type=person&source=sharecard` } });
            } else {
              return new Response({ status: 302, headers: { 'Location': `tencent://AddContact/?fromId=45&fromSubId=1&subcmd=all&uin=${qquid}` } });
            }
          }
          if (path === '/go/parse') {
            return new Response(await sl_parseLink(request, env), { headers: { 'Content-Type': 'application/json' } });
          }
          if (path === '/go/init') {
            return new Response(await sl_initLink(request, env), { headers: { 'Content-Type': 'application/json' } });
          }
          if (path.startsWith('/gh/')) {
            return await net_proxy(url, false, true);
          }
          if (path.startsWith('/gh_fix/')) {
            return await net_proxy(url, true, true);
          }
          if (path.startsWith('/proxy/')) {
            if (!(cookies['undz_api_proxy'] === 'true') && !(cookies['undz_api_key'] === await md5Hex(clientIP + env.KEY))) {
              return new Response(getMainPage("AyUndz API Service", "<h1>403 Forbidden</h1>", "<p>You are not authorized to access this resource.</p><a href=\"/auth-proxy?redirect-to=" + encodeURIComponent(url.pathname + url.search) + "\">Click here to authenticate</a>"), { status: 403, headers: { 'Content-Type': 'text/html' } });
            }
            return await net_proxy(url, false, false);
          }
          if (path.startsWith('/proxy_fix/')) {
            if (!(cookies['undz_api_proxy'] === 'true') && !(cookies['undz_api_key'] === await md5Hex(clientIP + env.KEY))) {
              return new Response(getMainPage("AyUndz API Service", "<h1>403 Forbidden</h1>", "<p>You are not authorized to access this resource.</p><a href=\"/auth-proxy?redirect-to=" + encodeURIComponent(url.pathname + url.search) + "\">Click here to authenticate</a>"), { status: 403, headers: { 'Content-Type': 'text/html' } });
            }
            return await net_proxy(url, true, false);
          }
          if (path.startsWith('/sf/')) {
            return await handleGetText(path, env);
          }
          if (path === "/sf_init") {
            return await pt_initDatabase(request, env);
          }
          if (path.toLowerCase() === "/logo.png") {
            const response = await proxyStaticFile("https://r1.undz.cn/logo.png", url.protocol);
            return response;
          }
          if (path === "/trigger") {
            return await triggerWorkflow(env);
          }
          if (path === "/debuginfo") {
            const info = await getDebugInfo(env, request);
            return new Response(JSON.stringify(info, null, 2), {
              headers: { 'Content-Type': 'application/json', ...corsHeaders_GPO }
            });
          }
          return new Response(getMainPage("AyUndz API Service", "<h1>404 Not Found</h1>", "<p>The page you are trying to access cannot be found, please check and try again.</p>"), { status: 404, headers: { 'Content-Type': 'text/html' } });
        }

        // 路由处理
        if (request.method === 'POST') {
          let response = new Response(JSON.stringify({ error: "404 Not Found" }), { status: 404 });
          if (path === '/api/verifymail/v1/send') {
            response = await handleSendVerification(request, env);
          }
          if (path === '/api/sf/v1/save') {
            response = await handleSaveText(request, env);
          }
          if (path === '/api/sf/v1/delete') {
            response = await handleDeleteText(request, env);
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
            response = await sl_addLink(request, env);
          }

          for (const [key, value] of Object.entries(corsHeaders_GPO)) {
            response.headers.set(key, value);
          }
          return response;
        }

        return new Response(getMainPage("AyUndz API Service", "<h1>404 Not Found</h1>", "<p>The page you are looking for cannot be found, please check and try again.</p>"), { status: 404, headers: { 'Content-Type': 'text/html', ...corsHeaders_GPO } });

      }
      
      if (hostname === 'chat.undz.cn' || hostname === 'c.undz.cn') {

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
            const response = await proxyStaticFile("https://r1.undz.cn/logo.png", url.protocol);
            return response;
          }

          return new Response(getMainPage("Ay Online Chat Room", "<h1>404 Not Found</h1>", "<p>The page you are looking for cannot be found, please check and try again.</p>"), { status: 404, headers: { 'Content-Type': 'text/html', ...corsHeaders_GO } });
        }

      }
      return new Response(getMainPage("Undz Service Router", "<h1>Undz Service Router</h1>", "<p>Sorry, we can't find the hostname you are trying to access. Please try again.</p>"), { status: 404, headers: { 'Content-Type': 'text/html' } });
    } catch (err) {
      console.error(err);
      return new Response(`Worker threw exception: ${err.message}\nStack: ${err.stack || "no stack"}`, { status: 500, headers: { "Content-Type": "text/plain" } });
    }
  }
};
async function getDebugInfo(env, request) {
  const url = new URL(request.url);
  const keyParam = url.searchParams.get("key") || '';
  const userAgent = request.headers.get('User-Agent') || '';
  const platform = request.headers.get('sec-ch-ua-platform') || '';
  const cookie = request.headers.get('Cookie') || '';
  const isWechat = !!userAgent.match(/MicroMessenger/i);
  const clientIP = request.headers.get('CF-Connecting-IP');

  const info = {
    status: 'ok',
    timestamp: Date.now(),
    iso_time: new Date().toISOString(),
    env_vars: {
      // 仅显示是否已设置，不暴露实际值
      GITHUB_TOKEN: !!env.GITHUB_TOKEN,
      OWNER: !!env.OWNER,
      REPO: !!env.REPO,
      WORKFLOW_ID: !!env.WORKFLOW_ID,
      BRANCH: !!env.BRANCH,
      RESEND_API_KEY: !!env.RESEND_API_KEY,
      KEY: !!env.KEY,
      GOKEY: !!env.GOKEY,
      DB: !!env.db,
      KV: !!env.kv,
      isWechat: isWechat,
      clientIP: clientIP,
      cookie: keyParam ? cookie : 'Hiden (no key provided)',
      userAgent: userAgent,
      platform: platform,
    },
    db_test: null,
    kv_test: null,
  };

  // 测试 D1 数据库连接
  if (env.db) {
    try {
      const stmt = await env.db.prepare('SELECT 1 AS test');
      const { results } = await stmt.all();
      info.db_test = { success: true, result: results };
    } catch (e) {
      info.db_test = { success: false, error: e.message };
    }
  } else {
    info.db_test = { success: false, error: 'No DB binding' };
  }

  // 测试 KV 连接
  if (env.kv) {
    try {
      const testKey = 'debug_test_key';
      await env.kv.put(testKey, 'test', { expirationTtl: 60 });
      const val = await env.kv.get(testKey);
      await env.kv.delete(testKey);
      info.kv_test = { success: true, value: val };
    } catch (e) {
      info.kv_test = { success: false, error: e.message };
    }
  } else {
    info.kv_test = { success: false, error: 'No KV binding' };
  }

  return info;
}