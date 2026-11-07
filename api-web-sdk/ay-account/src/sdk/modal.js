import { DEFAULT_WINDOW_CONFIG } from "./window-defaults.js";
import { URLPATH, API_BASE, MODAL_ORIGIN } from "./urls.js";
import { VERSION } from "../shared/config/version.js";
import { PRODUCE } from "./produce.js";
import { OAUTH_PROVIDER_ENABLED } from "../shared/config/oauth.js";
import {
    normalizeTheme,
    normalizeEnterAnimation,
    normalizeCustomStyle,
} from "./utils.js";

export function openModal(sdk, mode, config = DEFAULT_WINDOW_CONFIG) {
    if (sdk._iframe) {
        throw new Error(
            sdk._t("error.modal_already_open") || "Modal already open",
        );
    }

    const opts = { ...DEFAULT_WINDOW_CONFIG, ...(config || {}) };
    const theme = normalizeTheme(opts.theme || sdk.theme);
    const openLang = opts.lang || sdk.lang;
    const only =
        opts.only === "login" || opts.only === "register" ? opts.only : null;
    const initialMode = only || (mode === "register" ? "register" : "login");
    const isMobileSheet =
        window.matchMedia &&
        (window.matchMedia("(max-width: 720px)").matches ||
            (window.matchMedia("(pointer: coarse)").matches &&
                window.innerWidth <= 1024));
    const isMobileUI = Boolean(
        window.matchMedia && window.matchMedia("(max-width: 720px)").matches,
    );
    const enterAnimation = normalizeEnterAnimation(
        opts.enter !== undefined
            ? opts.enter
            : opts.enterAnimation !== undefined
              ? opts.enterAnimation
              : opts.animation,
        isMobileUI,
    );
    sdk.theme = theme;
    sdk.lang = openLang;

    return new Promise((resolve, reject) => {
        const target =
            typeof opts.container === "string"
                ? document.querySelector(opts.container)
                : opts.container;
        const inline = Boolean(
            target && typeof target.appendChild === "function",
        );
        const fill = inline
            ? (opts.fill !== undefined ? opts.fill : opts.fullSize) !== false
            : (opts.fill !== undefined ? opts.fill : opts.fullSize) === true;
        const customStyle = normalizeCustomStyle(opts.style);
        const showLoadingToast =
            opts.loadingToast === undefined || opts.loadingToast === null
                ? !inline
                : Boolean(opts.loadingToast);
        if (showLoadingToast) sdk._showLoadingToast();

        if (!inline && document.body) document.body.style.overflow = "hidden";

        const iframediv = document.createElement("div");
        iframediv.className = inline ? "ay-account-inline" : "ay-account-modal";

        const iframe = document.createElement("iframe");
        iframe.title = "AyAccount";
        iframe.setAttribute("allow", "clipboard-write");
        iframe.textContent = "";
        const modalUrl = new URL(URLPATH.MODALPAGE.PAGE);
        modalUrl.searchParams.set("tab", initialMode);
        modalUrl.searchParams.set("mode", inline ? "inline" : "full");
        modalUrl.searchParams.set("theme", theme);
        modalUrl.searchParams.set("lang", openLang);
        modalUrl.searchParams.set("only", only || "");
        modalUrl.searchParams.set("fill", fill ? "1" : "0");
        modalUrl.searchParams.set("enter", enterAnimation);
        if (PRODUCE) modalUrl.searchParams.set("min", "1");
        modalUrl.searchParams.set("v", VERSION);

        let sheet = null;

        if (inline) {
            if (window.getComputedStyle(target).position === "static") {
                target.style.position = "relative";
            }
            target.style.overflow = "hidden";
            iframediv.style.position = "relative";
            iframediv.style.width = "100%";
            iframediv.style.height = opts.height || "100%";
            iframediv.style.minHeight = opts.minHeight || "600px";
            iframediv.style.overflow = "hidden";
            iframediv.style.borderRadius = "inherit";

            iframe.style.position = "absolute";
            iframe.style.inset = "0";
            iframe.style.width = "100%";
            iframe.style.height = "100%";
            iframe.style.border = "none";
            iframe.style.backgroundColor = "transparent";
            iframe.style.display = "block";
        } else {
            const zIndex = String(opts.zIndex || 20000000);
            iframediv.style.position = "fixed";
            iframediv.style.inset = "0";
            iframediv.style.zIndex = zIndex;
            iframediv.style.overflow = "hidden";
            iframediv.style.backgroundColor =
                opts.scrim === false ? "transparent" : "rgba(0, 0, 0, 0.32)";
            iframediv.style.opacity = "0";
            iframediv.style.transition =
                "opacity 200ms cubic-bezier(0.2, 0, 0, 1)";
            iframediv.style.willChange = "opacity";

            sheet = document.createElement("div");
            sheet.style.position = "absolute";
            sheet.style.inset = "0";
            sheet.style.overflow = "hidden";
            sheet.style.backgroundColor = "transparent";
            if (isMobileSheet) {
                sheet.style.transform = "translateY(100%)";
                sheet.style.transition =
                    "transform 320ms cubic-bezier(0.2, 0, 0, 1)";
                sheet.style.willChange = "transform";
            }

            iframe.style.position = "absolute";
            iframe.style.inset = "0";
            iframe.style.width = "100%";
            iframe.style.height = "100%";
            iframe.style.border = "none";
            iframe.style.backgroundColor = "transparent";
            iframe.style.display = "block";
        }

        sdk._iframe = iframe;
        sdk._iframeContainer = iframediv;
        sdk._modalInline = inline;
        sdk._modalSheet = !inline && isMobileSheet;
        sdk._modalSheetEl = sheet;
        sdk._modalConfig = {
            appId: sdk._private.appId,
            sdkVersion: VERSION,
            apiBase: API_BASE,
            inline,
            theme,
            lang: openLang,
            hideOauthClient: !!opts.hideOauthClient,
            hideClose: !!opts.hideClose,
            hideFaq: !!opts.hideFaq,
            hideSwitch: !!opts.hideSwitch,
            only,
            fill,
            enterAnimation,
            customStyle,
            autoClose: opts.autoClose !== false,
            translations: sdk._getFullTranslationMap(),
        };

        let userInfo = null;

        const handler = async (event) => {
            if (event.source !== iframe.contentWindow) return;
            if (event.origin !== MODAL_ORIGIN) return;
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
                case "isReady":
                    sdk._hideLoadingToast();
                    sdk._postToIframe({
                        action: "updateTranslations",
                        payload: sdk._getFullTranslationMap(),
                    });
                    sdk._postToIframe({
                        action: "configWindow",
                        config: {
                            ...sdk._modalConfig,
                            translations: sdk._getFullTranslationMap(),
                        },
                    });
                    break;

                case "closeWindow":
                    sdk._postToIframe({ action: "beforeClose" });
                    await sdk._animateOut();
                    sdk._closeModal();
                    resolve(userInfo);
                    break;

                case "loginSuccess":
                    if (data.result) userInfo = data.result;
                    else if (data.user) userInfo = data.user;
                    break;

                case "registerSuccess":
                    if (data.result) userInfo = data.result;
                    else if (data.user) userInfo = data.user;
                    break;

                case "loginFailure":
                case "registerFailure":
                    break;

                case "oauth_login":
                    if (OAUTH_PROVIDER_ENABLED[data.provider] === true) {
                        sdk._loginWithOAuthPopup(data.provider)
                            .then((result) => {
                                userInfo = result;
                                sdk._postToIframe({
                                    action: "loginSuccess",
                                    user: result,
                                });
                            })
                            .catch((err) => {
                                sdk._postToIframe({
                                    action: "loginFailure",
                                    message:
                                        err.message ||
                                        sdk._t("common.login_failure"),
                                    code: err.error_code || "unknown",
                                });
                            });
                    }
                    break;

                case "sendEmailCode":
                    sdk._sendEmailCode(data.email)
                        .then((result) => {
                            sdk._postToIframe({
                                action: "sendEmailCodeSuccess",
                                token: result.token,
                            });
                        })
                        .catch((err) => {
                            sdk._postToIframe({
                                action: "sendEmailCodeFailure",
                                message:
                                    err.message ||
                                    sdk._t("common.send_email_code_failure"),
                                code: err.error_code || "unknown",
                            });
                        });
                    break;

                case "login":
                    sdk._login(data.username, data.password)
                        .then((result) => {
                            userInfo = result;
                            sdk._postToIframe({
                                action: "loginSuccess",
                                user: result,
                            });
                        })
                        .catch((err) => {
                            sdk._postToIframe({
                                action: "loginFailure",
                                message:
                                    err.message ||
                                    sdk._t("common.login_failure"),
                                code: err.error_code || "unknown",
                            });
                        });
                    break;

                case "registerStart":
                    sdk._startRegisterVerification(data.email)
                        .then((result) => {
                            sdk._postToIframe({
                                action: "registerStartSuccess",
                                messageId: data.messageId,
                                data: result,
                            });
                        })
                        .catch((err) => {
                            sdk._postToIframe({
                                action: "registerStartFailure",
                                messageId: data.messageId,
                                message:
                                    err.message ||
                                    sdk._t("common.register_failure"),
                                code: err.error_code || "unknown",
                            });
                        });
                    break;

                case "registerQuery":
                    sdk._queryRegisterVerification(
                        data.verifyRequestId,
                        data.email,
                    )
                        .then((result) => {
                            sdk._postToIframe({
                                action: "registerQuerySuccess",
                                messageId: data.messageId,
                                data: result,
                            });
                        })
                        .catch((err) => {
                            sdk._postToIframe({
                                action: "registerQueryFailure",
                                messageId: data.messageId,
                                message:
                                    err.message ||
                                    sdk._t("common.network_error"),
                                code: err.error_code || "unknown",
                            });
                        });
                    break;

                case "registerComplete":
                    sdk._completeRegistration(data.payload)
                        .then((result) => {
                            sdk._postToIframe({
                                action: "registerCompleteSuccess",
                                messageId: data.messageId,
                                data: result,
                            });
                        })
                        .catch((err) => {
                            sdk._postToIframe({
                                action: "registerCompleteFailure",
                                messageId: data.messageId,
                                message:
                                    err.message ||
                                    sdk._t("common.register_failure"),
                                code: err.error_code || "unknown",
                            });
                        });
                    break;

                case "register":
                    sdk._register(
                        data.username,
                        data.email,
                        data.password,
                        data.code,
                        data.token,
                    )
                        .then((result) => {
                            userInfo = result;
                            sdk._postToIframe({
                                action: "registerSuccess",
                                result,
                            });
                        })
                        .catch((err) => {
                            sdk._postToIframe({
                                action: "registerFailure",
                                message:
                                    err.message ||
                                    sdk._t("common.register_failure"),
                                code: err.error_code || "unknown",
                            });
                        });
                    break;

                case "getTranslation": {
                    const key = data.key;
                    sdk._postToIframe({
                        action: "translationResponse",
                        key,
                        value: sdk._t(key),
                    });
                    break;
                }

                default:
                    break;
            }
        };

        sdk._messageHandler = handler;
        window.addEventListener("message", handler);
        iframe.src = modalUrl.href;
        if (inline) {
            target.appendChild(iframediv);
            iframediv.appendChild(iframe);
        } else {
            sheet.appendChild(iframe);
            iframediv.appendChild(sheet);
            document.body.appendChild(iframediv);
            requestAnimationFrame(() => {
                iframediv.style.opacity = "1";
                if (isMobileSheet) {
                    setTimeout(() => {
                        sheet.style.transform = "translateY(0)";
                    }, 220);
                }
            });
        }

        sdk._modalResolve = resolve;
        sdk._modalReject = reject;
    }).then((value) => {
        sdk._modalResolve = null;
        sdk._modalReject = null;
        return value;
    });
}
