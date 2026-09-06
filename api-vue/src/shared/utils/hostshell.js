// src/shared/utils/hostshell.js
/**
 * 检测当前环境是否为 AyHostShell
 * @returns {boolean} 如果是 AyHostShell 环境返回 true，否则返回 false
 */
export function isHostShell() {
    return typeof window !== 'undefined' && window.hostshell && typeof window.hostshell === 'object' && typeof window.chrome === 'object' && typeof window.chrome.webview === 'object';
}
export function initWindow(config = {}) {
    if (!isHostShell()) return;
    window.hostshell.borderStyle = config.borderStyle || 'sizable';
    window.hostshell.windowState = config.windowState || 'normal';
    window.hostshell.enableEdgeResize = config.enableEdgeResize ?? true;
    window.hostshell.minWidth = config.minWidth || 800;
    window.hostshell.minHeight = config.minHeight || 600;
}