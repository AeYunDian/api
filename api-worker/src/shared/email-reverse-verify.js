import PostalMime from "postal-mime";
import { generateToken } from "./utils.js";
import { REVERSE_VERIFY_CONFIG, ACTION_PRESETS } from "./config.js";

/**
 * 初始化反向验证的 D1 数据表
 * @param {D1Database} db Cloudflare D1 数据库实例
 */
export async function initReverseVerifyTable(db) {
  await db
    .prepare(
      `
    CREATE TABLE IF NOT EXISTS reverse_verify_tickets (
      request_id TEXT PRIMARY KEY,
      receive_address TEXT NOT NULL,
      target_email TEXT,
      expected_code TEXT NOT NULL,
      actual_from_email TEXT,
      action TEXT NOT NULL DEFAULT 'global',
      status TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      verified_at INTEGER
    )
  `,
    )
    .run();

  await db
    .prepare(
      `CREATE INDEX IF NOT EXISTS idx_receive_address ON reverse_verify_tickets(receive_address)`,
    )
    .run();
  await db
    .prepare(
      `CREATE INDEX IF NOT EXISTS idx_target_email_action ON reverse_verify_tickets(target_email, action)`,
    )
    .run();
  await db
    .prepare(
      `CREATE INDEX IF NOT EXISTS idx_expires_at ON reverse_verify_tickets(expires_at)`,
    )
    .run();
}

/**
 * 创建反向验证任务
 * @param {Object} env 环境变量对象，需包含 env.db
 * @param {Object} options 配置项
 * @param {string} [options.targetEmail] 可选，预绑定的用户真实邮箱。不传则取邮件发件人。
 * @param {string} [options.action] 业务场景，默认 global
 * @param {string} [options.prefix] 子地址前缀，默认 onecode
 * @param {number} [options.tokenLength] 子地址随机后缀长度，默认 3
 * @param {boolean} [options.useSubaddress] 是否使用 + 子地址格式，默认 true
 * @param {number} [options.codeLength] 期望的验证码长度（3-32位纯数字），默认 6
 * @param {number} [options.ttl] 任务过期时间（秒），默认 300
 * @param {string} [options.domain] 指定的收件域名，必须在白名单内
 * @returns {Promise<Object>} 包含 requestId, email, code, expiresAt
 */
export async function createReverseVerification(env, options = {}) {
  const {
    targetEmail = null,
    action = ACTION_PRESETS.GLOBAL,
    prefix = REVERSE_VERIFY_CONFIG.DEFAULT_PREFIX,
    tokenLength = REVERSE_VERIFY_CONFIG.DEFAULT_TOKEN_LENGTH,
    useSubaddress = true,
    codeLength = REVERSE_VERIFY_CONFIG.DEFAULT_CODE_LENGTH,
    ttl = REVERSE_VERIFY_CONFIG.DEFAULT_TTL,
    domain = REVERSE_VERIFY_CONFIG.ALLOWED_DOMAINS[0],
  } = options;

  const validActions = Object.values(ACTION_PRESETS);
  if (!validActions.includes(action)) {
    console.warn(`[ReverseVerify Warning] Action "${action}" is not a preset.`);
  }

  if (!prefix || typeof prefix !== "string" || prefix.trim() === "") {
    throw new Error("Prefix cannot be empty");
  }

  if (targetEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail)) {
    throw new Error("Invalid targetEmail format");
  }

  if (!Number.isInteger(codeLength) || codeLength < 3 || codeLength > 32) {
    throw new Error("Code length must be an integer between 3 and 32");
  }

  if (!REVERSE_VERIFY_CONFIG.ALLOWED_DOMAINS.includes(domain)) {
    throw new Error(`Domain "${domain}" is not in the allowed list`);
  }

  const requestId = generateToken();
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";

  let addressToken = "";
  for (let i = 0; i < tokenLength; i++) {
    addressToken += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  const receiveAddress = (
    useSubaddress
      ? `${prefix}+${addressToken}@${domain}`
      : `${prefix}${addressToken}@${domain}`
  ).toLowerCase();

  let expectedCode = "";
  for (let i = 0; i < codeLength; i++) {
    expectedCode += Math.floor(Math.random() * 10).toString();
  }

  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + ttl;

  await env.db
    .prepare(
      `
    INSERT INTO reverse_verify_tickets (
      request_id, receive_address, target_email, expected_code, action, status, created_at, expires_at
    ) VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)
  `,
    )
    .bind(
      requestId,
      receiveAddress,
      targetEmail ? targetEmail.toLowerCase() : null,
      expectedCode,
      action,
      now,
      expiresAt,
    )
    .run();

  return { requestId, email: receiveAddress, code: expectedCode, expiresAt };
}
/**
 * 从文本中提取所有像 base64 的块，解码后精确匹配验证码。
 * 支持跨行拼接（解决 QQ 邮箱每 76 字符强制换行导致 HTML 被切碎的问题）。
 */
function matchCodeInBase64Text(text, expectedCode) {
  if (!text || !expectedCode) return false;

  const lines = text.split(/[\r\n]+/);
  let currentB64 = "";
  const b64Blocks = [];

  // 1. 按行扫描，拼接连续的纯 Base64 行
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.length > 0 && /^[A-Za-z0-9+/=]+$/.test(line)) {
      currentB64 += line;
    } else {
      if (currentB64.length >= 8) {
        b64Blocks.push(currentB64);
      }
      currentB64 = "";
    }
  }
  if (currentB64.length >= 8) {
    b64Blocks.push(currentB64);
  }

  // 2. 对完整的 Base64 块进行解码比对
  for (const block of b64Blocks) {
    // 防止过大的文件导致 Worker 内存溢出（例如内嵌图片）
    if (block.length > 1024 * 100) continue;

    try {
      const padded = block + "=".repeat((4 - (block.length % 4)) % 4);
      const decoded = atob(padded);

      // 直接命中
      if (decoded === expectedCode) return true;

      // 如果解码出来是 HTML 或文本，按非数字切段提取验证码
      // 例如：`<div style="...">971281</div>` 会切出 ["", "971281", ""]
      if (decoded.includes(expectedCode)) {
        const digits = decoded.replace(/[^\d]+/g, " ");
        if (digits.split(" ").includes(expectedCode)) {
          return true;
        }
      }
    } catch {
      // 忽略非法 base64
    }
  }

  return false;
}

export async function handleIncomingReverseEmail(message, env, ctx) {
  const toAddress = (message.to || "").toLowerCase();

  const domainMatch = REVERSE_VERIFY_CONFIG.ALLOWED_DOMAINS.some((d) =>
    toAddress.endsWith(`@${d}`),
  );
  if (!domainMatch) return;

  if (message.rawSize > REVERSE_VERIFY_CONFIG.MAX_EMAIL_SIZE) return;

  const fromAddress = (message.from || "").toLowerCase();
  const now = Math.floor(Date.now() / 1000);

  const results = await env.db
    .prepare(
      `SELECT * FROM reverse_verify_tickets
       WHERE receive_address = ? AND status = 'pending' AND expires_at > ?`,
    )
    .bind(toAddress, now)
    .all();

  const rows = results.results || [];
  if (rows.length === 0) return;

  const parser = new PostalMime();
  const emailContent = await parser.parse(message.raw);

  const originalText = emailContent.text || "";
  const originalHtml = emailContent.html || "";

  let text = originalText;
  if (!text.trim() && originalHtml) {
    text = originalHtml
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(
        /<\/?(?:div|p|td|th|tr|li|h[1-6]|table|ul|ol|blockquote|section|article)\b[^>]*>/gi,
        "\n",
      )
      .replace(/<hr\b[^>]*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
      .replace(/&nbsp;/gi, " ");
  }

  const strictSegments = text.split(/[^\d]+/);
  const collapsed = text.replace(/[\r\n\t]+/g, "");
  const relaxedSegments = collapsed.split(/[^\d]+/);

  for (const row of rows) {
    if (row.target_email && row.target_email !== fromAddress) continue;

    const code = row.expected_code;

    const matched =
      strictSegments.includes(code) ||
      relaxedSegments.includes(code) ||
      matchCodeInBase64Text(originalText, code) ||
      matchCodeInBase64Text(originalHtml, code);

    if (!matched) continue;

    const extendedExpiresAt =
      now + REVERSE_VERIFY_CONFIG.VERIFIED_RETENTION_TTL;

    await env.db
      .prepare(
        `UPDATE reverse_verify_tickets
         SET status = 'verified', actual_from_email = ?, verified_at = ?, expires_at = ?
         WHERE request_id = ?`,
      )
      .bind(fromAddress, now, extendedExpiresAt, row.request_id)
      .run();
  }
}

/**
 * 轮询或校验任务状态。
 * 注意：此函数只做校验，不会删除记录。调用方拿到 valid: true 后，【必须立即调用 deleteReverseVerification】以防止重放攻击。
 * @param {Object} env 环境变量
 * @param {string} requestId 请求 ID
 * @param {string} [expectedAction] 期望的业务场景，不传则忽略校验
 * @returns {Promise<Object>} 包含 valid, email, action, requestId 等
 */
export async function verifyReverseCode(env, requestId, expectedAction = null) {
  const now = Math.floor(Date.now() / 1000);
  const row = await env.db
    .prepare(
      `
    SELECT * FROM reverse_verify_tickets
    WHERE request_id = ? AND expires_at > ?
    LIMIT 1
  `,
    )
    .bind(requestId, now)
    .first();

  if (!row) return { valid: false, error: "EXPIRED_OR_NOT_FOUND" };

  if (expectedAction && row.action !== expectedAction) {
    return { valid: false, error: "ACTION_MISMATCH" };
  }

  if (row.status !== "verified") {
    return { valid: false, error: "NOT_YET_VERIFIED" };
  }

  return {
    valid: true,
    email: row.actual_from_email || row.target_email,
    action: row.action,
    requestId: row.request_id,
  };
}

/**
 * 根据用户真实邮箱查询验证记录（支持查询特定 action 或全部）
 * @param {Object} env 环境变量
 * @param {string} targetEmail 用户的真实邮箱
 * @param {string} [action] 业务场景，不传则获取该邮箱的所有有效记录
 * @returns {Promise<Object>} 包含 records 数组
 */
export async function getVerificationByEmail(env, targetEmail, action = null) {
  const now = Math.floor(Date.now() / 1000);
  let sql = `
    SELECT * FROM reverse_verify_tickets
    WHERE target_email = ? AND expires_at > ?
  `;
  const bindings = [targetEmail.toLowerCase(), now];

  if (action) {
    sql += ` AND action = ?`;
    bindings.push(action);
  }

  sql += ` ORDER BY created_at DESC LIMIT 50`;

  const results = await env.db
    .prepare(sql)
    .bind(...bindings)
    .all();
  const rows = results.results || [];

  if (rows.length === 0)
    return { valid: false, error: "EXPIRED_OR_NOT_FOUND", records: [] };

  const records = rows.map((row) => ({
    valid: row.status === "verified",
    status: row.status,
    email: row.actual_from_email || row.target_email,
    action: row.action,
    requestId: row.request_id,
  }));

  return { valid: true, records };
}

/**
 * 业务消费完毕后，手动删除记录（防重放攻击）
 * @param {Object} env 环境变量
 * @param {string} requestId 请求 ID
 * @returns {Promise<boolean>} 是否成功删除
 */
export async function deleteReverseVerification(env, requestId) {
  try {
    const result = await env.db
      .prepare(
        `
      DELETE FROM reverse_verify_tickets
      WHERE request_id = ? AND status = 'verified'
    `,
      )
      .bind(requestId)
      .run();
    return result.meta && result.meta.changes > 0;
  } catch (err) {
    console.error("[ReverseVerify] Failed to delete record:", err);
    return false;
  }
}

/**
 * 定时清理过期任务（由 Worker 的 scheduled 事件调用）
 * @param {D1Database} db Cloudflare D1 数据库实例
 */
export async function cleanExpiredReverseVerifications(db) {
  const now = Math.floor(Date.now() / 1000);

  try {
    const result = await db
      .prepare(
        `
      DELETE FROM reverse_verify_tickets
      WHERE expires_at < ?
    `,
      )
      .bind(now)
      .run();

    if (result.meta && result.meta.changes > 0) {
      console.log(
        `[ReverseVerify] Cleaned up ${result.meta.changes} expired tickets.`,
      );
    }
  } catch (err) {
    console.error("[ReverseVerify] Failed to clean expired tickets:", err);
  }
}
