# gateway —— api.undz.cn / api.io.hb.cn（通用网关）

二维码、IP、QQ 名片跳转、毕业纪念册，以及一个独立的账号/背包子模块（crossfire）。

- 入口：`api-worker/src/services/gateway/uniAPI.js`
- 代码目录：`api-worker/src/services/gateway/`、`services/crossfire/v1/`
- 域名：`api.undz.cn`、`api.io.hb.cn`
- 鉴权：绝大多数接口公开；管理接口用 `X-Admin-Token: env.ADMIN_TOKEN`

## 端点

### 二维码

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/qrcode` | HTML 表单页 |
| GET | `/qrcode/v1/generate` | 生成二维码图片 |

参数：`text`（必填，≤ 2000 字符）、`type` = `png|svg|pdf`、`level` = `L|M|Q|H`、
`size`（PNG，50–1000）、`margin`（0–10）、`parse_url`。

响应带 `Cache-Control: public, max-age=3600` 和 CORS。

### IP

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/ip` / `/ip/v1/get` | 返回 `CF-Connecting-IP` 与 `request.cf` 字段 |

### QQ 名片

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/addqq?uid=12345` | 308 到 `/addqq/v1/{uid}` |
| GET | `/addqq/v1/{uid}` | HTML 页面，按 UA 选择 `mqqapi://` 或 `tencent://` 协议 |

`uid` 必须是 5–12 位数字。

### crossfire（账号 + 背包）

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/api/crossfire/v1/account/create` | 创建账号 |
| POST | `/api/crossfire/v1/account/init` | 建表，`X-Admin-Token` |
| POST | `/api/crossfire/v1/account/login` | 登录 |
| POST | `/api/crossfire/v1/account/logout` | 登出 |
| POST | `/api/crossfire/v1/bag/get` | 查背包 |
| POST | `/api/crossfire/v1/bag/push` | 写背包 |

表：`users`、`bag`（UUID 关联）。密码使用 `password_key` + HMAC 派生（历史实现）。

### 毕业纪念册

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/api/v1/verify` | 校验授权码，返回 `userid` / `name` |
| POST | `/api/v1/submit` | 提交资料，校验授权码与重复提交 |
| GET | `/gy/v1/record/{userId}` | 读取纪念册记录 |
| POST | `/gy/v1/initdb` | 建表，`X-Admin-Token` |

表：`auth_keys`、`records`。

## 已移除

`POST /go/addlink` 和 `services/gateway/short_link_v1.js` 已删除。短链接现在由
`go.undz.cn` 提供，见 [shortlink.md](shortlink.md)。

## 环境变量

| 变量 | 用途 |
|---|---|
| `ADMIN_TOKEN` | `X-Admin-Token` 校验；不配置时管理接口放行（历史行为） |
| `DEBUG` | 上游错误日志 |

## 注意

- `ADMIN_TOKEN` 未配置时 `/account/init`、`/gy/v1/initdb` 是公开的，线上务必配置。
- 二维码用 `qr-image` 生成，PNG 尺寸和边距只对 PNG 生效。
- crossfire 和毕业纪念册的表与主账号体系无关，各自独立。
