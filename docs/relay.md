# relay —— relay.undz.cn（WebSocket 中继）

单域名 WebSocket 中继，协议 PSP 1.0：peer 在线登记 / 发现 / 点对点消息转发 / 离线队列。

- 入口：`api-worker/src/services/relay/wsRelay.js`
- 代码目录：`api-worker/src/services/relay/`
- 域名：`relay.undz.cn`

## 端点

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/ws` | WebSocket 升级，协议 PSP 1.0 |
| GET | `/health` | 返回版本、在线 peer 数、network 数 |

非 WebSocket 访问 `/ws` 返回 426。

## 信封

```json
{
  "psp_version": "1.0",
  "type": "announce",
  "network": "demo",
  "from": "peer-a",
  "to": "peer-b",
  "session_id": "s-1",
  "message_id": "uuid",
  "timestamp": 1730000000000,
  "ttl_ms": 30000,
  "body": {}
}
```

`from` / `network` / `session_id` 只允许 `[a-zA-Z0-9_.:-]`，最长 128。

## 消息类型

| 分组 | 类型 |
|---|---|
| 发现 | `announce`、`withdraw`、`discover`、`peer_list`、`redirect` |
| 协商 | `connect_request`、`connect_accept`、`connect_reject`、`offer`、`answer`、`ice_candidate`、`ice_end`、`renegotiate` |
| 控制 | `ping`、`pong`、`bye`、`error`、`ack` |
| 扩展 | `ext` |

## 行为

- `announce`：登记 peer（D1 `psp_announcements`），并向同 network 广播 `peer_list`。
- `discover`：返回同 network 内其他在线 peer。
- `ping` / `pong`：心跳，并顺带投递离线队列。
- 点对点类型：在线直投；对方离线或发送失败则写入 `psp_relay` 离线队列。
- `withdraw` / `bye`：清除登记并广播。
- 消息上限 64 KB，TTL 默认 30 秒、最大 120 秒，批量上限 50。
- 每 60 秒最多触发一次过期清理；`wrangler.toml` 的 cron `*/30` 也会调用
  `cleanExpiredPsp`。

## 数据表

| 表 | 说明 |
|---|---|
| `psp_announcements` | 在线登记：`network` + `peer_id` 主键、`expires_at_ms` |
| `psp_relay` | 离线队列：`to_peer_id`、`message_json`、`expires_at_ms` |

建表在 `initPspTables`，由 `kv.undz.cn/initdb` 或 `account/init` 触发。

## 重要限制

- **在线状态存在模块级 `Map` 里**：每个 isolate 各一份，跨 isolate 不可见，
  扩容或回收后状态会丢。当前实现只适合演示/轻量场景。
- 没有鉴权：`network` 和 `peer_id` 由客户端自报，任何人可加入任意 network。
- 离线队列按 TTL 过期，不保证可达性。
- 需要可靠的 IM 实时通道时，应使用 Durable Objects（见 [chat-v2.md](chat-v2.md)）。
