// POST请求，body: { "link": "短码或原始链接", "target": "目标URL", "tip": true/false, "expires_in": 秒数(可选) }
export async function sl_addLink (request, env) {
    const url = new URL(request.url);
    try {
      const body = await request.json();
      const { link, target, tip = false, expires_in = null } = body;
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