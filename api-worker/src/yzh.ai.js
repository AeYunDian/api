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
      const sanitizedMessages = messages
        .filter((msg) => msg && typeof msg === "object")
        .map((msg) => {
          let contentStr = "";
          if (typeof msg.content === "string") {
            contentStr = msg.content;
          } else if (Array.isArray(msg.content)) {
            // 防止数组里塞了 null 导致 c.text 报错
            contentStr = msg.content
              .map((c) => (c && c.text ? c.text : ""))
              .join("");
          } else if (msg.content !== null && msg.content !== undefined) {
            contentStr = String(msg.content);
          }
          // 如果客户端没给 role，强行补一个 user，防止 CF AI 拒绝
          return { role: msg.role || "user", content: contentStr };
        });

      const MAX_CHARS = 14000;

      const userSystemMsgs = sanitizedMessages.filter(
        (m) => m.role === "system",
      );
      const userSystemContent = userSystemMsgs
        .map((m) => m.content.trim())
        .filter((c) => c)
        .join("\n");

      const DEFAULT_SYSTEM_PROMPT =
        "默认使用简体中文回复。如果用户使用其他语言提问，请使用用户提问时使用的语言进行回复。语气友好专业，避免过度客套。日常对话偶尔可使用1~2个表情。代码报错、技术解释中不要使用表情，除非用户明确要求。不主动卖萌，不滥用感叹号。";

      const combinedSystemContent = userSystemContent
        ? `${DEFAULT_SYSTEM_PROMPT}\n\n[以下为环境专属设定，若与上述默认规则冲突，请以此设定为准]\n${userSystemContent}`
        : DEFAULT_SYSTEM_PROMPT;

      const systemMsgs = [{ role: "system", content: combinedSystemContent }];

      const chatMsgs = sanitizedMessages.filter((m) => m.role !== "system");

      let currentChars = systemMsgs.reduce(
        (sum, m) => sum + m.content.length,
        0,
      );

      if (currentChars > MAX_CHARS) {
        systemMsgs.forEach((m) => {
          m.content = m.content.slice(0, MAX_CHARS / systemMsgs.length);
        });
        currentChars = MAX_CHARS; // 重置计数
      }

      // 从最新的一条消息开始往前遍历，能塞下就塞，塞不下就丢弃更早的历史
      const finalChatMsgs = [];
      for (let i = chatMsgs.length - 1; i >= 0; i--) {
        const msg = chatMsgs[i];

        // 如果单条消息本身就超长，就截取它的尾部（保留最新内容）
        if (msg.content.length > MAX_CHARS) {
          msg.content = msg.content.slice(-MAX_CHARS); // 截取末尾的14000个字符
          finalChatMsgs.unshift(msg);
          currentChars = MAX_CHARS;
          break;
        }

        if (currentChars + msg.content.length > MAX_CHARS) {
          break;
        }

        finalChatMsgs.unshift(msg);
        currentChars += msg.content.length;
      }

      const finalMessages = [...systemMsgs, ...finalChatMsgs];
      console.log(
        `[上下文清洗] 原始: ${messages.length} 条 / 截断后: ${finalMessages.length} 条，总字符数: ${currentChars}`,
      );

      const modelName = "qwen3-30b-a3b-fp8";

      if (stream) {
        const aiStream = await env.AI.run(`@cf/qwen/${modelName}`, {
          messages: finalMessages,
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
                    let content = data.response;
                    if (typeof content !== "string") {
                      content =
                        content !== null && content !== undefined
                          ? String(content)
                          : "";
                    }

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
          messages: finalMessages,
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
      return new Response(
        JSON.stringify({
          error: {
            message: err.message || "Unknown Error",
            type: "worker_internal_error",
            code: "internal_error",
            stack: err.stack || "No stack trace available", // 直接返回详细的堆栈信息
          },
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json; charset=utf-8" },
        },
      );
    }
  },
};
