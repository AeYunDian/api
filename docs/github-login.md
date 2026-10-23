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

### 3.1 未绑定：中间页填写用户名/密码

GitHub 和 Yzhyzxy 未绑定时**不会直接登录，也不会静默建号**，而是跳到一个
`/oauth2/` 中间页让用户确认并填写注册信息：

```
OAuth 授权成功
  └─ oauth_connections 没有该 openid
       ├─ 邮箱已注册 → 中间页提示“请先登录后绑定”
       └─ 邮箱未注册 → /oauth2/github_register?token=...
                        显示 OAuth 头像 / 昵称 / 邮箱
                        用户填写：用户名（预填建议值）+ 密码 + 确认密码
                        ├─ “注册并登录” → POST /api/auth/oauth/register
                        └─ “取消” → 关闭弹窗（SDK 按取消处理）
```

- 中间页 token 存在 KV（`oauth_pending:{token}`，10 分钟），包含 `provider`；
- `register` 消费 token 后建号、写 `oauth_connections`、签发 AY token；
- 用户名 4–20 位，密码 6–32 位（`a-z A-Z 0-9 - _ = + @ # $ %`）；
- Yzhyzxy 如果能拿到真实 `email`，走同一个中间页；拿不到时仍走旧的
  `/oauth2/account_notlinked` 页面（保留未删）。

---

## 4. 端点

在 `services/account/routes/github.js` 新增，`ayOnline.js` 挂载：

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/auth/github/start?mode=login\|bind` | 生成 state，返回 GitHub 授权 URL |
| GET | `/api/auth/github/callback` | 换 token；已绑定登录，未绑定跳中间页 |
| GET | `/api/auth/oauth/pending?token=` | 中间页读取待注册资料（provider 通用） |
| POST | `/api/auth/oauth/register` | 用户提交自定义用户名/密码，建号 + 绑定 + 登录 |

> `github_register.html` 目前是 GitHub / Yzhyzxy 共用的注册中间页；
> 旧路径 `/api/auth/github/pending|register` 也仍然可用，指向同一套逻辑。

`mode=bind` 用于设置页绑定：要求当前已登录，且该 GitHub 未绑定其他账号。

### 4.1 正式入口

GitHub 已从 beta 转正：

- `/login/` 和 `/login/mobile` 直接显示 GitHub 按钮（`github-entry.js`）；
- SDK 固定加载 `/login/`，不再读取 `beta` / `BETA_LOGIN`；
- 后端 `/start` 不再要求 `beta=1`；
- `/login/beta/` 已废弃，可删除。

绑定（`mode=bind`）不要求 beta，已登录用户可在「关联账号」页直接绑定。

### 4.2 SDK 内联挂载（container）

`login()` / `register()` 的 config 新增 `container`，用于把 iframe 挂到指定元素里，
而不是全屏遮罩：

```js
// 选择器或 DOM 元素都可以
sdk.login({ container: '#login-box', hideOauthClient: true });
sdk.register({ container: document.querySelector('#register-box'), minHeight: '640px' });
```

- `container` 不传时保持原来的全屏遮罩行为；
- 内联模式不锁定 body 滚动，也不弹全屏 loading；
- 容器 `position: static` 时会自动设为 `relative`；
- iframe 绝对定位铺满容器，默认 `minHeight: 600px`，可用 `minHeight` 覆盖；
- 关闭后只移除 iframe 容器，不影响宿主页面其他内容。

---

## 5. 错误码

| 号 | 常量 | HTTP | 含义 |
|---|---|---|---|
| 1064 | `GITHUB_STATE_INVALID` | 400 | state 无效/过期 |
| 1065 | `GITHUB_CODE_INVALID` | 400 | code 无效/已使用 |
| 1066 | `GITHUB_UPSTREAM_ERROR` | 502 | GitHub 上游失败 |
| 1067 | `GITHUB_EMAIL_UNAVAILABLE` | 400 | 拿不到已验证邮箱 |
| 1068 | `GITHUB_EMAIL_REGISTERED` | 409 | 该 GitHub 邮箱已注册 |
| 1069 | `GITHUB_BETA_DISABLED` | 403 | 已废弃（beta 转正前使用） |
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
| `services/account/routes/github.js` | GitHub 授权 + 通用 pending/register |
| `services/account/oauth-pending.js` | OAuth 待注册票据、用户名建议 |
| `services/account/routes/third-party.js` | Yzhyzxy 未绑定时走同一中间页 |
| `services/account/ayOnline.js` | 挂载 `handleGithubAuth` |
| `shared/error-codes.js` | 新增 1064–1072 |
| `public/oauth2/github_register.html` | GitHub / Yzhyzxy 共用注册中间页 |
| `public/login/github-entry.js` | 正式版登录页的 GitHub 入口 |
| `public/login/beta/` | 已废弃，可删除 |
| `public/lib/account-sdk.js` | GitHub provider（已移除 beta 分支） |
| `public/lib/account-sdk.min.js` | 由 SDK 源码重新生成 |
| `src/account/views/account/LinkAccount.vue` | 关联账号页增加 GitHub 入口 |
| `src/account/utils/api.js` | GitHub 的绑定链接使用 `mode=bind` |
| `wrangler secret` | `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` / `GITHUB_REDIRECT_URI` |
