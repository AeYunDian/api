# 多 OAuth 2.0 登录接入

按 [接入更多 OAuth 2 规划文档.md](接入更多%20OAuth%202%20规划文档.md) 落地。

## 当前接入矩阵

| provider | 名称 | 回调 | 邮箱 | 快捷注册 | SDK 默认显示 |
|---|---|---|---|---|---|
| `github` | GitHub | `/api/auth/github/callback` | 有 | 是 | 是 |
| `yzhyzxy` | Yzhyzxy | `/api/auth/yzhyzxy/start` 对应回调 | 有（真实邮箱时） | 是 | 是 |
| `google` | Google | `/api/auth/google/callback` | 有 | 是 | 是 |
| `cloudflare` | Cloudflare | `/api/auth/cloudflare/callback` | 有 | 是 | 是 |
| `jihulab` | 极狐 GitLab | `/api/auth/gitlab-cn/callback` | 有 | 是 | 是 |
| `facebook` | Facebook | `/api/auth/facebook/callback` | 有 | 是 | **否** |
| `discord` | Discord | `/api/auth/discord/callback` | 有 | 是 | **否** |
| `aliyun` | 阿里云 | `/api/auth/aliyun/callback` | **无** | 否 | 是 |

Facebook / Discord 只在登录页隐藏，后端路由仍可用。修改
`api-vue/public/lib/ay-account/main.js` 和 `login.js` 里的
`OAUTH_PROVIDER_ENABLED` 即可重新打开（两边要一起改）。

## 环境变量

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

CLOUDFLARE_CLIENT_ID=
CLOUDFLARE_CLIENT_SECRET=

JIHULAB_CLIENT_ID=
JIHULAB_CLIENT_SECRET=

FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=

DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=

ALIYUN_CLIENT_ID=
ALIYUN_CLIENT_SECRET=
```

回调地址固定为 `https://online.undz.cn/api/auth/{provider}/callback`，
极狐 GitLab 使用 `gitlab-cn` 作为回调路径。
如需覆盖，可额外设置 `{PROVIDER}_REDIRECT_URI`。

## 流程

```
/start → 授权页 → callback
  ├─ 已绑定 → 登录
  ├─ 未绑定 + 有白名单邮箱 → /oauth2/github_register（填用户名/密码）
  ├─ 未绑定 + 邮箱不在白名单 → /oauth2/email_not_supported
  └─ 未绑定 + 无邮箱 → /oauth2/account_notlinked
```

邮箱白名单使用 `config.js` 的 `isAllowedEmailDomain()`，严格要求
`@domain` 或 `@sub.domain`，不会再出现 `evilgmail.com` 命中 `gmail.com` 的问题。

## 前端

- 新 SDK：`public/lib/ay-account/main.js`、`login.js`、`login.html`；
- 登录页新增 6 个提供商按钮，按 `OAUTH_PROVIDER_ENABLED` 显示/隐藏；
- 阿里云不返回邮箱，点击后先进入“暂不支持快捷注册”提示页：
  - 继续 → back 动画回登录页，然后打开授权窗口；
  - 取消 → back 动画回登录页；
- 账户页 `src/account/views/account/LinkAccount.vue` 已加入全部提供商；
- 新 SDK 的 `main.min.js` / `login.min.js` 已通过 `node build-min.mjs` 重新生成；
  以后修改 `main.js` / `login.js` 后需要再跑一次。
