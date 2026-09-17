// src/shared/memorial.js

/**
 * 纪念日列表：
 *   'MM-DD'      → 每年这一天
 *   'YYYY-MM-DD' → 仅指定年份的这一天
 *
 * 文本会在命中时由 getMemorialText() 返回。
 */
export const MEMORIAL_DAYS = [
  ["05-12", "山河同悲，举国致哀"], // 汶川地震
  ["07-07", "勿忘国耻，警钟长鸣"], // 七七事变
  ["09-18", "勿忘国耻，警钟长鸣"], // 九一八事变
  ["09-30", "缅怀先烈，致敬英雄"], // 烈士纪念日
  ["12-12", "铭记历史，珍爱和平"], // 西安事变
  ["12-13", "铭记历史，吾辈自强"], // 南京大屠杀死难者国家公祭日
];

/** 精确查找表：YYYY-MM-DD → 文本 */
const EXACT_MAP = new Map();
/** 年度查找表：MM-DD → 文本 */
const ANNUAL_MAP = new Map();

for (const [day, text] of MEMORIAL_DAYS) {
  (day.length === 10 ? EXACT_MAP : ANNUAL_MAP).set(day, text);
}

const pad2 = (n) => String(n).padStart(2, "0");

/**
 * 指定日期（默认今天）对应的纪念日文本。
 * 不是纪念日返回 null。
 * 优先匹配 YYYY-MM-DD（更具体），再匹配 MM-DD。
 */
export function getMemorialText(date = new Date()) {
  const md = `${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
  return (
    EXACT_MAP.get(`${date.getFullYear()}-${md}`) ?? ANNUAL_MAP.get(md) ?? null
  );
}

/** 指定日期（默认今天）是否为纪念日 */
export function isMemorialDay(date = new Date()) {
  return getMemorialText(date) !== null;
}

/* ------------------------------------------------------------------ */
/* 订阅                                                                */
/* ------------------------------------------------------------------ */

const listeners = new Set();

/** 订阅纪念日文本变化；返回取消订阅函数。订阅时会立即回调一次。 */
export function watchMemorial(cb) {
  listeners.add(cb);
  cb(getMemorialText());
  return () => listeners.delete(cb);
}

function notify() {
  const text = getMemorialText();
  for (const cb of listeners) cb(text);
}

/* ------------------------------------------------------------------ */
/* 灰度样式                                                            */
/* ------------------------------------------------------------------ */

/** ?nogray=1 / 空值 关闭；?nogray=0 / false 不关闭 */
function isGrayDisabled() {
  if (typeof window === "undefined") return true;
  const v = new URLSearchParams(window.location.search).get("nogray");
  return v !== null && v !== "0" && v !== "false";
}

/** 应用灰度（幂等） */
export function applyMemorialStyle() {
  if (typeof document === "undefined") return;
  if (isGrayDisabled()) return;
  document.documentElement.classList.toggle("memorial-gray", isMemorialDay());
}

/* ------------------------------------------------------------------ */
/* 跨天监听：rAF 驱动 + visibilitychange 互补                          */
/* ------------------------------------------------------------------ */

const CHECK_INTERVAL = 1000; // ms，rAF 里的检查间隔

let lastDayKey = null;
let lastCheck = 0;
let raf = 0;

/** 今天的日期 key，形如 '2026-09-19' */
function todayKey(d = new Date()) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/**
 * 只在「日期 key 变化」时重算并通知。
 * 幂等：同一天内反复调用无副作用。
 */
function check() {
  const key = todayKey();
  if (key === lastDayKey) return;
  lastDayKey = key;
  applyMemorialStyle();
  notify();
}

function tick(now) {
  if (now - lastCheck >= CHECK_INTERVAL) {
    lastCheck = now;
    check();
  }
  raf = requestAnimationFrame(tick);
}

function onVisibility() {
  if (document.visibilityState === "visible") {
    // 切回前台时 rAF 尚未恢复，不等下一帧，立即补检一次
    lastCheck = 0;
    check();
  }
}

/** 启动：立即应用一次，之后由 rAF 轮询 + 可见度事件驱动 */
export function startMemorialWatcher() {
  stopMemorialWatcher();

  lastDayKey = null;
  lastCheck = 0;

  check(); // 立即算一次，不依赖 rAF 首帧
  raf = requestAnimationFrame(tick);
  document.addEventListener("visibilitychange", onVisibility);
}

export function stopMemorialWatcher() {
  if (raf) {
    cancelAnimationFrame(raf);
    raf = 0;
  }
  lastDayKey = null;
  lastCheck = 0;
  document.removeEventListener("visibilitychange", onVisibility);
}
