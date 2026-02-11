function generateTimeOrderedUUID() {
    const bytes = new Uint8Array(16);
    let ms = Date.now();
    const perf = (typeof performance !== 'undefined') ? performance.now() : ms;
    const micro = Math.floor((perf % 1) * 1000);
    for (let i = 5; i >= 0; i--) {
        bytes[i] = ms & 0xff;
        ms >>>= 8;
    }
    bytes[6] = (micro >> 8) & 0x0f;
    bytes[7] = micro & 0xff;       
    bytes[6] = bytes[6] | 0x60; 
    const nano = Math.floor((perf % 1) * 1e6) % 65536;
    bytes[8] = (nano >> 8) & 0xff;
    bytes[9] = nano & 0xff;
    crypto.getRandomValues(bytes.subarray(10, 16));
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
    return `${hex.substr(0,8)}-${hex.substr(8,4)}-${hex.substr(12,4)}-${hex.substr(16,4)}-${hex.substr(20,12)}`; 
}
async function calculateHMAC(message, key, algorithm = 'SHA-256') {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const messageData = encoder.encode(message);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',      
    keyData,    
    {         
      name: 'HMAC',
      hash: { name: algorithm }
    },
    false,  
    ['sign', 'verify']
  );
  const signature = await crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    messageData
  );
  const hashArray = Array.from(new Uint8Array(signature));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}
function getLocalTime(nS) {
    const date = new Date(parseInt(nS));
    // 使用固定的中文格式
    return date.toLocaleString('zh-CN', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: false 
    });
    // 输出示例: “2025/02/11 14:30:25”
}
function getSystem(ua) {
  ua = ua.toLowerCase();
  let os = 'Unknown';
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac os')) os = 'macOS';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('ios') || ua.includes('iphone')) os = 'iOS';
  return os;
}
function getBrowser(ua) {
  ua = ua.toLowerCase();
  let browser = 'Unknown';
  if (ua.includes('chrome') && !ua.includes('edg')) browser = 'Chrome';
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
  else if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('edg')) browser = 'Edge';
  return browser;
}
function getDevice(ua) {
  ua = ua.toLowerCase();
  let device = 'Unknown';
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) device = 'Mobile';
  else if (ua.includes('tablet')) device = 'Tablet';
  return device;
}
export async function CreateAccount(request, env) {  //项目内使用的自定义状态码在操作手册内定义

  try {
    let timestamp=new Date().getTime();
    
    let create_time=timestamp;
    let uuid=generateTimeOrderedUUID();
    let active_time=timestamp;
    let pw_key="aW8uaGIuY25feXVuZF9jcm9zc2ZpcmUtdXNlci1rZXlfdGhvc2Vfd2hvX2JyZWFrX3RoZV9ydWxlc19oYXZlX25vX3BhcmVudHNfMjAyNi0wMi0xMl8wODowMDowMF9mdWNrX3lvdQ";
    let email="";
    let password="";
    let name="";
    let is_del=0;
    let status=1; //未验证的邮箱
    let browser="";
    let create_ip="0.0.0.0";
    let device="";
    let os="";
    let permission="0"; //默认用户
    const userAgentString = request.headers.get('User-Agent') || '';
    os = getSystem(userAgentString);
    browser = getBrowser(userAgentString);
    device = getDevice(userAgentString);
    create_ip = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || '0.0.0.0';
    try {
      const body = await request.json();
      email = body.email;
      password = await calculateHMAC(body.password, pw_key);
      name = body.name;
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
    if (!password) {
      return new Response(
        JSON.stringify({ error: 'Password is required' }), 
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          } 
        }
      );
    }
    if (!name) {
      return new Response(
        JSON.stringify({ error: 'Username is required' }), 
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          } 
        }
      );
    }

  const result = await env.db.prepare(
    "INSERT INTO users (name, uuid, email, password, password_key, permission, status, create_time,  active_time, is_del, browser, create_ip, device, os) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).bind(name,uuid, email, password, pw_key, permission, status, create_time, active_time, is_del, browser, create_ip, device, os).run();
    
    /*  将来会用，先等待
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'noreply@io.hb.cn',
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
    */
    
    return new Response(
      JSON.stringify({ status: 'success', message: 'User created successfully',CreateTime: getLocalTime(timestamp)}), 
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
      JSON.stringify({ error: 'Internal server error, Unk' }), 
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

/**
 * 初始化数据库表
 * 这个函数会创建 users 表，如果表已存在则不会重复创建
 */
export async function initDatabase(request, env) {
  try {
    // 定义创建 users 表的 SQL 语句
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        uuid TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        password_key TEXT NOT NULL,
        permission TEXT NOT NULL,
        status INTEGER NOT NULL,
        create_time INTEGER NOT NULL,
        active_time INTEGER NOT NULL,
        is_del INTEGER NOT NULL DEFAULT 0,
        browser TEXT,
        create_ip TEXT,
        device TEXT,
        os TEXT,
        INDEX idx_email (email),
        INDEX idx_status (status),
        INDEX idx_create_time (create_time)
      );
    `;

    // 执行创建表的 SQL
    const result = await env.db.exec(createTableSQL);
    
    return new Response(
      JSON.stringify({ 
        status: 'success', 
        message: 'Database table initialized successfully',
        details: result 
      }), 
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        } 
      }
    );
  } catch (error) {
    console.error('Error initializing database:', error);
    return new Response(
      JSON.stringify({ 
        status: 'error', 
        message: 'Failed to initialize database',
        error: error.message 
      }), 
      { 
        status: 500, // 使用新的自定义错误码表示数据库初始化失败
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        } 
      }
    );
  }
}
