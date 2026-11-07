export { API_BASE } from "../shared/config/api.js";

export const API = {
    LOGIN: "/api/ayonline/login",
    REGISTER: "/api/ayonline/register",
    REGISTER_START: "/api/ayonline/register/verification/start",
    REGISTER_QUERY: "/api/ayonline/register/verification/query",
    SENDMAILCODE: "/api/ayonline/send-verification",
};
export {
    OAUTH_NO_EMAIL,
    OAUTH_PROVIDER_ENABLED,
} from "../shared/config/oauth.js";
