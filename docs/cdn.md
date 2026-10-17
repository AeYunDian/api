# cdn —— cdn.undz.cn（jsDelivr / Google Fonts 代理）

给前端提供同域静态资源代理，规避跨域、字体域名和部分网络问题。

- 入口：`api-worker/src/services/cdn/jsdelivrCDN.js`
- 代码目录：`api-worker/src/services/cdn/`
- 域名：`cdn.undz.cn`
- 鉴权：无（公开代理）

## 路由

| 路径 | 上游 | 说明 |
|---|---|---|
| `/` | `env.assets` | 跳到静态资源 `/cdn/` |
| `/css`、`/css2` | `fonts.googleapis.com` | Google Fonts CSS，并把 `fonts.gstatic.com` 改写成当前域名 |
| `/s/`、`/l/`、`/earlyaccess/` | `fonts.gstatic.com` | 字体文件 |
| 其它 | `cdn.jsdelivr.net` | jsDelivr 代理 |

jsDelivr 只允许这些前缀：

```
/npm/  /gh/  /file/  /files/  /wordpress/  /combine/
```

## 行为

- 所有响应补 `Access-Control-Allow-Origin: *` 和 `Access-Control-Expose-Headers: *`。
- 转发前删除 `host`、`cookie`、`authorization`、`cf-*`、`x-forwarded-*`、`x-real-ip`。
- Google Fonts CSS 会保留原始 `User-Agent`（决定返回 woff2 / woff / ttf），
  并把 CSS 里的 `fonts.gstatic.com` 绝对/协议相对 URL 重写成本域，因此字体也走代理。
- 上游异常返回仿 nginx 的 502 / 500 HTML 页。
- 预检 `OPTIONS` 返回 204，允许全部方法和请求头。

## 使用示例

前端 `head.config.js` 里直接写：

```html
<link rel="stylesheet" href="https://cdn.undz.cn/css2?family=Noto+Serif+SC:wght@400;600;700&display=swap">
```

## 注意

- 是公开代理，没有域名白名单和速率限制；上游路径是否合法由前缀决定。
- `rewriteGoogleFontsCSS` 会删掉 `Content-Length`，因为 body 已改变。
- 不缓存响应，缓存策略完全交给上游/浏览器。
