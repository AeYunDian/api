// 生成随机 token
function generateToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
export const LOGIN_TEMPLATE = `Your verification code is %CODE%.
You are trying to 'Login', and it is valid for %EXPDATA% minutes.
Please do not share it with anyone. If this wasn't done by you, please ignore this email.`
export const REG_TEMPLATE = `Your verification code is %CODE%.
You are trying to 'Registered', and it is valid for %EXPDATA% minutes.
Please do not share it with anyone. If this wasn't done by you, please ignore this email.`

export async function handleSendVerification(env, email, expirationTtl = 300, serviceName = 'AyService' ,  template = LOGIN_TEMPLATE) {
  
  try {
    if (!email) {
      return {msg : 'EMAIL_REQUIRED' };
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const token = generateToken();
    
    await env.kv.put(
      `token:${token}`, 
      JSON.stringify({ email, code: verificationCode }),
      { expirationTtl: expirationTtl }
    );

    const mailDomain = env.MAIL_SEND_DOMAIN;
    const mailApiKey = env.MAIL_API_KEY;
    const port = 80;

    if (!mailDomain || !mailApiKey) {
      console.error('Missing MAIL_SEND_DOMAIN or MAIL_API_KEY in env');
      return  {msg : 'CONFIG_ERROR' };
    }

    const mailUrl = `http://${mailDomain}:${port}/send`;

    const mailResponse = await fetch(mailUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mailApiKey}`
      },
      body: JSON.stringify({
        to: email,
        subject: `[${serviceName}] Your Verification Code`,
        body: template.replace('%CODE%', verificationCode).replace('%EXPDATA%', expirationTtl / 60),
        html: template.replace('%CODE%', verificationCode).replace('%EXPDATA%', expirationTtl / 60)
      })
    });

    if (!mailResponse.ok) {
      return  {msg : 'FAILED_SEND_EMAIL' };
    }

    let mailResult;
    try {
      mailResult = await mailResponse.json();
    } catch (e) {
      return {msg : 'INVALID_RESPONSE' };
    }

    if (mailResult.status !== 'ok') {
      return {msg : 'FAILED_SEND_EMAIL' };
    }

    return {msg : "OK", token };
  } catch (error) {
    console.error('Error in send verification:', error);
    return {msg :  'FAILED_SEND_EMAIL'  };
  }
}