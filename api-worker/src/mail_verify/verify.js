export async function handleVerifyCode(code, token, env) {
  try {
  
    if (!token || !code) {
      return {  valid: false, error: 'Token and code are required' };
    }

    // 从 KV 获取验证数据
    const storedData = await env.kv.get(`token:${token}`);
    
    if (!storedData) {
      return { valid: false, error: 'Invalid or expired token' };
    }

    const { email, code: storedCode } = JSON.parse(storedData);
    
    // 验证代码
    const isValid = code === storedCode;
    
    if (isValid) {
      // 验证成功后删除 token
      await env.kv.delete(`token:${token}`);
    }

    return {   valid: isValid };
  } catch (error) {
    console.error('Error in verify code:', error);
    return {  valid: false,  error: 'Internal server error' };
  }

}
