export async function handleVerifyCode(request, env) {
  try {
    // 解析请求体
    let token, code;
    try {
      const body = await request.json();
      token = body.token;
      code = body.code;
    } catch (e) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON' }), 
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          } 
        }
      );
    }
    
    if (!token || !code) {
      return new Response(
        JSON.stringify({ error: 'Token and code are required' }), 
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          } 
        }
      );
    }

    // 从 KV 获取验证数据
    const storedData = await env.kv.get(`token:${token}`);
    
    if (!storedData) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Invalid or expired token' }), 
        { 
          status: 200, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          } 
        }
      );
    }

    const { email, code: storedCode } = JSON.parse(storedData);
    
    // 验证代码
    const isValid = code === storedCode;
    
    if (isValid) {
      // 验证成功后删除 token
      await env.kv.delete(`token:${token}`);
    }

    return new Response(
      JSON.stringify({ valid: isValid }), 
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        } 
      }
    );
  } catch (error) {
    console.error('Error in verify code:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        } 
      }
    );
  }

}
