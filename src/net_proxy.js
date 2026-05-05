import { USER_AGENT, rewriteUrlToFix, AllUrlRewriter, PROXY_PREFIX_GH, PROXY_PREFIX_FIX, getMainPage} from "./utils.js";
export async function net_proxy(url, request, fixIt = false) {
    const prefix = fixIt ? PROXY_PREFIX_FIX : PROXY_PREFIX_GH;
    const idx = url.href.indexOf(prefix);
    let gh_path = url.href.slice(idx + prefix.length);
    if (!gh_path.includes('://')) {
        gh_path = url.protocol + '//' + gh_path;
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
        }
        return new Response(
            gh_response.body,
            { headers: { 'Content-Type': gh_response.headers.get('Content-Type') || 'text/plain', } });

    } catch (e) {
        const errorText = typeof e === 'string' ? e : (e.message || JSON.stringify(e));
        return new Response(getMainPage("Ay Net Proxy", "Proxy Error","Unable to request the target URL, please check: \n\n" + errorText.replace("\n", "  \n")), { status: 500, },  { headers: { 'Content-Type': 'application/json' } });
    }
}