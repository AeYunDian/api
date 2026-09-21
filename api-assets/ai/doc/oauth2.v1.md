# OAuth2 服务文档 (online.undz.cn)

本文档描述基于 `online.undz.cn` 实现的 OAuth2 授权服务，符合 [RFC 6749](https://datatracker.ietf.org/doc/html/rfc6749)。  
服务支持 **授权码模式**（`authorization_code`）和 **刷新令牌模式**（`refresh_token`），并提供用户信息、邮件信息、令牌撤销等扩展端点。

所有 API 端点均支持跨域（CORS），并接受 `application/json` 或 `application/x-www-form-urlencoded` 请求（根据端点而定）。

---

## 1. 授权端点 (Authorization Endpoint)

### `GET /api/oauth/authorize`

启动 OAuth2 授权流程，用于获取用户授权并返回授权码（`code`）。

#### 请求参数 (Query String)

| 参数名          | 类型   | 必填 | 说明                                                                                          |
| --------------- | ------ | ---- | --------------------------------------------------------------------------------------------- |
| `client_id`     | string | ✅   | 客户端应用唯一标识（如 `app_chat`）                                                           |
| `redirect_uri`  | string | ✅   | 回调地址，需与客户端注册时一致                                                                |
| `response_type` | string | ✅   | 固定值 `code`                                                                                 |
| `state`         | string | ❌   | 可选，用于防 CSRF，原样返回                                                                   |
| `scope`         | string | ❌   | 请求的权限范围（空格分隔），如 `profile email`。默认为 `openid profile email`，但需客户端支持 |

#### 处理流程

1. 验证 `client_id` 和 `redirect_uri` 是否匹配注册信息。
2. 检查当前用户是否已登录（通过 Cookie 中的 `access_token`）。
3. 若未登录，重定向至登录页面 `/oauth2/login`，登录成功后返回本授权页。
4. 若用户已登录但被禁止，清除 Cookie 并重定向至登录页。
5. 若用户已登录且授权通过：
   - 如果客户端是受信任的（`trusted=1`），直接生成授权码并重定向至 `redirect_uri?code=xxx&state=xxx`。
   - 否则，创建一条授权请求记录并重定向至 `/oauth2/consent` 让用户手动确认。
6. 若用户拒绝授权，返回错误到 `redirect_uri`（通过 `error=access_denied` 参数）。

#### 可能返回

- **302 Found** – 重定向到 `redirect_uri` 携带 `code` 和 `state`（成功）。
- **302 Found** – 重定向到错误页面（如 `/oauth2/invalid_client`）或 `redirect_uri` 携带错误参数。
- **302 Found** – 重定向到登录页面 `/oauth2/login`（未登录或 token 失效）。

> **注意**：此端点不直接返回 JSON，而是通过 HTTP 重定向完成流程。

---

## 2. 令牌端点 (Token Endpoint)

### `POST /api/oauth/token`

用于交换授权码为访问令牌，或刷新访问令牌。

#### 请求方式

支持 `application/json` 或 `application/x-www-form-urlencoded`。  
推荐使用 `application/x-www-form-urlencoded`（标准 OAuth2）。

#### 2.1 授权码模式 (grant_type=authorization_code)

**请求参数** (Body)

| 参数名          | 类型   | 必填 | 说明                         |
| --------------- | ------ | ---- | ---------------------------- |
| `grant_type`    | string | ✅   | 固定值 `authorization_code`  |
| `code`          | string | ✅   | 从授权端点获取的授权码       |
| `redirect_uri`  | string | ✅   | 必须与获取授权码时使用的相同 |
| `client_id`     | string | ✅   | 应用 ID                      |
| `client_secret` | string | ✅   | 应用密钥                     |
| `state`         | string | ❌   | 可选，用于验证               |

**响应 (成功)**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 900,
  "refresh_token": "a1b2c3d4e5f6...",
  "scope": "profile email",
  "user": {
    "id": 1,
    "username": "alice",
    "email": "alice@example.com"
  }
}
```

| 字段            | 说明                                      |
| --------------- | ----------------------------------------- |
| `access_token`  | JWT 访问令牌，有效期 15 分钟              |
| `token_type`    | 固定 `Bearer`                             |
| `expires_in`    | 过期秒数（900）                           |
| `refresh_token` | 用于刷新访问令牌，有效期 15 天            |
| `scope`         | 实际授权的权限范围                        |
| `user`          | 用户基本信息（仅包含被授权 scope 的字段） |

**可能返回 (错误)**

- `400 Bad Request` – 缺少参数或 grant_type 不支持。
- `401 Unauthorized` – `client_id` 或 `client_secret` 无效。
- `403 Forbidden` – 用户账号已被封禁，响应包含 `ban_reason`。
- `400 Bad Request` – 授权码无效或已过期。
- `400 Bad Request` – `redirect_uri` 不匹配。

**错误响应示例**

```json
{
  "error": "invalid_grant",
  "error_description": "Invalid or expired authorization code"
}
```

```json
{
  "error": "access_denied",
  "error_description": "User account is banned. Reason: ...",
  "ban_reason": "违反社区规定"
}
```

---

#### 2.2 刷新令牌模式 (grant_type=refresh_token)

**请求参数** (Body)

| 参数名          | 类型   | 必填 | 说明                   |
| --------------- | ------ | ---- | ---------------------- |
| `grant_type`    | string | ✅   | 固定值 `refresh_token` |
| `refresh_token` | string | ✅   | 之前获得的刷新令牌     |
| `client_id`     | string | ✅   | 应用 ID                |
| `client_secret` | string | ✅   | 应用密钥               |

**响应 (成功)**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 900,
  "scope": "profile email"
}
```

> 注意：刷新后不返回新的 `refresh_token`（除非服务端另有设计，当前实现不返回新刷新令牌）。

**可能返回**

- `200 OK` – 成功返回新访问令牌。
- `400 Bad Request` – 缺少参数或 grant_type 错误。
- `401 Unauthorized` – 客户端凭据无效。
- `403 Forbidden` – 用户被封禁。
- `400 Bad Request` – 刷新令牌无效或已过期。

---

## 3. 资源端点 (Resource Endpoints)

### `GET /api/oauth/user/profile`

获取已授权用户的公开资料（需包含 `profile` 或 `openid` scope）。

#### 请求头

`Authorization: Bearer <access_token>`

#### 响应 (成功)

```json
{
  "id": 1,
  "username": "alice"
}
```

#### 可能返回

- `200 OK` – 成功返回用户 ID 和用户名。
- `401 Unauthorized` – 缺少或无效的 Token。
- `403 Forbidden` – Token 有效但 scope 不包含 `profile` 或 `openid`。

---

### `GET /api/oauth/user/email`

获取已授权用户的邮箱（需包含 `email` scope）。

#### 请求头

`Authorization: Bearer <access_token>`

#### 响应 (成功)

```json
{
  "email": "alice@example.com"
}
```

#### 可能返回

- `200 OK` – 成功返回邮箱。
- `401 Unauthorized` – 缺少或无效的 Token。
- `403 Forbidden` – Token 有效但 scope 不包含 `email`。

---

## 4. 授权确认 (Consent) 端点

这些端点用于非信任客户端的用户授权确认流程。

### `GET /api/oauth/consent-data`

获取待确认的授权请求详情（用于渲染确认页面）。

#### 请求参数 (Query)

| 参数名       | 类型   | 必填 | 说明                          |
| ------------ | ------ | ---- | ----------------------------- |
| `request_id` | string | ✅   | 从授权端点重定向获得的请求 ID |

#### 请求头

需携带 Cookie 中的 `access_token`（用户必须已登录）。

#### 响应 (成功)

```json
{
  "client_name": "聊天助手",
  "scope": "profile email",
  "consent_token": "abc123...",
  "client_id": "app_chat",
  "redirect_uri": "https://chat.undz.cn/oauth/callback",
  "state": "xyz"
}
```

| 字段            | 说明                     |
| --------------- | ------------------------ |
| `client_name`   | 应用名称（来自注册信息） |
| `scope`         | 请求的权限范围           |
| `consent_token` | 用于提交确认的唯一令牌   |
| `client_id`     | 应用 ID                  |
| `redirect_uri`  | 回调地址                 |
| `state`         | 原始 state 参数（若有）  |

#### 可能返回

- `200 OK` – 成功返回数据。
- `400 Bad Request` – 缺少 `request_id` 或请求无效。
- `401 Unauthorized` – 未登录。
- `403 Forbidden` – 当前登录用户与请求发起者不匹配。

---

### `POST /api/oauth/consent/approve`

用户同意授权。

#### 请求体 (JSON)

| 参数名          | 类型   | 必填 | 说明                         |
| --------------- | ------ | ---- | ---------------------------- |
| `request_id`    | string | ✅   | 请求 ID                      |
| `consent_token` | string | ✅   | 从 `consent-data` 获取的令牌 |

#### 请求头

需携带 Cookie 中的 `access_token`（用户必须已登录）。

#### 响应 (成功)

```json
{
  "redirect_url": "https://chat.undz.cn/oauth/callback?code=xxx&state=xyz"
}
```

服务端将生成授权码并跳转至该 URL。

#### 可能返回

- `200 OK` – 成功，返回重定向 URL。
- `400 Bad Request` – 缺少参数或请求无效。
- `401 Unauthorized` – 未登录。
- `403 Forbidden` – 用户不匹配。

---

### `POST /api/oauth/consent/deny`

用户拒绝授权。

#### 请求体 (JSON) 同上

#### 响应 (成功)

```json
{
  "redirect_url": "https://chat.undz.cn/oauth/callback?error=access_denied&state=xyz"
}
```

#### 可能返回

- `200 OK` – 成功返回重定向 URL（带错误参数）。
- 其他错误同上。

---

## 5. 令牌验证端点

### `GET /api/oauth/verify`

验证访问令牌的有效性，并返回用户信息。

#### 请求头

`Authorization: Bearer <access_token>` 或 Cookie 中的 `access_token`（优先 Bearer）。

#### 响应 (成功)

```json
{
  "valid": true,
  "user": {
    "id": 1,
    "username": "alice",
    "email": "alice@example.com",
    "client_id": "app_chat",
    "scope": "profile email"
  }
}
```

#### 可能返回

- `200 OK` – 令牌有效，返回用户信息（字段取决于 scope）。
- `401 Unauthorized` – 令牌缺失或无效。

---

## 6. 令牌撤销端点

### `POST /api/oauth/revoke`

撤销刷新令牌（依据 RFC 7009）。

#### 请求方式

支持 `application/json` 或 `application/x-www-form-urlencoded`。

#### 请求参数

| 参数名            | 类型   | 必填 | 说明                                                           |
| ----------------- | ------ | ---- | -------------------------------------------------------------- |
| `token`           | string | ✅   | 要撤销的刷新令牌                                               |
| `token_type_hint` | string | ❌   | 可指定 `refresh_token` 或 `access_token`，默认 `refresh_token` |
| `client_id`       | string | ✅   | 应用 ID                                                        |
| `client_secret`   | string | ✅   | 应用密钥                                                       |

#### 响应 (成功)

```json
{}
```

状态码 `200 OK`。

#### 可能返回

- `200 OK` – 撤销成功（即使 token 不存在也视为成功）。
- `401 Unauthorized` – 客户端凭据无效。
- `400 Bad Request` – 缺少参数。

---

## 7. 辅助 HTML 页面

除了 API，服务还提供以下用户交互页面（均为 GET 请求，返回 HTML）：

- `/oauth2/login` – 用户登录页面，会显示应用名称和 scope。
- `/oauth2/consent` – 授权确认页面（仅对非信任客户端）。
- `/oauth2/invalid_client` – 客户端无效错误页。
- `/oauth2/invalid_request` – 请求参数错误页。
- `/oauth2/invalid_redirect_uri` – 回调地址不匹配错误页。

这些页面在授权流程中自动重定向，一般无需直接调用。

---

## 8. 错误码汇总

OAuth2 标准错误码及本服务扩展：

| 错误码                   | HTTP 状态 | 描述                       |
| ------------------------ | --------- | -------------------------- |
| `invalid_request`        | 400       | 缺少必要参数或参数格式错误 |
| `invalid_client`         | 401       | 客户端凭据错误             |
| `invalid_grant`          | 400       | 授权码或刷新令牌无效/过期  |
| `unauthorized_client`    | 400       | 客户端无权使用该授权模式   |
| `unsupported_grant_type` | 400       | 不支持的 grant_type        |
| `access_denied`          | 403       | 用户拒绝授权或账号被封禁   |
| `insufficient_scope`     | 403       | 令牌 scope 不足            |
| `server_error`           | 500       | 服务器内部错误             |

> 当返回 `access_denied` 且原因为封禁时，响应体将额外包含 `ban_reason` 字段。

---

## 9. 完整授权流程示例

### 步骤 1：发起授权

浏览器访问：

```
https://online.undz.cn/api/oauth/authorize?client_id=app_chat&redirect_uri=https://chat.undz.cn/oauth/callback&response_type=code&state=abc123
```

### 步骤 2：用户登录（若未登录）

自动跳转至 `/oauth2/login`，登录后返回步骤 1。

### 步骤 3：用户确认（若客户端非信任）

跳转至 `/oauth2/consent`，用户点击“同意”后调用 `/api/oauth/consent/approve`。

### 步骤 4：获取授权码

最终重定向到 `redirect_uri?code=xxxx&state=abc123`。

### 步骤 5：交换令牌

客户端后端发起：

```http
POST /api/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=xxxx
&redirect_uri=https://chat.undz.cn/oauth/callback
&client_id=app_chat
&client_secret=...
```

获得 `access_token` 和 `refresh_token`。

### 步骤 6：使用访问令牌请求资源

```http
GET /api/oauth/user/profile
Authorization: Bearer eyJhbGciOi...
```

### 步骤 7：刷新令牌

当 access_token 过期：

```http
POST /api/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token
&refresh_token=...
&client_id=app_chat
&client_secret=...
```

获得新的 `access_token`。

---

## 10. 安全注意事项

- **始终使用 HTTPS**（生产环境强制）。
- **client_secret** 必须妥善保管，绝不能在前端暴露。
- **state** 参数用于防止 CSRF，客户端必须验证其与发起请求时一致。
- 访问令牌有效期短（15 分钟），刷新令牌应安全存储。
- 用户可随时通过 `/api/oauth/revoke` 撤销令牌。
- 服务端会定期清理过期的授权码和 consent 请求。

---

本 OAuth2 服务完整支持标准流程，并提供了丰富的用户管理功能接口，可安全集成到任意 Web 或移动应用中。
