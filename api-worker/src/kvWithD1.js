// kvWithD1.js
/**
 * 基于 D1 数据库实现的 KV 存储适配器
 * 完全兼容原生 KV 的 get/put/delete 方法
 * 表结构：app_kv_store (key TEXT PRIMARY KEY, value TEXT, expires_at INTEGER)
 */

/**
 * 创建 KV 存储实例
 * @param {import('@cloudflare/workers-types').D1Database} db - D1 数据库实例
 * @returns {Object} 包含 get, put, delete 方法的对象
 */
export function createKvStore(db) {
    return {
        /**
         * 获取键值
         * @param {string} key
         * @returns {Promise<string|null>} 返回存储的字符串值，不存在或已过期返回 null
         */
        async get(key) {
            const result = await db
                .prepare(
                    `SELECT value FROM app_kv_store 
                     WHERE key = ? AND expires_at > CAST(strftime('%s', 'now') AS INTEGER)`
                )
                .bind(key)
                .first();
            return result ? result.value : null;
        },

        /**
         * 存储键值，支持设置过期时间（秒）
         * @param {string} key
         * @param {string} value
         * @param {Object} options - { expirationTtl: number } 过期秒数，默认 128 天
         */
        async put(key, value, options = {}) {
            const ttl = options.expirationTtl || 128 * 86400;
            const expiresAt = Math.floor(Date.now() / 1000) + ttl;
            await db
                .prepare(
                    `INSERT OR REPLACE INTO app_kv_store (key, value, expires_at) 
                     VALUES (?, ?, ?)`
                )
                .bind(key, value, expiresAt)
                .run();
        },

        /**
         * 删除键值
         * @param {string} key
         */
        async delete(key) {
            await db
                .prepare(`DELETE FROM app_kv_store WHERE key = ?`)
                .bind(key)
                .run();
        }
    };
}

/**
 * 初始化 KV 存储表
 * @param {import('@cloudflare/workers-types').D1Database} db
 */
export async function initKvTable(db) {
    await db
        .prepare(
            `CREATE TABLE IF NOT EXISTS app_kv_store (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                expires_at INTEGER NOT NULL
            )`
        )
        .run();
    // 为过期查询创建索引
    await db
        .prepare(`CREATE INDEX IF NOT EXISTS idx_kv_expires ON app_kv_store(expires_at)`)
        .run();
    // 清理已过期的数据
    await db
        .prepare(`DELETE FROM app_kv_store WHERE expires_at < strftime('%s', 'now')`)
        .run();
}

/**
 * 清理所有过期数据的函数
 * @param {import('@cloudflare/workers-types').D1Database} db
 */
export async function cleanExpiredKv(db) {
    await db
        .prepare(`DELETE FROM app_kv_store WHERE expires_at < strftime('%s', 'now')`)
        .run();
}