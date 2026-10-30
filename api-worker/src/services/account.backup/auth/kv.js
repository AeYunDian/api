// auth/kv.js —— 由 ayOnline.js 拆分而来（逐行搬运，未改逻辑）

// 进程内持有的 KV 适配器实例。
// ayOnline 的 fetch 每次请求都会用 setKv() 重建它（createKvStore 很便宜），
// 这里给被拆出去的 oauth/token.js 一个取值入口。
import { createKvStore } from "../../../shared/kvWithD1.js";

let store = null;

export function setKv(db) {
  store = createKvStore(db);
  return store;
}

export function getKv() {
  if (!store) {
    throw new Error("KV 未初始化：ayOnline.fetch 里的 setKv() 没有被调用");
  }
  return store;
}

