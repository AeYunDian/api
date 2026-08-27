// console.undz.cn.js
import { checkAuth, TAG_LOGGEDIN, TAG_BANNED, TAG_NOT_LOGGEDIN } from './online.undz.cn.js';
import { generateToken } from './utils.js';

const ALLOWED_ORIGINS = ['https://console.undz.cn', 'https://console-dev.undz.cn'];

// ========== 辅助函数 ==========
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
    const origin = request.headers.get('Origin');
    const headers = {
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-App-Id, X-Sdk-Ver',
        'Access-Control-Max-Age': '86400',
    };

    if (origin && ALLOWED_ORIGINS.includes(origin)) {
        headers['Access-Control-Allow-Origin'] = origin;
    } else {
        headers['Access-Control-Allow-Origin'] = 'null';
        return null;
    }
    return headers;
}

// ========== 主 Worker ==========
export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const path = url.pathname;
        const method = request.method;
        if (method === "OPTIONS") {
            return new Response(null, { status: 204, headers: corsHeaders(request) });
        }
        if (path.startsWith("/api/console/")) {
            try {
                const [authStatus, user] = await checkAuth(request, env);
                if (authStatus === TAG_NOT_LOGGEDIN) {
                    return jsonResponse({ error: "Unauthorized" }, 401, corsHeaders(request));
                }
                if (authStatus === TAG_BANNED) {
                    return jsonResponse({ error: "Account banned", ban_reason: user.ban_reason }, 403, corsHeaders(request));
                }

                const isAdmin = user.sub === 1;

                // ---------- 注册 OAuth 客户端 ----------
                if (path === "/api/console/oauth/client/register" && method === "POST") {
                    const body = await request.json().catch(() => null);
                    if (!body) {
                        return jsonResponse({ error: "Invalid request body" }, 400, corsHeaders(request));
                    }
                    const { name, redirect_uris, scope, trusted } = body;
                    if (!name || !redirect_uris) {
                        return jsonResponse({ error: "Missing required fields: name, redirect_uris" }, 400, corsHeaders(request));
                    }

                    if (!isAdmin) {
                        const countResult = await env.db
                            .prepare("SELECT COUNT(*) as cnt FROM oauth_clients WHERE user_sub = ?")
                            .bind(user.sub)
                            .first();
                        if (countResult.cnt >= 3) {
                            return jsonResponse({ error: "Maximum 3 clients per user" }, 403, corsHeaders(request));
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
                    }, 201, corsHeaders(request));
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

                    return jsonResponse({ clients: result }, 200, corsHeaders(request));
                }

                // ---------- 删除客户端 ----------
                if (path.startsWith("/api/console/oauth/client/") && method === "DELETE") {
                    const clientId = path.split("/").pop();
                    if (!clientId) {
                        return jsonResponse({ error: "Missing client_id" }, 400, corsHeaders(request));
                    }

                    const client = await env.db
                        .prepare("SELECT user_sub FROM oauth_clients WHERE client_id = ?")
                        .bind(clientId)
                        .first();
                    if (!client) {
                        return jsonResponse({ error: "Client not found" }, 404, corsHeaders(request));
                    }
                    if (!isAdmin && client.user_sub !== user.sub) {
                        return jsonResponse({ error: "Permission denied" }, 403, corsHeaders(request));
                    }

                    await env.db
                        .prepare("DELETE FROM oauth_clients WHERE client_id = ?")
                        .bind(clientId)
                        .run();

                    return jsonResponse({ success: true, message: "Client deleted" }, 200, corsHeaders(request));
                }

                // ---------- 封禁/解封用户 ----------
                if (path === "/api/console/user/ban" && method === "POST") {
                    if (!isAdmin) {
                        return jsonResponse({ error: "Admin only" }, 403, corsHeaders(request));
                    }
                    const body = await request.json().catch(() => null);
                    if (!body || !body.user_id) {
                        return jsonResponse({ error: "Missing user_id" }, 400, corsHeaders(request));
                    }
                    const targetUserId = parseInt(body.user_id, 10);
                    if (targetUserId === 1) {
                        return jsonResponse({ error: "Cannot ban super admin" }, 403, corsHeaders(request));
                    }
                    const banReason = body.ban_reason || "Banned by admin";
                    const banned = body.banned === undefined ? 1 : (body.banned ? 1 : 0);

                    await env.db
                        .prepare("UPDATE online_users SET banned = ?, ban_reason = ? WHERE sub = ?")
                        .bind(banned, banReason, targetUserId)
                        .run();

                    return jsonResponse({ success: true, message: `User ${banned ? 'banned' : 'unbanned'}` }, 200, corsHeaders(request));
                }

                // ---------- 获取用户列表 ----------
                if (path === "/api/console/users" && method === "GET") {
                    if (!isAdmin) {
                        return jsonResponse({ error: "Admin only" }, 403, corsHeaders(request));
                    }
                    const users = await env.db
                        .prepare("SELECT sub, username, email, banned, ban_reason, created_at FROM online_users ORDER BY sub")
                        .all();
                    return jsonResponse({ users: users.results }, 200, corsHeaders(request));
                }

                // ---------- 获取当前用户信息 ----------
                if (path === "/api/console/me" && method === "GET") {
                    return jsonResponse({ user }, 200, corsHeaders(request));
                }
            } catch (error) {
                console.error("API error:", error);
                return jsonResponse({ error: "Internal server error" }, 500, corsHeaders(request));
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