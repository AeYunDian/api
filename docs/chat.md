# chat —— chat.undz.cn / c.undz.cn（旧聊天室）

基于 HTTP 轮询的怀旧聊天室，保留 IE8/移动端提示页，和 AY 账号只有登录入口层面的关系。
新版实时聊天设计见 [chat-v2.md](chat-v2.md)（未实施）。

- 入口：`api-worker/src/services/chat/ayChatRoom.js`
- 数据层：`api-worker/src/services/chat/chat_room.js`
- 域名：`chat.undz.cn`、`c.undz.cn`

## 页面

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/` | 聊天室首页 |
| GET | `/chat` | 聊天页 |
| GET | `/setting` | 超管设置页（需 `key=env.KEY`） |
| GET | `/oauth/callback` | AY OAuth 回调，换 token 后跳 `/chat?room=main` |

移动端 / 微信首次访问会先跳一个提示页，并写 `CHAT_did_prompt_appear` Cookie。

## 接口

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/create?key=&username=&password=` | 用管理员密钥创建聊天账号 |
| GET | `/verify?room=&username=&password=` | 校验自定义房间凭证 |
| GET | `/send?room=&nick=&msg=` | 发消息 |
| GET | `/poll?room=&after=` | 轮询新消息 |
| GET | `/add_room` | 登录/进入房间 |
| GET | `/clean` | 清理消息（超管） |
| GET | `/init` | 建表（需 `key=env.KEY`） |
| GET | `/api/admin/*` | 管理接口（超管） |

## 数据表（`chat_` 前缀）

| 表 | 说明 |
|---|---|
| `chat_messages` | `room`、`nick`、`msg`、`is_admin`、`created_at` |
| `chat_admin_keys` | 管理员密钥 |
| `chat_users` | 自定义房间账号 |
| `chat_clean_time` | 每个房间的清理时间 |
| `chat_filter_words` | 敏感词 |
| `chat_setting` | 服务开关等 |

## 规则

- 每个房间最多保留 200 条消息（`MAX_MESSAGES`）。
- 昵称 1–30 字符，禁止 `admin`、`root`、`system` 等保留名。
- 主房间：禁止连续相同内容，发送间隔 ≥ 3 秒。
- 消息不能是纯标点、纯空白，命中敏感词直接丢弃。
- 自定义房间需要账号口令，口令明文存储、明文比较。

## 已知债

- **轮询而不是 WebSocket**：每次 `/poll` 都打 D1，实时性和成本都不理想。
- **口令明文**：`chat_users.password` 直接存明文。
- **身份和 AY 账号脱节**：房间身份是昵称 + 房间口令，OAuth 登录只用于跳转。
- **管理员密钥通过 URL 传递**：容易进日志/Referer。
- 新版服务（账号强绑定、WS、通讯录、群组）见 [chat-v2.md](chat-v2.md)。
