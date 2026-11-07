import { API_BASE } from "./constants.js";
import { state } from "./state.js";
import { t, hasT } from "./i18n.js";
import { showGeetest } from "./captcha.js";

export function makeApiError(data, status) {
    const code = data && (data.error_code || data.code);
    let message;
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

export async function apiRequest(path, options = {}) {
    const { body, method = "POST", headers = {} } = options;
    const response = await fetch(`${API_BASE}${path}`, {
        method,
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "X-App-Id": state.config.appId || "default",
            "X-SDK-VER": state.config.sdkVersion || "3.2.2",
            "X-App-Ver": state.config.sdkVersion || "3.2.2",
            ...headers,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw makeApiError(data, response.status);
    return data;
}

export async function withCaptcha(run) {
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
