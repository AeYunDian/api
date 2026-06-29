
import { corsHeaders_GPO } from './utils.js';

export default {
    async parseLink(request, env) {
        const url = new URL(request.url);
        const link = url.searchParams.get('link');
        if (!link) {
            return new Response(JSON.stringify({ code: 400, message: 'Missing link' }), { status: 400 });
        }
        try {
            const result = await env.db.prepare(`
        SELECT target, tip, expires_at FROM links 
        WHERE link = ? AND (expires_at IS NULL OR expires_at > strftime('%s', 'now'))
      `).bind(link).first();
            if (!result) {
                return new Response(JSON.stringify({ code: 404, message: 'Link not found' }), { status: 404 });
            }
            const tipBool = result.tip === 1;
            return new Response(JSON.stringify({
                code: 200,
                data: {
                    link: result.target,
                    tip: tipBool
                }
            }), { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders_GPO } });
        } catch (e) {
            return new Response(JSON.stringify({ code: 500, message: e.message }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders_GPO } });
        }
    },
    async initLink(request, env) {
        const url = new URL(request.url);
        const key = url.searchParams.get('key');
        if (key !== `${env.GOKEY}`) {
            return new Response('Unauthorized', { status: 401 });
        }
        try {
            await env.db.prepare(`
        CREATE TABLE IF NOT EXISTS links (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          link TEXT NOT NULL UNIQUE,
          target TEXT NOT NULL,
          tip INTEGER DEFAULT 0,
          created_at INTEGER DEFAULT (strftime('%s', 'now')),
          expires_at INTEGER,
          hit_count INTEGER DEFAULT 0
        )
      `).run();
            await env.db.prepare(`CREATE INDEX IF NOT EXISTS idx_link ON links (link)`).run();
            return new Response('Table initialized', { status: 200 });
        } catch (e) {
            return new Response('Error: ' + e.message, { status: 500 });
        }
    },
    async addLink(request, env) {
        try {
            const body = await request.json();
            const { link, target, tip = false, expires_in = null, key = null } = body;
            if (!link || !target) {
                return new Response(JSON.stringify({ code: 400, message: 'Missing link or target' }), { status: 400 });
            }
            const expires_at = expires_in ? Math.floor(Date.now() / 1000) + expires_in : null;
            await env.db.prepare(`
        INSERT INTO links (link, target, tip, expires_at)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(link) DO UPDATE SET target=excluded.target, tip=excluded.tip, expires_at=excluded.expires_at
      `).bind(link, target, tip ? 1 : 0, expires_at).run();
            return new Response(JSON.stringify({ code: 200, message: 'OK' }), { status: 200 });
        } catch (e) {
            return new Response(JSON.stringify({ code: 500, message: e.message }), { status: 500 });
        }
    }
}