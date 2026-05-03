// 生成随机 token
function generateToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function handleSendVerification(request, env) {
  
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

    // 生成随机验证码和 token
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const token = generateToken();
    
    // 存储到 KV，有效期 5 分钟
    await env.kv.put(
      `token:${token}`, 
      JSON.stringify({ email, code: verificationCode }),
      { expirationTtl: 300 } // 5 分钟
    );

    // 使用 Resend 发送邮件
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'noreply@undz.cn',
        to: email,
        subject: '[Ys Post] Your Verification Code',
        html: `<p>Your verification code is: <strong>${verificationCode}</strong></p><p>This code will expire in 5 minutes.</p>`
      })
    });

    if (!resendResponse.ok) {
      const error = await resendResponse.text();
      console.error('Resend API error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to send email' }), 
        { 
          status: 500, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          } 
        }
      );
    }

    // 返回 token
    return new Response(
      JSON.stringify({ token }), 
      { 
        status: 200, 
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
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        } 
      }
    );
  }

}


