# account —— online.undz.cn（统一账号 + OAuth2 授权服务器）

一个域名一套服务：`online.undz.cn` 既是所有子服务的登录态来源，也是第三方应用接入用的
OAuth 2.0 授权服务器。入口是 [`ayOnline.js`](./ayOnline.js)，其它模块由早期的单文件
`ayOnline.js`（3430 行）逐行搬运拆分而来，**业务逻辑未改写**。

## 目录与职责

| 文件 | 职责 | 备注 |
|---|---|---|
| `ayOnline.js` | 入口：建 KV、维护开关、OPTIONS、三段路由分发 | 约 70 行，改动前先看本文件末尾的"对外契约" |
| `config.js` | 全部静态配置：TTL、PBKDF2 参数、OAuth 常量、跨域白名单 | 改这里 = 改线上行为 |
| `http.js` | `jsonResponse` / `corsHeaders` / `handleOptions` | CORS 是白名单 + `credentials: true` |
| `users.js` | 注册 / 口令登录 / 改密码 | 纯数据层，不碰 HTTP |
| `auth/jwt.js` | 签发、校验 JWT；`checkAuth`（读 Cookie）、`verifyBearerToken`（读 Authorization） | 两种身份识别入口 |
| `auth/crypto.js` | PBKDF2 口令散列、HMAC-SHA256（GeeTest 签名）、base64、输入校验 | |
| `auth/tokens.js` | refresh token 的存取、按用户撤销 | 底层是 D1 模拟的 KV |
| `auth/kv.js` | 每次请求重建的 KV 实例（`setKv` / `getKv`） | 被 `oauth/token.js` 使用 |
| `oauth/clients.js` | OAuth 客户端注册/查询、`redirect_uri` 校验 | |
| `oauth/token.js` | 授权码交换、refresh 续期、令牌撤销 | 供本站与 chat 服务共用 |
| `db/schema.js` | 全部建表语句（`initDatabase`） | 没有迁移系统，改表 = 改这里 + 调一次 `/init` |
| `mail_verify/` | 邮箱验证码：`send.js` 发送、`verify.js` 校验 | 5 分钟有效，走 `MAIL_SEND_DOMAIN` 的 HTTP 接口 |
| `routes/` | 路由层，见 [routes/README.md](./routes/README.md) | 按 URL 前缀切分 |

## 请求流程

```
GET/POST online.undz.cn/*
      │
      ▼
ayOnline.js fetch
  1. new URL(request.url) → path / method
  2. corsHeaders(request)          ← 白名单命中才回 Origin，否则 "null"
  3. setKv(createKvStore(env.db))  ← 每个请求重建，很便宜
  4. env.block === "true" ? 503 维护页 : 继续
  5. OPTIONS → 204
  6. handleThirdPartyAuth    /api/auth/*、/api/oauth/callback
     handleAccountApi       /api/ayonline/*
     handleOAuthServer      /api/oauth/*
     未命中 → env.assets.fetch(request)（前端 SPA 兜底）
  7. 异常 → 500 + error_code 1018
```

> 顺序不能随便调：`/api/oauth/callback` 必须在 `/api/oauth/*` 之前匹配，
> `/api/ayonline/init`、`/test` 必须在 appId + SDK 闸门之前。

## 鉴权模型

三件套，全部是 HS256 的 JWT，密钥为 `env.JWT_KEY`：

| 令牌 | 位置 | 有效期 | 用途 |
|---|---|---|---|
| `access_token` | Cookie `domain=.undz.cn` | 10 分钟 | 同域子服务直接带 Cookie 调用 |
| `refresh_token` | Cookie 同上 | 30 天 | 换新的 access_token（`/api/ayonline/refresh`） |
| `Authorization: Bearer <access>` | 请求头 | 10 分钟 | 跨域 SDK 调用（`verifyBearerToken`） |

Cookie 属性：`httpOnly` + `secure` + `sameSite=Lax` + `domain=.undz.cn`。

`checkAuth(request, env)` 是**跨服务的统一入口**，返回元组：

```js
const [status, user] = await checkAuth(request, env);
// status: TAG_LOGGEDIN | TAG_NOT_LOGGEDIN | TAG_BANNED
// user:   { sub, username, email, gender, avatar, description, ban_reason? }
```

- `TAG_NOT_LOGGEDIN` → 401
- `TAG_BANNED` → 403，响应里带 `ban_reason`
- 管理员判定目前是**硬编码 `user.sub === 1`**（console 也在用），见文末"已知债"

## 口令、验证码与人机校验

- 口令：PBKDF2-SHA256，100,000 次迭代，每用户 16 字节随机盐，存储为 base64(`salt`) + base64(`hash`)。
- 长度 6–32，字符集 `a-zA-Z0-9-_=+@#$%`；用户名 4–20。
- 邮箱验证码：6 位数字，KV 存 5 分钟，发送走 `MAIL_SEND_DOMAIN` + `MAIL_API_KEY`；邮箱域名必须在 `allowedEmailDomains` 里（错误码 1026）。
- 人机校验：注册、登录、改密三处强制 GeeTest。缺 `gt` 直接返回 1023 + `gt_code`，前端 SDK 拿到后拉起验证码；校验通过才真正执行。

## OAuth2 授权服务器

支持授权码模式（含 PKCE，`generatePKCEPair` 在 `shared/utils.js`）：

```
GET  /api/oauth/authorize          校验 client_id / redirect_uri / scope → 302 到同意页
GET  /api/oauth/consent-data       同意页读取待确认信息
POST /api/oauth/consent/approve    用户同意 → 发授权码
POST /api/oauth/consent/deny       用户拒绝 → 带 error 回跳
POST /api/oauth/token              authorization_code / refresh_token 两种 grant
GET  /api/oauth/userinfo           读 scope 决定是否返回 email / username
GET  /api/oauth/user/profile       profile 子集
GET  /api/oauth/user/email         email 子集
GET  /api/oauth/verify             access_token 有效性
POST /api/oauth/revoke             撤销 refresh_token
```

scope 约定：`openid` / `profile` / `email`。返回体里 `userdata` 只包含被授权的字段
（`openid` 只给 `sub`，`profile` 追加 `username`，`email` 追加 `email`）。

第三方登录（本站作为客户端）：`GET /api/auth/yzhyzxy/start` → 跳转 → `GET /api/oauth/callback`
（`routes/third-party.js`），回调里会做账号绑定或直接登录。

## 数据表（都在 `api_db`）

| 表 | 说明 |
|---|---|
| `online_users` | 账号主体，`sub` 自增主键；口令盐/散列、封禁字段、头像签名 |
| `oauth_clients` | 第三方应用，`user_sub` 为所有者，`redirect_uris` 逗号分隔 |
| `oauth_auth_codes` | 授权码，`used` + `expires_at` 保证一次性 |
| `oauth_consent_requests` | 同意页的待确认请求，有过期时间 |
| `oauth_connections` | 第三方账号绑定关系（provider + openid → user_sub） |
| `feedbacks` | 反馈（控制台在用，见 console 文档） |
| `analytics_sites` / `analytics_events` | 站点统计（mysites 在用） |
| `file_manager` | 文件记录（console / files 在用） |
| `app_kv_store` | 用 D1 模拟的 KV，所有 refresh token / 验证码都在这里 |

## 闸门顺序（改代码前必看）

`routes/account-api.js` 里 `/api/ayonline/*` 的判定顺序是：

```
前缀判定 → handleAdminRoutes(/init, /test) → appId 白名单(1019) → SDK 版本(1040) → 三组业务路由
```

- `init`、`test` **故意**放在闸门之前：`/init` 自带 `X-Admin-Key`（`env.KEY`），`/test` 是健康检查，二者都不该被客户端版本拦住。
- SDK 版本闸门用 `isVersionValid(current, required)` 做 `>=` 比较，`SDK_VER` 在 `config.js`。前端 env 里的 `VITE_*_APP_SDK_VER` 要 ≥ 这个值，否则所有业务接口都会 500 + 1040。

## 错误码

全部来自 `../../shared/error-codes.js`，号段 1000–1099。别写裸数字，
新增流程见 [shared/README.md](../../shared/README.md)。

## 新增一个端点该怎么做

1. 判断归属：会话类（登录/注册/刷新/改密）→ `routes/account-session.js`；
   资料类 → `routes/account-profile.js`；应用管理类 → `routes/account-oauth-apps.js`；
   OAuth 授权服务器 → `routes/oauth-server.js`。
2. 写一个 `if (path === "/api/ayonline/xxx" && method === "POST") { ... }` 块，
   用 `jsonResponse(payload, status, cors)` 返回；需要登录态时调 `checkAuth`。
3. 错误码从 `ERROR_CODES` 取；新号要同时补 `ERROR_MESSAGES` / `ERROR_STATUS`。
4. 需要前端 SDK 展示文案的话，同步 `api-vue/public/lib/account-sdk.js` 的 `error.<号>`，并用
   `public/lib/get_minsdk.bat` 重新生成 `account-sdk.min.js`。
5. 跑 `npm run lint`（在 `api-worker/`）+ `wrangler deploy --dry-run` 自查。

## 已知债

- **`sub === 1` 就是管理员**：没有角色表，无法授予第二个管理员，1 号账号异常时后台不可用。
- **SDK 版本闸门与 500 兜底曾共用 1018**：已拆成 1040，但 SDK 侧 1024/1027–1039 已被占用，
  服务端号段实际可用区间从 1040 起。
- **KV 是 D1 模拟的**：`expirationTtl` 靠定时任务清理，不是强一致；不要用它做计数或锁。
- **没有迁移系统**：表结构演进只能 `CREATE TABLE IF NOT EXISTS` + 手工 `ALTER`。
