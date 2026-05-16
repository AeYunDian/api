import { USER_AGENT, rewriteUrlToFix, AllUrlRewriter, PROXY_PREFIX_GH, PROXY_PREFIX_FIX_GH, PROXY_PREFIX, PROXY_PREFIX_FIX, getMainPage, convertGhUrl } from "./utils.js";
export async function net_proxy(url, fixIt = false, restricted_from_gh = false) {
    let gh_path;
    if (!restricted_from_gh) {
        const prefix = fixIt ? PROXY_PREFIX_FIX : PROXY_PREFIX;
        const idx = url.href.indexOf(prefix);
        gh_path = url.href.slice(idx + prefix.length);
        if (!gh_path.includes('://')) {
            gh_path = url.protocol + '//' + gh_path;
        }
    } else {
        const url_path = fixIt ? url.pathname.replace(PROXY_PREFIX_FIX_GH, '') : url.pathname.replace(PROXY_PREFIX_GH, '');
        const gh_type = url_path.split('/')[0];
        const converted = convertGhUrl(gh_type);
        if (!converted) {
            return new Response(getMainPage("Ay Net Proxy", "Proxy Error", "Unsupported GitHub URL type: " + gh_type), { status: 400, headers: { 'Content-Type': 'text/html' } });
        }
        const newPath = url_path.slice(gh_type.length);
        gh_path = url.protocol + '//' + converted + newPath + url.search;
    }

    try {
        const gh_response = await fetch(gh_path, {
            method: "GET",
            redirect: "follow",
            headers: { 'User-Agent': USER_AGENT }
        }
        );
        if (!gh_response.ok) throw new Error(`Upstream returned: \n${gh_response.status} ${gh_response.statusText} ${gh_response.url}`);

        if (fixIt) {
            if (gh_response.headers.get('Content-Type')?.includes('text/html')) {
                const newHeaders = new Headers(gh_response.headers);
                newHeaders.delete('Content-Security-Policy'); // 避免 CSP 阻止加载
                const rewriter = new HTMLRewriter()
                    .on('script[src]', new AllUrlRewriter('src', gh_path, restricted_from_gh ? PROXY_PREFIX_FIX_GH : PROXY_PREFIX_FIX))
                    .on('link[href]', new AllUrlRewriter('href', gh_path, restricted_from_gh ? PROXY_PREFIX_FIX_GH : PROXY_PREFIX_FIX))
                    .on('img[src]', new AllUrlRewriter('src', gh_path, restricted_from_gh ? PROXY_PREFIX_FIX_GH : PROXY_PREFIX_FIX))
                    .on('a[href]', new AllUrlRewriter('href', gh_path, restricted_from_gh ? PROXY_PREFIX_FIX_GH : PROXY_PREFIX_FIX))
                    .on('script[integrity]', { element(el) { el.removeAttribute('integrity'); } })
                    .on('link[integrity]', { element(el) { el.removeAttribute('integrity'); } });
                return rewriter.transform(
                    new Response(gh_response.body, { headers: newHeaders })
                );
            }
        }
        return new Response(
            gh_response.body,
            { headers: { 'Content-Type': gh_response.headers.get('Content-Type') || 'text/plain', } });

    } catch (e) {
        const errorText = typeof e === 'string' ? e : (e.message || JSON.stringify(e));
        return new Response(getMainPage("Ay Net Proxy", "Proxy Error", "Unable to request the target URL, please check: \n\n" + errorText.replace(/\n/g, "  \n")), { status: 500, headers: { 'Content-Type': 'text/html' } });
    }
}
export async function getProxyAuthPage(tips) {
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<link rel="icon" href="/favicon.ico" type="image/x-icon" />
<title>获取代理授权</title>
<style>
  body {
    text-align: center;
  }
  input, button {
    background: #ffffff;
    border: 2px solid;
    border-color: #808080;
    padding: 4px 6px;
    font-family: inherit;
    font-size: 12px;
  }
  button {
    background: #c0c0c0;
    border-top-color: #ffffff;
    border-left-color: #ffffff;
    border-right-color: #808080;
    border-bottom-color: #808080;
    cursor: pointer;
    padding: 4px 12px;
  }
  button:active {
    border-top-color: #808080;
    border-left-color: #808080;
    border-right-color: #ffffff;
    border-bottom-color: #ffffff;
  }
.error { background: #ffffa0; border: 1px solid #808080; padding: 4px; color: #c00000; margin-bottom: 12px; }
</style>
</head>
<body>
<div class="window">
  <div class="title-bar">获取代理授权</div>
  <div class="window-content">
    <div id="errorMsg" class="error" ${tips ? "" : 'style="display:none;"'}>${tips}</div>
    <div class="field-row" style="text-align:center; "><label>密钥：</label><input type="password" id="adminKey" size="24"></div>
    <div style="text-align:center; margin-top:20px;"><button id="loginBtn">获取</button></div>
  </div>
</div>
<script>
function trim(s){ return s.replace(/^\\s+|\\s+$/g,''); }
document.getElementById('loginBtn').onclick=function(){
  var key=trim(document.getElementById('adminKey').value);
  if(!key){ alert('请输入密钥'); return; }
  window.location.href='/auth-proxy?key='+encodeURIComponent(key) + '&_t=' + (new Date().getTime());
};
</script>
</body></html>`;
}