# kv —— kv.undz.cn（运维端点）

不是独立服务，路由内联在 `api-worker/src/index.js` 里，只提供两个运维操作。

- 域名：`kv.undz.cn`
- 鉴权：`X-Admin-Key: env.KEY`
- 代码：`api-worker/src/index.js` 的 `hostname === "kv.undz.cn"` 分支

## 端点

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/initdb` | 创建 `app_kv_store`、`psp_announcements`、`psp_relay` |
| POST | `/runtask` | 立即清理过期 KV 与过期中继数据 |

两个端点都要求请求头 `X-Admin-Key` 等于 `env.KEY`，否则 401。

## 定时任务

`wrangler.toml` 的 `crons = ["*/30 * * * *"]` 会调用 Worker 的 `scheduled()`，
效果等价于 `/runtask`：

```js
await cleanExpiredKv(env.db);
await cleanExpiredPsp(env.db);
```

## 注意

- 没有 UI，也没有 GET 版本，只能用 POST。
- `env.KEY` 同时用于聊天室超管，轮换时会影响两处。
- `app_kv_store` 是 D1 模拟的 KV，见 `src/shared/README.md`。
