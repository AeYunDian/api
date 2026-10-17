# 子服务文档

**约定：一个子服务一个文档，统一放在 `docs/<service>.md`。**
代码在 `api-worker/src/services/<service>/`，这里是唯一需要维护的说明。

## 文档索引

| 子服务 | 域名 | 代码入口 | 文档 |
|---|---|---|---|
| 账号中心 | `online.undz.cn` | `services/account/ayOnline.js` | [account.md](account.md) |
| 管理后台 | `console.undz.cn` | `services/console/ayConsole.js` | [console.md](console.md) |
| 短链接 | `go.undz.cn` | `services/console/shortlink.js` | [shortlink.md](shortlink.md) |
| 站点统计 | `mysites.undz.cn` | `services/analytics/ayAnalytics.js` | [analytics.md](analytics.md) |
| 文件分发 | `files.undz.cn` | `services/files/ayFiles.js` | [files.md](files.md) |
| WebSocket 中继 | `relay.undz.cn` | `services/relay/wsRelay.js` | [relay.md](relay.md) |
| AI 代理 | `ai.undz.cn` / `yzh.ai.undz.cn` | `services/ai/*` | [ai.md](ai.md) |
| 通用网关 | `api.undz.cn` / `api.io.hb.cn` | `services/gateway/uniAPI.js` | [gateway.md](gateway.md) |
| 聊天室（旧） | `chat.undz.cn` / `c.undz.cn` | `services/chat/ayChatRoom.js` | [chat.md](chat.md) |
| CDN 代理 | `cdn.undz.cn` | `services/cdn/jsdelivrCDN.js` | [cdn.md](cdn.md) |
| 图床反代 | `i0/i1/i2.undz.cn` | `services/image/*` | [image.md](image.md) |
| KV 运维 | `kv.undz.cn` | `src/index.js` 内联 | [kv.md](kv.md) |

## 非子服务文档

| 文档 | 内容 |
|---|---|
| [chat-v2.md](chat-v2.md) | 新版聊天服务设计稿（**未实施**，仅备案） |
| [MD3-改造说明.md](MD3-改造说明.md) | 前端 Material Design 3 改造记录 |

## 跨服务共享

`api-worker/src/shared/`（错误码、D1 模拟 KV、通用工具）不属于任何子服务，
说明见 [api-worker/src/shared/README.md](../api-worker/src/shared/README.md)。

## 新增子服务的流程

1. 在 `api-worker/src/services/<name>/` 建目录，默认导出 `{ fetch(request, env, ctx) }`。
2. 在 `api-worker/src/index.js` 的 hostname 分支里加一行。
3. 在 `docs/` 建 `<name>.md`，并在本文件索引表加一行。
4. 服务目录里只留一个指向本文档的短 README。
