# 注册邮箱验证改造方案（已按反馈更新）

> 状态：后端已实现；前端 SDK 3.2.0 已接入 start/query 与传统/反向两个验证页。
> 旧 SDK（< 3.0）仍走旧逻辑；新 SDK 最终注册使用 `verifySessionId`。
> 涉及：`online.undz.cn` 注册、`send.undz.cn` 旧发信服务、`shared/email-reverse-verify.js`、新版 SDK。

## 1. 旧发信服务

`api-worker/src/legacy/mail-api/index.js`，部署在 `send.undz.cn`。

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/health` | 正常返回 `{ "status": "alive" }` |
| POST | `/send` | `Authorization: Bearer <MAIL_API_KEY>`，body `{to, subject, body, html}` |
| GET | `/config` | 限流配置，需要 `?key=<MAIL_API_KEY>` |

限流：同一邮箱 30 秒 1 封；同一 IP 60 秒 5 封。`/send` 可能 429/500/网络失败，必须允许降级。

## 2. 页面设计

注册从 1 页变为 **3 个 page**，其中第 2、3 页是二选一，不是顺序执行：

1. **账号信息页**：用户名、邮箱、密码、确认密码、协议。
   - 不再显示验证码输入框和“获取验证码”按钮。
2. **传统邮件验证页**（服务端选择 `method = "email"` 时进入）：
   - 只有一个 6 位验证码输入框。
   - 输入框旁边的按钮禁用，只显示倒计时（例如 `60s`）。
   - 发送验证码由服务端在进入本页前自动完成，**按钮不绑定点击事件**。
   - 倒计时结束后自动恢复为可用状态？不需要，发送也不是用户手动触发；如要重发，应重新从注册流程进入或由服务端控制。
3. **反向邮件验证页**（`method = "reverse"` 时进入）：
   - 显示收件地址 `onecode+xxx@services.undz.cn`、验证码、mailto 链接。
   - 提示用户用注册邮箱发送正文为验证码的邮件。
   - 每 3 秒轮询，另有手动刷新；不提供“发送验证码”按钮。
   - 验证通过后提交注册。

## 3. 服务端选择方式

`POST /api/ayonline/register/verification/start`

1. **先做极验人机验证**：body 必须带 `gt`，服务端校验通过后才允许发信/创建任务。
   - 正反两种验证都一样，不能只靠最终注册时的 `gt`。
2. 检查旧发信服务：
   - `GET http://send.undz.cn/health`，超时约 1.2 秒。
   - 200 且 `status === "alive"` 视为可用。
   - 结果用 `createKvStore(env.db)` 写入 `app_kv_store`，key 例如 `mail:health:send`，**缓存 10 分钟**，`expirationTtl: 600`。
3. 选择方式：
   - 服务不可用 → 反向验证。
   - 服务可用，但本次请求独立随机命中 **1/7** → 反向验证。
   - 否则 → 传统邮件 `/send`。
4. `/send` 失败（429/500/网络）也降级为反向验证。
5. 1/7 用 `crypto.getRandomValues` 在服务端判定；每个请求独立随机，不按邮箱/用户固定。

返回：

```json
{ "method": "email", "verifySessionId": "xxx", "token": "xxx", "email": "user@example.com", "expiresAt": 1790000000, "retryAfter": 60 }
```

```json
{ "method": "reverse", "verifySessionId": "xxx", "requestId": "xxx", "email": "onecode+abc@services.undz.cn", "code": "123456", "expiresAt": 1790000000 }
```

`verifySessionId` 存在 D1 模拟 KV：`register:verify:<id>`，TTL 10 分钟，绑定 email + method + 验证凭证。

## 4. 反向验证轮询

新增：

`POST /api/ayonline/register/verification/query`

body：`{ requestId, email }`

- 复用 `verifyReverseCode(env, requestId, "register")`。
- 返回 `{ valid, error }`。
- 前端每 3 秒轮询，并可手动刷新。
- 最终注册时再次校验并消费 ticket，不能只信前端。

## 5. 最终注册

保留 `POST /api/ayonline/register`，按版本和 method 分流：

| 客户端 | 提交字段 | 服务端行为 |
|---|---|---|
| 旧 SDK（< 3.0） | `emailToken + emailCode + gt` | 旧逻辑 |
| 新 SDK + 传统邮件 | `verifySessionId + emailToken + emailCode` | 用 session 校验 method，再校验 KV |
| 新 SDK + 反向邮件 | `verifySessionId` | 用 session 里的 requestId 校验反向 ticket，消费后注册 |

新 SDK 最终注册不再要求第二次 `gt`：极验已在 `verification/start` 完成，`verifySessionId` 就是那次极验通过的凭证。服务端必须校验 session 的 email/method 与提交内容一致。

## 6. 版本兼容与 2027 截止（北京时间）

请求头优先读 `X-App-Ver`，兼容 `X-SDK-VER`。

- `< 3.0.0`：旧 SDK，继续旧逻辑。
- `>= 3.0.0`：新 SDK，走新流程。
- 没传版本头：按旧 SDK 处理。

截止时间按 **北京时间（Asia/Shanghai）** 计算：

```js
// 2027-01-01 00:00:00 Asia/Shanghai = 2026-12-31T16:00:00Z
const CUTOFF = Date.UTC(2026, 11, 31, 16, 0, 0);
if (Date.now() >= CUTOFF) {
  // 旧 SDK / 旧接口统一返回 1040 SDK 版本过低
}
```

到 2027 年后：

- 旧 SDK 注册直接返回 `error_code: 1040`。
- **旧的 `/api/ayonline/send-verification` 接口也停止服务**，返回 1040。
- 新 SDK 新流程不受影响。

## 7. 新增接口

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/api/ayonline/register/verification/start` | 极验 → 检查发信服务 → 发信或创建反向任务 |
| POST | `/api/ayonline/register/verification/query` | 反向验证轮询 |
| POST | `/api/ayonline/register` | 保留路径，内部按版本 + method 分流 |

建议新增错误码（1044 起）：

- `REGISTER_VERIFY_EMAIL_UNAVAILABLE`
- `REGISTER_VERIFY_METHOD_MISMATCH`
- `REGISTER_VERIFY_EXPIRED`
- `REGISTER_VERIFY_REQUIRED`

## 8. 数据与清理

- 传统邮件继续用现有 KV token。
- 反向验证用 `reverse_verify_tickets`，`action = "register"`，`target_email = 注册邮箱`。
- 注册成功：消费 ticket / 删除 KV token。
- 注册失败：保留到 TTL 到期，允许重试。
- 定时任务继续清理过期 ticket。

## 9. 已确认事项

1. 2027 截止按北京时间。
2. 2 个新 page 是两种验证方式二选一：
   - 传统邮件：验证码输入框 + 禁用倒计时按钮，发送自动完成。
   - 反向邮件：地址/验证码/mailto + 轮询。
3. 1/7 每个请求独立随机。
4. Worker 允许直接访问 `send.undz.cn/health`。
5. 新接口使用 `/api/ayonline/register/verification/*` 命名。
6. 发送验证码 / 创建反向任务都必须先过极验人机验证。
7. 健康状态缓存用 `createKvStore(env.db)`，10 分钟。
