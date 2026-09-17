/**
 * 设备 / 平台 / 浏览器 / 宿主环境 检测工具
 *
 * 设计要点：
 * - 基于 navigator.userAgent、window.matchMedia、window.hostshell 等做能力嗅探，
 *   所有导出均为纯函数式访问，无副作用。
 * - SSR 或异常环境下安全返回默认值（false / "unknown"），不会抛错。
 *
 * 检测维度划分：
 *   ┌─ 宿主外壳 ──── isHostShell / initWindow
 *   ├─ 平台 / 系统 ─ isIOS / isAndroid / isHarmony / getOS
 *   ├─ 移动端判定 ─ isMobileByUA / isMobileByWidth / isMobile
 *   ├─ 浏览器 ───── isChrome / isSafari / getBrowser
 *   ├─ App WebView ─ isWeChat / isQQ / isWebView
 *   ├─ 设备能力 ─── isTouchDevice / isRetina / prefersReducedMotion
 *   └─ 视口 / 断点 ─ getViewport / getBreakpoint
 *
 * 移动端判定有两个维度，按场景选用：
 *   - isMobileByUA()    基于 UA / 平台嗅探，判断「设备本身是不是移动设备」。
 *   - isMobileByWidth() 基于视口宽度，判断「当前布局是否按移动端渲染」。
 *   需要综合判断时用 isMobile()。
 *
 * 使用示例：
 *   import {
 *     isIOS,
 *     isMobile,
 *     isMobileByUA,
 *     isHostShell,
 *     initWindow,
 *     getOS,
 *   } from "@/shared/utils/device";
 *
 *   if (isHostShell()) initWindow({ minWidth: 1000, minHeight: 800 });
 *   if (isIOS()) { ... }
 *   if (isMobileByWidth(768)) { ... }
 */

const NAV = typeof navigator !== "undefined" ? navigator : undefined;
const WIN = typeof window !== "undefined" ? window : undefined;

const UA = NAV?.userAgent ?? "";
const UA_LOWER = UA.toLowerCase();
const PLATFORM = NAV?.platform ?? "";
const MAX_TOUCH_POINTS = NAV?.maxTouchPoints ?? 0;
const UA_DATA = NAV?.userAgentData ?? null;

// ============================================================
// 宿主外壳（AyHostShell）
// ============================================================

/**
 * 检测当前环境是否为 AyHostShell
 * @returns {boolean} 如果是 AyHostShell 环境返回 true，否则返回 false
 */
export function isHostShell() {
  return (
    !!WIN &&
    typeof WIN.hostshell === "object" &&
    typeof WIN.chrome === "object" &&
    typeof WIN.chrome.webview === "object"
  );
}

/**
 * 初始化宿主外壳窗口参数（非宿主环境静默跳过）
 *
 * @param {Object}  [config]
 * @param {string}  [config.borderStyle="sizable"]     边框样式
 * @param {string}  [config.windowState="normal"]      窗口状态
 * @param {boolean} [config.enableEdgeResize=true]     是否允许边缘拖拽缩放
 * @param {number}  [config.minWidth=800]              最小宽度
 * @param {number}  [config.minHeight=600]             最小高度
 */
export function initWindow(config = {}) {
  if (!isHostShell()) return;

  WIN.hostshell.borderStyle = config.borderStyle || "sizable";
  WIN.hostshell.windowState = config.windowState || "normal";
  WIN.hostshell.enableEdgeResize = config.enableEdgeResize ?? true;
  WIN.hostshell.minWidth = config.minWidth || 800;
  WIN.hostshell.minHeight = config.minHeight || 600;
}

// ============================================================
// 平台 / 系统
// ============================================================

/** 是否为 iOS（含 iPadOS 13+） */
export function isIOS() {
  if (/iphone|ipad|ipod/.test(UA_LOWER)) return true;
  // iPadOS 13+ 默认以 "MacIntel" 上报，用 maxTouchPoints 区分
  return PLATFORM === "MacIntel" && MAX_TOUCH_POINTS > 1;
}

/** 是否为 Android */
export function isAndroid() {
  return /android/.test(UA_LOWER);
}

/** 是否为鸿蒙 / OpenHarmony */
export function isHarmony() {
  return /harmony|openharmony/.test(UA_LOWER);
}

/**
 * 是否移动设备（基于 UA / 平台嗅探）
 * 关注「设备本身」是什么，与当前视口宽度无关。
 * 例：桌面浏览器把窗口缩到 375px，仍返回 false。
 */
export function isMobileByUA() {
  return isIOS() || isAndroid() || isHarmony();
}

/** 是否桌面设备（基于 UA / 平台嗅探，与 isMobileByUA 互为反面） */
export function isDesktopByUA() {
  return !isMobileByUA();
}

/**
 * 是否移动布局（基于视口宽度）
 * 关注「当前布局」，与设备类型无关。
 * 例：桌面浏览器把窗口缩到 375px，返回 true。
 * @param {number} [threshold=768] 阈值像素
 */
export function isMobileByWidth(threshold = 768) {
  return getViewport().width < threshold;
}

/** 是否桌面布局（基于视口宽度，与 isMobileByWidth 互为反面） */
export function isDesktopByWidth(threshold = 768) {
  return !isMobileByWidth(threshold);
}

/**
 * 是否移动端（综合判断）
 * UA 命中移动设备，或视口宽度小于阈值，任一成立即返回 true。
 * 适合「移动端要禁用 hover / 启用触摸交互」这类需要兼顾两者的场景。
 * @param {number} [threshold=768] 阈值像素
 */
export function isMobile(threshold = 768) {
  return isMobileByUA() || isMobileByWidth(threshold);
}

/** 是否桌面端（与 isMobile 互为反面） */
export function isDesktop(threshold = 768) {
  return !isMobile(threshold);
}

/**
 * 获取操作系统标识
 * @returns {"ios"|"android"|"harmony"|"windows"|"macos"|"linux"|"unknown"}
 */
export function getOS() {
  if (isIOS()) return "ios";
  if (isAndroid()) return "android";
  if (isHarmony()) return "harmony";
  if (/windows/.test(UA_LOWER)) return "windows";
  if (/mac os x|macintosh/.test(UA_LOWER)) return "macos";
  if (/linux/.test(UA_LOWER)) return "linux";
  return "unknown";
}

// ============================================================
// 浏览器
// ============================================================

/** 是否为 Edge（含 Chromium 版，判定优先于 Chrome） */
export function isEdge() {
  return /edg\//.test(UA_LOWER);
}

/** 是否为 Opera */
export function isOpera() {
  return /opr\/|opera/.test(UA_LOWER);
}

/** 是否为 Chrome（含 iOS 上的 CriOS） */
export function isChrome() {
  return /chrome|crios/.test(UA_LOWER) && !isEdge() && !isOpera();
}

/** 是否为 Safari（排除 Chrome / Edge / Opera） */
export function isSafari() {
  return /safari/.test(UA_LOWER) && !isChrome() && !isEdge() && !isOpera();
}

/** 是否为 Firefox（含 iOS 上的 FxiOS） */
export function isFirefox() {
  return /firefox|fxios/.test(UA_LOWER);
}

/**
 * 获取浏览器标识
 * @returns {"edge"|"opera"|"chrome"|"safari"|"firefox"|"unknown"}
 */
export function getBrowser() {
  if (isEdge()) return "edge";
  if (isOpera()) return "opera";
  if (isChrome()) return "chrome";
  if (isSafari()) return "safari";
  if (isFirefox()) return "firefox";
  return "unknown";
}

// ============================================================
// 运行环境（App / WebView）
// ============================================================

/** 是否为微信内置浏览器 */
export function isWeChat() {
  return /micromessenger/.test(UA_LOWER);
}

/** 是否为手机 QQ 内置浏览器 */
export function isQQ() {
  return /\sqq\//.test(UA_LOWER) && !isWeChat();
}

/** 是否为微博内置浏览器 */
export function isWeibo() {
  return /weibo/.test(UA_LOWER);
}

/** 是否为支付宝内置浏览器 */
export function isAlipay() {
  return /alipayclient/.test(UA_LOWER);
}

/** 是否为钉钉内置浏览器 */
export function isDingTalk() {
  return /dingtalk/.test(UA_LOWER);
}

/** 是否处于任意 App 内置 WebView 环境 */
export function isWebView() {
  return isWeChat() || isQQ() || isWeibo() || isAlipay() || isDingTalk();
}

// ============================================================
// 设备能力
// ============================================================

/** 是否为触屏设备 */
export function isTouchDevice() {
  if (!WIN) return false;
  if ("ontouchstart" in WIN) return true;
  if (MAX_TOUCH_POINTS > 0) return true;
  return WIN.matchMedia?.("(pointer: coarse)").matches ?? false;
}

/** 是否为高分屏（devicePixelRatio > 1） */
export function isRetina() {
  return getDevicePixelRatio() > 1;
}

/** 获取设备像素比，SSR 下返回 1 */
export function getDevicePixelRatio() {
  return WIN?.devicePixelRatio ?? 1;
}

/**
 * 是否偏好减少动效（系统级无障碍设置）
 * 命中时建议关闭大动画 / 视差
 */
export function prefersReducedMotion() {
  if (!WIN) return false;
  return WIN.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

/**
 * 是否偏好深色主题（系统级）
 * 仅反映系统偏好，不代表应用当前主题
 */
export function prefersDarkMode() {
  if (!WIN) return false;
  return WIN.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
}

// ============================================================
// 视口 / 断点
// ============================================================

const BREAKPOINTS = {
  xs: 0,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1400,
};

/**
 * 获取当前视口尺寸，SSR 下返回 { width: 0, height: 0 }
 * @returns {{ width: number, height: number }}
 */
export function getViewport() {
  if (!WIN) return { width: 0, height: 0 };
  return { width: WIN.innerWidth, height: WIN.innerHeight };
}

/**
 * 获取当前断点标识（Bootstrap 风格）
 * @returns {"xs"|"sm"|"md"|"lg"|"xl"|"xxl"|"unknown"}
 */
export function getBreakpoint(width) {
  if (typeof window === "undefined" && width == null) return "unknown";
  const w = width ?? window.innerWidth;
  const names = Object.keys(BREAKPOINTS);
  for (let i = names.length - 1; i >= 0; i--) {
    if (w >= BREAKPOINTS[names[i]]) return names[i];
  }
  return "xs";
}

// ============================================================
// 汇总
// ============================================================

/**
 * 汇总当前设备 / 环境信息快照，便于日志 / 埋点
 * @returns {{
 *   ua: string,
 *   os: string,
 *   browser: string,
 *   hostShell: boolean,
 *   mobileByUA: boolean,
 *   mobileByWidth: boolean,
 *   mobile: boolean,
 *   touch: boolean,
 *   retina: boolean,
 *   dpr: number,
 *   viewport: { width: number, height: number },
 *   breakpoint: string,
 *   webview: boolean,
 * }}
 */
export function getDeviceInfo() {
  return {
    ua: UA,
    os: getOS(),
    browser: getBrowser(),
    hostShell: isHostShell(),
    mobileByUA: isMobileByUA(),
    mobileByWidth: isMobileByWidth(),
    mobile: isMobile(),
    touch: isTouchDevice(),
    retina: isRetina(),
    dpr: getDevicePixelRatio(),
    viewport: getViewport(),
    breakpoint: getBreakpoint(),
    webview: isWebView(),
  };
}
