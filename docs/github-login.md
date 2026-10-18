# GitHub 登录接入方案（个人开发者，零备案）

> 结论：**最轻的第三方登录。** 不需要 ICP 备案、不需要审核、不需要额外账号体系，
> OAuth App 创建即用。适合开发者/技术用户。

---

## 1. 创建 OAuth App

1. 登录 GitHub → **Settings → Developer settings → OAuth Apps → New OAuth App**
2. 填写：
   - Application name：`AyAccount`
   - Homepage URL：`https://online.undz.cn`
   - Authorization callback URL：`https://online.undz.cn/api/auth/github/callback`
3. 创建后拿到 **Client ID**，点 **Generate a new client secret** 拿 **Client Secret**（只显示一次）。

> 回调地址用 `online.undz.cn` 或 `*.workers.dev` 都行，GitHub 不要求备案。
> 本地开发可以填 `http://localhost:8787/...`。

### 环境变量

```toml
# wrangler secret put GITHUB_CLIENT_ID
# wrangler secret put GITHUB_CLIENT_SECRET
GITHUB_CLIENT_ID = "..."
GITHUB_CLIENT_SECRET = "..."
GITHUB_REDIRECT_URI = "https://online.undz.cn/api/auth/github/callback"
```

---

## 2. 授权流程

```
① GET https://github.com/login/oauth/authorize
     ?client_id=...
     &redirect_uri=<URLEncoded 回调>
     &scope=read:user%20user:email
     &state=<随机 state>

② 回调 ?code=...&state=...

③ POST https://github.com/login/oauth/access_token
     Accept: application/json
     client_id / client_secret / code / redirect_uri
   → { "access_token": "...", "token_type": "bearer", "scope": "..." }

④ GET https://api.github.com/user
     Authorization: Bearer <token>
     User-Agent: ay-api        ← GitHub 强制要求 UA，否则 403

⑤ GET https://api.github.com/user/emails   （scope user:email）
     取 primary && verified 的邮箱
```

`code` 10 分钟过期、一次性；`state` 防 CSRF。

---

## 3. 与 AY 账号体系对接

```sql
INSERT INTO oauth_connections (provider, openid, user_sub, created_at)
VALUES ('github', ?, ?, ?);
```

`openid` 用 GitHub 的数值 `user.id`（稳定、唯一，不会变）。

字段映射：

| AY | GitHub |
|---|---|
| `openid` | `user.id`（转字符串） |
| `username` 默认 | `user.login`（清洗成 `a-zA-Z0-9_`，4–20 位，冲突时加后缀） |
| `email` | `/user/emails` 里 primary + verified |
| `avatar` | `user.avatar_url` |
| `description` | `user.bio`（可选） |

### 3.1 未绑定：中间页询问是否注册

与 yzh 不同：GitHub 未绑定时**不会直接登录，也不会静默建号**，而是跳到一个
`/oauth2/` 中间页让用户确认：

```
GitHub 授权成功
  └─ oauth_connections 没有该 openid
       ├─ 邮箱已注册 → 中间页提示“请先登录后绑定”
       └─ 邮箱未注册 → /oauth2/github_register?token=...
                        显示 GitHub 头像 / 昵称 / 邮箱 / 将创建的用户名
                        ├─ 用户点“注册并登录” → POST /api/auth/github/register
                        └─ 用户点“取消” → 关闭弹窗（SDK 按取消处理）
```

- 中间页 token 存在 KV（`github_pending:{token}`，10 分钟）；
- `register` 消费 token 后建号、写 `oauth_connections`、签发 AY token；
- 账号密码是随机生成的，用户之后可以通过邮箱/改密流程设置独立密码。

---

## 4. 端点

在 `services/account/routes/github.js` 新增，`ayOnline.js` 挂载：

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/auth/github/start?mode=login\|bind&beta=1` | 生成 state，返回 GitHub 授权 URL |
| GET | `/api/auth/github/callback` | 换 token；已绑定登录，未绑定跳中间页 |
| GET | `/api/auth/github/pending?token=` | 中间页读取待确认的 GitHub 资料 |
| POST | `/api/auth/github/register` | 用户确认注册，建号 + 绑定 + 登录 |

`mode=bind` 用于设置页绑定：要求当前已登录，且该 GitHub 未绑定其他账号。

> `/login/beta/` 的 GitHub 按钮会带 `beta: true`；SDK 构造函数也会读
> `localStorage.BETA_LOGIN` 作为兜底，所以 console 应用不重新构建也能进入测试版。

### 4.1 Beta 开关

GitHub 入口目前只出现在测试版登录页：

| 层 | 开关 |
|---|---|
| 前端 SDK 初始化 | `new AyAccount({ appId, beta: true })` |
| SDK 加载的 iframe | `/login/beta/`（beta 为真）或 `/login/`（默认） |
| 测试页 | `/login/beta/` 是 `/login/` 的副本，额外有 GitHub 按钮 |
| 后端 | `/start` 需要 `beta=1` 或 `env.GITHUB_OAUTH_BETA === "true"` |
| Console 应用 | `localStorage.BETA_LOGIN === 'true'` 时 `initSdk(..., { beta: true })` |

稳定后把 `/login/beta/` 的 GitHub 按钮合并回 `/login/`，再把 SDK 的 beta 分支去掉即可。

---

## 5. 错误码

| 号 | 常量 | HTTP | 含义 |
|---|---|---|---|
| 1064 | `GITHUB_STATE_INVALID` | 400 | state 无效/过期 |
| 1065 | `GITHUB_CODE_INVALID` | 400 | code 无效/已使用 |
| 1066 | `GITHUB_UPSTREAM_ERROR` | 502 | GitHub 上游失败 |
| 1067 | `GITHUB_EMAIL_UNAVAILABLE` | 400 | 拿不到已验证邮箱 |
| 1068 | `GITHUB_EMAIL_REGISTERED` | 409 | 该 GitHub 邮箱已注册 |
| 1069 | `GITHUB_BETA_DISABLED` | 403 | 未开启 beta |
| 1070 | `GITHUB_NOT_CONFIGURED` | 503 | 缺少 AppID/Secret/回调配置 |
| 1071 | `GITHUB_PENDING_INVALID` | 401 | 注册中间页 token 无效/过期 |
| 1072 | `GITHUB_ALREADY_BOUND` | 409 | 该 GitHub 已绑定其他账号 |

---

## 6. 安全清单

| 风险 | 处理 |
|---|---|
| CSRF | `state` 随机 + KV 一次性 + 10 分钟过期 |
| code 重放 | 一次性，失败不重试 |
| client_secret 泄露 | 只放 Worker secret |
| 403 rate limit | 请求必须带 `User-Agent` |
| 未验证邮箱 | 只接受 `/user/emails` 里 `verified=true` 的邮箱 |
| 用户改名 | 不要用 `login` 做唯一键，用数值 `id` |
| 账号重名 | `login` 只作为默认 username，冲突时加后缀 |
| 静默建号 | 未绑定必须经过 `/oauth2/github_register` 用户确认 |
| 重复注册 | `online_users.email` UNIQUE + `oauth_connections(provider, openid)` UNIQUE |

---

## 7. 选型对比

| 维度 | GitHub | Microsoft | QQ | 微信（个人） |
|---|---|---|---|---|
| 需要 ICP | ❌ | ❌ | ✅ | ✅ |
| 需要审核 | ❌ | ❌ | ✅ 1–3 天 | ✅ |
| 需要额外账号 | GitHub 账号 | Azure 账号 | QQ 互联开发者 | 小程序 |
| 网页直接跳转 | ✅ | ✅ | ✅ | ❌ |
| 适合用户 | 开发者 | 办公/Outlook | QQ 用户 | 微信用户 |

---

## 8. 本项目落地清单

| 文件 | 改动 |
|---|---|
| `services/account/routes/github.js` | 新增 start / callback / pending / register |
| `services/account/ayOnline.js` | 挂载 `handleGithubAuth` |
| `shared/error-codes.js` | 新增 1064–1072 |
| `public/oauth2/github_register.html` | 注册中间页 |
| `public/login/beta/` | `/login/` 的测试版副本，含 GitHub 入口 |
| `public/lib/account-sdk.js` | 构造参数 `beta`、GitHub provider、beta 页面路径 |
| `public/lib/account-sdk.min.js` | 由 SDK 源码重新生成 |
| `src/shared/account-sdk.js` | `initSdk` 支持第三个参数 |
| `src/console/App.vue` | 读取 `localStorage.BETA_LOGIN` 传 `{ beta: true }` |
| `src/account/views/account/LinkAccount.vue` | 关联账号页增加 GitHub 入口 |
| `src/account/utils/api.js` | GitHub 的绑定链接使用 `mode=bind` |
| `wrangler secret` | `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` / `GITHUB_REDIRECT_URI` |
