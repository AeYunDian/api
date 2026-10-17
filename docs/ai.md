# ai —— ai.undz.cn / yzh.ai.undz.cn（Workers AI 代理）

两个独立的 AI 入口，都跑在 Workers AI 上，但鉴权和协议不同。

- 入口：`api-worker/src/services/ai/ai.js`、`api-worker/src/services/ai/yzh.ai.js`
- 代码目录：`api-worker/src/services/ai/`
- 绑定：`env.AI`
- 模型：`@cf/qwen/qwen3-30b-a3b-fp8`

## ai.undz.cn

面向本站前端，走 AY 登录态。

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/api/chat` | 非流式对话 |
| POST | `/api/chat-stream` | 流式对话（等价于 body `stream: true`） |
| GET | `/health` | 健康检查，返回当前模型 |
| OPTIONS | 任意 | CORS 预检 |

鉴权：优先 `Authorization: Bearer <access_token>`，否则读 `.undz.cn` Cookie；统一走
`verifyBearerToken` / `checkAuth`，封禁返回 403 + `ban_reason`。

请求体：

```json
{
  "messages": [
    { "role": "user", "content": "你好" }
  ],
  "stream": false
}
```

限制：

| 项 | 值 |
|---|---|
| 消息条数 | 最多 50 |
| 单条长度 | 最多 6,000 字符 |
| 总长度 | 最多 24,000 字符 |
| 输出 token | 1,024 |
| temperature | 0.7 |

- 服务端固定注入系统提示词，客户端传入的 `system` 会被过滤。
- 流式响应直接透传上游 body，带 `Cache-Control: no-cache`。
- Workers AI 免费额度耗尽时返回 `429`，文案提示明天再试。

CORS 白名单：`ai.undz.cn`、`console.undz.cn`、`online.undz.cn`、`undz.cn` 及对应 `-dev`。

## yzh.ai.undz.cn

OpenAI 兼容接口，给本地客户端 / 第三方使用。

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/v1/chat/completions` | 兼容 OpenAI 的对话接口，支持 `stream` |
| OPTIONS | 任意 | CORS 预检 |

- 鉴权：`Authorization: Bearer <env.YZH_AI_API_KEY>`，不正确返回 401。
- 只接受 POST；路径必须以 `/chat/completions` 结尾，否则 404。
- 系统提示词内置一套「工具调用协议」：要求模型只输出
  `{ "action": "execute_command", "command": "...", "explanation": "..." }` 的 JSON 代码块。
- 上下文按 14,000 字符预算从最新消息往前截断。
- `stream: true` 时输出 OpenAI 风格的 SSE（`chatcmpl-*`）。

## 环境变量

| 变量 | 用途 |
|---|---|
| `YZH_AI_API_KEY` | yzh.ai 入口的 Bearer 校验 |
| `DEBUG` | 打印上游错误 |

## 注意

- 两个入口共用同一个 Workers AI 配额，免费额度按 neurons 计算。
- `ai.undz.cn` 的 CORS 是白名单；`yzh.ai.undz.cn` 是 `*`（靠 Bearer 鉴权）。
- `yzh.ai` 的系统提示词明确要求「只输出 JSON、不解释」，修改前先确认客户端解析逻辑。
