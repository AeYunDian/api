// mail_verify/register-verification.js —— 新注册邮箱验证流程
//
// start:
//   1. 先校验极验（发送验证码 / 创建反向任务前必须验证）
//   2. 检查 send.undz.cn/health（D1 KV 缓存 10 分钟）
//   3. 正常则走传统邮件；不可用或 3/5 随机则走反向邮件
//   4. 返回 method + verifySessionId，最终注册只认这个会话
//
// 最终注册不再二次要求 gt：极验通过后由 verifySessionId 绑定本次注册。

import { createKvStore } from "../../../shared/kvWithD1.js";
import { generateToken } from "../../../shared/utils.js";
import { ACTION_PRESETS } from "../../../shared/config.js";
import { ERROR_CODES } from "../../../shared/error-codes.js";
import { VERIFY_CODE_EXPDATA } from "../config.js";
import {
  ACTION as EMAIL_ACTION,
  REG_TEMPLATE,
  handleSendVerification,
} from "./send.js";
import {
  createReverseVerification,
  deleteReverseVerification,
  verifyReverseCode,
} from "../../../shared/email-reverse-verify.js";
import { verifyGeetest } from "./geetest.js";

const HEARTBEAT_KEY = "mail:health:send";
const HEARTBEAT_TTL = 600; // 10 分钟
const REGISTER_SESSION_TTL = 600; // 10 分钟
const REGISTER_SESSION_PREFIX = "register:verify:";
const HEALTH_TIMEOUT_MS = 1200;

function sessionKey(id) {
  return `${REGISTER_SESSION_PREFIX}${id}`;
}

function fail(status, payload) {
  return { ok: false, status, payload };
}

function healthUrl(env) {
  if (env.MAIL_STATUS_URL) return env.MAIL_STATUS_URL;
  const host = String(env.MAIL_SEND_DOMAIN || "send.undz.cn").replace(
    /^https?:\/\//i,
    "",
  );
  return `http://${host}/health`;
}

function randomReverseHit() {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return values[0] % 5 < 3;
}

async function isMailServiceHealthy(env) {
  const kv = createKvStore(env.db);
  let cached = null;
  try {
    cached = await kv.get(HEARTBEAT_KEY);
  } catch {
    cached = null;
  }
  if (cached === "1") return true;
  if (cached === "0") return false;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);
  let healthy = false;
  try {
    const res = await fetch(healthUrl(env), {
      method: "GET",
      signal: controller.signal,
    });
    if (res.ok) {
      const data = await res.json().catch(() => null);
      healthy = data && data.status === "alive";
    }
  } catch (err) {
    if (env.DEBUG) console.warn("[register-verify] health check failed:", err);
    healthy = false;
  } finally {
    clearTimeout(timer);
  }

  try {
    await kv.put(HEARTBEAT_KEY, healthy ? "1" : "0", {
      expirationTtl: HEARTBEAT_TTL,
    });
  } catch {
    /* cache write failure must not block registration */
  }
  return healthy;
}

async function createRegisterSession(env, data) {
  const kv = createKvStore(env.db);
  const id = generateToken();
  await kv.put(sessionKey(id), JSON.stringify(data), {
    expirationTtl: REGISTER_SESSION_TTL,
  });
  return id;
}

export async function getRegisterSession(env, id) {
  if (!id) return null;
  const kv = createKvStore(env.db);
  const raw = await kv.get(sessionKey(id));
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function deleteRegisterSession(env, id) {
  if (!id) return;
  const kv = createKvStore(env.db);
  await kv.delete(sessionKey(id));
}

/**
 * 开始注册邮箱验证。
 * @returns {Promise<{ok:true,data:Object}|{ok:false,status:number,payload:Object}>}
 */
export async function startRegisterVerification(env, email, gtBase64) {
  const gtResult = await verifyGeetest(env, gtBase64, "register:start");
  if (!gtResult.ok) return gtResult;

  const healthy = await isMailServiceHealthy(env);
  const useReverse = !healthy || randomReverseHit();

  if (!useReverse) {
    const result = await handleSendVerification(
      env,
      email,
      VERIFY_CODE_EXPDATA,
      "AyService",
      REG_TEMPLATE,
      EMAIL_ACTION.REGISTER,
    );
    if (result.msg === "OK") {
      const sessionId = await createRegisterSession(env, {
        email,
        method: "email",
        token: result.token,
        createdAt: Math.floor(Date.now() / 1000),
      });
      return {
        ok: true,
        data: {
          method: "email",
          verifySessionId: sessionId,
          token: result.token,
          email,
          expiresAt: Math.floor(Date.now() / 1000) + VERIFY_CODE_EXPDATA,
          retryAfter: 60,
        },
      };
    }

    // 发信失败也降级反向；只有服务端异常才把健康缓存改成不可用，429 不降级缓存。
    if (["ERR500", "FAILED_SEND_EMAIL", "INVALID_RESPONSE"].includes(result.msg)) {
      try {
        const kv = createKvStore(env.db);
        await kv.put(HEARTBEAT_KEY, "0", { expirationTtl: HEARTBEAT_TTL });
      } catch {
        /* ignore cache write */
      }
    }
  }

  try {
    const ticket = await createReverseVerification(env, {
      targetEmail: email,
      action: ACTION_PRESETS.REGISTER,
    });
    const sessionId = await createRegisterSession(env, {
      email,
      method: "reverse",
      requestId: ticket.requestId,
      createdAt: Math.floor(Date.now() / 1000),
    });
    return {
      ok: true,
      data: {
        method: "reverse",
        verifySessionId: sessionId,
        requestId: ticket.requestId,
        email: ticket.email,
        code: ticket.code,
        expiresAt: ticket.expiresAt,
      },
    };
  } catch (err) {
    if (env.DEBUG) console.error("[register-verify] reverse create failed:", err);
    return fail(503, {
      error: "Both email verification methods are unavailable",
      error_code: ERROR_CODES.REGISTER_VERIFY_EMAIL_UNAVAILABLE,
    });
  }
}

export async function queryRegisterVerification(env, requestId, email) {
  const result = await verifyReverseCode(
    env,
    requestId,
    ACTION_PRESETS.REGISTER,
  );
  if (
    result.valid &&
    String(result.email || "").toLowerCase() !== String(email).toLowerCase()
  ) {
    return { valid: false, error: "EMAIL_MISMATCH" };
  }
  return result;
}

export { deleteReverseVerification };
