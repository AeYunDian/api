// users.js —— 由 ayOnline.js 拆分而来（逐行搬运，未改逻辑）
// 用户业务层：注册、口令登录、改密码。只管数据与校验，不碰 HTTP。

import {
  SALT_LENGTH,
  MIN_USERNAME_LENGTH,
  MAX_USERNAME_LENGTH,
  DEFAULT_USER_AVATAR,
  DEFAULT_USER_DESC,
} from "./config.js";
import {
  hashPassword,
  toBase64,
  fromBase64,
  validateEmail,
  validatePassword,
} from "./auth/crypto.js";
import { revokeAllUserRefreshTokens } from "./auth/tokens.js";
import { generateRandomBytes } from "../../shared/utils.js";
import { ERROR_CODES } from "../../shared/error-codes.js";

async function registerUser(db, username, email, password) {
  if (!validateEmail(email)) {
    return {
      success: false,
      action: "register",
      code: 400,
      error_code: ERROR_CODES.INVALID_EMAIL,
      message: "Invalid email format",
    };
  }
  if (!validatePassword(password)) {
    return {
      success: false,
      action: "register",
      code: 400,
      error_code: ERROR_CODES.WEAK_PASSWORD,
      message:
        "Password must be at least 6 characters and contain only a-z A-Z 0-9 -_=+@#$%",
    };
  }
  if (
    username.length < MIN_USERNAME_LENGTH ||
    username.length > MAX_USERNAME_LENGTH
  ) {
    return {
      success: false,
      action: "register",
      code: 400,
      error_code: ERROR_CODES.INVALID_USERNAME_LENGTH,
      message: "Username must be between 4 and 20 characters",
    };
  }
  const existing = await db
    .prepare("SELECT sub FROM online_users WHERE username = ? OR email = ?")
    .bind(username, email)
    .first();
  if (existing) {
    return {
      success: false,
      action: "register",
      code: 409,
      error_code: ERROR_CODES.ACCOUNT_ALREADY_EXISTS,
      message: "Username or email already exists",
    };
  }

  const salt = generateRandomBytes(SALT_LENGTH);
  const hashBytes = await hashPassword(password, salt);
  const saltBase64 = toBase64(salt);
  const hashBase64 = toBase64(hashBytes);

  const now = Date.now();
  await db
    .prepare(
      `
    INSERT INTO online_users (username, email,  gender, avatar, description, password_salt, password_hash, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
    )
    .bind(
      username,
      email,
      "unknown",
      DEFAULT_USER_AVATAR,
      DEFAULT_USER_DESC,
      saltBase64,
      hashBase64,
      now,
      now,
    )
    .run();

  return {
    success: true,
    action: "register",
    code: 200,
    message: "User registered successfully",
  };
}

async function authenticateUser(db, usernameOrEmail, password) {
  const user = await db
    .prepare(
      "SELECT sub, username, email, password_salt, password_hash, banned, ban_reason, gender, avatar, description, created_at FROM online_users WHERE username = ? OR email = ?",
    )
    .bind(usernameOrEmail, usernameOrEmail)
    .first();

  if (!user) {
    return {
      success: false,
      action: "login",
      code: 401,
      error_code: ERROR_CODES.INVALID_CREDENTIALS,
      message: "Invalid credentials",
    };
  }

  const salt = fromBase64(user.password_salt);
  const hashBytes = await hashPassword(password, salt);
  const hashBase64 = toBase64(hashBytes);

  if (hashBase64 !== user.password_hash) {
    return {
      success: false,
      action: "login",
      code: 401,
      error_code: ERROR_CODES.INVALID_CREDENTIALS,
      message: "Invalid credentials",
    };
  }

  return {
    success: true,
    action: "login",
    code: 200,
    user: {
      sub: user.sub,
      username: user.username,
      email: user.email,
      banned: user.banned,
      ban_reason: user.ban_reason || "",
      gender: user.gender,
      avatar: user.avatar,
      description: user.description,
      created_at: user.created_at,
    },
  };
}

async function changePassword(db, kv, userId, oldPassword, newPassword) {
  if (!validatePassword(newPassword)) {
    return {
      success: false,
      code: 400,
      action: "changePassword",
      error_code: ERROR_CODES.WEAK_PASSWORD_NEW,
      message:
        "New password must be at least 6 characters and contain only a-z A-Z 0-9 -_=+@#$%",
    };
  }

  const user = await db
    .prepare(
      "SELECT password_salt, password_hash FROM online_users WHERE sub = ?",
    )
    .bind(userId)
    .first();
  if (!user)
    return {
      success: false,
      code: 404,
      action: "changePassword",
      message: "User not found",
    };

  const salt = fromBase64(user.password_salt);
  const oldHashBytes = await hashPassword(oldPassword, salt);
  const oldHashBase64 = toBase64(oldHashBytes);

  if (oldHashBase64 !== user.password_hash) {
    return {
      success: false,
      code: 401,
      action: "changePassword",
      error_code: ERROR_CODES.OLD_PASSWORD_INCORRECT,
      message: "Old password incorrect",
    };
  }

  const newSalt = generateRandomBytes(SALT_LENGTH);
  const newHashBytes = await hashPassword(newPassword, newSalt);
  const newSaltBase64 = toBase64(newSalt);
  const newHashBase64 = toBase64(newHashBytes);

  const now = Date.now();
  await db
    .prepare(
      "UPDATE online_users SET password_salt = ?, password_hash = ?, updated_at = ? WHERE sub = ?",
    )
    .bind(newSaltBase64, newHashBase64, now, userId)
    .run();

  await revokeAllUserRefreshTokens(kv, userId);

  return {
    success: true,
    code: 200,
    action: "changePassword",
    message: "Password updated. Please log in again.",
  };
}

export { registerUser, authenticateUser, changePassword };
