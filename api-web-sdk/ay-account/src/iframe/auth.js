import { API, OAUTH_NO_EMAIL } from "./constants.js";
import { OAUTH_PROVIDER_ENABLED } from "../shared/config/oauth.js";
import { state } from "./state.js";
import { dom } from "./dom.js";
import { t } from "./i18n.js";
import { toast } from "./toast.js";
import { navigate } from "./navigation.js";
import {
    setBusy,
    syncFieldLabels,
    startEmailCountdown,
    startCodeCountdown,
    syncCodeButton,
    stopEmailCountdown,
} from "./busy.js";
import { apiRequest, withCaptcha } from "./api.js";
import {
    getVal,
    setFieldError,
    validateLoginAll,
    validateRegisterAll,
    validateEmailVerifyCode,
    validateRegEmail,
    validateRegEmailCode,
} from "./validation.js";
import { $, $$ } from "./utils.js";

export function postToParent(message) {
    if (window.parent === window) return;
    window.parent.postMessage(JSON.stringify(message), "*");
}

export function parentRequest(action, payload = {}, timeout = 20000) {
    if (window.parent === window) {
        return Promise.reject(new Error(t("common.network_error")));
    }
    const messageId = `p${Date.now()}_${++state.parentSeq}`;
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            state.pendingParents.delete(messageId);
            reject(new Error(t("common.network_error")));
        }, timeout);
        state.pendingParents.set(messageId, {
            resolve(value) {
                clearTimeout(timer);
                state.pendingParents.delete(messageId);
                resolve(value);
            },
            reject(error) {
                clearTimeout(timer);
                state.pendingParents.delete(messageId);
                reject(error);
            },
        });
        postToParent({ action, messageId, ...payload });
    });
}

export function resolveParent(messageId, ok, data, failure) {
    const waiter = state.pendingParents.get(messageId);
    if (!waiter) return;
    if (ok) {
        waiter.resolve(data);
        return;
    }
    const error = new Error(
        (failure && failure.message) || t("common.unknown_error"),
    );
    error.error_code = failure && failure.code;
    waiter.reject(error);
}

export function focusInvalid(target) {
    if (!target) return;
    if (typeof target.focus === "function") {
        target.focus({ preventScroll: false });
    }
}

export async function submitLogin() {
    if (state.busy) return;
    if (!validateLoginAll()) return;
    const username = getVal(dom.loginAccount);
    const password = dom.loginPassword.value;
    setBusy(true, "login");
    toast.loading(t("common.please_wait"));

    if (state.config.inline) {
        postToParent({ action: "login", username, password });
        return;
    }

    try {
        const data = await withCaptcha((gt) =>
            apiRequest(API.LOGIN, {
                body: {
                    username,
                    email: username,
                    password,
                    ...(gt ? { gt } : {}),
                },
            }),
        );
        handleAuthSuccess("login", data);
    } catch (err) {
        handleAuthFailure(err);
    }
}

export async function startRegister() {
    const email = getVal(dom.regEmail);
    const username = getVal(dom.regUsername);
    const password = dom.regPassword.value;
    setBusy(true, "register");
    toast.loading(t("common.please_wait"));
    try {
        const data = state.config.inline
            ? await parentRequest("registerStart", { email })
            : await withCaptcha((gt) =>
                  apiRequest(API.REGISTER_START, {
                      body: { email, ...(gt ? { gt } : {}) },
                  }),
              );
        state.registerPending = {
            username,
            email,
            password,
            verifySessionId: data.verifySessionId,
            method: data.method,
            emailToken: data.token,
            requestId: data.requestId,
            reverseEmail: data.email,
            reverseCode: data.code,
            expiresAt: data.expiresAt,
        };
        setBusy(false);
        toast.hide();
        if (data.method === "email") {
            showEmailPage(data);
        } else if (data.method === "reverse") {
            showReversePage(data);
        } else {
            throw new Error(t("common.unknown_error"));
        }
    } catch (err) {
        setBusy(false);
        handleAuthFailure(err);
    }
}

export async function submitRegister() {
    if (state.busy) return;
    if (!validateRegisterAll()) return;
    await startRegister();
}

export function showEmailPage(data) {
    const pending = state.registerPending;
    dom.emailVerifyTarget.textContent = pending.email;
    dom.emailVerifyCode.value = "";
    setFieldError(dom.emailVerifyCode, dom.emailVerifyCodeError, "");
    startEmailCountdown(Number(data.retryAfter) || 60);
    navigate("email", "next");
    setTimeout(() => {
        if (dom.emailVerifyCode) dom.emailVerifyCode.focus();
    }, 360);
}

export async function submitEmailVerification() {
    if (state.busy) return;
    if (!validateEmailVerifyCode(true)) return;
    const pending = state.registerPending;
    if (!pending || pending.method !== "email") return;

    setBusy(true, "emailVerify");
    toast.loading(t("common.please_wait"));
    const payload = {
        username: pending.username,
        email: pending.email,
        password: pending.password,
        verifySessionId: pending.verifySessionId,
        emailToken: pending.emailToken,
        emailCode: getVal(dom.emailVerifyCode),
        method: "email",
    };
    try {
        const result = state.config.inline
            ? await parentRequest("registerComplete", { payload })
            : await apiRequest(API.REGISTER, { body: payload });
        handleAuthSuccess("register", result);
    } catch (err) {
        setBusy(false);
        if (err.error_code === 1025) {
            setFieldError(
                dom.emailVerifyCode,
                dom.emailVerifyCodeError,
                "error.1025",
            );
        }
        handleAuthFailure(err);
    }
}

export function setReverseStatus(message, stateName = "") {
    if (!dom.reverseStatus) return;
    dom.reverseStatus.textContent = message;
    dom.reverseStatus.classList.toggle("is-success", stateName === "success");
    dom.reverseStatus.classList.toggle("is-error", stateName === "error");
}

export function showReversePage(data) {
    dom.reverseAddress.textContent = data.email;
    dom.reverseCode.textContent = data.code;
    dom.reverseMailto.href =
        `mailto:${encodeURIComponent(data.email)}` +
        `?subject=${encodeURIComponent("验证码")}` +
        `&body=${encodeURIComponent(data.code)}`;
    setReverseStatus(t("verify.waiting"), "waiting");
    state.reverseVerified = false;
    state.reversePolling = false;
    navigate("reverse", "next");
    startReverseCountdown(Number(data.expiresAt) * 1000);
    startReversePolling();
}

export function stopReverseCountdown() {
    if (state.reverseCountdownTimer) {
        clearInterval(state.reverseCountdownTimer);
        state.reverseCountdownTimer = null;
    }
}

export function startReverseCountdown(deadline) {
    stopReverseCountdown();
    const end =
        Number.isFinite(deadline) && deadline > 0
            ? deadline
            : Date.now() + 300000;
    const update = () => {
        const left = Math.max(0, Math.ceil((end - Date.now()) / 1000));
        dom.reverseCountdown.textContent = left
            ? `${t("verify.expires")} ${String(Math.floor(left / 60)).padStart(2, "0")}:${String(left % 60).padStart(2, "0")}`
            : t("verify.expired");
        if (!left) stopReverseCountdown();
    };
    update();
    state.reverseCountdownTimer = setInterval(update, 1000);
}

export function stopReversePolling() {
    if (state.reversePollTimer) {
        clearInterval(state.reversePollTimer);
        state.reversePollTimer = null;
    }
    state.reversePolling = false;
}

export function startReversePolling() {
    stopReversePolling();
    pollReverseOnce();
    state.reversePollTimer = setInterval(pollReverseOnce, 3000);
}

export async function pollReverseOnce() {
    const pending = state.registerPending;
    if (
        !pending ||
        pending.method !== "reverse" ||
        state.reverseVerified ||
        state.reversePolling
    ) {
        return;
    }
    state.reversePolling = true;
    if (dom.reverseStatus) {
        setReverseStatus(t("verify.checking"), "waiting");
    }
    try {
        const data = state.config.inline
            ? await parentRequest("registerQuery", {
                  verifyRequestId: pending.requestId,
                  email: pending.email,
              })
            : await apiRequest(API.REGISTER_QUERY, {
                  body: { requestId: pending.requestId, email: pending.email },
              });
        if (data.valid) {
            state.reverseVerified = true;
            stopReversePolling();
            stopReverseCountdown();
            setReverseStatus(t("verify.verified"), "success");
            await completeReverseRegistration();
        } else if (data.error === "EXPIRED_OR_NOT_FOUND") {
            stopReversePolling();
            stopReverseCountdown();
            setReverseStatus(t("verify.expired"), "error");
        } else if (
            data.error === "ACTION_MISMATCH" ||
            data.error === "EMAIL_MISMATCH"
        ) {
            stopReversePolling();
            setReverseStatus(
                data.error === "EMAIL_MISMATCH"
                    ? t("verify.emailMismatch")
                    : t("verify.actionMismatch"),
                "error",
            );
        } else {
            setReverseStatus(t("verify.waiting"), "waiting");
        }
    } catch (err) {
        setReverseStatus(
            (err && err.message) || t("common.network_error"),
            "error",
        );
    } finally {
        state.reversePolling = false;
    }
}

export async function completeReverseRegistration() {
    const pending = state.registerPending;
    if (!pending || state.busy) return;
    setBusy(true, "reverseVerify");
    toast.loading(t("common.please_wait"));
    const payload = {
        username: pending.username,
        email: pending.email,
        password: pending.password,
        verifySessionId: pending.verifySessionId,
        method: "reverse",
    };
    try {
        const result = state.config.inline
            ? await parentRequest("registerComplete", { payload })
            : await apiRequest(API.REGISTER, { body: payload });
        handleAuthSuccess("register", result);
    } catch (err) {
        setBusy(false);
        setReverseStatus(
            (err && err.message) || t("common.unknown_error"),
            "error",
        );
        toast.error((err && err.message) || t("common.unknown_error"));
    }
}

export function backToRegisterFromVerify() {
    stopEmailCountdown();
    stopReversePolling();
    stopReverseCountdown();
    state.registerPending = null;
    state.reverseVerified = false;
    setBusy(false);
    navigate("register", "back");
}

export function copyText(value) {
    if (!value) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard
            .writeText(value)
            .then(() => toast.success(t("common.copied")))
            .catch(() => toast.error(t("common.copy_failed")));
    } else {
        toast.error(t("common.copy_failed"));
    }
}

export function switchToLoginAfterRegister() {
    const pending = state.registerPending;
    stopEmailCountdown();
    stopReversePolling();
    stopReverseCountdown();
    state.registerPending = null;
    if (pending) {
        dom.loginAccount.value = pending.username || pending.email || "";
        dom.loginPassword.value = "";
        syncFieldLabels();
    }
    toast.success(t("common.register_success"));
    navigate("login", "back");
}

export function handleAuthSuccess(type, payload) {
    state.user = (payload && (payload.user || payload.result)) || payload;
    setBusy(false);
    if (type === "register" && state.openedMode === "login") {
        switchToLoginAfterRegister();
        return;
    }
    toast.success(
        t(
            type === "login"
                ? "common.login_success"
                : "common.register_success",
        ),
    );
    postToParent({
        action: type === "login" ? "loginSuccess" : "registerSuccess",
        user: state.user,
        result: payload,
    });
    if (state.config.autoClose) {
        setTimeout(() => {
            if (window.parent === window) {
                if (typeof window.close === "function") window.close();
            } else {
                postToParent({ action: "closeWindow" });
            }
        }, 900);
    }
}

export function handleAuthFailure(err) {
    setBusy(false);
    toast.error((err && err.message) || t("common.unknown_error"));
}

export function handleCodeSent(data) {
    if (data && data.token) state.emailCodeToken = data.token;
    state.codeSending = false;
    toast.success(t("common.send_email_code_success"));
    startCodeCountdown();
    syncCodeButton();
    if (
        dom.regEmailCode &&
        (dom.regEmailCode.dataset.touched === "1" || getVal(dom.regEmailCode))
    ) {
        validateRegEmailCode(false);
    }
}

export function handleCodeFailure(err) {
    state.codeSending = false;
    syncCodeButton();
    toast.error((err && err.message) || t("common.send_email_code_failure"));
}
export async function sendEmailCode() {
    if (state.codeSending || state.emailCodeLeft > 0) return;
    const email = getVal(dom.regEmail);
    dom.regEmail.dataset.touched = "1";
    if (!validateRegEmail(true)) {
        focusInvalid(dom.regEmail);
        return;
    }

    state.codeSending = true;
    syncCodeButton();
    if (state.config.inline) {
        postToParent({ action: "sendEmailCode", email });
        return;
    }

    try {
        const data = await apiRequest(API.SENDMAILCODE, {
            body: { email, action: "register" },
        });
        handleCodeSent(data);
    } catch (err) {
        handleCodeFailure(err);
    }
}

export function startOauth(provider) {
    if (state.busy || OAUTH_PROVIDER_ENABLED[provider] !== true) return;
    setBusy(true, "oauth");
    toast.loading(t("common.oauth_opening"));
    postToParent({ action: "oauth_login", provider });
}

export function applyProviderVisibility() {
    let visible = 0;
    $$(".provider", dom.oauthPage).forEach((button) => {
        const enabled =
            OAUTH_PROVIDER_ENABLED[button.dataset.provider] === true;
        button.hidden = !enabled;
        button.style.display = enabled ? "" : "none";
        if (enabled) visible += 1;
    });

    const hide = state.config.hideOauthClient || visible === 0;
    if (dom.oauthExpand) {
        dom.oauthExpand.hidden = hide;
        dom.oauthExpand.style.display = hide ? "none" : "";
    }
    if (hide && (state.page === "oauth" || state.page === "oauthWarning")) {
        navigate(state.lockedPage || "login", "down");
    }
}

export function handleProviderClick(provider) {
    if (state.busy || OAUTH_PROVIDER_ENABLED[provider] !== true) return;
    if (OAUTH_NO_EMAIL.has(provider)) {
        state.oauthWarningProvider = provider;
        if (dom.oauthWarningProvider) {
            const nameEl = $(
                `.provider[data-provider="${provider}"] .provider__name`,
                dom.oauthPage,
            );
            dom.oauthWarningProvider.textContent =
                (nameEl && nameEl.textContent) || t(`oauth.${provider}.name`);
        }
        navigate("oauthWarning", "next");
        return;
    }
    startOauth(provider);
}
