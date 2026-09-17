// src/shared/composables/useDevice.js
import { computed, ref, readonly } from "vue";
import {
  isMobileByUA,
  isMobileByWidth,
  getBreakpoint,
  getOS,
  getBrowser,
  isTouchDevice,
  isWebView,
} from "@/shared/utils/device";

const MOBILE_WIDTH = 768;
const isBrowser = typeof window !== "undefined";
const mqCache = new Map();
// ==================== 模块级共享状态 ====================
const width = ref(isBrowser ? window.innerWidth : 0);
const height = ref(isBrowser ? window.innerHeight : 0);
const dpr = ref(isBrowser ? (window.devicePixelRatio ?? 1) : 1);

// 媒体查询类状态（模块级，只注册一次）
const prefersDark = ref(false);
const prefersReducedMotion = ref(false);
const isLandscapeMQ = ref(false);

if (isBrowser) {
  window.addEventListener(
    "resize",
    () => {
      width.value = window.innerWidth;
      height.value = window.innerHeight;
      dpr.value = window.devicePixelRatio ?? 1;
    },
    { passive: true },
  );

  const bindMQ = (query, target) => {
    const mql = window.matchMedia(query);
    target.value = mql.matches;
    mql.addEventListener("change", (e) => {
      target.value = e.matches;
    });
  };
  bindMQ("(prefers-color-scheme: dark)", prefersDark);
  bindMQ("(prefers-reduced-motion: reduce)", prefersReducedMotion);
  bindMQ("(orientation: landscape)", isLandscapeMQ);
}

// UA 类信息不会变，只算一次
const os = getOS();
const browser = getBrowser();
const mobileByUA = isMobileByUA();
const touch = isTouchDevice();
const webview = isWebView();

/**
 * 响应式设备信息（单例）
 * 全局共享一份状态，多次调用不会重复注册监听。
 */
export function useDevice() {
  const viewport = computed(() => ({
    width: width.value,
    height: height.value,
  }));
  const orientation = computed(() =>
    isLandscapeMQ.value ? "landscape" : "portrait",
  );
  const breakpoint = computed(() => getBreakpoint(width.value));
  const mobileByWidth = computed(() =>
    isMobileByWidth(MOBILE_WIDTH, width.value),
  );
  const isMobile = computed(() => mobileByUA || mobileByWidth.value);
  const isDesktop = computed(() => !isMobile.value);
  const isRetina = computed(() => dpr.value > 1);

  const isSmallerThan = (threshold) => computed(() => width.value < threshold);
  const isLargerThan = (threshold) => computed(() => width.value >= threshold);

  return {
    // 基础
    width,
    height,
    viewport,
    dpr,
    // 方向 / 断点
    orientation,
    breakpoint,
    // 移动端判定
    isMobile,
    isDesktop,
    mobileByUA,
    mobileByWidth,
    // 设备能力
    isRetina,
    touch,
    webview,
    // 平台 / 浏览器
    os,
    browser,
    // 系统偏好
    prefersDark,
    prefersReducedMotion,
    // 快捷构造
    isSmallerThan,
    isLargerThan,
  };
}

/**
 * 响应式媒体查询
 * @param {string} query
 */
export function useMediaQuery(query) {
  if (!isBrowser) return ref(false);
  if (mqCache.has(query)) return mqCache.get(query);
  const matches = ref(false);
  const mql = window.matchMedia(query);
  matches.value = mql.matches;
  mql.addEventListener("change", (e) => {
    matches.value = e.matches;
  });
  mqCache.set(query, matches);
  return matches;
}
