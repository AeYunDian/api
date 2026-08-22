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
            return new Response(getMainPage("Ay Service Router", "<h1>Ay Service Router</h1>", "<p>Sorry, we can't find the hostname you are trying to access. Please try again.</p>"), { status: 404, headers: { 'Content-Type': 'text/html' } });
        } catch (err) {
            console.error(err);
            return new Response(`Worker threw exception: ${err.message}\nStack: ${err.stack || "no stack"}`, { status: 500, headers: { "Content-Type": "text/plain" } });
        }
    }
};
