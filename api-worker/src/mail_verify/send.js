import { createKvStore } from '../kvWithD1'

// 生成随机 token
import { generateToken } from '../utils'



export const LOGIN_TEMPLATE = `Dear users,\n\n

Your one-time login verification code is: %CODE%\n\n

This verification code is valid within %EXPDATA% minutes. Please enter the information promptly to complete the login.\n\n

For your safety, please do not share this verification code with anyone. If this is not a login request you initiated, please ignore this email to ensure your account is secure.\n\n

Thank you,\n
%SERVICENAME%`
export const REG_TEMPLATE = `Dear user,\n\n

Welcome! Your account registration verification code is: %CODE%\n\n

This code will expire in %EXPDATA% minutes. Please use it to complete your registration.\n\n

Please do not share this code with anyone. If you did not request registration, please ignore this email.\n\n

Best regards,\n
%SERVICENAME%`

export async function handleSendVerification(env, email, expirationTtl = 300, serviceName = 'AyService', template = LOGIN_TEMPLATE) {
  const kvStore = createKvStore(env.db);
  try {
    if (!email) {
      return { msg: 'EMAIL_REQUIRED' };
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const token = generateToken();

    const mailDomain = env.MAIL_SEND_DOMAIN;
    const mailApiKey = env.MAIL_API_KEY;
    const port = 80;

    if (!mailDomain || !mailApiKey) {
      console.error('Missing MAIL_SEND_DOMAIN or MAIL_API_KEY in env');
      return { msg: 'CONFIG_ERROR' };
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
        body: template.replace('%CODE%', verificationCode).replace('%EXPDATA%', expirationTtl / 60).replace('%SERVICENAME%', serviceName),
        html: template.replace('%CODE%', verificationCode).replace('%EXPDATA%', expirationTtl / 60).replace('%SERVICENAME%', serviceName)
      })
    });
    if (mailResponse.status === 429) {
      return { msg: 'ERR429' };
    }
    if (mailResponse.status === 500) {
      return { msg: 'ERR500' };
    }
    if (!mailResponse.ok) {
      return { msg: 'FAILED_SEND_EMAIL' };
    }

    let mailResult;
    try {
      mailResult = await mailResponse.json();
    } catch (e) {
      return { msg: 'INVALID_RESPONSE' };
    }

    if (mailResult.status !== 'ok') {
      return { msg: 'FAILED_SEND_EMAIL' };
    }

    await kvStore.put(
      `token:${token}`,
      JSON.stringify({ email, code: verificationCode }),
      { expirationTtl: expirationTtl }
    );
    return { msg: "OK", token };
  } catch (error) {
    console.error('Error in send verification:', error);
    return { msg: 'FAILED_SEND_EMAIL' };
  }
}