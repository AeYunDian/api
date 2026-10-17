# chat.undz.cn 新聊天后端设计（v1 草案，待评审）

> **状态：设计稿，尚未实施。** 现有聊天室见 [chat.md](chat.md)。
>
> 目标：把现有「轮询 + 匿名昵称 + 独立口令」的聊天室，替换为
> 「AY 账号强绑定 + WebSocket 实时 + 通讯录/好友/黑名单 + 群组」的现代 IM 后端。
> 原聊天室整体迁到 `old.chat.undz.cn`，代码与数据保持原样。
>
> 本文只覆盖后端。前端不在本次范围内，但 WS 协议、REST 契约在这里定死，前端照此实现。

---

## 0. 结论速览（先看这段）

| 项目 | 结论 |
|---|---|
| 传输 | REST（CRUD/历史/搜索）+ WebSocket（实时收发/回执/输入中） |
| 唯一真值 | D1（`api_db`），所有消息落库后才算发送成功 |
| 实时连接 | **Durable Object，每个用户一个会话 DO**（`CHAT_SESSION`），多端共用 |
| 鉴权 | 复用 `online.undz.cn` 的 `checkAuth` / `verifyBearerToken`，**不做第二套账号** |
| 准入 | AY 账号 → `im_users` 激活 → 可用；激活由 `INVITE_MODE` 决定是否要邀请码 |
| 表前缀 | 新表统一 `im_`，与旧站 `chat_*` 完全隔离，可并存回滚 |
| 消息保留 | 群 200 条/会话，单聊 300 条/会话，**硬保留**（超出即删，见 §7.4） |
| 群限制 | 每人最多创建 20 个群，加入不限；单群 ≤ 1000 人 |
| 错误码 | 新开 **1600–1699** 段（chat / IM） |

需要先确认的几件事见 §14。Durable Object 在 Workers 免费计划**可用**（仅 SQLite 后端），
但有每日额度，预算见 §10.4。

---

## 1. 现状与为什么要换

### 1.1 现有实现的问题

`services/chat/`（旧站）：

- 纯 **HTTP 轮询**（`/poll`、`/send`），无长连接。
- 身份是**独立昵称 + 房间口令**，和 AY 账号体系没有关系；`/oauth/callback` 只是登录页的附加路径。
- 消息表 `chat_messages` 只有一个 `room + nick + msg`，无法表达私聊、成员、已读。
- 群组、通讯录、黑名单、隐私设置全部不存在。

`services/relay/`（PSP 中继）：

- 用 **模块级 `Map`** 保存 `livePeers` / `networkSubscribers`。Worker 是无状态的、多 isolate 的，
  这套状态在线上是**不可靠**的（不同 isolate 看不到彼此的 Map，扩容/回收即丢）。
- 它做的是「peer 发现 + 转发」，不是 IM；没有账号、没有持久会话。

**结论：新服务不能复用上面任何一套连接模型，必须引入 Durable Object。**

### 1.2 为什么必须是 Durable Object

WebSocket 要广播，就必须有一个「只有一份、能持有连接」的地方：

- Worker 本身在每个 isolate 里各有一份内存，A 连在 isolate-1、B 连在 isolate-2，A 的消息永远推不到 B。
- D1 只能存不能推。
- Durable Object 的 `state.acceptWebSocket()` + Hibernation API 正好是官方给这个场景的方案：
  连接挂在 DO 上，DO 休眠时不占 CPU/计费，唤醒后还能收到消息。

> **前置条件**：需要给 `wrangler.toml` 增加 DO 绑定与 migration。
> Durable Objects 自 2025-04-07 起在 **Workers Free 计划可用**，但只支持 **SQLite 后端**：
> 必须用 `new_sqlite_classes`，用旧的 `new_classes` 会报 **error 10097**。
> 免费额度见 §10.4；超出后该类操作直接失败（不扣费），UTC 00:00 重置。

---

## 2. 总体架构

```
                    ┌──────────────────────────────────────────┐
                    │            chat.undz.cn (Worker)          │
                    │                                          │
  Cookie / Bearer   │  /api/chat/*        REST（鉴权、CRUD）     │
  ─────────────────▶│      │                                   │
                    │      ├─ /api/chat/session/ticket ──┐      │
                    │      │                             │      │
                    │  /ws?ticket=...  ───────────────────┼──┐   │
                    │                                     │  │   │
                    └─────────────────────────────────────┼──┼───┘
                                                          │  │
                     ┌────────────────────────────────────┘  │
                     ▼                                       ▼
          ┌────────────────────┐                  ┌──────────────────┐
          │  CHAT_SESSION DO   │  deliver(push)   │   D1 (api_db)    │
          │  key = u:{sub}     │◀─────────────────│  im_* 全部表      │
          │  · 该用户所有 socket│                  └──────────────────┘
          │  · 在线状态/踢下线  │                          ▲
          └─────────┬──────────┘                          │
                    │ RPC 扇出（按收件人）                 │ 先落库
                    ▼                                     │
          其它用户 CHAT_SESSION DO ───────────────────────┘
```

### 2.1 为什么「一个用户一个 DO」，而不是「一个群一个 DO」

| 方案 | 优点 | 缺点 |
|---|---|---|
| **A. 用户 DO（推荐）** | 客户端只需一条连接；多端天然聚合；好友申请/群变更/踢下线都能推；实现最简单 | 群发时按在线成员数做 RPC 扇出 |
| B. 会话 DO | 群发只 1 次 RPC | 不开着群就收不到；多端要连多条；好友/系统事件没有归属 |

这个部署的在线人数是**几十量级**，不是百万级；按在线成员扇出完全够用。
真出现「1000 人大群高活跃」再上 B 作为热点优化，协议不用改。

### 2.2 一次「发消息」的完整链路

```
① 客户端 WS 发 message.send {conversation_id, client_msg_id, type, content}
② 发送方 DO：验活/限流/校验内容
③ DO 写 D1：INSERT im_messages（唯一索引挡重复）
④ DO 取收件人：DM → 对方 sub；群 → im_group_members(state='active')
⑤ DO 分片（每批 50）RPC 到每个收件人的 CHAT_SESSION.deliver(event)
⑥ 收件人 DO 广播给该用户所有 socket
⑦ 发送方收到 message.ack {client_msg_id, message_id}
```

- **落库成功才 ack**；ack 超时客户端可用同一 `client_msg_id` 重发，唯一索引保证幂等。
- 离线用户不推送，下次进 App 用 REST `GET /messages?after_id=` 补齐。
- 群成员的 `unread` 不逐人维护（1000 人时写放大），由列表接口按 `last_read_id` 现算（§7.5）。

---

## 3. 域名与迁移

### 3.1 路由改动（`src/index.js`）

```js
if (hostname === "old.chat.undz.cn") return chatRoom.fetch(request, env);   // 旧站
if (hostname === "chat.undz.cn")     return chatV2.fetch(request, env, ctx); // 新站
if (hostname === "c.undz.cn")        return chatRoom.fetch(request, env);   // 旧短域名，保持不动
```

### 3.2 目录调整

```
src/services/
├── chat/                  ← 新站（chat.undz.cn），本文全部内容
│   ├── ayChat.js          入口：CORS / checkAuth / 路由分发 / WS upgrade
│   ├── config.js          全部常量与开关（含 INVITE_MODE）
│   ├── http.js            jsonResponse / corsHeaders / handleOptions
│   ├── auth.js            requireUser / requireActive / ticket 签发与消费
│   ├── db/schema.js       im_* 建表（供 /init 调用）
│   ├── routes/
│   │   ├── gate.js         gate / activate / ticket
│   │   ├── profile.js      me / settings
│   │   ├── users.js        search / lookup / profile card
│   │   ├── contacts.js     通讯录 / 好友申请 / 黑名单
│   │   ├── conversations.js 会话列表 / 历史 / 已读 / DM 建立
│   │   ├── groups.js       群 CRUD / 成员 / 邀请码
│   │   └── admin.js        邀请码管理 / 统计 / 封停
│   └── session-do.js       ChatSession Durable Object
└── chat-legacy/           ← 旧站整体搬入（原 chat/ 下的 ayChatRoom.js、chat_room.js）
```

> 如果你不想动旧目录，也可以把新站命名成 `services/im/`，只改 `index.js` 的映射。
> 我倾向「新的占 `chat/`、旧的进 `chat-legacy/`」，因为域名已经说明了归属。

### 3.3 迁移旧站必须同步改的三处

1. `services/chat-legacy/ayChatRoom.js` 里写死的回调地址：
   `https://chat.undz.cn/oauth/callback` → `https://old.chat.undz.cn/oauth/callback`。
2. D1 里 `oauth_clients` 的 `app_chat.redirect_uris`（`schema.js` 的种子数据也要改），
   追加/替换为 `https://old.chat.undz.cn/oauth/callback`。
3. `account/config.js` 的 `ALLOWED_ORIGINS` 增加 `https://old.chat.undz.cn`
   （旧站若还调账号接口，不加会被 CORS 挡）。

新站**不再需要 OAuth 客户端**：它在 `.undz.cn` 下，直接读 `access_token` Cookie 即可。

---

## 4. 身份与准入

### 4.1 三层状态

```
AY 账号（online_users）        聊天激活（im_users）           可用
──────────────────────   →   ─────────────────────   →   ──────────
未登录 / 被封禁                未激活 / 已激活 / 已停用        正常聊天
```

| 状态 | 判定 | 行为 |
|---|---|---|
| 未登录 | `checkAuth` → `TAG_NOT_LOGGEDIN` | 401 |
| AY 封禁 | `TAG_BANNED` | 403 + `ban_reason` |
| 未激活 | 无 `im_users` 行且 `INVITE_MODE != off` | 409 + `CHAT_NOT_ACTIVATED` + `invite_mode` |
| 已停用 | `im_users.status = 'suspended'` | 403 + `CHAT_USER_SUSPENDED` |
| 正常 | 其余 | 放行 |

**除了 `/api/chat/gate`、`/api/chat/activate`，所有 `/api/chat/*` 都强制要求「正常」状态。**
`/api/chat/test` 与 `/api/chat/init` 按账号中心惯例放在闸门之前（`init` 用 `X-Admin-Key: env.KEY`）。

### 4.2 激活流程

```
GET  /api/chat/gate
  → { logged_in, activated, invite_mode: "off"|"optional"|"required", user?: {...} }

POST /api/chat/activate
  body: { code?: string }        // optional 模式下可不传；required 模式必须传
  → { activated: true, user: {...} }
```

三种模式的行为：

| INVITE_MODE | 行为 |
|---|---|
| `off` | 首次访问自动激活，`invite_code = null`，`activated_mode='off'` |
| `optional` | 前端问「有邀请码吗？」；传了就走校验兑换，不传就直接激活。`activated_mode='optional'` |
| `required` | 必须传有效邀请码，否则 409 `INVITE_REQUIRED`，不可跳过。`activated_mode='required'` |

> 「问他需不需要注册码」= `optional`。建议默认 `optional`，方便灰度：先关着放人进来，
> 需要收紧时改配置；**已激活用户不受影响**（只校验新激活的人）。

### 4.3 邀请码

**发放**：`POST /api/chat/admin/invite-codes`（管理员）。可选开放「老用户生成」，
但建议第一期只给管理员，避免被人刷码。

**规则**：

| 字段 | 含义 |
|---|---|
| `code` | 12 位 `A-Z0-9`（去掉 0/O/1/I），唯一 |
| `max_uses` | 总可用次数 |
| `used_count` | 已用次数 |
| `expires_at` | 过期时间（NULL = 永久） |
| `status` | `active` / `revoked` / `exhausted` |
| `created_by_sub` | 谁发的 |
| `note` | 备注（发给谁、什么活动） |

**兑换必须原子**，避免并发超发：

```sql
UPDATE im_invite_codes
   SET used_count = used_count + 1,
       status = CASE WHEN used_count + 1 >= max_uses THEN 'exhausted' ELSE status END
 WHERE code = ?
   AND status = 'active'
   AND used_count < max_uses
   AND (expires_at IS NULL OR expires_at > ?);
-- changes = 0 → 码无效/过期/用尽
```

随后 `db.batch([ insert im_users, insert im_invite_redemptions ])`。
用户侧永远只回「邀请码无效/已过期/已用尽」，不区分细节（防枚举）。

**记录「什么时候注册的」**：`im_users.activated_at`（聊天激活时间）+
`im_invite_redemptions.redeemed_at`（兑换明细，含 `code`、`sub`、`mode`）。
AY 账号本身的注册时间仍在 `online_users.created_at`。

### 4.4 WS 票据（ticket）

浏览器不能给 WS 握手加自定义头，虽然同域 Cookie 也会带，但为了：

- 不让 10 分钟有效期的 `access_token` 直接变成长期会话凭证；
- 支持 Bearer / 原生客户端；
- 支持一次性、可审计；

统一走**票据换连接**：

```
POST /api/chat/session/ticket      （Cookie 或 Bearer，需已激活）
  → { ticket: "<64 hex>", expires_in: 60,
      ws_url: "wss://chat.undz.cn/ws?ticket=..." }
```

- D1 只存 **SHA-256(ticket)**，60 秒有效，单次使用。
- DO 收到 upgrade：`UPDATE im_ws_tickets SET used=1 WHERE ticket_hash=? AND used=0 AND expires_at>?`，
  `changes=1` 才放行。
- 连接建立后**不再逐条校验 access_token**；会话最长 24 小时，由 DO alarm 主动断开。
- 日志里对 `ticket`、`Authorization` 做脱敏（query string 不要整条打日志）。

### 4.5 封禁联动

- AY 封禁：下一次 REST 请求即 403；已建立的 WS 由管理端触发踢下线。
- 聊天内停用（`im_users.status='suspended'`）：同上。
- 踢下线接口（内部）：`POST /api/chat/admin/users/{sub}/kick`，RPC 到该用户 DO，
  逐 socket 发 `system {event:"kicked", reason}` 后关闭。

---

## 5. 数据模型

全部新表加 `im_` 前缀，和旧站 `chat_*` 并存，出问题可整段回滚。

### 5.1 用户与设置

```sql
CREATE TABLE IF NOT EXISTS im_users (
  sub            INTEGER PRIMARY KEY,          -- = online_users.sub
  display_name   TEXT,                         -- 聊天展示名，NULL 则回落到 AY username
  bio            TEXT NOT NULL DEFAULT '',     -- 聊天内简介（可被搜索，见 §6）
  avatar         TEXT,                         -- NULL 则回落到 AY avatar
  status         TEXT NOT NULL DEFAULT 'active', -- active | suspended
  invite_code    TEXT,                         -- 激活时使用的码（审计用）
  activated_mode TEXT NOT NULL,                -- off | optional | required
  activated_at   INTEGER NOT NULL,
  last_seen_at   INTEGER,
  created_at     INTEGER NOT NULL,
  updated_at     INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_im_users_status ON im_users(status, last_seen_at);

CREATE TABLE IF NOT EXISTS im_user_settings (
  sub                  INTEGER PRIMARY KEY,
  discoverable         INTEGER NOT NULL DEFAULT 1,  -- 总开关：0 = 任何人搜不到
  search_by_uid        INTEGER NOT NULL DEFAULT 1,
  search_by_username   INTEGER NOT NULL DEFAULT 1,
  search_by_email      INTEGER NOT NULL DEFAULT 0,  -- 默认关：不让别人拿邮箱反查
  search_by_bio        INTEGER NOT NULL DEFAULT 1,
  allow_dm             TEXT    NOT NULL DEFAULT 'all', -- all | friends
  allow_friend_request INTEGER NOT NULL DEFAULT 1,
  allow_group_invite   INTEGER NOT NULL DEFAULT 1,
  show_online          INTEGER NOT NULL DEFAULT 1,
  updated_at           INTEGER NOT NULL
);
```

> **为什么单独一张设置表**：隐私位以后大概率还会加（比如「谁能看我朋友圈」），
> 混在 `im_users` 里每次查询都要带一堆字段，拆开更好演进。

### 5.2 通讯录 / 好友 / 黑名单

```sql
-- 通讯录：好友关系成立后双向各写一行
CREATE TABLE IF NOT EXISTS im_contacts (
  owner_sub  INTEGER NOT NULL,
  peer_sub   INTEGER NOT NULL,
  alias      TEXT,                 -- 备注名
  source     TEXT NOT NULL DEFAULT 'search', -- search | group | qrcode
  created_at INTEGER NOT NULL,
  PRIMARY KEY (owner_sub, peer_sub)
);
CREATE INDEX IF NOT EXISTS idx_im_contacts_peer ON im_contacts(peer_sub);

-- 好友申请
CREATE TABLE IF NOT EXISTS im_friend_requests (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  from_sub   INTEGER NOT NULL,
  to_sub     INTEGER NOT NULL,
  message    TEXT NOT NULL DEFAULT '',
  status     TEXT NOT NULL DEFAULT 'pending', -- pending|accepted|rejected|canceled|expired
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
-- 同一对用户同时只能有一条 pending
CREATE UNIQUE INDEX IF NOT EXISTS uq_im_fr_pending
  ON im_friend_requests(from_sub, to_sub) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_im_fr_to ON im_friend_requests(to_sub, status, created_at);
CREATE INDEX IF NOT EXISTS idx_im_fr_from ON im_friend_requests(from_sub, status, created_at);

-- 黑名单：单向，A 拉黑 B 不影响 B 拉黑 A
CREATE TABLE IF NOT EXISTS im_blocks (
  owner_sub   INTEGER NOT NULL,
  blocked_sub INTEGER NOT NULL,
  reason      TEXT NOT NULL DEFAULT '',
  created_at  INTEGER NOT NULL,
  PRIMARY KEY (owner_sub, blocked_sub)
);
CREATE INDEX IF NOT EXISTS idx_im_blocks_blocked ON im_blocks(blocked_sub);
```

**黑名单的效果**（建议，最终见 §14-Q5）：

| 场景 | 被拉黑方（B）对拉黑方（A） |
|---|---|
| 搜索 | A 不出现在 B 的搜索结果里；B 也不出现在 A 的结果里（双向隐藏） |
| 加好友 | B 发申请直接 403 `BLOCKED`（不提示是对方拉黑，统一文案） |
| 私聊 | B 发消息 403 `CHAT_BLOCKED`；A 的历史仍可读 |
| 群聊 | 不做隔离；同群仍能互相看到消息（否则群逻辑过于复杂） |

### 5.3 群组

```sql
CREATE TABLE IF NOT EXISTS im_groups (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT NOT NULL,
  description  TEXT NOT NULL DEFAULT '',
  avatar       TEXT,
  owner_sub    INTEGER NOT NULL,
  join_mode    TEXT NOT NULL DEFAULT 'invite_only', -- invite_only | approval | open
  invite_code  TEXT UNIQUE,                        -- 群邀请码（可轮换）
  member_count INTEGER NOT NULL DEFAULT 0,
  max_members  INTEGER NOT NULL DEFAULT 1000,
  status       TEXT NOT NULL DEFAULT 'active',     -- active | dissolved | banned
  created_at   INTEGER NOT NULL,
  updated_at   INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_im_groups_owner ON im_groups(owner_sub, status);
CREATE INDEX IF NOT EXISTS idx_im_groups_code  ON im_groups(invite_code);

CREATE TABLE IF NOT EXISTS im_group_members (
  group_id   INTEGER NOT NULL,
  sub        INTEGER NOT NULL,
  role       TEXT NOT NULL DEFAULT 'member',  -- owner | admin | member
  state      TEXT NOT NULL DEFAULT 'active',  -- active | left | kicked
  mute_until INTEGER,                         -- 禁言到期（毫秒）
  joined_at  INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (group_id, sub)
);
CREATE INDEX IF NOT EXISTS idx_im_gm_sub  ON im_group_members(sub, state);
CREATE INDEX IF NOT EXISTS idx_im_gm_group ON im_group_members(group_id, state);

-- 聊天管理员（不沿用 sub===1，见 §14-Q8）
CREATE TABLE IF NOT EXISTS im_admins (
  sub        INTEGER PRIMARY KEY,
  granted_by INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
```

### 5.4 会话与消息

```sql
-- 会话：DM 用确定性 id "d:{min}:{max}"，群用 "g:{group_id}"
CREATE TABLE IF NOT EXISTS im_conversations (
  id           TEXT PRIMARY KEY,
  type         TEXT NOT NULL,               -- dm | group
  group_id     INTEGER,                     -- group 时非空
  member_a     INTEGER,                     -- dm 时较小的 sub
  member_b     INTEGER,                     -- dm 时较大的 sub
  message_count INTEGER NOT NULL DEFAULT 0, -- 用于保留策略裁剪
  last_message_id INTEGER,
  last_message_at INTEGER,
  created_at   INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_im_conv_a ON im_conversations(member_a, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_im_conv_b ON im_conversations(member_b, last_message_at DESC);

CREATE TABLE IF NOT EXISTS im_messages (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id TEXT NOT NULL,
  sender_sub      INTEGER NOT NULL,
  type            TEXT NOT NULL,             -- text | image | file | system
  content         TEXT NOT NULL,             -- JSON，按 type 定义
  reply_to_id     INTEGER,
  client_msg_id   TEXT,                      -- 幂等键
  status          TEXT NOT NULL DEFAULT 'normal', -- normal | recalled | deleted
  created_at      INTEGER NOT NULL,
  recalled_at     INTEGER
);
CREATE INDEX IF NOT EXISTS idx_im_msg_conv ON im_messages(conversation_id, id DESC);
-- 幂等：同一会话内同一发送者同一 client_msg_id 只允许一条
CREATE UNIQUE INDEX IF NOT EXISTS uq_im_msg_client
  ON im_messages(conversation_id, sender_sub, client_msg_id)
  WHERE client_msg_id IS NOT NULL;

-- 每个用户对每个会话的私有状态（已读游标 / 免打扰 / 置顶）
CREATE TABLE IF NOT EXISTS im_conversation_state (
  sub             INTEGER NOT NULL,
  conversation_id TEXT NOT NULL,
  last_read_id    INTEGER NOT NULL DEFAULT 0,
  muted           INTEGER NOT NULL DEFAULT 0,
  pinned          INTEGER NOT NULL DEFAULT 0,
  hidden          INTEGER NOT NULL DEFAULT 0,
  updated_at      INTEGER NOT NULL,
  PRIMARY KEY (sub, conversation_id)
);
CREATE INDEX IF NOT EXISTS idx_im_cs_conv ON im_conversation_state(conversation_id);
```

### 5.5 邀请码 / 票据 / 限流

```sql
CREATE TABLE IF NOT EXISTS im_invite_codes (
  code          TEXT PRIMARY KEY,
  created_by_sub INTEGER NOT NULL,
  max_uses      INTEGER NOT NULL DEFAULT 1,
  used_count    INTEGER NOT NULL DEFAULT 0,
  expires_at    INTEGER,
  status        TEXT NOT NULL DEFAULT 'active',
  note          TEXT NOT NULL DEFAULT '',
  created_at    INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_im_inv_status ON im_invite_codes(status, expires_at);

CREATE TABLE IF NOT EXISTS im_invite_redemptions (
  code        TEXT NOT NULL,
  sub         INTEGER NOT NULL,
  mode        TEXT NOT NULL,
  redeemed_at INTEGER NOT NULL,
  PRIMARY KEY (code, sub)
);
CREATE INDEX IF NOT EXISTS idx_im_ir_code ON im_invite_redemptions(code);

CREATE TABLE IF NOT EXISTS im_ws_tickets (
  ticket_hash TEXT PRIMARY KEY,
  sub         INTEGER NOT NULL,
  expires_at  INTEGER NOT NULL,
  used        INTEGER NOT NULL DEFAULT 0,
  created_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_im_ticket_exp ON im_ws_tickets(expires_at);

-- 可选：敏感词。旧站已有一张 chat_filter_words，新站独立一张，避免共用升级风险
CREATE TABLE IF NOT EXISTS im_filter_words (
  word TEXT PRIMARY KEY
);
```

**建表入口**：`POST /api/chat/init`（`X-Admin-Key: env.KEY`），幂等 `CREATE TABLE IF NOT EXISTS`。
同时把 `initChatTables()` 挂进 `src/index.js` 的 `scheduled()`，跟 `cleanExpiredKv` 一起跑。

### 5.6 定时清理（cron `*/30`，扩展 `scheduled()`）

```js
await cleanExpiredTickets(env.db);     // im_ws_tickets.expires_at <= now
await cleanExpiredFriendRequests(env.db); // pending 超过 30 天 → expired
await pruneOrphanConversations(env.db);   // 无成员 / 群已解散的会话
```

---

## 6. 隐私与搜索

### 6.1 搜索入口

```
GET /api/chat/users/search?q=<关键词>&by=all|uid|username|email|bio&limit=20&cursor=<sub>
```

- `by=all`（默认）：按目标用户各自的开关命中，任一路径允许即可返回。
- 精确语义：

| by | SQL | 隐私位 |
|---|---|---|
| `uid` | `im_users.sub = ?` | `search_by_uid` |
| `username` | `lower(online_users.username) = lower(?)`（可选前缀 `prefix`） | `search_by_username` |
| `email` | `lower(online_users.email) = lower(?)` | `search_by_email` |
| `bio` | `im_users.bio LIKE '%'||?||'%'`（第一期）；量大再上 FTS5 trigram | `search_by_bio` |

- 所有查询先过总开关：`im_user_settings.discoverable = 1`。
- 排除：自己、`status != 'active'`、AY 被封禁、双向黑名单。
- 分页用 `cursor = 上一页最后一个 sub`，按 `sub ASC`。

### 6.2 返回与脱敏

```json
{
  "users": [
    {
      "sub": 42,
      "username": "alice",
      "display_name": "Alice",
      "avatar": "https://...",
      "bio": "今天也在写 Bug",
      "matched_by": ["username"],
      "email": "a***@qq.com",          // 仅当被邮箱命中且开关允许
      "relation": "none",             // none | pending_out | pending_in | friend | blocked_by_me | blocked_me
      "last_seen_at": 1730000000000   // 仅 show_online=1 时返回
    }
  ],
  "next_cursor": 87
}
```

**原则**：能被搜到 ≠ 能拿到全部资料。邮箱永远打码；简介按长度截断；不返回 AY 的注册时间。

### 6.3 用户名片

```
GET /api/chat/users/{sub}
```

返回同上的公开字段 + `relation` + 共同群数量。被拉黑/不可见时返回 404 `USER_NOT_FOUND`（不暴露存在性）。

### 6.4 防滥用

| 接口 | 限制 |
|---|---|
| 搜索 | 30 次 / 分钟 / 用户（`env.limiter.limit({ key: "search:" + sub })`） |
| 好友申请 | 20 条 / 天 / 用户；同一目标 24h 内最多 1 条 |
| 加群 | 10 个 / 小时 / 用户 |
| 邀请码尝试 | 10 次 / 小时 / 用户，失败计数在 DO 或 limiter |

---

## 7. 会话、消息与保留

### 7.1 会话类型与 id

| 类型 | id 规则 | 说明 |
|---|---|---|
| DM | `d:{min(a,b)}:{max(a,b)}` | 确定性，天然防重复 |
| 群 | `g:{group_id}` | 建群时同事务创建 |

建 DM：`POST /api/chat/conversations/dm { sub }`，`INSERT OR IGNORE` 后返回会话。
校验顺序：目标存在 → 未拉黑 → `allow_dm`（`friends` 时必须是好友）→ 建会话。

### 7.2 消息内容格式

`type` + `content`（JSON 字符串，服务端做 schema 校验）：

```jsonc
// text
{ "text": "你好", "mentions": [42] }

// image
{ "url": "https://files.undz.cn/files/xxxx", "width": 800, "height": 600,
  "size": 123456, "mime": "image/png", "name": "a.png" }

// file
{ "url": "https://files.undz.cn/files/xxxx", "name": "报告.pdf",
  "size": 1048576, "mime": "application/pdf" }

// system（服务端生成，客户端只读）
{ "event": "member_join", "sub": 42, "actor": 1 }
```

限制：

- `text` 1–4000 字符；整帧 ≤ 32 KB（`MAX_MESSAGE_BYTES`）。
- 富媒体走已有的 `files.undz.cn`，聊天只存 URL，不落 R2 副本（节省存储与带宽）。
- URL 必须匹配 `https://files.undz.cn/` 或白名单域名，防止被当图床外链。
- 文本服务端做：去首尾空白、`\u0000` 过滤、敏感词（`im_filter_words`，命中即拒或降级为 `blocked` 提示）。

### 7.3 消息保留（需求核心）

| 会话 | 上限 | 实现 |
|---|---|---|
| 群 | 200 条 / 群 | 每条消息后检查，超过 `200 + 32` 时裁剪到 200 |
| DM | 300 条 / 会话 | 同上，阈值 `300 + 32` |

裁剪策略（避免每条消息都跑一次 `DELETE` 的高成本）：

```js
// 插入后
UPDATE im_conversations SET message_count = message_count + 1, last_message_id = ?, last_message_at = ?
 WHERE id = ?;

// 仅当 message_count > limit + 32 时（每约 32 条触发一次）
DELETE FROM im_messages
 WHERE conversation_id = ?
   AND id NOT IN (
     SELECT id FROM im_messages
      WHERE conversation_id = ?
      ORDER BY id DESC
      LIMIT ?          -- 200 或 300
   );
```

- **硬删除**，不保留冷数据；需要留存证据的场景请提前说（可加 `im_messages_archive`）。
- 删除后 `message_count` 回写为 `limit`。
- API 默认页大小 50，最大不超过该会话上限。

> 如果你要的是「只限制查询条数、底层永久保留」，把裁剪那段换成配置开关即可，
> 见 §14-Q2。我推荐硬保留：和你描述的「最多保留 200/300 条」语义一致，也省 D1 存储。

### 7.4 游标与增量同步

历史接口统一用**消息自增 id** 做游标，不用时间戳（同一毫秒并发会乱序）：

```
GET /api/chat/conversations/{id}/messages?before_id=&after_id=&limit=50
```

- 进入会话：不带参数，返回最近 50 条。
- 上翻：`before_id=<最早一条的 id>`。
- 断线补齐：`after_id=<本地最大 id>`，循环拉到 `has_more=false`。

### 7.5 已读与未读

- 客户端上报：WS `message.read {conversation_id, up_to_message_id}`（REST 兜底同路径）。
- 服务端只写 `im_conversation_state.last_read_id = MAX(旧值, 新值)`。
- 未读数在会话列表现算（保留策略让每会话最多 200/300 行，成本可控）：

```sql
SELECT c.id, c.type, c.last_message_id, c.last_message_at,
       (SELECT COUNT(*) FROM im_messages m
         WHERE m.conversation_id = c.id
           AND m.id > COALESCE(s.last_read_id, 0)
           AND m.sender_sub != ?) AS unread
  FROM im_conversations c
  JOIN im_conversation_state s
    ON s.conversation_id = c.id AND s.sub = ?
 WHERE ...
```

> 群里 1000 人时不做「逐成员 unread 自增」，避免每条消息 1000 次写。
> 代价是列表接口多一点查询；以本项目规模完全可接受。

---

## 8. WebSocket 协议规范

### 8.1 连接

```
wss://chat.undz.cn/ws?ticket=<64 hex>
```

- 非 upgrade 请求返回 426。
- ticket 无效/过期/已用 → 401，直接关闭（不 upgrade）。
- 连接成功 → 服务端先发 `ready`。
- 一条连接覆盖该用户**所有**会话；多端各自一条，互不影响。

### 8.2 帧格式

统一 JSON 文本帧：

```json
{
  "v": 1,
  "type": "message.send",
  "id": "c-7f3a...",          // 客户端请求 id（服务端在 ack/error 里回带 reply_to）
  "ts": 1730000000000,
  "data": { }
}
```

服务端推送：

```json
{
  "v": 1,
  "type": "message.new",
  "id": "s-...",              // 服务端事件 id
  "ts": 1730000000000,
  "data": { }
}
```

- 未知 `type` → 忽略并回 `error {code:"UNKNOWN_TYPE"}`（向前兼容）。
- 超过 32 KB 的帧 → `error {code:"MESSAGE_TOO_LARGE"}` 并计一次限流。
- 二进制帧不支持（图片先上传再发 URL）。

### 8.3 客户端 → 服务端

| type | data | 说明 |
|---|---|---|
| `ping` | `{}` | 心跳，25s 一次 |
| `message.send` | `{conversation_id, client_msg_id, type, content, reply_to_id?}` | 发消息 |
| `message.read` | `{conversation_id, up_to_message_id}` | 已读 |
| `message.recall` | `{message_id}` | 撤回（2 分钟内、仅自己） |
| `typing` | `{conversation_id, state:"start"\|"stop"}` | 输入中（不落库） |
| `presence.subscribe` | `{subs:[...]}` | 订阅好友在线状态（二期） |
| `pong` | `{}` | 回应服务端 ping |

### 8.4 服务端 → 客户端

| type | data | 触发 |
|---|---|---|
| `ready` | `{sub, session_id, server_time, max_frame, heartbeat}` | 连接建立 |
| `message.ack` | `{client_msg_id, message_id, conversation_id, created_at}` | 发送成功 |
| `message.new` | `{message:{...}}` | 收到新消息（含自己其他端） |
| `message.recalled` | `{conversation_id, message_id, by_sub}` | 撤回 |
| `read.update` | `{conversation_id, sub, up_to_message_id}` | 对方已读（仅 DM 默认开启） |
| `typing` | `{conversation_id, sub, state}` | 输入中 |
| `friend.request` | `{request:{id, from_sub, message, created_at}}` | 新好友申请 |
| `friend.accepted` | `{sub}` | 对方同意 |
| `contact.update` | `{action:"add"\|"remove", sub}` | 通讯录变化 |
| `conversation.update` | `{conversation:{...}, action:"add"\|"update"\|"remove"}` | 群变更/被拉入/被踢 |
| `group.member` | `{group_id, action, sub, actor}` | 成员进出/角色变化 |
| `presence` | `{sub, online, last_seen_at}` | 在线状态（二期） |
| `system` | `{event:"kicked"\|"maintenance", reason}` | 被踢/维护 |
| `pong` | `{server_time}` | 心跳回应 |
| `error` | `{code, error_code, message, reply_to?}` | 任何失败 |

### 8.5 消息对象（`message.new` / 历史接口共用）

```json
{
  "id": 10086,
  "conversation_id": "d:12:34",
  "type": "text",
  "content": { "text": "晚上吃啥" },
  "sender": { "sub": 12, "username": "alice", "display_name": "Alice", "avatar": "https://..." },
  "reply_to_id": null,
  "client_msg_id": "c-7f3a",
  "status": "normal",
  "created_at": 1730000000000
}
```

`sender` 每次内联，避免前端再查；代价是消息体变大（200 条一页可接受）。

### 8.6 心跳与断线

- 客户端 25s `ping`；服务端 30s 未收到任何帧 → 关连接（close 4000）。
- 服务端可用 Hibernation 的 `setWebSocketAutoResponse(new WebSocketRequestResponsePair("ping","pong"))`，
  让心跳不唤醒 DO，进一步省钱。
- 断线重连：重新取 ticket → 连上 → 对每个打开的会话 `after_id` 补齐。
- 会话最长 24h 强制断开，客户端静默重连。

### 8.7 顺序与幂等

- 服务端以 D1 `id` 为全局顺序；同一会话内单调递增。
- 客户端按 `id` 排序、按 `id` 去重（多端/重连会重复收到）。
- 发送失败重试必须复用同一 `client_msg_id`（24h 内）。

---

## 9. REST 接口清单

前缀 `/api/chat`。登录态列：`Cookie/Bearer` = 需登录；`Active` = 还需已激活；
`Admin` = `X-Admin-Key`；`ChatAdmin` = `im_admins` 或 `sub===1`。

### 9.1 准入

| 方法 | 路径 | 登录态 | 说明 |
|---|---|---|---|
| GET | `/api/chat/gate` | — | 返回登录/激活状态与 `invite_mode` |
| POST | `/api/chat/activate` | Cookie | 激活，`{code?}` |
| POST | `/api/chat/session/ticket` | Active | 换 WS 票据 |
| GET | `/api/chat/test` | — | 健康检查 |
| POST | `/api/chat/init` | Admin | 建表（幂等） |

### 9.2 资料与设置

| 方法 | 路径 | 登录态 | 说明 |
|---|---|---|---|
| GET | `/api/chat/me` | Active | 我的聊天资料 + 设置 + 限额用量 |
| PATCH | `/api/chat/me` | Active | `{display_name, bio, avatar}` |
| GET | `/api/chat/me/settings` | Active | 隐私设置 |
| PATCH | `/api/chat/me/settings` | Active | 改隐私位（见 §6） |
| GET | `/api/chat/me/stats` | Active | 已建群数/上限、好友数、会话数 |

### 9.3 用户与搜索

| 方法 | 路径 | 登录态 | 说明 |
|---|---|---|---|
| GET | `/api/chat/users/search` | Active | `q`、`by`、`limit`、`cursor` |
| GET | `/api/chat/users/{sub}` | Active | 名片 |

### 9.4 通讯录 / 好友 / 黑名单

| 方法 | 路径 | 登录态 | 说明 |
|---|---|---|---|
| GET | `/api/chat/contacts` | Active | 通讯录（按备注/首字母排序） |
| DELETE | `/api/chat/contacts/{sub}` | Active | 删除好友（双向） |
| PATCH | `/api/chat/contacts/{sub}` | Active | 改备注名 |
| GET | `/api/chat/friend-requests?direction=in\|out` | Active | 申请列表 |
| POST | `/api/chat/friend-requests` | Active | `{to_sub \| username \| email, message?}` |
| POST | `/api/chat/friend-requests/{id}/accept` | Active | 同意 |
| POST | `/api/chat/friend-requests/{id}/reject` | Active | 拒绝 |
| DELETE | `/api/chat/friend-requests/{id}` | Active | 撤回 |
| GET | `/api/chat/blocks?q=` | Active | 黑名单（支持按用户名/UID 过滤） |
| POST | `/api/chat/blocks` | Active | `{sub, reason?}` |
| DELETE | `/api/chat/blocks/{sub}` | Active | 移出黑名单 |

### 9.5 会话与消息

| 方法 | 路径 | 登录态 | 说明 |
|---|---|---|---|
| GET | `/api/chat/conversations` | Active | 列表（未读/最后一条/置顶） |
| GET | `/api/chat/conversations/{id}` | Active | 会话详情 |
| POST | `/api/chat/conversations/dm` | Active | `{sub}` 取或建 DM |
| GET | `/api/chat/conversations/{id}/messages` | Active | 历史，`before_id`/`after_id`/`limit` |
| POST | `/api/chat/conversations/{id}/read` | Active | 已读（REST 兜底） |
| PATCH | `/api/chat/conversations/{id}` | Active | 置顶/免打扰/隐藏 |
| DELETE | `/api/chat/conversations/{id}` | Active | 隐藏会话（不删消息） |

### 9.6 群组

| 方法 | 路径 | 登录态 | 说明 |
|---|---|---|---|
| POST | `/api/chat/groups` | Active | 建群（≤20 个） |
| GET | `/api/chat/groups/{id}` | 成员 | 群资料 |
| PATCH | `/api/chat/groups/{id}` | owner/admin | 改名/简介/头像/join_mode |
| DELETE | `/api/chat/groups/{id}` | owner | 解散 |
| GET | `/api/chat/groups/{id}/members?cursor=` | 成员 | 成员列表 |
| POST | `/api/chat/groups/{id}/members` | owner/admin | `{subs:[]}` 拉人（≤1000） |
| DELETE | `/api/chat/groups/{id}/members/{sub}` | owner/admin | 踢人 |
| PATCH | `/api/chat/groups/{id}/members/{sub}` | owner | 设/撤管理员、禁言 |
| POST | `/api/chat/groups/{id}/leave` | 成员 | 退群 |
| POST | `/api/chat/groups/{id}/invite-code` | owner/admin | 生成/轮换群邀请码 |
| POST | `/api/chat/groups/join` | Active | `{code}` 加群 |
| GET | `/api/chat/groups/mine?role=owner\|member` | Active | 我的群 |

> 「每人最多 20 个群」= **创建/拥有** 20 个；加入数量不设上限（需求原文）。
> 建群时 `SELECT COUNT(*) FROM im_groups WHERE owner_sub=? AND status='active'`，
> 加上 `member_count < max_members` 的原子条件更新防并发超限。

### 9.7 管理

| 方法 | 路径 | 登录态 | 说明 |
|---|---|---|---|
| GET | `/api/chat/admin/invite-codes` | ChatAdmin | 列表（含用量/过期/备注） |
| POST | `/api/chat/admin/invite-codes` | ChatAdmin | 批量生成 `{count, max_uses, expires_at, note}` |
| PATCH | `/api/chat/admin/invite-codes/{code}` | ChatAdmin | 停用/改备注 |
| GET | `/api/chat/admin/stats` | ChatAdmin | 用户/群/消息量 |
| POST | `/api/chat/admin/users/{sub}/suspend` | ChatAdmin | 停用/恢复 |
| POST | `/api/chat/admin/users/{sub}/kick` | ChatAdmin | 踢下线 |
| GET | `/api/chat/admin/admins` | ChatAdmin | 管理员列表 |
| POST | `/api/chat/admin/admins` | ChatAdmin | 授权（仅 `sub===1`） |

管理接口放 `chat.undz.cn` 而不是 `console.undz.cn`：和业务同域、同鉴权、少一次跨域；
console 前端要展示时把 `https://console.undz.cn` 加进 CORS 白名单即可。

---

## 10. 限流、安全与可观测

### 10.1 限流

| 维度 | 策略 |
|---|---|
| WS 发消息 | 令牌桶，20 条 / 10 秒 / 用户（DO 内存，休眠即重置可接受） |
| WS 连接 | 每用户 ≤ 5 条并发连接（多端），超出踢最旧 |
| REST 搜索 | 30 次 / 分钟 / 用户 |
| 好友申请 | 20 次 / 天 / 用户 |
| 邀请码尝试 | 10 次 / 小时 / 用户 |
| 入群 | 10 次 / 小时 / 用户 |

`env.limiter`（50/10s）继续用于粗粒度 IP 级防护；用户级用 DO 或 `limiter.limit({key})`。

### 10.2 安全

- 所有 SQL 走 `.bind()`，禁止拼字符串（现有代码也是这个风格）。
- 消息内容长度/字节双限；URL 白名单；HTML 不解析（前端用文本/Markdown 渲染，服务端只存原文）。
- WS ticket 只存哈希、60s、一次性；日志脱敏。
- 越权统一返回 404（不区分「不存在」和「没权限」），防止枚举。
- 群操作必须校验 `state='active'` 与角色。
- CORS 白名单：`https://chat.undz.cn`、`https://old.chat.undz.cn`、`https://console.undz.cn`、
  `https://online.undz.cn`，以及 `*-dev` 域名。

### 10.3 可观测

- 入口日志：`method path status ms sub`（`DEBUG` 才打明细）。
- DO 内指标：连接数、消息数、扇出失败数；不要逐条写 D1，按分钟聚合后写一行。
- `/api/chat/health`：返回 DO 可达性、D1 可写、当前在线数（粗略）。

### 10.4 免费额度预算（重要）

Durable Objects 在 Workers Free 计划可用（2025-04-07 起），但**只支持 SQLite 后端**，
且以下额度是每日硬上限，超了不是扣费而是**该类操作直接失败**，UTC 00:00 重置：

| 维度 | Free / 天 | 说明 |
|---|---|---|
| DO 请求 | 100,000 | 连接建立、RPC、入站 WS 消息（20:1 折算）、alarm |
| DO Duration | 13,000 GB-s | 约等于 128MB 对象累计 104,000 秒 ≈ 28.9 小时 |
| 行读取 | 5,000,000 | 与 D1 额度分开计（DO SQLite 自己的） |
| 行写入 | 100,000 | 同上 |
| 存储 | 5 GB | 账户级 |
| DO 类 | 100 | 无压力 |

D1 免费额度：**5M 行读 / 10 万行写 / 5 GB**，与 DO 分开计。

**计费要点**：

- 建立一条 WS 连接 = 1 次 DO 请求；**下行推送不计费**；上行消息按 20:1 折算。
- `state.setWebSocketAutoResponse()` 处理的心跳不计 duration。
- ⚠️ **必须用 `state.acceptWebSocket()`（Hibernation API）**。用 `server.accept()` 会在整条
  连接期间持续计 duration：100 个用户各挂 8 小时 ≈ 2,880,000 秒 × 128MB ≈ **25,600 GB-s/天**，
  直接超 13,000 的额度一倍。用 Hibernation 后只有处理消息的那几十毫秒计费。
- 不要在 DO 里逐条写 storage 做限流/在线状态：会吃掉「行写入 10 万/天」。限流计数放内存。

**本设计的估算**（100 用户、5,000 条消息/天、平均 3 个在线收件人）：

| 资源 | 估算 | 占比 |
|---|---|---|
| DO 请求 | 约 1.6 万 / 天 | 16% |
| D1 行写入 | 约 2.5 万 / 天（约 5 行/消息，含索引与裁剪摊销） | 25% |
| Duration | 约 1,000–2,000 秒 / 天 | ~1% |
| 存储 | 文本消息 200/300 条保留，远低于 5 GB | <10% |

**唯一会打爆额度的是大群扇出**：1000 人群若有 200 人在线，每条消息 200 次 RPC，
500 条/天就用光 10 万请求。缓解方案（P2 再定，接口先预留）：

1. 在线人数超过阈值（如 50）的群，改用「群 DO 本地广播」：消息只 1 次 RPC 到群 DO，
   由它分发给挂着该群的 socket；
2. 或者对这类群降级为「只推给正在看该群的在线成员」，其余人靠拉取。

> 因此 §9.6 的群接口不暴露「推送模式」，由服务端按群规模自动选择，前端无感。

---

## 11. `config.js` 草案

```js
// services/chat/config.js
// 改这里 = 改线上行为。支持环境变量覆盖，便于不改代码灰度。

const envOr = (env, key, fallback) => env?.[key] ?? fallback;

// ── 邀请码 ──
export const INVITE_MODE = "optional"; // off | optional | required

// ── 群组 ──
export const MAX_GROUPS_OWNED   = 20;
export const MAX_GROUP_MEMBERS  = 1000;
export const GROUP_NAME_MAX     = 40;
export const GROUP_DESC_MAX     = 500;

// ── 消息 ──
export const GROUP_MESSAGE_RETAIN = 200;   // 每群保留
export const DM_MESSAGE_RETAIN    = 300;   // 每单聊保留
export const RETAIN_SLACK         = 32;    // 超过 limit+slack 才触发裁剪
export const MAX_MESSAGE_CHARS    = 4000;
export const MAX_MESSAGE_BYTES    = 32 * 1024;
export const MESSAGE_PAGE_DEFAULT = 50;
export const MESSAGE_PAGE_MAX     = 300;
export const RECALL_WINDOW_MS     = 2 * 60 * 1000;

// ── WS ──
export const WS_TICKET_TTL_MS   = 60 * 1000;
export const WS_MAX_FRAME_BYTES = 32 * 1024;
export const WS_HEARTBEAT_MS    = 25 * 1000;
export const WS_IDLE_TIMEOUT_MS = 75 * 1000;
export const WS_SESSION_MAX_MS  = 24 * 60 * 60 * 1000;
export const WS_MAX_CONN_PER_USER = 5;
export const FANOUT_BATCH       = 50;

// ── 限流 ──
export const RATE_SEND      = { windowMs: 10_000, max: 20 };
export const RATE_SEARCH    = { windowMs: 60_000, max: 30 };
export const RATE_FRIEND_REQ= { windowMs: 86_400_000, max: 20 };
export const RATE_JOIN      = { windowMs: 3_600_000, max: 10 };

// ── 隐私默认值 ──
export const DEFAULT_SETTINGS = {
  discoverable: 1,
  search_by_uid: 1,
  search_by_username: 1,
  search_by_email: 0,
  search_by_bio: 1,
  allow_dm: "all",
  allow_friend_request: 1,
  allow_group_invite: 1,
  show_online: 1,
};

// ── 域名 ──
export const ALLOWED_ORIGINS = [
  "https://chat.undz.cn",
  "https://old.chat.undz.cn",
  "https://console.undz.cn",
  "https://online.undz.cn",
  "https://chat-dev.undz.cn",
];

export const getInviteMode = (env) =>
  envOr(env, "CHAT_INVITE_MODE", INVITE_MODE);
```

`wrangler.toml` 增加：

```toml
[[durable_objects.bindings]]
name = "CHAT_SESSION"
class_name = "ChatSession"

[[migrations]]
tag = "v1"
new_sqlite_classes = ["ChatSession"]   # 免费计划只支持 SQLite 后端，必须用这个
```

> 如果你想用环境变量临时切模式，在 `[vars]` 里加 `CHAT_INVITE_MODE = "optional"` 即可。

---

## 12. 错误码（1600–1699 新段）

要同步改三处：`shared/error-codes.js`（常量 + `ERROR_CODES` + `ERROR_MESSAGES` + `ERROR_STATUS`）、
`shared/README.md` 的号段表、以及（将来）前端 SDK 文案。

| 号 | 常量 | HTTP | 含义 |
|---|---|---|---|
| 1600 | `CHAT_NOT_ACTIVATED` | 409 | 未激活聊天账号 |
| 1601 | `INVITE_REQUIRED` | 409 | 该模式必须填写邀请码 |
| 1602 | `INVITE_INVALID` | 400 | 邀请码无效 |
| 1603 | `INVITE_EXPIRED` | 400 | 邀请码已过期 |
| 1604 | `INVITE_EXHAUSTED` | 400 | 邀请码次数用尽 |
| 1605 | `CHAT_USER_SUSPENDED` | 403 | 聊天账号被停用 |
| 1606 | `USER_NOT_FOUND` | 404 | 用户不存在或不可见 |
| 1607 | `USER_NOT_SEARCHABLE` | 403 | 对方未开放该搜索渠道 |
| 1608 | `CANNOT_ADD_SELF` | 400 | 不能加自己 |
| 1609 | `FRIEND_REQUEST_EXISTS` | 409 | 已有待处理申请 |
| 1610 | `ALREADY_FRIENDS` | 409 | 已经是好友 |
| 1611 | `FRIEND_REQUEST_NOT_FOUND` | 404 | 申请不存在/无权处理 |
| 1612 | `CHAT_BLOCKED` | 403 | 已被对方拉黑或已拉黑对方 |
| 1613 | `GROUP_LIMIT_REACHED` | 403 | 建群数已达上限 |
| 1614 | `GROUP_MEMBER_LIMIT` | 403 | 群成员已满 |
| 1615 | `GROUP_NOT_FOUND` | 404 | 群不存在/不可见 |
| 1616 | `GROUP_PERMISSION_DENIED` | 403 | 非群主/管理员 |
| 1617 | `GROUP_NOT_JOINABLE` | 403 | 群不允许加入 |
| 1618 | `ALREADY_MEMBER` | 409 | 已在群内 |
| 1619 | `NOT_MEMBER` | 403 | 不在群内 |
| 1620 | `MESSAGE_TOO_LARGE` | 413 | 消息超长/超大 |
| 1621 | `MESSAGE_REJECTED` | 400 | 敏感词/空消息 |
| 1622 | `RATE_LIMITED` | 429 | 触发限流 |
| 1623 | `CONVERSATION_NOT_FOUND` | 404 | 会话不存在 |
| 1624 | `NOT_CONVERSATION_MEMBER` | 403 | 非会话成员 |
| 1625 | `MESSAGE_NOT_FOUND` | 404 | 消息不存在 |
| 1626 | `RECALL_WINDOW_EXPIRED` | 403 | 超过撤回时限 |
| 1627 | `WS_TICKET_INVALID` | 401 | 票据无效/过期/已用 |
| 1628 | `WS_PROTOCOL_ERROR` | 400 | 帧格式/未知类型 |
| 1629 | `DM_NOT_ALLOWED` | 403 | 对方只接受好友私聊 |
| 1630 | `INVALID_CONTENT_TYPE` | 400 | 消息类型不支持 |
| 1631 | `INVITE_MODE_UNSUPPORTED` | 500 | 配置值非法 |

`errorPayload(code)` 直接复用现有工具；WS 的 `error.data.code` 用字符串（如 `RATE_LIMITED`），
`error_code` 用数字，两者都返回，前端任选。

---

## 13. 实施顺序（建议）

| 阶段 | 内容 | 产出 |
|---|---|---|
| P0 | 目录/路由迁移、`im_*` 建表、gate/activate、ticket、DO 骨架 | 能连上 WS，收到 `ready` |
| P1 | 资料/设置、搜索、好友/黑名单/通讯录、DM 与消息收发、已读 | 可 1v1 聊天 |
| P2 | 群组 CRUD/成员/邀请码、群消息、保留裁剪、系统事件 | 可群聊 |
| P3 | 管理端邀请码、封停/踢人、统计、限流完善 | 可运营 |
| P4 | typing、撤回、在线状态、多端细节、压测 | 体验完善 |

P0/P1 完成即可给前端联调；协议在 P0 定稿后不再改字段名（只加不改）。

---

## 14. 待你确认

1. **免费额度够不够？** DO 免费计划可用（仅 SQLite 后端），但 10 万请求/天、13,000 GB-s/天
   是硬上限。按 §10.4 的估算日常够用，大群扇出是风险点。要不要一开始就上付费计划（$5/月）省心？
2. **消息保留是硬删除，还是只限制查询？** 我按「硬删除，群 200 / DM 300」设计。
3. **DM 的 300 条是「每个单聊会话」还是「每个用户总量」？** 我按前者。
4. **「每人 20 个群」是创建/拥有上限**，加入不限 —— 确认。
5. **黑名单是否影响群聊？** 我按「只影响搜索/加好友/私聊，群内仍可见」设计。
6. **邀请码谁可以发？** 第一期建议仅管理员；要不要开放老用户生成（带配额）？
7. **搜索简介是模糊匹配还是精确？** 我按 `LIKE '%q%'`（中文不分词），量大再换 FTS5。
8. **聊天管理员怎么定？** 我建议新建 `im_admins`，不再沿用硬编码 `sub===1`（但 1 号仍是超级管理员）。
9. **消息要不要支持图片/文件？** 我按「只存 `files.undz.cn` 的 URL」设计；若要服务端落盘再议。
10. **旧站 `c.undz.cn` 保持指向旧站**，还是 301 到新站？
11. 群主退群/销号后，群是**转给管理员**、**自动解散**，还是**冻结**？
12. 是否需要「已读回执」和「在线状态」（都会增加推送量与隐私面）？
