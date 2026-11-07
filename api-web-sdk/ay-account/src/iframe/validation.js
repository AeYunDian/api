import { state } from "./state.js";
import { dom } from "./dom.js";
import { t } from "./i18n.js";
import { scheduleHeight } from "./navigation.js";
import { ALLOWED_EMAIL_DOMAINS } from "../shared/config/email-domains.js";
import { $ } from "./utils.js";

export function getVal(el) {
    return el ? String(el.value || "").trim() : "";
}

export function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isEmailDomainAllowed(email) {
    return ALLOWED_EMAIL_DOMAINS.some((domain) => email.endsWith(domain));
}

export function agreementChecked(el) {
    const box = $(".agreement__box", el);
    return Boolean(box && box.classList.contains("is-checked"));
}

export function setFieldError(input, errorEl, key) {
    if (errorEl) {
        errorEl.hidden = !key;
        errorEl.textContent = key ? t(key) : "";
        errorEl.dataset.i18nKey = key || "";
    }
    if (input) {
        input.classList.toggle("is-invalid", Boolean(key));
        input.setAttribute("aria-invalid", key ? "true" : "false");
    }
    scheduleHeight();
}

export function shouldShowEmpty(input, force) {
    return Boolean(force);
}

export function validateLoginAccount(force = false) {
    const value = getVal(dom.loginAccount);
    let key = "";
    if (!value && shouldShowEmpty(dom.loginAccount, force)) {
        key = "common.enter_username_or_email";
    }
    setFieldError(dom.loginAccount, dom.loginAccountError, key);
    return !key;
}

export function validateLoginPassword(force = false) {
    const value = dom.loginPassword.value;
    let key = "";
    if (!value && shouldShowEmpty(dom.loginPassword, force)) {
        key = "common.enter_password";
    } else if (value && value.length < 6) {
        key = "common.password_min_length";
    } else if (value.length > 32) {
        key = "common.password_max_length";
    }
    setFieldError(dom.loginPassword, dom.loginPasswordError, key);
    return !key;
}

export function validateLoginAgreement(force = false) {
    const checked = agreementChecked(dom.loginAgreement);
    const key = !checked && force ? "common.please_read_and_agree" : "";
    setFieldError(null, dom.loginAgreementError, key);
    return !key;
}

export function validateRegUsername(force = false) {
    const value = getVal(dom.regUsername);
    let key = "";
    if (!value && shouldShowEmpty(dom.regUsername, force)) {
        key = "common.enter_username";
    } else if (value && value.length < 4) {
        key = "common.username_min_length";
    } else if (value.length > 20) {
        key = "common.username_max_length";
    }
    setFieldError(dom.regUsername, dom.regUsernameError, key);
    return !key;
}

export function validateRegEmail(force = false) {
    const value = getVal(dom.regEmail);
    let key = "";
    if (!value && shouldShowEmpty(dom.regEmail, force)) {
        key = "common.enter_email";
    } else if (value && !isValidEmail(value)) {
        key = "common.invalid_email_format";
    } else if (value && !isEmailDomainAllowed(value)) {
        key = "error.1026";
    }
    setFieldError(dom.regEmail, dom.regEmailError, key);
    return !key;
}

export function validateRegEmailCode(force = false) {
    const value = getVal(dom.regEmailCode);
    let key = "";
    if (!value && shouldShowEmpty(dom.regEmailCode, force)) {
        key = "common.enter_email_code";
    } else if (value && !/^\d{6}$/.test(value)) {
        key = "common.reg_email_code_length";
    } else if (value && !state.emailCodeToken) {
        key = "common.please_get_code";
    }
    setFieldError(dom.regEmailCode, dom.regEmailCodeError, key);
    return !key;
}

export function validateRegPassword(force = false) {
    const value = dom.regPassword.value;
    let key = "";
    if (!value && shouldShowEmpty(dom.regPassword, force)) {
        key = "common.enter_password";
    } else if (value && value.length < 6) {
        key = "common.password_min_length";
    } else if (value.length > 32) {
        key = "common.password_max_length";
    }
    setFieldError(dom.regPassword, dom.regPasswordError, key);
    return !key;
}

export function validateRegPasswordConfirm(force = false) {
    const value = dom.regPasswordConfirm.value;
    let key = "";
    if (!value && shouldShowEmpty(dom.regPasswordConfirm, force)) {
        key = "common.enter_password";
    } else if (value && value !== dom.regPassword.value) {
        key = "common.password_mismatch";
    }
    setFieldError(dom.regPasswordConfirm, dom.regPasswordConfirmError, key);
    return !key;
}

export function validateRegisterAgreement(force = false) {
    const checked = agreementChecked(dom.registerAgreement);
    const key = !checked && force ? "common.please_read_and_agree" : "";
    setFieldError(null, dom.registerAgreementError, key);
    return !key;
}

export function validateLoginAll() {
    dom.loginAccount.dataset.touched = "1";
    dom.loginPassword.dataset.touched = "1";
    dom.loginAgreement.dataset.touched = "1";
    const results = [
        validateLoginAccount(true),
        validateLoginPassword(true),
        validateLoginAgreement(true),
    ];
    if (results.every(Boolean)) return true;
    if (dom.loginAccount.classList.contains("is-invalid")) {
        dom.loginAccount.focus();
    } else if (dom.loginPassword.classList.contains("is-invalid")) {
        dom.loginPassword.focus();
    } else {
        dom.loginAgreement.focus();
    }
    return false;
}

export function validateRegisterAll() {
    [
        dom.regUsername,
        dom.regEmail,
        dom.regPassword,
        dom.regPasswordConfirm,
    ].forEach((input) => {
        input.dataset.touched = "1";
    });
    dom.registerAgreement.dataset.touched = "1";
    const results = [
        validateRegUsername(true),
        validateRegEmail(true),
        validateRegPassword(true),
        validateRegPasswordConfirm(true),
        validateRegisterAgreement(true),
    ];
    if (results.every(Boolean)) return true;
    const first = [
        dom.regUsername,
        dom.regEmail,
        dom.regPassword,
        dom.regPasswordConfirm,
    ].find((input) => input.classList.contains("is-invalid"));
    if (first) first.focus();
    else dom.registerAgreement.focus();
    return false;
}
export function validateInput(input, force = false) {
    switch (input && input.id) {
        case "loginAccount":
            validateLoginAccount(force);
            break;
        case "loginPassword":
            validateLoginPassword(force);
            break;
        case "regUsername":
            validateRegUsername(force);
            break;
        case "regEmail":
            validateRegEmail(force);
            break;
        case "regEmailCode":
            validateRegEmailCode(force);
            break;
        case "regPassword":
            validateRegPassword(force);
            if (
                force ||
                dom.regPasswordConfirm.value ||
                dom.regPasswordConfirm.dataset.touched === "1"
            ) {
                validateRegPasswordConfirm(force);
            }
            break;
        case "regPasswordConfirm":
            validateRegPasswordConfirm(force);
            break;
        case "emailVerifyCode":
            validateEmailVerifyCode(force);
            break;
        default:
            break;
    }
}
export function validateEmailVerifyCode(force = false) {
    const value = getVal(dom.emailVerifyCode);
    let key = "";
    if (!value) {
        if (force) key = "common.enter_email_code";
    } else if (!/^\d{6}$/.test(value)) {
        key = "common.reg_email_code_length";
    }
    setFieldError(dom.emailVerifyCode, dom.emailVerifyCodeError, key);
    return !key;
}
