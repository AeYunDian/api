// 导入处理函数
import { handleSendVerification } from './send.js';
import { handleVerifyCode } from './verify.js';
import { addTransferredMail } from './atf.js';
import { CreateAccount, InitDatabase , Login , PushUserBag, GetUserBag, Logout} from './crossfire.js'; // 添加 initDatabase 导入

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // 设置 CORS 头
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // 处理预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    if (request.method === 'GET') {
      return new Response('Hello World!  Path: ' + url.pathname, { 
        status: 200,
        headers: corsHeaders
      });
    }
    
    // 路由处理
    if (request.method === 'POST') {
      if (path === '/api/vermail/send') {
        const response = await handleSendVerification(request, env);
        // 添加 CORS 头
        for (const [key, value] of Object.entries(corsHeaders)) {
          response.headers.set(key, value);
        }
        return response;
      } else if (path === '/api/vermail/verify') {
        const response = await handleVerifyCode(request, env);
        // 添加 CORS 头
        for (const [key, value] of Object.entries(corsHeaders)) {
          response.headers.set(key, value);
        }
        return response;
      } else if (path === '/api/yspost/transferredmail') {
        const response = await addTransferredMail(request, env);
        // 添加 CORS 头
        for (const [key, value] of Object.entries(corsHeaders)) {
          response.headers.set(key, value);
        }
        return response;
      } else if (path === '/api/crossfire/account/create') {
        const response = await CreateAccount(request, env);
        // 添加 CORS 头
        for (const [key, value] of Object.entries(corsHeaders)) {
          response.headers.set(key, value);
        }
        return response;
      } else if (path === '/api/crossfire/account/init') {
        const response = await InitDatabase(request, env);
        // 添加 CORS 头
        for (const [key, value] of Object.entries(corsHeaders)) {
          response.headers.set(key, value);
        }
        return response;
      }  else if (path === '/api/crossfire/account/login') {
        const response = await Login(request, env);
        // 添加 CORS 头
        for (const [key, value] of Object.entries(corsHeaders)) {
          response.headers.set(key, value);
        }
        return response;
      }  else if (path === '/api/crossfire/account/logout') {
        const response = await Logout(request, env);
        // 添加 CORS 头
        for (const [key, value] of Object.entries(corsHeaders)) {
          response.headers.set(key, value);
        }
        return response;
      }  else if (path === '/api/crossfire/bag/get') {
        const response = await GetUserBag(request, env);
        // 添加 CORS 头
        for (const [key, value] of Object.entries(corsHeaders)) {
          response.headers.set(key, value);
        }
        return response;
      }  else if (path === '/api/crossfire/bag/push') {
        const response = await PushUserBag(request, env);
        // 添加 CORS 头
        for (const [key, value] of Object.entries(corsHeaders)) {
          response.headers.set(key, value);
        }
        return response;
      }
    }

    return new Response('Not Found', { 
      status: 404,
      headers: corsHeaders
    });
  }
};




