// console.undz.cn.js

import { createKvStore } from './kvWithD1.js';

var kvStore = null;

export default {
    async fetch(request, env) {
        // const url = new URL(request.url);
        // const hostname = url.hostname;
        // kvStore = createKvStore(env.db);
        // const path = url.pathname;
        try {
            return env.assets.fetch(request);
        } catch (err) {
            console.error(err);
            return new Response(`Worker threw exception: ${err.message}\nStack: ${err.stack || "no stack"}`, { status: 500, headers: { "Content-Type": "text/plain" } });
        }
    }
};
