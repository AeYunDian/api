// 导入处理函数
import { handleSendVerification } from './mail_verify/send.js';
import { handleVerifyCode } from './mail_verify/verify.js';
import { sl_parseLink } from './short_link/parse_link.js';
import { sl_addLink } from './short_link/add_link.js';
import { sl_initLink } from './short_link/init_database.js';
import { getMainPage, escapeHtml, proxyStaticFile} from './utils.js';
import { CreateAccount, InitDatabase, Login, PushUserBag, GetUserBag, Logout } from './crossfire/v1/crossfire.js';
import { triggerWorkflow } from './trigger_workflow.js';
import { net_proxy } from './net_proxy.js';
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
} from './chat_room.js';


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

    try {
      if (hostname === 'api.undz.cn') {
        if (request.method === 'OPTIONS') {
          return new Response(null, { headers: corsHeaders_GPO });
        }

        if (request.method === 'GET') {

          if (path === "/") {
            return new Response(getMainPage(), { headers: { 'Content-Type': 'text/html' } });
          }
          if (path === '/go/parse') {
            return new Response(await sl_parseLink(request, env), { headers: { 'Content-Type': 'application/json' } });
          }
          if (path === '/go/init') {
            return new Response(await sl_initLink(request, env), { headers: { 'Content-Type': 'application/json' } });
          }
          if (path.startsWith('/gh/')) {
            return await net_proxy(url, request, false);
          }
          if (path.startsWith('/gh_fix/')) {
            return await net_proxy(url, request, true);
          }
          if (path === "/trigger") {
            return await triggerWorkflow(env);
          }
          if (path === "/debuginfo") {
            const info = await getDebugInfo(env);
            return new Response(JSON.stringify(info, null, 2), {
              headers: { 'Content-Type': 'application/json', ...corsHeaders_GPO }
            });
          }
          return new Response(getMainPage("AyUndz API Service", "404 Not Found", "The page you are trying to access cannot be found, please check and try again."), { status: 404, headers: { 'Content-Type': 'text/html' } });
        }

        // 路由处理
        if (request.method === 'POST') {
          let response = new Response(JSON.stringify({ error: "404 Not Found" }), { status: 404 });
          if (path === '/api/verifymail/v1/send') {
            response = await handleSendVerification(request, env);
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

        return new Response(getMainPage("AyUndz API Service", "404 Not Found", JSON.stringify({ error: "The page you are looking for cannot be found, please check and try again" })), { status: 404, headers: { 'Content-Type': 'text/html', ...corsHeaders_GPO } });

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

          if (path === "/clean") {
            const response = await chat_clean(db, url, isSuper);
            return response;
          }

          if (path === "/") return new Response(chat_getIndexHtml(), { headers: { "Content-Type": "text/html; charset=utf-8" } });

          if (path === "/chat") return new Response(chat_getChatHtml(), { headers: { "Content-Type": "text/html; charset=utf-8" } });

          if (path.toLowerCase() === "/favicon.ico") {
            const response = await proxyStaticFile("https://r1.undz.cn/favicon.ico", url.protocol);
            return response;
          }
          if (path.toLowerCase() === "/logo.png") {
            const response = await proxyStaticFile("https://r1.undz.cn/logo.png", url.protocol);
            return response;
          }

          return new Response(getMainPage("Ay Online Chat Room", "404 Not Found", "The page you are looking for cannot be found, please check and try again"), { status: 404, headers: { 'Content-Type': 'text/html', ...corsHeaders_GO } });
        }

      }
      return new Response(getMainPage("Undz Service Router", "Undz Service Router", "Sorry, we can't find the hostname you are trying to access. Please try again."), { status: 404, headers: { 'Content-Type': 'text/html' } });
    } catch (err) {
      console.error(err);
      return new Response(`Worker threw exception: ${err.message}\nStack: ${err.stack || "no stack"}`, { status: 500, headers: { "Content-Type": "text/plain" } });
    }
  }
};
async function getDebugInfo(env) {
  const info = {
    status: 'ok',
    timestamp: Date.now(),
    iso_time: new Date().toISOString(),
    api_routes: [
      'GET /',
      'GET /debuginfo',
      'GET /go/parse?link=',
      'GET /go/init?key=',
      'GET /gh/* (proxy)',
      'GET /gh_fix/* (proxy with rewrite)',
      'GET /trigger',
      'POST /api/verifymail/v1/send',
      'POST /api/verifymail/v1/verify',
      'POST /api/crossfire/v1/account/create',
      'POST /api/crossfire/v1/account/init',
      'POST /api/crossfire/v1/account/login',
      'POST /api/crossfire/v1/account/logout',
      'POST /api/crossfire/v1/bag/get',
      'POST /api/crossfire/v1/bag/push',
      'POST /go/addlink',
    ],
    chat_routes: [
      'GET / (chat index)',
      'GET /chat (chat room)',
      'GET /setting (admin)',
      'GET /init (init tables)',
      'GET /create (create user)',
      'GET /verify (verify user)',
      'GET /send (send message)',
      'GET /poll (poll messages)',
      'GET /clean (admin clean)',
      'GET /api/admin/* (admin api)',
    ],
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