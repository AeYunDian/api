import { getMainPage, md5Hex, escapeHtml } from './utils.js';
import { getProxyAuthPage } from './net_proxy.js';
import { serialize } from 'cookie';
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const clientIP = request.headers.get('CF-Connecting-IP');
    const key = url.searchParams.get("key") || '';
    if (key === env.KEY || key === env.Bac2) {
      const setCookie = serialize('undz_api_proxy', 'true', {
        secure: true,
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60,
        sameSite: 'lax',
        path: '/'
      });
      const setKey = serialize('undz_api_key', await md5Hex(clientIP + env.KEY), {
        secure: true,
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60,
        sameSite: 'lax',
        path: '/'
      });
      return new Response(getMainPage("Authorization successful!", "<h1>Authorization successful!</h1>", `<p>You have successfully obtained 7-day access to this API. </p>
                        <div id="returnSection">
                          <p id="returnMessage">Will return after 5s.</p>
                          <a href="#" onclick="cancelReturn()" id="cancelReturnLBL">Cancel return?</a> <a href="#" onclick="returnImmediately()" id="returnImmediatelyLBL">Return immediately?</a>
                        </div>
                        <script>
                          let cancelAutoReturn = false;
                          function cancelReturn() {
                            document.getElementById('cancelReturnLBL').style.display = 'none';
                            document.getElementById('returnMessage').textContent = 'Automatic return has been canceled. You can close this page or click back.';
                            document.getElementById('returnImmediatelyLBL').textContent = 'Return';
                            cancelAutoReturn = true;
                          }
                          function returnImmediately() {
                            window.location.href = "${escapeHtml(url.searchParams.get("redirect-to") || "/")}"
                          }
                          setTimeout(() => {
                            if (cancelAutoReturn) return;
                            window.location.href = "${escapeHtml(url.searchParams.get("redirect-to") || "/")}"
                          }, 5000);
                          if ("${escapeHtml(url.searchParams.get("redirect-to") || "/")}" === "/") {
                            cancelAutoReturn = true;
                            document.getElementById('returnSection').style.display = 'none';
                          }
                        </script>
                        `), { headers: { 'Content-Type': 'text/html', 'Set-Cookie': `${setCookie}; ${setKey}` } });
    } else if (key !== '') {
      const setCookie = serialize('undz_api_proxy', '', {
        secure: true,
        httpOnly: true,
        maxAge: 0,
        sameSite: 'lax',
        path: '/'
      });
      const setKey = serialize('undz_api_key', '', {
        secure: true,
        maxAge: 0,
        httpOnly: true,
        sameSite: 'lax',
        path: '/'
      });
      return new Response(getProxyAuthPage("密钥不正确", null), { headers: { 'Content-Type': 'text/html', "Set-Cookie": `${setCookie}; ${setKey}` } });
    }
    return new Response(getProxyAuthPage(null, escapeHtml(url.searchParams.get("redirect-to") || null)), { headers: { 'Content-Type': 'text/html' } });
  }
}