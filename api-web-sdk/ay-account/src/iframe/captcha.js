import { t } from "./i18n.js";
import { utf8ToBase64 } from "../shared/utils/base64.js";
import { getGeetestLang } from "../shared/utils/geetest-lang.js";
import { loadScript } from "../shared/utils/script.js";
import { removeUselessTestLogo } from "../shared/utils/geetest-logo.js";

export async function ensureGeetest() {
    if (typeof window.initGeetest4 === "function") return;
    await loadScript("/lib/gt4.js");
    if (typeof window.initGeetest4 !== "function") {
        throw new Error("Geetest4 not loaded");
    }
}

export async function showGeetest(gtCode) {
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
                        if (typeof captcha.showBox === "function")
                            captcha.showBox();
                    })
                    .onSuccess(() => {
                        const result = captcha.getValidate();
                        if (!result) {
                            cleanup();
                            reject(
                                new Error(t("common.complete_verification")),
                            );
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
