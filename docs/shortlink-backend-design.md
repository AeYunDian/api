# ayconsole 短链接服务（已实施）

> 归属：`console.undz.cn`（管理接口）+ `go.undz.cn`（公开跳转）。
> 普通用户最多 100 条、管理员不限；短链接可选密码。
> 前端管理页在 console 应用的「短链接」菜单。

---

## 1. 定稿结论

| 项目 | 最终方案 |
|---|---|
| 短链形态 | `https://go.undz.cn/{code}` |
| 管理接口 | `https://console.undz.cn/api/console/links`（需登录） |
| 公开跳转 | `https://go.undz.cn/{code}`（无需登录，302） |
| 数据表 | `short_links`（`api_db`），旧 `links` 表已停用 |
| 配额 | 普通用户 100 条（软删释放），`sub === 1` 不限 |
| 短码字符集 | 普通用户 `a-z 1-9 /`；管理员额外 `A-Z @ # $ % * ( )` |
| 短码长度 | 普通用户 3–250；管理员 1–250 |
| 密码 | 可选，PBKDF2-SHA256 10 万次 + 每链接随机盐，**不存明文** |
| 统计 | `click_count` + `last_clicked_at`，跳转时异步 +1 |
| 错误码 | `1100–1113`（console 段） |
| 旧实现 | `gateway/short_link_v1.js`、`POST /go/addlink` 已删除 |
| 前端 | `console` 应用新增「短链接」页（列表 / 创建 / 编辑 / 停用 / 换码 / 转移 / 删除） |

---

## 2. 路由

### 2.1 `go.undz.cn`（公开）

`src/index.js` 按 hostname 分发：

```js
if (hostname === "go.undz.cn")
  return await handleShortLink(request, env, ctx);
```

处理逻辑在 [`services/console/shortlink.js`](../api-worker/src/services/console/shortlink.js)：

```
GET  /{code}   → 302 目标（无密码 / 已验证 / Cookie 有效）
GET  /{code}   → 401 + 密码表单（有密码且未验证）
POST /{code}   → 校验密码；正确则 Set-Cookie + 302，错误则 403 + 表单
GET  /health   → {"ok":true}（保留短码，业务不可占用）
其它            → 404 页面
```

- `code` 取 `pathname` 去掉首个 `/` 后 `decodeURIComponent` 的结果，允许包含 `/` 形成多段。
- 末尾多余的 `/` 会被忽略；`//`、空段、非法字符一律按不存在处理。
- `/api/console/*` 的登录态校验与这里完全无关，短链可以作为公开链接分享。

### 2.2 `console.undz.cn`（管理）

`ayConsole.js` 的 `CONSOLE_ROUTES` 增加 `handleLinksRoutes`，仍在 `checkAuth` 之后：

```
/api/console/links*  → checkAuth → isAdmin → routes/links.js
```

---

## 3. 数据模型

建表已加入 `services/account/db/schema.js`，随 `POST /api/ayonline/init` 创建。

```sql
CREATE TABLE IF NOT EXISTS short_links (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  code           TEXT NOT NULL UNIQUE,
  target         TEXT NOT NULL,
  user_sub       INTEGER NOT NULL,
  title          TEXT NOT NULL DEFAULT '',
  password_hash  TEXT,                          -- base64(PBKDF2)，NULL = 无密码
  password_salt  TEXT,                          -- base64(16 字节随机盐)
  expires_at     INTEGER,                       -- 秒，NULL = 永久
  status         TEXT NOT NULL DEFAULT 'active',-- active | disabled | deleted
  click_count    INTEGER NOT NULL DEFAULT 0,
  last_clicked_at INTEGER,
  created_at     INTEGER NOT NULL,
  updated_at     INTEGER NOT NULL
);

CREATE INDEX idx_short_links_user   ON short_links(user_sub, created_at DESC);
CREATE INDEX idx_short_links_status ON short_links(status, expires_at);
```

**软删除**：`DELETE` 只把 `status` 改成 `deleted`，短码永久保留，避免旧链接被他人重新注册劫持。
软删不占配额。

---

## 4. 短码规则

### 4.1 字符集

| 角色 | 正则 | 说明 |
|---|---|---|
| 普通用户 | `^[a-z1-9/]+$` | 小写字母、数字 1-9、斜杠 |
| 管理员 | `^[a-zA-Z1-9/@#$%*()]+$` | 额外大写字母与 `@ # $ % * ( )` |

- 数字 **0 不允许**；不允许 `-`、`_`、空格等其它字符。
- 长度按**解码后的原始字符数**计算（不是 URL 编码后的长度）。
- 不允许首尾 `/`，也不允许 `//` 空段。
- 保留字按第一段判断：`api`、`s`、`admin`、`static`、`assets`、`files`、`login`、
  `logout`、`oauth`、`callback`、`health`、`test`、`init`、`console`、`favicon.ico`、
  `robots.txt`、`sitemap.xml`、`_`、`next`。

### 4.2 URL 转义

`#` 在 URL 里是 fragment 分隔符、`%` 是转义引导符，都必须编码，否则浏览器不会把后半段发给服务端。
`config.js` 的 `buildShortUrl()` 逐段 `encodeURIComponent` 后再拼回：

```
code = a#b        → https://go.undz.cn/a%23b
code = a%23b      → https://go.undz.cn/a%2523b
code = a/b        → https://go.undz.cn/a/b
```

接口返回的 `short_url` 已经是可直接复制访问的形式。手动输入 `go.undz.cn/a#b` 只会请求到 `a`。

### 4.3 自动生成

- 字符集 `abcdefghijklmnopqrstuvwxyz123456789`，长度 7；
- `crypto.getRandomValues`；
- 冲突时重试 5 次，仍冲突返回 `LINK_CODE_TAKEN`。

---

## 5. 配额与并发

| 角色 | 上限 | 计数口径 |
|---|---|---|
| 普通用户 | 100 | `status != 'deleted'` |
| 管理员 | 不限 | — |

非管理员用条件插入保证原子，避免并发超限：

```sql
INSERT INTO short_links (...)
SELECT ... WHERE (SELECT COUNT(*) FROM short_links
                  WHERE user_sub = ? AND status != 'deleted') < 100;
```

`meta.changes === 0` → `403 LINK_LIMIT_REACHED`。
管理员走普通 `INSERT`。

---

## 6. 密码保护

- 存储：PBKDF2-SHA256 / 100,000 次迭代 / 16 字节随机盐 / base64。
- 校验：重新派生 + 定长比较，不提前 return。
- 流程：
  - 无密码 → 直接 302；
  - 有密码且未验证 → `401` + 密码表单；
  - POST 正确 → 写 10 分钟免密 Cookie 后 302；
  - POST 错误 → `403` + 表单（只提示“密码错误”）。
- 免密 Cookie：
  - 名称 `SL_<hash(code)>`，值 `{exp}.{HMAC-SHA256(JWT_KEY, "code.exp")}`；
  - `HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`；
  - 每次成功输入密码重新签发。
- 限流：10 次 / 10 分钟 / (code + IP)，进程内滑动窗口（isolate 间不共享，属软限制）。
- 密码表单不回显目标 URL，避免绕过。

---

## 7. 目标 URL 校验

| 规则 | 结果 |
|---|---|
| 必须是绝对 URL | `LINK_INVALID_TARGET` |
| 仅允许 `http:` / `https:` | `LINK_INVALID_TARGET` |
| 长度 ≤ 2048 | `LINK_INVALID_TARGET` |
| 目标 host 是 `go.undz.cn` | `LINK_SELF_REFERENCE` |
| 命中 `env.SHORTLINK_BLOCKED_HOSTS` | `LINK_INVALID_TARGET` |

跳转响应头：

```
302 Found
Location: <target>
Cache-Control: no-store
Referrer-Policy: no-referrer
X-Robots-Tag: noindex, nofollow
```

用 302 而非 301：避免浏览器/CDN 长期缓存导致改目标或停用不生效。

---

## 8. 点击统计

```sql
UPDATE short_links
   SET click_count = click_count + 1, last_clicked_at = ?
 WHERE id = ?;
```

- 在 302 响应后通过 `ctx.waitUntil()` 异步执行，不阻塞跳转。
- 不接受客户端上报。
- 每次点击 1 行写；D1 免费额度与 `analytics_events` 共用，量大时注意（见 §12）。

---

## 9. 接口

### 9.1 管理（需登录）

| 方法 | 路径 | 权限 | 说明 |
|---|---|---|---|
| GET | `/api/console/links` | 登录 | 列表；`cursor` / `limit` / `q` / `status`；管理员附带 `creator_username` |
| POST | `/api/console/links` | 登录 | `{ target, code?, title?, password?, expires_at? }` |
| GET | `/api/console/links/{id}` | 所有者/管理员 | 详情 |
| PATCH | `/api/console/links/{id}` | 所有者/管理员 | 改目标/短码/备注/密码/过期/状态 |
| DELETE | `/api/console/links/{id}` | 所有者/管理员 | 软删 |
| POST | `/api/console/links/{id}/rotate` | 所有者/管理员 | 换短码 |
| PUT | `/api/console/links/{id}/transfer` | 管理员 | 转移 |

`status` 过滤：`all`（默认）/ `active` / `expired` / `disabled` / `deleted`。

返回对象：

```json
{
  "id": 1,
  "code": "abc1234",
  "short_url": "https://go.undz.cn/abc1234",
  "target": "https://example.com/a",
  "title": "示例",
  "has_password": true,
  "expires_at": null,
  "expired": false,
  "status": "active",
  "click_count": 12,
  "last_clicked_at": 1730000000,
  "user_sub": 2,
  "created_at": 1730000000,
  "updated_at": 1730000000,
  "creator_username": "bob"
}
```

列表额外返回 `quota: { used, limit }`（管理员 `limit = null`）与 `next_cursor`。

### 9.2 公开

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `https://go.undz.cn/{code}` | 302 / 密码页 / 404 |
| POST | `https://go.undz.cn/{code}` | 校验密码 |
| GET | `https://go.undz.cn/health` | 健康检查（保留短码） |

---

## 10. 错误码（1100–1113）

| 号 | 常量 | HTTP | 含义 |
|---|---|---|---|
| 1100 | `LINK_LIMIT_REACHED` | 403 | 已达 100 条上限 |
| 1101 | `LINK_INVALID_TARGET` | 400 | 目标 URL 非法 |
| 1102 | `LINK_CODE_TAKEN` | 409 | 短码已被占用 |
| 1103 | `LINK_INVALID_CODE` | 400 | 短码格式/保留字非法 |
| 1104 | `LINK_NOT_FOUND` | 404 | 不存在或不可见 |
| 1105 | `LINK_EXPIRED` | 410 | 已过期（管理接口语义） |
| 1106 | `LINK_PASSWORD_REQUIRED` | 401 | 需要密码 |
| 1107 | `LINK_PASSWORD_INCORRECT` | 403 | 密码错误 |
| 1108 | `LINK_DISABLED` | 403 | 已停用 |
| 1109 | `LINK_PERMISSION_DENIED` | 403 | 无权操作 |
| 1110 | `LINK_RATE_LIMITED` | 429 | 触发限流 |
| 1111 | `LINK_SELF_REFERENCE` | 400 | 指向短链自身 |
| 1112 | `LINK_INVALID_EXPIRES` | 400 | 过期时间非法 |
| 1113 | `LINK_INVALID_PASSWORD` | 400 | 密码不符合 4–64 位 |

公开页面不返回 JSON：404 / 过期 / 停用 / 删除统一显示同一个“链接不存在或已失效”页面。

---

## 11. 旧实现处理

已执行：

- 删除 `api-worker/src/services/gateway/short_link_v1.js`；
- 移除 `uniAPI.js` 的 import、`/go/addlink` 路由；
- 旧 `links` 表保留但不再读写（数据未迁移，可后续备份删除）。

旧端点的问题（供记录）：`POST /go/addlink` 未鉴权，任何人可创建/覆盖任意短链；
且没有跳转路由，建出来的链接本来就打不开。

---

## 12. 部署与验证

### 12.1 Cloudflare 侧

1. `go.undz.cn` 需要加入 Worker 的路由（Dashboard → Workers → 路由，
   或 `wrangler.toml` 的 `routes`）。当前仓库的 hostname 分支已就绪。
2. 部署后跑一次 `POST https://online.undz.cn/api/ayonline/init`
   （`X-Admin-Key: env.KEY`）创建 `short_links` 表。
3. 可选：在 `[vars]` 配 `SHORTLINK_BLOCKED_HOSTS`。

### 12.2 自测清单

1. 创建短链 → 未登录打开 `go.undz.cn/{code}` → 302
2. 带密码 → 401 表单 → 错密码 403 → 对密码 302，10 分钟内免密
3. 普通用户建到第 101 条 → 403；删一条后可再建
4. 管理员建 200 条不报错，`quota.limit = null`
5. 短码字符集/长度：普通用户 `ab`（2 位）拒绝、`ABC` 拒绝；管理员 `A`、`a@#1/(` 允许
6. 自定义码冲突 → 409；保留字 `admin`、`health` → 400
7. 过期 / 停用 / 删除 → 统一 404 页
8. 目标 `javascript:alert(1)`、`https://go.undz.cn/x` → 400
9. 软删后同一短码无法被他人注册
10. 点击计数 +1，响应头 `Cache-Control: no-store`
11. `#` 短码：返回的 `short_url` 带 `%23`，可正常跳转

### 12.3 成本

- 跳转：1 次 D1 读 + 1 次 D1 写（计数）；密码校验额外一次 PBKDF2。
- D1 免费额度 10 万行写/天，与 `analytics_events` 共用；点击量很大时可把计数改为
  抽样或汇总，接口不变。

---

## 13. 前端

- 路由：`/console-panel/short-links`
- 页面：`api-vue/src/console/views/console/ShortLinkManager.vue`
- 导航：console 侧边栏「短链接」，所有登录用户可见
- 功能：搜索、状态筛选、分页、创建、编辑、停用/启用、换短码、复制、软删、管理员转移
