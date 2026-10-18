# 微信登录 / 注册接入方案（个人开发者）

> 结论先说：**个人开发者做不了微信网页 OAuth（服务号网页授权、开放平台网站应用扫码），
> 但可以用「个人主体小程序 + `wx.login`」实现同等体验的微信登录，并额外做 PC 扫码登录。**
>
> 本文按本项目（`online.undz.cn` 账号中心）的现有结构给出可落地的设计，
> 包含端点、数据表、错误码、小程序端流程、扫码登录时序和安全清单。
> 官方文档链接见文末。

---

## 0. 三条路线，个人能走哪条

| 路线 | 用户体验 | 个人主体 | 关键前提 | 结论 |
|---|---|---|---|---|
| 服务号网页授权（公众号 OAuth） | 微信内 H5 静默/授权登录 | ❌ | 认证服务号（企业/个体工商户主体） | 用不了 |
| 开放平台「网站应用」扫码登录 | PC 网页扫码 | ❌（基本） | 开放平台账号 + 网站应用审核 + 开发者资质认证 | 不建议押 |
| 个人主体小程序 + `wx.login` | 小程序内一键登录 / PC 扫码 | ✅ | 个人小程序 + 备案 + 服务器域名 | **推荐** |

### 0.1 为什么服务号网页授权不行

微信服务号的 H5 文档明确写着「网页授权……**仅服务号可用**」：

- [微信网页开发（服务号）](https://developers.weixin.qq.com/doc/service/guide/h5/)
- [微信网页授权](https://developers.weixin.qq.com/doc/service/guide/h5/auth.html)

而个人主体在公众平台只能注册**订阅号**，订阅号没有网页授权能力。
所以「微信内置浏览器打开 H5 → 静默拿 openid」这条路，个人开发者走不通。

### 0.2 为什么开放平台网站应用扫码也不建议

网站应用微信登录要求：开放平台账号 + 已审核通过的网站应用 + 申请微信登录并通过审核，
且官网主体信息要与开放平台认证主体一致（见[网站应用微信登录](https://developers.weixin.qq.com/doc/oplatform/Website_App/WeChat_Login/Wechat_Login.html)、
[应用审核规范](https://developers.weixin.qq.com/doc/oplatform/Website_App/operation.html)）。
个人主体通常无法完成开放平台开发者资质认证，后台也选不到对应类目。
这条路的门槛在企业/个体工商户，不是代码。

### 0.3 个人主体小程序：可行

官方注册页明确支持「个人」主体（18 岁以上、有国内身份信息的实名微信用户）：

- [小程序注册与主体类型](https://developers.weixin.qq.com/miniprogram/introduction/)

个人小程序可以：

- 调用 `wx.login` 拿 `code`，服务端换 `openid`；
- 生成小程序码（`getUnlimited`），做 PC 扫码登录；
- 使用头像昵称填写能力（`chooseAvatar` / `nickname` 输入框）。

个人小程序**不能**：

- 微信认证（官方原文：「个人类型账号暂不支持微信认证」）；
- 微信支付；
- 绑定开放平台账号（绑定要求开放平台完成开发者资质认证）→ **拿不到 UnionID**；
- 手机号快速验证组件（通常要求已认证，别依赖它）。

> 没有 UnionID 不是问题：本项目的账号主键是 `online_users.sub`，
> 微信 `openid` 只是「登录方式」，通过 `oauth_connections` 映射到 AY 账号即可。

---

## 1. 整体方案

```
┌────────────────────── 小程序内登录 ──────────────────────┐
│ 小程序 wx.login() → code                                 │
│        ↓                                                 │
│ POST /api/auth/wechat/mp/login { code }                  │
│        ↓                                                 │
│ 服务端 code2session → openid                              │
│        ├─ 已绑定 → 签发 AY access/refresh，返回 JSON       │
│        └─ 未绑定 → 返回 bind_token，引导绑定/注册          │
└──────────────────────────────────────────────────────────┘

┌────────────────────── PC 扫码登录 ───────────────────────┐
│ 网页 POST /api/auth/wechat/qr/create                     │
│        ↓ 生成 state + 小程序码（scene=state）             │
│ 页面轮询 GET /api/auth/wechat/qr/poll?state=...           │
│        ↓                                                 │
│ 用户微信扫码 → 小程序确认页（已登录）                      │
│        ↓ POST /api/auth/wechat/qr/confirm（Bearer）       │
│ 票据 confirmed → 网页拿到 AY 登录态                       │
└──────────────────────────────────────────────────────────┘
```

两条链路最终都落到同一张映射表：`oauth_connections(provider='wechat_mp', openid, user_sub)`。

---

## 2. 接入前准备（个人主体）

### 2.1 注册小程序

1. 打开 [mp.weixin.qq.com](https://mp.weixin.qq.com/) → 立即注册 → 小程序。
2. 主体类型选「个人」，完成身份证 + 人脸/微信实名验证。
3. 记录 `AppID`，在「开发管理 → 开发设置」生成 `AppSecret`。

### 2.2 备案

新小程序上线前必须完成备案（个人可以备案）：

- [小程序备案操作指引](https://developers.weixin.qq.com/miniprogram/product/record_guidelines.html)

备案需要：主体信息、负责人信息、服务内容、域名等。周期通常几天到两周。

### 2.3 服务器域名

小程序只能请求在后台配置过的 HTTPS 域名：

- 开发管理 → 开发设置 → 服务器域名 → request 合法域名
- 填 `https://online.undz.cn`（以及你实际用到的域名）
- 域名必须已备案、证书有效

参考：[网络能力 · 业务域名](https://developers.weixin.qq.com/miniprogram/dev/framework/ability/network.html)

### 2.4 类目与审核

- 个人主体可选的类目有限，选「工具 / 生活服务 / 教育（按实际）」等；
- 小程序里必须有真实可用的功能，不能只是「登录页 + 空白」；
- 隐私协议里写明收集 openid、头像昵称的用途；
- 审核时可能需要提供测试账号。

### 2.5 环境变量

在 `api-worker` 增加：

```toml
# wrangler secret put WECHAT_MP_APPID
# wrangler secret put WECHAT_MP_SECRET
WECHAT_MP_APPID = "wx..."
WECHAT_MP_SECRET = "..."      # 只能放服务端，绝不进小程序
```

`AppSecret` 泄露等于别人可以冒充你的小程序服务端，必须用 secret 管理。

---

## 3. 账号体系对接设计

### 3.1 provider 命名

统一用 `wechat_mp`（微信小程序），不要用 `wechat`，给以后可能接入的服务号/网站应用留区分：

| provider | 来源 | openid 作用域 |
|---|---|---|
| `wechat_mp` | 小程序 `code2session` | 当前小程序 AppID |
| （未来）`wechat_oa` | 服务号网页授权 | 当前公众号 AppID |
| （未来）`wechat_web` | 开放平台网站应用 | 当前网站应用 AppID |

### 3.2 复用现有表

`oauth_connections` 已经够用：

```sql
-- 已有表，不新增字段
-- provider TEXT, openid TEXT, user_sub INTEGER, created_at INTEGER
-- UNIQUE(provider, openid)
```

新增扫码票据表：

```sql
CREATE TABLE IF NOT EXISTS wechat_login_tickets (
  state       TEXT PRIMARY KEY,
  status      TEXT NOT NULL DEFAULT 'pending', -- pending | confirmed | consumed | expired
  user_sub    INTEGER,
  client_hint TEXT NOT NULL DEFAULT '',        -- 发起扫码的站点/UA，展示给用户确认
  created_at  INTEGER NOT NULL,
  expires_at  INTEGER NOT NULL,
  confirmed_at INTEGER,
  consumed_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_wechat_tickets_exp
  ON wechat_login_tickets(expires_at);
```

建表仍走 `services/account/db/schema.js` + `POST /api/ayonline/init`（项目没有迁移系统）。

### 3.3 端点

新增 `services/account/routes/wechat.js`，在 `ayOnline.js` 里紧接 `handleThirdPartyAuth` 调用
（这样 `/api/auth/wechat/*` 不会落到 `/api/ayonline/*` 的闸门里）。

| 方法 | 路径 | 登录态 | 说明 |
|---|---|---|---|
| POST | `/api/auth/wechat/mp/login` | — | `{ code }`，已绑定直接返回 token |
| POST | `/api/auth/wechat/mp/bind` | bind_token | `{ bind_token, username, password }` 绑定已有账号 |
| POST | `/api/auth/wechat/mp/register` | bind_token | `{ bind_token, username, email, password, email_code, email_token }` 注册并绑定 |
| GET | `/api/auth/wechat/mp/bindings` | Cookie/Bearer | 当前账号绑定的微信 |
| POST | `/api/auth/wechat/mp/unbind` | Cookie/Bearer | 解绑 |
| POST | `/api/auth/wechat/qr/create` | — | 生成扫码票据 + 小程序码 |
| GET | `/api/auth/wechat/qr/poll` | — | `?state=` 轮询状态 |
| POST | `/api/auth/wechat/qr/confirm` | Bearer | 小程序内确认登录 |
| GET | `/api/auth/wechat/qr/image` | — | `?state=` 代理小程序码图片 |

### 3.4 登录返回

小程序没有 Cookie，登录接口必须把 token 放在 JSON 里：

```json
{
  "bound": true,
  "access_token": "eyJ...",
  "refresh_token": "a1b2...",
  "expires_in": 600,
  "user": { "sub": 42, "username": "alice", "avatar": "..." }
}
```

未绑定时：

```json
{
  "bound": false,
  "bind_token": "eyJ...",
  "expires_in": 600,
  "openid_hint": "o***Xw"
}
```

`bind_token` 是短期 JWT（HS256，`aud=wechat-mp-bind`，10 分钟，含 `openid` + `jti`），
服务端在 KV 里记 `jti` 保证一次性。

### 3.5 绑定已有账号

```
POST /api/auth/wechat/mp/bind
{ "bind_token": "...", "username": "alice", "password": "******" }
```

服务端：

1. 验 `bind_token`，取 `openid`；
2. 复用 `authenticateUser(db, username, password)` 校验账号密码；
3. 检查 `oauth_connections` 里 `openid` 是否已被别的账号绑定；
4. `INSERT INTO oauth_connections (provider, openid, user_sub, created_at) VALUES ('wechat_mp', ?, ?, ?)`；
5. 签发 access/refresh，返回。

> 绑定走密码而不是短信/邮箱验证码，是为了避免在个人小程序里复刻 GeeTest；
> 如果不想在微信里输密码，可以在网页端登录后生成 6 位「绑定码」，小程序输入绑定码完成绑定。

### 3.6 新用户注册

个人小程序没有 GeeTest，直接复用现有 `/api/ayonline/register` 会缺 `gt`。
两个选择：

**A. 推荐：网页注册，小程序只负责登录**

用户在 `online.undz.cn` 正常注册（邮箱验证码 + GeeTest），
然后在小程序里用「绑定已有账号」登录。个人开发者的合规成本最低。

**B. 小程序内注册**

新增 `/api/auth/wechat/mp/register`，要求：

- 必须带有效 `bind_token`（证明 openid 来自微信，不是客户端伪造）；
- 邮箱验证码复用 `mail_verify`；
- 服务端对 `openid + IP` 限流（例如 5 次/小时）；
- 注册成功后立即写 `oauth_connections` 并签发 token。

> 少掉 GeeTest 意味着注册接口更容易被脚本刷。如果选 B，至少加：
> Cloudflare Turnstile（可在小程序 web-view 里用）或邮箱验证码 + 严格限流。

### 3.7 错误码

账号段当前用到 1043，从 1044 继续（只增不改）：

| 号 | 常量 | HTTP | 含义 |
|---|---|---|---|
| 1044 | `WECHAT_CODE_INVALID` | 400 | `code` 为空/格式错误/已使用 |
| 1045 | `WECHAT_UPSTREAM_ERROR` | 502 | `jscode2session` 上游失败 |
| 1046 | `WECHAT_NOT_BOUND` | 409 | 该微信尚未绑定 AY 账号 |
| 1047 | `WECHAT_BIND_TOKEN_INVALID` | 401 | bind_token 无效/过期/已用 |
| 1048 | `WECHAT_ALREADY_BOUND` | 409 | 该微信已绑定其他账号 |
| 1049 | `WECHAT_QR_EXPIRED` | 410 | 扫码票据过期 |
| 1050 | `WECHAT_QR_NOT_CONFIRMED` | 409 | 票据尚未确认 |
| 1051 | `WECHAT_MP_DISABLED` | 503 | 未配置 AppID/Secret 或功能关闭 |

同步补 `ERROR_CODES` / `ERROR_MESSAGES` / `ERROR_STATUS`。

---

## 4. 服务端实现

### 4.1 code2session

```js
// services/account/wechat.js
export async function code2session(env, code) {
  if (!env.WECHAT_MP_APPID || !env.WECHAT_MP_SECRET) {
    return { error: "WECHAT_MP_DISABLED" };
  }
  if (typeof code !== "string" || code.length < 8 || code.length > 128) {
    return { error: "WECHAT_CODE_INVALID" };
  }

  const url = new URL("https://api.weixin.qq.com/sns/jscode2session");
  url.searchParams.set("appid", env.WECHAT_MP_APPID);
  url.searchParams.set("secret", env.WECHAT_MP_SECRET);
  url.searchParams.set("js_code", code);
  url.searchParams.set("grant_type", "authorization_code");

  // 注意：URL 里带 secret，日志千万不要打印完整 URL
  const res = await fetch(url.toString(), {
    headers: { "User-Agent": "ay-api/1.0" },
  });
  if (!res.ok) return { error: "WECHAT_UPSTREAM_ERROR" };

  const data = await res.json();
  if (data.errcode) {
    // 40029 code 无效；45011 频率限制；40163 code 已使用
    return { error: "WECHAT_CODE_INVALID", detail: data.errcode };
  }
  if (!data.openid || !data.session_key) {
    return { error: "WECHAT_UPSTREAM_ERROR" };
  }

  // session_key 只用于解密，登录场景不需要落库，更不要返回给客户端
  return { openid: data.openid, unionid: data.unionid || null };
}
```

### 4.2 签发 AY token

复用现有能力：

```js
import { signAccessToken } from "./auth/jwt.js";
import { storeRefreshToken } from "./auth/tokens.js";
import { generateToken } from "../../shared/utils.js";

async function issueTokens(env, user) {
  const accessToken = await signAccessToken(
    {
      sub: user.sub,
      username: user.username,
      email: user.email,
      gender: user.gender,
      avatar: user.avatar,
      description: user.description,
      created_at: user.created_at,
      via: "wechat_mp",
    },
    env.JWT_KEY,
  );

  const refreshToken = generateToken();
  await storeRefreshToken(getKv(), refreshToken, user.sub, REFRESH_TOKEN_TTL);

  return { access_token: accessToken, refresh_token: refreshToken, expires_in: 600 };
}
```

### 4.3 需要改的现有代码

`GET/POST /api/ayonline/refresh` 目前**只读 Cookie**：

```js
const cookies = parse(request.headers.get("Cookie") || "");
const refreshToken = cookies.refresh_token;
```

小程序没有 Cookie，需要改成：

```js
let refreshToken = cookies.refresh_token;
if (!refreshToken && method === "POST") {
  const body = await request.json().catch(() => null);
  refreshToken = body?.refresh_token || null;
}
```

向后兼容，不影响 Web。

### 4.4 路由挂载

`services/account/ayOnline.js`：

```js
import { handleWechatAuth } from "./routes/wechat.js";

const wechat = await handleWechatAuth({ request, env, url, path, method, cors });
if (wechat) return wechat;

const accountApi = await handleAccountApi({ ... });
```

顺序放在 `handleThirdPartyAuth` 之后、`handleAccountApi` 之前即可。

---

## 5. 小程序端

### 5.1 登录

```js
// utils/auth.js
export function loginByWechat() {
  return new Promise((resolve, reject) => {
    wx.login({
      timeout: 10000,
      success: async ({ code }) => {
        if (!code) return reject(new Error("wx.login 未返回 code"));
        try {
          const res = await wx.request({
            url: "https://online.undz.cn/api/auth/wechat/mp/login",
            method: "POST",
            header: { "Content-Type": "application/json" },
            data: { code },
          });
          if (res.statusCode !== 200) {
            return reject(new Error(res.data?.error || "登录失败"));
          }
          resolve(res.data);
        } catch (err) {
          reject(err);
        }
      },
      fail: reject,
    });
  });
}
```

返回 `bound: true` 时把 `access_token` / `refresh_token` 存 `wx.setStorageSync`；
`bound: false` 时进入绑定页。

### 5.2 绑定页

```js
const res = await wx.request({
  url: "https://online.undz.cn/api/auth/wechat/mp/bind",
  method: "POST",
  header: { "Content-Type": "application/json" },
  data: {
    bind_token: bindToken,
    username: this.data.username,
    password: this.data.password,
  },
});
```

成功后 `wx.setStorageSync("access_token", res.data.access_token)`。

### 5.3 头像昵称

不要用已废弃的 `wx.getUserProfile`。用官方「头像昵称填写能力」：

```html
<button open-type="chooseAvatar" bindchooseavatar="onChooseAvatar">
  <image src="{{avatarUrl}}" />
</button>
<input type="nickname" bindblur="onNickname" placeholder="请输入昵称" />
```

参考：[获取头像昵称](https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/userProfile.html)

### 5.4 请求封装

```js
export async function request(path, options = {}) {
  const token = wx.getStorageSync("access_token");
  const res = await wx.request({
    url: `https://online.undz.cn${path}`,
    method: options.method || "GET",
    header: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    data: options.data,
  });

  if (res.statusCode === 401 && wx.getStorageSync("refresh_token")) {
    await refresh();
    return request(path, options); // 重试一次
  }
  return res.data;
}
```

---

## 6. PC 扫码登录（小程序码）

### 6.1 时序

```
浏览器                          online.undz.cn                     小程序
  │ POST /qr/create                  │                                │
  │────────────────────────────────▶│ 生成 state(32B)                 │
  │                                 │ 调 getUnlimited(scene=state)    │
  │◀────────────────────────────────│ { state, expires_in:120 }       │
  │ GET /qr/image?state=...         │                                │
  │────────────────────────────────▶│ 代理图片（不暴露 access_token）  │
  │ 轮询 /qr/poll?state=...          │                                │
  │────────────────────────────────▶│ pending                        │
  │                                 │      用户扫码 ─────────────────▶│
  │                                 │◀──── POST /qr/confirm ─────────│
  │                                 │      (Authorization: Bearer)   │
  │                                 │ 标记 confirmed + user_sub       │
  │◀────────────────────────────────│ confirmed + Set-Cookie         │
```

### 6.2 生成小程序码

先拿接口调用凭证（缓存到 KV，TTL 7000 秒）：

```js
async function getAccessToken(env) {
  const cached = await getKv().get("wechat:mp:access_token");
  if (cached) return cached;

  const url =
    "https://api.weixin.qq.com/cgi-bin/token" +
    `?grant_type=client_credential&appid=${env.WECHAT_MP_APPID}&secret=${env.WECHAT_MP_SECRET}`;
  const data = await (await fetch(url)).json();
  if (!data.access_token) throw new Error(data.errmsg || "token failed");

  await getKv().put("wechat:mp:access_token", data.access_token, {
    expirationTtl: Math.max(60, (data.expires_in || 7200) - 200),
  });
  return data.access_token;
}
```

生成不限制小程序码：

```js
const res = await fetch(
  `https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=${token}`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      scene: state,                 // 最长 32 字符
      page: "pages/login/confirm",  // 必须是已发布页面
      width: 280,
      check_path: false,
      env_version: "release",
    }),
  },
);
// 成功返回 image buffer；失败返回 JSON（errcode）
```

参考：[获取不限制的小程序码](https://developers.weixin.qq.com/miniprogram/dev/server/API/qrcode-link/qr-code/api_getunlimitedqrcode.html)

> `scene` 最多 32 字符，用 16 字节随机数的 hex（32 字符）刚好。
> 开发阶段 `env_version` 可设 `trial`，并注意 `check_path`。

### 6.3 小程序确认页

```js
Page({
  onLoad(options) {
    // 扫码进入时 scene 在 options.scene，需 decodeURIComponent
    this.setData({ state: decodeURIComponent(options.scene || "") });
  },

  async confirm() {
    const res = await request("/api/auth/wechat/qr/confirm", {
      method: "POST",
      data: { state: this.data.state },
    });
    if (res.success) {
      wx.showToast({ title: "登录成功", icon: "success" });
    }
  },
});
```

确认前必须先完成小程序登录（拿到 AY access_token），否则无法知道是哪个账号确认。

### 6.4 网页轮询

```js
const timer = setInterval(async () => {
  const res = await fetch(
    `https://online.undz.cn/api/auth/wechat/qr/poll?state=${state}`,
    { credentials: "include" },
  );
  const data = await res.json();
  if (data.status === "confirmed") {
    clearInterval(timer);
    location.href = "/";
  }
  if (data.status === "expired") {
    clearInterval(timer);
    showExpired();
  }
}, 2000);
```

`poll` 在 `confirmed` 时负责：

1. 校验票据归属当前浏览器（见 6.6）；
2. 用 `user_sub` 签发 access/refresh Cookie；
3. 把票据标记 `consumed`，防止重复使用。

### 6.5 票据状态机

```
pending ──confirm──▶ confirmed ──poll(取token)──▶ consumed
   │                     │
   └──120s 未确认────────┴──▶ expired
```

所有状态转换用条件 UPDATE 保证一次性：

```sql
UPDATE wechat_login_tickets
   SET status = 'consumed', consumed_at = ?
 WHERE state = ? AND status = 'confirmed'
   AND expires_at > ?;
```

### 6.6 安全要点

- `state` 用 `crypto.getRandomValues` 生成，32 位 hex；
- 创建时写一个 `qr_client` HttpOnly Cookie（随机 16 字节），`poll` 必须带同一个 Cookie；
- `client_hint` 记录发起站点/UA，在确认页展示「XX 网站请求登录」，防止钓鱼；
- 票据 2 分钟过期，只能消费一次；
- `confirm` 必须带有效 AY access_token，且账号未被封禁；
- 生成二维码的接口做 IP 限流（例如 10 次/分钟）；
- 小程序码图片用服务端代理，避免把 `access_token` 拼进图片 URL 暴露给前端。

---

## 7. 安全清单

| 风险 | 处理 |
|---|---|
| 客户端伪造 openid | 只信 `code2session` 结果，绝不接受客户端传 openid |
| code 重放 | code 一次性，服务端换完即用；失败不重试同一个 code |
| AppSecret 泄露 | 只放 Worker secret，轮换后立刻更新 |
| session_key 泄露 | 不返回前端、不落库；登录不需要它 |
| bind_token 重放 | JWT + KV jti 一次性 + 10 分钟过期 |
| 扫码票据被抢 | `qr_client` Cookie 绑定 + 一次性消费 + 2 分钟过期 |
| 钓鱼确认 | 确认页展示 `client_hint`，用户可见是哪个站点 |
| 暴力注册 | 邮箱验证码 + `openid/IP` 限流；必要时加 Turnstile |
| 日志泄露 | 不打印完整微信请求 URL、code、secret、token |
| 账号封禁 | 登录/确认/刷新都要查 `online_users.banned` |

---

## 8. 上线步骤

1. **注册个人小程序**，拿到 AppID / AppSecret；
2. **完成小程序备案**（个人可备案）；
3. 配置 **request 合法域名** `https://online.undz.cn`；
4. `wrangler secret put WECHAT_MP_APPID` / `WECHAT_MP_SECRET`；
5. 跑一次 `/api/ayonline/init` 建 `wechat_login_tickets`；
6. 部署后端，联调 `/api/auth/wechat/mp/login`；
7. 小程序提交审核（准备测试账号、隐私协议、功能截图）；
8. 审核通过后发布；扫码登录的 `page` 必须是已发布页面。

---

## 9. 个人主体的限制与升级路径

| 能力 | 个人主体 | 企业/个体工商户 |
|---|---|---|
| 小程序注册 | ✅ | ✅ |
| `wx.login` / code2session | ✅ | ✅ |
| 小程序码扫码登录 | ✅ | ✅ |
| 微信认证 | ❌ | ✅（300 元/年） |
| 微信支付 | ❌ | ✅ |
| 手机号快速验证 | 通常 ❌ | ✅ |
| 绑定开放平台 / UnionID | ❌ | ✅ |
| 服务号网页授权 | ❌ | ✅（认证服务号） |
| 网站应用微信登录 | ❌ | ✅（开放平台认证） |

**升级路径**：

- 以后注册个体工商户/公司，可把小程序主体变更为企业（需公证/审核），
  再补微信认证，就能用手机号、支付、开放平台绑定；
- 届时可以新增 `wechat_oa` / `wechat_web` provider，用 UnionID 把多个微信应用
  归一到同一个 AY 账号；
- 现在就用 `oauth_connections` 按 `(provider, openid)` 映射，未来加 provider 不用改账号模型。

---

## 10. 不推荐的替代方案

| 方案 | 为什么不行 |
|---|---|
| 个人订阅号网页授权 | 网页授权仅服务号可用，个人只能注册订阅号 |
| 开放平台网站应用扫码 | 需要企业主体 + 开发者资质认证 + 网站应用审核 |
| 微信开放平台移动应用登录 | 需要开放平台认证 + 应用市场上架材料，个人门槛同样高 |
| 第三方「微信登录」SaaS | 本质仍要你的公众号/小程序资质，且把用户 openid 交给第三方 |
| 模拟微信客户端 | 违规，且不稳定 |

---

## 11. 官方链接

- 小程序注册与主体类型：https://developers.weixin.qq.com/miniprogram/introduction/
- 小程序登录流程：https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/login.html
- `code2session`：https://developers.weixin.qq.com/miniprogram/dev/server/API/user-login/api_code2session.html
- 获取不限制的小程序码：https://developers.weixin.qq.com/miniprogram/dev/server/API/qrcode-link/qr-code/api_getunlimitedqrcode.html
- 小程序码总览：https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/qr-code.html
- 小程序备案：https://developers.weixin.qq.com/miniprogram/product/record_guidelines.html
- 服务器域名：https://developers.weixin.qq.com/miniprogram/dev/framework/ability/network.html
- 头像昵称填写：https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/userProfile.html
- 服务号网页开发（仅服务号）：https://developers.weixin.qq.com/doc/service/guide/h5/
- 服务号网页授权：https://developers.weixin.qq.com/doc/service/guide/h5/auth.html
- 网站应用微信登录：https://developers.weixin.qq.com/doc/oplatform/Website_App/WeChat_Login/Wechat_Login.html
- 开放平台应用审核规范：https://developers.weixin.qq.com/doc/oplatform/Website_App/operation.html

---

## 12. 本项目落地清单（改动文件）

| 文件 | 改动 |
|---|---|
| `services/account/config.js` | 增加微信相关常量（bind token TTL、二维码 TTL） |
| `services/account/wechat.js` | 新增：code2session、access_token 缓存、小程序码 |
| `services/account/routes/wechat.js` | 新增：`/api/auth/wechat/*` 全部端点 |
| `services/account/ayOnline.js` | 挂载 `handleWechatAuth` |
| `services/account/routes/account-session.js` | `/refresh` 支持 body `refresh_token` |
| `services/account/db/schema.js` | 新增 `wechat_login_tickets` |
| `shared/error-codes.js` | 新增 1044–1051 |
| `wrangler.toml` 文档 | 记录 `WECHAT_MP_APPID` / `WECHAT_MP_SECRET` |

前端（`api-vue`）：

- 登录页增加「微信扫码登录」入口；
- 新增扫码弹窗：创建票据 → 展示二维码 → 轮询 → 成功跳转；
- 账号安全页增加「绑定/解绑微信」。
