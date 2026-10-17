// db/schema.js —— 由 ayOnline.js 拆分而来（逐行搬运，未改逻辑）
// D1 建表语句集合（幂等 CREATE TABLE IF NOT EXISTS）。
// 目前没有迁移系统：改表结构 = 改这里 + 调一次 POST /api/ayonline/init。

import {
  DEFAULT_USER_AVATAR,
  DEFAULT_USER_DESC,
  DEFAULT_OAUTH_CLIENT_SCOPE,
} from "../config.js";
import { generateToken } from "../../../shared/utils.js";

async function initDatabase(db) {
  try {
    await db
      .prepare(
        `CREATE TABLE IF NOT EXISTS online_users (
            sub INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            banned INTEGER DEFAULT 0,
            ban_reason TEXT DEFAULT '',
            gender TEXT DEFAULT 'unknown',
            avatar TEXT DEFAULT '${DEFAULT_USER_AVATAR}',
            description TEXT DEFAULT '${DEFAULT_USER_DESC}',
            password_salt TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
        )`,
      )
      .run();
    await db
      .prepare(
        `CREATE TABLE IF NOT EXISTS oauth_clients (
                sub INTEGER PRIMARY KEY AUTOINCREMENT,
                client_id TEXT UNIQUE NOT NULL,
                client_secret TEXT NOT NULL,
                name TEXT NOT NULL,
                redirect_uris TEXT NOT NULL,
                scope TEXT DEFAULT '${DEFAULT_OAUTH_CLIENT_SCOPE}',
                trusted BOOLEAN DEFAULT 0,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL,
                user_sub INTEGER  NOT NULL
            )`,
      )
      .run();

    await db
      .prepare(
        `CREATE TABLE IF NOT EXISTS oauth_auth_codes (
                code TEXT PRIMARY KEY,
                client_id TEXT NOT NULL,
                user_sub INTEGER NOT NULL,
                redirect_uri TEXT NOT NULL,
                scope TEXT,
                state TEXT,
                expires_at INTEGER NOT NULL,
                used BOOLEAN DEFAULT 0
            )`,
      )
      .run();
    await db
      .prepare(
        `
    CREATE TABLE IF NOT EXISTS oauth_consent_requests (
        sub TEXT PRIMARY KEY,
        client_id TEXT NOT NULL,
        redirect_uri TEXT NOT NULL,
        scope TEXT,
        state TEXT,
        user_sub INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        expires_at INTEGER NOT NULL,
        status TEXT DEFAULT 'pending',
        consent_token TEXT NOT NULL
    )`,
      )
      .run();
    await db
      .prepare(
        `CREATE TABLE IF NOT EXISTS oauth_connections (
            sub INTEGER PRIMARY KEY AUTOINCREMENT,
            provider TEXT NOT NULL,
            openid TEXT NOT NULL,
            user_sub INTEGER NOT NULL,
            created_at INTEGER NOT NULL,
            UNIQUE(provider, openid)
          )`,
      )
      .run();
    await db
      .prepare(
        `CREATE TABLE IF NOT EXISTS feedbacks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_sub INTEGER NOT NULL,
                username TEXT NOT NULL,
                content TEXT NOT NULL,
                status TEXT DEFAULT 'pending',
                admin_reply TEXT,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL,
                resolved_at INTEGER
            )`,
      )
      .run();
    await db
      .prepare(
        `CREATE INDEX IF NOT EXISTS idx_feedbacks_user ON feedbacks(user_sub)`,
      )
      .run();
    await db
      .prepare(
        `CREATE INDEX IF NOT EXISTS idx_feedbacks_status ON feedbacks(status)`,
      )
      .run();
    await db
      .prepare(
        `CREATE INDEX IF NOT EXISTS idx_oauth_connections_user ON oauth_connections(user_sub)`,
      )
      .run();
    await db
      .prepare(
        `CREATE INDEX IF NOT EXISTS idx_consent_requests_expires ON oauth_consent_requests(expires_at)`,
      )
      .run();
    await db
      .prepare(
        `CREATE INDEX IF NOT EXISTS idx_consent_requests_status ON oauth_consent_requests(status)`,
      )
      .run();
    await db
      .prepare(
        `CREATE INDEX IF NOT EXISTS idx_oauth_codes_used ON oauth_auth_codes(used)`,
      )
      .run();
    await db
      .prepare(
        `CREATE INDEX IF NOT EXISTS idx_oauth_codes_expires ON oauth_auth_codes(expires_at)`,
      )
      .run();
    await db
      .prepare(
        `CREATE INDEX IF NOT EXISTS idx_username ON online_users(username)`,
      )
      .run();
    await db
      .prepare(`CREATE INDEX IF NOT EXISTS idx_email ON online_users(email)`)
      .run();
    // ── 网站分析 ──
    await db
      .prepare(
        `CREATE TABLE IF NOT EXISTS analytics_sites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        token TEXT UNIQUE NOT NULL,
        user_sub INTEGER NOT NULL,
        domain TEXT NOT NULL,
        name TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
    )`,
      )
      .run();
    await db
      .prepare(
        `CREATE UNIQUE INDEX IF NOT EXISTS idx_analytics_sites_domain ON analytics_sites(domain)`,
      )
      .run();
    await db
      .prepare(
        `CREATE INDEX IF NOT EXISTS idx_analytics_sites_user ON analytics_sites(user_sub)`,
      )
      .run();
    await db
      .prepare(
        `CREATE TABLE IF NOT EXISTS file_manager (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          path TEXT NOT NULL UNIQUE,
          code TEXT NOT NULL UNIQUE,
          need_password INTEGER NOT NULL DEFAULT 0,
          password TEXT,
          expiration_at INTEGER,
          r2_key TEXT NOT NULL,
          size INTEGER,
          mime_type TEXT,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        )`,
      )
      .run();
    await db
      .prepare(
        `CREATE INDEX IF NOT EXISTS idx_file_manager_code ON file_manager (code)`,
      )
      .run();
    await db
      .prepare(
        `CREATE INDEX IF NOT EXISTS idx_file_manager_path ON file_manager (path)`,
      )
      .run();
    await db
      .prepare(
        `CREATE TABLE IF NOT EXISTS analytics_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        site_token TEXT NOT NULL,
        ts INTEGER NOT NULL,
        visitor TEXT NOT NULL,
        name TEXT NOT NULL DEFAULT 'pageview',
        path TEXT NOT NULL,
        ref TEXT NOT NULL DEFAULT '',
        country TEXT NOT NULL DEFAULT '',
        browser TEXT NOT NULL DEFAULT '',
        os TEXT NOT NULL DEFAULT '',
        device TEXT NOT NULL DEFAULT '',
        screen TEXT NOT NULL DEFAULT '',
        utm_source TEXT NOT NULL DEFAULT '',
        utm_medium TEXT NOT NULL DEFAULT '',
        utm_campaign TEXT NOT NULL DEFAULT ''
    )`,
      )
      .run();
    await db
      .prepare(
        `CREATE INDEX IF NOT EXISTS idx_analytics_events_site_ts
     ON analytics_events(site_token, ts)`,
      )
      .run();
    await db
      .prepare(
        `CREATE INDEX IF NOT EXISTS idx_analytics_events_site_path
     ON analytics_events(site_token, path)`,
      )
      .run();
    const clientExists = await db
      .prepare(
        `SELECT COUNT(*) as cnt FROM oauth_clients WHERE client_id = 'app_chat'`,
      )
      .first();
    if (!clientExists || clientExists.cnt === 0) {
      const now = Math.floor(Date.now() / 1000);
      await db
        .prepare(
          `
                INSERT INTO oauth_clients (client_id, client_secret, name, redirect_uris, scope, trusted, created_at, updated_at, user_sub)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
        )
        .bind(
          "app_chat",
          generateToken(),
          "聊天助手",
          "https://chat.undz.cn/oauth/callback",
          DEFAULT_OAUTH_CLIENT_SCOPE,
          0,
          now,
          now,
          1,
        )
        .run();
    }
    return { success: true, message: "Database initialized" };
  } catch (err) {
    console.error("initDatabase error:", err);
    throw err; // 向上抛出，由上层处理
  }
}

export { initDatabase };
