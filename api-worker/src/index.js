import { cleanExpiredKv } from "./shared/kvWithD1.js";
import { cleanExpiredPsp } from "./services/relay/wsRelay.js";
import {
  handleIncomingReverseEmail,
  cleanExpiredReverseVerifications,
} from "./shared/email-reverse-verify.js";

import uniAPI from "./services/gateway/uniAPI.js";
import chatRoom from "./services/chat/ayChatRoom.js";
import uniCDN from "./services/cdn/jsdelivrCDN.js";
import i0UndzCn from "./services/image/i0.undz.cn.js";
import i1UndzCn from "./services/image/i1.undz.cn.js";
import i2UndzCn from "./services/image/i2.undz.cn.js";
import ayOnline from "./services/account/ayOnline.js";
import ayConsole from "./services/console/ayConsole.js";
import ayRelay from "./services/relay/wsRelay.js";
import ayAnalytics from "./services/analytics/ayAnalytics.js";
import ai from "./services/ai/ai.js";
import ayFiles from "./services/files/ayFiles.js";
import yzhAi from "./services/ai/yzh.ai.js";
import { handleShortLink } from "./services/console/shortlink.js";
import adminServices from "./shared/admin.js";

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
    await cleanExpiredReverseVerifications(env.db);
  },
  async email(message, env, ctx) {
    try {
      await handleIncomingReverseEmail(message, env, ctx);
    } catch (err) {
      // 捕获解析异常，防止格式错误的邮件导致 Worker 崩溃
      console.error("[Email Handler] Error processing incoming email:", err);
    }
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
      if (hostname === "undz.cn") return env.assets.fetch(request);
      // 图床服务
      if (hostname === "i0.undz.cn") return await i0UndzCn.fetch(request);
      if (hostname === "i1.undz.cn") return await i1UndzCn.fetch(request);
      if (hostname === "i2.undz.cn") return await i2UndzCn.fetch(request);

      if (hostname === "relay.undz.cn")
        return await ayRelay.fetch(request, env, ctx);

      if (hostname === "mysites.undz.cn")
        return await ayAnalytics.fetch(request, env);

      // jsdelivr 代理服务
      if (hostname === "cdn.undz.cn") return await uniCDN.fetch(request, env);

      if (hostname === "ai.undz.cn") return await ai.fetch(request, env);
      if (hostname === "yzh.ai.undz.cn") return await yzhAi.fetch(request, env);
      if (hostname === "files.undz.cn")
        return await ayFiles.fetch(request, env);

      // 直接走前端404
      if (hostname === "mail.undz.cn" || hostname === "mail.io.hb.cn")
        return env.assets.fetch(request);

      // 通用API服务
      if (hostname === "api.undz.cn" || hostname === "api.io.hb.cn")
        return await uniAPI.fetch(request, env);

      // IE8 怀旧聊天室服务
      if (hostname === "chat.undz.cn" || hostname === "c.undz.cn")
        return await chatRoom.fetch(request, env);

      // 短链接跳转（go.undz.cn/{code}）
      if (hostname === "go.undz.cn")
        return await handleShortLink(request, env, ctx);

      if (hostname === "console.undz.cn")
        return await ayConsole.fetch(request, env);

      // AyAccount 集中服务
      if (hostname === "online.undz.cn")
        return await ayOnline.fetch(request, env);

      if (hostname === "kv.undz.cn")
        return await adminServices.fetch(request, env);

      return env.assets.fetch(request);
    } catch (err) {
      console.error(err);
      return new Response(
        `Worker threw exception: ${err.message}\nStack: ${err.stack || "no stack"}`,
        { status: 500, headers: { "Content-Type": "text/plain" } },
      );
    }
  },
};
