import { isBase64 } from "./utils.js";
const PASS_TEXT_TBL_MESSAGES = 'pass_text_messages';
export async function handleSaveText(request, env) {
  // 处理保存文本的请求
  // 从请求中获取文本内容和相关信息
  let { text, name } = await request.json();
  if (env.KEY && request.headers.get('Authorization') !== `Bearer ${env.KEY}`) {
    return new Response(JSON.stringify({ code: 403, message: 'Forbidden' }), { status: 403 });
  }
  if (!text) {
    return new Response(JSON.stringify({ code: 400, error: "文本内容不能为空" }), { status: 400 });
  }
  if (!isBase64(text)) {
    text = btoa(text); // 将文本转换为Base64编码
  }
  if (!name) {
    name = crypto.randomUUID(); // 生成一个唯一的ID作为文本名
  }
  try {
    await env.db.prepare(`
        INSERT INTO links (content, name)
        VALUES (?, ?)
        ON CONFLICT(name) DO UPDATE SET content=excluded.content
      `).bind(text, name).run();
      return new Response(JSON.stringify({ code: 200, name, content: text, message: `文本已保存` }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ code: 500, error: e.message }), { status: 500 });
  }
}
export async function handleDeleteText(request, env) {
  const { name, key } = await request.json();
  if (env.KEY && key !== env.KEY) { return new Response(JSON.stringify({ code: 403, message: 'Forbidden' }), { status: 403 }); }
  const db = env.db;
  try {
    await db.prepare(
      `DELETE FROM ${PASS_TEXT_TBL_MESSAGES} WHERE name = ?`
    ).bind(name).run();
  } catch (e) {
    return new Response(JSON.stringify({ code: 500, error: e.message }), { status: 500 });
  }
  return new Response(JSON.stringify({ code: 200, message: `文本已删除: ${name}` }), { status: 200 });
}
export async function handleGetText(path, env) {
  const name = path.replace('/sf/', '') || null; // 从路径中提取文本名
  if (!name) { return new Response(JSON.stringify({ code: 400, error: "文本名不能为空" }), { status: 400 }); }
  const db = env.db;
  try {
    const result = await db.prepare(
      `SELECT content FROM ${PASS_TEXT_TBL_MESSAGES}
     WHERE name = ?`
    ).bind(name).first();
    if (!result) {
      return new Response(JSON.stringify({ code: 404, message: 'Content not found' }), { status: 404 });
    }
    return new Response(result.content, { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ code: 500, error: e.message }), { status: 500 });
  }
}