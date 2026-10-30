import { createKvStore } from "../../../shared/kvWithD1.js";

export async function handleVerifyCode(
  code,
  token,
  env,
  expectedAction = null,
) {
  const kvStore = createKvStore(env.db);
  try {
    if (!token || !code) {
      return { valid: false, error: "Token and code are required" };
    }

    // 从 KV 获取验证数据
    const storedData = await kvStore.get(`token:${token}`);

    if (!storedData) {
      return { valid: false, error: "Invalid or expired token" };
    }

    const { email, code: storedCode, action } = JSON.parse(storedData);

    if (expectedAction && action !== expectedAction) {
      return { valid: false, error: "Action mismatch" };
    }
    // 验证代码
    const isValid = code === storedCode;

    if (isValid) {
      // 验证成功后删除 token
      await kvStore.delete(`token:${token}`);
    }

    return {
      valid: isValid,
      email: isValid ? email : null,
      action: isValid ? action : null,
    };
  } catch (error) {
    if (env.DEBUG) console.error("Error in verify code:", error);
    return { valid: false, error: "Internal server error" };
  }
}
