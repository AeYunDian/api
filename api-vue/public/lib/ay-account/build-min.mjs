// 一键生成 min 版本（不含 source map）
// 用法：node build-min.mjs  或双击 build-min.bat
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { minify } from "terser";

const dir = path.dirname(fileURLToPath(import.meta.url));
const files = [
  ["login.js", "login.min.js"],
  ["main.js", "main.min.js"],
];

for (const [input, output] of files) {
  const source = await readFile(path.join(dir, input), "utf8");
  const result = await minify(source, {
    compress: { passes: 2, drop_console: false },
    mangle: true,
    format: { comments: false },
    sourceMap: false,
  });
  if (!result.code)
    throw new Error(`Terser returned empty output for ${input}`);
  await writeFile(path.join(dir, output), result.code, "utf8");
  console.log(
    `${input} -> ${output} (${Buffer.byteLength(result.code, "utf8")} bytes)`,
  );
}
