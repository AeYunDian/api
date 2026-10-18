# Microsoft 登录 / 注册接入方案（个人开发者）

> 结论：**个人可以做 Microsoft 登录，不需要 ICP 备案、不需要审核。**
> 唯一门槛是注册一个 Azure 账号（免费订阅即可，注册时可能需要手机 + 信用卡验证）；
> 应用注册免费、即时生效。支持个人 Microsoft 账号（Outlook / Hotmail / Live / Xbox）
> 和工作/学校账号，也可以只允许个人账号。
>
> 对比：QQ 需要 ICP 备案；微信网页 OAuth 需要企业主体；GitHub 最轻；
> Microsoft 介于 GitHub 和 QQ 之间——要一个 Azure 账号，但不要备案。

---

## 0. 可行性速览

| 项目 | 个人开发者 | 说明 |
|---|---|---|
| 注册 Azure 账号 | ✅ | 免费订阅即可；可能需要信用卡验证，不扣费 |
| 注册应用（App registration） | ✅ | 免费、即时、无人工审核 |
| 个人 Microsoft 账号登录 | ✅ | Outlook / Hotmail / Live / Xbox |
| 工作/学校账号登录 | ✅ | 取决于租户策略，可能需要管理员同意 |
| 需要 ICP 备案 | ❌ | 回调可以是任意 HTTPS 域名 |
| 需要独立服务器 | ❌ | Cloudflare Worker 完成 code 换 token |
| 用户量限制 | 基本无 | 多租户应用可能有发布者验证提示，不影响登录 |

官方依据：

- [注册应用（Microsoft Entra ID）](https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app)
- [OpenID Connect on Microsoft identity platform](https://learn.microsoft.com/en-us/entra/identity-platform/v2-protocols-oidc)
- [Authorization code flow](https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-auth-code-flow)

---

## 1. 注册应用

1. 打开 [Microsoft Entra admin center](https://entra.microsoft.com)，用 Microsoft 账号登录；
2. 左侧 **Entra ID → App registrations → New registration**；
3. 名称：`AyAccount`；
4. **Supported account types**：
   - 只允许个人账号：`Personal Microsoft accounts only`
   - 个人 + 工作/学校：`Accounts in any organizational directory and personal Microsoft accounts`
   - 只允许自己租户：`Single tenant`
5. Redirect URI：平台选 **Web**，填
   `https://online.undz.cn/api/auth/microsoft/callback`
6. 注册后记录 **Application (client) ID** 和 **Directory (tenant) ID**；
7. **Certificates & secrets → New client secret**，记录值（只显示一次），注意过期时间（最长 24 个月）；
8. **API permissions**：默认已有 `User.Read`（Microsoft Graph，Delegated）。
   `openid` / `profile` / `email` 是 OIDC scope，不需要单独授权。

> 如果只做「登录 + 拿昵称/邮箱」，`User.Read` 足够，不需要管理员同意。
> 组织账号首次登录时，若租户关闭了用户自助同意，会提示需要管理员批准——这是对方租户策略，不是你的应用问题。

### 环境变量

```toml
# wrangler secret put MICROSOFT_CLIENT_ID
# wrangler secret put MICROSOFT_CLIENT_SECRET
MICROSOFT_CLIENT_ID = "00000000-0000-0000-0000-000000000000"
MICROSOFT_CLIENT_SECRET = "..."
MICROSOFT_TENANT = "common"   # common | consumers | organizations | <tenant-id>
MICROSOFT_REDIRECT_URI = "https://online.undz.cn/api/auth/microsoft/callback"
```

- `common`：个人 + 工作/学校
- `consumers`：只允许个人账号
- `organizations`：只允许工作/学校
- 具体租户 ID：只允许该租户

---

## 2. 授权流程

标准 OIDC 授权码模式：

```
① 浏览器打开
   https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize
     ?client_id=CLIENT_ID
     &response_type=code
     &redirect_uri=<URLEncoded 回调>
     &response_mode=query
     &scope=openid%20profile%20email%20User.Read
     &state=<随机 state>

② 回调
   https://online.undz.cn/api/auth/microsoft/callback?code=...&state=...

③ 换 token（POST）
   https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token
   grant_type=authorization_code
   client_id / client_secret / code / redirect_uri / scope

④ 拉资料
   GET https://graph.microsoft.com/v1.0/me
   Authorization: Bearer <access_token>
```

返回的 token 响应里同时有 `access_token`、`id_token`、`expires_in`。

### 2.1 用哪个字段做 openid

| 字段 | 含义 | 建议 |
|---|---|---|
| `sub` | 用户在该应用内的唯一标识（pairwise） | **推荐**，直接作为 `oauth_connections.openid` |
| `oid` | 用户在租户内的对象 ID | 跨租户可能重复，建议配合 `tid` |
| `tid` | 租户 ID | 多租户场景可拼 `${tid}:${oid}` |

单应用登录用 `sub` 最简单，也稳定。

### 2.2 邮箱和昵称

- `id_token` 里可能有 `preferred_username`、`name`、`email`；
- 个人账号的 `email` 不一定存在，`preferred_username` 可能是 `outlook_xxx@outlook.com`；
- 用 Graph `/me` 拿 `displayName`、`mail`、`userPrincipalName` 更稳；
- 头像：`GET https://graph.microsoft.com/v1.0/me/photo/$value`，
  个人账号可能 404，失败就用默认头像。

---

## 3. 与 AY 账号体系对接

### 3.1 provider

```sql
INSERT INTO oauth_connections (provider, openid, user_sub, created_at)
VALUES ('microsoft', ?, ?, ?);
```

`openid` 用 `sub`。

### 3.2 端点

新增 `services/account/routes/microsoft.js`，在 `ayOnline.js` 里挂载：

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/auth/microsoft/start?mode=login\|bind` | 生成 state，返回授权 URL |
| GET | `/api/auth/microsoft/callback` | 换 token，登录或进入绑定 |
| POST | `/api/auth/microsoft/bind` | `{ bind_token, username, password }` |
| POST | `/api/auth/microsoft/register` | `{ bind_token, username, email, password, email_code, email_token }` |
| GET | `/api/auth/microsoft/bindings` | 已绑定的 Microsoft 账号 |
| POST | `/api/auth/microsoft/unbind` | 解绑 |

### 3.3 start

```js
const state = generateToken();
await getKv().put(`ms_state:${state}`, JSON.stringify({ mode }), {
  expirationTtl: 600,
});

const authUrl = new URL(
  `https://login.microsoftonline.com/${env.MICROSOFT_TENANT}/oauth2/v2.0/authorize`,
);
authUrl.searchParams.set("client_id", env.MICROSOFT_CLIENT_ID);
authUrl.searchParams.set("response_type", "code");
authUrl.searchParams.set("redirect_uri", env.MICROSOFT_REDIRECT_URI);
authUrl.searchParams.set("response_mode", "query");
authUrl.searchParams.set("scope", "openid profile email User.Read");
authUrl.searchParams.set("state", state);

return jsonResponse({ url: authUrl.toString() }, 200, cors);
```

### 3.4 callback

```js
const code = url.searchParams.get("code");
const state = url.searchParams.get("state");
const stored = await getKv().get(`ms_state:${state}`);
if (!stored) return html("state 无效或已过期");
await getKv().delete(`ms_state:${state}`);

const tokenRes = await fetch(
  `https://login.microsoftonline.com/${env.MICROSOFT_TENANT}/oauth2/v2.0/token`,
  {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: env.MICROSOFT_CLIENT_ID,
      client_secret: env.MICROSOFT_CLIENT_SECRET,
      code,
      redirect_uri: env.MICROSOFT_REDIRECT_URI,
      scope: "openid profile email User.Read",
    }),
  },
);
const tokens = await tokenRes.json();
if (!tokens.access_token) return html("Microsoft 授权失败");

// 方式 A：直接读 id_token 的 claims（需要校验签名/issuer/audience/nonce）
// 方式 B（推荐）：用 access_token 调 Graph /me
const meRes = await fetch("https://graph.microsoft.com/v1.0/me", {
  headers: { Authorization: `Bearer ${tokens.access_token}` },
});
const me = await meRes.json();
// me.id 是对象 ID；openid 建议用 id_token 的 sub
const claims = decodeJwt(tokens.id_token); // 仅取 sub，生产环境要验签
const openid = claims.sub;
```

> 生产环境不要「只 decode 不验签」。要么用 `jose` 校验 `id_token`
> （JWKS：`https://login.microsoftonline.com/{tenant}/discovery/v2.0/keys`，
> 校验 `iss`、`aud`、`exp`、`nonce`），要么只用 Graph `/me` 的结果并信任
> `access_token` 的 TLS 通道。两者选一，别把未验签的 `sub` 直接入库。

### 3.5 绑定 / 注册

与 QQ 文档 §4.5 完全一致：

- 已绑定 → 签发 AY access/refresh，设置 Cookie，302 回用户中心；
- 未绑定 → 签 `bind_token`（JWT，10 分钟，含 `sub`），跳到绑定页；
- 绑定已有账号：`authenticateUser` 校验密码 + 写 `oauth_connections`；
- 注册：复用邮箱验证码 + `registerUser`，写 `oauth_connections`。

### 3.6 错误码

QQ 用到 1057，Microsoft 从 1058 起：

| 号 | 常量 | HTTP | 含义 |
|---|---|---|---|
| 1058 | `MS_STATE_INVALID` | 400 | state 无效/过期 |
| 1059 | `MS_CODE_INVALID` | 400 | code 无效/已使用 |
| 1060 | `MS_UPSTREAM_ERROR` | 502 | Microsoft 上游失败 |
| 1061 | `MS_NOT_BOUND` | 409 | 该 Microsoft 账号尚未绑定 |
| 1062 | `MS_BIND_TOKEN_INVALID` | 401 | bind_token 无效/过期/已用 |
| 1063 | `MS_ALREADY_BOUND` | 409 | 已绑定其他账号 |

同步补 `ERROR_CODES` / `ERROR_MESSAGES` / `ERROR_STATUS`。

---

## 4. 安全清单

| 风险 | 处理 |
|---|---|
| CSRF | `state` 随机 + KV 一次性 + 10 分钟过期 |
| code 重放 | code 一次性，失败不重试 |
| client_secret 泄露 | 只放 Worker secret；定期轮换（Entra 最长 24 个月） |
| id_token 伪造 | 用 `jose` 验签 + 校验 `iss/aud/exp/nonce`，或只信 Graph `/me` |
| 混淆攻击 | 校验 `tid`（多租户时）/ `aud` 等于自己的 client_id |
| 邮箱不可信 | `email` 可能缺失或不是主邮箱，展示用途即可，不要作为账号唯一键 |
| 头像外链 | Graph 照片可能 404，失败回退默认头像 |

---

## 5. 选型对比

| 维度 | GitHub | Microsoft | QQ | 微信（个人） |
|---|---|---|---|---|
| 个人主体 | ✅ | ✅ | ✅ | ✅（小程序） |
| 需要 ICP | ❌ | ❌ | ✅ | ✅ |
| 需要审核 | ❌ | ❌ | ✅ 1–3 天 | ✅ |
| 需要额外账号 | GitHub 账号 | **Azure 账号** | QQ 互联开发者 | 小程序 |
| 网页直接跳转 | ✅ | ✅ | ✅ | ❌ |
| 国内用户覆盖 | 开发者 | 办公/Outlook 用户 | QQ 用户 | 微信用户 |

**建议顺序**：GitHub（最轻）→ Microsoft（要 Azure 账号但不要备案）→ QQ（要备案）。
如果你只是想给开发者/办公用户一个第三方登录，Microsoft 比 QQ 省事得多。

---

## 6. 本项目落地清单

| 文件 | 改动 |
|---|---|
| `services/account/routes/microsoft.js` | 新增：start / callback / bind / register / bindings / unbind |
| `services/account/ayOnline.js` | 挂载 `handleMicrosoftAuth` |
| `services/account/config.js` | 增加 Microsoft 常量与 TTL |
| `shared/error-codes.js` | 新增 1058–1063 |
| `api-vue` 登录页 | 增加 Microsoft 登录按钮与绑定页 |
| `wrangler.toml` 文档 | 记录 `MICROSOFT_CLIENT_ID` / `MICROSOFT_CLIENT_SECRET` / `MICROSOFT_TENANT` / `MICROSOFT_REDIRECT_URI` |
