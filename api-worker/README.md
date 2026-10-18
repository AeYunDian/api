# api-worker

Cloudflare Workers 后端。**一个 Worker 按域名分发到十几个子服务**：账号中心、管理后台、
站点统计、WebSocket 中继、文件分发、AI 代理、聊天室、短链接、图床反代、jsDelivr 代理……

```
api-worker/
├── wrangler.toml           # 绑定、路由、定时任务、可观测性
├── eslint.config.js        # ESLint 9 flat config（Workers 运行时全局）
├── package.json            # dev / deploy / lint 脚本
├── src/
│   ├── index.js            # 唯一入口：hostname → 服务模块
│   ├── README.md           # 目录结构与新增服务的约定
│   ├── shared/             # 错误码、KV 适配、通用工具
│   ├── services/           # 每个域名一个目录
│   │   ├── account/        # online.undz.cn  ← 文档见 docs/account.md
│   │   ├── console/        # console.undz.cn + go.undz.cn ← 见 docs/console.md / docs/shortlink.md
│   │   ├── analytics/ relay/ ai/ files/ gateway/ chat/ cdn/ image/ crossfire/
│   └── legacy/             # 无引用的历史文件，未接入路由
└── scripts/set-secrets.ps1
```

## 常用命令

```bash
cd api-worker
npm install
npm run dev            # wrangler dev src/index.js（本地 8787）
npm run deploy         # wrangler deploy src/index.js
npm run lint           # eslint .
npm run lint:fix

# 不改线上、只验证能否打包（重构后最有用的一条）
npx wrangler deploy --dry-run --outdir ../.dryrun-check
```

## 绑定与配置（wrangler.toml）

| 绑定 | 类型 | 用途 |
|---|---|---|
| `env.db` | D1（`api_db`） | 所有业务表 + 模拟 KV 的 `app_kv_store` |
| `env.kv` | KV（`483f0fad…`） | 老代码遗留绑定，新代码基本不用（走 `kvWithD1`） |
| `env.STORAGE_BUCKET` | R2（`exm`） | 文件管理的实际存储 |
| `env.AI` | Workers AI | `ai.js` / `yzh.ai.js` |
| `env.limiter` | Rate limit（50 次 / 10 秒） | 反馈提交、埋点采集 |
| `env.assets` | Static Assets（`../api-assets`） | 前端 SPA 与静态页，`run_worker_first = true` |
| cron | `*/30 * * * *` | 清理过期 KV 与中继离线队列 |

`compatibility_date = 2026-06-29` + `nodejs_compat`。

## 环境变量 / 密钥

本地放 `.env`（已被 gitignore），线上用 `wrangler secret put <NAME>` 或
`scripts/set-secrets.ps1`。按用途分组：

| 变量 | 必需 | 说明 |
|---|---|---|
| `JWT_KEY` | 是 | 账号中心签发/校验 access_token 的 HS256 密钥 |
| `KEY` | 是 | 超管密钥：`/api/ayonline/init`、`/api/kv/initdb`、聊天室管理 |
| `ALLOWED_APP_IDS` | 是 | `X-App-Id` 白名单，**逗号分隔的字符串**（代码用 `.includes` 判断） |
| `MAIL_SEND_DOMAIN` / `MAIL_API_KEY` | 是 | 发验证码用的邮件服务 |
| `GTCODEMAP` / `GTCODE` | 是 | GeeTest：`{captcha_id: private_key}` 的 JSON、`[register_id, login_id]` 的 JSON |
| `YZHYZXY_CLIENT_ID` / `YZHYZXY_CLIENT_SECRET` | 第三方登录用 | Yzhyzxy OAuth |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` / `GITHUB_REDIRECT_URI` | GitHub 登录用 | OAuth App 凭证；未配置时 `/api/auth/github/start` 返回 1070 |
| `CHAT_OAUTH_CLIENT_SECRET` | 聊天室用 | 聊天室换取/撤销 token |
| `ADMIN_TOKEN` | 可选 | `uniAPI` 的 `X-Admin-Token`；不配则相关接口放行 |
| `SHORTLINK_BLOCKED_HOSTS` | 可选 | 短链目标域名黑名单，逗号分隔 |
| `YZH_AI_API_KEY` | AI 用 | `yzh.ai.undz.cn` 的 Bearer 校验 |
| `GITHUB_TOKEN` / `RESEND_API_KEY` | 可选 | 历史遗留 / 未启用 |
| `DEBUG` | 可选 | 真值时打印 `env.DEBUG && console.*` 的调试日志 |
| `block` / `blocktime` | 可选 | `block="true"` 时账号中心返回 503 维护页 |

## 本地开发注意

- 入口按 **hostname 精确匹配**分发。本地访问 `http://localhost:8787` 不会命中任何服务，
  会落到 `env.assets`（前端 SPA）。要测某个服务，二选一：
  - `--local` 下用 `curl -H "Host: online.undz.cn" http://127.0.0.1:8787/api/ayonline/test`；
  - 或改 hosts 指向 `*.undz.cn`。
- 前端 `api-vue` 构建产物直接输出到 `../api-assets`，所以改前端后跑一次
  `cd api-vue && npm run build`，Worker 立刻能拿到新静态资源。
- 没有迁移系统：改表 = 改 `services/account/db/schema.js` + 调一次
  `POST /api/ayonline/init`（带 `X-Admin-Key: env.KEY`）。

## 发布前检查单

1. `npm run lint`（应为 0 error；warning 是历史风格项）
2. `npx wrangler deploy --dry-run`（验证模块图与 import 都能解析）
3. 改了错误码 → 确认数值没动、`ERROR_MESSAGES`/`ERROR_STATUS` 已补、前端 SDK 文案已同步
4. 改了前端 SDK → `npx terser account-sdk.js -o account-sdk.min.js --config-file terser.config.json`
5. 改了路由 → 冒烟 `/api/ayonline/test`、`/api/console/me`、`/api/filesmanager`

## 文档索引

一个子服务一个文档，统一在仓库根目录的 `docs/`：

- [docs/README.md](../docs/README.md) —— 子服务文档总索引
- [docs/account.md](../docs/account.md) —— 账号中心：鉴权模型、OAuth2、数据表
- [docs/console.md](../docs/console.md) —— 管理后台：权限、配额、文件管理
- [docs/shortlink.md](../docs/shortlink.md) —— 短链接：`go.undz.cn` + 管理接口
- [docs/relay.md](../docs/relay.md) / [docs/analytics.md](../docs/analytics.md) / [docs/files.md](../docs/files.md)
- [docs/ai.md](../docs/ai.md) / [docs/gateway.md](../docs/gateway.md) / [docs/chat.md](../docs/chat.md)
- [docs/cdn.md](../docs/cdn.md) / [docs/image.md](../docs/image.md) / [docs/kv.md](../docs/kv.md)
- [src/README.md](src/README.md) —— 目录结构、新增服务的约定
- [src/shared/README.md](src/shared/README.md) —— 错误码注册表、KV 适配器、工具函数
