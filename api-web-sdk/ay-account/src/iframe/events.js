import { state } from "./state.js";
import { dom } from "./dom.js";
import { t } from "./i18n.js";
import { navigate } from "./navigation.js";
import {
    validateLoginAgreement,
    validateRegisterAgreement,
    validateInput,
} from "./validation.js";
import { syncFieldLabels } from "./busy.js";
import {
    submitLogin,
    submitRegister,
    submitEmailVerification,
    sendEmailCode,
    backToRegisterFromVerify,
    copyText,
    postToParent,
    startOauth,
    handleProviderClick,
} from "./auth.js";
import { $, $$ } from "./utils.js";

export function toggleAgreement(container) {
    if (!container || state.busy) return;
    const box = $(".agreement__box", container);
    if (!box) return;
    box.classList.toggle("is-checked");
    container.setAttribute(
        "aria-checked",
        String(box.classList.contains("is-checked")),
    );
    container.dataset.touched = "1";
    if (container === dom.loginAgreement) validateLoginAgreement(false);
    if (container === dom.registerAgreement) validateRegisterAgreement(false);
}

export function bindAgreement(container) {
    if (!container) return;
    container.addEventListener("click", (event) => {
        if (event.target.closest("a")) return;
        toggleAgreement(container);
    });
    container.addEventListener("keydown", (event) => {
        if (event.key === " " || event.key === "Enter") {
            event.preventDefault();
            toggleAgreement(container);
        }
    });
}
export function spawnRipple(target, clientX, clientY) {
    if (!target || target.disabled) return;
    const rect = target.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const size = Math.max(rect.width, rect.height) * 2;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const ripple = document.createElement("span");
    ripple.className = "md-ripple";
    ripple.style.setProperty("--md-ripple-size", `${size}px`);
    ripple.style.insetInlineStart = `${x}px`;
    ripple.style.insetBlockStart = `${y}px`;
    target.appendChild(ripple);
    const remove = () => ripple.remove();
    ripple.addEventListener("animationend", remove, { once: true });
    setTimeout(remove, 900);
}

export function installRipple() {
    const selector =
        ".btn, .code-btn, .oauth-expand, .provider, .tab, .ay-close";
    dom.card.addEventListener("pointerdown", (event) => {
        const target = event.target.closest(selector);
        if (!target) return;
        spawnRipple(target, event.clientX, event.clientY);
    });
    dom.card.addEventListener("click", (event) => {
        if (event.detail !== 0) return;
        const target = event.target.closest(selector);
        if (!target) return;
        const rect = target.getBoundingClientRect();
        spawnRipple(
            target,
            rect.left + rect.width / 2,
            rect.top + rect.height / 2,
        );
    });
}

export function bindEvents() {
    dom.loginForm.addEventListener("submit", (event) => {
        event.preventDefault();
        submitLogin();
    });
    dom.registerForm.addEventListener("submit", (event) => {
        event.preventDefault();
        submitRegister();
    });

    dom.tabLogin.addEventListener("click", () => {
        if (state.busy) return;
        navigate("login", "back");
    });
    dom.tabRegister.addEventListener("click", () => {
        if (state.busy) return;
        navigate("register", "next");
    });

    $("#toLogin").addEventListener("click", () => {
        if (state.busy) return;
        navigate("login", "back");
    });

    dom.oauthExpand.addEventListener("click", () => {
        if (state.busy) return;
        navigate("oauth", "up");
    });
    dom.oauthBack.addEventListener("click", () => {
        if (state.busy) return;
        navigate(state.lockedPage || "login", "down");
    });
    $$(".provider", dom.oauthPage).forEach((button) => {
        button.addEventListener("click", () =>
            handleProviderClick(button.dataset.provider),
        );
    });

    dom.oauthWarningNo.addEventListener("click", () => {
        if (state.busy) return;
        navigate("oauth", "back");
    });
    dom.oauthWarningYes.addEventListener("click", () => {
        const provider = state.oauthWarningProvider;
        if (!provider || state.busy) return;
        navigate("oauth", "back");
        setTimeout(() => startOauth(provider), 460);
    });

    if (dom.sendCodeBtn) {
        dom.sendCodeBtn.addEventListener("click", sendEmailCode);
    }

    dom.emailVerifyForm.addEventListener("submit", (event) => {
        event.preventDefault();
        submitEmailVerification();
    });
    dom.emailVerifyBack.addEventListener("click", backToRegisterFromVerify);
    dom.reverseBack.addEventListener("click", backToRegisterFromVerify);
    dom.reverseCopyAddress.addEventListener("click", () => {
        copyText(dom.reverseAddress.textContent);
    });
    dom.reverseCopyCode.addEventListener("click", () => {
        copyText(dom.reverseCode.textContent);
    });

    $$(".field__input", dom.card).forEach((input) => {
        input.addEventListener("input", () => {
            syncFieldLabels();
            validateInput(input, false);
        });
        input.addEventListener("change", () => {
            syncFieldLabels();
            validateInput(input, false);
        });
        input.addEventListener("blur", () => {
            input.dataset.touched = "1";
            syncFieldLabels();
            validateInput(input, false);
        });
    });

    bindAgreement(dom.loginAgreement);
    bindAgreement(dom.registerAgreement);

    dom.closeBtn.addEventListener("click", () => {
        if (state.busy) return;
        if (window.parent === window) {
            if (typeof window.close === "function") window.close();
        } else {
            postToParent({ action: "closeWindow" });
        }
    });

    dom.faqLink.addEventListener("click", () => {
        const width = window.screen.width * 0.5;
        const height = window.screen.height * 0.7;
        const left = (window.screen.width - width) / 2;
        const top = (window.screen.height - height - 35) / 2;
        const features = [
            `width=${width}`,
            `height=${height}`,
            `left=${left}`,
            `top=${top}`,
            "resizable=yes",
            "scrollbars=yes",
            "status=no",
            "menubar=no",
            "toolbar=no",
        ].join(",");
        window.open(t("link.faq"), "_blank", features);
    });

    window.addEventListener("keydown", (event) => {
        if (event.key !== "Escape" || state.busy) return;
        if (window.parent !== window) postToParent({ action: "closeWindow" });
    });
}
