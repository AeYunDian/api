# analytics —— mysites.undz.cn（站点统计）

埋点采集 + 统计查询。跟踪器脚本由 Worker 动态生成，兼容老浏览器。

- 入口：`api-worker/src/services/analytics/ayAnalytics.js`
- 代码目录：`api-worker/src/services/analytics/`
- 域名：`mysites.undz.cn`
- 鉴权：统计查询复用 `checkAuth`（`.undz.cn` Cookie）；采集为公开接口

## 端点

| 方法 | 路径 | 登录态 | 说明 |
|---|---|---|---|
| GET | `/analytics.js` | — | 跟踪器脚本，`?token=<site_token>` |
| GET/POST | `/api/event` | — | 事件采集；GET 供 IE Image beacon |
| GET | `/api/me` | Cookie | 当前账号简要信息 |
| GET | `/api/sites/{id}/stats?range=` | Cookie | 统计聚合 |
| GET | `/api/sites/{id}/realtime` | Cookie | 实时在线 |

`range`：`today`（按小时）/ `7d` / `30d` / `90d`，默认 `7d`。

## 采集

- 跟踪器把事件发到 `/api/event`，字段包括站点 `token`、事件名（默认 `pageview`）、
  路径、来源、屏幕、UTM 等；服务端补充国家、浏览器、OS、设备。
- 请求体上限 4 KB；`token` 形如 `/^[A-Za-z0-9_-]{20,80}$/`。
- 响应 `204`，CORS 全开（不需要 Cookie）。
- 采集接口没有登录态，靠 site token 区分站点。

## 查询

- 站点不存在或不属于当前用户时统一 `404`，不暴露 id 是否存在。
- 管理员（`sub === 1`）可以查任意站点。
- 统计结果包含：总量（pageviews / visitors）、按天或小时序列、Top 路径、Top 来源、
  Top 国家、浏览器 / OS / 设备分布。每条 Top 列表最多 20 项。
- 查询走 `env.limiter`，按 `stats:{sub}` / `rt:{sub}` 限流，超限 `429 rate_limited`。

## 数据表

| 表 | 说明 |
|---|---|
| `analytics_sites` | `id`、`token`、`user_sub`、`domain`、`name`、时间戳 |
| `analytics_events` | `site_token`、`ts`、`visitor`、`name`、`path`、`ref`、国家/浏览器/OS/设备/屏幕/UTM |

索引：`(site_token, ts)`、`(site_token, path)`。

## 配额与创建

站点的创建 / 删除 / 转移在 console：

- `POST /api/console/sites`
- `DELETE /api/console/sites/{id}`
- `PUT /api/console/sites/transfer`

普通用户最多 5 个站点，管理员不限。

## 注意

- 事件量直接决定 D1 行写入量；免费额度是 10 万行/天，和短链计数等共用。
- 统计查询按 `site_token + ts` 扫描，保留时间越长查询越慢；目前没有自动清理。
- 前端埋点脚本地址写在 `api-vue/src/shared/head.config.js`，token 是明文。
