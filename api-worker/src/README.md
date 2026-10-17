# api-worker/src 目录结构

一个 Worker 承载多个域名：`index.js` 按 `url.hostname` 分发到各服务，每个域名一个目录。

## 文档索引

| 文档 | 内容 |
|---|---|
| [../README.md](../README.md) | 顶层：命令、绑定、密钥、发布检查单 |
| [../../docs/README.md](../../docs/README.md) | **全部子服务文档索引**（一个子服务一篇） |
| [../../docs/account.md](../../docs/account.md) | **账号中心**：鉴权模型、口令与验证码、OAuth2 流程、数据表、闸门顺序 |
| [../../docs/console.md](../../docs/console.md) | **管理后台**：权限模型、端点表、配额、反馈状态机、R2 文件管理 |
| [../../docs/shortlink.md](../../docs/shortlink.md) | **短链接**：`go.undz.cn` 跳转、密码、配额、字符集、屏蔽词 |
| [shared/README.md](shared/README.md) | 错误码注册表、D1-KV 适配器、通用工具 |

## 域名 → 服务

| 域名 | 模块 | 说明 |
|---|---|---|
| `online.undz.cn` | `services/account/ayOnline.js` | 统一账号 / OAuth2（全站登录态的根） |
| `console.undz.cn` | `services/console/ayConsole.js` | 管理后台 API + 短链接管理 |
| `go.undz.cn` | `services/console/shortlink.js` | 短链接公开跳转（`/{code}`） |
| `mysites.undz.cn` | `services/analytics/ayAnalytics.js` | 埋点采集 + 统计查询 |
| `files.undz.cn` | `services/files/ayFiles.js` | R2 文件分发（`/files/{code}`） |
| `relay.undz.cn` | `services/relay/wsRelay.js` | WebSocket 中继（PSP 1.0） |
| `ai.undz.cn` / `yzh.ai.undz.cn` | `services/ai/*` | Workers AI 代理 |
| `api.undz.cn` / `api.io.hb.cn` | `services/gateway/uniAPI.js` | 二维码 / IP / 毕业纪念册 |
| `chat.undz.cn` / `c.undz.cn` | `services/chat/ayChatRoom.js` | 聊天室（数据层在 `chat_room.js`） |
| `cdn.undz.cn` | `services/cdn/jsdelivrCDN.js` | jsDelivr / gstatic 代理 |
| `i0/i1/i2.undz.cn` | `services/image/*` | 图床反代（三份仅换 host） |
| `kv.undz.cn` | `index.js` 内联 | 运维端点：`/initdb`、`/runtask`（需 `X-Admin-Key: env.KEY`） |
| 其它 / `undz.cn` / `mail.*` | `env.assets` | 前端 SPA 与静态页兜底 |

新增域名时：**`index.js` 里加一行 + 在 `services/` 建目录**，两处都要改。

```
src/
├── index.js                      # 入口：hostname → 服务分发、cron 清理、kv 运维端点
├── shared/                       # 跨服务共享，不放业务逻辑
│   ├── utils.js                  # CORS 头、HTML 转义、token/PKCE、base64、IP 脱敏等
│   └── kvWithD1.js               # 用 D1 模拟 KV 的适配器 + 过期清理
├── services/
│   ├── account/                  # online.undz.cn —— 统一账号 / OAuth2 授权服务器
│   │   ├── ayOnline.js           # 入口：建 KV、OPTIONS、维护开关、三段路由分发（~70 行）
│   │   ├── config.js             # 常量：TTL、PBKDF2 参数、OAuth 常量、域名白名单
│   │   ├── http.js               # jsonResponse / corsHeaders / handleOptions
│   │   ├── users.js              # 注册 / 口令登录 / 改密码（纯数据层）
│   │   ├── auth/                 # jwt.js（签发+校验）、crypto.js（PBKDF2/HMAC）、
│   │   │                         # tokens.js（refresh token）、kv.js（KV 实例持有者）
│   │   ├── oauth/                # clients.js（客户端注册/查询）、token.js（令牌流程）
│   │   ├── db/schema.js          # D1 建表语句（initDatabase）
│   │   ├── mail_verify/          # 邮箱验证码：send.js 发送、verify.js 校验
│   │   └── routes/               # 路由层，按 URL 前缀切分，逐个 if 块原样搬运
│   │       ├── third-party.js    # /api/auth/*、/api/oauth/callback
│   │       ├── account-api.js    # /api/ayonline/* 分发器（前缀判定 + 闸门）
│   │       ├── account-admin.js  # /api/ayonline/init、/test（闸门之前）
│   │       ├── account-session.js# 发码 / 注册 / 登录 / 改密 / 登出 / 校验 / 刷新
│   │       ├── account-profile.js# 改资料 / OAuth 绑定 / 设备数量 / 撤销全部设备
│   │       ├── account-oauth-apps.js # 我的应用列表 / 撤销令牌 / 撤销应用
│   │       └── oauth-server.js   # /api/oauth/* 授权服务器端点
│   ├── console/                  # console.undz.cn —— 管理后台 API
│   │   ├── ayConsole.js          # 入口：OPTIONS、登录态校验、按前缀分发
│   │   ├── http.js               # jsonResponse / corsHeaders / 域名白名单
│   │   ├── utils.js              # parseBool / normalizePath / readUploadBody
│   │   ├── config.js             # 短链配额、字符集、限流等常量
│   │   ├── shortlink.js          # go.undz.cn —— 公开跳转 + 密码页
│   │   └── routes/
│   │       ├── oauth.js          # /api/console/oauth/*（注册 / 列表 / 删除 / 转移）
│   │       ├── users.js          # /users /user/ban /me
│   │       ├── feedback.js       # /feedback/*（列表 / 提交 / 删除 / 转移 / 详情 / 改状态 / 回复）
│   │       ├── sites.js          # /sites*（统计站点增删查与转移）
│   │       ├── links.js          # /api/console/links*（短链增删改查 / 换码 / 转移）
│   │       └── files.js          # /api/filesmanager（R2 上传 / 更新 / 下载 / 删除）
│   ├── analytics/ayAnalytics.js  # mysites.undz.cn —— 埋点采集与统计
│   ├── relay/wsRelay.js          # relay.undz.cn —— WebSocket 中继（PSP 1.0，含离线队列）
│   ├── ai/ai.js                  # ai.undz.cn —— Workers AI 流式代理
│   ├── ai/yzh.ai.js              # yzh.ai.undz.cn —— 另一个 AI 入口
│   ├── files/ayFiles.js          # files.undz.cn —— R2 文件分发（含口令保护）
│   ├── gateway/uniAPI.js         # api.undz.cn —— 通用网关：二维码 / IP / 毕业纪念册
│   ├── gateway/graduation_yearbook_v1.js
│   ├── crossfire/v1/crossfire.js # uniAPI 内的账号 + 背包子模块
│   ├── chat/ayChatRoom.js        # chat.undz.cn —— 路由与页面
│   ├── chat/chat_room.js         # chat.undz.cn —— 数据层（消息/用户/敏感词/设置）
│   ├── cdn/jsdelivrCDN.js        # cdn.undz.cn —— jsDelivr 代理
│   └── image/                    # i0/i1/i2.undz.cn —— 图床反代（同构，仅换 host）
└── legacy/                       # 无任何引用的历史文件，未接入路由
```

## 约定

1. **新增一个域名服务**：在 `services/` 下建目录，默认导出 `{ async fetch(request, env, ctx) }`，
   然后在 `index.js` 的 hostname 分支里加一行。不要直接往 `src/` 根目录放文件。
2. **共享代码**：只有两个以上服务真正共用的东西才放 `shared/`；单个服务专用的辅助函数留在该服务目录内。
3. **`legacy/`**：这里的文件不被 `index.js` 引用，也不要接进路由。要复活其中某个功能，
   先移到 `services/`，补好鉴权与路由再看。清单见仓库根目录的维护说明或提交记录。
4. **鉴权**：跨服务的登录态统一走 `services/account/ayOnline.js` 导出的 `checkAuth`，
   不要在别的服务里自己解析 cookie 或 JWT。
5. **错误码**：一律从 `shared/error-codes.js` 取，禁止再写裸数字。

   ```js
   import { ERROR_CODES } from "../../shared/error-codes.js";
   return jsonResponse({ error_code: ERROR_CODES.INVALID_EMAIL }, 400, cors);
   ```

   新增一个号要做三件事：① 在对应号段取下一个未用号（1000-1099 账号、1100-1199 控制台、
   1200-1299 统计、1300-1399 文件、1400-1499 中继、1500-1599 AI、1900-1999 通用）；
   ② 在 `ERROR_MESSAGES` / `ERROR_STATUS` 里补默认文案与状态码；③ 如果前端 SDK 要单独展示，
   同步 `api-vue/public/lib/account-sdk.js` 的 `error.<号>` 文案，并用
   `public/lib/get_minsdk.bat`（或 `npx terser ... --config-file terser.config.json`）
   重新生成 `account-sdk.min.js`，否则线上加载的是旧的 min 版本。
   **只许新增，不许改号或复用已有号表示新语义。**

   ⚠️ 1024、1027–1039 已被前端 SDK 占用（取消人机验证、验证码发送、邮件与登录窗口），
   服务端不要选这些号。账号段新号从 **1040** 起，1040–1043 已被拆号占用。


