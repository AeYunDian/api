# image —— i0/i1/i2.undz.cn（图床反代）

三个域名同一份代码，只把上游 host 写死为 `i0.hdslb.com`（B 站图床），
用于绕过跨域 / Referer 限制。

- 入口：`api-worker/src/services/image/i0.undz.cn.js`（i1、i2 为同构副本）
- 代码目录：`api-worker/src/services/image/`
- 域名：`i0.undz.cn`、`i1.undz.cn`、`i2.undz.cn`
- 鉴权：无

## 行为

```
原始 path:
  /xxx.jpg          → 追加 @1e_1c.webp → /xxx.jpg@1e_1c.webp
  /xxx.jpg@800w     → 原样使用
  /xxx.jpg@np       → 去掉 @np 后缀 → /xxx.jpg
```

转发到 `https://i0.hdslb.com{processedPath}{search}`。

- 200 / 304 时补 `Cache-Control: public, max-age=86400`（上游已有则不覆盖）。
- 其它状态原样返回（`proxyStaticFile` 会把 4xx/5xx 归一成明确状态）。
- 不处理请求体，只用于 GET 图片。

## 注意

- 三个文件只有 host 不同，改一个要同步改另外两个。
- 上游是第三方图床，链接失效、防盗链策略变化都会直接影响这里。
- 没有任何缓存层，完全依赖浏览器和上游 CDN。
