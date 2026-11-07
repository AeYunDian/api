import { VERSION } from "../shared/config/version.js";
import { OAUTH_PROVIDER_ENABLED } from "../shared/config/oauth.js";
import { ALLOWED_EMAIL_DOMAINS } from "../shared/config/email-domains.js";
import { BUILTIN_TRANSLATIONS } from "../shared/i18n/index.js";
import { DEFAULT_WINDOW_CONFIG } from "./window-defaults.js";
import { AyToast } from "./toast.js";
import { openModal } from "./modal.js";
import { URLPATH, API_BASE, GT4_URL, MODAL_ORIGIN } from "./urls.js";
import { API_ORIGIN } from "../shared/config/api.js";
import {
    isPlainObject,
    normalizeTheme,
    utf8ToBase64,
    loadScript,
    getGeetestLang,
    removeUselessTestLogo,
    delay,
} from "./utils.js";

export class AyAccount {
    constructor(config) {
        if (!config) throw new Error("[AyAccountSDK] config is required");

        const priv = { appId: config.appId || "default" };
        this._private = priv;
        this._iframe = null;
        this._iframeContainer = null;
        this._messageHandler = null;
        this._modalPromise = null;
        this._modalResolve = null;
        this._modalInline = false;
        this._modalSheet = false;
        this._modalSheetEl = null;
        this._modalConfig = null;
        this._oauthPopup = null;
        this._loadingToastTimer = null;
        this._toast = new AyToast();
        this.toast = this._toast;
        this.theme = normalizeTheme(config.theme);

        let lang = "zh-cn";
        let fallbackLang = "zh-cn";
        let translations = {};

        const i18n = config.i18n;
        if (typeof i18n === "string") {
            lang = i18n;
        } else if (isPlainObject(i18n)) {
            lang = i18n.lang || "zh-cn";
            fallbackLang = i18n.fallbackLang || "zh-cn";
            translations = i18n.translations || {};
        }

        if (!BUILTIN_TRANSLATIONS[fallbackLang]) {
            console.warn(
                `[AyAccountSDK] Unsupported fallback language "${fallbackLang}", fallback to "zh-cn"`,
            );
            fallbackLang = "zh-cn";
        }

        this.lang = lang;
        this.fallbackLang = fallbackLang;
        this.translations = translations;

        console.info(
            `%c AyAccountSDK %c v${VERSION} `,
            "padding: 2px 6px; border-radius: 3px 0 0 3px; color: #fff; background: #00aaff; font-weight: bold;",
            "padding: 2px 6px; border-radius: 0 3px 3px 0; color: #fff; background: #00ccff; font-weight: bold;",
        );
    }

    _t(key) {
        const currentCustom = this.translations[this.lang];
        if (currentCustom && currentCustom[key] !== undefined) {
            return currentCustom[key];
        }
        const currentBuiltin = BUILTIN_TRANSLATIONS[this.lang];
        if (currentBuiltin && currentBuiltin[key] !== undefined) {
            return currentBuiltin[key];
        }
        const fallbackCustom = this.translations[this.fallbackLang];
        if (fallbackCustom && fallbackCustom[key] !== undefined) {
            return fallbackCustom[key];
        }
        const fallbackBuiltin = BUILTIN_TRANSLATIONS[this.fallbackLang];
        if (fallbackBuiltin && fallbackBuiltin[key] !== undefined) {
            return fallbackBuiltin[key];
        }
        return key;
    }

    _getFullTranslationMap() {
        const allKeys = new Set();
        const collect = (obj) => {
            if (obj) Object.keys(obj).forEach((key) => allKeys.add(key));
        };
        collect(BUILTIN_TRANSLATIONS[this.lang]);
        collect(BUILTIN_TRANSLATIONS[this.fallbackLang]);
        collect(this.translations[this.lang]);
        collect(this.translations[this.fallbackLang]);
        const map = {};
        allKeys.forEach((key) => {
            map[key] = this._t(key);
        });
        return map;
    }

    updateI18n(options) {
        if (!options) return;
        if (options.lang !== undefined) this.lang = options.lang;
        if (options.fallbackLang !== undefined) {
            if (!BUILTIN_TRANSLATIONS[options.fallbackLang]) {
                console.warn(
                    `[AyAccountSDK] Unsupported fallback language "${options.fallbackLang}", ignoring.`,
                );
            } else {
                this.fallbackLang = options.fallbackLang;
            }
        }
        if (options.translations !== undefined) {
            this.translations = {
                ...this.translations,
                ...options.translations,
            };
        }
        const translationMap = this._getFullTranslationMap();
        this._postToIframe({
            action: "updateTranslations",
            payload: translationMap,
        });
        this._postToIframe({ action: "changeLanguage" });
        this._postToIframe({
            action: "configWindow",
            config: {
                lang: this.lang,
                theme: this.theme,
                translations: translationMap,
            },
        });
        if (this._modalConfig) {
            this._modalConfig.lang = this.lang;
            this._modalConfig.translations = translationMap;
        }
    }

    changeLanguage(lang) {
        this.updateI18n({ lang });
    }

    setTheme(theme) {
        this.theme = normalizeTheme(theme);
        this._postToIframe({
            action: "configWindow",
            config: { theme: this.theme },
        });
    }

    getTheme() {
        return this.theme;
    }

    _postToIframe(message) {
        if (!this._iframe || !this._iframe.contentWindow) return;
        this._iframe.contentWindow.postMessage(
            JSON.stringify(message),
            MODAL_ORIGIN,
        );
    }

    async _request(path, options = {}) {
        const url = `${API_BASE}${path}`;
        const { body, headers, ...rest } = options;
        const fetchOptions = {
            credentials: "include",
            ...rest,
            headers: {
                "Content-Type": "application/json",
                "X-App-Id": this._private.appId,
                "X-SDK-VER": VERSION,
                "X-App-Ver": VERSION,
                ...(headers || {}),
            },
        };
        if (body !== undefined) fetchOptions.body = JSON.stringify(body);

        try {
            const response = await fetch(url, fetchOptions);
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                const errorCode = data.error_code || data.code || "unknown";
                const rawMessage = data.error || data.message || "";
                const banReason = data.ban_reason || "";
                let message = rawMessage;
                if (errorCode !== undefined) {
                    if (errorCode === 1017) {
                        const baseMsg = this._t("error.1017");
                        message = banReason
                            ? `${baseMsg}: ${banReason}`
                            : baseMsg;
                    } else {
                        const key = `error.${errorCode}`;
                        const translated = this._t(key);
                        if (translated !== key) message = translated;
                        else if (!message)
                            message = this._t("common.unknown_error");
                    }
                } else {
                    message = this._t("common.unknown_error");
                }
                const err = new Error(message);
                err.error_code = errorCode || "unknown";
                err.response = response;
                err.data = data;
                throw err;
            }
            return data;
        } catch (error) {
            if (error instanceof Error && !error.error_code) {
                const err = new Error(this._t("common.network_error"));
                err.error_code = "network_error";
                err.originalError = error;
                throw err;
            }
            throw error;
        }
    }

    async _ensureGeetest() {
        if (typeof window.initGeetest4 === "function") return;
        await loadScript(GT4_URL);
        if (typeof window.initGeetest4 !== "function") {
            throw new Error(
                `${this._t("common.unknown_error")}: Geetest4 not loaded`,
            );
        }
    }

    async _showGeetest(gtCode) {
        await this._ensureGeetest();
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
                    language: getGeetestLang(this.lang),
                },
                (captcha) => {
                    instance = captcha;
                    captcha
                        .onReady(() => {
                            removeUselessTestLogo();
                            if (typeof captcha.showBox === "function")
                                captcha.showBox();
                        })
                        .onSuccess(() => {
                            const result = captcha.getValidate();
                            if (!result) {
                                cleanup();
                                reject(
                                    new Error(
                                        this._t("common.complete_verification"),
                                    ),
                                );
                                return;
                            }
                            result.captcha_id = gtCode;
                            const payload = utf8ToBase64(
                                JSON.stringify(result),
                            );
                            cleanup();
                            resolve(payload);
                        })
                        .onError(() => {
                            cleanup();
                            reject(new Error("Geetest Error"));
                        })
                        .onClose(() => {
                            cleanup();
                            const err = new Error(this._t("error.1024"));
                            err.error_code = 1024;
                            reject(err);
                        });
                },
            );
        });
    }

    async _withCaptcha(run) {
        try {
            return await run(null);
        } catch (err) {
            if (
                Number(err && err.error_code) === 1023 &&
                err.data &&
                err.data.gt_code
            ) {
                const gt = await this._showGeetest(err.data.gt_code);
                return run(gt);
            }
            throw err;
        }
    }

    _openModal(mode, config) {
        return openModal(this, mode, config);
    }

    _animateOut() {
        const el = this._iframeContainer;
        if (!el || this._modalInline) return Promise.resolve();
        if (this._modalSheet && this._modalSheetEl) {
            this._modalSheetEl.style.transform = "translateY(100%)";
            return delay(320).then(() => {
                el.style.opacity = "0";
                return delay(200);
            });
        }
        el.style.transition = "opacity 200ms cubic-bezier(0.2, 0, 0, 1)";
        el.style.opacity = "0";
        return delay(200);
    }

    _showLoadingToast() {
        this._hideLoadingToast();
        this._toast.loading(this._t("loading"));
        this._loadingToastTimer = setTimeout(() => {
            this._loadingToastTimer = null;
            this._toast.hide();
        }, 20000);
    }

    _hideLoadingToast() {
        if (this._loadingToastTimer) {
            clearTimeout(this._loadingToastTimer);
            this._loadingToastTimer = null;
        }
        this._toast.hide();
    }

    _closeModal() {
        if (!this._modalInline && document.body) {
            document.body.style.overflow = "";
        }
        this._modalInline = false;
        this._modalSheet = false;
        this._modalSheetEl = null;
        if (this._oauthPopup && !this._oauthPopup.closed) {
            try {
                this._oauthPopup.close();
            } catch {
                /* ignore */
            }
        }
        this._oauthPopup = null;
        if (this._iframeContainer && this._iframeContainer.parentNode) {
            this._iframeContainer.parentNode.removeChild(this._iframeContainer);
        }
        if (this._messageHandler) {
            window.removeEventListener("message", this._messageHandler);
            this._messageHandler = null;
        }
        this._iframe = null;
        this._iframeContainer = null;
        this._modalConfig = null;
        this._hideLoadingToast();
    }

    async close() {
        if (!this._iframe) return;
        this._postToIframe({ action: "beforeClose" });
        await this._animateOut();
        const resolve = this._modalResolve;
        this._modalResolve = null;
        this._modalReject = null;
        this._closeModal();
        if (resolve) resolve(null);
    }

    _loginWithOAuthPopup(provider) {
        const self = this;
        if (
            !Object.prototype.hasOwnProperty.call(
                OAUTH_PROVIDER_ENABLED,
                provider,
            )
        ) {
            return Promise.reject(new Error("Unsupported provider"));
        }
        const endpoint = `/api/auth/${provider}/start?mode=login`;

        return new Promise((resolve, reject) => {
            fetch(`${API_BASE}${endpoint}`, { credentials: "include" })
                .then((res) => {
                    if (!res.ok) throw new Error(self._t("error.1034"));
                    return res.json();
                })
                .then((data) => {
                    if (!data.url) throw new Error(self._t("error.1034"));
                    const width = (screen.availWidth / 4) * 3;
                    const height = (screen.availHeight / 4) * 3;
                    const left = (screen.availWidth - width) / 2;
                    const top = (screen.availHeight - height) / 2;
                    const popup = window.open(
                        data.url,
                        `${provider}_login`,
                        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`,
                    );
                    if (!popup) throw new Error(self._t("error.1035"));
                    self._oauthPopup = popup;

                    const finish = (fn) => {
                        window.removeEventListener("message", handler);
                        clearInterval(checkClosed);
                        clearTimeout(timeout);
                        if (popup && !popup.closed) popup.close();
                        self._oauthPopup = null;
                        fn();
                    };

                    const handler = (event) => {
                        if (event.origin !== API_ORIGIN) return;
                        if (!event.data) return;
                        if (
                            event.data.action === "login_success" &&
                            event.data.provider === provider
                        ) {
                            finish(() =>
                                resolve({
                                    action: "login",
                                    success: true,
                                    code: 200,
                                    user: event.data.user,
                                }),
                            );
                        } else if (event.data.action === "login_fail") {
                            finish(() =>
                                reject(new Error(self._t("error.1036"))),
                            );
                        }
                    };
                    window.addEventListener("message", handler);
                    const checkClosed = setInterval(() => {
                        if (!popup.closed) return;
                        finish(() => reject(new Error(self._t("error.1038"))));
                    }, 500);
                    const timeout = setTimeout(() => {
                        finish(() => reject(new Error(self._t("error.1039"))));
                    }, 600000);
                })
                .catch((err) => reject(err));
        });
    }

    register(config = DEFAULT_WINDOW_CONFIG) {
        return this._openModal("register", config);
    }
    login(config = DEFAULT_WINDOW_CONFIG) {
        return this._openModal("login", config);
    }

    async _sendEmailCode(email, action = "register") {
        const allowed = ALLOWED_EMAIL_DOMAINS.some((domain) =>
            String(email || "").endsWith(domain),
        );
        if (!allowed) throw new Error(this._t("error.1026"));
        return this._request(URLPATH.API.SENDMAILCODE, {
            method: "POST",
            body: { email, action },
        });
    }

    async _startRegisterVerification(email) {
        const allowed = ALLOWED_EMAIL_DOMAINS.some((domain) =>
            String(email || "").endsWith(domain),
        );
        if (!allowed) throw new Error(this._t("error.1026"));
        return this._withCaptcha((gt) =>
            this._request(URLPATH.API.REGISTER_START, {
                method: "POST",
                body: { email, ...(gt ? { gt } : {}) },
            }),
        );
    }

    _queryRegisterVerification(verifyRequestId, email) {
        return this._request(URLPATH.API.REGISTER_QUERY, {
            method: "POST",
            body: { requestId: verifyRequestId, email },
        });
    }

    _completeRegistration(payload) {
        return this._request(URLPATH.API.REGISTER, {
            method: "POST",
            body: payload || {},
        });
    }

    async _register(username, email, password, code, token) {
        return this._withCaptcha((gt) =>
            this._request(URLPATH.API.REGISTER, {
                method: "POST",
                body: {
                    username,
                    email,
                    password,
                    emailToken: token,
                    emailCode: code,
                    ...(gt ? { gt } : {}),
                },
            }),
        );
    }

    async _login(usernameOrEmail, password) {
        return this._withCaptcha((gt) =>
            this._request(URLPATH.API.LOGIN, {
                method: "POST",
                body: {
                    username: usernameOrEmail,
                    email: usernameOrEmail,
                    password,
                    ...(gt ? { gt } : {}),
                },
            }),
        );
    }

    logout() {
        return this._request(URLPATH.API.LOGOUT, { method: "POST" });
    }

    async testServer() {
        try {
            await this._request(URLPATH.API.TEST, { method: "POST" });
            return { success: true };
        } catch (err) {
            return { success: false, err };
        }
    }

    verify() {
        return this._request(URLPATH.API.VERIFY, { method: "GET" });
    }

    refresh() {
        return this._request(URLPATH.API.REFRESH, { method: "POST" });
    }

    async changePassword(oldPassword, newPassword) {
        return this._withCaptcha((gt) =>
            this._request(URLPATH.API.CHANGEPASSWORD, {
                method: "POST",
                body: {
                    oldPassword,
                    newPassword,
                    ...(gt ? { gt } : {}),
                },
            }),
        );
    }
}

export function createAyAccount(config) {
    return new AyAccount(config);
}
