export async function parseLink(request, env) {
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
        // 未找到映射，可根据需求返回404或特定提示；这里返回404
        return new Response(JSON.stringify({ code: 404, message: 'Link not found' }), { status: 404 });
      }
      const tipBool = result.tip === 1;
      return new Response(JSON.stringify({
        code: 200,
        data: {
          link: result.target,
          tip: tipBool
        }
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (e) {
      return new Response(JSON.stringify({ code: 500, message: e.message }), { status: 500 });
    }
  }
