// routes/register-new.js —— 新 SDK 注册（>= 3.0）
// 必须携带 start 返回的 verifySessionId；极验已在 start 完成。
import { jsonResponse } from "../http.js";
import { handleVerifyCode } from "../mail_verify/verify.js";
import { registerUser } from "../users.js";
import { allowedEmailDomains } from "../config.js";
import { ERROR_CODES } from "../../../shared/error-codes.js";
import {
  getRegisterSession,
  deleteRegisterSession,
} from "../mail_verify/register-verification.js";
import {
  deleteReverseVerification,
  verifyReverseCode,
} from "../../../shared/email-reverse-verify.js";
import { ACTION_PRESETS } from "../../../shared/config.js";

function fail(status, payload, cors) {
  return jsonResponse(
    { action: "register", ...payload },
    status,
    cors,
  );
}

export async function handleNewRegistration(body, env, cors) {
  if (
    !body ||
    !body.username ||
    !body.password ||
    !body.email ||
    !body.verifySessionId
  ) {
    return fail(
      400,
      {
        error: "Missing required fields",
        error_code: ERROR_CODES.REGISTER_VERIFY_REQUIRED,
      },
      cors,
    );
  }

  const email = String(body.email).trim().toLowerCase();
  if (!allowedEmailDomains.some((domain) => email.endsWith(domain))) {
    return fail(
      400,
      {
        error: "Invalid email",
        error_code: ERROR_CODES.UNSUPPORTED_EMAIL_DOMAIN,
      },
      cors,
    );
  }

  const session = await getRegisterSession(env, body.verifySessionId);
  if (!session) {
    return fail(
      400,
      {
        error: "Registration verification has expired",
        error_code: ERROR_CODES.REGISTER_VERIFY_EXPIRED,
      },
      cors,
    );
  }
  if (String(session.email || "").toLowerCase() !== email) {
    return fail(
      400,
      {
        error: "Verification email does not match",
        error_code: ERROR_CODES.REGISTER_VERIFY_METHOD_MISMATCH,
      },
      cors,
    );
  }
  if (
    body.method &&
    body.method !== session.method
  ) {
    return fail(
      400,
      {
        error: "Verification method does not match",
        error_code: ERROR_CODES.REGISTER_VERIFY_METHOD_MISMATCH,
      },
      cors,
    );
  }

  let reverseTicketId = null;
  if (session.method === "email") {
    if (!body.emailToken || !body.emailCode) {
      return fail(
        400,
        {
          error: "Email verification code is required",
          error_code: ERROR_CODES.REGISTER_VERIFY_REQUIRED,
        },
        cors,
      );
    }
    const verify = await handleVerifyCode(
      body.emailCode,
      body.emailToken,
      env,
      "register",
    );
    if (
      !verify.valid ||
      String(verify.email || "").toLowerCase() !== email
    ) {
      return fail(
        400,
        {
          error: verify.error || "Invalid or expired verification code",
          error_code: ERROR_CODES.INVALID_VERIFICATION_CODE,
        },
        cors,
      );
    }
  } else if (session.method === "reverse") {
    const verify = await verifyReverseCode(
      env,
      session.requestId,
      ACTION_PRESETS.REGISTER,
    );
    if (
      !verify.valid ||
      String(verify.email || "").toLowerCase() !== email
    ) {
      return fail(
        400,
        {
          error: "Invalid or expired reverse verification",
          error_code: ERROR_CODES.INVALID_VERIFICATION_CODE,
        },
        cors,
      );
    }
    reverseTicketId = session.requestId;
  } else {
    return fail(
      400,
      {
        error: "Invalid verification method",
        error_code: ERROR_CODES.REGISTER_VERIFY_METHOD_MISMATCH,
      },
      cors,
    );
  }

  const result = await registerUser(
    env.db,
    body.username,
    email,
    body.password,
  );
  if (!result.success) {
    return fail(
      result.code || 400,
      {
        error: result.message,
        error_code: result.error_code,
      },
      cors,
    );
  }

  if (reverseTicketId) {
    await deleteReverseVerification(env, reverseTicketId);
  }
  await deleteRegisterSession(env, body.verifySessionId);

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
}
