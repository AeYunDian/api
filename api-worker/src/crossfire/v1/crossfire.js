
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


export async function Logout(request, env) {
        try{
            let uuid="0", token="0";
         try{
         const body = await request.json();
         token = body.token;
         uuid = body.uuid;
        }catch (e){
        return new Response(
        JSON.stringify({ error: 'Invalid JSON' }), 
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          } 
        }
      );}
        const storedData = await env.kv.get(`uuid:${uuid}`);

        if(storedData == token){
        await env.kv.delete(`uuid:${uuid}`);
        }
      
     
            
       return new Response(
        JSON.stringify({ status: 'success'}), 
        { 
          status: 200, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          } 
        }
      );
        }catch (e) {
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


export async function PushUserBag(request, env) {
        try{
            let uuid="0", token="0", willSetLevel=0;
         try{
         const body = await request.json();
         token = body.token;
         uuid = body.uuid;
         willSetLevel = body.level;
        }catch (e){
        return new Response(
        JSON.stringify({ error: 'Invalid JSON' }), 
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          } 
        }
      );}
        const storedData = await env.kv.get(`uuid:${uuid}`);
        if(!storedData){
        return new Response(
        JSON.stringify({ error: 'Invalid Parameter' }), 
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          } 
        }
      );}
      if(storedData != token){
        return new Response(
        JSON.stringify({ error: 'Login session has expired, please log in again' }), 
        { 
          status: 401, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          } 
        }
      );}
     if(willSetLevel > 10000 || willSetLevel < 0){return new Response(
        JSON.stringify({ error: 'The value passed in is abnormal' }), 
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          } 
        }
      );}
     let result = await env.db.prepare(
        "UPDATE bag SET level = ? WHERE uuid = ?"
       ).bind(willSetLevel, uuid).run();
  if (result.changes === 0) {

          return new Response(
        JSON.stringify({ error: 'Unable to find the corresponding data on the server' }), 
        { 
          status: 404, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          } 
        }
      );
  }
            
       return new Response(
        JSON.stringify({ status: 'success'}), 
        { 
          status: 200, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          } 
        }
      );
        }catch (e) {
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

export async function GetUserBag(request, env) {
        try{
         let uuid, token;
         try{
         const body = await request.json();
         token = body.token;
         uuid = body.uuid;
        }catch (e){
        return new Response(
        JSON.stringify({ error: 'Invalid JSON' }), 
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          } 
        }
      );}
        const storedData = await env.kv.get(`uuid:${uuid}`);
        if(!storedData){
        return new Response(
        JSON.stringify({ error: 'Invalid Parameter' }), 
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          } 
        }
      );}
      if(storedData != token){
        return new Response(
        JSON.stringify({ error: 'Login session has expired, please log in again' }), 
        { 
          status: 401, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          } 
        }
      );}
       const userStmt = env.db.prepare("SELECT level FROM bag WHERE uuid = ?");
       const user = await userStmt.bind(uuid).first();
       if(!user){
        return new Response(
        JSON.stringify({ error: 'Unable to find the corresponding data on the server' }), 
        { 
          status: 404, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          } 
        }
      );}
       return new Response(
        JSON.stringify({ status: 'success', level: user.level }), 
        { 
          status: 200, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          } 
        }
      );
        }catch (e) {
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
export async function Login(request, env) {
    try{
     let timestamp=new Date().getTime();
     let password, email;
    try{
         const body = await request.json();
         email = body.email?.trim().toLowerCase();  // 邮箱统一转小写，去掉空格
         password = body.password;
        }catch (e){
        return new Response(
        JSON.stringify({ error: 'Invalid JSON' }), 
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          } 
        }
      );}
                if (!email) {
          return new Response(
           JSON.stringify({ error: 'Invalid email or password' }),
         { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
            );
        }
     if (!password) {
        return new Response(
       JSON.stringify({ error: 'Invalid email or password' }),
       { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
     );

}
        const user = await env.db.prepare(
        "SELECT password_key, is_del, uuid ,password ,name, status FROM users WHERE email = ?"
        ).bind(email).first();
        if(!user){
            return new Response(
            JSON.stringify({ error: 'Invalid email or password' }),
            { status: 401, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
          );
        }
    
        if (user.is_del == 1 ){
            return new Response(
            JSON.stringify({ error: 'Invalid email or password' }),
            { status: 401, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
          );
         }

        const inputHash = await calculateHMAC(password, user.password_key);
if (inputHash !== user.password ) {
  return new Response(
    JSON.stringify({ error: 'Invalid email or password' }),
    { status: 401, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
  );
}
         if (user.status == 1 ){ //被封禁的账号
            return new Response(
            JSON.stringify({ error: 'This account has been banned' }),
            { status: 403, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
          );
         }
    const storedData = await env.kv.get(`uuid:${user.uuid}`);
    if (storedData){
         await env.kv.delete(`uuid:${user.uuid}`);
    }
         const token = generateTimeOrderedUUID();
         await env.kv.put( 
          `uuid:${user.uuid}`, 
         token,
        { expirationTtl: 604800 } //一个星期的时间
      );
        const userAgentString = request.headers.get('User-Agent') || '';
    let os = getSystem(userAgentString);
    let browser = getBrowser(userAgentString);
    let device = getDevice(userAgentString);
await env.db.prepare(
  "UPDATE users SET active_time = ? , browser = ? , os = ?, device = ? WHERE uuid = ?"
).bind(timestamp , browser, os , device, user.uuid).run();

  return new Response(
    JSON.stringify({ status: 'success', token: token, uuid: user.uuid,name: user.name }),
    { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
  );
    
    }catch (e) {
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

export async function CreateAccount(request, env) {  //项目内使用的自定义状态码在操作手册内定义

  try {
    let timestamp=new Date().getTime();
    
    let create_time=timestamp;
    let uuid=generateTimeOrderedUUID();
    let active_time=timestamp;
    const pw_key=uuid+"_"+create_time;
    let email="";
    let password="";
    let name="";
    let is_del=0;
    let status=0; //正常状态
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
      email = body.email?.trim().toLowerCase();
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
  try {
  const result = await env.db.prepare(
    "INSERT INTO users (name, uuid, email, password, password_key, permission, status, create_time,  active_time, is_del, browser, create_ip, device, os) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).bind(name,uuid, email, password, pw_key, permission, status, create_time, active_time, is_del, browser, create_ip, device, os).run();

    } catch (dbError) {
      // ---------- 5. 处理数据库约束错误 ----------
      let errMsg = dbError.message || '';
      
      // 检查是否为唯一约束冲突
      if (errMsg.includes('UNIQUE constraint failed') || errMsg.includes('SQLITE_CONSTRAINT')) {
        if (errMsg.includes('email')) {
          return new Response(
            JSON.stringify({ error: 'Email already exists', code: 'EMAIL_EXISTS' }), 
            { status: 409, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
          );
        } else if (errMsg.includes('uuid')) {
          // UUID冲突概率极低，但万一发生可以重试或返回错误
          return new Response(
            JSON.stringify({ error: 'Internal error, please try again', code: 'UUID_CONFLICT' }), 
            { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
          );
        } else {
          return new Response(
            JSON.stringify({ error: 'Duplicate data', code: 'DUPLICATE' }), 
            { status: 409, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
          );
        }
      }
      console.error('Database error:', dbError);
      return new Response(
        JSON.stringify({ error: 'Database operation failed' }), 
        { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

  try {
  const result = await env.db.prepare(
    "INSERT INTO bag (uuid, level) VALUES (?, ?)"
  ).bind(uuid, 0).run();
    } catch (dbError) {
      // ---------- 5. 处理数据库约束错误 ----------
      let errMsg = dbError.message || '';
      
      // 检查是否为唯一约束冲突
if (errMsg.includes('uuid')) {
          // UUID冲突概率极低，但万一发生可以重试或返回错误
          return new Response(
            JSON.stringify({ error: 'Internal error, please try again', code: 'UUID_CONFLICT' }), 
            { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
          );
        } else {
          return new Response(
            JSON.stringify({ error: 'Duplicate data', code: 'DUPLICATE' }), 
            { status: 409, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
          );
        }
      
      console.error('Database error:', dbError);
      return new Response(
        JSON.stringify({ error: 'Database operation failed' }), 
        { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }
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

export async function InitDatabase(request, env) {
  try {
    // 分步执行 SQL 语句，避免 exec() 的问题
    const statements = [
      `CREATE TABLE IF NOT EXISTS users (
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
        os TEXT
      )`,
    `CREATE TABLE IF NOT EXISTS bag (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT NOT NULL UNIQUE,
        level INTEGER NOT NULL
      )`,
      "CREATE INDEX IF NOT EXISTS idx_email ON users(email)",
      "CREATE INDEX IF NOT EXISTS idx_status ON users(status)",
      "CREATE INDEX IF NOT EXISTS idx_create_time ON users(create_time)",
      "CREATE INDEX IF NOT EXISTS idx_bag_uuid ON bag(uuid);"
    ];
    
    // 批量执行所有语句
    const results = [];
    for (const sql of statements) {
      const result = await env.db.prepare(sql).run();
      results.push({ sql, success: result.success });
    }
    
    return new Response(
      JSON.stringify({ 
        status: 'success', 
        message: 'Database table initialized successfully',
        results: results
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
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        } 
      }
    );
  }
}
