import { state } from "./state.js";
import { dom, pages } from "./dom.js";
import { translatePage } from "./i18n.js";
import {
    updateChrome,
    scheduleHeight,
    setPageImmediate,
} from "./navigation.js";
import { applyMode, applyTheme, applyFill } from "./theme.js";
import { syncFieldLabels, stopEmailCountdown } from "./busy.js";
import { bindEvents, installRipple } from "./events.js";
import { onMessage, reveal } from "./messages.js";
import {
    applyProviderVisibility,
    postToParent,
    stopReverseCountdown,
    stopReversePolling,
} from "./auth.js";

export function readQuery() {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get("mode");
    const theme = params.get("theme");
    const lang = params.get("lang");
    const tab = params.get("tab");
    const only = params.get("only");
    const fill = params.get("fill");
    const enter = params.get("enter");
    if (lang) state.config.lang = lang;
    applyMode(mode === "inline");
    applyTheme(theme || "auto");
    applyFill(fill === null ? mode === "inline" : fill === "1");
    if (enter) state.config.enterAnimation = enter;
    if (only === "login" || only === "register") {
        state.openedMode = only;
        state.lockedPage = only;
        dom.card.setAttribute("data-only", only);
        dom.tabs.hidden = true;
        dom.tabs.style.display = "none";
        if (dom.toLogin) dom.toLogin.style.display = "none";
        setPageImmediate(only);
    } else if (tab === "register") {
        state.openedMode = "register";
        pages.login.classList.remove("is-active");
        pages.register.classList.add("is-active");
        state.page = "register";
        updateChrome("register");
    } else {
        state.openedMode = "login";
        updateChrome("login");
    }
}

export function init() {
    readQuery();
    bindEvents();
    installRipple();
    window.addEventListener("message", onMessage);
    translatePage();
    updateChrome(state.page);
    applyProviderVisibility();
    syncFieldLabels();
    postToParent({ action: "isReady" });
    scheduleHeight();
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(scheduleHeight).catch(() => {});
    }
    if (window.ResizeObserver) {
        const observer = new ResizeObserver(scheduleHeight);
        Object.keys(pages).forEach((key) => observer.observe(pages[key]));
    }
    window.addEventListener("resize", scheduleHeight);
    window.addEventListener("pagehide", () => {
        stopEmailCountdown();
        stopReversePolling();
        stopReverseCountdown();
    });
    window.addEventListener("load", syncFieldLabels);
    setTimeout(syncFieldLabels, 400);
    setTimeout(syncFieldLabels, 1200);
    // If we are opened directly (not inside the SDK), still show the UI.
    setTimeout(() => {
        if (!state.configReady) reveal();
    }, 600);
}
