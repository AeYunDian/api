# OAuth 服务文档更新摘要

> 基于 `online.undz.cn` GitHub 提交版本：6bfb3697a24be14c7bc9e0c3830d5a40c8af02fd，对比旧版 OAuth 文档，列出所有 **新增、变更和弃用** 内容。  
> **新增重要变更**：所有返回用户标识的字段统一从 `id` 改为 `sub`（遵循 OpenID Connect 标准）。

---

## 1. 新增端点

### `GET /api/oauth/userinfo`（标准 OIDC 用户信息端点）

- **用途**：获取已授权用户的完整信息，根据 `scope` 返回不同字段。
- **替代**：旧的 `/user/profile` 和 `/user/email` 端点（现标记为弃用）。
- **请求**：`Authorization: Bearer <access_token>`
- **响应示例**：
  ```json
  {
    "sub": 12345,
    "username": "alice",
    "gender": "female",
    "avatar": "https://online.undz.cn/default-avatar.svg",
    "description": "这片星空，只有流行划过……",
    "email": "alice@example.com"
  }
  ```
- **字段说明**：
  - 必须包含 `openid` scope，否则返回 `insufficient_scope`。
  - 仅当 `profile` scope 时返回 `username`、`gender`、`avatar`、`description`。
  - 仅当 `email` scope 时返回 `email`。
- **错误**：`401`（无效令牌）、`403`（scope 不足）。

---

## 2. 弃用端点（仍可用，但将在 **2026-10-01** 移除）

- `GET /api/oauth/user/profile` → 迁移至 `/userinfo`
- `GET /api/oauth/user/email` → 迁移至 `/userinfo`

> 这两个端点目前仍正常工作，但响应中会包含弃用警告消息，建议尽快切换。

---

## 3. 响应字段变更（重要）

### 3.1 用户标识字段统一改为 `sub`

- **所有涉及用户标识的返回字段**，从旧版的 `id` **统一变更为 `sub`**。
- 影响范围：
  - **令牌交换**（`/api/oauth/token`）成功响应中的 `user` 对象：`id` → `sub`
  - **用户信息端点**（`/api/oauth/userinfo`）中的主键：`sub`（此前可能无此字段）
  - **验证端点**（`/api/oauth/verify`）中的用户信息：`id` → `sub`
  - **已弃用的 `/user/profile`** 端点：`id` → `sub`（目前仍返回 `id` 并带警告，但最终会统一）
- 此变更使服务更符合 OpenID Connect 规范，请客户端适配。

### 3.2 令牌交换响应中的 `user` 字段现在基于 scope 返回

- **新增**：`user` 对象现在**完全基于请求的 scope** 返回：
  - 仅当 `profile` 或 `openid` 时包含 `username`。
  - 仅当 `email` 时包含 `email`。
- **未变更**：`access_token`、`refresh_token`、`expires_in`、`scope` 依旧返回。

### 3.3 错误响应增强

- 当用户被封禁时（`access_denied`），新增 **`ban_reason`** 字段，提供具体封禁原因。
- 示例：
  ```json
  {
    "error": "access_denied",
    "error_description": "User account is banned. Reason: 违反社区规则。",
    "ban_reason": "违反社区规则"
  }
  ```

---

## 4. 授权端点（`/api/oauth/authorize`）行为微调

- **新增重定向页**：当账号被封禁时，会重定向至 `/oauth2/account_banned`（而非旧版的错误回调），页面会显示封禁原因。
- **未登录且被封禁**：会清除现有 Cookie 并重定向至登录页，确保用户无法继续使用。

> 这些属于 UI 流程变更，不影响 API 调用方（调用方仍收到重定向）。

---

## 5. 其他变化

- **授权确认（Consent）流程**：未变动，依旧使用 `/consent-data`、`/consent/approve`、`/consent/deny`。
- **撤销端点（`/revoke`）**：行为不变，但内部支持 `token_type_hint` 更完善（若提示 `access_token` 直接返回成功）。
- **验证端点（`/verify`）**：现返回 `user` 对象包含 `scope` 和 `client_id`，便于客户端调试。

---

## 6. 安全与兼容性

- **scope 必须包含 `openid`**：所有资源请求（包括 `/userinfo`）现在强制要求 `openid` scope，否则返回 `insufficient_scope`。
- **旧客户端**：若之前未请求 `openid`，需调整授权请求的 `scope` 参数。
- **`id`→`sub` 迁移**：请客户端全面检查并更新对用户标识字段的引用。

---

## 7. 文档建议

- 新接入应用**优先使用 `/userinfo`** 获取用户信息，避免使用已弃用端点。
- 所有应用应检查 `ban_reason` 字段，并在用户被封禁时给予适当提示。
- **立即更新**所有解析用户ID的代码，从 `id` 改为 `sub`，以免兼容性问题。

---
