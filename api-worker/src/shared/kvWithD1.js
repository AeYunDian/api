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
         * @returns {import('@cloudflare/workers-types').D1Database} 标准Cloudflare D1
         */
        _db: db,
        /**
         * 获取键值
         * @param {string} key
         * @returns {Promise<string|null>} 返回存储的字符串值，不存在或已过期返回 null
         */
        async get(key) {
            const timestamp = Math.floor(new Date().getTime() / 1000);
            const result = await db
                .prepare(
                    `SELECT value FROM app_kv_store 
                     WHERE key = ? AND expires_at > ?`
                )
                .bind(key, timestamp)
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
        },

        /**
         * 批量删除 key 以指定前缀开头的所有记录
         * @param {string} prefix - key 前缀，如 'refresh:'
         * @returns {Promise<number>} 返回被删除的行数
         */
        async deleteByPrefix(prefix) {
            const result = await db
                .prepare(`DELETE FROM app_kv_store WHERE key LIKE ?`)
                .bind(`${prefix}%`)
                .run();
            return result.meta?.changes || 0;
        },

        /**
         * 批量删除 key 以指定后缀结尾的所有记录
         * @param {string} suffix - key 后缀，如 ':user:123'
         * @returns {Promise<number>} 返回被删除的行数
         */
        async deleteBySuffix(suffix) {
            const result = await db
                .prepare(`DELETE FROM app_kv_store WHERE key LIKE ?`)
                .bind(`%${suffix}`)
                .run();
            return result.meta?.changes || 0;
        },

        /**
         * 批量删除 value 等于指定值的所有记录（谨慎使用）
         * @param {string} value - 要匹配的 value 字符串
         * @returns {Promise<number>} 返回被删除的行数
         */
        async deleteByValue(value) {
            const result = await db
                .prepare(`DELETE FROM app_kv_store WHERE value = ?`)
                .bind(value)
                .run();
            return result.meta?.changes || 0;
        },

        /**
         * 批量删除 key 匹配指定模式（支持 LIKE 语法）
         * @param {string} pattern - LIKE 模式，如 'refresh:%' 或 '%:user:123'
         * @returns {Promise<number>} 返回被删除的行数
         */
        async deleteByPattern(pattern) {
            const result = await db
                .prepare(`DELETE FROM app_kv_store WHERE key LIKE ?`)
                .bind(pattern)
                .run();
            return result.meta?.changes || 0;
        },
        /**
         * 批量删除 key 匹配指定模式且 value 等于指定值的记录
         * @param {string} keyPattern - LIKE 模式，如 'refresh:%' 或 'token:%'
         * @param {string} value - 要匹配的 value 字符串（精确相等）
         * @returns {Promise<number>} 返回被删除的行数
         */
        async deleteByKeyAndValue(keyPattern, value) {
            const result = await db
                .prepare(`DELETE FROM app_kv_store WHERE key LIKE ? AND value = ?`)
                .bind(keyPattern, value)
                .run();
            return result.meta?.changes || 0;
        },

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
    const timestamp = Math.floor(new Date().getTime() / 1000);
    await db
        .prepare(`DELETE FROM app_kv_store WHERE expires_at < ?`)
        .bind(timestamp)
        .run();
}

/**
 * 清理所有过期数据的函数
 * @param {import('@cloudflare/workers-types').D1Database} db
 */
export async function cleanExpiredKv(db) {
    const timestamp = Math.floor(new Date().getTime() / 1000);
    await db
        .prepare(`DELETE FROM app_kv_store WHERE expires_at < ?`)
        .bind(timestamp)
        .run();
}