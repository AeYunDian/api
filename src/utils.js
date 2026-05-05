export const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36';
export const PROXY_PREFIX_GH = '/gh/';
export const PROXY_PREFIX_FIX = '/gh_fix/';
export function rewriteUrlToFix(rawAttr, baseUrl) {
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

export class AllUrlRewriter {
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

export function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/[&<>]/g, function (m) {
    if (m === "&") return "&amp;";
    if (m === "<") return "&lt;";
    if (m === ">") return "&gt;";
    return m;
  });
}

export function getMainPage(title = "AyUndz API", name = "AyUndz API", description = "This is the default page of AyUndz API", footer = "AyRouter | Powered by <a href=\"https://cloudflare.com\" target=\"_blank\">Cloudflare</a>") {
  return `
    <html>
      <head><title>${title}</title></head>
      <body>
        <h1>${name}</h1>
        <p>${description}</p>
        <hr />
        <p>${footer}</p>
      </body>
    </html>
  `;
}
export async function proxyStaticFile(url, protocol = "https:") {
  try {
    const response = await fetch(url, {
      method: "GET",
    });
    if (!response.ok) throw new Error(`Upstream returned ${response.status}`);
    return new Response(
      response.body,
      { headers: { 'Content-Type': response.headers.get('Content-Type') || 'image/x-icon', } });

  } catch (e) {
    return new Response("Server Error",
      {
        status: 302,
        headers: { 'Location': protocol + '//r1.undz.cn/favicon.ico', }
      });
  }
}
