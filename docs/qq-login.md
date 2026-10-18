# QQ 登录 / 注册接入方案（个人开发者）

> 结论：**个人开发者可以做 QQ 登录。**
> QQ 互联的开发者注册明确支持“公司或个人”；不需要额外服务器，现有 Cloudflare Worker
> 就能完成 OAuth 换取 token。真正的门槛是：**网站/回调域名要有 ICP 备案 + 通过 QQ 互联审核**。
>
> 与微信对比：微信网页 OAuth 需要企业主体（服务号/开放平台），个人只能走小程序；
> QQ 互联个人就能创建网站应用，所以对“网页登录”来说，QQ 是个人开发者更现实的选择。

---

## 0. 可行性速览

| 项目 | 个人开发者 | 说明 |
|---|---|---|
| 注册 QQ 互联开发者 | ✅ | 注册页支持提交“公司或个人的基本资料” |
| 创建网站应用 | ✅ | 需要网站名称、域名、回调地址、备案信息 |
| 获取 AppID / AppKey | ✅ | 创建后立即可见 |
| 审核前测试 | ⚠️ | 未审核通过时，**只有注册开发者本人的 QQ 能登录** |
| 审核通过后全量 | ✅ | 审核约 1–3 个工作日 |
| 需要独立服务器 | ❌ | Cloudflare Worker 即可，AppKey 放 secret |
| ICP 备案 | ✅（大陆站点） | 网站地址和回调地址需在工信部备案，且与平台填写一致 |

官方依据：

- [成为开发者](https://wiki.connect.qq.com/%E6%88%90%E4%B8%BA%E5%BC%80%E5%8F%91%E8%80%85)（原文：提交公司或个人的基本资料）
- [申请相关问题](https://wiki.connect.qq.com/%E7%94%B3%E8%AF%B7%E7%9B%B8%E5%85%B3%E9%97%AE%E9%A2%98)（审核 1–3 天；未审核只允许开发者 QQ 登录）
- [应用审核规范](https://wiki.connect.qq.com/%E7%BD%91%E7%AB%99%E5%AE%A1%E6%A0%B8%E8%A7%84%E8%8C%83)（网站与回调需工信部备案）
- [准备工作 OAuth2.0](https://wiki.connect.qq.com/%E5%87%86%E5%A4%87%E5%B7%A5%E4%BD%9C_oauth2-0)
- [使用 Authorization Code 获取 Access Token](https://wiki.connect.qq.com/%E4%BD%BF%E7%94%A8authorization_code%E8%8E%B7%E5%8F%96access_token)
- [获取用户 OpenID](https://wiki.connect.qq.com/%E8%8E%B7%E5%8F%96%E7%94%A8%E6%88%B7openid_oauth2-0)

---

## 1. 关于“没有服务器”

不需要买 VPS。QQ 登录的 server-side 流程只有两件事需要服务端：

1. 用 `client_secret`（AppKey）换 `access_token`；
2. 用 `access_token` 换 `openid` / 用户资料。

你现在的架构完全够：

```
api-worker (Cloudflare Workers)
  ├── D1        oauth_connections / online_users
  ├── KV        state 缓存（app_kv_store）
  └── secret    QQ_APPID / QQ_APPKEY
```

回调地址就用现成域名：`https://online.undz.cn/api/auth/qq/callback`。

> 唯一和“服务器”相关的是 **ICP 备案**：大陆网站备案需要国内接入商（阿里云/腾讯云等）。
> 如果 `undz.cn` 已经备案（且接入商仍有效），继续用 Cloudflare 跑 Worker 没问题；
> 如果没备案，QQ 互联审核这一关过不了，这才是真正要解决的事，不是代码。

---

## 2. 申请流程

### 2.1 注册开发者

1. 打开 [connect.qq.com](https://connect.qq.com/)，用 QQ 登录；
2. 进入开发者注册页，主体类型选「个人」，提交身份证等资料；
3. 审核通过后成为开发者。

> 注册用的 QQ 号会和应用绑定，后续维护都用它，建议用长期持有的 QQ。

### 2.2 创建网站应用

在 [管理中心](https://connect.qq.com/manage.html#/) → 创建应用 → 网站应用，填写：

| 字段 | 示例 | 注意 |
|---|---|---|
| 应用名称 | AyAccount | 不要含“QQ/腾讯”等字样 |
| 网站域名 | `undz.cn` | 与备案主体一致 |
| 回调地址 | `https://online.undz.cn/api/auth/qq/callback` | 必须是主域名下的地址 |
| 网站备案号 | `京ICP备...` | 与工信部一致 |
| 网站分类 | 工具/其他 | 按实际 |
| 验证代码 | 加到首页 `<head>` | 用于域名归属验证 |

提交后立即拿到 `AppID` / `AppKey`，但**审核通过前只有开发者 QQ 能登录**。

### 2.3 审核材料

- 网站首页能正常打开，有应用介绍、联系方式、隐私协议；
- 首页/登录页放置官方 QQ 登录按钮（不能自行改图）；
- 网站地址和回调地址都已完成 ICP 备案；
- 备案主体与 QQ 互联填写一致。

审核 1–3 个工作日，结果发注册邮箱。

---

## 3. OAuth2.0 流程

QQ 互联是标准授权码模式：

```
① 浏览器打开授权页
   https://graph.qq.com/oauth2.0/authorize
     ?response_type=code
     &client_id=APPID
     &redirect_uri=<URLEncoded 回调地址>
     &state=<随机 state>
     &scope=get_user_info

② 用户授权后回跳
   https://online.undz.cn/api/auth/qq/callback?code=...&state=...

③ 服务端换 access_token
   GET https://graph.qq.com/oauth2.0/token
     ?grant_type=authorization_code
     &client_id=APPID
     &client_secret=APPKEY
     &code=CODE
     &redirect_uri=<同一个回调地址>
     &fmt=json

④ 服务端换 openid
   GET https://graph.qq.com/oauth2.0/me?access_token=...&fmt=json

⑤ 可选：拉用户资料
   GET https://graph.qq.com/user/get_user_info
     ?access_token=...
     &oauth_consumer_key=APPID
     &openid=...
```

要点：

- `code` 10 分钟过期、一次性；
- `redirect_uri` 必须与授权、换 token 两处完全一致；
- `state` 必须校验，防 CSRF；
- `access_token` 默认 60 天；`refresh_token` 一次性，续期链最长 3 个月；
- `fmt=json` 时返回 JSON，否则是 `access_token=...&expires_in=...` 或 `callback({...})`；
- `openid` 是**当前网站应用内**唯一，不是 QQ 号，也不能跨应用识别同一个人。

---

## 4. 与 AY 账号体系对接

### 4.1 provider

统一用 `qq`：

```sql
-- 复用现有表，不新增字段
-- oauth_connections(provider, openid, user_sub, created_at)
-- UNIQUE(provider, openid)
INSERT INTO oauth_connections (provider, openid, user_sub, created_at)
VALUES ('qq', ?, ?, ?);
```

### 4.2 端点

新增 `services/account/routes/qq.js`，在 `ayOnline.js` 的 `handleThirdPartyAuth` 之后调用。

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/auth/qq/start?mode=login\|bind` | 生成 state，返回授权 URL |
| GET | `/api/auth/qq/callback` | 接收 code，换 token/openid，登录或进入绑定 |
| POST | `/api/auth/qq/bind` | `{ bind_token, username, password }` 绑定已有账号 |
| POST | `/api/auth/qq/register` | `{ bind_token, username, email, password, email_code, email_token }` |
| GET | `/api/auth/qq/bindings` | 当前账号已绑定的 QQ |
| POST | `/api/auth/qq/unbind` | 解绑 |

### 4.3 start

```js
// GET /api/auth/qq/start
const state = generateToken();
const mode = url.searchParams.get("mode") || "login";

await getKv().put(`qq_state:${state}`, JSON.stringify({ mode }), {
  expirationTtl: 600,
});

const authUrl = new URL("https://graph.qq.com/oauth2.0/authorize");
authUrl.searchParams.set("response_type", "code");
authUrl.searchParams.set("client_id", env.QQ_APPID);
authUrl.searchParams.set("redirect_uri", env.QQ_REDIRECT_URI);
authUrl.searchParams.set("state", state);
authUrl.searchParams.set("scope", "get_user_info");

return jsonResponse({ url: authUrl.toString() }, 200, cors);
```

前端拿到 `url` 后 `location.href = url`。

### 4.4 callback

```js
const code = url.searchParams.get("code");
const state = url.searchParams.get("state");

const stored = await getKv().get(`qq_state:${state}`);
if (!stored) return html("state 无效或已过期");
await getKv().delete(`qq_state:${state}`);

const tokenRes = await fetch(
  "https://graph.qq.com/oauth2.0/token?" +
    new URLSearchParams({
      grant_type: "authorization_code",
      client_id: env.QQ_APPID,
      client_secret: env.QQ_APPKEY,
      code,
      redirect_uri: env.QQ_REDIRECT_URI,
      fmt: "json",
    }),
);
const tokenData = await tokenRes.json();
if (!tokenData.access_token) return html("QQ 授权失败");

const meRes = await fetch(
  "https://graph.qq.com/oauth2.0/me?" +
    new URLSearchParams({
      access_token: tokenData.access_token,
      fmt: "json",
    }),
);
const me = await meRes.json();
if (!me.openid) return html("获取 openid 失败");

const conn = await env.db
  .prepare(
    "SELECT user_sub FROM oauth_connections WHERE provider = 'qq' AND openid = ?",
  )
  .bind(me.openid)
  .first();

if (conn) {
  // 已绑定：直接登录（复用 signAccessToken + storeRefreshToken + Set-Cookie）
  return loginAndRedirect(conn.user_sub);
}

// 未绑定：签一个短期 bind_token，跳到绑定/注册页
const bindToken = await signBindToken(env, {
  provider: "qq",
  openid: me.openid,
  mode,
});
return Response.redirect(
  `https://online.undz.cn/user-panel/link-account?bind_token=${bindToken}`,
  302,
);
```

### 4.5 bind_token

与微信方案一致：HS256 JWT，`aud=qq-bind`，10 分钟，含 `openid` + `jti`，
KV 记 `jti` 保证一次性。

绑定已有账号：

```js
const user = await authenticateUser(env.db, body.username, body.password);
if (!user.success) return jsonResponse({ error: "账号或密码错误" }, 401, cors);

const exists = await env.db
  .prepare("SELECT user_sub FROM oauth_connections WHERE provider = 'qq' AND openid = ?")
  .bind(payload.openid)
  .first();
if (exists) return jsonResponse({ error: "该 QQ 已绑定其他账号" }, 409, cors);

await env.db
  .prepare("INSERT INTO oauth_connections (provider, openid, user_sub, created_at) VALUES ('qq', ?, ?, ?)")
  .bind(payload.openid, user.user.sub, Date.now())
  .run();
```

注册并绑定：复用 `registerUser` + 邮箱验证码，写 `oauth_connections` 后签发 token。
（注册接口的去 GeeTest 方案与微信文档 §3.6 相同，注意限流。）

### 4.6 用户资料

```js
GET https://graph.qq.com/user/get_user_info
  ?access_token=...
  &oauth_consumer_key=APPID
  &openid=...
```

返回 `nickname`、`figureurl_qq_1`、`figureurl_qq_2`、`gender` 等。
`figureurl_qq_1` 可能是 `http://`，入库前建议转成 `https://` 或走 `files.undz.cn` 代理。

> 不要用 QQ 昵称/头像自动覆盖 AY 账号资料，作为「首次注册的默认值」即可，
> 用户后续可以自己改。

### 4.7 环境变量

```toml
# wrangler secret put QQ_APPID
# wrangler secret put QQ_APPKEY
QQ_APPID = "101xxxxxx"
QQ_APPKEY = "..."   # 只放服务端
QQ_REDIRECT_URI = "https://online.undz.cn/api/auth/qq/callback"
```

### 4.8 错误码

账号段 1044–1051 已被微信方案预留，QQ 从 1052 起：

| 号 | 常量 | HTTP | 含义 |
|---|---|---|---|
| 1052 | `QQ_STATE_INVALID` | 400 | state 无效/过期 |
| 1053 | `QQ_CODE_INVALID` | 400 | code 无效/已使用 |
| 1054 | `QQ_UPSTREAM_ERROR` | 502 | QQ 上游失败 |
| 1055 | `QQ_NOT_BOUND` | 409 | 该 QQ 尚未绑定 AY 账号 |
| 1056 | `QQ_BIND_TOKEN_INVALID` | 401 | bind_token 无效/过期/已用 |
| 1057 | `QQ_ALREADY_BOUND` | 409 | 该 QQ 已绑定其他账号 |

同步补 `ERROR_CODES` / `ERROR_MESSAGES` / `ERROR_STATUS`。

---

## 5. 与现有第三方登录的关系

项目里已有 `services/account/routes/third-party.js`，处理：

- `/api/auth/yzhyzxy/start`
- `/api/oauth/callback`

QQ 可以照这个结构写，但建议**单独文件** `routes/qq.js`，因为：

- QQ 的 state 存储、token 接口、openid 接口都不同；
- 以后再加 GitHub/Google 时互不干扰。

`ayOnline.js` 的挂载顺序：

```js
const thirdParty = await handleThirdPartyAuth(...);
if (thirdParty) return thirdParty;

const qq = await handleQqAuth(...);
if (qq) return qq;

const accountApi = await handleAccountApi(...);
```

---

## 6. 前端改动

- 登录页加「QQ 登录」按钮（官方图标 + 文案，不能改图）；
- 点击后 `GET /api/auth/qq/start`，拿 `url` 跳转；
- 回调落到 `online.undz.cn`，由后端决定：
  - 已绑定 → 设置 Cookie → 302 到用户中心；
  - 未绑定 → 302 到绑定页，带上 `bind_token`。
- 账号安全页加「绑定/解绑 QQ」。

按钮规范见 [网站前端页面规范](https://wiki.connect.qq.com/%E7%A7%BB%E5%8A%A8%E5%BA%94%E7%94%A8%E6%8E%A5%E5%85%A5%E6%B5%81%E7%A8%8B%EF%BC%88%E6%94%B9%EF%BC%89test)（QQ 互联要求不能自行修改图标）。

---

## 7. 安全清单

| 风险 | 处理 |
|---|---|
| CSRF | `state` 随机 + KV 一次性 + 10 分钟过期 |
| code 重放 | code 一次性，失败不重试同一个 code |
| AppKey 泄露 | 只放 Worker secret，不进前端/仓库 |
| 回调地址被改 | 与平台配置完全一致，不做动态 redirect |
| openid 伪造 | 只信服务端 `/oauth2.0/me` 结果 |
| 绑定劫持 | `bind_token` 一次性 + 10 分钟 + JWT 签名 |
| 暴力注册 | 邮箱验证码 + IP/开放平台限流 |
| 头像外链 | `http` 转 `https` 或代理，避免混合内容 |

---

## 8. 上线步骤

1. 注册 QQ 互联个人开发者；
2. 确认 `undz.cn` 的 ICP 备案有效，且与主体一致；
3. 创建网站应用，填域名、回调、备案号，首页加验证代码；
4. 拿到 AppID/AppKey，配置 Worker secret；
5. 实现 `/api/auth/qq/start` + `/callback`；
6. 用**注册开发者本人的 QQ** 先自测（审核前只有本人能登录）；
7. 提交审核，1–3 个工作日；
8. 审核通过后全量开放。

---

## 9. 和微信方案怎么选

| 维度 | QQ | 微信（个人小程序） |
|---|---|---|
| 个人主体 | ✅ 网站应用 | ✅ 小程序 |
| 网页内登录 | ✅ 直接 OAuth 跳转 | ❌ 需要小程序环境 |
| 需要备案 | ✅ ICP | ✅ 小程序备案 |
| 需要审核 | ✅ 1–3 天 | ✅ 小程序审核 |
| 需要额外服务器 | ❌ Worker 足够 | ❌ Worker 足够 |
| 用户覆盖 | QQ 用户 | 微信用户 |

**建议**：先接 QQ（个人可做、网页直接跳转、改造成本最低）。
微信等以后有企业/个体工商户主体，再补服务号网页授权或小程序。

---

## 10. 本项目落地清单

| 文件 | 改动 |
|---|---|
| `services/account/routes/qq.js` | 新增：start / callback / bind / register / bindings / unbind |
| `services/account/ayOnline.js` | 挂载 `handleQqAuth` |
| `services/account/config.js` | 增加 QQ 常量与 TTL |
| `services/account/db/schema.js` | 无需新表（复用 `oauth_connections`）；如需绑定票据可加 `qq_bind_tickets` |
| `shared/error-codes.js` | 新增 1052–1057 |
| `api-vue` 登录页 | 增加 QQ 登录按钮与绑定页 |
| `wrangler.toml` 文档 | 记录 `QQ_APPID` / `QQ_APPKEY` / `QQ_REDIRECT_URI` |

---

## 11. 没有 ICP 备案怎么办

先说结论：**没有备案，QQ 网站登录不能作为面向所有用户的功能。**
QQ 互联的审核规范要求网站地址和回调地址都完成工信部备案，未审核通过时只有
注册开发者本人的 QQ 能登录；FAQ 里“海外站点无 ICP 可申请”的条目与审核规范冲突，
实际很容易只拿到 AppID、过不了上线审核，不建议赌。

### 11.1 三条现实路线

| 路线 | 需要备案 | 需要审核 | 适合度 |
|---|---|---|---|
| GitHub OAuth | ❌ | ❌（创建即用） | **最推荐**（开发者用户） |
| QQ 邮箱 + 密码/验证码 | ❌ | ❌ | 兜底，零外部依赖 |
| 办 ICP 备案后再接 QQ | ✅ | ✅ | 想覆盖 QQ 用户才做 |
| Google OAuth | ❌ | ⚠️（基础 scope 可用） | 国内用户少，不建议主推 |

### 11.2 推荐：先接 GitHub OAuth

这个项目本身就是开发者控制台，`account/config.js` 的 `providerMap` 里已经预留了
`github` 的图标，`public/github.svg` 也在，接起来最顺。

创建 OAuth App（免费、即时生效、无审核）：

1. GitHub → Settings → Developer settings → OAuth Apps → New OAuth App
2. Homepage URL：`https://online.undz.cn`
3. Authorization callback URL：`https://online.undz.cn/api/auth/github/callback`
4. 拿到 `Client ID` 和 `Client Secret`，放进 Worker secret

端点：

```
授权：https://github.com/login/oauth/authorize
      ?client_id=...&redirect_uri=...&scope=read:user%20user:email&state=...
换 token：POST https://github.com/login/oauth/access_token
      Accept: application/json
      client_id / client_secret / code / redirect_uri
用户：GET https://api.github.com/user
      Authorization: Bearer <token>
      User-Agent: ay-api（GitHub 要求必须带 UA）
邮箱：GET https://api.github.com/user/emails（scope user:email）
```

映射方式与 QQ 完全一致：

```sql
INSERT INTO oauth_connections (provider, openid, user_sub, created_at)
VALUES ('github', ?, ?, ?);   -- openid 用 GitHub 的数值 id
```

回调域名用 `online.undz.cn` 或 `*.workers.dev` 都可以，**不需要 ICP**。
实现上直接复用 `routes/third-party.js` 的模式，新增 `routes/github.js` 即可。

### 11.3 兜底：QQ 邮箱登录

项目注册本来就支持邮箱，`account/config.js` 的 `allowedEmailDomains` 已经包含
`qq.com`、`vip.qq.com`、`foxmail.com`。用户用 QQ 邮箱 + 验证码注册/登录，
体验上不是“一键”，但零外部依赖、零备案、零审核。

### 11.4 真要 QQ 一键登录：办 ICP 备案

个人可以办 ICP 备案，但要注意：

- 需要国内接入商（阿里云/腾讯云等）和一台国内云资源，备案本身免费；
- 备案周期一般 1–20 个工作日；
- 个人备案的网站不能做经营性内容，需以个人工具/博客性质申报；
- 备案通过后，QQ 互联填写的域名、回调、备案号要与工信部一致；
- 如果之后 DNS 完全迁到境外、国内接入商失效，备案可能被注销。

### 11.5 不推荐的方案

| 方案 | 问题 |
|---|---|
| 赌 QQ 互联“海外站点免备案” | 与审核规范冲突，容易只拿到测试权限 |
| 用第三方聚合登录（Authing/Logto 等） | 仍要你的应用资质，且把 openid 交给第三方 |
| 借用别人的已备案域名做回调 | 主体不一致，审核会驳回，也有合规风险 |
| 伪造备案号 | 直接违规，封号 |
