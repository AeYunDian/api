import { state } from "./state.js";
import { zhCN as DEFAULT_I18N } from "../shared/i18n/zh-cn.js";
import { scheduleHeight } from "./navigation.js";
import { syncCodeButton } from "./busy.js";
import { $$ } from "./utils.js";

export function hasT(key) {
    return (
        Object.prototype.hasOwnProperty.call(state.translations, key) ||
        Object.prototype.hasOwnProperty.call(DEFAULT_I18N, key)
    );
}

export function t(key) {
    if (Object.prototype.hasOwnProperty.call(state.translations, key)) {
        return state.translations[key];
    }
    if (Object.prototype.hasOwnProperty.call(DEFAULT_I18N, key)) {
        return DEFAULT_I18N[key];
    }
    return key;
}

export function translatePage() {
    $$("[data-i18n]", document).forEach((el) => {
        const key = el.getAttribute("data-i18n");
        if (key && hasT(key)) el.innerHTML = t(key);
    });
    $$("[data-i18n-placeholder]", document).forEach((el) => {
        const key = el.getAttribute("data-i18n-placeholder");
        if (key && hasT(key)) el.setAttribute("placeholder", t(key));
    });
    $$("[data-i18n-aria]", document).forEach((el) => {
        const key = el.getAttribute("data-i18n-aria");
        if (key && hasT(key)) el.setAttribute("aria-label", t(key));
    });
    $$("[data-i18n-href]", document).forEach((el) => {
        const key = el.getAttribute("data-i18n-href");
        if (key && hasT(key)) el.setAttribute("href", t(key));
    });
    $$(".field__error[data-i18n-key]", document).forEach((el) => {
        const key = el.getAttribute("data-i18n-key");
        if (key && hasT(key)) el.textContent = t(key);
    });
    syncCodeButton();
    scheduleHeight();
}
