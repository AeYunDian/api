// 导入处理函数
import { handleSendVerification } from './mail_verify/send.js';
import { handleVerifyCode } from './mail_verify/verify.js';
import { parseLink } from './go/parse.js';
import { addLink } from './go/addlink.js';
import { initLink } from './go/init.js';
import { CreateAccount, InitDatabase, Login, PushUserBag, GetUserBag, Logout } from './crossfire/v1/crossfire.js';
const PROXY_PREFIX_GH = 'https://api.undz.cn/gh/';
const PROXY_PREFIX_FIX = 'https://api.undz.cn/gh_fix/';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function rewriteUrlToFix(rawAttr, baseUrl) {
  if (!rawAttr) return rawAttr;
  let absoluteUrl;
  if (rawAttr.startsWith('http://') || rawAttr.startsWith('https://')) {
    absoluteUrl = rawAttr;
  } else if (rawAttr.startsWith('//')) {
    absoluteUrl = 'https:' + rawAttr;
  } else if (rawAttr.startsWith('/')) {
    const base = new URL(baseUrl);
    absoluteUrl = base.origin + rawAttr;
  } else {
    absoluteUrl = new URL(rawAttr, baseUrl).href;
  }
  return PROXY_PREFIX_FIX + absoluteUrl;
}
class AllUrlRewriter {
  constructor(attrName, baseUrl) {
    this.attrName = attrName;
    this.baseUrl = baseUrl;
  }
  element(element) {
    const oldValue = element.getAttribute(this.attrName);
    if (!oldValue || oldValue.startsWith(PROXY_PREFIX_FIX)) return;
    const newValue = rewriteUrlToFix(oldValue, this.baseUrl);
    element.setAttribute(this.attrName, newValue);
  }
}
export default {
  async scheduled(controller, env, ctx) {
    await triggerWorkflow(env);
  },

  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // 处理预检请求
      if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
      }

      if (request.method === 'GET') {

        if (path === "/") {
          return new Response(getMainPage(), { headers: { 'Content-Type': 'text/html' } });
        }

        if (path === '/go/parse') {
          return new Response(await parseLink(request, env), { headers: { 'Content-Type': 'application/json' } });
        }
        if (path === '/go/init') {
          return new Response(await initLink(request, env), { headers: { 'Content-Type': 'application/json' } });
        }
        if (path.startsWith('/gh/')) {
          let gh_path = path.replace("/gh/", "");
          if (!gh_path.includes('://')) {
            gh_path = url.protocol + '//' + gh_path;
          }
          try {
            const gh_response = await fetch(gh_path, {
              method: "GET",
            });
            if (!gh_response.ok) throw new Error(`Upstream returned: \n${gh_response}`);
            return new Response(
              gh_response.body,
              { headers: { 'Content-Type': gh_response.headers.get('Content-Type') || 'text/plain', } });

          } catch (e) {
            const errorText = typeof e === 'string' ? e : (JSON.stringify(e) || e.message);
            return new Response("Unable to request the target URL, please check the address: \n\n" + errorText.replace("'\n'", "  \n"), { status: 500, });
          }
        }
        if (path.startsWith('/gh_fix/')) {
          let gh_path = path.replace('/gh_fix/', '');
          if (!gh_path.includes('://')) {
            gh_path = url.protocol + '//' + gh_path;
          }
          try {
            const gh_response = await fetch(gh_path, {
              method: "GET",
            });
            if (!gh_response.ok) throw new Error(`Upstream returned: \n${gh_response}`);

            if (gh_response.headers.get('Content-Type')?.includes('text/html')) {
              const newHeaders = new Headers(gh_response.headers);
              newHeaders.delete('Content-Security-Policy'); // 避免 CSP 阻止加载
              const rewriter = new HTMLRewriter()
                .on('script[src]', new AllUrlRewriter('src', gh_path))
                .on('link[href]', new AllUrlRewriter('href', gh_path))
                .on('img[src]', new AllUrlRewriter('src', gh_path))
                .on('a[href]', new AllUrlRewriter('href', gh_path))
                .on('script[integrity]', { element(el) { el.removeAttribute('integrity'); } })
                .on('link[integrity]', { element(el) { el.removeAttribute('integrity'); } });
              return rewriter.transform(
                new Response(gh_response.body, { headers: newHeaders })
              );
            }

            return new Response(
              gh_response.body,
              { headers: { 'Content-Type': gh_response.headers.get('Content-Type') || 'text/plain', } });

          } catch (e) {
            const errorText = typeof e === 'string' ? e : (JSON.stringify(e) || e.message);
            return new Response("Unable to request the target URL, please check the address: \n\n" + errorText.replace("'\n'", "  \n"), { status: 500, });
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

        return new Response("302",
          {
            status: 302,
            headers: { 'Location': url.protocol + '//' + url.hostname, }
          });;
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
function getMainPage() {
  return `<!DOCTYPE html>
  <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <link rel="icon" href="//r1.undz.cn/favicon.ico" type="image/x-icon" />
      <link rel="shortcut icon" href="//r1.undz.cn/favicon.ico" type="image/x-icon" />
      <title>AyUndz API</title>
    </head>
    <body>
      <h2>AyUndz API</h2>
      <hr/>
      <p>© 2025-2026 韵典 AeYunDian | Ay Project | Powered by Cloudflare Workers</p>
    </body>
  </html>`;
}
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