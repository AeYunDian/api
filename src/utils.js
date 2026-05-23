export const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36';
export const PROXY_PREFIX = '/proxy/';
export const PROXY_PREFIX_FIX = '/proxy_fix/';
export const PROXY_PREFIX_GH = '/gh/';
export const PROXY_PREFIX_FIX_GH = '/gh_fix/';
export function rewriteUrlToFix(rawAttr, baseUrl, proxyPrefix) {
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
  return proxyPrefix + absoluteUrl;
}
export function assertString(str) {
  if (typeof str !== 'string') {
    throw new TypeError('Expected a string');
  }
}
export class AllUrlRewriter {
  constructor(attrName, baseUrl, proxyPrefix) {
    this.attrName = attrName;
    this.baseUrl = baseUrl;
    this.proxyPrefix = proxyPrefix;
  }
  element(element) {
    const oldValue = element.getAttribute(this.attrName);
    if (!oldValue || oldValue.startsWith(this.proxyPrefix)) return;
    const newValue = rewriteUrlToFix(oldValue, this.baseUrl, this.proxyPrefix);
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
export function isGithubUrl(str) {
  try {
    return str.endsWith('github.com') ||
      str.endsWith('github.io') ||
      str.endsWith('githubusercontent.com') ||
      str.endsWith('fastly.net') ||
      str.endsWith('camo.githubusercontent.com') ||
      str.endsWith('avatars.githubusercontent.com') ||
      str.endsWith('user-content.githubusercontent.com') ||
      str.endsWith('assets-cdn.github.com') ||
      str.endsWith('githubassets.com') ||
      str.endsWith('support-assets.githubassets.com') ||
      str.endsWith('education.github.com') ||
      str.endsWith('resources.github.com') ||
      str.endsWith('uploads.github.com') ||
      str.endsWith('archiveprogram.github.com') ||
      str.endsWith('githubusercontent.com') ||
      str.endsWith('raw.githubusercontent.com') ||
      str.endsWith('cloud.githubusercontent.com') ||
      str.endsWith('avatars0.githubusercontent.com') ||
      str.endsWith('avatars1.githubusercontent.com') ||
      str.endsWith('avatars2.githubusercontent.com') ||
      str.endsWith('avatars3.githubusercontent.com') ||
      str.endsWith('avatars4.githubusercontent.com') ||
      str.endsWith('user-images.githubusercontent.com') ||
      str.endsWith('objects.githubusercontent.com') ||
      str.endsWith('private-user-images.githubusercontent.com') ||
      str.endsWith('pages.github.com') ||
      str.endsWith('githubapp.com') ||
      str.endsWith('greasyfork.org') ||
      str.endsWith('update.greasyfork.org') ||
      str.endsWith('github.dev') ||
      str.endsWith('github.global.ssl.fastly.net') ||
      str.endsWith('gist.github.com') ||
      str.endsWith('github.githubassets.com') ||
      str.endsWith('api.github.com') ||
      str.endsWith('github.githubassets.com') || 
      str.endsWith('undz.cn') || 
      str.endsWith('io.hb.cn');
  } catch (e) {
    return false;
  }
}
export function convertGhUrl(gh_type) {
  try {
    switch (gh_type) {
      case 'www':
        return "github.com";
      case 'raw':
        return "raw.githubusercontent.com";
      case 'gist':
        return "gist.github.com";
      case 'api':
        return "api.github.com";
      case 'io':
        return "github.io";
      case 'camo':
        return "camo.githubusercontent.com";
      case 'avatars':
        return "avatars.githubusercontent.com";
      case 'usercontent':
        return "user-content.githubusercontent.com";
      case 'assets':
        return "assets-cdn.github.com";
      case 'ghs':
        return "github.global.ssl.fastly.net";
      case 'greasyfork':
        return "greasyfork.org";
      case 'upgf':
        return "update.greasyfork.org";
      case 'dev':
        return "github.dev";
      case 'githubassets':
        return "github.githubassets.com";
      case 'support':
        return "support-assets.githubassets.com";
      case 'edu':
        return "education.github.com";
      case 'res':
        return "resources.github.com";
      case 'upload':
        return "uploads.github.com";
      case 'ap':
        return "archiveprogram.github.com";
      case 'guc':
        return "githubusercontent.com";
      case 'cloud':
        return "cloud.githubusercontent.com";
      case 'avatars0':
        return "avatars0.githubusercontent.com";
      case 'avatars1':
        return "avatars1.githubusercontent.com";
      case 'avatars2':
        return "avatars2.githubusercontent.com";
      case 'avatars3':
        return "avatars3.githubusercontent.com";
      case 'avatars4':
        return "avatars4.githubusercontent.com";
      case 'userimg':
        return "user-images.githubusercontent.com";
      case 'objects':
        return "objects.githubusercontent.com";
      case 'pui':
        return "private-user-images.githubusercontent.com";
      case 'pages':
        return "pages.github.com";
      case 'app':
        return "githubapp.com";
      default:
        return null;
    }
  } catch (e) {
    return null;
  }
}
export async function md5Hex(data) {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('MD5', bytes);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
export function getMainPage(title = "AyUndz API", name = "<h1>AyUndz API</h1>", description = "<p>This is the default page of AyUndz API.</p>", footer = "<p>AyRouter | Powered by <a href=\"https://cloudflare.com\" target=\"_blank\">Cloudflare</a></p>") {
  const filler = '<!-- ' + 'x'.repeat(256) + ' -->'
  return `
    <html>
      <head><title>${title}</title></head>
      <body style="text-align: center;">
        ${name}
        ${description}
        ${footer ? '<hr />' : ''}
        ${footer}
      </body>
    </html>
    <!-- a padding to disable MSIE and Chrome friendly error page -->
    <!-- a padding to disable MSIE and Chrome friendly error page -->
    <!-- a padding to disable MSIE and Chrome friendly error page -->
    <!-- a padding to disable MSIE and Chrome friendly error page -->
    ${filler}
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

export function anonymizeIp(ipString) {
  // 1. 提取纯地址并移除端口
  let pureAddress = '';

  // 处理带方括号的IPv6（可能带端口）
  const bracketMatch = ipString.match(/^\[([0-9a-fA-F:]+)\](?::\d+)?$/);
  if (bracketMatch) {
    pureAddress = bracketMatch[1];
  }
  // 处理IPv4（可能带端口）
  else {
    const ipv4Match = ipString.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(?::\d+)?$/);
    if (ipv4Match) {
      pureAddress = ipv4Match[1];
    }
    // 无端口的标准IPv6（无方括号）
    else {
      pureAddress = ipString;
    }
  }

  // 2. 处理IPv4
  if (pureAddress.includes('.') && !pureAddress.includes(':')) {
    const parts = pureAddress.split('.');
    if (parts.length === 4) {
      parts[2] = '*'.repeat(parts[2].length);
      parts[3] = '*'.repeat(parts[3].length);
      return parts.join('.');
    }
    return pureAddress; // 回退
  }

  // 3. 处理IPv6 (必须包含冒号)
  if (pureAddress.includes(':')) {
    // 3.1 展开压缩格式为完整的8组十六进制数
    const groups = expandIPv6(pureAddress);

    // 3.2 隐藏中间两组（索引2和3）
    groups[2] = '*'.repeat(groups[2].length);
    groups[3] = '*'.repeat(groups[3].length);
    groups[6] = '*'.repeat(groups[6].length);
    groups[7] = '*'.repeat(groups[7].length);
    // 3.3 简化其他组（去除前导零），保留星号组不变
    const finalGroups = groups.map(group => {
      if (group.includes('*')) return group;
      const num = parseInt(group, 16);
      return Number.isNaN(num) ? group : num.toString(16);
    });

    return finalGroups.join(':');
  }

  // 未识别格式，返回原字符串
  return ipString;
}

// 辅助函数：将IPv6地址展开为8组标准十六进制字符串（每组保留原长度用于后续转换）
function expandIPv6(addr) {
  if (addr === '::') {
    return new Array(8).fill('0');
  }

  const parts = addr.split(':');
  let groups = new Array(8).fill(null);

  // 查找压缩标记 "::" 的位置
  let emptyIndex = -1;
  for (let i = 0; i < parts.length; i++) {
    if (parts[i] === '') {
      emptyIndex = i;
      break;
    }
  }

  if (emptyIndex === -1) {
    // 无压缩，直接使用现有各组（必须是8组）
    return parts.map(p => p || '0');
  }

  // 有压缩，计算缺失的组数
  const nonEmptyParts = parts.filter(p => p !== '');
  const missingCount = 8 - nonEmptyParts.length;

  const result = [];
  // 压缩标记前的部分
  for (let i = 0; i < emptyIndex; i++) {
    result.push(parts[i]);
  }
  // 填充缺失的零组
  for (let i = 0; i < missingCount; i++) {
    result.push('0');
  }
  // 压缩标记后的部分
  for (let i = emptyIndex + 1; i < parts.length; i++) {
    if (parts[i] !== '') {
      result.push(parts[i]);
    }
  }

  return result;
}
const notBase64 = /[^A-Z0-9+\/=]/i;

export function isBase64(str) {
  assertString(str);
  const len = str.length;
  if (!len || len % 4 !== 0 || notBase64.test(str)) {
    return false;
  }
  const firstPaddingChar = str.indexOf('=');
  return firstPaddingChar === -1 ||
    firstPaddingChar === len - 1 ||
    (firstPaddingChar === len - 2 && str[len - 1] === '=');
}
export function toBase64(str) {
    const bytes = new TextEncoder().encode(str);
    const bin = String.fromCharCode(...bytes);
    return btoa(bin);
}
export function utf8ToBase64(str) {
    // 将字符串编码为 UTF-8 字节数组
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);  // Uint8Array
    // 将字节数组转换为二进制字符串（每个字节转成对应字符）
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    // 最后 Base64 编码
    return btoa(binary);
}
export function base64ToUtf8(base64Str) {
    // 标准 Base64 解码为二进制字符串
    const binary = atob(base64Str);
    // 将二进制字符串转回 Uint8Array
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
    // 使用 TextDecoder 解码为 UTF-8 字符串
    const decoder = new TextDecoder();
    return decoder.decode(bytes);
}