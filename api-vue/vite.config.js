import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";
import components from "unplugin-vue-components/vite";
import autoImport from "unplugin-auto-import/vite";
import { VarletImportResolver } from "@varlet/import-resolver";
import basicSsl from "@vitejs/plugin-basic-ssl";
import { visualizer } from "rollup-plugin-visualizer";
import hljs from "highlight.js";
import Markdown from "unplugin-vue-markdown/vite";

/**
 * Varlet 的 `Dialog` 导出是「函数式 API」：调用后返回 Promise，内部自己
 * mountInstance 出一个只认 props、**不支持插槽**的弹窗；真正的组件是
 * `Dialog.Component`（等价于内部导出的 `_DialogComponent`）。
 *
 * 而 VarletImportResolver 对 `<var-dialog>` 的处理是 `name.slice(3)` →
 * 导入 `{ Dialog }`，于是 `<var-dialog>` 会被当成「函数式组件」渲染：
 *   1. 每次渲染都返回一个 Promise，被 Vue 当作文本节点插入页面
 *      → 页面上出现一堆 `[object Promise]`；
 *   2. 那个函数顺手挂出一个空壳弹窗（没有插槽内容，只有 title/按钮）→
 *      “对话框内容不渲染”的假象。
 *
 * 这里在 Varlet 解析器之前拦掉 `VarDialog`，显式指向组件本体。
 */
const VarletDialogComponentResolver = {
  type: "component",
  resolve: (name) => {
    if (name !== "VarDialog") return;
    return {
      from: "@varlet/ui",
      name: "_DialogComponent",
      sideEffects: ["@varlet/ui/es/dialog/style/index.mjs"],
    };
  },
};

export default defineConfig({
  server: {
    https: true,
    host: "0.0.0.0",
    port: 443,
    strictPort: true,
    allowedHosts: [
      "mysites-dev.undz.cn",
      "online-dev.undz.cn",
      "console-dev.undz.cn",
      "relay-dev.undz.cn",
      "ai-dev.undz.cn",
      "dev.undz.cn",
      "localhost",
      "0.0.0.0",
    ],
  },
  plugins: [
    vue({ include: [/\.vue$/, /\.md$/] }),

    Markdown({
      markdownItSetup(md) {
        md.options.highlight = (str, lang) => {
          if (lang && hljs.getLanguage(lang)) {
            try {
              return hljs.highlight(str, {
                language: lang,
                ignoreIllegals: true,
              }).value;
            } catch (_) {
              /* fallthrough */
            }
          }
          // 没有语言或未识别，自动探测
          try {
            return hljs.highlightAuto(str).value;
          } catch (_) {
            return "";
          }
        };
        const fence = md.renderer.rules.fence;
        md.renderer.rules.fence = (tokens, idx, options, env, self) => {
          const token = tokens[idx];
          const lang = token.info.trim().split(/\s+/)[0];
          const html = fence(tokens, idx, options, env, self);
          if (!lang) return html;
          return `<div class="md-code-block" data-lang="${lang}">${html}</div>`;
        };
      },
    }),
    vueDevTools(),
    basicSsl({
      name: "dev",
      domains: ["*.undz.cn"],
      certDir: "./cert",
    }),
    visualizer({
      filename: "stats.html",
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
    components({
      // 顺序很重要：先拦 VarDialog，再交给 Varlet 官方解析器
      resolvers: [
        VarletDialogComponentResolver,
        VarletImportResolver({ autoImport: true }),
      ],
    }),
    autoImport({
      resolvers: [VarletImportResolver({ autoImport: true })],
    }),
  ],
  build: {
    outDir: "../api-assets",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: "js/[hash].js",
        chunkFileNames: (chunkInfo) => {
          if (chunkInfo.name.startsWith("vendor-")) {
            return "vendor/[hash].js";
          }
          return "js/[hash].js";
        },
        manualChunks(id) {
          if (id.includes("node_modules")) {
            const parts = id.toString().split("node_modules/")[1].split("/");
            const pkgName = parts[0].startsWith("@")
              ? `${parts[0]}/${parts[1]}`
              : parts[0];
            return `vendor-${pkgName.replace("@", "")}`;
          }
        },
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith(".css")) {
            return "css/[hash].css";
          }
          return "[ext]/[hash].[ext]";
        },
      },
    },
  },
  base: "/",
  minify: "terser",
  sourceMap: false,
  terserOptions: {
    compress: {
      dead_code: true,
      passes: 4,
      unsafe: false,
      unsafe_proto: false,
    },
    mangle: {
      toplevel: true,
    },
    format: {
      comments: false,
    },
  },
  define: {
    "import.meta.env.VITE_BUILD_TIME": JSON.stringify(new Date().toISOString()),
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
