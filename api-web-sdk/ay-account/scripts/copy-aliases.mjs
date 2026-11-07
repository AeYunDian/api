// scripts/copy-aliases.mjs
import { readFile, writeFile, rm, cp, stat, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dist = path.resolve(__dirname, "..", "dist");
const targetDist = path.resolve(
  __dirname,
  "..",
  "..",
  "..",
  "api-vue",
  "public",
  "lib",
  "ay-account",
);
// 源文件 → 别名文件；license 表示需要同步处理 LICENSE.txt
const tasks = [
  { src: "main.min.js", dest: "main.js", license: true },
  { src: "login.min.js", dest: "login.js", license: false },
];

for (const task of tasks) {
  let code = await readFile(path.join(dist, task.src), "utf8");

  if (task.license) {
    // banner 里把 main.min.js.LICENSE.txt 换成 main.js.LICENSE.txt
    const oldBanner = `License information can be found in ${task.src}.LICENSE.txt`;
    const newBanner = `License information can be found in ${task.dest}.LICENSE.txt`;
    code = code.split(oldBanner).join(newBanner);

    // 同步复制 LICENSE 文件，让 main.js 单独部署时也能找到 license
    const license = await readFile(
      path.join(dist, `${task.src}.LICENSE.txt`),
      "utf8",
    );
    await writeFile(
      path.join(dist, `${task.dest}.LICENSE.txt`),
      license,
      "utf8",
    );
  }

  await writeFile(path.join(dist, task.dest), code, "utf8");
  console.log(`[copy-aliases] ${task.src} -> ${task.dest}`);
}
async function syncToTarget() {
  const stats = await stat(dist);
  if (!stats.isDirectory()) {
    throw new Error(`[sync] ${dist} is not a directory`);
  }

  // 清空目标目录，避免旧文件残留
  await rm(targetDist, { recursive: true, force: true });
  console.log(`[sync] cleaned ${targetDist}`);

  // 整体复制（会自动创建 targetDist 及其父目录）
  await cp(dist, targetDist, { recursive: true });
  console.log(`[sync] dist -> ${targetDist}`);

  // 统计文件数，输出汇总
  const walk = async (dir) => {
    const entries = await readdir(dir, { withFileTypes: true });
    let count = 0;
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) count += await walk(full);
      else count += 1;
    }
    return count;
  };
  const total = await walk(targetDist);
  console.log(`[sync] done, ${total} files in ${targetDist}`);
}

await syncToTarget();
