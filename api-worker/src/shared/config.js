// src/shared/config.js

export const REVERSE_VERIFY_CONFIG = {
  // 允许接收邮件的域名列表（不在列表内的邮件直接忽略）
  ALLOWED_DOMAINS: ["services.undz.cn"],

  // 单封邮件允许的最大字节数 (1MB，防止大附件导致 Worker 内存溢出)
  MAX_EMAIL_SIZE: 1024 * 1024,
  // 任务默认过期时间 (秒)
  DEFAULT_TTL: 300,

  // 默认子地址前缀、子地址长度、期望的验证码长度
  DEFAULT_PREFIX: "onecode",
  DEFAULT_TOKEN_LENGTH: 3,
  DEFAULT_CODE_LENGTH: 6,

  // 验证通过后，记录的最长保留时间 (秒)，供业务端消费
  VERIFIED_RETENTION_TTL: 3600,
};

// 预定义的 Action 常量，用于隔离不同业务场景
export const ACTION_PRESETS = {
  GLOBAL: "global",
  REGISTER: "register",
  LOGIN: "login",
  CHANGE_PASSWORD: "change_password",
  CHANGE_EMAIL: "change_email",
};
