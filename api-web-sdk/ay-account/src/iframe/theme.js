import { state } from "./state.js";
import { $ } from "./utils.js";
import { normalizeTheme } from "../shared/utils/theme.js";
export { normalizeTheme };

export function applyTheme(theme) {
    const value = normalizeTheme(theme);
    state.config.theme = value;
    document.documentElement.setAttribute("data-theme", value);
}

export function applyMode(inline) {
    state.config.inline = Boolean(inline);
    document.documentElement.setAttribute(
        "data-mode",
        state.config.inline ? "inline" : "full",
    );
}

export function applyCustomStyle(css) {
    if (typeof css !== "string" || !css.trim()) return;
    let style = $("#ay-account-custom-style", document);
    if (!style) {
        style = document.createElement("style");
        style.id = "ay-account-custom-style";
        document.head.appendChild(style);
    }
    style.textContent = css;
}

export function applyFill(fill) {
    state.config.fill = Boolean(fill);
    document.documentElement.setAttribute(
        "data-fill",
        state.config.fill ? "true" : "false",
    );
}
