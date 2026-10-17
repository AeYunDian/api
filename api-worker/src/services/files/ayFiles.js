// files.undz.cn

// ========== 内嵌页面 ==========
const NOT_FOUND_HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>404 - AyFiles</title><style>
*{box-sizing:border-box}
html,body{height:100%;margin:0}
body{background:#fafafa;font-family:Roboto,-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei","Helvetica Neue",Arial,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
.container{display:table;width:100%;height:100%}
.wrapper{display:table-cell;vertical-align:middle;text-align:center;padding:24px 24px 60px}
.card{display:inline-block;width:100%;max-width:440px;padding:40px 24px 44px;text-align:center;background:#fff;border:1px solid rgba(0,0,0,.12);border-radius:4px;box-shadow:0 2px 4px rgba(0,0,0,.2)}
.code{font-size:72px;font-weight:500;line-height:1;letter-spacing:4px;color:#1976d2}
h1{margin:16px 0 8px;font-size:20px;font-weight:500;line-height:1.6;letter-spacing:.15px;color:rgba(0,0,0,.87)}
p{margin:0;font-size:14px;font-weight:400;line-height:1.6;letter-spacing:.25px;color:rgba(0,0,0,.6)}
.footer{position:fixed;bottom:0;left:0;width:100%;padding:12px 16px;text-align:center;font-size:12px;line-height:1.5;color:rgba(0,0,0,.54);background:transparent}
@media(prefers-color-scheme:dark){body{background:#121212}.card{background:#1e1e1e;border-color:rgba(255,255,255,.12);box-shadow:0 2px 4px rgba(0,0,0,.6)}.code{color:#90caf9}h1{color:rgba(255,255,255,.87)}p{color:rgba(255,255,255,.6)}.footer{color:rgba(255,255,255,.54)}}
</style></head>
<body><div class="container"><div class="wrapper"><div class="card">
<div class="code">404</div>
<h1>文件不存在</h1>
<p>你访问的文件不存在，或已过期、已被删除。</p></div></div></div>
<div class="footer">© AeYunDian AyFiles. All rights reserved.</div>
</body></html>`;

function passwordPage(hasError) {
  const html = `<!DOCTYPE html>
<html lang="zh-CN"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>文件访问保护 - AyFiles</title><style>
*{box-sizing:border-box}
html,body{height:100%;margin:0}
body{display:table;width:100%;height:100%;background:#fafafa;font-family:Roboto,-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei","Helvetica Neue",Arial,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
.wrapper{display:table-cell;vertical-align:middle;text-align:center;padding:24px}
.card{display:inline-block;width:100%;max-width:400px;padding:32px 24px 36px;text-align:left;background:#fff;border:1px solid rgba(0,0,0,.12);border-radius:4px;box-shadow:0 2px 4px rgba(0,0,0,.2)}
.icon{text-align:center;margin-bottom:8px;color:#1976d2}
.icon svg{display:inline-block;vertical-align:middle}
.lock-path{stroke-dasharray:1;stroke-dashoffset:1;animation:draw 2s cubic-bezier(.4,0,.2,1) forwards}
@keyframes draw{to{stroke-dashoffset:0}}
h1{margin:0 0 6px;font-size:20px;font-weight:500;line-height:1.5;letter-spacing:.15px;text-align:center;color:rgba(0,0,0,.87)}
p.sub{margin:0 0 22px;font-size:13px;line-height:1.5;letter-spacing:.25px;text-align:center;color:rgba(0,0,0,.6)}
input[type="password"]{width:100%;padding:12px 14px;border:1px solid rgba(0,0,0,.32);border-radius:4px;background:#fff;color:rgba(0,0,0,.87);font-size:15px;font-family:inherit;line-height:1.4;outline:none}
input[type="password"]:focus{border-color:#1976d2}
button{width:100%;margin-top:14px;padding:12px;border:none;border-radius:4px;background:#1976d2;color:#fff;font-size:15px;font-weight:500;font-family:inherit;letter-spacing:.5px;cursor:pointer}
button:hover{background:#1565c0}
button:active{background:#0d47a1}
.footer{position:fixed;bottom:0;left:0;width:100%;padding:12px 16px;text-align:center;font-size:12px;line-height:1.5;color:rgba(0,0,0,.54);background:transparent}
.error{margin-bottom:14px;padding:10px 12px;border-radius:4px;background:#fdecea;border:1px solid #f5c6cb;color:#b71c1c;font-size:13px;line-height:1.5;text-align:center}
@media(prefers-color-scheme:dark){body{background:#121212}.footer{color:rgba(255,255,255,.54)}.card{background:#1e1e1e;border-color:rgba(255,255,255,.12);box-shadow:0 2px 4px rgba(0,0,0,.6)}.icon{color:#90caf9}h1{color:rgba(255,255,255,.87)}p.sub{color:rgba(255,255,255,.6)}input[type="password"]{background:#121212;color:rgba(255,255,255,.87);border-color:rgba(255,255,255,.32)}input[type="password"]:focus{border-color:#90caf9}button{background:#90caf9;color:rgba(0,0,0,.87)}button:hover{background:#64b5f6}button:active{background:#42a5f5}.error{background:rgba(244,67,54,.16);border-color:rgba(244,67,54,.4);color:#ef9a9a}}
</style></head>
<body><div class="wrapper"><div class="card"><div class="icon">
<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" aria-hidden="true">
<path d="M0 0h24v24H0z" fill="none"/>
<path class="lock-path" pathLength="1" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19.86 15.86A9.7 9.7 0 0 0 21 11.237V7.748c0-1.405 0-2.108-.45-2.834s-.913-.957-1.841-1.419C16.817 2.554 14.5 2 12 2c-1.852 0-3.603.304-5.156.844M4.142 4.142c-.266.198-.48.43-.692.772C3 5.64 3 6.343 3 7.748v3.49c0 5.683 4.542 8.842 7.173 10.196c.734.377 1.1.566 1.827.566s1.093-.189 1.827-.566c1.253-.645 2.94-1.7 4.364-3.243M2 2l20 20"/>
</svg></div>
<h1>受保护的文件</h1>
<p class="sub">该文件需要密码才能访问</p>
${hasError ? '<div class="error">密码错误，请重试</div>' : ""}
<form method="POST" action="">
<input type="password" name="password" placeholder="请输入访问密码" required autofocus>
<button type="submit">下载</button>
</form></div></div><div class="footer">© AeYunDian AyFiles. All rights reserved.</div></body>
</html>`;
  return new Response(html, {
    status: hasError ? 403 : 401,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

function notFound() {
  return new Response(NOT_FOUND_HTML, {
    status: 404,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

// ========== 工具 ==========
// RFC 4648 Base32（无 padding），用于把 code 转成合法的 cookie 名片段
function base32Encode(input) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const bytes = new TextEncoder().encode(input);
  let bits = 0;
  let value = 0;
  let output = "";
  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;
    while (bits >= 5) {
      output += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += alphabet[(value << (5 - bits)) & 31];
  }
  return output;
}

function getCookie(request, name) {
  const cookie = request.headers.get("Cookie") || "";
  if (!cookie) return null;
  const parts = cookie.split(/;\s*/);
  for (const p of parts) {
    const eq = p.indexOf("=");
    if (eq === -1) continue;
    const k = p.slice(0, eq).trim();
    if (k === name) {
      let v = p.slice(eq + 1);
      try {
        v = decodeURIComponent(v);
      } catch {
        /* keep raw */
      }
      return v;
    }
  }
  return null;
}

// 清除 cookie 的响应头（Path=/ 尽量覆盖大部分场景）
function clearCookieHeader(name) {
  return `${name}=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; Secure`;
}

// 从 POST body 中提取 password / pw（兼容 JSON、表单、纯文本）
async function extractPasswordFromBody(request) {
  const ct = (request.headers.get("Content-Type") || "").toLowerCase();
  try {
    if (ct.includes("application/json")) {
      const body = await request.json();
      if (body && typeof body.password === "string") return body.password;
      if (body && typeof body.pw === "string") return body.pw;
    } else if (
      ct.includes("application/x-www-form-urlencoded") ||
      ct.includes("multipart/form-data")
    ) {
      const form = await request.formData();
      const v = form.get("password") || form.get("pw");
      if (typeof v === "string") return v;
    } else if (ct.includes("text/plain")) {
      const t = await request.text();
      if (t) return t.trim();
    }
  } catch {
    /* ignore */
  }
  return null;
}

// ========== Worker ==========
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path.startsWith("/files/")) {
      let code = path.slice("/files/".length);
      try {
        code = decodeURIComponent(code);
      } catch {
        /* keep raw */
      }
      code = code.replace(/\/+$/, "");
      if (!code) return notFound();

      let rec;
      try {
        rec = await env.db
          .prepare("SELECT * FROM file_manager WHERE code = ?")
          .bind(code)
          .first();
      } catch (err) {
        if (env.DEBUG) console.error("files lookup error:", err);
        return notFound();
      }
      if (!rec) return notFound();

      const now = Math.floor(Date.now() / 1000);
      if (rec.expiration_at && now > rec.expiration_at) {
        return notFound();
      }

      const cookieName = `FM_${base32Encode(code)}`;
      const clearHeader = clearCookieHeader(cookieName);

      // —— 提供文件 ——
      const serveFile = async () => {
        const obj = await env.STORAGE_BUCKET.get(rec.r2_key);
        if (!obj) return notFound();
        const filename = rec.path.split("/").pop() || "file";
        const headers = {
          "Content-Type": rec.mime_type || "application/octet-stream",
          "Content-Disposition":
            `attachment; filename="${filename}"; filename*=UTF-8''` +
            encodeURIComponent(filename),
          "Cache-Control": "private, max-age=0, no-store",
          "Set-Cookie": clearHeader,
        };
        if (obj.size) headers["Content-Length"] = String(obj.size);
        return new Response(obj.body, { status: 200, headers });
      };

      // —— 返回密码表单（带 / 不带错误） ——
      const servePasswordPage = (hasError) => {
        const res = passwordPage(hasError);
        const headers = new Headers(res.headers);
        headers.append("Set-Cookie", clearHeader);
        return new Response(res.body, { status: res.status, headers });
      };

      // 不需要密码：直接给
      if (!rec.need_password) {
        return serveFile();
      }

      // 需要密码：优先从 POST body 取，否则从 cookie 取
      let providedPw = null;
      if (request.method === "POST") {
        providedPw = await extractPasswordFromBody(request);
      }
      if (providedPw === null) {
        providedPw = getCookie(request, cookieName);
      }

      if (providedPw === null) {
        // 没提供密码 → 显示表单（无错误）
        return servePasswordPage(false);
      }
      if (providedPw !== rec.password) {
        // 密码错误 → 显示表单（带错误）
        return servePasswordPage(true);
      }
      // 密码正确 → 直出文件（同时清除 cookie）
      return serveFile();
    }

    return notFound();
  },
};
