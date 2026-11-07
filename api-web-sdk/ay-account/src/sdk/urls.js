import { PRODUCE } from "./produce.js";

import { ONLINE_BASE, API_BASE } from "../shared/config/api.js";
export { ONLINE_BASE, API_BASE };

export const SCRIPT_URL = (() => {
    try {
        const src = document.currentScript && document.currentScript.src;
        return src
            ? new URL(src, document.baseURI)
            : new URL("/lib/ay-account/main.js", document.baseURI);
    } catch {
        return new URL("/lib/ay-account/main.js", document.baseURI);
    }
})();

export const STATIC_ORIGIN = PRODUCE ? ONLINE_BASE : SCRIPT_URL.origin;
export const MODAL_URL = PRODUCE
    ? `${ONLINE_BASE}/lib/ay-account/login.html`
    : new URL("login.html", SCRIPT_URL).href;
export const MODAL_ORIGIN = new URL(MODAL_URL).origin;
export const GT4_URL = new URL("/lib/gt4.js", STATIC_ORIGIN).href;

export const URLPATH = {
    BASE: API_BASE,
    API: {
        REGISTER: "/api/ayonline/register",
        REGISTER_START: "/api/ayonline/register/verification/start",
        REGISTER_QUERY: "/api/ayonline/register/verification/query",
        LOGIN: "/api/ayonline/login",
        LOGOUT: "/api/ayonline/logout",
        TEST: "/api/ayonline/test",
        VERIFY: "/api/ayonline/verify",
        REFRESH: "/api/ayonline/refresh",
        CHANGEPASSWORD: "/api/ayonline/change-password",
        SENDMAILCODE: "/api/ayonline/send-verification",
    },
    MODALPAGE: {
        PAGE: MODAL_URL,
        LOGIN_YZH_OAUTH: "/api/auth/yzhyzxy/start?mode=login",
        LOGIN_GITHUB_OAUTH: "/api/auth/github/start?mode=login",
    },
    LIBRARY: { GT4: GT4_URL },
};
