// src/utils/validators.js

// 后端 allow list 保持一致
const allowedEmailDomains = [
    'aliyun.com', 'qq.com', '163.com', '126.com', 'foxmail.com',
    'sina.com', 'sina.cn', 'sohu.com', '139.com', '189.cn',
    '21cn.com', 'tom.com', 'yeah.net', '263.net', 'vip.qq.com',
    'vip.163.com', 'vip.sina.com', 'vip.sina.cn', 'gmail.com',
    'outlook.com', 'hotmail.com', 'live.com', 'msn.com',
    'yahoo.com', 'yahoo.co.jp', 'yahoo.com.hk', 'yahoo.com.tw',
    'icloud.com', 'me.com', 'mac.com', 'aol.com', 'protonmail.com',
    'mail.com', 'gmx.com', 'zoho.com', 'yandex.com', 'rambler.ru',
    'undz.cn', 'io.hb.cn', '2x.nz', 'edu.cn', 'gov.cn', 'yzhyzxy.cn'
];

export function isEmailDomainAllowed(email) {
    return !allowedEmailDomains.some((domain) => email.endsWith(domain))
}