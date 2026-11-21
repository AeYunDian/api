# analytics —— mysites.undz.cn（站点统计）

埋点采集 + 统计查询 + 公开分享。跟踪器脚本由 Worker 动态生成，兼容老浏览器。

- 入口：`api-worker/src/services/analytics/ayAnalytics.js`
- 代码目录：`api-worker/src/services/analytics/`
- 域名：`mysites.undz.cn`
- 站点管理：`console.undz.cn` 的 `/api/console/sites`（见 [docs/console.md](console.md)）

## 代码结构

| 文件 | 职责 |
|---|---|
| `ayAnalytics.js` | 入口：OPTIONS、认证分流、按路径分发 |
| `config.js` | CORS 白名单、上报约束、表名、分享配置默认值 |
| `http.js` | 响应与 CORS 助手 |
| `utils.js` | clamp、日期、限流包装 |
| `db.js` | 全部 SQL（站点与事件） |
| `access.js` | 权限解析、`share_config` 归一化 |
| `domains.js` | 域名规范化、多域名唯一性 |
| `ua.js` | UA 解析、屏幕分桶、省份映射 |
| `tracker.js` | 跟踪器模板与生成 |
| `routes/ingest.js` | `/api/event` |
| `routes/sites.js` | `/api/sites`、`/api/sites/:id` |
| `routes/stats.js` | `/api/sites/:id/stats`、`/realtime` |
| `routes/me.js` | `/api/me` |

## 端点

| 方法 | 路径 | 登录态 | 说明 |
|---|---|---|---|
| GET | `/analytics.js` | — | 跟踪器脚本，`?token=` 或 `data-token` |
| GET/POST | `/api/event` | — | 事件采集；GET 供 IE Image beacon |
| GET | `/api/sites` | 可选 | 双区块脱敏目录：`public` + `mine` |
| GET | `/api/sites/{id}` | 可选 | 站点元信息；按可见性 200 / 401 / 404 |
| GET | `/api/sites/{id}/stats?range=` | 可选 | 统计聚合，按 `share_config` 裁剪 |
| GET | `/api/sites/{id}/realtime` | 可选 | 实时在线，需分享开启 `realtime` |
| GET | `/api/me` | 必需 | 当前账号简要信息 |

`range`：`today` / `7d` / `30d` / `90d`，默认 `7d`。

## 鉴权

授权不放在入口统一拦截，而是按接口判断：

- `/api/event`、`/api/sites`：无需登录。
- `/api/sites/{id}`、`stats`、`realtime`：可选登录。`private` 一律 404；`logged_in` 匿名 401；`public` 按 `share_config` 返回。
- `/api/me`：匿名 401。
- 封禁账号一律 403。
- 没带 Cookie 时跳过 `checkAuth`，匿名访问不会多打一次会话查询。

站点可见性三态：`private`（默认）/ `logged_in` / `public`，另有独立的 `listed`
控制是否进入 `/api/sites` 的公开区块。`public + listed=0` 即「只给拿到链接的人看」。

## 采集

- 字段：站点 `token`、事件名、路径、来源、屏幕、`session_id`、触摸点数、UTM。
- 服务端补充：国家、省份、浏览器及主版本、OS 及主版本、设备。
- 请求体上限 4 KB；`token` 形如 `/^[A-Za-z0-9_-]{20,80}$/`。
- 成功 / 机器人 `204`，CORS 全开。
- 域名必须命中站点的 `domains` 之一，否则 `403`。
- 限流用 **`analy_limiter`**（20 次 / 10 秒，按 IP），超限返回 **`201` 空 body** 且不入库
  （迷惑性设计，避免攻击者据状态码判断；内部靠采样日志观测）。

## 查询

- 站点不存在或无权统一 `404`，不暴露 id 是否存在。
- 管理员（`sub === 1`）可以查任意站点。
- `share_config` 白名单：`totals`（pageviews / visitors / sessions）、`series`、
  `realtime`、`creator`、`breakdowns`（path / referrer / country / province /
  browser / os / device / event）。
- `province` 依赖 `country` 维度：`country` 关闭时，服务端强制 `province = false`。
- 被裁剪的维度返回 `null`（不是 `[]`）；被裁剪的聚合不执行 SQL。
- `creator` 控制 `site.creator_username` 是否返回；owner / admin 始终可见。
- 全部分享项关闭时，服务端强制打开 `creator`，避免空页面。
- `site.token` 只对 owner / admin 返回。
- 查询限流用 **`limiter`**（50 次 / 10 秒）：`stats:{sub}` / `rt:{sub}`，匿名用
  `stats:anon:{ip}` / `rt:anon:{ip}`；目录用 `sites:{ip}`。超限 `429`。

## 数据表

只读写 v2 两张表，旧表 `analytics_sites` / `analytics_events` 保留不动（由站长手工迁移）。

| 表 | 说明 |
|---|---|
| `analytics_sites_v2` | `id`、`token`、`user_sub`、`domain`、`domains`(JSON)、`name`、`visibility`、`listed`、`share_config`、时间戳 |
| `analytics_events_v2` | `site_token`、`ts`、`visitor`、`session_id`、`name`、`path`、`ref`、国家/省份、浏览器/OS/设备及版本、屏幕、触摸点数、UTM |

索引：`(site_token, ts)`、`(site_token, name, ts)`、`(site_token, path)`。
站点：`token` 唯一、`domain` 唯一、`(user_sub)`、`(listed, visibility)`。

## 配额与创建

- `POST /api/console/sites` 创建，`PUT /api/console/sites/{id}` 编辑，
  `DELETE /api/console/sites/{id}` 删除（连带事件），`PUT /api/console/sites/transfer` 转移。
- 普通用户最多 5 个站点，管理员不限。
- 同一域名全局只能归属一个站点；单站最多 10 个域名。

## 注意

- 事件量直接决定 D1 行写入量；免费额度是 10 万行/天，和短链计数等共用。
- 统计查询按 `site_token + ts` 扫描，保留时间越长查询越慢；目前没有自动清理。
- 前端埋点脚本地址写在 `api-vue/src/shared/head.config.js`，token 是明文。
- `sessions` 目前按「页面加载」计（客户端每次加载生成一个 `session_id`），
  不是 30 分钟窗口的真实会话。
- 限流按 Cloudflare colo 计数，不是全局配额。
