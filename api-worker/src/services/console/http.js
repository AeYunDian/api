// http.js —— 由 ayConsole.js 拆分而来（逐行搬运，未改逻辑）
// HTTP 响应与 CORS 助手。

const ALLOWED_ORIGINS = [
  "https://online.undz.cn",
  "https://console.undz.cn",
  "https://online-dev.undz.cn",
  "https://console-dev.undz.cn",
  "https://mysites.undz.cn",
  "https://mysites-dev.undz.cn",
];

function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...extraHeaders,
    },
  });
}
function corsHeaders(request) {
  const origin = request.headers.get("Origin");
  const headers = {
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-app-id, x-sdk-ver",
    "Access-Control-Max-Age": "86400",
  };
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  } else {
    headers["Access-Control-Allow-Origin"] = "null";
  }
  return headers;
}

export { jsonResponse, corsHeaders };
