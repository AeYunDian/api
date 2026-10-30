/* ============================================================
   AyAccount iframe UI
   - one script for the whole login surface
   - strict mode, no globals
   - inline mode delegates auth to the host SDK (captcha appears in host)
   - fullscreen mode owns auth + captcha inside this iframe
   ============================================================ */
"use strict";

(() => {
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const API_BASE = "https://online.undz.cn";
  const API = {
    LOGIN: "/api/ayonline/login",
    REGISTER: "/api/ayonline/register",
    REGISTER_START: "/api/ayonline/register/verification/start",
    REGISTER_QUERY: "/api/ayonline/register/verification/query",
    SENDMAILCODE: "/api/ayonline/send-verification",
  };
  const ALLOWED_EMAIL_DOMAINS = [
    "aliyun.com",
    "qq.com",
    "163.com",
    "126.com",
    "foxmail.com",
    "sina.com",
    "sina.cn",
    "sohu.com",
    "139.com",
    "189.cn",
    "21cn.com",
    "tom.com",
    "yeah.net",
    "263.net",
    "vip.qq.com",
    "vip.163.com",
    "vip.sina.com",
    "vip.sina.cn",
    "gmail.com",
    "outlook.com",
    "hotmail.com",
    "live.com",
    "msn.com",
    "yahoo.com",
    "yahoo.co.jp",
    "yahoo.com.hk",
    "yahoo.com.tw",
    "icloud.com",
    "me.com",
    "mac.com",
    "aol.com",
    "protonmail.com",
    "mail.com",
    "gmx.com",
    "zoho.com",
    "yandex.com",
    "rambler.ru",
    "undz.cn",
    "io.hb.cn",
    "2x.nz",
    "edu.cn",
    "gov.cn",
    "yzhyzxy.cn",
  ];

  /* Minimal fallback so the page still behaves when opened directly. */
  const DEFAULT_I18N = {
    "common.please_wait": "请稍后...",
    "common.unknown_error": "未知错误，请稍后重试",
    "common.network_error": "网络请求失败，请检查网络",
    "common.login_success": "登录成功",
    "common.register_success": "注册成功",
    "common.login_failure": "登录失败",
    "common.register_failure": "注册失败",
    "common.send_email_code_success": "发送验证码成功",
    "common.send_email_code_failure": "发送验证码失败",
    "common.send_code": "获取验证码",
    "common.copy": "复制",
    "common.copied": "已复制",
    "common.copy_failed": "复制失败",
    "verify.email.title": "验证邮箱",
    "verify.email.sent": "验证码已发送至",
    "verify.submit": "完成注册",
    "verify.back": "返回修改",
    "verify.reverse.title": "验证邮箱",
    "verify.reverse.desc":
      "请用注册邮箱向下面地址发送一封邮件，正文填写验证码（主题随意）。",
    "verify.address": "收件地址",
    "verify.code": "邮件正文",
    "verify.mailto": "使用邮件客户端发送",
    "verify.waiting": "等待邮件…",
    "verify.checking": "正在检查…",
    "verify.verified": "验证通过，正在注册…",
    "verify.expired": "验证已过期，请返回修改",
    "verify.expires": "有效期剩余",
    "verify.emailMismatch": "邮箱与本次注册不一致",
    "verify.actionMismatch": "验证任务类型不匹配",
    "common.oauth_opening": "正在打开授权窗口…",
    "common.enter_username_or_email": "请输入用户名/邮箱",
    "common.enter_password": "请输入密码",
    "common.password_min_length": "密码至少6位",
    "common.password_max_length": "密码最多32位",
    "common.please_read_and_agree": "请您阅读并同意协议",
    "common.enter_username": "请输入用户名",
    "common.enter_email": "请输入邮箱",
    "common.enter_email_code": "请输入邮箱验证码",
    "common.invalid_email_format": "邮箱格式不正确",
    "common.username_min_length": "用户名至少4位",
    "common.username_max_length": "用户名最多20位",
    "common.password_mismatch": "密码输入不一致",
    "common.reg_email_code_length": "邮箱验证码长度错误",
    "common.please_get_code": "请先获取邮箱验证码",
    "common.complete_verification": "请完成验证",
    "link.faq": "https://online.undz.cn/login/faq/zh-cn",
    "error.1024": "您已取消验证",
    "error.1025": "验证码错误",
    "error.1026": "不支持的邮箱域名",
    "error.1035": "弹窗被拦截，请允许弹窗跳转",
    "error.1036": "登入失败",
    "error.1037": "未知错误",
  };

  const state = {
    config: {
      appId: "default",
      sdkVersion: "3.2.0",
      apiBase: API_BASE,
      inline: false,
      theme: "auto",
      lang: "zh-cn",
      autoClose: true,
      hideOauthClient: false,
      hideClose: false,
      fill: false,
      enterAnimation: "back",
    },
    translations: {},
    page: "login",
    busy: false,
    animating: false,
    configReady: false,
    entryPlayed: false,
    emailCodeToken: "",
    emailCodeTimer: null,
    emailCodeLeft: 0,
    codeSending: false,
    user: null,
    lockedPage: null,
    registerPending: null,
    pendingParents: new Map(),
    parentSeq: 0,
    emailCountdownTimer: null,
    reversePollTimer: null,
    reverseCountdownTimer: null,
    reversePolling: false,
    reverseVerified: false,
  };

  const dom = {
    app: $("#app"),
    card: $("#card"),
    stage: $("#stage"),
    tabs: $("#tabs"),
    tabLogin: $("#tabLogin"),
    tabRegister: $("#tabRegister"),
    closeBtn: $("#closeBtn"),
    loginForm: $("#loginForm"),
    registerForm: $("#registerForm"),
    loginAccount: $("#loginAccount"),
    loginPassword: $("#loginPassword"),
    loginAgreement: $("#loginAgreement"),
    loginSubmit: $("#loginSubmit"),
    loginSpinner: $("#loginSpinner"),
    loginAccountError: $("#loginAccountError"),
    loginPasswordError: $("#loginPasswordError"),
    loginAgreementError: $("#loginAgreementError"),
    regUsername: $("#regUsername"),
    regEmail: $("#regEmail"),
    regEmailCode: $("#regEmailCode"),
    regPassword: $("#regPassword"),
    regPasswordConfirm: $("#regPasswordConfirm"),
    regUsernameError: $("#regUsernameError"),
    regEmailError: $("#regEmailError"),
    regEmailCodeError: $("#regEmailCodeError"),
    regPasswordError: $("#regPasswordError"),
    regPasswordConfirmError: $("#regPasswordConfirmError"),
    registerAgreement: $("#registerAgreement"),
    registerAgreementError: $("#registerAgreementError"),
    registerSubmit: $("#registerSubmit"),
    registerSpinner: $("#registerSpinner"),
    emailVerifyForm: $("#emailVerifyForm"),
    emailVerifyTarget: $("#emailVerifyTarget"),
    emailVerifyCode: $("#emailVerifyCode"),
    emailVerifyCodeError: $("#emailVerifyCodeError"),
    emailCountdownBtn: $("#emailCountdownBtn"),
    emailVerifySubmit: $("#emailVerifySubmit"),
    emailVerifySpinner: $("#emailVerifySpinner"),
    emailVerifyBack: $("#emailVerifyBack"),
    reversePage: $("#page-reverse"),
    reverseAddress: $("#reverseAddress"),
    reverseCode: $("#reverseCode"),
    reverseMailto: $("#reverseMailto"),
    reverseStatus: $("#reverseStatus"),
    reverseCountdown: $("#reverseCountdown"),
    reverseRefresh: $("#reverseRefresh"),
    reverseBack: $("#reverseBack"),
    reverseCopyAddress: $("#reverseCopyAddress"),
    reverseCopyCode: $("#reverseCopyCode"),
    sendCodeBtn: $("#sendCodeBtn"),
    oauthExpand: $("#oauthExpand"),
    oauthBack: $("#oauthBack"),
    oauthYzhyzxy: $("#oauthYzhyzxy"),
    oauthGithub: $("#oauthGithub"),
    oauthPage: $("#page-oauth"),
    faqLink: $("#faqLink"),
    footer: $(".footer"),
    toLogin: $("#toLogin"),
    toast: $("#toast"),
  };

  const pages = {
    login: $("#page-login"),
    register: $("#page-register"),
    email: $("#page-email"),
    reverse: $("#page-reverse"),
    oauth: dom.oauthPage,
  };

  /* ---------------- toast (iframe-local, same visual language) ---------------- */

  class Toast {
    constructor(root) {
      this.root = root;
      this.text = $(".ay-toast__text", root);
      this.loadingIcon = $(".ay-icon__image--loading", root);
      this.errorIcon = $(".ay-icon__image--error", root);
      this.timer = null;
    }

    show(message, type = "info", timeout = 1400) {
      if (!this.root || !this.text) return;
      this.text.textContent = message == null ? "" : String(message);
      if (this.loadingIcon) {
        this.loadingIcon.style.display = type === "loading" ? "block" : "none";
      }
      if (this.errorIcon) {
        this.errorIcon.style.display = type === "error" ? "block" : "none";
      }
      this.root.style.display = "flex";
      this.clearTimer();
      if (timeout > 0) {
        this.timer = setTimeout(() => this.hide(), timeout);
      }
    }

    loading(message) {
      this.show(message, "loading", 0);
    }

    success(message) {
      this.show(message, "info", 1400);
    }

    error(message) {
      this.show(message, "error", 2200);
    }

    hide() {
      if (this.root) this.root.style.display = "none";
      this.clearTimer();
    }

    clearTimer() {
      if (this.timer) {
        clearTimeout(this.timer);
        this.timer = null;
      }
    }
  }

  const toast = new Toast(dom.toast);

  /* ---------------- i18n ---------------- */

  function hasT(key) {
    return (
      Object.prototype.hasOwnProperty.call(state.translations, key) ||
      Object.prototype.hasOwnProperty.call(DEFAULT_I18N, key)
    );
  }

  function t(key) {
    if (Object.prototype.hasOwnProperty.call(state.translations, key)) {
      return state.translations[key];
    }
    if (Object.prototype.hasOwnProperty.call(DEFAULT_I18N, key)) {
      return DEFAULT_I18N[key];
    }
    return key;
  }

  function translatePage() {
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

  /* ---------------- theme / mode / custom style ---------------- */

  function normalizeTheme(theme) {
    return theme === "light" || theme === "dark" || theme === "auto"
      ? theme
      : "auto";
  }

  function applyTheme(theme) {
    const value = normalizeTheme(theme);
    state.config.theme = value;
    document.documentElement.setAttribute("data-theme", value);
  }

  function applyMode(inline) {
    state.config.inline = Boolean(inline);
    document.documentElement.setAttribute(
      "data-mode",
      state.config.inline ? "inline" : "full",
    );
  }

  function applyCustomStyle(css) {
    if (typeof css !== "string" || !css.trim()) return;
    let style = $("#ay-account-custom-style", document);
    if (!style) {
      style = document.createElement("style");
      style.id = "ay-account-custom-style";
      document.head.appendChild(style);
    }
    style.textContent = css;
  }

  function applyFill(fill) {
    state.config.fill = Boolean(fill);
    document.documentElement.setAttribute(
      "data-fill",
      state.config.fill ? "true" : "false",
    );
  }

  /* ---------------- stage / navigation ---------------- */

  let heightFrame = 0;

  function scheduleHeight() {
    if (heightFrame) cancelAnimationFrame(heightFrame);
    heightFrame = requestAnimationFrame(() => {
      heightFrame = 0;
      setStageHeight();
    });
  }

  function setStageHeight(pageName = state.page) {
    if (!dom.stage) return;
    const page = pages[pageName] || pages[state.page];
    const height = Math.max(220, page ? page.scrollHeight : 220);
    dom.stage.style.blockSize = `${height}px`;
  }

  function updateChrome(page) {
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
  }

  function shouldAutoFocus() {
    if (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) {
      return false;
    }
    return window.innerWidth > 720;
  }

  function navigate(next, direction) {
    if (!pages[next] || next === state.page || state.animating) return;
    if (
      state.lockedPage &&
      next !== state.lockedPage &&
      next !== "oauth" &&
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
      if (next !== "oauth" && shouldAutoFocus()) {
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

  function playEntryAnimation(direction) {
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

  /* ---------------- busy / code button ---------------- */

  function syncCodeButton() {
    if (!dom.sendCodeBtn) return;
    const disabled = state.busy || state.codeSending || state.emailCodeLeft > 0;
    dom.sendCodeBtn.disabled = disabled;
    if (state.emailCodeLeft > 0) {
      dom.sendCodeBtn.textContent = `${state.emailCodeLeft}s`;
    } else {
      dom.sendCodeBtn.textContent = t("common.send_code");
    }
  }

  function setBusy(busy, action) {
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
    dom.emailVerifySpinner.hidden = !(
      state.busy && action === "emailVerify"
    );
    if (!state.busy) {
      dom.loginSpinner.hidden = true;
      dom.registerSpinner.hidden = true;
      dom.emailVerifySpinner.hidden = true;
    }
    syncCodeButton();
    updateEmailCountdownButton();
  }

  function clearCodeTimer() {
    if (state.emailCodeTimer) {
      clearInterval(state.emailCodeTimer);
      state.emailCodeTimer = null;
    }
  }

  function startCodeCountdown() {
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

  /* ---------------- validation ---------------- */

  function getVal(el) {
    return el ? String(el.value || "").trim() : "";
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function isEmailDomainAllowed(email) {
    return ALLOWED_EMAIL_DOMAINS.some((domain) => email.endsWith(domain));
  }

  function agreementChecked(el) {
    const box = $(".agreement__box", el);
    return Boolean(box && box.classList.contains("is-checked"));
  }

  function syncFieldLabels() {
    $$(".field__input", dom.card).forEach((input) => {
      input.classList.toggle("has-value", Boolean(input.value));
    });
  }

  function setFieldError(input, errorEl, key) {
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

  function shouldShowEmpty(input, force) {
    return Boolean(force);
  }

  function validateLoginAccount(force = false) {
    const value = getVal(dom.loginAccount);
    let key = "";
    if (!value && shouldShowEmpty(dom.loginAccount, force)) {
      key = "common.enter_username_or_email";
    }
    setFieldError(dom.loginAccount, dom.loginAccountError, key);
    return !key;
  }

  function validateLoginPassword(force = false) {
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

  function validateLoginAgreement(force = false) {
    const checked = agreementChecked(dom.loginAgreement);
    const key = !checked && force ? "common.please_read_and_agree" : "";
    setFieldError(null, dom.loginAgreementError, key);
    return !key;
  }

  function validateRegUsername(force = false) {
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

  function validateRegEmail(force = false) {
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

  function validateRegEmailCode(force = false) {
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

  function validateRegPassword(force = false) {
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

  function validateRegPasswordConfirm(force = false) {
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

  function validateRegisterAgreement(force = false) {
    const checked = agreementChecked(dom.registerAgreement);
    const key = !checked && force ? "common.please_read_and_agree" : "";
    setFieldError(null, dom.registerAgreementError, key);
    return !key;
  }

  function validateLoginAll() {
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

  function validateRegisterAll() {
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

  function validateInput(input, force = false) {
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

  /* ---------------- API + Geetest (fullscreen mode only) ---------------- */

  function utf8ToBase64(str) {
    const bytes = new TextEncoder().encode(str);
    let binary = "";
    for (let i = 0; i < bytes.length; i += 1) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  function getGeetestLang() {
    const lang = String(state.config.lang || "zh-cn")
      .trim()
      .toLowerCase()
      .replace(/_/g, "-");
    const map = {
      "zh-cn": "zho",
      "zh-hans": "zho",
      "zh-sg": "zho",
      zh: "zho",
      "zh-tw": "zho-tw",
      "zh-hant": "zho-tw",
      "zh-hant-tw": "zho-tw",
      "zh-hk": "zho-hk",
      "zh-mo": "zho-hk",
      "zh-hant-hk": "zho-hk",
      en: "eng",
      "en-us": "eng",
      "en-gb": "eng",
      "en-au": "eng",
      "en-ca": "eng",
      ja: "jpn",
      "ja-jp": "jpn",
      id: "ind",
      "id-id": "ind",
      ko: "kor",
      "ko-kr": "kor",
      ru: "rus",
      "ru-ru": "rus",
      ar: "ara",
      "ar-sa": "ara",
      "ar-eg": "ara",
      es: "spa",
      "es-es": "spa",
      "es-mx": "spa",
      "pt-br": "pon",
      pt: "por",
      "pt-pt": "por",
      fr: "fra",
      "fr-fr": "fra",
      "fr-ca": "fra",
      de: "deu",
      "de-de": "deu",
      ug: "udm",
      "ug-cn": "udm",
    };
    if (map[lang]) return map[lang];
    const main = lang.split("-")[0];
    return map[main] || "eng";
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const existing = $(`script[src="${src}"]`);
      if (existing) {
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener("error", () => reject(new Error("script")), {
          once: true,
        });
        return;
      }
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("script"));
      document.head.appendChild(script);
    });
  }

  let geetestLogoObserver = null;

  function removeUselessTestLogo() {
    if (geetestLogoObserver) return;
    geetestLogoObserver = new MutationObserver(() => {
      const nodes = $$(".geetest_box_logo, .geetest_feedback");
      if (!nodes.length) return;
      nodes.forEach((el) => {
        el.style.display = "none";
      });
      geetestLogoObserver.disconnect();
      geetestLogoObserver = null;
    });
    geetestLogoObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  async function ensureGeetest() {
    if (typeof window.initGeetest4 === "function") return;
    await loadScript("/lib/gt4.js");
    if (typeof window.initGeetest4 !== "function") {
      throw new Error("Geetest4 not loaded");
    }
  }

  async function showGeetest(gtCode) {
    await ensureGeetest();
    return new Promise((resolve, reject) => {
      let instance = null;
      const cleanup = () => {
        if (instance && typeof instance.destroy === "function") {
          instance.destroy();
        }
        instance = null;
      };
      window.initGeetest4(
        {
          captchaId: gtCode,
          product: "bind",
          language: getGeetestLang(),
        },
        (captcha) => {
          instance = captcha;
          captcha
            .onReady(() => {
              removeUselessTestLogo();
              if (typeof captcha.showBox === "function") captcha.showBox();
            })
            .onSuccess(() => {
              const result = captcha.getValidate();
              if (!result) {
                cleanup();
                reject(new Error(t("common.complete_verification")));
                return;
              }
              result.captcha_id = gtCode;
              const payload = utf8ToBase64(JSON.stringify(result));
              cleanup();
              resolve(payload);
            })
            .onError(() => {
              cleanup();
              reject(new Error(t("common.unknown_error")));
            })
            .onClose(() => {
              cleanup();
              const err = new Error(t("error.1024"));
              err.error_code = 1024;
              reject(err);
            });
        },
      );
    });
  }

  function makeApiError(data, status) {
    const code = data && (data.error_code || data.code);
    let message = "";
    if (code && hasT(`error.${code}`)) {
      message = t(`error.${code}`);
      if (Number(code) === 1017 && data.ban_reason) {
        message += `: ${data.ban_reason}`;
      }
    } else {
      message = (data && (data.error || data.message)) || `HTTP ${status}`;
    }
    const err = new Error(message);
    err.error_code = code;
    err.data = data || {};
    return err;
  }

  async function apiRequest(path, options = {}) {
    const { body, method = "POST", headers = {} } = options;
    const response = await fetch(`${API_BASE}${path}`, {
      method,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-App-Id": state.config.appId || "default",
        "X-SDK-VER": state.config.sdkVersion || "3.2.0",
        "X-App-Ver": state.config.sdkVersion || "3.2.0",
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw makeApiError(data, response.status);
    return data;
  }

  async function withCaptcha(run) {
    try {
      return await run(null);
    } catch (err) {
      if (
        Number(err && err.error_code) === 1023 &&
        err.data &&
        err.data.gt_code
      ) {
        const gt = await showGeetest(err.data.gt_code);
        return run(gt);
      }
      throw err;
    }
  }

  /* ---------------- auth actions ---------------- */

  function postToParent(message) {
    if (window.parent === window) return;
    window.parent.postMessage(JSON.stringify(message), "*");
  }

  function focusInvalid(target) {
    if (!target) return;
    if (typeof target.focus === "function") {
      target.focus({ preventScroll: false });
    }
  }

  async function submitLogin() {
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

  function parentRequest(action, payload = {}, timeout = 20000) {
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

  function resolveParent(messageId, ok, data, failure) {
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

  async function startRegister() {
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

  async function submitRegister() {
    if (state.busy) return;
    if (!validateRegisterAll()) return;
    await startRegister();
  }

  function showEmailPage(data) {
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

  function updateEmailCountdownButton() {
    if (!dom.emailCountdownBtn) return;
    const left = state.emailCodeLeft;
    dom.emailCountdownBtn.textContent = `${left}s`;
    dom.emailCountdownBtn.disabled = true;
  }

  function stopEmailCountdown() {
    if (state.emailCountdownTimer) {
      clearInterval(state.emailCountdownTimer);
      state.emailCountdownTimer = null;
    }
  }

  function startEmailCountdown(seconds) {
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

  function validateEmailVerifyCode(force = false) {
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

  async function submitEmailVerification() {
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

  function setReverseStatus(message, stateName = "") {
    if (!dom.reverseStatus) return;
    dom.reverseStatus.textContent = message;
    dom.reverseStatus.classList.toggle("is-success", stateName === "success");
    dom.reverseStatus.classList.toggle("is-error", stateName === "error");
  }

  function showReversePage(data) {
    const pending = state.registerPending;
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

  function stopReverseCountdown() {
    if (state.reverseCountdownTimer) {
      clearInterval(state.reverseCountdownTimer);
      state.reverseCountdownTimer = null;
    }
  }

  function startReverseCountdown(deadline) {
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

  function stopReversePolling() {
    if (state.reversePollTimer) {
      clearInterval(state.reversePollTimer);
      state.reversePollTimer = null;
    }
    state.reversePolling = false;
  }

  function startReversePolling() {
    stopReversePolling();
    pollReverseOnce();
    state.reversePollTimer = setInterval(pollReverseOnce, 3000);
  }

  async function pollReverseOnce() {
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

  async function completeReverseRegistration() {
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

  function backToRegisterFromVerify() {
    stopEmailCountdown();
    stopReversePolling();
    stopReverseCountdown();
    state.registerPending = null;
    state.reverseVerified = false;
    setBusy(false);
    navigate("register", "back");
  }

  function copyText(value) {
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

  function handleAuthSuccess(type, payload) {
    state.user = (payload && (payload.user || payload.result)) || payload;
    setBusy(false);
    toast.success(
      t(type === "login" ? "common.login_success" : "common.register_success"),
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

  function handleAuthFailure(err) {
    setBusy(false);
    toast.error((err && err.message) || t("common.unknown_error"));
  }

  function handleCodeSent(data) {
    if (data && data.token) state.emailCodeToken = data.token;
    state.codeSending = false;
    toast.success(t("common.send_email_code_success"));
    startCodeCountdown();
    syncCodeButton();
    if (
      dom.regEmailCode &&
      (dom.regEmailCode.dataset.touched === "1" ||
        getVal(dom.regEmailCode))
    ) {
      validateRegEmailCode(false);
    }
  }

  function handleCodeFailure(err) {
    state.codeSending = false;
    syncCodeButton();
    toast.error((err && err.message) || t("common.send_email_code_failure"));
  }

  async function sendEmailCode() {
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

  function startOauth(provider) {
    if (state.busy) return;
    setBusy(true, "oauth");
    toast.loading(t("common.oauth_opening"));
    postToParent({ action: "oauth_login", provider });
  }

  /* ---------------- agreement / events ---------------- */

  function toggleAgreement(container) {
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

  function bindAgreement(container) {
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

  function spawnRipple(target, clientX, clientY) {
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

  function installRipple() {
    const selector = ".btn, .code-btn, .oauth-expand, .provider, .tab, .ay-close";
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
      spawnRipple(target, rect.left + rect.width / 2, rect.top + rect.height / 2);
    });
  }

  function bindEvents() {
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
    dom.oauthYzhyzxy.addEventListener("click", () => startOauth("yzhyzxy"));
    dom.oauthGithub.addEventListener("click", () => startOauth("github"));

    if (dom.sendCodeBtn) {
      dom.sendCodeBtn.addEventListener("click", sendEmailCode);
    }

    dom.emailVerifyForm.addEventListener("submit", (event) => {
      event.preventDefault();
      submitEmailVerification();
    });
    dom.emailVerifyBack.addEventListener("click", backToRegisterFromVerify);
    dom.reverseBack.addEventListener("click", backToRegisterFromVerify);
    dom.reverseRefresh.addEventListener("click", pollReverseOnce);
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

  /* ---------------- parent messages ---------------- */

  function setPageImmediate(page) {
    if (!pages[page]) return;
    Object.keys(pages).forEach((key) => {
      pages[key].classList.toggle("is-active", key === page);
      pages[key].setAttribute("aria-hidden", String(key !== page));
    });
    state.page = page;
    updateChrome(page);
    scheduleHeight();
  }

  function applyConfig(config) {
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
      if (config.hideOauthClient && state.page === "oauth") {
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

  function reveal() {
    dom.app.classList.add("is-ready");
    scheduleHeight();
  }

  function onMessage(event) {
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

  /* ---------------- boot ---------------- */

  function readQuery() {
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
      state.lockedPage = only;
      dom.card.setAttribute("data-only", only);
      dom.tabs.hidden = true;
      dom.tabs.style.display = "none";
      if (dom.toLogin) dom.toLogin.style.display = "none";
      setPageImmediate(only);
    } else if (tab === "register") {
      pages.login.classList.remove("is-active");
      pages.register.classList.add("is-active");
      state.page = "register";
      updateChrome("register");
    } else {
      updateChrome("login");
    }
  }

  function init() {
    readQuery();
    bindEvents();
    installRipple();
    window.addEventListener("message", onMessage);
    translatePage();
    updateChrome(state.page);
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

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
