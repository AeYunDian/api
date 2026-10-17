# console —— console.undz.cn（管理后台 API）

后台业务 API。短链跳转在 `go.undz.cn`，单独见 [shortlink.md](shortlink.md)。

- 入口：`api-worker/src/services/console/ayConsole.js`
- 代码目录：`api-worker/src/services/console/`
- 域名：`console.undz.cn`

## 目录

| 文件 | 职责 |
|---|---|
| `ayConsole.js` | 入口：CORS/OPTIONS、登录态校验、算 `isAdmin`、按前缀分发 |
| `http.js` | `jsonResponse` / `corsHeaders`（含跨域白名单） |
| `utils.js` | `parseBool` / `normalizePath` / `readUploadBody` |
| `config.js` | 短链配额、字符集、密码与限流参数、`buildShortUrl` |
| `shortlink.js` | `go.undz.cn` 公开跳转（详见 shortlink.md） |
| `routes/oauth.js` | OAuth 客户端：注册、列表、删除、转移 |
| `routes/users.js` | 当前用户、用户列表、封禁/解封 |
| `routes/feedback.js` | 反馈：列表、提交、删除、转移、详情、改状态、回复 |
| `routes/sites.js` | 统计站点：列表、创建、删除、转移 |
| `routes/links.js` | 短链接：列表、创建、修改、软删、换码、转移 |
| `routes/files.js` | R2 文件管理 |

## 请求流程

```
console.undz.cn/*
  ├─ OPTIONS → 204
  ├─ /api/console/* → checkAuth → 401 / 403(banned)
  │    → isAdmin = user.sub === 1
  │    → CONSOLE_ROUTES: oauth / users / feedback / sites / links
  ├─ /api/filesmanager → 自带 checkAuth + 管理员校验
  └─ 其它 → env.assets.fetch()（SPA）
```

`ctx = { request, env, url, path, method, cors, user, isAdmin }`。

## 权限模型

| 角色 | 判定 | 能做什么 |
|---|---|---|
| 未登录 | `checkAuth` → `TAG_NOT_LOGGEDIN` | 401 |
| 被封禁 | `TAG_BANNED` | 403 + `ban_reason` |
| 普通用户 | `user.sub !== 1` | 管自己的 OAuth 应用、反馈、站点、短链 |
| 管理员 | `user.sub === 1` | 看全部、封禁、改反馈状态、转移应用/站点/短链 |

> 管理员是硬编码 1 号账号，没有角色表。

## 端点

### OAuth 应用

| 方法 | 路径 | 权限 | 说明 |
|---|---|---|---|
| POST | `/api/console/oauth/client/register` | 管理员 | 注册客户端 |
| GET | `/api/console/oauth/clients` | 登录 | 管理员看全部，普通用户看自己的 |
| DELETE | `/api/console/oauth/client/{client_id}` | 所有者/管理员 | 删除 |
| PUT | `/api/console/oauth/client/transfer` | 管理员 | 转移所有权 |

限制：**每个用户最多 6 个客户端**（`MAX_CLIENTS_PER_USER`，管理员不限）。

### 用户

| 方法 | 路径 | 权限 | 说明 |
|---|---|---|---|
| GET | `/api/console/me` | 登录 | 当前账号简要信息 |
| GET | `/api/console/users` | 管理员 | 用户列表 |
| POST | `/api/console/user/ban` | 管理员 | 封禁/解封，不能封超管 |

### 反馈

| 方法 | 路径 | 权限 | 说明 |
|---|---|---|---|
| GET | `/api/console/feedback/list?status=` | 登录 | 管理员看全部，普通用户看自己的 |
| POST | `/api/console/feedback/submit` | 登录 | 提交，有人机限流与配额 |
| GET | `/api/console/feedback/detail/{id}` | 所有者/管理员 | 详情 |
| PUT | `/api/console/feedback/update-status` | 管理员 | `pending/processing/resolved/closed` |
| PUT | `/api/console/feedback/reply` | 管理员 | 管理员回复 |
| PUT | `/api/console/feedback/transfer` | 管理员 | 转移 |
| DELETE | `/api/console/feedback/delete/{id}` | 所有者/管理员 | 删除 |

配额：单用户「待处理+处理中」上限 5；反馈总数上限 50；提交走 `env.limiter`。

### 站点统计

| 方法 | 路径 | 权限 | 说明 |
|---|---|---|---|
| GET | `/api/console/sites` | 登录 | 管理员看全部，普通用户看自己的 |
| POST | `/api/console/sites` | 登录 | 创建，生成埋点 token |
| DELETE | `/api/console/sites/{id}` | 所有者/管理员 | 删除并级联清理事件 |
| PUT | `/api/console/sites/transfer` | 管理员 | 转移所有权 |

限制：**每个用户最多 5 个站点**。

### 短链接

管理接口 `/api/console/links*`，规则、字符集、屏蔽词和公开跳转见 [shortlink.md](shortlink.md)。

### 文件管理

| 方法 | 路径 | 权限 | 说明 |
|---|---|---|---|
| POST | `/api/filesmanager` | 管理员 | 上传（multipart 或 JSON） |
| PUT | `/api/filesmanager` | 管理员 | 更新路径/口令/过期时间或替换文件 |
| GET | `/api/filesmanager` | 管理员 | 列表（目录）或下载（文件） |
| DELETE | `/api/filesmanager` | 管理员 | 删除文件或整个目录 |

字段：`path`、`code`、`password`、`expiration_at`、`r2_key`。
`normalizePath` 拒绝 `..`、控制字符、超过 512 字符；`code` 为 `/^[A-Za-z0-9_-]{4,128}$/`。

对外下载走 `files.undz.cn/files/{code}`，见 [files.md](files.md)。

## 错误码

console 段为 1100–1199，目前短链使用 1100–1113，其余尚未使用。

## 已知债

- **管理员 = `sub === 1`**：无法授予第二个管理员。
- **文件口令明文**：`file_manager.password` 存明文、比明文，建议改成 PBKDF2 + 失败锁定。
- **兜底泄露栈**：`/api/filesmanager` 之外的最外层 catch 会把 `err.message`/`err.stack`
  拼进 500 响应体。
- **`/api/console/*` 没有统一限流**：只有反馈提交用了 `env.limiter`。
- **短链密码尝试限流是进程内的**：isolate 之间不共享，属于软限制。
