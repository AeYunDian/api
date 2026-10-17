# console —— console.undz.cn（管理后台 API）+ go.undz.cn（短链跳转）

两个域名、三套接口：

- `/api/console/*` —— 后台业务接口（OAuth 应用、用户、反馈、站点统计、短链接）
- `/api/filesmanager` —— R2 文件管理（上传 / 更新 / 列表 / 下载 / 删除）
- `go.undz.cn/{code}` —— 短链接公开跳转（含可选密码页，**不经过登录态**）

入口 [`ayConsole.js`](./ayConsole.js) 只做鉴权与分发，业务在 `routes/`；短链跳转在
[`shortlink.js`](./shortlink.js)，由 `src/index.js` 直接挂到 `go.undz.cn`。

## 目录与职责

| 文件 | 职责 |
|---|---|
| `ayConsole.js` | 入口：CORS/OPTIONS、登录态校验、算 `isAdmin`、按前缀分发 |
| `http.js` | `jsonResponse` / `corsHeaders`（含跨域白名单） |
| `utils.js` | `parseBool` / `normalizePath`（路径归一与穿越防护）/ `readUploadBody`（表单或 JSON） |
| `config.js` | 短链配额、字符集、密码与限流参数、`buildShortUrl` |
| `shortlink.js` | `go.undz.cn` 公开跳转：短码查询、302、密码页、点击计数 |
| `routes/oauth.js` | OAuth 客户端：注册、列表、删除、转移 |
| `routes/users.js` | 当前用户、用户列表、封禁/解封 |
| `routes/feedback.js` | 反馈：列表、提交、删除、转移、详情、改状态、回复 |
| `routes/sites.js` | 统计站点：列表、创建、删除、转移 |
| `routes/links.js` | 短链接：列表、创建、修改、软删、换码、转移 |
| `routes/files.js` | R2 文件管理，自带管理员校验与 try/catch |

## 请求流程

```
console.undz.cn/*
  │
  ├─ OPTIONS → 204（带 CORS 头）
  │
  ├─ /api/console/*  ─────────────────────────────┐
  │     try {                                      │
  │       checkAuth → 401 / 403(banned)            │
  │       isAdmin = user.sub === 1                 │
  │       for (handler of CONSOLE_ROUTES) {        │
  │          const res = await handler(ctx)        │
  │          if (res) return res                   │
  │       }                                        │
  │     } catch → 500 Internal server error        │
  │                                                │
  ├─ /api/filesmanager ──────────────────────────┐ │
  │     自带 checkAuth + 管理员校验 + try/catch   │ │
  │
  └─ 其它 → env.assets.fetch(request)（SPA 兜底）
```

`ctx` 里传的是 `{ request, env, url, path, method, cors, user, isAdmin }`。

现状（拆分前就是这样，属于冗余但等价）：

- `users.js`、`sites.js` 直接用 `ctx.user` / `ctx.isAdmin`；
- `feedback.js` 每个 handler 仍各自调了一次 `checkAuth`（共 7 处），`oauth.js` 的转移接口也自查了一次；
- 两条路的结果一致，所以新写端点请**只用 ctx**，别再重复查。

## 权限模型

| 角色 | 判定 | 能做什么 |
|---|---|---|
| 未登录 | `checkAuth` → `TAG_NOT_LOGGEDIN` | 一律 401 |
| 被封禁 | `TAG_BANNED` | 403，响应带 `ban_reason` |
| 普通用户 | `user.sub !== 1` | 只能看/管自己的 OAuth 应用、反馈、站点 |
| 管理员 | `user.sub === 1` | 看全部、封禁用户、改反馈状态/回复/转移、转移应用和站点 |

> 管理员是**硬编码的 1 号账号**，没有角色表。新增"管理员专属"接口时照抄
> `if (!isAdmin) return jsonResponse({ error: "Admin only" }, 403, cors);`。

## 端点表

### OAuth 应用（`routes/oauth.js`）

| 方法 | 路径 | 权限 | 说明 |
|---|---|---|---|
| POST | `/api/console/oauth/client/register` | 管理员 | 注册客户端，返回 `client_id` / `client_secret` |
| GET | `/api/console/oauth/clients` | 登录 | 管理员看全部，普通用户看自己的；附 `creator_username` |
| DELETE | `/api/console/oauth/client/{client_id}` | 所有者或管理员 | 删除应用 |
| PUT | `/api/console/oauth/client/transfer` | 管理员 | 把应用所有权转给另一个用户 |

限制：**每个用户最多 6 个客户端**（`Maximum 6 clients per user`，管理员不限）。

### 用户（`routes/users.js`）

| 方法 | 路径 | 权限 | 说明 |
|---|---|---|---|
| GET | `/api/console/me` | 登录 | 当前账号的简要信息 |
| GET | `/api/console/users` | 管理员 | 用户列表 |
| POST | `/api/console/user/ban` | 管理员 | 封禁/解封，body: `{ user_id, banned, ban_reason }`；不能封超管 |

### 反馈（`routes/feedback.js`）

| 方法 | 路径 | 权限 | 说明 |
|---|---|---|---|
| GET | `/api/console/feedback/list?status=` | 登录 | 管理员看全部，普通用户只看自己的 |
| POST | `/api/console/feedback/submit` | 登录 | 提交，有人机限流与配额 |
| GET | `/api/console/feedback/detail/{id}` | 所有者或管理员 | 详情 |
| PUT | `/api/console/feedback/update-status` | 管理员 | `status` ∈ `pending/processing/resolved/closed` |
| PUT | `/api/console/feedback/reply` | 管理员 | 管理员回复 |
| PUT | `/api/console/feedback/transfer` | 管理员 | 转移给其他用户 |
| DELETE | `/api/console/feedback/delete/{id}` | 所有者或管理员 | 删除 |

**状态机**：`pending`（待处理）→ `processing`（处理中）→ `resolved`（已解决，写 `resolved_at`）
/ `closed`（关闭）。

**配额与限流**：

| 项 | 值 | 位置 |
|---|---|---|
| 单用户「待处理+处理中」上限 | 5 | `feedback.js` `COUNT(*) ... status IN ('pending','processing')` |
| 单用户反馈总数上限 | 50 | `feedback.js` |
| 提交频率 | `env.limiter`（wrangler `ratelimits`，50 次 / 10 秒） | `feedback.js` |

### 站点统计（`routes/sites.js`）

| 方法 | 路径 | 权限 | 说明 |
|---|---|---|---|
| GET | `/api/console/sites` | 登录 | 管理员看全部，普通用户只看自己的；附 `creator_username` |
| POST | `/api/console/sites` | 登录 | 创建站点，body: `{ domain, name }`，生成埋点 `token` |
| DELETE | `/api/console/sites/{id}` | 所有者或管理员 | 删除站点并级联清理事件 |
| PUT | `/api/console/sites/transfer` | 管理员 | 转移站点所有权 |

限制：**每个用户最多 5 个站点**（`Maximum 5 sites per user`）。

### 文件管理（`routes/files.js`）

| 方法 | 路径 | 权限 | 说明 |
|---|---|---|---|
| POST | `/api/filesmanager` | 管理员 | 上传：multipart 或 JSON；字段 `path`、`code`、`password`、`expirationat` |
| PUT | `/api/filesmanager` | 管理员 | 更新：改路径/口令/过期时间，可替换文件本体 |
| GET | `/api/filesmanager` | 管理员 | 列表（目录）或下载（文件） |
| DELETE | `/api/filesmanager` | 管理员 | 删除文件或整个目录 |

字段与规则：

| 字段 | 说明 |
|---|---|
| `path` | 逻辑路径，`normalizePath` 会拒绝 `..`、控制字符、超过 512 字符 |
| `code` | 对外分享代码，`/^[A-Za-z0-9_-]{4,128}$/`，不传则自动生成 |
| `password` | 访问口令（**当前是明文存储、明文比对**，见"已知债"） |
| `expiration_at` | 过期时间（秒级时间戳，空 = 永久） |
| `r2_key` | R2 对象键，实际内容在 `env.STORAGE_BUCKET` |

对外下载走**另一个域名**：`files.undz.cn/files/{code}`（见 `services/files/ayFiles.js`），
带口令的文件会返回一个口令表单，猜对后直出文件。

### 短链接（`routes/links.js` + `shortlink.js`）

管理接口（前缀 `/api/console/links`，全部需要登录）：

| 方法 | 路径 | 权限 | 说明 |
|---|---|---|---|
| GET | `/api/console/links` | 登录 | 列表，`cursor` / `limit` / `q` / `status`；管理员看全部并附带 `creator_username` |
| POST | `/api/console/links` | 登录 | 创建，body: `{ target, code?, title?, password?, expires_at? }` |
| GET | `/api/console/links/{id}` | 所有者或管理员 | 详情 |
| PATCH | `/api/console/links/{id}` | 所有者或管理员 | 改目标 / 短码 / 备注 / 密码 / 过期 / 状态 |
| DELETE | `/api/console/links/{id}` | 所有者或管理员 | 软删除（`status='deleted'`，短码不复用） |
| POST | `/api/console/links/{id}/rotate` | 所有者或管理员 | 重新生成短码 |
| PUT | `/api/console/links/{id}/transfer` | 管理员 | 转移所有权 |

公开跳转：

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `go.undz.cn/{code}` | 302 到目标；带密码时返回密码表单 |
| POST | `go.undz.cn/{code}` | 校验密码，通过后写 10 分钟免密 Cookie 并 302 |

规则：

| 项 | 值 |
|---|---|
| 配额 | 普通用户 100 条（软删释放），管理员不限 |
| 短码字符集 | 普通用户 `a-z 1-9 /`；管理员额外 `A-Z @ # $ % * ( )` |
| 短码长度 | 普通用户 3–250；管理员 1–250 |
| 密码 | 可选，PBKDF2-SHA256 10 万次 + 每链接随机盐，不存明文 |
| 点击统计 | `click_count` / `last_clicked_at`，跳转时异步 +1 |
| 过期 | `expires_at` 秒级时间戳；到期后公开访问统一 404 |
| 短码保留 | 软删后短码永久保留，避免旧链接被他人注册劫持 |

> `#` 和 `%` 在 URL 路径里必须转义，`config.js` 的 `buildShortUrl()` 会逐段
> `encodeURIComponent`，对外展示的 `short_url` 可直接复制访问。

## 扩展指南

1. 新端点先选文件：OAuth 相关 → `oauth.js`；用户 → `users.js`；反馈 → `feedback.js`；
   统计 → `sites.js`；短链接 → `links.js`；文件 → `files.js`。
2. 保持 `if (path === "..." && method === "POST") { ... }` 形状，用 `jsonResponse(data, status, cors)`。
3. 需要管理员：用 ctx 里的 `isAdmin`，别自己再查。
4. 需要新表字段：改 `services/account/db/schema.js` 并跑一次 `/api/ayonline/init`（没有迁移系统）。
5. 需要错误码：从 `shared/error-codes.js` 的 1100–1199 段取号（短链已用到 1113）。
6. 自查：`npm run lint` + `wrangler deploy --dry-run`。

## 已知债

- **管理员 = `sub === 1`**：和账号服务共用这个约定，无法授予第二个管理员。
- **文件口令明文**：`file_manager.password` 存明文、比明文，且没有失败次数限制，建议改成
  复用 `auth/crypto.js` 的 PBKDF2 + 失败锁定。
- **兜底泄露栈**：`/api/filesmanager` 之外的最外层 catch 仍把 `err.message`/`err.stack`
  拼进 500 响应体（拆分前就有的写法），生产环境建议只回通用文案。
- **`/api/console/*` 没有限流**：只有反馈提交用了 `env.limiter`，其它接口靠登录态兜底。
- **短链密码尝试限流是进程内的**：isolate 之间不共享，属于软限制；要强一致需要落 D1。
- **旧 `links` 表**：`api.undz.cn` 的历史短链表已停止读写，数据未迁移，确认无人使用后可删除。
