import { cleanExpiredKv, initKvTable } from './kvWithD1.js';
import { cleanExpiredPsp, initPspTables } from './wsRelay.js'

import uniAPI from './uniAPI.js';
import chatRoom from './ayChatRoom.js';
import uniCDN from './jsdelivrCDN.js';
import i0UndzCn from './i0.undz.cn.js';
import i1UndzCn from './i1.undz.cn.js';
import i2UndzCn from './i2.undz.cn.js';
import ayOnline from './ayOnline.js';
import ayConsole from './ayConsole.js';
import ayRelay from './wsRelay.js';

// import shundzcn from './sh.undz.cn.js'

// const corsHeaders_GPO = {
//     'Access-Control-Allow-Origin': '*',
//     'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
//     'Access-Control-Allow-Headers': 'Content-Type',
// };

// const mobileRegex = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|windows phone|phone|webos|kindle|tablet/i;

export default {
    async scheduled(controller, env) {
        await cleanExpiredKv(env.db);
        await cleanExpiredPsp(env.db);
    },

    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const hostname = url.hostname;
        //     let _tm_path;
        // try {
        //   _tm_path = decodeURIComponent(url.pathname);
        // } catch {
        //   _tm_path = url.pathname; // 解码失败时直接使用原路径
        // }
        // const path = _tm_path;

        // const userAgent = request.headers.get('User-Agent') || '';
        // const platform = request.headers.get('sec-ch-ua-platform') || '';

        // const cookie = request.headers.get('Cookie') || '';
        // const db = env.db;
        // const kv = env.kv;
        // const isWechat = !!userAgent.match(/MicroMessenger/i);
        // const clientIP = request.headers.get('CF-Connecting-IP');
        // const isMobile = mobileRegex.test(userAgent) || false;
        // const cookies = parse(cookie);

        try {
            // 图床服务
            if (hostname === 'i0.undz.cn') return await i0UndzCn.fetch(request);
            if (hostname === 'i1.undz.cn') return await i1UndzCn.fetch(request);
            if (hostname === 'i2.undz.cn') return await i2UndzCn.fetch(request);

            if (hostname === 'relay.undz.cn') return await ayRelay.fetch(request, env, ctx);


            // jsdelivr 代理服务
            if (hostname === 'cdn.undz.cn') return await uniCDN.fetch(request, env);

            // 直接走前端404
            if (hostname === 'mail.undz.cn' || hostname === 'mail.io.hb.cn') return env.assets.fetch(request);

            // 通用API服务
            if (hostname === 'api.undz.cn' || hostname === 'api.io.hb.cn') return await uniAPI.fetch(request, env);

            // IE8 怀旧聊天室服务
            if (hostname === 'chat.undz.cn' || hostname === 'c.undz.cn') return await chatRoom.fetch(request, env);


            if (hostname === 'console.undz.cn') return await ayConsole.fetch(request, env);

            // AyAccount 集中服务
            if (hostname === 'online.undz.cn') return await ayOnline.fetch(request, env);

            if (hostname === 'kv.undz.cn') {
                if (url.pathname === '/runtask') {
                    const authKey = request.headers.get("X-Admin-Key");
                    if (authKey !== env.KEY) {
                        return new Response(JSON.stringify({ error: "Unauthorized" }), {
                            status: 401,
                            headers: {
                                "Content-Type": "application/json",
                            }
                        });
                    }
                    try {
                        await cleanExpiredKv(env.db);
                        return new Response(JSON.stringify({ success: true, message: "task runed" }), {
                            status: 200,
                            headers: {
                                "Content-Type": "application/json",
                            }
                        });
                    } catch (err) {
                        console.error('Init failed:', err);
                        return new Response(JSON.stringify({
                            error: 'Task run failed',
                            detail: err.message,
                            stack: err.stack
                        }),
                            {
                                status: 500,
                                headers: {
                                    "Content-Type": "application/json",
                                }
                            });
                    }
                }
                if (url.pathname === '/initdb') {
                    const authKey = request.headers.get("X-Admin-Key");
                    if (authKey !== env.KEY) {
                        return new Response(JSON.stringify({ error: "Unauthorized" }), {
                            status: 401,
                            headers: {
                                "Content-Type": "application/json",
                            }
                        });
                    }
                    try {
                        await initKvTable(env.db);
                        await initPspTables(env.db);
                        return new Response(JSON.stringify({ success: true, message: "Database initialized" }), {
                            status: 200,
                            headers: {
                                "Content-Type": "application/json",
                            }
                        });
                    } catch (err) {
                        console.error('Init failed:', err);
                        return new Response(JSON.stringify({
                            error: 'Database initialization failed',
                            detail: err.message,
                            stack: err.stack
                        }),
                            {
                                status: 500,
                                headers: {
                                    "Content-Type": "application/json",
                                }
                            });
                    }
                }
            }

            return env.assets.fetch(request);
        } catch (err) {
            console.error(err);
            return new Response(`Worker threw exception: ${err.message}\nStack: ${err.stack || "no stack"}`, { status: 500, headers: { "Content-Type": "text/plain" } });
        }
    }
};
