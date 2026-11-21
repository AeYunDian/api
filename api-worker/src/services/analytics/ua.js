// services/analytics/ua.js
// User-Agent 解析、屏幕分桶、地区映射。纯函数。

/** 命中即丢弃（机器人 / 监控 / 脚本） */
export const BOT_RE =
  /bot|crawler|spider|slurp|headless|phantom|puppeteer|playwright|lighthouse|pingdom|uptime|monitor|scanner|curl\/|wget\/|python-requests|go-http-client|axios\/|node-fetch|okhttp|java\/|libwww|facebookexternalhit|embedly|quora link preview|preview|fetcher|archiver|validator|feedburner|semrush|ahrefs|mj12|dotbot|petalbot|bytespider|gptbot|ccbot|claudebot|perplexity|amazonbot|applebot/i;

/** Chrome 内核版本号要排除 Edge/Opera/Chrome iOS 的干扰，按顺序判断 */
const BROWSER_RULES = [
  { name: "Edge", re: /\bEdg(?:e|A|iOS)?\/(\d+)/ },
  { name: "Opera", re: /\bOPR\/(\d+)/ },
  { name: "Firefox", re: /\b(?:Firefox|FxiOS)\/(\d+)/ },
  { name: "Chrome", re: /\b(?:Chrome|CriOS|Chromium)\/(\d+)/ },
  { name: "Safari", re: /\bVersion\/(\d+).*Safari\// },
  { name: "Safari", re: /\bSafari\/(\d+)/ },
];

function majorVersion(ua, re) {
  const m = ua.match(re);
  return m ? String(m[1]) : "";
}

export function parseUa(ua) {
  if (!ua || BOT_RE.test(ua)) return null;

  let browser = "Other";
  let browserVersion = "";
  for (const rule of BROWSER_RULES) {
    const m = ua.match(rule.re);
    if (m) {
      browser = rule.name;
      browserVersion = m[1];
      break;
    }
  }

  let os = "Other";
  let osVersion = "";
  if (/\bWindows NT\b/.test(ua)) {
    os = "Windows";
    osVersion = majorVersion(ua, /Windows NT (\d+)/);
  } else if (/\bAndroid\b/.test(ua)) {
    os = "Android";
    osVersion = majorVersion(ua, /Android (\d+)/);
  } else if (/\b(?:iPhone|iPad|iPod)\b/.test(ua)) {
    os = "iOS";
    osVersion = majorVersion(ua, /OS (\d+)[._]/);
  } else if (/\bMac OS X\b|\bMacintosh\b/.test(ua)) {
    os = "macOS";
    osVersion = majorVersion(ua, /Mac OS X (\d+)[._]/);
  } else if (/\bLinux\b|\bX11\b/.test(ua)) {
    os = "Linux";
  }

  let device = "Desktop";
  if (/\biPad\b|\bTablet\b|\bPlayBook\b|\bAndroid(?!.*Mobile)\b/.test(ua)) {
    device = "Tablet";
  } else if (/\bMobi\b|\bMobile\b|\biPhone\b|\biPod\b|\bAndroid\b/.test(ua)) {
    device = "Mobile";
  }

  return { browser, browserVersion, os, osVersion, device };
}

export function screenBucket(raw) {
  const w = typeof raw === "number" ? raw : parseInt(String(raw || ""), 10);
  if (!isFinite(w) || w <= 0) return "";
  if (w >= 1440) return "≥1440";
  if (w >= 1024) return "1024-1439";
  if (w >= 768) return "768-1023";
  return "<768";
}

/** 只接受 0 / 1 / 2 / 5 / 10，其余归 0 */
export function touchPointsBucket(raw) {
  const n = parseInt(String(raw == null ? "" : raw), 10);
  return [1, 2, 5, 10].includes(n) ? n : 0;
}

const CN_PROVINCE_CODES = new Set([
  "BJ", "TJ", "HE", "SX", "NM", "LN", "JL", "HL", "SH", "JS", "ZJ", "AH",
  "FJ", "JX", "SD", "HA", "HB", "HN", "GD", "GX", "HI", "CQ", "SC", "GZ",
  "YN", "XZ", "SN", "GS", "QH", "NX", "XJ", "TW", "HK", "MO",
]);

const CN_PROVINCE_BY_NAME = {
  beijing: "BJ",
  tianjin: "TJ",
  hebei: "HE",
  shanxi: "SX",
  "inner mongolia": "NM",
  "nei mongol": "NM",
  liaoning: "LN",
  jilin: "JL",
  heilongjiang: "HL",
  shanghai: "SH",
  jiangsu: "JS",
  zhejiang: "ZJ",
  anhui: "AH",
  fujian: "FJ",
  jiangxi: "JX",
  shandong: "SD",
  henan: "HA",
  hubei: "HB",
  hunan: "HN",
  guangdong: "GD",
  guangxi: "GX",
  hainan: "HI",
  chongqing: "CQ",
  sichuan: "SC",
  guizhou: "GZ",
  yunnan: "YN",
  tibet: "XZ",
  xizang: "XZ",
  shaanxi: "SN",
  gansu: "GS",
  qinghai: "QH",
  ningxia: "NX",
  xinjiang: "XJ",
  taiwan: "TW",
  "hong kong": "HK",
  macao: "MO",
  macau: "MO",
};

/**
 * Cloudflare 的 region / regionCode → 中国两位省码。
 * 只对 country === "CN" 调用；映射不到返回空串。
 */
export function regionToProvince(region, regionCode) {
  const code = String(regionCode || "")
    .toUpperCase()
    .replace(/^CN-/, "")
    .trim();
  if (CN_PROVINCE_CODES.has(code)) return code;
  const name = String(region || "")
    .trim()
    .toLowerCase();
  if (CN_PROVINCE_CODES.has(name.toUpperCase())) return name.toUpperCase();
  return CN_PROVINCE_BY_NAME[name] || "";
}
