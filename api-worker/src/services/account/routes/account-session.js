// account-session.js —— 由 account-api.js 拆分而来（逐行搬运，未改逻辑）

import { corsHeaders, jsonResponse } from "../http.js";
import { handleVerifyCode } from "../mail_verify/verify.js";
import {
  CHANGE_EMAIL_TEMPLATE,
  ACTION as EMAIL_ACTION,
  LOGIN_TEMPLATE,
  REG_TEMPLATE,
  handleSendVerification,
} from "../mail_verify/send.js";
import { signAccessToken, verifyAccessToken } from "../auth/jwt.js";
import { getKv } from "../auth/kv.js";
import {
  deleteRefreshToken,
  getUserIdFromRefreshToken,
  storeRefreshToken,
} from "../auth/tokens.js";
import { authenticateUser, changePassword, registerUser } from "../users.js";
import { hmacSha256 } from "../auth/crypto.js";
import { parse, serialize } from "cookie";
import { base64ToUtf8, generateToken } from "../../../shared/utils.js";
import {
  REFRESH_TOKEN_TTL,
  VERIFY_CODE_EXPDATA,
  allowedEmailDomains,
} from "../config.js";
import { ERROR_CODES } from "../../../shared/error-codes.js";
import { isAfterLegacyCutoff, parseClientVersion } from "../auth/version.js";
import {
  queryRegisterVerification,
  startRegisterVerification,
} from "../mail_verify/register-verification.js";
import { handleNewRegistration } from "./register-new.js";

function sdkOutdated(cors, action = "register") {
  return jsonResponse(
    {
      action,
      error: "Client SDK version is outdated, please upgrade",
      error_code: ERROR_CODES.SDK_VERSION_OUTDATED,
    },
    500,
    cors,
  );
}

export async function handleSessionRoutes({
  request,
  env,
  url,
  path,
  method,
  cors,
}) {
  if (path === "/api/ayonline/send-verification" && method === "POST") {
    if (isAfterLegacyCutoff()) {
      return jsonResponse(
        {
          error: "Client SDK version is outdated, please upgrade",
          error_code: ERROR_CODES.SDK_VERSION_OUTDATED,
        },
        500,
        cors,
      );
    }
    const body = await request.json().catch(() => null);
    if (!body || !body.email || !body.action) {
      return jsonResponse(
        {
          error: "Email or action required",
          error_code: ERROR_CODES.INVALID_ACTION,
        },
        400,
        cors,
      );
    }
    const actionMap = {
      login: EMAIL_ACTION.LOGIN,
      register: EMAIL_ACTION.REGISTER,
      change_email: EMAIL_ACTION.CHANGE_EMAIL,
    };
    const templateMap = {
      login: LOGIN_TEMPLATE,
      register: REG_TEMPLATE,
      change_email: CHANGE_EMAIL_TEMPLATE,
    };

    const action = actionMap[body.action];
    const selectedTemplate = templateMap[body.action];

    if (!action || !selectedTemplate) {
      return jsonResponse(
        { error: "Invalid action", error_code: ERROR_CODES.INVALID_ACTION },
        400,
        cors,
      );
    }
    if (!allowedEmailDomains.some((domain) => body.email.endsWith(domain))) {
      return jsonResponse(
        {
          error: "Unsupported email domain",
          error_code: ERROR_CODES.UNSUPPORTED_EMAIL_DOMAIN,
        },
        400,
        cors,
      );
    }
    const result = await handleSendVerification(
      env,
      body.email,
      VERIFY_CODE_EXPDATA,
      "AyService",
      selectedTemplate,
      action,
    );
    if (result.msg === "OK") {
      return jsonResponse({ token: result.token }, 200, cors);
    } else {
      // 映射错误信息
      const msgMap = {
        EMAIL_REQUIRED: "Email required",
        CONFIG_ERROR: "Server config error",
        FAILED_SEND_EMAIL: "Failed to send email",
        INVALID_RESPONSE: "Mail service error",
        ERR429: "Too frequent",
        ERR500: "Send mail server down",
      };
      const codeMap = {
        EMAIL_REQUIRED: 1029,
        CONFIG_ERROR: 1030,
        FAILED_SEND_EMAIL: 1032,
        INVALID_RESPONSE: 1031,
        ERR429: 1027,
        ERR500: 1033,
      };
      return jsonResponse(
        {
          error: msgMap[result.msg] || "Unknown error",
          error_code: codeMap[result.msg] || 1028,
        },
        500,
        cors,
      );
    }
  }

  if (
    path === "/api/ayonline/register/verification/start" &&
    method === "POST"
  ) {
    const client = parseClientVersion(request);
    if (client.isLegacy) return sdkOutdated(cors);

    const body = await request.json().catch(() => null);
    const email =
      body && typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return jsonResponse(
        {
          action: "register",
          error: "Invalid email",
          error_code: ERROR_CODES.INVALID_EMAIL,
        },
        400,
        cors,
      );
    }
    if (!allowedEmailDomains.some((domain) => email.endsWith(domain))) {
      return jsonResponse(
        {
          action: "register",
          error: "Unsupported email domain",
          error_code: ERROR_CODES.UNSUPPORTED_EMAIL_DOMAIN,
        },
        400,
        cors,
      );
    }

    const result = await startRegisterVerification(env, email, body.gt);
    if (!result.ok) {
      return jsonResponse(
        { action: "register", ...result.payload },
        result.status,
        cors,
      );
    }
    return jsonResponse(
      { action: "register", success: true, ...result.data },
      200,
      cors,
    );
  }

  if (
    path === "/api/ayonline/register/verification/query" &&
    method === "POST"
  ) {
    const client = parseClientVersion(request);
    if (client.isLegacy) return sdkOutdated(cors);

    const body = await request.json().catch(() => null);
    const requestId =
      body && typeof body.requestId === "string" ? body.requestId.trim() : "";
    const email =
      body && typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";
    if (!requestId || !email) {
      return jsonResponse(
        {
          action: "register",
          error: "requestId and email required",
          error_code: ERROR_CODES.MISSING_PARAMS,
        },
        400,
        cors,
      );
    }
    const result = await queryRegisterVerification(env, requestId, email);
    return jsonResponse({ action: "register", ...result }, 200, cors);
  }

  if (path === "/api/ayonline/register" && method === "POST") {
    const client = parseClientVersion(request);
    if (!client.isLegacy) {
      const body = await request.json().catch(() => null);
      return handleNewRegistration(body, env, cors);
    }
    if (isAfterLegacyCutoff()) return sdkOutdated(cors);
    const body = await request.json().catch(() => null);
    if (
      !body ||
      !body.username ||
      !body.password ||
      !body.email ||
      !body.emailToken ||
      !body.emailCode
    ) {
      return jsonResponse(
        {
          error: "Missing required fields",
          error_code: ERROR_CODES.MISSING_PARAMS,
        },
        400,
        cors,
      );
    }
    if (!allowedEmailDomains.some((domain) => body.email.endsWith(domain)))
      return jsonResponse(
        {
          action: "register",
          error: "Invalid email",
          error_code: ERROR_CODES.INVALID_EMAIL,
        },
        400,
        cors,
      );
    if (body.gt) {
      const verifyResult = await handleVerifyCode(
        body.emailCode,
        body.emailToken,
        env,
      );
      if (!verifyResult.valid) {
        return jsonResponse(
          {
            action: "register",
            error: verifyResult.error || "Invalid or expired verification code",
            error_code: ERROR_CODES.INVALID_VERIFICATION_CODE,
          },
          400,
          cors,
        );
      }
      let gt;
      try {
        const jsonStr = base64ToUtf8(body.gt);
        gt = JSON.parse(jsonStr);
      } catch {
        gt = null;
      } //客户传来的是base64编码的json文本
      if (gt === null) {
        return jsonResponse(
          {
            action: "register",
            error: "Missing required fields",
            error_code: ERROR_CODES.MISSING_PARAMS,
          },
          400,
          cors,
        );
      }
      const prikey = JSON.parse(env.GTCODEMAP)[gt.captcha_id];

      if (!prikey) {
        return jsonResponse(
          {
            action: "register",
            code: 400,
            message: "id is not in id pools ",
            error_code: ERROR_CODES.GEETEST_INVALID_CAPTCHA_ID,
          },
          400,
          cors,
        );
      }
      const sign_token = await hmacSha256(prikey, gt.lot_number);
      const query = Object.assign(gt, { sign_token });
      if (env.DEBUG) console.debug(gt);
      const validateUrl = new URL("https://gcaptcha4.geetest.com/validate");
      validateUrl.search = new URLSearchParams(query).toString();
      // 上游校验通过之前的异常才算验证码侧故障(1020)；
      // 通过之后的业务异常要冒泡到上层(1018)并打印真实堆栈。
      let gtPassed = false;
      try {
        const geetestRes = await fetch(validateUrl);
        const raw = await geetestRes.text();
        let geetestData = null;
        try {
          geetestData = JSON.parse(raw);
        } catch {
          /* 非 JSON，下面按上游异常处理 */
        }
        if (!geetestData) {
          console.error(
            "[geetest] 上游返回非 JSON",
            geetestRes.status,
            String(raw).slice(0, 300),
          );
          throw new Error("GeeTest returned non-JSON response");
        }
        gtPassed = true;
        if (geetestData.result === "success") {
          const result = await registerUser(
            env.db,
            body.username,
            body.email,
            body.password,
          );
          if (!result.success) {
            return jsonResponse(
              {
                action: "register",
                error: result.message,
                error_code: result.error_code,
              },
              result.code,
              cors,
            );
          }
          return jsonResponse(
            {
              action: "register",
              success: true,
              message: result.message,
              code: 200,
            },
            201,
            cors,
          );
        } else {
          console.error("[geetest:register] 校验未通过", geetestData);
          return jsonResponse(
            {
              action: "register",
              error_code: ERROR_CODES.GEETEST_VERIFY_FAILED,
              message: "Verification failed",
            },
            400,
            cors,
          );
        }
      } catch (err) {
        if (gtPassed) throw err; // 已通过校验后的业务异常交给上层(1018)
        console.error("[geetest:register] 校验请求失败:", err && err.message);
        return jsonResponse(
          {
            action: "register",
            error_code: ERROR_CODES.GEETEST_ERROR,
            message: "GeeTest Server Error",
          },
          500,
          cors,
        );
      }
    } else {
      return jsonResponse(
        {
          action: "register",
          success: true,
          gt_code: JSON.parse(env.GTCODE)[0],
          message: "请求频繁，请稍后再试",
          error_code: ERROR_CODES.NEED_HUMAN_VERIFICATION,
        },
        429,
        cors,
      );
    }
  }

  if (path === "/api/ayonline/login" && method === "POST") {
    const body = await request.json().catch(() => null);
    if (!body || (!body.username && !body.email) || !body.password) {
      return jsonResponse(
        {
          action: "login",
          error_code: ERROR_CODES.MISSING_LOGIN_FIELDS,
          error: "Username/email and password required",
        },
        400,
        cors,
      );
    }
    if (body.gt) {
      let gt;
      try {
        const jsonStr = base64ToUtf8(body.gt);
        gt = JSON.parse(jsonStr);
      } catch {
        gt = null;
      } //客户传来的是base64编码的json文本
      if (gt === null) {
        return jsonResponse(
          {
            action: "login",
            error: "Missing required fields",
            error_code: ERROR_CODES.MISSING_PARAMS,
          },
          400,
          cors,
        );
      }
      const prikey = JSON.parse(env.GTCODEMAP)[gt.captcha_id];

      if (!prikey) {
        return jsonResponse(
          {
            action: "login",
            code: 400,
            message: "id is not in id pools ",
            error_code: ERROR_CODES.GEETEST_INVALID_CAPTCHA_ID,
          },
          400,
          cors,
        );
      }
      const sign_token = await hmacSha256(prikey, gt.lot_number);
      const query = Object.assign(gt, { sign_token });
      if (env.DEBUG) console.debug(gt);
      const validateUrl = new URL("https://gcaptcha4.geetest.com/validate");
      validateUrl.search = new URLSearchParams(query).toString();
      // 上游校验通过之前的异常才算验证码侧故障(1020)；
      // 通过之后的业务异常要冒泡到上层(1018)并打印真实堆栈。
      let gtPassed = false;
      try {
        const geetestRes = await fetch(validateUrl);
        const raw = await geetestRes.text();
        let geetestData = null;
        try {
          geetestData = JSON.parse(raw);
        } catch {
          /* 非 JSON，下面按上游异常处理 */
        }
        if (!geetestData) {
          console.error(
            "[geetest] 上游返回非 JSON",
            geetestRes.status,
            String(raw).slice(0, 300),
          );
          throw new Error("GeeTest returned non-JSON response");
        }
        gtPassed = true;
        if (geetestData.result === "success") {
          const login = body.username || body.email;
          const authResult = await authenticateUser(
            env.db,
            login,
            body.password,
          );
          if (!authResult.success) {
            return jsonResponse(
              {
                error: authResult.message,
                error_code: authResult.error_code,
              },
              authResult.code,
              cors,
            );
          }

          const user = authResult.user;
          if (user.banned === 1) {
            return jsonResponse(
              {
                action: "login",
                error_code: ERROR_CODES.ACCOUNT_BANNED,
                error: "Account banned",
                ban_reason: user.ban_reason || "",
              },
              403,
              cors,
            );
          }
          // email: user.email,
          //     banned: user.banned,
          //         ban_reason: user.ban_reason || "",
          //             gender: user.gender,
          //                 avatar: user.avatar,
          //                     description: user.description,
          // 生成访问令牌
          const accessToken = await signAccessToken(
            {
              sub: user.sub,
              username: user.username,
              email: user.email,
              gender: user.gender,
              avatar: user.avatar,
              description: user.description,
              created_at: user.created_at,
            },
            env.JWT_KEY,
          );
          // 生成刷新令牌
          const refreshToken = generateToken();
          await storeRefreshToken(
            getKv(),
            refreshToken,
            user.sub,
            REFRESH_TOKEN_TTL,
          );

          // 使用 cookie 库的 serialize 设置两个 Cookie
          const cookieOptions = {
            domain: ".undz.cn",
            path: "/",
            httpOnly: true,
            secure: true,
            sameSite: "Lax",
            maxAge: REFRESH_TOKEN_TTL,
          };
          const responseBody = {
            action: "login",
            success: true,
            code: 200,
            user: {
              sub: user.sub,
              username: user.username,
              email: user.email,
            },
          };

          const headers = new Headers(corsHeaders(request));
          headers.set("Content-Type", "application/json");
          headers.append(
            "Set-Cookie",
            serialize("access_token", accessToken, cookieOptions),
          );
          headers.append(
            "Set-Cookie",
            serialize("refresh_token", refreshToken, cookieOptions),
          );
          return new Response(JSON.stringify(responseBody), {
            status: 200,
            headers: headers,
          });
        } else {
          console.error("[geetest:login] 校验未通过", geetestData);
          return jsonResponse(
            {
              action: "login",
              error_code: ERROR_CODES.GEETEST_VERIFY_FAILED,
              message: "Verification failed",
            },
            400,
            cors,
          );
        }
      } catch (err) {
        if (gtPassed) throw err; // 已通过校验后的业务异常交给上层(1018)
        console.error("[geetest:login] 校验请求失败:", err && err.message);
        return jsonResponse(
          {
            action: "login",
            error_code: ERROR_CODES.GEETEST_ERROR,
            message: "GeeTest Server Error",
          },
          500,
          cors,
        );
      }
    } else {
      return jsonResponse(
        {
          action: "login",
          success: true,
          gt_code: JSON.parse(env.GTCODE)[1],
          message: "请求频繁，请稍后再试",
          error_code: ERROR_CODES.NEED_HUMAN_VERIFICATION,
        },
        429,
        cors,
      );
    }
  }

  if (path === "/api/ayonline/change-password" && method === "POST") {
    const cookies = parse(request.headers.get("Cookie") || "");
    const accessToken = cookies.access_token;
    if (!accessToken) {
      return jsonResponse(
        {
          action: "changePassword",
          error_code: ERROR_CODES.UNAUTHORIZED,
          error: "Unauthorized",
        },
        401,
        cors,
      );
    }
    const payload = await verifyAccessToken(accessToken, env.JWT_KEY);
    if (!payload) {
      return jsonResponse(
        {
          action: "changePassword",
          error_code: ERROR_CODES.INVALID_TOKEN,
          error: "Invalid or expired token",
        },
        401,
        cors,
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || !body.oldPassword || !body.newPassword) {
      return jsonResponse(
        {
          action: "changePassword",
          error_code: ERROR_CODES.MISSING_PASSWORD_FIELDS,
          error: "Missing oldPassword or newPassword",
        },
        400,
        cors,
      );
    }
    if (body.gt) {
      let gt;
      try {
        const jsonStr = base64ToUtf8(body.gt);
        gt = JSON.parse(jsonStr);
      } catch {
        gt = null;
      } //客户传来的是base64编码的json文本
      if (gt === null) {
        return jsonResponse(
          {
            action: "changePassword",
            error: "Missing required fields",
            error_code: ERROR_CODES.MISSING_PARAMS,
          },
          400,
          cors,
        );
      }
      const prikey = JSON.parse(env.GTCODEMAP)[gt.captcha_id];

      if (!prikey) {
        return jsonResponse(
          {
            action: "changePassword",
            code: 400,
            message: "id is not in id pools ",
            error_code: ERROR_CODES.GEETEST_INVALID_CAPTCHA_ID,
          },
          400,
          cors,
        );
      }
      const sign_token = await hmacSha256(prikey, gt.lot_number);
      const query = Object.assign(gt, { sign_token });
      if (env.DEBUG) console.debug(gt);
      const validateUrl = new URL("https://gcaptcha4.geetest.com/validate");
      validateUrl.search = new URLSearchParams(query).toString();
      // 上游校验通过之前的异常才算验证码侧故障(1020)；
      // 通过之后的业务异常要冒泡到上层(1018)并打印真实堆栈。
      let gtPassed = false;
      try {
        const geetestRes = await fetch(validateUrl);
        const raw = await geetestRes.text();
        let geetestData = null;
        try {
          geetestData = JSON.parse(raw);
        } catch {
          /* 非 JSON，下面按上游异常处理 */
        }
        if (!geetestData) {
          console.error(
            "[geetest] 上游返回非 JSON",
            geetestRes.status,
            String(raw).slice(0, 300),
          );
          throw new Error("GeeTest returned non-JSON response");
        }
        gtPassed = true;
        if (geetestData.result === "success") {
          const userId = parseInt(payload.sub, 10);
          const result = await changePassword(
            env.db,
            getKv(),
            userId,
            body.oldPassword,
            body.newPassword,
          );
          if (!result.success) {
            return jsonResponse(
              {
                action: "changePassword",
                error_code: result.error_code,
                error: result.message,
              },
              result.code,
              cors,
            );
          }

          // 清除当前设备的 Cookie（因为刷新令牌已被删除）
          const clearOptions = {
            domain: ".undz.cn",
            path: "/",
            httpOnly: true,
            secure: true,
            sameSite: "None",
            maxAge: 0,
          };
          const clearHeaders = [
            serialize("access_token", "", clearOptions),
            serialize("refresh_token", "", clearOptions),
          ];

          return jsonResponse(
            {
              action: "changePassword",
              success: true,
              message: result.message,
              code: 200,
            },
            200,
            {
              ...cors,
              "Set-Cookie": clearHeaders,
            },
          );
        } else {
          console.error("[geetest:changePassword] 校验未通过", geetestData);
          return jsonResponse(
            {
              action: "changePassword",
              error_code: ERROR_CODES.GEETEST_VERIFY_FAILED,
              message: "Verification failed",
            },
            400,
            cors,
          );
        }
      } catch (err) {
        if (gtPassed) throw err; // 已通过校验后的业务异常交给上层(1018)
        console.error(
          "[geetest:changePassword] 校验请求失败:",
          err && err.message,
        );
        return jsonResponse(
          {
            action: "changePassword",
            error_code: ERROR_CODES.GEETEST_ERROR,
            message: "GeeTest Server Error",
          },
          500,
          cors,
        );
      }
    } else {
      return jsonResponse(
        {
          action: "changePassword",
          success: true,
          gt_code: JSON.parse(env.GTCODE)[1],
          message: "请求频繁，请稍后再试",
          error_code: ERROR_CODES.NEED_HUMAN_VERIFICATION,
        },
        429,
        cors,
      );
    }
  }

  if (path === "/api/ayonline/logout" && method === "POST") {
    const cookies = parse(request.headers.get("Cookie") || "");
    const refreshToken = cookies.refresh_token;
    if (refreshToken) {
      await deleteRefreshToken(getKv(), refreshToken);
    }

    // 清除 Cookie（maxAge=0）
    const clearOptions = {
      domain: ".undz.cn",
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 0,
    };
    const clearHeaders = [
      serialize("access_token", "", clearOptions),
      serialize("refresh_token", "", clearOptions),
    ];

    return jsonResponse(
      {
        action: "logout",
        success: true,
        message: "Logged out",
        code: 200,
      },
      200,
      {
        ...cors,
        "Set-Cookie": clearHeaders,
      },
    );
  }

  if (path === "/api/ayonline/verify" && method === "GET") {
    const cookies = parse(request.headers.get("Cookie") || "");
    const accessToken = cookies.access_token;
    if (!accessToken) {
      return jsonResponse(
        {
          valid: false,
          error_code: ERROR_CODES.MISSING_TOKEN,
          error: "No token",
        },
        401,
        cors,
      );
    }
    const payload = await verifyAccessToken(accessToken, env.JWT_KEY);
    if (!payload) {
      return jsonResponse(
        {
          valid: false,
          error_code: ERROR_CODES.INVALID_REFRESH_TOKEN,
          error: "Invalid or expired token",
        },
        401,
        cors,
      );
    }
    const userId = parseInt(payload.sub, 10);
    const user = await env.db
      .prepare("SELECT banned, ban_reason FROM online_users WHERE sub = ?")
      .bind(userId)
      .first();
    if (user && user.banned === 1) {
      return jsonResponse(
        {
          valid: false,
          banned: true,
          error_code: ERROR_CODES.ACCOUNT_BANNED,
          error: "Account banned",
          ban_reason: user.ban_reason || "",
        },
        403,
        cors,
      );
    }
    return jsonResponse(
      {
        valid: true,
        code: 200,
        banned: false,
        user: {
          sub: payload.sub,
          username: payload.username,
          email: payload.email,
          gender: payload.gender,
          avatar: payload.avatar,
          description: payload.description,
          created_at: payload.created_at,
        },
      },
      200,
      cors,
    );
  }

  if (path === "/api/ayonline/refresh" && method === "POST") {
    const cookies = parse(request.headers.get("Cookie") || "");
    const refreshToken = cookies.refresh_token;
    if (!refreshToken) {
      return jsonResponse(
        {
          error_code: ERROR_CODES.MISSING_REFRESH_TOKEN,
          error: "Refresh token missing",
        },
        401,
        cors,
      );
    }

    const userId = await getUserIdFromRefreshToken(getKv(), refreshToken);
    if (!userId) {
      return jsonResponse(
        {
          error_code: ERROR_CODES.INVALID_REFRESH_TOKEN,
          error: "Invalid or expired refresh token",
        },
        401,
        cors,
      );
    }

    const user = await env.db
      .prepare(
        "SELECT sub, username, email, banned, ban_reason, gender, avatar, description, created_at FROM online_users WHERE sub = ?",
      )
      .bind(userId)
      .first();

    if (!user) {
      await deleteRefreshToken(getKv(), refreshToken);
      return jsonResponse(
        { error_code: ERROR_CODES.USER_NOT_FOUND, error: "User not found" },
        401,
        cors,
      );
    }

    // 检查封禁状态
    if (user.banned === 1) {
      return jsonResponse(
        {
          error_code: ERROR_CODES.ACCOUNT_BANNED,
          error: "Account banned",
          ban_reason: user.ban_reason || "",
        },
        403,
        cors,
      );
    }

    const newAccessToken = await signAccessToken(
      {
        sub: user.sub,
        username: user.username,
        email: user.email,
        gender: user.gender,
        avatar: user.avatar,
        description: user.description,
        created_at: user.created_at,
      },
      env.JWT_KEY,
    );

    const cookieOptions = {
      domain: ".undz.cn",
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "Lax",
      maxAge: REFRESH_TOKEN_TTL,
    };
    const setCookie = serialize("access_token", newAccessToken, cookieOptions);

    return jsonResponse(
      {
        action: "refresh",
        success: true,
        message: "Token refreshed",
        code: 200,
      },
      200,
      {
        ...cors,
        "Set-Cookie": setCookie,
      },
    );
  }

  return null;
}
