const express = require("express");
const nodemailer = require("nodemailer");
require("dotenv").config();
const app = express();
app.use(express.json());

// ---------- 默认限流配置 ----------
const DEFAULT_EMAIL_RATE_LIMIT = { windowMs: 30000, maxRequests: 1 };
const DEFAULT_IP_RATE_LIMIT = { windowMs: 60000, maxRequests: 5 };

// 实际动态配置变量
let EMAIL_RATE_LIMIT = { ...DEFAULT_EMAIL_RATE_LIMIT };
let IP_RATE_LIMIT = { ...DEFAULT_IP_RATE_LIMIT };

const emailRateStore = new Map();
const ipRateStore = new Map();
// ---------- 配置 ----------
const SMTP_CONFIGS = [
  {
    email: "aeyundian@139.com",
    host: "smtp.139.com",
    port: 465,
    secure: true,
    auth: {
      user: "aeyundian@139.com",
      pass: process.env.SMTP_PASS_139,
    },
  },
  {
    email: "aeyundian@189.cn",
    host: "smtp.189.cn",
    port: 465,
    secure: true,
    auth: {
      user: "aeyundian@189.cn",
      pass: process.env.SMTP_PASS_189,
    },
  },
  {
    email: "aeyundian@sina.cn",
    host: "smtp.sina.cn",
    port: 465,
    secure: true,
    auth: {
      user: "aeyundian@sina.cn",
      pass: process.env.SMTP_PASS_SINA_CN,
    },
  },
  {
    email: "aeyundian@sina.com",
    host: "smtp.sina.com",
    port: 465,
    secure: true,
    auth: {
      user: "aeyundian@sina.com",
      pass: process.env.SMTP_PASS_SINA_COM,
    },
  },
  {
    email: "aeyundian@163.com",
    host: "smtp.163.com",
    port: 465,
    secure: true,
    auth: {
      user: "aeyundian@163.com",
      pass: process.env.SMTP_PASS_163,
    },
  },
  {
    email: "aeyundian@126.com",
    host: "smtp.126.com",
    port: 465,
    secure: true,
    auth: {
      user: "aeyundian@126.com",
      pass: process.env.SMTP_PASS_126,
    },
  },
  {
    email: "aeyundian@qq.com",
    host: "smtp.qq.com",
    port: 465,
    secure: true,
    auth: {
      user: "aeyundian@qq.com",
      pass: process.env.SMTP_PASS_QQ,
    },
  },
  {
    email: "aeyundian@foxmail.com",
    host: "smtp.qq.com",
    port: 465,
    secure: true,
    auth: {
      user: "aeyundian@foxmail.com",
      pass: process.env.SMTP_PASS_FOXMAIL,
    },
  },
  {
    email: "aeyundian@yeah.net",
    host: "smtp.yeah.net",
    port: 465,
    secure: true,
    auth: {
      user: "aeyundian@yeah.net",
      pass: process.env.SMTP_PASS_YEAHNET,
    },
  },
];

function getTransporter(config) {
  const key = config.auth.user;
  if (transporterCache.has(key)) return transporterCache.get(key);
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    family: 6, // 统一强制 IPv6
    auth: config.auth,
  });
  transporterCache.set(key, transporter);
  console.log(`[${getFormattedTime()}] Sel ${config.email}`);
  return transporter;
}

const API_KEY = process.env.MAIL_API_KEY;

// ---------- 工具函数 ----------
function getFormattedTime() {
  const now = new Date();
  const year = String(now.getFullYear()).slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function getRealIP(req) {
  const cfIP = req.headers["cf-connecting-ip"];
  if (cfIP) return cfIP;
  const xff = req.headers["x-forwarded-for"];
  if (xff) {
    const ips = xff.split(",").map((ip) => ip.trim());
    return ips[0];
  }
  return req.ip;
}

// ---------- 核心限流逻辑重构 ----------
function isLimited(store, config, key) {
  // 如果 windowMs 或 maxRequests 为 0（或负数），判定为“禁用状态”，不限制
  if (config.windowMs <= 0 || config.maxRequests <= 0) return false;
  const now = Date.now();
  const windowStart = now - config.windowMs;
  let timestamps = store.get(key) || [];
  timestamps = timestamps.filter((ts) => ts > windowStart);
  if (timestamps.length >= config.maxRequests) return true;
  return false;
}

function recordRequest(store, config, key) {
  // 如果处于禁用状态，不记录请求次数
  if (config.windowMs <= 0 || config.maxRequests <= 0) return;
  const now = Date.now();
  const windowStart = now - config.windowMs;
  let timestamps = store.get(key) || [];
  timestamps = timestamps.filter((ts) => ts > windowStart);
  timestamps.push(now);
  store.set(key, timestamps);
}

function isEmailLimited(email) {
  return isLimited(emailRateStore, EMAIL_RATE_LIMIT, email);
}
function recordEmailSend(email) {
  recordRequest(emailRateStore, EMAIL_RATE_LIMIT, email);
}
function isIPLimited(ip) {
  return isLimited(ipRateStore, IP_RATE_LIMIT, ip);
}
function recordIPRequest(ip) {
  recordRequest(ipRateStore, IP_RATE_LIMIT, ip);
}

// ---------- 邮件发送逻辑 ----------
const transporterCache = new Map();
let lastUsedIndex = -1;

function pickEmailConfig() {
  const total = SMTP_CONFIGS.length;
  if (total === 0) throw new Error("No email config available");
  if (total === 1) return SMTP_CONFIGS[0];

  let candidates = [];
  if (lastUsedIndex >= 0 && lastUsedIndex < total) {
    candidates = SMTP_CONFIGS.filter((_, idx) => idx !== lastUsedIndex);
  } else {
    candidates = SMTP_CONFIGS.slice();
  }

  const randomIdx = Math.floor(Math.random() * candidates.length);
  const selected = candidates[randomIdx];
  lastUsedIndex = SMTP_CONFIGS.indexOf(selected);
  return selected;
}

function pickRandomExcluding(excludedSet) {
  const available = SMTP_CONFIGS.filter((_, idx) => !excludedSet.has(idx));
  if (available.length === 0) return null;
  const randomIdx = Math.floor(Math.random() * available.length);
  return available[randomIdx];
}

async function sendMail(to, subject, text, html = null) {
  const total = SMTP_CONFIGS.length;
  if (total === 0) {
    return { success: false, error: "No email config available" };
  }

  let firstConfig = pickEmailConfig();
  let triedIndices = new Set();
  triedIndices.add(SMTP_CONFIGS.indexOf(firstConfig));

  for (let attempt = 0; attempt < total; attempt++) {
    const config =
      attempt === 0 ? firstConfig : pickRandomExcluding(triedIndices);
    if (!config) break;

    const transporter = getTransporter(config);
    const mailOptions = {
      from: config.email,
      to,
      subject,
      text,
      html,
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      lastUsedIndex = SMTP_CONFIGS.indexOf(config);
      return {
        success: true,
        messageId: info.messageId,
        usedEmail: config.email,
        attempts: attempt + 1,
      };
    } catch (err) {
      triedIndices.add(SMTP_CONFIGS.indexOf(config));
      if (attempt === total - 1) {
        return {
          success: false,
          error: err.message,
          usedEmail: config.email,
          attempts: total,
        };
      }
    }
  }

  // 兜底（理论上不会执行到这里）
  return {
    success: false,
    error: "All email providers failed unexpectedly",
    usedEmail: null,
    attempts: total,
  };
}

// ---------- 路由 ----------
app.post("/send", async (req, res) => {
  const clientIP = getRealIP(req);
  const auth = req.headers.authorization;
  if (!auth || auth !== `Bearer ${API_KEY}`) {
    console.log(
      `[${getFormattedTime()}] ${clientIP} Request /send Unauthorized`,
    );
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { to, subject = "无主题", body, html } = req.body;
  if (!to) {
    console.log(
      `[${getFormattedTime()}] ${clientIP} Request /send Missing "to" field`,
    );
    return res.status(400).json({ error: 'Missing "to" field' });
  }
  if (!body) {
    console.log(
      `[${getFormattedTime()}] ${clientIP} Request /send Missing "body" field`,
    );
    return res.status(400).json({ error: 'Missing "body" field' });
  }

  if (isEmailLimited(to)) {
    console.log(`[${getFormattedTime()}] ${clientIP} Request /send Email 429`);
    return res.status(429).json({
      status: "error",
      error: `Too many requests for this email address. Please wait ${EMAIL_RATE_LIMIT.windowMs / 1000} seconds.`,
    });
  }

  if (isIPLimited(clientIP)) {
    console.log(`[${getFormattedTime()}] ${clientIP} Request /send IP 429`);
    return res.status(429).json({
      status: "error",
      error: `Too many requests from your IP. Please wait ${IP_RATE_LIMIT.windowMs / 1000} seconds.`,
    });
  }
  const result = await sendMail(to, subject, body, html);
  if (result.success) {
    recordEmailSend(to);
    recordIPRequest(clientIP);
    console.log(
      `[${getFormattedTime()}] ${clientIP} Request /send Response 200`,
    );
    res.status(200).json({
      status: "ok",
      messageId: result.messageId,
      usedEmail: result.usedEmail,
      attempts: result.attempts,
    });
  } else {
    console.log(
      `[${getFormattedTime()}] ${clientIP} Request /send Response 500`,
    );
    console.log(
      `[${getFormattedTime()}] ${result.error} ${result.usedEmail} ${result.attempts}`,
    );
    res.status(500).json({
      status: "error",
      error: result.error,
      usedEmail: result.usedEmail,
      attempts: result.attempts,
    });
  }
});
app.get("/config", (req, res) => {
  const clientIP = getRealIP(req);
  const auth = req.query.key;
  if (!auth || auth !== `${API_KEY}`) {
    console.log(
      `[${getFormattedTime()}] ${clientIP} Request /config Unauthorized`,
    );
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { type, action, windowMs, maxRequests } = req.query;

  // 确定要修改的目标配置
  let targetConfigs = [];
  if (type === "email") targetConfigs = [EMAIL_RATE_LIMIT];
  else if (type === "ip") targetConfigs = [IP_RATE_LIMIT];
  else if (type === "all") targetConfigs = [EMAIL_RATE_LIMIT, IP_RATE_LIMIT];
  else {
    return res
      .status(400)
      .json({ error: "Invalid type. Must be 'email', 'ip', or 'all'." });
  }

  for (let cfg of targetConfigs) {
    if (action === "disable") {
      // 设为 0 即可触发禁用逻辑
      cfg.windowMs = 0;
      cfg.maxRequests = 0;
    } else if (action === "enable") {
      // 恢复默认配置
      if (cfg === EMAIL_RATE_LIMIT) {
        cfg.windowMs = DEFAULT_EMAIL_RATE_LIMIT.windowMs;
        cfg.maxRequests = DEFAULT_EMAIL_RATE_LIMIT.maxRequests;
      } else if (cfg === IP_RATE_LIMIT) {
        cfg.windowMs = DEFAULT_IP_RATE_LIMIT.windowMs;
        cfg.maxRequests = DEFAULT_IP_RATE_LIMIT.maxRequests;
      }
    } else if (action === "set") {
      let w = parseInt(windowMs);
      let m = parseInt(maxRequests);
      if (isNaN(w) || w < 0 || isNaN(m) || m < 0) {
        return res.status(400).json({
          error:
            "'windowMs' and 'maxRequests' must be valid non-negative numbers.",
        });
      }
      cfg.windowMs = w;
      cfg.maxRequests = m;
    } else {
      return res.status(400).json({
        error: "Invalid action. Must be 'disable', 'enable', or 'set'.",
      });
    }
  }

  console.log(
    `[${getFormattedTime()}] ${clientIP} Request /config Response 200`,
  );
  return res.status(200).json({
    status: "ok",
    message: `Config updated for '${type}'. Current config: Email(${EMAIL_RATE_LIMIT.windowMs}ms, ${EMAIL_RATE_LIMIT.maxRequests}次), IP(${IP_RATE_LIMIT.windowMs}ms, ${IP_RATE_LIMIT.maxRequests}次)`,
  });
});
app.get("/health", (req, res) => {
  const clientIP = getRealIP(req);
  console.log(
    `[${getFormattedTime()}] ${clientIP} Request /health Response 200`,
  );
  res.status(200).json({ status: "alive" });
});

// 404 处理
app.use((req, res) => {
  const clientIP = getRealIP(req);
  if (req.path === "/favicon.ico") {
    console.log(
      `[${getFormattedTime()}] ${clientIP} Request ${req.path} Response 204`,
    );
    return res.status(204).end();
  }
  console.log(
    `[${getFormattedTime()}] ${clientIP} Request ${req.path} Response 404`,
  );
  res.status(404).send(`<!DOCTYPE html>
<html>
    <head>
        <title>404 Not Found</title>
    </head>
    <body style="text-align: center;">
        <h1>404 Not Found</h1>
        <hr>
        <p>nginx/1.16.1</p>
    </body>
</html>`);
});

const PORT = 80;
const HOST = "::";
app.listen(PORT, HOST, () => {
  console.log(`Mail API running on http://[${HOST}]:${PORT}`);
});
setInterval(() => {
  console.log(`[${getFormattedTime()}] Run scheduled task`);
  const cleanStore = (store, windowMs) => {
    const now = Date.now();
    const windowStart = now - windowMs;
    for (const [key, timestamps] of store.entries()) {
      const filtered = timestamps.filter((ts) => ts > windowStart);
      if (filtered.length === 0) {
        store.delete(key);
      } else {
        store.set(key, filtered);
      }
    }
  };
  cleanStore(emailRateStore, EMAIL_RATE_LIMIT.windowMs);
  cleanStore(ipRateStore, IP_RATE_LIMIT.windowMs);
}, 600000);
