import { state } from "./state.js";
import { dom } from "./dom.js";
import { translatePage } from "./i18n.js";
import { toast } from "./toast.js";
import {
    setPageImmediate,
    scheduleHeight,
    navigate,
    playEntryAnimation,
} from "./navigation.js";
import { applyProviderVisibility } from "./auth.js";
import { applyTheme, applyMode, applyFill, applyCustomStyle } from "./theme.js";
import {
    handleAuthSuccess,
    handleAuthFailure,
    handleCodeSent,
    handleCodeFailure,
    resolveParent,
} from "./auth.js";
import { stopEmailCountdown, clearCodeTimer } from "./busy.js";
import { stopReverseCountdown, stopReversePolling } from "./auth.js";

export function applyConfig(config) {
    if (!config || typeof config !== "object") return;
    if (config.appId) state.config.appId = config.appId;
    if (config.sdkVersion) state.config.sdkVersion = config.sdkVersion;
    if (config.apiBase) state.config.apiBase = config.apiBase;
    if (config.lang) {
        state.config.lang = config.lang;
        document.documentElement.setAttribute("lang", config.lang);
    }
    if (typeof config.autoClose === "boolean") {
        state.config.autoClose = config.autoClose;
    }
    if (typeof config.inline === "boolean") applyMode(config.inline);
    if (config.theme) applyTheme(config.theme);
    if (typeof config.fill === "boolean") applyFill(config.fill);
    if (config.enterAnimation) {
        state.config.enterAnimation = config.enterAnimation;
    }
    if (config.translations && typeof config.translations === "object") {
        state.translations = { ...state.translations, ...config.translations };
    }
    if (typeof config.hideClose === "boolean") {
        state.config.hideClose = config.hideClose;
        dom.closeBtn.hidden = config.hideClose;
        dom.closeBtn.style.display = config.hideClose ? "none" : "";
    }
    if (typeof config.hideFaq === "boolean") {
        state.config.hideFaq = config.hideFaq;
        if (dom.footer) {
            dom.footer.hidden = config.hideFaq;
            dom.footer.style.display = config.hideFaq ? "none" : "";
        }
    }
    if (typeof config.hideSwitch === "boolean") {
        state.config.hideSwitch = config.hideSwitch;
        if (dom.toLogin) {
            const hidden = config.hideSwitch || Boolean(state.lockedPage);
            dom.toLogin.hidden = hidden;
            dom.toLogin.style.display = hidden ? "none" : "";
        }
    }
    if (typeof config.hideOauthClient === "boolean") {
        state.config.hideOauthClient = config.hideOauthClient;
        dom.oauthExpand.hidden = config.hideOauthClient;
        applyProviderVisibility();
        if (
            config.hideOauthClient &&
            (state.page === "oauth" || state.page === "oauthWarning")
        ) {
            navigate(state.lockedPage || "login", "down");
        }
    }
    if (config.only === "login" || config.only === "register") {
        state.lockedPage = config.only;
        dom.card.setAttribute("data-only", config.only);
        dom.tabs.hidden = true;
        dom.tabs.style.display = "none";
        if (dom.toLogin) {
            dom.toLogin.hidden = true;
            dom.toLogin.style.display = "none";
        }
        setPageImmediate(config.only);
    } else if (config.only !== undefined) {
        state.lockedPage = null;
        dom.card.removeAttribute("data-only");
        dom.tabs.hidden = false;
        dom.tabs.style.display = "";
        if (dom.toLogin) {
            const hidden = state.config.hideSwitch;
            dom.toLogin.hidden = hidden;
            dom.toLogin.style.display = hidden ? "none" : "";
        }
    }
    if (config.customStyle) applyCustomStyle(config.customStyle);
    state.configReady = true;
    translatePage();
    reveal();
    scheduleHeight();
    if (!state.entryPlayed) {
        state.entryPlayed = true;
        requestAnimationFrame(() =>
            playEntryAnimation(state.config.enterAnimation),
        );
    }
}

export function reveal() {
    dom.app.classList.add("is-ready");
    scheduleHeight();
}

export function onMessage(event) {
    if (event.source !== window.parent) return;
    let data = event.data;
    if (typeof data === "string" && data.startsWith("{")) {
        try {
            data = JSON.parse(data);
        } catch {
            return;
        }
    }
    if (!data || typeof data !== "object" || !data.action) return;

    switch (data.action) {
        case "configWindow":
            applyConfig(data.config);
            break;
        case "updateTranslations":
            if (data.payload && typeof data.payload === "object") {
                state.translations = { ...state.translations, ...data.payload };
                translatePage();
            }
            break;
        case "changeLanguage":
            translatePage();
            break;
        case "beforeClose":
            dom.app.classList.remove("is-ready");
            toast.hide();
            clearCodeTimer();
            stopEmailCountdown();
            stopReversePolling();
            stopReverseCountdown();
            break;
        case "registerStartSuccess":
            resolveParent(data.messageId, true, data.data);
            break;
        case "registerStartFailure":
            resolveParent(data.messageId, false, null, data);
            break;
        case "registerQuerySuccess":
            resolveParent(data.messageId, true, data.data);
            break;
        case "registerQueryFailure":
            resolveParent(data.messageId, false, null, data);
            break;
        case "registerCompleteSuccess":
            resolveParent(data.messageId, true, data.data);
            break;
        case "registerCompleteFailure":
            resolveParent(data.messageId, false, null, data);
            break;
        case "loginSuccess":
            handleAuthSuccess("login", data.user || data.result || data);
            break;
        case "registerSuccess":
            handleAuthSuccess("register", data.user || data.result || data);
            break;
        case "loginFailure":
        case "registerFailure":
            handleAuthFailure({
                message: data.message,
                error_code: data.code,
            });
            break;
        case "sendEmailCodeSuccess":
            handleCodeSent({ token: data.token });
            break;
        case "sendEmailCodeFailure":
            handleCodeFailure({
                message: data.message,
                error_code: data.code,
            });
            break;
        default:
            break;
    }
}
