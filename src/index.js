// 导入处理函数
import { handleSendVerification } from './mail_verify/send.js';
import { handleVerifyCode } from './mail_verify/verify.js';
import { parseLink } from './go/parse.js';
import { addLink } from './go/addlink.js';
import { initLink } from './go/init.js';
import { CreateAccount, InitDatabase, Login, PushUserBag, GetUserBag, Logout } from './crossfire/v1/crossfire.js';

export default {
  async scheduled(controller, env, ctx) {
    await triggerWorkflow(env);
  },

  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // 设置 CORS 头
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    try {
      // 处理预检请求
      if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
      }

      if (request.method === 'GET') {
        let response = new Response("404 Not found",
          {
            status: 302,
            headers: { 'Location': url.protocol + '//' + url.hostname, }
          });

        if (path === '/go/parse') {
          response = await parseLink(request, env);
        }
        if (path === '/go/init') {
          response = await initLink(request, env);
        }
        if (path.startsWith('/gh/')) {
          const gh_path = path.replace("/gh/", "");
          try {
            const gh_response = await fetch(gh_path, {
              method: "GET",
            });
            if (!gh_response.ok) throw new Error(`Upstream returned ${gh_response.status}`);
            response = new Response(
              gh_response.body,
              { headers: { 'Content-Type': gh_response.headers.get('Content-Type') || 'text/plain', } });

          } catch (e) {
            response = new Response("500 Server Error",{status: 500,});
          }
        }

        if (path === "/trigger") {
          try {
            await triggerWorkflow(env);
            return new Response("Workflow triggered successfully", { status: 200 });
          } catch (err) {
            return new Response("Failed to trigger workflow: " + err.message, { status: 500 });
          }
        }


        for (const [key, value] of Object.entries(corsHeaders)) {
          response.headers.set(key, value);
        }
        return response;
      }

      // 路由处理
      if (request.method === 'POST') {
        let response = new Response('404 Not Found', { status: 404 });
        if (path === '/api/verifymail/v1/send') {
          response = await handleSendVerification(request, env);
        }
        if (path === '/api/verifymail/v1/verify') {
          response = await handleVerifyCode(request, env);
        }
        if (path === '/api/crossfire/v1/account/create') {
          response = await CreateAccount(request, env);
        }
        if (path === '/api/crossfire/v1/account/init') {
          response = await InitDatabase(request, env);
        }
        if (path === '/api/crossfire/v1/account/login') {
          response = await Login(request, env);
        }
        if (path === '/api/crossfire/v1/account/logout') {
          response = await Logout(request, env);
        }
        if (path === '/api/crossfire/v1/bag/get') {
          response = await GetUserBag(request, env);
        }
        if (path === '/api/crossfire/v1/bag/push') {
          response = await PushUserBag(request, env);
        }
        if (path === '/go/addlink') {
          response = await addLink(request, env);
        }

        for (const [key, value] of Object.entries(corsHeaders)) {
          response.headers.set(key, value);
        }
        return response;
      }

      return new Response('Not Found', {
        status: 404,
        headers: corsHeaders
      });
    } catch (err) {
      console.error(err);
      return new Response(`Worker threw exception: ${err.message}\nStack: ${err.stack || "no stack"}`, { status: 500, headers: { "Content-Type": "text/plain" } });
    }
  }
};

async function triggerWorkflow(env) {
  const { GITHUB_TOKEN, OWNER, REPO, WORKFLOW_ID, BRANCH } = env;

  // 校验必要的环境变量
  const missing = [];
  if (!GITHUB_TOKEN) missing.push('GITHUB_TOKEN');
  if (!OWNER) missing.push('OWNER');
  if (!REPO) missing.push('REPO');
  if (!WORKFLOW_ID) missing.push('WORKFLOW_ID');
  if (!BRANCH) missing.push('BRANCH');
  if (missing.length) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }

  const url = `https://api.github.com/repos/${OWNER}/${REPO}/actions/workflows/${WORKFLOW_ID}/dispatches`;
  const payload = { ref: BRANCH };

  console.log(`Triggering workflow: ${OWNER}/${REPO}/${WORKFLOW_ID} on branch ${BRANCH}`);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'User-Agent': 'Cloudflare-Worker-GitHub-Trigger'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    let errorDetail = '';
    try {
      const errorJson = await response.json();
      errorDetail = JSON.stringify(errorJson);
    } catch {
      errorDetail = await response.text();
    }
    throw new Error(`GitHub API error: ${response.status} ${response.statusText} - ${errorDetail}`);
  }

  console.log(`Workflow triggered successfully at ${new Date().toISOString()}`);
  return { success: true, status: response.status };
}