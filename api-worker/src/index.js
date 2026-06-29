import { getMainPage, proxyStaticFile, mobileRegex } from './utils.js';
import { triggerWorkflow } from './trigger_workflow.js';

import apiundzcn from './api.undz.cn.js';
import chatundzcn from './chat.undz.cn.js'
import i0undzcn from './i0.undz.cn.js';
const corsHeaders_GPO = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// const mobileRegex = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|windows phone|phone|webos|kindle|tablet/i;

export default {
  async scheduled(controller, env) {
    await triggerWorkflow(env);
  },

  async fetch(request, env) {
    const url = new URL(request.url);
    const userAgent = request.headers.get('User-Agent') || '';
    const platform = request.headers.get('sec-ch-ua-platform') || '';
    const hostname = url.hostname;
    // const cookie = request.headers.get('Cookie') || '';
    // const db = env.db;
    // const kv = env.kv;
    const isWechat = !!userAgent.match(/MicroMessenger/i);
    const clientIP = request.headers.get('CF-Connecting-IP');
    const isMobile = mobileRegex.test(userAgent) || false;
    // const cookies = parse(cookie);
    let _tm_path;
    try {
      _tm_path = decodeURIComponent(url.pathname);
    } catch {
      _tm_path = url.pathname; // 解码失败时直接使用原路径
    }
    const path = _tm_path;
    try {
      if (path.toLowerCase() === "/favicon.ico") {
        const response = await proxyStaticFile("https://r1.undz.cn/favicon.ico");
        return response;
      }
      if (hostname === 'i0.undz.cn') {
        return await i0undzcn.fetch(request);
      }

      if (hostname === 'mail.undz.cn' || hostname === 'mail.io.hb.cn') {
        return new Response("邮件服务彻底关闭，很抱歉给您带来不便体验", { headers: corsHeaders_GPO });
      }
      if (hostname === 'api.undz.cn' || hostname === 'api.io.hb.cn') {
        return await apiundzcn.fetch(request, env);
      }
      if (hostname === 'chat.undz.cn' || hostname === 'c.undz.cn') {
        return await chatundzcn.fetch(request, env);
      }
      if (hostname === 'online.undz.cn') {
        if (url.protocol === 'http:' && (!userAgent.includes('MSIE') && !userAgent.includes('Trident'))) {
          const newUrl = new URL(request.url);
          newUrl.protocol = 'https:';
          // 如果原端口是 80，则移除（使用 HTTPS 默认 443）
          if (newUrl.port === '80') {
            newUrl.port = '';
          }
          return new Response(null, {
            status: 301,
            headers: { 'Location': newUrl.toString() }
          });
        }
        if (path.startsWith("/api/")) {
          return new Response(JSON.stringify({ code: 200, name: "Cloudflare edge server", userAgent, platform, isWechat, clientIP, isMobile }), {
            headers: { "Content-Type": "application/json" },
          });
        }
        return env.assets.fetch(request);
      }
      return new Response(getMainPage("Undz Service Router", "<h1>Undz Service Router</h1>", "<p>Sorry, we can't find the hostname you are trying to access. Please try again.</p>"), { status: 404, headers: { 'Content-Type': 'text/html' } });
    } catch (err) {
      console.error(err);
      return new Response(`Worker threw exception: ${err.message}\nStack: ${err.stack || "no stack"}`, { status: 500, headers: { "Content-Type": "text/plain" } });
    }
  }
};
