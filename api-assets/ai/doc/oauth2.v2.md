# AyOAuth2Center - OAuth 2.0 应用接入文档

> GitHub 提交版本：6bfb3697a24be14c7bc9e0c3830d5a40c8af02fd
> 生效日期：2026-08-26  
> 服务端：`online.undz.cn`  
> 本档涵盖所有公开的 OAuth 2.0 接口（`/api/oauth/*`）

---

## 1. 概述

AyOAuth2Center 提供标准 OAuth 2.0 授权服务，支持授权码流程（`authorization_code`）和刷新令牌流程（`refresh_token`）。  
所有接口均通过 HTTPS 提供，响应格式为 JSON。认证方式遵循 [RFC 6749](https://tools.ietf.org/html/rfc6749) 规范，并扩展了部分字段（如 `ban_reason`）。

### 1.1 基础信息

- **授权端点**：`https://online.undz.cn/api/oauth/authorize`
- **令牌端点**：`https://online.undz.cn/api/oauth/token`
- **用户信息端点**：`https://online.undz.cn/api/oauth/userinfo`
- **验证端点**：`https://online.undz.cn/api/oauth/verify`
- **撤销端点**：`https://online.undz.cn/api/oauth/revoke`

### 1.2 支持的 OAuth 标准

- **Grant Types**：`authorization_code`、`refresh_token`
- **Response Types**：`code`
- **Token Type**：`Bearer`
- **Scope**：空格分隔的权限列表，默认 `openid profile email`。目前支持的范围：
  - `openid`：必须包含，表示使用 OpenID Connect 基础声明。
  - `profile`：返回用户昵称、头像、性别、简介等。
  - `email`：返回用户的邮箱地址。

- **客户端认证**：使用 `client_id` + `client_secret`（在令牌端点、撤销端点通过 POST 表单或 JSON 传递）。

### 1.3 安全注意事项

- 所有请求必须使用 HTTPS。
- 授权码有效期为 **5 分钟**（`OAUTH_TOKEN_EXPIRES_IN = 300` 秒），一次性使用。
- 访问令牌（`access_token`）有效期为 **10 分钟**（`ACCESS_TOKEN_EXPIRES_IN = "10m"`）。
- 刷新令牌（`refresh_token`）有效期为 **15 天**（`OAUTH_REFRESH_TOKEN_TTL`），可重复使用。
- 客户端应妥善保管 `client_secret`，避免泄露。
- 对于公开客户端（无法安全保管 secret），建议使用 PKCE 扩展（本服务支持，但需另外开启，本文档暂未启用，但可与服务提供商协商）。

---

## 2. OAuth 2.0 授权码流程

### 2.1 步骤概览

1. **客户端发起授权请求**（重定向用户至授权端点）。
2. **用户登录并授权**（若已登录且客户端受信任，则自动跳转；否则显示确认页）。
3. **授权端点返回授权码**（重定向至客户端回调地址）。
4. **客户端使用授权码交换访问令牌**（调用令牌端点）。
5. **客户端使用访问令牌获取用户信息**（调用用户信息端点）。
6. **令牌刷新**（可选，使用刷新令牌获取新的访问令牌）。
7. **令牌撤销**（可选，撤销刷新令牌）。

### 2.2 授权请求（步骤 1）

**端点**：`GET /api/oauth/authorize`

**请求参数（Query String）**：

| 参数            | 类型   | 必填 | 描述                                                                                                                           |
| --------------- | ------ | ---- | ------------------------------------------------------------------------------------------------------------------------------ |
| `client_id`     | string | ✅   | 应用注册时获得的客户端 ID。                                                                                                    |
| `redirect_uri`  | string | ✅   | 应用注册时设置的回调地址之一，必须完全匹配。                                                                                   |
| `response_type` | string | ✅   | 固定值 `code`。                                                                                                                |
| `scope`         | string | ❌   | 请求的权限范围，空格分隔。若未提供，服务端使用默认范围（`openid profile email`）。实际返回的范围受客户端注册范围限制（交集）。 |
| `state`         | string | ❌   | 不透明的随机字符串，用于防止 CSRF，会在重定向时原样返回，建议提供。                                                            |

**成功响应**：  
HTTP 302 重定向至 `redirect_uri`，附加查询参数：

- `code`：授权码（一次性，有效期 5 分钟）。
- `state`：原样返回（若请求中包含）。

**错误响应**：  
重定向至 `redirect_uri` 或服务端错误页面（如 `invalid_request`、`invalid_client`），通常携带 `error` 和 `error_description` 参数（或直接跳转至用户友好的错误页 `/oauth2/*`）。

**示例**：

```
GET https://online.undz.cn/api/oauth/authorize?
    client_id=app_chat&
    redirect_uri=https://chat.undz.cn/oauth/callback&
    response_type=code&
    scope=openid%20profile&
    state=xyz789
```

### 2.3 用户授权确认（仅未信任客户端）

若客户端 `trusted=0`（默认），用户登录后会先看到授权确认页面。  
客户端无需处理该步骤，服务端自动处理。

### 2.4 令牌交换（步骤 3）

**端点**：`POST /api/oauth/token`

**请求**：支持 `application/json` 或 `application/x-www-form-urlencoded`。建议使用表单格式，便于兼容 OAuth 标准。

**请求参数**（表单或 JSON）：

| 参数            | 类型   | 必填     | 描述                                                                |
| --------------- | ------ | -------- | ------------------------------------------------------------------- |
| `grant_type`    | string | ✅       | `authorization_code` 或 `refresh_token`。                           |
| `client_id`     | string | ✅       | 应用 ID。                                                           |
| `client_secret` | string | ✅       | 应用密钥。                                                          |
| `code`          | string | 条件必填 | 当 `grant_type=authorization_code` 时必填。                         |
| `redirect_uri`  | string | 条件必填 | 当 `grant_type=authorization_code` 时必填，必须与授权请求中的一致。 |
| `refresh_token` | string | 条件必填 | 当 `grant_type=refresh_token` 时必填。                              |
| `state`         | string | ❌       | 若授权请求中提供了，交换时可选携带，用于验证（服务端会校验）。      |

**响应（JSON）**：

成功（HTTP 200）：

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 600,
  "refresh_token": "abc123...",
  "scope": "openid profile email",
  "user": {
    "sub": 12345,
    "username": "alice",
    "email": "alice@example.com"
  }
}
```

- `expires_in`：访问令牌的有效秒数（600 秒）。
- `user`：仅在请求了相应 scope 时返回。若 `scope` 包含 `profile` 或 `openid`，则返回 `username`；若包含 `email`，则返回 `email`。

**错误响应**（HTTP 401 / 400 / 403）：

标准 OAuth 错误格式：

```json
{
  "error": "invalid_grant",
  "error_description": "Invalid or expired authorization code"
}
```

扩展字段（当用户被封禁时）：

```json
{
  "error": "access_denied",
  "error_description": "User account is banned. Reason: 违反社区规则。 You can read ban_reason to get full message.",
  "ban_reason": "违反社区规则"
}
```

常见错误码：

- `invalid_request`：缺少必需参数。
- `invalid_client`：客户端认证失败（client_id/secret 错误）。
- `invalid_grant`：授权码或刷新令牌无效/过期。
- `access_denied`：用户被封禁。

### 2.5 获取用户信息（步骤 4）

**端点**：`GET /api/oauth/userinfo`

**认证**：在 `Authorization` 头携带 `Bearer <access_token>`。

**成功响应**（HTTP 200）：

根据 `scope` 决定返回字段。必须同时包含 `openid` + (`profile` 或 `email`) 至少一个。

示例（含 `profile` 和 `email`）：

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

- `gender`：可能为 `"male"`、`"female"`、`"unknown"`，若为 `"unknown"` 可能不会返回。
- `avatar`、`description` 在 `profile` scope 下返回。
- `email` 仅在 `email` scope 下返回。

**错误响应**：

- `401`：未提供或无效的令牌。
- `403`：scope 不足（缺少 `openid` 或 `profile/email`）。

### 2.6 验证令牌（附加）

**端点**：`GET /api/oauth/verify`

**认证**：Bearer Token。

**成功响应**（HTTP 200）：

```json
{
  "valid": true,
  "user": {
    "sub": 12345,
    "username": "alice",
    "email": "alice@example.com",
    "gender": "female",
    "avatar": "...",
    "description": "...",
    "client_id": "app_chat",
    "scope": "openid profile email"
  }
}
```

**错误响应**：

- `401`：`valid: false`，并包含 `error` 字段（`missing_token`、`invalid_token`等）。

### 2.7 刷新令牌（步骤 5）

**端点**：`POST /api/oauth/token`（使用 `grant_type=refresh_token`）

**请求参数**（表单或 JSON）：

| 参数            | 类型   | 必填 | 描述                 |
| --------------- | ------ | ---- | -------------------- |
| `grant_type`    | string | ✅   | `refresh_token`      |
| `client_id`     | string | ✅   | 应用 ID。            |
| `client_secret` | string | ✅   | 应用密钥。           |
| `refresh_token` | string | ✅   | 之前获得的刷新令牌。 |

**成功响应**：同令牌交换响应，但可能不返回 `refresh_token` 字段（服务端会返回新的，若生成），通常返回新的 `access_token` 和相同的 `refresh_token`（或新的，看实现；本服务生成新的刷新令牌并返回）。

**错误响应**：与令牌交换类似。

### 2.8 撤销令牌（步骤 6）

**端点**：`POST /api/oauth/revoke`

**请求**：支持表单或 JSON。

**参数**：

| 参数              | 类型   | 必填 | 描述                                                                                                            |
| ----------------- | ------ | ---- | --------------------------------------------------------------------------------------------------------------- |
| `token`           | string | ✅   | 要撤销的令牌（通常为刷新令牌）。                                                                                |
| `token_type_hint` | string | ❌   | 可为 `access_token` 或 `refresh_token`，本服务仅处理 `refresh_token`（若提示为 `access_token`，直接返回成功）。 |
| `client_id`       | string | ✅   | 应用 ID。                                                                                                       |
| `client_secret`   | string | ✅   | 应用密钥。                                                                                                      |

**成功响应**（HTTP 200）：

```json
{}
```

**错误响应**：

- `401`：`invalid_client`。
- `400`：其他错误。

### 2.9 已弃用的接口

以下接口计划于 **2026-10-01** 弃用，请迁移至 `/api/oauth/userinfo`：

- `GET /api/oauth/user/profile`：返回 `{ id, username, message }`。
- `GET /api/oauth/user/email`：返回 `{ email, message }`。

仍然可用，但响应会附带警告信息。

---

## 3. 错误码说明

服务端返回的 HTTP 状态码遵循 REST 惯例，错误体（JSON）中可能包含以下字段：

| 字段                | 描述                                 |
| ------------------- | ------------------------------------ |
| `error`             | 简短的错误标识，如 `invalid_grant`。 |
| `error_description` | 人类可读的错误描述。                 |
| `ban_reason`        | 当账号被封禁时提供具体封禁原因。     |

常见 `error` 值：

- `invalid_request`：请求缺少必要参数或格式错误。
- `invalid_client`：客户端认证失败（client_id/secret 错误或客户端不存在）。
- `invalid_grant`：授权码或刷新令牌无效、过期或已被使用。
- `access_denied`：用户拒绝授权或账号被封禁。
- `unsupported_grant_type`：不支持的 `grant_type`。
- `insufficient_scope`：令牌的 scope 不足以访问请求的资源。

---

## 4. 示例

### 4.1 完整授权码流程（使用 cURL 模拟）

**步骤1：发起授权请求（浏览器重定向）**

用户访问：

```
https://online.undz.cn/api/oauth/authorize?
    client_id=app_chat&
    redirect_uri=https://chat.undz.cn/oauth/callback&
    response_type=code&
    scope=openid%20profile%20email&
    state=abcd1234
```

**步骤2：用户登录并授权**（服务端完成，若客户端 trusted=1 则自动）

**步骤3：服务端重定向到** `https://chat.undz.cn/oauth/callback?code=AUTH_CODE&state=abcd1234`

**步骤4：用授权码交换令牌**

```bash
curl -X POST https://online.undz.cn/api/oauth/token \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "authorization_code",
    "client_id": "app_chat",
    "client_secret": "your_client_secret",
    "code": "AUTH_CODE",
    "redirect_uri": "https://chat.undz.cn/oauth/callback"
  }'
```

响应：

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 600,
  "refresh_token": "abc123...",
  "scope": "openid profile email",
  "user": {
    "sub": 123,
    "username": "alice",
    "email": "alice@example.com"
  }
}
```

**步骤5：获取用户信息**

```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  https://online.undz.cn/api/oauth/userinfo
```

响应：

```json
{
  "sub": 123,
  "username": "alice",
  "gender": "female",
  "avatar": "https://online.undz.cn/default-avatar.svg",
  "description": "Hi!",
  "email": "alice@example.com"
}
```

**步骤6：刷新令牌**

```bash
curl -X POST https://online.undz.cn/api/oauth/token \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "refresh_token",
    "client_id": "app_chat",
    "client_secret": "your_client_secret",
    "refresh_token": "abc123..."
  }'
```

响应返回新的 `access_token`。

**步骤7：撤销刷新令牌**

```bash
curl -X POST https://online.undz.cn/api/oauth/revoke \
  -H "Content-Type: application/json" \
  -d '{
    "token": "abc123...",
    "token_type_hint": "refresh_token",
    "client_id": "app_chat",
    "client_secret": "your_client_secret"
  }'
```

响应 `{}`。

---

## 5. 附录：Scope 权限明细

| Scope     | 包含信息                                      | 是否必须                    |
| --------- | --------------------------------------------- | --------------------------- |
| `openid`  | 用户唯一标识 `sub`（`userinfo` 中必然包含）   | ✅ 必须（所有请求都应包含） |
| `profile` | `username`、`gender`、`avatar`、`description` | ❌ 可选                     |
| `email`   | `email`                                       | ❌ 可选                     |

客户端在授权请求中可请求任意组合，最终返回的 scope 是请求 scope 与客户端注册 scope 的交集。若未提供 scope，服务端默认使用 `openid profile email`。

---
