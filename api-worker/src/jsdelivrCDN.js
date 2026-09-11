import { USER_AGENT } from "./utils.js";
export default {
    async fetch(request, env) {
        const url = new URL(request.url)
        const target = `${url.protocol}//cdn.jsdelivr.net${url.pathname}${url.search || ''}`
        const allowed = ['/npm/', '/gh/', '/file/', '/files/', '/wordpress/', '/combine/'];
        if (url.pathname === '/') {
            if (env.assets) {
                const newUrl = new URL(request.url);
                newUrl.pathname = '/cdn/';
                const newRequest = new Request(newUrl, request);
                return env.assets.fetch(newRequest);
            } else {
                // 如果没有绑定 assets，可以返回一个默认响应或继续代理
                return new Response('Welcome to cdn.undz.cn', {
                    status: 200,
                    headers: { 'Content-Type': 'text/plain' }
                });
            }
        }

        if (!allowed.some(p => url.pathname.startsWith(p))) {
            return new Response(`
<html>
<head><title>403 Forbidden</title></head>
<body>
<center><h1>403 Forbidden</h1></center>
<hr><center>nginx</center>
</body>
</html>
<!-- a padding to disable MSIE and Chrome friendly error page -->
<!-- a padding to disable MSIE and Chrome friendly error page -->
<!-- a padding to disable MSIE and Chrome friendly error page -->
<!-- a padding to disable MSIE and Chrome friendly error page -->
<!-- a padding to disable MSIE and Chrome friendly error page -->
<!-- a padding to disable MSIE and Chrome friendly error page -->
`, { status: 403, headers: { 'Content-Type': 'text/html' } });
        }
        const headers = new Headers(request.headers)
        headers.set('User-Agent', USER_AGENT)

        const proxyRequest = new Request(target, {
            method: request.method,
            headers: headers,
            body: request.body,
            redirect: 'follow',
        })

        try {
            // 发起请求
            const response = await fetch(proxyRequest)

            // 构造新响应，添加 CORS 头
            const newResponse = new Response(response.body, response)
            newResponse.headers.set('Access-Control-Allow-Origin', '*')

            return newResponse
        } catch (error) {
            console.error(error.message);
            //伪装nginx
            return new Response(`
                <html>
<head><title>502 Bad Gateway</title></head>
<body>
<center><h1>502 Bad Gateway</h1></center>
<hr><center>nginx</center>
</body>
</html>
<!-- a padding to disable MSIE and Chrome friendly error page -->
<!-- a padding to disable MSIE and Chrome friendly error page -->
<!-- a padding to disable MSIE and Chrome friendly error page -->
<!-- a padding to disable MSIE and Chrome friendly error page -->
<!-- a padding to disable MSIE and Chrome friendly error page -->
<!-- a padding to disable MSIE and Chrome friendly error page -->
                `, { status: 502, headers: { 'Content-Type': 'text/html' } })
        }
    }
}