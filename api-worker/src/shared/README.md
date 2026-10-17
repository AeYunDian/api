# shared —— 跨服务共用

这里只放**两个以上服务真正会用**的东西，业务逻辑不要往这扔。

| 文件 | 作用 |
|---|---|
| `error-codes.js` | 全局错误码注册表（对外契约的一部分，只增不改） |
| `kvWithD1.js` | 用 D1 模拟 KV 的适配器 + 过期清理 |
| `utils.js` | 通用小工具（CORS 头、token、base64、IP 脱敏、上游代理…） |

## error-codes.js

所有接口返回的 `error_code` 都必须从这里取。

```js
import { ERROR_CODES, errorPayload, httpStatusFor } from "../../shared/error-codes.js";

return jsonResponse({ error_code: ERROR_CODES.INVALID_EMAIL }, 400, cors);

// 想统一响应体形状时：
return jsonResponse(errorPayload(ERROR_CODES.INVALID_EMAIL), 400, cors);
// → { error_code: 1000, error: "Invalid email format" }
```

导出内容：

| 导出 | 说明 |
|---|---|
| 具名常量 | `export const SERVER_DOWN = 1018;` 等，可直接 `import { SERVER_DOWN }` |
| `ERROR_CODES` | 汇总对象，写法更明确：`ERROR_CODES.SERVER_DOWN` |
| `ERROR_MESSAGES` | 数字 → 默认英文文案（前端没做映射时至少能显示一句人话） |
| `ERROR_STATUS` | 数字 → 建议 HTTP 状态码 |
| `ERROR_NAMES` | 数字 → 常量名，日志里打印更好读 |
| `errorPayload(code, overrides?)` | 生成 `{ error_code, error }`，可覆盖字段 |
| `httpStatusFor(code)` / `isKnownErrorCode(code)` | 工具函数 |

### 号段

| 号段 | 归属 |
|---|---|
| 1000–1099 | 账号 / 鉴权 `online.undz.cn` |
| 1100–1199 | 控制台 `console.undz.cn`（尚未使用） |
| 1200–1299 | 站点统计 `mysites.undz.cn` |
| 1300–1399 | 文件服务 `files.undz.cn` |
| 1400–1499 | WS 中继 `relay.undz.cn` |
| 1500–1599 | AI `ai.undz.cn` |
| 1900–1999 | 通用 / 平台级 |

### 三条硬规矩

1. **只增不改号、不复用旧号表示新语义**。号是已发布的契约。
2. **1024、1027–1039 不要占用**：这些是前端 SDK 内部用的（取消人机验证、验证码发送、邮件与
   登录窗口），服务端下发会和客户端文案撞车。账号段当前用到 1043，下一个从 1044 起。
3. 新增号要同时补 `ERROR_CODES` / `ERROR_MESSAGES` / `ERROR_STATUS`；需要前端展示文案的，
   同步 `api-vue/public/lib/account-sdk.js` 的 `error.<号>`，并重新生成 `account-sdk.min.js`。

## kvWithD1.js

用一张 `app_kv_store(key TEXT PRIMARY KEY, value TEXT, expires_at INTEGER)` 模拟 KV，
接口对齐原生 KV，方便本地/低量场景少一个绑定。

```js
import { createKvStore } from "../../shared/kvWithD1.js";
const kv = createKvStore(env.db);
await kv.put("k", "v", { expirationTtl: 600 });   // 秒
await kv.get("k");                                 // 过期或不存在 → null
await kv.delete("k");
await kv.deleteByPrefix("refresh:");               // LIKE 'refresh:%'
```

注意：

- **过期靠 `expires_at` 判断 + 定时任务清理**（`wrangler.toml` 里 `crons = ["*/30 * * * *"]`，
  入口 `scheduled()` 调 `cleanExpiredKv`）。所以过期键在清理前仍占行，但 `get` 会返回 `null`。
- **没有原子自增/锁**：不要拿它做计数器或分布式锁。
- `deleteByPrefix/Suffix/Pattern` 都是 `LIKE`，pattern 里的 `%` `_` 会被当通配符。

## utils.js

| 导出 | 用途 |
|---|---|
| `corsHeaders_GPO` | 全放开 CORS（`*`），只给无需 Cookie 的公共接口用 |
| `escapeHtml` / `assertString` | HTML 转义、类型断言 |
| `getMainPage` | 极简 HTML 页面壳（带 MSIE/Chrome 友好错误页 padding） |
| `md5Hex` | MD5（仅用于非安全场景） |
| `generateToken` | 32 字节随机数的 hex 串（幂等键、state、client_secret 都用它） |
| `generateRandomBytes` | 定长随机字节（加盐） |
| `generatePKCEPair` | OAuth PKCE 的 verifier/challenge（S256） |
| `isBase64` / `toBase64` / `utf8ToBase64` / `base64ToUtf8` | base64 互转（注意 UTF-8 那两个别用混） |
| `anonymizeIp` | IPv4/IPv6 打码（`/ip` 之类对外接口应该用，目前没用） |
| `proxyStaticFile` | 代理上游静态文件：404/4xx/5xx 分别转成明确状态码 + 缓存头 |
| `mobileRegex` / `USER_AGENT` | UA 判断、代理请求用的默认 UA |

## 加新文件的门槛

- 只有一个服务用 → 放到那个服务目录里，不要进 `shared/`。
- 放进来的东西要能被任何服务 import，且不得反向 import `services/*`（会形成环）。
