// utils.js
// 请求参数与上传体的解析助手。

function parseBool(v) {
  if (v === true || v === 1) return true;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    return s === "true" || s === "1" || s === "yes";
  }
  return false;
}

function normalizePath(input) {
  if (typeof input !== "string") return null;
  let p = input.trim();
  if (!p) return null;
  p = p.replace(/\\/g, "/");
  if (!p.startsWith("/")) p = "/" + p;
  p = p.replace(/\/+/g, "/");
  while (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  if (p.split("/").some((seg) => seg === "..")) return null;
  if (p.length > 512) return null;
  if (/[\x00-\x1f]/.test(p)) return null;
  return p;
}

async function readUploadBody(request) {
  const ct = request.headers.get("Content-Type") || "";
  let fields = {};
  let file = null;
  if (ct.includes("multipart/form-data")) {
    const form = await request.formData().catch(() => null);
    if (!form) return { fields: null, file: null };
    for (const [k, v] of form.entries()) {
      if (typeof v === "string") {
        fields[k] = v;
      } else if (
        v &&
        typeof v === "object" &&
        typeof v.arrayBuffer === "function"
      ) {
        if (k === "file") file = v;
        else fields[k] = v;
      }
    }
  } else {
    const body = await request.json().catch(() => null);
    if (!body) return { fields: null, file: null };
    fields = body;
  }
  return { fields, file };
}

export { parseBool, normalizePath, readUploadBody };
