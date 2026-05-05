import { escapeHtml } from "./utils.js";

// ========== 配置 ==========
const MAX_MESSAGES = 200;
const globalLastMsgCache = new Map();
const MAIN_ROOM = "main";
const CUSTOM_ROOM = "custom";
const CLEAN_WINDOW_MS = 2100;
const CHAT_TABLE_PREFIX = "chat_";
const CHAT_TBL_MESSAGES = `${CHAT_TABLE_PREFIX}messages`;
const CHAT_TBL_ADMIN_KEYS = `${CHAT_TABLE_PREFIX}admin_keys`;
const CHAT_TBL_USERS = `${CHAT_TABLE_PREFIX}users`;
const CHAT_TBL_CLEAN_TIME = `${CHAT_TABLE_PREFIX}clean_time`;
const CHAT_TBL_SETTING = `${CHAT_TABLE_PREFIX}setting`;
const CHAT_TBL_FILTER_WORDS = `${CHAT_TABLE_PREFIX}filter_words`;

// 默认敏感词列表
const CHAT_DEFAULT_FILTER_WORDS = ["sb", "cnm", "fuck", "傻逼", "操你妈", "妈逼", "尼玛", "草泥马", "nmsl", "脑残"];


export async function chat_checkServiceSuspended(db) {
  const stmt = await db.prepare(`SELECT value FROM ${CHAT_TBL_SETTING} WHERE key = 'service_suspended'`);
  const { results } = await stmt.all();
  return results.length > 0 && results[0].value == '1';
}

// 检查是否包含敏感词（从数据库读取）
async function chat_containsFilterWord(db, text, isAdmin) {
  if (isAdmin) { return false };
  const stmt = await db.prepare(`SELECT word FROM ${CHAT_TBL_FILTER_WORDS}`);
  const { results } = await stmt.all();
  const lowerText = text.toLowerCase();
  for (const row of results) {
    if (lowerText.includes(row.word.toLowerCase())) return true;
  }
  return false;
}

// 检查是否为无效昵称
function chat_isInvalidNickname(nick, isAdminRequest) {
  if (isAdminRequest) { return false };
  const reserved = ["admin", "root", "administrator", "null", "undefined", "system"];
  const lower = nick.toLowerCase();
  if (reserved.includes(lower)) return true;
  // 昵称长度限制
  if (nick.length < 1 || nick.length > 30) return true;
  // 不能全是空白字符
  if (!nick.trim()) return true;
  return false;
}

// 检查消息是否有效（非空、非单字符/标点、不重复内容）
async function chat_isValidMessage(db, room, nick, text, isAdmin) {
  if (isAdmin) return true;
  const trimmed = text.trim();
  if (trimmed === "") return false;
  if (trimmed.length === 1) return false;
  if (/^[\p{P}\p{S}]+$/u.test(trimmed)) return false;
  if (await chat_containsFilterWord(db, text, isAdmin)) return false;

  // 仅对公共房间施加特殊限制
  if (room === MAIN_ROOM) {
    const key = `${room}:${nick}`;
    const last = globalLastMsgCache.get(key);
    if (last) {
      // 1. 禁止连续发送相同内容
      if (last.text === text) return false;
      // 2. 发送间隔不得小于3秒
      if (Date.now() - last.time < 3000) return false;
    }
    // 更新缓存
    globalLastMsgCache.set(key, { text, time: Date.now() });
  }
  // 简单清理：每次记录时，遍历删除超过 10 分钟的条目（可根据实际情况调整）
  const now = Date.now();
  for (const [key, value] of globalLastMsgCache) {
    if (now - value.time > 600000) {  // 10 分钟无活动
      globalLastMsgCache.delete(key);
    }
  }
  return true;
}

// ========== 数据库初始化==========
export async function chat_initTables(db, envKey, providedKey) {
  if (providedKey !== envKey) return { error: "Unauthorized" };
  try {
    await db.exec(`CREATE TABLE IF NOT EXISTS ${CHAT_TBL_MESSAGES} (id INTEGER PRIMARY KEY AUTOINCREMENT, room TEXT NOT NULL, nick TEXT NOT NULL, msg TEXT NOT NULL, is_admin INTEGER DEFAULT 0, created_at INTEGER NOT NULL);`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_room ON ${CHAT_TBL_MESSAGES}(room);`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_created_at ON ${CHAT_TBL_MESSAGES}(created_at);`);
    await db.exec(`CREATE TABLE IF NOT EXISTS ${CHAT_TBL_ADMIN_KEYS} (key TEXT PRIMARY KEY, created_at INTEGER NOT NULL, expires_at INTEGER, status TEXT DEFAULT 'active');`);
    await db.exec(`CREATE TABLE IF NOT EXISTS ${CHAT_TBL_USERS} (username TEXT PRIMARY KEY, password TEXT NOT NULL, created_by_key TEXT, created_at INTEGER);`);
    await db.exec(`CREATE TABLE IF NOT EXISTS ${CHAT_TBL_CLEAN_TIME} (room TEXT PRIMARY KEY, clean_time INTEGER);`);
    await db.exec(`CREATE TABLE IF NOT EXISTS ${CHAT_TBL_FILTER_WORDS} (word TEXT PRIMARY KEY);`);
    await db.exec(`CREATE TABLE IF NOT EXISTS ${CHAT_TBL_SETTING} (key TEXT PRIMARY KEY, value TEXT NOT NULL);`);
    // 插入默认暂停状态为关闭
    await db.prepare(`INSERT OR IGNORE INTO ${CHAT_TBL_SETTING} (key, value) VALUES ('service_suspended', '0')`).run();
    // 插入默认敏感词（如果表为空）
    const countStmt = await db.prepare(`SELECT COUNT(*) as cnt FROM ${CHAT_TBL_FILTER_WORDS}`);
    const { results } = await countStmt.all();
    if (results[0].cnt === 0) {
      for (const w of CHAT_DEFAULT_FILTER_WORDS) {
        await db.prepare(`INSERT INTO ${CHAT_TBL_FILTER_WORDS} (word) VALUES (?)`).bind(w).run();
      }
    }
    return { success: true, message: "Tables initialized" };
  } catch (err) {
    return { error: err.message };
  }
}

// ========== 消息操作 ==========
async function chat_getMessages(db, roomId, afterTime = 0, afterId = 0) {
  const stmt = await db.prepare(
    `SELECT id, nick, msg, created_at as time, is_admin
     FROM ${CHAT_TBL_MESSAGES}
     WHERE room = ? AND (created_at > ? OR (created_at = ? AND id > ?))
     ORDER BY created_at ASC, id ASC
     LIMIT 200`
  ).bind(roomId, afterTime, afterTime, afterId);
  const { results } = await stmt.all();
  return results.map(row => ({
    id: row.id,
    type: "message",
    nick: row.nick,
    text: row.msg,
    time: row.time,
    isAdmin: row.is_admin === 1
  }));
}

async function chat_addMessage(db, roomId, nick, text, isAdmin, timestamp = Date.now()) {
  const stmt = await db.prepare(`INSERT INTO ${CHAT_TBL_MESSAGES} (room, nick, msg, is_admin, created_at) VALUES (?, ?, ?, ?, ?)`).bind(roomId, nick, text, isAdmin ? 1 : 0, timestamp);
  const result = await stmt.run();
  const newId = result.meta.last_row_id;
  // 清理旧消息
  const countStmt = await db.prepare(`SELECT COUNT(*) as cnt FROM ${CHAT_TBL_MESSAGES} WHERE room = ?`).bind(roomId);
  const { results: countRes } = await countStmt.all();
  const cnt = countRes[0].cnt;
  if (cnt > MAX_MESSAGES) {
    const toDelete = cnt - MAX_MESSAGES;
    await db.prepare(`DELETE FROM ${CHAT_TBL_MESSAGES} WHERE id IN (SELECT id FROM ${CHAT_TBL_MESSAGES} WHERE room = ? ORDER BY id ASC LIMIT ?)`).bind(roomId, toDelete).run();
  }
  return { id: newId, nick: escapeHtml(nick), text: isAdmin ? text : escapeHtml(text), time: timestamp, isAdmin };
}

async function chat_cleanRoom(db, roomId) {
  await db.prepare(`DELETE FROM ${CHAT_TBL_MESSAGES} WHERE room = ?`).bind(roomId).run();
  await db.prepare(`INSERT OR REPLACE INTO ${CHAT_TBL_CLEAN_TIME} (room, clean_time) VALUES (?, ?)`).bind(roomId, Date.now()).run();
}

async function chat_getCleanTime(db, roomId) {
  const stmt = await db.prepare(`SELECT clean_time FROM ${CHAT_TBL_CLEAN_TIME} WHERE room = ?`).bind(roomId);
  const { results } = await stmt.all();
  return results.length ? results[0].clean_time : 0;
}

// ========== 管理员验证（仅 env.KEY）==========
export function chat_isSuperAdmin(env, key) {
  return !!(key && env.KEY && key === env.KEY);
}

// ========== 动态密钥（仅用于自定义房间用户创建）==========
async function chat_isDynamicKeyValid(db, key) {
  const stmt = await db.prepare(`SELECT * FROM ${CHAT_TBL_ADMIN_KEYS} WHERE key = ? AND status = 'active'`).bind(key);
  const { results } = await stmt.all();
  if (results.length === 0) return false;
  const keyData = results[0];
  const now = Math.floor(Date.now() / 1000);
  if (keyData.expires_at !== null && now > keyData.expires_at) {
    await db.prepare(`UPDATE ${CHAT_TBL_ADMIN_KEYS} SET status = 'expired' WHERE key = ?`).bind(key).run();
    return false;
  }
  return true;
}

async function chat_createDynamicKey(db, newKey, expiresInSeconds = null) {
  const now = Math.floor(Date.now() / 1000);
  let expires_at = null;
  if (expiresInSeconds !== null && expiresInSeconds > 0) expires_at = now + expiresInSeconds;
  await db.prepare(`INSERT OR REPLACE INTO ${CHAT_TBL_ADMIN_KEYS} (key, created_at, expires_at, status) VALUES (?, ?, ?, 'active')`).bind(newKey, now, expires_at).run();
  return true;
}

async function chat_deleteDynamicKey(db, key) {
  await db.prepare(`DELETE FROM ${CHAT_TBL_ADMIN_KEYS} WHERE key = ?`).bind(key).run();
}

async function chat_listDynamicKeys(db) {
  const stmt = await db.prepare(`SELECT key, created_at, expires_at, status FROM ${CHAT_TBL_ADMIN_KEYS}`);
  const { results } = await stmt.all();
  const now = Math.floor(Date.now() / 1000);
  const list = {};
  for (const row of results) {
    let status = row.status;
    if (status === "active" && row.expires_at !== null && now > row.expires_at) status = "expired";
    list[row.key] = { created_at: row.created_at, expires_at: row.expires_at, status };
  }
  return list;
}

// ========== 自定义房间用户 ==========
async function chat_createUser(db, username, password, createdByKey) {
  await db.prepare(`INSERT INTO ${CHAT_TBL_USERS} (username, password, created_by_key, created_at) VALUES (?, ?, ?, ?)`).bind(username, password, createdByKey, Date.now()).run();
}
async function chat_verifyUser(db, username, password) {
  const stmt = await db.prepare(`SELECT password FROM ${CHAT_TBL_USERS} WHERE username = ?`).bind(username);
  const { results } = await stmt.all();
  if (results.length === 0) return false;
  return results[0].password === password;
}
async function chat_deleteUser(db, username) {
  await db.prepare(`DELETE FROM ${CHAT_TBL_USERS} WHERE username = ?`).bind(username).run();
}
async function chat_listUsers(db) {
  const stmt = await db.prepare(`SELECT username, created_by_key, created_at FROM ${CHAT_TBL_USERS}`);
  const { results } = await stmt.all();
  return results;
}
// ========== 敏感词管理 ==========
async function chat_addFilterWord(db, word) {
  await db.prepare(`INSERT OR IGNORE INTO ${CHAT_TBL_FILTER_WORDS} (word) VALUES (?)`).bind(word).run();
}
async function chat_removeFilterWord(db, word) {
  await db.prepare(`DELETE FROM ${CHAT_TBL_FILTER_WORDS} WHERE word = ?`).bind(word).run();
}
async function chat_listFilterWords(db) {
  const stmt = await db.prepare(`SELECT word FROM ${CHAT_TBL_FILTER_WORDS}`);
  const { results } = await stmt.all();
  return results.map(r => r.word);
}
export async function chat_clean(db, url, isSuper) {
  if (!isSuper) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  const room = url.searchParams.get("room");
  if (!room || (room !== MAIN_ROOM && room !== CUSTOM_ROOM)) return new Response(JSON.stringify({ error: "Invalid room" }), { status: 400 });
  await chat_cleanRoom(db, room);
  return new Response(JSON.stringify({ success: true, message: `Room ${room} cleaned` }));
}
export async function chat_poll(db, url) {
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
export async function chat_sendMessage(db, url, env) {
  const room = url.searchParams.get("room");
  const nick = url.searchParams.get("nick");
  const msg = url.searchParams.get("msg");
  const username = url.searchParams.get("username");
  const password = url.searchParams.get("password");
  const key = url.searchParams.get("key");

  if (!room || !nick || !msg) return new Response("无效参数", { status: 400 });
  // 管理员判断（只能通过超级密钥）
  const isAdminUser = chat_isSuperAdmin(env, key);
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
  const finalMsg = isAdminUser ? msg : escapeHtml(msg); // 管理员不转义
  const newMsg = await chat_addMessage(db, room, nick, finalMsg, isAdminUser);
  return new Response(JSON.stringify({ success: true, msg: newMsg }), { headers: { "Content-Type": "application/json" } });
}
export async function chat_verifyUserRequest(db, url) {
  const room = url.searchParams.get("room");
  if (room !== CUSTOM_ROOM) return new Response(JSON.stringify({ valid: true }), { headers: { "Content-Type": "application/json" } });
  const username = url.searchParams.get("username");
  const password = url.searchParams.get("password");
  if (!username || !password) return new Response(JSON.stringify({ valid: false, error: "Missing credentials" }), { status: 401 });
  const valid = await chat_verifyUser(db, username, password);
  return new Response(JSON.stringify({ valid }), { headers: { "Content-Type": "application/json" } });
}
export async function chat_createUserPublic(db, url, isSuper, keyParam) {
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
export async function chat_handleAdminRequest(db, path, url, isSuper) {
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
    newTime = position === "before" ? newTime - 100 : newTime + 100; // 微调时间戳
    // 插入新消息（管理员消息，自动转义）
    await chat_addMessage(db, room, nick, text, true, newTime);
    return new Response(JSON.stringify({ success: true }));
  }

  return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400 });
}


// ========== IE8 完全兼容的页面 ==========
export function chat_getIndexHtml() {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>聊天室</title>
  <link rel="icon" href="/favicon.ico" type="image/x-icon" />
  <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon" />
  <style>
    body { background: #008080; font-family: Arial, 'Microsoft Sans Serif', 'Tahoma', 'Geneva', '宋体', 'WenQuanYi Micro Hei', 'Noto Sans CJK SC', monospace, sans-serif !important; margin: 0;  }
    .window { background: #c0c0c0; border: 2px solid; border-top-color: #ffffff; border-left-color: #ffffff; border-right-color: #808080; border-bottom-color: #808080; width: 700px; margin: 20px auto; }
    .title-bar { background: #000080; color: white; padding: 4px 6px; font-weight: bold; font-size: 14px; }
    .window-content { padding: 16px; }
    table.split-layout { width: 100%; border: 1px solid #808080; background: #c0c0c0; border-collapse: collapse; }
    td.sidebar { width: 120px; background: #c0c0c0; border-right: 1px solid #808080; padding: 4px; vertical-align: top; }
    td.content { background: #c0c0c0; padding: 12px; vertical-align: top; }
    .tab-button {
      background: #c0c0c0;
      border: 2px solid;
      border-top-color: #ffffff;
      border-left-color: #ffffff;
      border-right-color: #808080;
      border-bottom-color: #808080;
      width: 100%;
      text-align: left;
      padding: 6px 8px;
      margin-bottom: 4px;
      cursor: pointer;
      font-family: Arial, 'Microsoft Sans Serif', 'Tahoma', 'Geneva', '宋体', 'WenQuanYi Micro Hei', 'Noto Sans CJK SC', monospace, sans-serif !important;
      font-size: 12px;
    }
    .tab-button.active {
      border-top-color: #808080;
      border-left-color: #808080;
      border-right-color: #ffffff;
      border-bottom-color: #ffffff;
      background: #a0a0a0;
      font-weight: bold;
    }
    .tab-button:active {
      border-top-color: #808080;
      border-left-color: #808080;
      border-right-color: #ffffff;
      border-bottom-color: #ffffff;
    }
    .about-page {
      text-align: center;
    }
    .about-page img {
      height: 100px;
      vertical-align: middle;
    }
    .about-page h2 {
      display: inline-block;
      vertical-align: middle; 
      margin: 0 0 0 12px; 
    }
    input, button {
      background: #ffffff;
      border: 2px solid;
      border-top-color: #808080;
      border-left-color: #808080;
      border-right-color: #ffffff;
      border-bottom-color: #ffffff;
      padding: 4px;
      font-family: Arial, 'Microsoft Sans Serif', 'Tahoma', 'Geneva', '宋体', 'WenQuanYi Micro Hei', 'Noto Sans CJK SC', monospace, sans-serif !important;
      font-size: 12px;
    }
    button {
      border-top-color: #ffffff;
      border-left-color: #ffffff;
      border-right-color: #808080;
      border-bottom-color: #808080;
      background: #c0c0c0;
      cursor: pointer;
    }
    button:active {
      border-top-color: #808080;
      border-left-color: #808080;
      border-right-color: #ffffff;
      border-bottom-color: #ffffff;
    }
    hr { border: 1px solid #808080; border-top: 1px solid #ffffff; }
    .status-text { font-size: 12px; margin-top: 8px; }
  </style>
</head>
<body>
<div class="window">
  <div class="title-bar">聊天室登录器</div>
  <div class="window-content">
    <table class="split-layout"> <tr>
      <td class="sidebar">
        <button class="tab-button active" data-tab="main">主房间</button>
        <button class="tab-button" data-tab="custom">自定义房间</button>
        <button class="tab-button" data-tab="about">关于</button>
       </td>
      <td class="content">
        <div id="tab-main" style="display:block;">
          <p><strong>主房间</strong></p>
          <p>昵称：<input type="text" id="mainNick" maxlength="30" size="20" placeholder="你的昵称"></p>
          <button id="joinMainBtn">进入聊天室</button>
        </div>
        <div id="tab-custom" style="display:none;">
          <p><strong>自定义房间</strong></p>
          <p>用户名：<input type="text" id="customUsername" size="15"></p>
          <p>密码：<input type="password" id="customPassword" size="15"></p>
          <p>显示昵称：<input type="text" id="customNick" maxlength="30" size="20"></p>
          <button id="joinCustomBtn">进入聊天室</button>
          <hr>
          <p><strong>创建新账号</strong> (需管理员密钥)</p>
          <p>密钥：<input type="text" id="adminKey" size="10"></p>
          <p>用户名：<input type="text" id="newUsername" size="12"></p>
          <p>密码：<input type="password" id="newPassword" size="12"></p>
          <button id="createAccountBtn">创建</button>
          <span id="createResult" class="status-text"></span>
        </div>
        <div id="tab-about" style="display:none;">
          <div class="about-page">
            <img src="/logo.png"> <h2>Ay Online Chat Room</h2>
          </div>
          <hr/>
          <p>在线网络聊天室 v1.3</p>
          <p>本网站签前端由纯 HTML + 原生 JS搭建，兼容至 IE8，无任何框架依赖。</p>
          <p style="margin-top:8px; font-size:13px; text-align: center;">© 2025-2026 韵典 AeYunDian | Ay Project | Powered by Cloudflare Workers</p>
        </div>
       </td>
    </table>
  </div>
</div>
<script>
  // 辅助函数：添加/移除类名（兼容IE8）
  function addClass(el, cls) {
    var c = el.className;
    if (c.indexOf(cls) === -1) {
      el.className = c ? c + ' ' + cls : cls;
    }
  }
  function removeClass(el, cls) {
    var c = el.className;
    var pattern = new RegExp('(?:^|\\\\s)' + cls + '(?!\\\\S)', 'g');
    el.className = c.replace(pattern, '').replace(/^\\s+|\\s+$/g, '');
  }
  function trim(str) {
    return str.replace(/^\\s+|\\s+$/g, '');
  }
  var btns = document.querySelectorAll('.tab-button');
  var mainPane = document.getElementById('tab-main');
  var customPane = document.getElementById('tab-custom');
    var aboutPane = document.getElementById('tab-about');
  for (var i = 0; i < btns.length; i++) {
    btns[i].onclick = (function(btn) {
      return function() {
        var tabId = btn.getAttribute('data-tab');
        // 移除所有按钮的 active 类
        for (var j = 0; j < btns.length; j++) {
          removeClass(btns[j], 'active');
        }
        // 给当前按钮添加 active 类
        addClass(btn, 'active');
        // 切换面板显示
        if (tabId === 'main') {
          mainPane.style.display = 'block';
          customPane.style.display = 'none';
          aboutPane.style.display = 'none';
        } else if (tabId === 'custom') {
          mainPane.style.display = 'none';
          customPane.style.display = 'block';
          aboutPane.style.display = 'none';
        } else if (tabId === 'about') {
          mainPane.style.display = 'none';
          customPane.style.display = 'none';
          aboutPane.style.display = 'block';
        } else {
          mainPane.style.display = 'block';
        }
      };
    })(btns[i]);
  }
  function goToChat(room, nick, username, password) {
    var url = '/chat?room=' + encodeURIComponent(room) + '&nick=' + encodeURIComponent(nick) + '&_t=' + (new Date().getTime());
    if (username) url += '&username=' + encodeURIComponent(username);
    if (password) url += '&password=' + encodeURIComponent(password);
    window.open(url, '_blank');
  }
  document.getElementById('joinMainBtn').onclick = function() {
    var nick = trim(document.getElementById('mainNick').value);
    if (!nick) { alert('请输入昵称'); return; }
    goToChat('main', nick, '', '');
  };
  document.getElementById('joinCustomBtn').onclick = function() {
    var nick = trim(document.getElementById('customNick').value);
    var username = trim(document.getElementById('customUsername').value);
    var password = document.getElementById('customPassword').value;
    if (!nick) { alert('请输入显示昵称'); return; }
    if (!username || !password) { alert('请输入用户名和密码'); return; }
    goToChat('custom', nick, username, password);
  };
  document.getElementById('createAccountBtn').onclick = function() {
    var key = trim(document.getElementById('adminKey').value);
    var username = trim(document.getElementById('newUsername').value);
    var password = document.getElementById('newPassword').value;
    if (!key || !username || !password) { alert('请填写完整'); return; }
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/create?key=' + encodeURIComponent(key) + '&username=' + encodeURIComponent(username) + '&password=' + encodeURIComponent(password) + '&_t=' + (new Date().getTime()), true);
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        document.getElementById('createResult').innerText = xhr.responseText;
        setTimeout(function() { document.getElementById('createResult').innerText = ''; }, 3000);
      }
    };
    xhr.send();
  };
</script>
</body>
</html>`;
}

export function chat_getChatHtml() {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>聊天室</title>
  <link rel="icon" href="/favicon.ico" type="image/x-icon" />
  <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon" />
  <style>
    body { background: #008080; font-family: Arial, 'Microsoft Sans Serif', 'Tahoma', 'Geneva', '宋体', 'WenQuanYi Micro Hei', 'Noto Sans CJK SC', monospace, sans-serif !important; margin: 20px; }
    .window { background: #c0c0c0; border: 2px solid; border-top-color: #ffffff; border-left-color: #ffffff; border-right-color: #808080; border-bottom-color: #808080; width: 800px; margin: 20px auto; }
    .title-bar { background: #000080; color: white; padding: 4px 6px; font-weight: bold; font-size: 14px; }
    .window-content { padding: 8px; }
    .messages-area { background: #ffffff; border: 2px inset #808080; height: 380px; overflow-y: auto; padding: 6px; font-family: Arial, 'Microsoft Sans Serif', 'Tahoma', 'Geneva', '宋体', 'WenQuanYi Micro Hei', 'Noto Sans CJK SC', monospace, sans-serif !important; font-size: 12px; }
    .message { margin: 4px 0; word-wrap: break-word; }
    .system { color: #800000; font-style: italic; }
    .self { background: #e0ffe0; border-left: 4px solid #008000; padding-left: 4px; }
    .other { background: #ffffe0; border-left: 4px solid #c0c000; padding-left: 4px; }
    .nick { font-weight: bold; color: #000080; }
    .input-area { margin-top: 8px; background: #c0c0c0; padding: 6px; border: 1px solid #808080; }
    .input-area input { width: 70%; background: #ffffff; border: 2px inset #808080; padding: 4px; font-family: Arial, 'Microsoft Sans Serif', 'Tahoma', 'Geneva', '宋体', 'WenQuanYi Micro Hei', 'Noto Sans CJK SC', monospace, sans-serif !important;}
    .input-area button {
      background: #c0c0c0;
      border: 2px solid;
      border-top-color: #ffffff;
      border-left-color: #ffffff;
      border-right-color: #808080;
      border-bottom-color: #808080;
      padding: 4px 12px;
      cursor: pointer;
      margin-left: 6px;
    }
    .input-area button:active {
      border-top-color: #808080;
      border-left-color: #808080;
      border-right-color: #ffffff;
      border-bottom-color: #ffffff;
    }
    .error-msg { background: #ffffa0; border: 1px solid #808080; padding: 4px; margin-bottom: 8px; color: #c00000; font-weight: bold; text-align: center; }
  </style>
</head>
<body>
<div class="window">
  <div class="title-bar"><span id="roomInfo">聊天室</span></div>
  <div class="window-content">
    <div id="errorMsg" class="error-msg" style="display:none;"></div>
    <div id="messages" class="messages-area"></div>
    <div class="input-area">
      <input type="text" id="messageInput" placeholder="输入消息..." autocomplete="off">
      <button id="sendBtn">发送 (Enter)</button>
    </div>
  </div>
</div>
<script>
  function getQueryParams() {
    var params = {};
    var search = window.location.search.substring(1);
    if (!search) return params;
    var pairs = search.split('&');
    for (var i = 0; i < pairs.length; i++) {
      var pair = pairs[i].split('=');
      var key = decodeURIComponent(pair[0]);
      var val = decodeURIComponent(pair[1] || '');
      params[key] = val;
    }
    return params;
  }
  var qp = getQueryParams();
  var room = qp.room;
  var nick = qp.nick;
  var username = qp.username || '';
  var password = qp.password || '';
  var adminKey = qp.key || '';
  var lastTime = 0;
  var lastId = 0;
  var pollInterval = null;
  var isAllowed = false;
  var isSending = false;

  function trim(str) {
    return str.replace(/^\\s+|\\s+$/g, '');
  }
  function escapeHtmlLocal(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
      if (m === '&') return '&amp;';
      if (m === '<') return '&lt;';
      if (m === '>') return '&gt;';
      return m;
    });
  }
  function formatTime(ts) {
    var d = new Date(ts);
    var h = d.getHours(), m = d.getMinutes(), s = d.getSeconds();
    if (h < 10) h = '0' + h;
    if (m < 10) m = '0' + m;
    if (s < 10) s = '0' + s;
    return h + ':' + m + ':' + s;
  }
  function showError(msg) {
    var errDiv = document.getElementById('errorMsg');
    errDiv.style.display = 'block';
    errDiv.innerText = msg;
    setTimeout(function() { errDiv.style.display = 'none'; }, 4000);
  }
  function addMessage(msg) {
    var container = document.getElementById('messages');
    var div = document.createElement('div');
    div.className = 'message';
    if (msg.type === 'system') {
      div.className = 'message system';
      div.innerHTML = '[系统] ' + msg.text;
    } else {
      var isSelfMsg = (msg.nick === nick);
      div.className = isSelfMsg ? 'message self' : 'message other';
      var timeStr = formatTime(msg.time);
      var nickHtml = '<span class="nick">' + msg.nick + '</span>';
      var textHtml = msg.isAdmin ? msg.text : msg.text;
      div.innerHTML = nickHtml + ' ' + textHtml + ' <span style="font-size:11px;">' + timeStr + '</span>';
    }
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  function pollMessages() {
    if (!isAllowed) return;
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/poll?room=' + encodeURIComponent(room) +
      '&after_time=' + lastTime + '&after_id=' + lastId +
      '&_t=' + (new Date().getTime()), true);
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4 && xhr.status === 200) {
        var data = JSON.parse(xhr.responseText);
        if (data.messages && data.messages.length) {
          for (var i = 0; i < data.messages.length; i++) {
            var msg = data.messages[i];
            addMessage(msg);
            // 更新游标为最后处理的消息
            lastTime = msg.time;
            lastId = msg.id;
          }
        }
      }
    };
    xhr.send();
  }

  function sendMessage(text) {
    if (!isAllowed || isSending) return;
    isSending = true;
    var url = '/send?room=' + encodeURIComponent(room) + '&nick=' + encodeURIComponent(nick) + '&msg=' + encodeURIComponent(text) + '&_t=' + (new Date().getTime());
    if (username && password) url += '&username=' + encodeURIComponent(username) + '&password=' + encodeURIComponent(password);
    if (adminKey) url += '&key=' + encodeURIComponent(adminKey);
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          var data = JSON.parse(xhr.responseText);
          if (data.success && data.msg) {
            // addMessage(data.msg);
            // lastId = data.msg.id;
            // 发送成功，消息会通过轮询获取到，这里不需要立即添加 （其实是有bug，但只要这样就能解决）
          } else if (data.error) {
            showError('发送失败: ' + data.error);
          } else {
            showError('发送失败: 未知错误');
          }
        } else {
          var errText = xhr.responseText;
          try {
            var errJson = JSON.parse(errText);
            showError('发送失败: ' + (errJson.error || errJson.message || errText));
          } catch(e) {
            showError('发送失败: ' + errText);
          }
        }
        setTimeout(function() { isSending = false; }, 800);
      }
    };
    xhr.send();
  }

  function preAuthenticate() {
    if (room !== 'custom') {
      isAllowed = true;
      startChat();
      return;
    }
    if (!username || !password) {
      showError('错误：自定义房间需要用户名和密码。');
      document.getElementById('messageInput').disabled = true;
      document.getElementById('sendBtn').disabled = true;
      return;
    }
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/verify?room=custom&username=' + encodeURIComponent(username) + '&password=' + encodeURIComponent(password) + '&_t=' + (new Date().getTime()), true);
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          var data = JSON.parse(xhr.responseText);
          if (data.valid) {
            isAllowed = true;
            startChat();
          } else {
            showError('账号或密码错误，无法进入聊天室。');
            document.getElementById('messageInput').disabled = true;
            document.getElementById('sendBtn').disabled = true;
          }
        } else {
          showError('验证服务器出错: ' + xhr.responseText);
          document.getElementById('messageInput').disabled = true;
          document.getElementById('sendBtn').disabled = true;
        }
      }
    };
    xhr.send();
  }

  function startChat() {
    var roomInfoSpan = document.getElementById('roomInfo');
    roomInfoSpan.innerHTML = '房间: ' + room + ' | 昵称: ' + escapeHtmlLocal(nick) + (adminKey ? ' [管理员]' : '');
    pollInterval = setInterval(pollMessages, 2000);
    pollMessages();
  }

  preAuthenticate();

  document.getElementById('sendBtn').onclick = function() {
    var input = document.getElementById('messageInput');
    var text = trim(input.value);
    if (text && isAllowed && !isSending) {
      sendMessage(text);
      input.value = '';
    }
  };
  document.getElementById('messageInput').onkeypress = function(e) {
    var evt = e || window.event;
    var key = evt.keyCode || evt.which;
    if (key === 13) document.getElementById('sendBtn').click();
  };
  window.onbeforeunload = function() {
    if (pollInterval) clearInterval(pollInterval);
  };
</script>
</body>
</html>`;
}

export function chat_getSettingLoginHtml() {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<link rel="icon" href="/favicon.ico" type="image/x-icon" />
<link rel="shortcut icon" href="/favicon.ico" type="image/x-icon" />
<title>管理登录</title>
<style>
  body { background: #008080; font-family: Arial, 'Microsoft Sans Serif', 'Tahoma', 'Geneva', '宋体', 'WenQuanYi Micro Hei', 'Noto Sans CJK SC', monospace, sans-serif !important; margin: 20px; }
  .window { background: #c0c0c0; border: 2px solid; border-top-color: #ffffff; border-left-color: #ffffff; border-right-color: #808080; border-bottom-color: #808080; width: 420px; margin: 40px auto; }
  .title-bar { background: #000080; color: white; padding: 4px 6px; font-weight: bold; font-size: 14px; }
  .window-content { padding: 16px; }
  .field-row { margin: 12px 0; }
  label { display: inline-block; }
  input, button {
    background: #ffffff;
    border: 2px solid;
    border-top-color: #808080;
    border-left-color: #808080;
    border-right-color: #ffffff;
    border-bottom-color: #ffffff;
    padding: 4px 6px;
    font-family: inherit;
    font-size: 12px;
  }
  button {
    background: #c0c0c0;
    border-top-color: #ffffff;
    border-left-color: #ffffff;
    border-right-color: #808080;
    border-bottom-color: #808080;
    cursor: pointer;
    padding: 4px 12px;
  }
  button:active {
    border-top-color: #808080;
    border-left-color: #808080;
    border-right-color: #ffffff;
    border-bottom-color: #ffffff;
  }
  .error { background: #ffffa0; border: 1px solid #808080; padding: 4px; color: #c00000; margin-bottom: 12px; }
</style>
</head>
<body>
<div class="window">
  <div class="title-bar">管理登录</div>
  <div class="window-content">
    <div id="errorMsg" class="error" style="display:none;"></div>
    <div class="field-row" style="text-align:center; "><label>管理员密钥：</label><input type="password" id="adminKey" size="24"></div>
    <div style="text-align:center; margin-top:20px;"><button id="loginBtn">登录</button></div>
  </div>
</div>
<script>
function trim(s){ return s.replace(/^\\s+|\\s+$/g,''); }
document.getElementById('loginBtn').onclick=function(){
  var key=trim(document.getElementById('adminKey').value);
  if(!key){ alert('请输入密钥'); return; }
  window.location.href='/setting?key='+encodeURIComponent(key) + '&_t=' + (new Date().getTime());
};
</script>
</body></html>`;
}

export function chat_getSettingHtml(currentKey) {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">  <link rel="icon" href="/favicon.ico" type="image/x-icon" />
  <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon" /><title>管理面板</title>
<style>
  body { background: #008080; font-family: Arial, 'Microsoft Sans Serif', 'Tahoma', 'Geneva', '宋体', 'WenQuanYi Micro Hei', 'Noto Sans CJK SC', monospace, sans-serif !important; margin: 20px; }
  .window { background: #c0c0c0; border: 2px solid; border-top-color: #ffffff; border-left-color: #ffffff; border-right-color: #808080; border-bottom-color: #808080; width: 1100px; margin: 20px auto; }
  .title-bar { background: #000080; color: white; padding: 4px 6px; font-weight: bold; font-size: 14px; }
  .window-content { padding: 12px; }
  .section { border: 1px solid #808080; background: #d4d0c8; margin: 16px 0; padding: 10px; }
  .section h3 { margin: 0 0 10px 0; background: #c0c0c0; padding: 4px 6px; font-size: 14px; border: 1px solid #808080; }
  table { width: 100%; border-collapse: collapse; background: #ffffff; margin-top: 8px; }
  th, td { border: 1px solid #808080; padding: 4px 6px; font-size: 12px; vertical-align: top; }
  th { background: #c0c0c0; }
  input, button {
    background: #ffffff;
    border: 2px solid;
    border-top-color: #808080;
    border-left-color: #808080;
    border-right-color: #ffffff;
    border-bottom-color: #ffffff;
    padding: 4px 6px;
    font-family: inherit;
    font-size: 12px;
  }
  button {
    background: #c0c0c0;
    border-top-color: #ffffff;
    border-left-color: #ffffff;
    border-right-color: #808080;
    border-bottom-color: #808080;
    cursor: pointer;
    padding: 4px 12px;
  }
  button:active {
    border-top-color: #808080;
    border-left-color: #808080;
    border-right-color: #ffffff;
    border-bottom-color: #ffffff;
  }
  .action-bar { margin-bottom: 8px; }
  .action-bar button { margin-right: 8px; }
</style>
</head>
<body>
<div class="window">
  <div class="title-bar">聊天室管理面板</div>
  <div class="window-content">
    <div class="section">
      <h3>服务控制</h3>
      <div class="action-bar">
      <button id="toggleServiceBtn">暂停服务</button>
      <span id="serviceStatus"></span>
    </div>
    </div>
    <div class="section">
      <h3>房间管理</h3>
      <div class="action-bar">
        <button id="cleanMainBtn">清除主房间消息</button>
        <button id="cleanCustomBtn">清除自定义房间消息</button>
        <button id="refreshMainBtn">刷新位于主房间的客户端</button>
        <button id="refreshCustomBtn">刷新位于自定义房间的客户端</button>
      </div>
    </div>
    <div class="section">
      <h3>动态密钥管理</h3>
      <div class="action-bar">
        <input type="text" id="newKey" placeholder="新密钥" size="20">
        <input type="number" id="ttl" placeholder="有效期(秒,0=永不过期)" size="10">
        <button id="createKeyBtn">创建密钥</button>
      </div>
      <table id="keysTable">
        <thead><tr><th>密钥</th><th>创建时间</th><th>过期时间</th><th>状态</th><th>操作</th></tr></thead>
        <tbody></tbody>
      </table>
    </div>
    <div class="section">
      <h3>自定义房间用户管理</h3>
      <table id="usersTable">
        <thead><tr><th>用户名</th><th>创建者密钥</th><th>创建时间</th><th>操作</th></tr></thead>
        <tbody></tbody>
      </table>
    </div>
    <div class="section">
      <h3>敏感词管理</h3>
      <div class="action-bar">
        <input type="text" id="newWord" placeholder="敏感词"><button id="addWordBtn">添加</button>
      </div>
      <table id="filterTable">
        <thead><tr><th>敏感词</th><th>操作</th></tr></thead>
        <tbody></tbody>
      </table>
    </div>

    <div class="section">
      <h3>消息管理</h3>
      <div class="action-bar">
        <select id="msgRoomSelect">
          <option value="main">主房间</option>
          <option value="custom">自定义房间</option>
        </select>
        <button id="loadMsgBtn">加载消息</button>
        <span>第 <span id="currentPage">1</span> 页</span>
        <button id="prevPageBtn" disabled>上一页</button>
        <button id="nextPageBtn" disabled>下一页</button>
    </div>
    <table id="messagesTable">
      <thead><tr><th>ID</th><th>昵称</th><th>内容</th><th>时间</th><th>操作</th></tr></thead>
      <tbody></tbody>
    </table>
    </div>
  </div>
</div>
<script>
var currentMsgPage = 1;
var totalMsgPages = 1;
function trim(s){ return s.replace(/^\\s+|\\s+$/g, ''); }

function apiKey(){ return "${currentKey}"; }

function apiCall(action, params, callback){
  var url = '/api/admin/' + action + '?key=' + encodeURIComponent(apiKey()) + '&_t=' + (new Date().getTime());
  if(params){
    for(var k in params){
      if(params.hasOwnProperty(k)){
        url += '&' + encodeURIComponent(k) + '=' + encodeURIComponent(params[k]);
      }
    }
  }
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.onreadystatechange = function(){
    if(xhr.readyState === 4){
      if(xhr.status === 200){
        var data = JSON.parse(xhr.responseText);
        callback(data);
      } else {
        alert('请求失败: ' + xhr.status);
      }
    }
  };
  xhr.send();
}

function getTbody(tableId){
  var table = document.getElementById(tableId);
  if(table){
    return table.getElementsByTagName('tbody')[0];
  }
  return null;
}

function loadKeys(){
  var tbody = getTbody('keysTable');
  if(!tbody) return;
  apiCall('list_keys', null, function(data){
  while (tbody.firstChild) {
    tbody.removeChild(tbody.firstChild);
  }
    for(var k in data){
      if(!data.hasOwnProperty(k)) continue;
      var row = tbody.insertRow(-1);
      var cellKey = row.insertCell(0);
      var cellCreated = row.insertCell(1);
      var cellExpires = row.insertCell(2);
      var cellStatus = row.insertCell(3);
      var cellAction = row.insertCell(4);
      
      cellKey.innerText = k;
      cellCreated.innerText = new Date(data[k].created_at * 1000).toLocaleString();
      cellExpires.innerText = data[k].expires_at ? new Date(data[k].expires_at * 1000).toLocaleString() : '永不过期';
      cellStatus.innerText = data[k].status;
      
      var btn = document.createElement('button');
      btn.innerText = '删除';
      btn.onclick = (function(key){
        return function(){ apiCall('delete_key', {target_key: key}, loadKeys); };
      })(k);
      cellAction.appendChild(btn);
    }
  });
}

function loadUsers(){
  var tbody = getTbody('usersTable');
  if(!tbody) return;
  apiCall('list_users', null, function(data){
  while (tbody.firstChild) {
    tbody.removeChild(tbody.firstChild);
  }
    for(var i = 0; i < data.length; i++){
      var u = data[i];
      var row = tbody.insertRow(-1);
      var cellUser = row.insertCell(0);
      var cellCreator = row.insertCell(1);
      var cellCreated = row.insertCell(2);
      var cellAction = row.insertCell(3);
      
      cellUser.innerText = u.username;
      cellCreator.innerText = u.created_by_key;
      cellCreated.innerText = new Date(u.created_at).toLocaleString();
      
      var btn = document.createElement('button');
      btn.innerText = '删除';
      btn.onclick = (function(un){
        return function(){ apiCall('delete_user', {username: un}, loadUsers); };
      })(u.username);
      cellAction.appendChild(btn);
    }
  });
}

function loadFilterWords(){
  var tbody = getTbody('filterTable');
  if(!tbody) return;
  apiCall('list_filter', null, function(data){
  while (tbody.firstChild) {
    tbody.removeChild(tbody.firstChild);
  }
    var words = data.words || [];
    for(var i = 0; i < words.length; i++){
      var w = words[i];
      var row = tbody.insertRow(-1);
      var cellWord = row.insertCell(0);
      var cellAction = row.insertCell(1);
      
      cellWord.innerText = w;
      var btn = document.createElement('button');
      btn.innerText = '删除';
      btn.onclick = (function(word){
        return function(){ apiCall('remove_filter', {word: word}, loadFilterWords); };
      })(w);
      cellAction.appendChild(btn);
    }
  });
}
function loadMessages(page){
  var room = document.getElementById('msgRoomSelect').value;
  if (!page) page = currentMsgPage;
  apiCall('list_messages', {room: room, page: page}, function(data){
    var tbody = getTbody('messagesTable');
    while (tbody.firstChild) { tbody.removeChild(tbody.firstChild); }
    var messages = data.messages || [];
    for(var i = 0; i < messages.length; i++){
      var m = messages[i];
      var row = tbody.insertRow(-1);
      row.insertCell(0).innerText = m.id;
      row.insertCell(1).innerText = m.nick;
      row.insertCell(2).innerText = m.msg;
      var d = new Date(m.created_at);
      row.insertCell(3).innerText = d.toLocaleString();
      var actionCell = row.insertCell(4);
      // 编辑按钮
      // 编辑按钮
      var editBtn = document.createElement('button');
      editBtn.innerText = '编辑';
      editBtn.onclick = (function(msgId, oldText, oldNick){
        return function(){
          var newText = prompt('编辑消息内容 (留空取消)', oldText);
          if(newText === null || newText === oldText) return;
          var newNick = prompt('编辑发言人昵称 (留空不改)', oldNick);
          if(newNick === "") newNick = oldNick; // 空字符串保持原昵称
          var params = { id: msgId, text: newText, room: document.getElementById('msgRoomSelect').value };
          if(newNick !== oldNick) params.nick = newNick;
          apiCall('edit_message', params, function(){ loadMessages(); });
        };
      })(m.id, m.msg, m.nick);
      actionCell.appendChild(editBtn);
      // 删除按钮
      var delBtn = document.createElement('button');
      delBtn.innerText = '删除';
      delBtn.style.marginLeft = '4px';
      delBtn.onclick = (function(msgId){
        return function(){
          if(confirm('确定删除该消息吗？')){
            apiCall('delete_message', {id: msgId}, function(){ loadMessages(); });
          }
        };
      })(m.id);
      actionCell.appendChild(delBtn);
      // 在前面插入按钮
      var insBeforeBtn = document.createElement('button');
      insBeforeBtn.innerText = '前插';
      insBeforeBtn.style.marginLeft = '4px';
      insBeforeBtn.onclick = (function(msgId) {
        return function() {
          var text = prompt('输入要插入的消息（将在该消息之前显示）');
          if (!text) return;
          var nick = prompt('输入发言人昵称（默认管理员）', '管理员');
          if (nick === null) nick = '管理员';
          apiCall('insert_message', {
            target_id: msgId,
            position: 'before',
            text: text,
            room: document.getElementById('msgRoomSelect').value,
            nick: nick
          }, function() { loadMessages(); });
        };
      })(m.id);
      actionCell.appendChild(insBeforeBtn);
      // 在后面插入按钮
      var insAfterBtn = document.createElement('button');
      insAfterBtn.innerText = '后插';
      insAfterBtn.style.marginLeft = '4px';
      insAfterBtn.onclick = (function(msgId) {
        return function() {
          var text = prompt('输入要插入的消息（将在该消息之后显示）');
          if (!text) return;
          var nick = prompt('输入发言人昵称（默认管理员）', '管理员');
          if (nick === null) nick = '管理员';
          apiCall('insert_message', {
            target_id: msgId,
            position: 'after',
            text: text,
            room: document.getElementById('msgRoomSelect').value,
            nick: nick
          }, function() { loadMessages(); });
        };
})(m.id);
      actionCell.appendChild(insAfterBtn);
    }
    // 更新分页状态
    currentMsgPage = data.page;
    totalMsgPages = Math.ceil(data.total / data.limit);
    document.getElementById('currentPage').innerText = currentMsgPage;
    document.getElementById('prevPageBtn').disabled = (currentMsgPage <= 1);
    document.getElementById('nextPageBtn').disabled = (currentMsgPage >= totalMsgPages);
  });
}
function loadServiceStatus() {
  apiCall('get_setting', null, function(data) {
    var suspended = data.service_suspended;
    document.getElementById('toggleServiceBtn').innerText = suspended ? '恢复服务' : '暂停服务';
    document.getElementById('serviceStatus').innerText = suspended ? '当前：已暂停' : '当前：运行中';
  });
}
document.getElementById('toggleServiceBtn').onclick = function() {
  var currentBtn = document.getElementById('toggleServiceBtn');
  var isSuspended = (currentBtn.innerText === '恢复服务'); // 点击前状态
  var newValue = isSuspended ? '0' : '1';
  apiCall('update_setting', { setting_key: 'service_suspended', value: newValue }, function() {
    loadServiceStatus();
    alert('设置已更新！');
  });
};
document.getElementById('loadMsgBtn').onclick = function(){
  currentMsgPage = 1;
  loadMessages(1);
};
document.getElementById('prevPageBtn').onclick = function(){
  if(currentMsgPage > 1) loadMessages(currentMsgPage - 1);
};
document.getElementById('nextPageBtn').onclick = function(){
  if(currentMsgPage < totalMsgPages) loadMessages(currentMsgPage + 1);
};
document.getElementById('createKeyBtn').onclick = function(){
  var newKey = trim(document.getElementById('newKey').value);
  var ttl = parseInt(document.getElementById('ttl').value) || 0;
  if(!newKey){ alert('请输入新密钥'); return; }
  apiCall('create_key', {new_key: newKey, ttl: ttl}, loadKeys);
  document.getElementById('newKey').value = '';
  document.getElementById('ttl').value = '';
};
document.getElementById('addWordBtn').onclick = function(){
  var word = trim(document.getElementById('newWord').value);
  if(!word){ alert('请输入敏感词'); return; }
  apiCall('add_filter', {word: word}, loadFilterWords);
  document.getElementById('newWord').value = '';
};
document.getElementById('cleanMainBtn').onclick = function(){
  if(confirm('清除主房间所有消息？')) apiCall('clean_room', {room: 'main'}, function(){ alert('已清除'); loadKeys(); loadUsers(); loadFilterWords(); loadServiceStatus();});
};
document.getElementById('cleanCustomBtn').onclick = function(){
  if(confirm('清除自定义房间所有消息？')) apiCall('clean_room', {room: 'custom'}, function(){ alert('已清除'); loadKeys(); loadUsers(); loadFilterWords(); loadServiceStatus();});
};
document.getElementById('refreshMainBtn').onclick = function(){
  if(confirm('触发主房间刷新？在线用户将立马重载')) apiCall('refresh_room', {room: 'main'}, function(){ alert('已重载'); loadKeys(); loadUsers(); loadFilterWords(); loadServiceStatus();});
};
document.getElementById('refreshCustomBtn').onclick = function(){
  if(confirm('触发自定义房间刷新？在线用户将立马重载')) apiCall('refresh_room', {room: 'custom'}, function(){ alert('已重载'); loadKeys(); loadUsers(); loadFilterWords(); loadServiceStatus();});
};
loadKeys();
loadUsers();
loadFilterWords();
loadMessages(1);
loadServiceStatus();
</script>
</body></html>`;
}