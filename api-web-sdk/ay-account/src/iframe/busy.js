import { state } from "./state.js";
import { dom } from "./dom.js";
import { t } from "./i18n.js";
import { $$ } from "./utils.js";

export function syncCodeButton() {
    if (!dom.sendCodeBtn) return;
    const disabled = state.busy || state.codeSending || state.emailCodeLeft > 0;
    dom.sendCodeBtn.disabled = disabled;
    if (state.emailCodeLeft > 0) {
        dom.sendCodeBtn.textContent = `${state.emailCodeLeft}s`;
    } else {
        dom.sendCodeBtn.textContent = t("common.send_code");
    }
}

export function setBusy(busy, action) {
    state.busy = Boolean(busy);
    dom.card.setAttribute("aria-busy", String(state.busy));
    $$("input, button", dom.card).forEach((el) => {
        if (el === dom.sendCodeBtn || el === dom.emailCountdownBtn) return;
        el.disabled = state.busy;
    });
    dom.loginSpinner.hidden = !(
        state.busy &&
        (action === "login" || action === "oauth")
    );
    dom.registerSpinner.hidden = !(state.busy && action === "register");
    dom.emailVerifySpinner.hidden = !(state.busy && action === "emailVerify");
    if (!state.busy) {
        dom.loginSpinner.hidden = true;
        dom.registerSpinner.hidden = true;
        dom.emailVerifySpinner.hidden = true;
    }
    syncCodeButton();
    updateEmailCountdownButton();
}

export function clearCodeTimer() {
    if (state.emailCodeTimer) {
        clearInterval(state.emailCodeTimer);
        state.emailCodeTimer = null;
    }
}

export function startCodeCountdown() {
    clearCodeTimer();
    state.emailCodeLeft = 60;
    syncCodeButton();
    state.emailCodeTimer = setInterval(() => {
        state.emailCodeLeft -= 1;
        if (state.emailCodeLeft <= 0) {
            clearCodeTimer();
            state.emailCodeLeft = 0;
        }
        syncCodeButton();
    }, 1000);
}

export function updateEmailCountdownButton() {
    if (!dom.emailCountdownBtn) return;
    const left = state.emailCodeLeft;
    dom.emailCountdownBtn.textContent = `${left}s`;
    dom.emailCountdownBtn.disabled = true;
}

export function stopEmailCountdown() {
    if (state.emailCountdownTimer) {
        clearInterval(state.emailCountdownTimer);
        state.emailCountdownTimer = null;
    }
}

export function startEmailCountdown(seconds) {
    stopEmailCountdown();
    state.emailCodeLeft = Math.max(0, Number(seconds) || 60);
    updateEmailCountdownButton();
    state.emailCountdownTimer = setInterval(() => {
        state.emailCodeLeft -= 1;
        if (state.emailCodeLeft <= 0) {
            state.emailCodeLeft = 0;
            stopEmailCountdown();
        }
        updateEmailCountdownButton();
    }, 1000);
}

export function syncFieldLabels() {
    $$(".field__input", dom.card).forEach((input) => {
        input.classList.toggle("has-value", Boolean(input.value));
    });
}
