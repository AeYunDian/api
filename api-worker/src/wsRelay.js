// wsRelay.js - Ay WebSocket Relay Worker
// ============================================================
//  Ay WS Relay - 单域名 WebSocket 中继
//  协议: PSP 1.0
//  功能: peer 在线登记 / 发现 / 点对点消息转发 / 离线队列
// ============================================================
import { getAssetsWithDomain } from "./utils.js";
const PSP_VERSION = "1.0";
const WORKER_VERSION = "0.2.0";

// 本 relay 对外的身份标识（用于协议里的 from 字段）
const RELAY_PEER_ID = "relay";

// ---------------- 协议定义 ----------------

const DISCOVERY_TYPES = new Set([
  "announce",
  "withdraw",
  "discover",
  "peer_list",
  "redirect",
]);
const NEGOTIATION_TYPES = new Set([
  "connect_request",
  "connect_accept",
  "connect_reject",
  "offer",
  "answer",
  "ice_candidate",
  "ice_end",
  "renegotiate",
]);
const CONTROL_TYPES = new Set(["ping", "pong", "bye", "error", "ack"]);
const EXTENSION_TYPES = new Set(["ext"]);

const MESSAGE_TYPES = new Set([
  ...DISCOVERY_TYPES,
  ...NEGOTIATION_TYPES,
  ...CONTROL_TYPES,
  ...EXTENSION_TYPES,
]);

const MAX_ID_LEN = 128; // network / peerId / session_id 最大长度
const MAX_SESSION_ID_LEN = 128;

const VALID_ID_CHARS = /^[a-zA-Z0-9_.:-]+$/;
const announcedPeers = new Set();
// 需要点对点转发（在线直投 / 离线入队）的消息类型
const RELAY_TYPES = new Set([
  "connect_request",
  "connect_accept",
  "connect_reject",
  "offer",
  "answer",
  "ice_candidate",
  "ice_end",
  "renegotiate",
  "bye",
  "error",
  "ack",
  "ext",
  "peer_list",
  "redirect",
]);

// ---------------- 常量 ----------------

const DEFAULT_TTL_MS = 30_000;
const MAX_TTL_MS = 120_000;
const MAX_MESSAGE_SIZE = 64 * 1024;
const MAX_BATCH = 50;
const CLEANUP_INTERVAL_MS = 60_000;

// 防止 network / peerId 中出现分隔符造成 key 冲突
const PEER_KEY_SEP = "\x00";
function peerKeyOf(network, peerId) {
  return network + PEER_KEY_SEP + peerId;
}

// ---------------- 运行时状态（每个 isolate 独立） ----------------

const livePeers = new Map(); // "network\x00peerId" -> { peerId, network, socket, lastSeen }
const networkSubscribers = new Map(); // network -> Set<WebSocket>

let lastCleanupMs = 0;

// ============================================================
//  Worker 入口
// ============================================================

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const upgrade = request.headers.get("Upgrade");

    if (upgrade && upgrade.toLowerCase() === "websocket") {
      if (url.pathname !== "/ws") {
        return jsonResponse(
          { ok: false, error: "WebSocket endpoint is /ws" },
          404,
        );
      }
      return handleWebSocket(request, env, ctx);
    }

    if (url.pathname === "/ws") {
      return jsonResponse(
        { ok: false, error: "Expected WebSocket upgrade on /ws" },
        426,
      );
    }

    if (url.pathname === "/health") {
      return jsonResponse(
        {
          ok: true,
          version: WORKER_VERSION,
          protocol_version: PSP_VERSION,
          peers: livePeers.size,
          networks: networkSubscribers.size,
        },
        200,
      );
    }

    if (env.assets?.fetch) {
      return getAssetsWithDomain(request, env);
    }
    return jsonResponse({ error: "404 Not Found" }, 404);
  },
};

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export async function initPspTables(db) {
  await db
    .prepare(
      `
        CREATE TABLE IF NOT EXISTS psp_announcements (
            network TEXT NOT NULL,
            peer_id TEXT NOT NULL,
            session_id TEXT,
            expires_at_ms INTEGER NOT NULL,
            updated_at_ms INTEGER NOT NULL,
            PRIMARY KEY (network, peer_id)
        )
    `,
    )
    .run();
  await db
    .prepare(
      `CREATE INDEX IF NOT EXISTS idx_psp_ann_expires ON psp_announcements(expires_at_ms)`,
    )
    .run();
  await db
    .prepare(
      `CREATE INDEX IF NOT EXISTS idx_psp_ann_network ON psp_announcements(network, expires_at_ms)`,
    )
    .run();

  await db
    .prepare(
      `
        CREATE TABLE IF NOT EXISTS psp_relay (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            network TEXT NOT NULL,
            to_peer_id TEXT NOT NULL,
            type TEXT NOT NULL,
            session_id TEXT,
            message_json TEXT NOT NULL,
            expires_at_ms INTEGER NOT NULL,
            created_at_ms INTEGER NOT NULL
        )
    `,
    )
    .run();
  await db
    .prepare(
      `CREATE INDEX IF NOT EXISTS idx_psp_relay_lookup ON psp_relay(network, to_peer_id, expires_at_ms)`,
    )
    .run();
}
// 抽出公共函数
function removeSocketFromNetwork(socket, network) {
  const sockets = networkSubscribers.get(network);
  if (sockets) {
    sockets.delete(socket);
    if (sockets.size === 0) networkSubscribers.delete(network);
  }
}
function isValidId(s, maxLen = MAX_ID_LEN) {
  return (
    typeof s === "string" &&
    s.length > 0 &&
    s.length <= maxLen &&
    VALID_ID_CHARS.test(s)
  );
}
// ============================================================
//  WebSocket 处理
// ============================================================

function handleWebSocket(request, env, ctx) {
  const { 0: client, 1: server } = new WebSocketPair();

  let peerKey = null;
  let network = null;
  let peerId = null;

  function cleanupPeerState() {
    const currentNetwork = network;
    if (!network || !peerId) return currentNetwork;

    const currentPeerId = peerId;
    const key = peerKeyOf(currentNetwork, currentPeerId);

    // 只有当 livePeers 里记录的还是本连接时才清
    const current = livePeers.get(key);
    if (current && current.socket === server) {
      livePeers.delete(key);
      announcedPeers.delete(key);
      if (env.db) {
        ctx.waitUntil(
          deleteAnnouncement(env.db, currentNetwork, currentPeerId)
            .then(() => broadcastPeerList(env.db, currentNetwork))
            .catch(() => {}),
        );
      }
    }

    peerKey = null;
    peerId = null;
    network = null;
    return currentNetwork;
  }

  server.addEventListener("message", async (event) => {
    try {
      const result = await handleClientMessage(
        server,
        event.data,
        env,
        ctx,
        peerKey,
        network,
      );
      if (result) {
        peerKey = result.peerKey;
        network = result.network;
        peerId = result.peerId;
      }
    } catch (err) {
      if (env.DEBUG) console.error("[WS] Error:", err?.message || String(err));
      try {
        server.send(
          JSON.stringify({
            psp_version: PSP_VERSION,
            type: "error",
            from: RELAY_PEER_ID,
            to: "client",
            body: { error: err?.message || "Unknown error" },
          }),
        );
      } catch {}
    }
  });

  const detach = () => {
    const subscriberNetwork = cleanupPeerState();
    if (subscriberNetwork) {
      removeSocketFromNetwork(server, subscriberNetwork);
    }
  };

  server.addEventListener("close", detach);
  server.addEventListener("error", detach);

  server.accept();
  return new Response(null, { status: 101, webSocket: client });
}

// ============================================================
//  消息路由
// ============================================================

async function handleClientMessage(
  socket,
  rawData,
  env,
  ctx,
  prevPeerKey = null,
  prevNetwork = null,
) {
  try {
    if (!rawData) return null;
    const size =
      typeof rawData === "string"
        ? new TextEncoder().encode(rawData).byteLength
        : (rawData.byteLength ?? 0);

    if (size > MAX_MESSAGE_SIZE) {
      try {
        socket.send(
          JSON.stringify({
            psp_version: PSP_VERSION,
            type: "error",
            from: RELAY_PEER_ID,
            to: "client",
            body: { error: "Message too large" },
          }),
        );
      } catch {}
      return null;
    }

    let message;
    try {
      message = JSON.parse(rawData);
    } catch {
      socket.send(
        JSON.stringify({
          psp_version: PSP_VERSION,
          type: "error",
          from: RELAY_PEER_ID,
          to: "client",
          body: { error: "Invalid JSON" },
        }),
      );
      return null;
    }

    if (!validEnvelope(message)) {
      socket.send(
        JSON.stringify({
          psp_version: PSP_VERSION,
          type: "error",
          from: RELAY_PEER_ID,
          to: message?.from || "unknown",
          body: { error: "Invalid PSP envelope" },
        }),
      );
      if (env.DEBUG) {
        console.warn("[RELAY] Rejected envelope:", {
          from: message?.from,
          network: message?.network,
          type: message?.type,
        });
      }
      return null;
    }

    const { network, from: peerId, type } = message;
    const db = env.db;
    const peerKey = peerKeyOf(network, peerId);

    // 不转发给自己
    if (message.to && message.to === peerId && RELAY_TYPES.has(type)) {
      return { peerKey, network, peerId };
    }

    // 订阅 network
    if (prevNetwork && prevNetwork !== network) {
      const oldSockets = networkSubscribers.get(prevNetwork);
      if (oldSockets) oldSockets.delete(socket);
      if (prevPeerKey) livePeers.delete(prevPeerKey);
    }

    if (!networkSubscribers.has(network)) {
      networkSubscribers.set(network, new Set());
    }
    networkSubscribers.get(network).add(socket);

    // 更新 live 状态
    const isHeartbeat = announcedPeers.has(peerKey) && prevPeerKey === peerKey;
    if (type === "announce") {
      livePeers.set(peerKey, { peerId, network, socket, lastSeen: Date.now() });
      if (db) {
        await upsertAnnouncement(db, message);
        await deliverQueuedRelayMessages(db, socket, network, peerId);
      }

      // wasLive && 同 socket 同 peer = 真心跳
      // wasLive = false（withdraw/bye 后重新 announce）= 需要广播
      if (!isHeartbeat && db) {
        if (env.DEBUG)
          console.log(
            `[NET] Broadcasting peer_list for ${network} after new announce from ${peerId}`,
          );
        announcedPeers.add(peerKey);
        broadcastPeerList(db, network).catch((err) => {
          if (env.DEBUG) console.error("[Broadcast error]", err?.message);
        });
      }
    } else if (type === "withdraw" || type === "bye") {
      if (db) await deleteAnnouncement(db, network, peerId);
      announcedPeers.delete(peerKey);
      livePeers.delete(peerKey);
      removeSocketFromNetwork(socket, network);
      if (db) broadcastPeerList(db, network).catch(() => {});
    } else if (type === "discover") {
      let peers = [];
      if (db) peers = await findPeers(db, network, peerId);
      try {
        sendPeerList(
          socket,
          network,
          peers.filter((p) => p.peer_id !== peerId),
          peerId,
          RELAY_PEER_ID,
        );
      } catch {}
    } else if (type === "ping") {
      socket.send(
        JSON.stringify({
          psp_version: PSP_VERSION,
          type: "pong",
          network,
          from: RELAY_PEER_ID,
          to: peerId,
          message_id: crypto.randomUUID(),
          timestamp: Date.now(),
          ttl_ms: DEFAULT_TTL_MS,
          body: {},
        }),
      );
      if (db) await deliverQueuedRelayMessages(db, socket, network, peerId);
    } else if (RELAY_TYPES.has(type)) {
      if (!message.to) return { peerKey, network, peerId };
      if (message.to === peerId) return { peerKey, network, peerId };

      // 在线直投
      const liveKey = peerKeyOf(network, message.to);
      const live = livePeers.get(liveKey);
      let deliveredLive = false;

      if (live) {
        try {
          live.socket.send(rawData);
          deliveredLive = true;
          if (env.DEBUG)
            console.log(
              `[RELAY] Delivered ${type} from ${peerId} to ${message.to}`,
            );
        } catch (err) {
          if (env.DEBUG)
            console.error(
              `[RELAY] Failed to deliver to ${message.to}:`,
              err?.message,
            );
        }
      }

      // 离线或失败 → 入队
      if (!deliveredLive) {
        if (db) {
          await insertRelayMessage(db, message);
          if (env.DEBUG)
            console.log(
              `[RELAY] Queued ${type} for ${message.to}${live ? " (live send failed)" : " (offline)"}`,
            );
        } else {
          if (env.DEBUG)
            console.warn(
              `[RELAY] Could not deliver ${type} to ${message.to}; persistence unavailable`,
            );
        }
      }
    }

    maybeCleanup(db, ctx);
    return { peerKey, network, peerId };
  } catch (err) {
    if (env.DEBUG)
      console.error("[Handler] Error:", err?.message || String(err));
    return null;
  }
}

// ============================================================
//  Peer 列表广播
// ============================================================

function sendPeerList(socket, network, peers, to = null, from = RELAY_PEER_ID) {
  socket.send(
    JSON.stringify({
      psp_version: PSP_VERSION,
      type: "peer_list",
      network,
      from,
      to,
      message_id: crypto.randomUUID(),
      timestamp: Date.now(),
      ttl_ms: DEFAULT_TTL_MS,
      body: { peers },
    }),
  );
}

async function broadcastPeerList(db, network) {
  const sockets = networkSubscribers.get(network);
  if (!sockets || sockets.size === 0) return;

  const now = Date.now();
  const result = await db
    .prepare(
      `
    SELECT peer_id, session_id, updated_at_ms
    FROM psp_announcements
    WHERE network = ?1 AND expires_at_ms > ?2
    ORDER BY peer_id ASC
    LIMIT ?3
  `,
    )
    .bind(network, now, MAX_BATCH)
    .all();

  const peers = (result.results || []).map((row) => ({
    peer_id: row.peer_id,
    session_id: row.session_id,
    timestamp: row.updated_at_ms,
  }));

  for (const socket of Array.from(sockets)) {
    try {
      sendPeerList(socket, network, peers);
    } catch {
      sockets.delete(socket);
      if (sockets.size === 0) networkSubscribers.delete(network);
      for (const [k, v] of livePeers) {
        if (v.socket === socket) livePeers.delete(k);
      }
    }
  }
}

// ============================================================
//  D1 数据操作
// ============================================================

async function upsertAnnouncement(db, message) {
  const now = Date.now();
  const ttl = Math.min(message.ttl_ms || DEFAULT_TTL_MS, MAX_TTL_MS);
  const expiresAt = now + ttl;

  await db
    .prepare(
      `
    INSERT INTO psp_announcements (network, peer_id, session_id, expires_at_ms, updated_at_ms)
    VALUES (?1, ?2, ?3, ?4, ?5)
    ON CONFLICT(network, peer_id) DO UPDATE SET
      session_id = excluded.session_id,
      expires_at_ms = excluded.expires_at_ms,
      updated_at_ms = excluded.updated_at_ms
  `,
    )
    .bind(
      message.network,
      message.from,
      message.session_id || null,
      expiresAt,
      now,
    )
    .run();
}

async function deleteAnnouncement(db, network, peerId) {
  await db
    .prepare(
      `DELETE FROM psp_announcements WHERE network = ?1 AND peer_id = ?2`,
    )
    .bind(network, peerId)
    .run();
}

async function findPeers(db, network, requesterPeerId) {
  const now = Date.now();
  const result = await db
    .prepare(
      `
    SELECT peer_id, session_id, updated_at_ms
    FROM psp_announcements
    WHERE network = ?1 AND peer_id != ?2 AND expires_at_ms > ?3
    ORDER BY peer_id ASC
    LIMIT ?4
  `,
    )
    .bind(network, requesterPeerId, now, MAX_BATCH)
    .all();

  return (result.results || []).map((row) => ({
    peer_id: row.peer_id,
    session_id: row.session_id,
    timestamp: row.updated_at_ms,
  }));
}

async function insertRelayMessage(db, message) {
  const now = Date.now();
  const ttl = Math.min(message.ttl_ms || DEFAULT_TTL_MS, MAX_TTL_MS);
  const expiresAt = now + ttl;

  await db
    .prepare(
      `
    INSERT INTO psp_relay (network, to_peer_id, type, session_id, message_json, expires_at_ms, created_at_ms)
    VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
  `,
    )
    .bind(
      message.network,
      message.to,
      message.type,
      message.session_id || null,
      JSON.stringify(message),
      expiresAt,
      now,
    )
    .run();
}

async function fetchRelayMessages(db, network, toPeerId) {
  const now = Date.now();
  const result = await db
    .prepare(
      `
    SELECT id, message_json
    FROM psp_relay
    WHERE network = ?1 AND to_peer_id = ?2 AND expires_at_ms > ?3
    ORDER BY created_at_ms ASC
    LIMIT ?4
  `,
    )
    .bind(network, toPeerId, now, MAX_BATCH)
    .all();

  return (result.results || []).map((row) => ({
    id: row.id,
    message: JSON.parse(row.message_json),
  }));
}

async function deliverQueuedRelayMessages(db, socket, network, peerId) {
  if (!db) return 0;

  const queued = await fetchRelayMessages(db, network, peerId);
  if (queued.length === 0) return 0;

  const deliveredIds = [];
  for (const { id, message } of queued) {
    try {
      socket.send(JSON.stringify(message));
      deliveredIds.push(id);
    } catch (err) {
      console.error("[OUT] Failed to deliver queued message:", err?.message);
    }
  }

  if (deliveredIds.length > 0) {
    await deleteRelayMessagesById(db, deliveredIds);
  }
  return deliveredIds.length;
}

async function deleteRelayMessagesById(db, ids) {
  if (!ids.length) return;
  const placeholders = ids.map((_, i) => `?${i + 1}`).join(", ");
  await db
    .prepare(`DELETE FROM psp_relay WHERE id IN (${placeholders})`)
    .bind(...ids)
    .run();
}

export async function cleanExpiredPsp(db) {
  const now = Date.now();
  await db
    .prepare(`DELETE FROM psp_announcements WHERE expires_at_ms <= ?1`)
    .bind(now)
    .run();
  await db
    .prepare(`DELETE FROM psp_relay WHERE expires_at_ms <= ?1`)
    .bind(now)
    .run();
}

// 节流：每 CLEANUP_INTERVAL_MS 最多清一次
function maybeCleanup(db, ctx) {
  if (!db) return;
  const now = Date.now();
  if (now - lastCleanupMs < CLEANUP_INTERVAL_MS) return;
  lastCleanupMs = now;
  ctx.waitUntil(cleanExpiredPsp(db).catch(() => {}));
}

// ============================================================
//  协议校验
// ============================================================

function validEnvelope(msg) {
  return (
    typeof msg === "object" &&
    msg !== null &&
    msg.psp_version === PSP_VERSION &&
    typeof msg.type === "string" &&
    MESSAGE_TYPES.has(msg.type) &&
    isValidId(msg.from) &&
    isValidId(msg.network) &&
    (msg.to === undefined || msg.to === null || isValidId(msg.to)) &&
    (msg.session_id === undefined ||
      msg.session_id === null ||
      isValidId(msg.session_id, MAX_SESSION_ID_LEN)) &&
    typeof msg.message_id === "string" &&
    typeof msg.timestamp === "number"
  );
}
