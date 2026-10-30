// auth/crypto.js —— 由 ayOnline.js 拆分而来（逐行搬运，未改逻辑）
// 密码与签名原语：PBKDF2 口令散列、HMAC-SHA256、base64 转换、输入校验。

import {
  PBKDF2_ITERATIONS,
  PBKDF2_HASH,
  MIN_PASSWORD_LENGTH,
  MAX_PASSWORD_LENGTH,
} from "../config.js";

async function hmacSha256(key, message) {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const messageData = encoder.encode(message);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
function toBase64(buffer) {
  return btoa(String.fromCharCode(...buffer));
}
function fromBase64(str) {
  const bin = atob(str);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    bytes[i] = bin.charCodeAt(i);
  }
  return bytes;
}

async function hashPassword(password, salt) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );
  const derived = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: PBKDF2_HASH,
    },
    keyMaterial,
    256,
  );
  return new Uint8Array(derived);
}

// ---------- 输入校验函数 ----------
function validateEmail(email) {
  const re = /^[A-Za-z0-9\u4e00-\u9fa5]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/;
  return re.test(email);
}

function validatePassword(password) {
  const allowed = /^[a-zA-Z0-9\-_=+@#$%]+$/;
  if (!allowed.test(password)) return false;
  if (
    password.length < MIN_PASSWORD_LENGTH ||
    password.length > MAX_PASSWORD_LENGTH
  )
    return false;
  return true;
}

export { hmacSha256, toBase64, fromBase64, hashPassword, validateEmail, validatePassword };
