// console.undz.cn.js
import { checkAuth, TAG_LOGGEDIN, TAG_BANNED, TAG_NOT_LOGGEDIN } from './online.undz.cn.js';
import { generateToken } from './utils.js';

const ALLOWED_ORIGINS = [
    "https://online.undz.cn",
    "https://console.undz.cn",
    "https://online-dev.undz.cn",
    "https://console-dev.undz.cn",
];

function jsonResponse(data, status = 200, extraHeaders = {}) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            "Content-Type": "application/json",
            ...extraHeaders,
        },
    });
}
function corsHeaders(request) {
    const origin = request.headers.get("Origin");
    const headers = {
        "Access-Control-Allow-Credentials": "true",
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        "Access-Control-Allow-Headers": "Content-Type, x-app-id, x-sdk-ver",
        "Access-Control-Max-Age": "86400",
    };
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
        headers["Access-Control-Allow-Origin"] = origin;
    } else {
        headers["Access-Control-Allow-Origin"] = "null";
    }
    return headers;
}
// ========== 主 Worker ==========
export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const path = url.pathname;
        const method = request.method;
        const cors = corsHeaders(request);
        if (method === "OPTIONS") {
            return new Response(null, {
                status: 204,
                headers: cors,
            });
        }
        if (path.startsWith("/api/console/")) {
            try {
                const [authStatus, user] = await checkAuth(request, env);
                if (authStatus === TAG_NOT_LOGGEDIN) {
                    return jsonResponse({ error: "Unauthorized" }, 401, cors);
                }
                if (authStatus === TAG_BANNED) {
                    return jsonResponse({ error: "Account banned", ban_reason: user.ban_reason }, 403, cors);
                }

                const isAdmin = user.sub === 1;

                // ---------- 注册 OAuth 客户端 ----------
                if (path === "/api/console/oauth/client/register" && method === "POST") {
                    const body = await request.json().catch(() => null);
                    if (!body) {
                        return jsonResponse({ error: "Invalid request body" }, 400, cors);
                    }
                    const { name, redirect_uris, scope, trusted } = body;
                    if (!name || !redirect_uris) {
                        return jsonResponse({ error: "Missing required fields: name, redirect_uris" }, 400, cors);
                    }

                    if (!isAdmin) {
                        const countResult = await env.db
                            .prepare("SELECT COUNT(*) as cnt FROM oauth_clients WHERE user_sub = ?")
                            .bind(user.sub)
                            .first();
                        if (countResult.cnt >= 3) {
                            return jsonResponse({ error: "Maximum 3 clients per user" }, 403, cors);
                        }
                    }

                    const clientId = generateToken();
                    const clientSecret = generateToken();
                    const now = Math.floor(Date.now() / 1000);

                    await env.db
                        .prepare(
                            `INSERT INTO oauth_clients 
               (client_id, client_secret, name, redirect_uris, scope, trusted, created_at, updated_at, user_sub)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
                        )
                        .bind(
                            clientId,
                            clientSecret,
                            name,
                            redirect_uris,
                            scope || "openid profile email",
                            trusted ? 1 : 0,
                            now,
                            now,
                            user.sub
                        )
                        .run();

                    return jsonResponse({
                        success: true,
                        client_id: clientId,
                        client_secret: clientSecret,
                        message: "Client registered",
                    }, 201, cors);
                }

                if (path === "/api/console/oauth/clients" && method === "GET") {
                    let query = "SELECT * FROM oauth_clients";
                    const params = [];
                    if (!isAdmin) {
                        query += " WHERE user_sub = ?";
                        params.push(user.sub);
                    }
                    const clients = await env.db
                        .prepare(query + " ORDER BY created_at DESC")
                        .bind(...params)
                        .all();

                    let result = clients.results;
                    if (isAdmin && result.length) {
                        const creatorIds = [...new Set(result.map(c => c.user_sub).filter(id => id))];
                        if (creatorIds.length) {
                            const placeholders = creatorIds.map(() => "?").join(",");
                            const creators = await env.db
                                .prepare(`SELECT sub, username FROM online_users WHERE sub IN (${placeholders})`)
                                .bind(...creatorIds)
                                .all();
                            const creatorMap = Object.fromEntries((creators.results || []).map(c => [c.sub, c.username]));
                            result = result.map(c => ({
                                ...c,
                                creator_username: creatorMap[c.user_sub] || null,
                            }));
                        }
                    }

                    return jsonResponse({ clients: result }, 200, cors);
                }

                // ---------- 删除客户端 ----------
                if (path.startsWith("/api/console/oauth/client/") && method === "DELETE") {
                    const clientId = path.split("/").pop();
                    if (!clientId) {
                        return jsonResponse({ error: "Missing client_id" }, 400, cors);
                    }

                    const client = await env.db
                        .prepare("SELECT user_sub FROM oauth_clients WHERE client_id = ?")
                        .bind(clientId)
                        .first();
                    if (!client) {
                        return jsonResponse({ error: "Client not found" }, 404, cors);
                    }
                    if (!isAdmin && client.user_sub !== user.sub) {
                        return jsonResponse({ error: "Permission denied" }, 403, cors);
                    }

                    await env.db
                        .prepare("DELETE FROM oauth_clients WHERE client_id = ?")
                        .bind(clientId)
                        .run();

                    return jsonResponse({ success: true, message: "Client deleted" }, 200, cors);
                }

                // ---------- 封禁/解封用户 ----------
                if (path === "/api/console/user/ban" && method === "POST") {
                    if (!isAdmin) {
                        return jsonResponse({ error: "Admin only" }, 403, cors);
                    }
                    const body = await request.json().catch(() => null);
                    if (!body || !body.user_id) {
                        return jsonResponse({ error: "Missing user_id" }, 400, cors);
                    }
                    const targetUserId = parseInt(body.user_id, 10);
                    if (targetUserId === 1) {
                        return jsonResponse({ error: "Cannot ban super admin" }, 403, cors);
                    }
                    const banReason = body.ban_reason || "Banned by admin";
                    const banned = body.banned === undefined ? 1 : (body.banned ? 1 : 0);

                    await env.db
                        .prepare("UPDATE online_users SET banned = ?, ban_reason = ? WHERE sub = ?")
                        .bind(banned, banReason, targetUserId)
                        .run();

                    return jsonResponse({ success: true, message: `User ${banned ? 'banned' : 'unbanned'}` }, 200, cors);
                }

                // ---------- 获取用户列表 ----------
                if (path === "/api/console/users" && method === "GET") {
                    if (!isAdmin) {
                        return jsonResponse({ error: "Admin only" }, 403, cors);
                    }
                    const users = await env.db
                        .prepare("SELECT sub, username, email, banned, ban_reason, created_at FROM online_users ORDER BY sub")
                        .all();
                    return jsonResponse({ users: users.results }, 200, cors);
                }

                // ---------- 获取当前用户信息 ----------
                if (path === "/api/console/me" && method === "GET") {
                    return jsonResponse({ user }, 200, cors);
                }

                // 修改提交反馈路由，增加数量限制
                if (path === "/api/console/feedback/submit" && method === "POST") {
                    const [authStatus, user] = await checkAuth(request, env);
                    if (authStatus !== TAG_LOGGEDIN) {
                        return jsonResponse({ error: "Unauthorized" }, 401, cors);
                    }
                    const key = `rl:v1:action:feedback`;
                    if (env.limiter) {
                        const { success } = await env.limiter.limit({ key });
                        if (!success) {
                            console.warn(JSON.stringify({
                                event: 'rate_limited',
                                policy: 'feedback_submit',
                                user: user.sub,
                            }));
                            return jsonResponse(
                                { error: "Too many requests, please slow down." },
                                429,
                                { ...cors, 'Retry-After': '10' }
                            );
                        }
                    }
                    const body = await request.json().catch(() => null);
                    if (!body || !body.content || body.content.trim() === '') {
                        return jsonResponse({ error: "Content is required" }, 400, cors);
                    }

                    // 如果是普通用户，检查数量限制
                    if (user.sub !== 1) {
                        // 检查 pending/processing 数量
                        const pendingCount = await env.db
                            .prepare(`SELECT COUNT(*) as cnt FROM feedbacks WHERE user_sub = ? AND status IN ('pending', 'processing')`)
                            .bind(user.sub)
                            .first();
                        if (pendingCount.cnt >= 5) {
                            return jsonResponse({ error: "You have too many pending/processing feedbacks (max 5)" }, 403, cors);
                        }
                        // 检查总数量
                        const totalCount = await env.db
                            .prepare(`SELECT COUNT(*) as cnt FROM feedbacks WHERE user_sub = ?`)
                            .bind(user.sub)
                            .first();
                        if (totalCount.cnt >= 50) {
                            return jsonResponse({ error: "You have reached the maximum total feedbacks (50)" }, 403, cors);
                        }
                    }

                    const now = Math.floor(Date.now() / 1000);
                    const result = await env.db
                        .prepare(`INSERT INTO feedbacks (user_sub, username, content, status, created_at, updated_at)
                  VALUES (?, ?, ?, 'pending', ?, ?)`)
                        .bind(user.sub, user.username, body.content.trim(), now, now)
                        .run();
                    const id = result.meta?.last_row_id;
                    return jsonResponse({ success: true, id }, 201, cors);
                }

                // 删除反馈（用户可删自己的，管理员可删任何）
                if (path.startsWith("/api/console/feedback/delete/") && method === "DELETE") {
                    const id = parseInt(path.split('/').pop(), 10);
                    if (!id) {
                        return jsonResponse({ error: "Invalid id" }, 400, cors);
                    }
                    const [authStatus, user] = await checkAuth(request, env);
                    if (authStatus !== TAG_LOGGEDIN) {
                        return jsonResponse({ error: "Unauthorized" }, 401, cors);
                    }
                    const feedback = await env.db.prepare(`SELECT user_sub FROM feedbacks WHERE id = ?`).bind(id).first();
                    if (!feedback) {
                        return jsonResponse({ error: "Feedback not found" }, 404, cors);
                    }
                    if (!(user.sub === 1) && feedback.user_sub !== user.sub) {
                        return jsonResponse({ error: "Forbidden" }, 403, cors);
                    }

                    await env.db.prepare(`DELETE FROM feedbacks WHERE id = ?`).bind(id).run();
                    return jsonResponse({ success: true, message: "Feedback deleted" }, 200, cors);
                }

                // 转移反馈所有者
                if (path === "/api/console/feedback/transfer" && method === "PUT") {
                    const [authStatus, admin] = await checkAuth(request, env);
                    if (authStatus !== TAG_LOGGEDIN || admin.sub !== 1) {
                        return jsonResponse({ error: "Forbidden" }, 403, cors);
                    }
                    const body = await request.json().catch(() => null);
                    if (!body || !body.feedback_id || !body.target_user_id) {
                        return jsonResponse({ error: "Missing feedback_id or target_user_id" }, 400, cors);
                    }
                    const feedbackId = parseInt(body.feedback_id, 10);
                    const targetUserId = parseInt(body.target_user_id, 10);
                    // 检查目标用户是否存在
                    const targetUser = await env.db
                        .prepare(`SELECT sub, username FROM online_users WHERE sub = ?`)
                        .bind(targetUserId)
                        .first();
                    if (!targetUser) {
                        return jsonResponse({ error: "Target user not found" }, 404, cors);
                    }
                    // 检查反馈是否存在
                    const feedback = await env.db.prepare(`SELECT id FROM feedbacks WHERE id = ?`).bind(feedbackId).first();
                    if (!feedback) {
                        return jsonResponse({ error: "Feedback not found" }, 404, cors);
                    }
                    const now = Math.floor(Date.now() / 1000);
                    await env.db
                        .prepare(`UPDATE feedbacks SET user_sub = ?, username = ?, updated_at = ? WHERE id = ?`)
                        .bind(targetUser.sub, targetUser.username, now, feedbackId)
                        .run();
                    return jsonResponse({ success: true, message: "Feedback owner transferred" }, 200, cors);
                }

                // 转移 OAuth 应用所有者
                if (path === "/api/console/oauth/client/transfer" && method === "PUT") {
                    const [authStatus, admin] = await checkAuth(request, env);
                    if (authStatus !== TAG_LOGGEDIN || admin.sub !== 1) {
                        return jsonResponse({ error: "Forbidden" }, 403, cors);
                    }
                    const body = await request.json().catch(() => null);
                    if (!body || !body.client_id || !body.target_user_id) {
                        return jsonResponse({ error: "Missing client_id or target_user_id" }, 400, cors);
                    }
                    const clientId = body.client_id;
                    const targetUserId = parseInt(body.target_user_id, 10);
                    const targetUser = await env.db
                        .prepare(`SELECT sub, username FROM online_users WHERE sub = ?`)
                        .bind(targetUserId)
                        .first();
                    if (!targetUser) {
                        return jsonResponse({ error: "Target user not found" }, 404, cors);
                    }
                    const client = await env.db
                        .prepare(`SELECT client_id FROM oauth_clients WHERE client_id = ?`)
                        .bind(clientId)
                        .first();
                    if (!client) {
                        return jsonResponse({ error: "OAuth client not found" }, 404, cors);
                    }
                    const now = Math.floor(Date.now() / 1000);
                    await env.db
                        .prepare(`UPDATE oauth_clients SET user_sub = ?, updated_at = ? WHERE client_id = ?`)
                        .bind(targetUserId, now, clientId)
                        .run();
                    return jsonResponse({ success: true, message: "OAuth client owner transferred" }, 200, cors);
                }
            } catch (error) {
                console.error("API error:", error);
                return jsonResponse({ error: "Internal server error" }, 500, cors);
            }
        }

        try {
            return env.assets.fetch(request);
        } catch (err) {
            console.error(err);
            return new Response(`Worker threw exception: ${err.message}\nStack: ${err.stack || "no stack"}`, {
                status: 500,
                headers: { "Content-Type": "text/plain" },
            });
        }
    },
};