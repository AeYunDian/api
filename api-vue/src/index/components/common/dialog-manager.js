/* ============================================================
   弹窗管理器
   —— 新增：滚动条宽度补偿，避免锁定时页面横向跳动
   ============================================================ */
import { isMobileByUA } from "@/shared/utils/device";
let zSeed = 10000;
let uidSeed = 0;
const stack = [];

let lockCount = 0;
let savedHtmlOverflow = "";
let savedBodyOverflow = "";
let savedBodyPaddingRight = "";

export function nextZIndex() {
  zSeed += 1;
  return zSeed;
}

export function createDialogId() {
  uidSeed += 1;
  return `gov-dialog-${uidSeed}`;
}

export function pushDialog(id) {
  if (stack.includes(id)) return;
  stack.push(id);
}

export function popDialog(id) {
  const i = stack.indexOf(id);
  if (i > -1) stack.splice(i, 1);
}

export function isTopDialog(id) {
  return stack.length > 0 && stack[stack.length - 1] === id;
}

export function hasDialog() {
  return stack.length > 0;
}

/* ---------- 滚动条宽度 ---------- */
function getScrollbarWidth() {
  return isMobileByUA()
    ? 0
    : window.innerWidth - document.documentElement.clientWidth;
}

/* ---------- 锁定：引用计数 + padding 补偿 ---------- */
export function lockScroll() {
  if (lockCount === 0) {
    const html = document.documentElement;
    const body = document.body;
    const sw = getScrollbarWidth();

    savedHtmlOverflow = html.style.overflow;
    savedBodyOverflow = body.style.overflow;
    savedBodyPaddingRight = body.style.paddingRight;

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";

    if (sw > 0) {
      const currentPR = parseFloat(getComputedStyle(body).paddingRight) || 0;
      body.style.paddingRight = `${currentPR + sw}px`;
    }
  }
  lockCount += 1;
}

/* ---------- 解锁：还原到打开前状态 ---------- */
export function unlockScroll() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    const html = document.documentElement;
    const body = document.body;
    html.style.overflow = savedHtmlOverflow;
    body.style.overflow = savedBodyOverflow;
    body.style.paddingRight = savedBodyPaddingRight;
  }
}
