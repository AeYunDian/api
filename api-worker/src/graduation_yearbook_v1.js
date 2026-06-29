import { corsHeaders_GPO } from './utils.js';

const jsonResponse = (data, status = 200) => {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            ...corsHeaders_GPO,
        },
    });
};

export default {
    /**
     * POST /gy/v1/verify
     * 请求体：{ key: string }
     * 返回：{ code: 200, success: true, userid: number, name: string }
     *       或错误信息
     */
    async handleVerify(request, env) {
        let body;
        try {
            body = await request.json();
        } catch {
            return jsonResponse({ code: 400, msg: '无效的 JSON 请求体' }, 400);
        }

        const { key } = body;
        if (!key || typeof key !== 'string' || key.trim() === '') {
            return jsonResponse({ code: 400, msg: '授权码不能为空' }, 400);
        }

        try {
            const stmt = env.db.prepare('SELECT user_id, name FROM auth_keys WHERE key = ?');
            const result = await stmt.bind(key.trim()).first();

            if (result) {
                return jsonResponse({
                    code: 200,
                    success: true,
                    userid: result.user_id,
                    name: result.name,
                });
            } else {
                return jsonResponse({ code: 404, msg: '授权码无效' }, 404);
            }
        } catch (error) {
            console.error('verify error:', error);
            return jsonResponse({ code: 500, msg: '服务器内部错误' }, 500);
        }
    },

    /**
     * POST /gy/v1/submit
     * 请求体：{ userId, key, userInfo: { ... } }
     * 验证授权码与 userId 匹配，检查重复提交，写入数据库
     */
    async handleSubmit(request, env) {
        let body;
        try {
            body = await request.json();
        } catch {
            return jsonResponse({ code: 400, msg: '无效的 JSON 请求体' }, 400);
        }

        const { userId, key, userInfo } = body;
        if (!userId || !key || !userInfo) {
            return jsonResponse({ code: 400, msg: '缺少必要参数 userId, key, userInfo' }, 400);
        }

        try {
            // 1. 验证授权码与 userId 匹配
            const authStmt = env.db.prepare('SELECT user_id FROM auth_keys WHERE key = ? AND user_id = ?');
            const authResult = await authStmt.bind(key, userId).first();
            if (!authResult) {
                return jsonResponse({ code: 403, msg: '授权码与用户不匹配' }, 403);
            }

            // 2. 检查是否已存在记录
            const checkStmt = env.db.prepare('SELECT id FROM records WHERE user_id = ?');
            const existing = await checkStmt.bind(userId).first();

            const basicInfo = JSON.stringify(userInfo);
            const moreInfo = '{}'; // 如有需要可扩展

            if (existing) {
                // 已存在记录 -> 覆盖更新
                const updateStmt = env.db.prepare(
                    'UPDATE records SET key = ?, basic_info = ?, more_info = ?, created_at = datetime(\'now\') WHERE user_id = ?'
                );
                await updateStmt.bind(key, basicInfo, moreInfo, userId).run();
                return jsonResponse({ code: 200, success: true, msg: '提交成功（已更新原有记录）' });
            } else {
                // 不存在则插入
                const insertStmt = env.db.prepare(
                    'INSERT INTO records (user_id, key, basic_info, more_info) VALUES (?, ?, ?, ?)'
                );
                await insertStmt.bind(userId, key, basicInfo, moreInfo).run();
                return jsonResponse({ code: 200, success: true, msg: '提交成功' });
            }
        } catch (error) {
            console.error('submit error:', error);
            return jsonResponse({ code: 500, msg: '服务器内部错误' }, 500);
        }
    },

    /**
     * GET /gy/v1/record/:userId
     * 返回该用户的同学录记录
     */
    async handleGetRecord(userId, env) {
        const uid = parseInt(userId, 10);
        if (isNaN(uid)) {
            return jsonResponse({ code: 400, msg: '用户ID无效' }, 400);
        }

        try {
            const stmt = env.db.prepare('SELECT * FROM records WHERE user_id = ?');
            const record = await stmt.bind(uid).first();

            if (record) {
                record.basic_info = JSON.parse(record.basic_info);
                record.more_info = JSON.parse(record.more_info);
                return jsonResponse({ code: 200, data: record });
            } else {
                return jsonResponse({ code: 404, msg: '未找到记录' }, 404);
            }
        } catch (error) {
            console.error('get record error:', error);
            return jsonResponse({ code: 500, msg: '服务器内部错误' }, 500);
        }
    },

    /**
     * POST /gy/v1/initdb
     * 初始化数据库：创建表并插入一条测试授权码
     * 生产环境中应移除或加鉴权保护
     */
    async handleInitDB(env) {
        try {
            await env.db.exec(`
      CREATE TABLE IF NOT EXISTS auth_keys (
        key TEXT PRIMARY KEY,
        user_id INTEGER UNIQUE NOT NULL,
        name TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);

            await env.db.exec(`
      CREATE TABLE IF NOT EXISTS records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        key TEXT NOT NULL,
        basic_info TEXT NOT NULL,
        more_info TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);

            // 插入一条测试授权码（只在不存在时插入，避免重复）
            const checkStmt = env.db.prepare('SELECT key FROM auth_keys WHERE key = ?');
            const existing = await checkStmt.bind('123456').first();
            if (!existing) {
                await env.db.prepare(
                    'INSERT INTO auth_keys (key, user_id, name) VALUES (?, ?, ?)'
                ).bind('123456', 1, '测试用户').run();
            }

            return jsonResponse({ code: 200, msg: '数据库初始化成功' });
        } catch (error) {
            console.error('initdb error:', error);
            return jsonResponse({ code: 500, msg: '数据库初始化失败' }, 500);
        }
    }
}
