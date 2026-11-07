import { PRODUCE } from "./produce.js";
import { SCRIPT_URL } from "./urls.js";
import { ONLINE_BASE } from "../shared/config/api.js";
import { MAX_CUSTOM_STYLE_LENGTH } from "./window-defaults.js";

export function isPlainObject(obj) {
    return Object.prototype.toString.call(obj) === "[object Object]";
}

export function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export const ENTER_ANIMATIONS = ["next", "back", "up", "down", "none"];

export function normalizeEnterAnimation(value, isMobile) {
    let direction = value;
    if (direction && typeof direction === "object") {
        direction = isMobile ? direction.mobile : direction.desktop;
    }
    if (!direction) return "next";
    return ENTER_ANIMATIONS.includes(direction) ? direction : "next";
}

export function normalizeCustomStyle(style) {
    if (!style) return "";
    let css = "";
    if (typeof style === "string") {
        css = style;
    } else if (typeof style === "object") {
        const toKebab = (name) =>
            name.startsWith("--")
                ? name
                : name.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
        for (const [selector, rules] of Object.entries(style)) {
            if (!selector || rules == null) continue;
            if (selector.startsWith("--")) {
                css += `:root{${selector}:${String(rules)};}`;
                continue;
            }
            if (typeof rules === "string") {
                css += `${selector}{${rules}}`;
                continue;
            }
            if (typeof rules !== "object") continue;
            let body = "";
            for (const [prop, value] of Object.entries(rules)) {
                if (value == null) continue;
                body += `${toKebab(prop)}:${String(value)};`;
            }
            if (body) css += `${selector}{${body}}`;
        }
    }
    return css
        .replace(/@import[\s\S]*?;/gi, "")
        .replace(/expression\s*\(/gi, "(")
        .replace(/javascript\s*:/gi, "")
        .slice(0, MAX_CUSTOM_STYLE_LENGTH);
}

export function assetUrl(path) {
    return PRODUCE
        ? `${ONLINE_BASE}/lib/ay-account/${path}`
        : new URL(path, SCRIPT_URL).href;
}

export { utf8ToBase64 } from "../shared/utils/base64.js";
export { loadScript } from "../shared/utils/script.js";
export { getGeetestLang } from "../shared/utils/geetest-lang.js";
export { removeUselessTestLogo } from "../shared/utils/geetest-logo.js";
export { normalizeTheme } from "../shared/utils/theme.js";
