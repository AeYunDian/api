# account/routes —— 端点清单

`online.undz.cn` 的全部对外端点都在这里。文件按前缀切分，每个端点是一个
`if (path ...) { ... }` 块，**块内业务代码与拆分前逐行一致**。

```
routes/
├── third-party.js        /api/auth/*、/api/oauth/callback（第三方登录）
├── account-api.js        /api/ayonline/* 分发器（前缀判定 + 闸门）
├── account-admin.js      /api/ayonline/init、/test        ← 闸门之前
├── account-session.js    /api/ayonline/* 会话类
├── account-profile.js    /api/ayonline/* 资料与设备类
├── account-oauth-apps.js /api/ayonline/* 我的应用类
└── oauth-server.js       /api/oauth/* 授权服务器
```

## 分发层次

```
/api/ayonline/*
   └─ account-api.js
        ├─ account-admin.js        （不需要 appId / SDK 版本）
        ├─ 闸门：X-App-Id 白名单 → 1019 ；X-SDK-VER 版本 → 1040
        ├─ account-session.js
        ├─ account-profile.js
        └─ account-oauth-apps.js
/api/oauth/*      → oauth-server.js
/api/auth/* + /api/oauth/callback → third-party.js
```

## 端点表

"登录态"列：`Cookie` = 需要 `access_token` Cookie（`checkAuth`）；`—` = 匿名可调用；
`Admin` = 需要 `X-Admin-Key: env.KEY`。

### 管理与健康检查（闸门之前）

| 方法 | 路径 | 登录态 | 说明 | 常见 error_code |
|---|---|---|---|---|
| POST | `/api/ayonline/init` | Admin | 建表（幂等），失败返回 detail/stack（DEBUG 下） | 1018 |
| any | `/api/ayonline/test` | — | 健康检查，返回 `Server is ready` | — |

### 会话（`account-session.js`）

| 方法 | 路径 | 登录态 | 说明 | 常见 error_code |
|---|---|---|---|---|
| POST | `/api/ayonline/send-verification` | — | 发邮箱验证码，`action` ∈ login/register/change_email | 1029、1026、1020 |
| POST | `/api/ayonline/register` | — | 注册，需要 `emailCode`+`emailToken`+`gt` | 1000、1001、1002、1008、1025、1023、1022 |
| POST | `/api/ayonline/login` | — | 登录，`username` 或 `email` + 密码 + `gt` | 1009、1003、1017、1023、1022 |
| POST | `/api/ayonline/change-password` | Cookie | 改密，成功后撤销全部 refresh token | 1012、1005、1006、1023 |
| POST | `/api/ayonline/logout` | — | 清 Cookie；带了 `refresh_token` 才撤销它 | — |
| GET | `/api/ayonline/verify` | Cookie | 校验当前令牌，返回 `{ valid, user }` | 1013、1015、1016 |
| POST | `/api/ayonline/refresh` | Cookie/refresh | 换发 access_token，轮换 refresh_token | 1014、1015、1017 |

### 资料与设备（`account-profile.js`）

| 方法 | 路径 | 登录态 | 说明 | 常见 error_code |
|---|---|---|---|---|
| POST | `/api/ayonline/update-profile` | Cookie | 改用户名/邮箱/头像/签名；改邮箱需 `code`+`token` | 1043、1041、1042、1010 |
| GET | `/api/ayonline/oauth-bindings` | Cookie | 当前账号已绑定的第三方平台 | 1010 |
| POST | `/api/ayonline/oauth-unbind` | Cookie | 解绑第三方平台 | 1010 |
| GET | `/api/ayonline/device-count` | Cookie | 登录设备数（refresh token 条数） | 1010 |
| POST | `/api/ayonline/revoke-all-devices` | Cookie | 退出所有设备 | 1010 |

### 我的应用（`account-oauth-apps.js`）

| 方法 | 路径 | 登录态 | 说明 | 常见 error_code |
|---|---|---|---|---|
| GET | `/api/ayonline/oauth-apps` | Cookie | 我创建的 OAuth 应用列表 | 1010 |
| POST | `/api/ayonline/oauth/revoke-client` | Cookie | 撤销某应用对我的全部刷新令牌 | 1010 |
| POST | `/api/ayonline/revoke-oauth-app` | Cookie | 撤销应用并清理其 refresh token | 1010、1018 |
| POST | `/api/ayonline/revoke-oauth-tokens` | Cookie | 批量撤销该用户的 OAuth refresh token | 1010 |

### OAuth2 授权服务器（`oauth-server.js`）

| 方法 | 路径 | 登录态 | 说明 |
|---|---|---|---|
| GET | `/api/oauth/authorize` | — | 校验 client / redirect_uri / scope，302 到同意页 |
| GET | `/api/oauth/consent-data` | Cookie | 同意页读取待确认信息 |
| POST | `/api/oauth/consent/approve` | Cookie | 同意 → 生成一次性授权码 |
| POST | `/api/oauth/consent/deny` | Cookie | 拒绝 → 带 error 回跳 |
| POST | `/api/oauth/token` | — | `authorization_code` / `refresh_token` 两种 grant |
| GET | `/api/oauth/userinfo` | Bearer | 按 scope 返回 `sub`/`username`/`email` |
| GET | `/api/oauth/user/profile` | Bearer | profile 子集 |
| GET | `/api/oauth/user/email` | Bearer | email 子集 |
| GET | `/api/oauth/verify` | Bearer | access_token 有效性 |
| POST | `/api/oauth/revoke` | — | 撤销 refresh_token（需 client 凭证） |

### 第三方登录（`third-party.js`）

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/auth/yzhyzxy/start` | 生成 PKCE + state，返回授权 URL（`?mode=login\|bind`） |
| GET | `/api/oauth/callback` | 用 code 换 token、取用户、绑定或登录，回跳前端 |

## 改动约定

1. **不要跨文件调顺序**：`account-api.js` 里 admin → 闸门 → 三组路由的顺序是语义的一部分。
2. **新端点**：选好归属文件，保持 `if (path === ... && method === ...)` 的形状，
   用 `jsonResponse(payload, status, cors)`，错误码走 `ERROR_CODES`。
3. **登录态**：统一 `checkAuth(request, env)`，不要自己解析 Cookie/JWT；
   跨域场景才用 `verifyBearerToken`。
4. **需要人机校验**：照抄 session 里 `body.gt` → base64 解 → `hmacSha256(prikey, lot_number)` →
   `https://gcaptcha4.geetest.com/validate` 那套流程，别自己发明。
5. **验证**：`npm run lint` + `wrangler deploy --dry-run`；
   想快速冒烟可以像这样直接 import 入口：

```js
const m = await import("./src/services/account/ayOnline.js");
const env = { db: {}, assets: { fetch: async () => new Response("assets") }, ALLOWED_APP_IDS: ["x"], DEBUG: "" };
await m.default.fetch(new Request("https://online.undz.cn/api/ayonline/test"), env);
```
