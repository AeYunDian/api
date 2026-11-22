# lanzou-go — 蓝奏云直链 Cloudflare Worker

把一个分享 ID 当路径传进来，Worker 现场解析出 CDN 直链，默认 302 跳过去。

```
https://<你的worker域名>/tres/ihq1L3cuuw7a
        └─ 等价于解析 https://tres.lanzouq.com/ihq1L3cuuw7a
```

- 路径第一段 = 蓝奏云的子域，第二段 = 分享 ID，主域在 `src/config.js` 的 `baseDomain`（默认 `lanzouq.com`）；也可用 `?d=` 临时切到备用主域。
- 文件 → 默认 302 到直链；`?json` 返回 JSON；`?p` 由 Worker 下载后再以 200 吐流。
- 文件夹（ID 以 `b` 开头，或加 `?f`）→ 固定返回 JSON 列表。
- 任何错误 → JSON，`{ ok: false, error: { code, message } }`。

## 文件结构

纯 JavaScript（ESM），没有 TypeScript、没有构建步骤，wrangler 直接打包上线。

```
lanzou-worker/
├─ wrangler.toml        # 只有 name / main / compatibility_date
├─ package.json
└─ src/
   ├─ config.js         # 全部可调配置（域名、UA、超时、参数别名、CORS）
   ├─ index.js          # 路由、302 / JSON / 代理下载、错误映射
   └─ lanzou.js         # 解析核心（两代模板的锚点、downprocess、文件夹翻页）
```

## 部署

```bash
npm install
npx wrangler dev      # 本地
npx wrangler deploy   # 上线
```

**没有环境变量**：所有配置都在 `src/config.js`，改完重新 `deploy` 即生效。

## 配置（src/config.js）

| 字段 | 默认 | 说明 |
|---|---|---|
| `baseDomain` | `lanzouq.com` | 不传 `?d=` 时用的主域 |
| `domains` | `x/i/w/y/v/j/t/q/p/0` | `?d=` 白名单，键是 d 值、值是完整主域 |
| `userAgent` | Chrome 126 | 分享页 / 密码页 / 接口 / 直链 |
| `mobileUserAgent` | 小米浏览器 | 文件夹列表接口专用，改桌面 UA 会解析失败 |
| `requestTimeoutMs` | `15000` | 单次上游请求超时 |
| `proxyTimeoutMs` | `120000` | `?p` 下载文件超时 |
| `fallbackHost` | `developer2oss.lanzouc.com:661` | 直链兜底主机（绕 DNS 污染） |
| `maxFolderPages` | `50` | 文件夹最多翻页数 |
| `params` | 见下 | 查询参数别名表 |
| `toolsdownQuery` | `toolsdown` | 追加到直链上的参数名 |
| `cors.allowOrigin` | `*` | CORS 允许来源 |

`params` 的默认值：

```js
password: ['q', 'pw'],
json:     ['json'],
proxy:    ['p', 'ps'],
folder:   ['f', 'folder'],
toolsdown:['td', 'toolsdown'],
domain:   ['d', 'D'],
```

要加别名，直接往数组里加字符串即可，比如把代理下载扩成 `['p', 'ps', 'dl']`。

## 路由与参数

`GET /{子域}/{分享ID}`

| 参数 | 别名 | 作用 |
|---|---|---|
| `q` | `pw` | 提取密码，如 `?q=fs33` / `?pw=fs33` |
| `json` | — | 返回 JSON（`link` / `name` / `size`），不再 302。只要出现即生效，值随意 |
| `p` | `ps` | 由 Worker 下载后以 **200** 返回文件流（带 `Content-Disposition`） |
| `f` | `folder` | 强制按文件夹解析（ID 以 `b` 开头时会自动识别，一般不用加） |
| `td` | `toolsdown` | 给直链追加 `&toolsdown`（“普通下载”通道，避开 P2P 加速） |
| `d` | `D` | 指定备用主域：`x`/`i`/`w`/`y`/`v`/`j`/`t`/`q`/`p` → `lanzou{d}.com`，`0` → `lanzou.com`；不在白名单返回 `BAD_DOMAIN` |

优先级：文件夹 > `p`/`ps` > `json` > 302。

### `?d=` 备用主域

蓝奏云被 DNS 污染时会轮换主域，`d` 就是让客户端自己指定走哪条域名：

| d 值 | 实际访问 |
|---|---|
| 不传 | `config.baseDomain`（默认 `lanzouq.com`） |
| `x` | `lanzoux.com` |
| `i` | `lanzoui.com` |
| `w` | `lanzouw.com` |
| `y` | `lanzouy.com` |
| `v` | `lanzouv.com` |
| `j` | `lanzouj.com` |
| `p` | `lanzoup.com` |
| `t` | `lanzout.com` |
| `q` | `lanzouq.com`（与默认值相同） |
| `0` | `lanzou.com`（不带后缀） |

```
https://<worker>/tres/ihq1L3cuuw7a?d=x&q=fs33
   └─ 实际解析 https://tres.lanzoux.com/ihq1L3cuuw7a
```

白名单之外（比如 `?d=z`、`?d=` 空值）一律 `400 BAD_DOMAIN`，不会拼出任意域名。

`d` 和密码参数 `q` 互不影响：`?d=q&q=fs33` 里第一个 `q` 是**值**，第二个才是密码键名。

> 错误响应只返回“为什么失败”，不带任何用法提示；参数用法只写在本 README 里。

### 响应示例

**302（默认）**

```
HTTP/1.1 302 Found
Location: https://pdf3.webgetstore.com/…/609dcdd4….txt?fn=%E6%97%A0%E5%AF%86%E7%A0%81%E5%A4%96%E9%93%BE.txt
Content-Disposition: attachment; filename="____.txt"; filename*=UTF-8''%E6%97%A0…
```

**JSON**

```json
{
  "ok": true,
  "type": "file",
  "link": "https://pdf3.webgetstore.com/…/609dcdd4….txt?fn=%E6%97%A0%E5%AF%86%E7%A0%81%E5%A4%96%E9%93%BE.txt",
  "name": "无密码外链.txt",
  "size": "",
  "toolsdown": false
}
```

**文件夹**

```json
{
  "ok": true,
  "type": "folder",
  "folder": "https://tres.lanzouq.com/b0c8i6wb",
  "count": 2,
  "files": [
    {
      "id": "iErYy3cv26je",
      "name": "有密码外链.txt",
      "size": "15.0 B",
      "time": "2025-12-04",
      "share": "https://tres.lanzouq.com/iErYy3cv26je",
      "url": "https://<worker>/tres/iErYy3cv26je"
    }
  ]
}
```

**错误**

```json
{
  "ok": false,
  "error": {
    "code": "PASSWORD_REQUIRED",
    "message": "需要提取密码"
  }
}
```

错误信息只说“为什么失败”，不带 `?q=` 之类的用法提示——用法统一看这份 README。

错误码与状态码：

| code | HTTP | 含义 |
|---|---|---|
| `BAD_PATH` | 400 | 路径段不合法（含 SSRF 防护：子域只允许 `[a-z0-9-]`） |
| `BAD_DOMAIN` | 400 | `?d=` 的值不在白名单 |
| `METHOD_NOT_ALLOWED` | 405 | 只支持 GET / HEAD |
| `PASSWORD_REQUIRED` | 403 | 需要密码但没给 `?q=` / `?pw=` |
| `DOWNLOAD_REJECTED` | 403 | 密码错或文件已取消分享 |
| `FOLDER_REJECTED` | 403 | 文件夹接口拒绝（密码错 / 令牌过期） |
| `TEMPLATE_CHANGED` | 502 | 页面结构变了，锚点失效 |
| `DOWNPROCESS_FAILED` | 502 | 换地址接口全挂 |
| `NO_LOCATION` | 502 | 拿不到 302 Location（通常是反爬挑战页） |
| `UPSTREAM_HTTP` | 502 | 上游非 2xx |
| `BAD_RESPONSE` | 502 | 接口返回的不是 JSON |
| `INTERNAL` | 500 | 其它未捕获异常 |

## 用 curl 试（部署后自己验）

```bash
# 302
curl -sI "https://<worker>/tres/i9Ibd3cuuv4b" | grep -i location

# 有密码 + JSON（q 与 pw 等价）
curl -s "https://<worker>/tres/ihq1L3cuuw7a?q=fs33&json" | jq .
curl -s "https://<worker>/tres/ihq1L3cuuw7a?pw=fs33&json" | jq .

# 文件夹（b 开头自动识别，f / folder 强制）
curl -s "https://<worker>/tres/b0c8i6wb" | jq '.files[] | {id, name}'
curl -s "https://<worker>/tres/i9Ibd3cuuv4b?folder" | jq .

# 直接下载（p 与 ps 等价；td / toolsdown 走普通下载通道）
curl -sSL "https://<worker>/tres/i9Ibd3cuuv4b?p" -o out.txt
curl -sSL "https://<worker>/tres/i9Ibd3cuuv4b?ps&td" -o out.txt

# 换备用主域（d=x → lanzoux.com，d=0 → lanzou.com）
curl -s "https://<worker>/tres/ihq1L3cuuw7a?d=x&pw=fs33&json" | jq .
```

## 解析逻辑要点（踩过的坑）

1. **`wp_sign` 在 `/fn?token` 那一层**，不在分享页；分享页只有一个 `<iframe class="ifr2">` 空壳。
2. **`dom` 有时不可用**：`developer4.lanrar.com/file/?…` 对非浏览器 UA 会返回 JS 挑战页（`var arg1='…'`），200 但没有 `Location`。代码会再试页面写死的兜底主机 `https://developer2oss.lanzouc.com:661`（非标端口，绕 DNS 污染），实测只有它能给 302。
3. **密码页的 `sign` 变量声明两次**（`var isngis=''; var isngis='真值';`），取第一个匹配会拿到空串 → 必须取最后一个非空赋值。
4. **密码接口是 `ajaxfile.php` + `p`**，不是网上老教程里的 `ajaxm.php` + `pwd`。
5. **文件夹要移动端 UA**，参数是 `lx/fid/uid/puid/pg/rep/t/k/up`；`t`、`k` 在页面里写的是**变量名**，真值在 `var xxx='…'` 里；翻页 `pg++`，`zt=4` 表示到底。
6. **直链带时效**，302 出去之后客户端要尽快用；`?p` 模式每次都会重新解析。

## 已知限制

- `?p` 会占用 Worker 的出口流量，大文件建议 `?p` 只用于小文件，或者直接用默认 302 让客户端直连 CDN。
- 不执行 JS，所以遇到 JS 挑战页靠 `:661` 兜底；如果哪天津东这个兜底也失效，需要接 Browser Rendering 或换解析路径。
- 没做缓存：每次请求都重新解析（直链有时效，缓存收益有限且容易踩过期）。如需降延迟，可用 Cache API 缓存直链 30~60 秒。
- 未实现：转存到网盘、Range 多段、总量限流。

## 免责声明

仅用于解析你自己有权访问的分享链接。请遵守蓝奏云服务条款与所在地法律法规，不要用于绕过访问控制、批量抓取他人文件或传播违法内容。
