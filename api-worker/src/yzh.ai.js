export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Max-Age": "86400",
        },
      });
    }
    if (request.method !== "POST") {
      return new Response(
        JSON.stringify({
          error: {
            message: "Method not allowed.",
            type: "invalid_request_error",
            code: "method_not_allowed",
          },
        }),
        {
          status: 405,
          headers: { "Content-Type": "application/json; charset=utf-8" },
        },
      );
    }

    const url = new URL(request.url);
    if (!url.pathname.endsWith("/chat/completions")) {
      return new Response(
        JSON.stringify({
          error: {
            message: `Not found. Please use /v1/chat/completions, current path: ${url.pathname}`,
            type: "invalid_request_error",
            code: "not_found",
          },
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json; charset=utf-8" },
        },
      );
    }

    if (!env.YZH_AI_API_KEY) {
      return new Response(
        JSON.stringify({
          error: {
            message: "Server configuration error: Missing API key.",
            type: "invalid_request_error",
            code: "invalid_api_key",
          },
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json; charset=utf-8" },
        },
      );
    }

    const authHeader = request.headers.get("Authorization");
    const expectedKey = `Bearer ${env.YZH_AI_API_KEY}`;
    if (!authHeader || authHeader !== expectedKey) {
      return new Response(
        JSON.stringify({
          error: {
            message: "Incorrect API key provided.",
            type: "invalid_request_error",
            code: "invalid_api_key",
          },
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json; charset=utf-8" },
        },
      );
    }

    try {
      const reqBody = await request.json();
      const { messages, stream = false } = reqBody;

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return new Response(
          JSON.stringify({
            error: {
              message: "Missing or invalid 'messages' array.",
              type: "invalid_request_error",
            },
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json; charset=utf-8" },
          },
        );
      }

      // 清洗 messages 数据，兼容 OpenAI 的数组 content
      const sanitizedMessages = messages.map((msg) => {
        let contentStr = "";
        if (typeof msg.content === "string") {
          contentStr = msg.content;
        } else if (Array.isArray(msg.content)) {
          // 如果是数组（例如：[{"type":"text","text":"你好"}]），提取文本拼接
          contentStr = msg.content.map((c) => c.text || "").join("");
        } else if (msg.content === null || msg.content === undefined) {
          contentStr = "";
        } else {
          contentStr = String(msg.content);
        }

        return {
          role: msg.role,
          content: contentStr,
        };
      });

      const modelName = "qwen3-30b-a3b-fp8";

      if (stream) {
        const aiStream = await env.AI.run(`@cf/qwen/${modelName}`, {
          messages: sanitizedMessages, // 使用清洗后的数据
          stream: true,
        });

        const { readable, writable } = new TransformStream();
        const writer = writable.getWriter();
        const encoder = new TextEncoder();

        const streamId = `chatcmpl-${Date.now()}`;

        (async () => {
          const reader = aiStream.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split("\n");
              buffer = lines.pop();

              for (const line of lines) {
                if (line.startsWith("data: ")) {
                  const dataStr = line.slice(6).trim();
                  if (dataStr === "[DONE]") continue;

                  try {
                    const data = JSON.parse(dataStr);
                    const content = data.response || "";

                    const openAiChunk = {
                      id: streamId,
                      object: "chat.completion.chunk",
                      created: Math.floor(Date.now() / 1000),
                      model: modelName,
                      choices: [
                        {
                          index: 0,
                          delta: { content: content },
                          finish_reason: null,
                        },
                      ],
                    };
                    await writer.write(
                      encoder.encode(
                        `data: ${JSON.stringify(openAiChunk)}\n\n`,
                      ),
                    );
                  } catch (e) {
                    console.error("解析流式 JSON 失败:", dataStr);
                  }
                }
              }
            }

            const endChunk = {
              id: streamId,
              object: "chat.completion.chunk",
              created: Math.floor(Date.now() / 1000),
              model: modelName,
              choices: [{ index: 0, delta: {}, finish_reason: "stop" }],
            };
            await writer.write(
              encoder.encode(`data: ${JSON.stringify(endChunk)}\n\n`),
            );
            await writer.write(encoder.encode("data: [DONE]\n\n"));
          } finally {
            await writer.close();
          }
        })();

        return new Response(readable, {
          headers: {
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
            "Access-Control-Allow-Origin": "*",
          },
        });
      } else {
        const response = await env.AI.run(`@cf/qwen/${modelName}`, {
          messages: sanitizedMessages,
        });

        const openAiResponse = {
          id: `chatcmpl-${Date.now()}`,
          object: "chat.completion",
          created: Math.floor(Date.now() / 1000),
          model: modelName,
          choices: [
            {
              index: 0,
              message: { role: "assistant", content: response.response },
              finish_reason: "stop",
            },
          ],
          usage: response.usage || {
            prompt_tokens: 0,
            completion_tokens: 0,
            total_tokens: 0,
          },
        };

        return new Response(JSON.stringify(openAiResponse), {
          headers: { "Content-Type": "application/json; charset=utf-8" },
        });
      }
    } catch (err) {
      return new Response(JSON.stringify({ error: { message: err.message } }), {
        status: 500,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      });
    }
  },
};
