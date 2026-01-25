// 添加邮箱到kv一星期共后台查看
export async function addTransferredMail(request, env) {
  try {
    // 解析请求体
    let email;
    try {
      const body = await request.json();
      email = body.email;
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
    
    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }), 
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          } 
        }
      );
    }

    
    // 存储到 KV，有效期 一星期
    await env.kv.put(
      `TransferredMail:${email}`, 
      JSON.stringify({ email}),
      { expirationTtl: 604800 } // 一星期
    );

    return new Response(
      JSON.stringify({ email }), 
      { 
        status: 201, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        } 
      }
    );
  } catch (error) {
    console.error('Error in send verification:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { 
        status: 403, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        } 
      }
    );
  }

}
