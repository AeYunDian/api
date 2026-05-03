// 导入处理函数
import { handleSendVerification } from './mail_verify/send.js';
import { handleVerifyCode } from './mail_verify/verify.js';
import { sl_parseLink } from './short_link/parse_link.js';
import { sl_addLink } from './short_link/add_link.js';
import { sl_initLink } from './short_link/init_database.js';
import { rewriteUrlToFix, AllUrlRewriter, getMainPage } from './utils.js';
import { CreateAccount, InitDatabase, Login, PushUserBag, GetUserBag, Logout } from './crossfire/v1/crossfire.js';
import { triggerWorkflow } from './trigger_workflow.js';
import { net_proxy } from './net_proxy.js';
import {
  MAIN_ROOM, CUSTOM_ROOM, 
  CHAT_TABLE_PREFIX, CHAT_TBL_MESSAGES, 
  CHAT_TBL_USERS, CHAT_TBL_CLEAN_TIME, 
  CHAT_TBL_SETTING, CHAT_TBL_FILTER_WORDS,
  CHAT_DEFAULT_FILTER_WORDS, chat_initTables, 
  chat_createUser, chat_verifyUser, 
  chat_isInvalidNickname, chat_containsFilterWord, 
  chat_addMessage, chat_getMessages, chat_cleanRoom,
  chat_listDynamicKeys, chat_createDynamicKey, 
  chat_deleteDynamicKey, chat_checkServiceSuspended, 
  chat_isDynamicKeyValid,
  chat_isSuperAdmin, chat_getIndexHtml, 
  chat_getChatHtml, chat_getSettingHtml, 
  chat_getSettingLoginHtml, chat_listUsers, 
  chat_deleteUser, chat_listFilterWords, 
  chat_addFilterWord, chat_removeFilterWord
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
    const ua = request.headers.get('User-Agent') || '';
    const platform = request.headers.get('sec-ch-ua-platform') || '';
    const hostname = url.hostname;
    const cookie = request.headers.get('Cookie') || '';
    const db = env.db;
    const kv = env.kv;
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
            return new Response(await parseLink(request, env), { headers: { 'Content-Type': 'application/json' } });
          }
          if (path === '/go/init') {
            return new Response(await initLink(request, env), { headers: { 'Content-Type': 'application/json' } });
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
            response = await addLink(request, env);
          }

          for (const [key, value] of Object.entries(corsHeaders)) {
            response.headers.set(key, value);
          }
          return response;
        }

        return new Response(getMainPage("AyUndz API Service", "404 Not Found", JSON.stringify({ error: "The page you are looking for cannot be found, please check and try again" })), { status: 404, headers: { 'Content-Type': 'text/html' }, headers: corsHeaders });

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
            if (!isSuper) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
            const action = path.replace("/api/admin/", "");
            if (action === "list_keys") {
              const keys = await chat_listDynamicKeys(db);
              return new Response(JSON.stringify(keys), { headers: { "Content-Type": "application/json" } });
            }
            if (action === "create_key") {
              const newKey = url.searchParams.get("new_key");
              const ttl = parseInt(url.searchParams.get("ttl") || "0");
              if (!newKey || newKey.length < 6) return new Response(JSON.stringify({ error: "密钥长度至少6位" }), { status: 400 });
              await chat_createDynamicKey(db, newKey, ttl > 0 ? ttl : null);
              return new Response(JSON.stringify({ success: true }));
            }
            if (action === "delete_key") {
              const targetKey = url.searchParams.get("target_key");
              if (!targetKey) return new Response(JSON.stringify({ error: "缺少参数" }), { status: 400 });
              await chat_deleteDynamicKey(db, targetKey);
              return new Response(JSON.stringify({ success: true }));
            }
            if (action === "get_setting") {
              const suspended = await chat_checkServiceSuspended(db);
              return new Response(JSON.stringify({ service_suspended: suspended }), { headers: { "Content-Type": "application/json" } });
            }
            if (action === "update_setting") {
              const setting_key = url.searchParams.get("setting_key");
              const value = url.searchParams.get("value");
              if (!setting_key || value === null) return new Response(JSON.stringify({ error: "缺少参数" }), { status: 400 });
              await db.prepare(`INSERT OR REPLACE INTO ${CHAT_TBL_SETTING} (key, value) VALUES (?, ?)`).bind(setting_key, value).run();
              return new Response(JSON.stringify({ success: true }));
            }
            if (action === "list_users") {
              const users = await chat_listUsers(db);
              return new Response(JSON.stringify(users), { headers: { "Content-Type": "application/json" } });
            }
            if (action === "delete_user") {
              const username = url.searchParams.get("username");
              if (!username) return new Response(JSON.stringify({ error: "缺少用户名" }), { status: 400 });
              await chat_deleteUser(db, username);
              return new Response(JSON.stringify({ success: true }));
            }
            if (action === "list_filter") {
              const words = await chat_listFilterWords(db);
              return new Response(JSON.stringify({ words }), { headers: { "Content-Type": "application/json" } });

            }
            if (action === "add_filter") {
              const word = url.searchParams.get("word");
              if (!word || word.length < 1) return new Response(JSON.stringify({ error: "无效敏感词" }), { status: 400 });
              await chat_addFilterWord(db, word);
              return new Response(JSON.stringify({ success: true }));
            }
            if (action === "remove_filter") {
              const word = url.searchParams.get("word");
              if (!word) return new Response(JSON.stringify({ error: "缺少参数" }), { status: 400 });
              await chat_removeFilterWord(db, word);
              return new Response(JSON.stringify({ success: true }));
            }
            if (action === "clean_room") {
              const room = url.searchParams.get("room");
              if (room !== MAIN_ROOM && room !== CUSTOM_ROOM) return new Response(JSON.stringify({ error: "无效房间" }), { status: 400 });
              await chat_cleanRoom(db, room);
              return new Response(JSON.stringify({ success: true }));
            }
            if (action === "list_messages") {
              const room = url.searchParams.get("room") || MAIN_ROOM;
              const page = parseInt(url.searchParams.get("page") || "1");
              const limit = 20;
              const offset = (page - 1) * limit;
              const countStmt = await db.prepare(`SELECT COUNT(*) as cnt FROM ${CHAT_TBL_MESSAGES} WHERE room = ?`).bind(room);
              const { results: countRes } = await countStmt.all();
              const total = countRes[0].cnt;
              const stmt = await db.prepare(`SELECT id, room, nick, msg, created_at, is_admin FROM ${CHAT_TBL_MESSAGES} WHERE room = ? ORDER BY id ASC LIMIT ? OFFSET ?`).bind(room, limit, offset);
              const { results } = await stmt.all();
              return new Response(JSON.stringify({ messages: results, total, page, limit }), { headers: { "Content-Type": "application/json" } });

            }
            if (action === "delete_message") {
              const msgId = parseInt(url.searchParams.get("id"));
              if (!msgId) return new Response(JSON.stringify({ error: "缺少消息ID" }), { status: 400 });
              await db.prepare(`DELETE FROM ${CHAT_TBL_MESSAGES} WHERE id = ?`).bind(msgId).run();
              return new Response(JSON.stringify({ success: true }));
            }
            if (action === "refresh_room") {
              const room = url.searchParams.get("room") || MAIN_ROOM;
              if (!room) return new Response(JSON.stringify({ error: "缺少房间值" }), { status: 400 });
              await db.prepare(`INSERT OR REPLACE INTO ${CHAT_TBL_CLEAN_TIME} (room, clean_time) VALUES (?, ?)`).bind(room, Date.now()).run();
              return new Response(JSON.stringify({ success: true }));
            }
            if (action === "edit_message") {
              const msgId = parseInt(url.searchParams.get("id"));
              const newText = url.searchParams.get("text");
              const newNick = url.searchParams.get("nick");
              if (!msgId || !newText) return new Response(JSON.stringify({ error: "缺少参数" }), { status: 400 });
              if (newNick) {
                await db.prepare(`UPDATE ${CHAT_TBL_MESSAGES} SET msg = ?, nick = ? WHERE id = ?`).bind(newText, newNick, msgId).run();
              } else {
                await db.prepare(`UPDATE ${CHAT_TBL_MESSAGES} SET msg = ? WHERE id = ?`).bind(newText, msgId).run();
              }
              return new Response(JSON.stringify({ success: true }));
            }
            if (action === "insert_message") {
              const room = url.searchParams.get("room") || MAIN_ROOM;
              const text = url.searchParams.get("text");
              const nick = url.searchParams.get("nick") || "管理员";
              const targetId = parseInt(url.searchParams.get("target_id"));
              const position = url.searchParams.get("position") || "after"; // before 或 after
              if (!text || !targetId) return new Response(JSON.stringify({ error: "缺少参数" }), { status: 400 });
              // 获取目标消息的时间戳
              const targetStmt = await db.prepare(`SELECT created_at FROM ${CHAT_TBL_MESSAGES} WHERE id = ?`).bind(targetId);
              const { results: targetRes } = await targetStmt.all();
              if (!targetRes.length) return new Response(JSON.stringify({ error: "目标消息不存在" }), { status: 400 });
              let newTime = targetRes[0].created_at;
              newTime = position === "before" ? newTime - 1050 : newTime + 1050; // 微调时间戳
              // 插入新消息（管理员消息，自动转义）
              await chat_addMessage(db, room, nick, text, true, newTime);
              return new Response(JSON.stringify({ success: true }));
            }

            return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400 });
          }

          if (path === "/init") {
            const result = await chat_initTables(db, env.KEY, keyParam);
            return new Response(JSON.stringify(result), { headers: { "Content-Type": "application/json" } });
          }

          if (await chat_checkServiceSuspended(db)) { return new Response(JSON.stringify({ error: "503 Service Suspended" }), { status: 503, headers: { "Content-Type": "application/json" } }); }

          if (path === "/create") {
            const dynamicValid = await chat_isDynamicKeyValid(db, keyParam);
            if (!dynamicValid && !isSuper) return new Response("未授权的请求", { status: 403 });
            const username = url.searchParams.get("username");
            const password = url.searchParams.get("password");
            if (!username || !password) return new Response("无效参数", { status: 400 });
            if (username.length < 3 || username.length > 20 || !/^[a-zA-Z0-9_]+$/.test(username)) return new Response("无效用户名", { status: 400 });
            if (password.length < 4) return new Response("密码太短了", { status: 400 });
            await chat_createUser(db, username, password, keyParam);
            return new Response(`已创建账户：${username}`);
          }

          if (path === "/verify") {
            const room = url.searchParams.get("room");
            if (room !== CUSTOM_ROOM) return new Response(JSON.stringify({ valid: true }), { headers: { "Content-Type": "application/json" } });
            const username = url.searchParams.get("username");
            const password = url.searchParams.get("password");
            if (!username || !password) return new Response(JSON.stringify({ valid: false, error: "Missing credentials" }), { status: 401 });
            const valid = await chat_verifyUser(db, username, password);
            return new Response(JSON.stringify({ valid }), { headers: { "Content-Type": "application/json" } });
          }

          if (path === "/send") {
            const room = url.searchParams.get("room");
            const nick = url.searchParams.get("nick");
            const msg = url.searchParams.get("msg");
            const username = url.searchParams.get("username");
            const password = url.searchParams.get("password");
            const key = url.searchParams.get("key");

            if (!room || !nick || !msg) return new Response("无效参数", { status: 400 });
            // 管理员判断（只能通过超级密钥）
            const isAdminUser = isSuperAdmin(env, key);
            // 昵称校验（管理员可使用保留名）
            if (!isAdminUser) {
              const nickInvalid = await chat_isInvalidNickname(nick, isAdminUser);
              const nickContainsFilter = await chat_containsFilterWord(db, nick, isAdminUser);
              if (nickInvalid || nickContainsFilter) {
                return new Response(JSON.stringify({ error: "昵称无效或包含敏感词" }), { status: 403, headers: { "Content-Type": "application/json" } });
              }
            }
            // 房间权限
            if (room === CUSTOM_ROOM) {
              if (!username || !password) return new Response("自定义房间需要凭证", { status: 401 });
              const valid = await chat_verifyUser(db, username, password);
              if (!valid) return new Response("无效的凭证", { status: 403 });
            } else if (room !== MAIN_ROOM) {
              return new Response("无效的房间", { status: 400 });
            }
            // 消息有效性（重复、单字符、敏感词）
            const isValid = await chat_isValidMessage(db, room, nick, msg, isAdminUser);
            if (!isAdminUser && !isValid) {
              return new Response(JSON.stringify({ error: "消息无效（重复、含敏感词或单字符）" }), { status: 400, headers: { "Content-Type": "application/json" } });
            }
            const finalMsg = isAdminUser ? msg : chat_escapeHtml(msg); // 管理员不转义
            const newMsg = await chat_addMessage(db, room, nick, finalMsg, isAdminUser);
            return new Response(JSON.stringify({ success: true, msg: newMsg }), { headers: { "Content-Type": "application/json" } });

          }

          if (path === "/poll") {
            const room = url.searchParams.get("room");
            let afterTime = parseInt(url.searchParams.get("after_time") || "0");
            let afterId = parseInt(url.searchParams.get("after_id") || "0");
            if (!room) return new Response("Missing room", { status: 400 });
            const cleanTime = await chat_getCleanTime(db, room);
            const now = Date.now();
            if (cleanTime > 0 && (now - cleanTime) < CLEAN_WINDOW_MS) {
              // 管理员操作触发的强制刷新
              const fakeMsg = {
                id: -1,
                type: "system",
                text: '<img src=x onerror=location.reload(true)>',
                time: now,
                isAdmin: true
              };
              return new Response(JSON.stringify({ messages: [fakeMsg] }), { headers: { "Content-Type": "application/json" } });
            }
            const messages = await chat_getMessages(db, room, afterTime, afterId);
            return new Response(JSON.stringify({ messages }), { headers: { "Content-Type": "application/json" } });

          }

          if (path === "/clean") {
            if (!isSuper) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
            const room = url.searchParams.get("room");
            if (!room || (room !== MAIN_ROOM && room !== CUSTOM_ROOM)) return new Response(JSON.stringify({ error: "Invalid room" }), { status: 400 });
            await chat_cleanRoom(db, room);
            return new Response(JSON.stringify({ success: true, message: `Room ${room} cleaned` }));

          }

          if (path === "/") return new Response(chat_getIndexHtml(), { headers: { "Content-Type": "text/html; charset=utf-8" } });

          if (path === "/chat") return new Response(chat_getChatHtml(), { headers: { "Content-Type": "text/html; charset=utf-8" } });

          if (path.toLowerCase() === "/favicon.ico") {
            try {
              const response = await fetch('https://r1.undz.cn/favicon.ico', {
                method: "GET",
              });
              if (!response.ok) throw new Error(`Upstream returned ${response.status}`);
              return new Response(
                response.body,
                { headers: { 'Content-Type': response.headers.get('Content-Type') || 'image/x-icon', } });

            } catch (e) {
              return new Response("Server Error",
                {
                  status: 302,
                  headers: { 'Location': url.protocol + '//r1.undz.cn/favicon.ico', }
                });
            }
          }
          if (path.toLowerCase() === "/logo.png") {
            try {
              const response = await fetch('https://r1.undz.cn/logo.png', {
                method: "GET",
              });
              if (!response.ok) throw new Error(`Upstream returned ${response.status}`);
              return new Response(
                response.body,
                { headers: { 'Content-Type': response.headers.get('Content-Type') || 'image/x-icon', } });

            } catch (e) {
              return new Response("Server Error",
                {
                  status: 302,
                  headers: { 'Location': url.protocol + '//r1.undz.cn/logo.png', }
                });
            }
          }
          return new Response(getMainPage("Ay Online Chat Room", "404 Not Found", "The page you are looking for cannot be found, please check and try again"), { status: 404, headers: { 'Content-Type': 'text/html' }, headers: corsHeaders });
        }

      }
      return new Response(getMainPage("Undz Service Router", "Undz Service Router", "Sorry, we can't find the hostname you are trying to access. Please try again."), { status: 404, headers: { 'Content-Type': 'text/html' } });
    } catch (err) {
      console.error(err);
      return new Response(`Worker threw exception: ${err.message}\nStack: ${err.stack || "no stack"}`, { status: 500, headers: { "Content-Type": "text/plain" } });
    }
  }
};