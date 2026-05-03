export async function sl_initLink(request, env, ctx) {
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
  }