// scripts/build-all.mjs
import { execSync } from "node:child_process";
import { rmSync, mkdirSync, existsSync, cpSync, renameSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// 当前脚本位置 → 项目根
const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
const PUBLIC_DIR = resolve(projectRoot, "public");
const ASSETS_DIR = resolve(projectRoot, "..", "api-assets");

console.log(`\n🧹 Cleaning ${ASSETS_DIR}`);
if (existsSync(ASSETS_DIR)) {
  rmSync(ASSETS_DIR, { recursive: true, force: true });
}
mkdirSync(ASSETS_DIR, { recursive: true });

const apps = ["index", "account", "console", "relay", "ai", "default"];

for (const app of apps) {
  console.log(`\n=== Building ${app} ===`);
  try {
    execSync("vite build", {
      stdio: "inherit",
      cwd: projectRoot,
      env: { ...process.env, VITE_APP: app },
    });
  } catch (err) {
    console.error(`\n❌ Build failed for app: ${app}`);
    process.exit(1);
  }
  const appDir = resolve(ASSETS_DIR, app);
  const nestedHtml = resolve(appDir, "src", app, "index.html");
  const targetHtml = resolve(appDir, "index.html");

  if (existsSync(nestedHtml)) {
    renameSync(nestedHtml, targetHtml);
    // 删掉空的 src/ 目录（可能还留着 src/{APP}/ 层级）
    rmSync(resolve(appDir, "src"), { recursive: true, force: true });
    console.log(`  ↪ Moved src/${app}/index.html → ${app}/index.html`);
  } else {
    console.warn(`  ⚠️  未找到 ${nestedHtml}，HTML 位置可能异常`);
  }
}

// // ============ 3. 生成 sitemap ============
// console.log("\n🗺  Generating sitemap");
// execSync("node scripts/gen-sitemap.mjs", {
//   stdio: "inherit",
//   cwd: projectRoot,
// });

if (existsSync(PUBLIC_DIR)) {
  console.log(`\nCopying public → ${ASSETS_DIR}`);
  cpSync(PUBLIC_DIR, ASSETS_DIR, {
    recursive: true,
    force: true,
  });
} else {
  console.warn(`\n⚠️  public 目录不存在，跳过: ${PUBLIC_DIR}`);
}

console.log("\n✅ All apps built successfully.");
