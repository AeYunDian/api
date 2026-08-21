export const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36';

export function assertString(str) {
  if (typeof str !== 'string') {
    throw new TypeError('Expected a string');
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
      <head><meta charset="UTF-8"><title>${title}</title></head>
      <body style="text-align: center;">
        ${name}
        ${description}
        ${footer ? '<hr />' : ''}
        ${footer ? footer : ''}
      </body>
    </html>
    <!-- a padding to disable MSIE and Chrome friendly error page -->
    <!-- a padding to disable MSIE and Chrome friendly error page -->
    <!-- a padding to disable MSIE and Chrome friendly error page -->
    <!-- a padding to disable MSIE and Chrome friendly error page -->
    ${filler}
  `;
}

export function anonymizeIp(ipString) {
  let pureAddress = '';
  const bracketMatch = ipString.match(/^\[([0-9a-fA-F:]+)\](?::\d+)?$/);
  if (bracketMatch) {
    pureAddress = bracketMatch[1];
  }
  else {
    const ipv4Match = ipString.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(?::\d+)?$/);
    if (ipv4Match) {
      pureAddress = ipv4Match[1];
    }
    else {
      pureAddress = ipString;
    }
  }

  if (pureAddress.includes('.') && !pureAddress.includes(':')) {
    const parts = pureAddress.split('.');
    if (parts.length === 4) {
      parts[2] = '*'.repeat(parts[2].length);
      parts[3] = '*'.repeat(parts[3].length);
      return parts.join('.');
    }
    return pureAddress; // 回退
  }

  if (pureAddress.includes(':')) {
    const groups = expandIPv6(pureAddress);
    groups[2] = '*'.repeat(groups[2].length);
    groups[3] = '*'.repeat(groups[3].length);
    groups[6] = '*'.repeat(groups[6].length);
    groups[7] = '*'.repeat(groups[7].length);
    const finalGroups = groups.map(group => {
      if (group.includes('*')) return group;
      const num = parseInt(group, 16);
      return Number.isNaN(num) ? group : num.toString(16);
    });

    return finalGroups.join(':');
  }

  return ipString;
}

function expandIPv6(addr) {
  if (addr === '::') {
    return new Array(8).fill('0');
  }

  const parts = addr.split(':');
  let groups = new Array(8).fill(null);
  let emptyIndex = -1;
  for (let i = 0; i < parts.length; i++) {
    if (parts[i] === '') {
      emptyIndex = i;
      break;
    }
  }

  if (emptyIndex === -1) {
    return parts.map(p => p || '0');
  }

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
export function generateRandomBytes(length) {
  const buffer = new Uint8Array(length);
  crypto.getRandomValues(buffer);
  return buffer;
}
export function generateToken() {
  const bytes = generateRandomBytes(32);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
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
// 在文件末尾追加
export const corsHeaders_GPO = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
export async function proxyStaticFile(url) {
  try {
    const response = await fetch(url, { method: "GET" });

    if (response.status === 304) return response;

    // 对 4xx 返回明确状态码，而不是抛给 catch
    if (response.status === 404) {
      return new Response(`Web Server Down`, { status: 404, headers: { 'Content-Type': 'text/plain' } });
    }
    if (response.status >= 400 && response.status < 500) {
      return new Response(`Web Server Down ${response.status}`, { status: response.status, headers: { 'Content-Type': 'text/plain' } });
    }
    if (!response.ok) throw new Error(`Web Server Down ${response.status}`);

    // 成功响应（2xx）：透传所有头，并添加缓存头（若无）
    const headers = new Headers(response.headers);
    if (!headers.has('Cache-Control')) {
      headers.set('Cache-Control', 'public, max-age=86400');
    }
    // 确保 Content-Type 有合理默认值
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'image/x-icon');
    }
    return new Response(response.body, { headers });
  } catch {
    // 网络错误或 5xx：返回 503，并告知不可缓存
    return new Response('`Web server is down', {
      status: 503,
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  }
}

export const mobileRegex = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|windows phone|phone|webos|kindle|tablet/i;