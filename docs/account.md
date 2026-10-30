# account —— online.undz.cn（统一账号 + OAuth2 授权服务器）

全站的登录态来源：同域子服务直接读 `access_token` Cookie，跨域 SDK 用 Bearer。
同时它也是第三方应用接入用的 OAuth 2.0 授权服务器。

- 入口：`api-worker/src/services/account/ayOnline.js`
- 代码目录：`api-worker/src/services/account/`
- 域名：`online.undz.cn`
- 对外契约：`checkAuth`、`verifyBearerToken`、`exchangeOAuthToken`、`revokeRefreshToken`、`initDatabase`

## 目录

| 文件 | 职责 |
|---|---|
| `ayOnline.js` | 入口：建 KV、维护开关、OPTIONS、三段路由分发 |
| `config.js` | TTL、PBKDF2 参数、OAuth 常量、跨域白名单 |
| `http.js` | `jsonResponse` / `corsHeaders` / `handleOptions` |
| `users.js` | 注册 / 口令登录 / 改密码（纯数据层） |
| `auth/jwt.js` | 签发、校验 JWT；`checkAuth`（Cookie）、`verifyBearerToken`（Authorization） |
| `auth/crypto.js` | PBKDF2 口令散列、HMAC-SHA256、base64、输入校验 |
| `auth/tokens.js` | refresh token 的存取与撤销 |
| `auth/kv.js` | 每次请求重建的 KV 实例（`setKv` / `getKv`） |
| `oauth/clients.js` | OAuth 客户端注册/查询、`redirect_uri` 校验 |
| `oauth/token.js` | 授权码交换、refresh 续期、令牌撤销 |
| `db/schema.js` | 全部建表语句（`initDatabase`） |
| `mail_verify/` | 邮箱验证码发送与校验 |
| `routes/` | 路由层，按 URL 前缀切分 |

## 请求流程

```
online.undz.cn/*
  1. new URL(request.url)
  2. corsHeaders(request)          ← 白名单命中才回 Origin
  3. setKv(env.db)                 ← 每请求重建
  4. env.block === "true" ? 503 维护页
  5. OPTIONS → 204
  6. handleThirdPartyAuth   /api/auth/*、/api/oauth/callback
     handleAccountApi        /api/ayonline/*
     handleOAuthServer       /api/oauth/*
  7. 未命中 → env.assets.fetch()（前端 SPA）
```

`/api/oauth/callback` 必须在 `/api/oauth/*` 之前；`/api/ayonline/init`、`/test` 必须在
appId + SDK 闸门之前。

## 鉴权模型

三件套，全部 HS256 JWT，密钥 `env.JWT_KEY`：

| 令牌 | 位置 | 有效期 | 用途 |
|---|---|---|---|
| `access_token` | Cookie `domain=.undz.cn` | 10 分钟 | 同域子服务直接带 Cookie |
| `refresh_token` | Cookie 同上 | 30 天 | 换新的 access_token |
| `Authorization: Bearer <access>` | 请求头 | 10 分钟 | 跨域 SDK 调用 |

Cookie：`httpOnly` + `secure` + `sameSite=Lax` + `domain=.undz.cn`。

```js
const [status, user] = await checkAuth(request, env);
// status: TAG_LOGGEDIN | TAG_NOT_LOGGEDIN | TAG_BANNED
// user: { sub, username, email, gender, avatar, description, ban_reason? }
```

## 端点

### 管理与健康检查（闸门之前）

| 方法 | 路径 | 登录态 | 说明 |
|---|---|---|---|
| POST | `/api/ayonline/init` | `X-Admin-Key: env.KEY` | 建表（幂等） |
| any | `/api/ayonline/test` | — | 健康检查 |

### 会话

| 方法 | 路径 | 登录态 | 说明 |
|---|---|---|---|
| POST | `/api/ayonline/send-verification` | — | 旧发邮箱验证码接口；2027-01-01（北京时间）后停止并返回 1040 |
| POST | `/api/ayonline/register/verification/start` | — | 新 SDK 注册验证：极验 → 检查发信服务 → 发信/反向任务，返回 `verifySessionId` |
| POST | `/api/ayonline/register/verification/query` | — | 新 SDK 反向验证轮询 |
| POST | `/api/ayonline/register` | — | 注册；<3.0 旧逻辑，>=3.0 用 `verifySessionId` 新逻辑 |
| POST | `/api/ayonline/login` | — | 用户名/邮箱 + 密码 + `gt` |
| POST | `/api/ayonline/change-password` | Cookie | 改密，成功后撤销全部 refresh token |
| POST | `/api/ayonline/logout` | — | 清 Cookie，可选撤销 refresh token |
| GET | `/api/ayonline/verify` | Cookie | 校验当前令牌 |
| POST | `/api/ayonline/refresh` | Cookie/refresh | 换发 access_token，轮换 refresh_token |

### 资料与设备

| 方法 | 路径 | 登录态 | 说明 |
|---|---|---|---|
| POST | `/api/ayonline/update-profile` | Cookie | 改用户名/头像/签名（邮箱仍走旧验证码流程） |
| POST | `/api/ayonline/email-verify/create` | Cookie | 创建改邮箱的反向邮件验证任务，返回收件地址 + 验证码 |
| POST | `/api/ayonline/email-verify/query` | Cookie | 轮询反向验证任务状态（前端每 3 秒一次） |
| POST | `/api/ayonline/change-email` | Cookie | 凭 `emailVerifyId` 修改邮箱（新增接口，不动 `update-profile`） |
| GET | `/api/ayonline/oauth-bindings` | Cookie | 已绑定的第三方平台 |
| POST | `/api/ayonline/oauth-unbind` | Cookie | 解绑第三方平台 |
| GET | `/api/ayonline/device-count` | Cookie | 登录设备数 |
| POST | `/api/ayonline/revoke-all-devices` | Cookie | 退出所有设备 |

### 我的应用

| 方法 | 路径 | 登录态 | 说明 |
|---|---|---|---|
| GET | `/api/ayonline/oauth-apps` | Cookie | 我创建的 OAuth 应用 |
| POST | `/api/ayonline/oauth/revoke-client` | Cookie | 撤销某应用对我的全部刷新令牌 |
| POST | `/api/ayonline/revoke-oauth-app` | Cookie | 撤销应用并清理 refresh token |
| POST | `/api/ayonline/revoke-oauth-tokens` | Cookie | 批量撤销该用户的 OAuth refresh token |

### OAuth2 授权服务器

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/oauth/authorize` | 校验 client / redirect_uri / scope → 302 同意页 |
| GET | `/api/oauth/consent-data` | 同意页读取待确认信息 |
| POST | `/api/oauth/consent/approve` | 同意 → 发授权码 |
| POST | `/api/oauth/consent/deny` | 拒绝 → 带 error 回跳 |
| POST | `/api/oauth/token` | `authorization_code` / `refresh_token` |
| GET | `/api/oauth/userinfo` | Bearer，按 scope 返回字段 |
| GET | `/api/oauth/user/profile` | profile 子集 |
| GET | `/api/oauth/user/email` | email 子集 |
| GET | `/api/oauth/verify` | access_token 有效性 |
| POST | `/api/oauth/revoke` | 撤销 refresh_token |

scope：`openid` / `profile` / `email`，`userdata` 只返回被授权的字段。

### 第三方登录（本站作为客户端）

`GET /api/auth/yzhyzxy/start` → 跳转 → `GET /api/oauth/callback`，回调里做账号绑定或直接登录。

## 数据表

| 表 | 说明 |
|---|---|
| `online_users` | 账号主体，`sub` 自增主键 |
| `oauth_clients` | 第三方应用，`user_sub` 为所有者 |
| `oauth_auth_codes` | 授权码，`used` + `expires_at` 保证一次性 |
| `oauth_consent_requests` | 同意页待确认请求 |
| `oauth_connections` | 第三方账号绑定关系 |
| `feedbacks` | 反馈（console 使用） |
| `analytics_sites` / `analytics_events` | 站点统计（mysites 使用） |
| `file_manager` | 文件记录（console / files 使用） |
| `short_links` | 短链接（console / go 使用） |
| `app_kv_store` | 用 D1 模拟的 KV |
| `reverse_verify_tickets` | 反向邮箱验证任务（`shared/email-reverse-verify.js`，改邮箱用） |

## 闸门顺序

`routes/account-api.js` 的 `/api/ayonline/*`：

```
前缀判定 → handleAdminRoutes(/init, /test) → appId 白名单(1019) → SDK 版本(1040) → 三组业务路由
```

`init`、`test` 故意放在闸门之前。SDK 版本用 `isVersionValid(current, required)` 做 `>=` 比较，
`SDK_VER` 在 `config.js`。

## 口令与验证码

- PBKDF2-SHA256，100,000 次迭代，每用户 16 字节随机盐。
- 口令长度 6–32，字符集 `a-zA-Z0-9-_=+@#$%`；用户名 4–20。
- 邮箱验证码 6 位数字，KV 存 5 分钟；邮箱域名必须在 `allowedEmailDomains`。
- 注册、登录、改密强制 GeeTest，缺 `gt` 返回 1023 + `gt_code`。

### 修改邮箱（反向邮件验证）

新流程不再往新邮箱发验证码，而是让用户证明自己控制该邮箱：

1. `POST /api/ayonline/email-verify/create`：服务端在 `reverse_verify_tickets`
   建一条 `action=change_email`、`target_email=新邮箱` 的任务，返回
   `{ requestId, email, code, expiresAt }`。
2. 前端展示 `email`（形如 `onecode+xxx@services.undz.cn`）和 `code`，用户用
   **新邮箱** 作为发件人，向 `email` 发送正文含 `code` 的邮件（主题随意）。
   Worker 的 `email()` 入口匹配发件人、收件地址和验证码后把任务置为 `verified`。
3. 前端每 3 秒调用 `/api/ayonline/email-verify/query` 轮询；也可点按钮手动刷新。
4. 拿到 `valid: true` 后调用 `POST /api/ayonline/change-email`，body 为
   `{ email, emailVerifyId }`。服务端二次校验后先消费（删除）ticket，再写
   `online_users.email`，并重签 `access_token` Cookie。

`update-profile` 的既有 `email + code + token` 契约保持不变；新前端只走上面三个
新接口。`reverse_verify_tickets` 已并入 `initDatabase`，调用一次
`POST /api/ayonline/init` 即可建表。

### 注册邮箱验证（新 SDK >= 3.0）

- `register/verification/start` 先校验 GeeTest，再检查
  `http://send.undz.cn/health`（结果写 `app_kv_store`，TTL 10 分钟）。
- 健康时走传统邮件；服务不可用或本次请求 3/5 随机命中时改用反向验证。
- start 返回 `verifySessionId`（D1 KV，TTL 10 分钟），最终 `/register`
  只认这个会话，不再要求第二次 `gt`。
- 旧 SDK（`X-App-Ver` / `X-SDK-VER` < 3.0）继续旧逻辑；2027-01-01
  00:00:00（Asia/Shanghai）后旧 SDK 与旧 `send-verification` 接口统一返回 1040。
- 详细方案见 `api-vue/public/doc/registration-email-verification.md`。

## 错误码

1000–1099，全部来自 `shared/error-codes.js`。

## 已知债

- **`sub === 1` 就是管理员**：没有角色表，无法授予第二个管理员。
- **没有迁移系统**：表结构演进只能 `CREATE TABLE IF NOT EXISTS` + 手工 `ALTER`。
- **KV 是 D1 模拟的**：过期靠定时清理，非强一致，不要用于计数或锁。
- 新增错误码要同步前端 `api-vue/public/lib/account-sdk.js` 并重新生成 `.min.js`。
