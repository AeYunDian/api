import { state } from "./state.js";
import { dom, pages } from "./dom.js";

let heightFrame = 0;

export function scheduleHeight() {
    if (heightFrame) cancelAnimationFrame(heightFrame);
    heightFrame = requestAnimationFrame(() => {
        heightFrame = 0;
        setStageHeight();
    });
}

export function setStageHeight(pageName = state.page) {
    if (!dom.stage) return;
    const page = pages[pageName] || pages[state.page];
    const height = Math.max(220, page ? page.scrollHeight : 220);
    dom.stage.style.blockSize = `${height}px`;
}

export function updateChrome(page) {
    dom.card.setAttribute("data-page", page);
    const tabPage = page === "register" ? "register" : "login";
    dom.tabs.setAttribute("data-active", tabPage);
    dom.tabLogin.setAttribute("aria-selected", String(tabPage === "login"));
    dom.tabRegister.setAttribute(
        "aria-selected",
        String(tabPage === "register"),
    );
    pages.login.setAttribute("aria-hidden", String(page !== "login"));
    pages.register.setAttribute("aria-hidden", String(page !== "register"));
    pages.email.setAttribute("aria-hidden", String(page !== "email"));
    pages.reverse.setAttribute("aria-hidden", String(page !== "reverse"));
    pages.oauth.setAttribute("aria-hidden", String(page !== "oauth"));
    pages.oauthWarning.setAttribute(
        "aria-hidden",
        String(page !== "oauthWarning"),
    );
}

export function shouldAutoFocus() {
    if (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) {
        return false;
    }
    return window.innerWidth > 720;
}

export function navigate(next, direction) {
    if (!pages[next] || next === state.page || state.animating) return;
    if (
        state.lockedPage &&
        next !== state.lockedPage &&
        next !== "oauth" &&
        next !== "oauthWarning" &&
        !(
            state.lockedPage === "register" &&
            (next === "email" || next === "reverse")
        )
    ) {
        return;
    }
    if (
        !shouldAutoFocus() &&
        document.activeElement &&
        typeof document.activeElement.blur === "function"
    ) {
        document.activeElement.blur();
    }
    const dir = ["next", "back", "up", "down"].includes(direction)
        ? direction
        : "next";
    const out = pages[state.page];
    const incoming = pages[next];
    state.animating = true;
    state.page = next;
    updateChrome(next);
    setStageHeight(next);
    out.classList.remove("is-active");
    out.classList.add("is-leaving", `is-leaving--${dir}`);
    incoming.classList.add("is-entering", `is-entering--${dir}`);

    let finished = false;
    const finish = () => {
        if (finished) return;
        finished = true;
        out.classList.remove("is-leaving", `is-leaving--${dir}`);
        incoming.classList.remove("is-entering", `is-entering--${dir}`);
        incoming.classList.add("is-active");
        state.page = next;
        state.animating = false;
        scheduleHeight();
        if (next !== "oauth" && next !== "oauthWarning" && shouldAutoFocus()) {
            let first = null;
            if (next === "login") first = dom.loginAccount;
            else if (next === "register") first = dom.regUsername;
            else if (next === "email") first = dom.emailVerifyCode;
            if (first && !first.disabled) first.focus({ preventScroll: true });
        }
    };

    incoming.addEventListener("animationend", finish, { once: true });
    setTimeout(finish, 430);
}

export function playEntryAnimation(direction) {
    if (!["next", "back", "up", "down"].includes(direction)) return;
    const page = pages[state.page];
    if (!page) return;
    page.classList.remove("is-active");
    page.classList.add("is-entering", `is-entering--${direction}`);
    void page.offsetWidth;
    let finished = false;
    const finish = () => {
        if (finished) return;
        finished = true;
        page.classList.remove("is-entering", `is-entering--${direction}`);
        page.classList.add("is-active");
    };
    page.addEventListener("animationend", finish, { once: true });
    setTimeout(finish, 520);
}

export function setPageImmediate(page) {
    if (!pages[page]) return;
    Object.keys(pages).forEach((key) => {
        pages[key].classList.toggle("is-active", key === page);
        pages[key].setAttribute("aria-hidden", String(key !== page));
    });
    state.page = page;
    updateChrome(page);
    scheduleHeight();
}
