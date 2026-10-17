# files —— files.undz.cn（R2 文件分发）

对外按短码分发 R2 里的文件，可选访问口令。上传与管理在 console。

- 入口：`api-worker/src/services/files/ayFiles.js`
- 代码目录：`api-worker/src/services/files/`
- 域名：`files.undz.cn`
- 存储：R2 `env.STORAGE_BUCKET`（bucket `exm`）
- 记录表：`file_manager`

## 端点

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/files/{code}` | 下载文件；带口令时先返回密码表单 |
| POST | `/files/{code}` | 提交口令后下载 |

不存在的文件、已过期、已删除统一返回同一个 404 页面。

## 访问流程

```
GET /files/{code}
  ├─ 查 file_manager（code）
  ├─ 不存在 / 过期 → 404
  ├─ 无口令 → 从 R2 取对象，Content-Disposition: attachment
  └─ 有口令 → 401 + 密码表单
       ├─ POST 错误 → 403 + 表单
       └─ POST 正确 → 返回文件并清除临时 Cookie
```

权限判断只看 `code`，不需要登录。

## 字段

| 字段 | 说明 |
|---|---|
| `path` | 逻辑路径，唯一 |
| `code` | 对外短码，`/^[A-Za-z0-9_-]{4,128}$/` |
| `need_password` | 是否需要口令 |
| `password` | **明文**存储（历史实现，见下） |
| `expiration_at` | 秒级时间戳，空 = 永久 |
| `r2_key` | R2 对象键 |
| `size` / `mime_type` | 文件元信息 |

## 管理接口

全部在 console，且仅管理员：

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/api/filesmanager` | 上传（multipart 或 JSON） |
| PUT | `/api/filesmanager` | 改路径/口令/过期时间，或替换文件 |
| GET | `/api/filesmanager` | 列目录或下载 |
| DELETE | `/api/filesmanager` | 删除文件或目录 |

详见 [console.md](console.md)。

## 注意

- **口令是明文存储、明文比较**，Cookie 里也是明文；`ayFiles.js` 用
  `FM_<base32(code)>` 作 Cookie 名。建议后续改成 PBKDF2 + 失败锁定。
- 文件名通过 `Content-Disposition` 的 `filename*` 做 UTF-8 编码。
- R2 对象缺失时返回 404，不会暴露记录是否存在。
- 没有下载次数统计。
