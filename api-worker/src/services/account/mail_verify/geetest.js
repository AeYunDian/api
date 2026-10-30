// mail_verify/geetest.js —— 极验 4 服务端校验（注册、发验证码共用）
import { base64ToUtf8 } from "../../../shared/utils.js";
import { ERROR_CODES } from "../../../shared/error-codes.js";
import { hmacSha256 } from "../auth/crypto.js";

function fail(status, payload) {
  return { ok: false, status, payload };
}

export async function verifyGeetest(env, gtBase64, tag = "register") {
  if (!gtBase64) {
    let gtCode;
    try {
      gtCode = JSON.parse(env.GTCODE)[0];
    } catch {
      gtCode = undefined;
    }
    return fail(429, {
      error_code: ERROR_CODES.NEED_HUMAN_VERIFICATION,
      gt_code: gtCode,
      message: "请求频繁，请稍后再试",
    });
  }

  let gt;
  try {
    gt = JSON.parse(base64ToUtf8(gtBase64));
  } catch {
    gt = null;
  }
  if (!gt) {
    return fail(400, {
      error: "Missing required fields",
      error_code: ERROR_CODES.MISSING_PARAMS,
    });
  }

  let prikey;
  try {
    prikey = JSON.parse(env.GTCODEMAP)[gt.captcha_id];
  } catch {
    prikey = null;
  }
  if (!prikey) {
    return fail(400, {
      code: 400,
      message: "id is not in id pools ",
      error_code: ERROR_CODES.GEETEST_INVALID_CAPTCHA_ID,
    });
  }

  const sign_token = await hmacSha256(prikey, gt.lot_number);
  const query = Object.assign({}, gt, { sign_token });
  if (env.DEBUG) console.debug(`[geetest:${tag}]`, gt);
  const validateUrl = new URL("https://gcaptcha4.geetest.com/validate");
  validateUrl.search = new URLSearchParams(query).toString();

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
        `[geetest:${tag}] 上游返回非 JSON`,
        geetestRes.status,
        String(raw).slice(0, 300),
      );
      throw new Error("GeeTest returned non-JSON response");
    }
    gtPassed = true;
    if (geetestData.result === "success") {
      return { ok: true };
    }
    console.error(`[geetest:${tag}] 校验未通过`, geetestData);
    return fail(400, {
      error_code: ERROR_CODES.GEETEST_VERIFY_FAILED,
      message: "Verification failed",
    });
  } catch (err) {
    if (gtPassed) throw err;
    console.error(`[geetest:${tag}] 校验请求失败:`, err && err.message);
    return fail(500, {
      error_code: ERROR_CODES.GEETEST_ERROR,
      message: "GeeTest Server Error",
    });
  }
}
