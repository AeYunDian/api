/* ============================================================
   弹窗管理器：全局 z-index、弹窗栈、body 滚动锁
   —— 支持多弹窗叠加：只有栈顶响应 ESC
   —— 滚动锁使用引用计数，避免嵌套弹窗误解锁
   ============================================================ */

let zSeed = 10000          // 起始值需大于 TopBar 的 9000
let uidSeed = 0
const stack = []           // 弹窗 id 栈，后进先出

let lockCount = 0
let savedOverflow = ''

/** 分配一个自增 z-index */
export function nextZIndex() {
    zSeed += 1
    return zSeed
}

/** 生成唯一弹窗 id */
export function createDialogId() {
    uidSeed += 1
    return `gov-dialog-${uidSeed}`
}

/** 入栈 */
export function pushDialog(id) {
    if (stack.includes(id)) return
    stack.push(id)
}

/** 出栈 */
export function popDialog(id) {
    const i = stack.indexOf(id)
    if (i > -1) stack.splice(i, 1)
}

/** 是否为栈顶弹窗（用于 ESC 判定） */
export function isTopDialog(id) {
    return stack.length > 0 && stack[stack.length - 1] === id
}

/** 当前是否有弹窗打开 */
export function hasDialog() {
    return stack.length > 0
}

/** 锁定 body 滚动（引用计数） */
export function lockScroll() {
    if (lockCount === 0) {
        savedOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
    }
    lockCount += 1
}

/** 解锁 body 滚动（引用计数） */
export function unlockScroll() {
    lockCount = Math.max(0, lockCount - 1)
    if (lockCount === 0) {
        document.body.style.overflow = savedOverflow
    }
}