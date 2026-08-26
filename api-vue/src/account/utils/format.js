// src/utils/format.js

/**
 * 格式化时间戳为统一格式：2026/8/26 15:21:46
 * @param {number|string|Date} timestamp - 时间戳（秒或毫秒）或 Date 对象
 * @param {string} fallback - 无效值时返回的占位符，默认 '未知时间'
 * @returns {string} 格式化后的时间字符串
 */
export function formatTime(timestamp, fallback = '未知时间') {
    if (!timestamp && timestamp !== 0) return fallback;

    let date;
    if (timestamp instanceof Date) {
        date = timestamp;
    } else if (typeof timestamp === 'string') {
        // 尝试解析字符串
        const parsed = new Date(timestamp);
        if (!isNaN(parsed.getTime())) {
            date = parsed;
        } else {
            return fallback;
        }
    } else {
        // 数字类型：自动判断秒/毫秒
        const ms = timestamp > 10000000000 ? timestamp : timestamp * 1000;
        date = new Date(ms);
    }

    if (isNaN(date.getTime())) return fallback;

    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * 格式化时间为短日期：2026/8/26
 */
export function formatDate(timestamp, fallback = '未知日期') {
    const formatted = formatTime(timestamp, fallback);
    return formatted !== fallback ? formatted.split(' ')[0] : fallback;
}