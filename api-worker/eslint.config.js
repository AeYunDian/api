// api-worker/eslint.config.js
// ESLint 9 flat config，目标运行时是 Cloudflare Workers（ESM + Service Worker 风格 API）。
//
// 用法：
//   npm install
//   npm run lint        # 只报告
//   npm run lint:fix    # 自动修可修的
//
// 说明：历史代码量大，先把"真错误"留在 error，风格类全部降为 warn，
// 避免第一次跑就几千条红字淹掉重点。等 baseline 稳定后再逐条收紧。
import js from "@eslint/js";
import globals from "globals";

export default [
  {
    // 依赖、构建产物、wrangler 缓存
    ignores: ["node_modules/**", "dist/**", ".wrangler/**"],
  },
  js.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        // Workers 运行时：同时具备 Service Worker 与 Worker 全局
        ...globals.serviceworker,
        ...globals.worker,
        // Workers 专有全局
        WebSocketPair: "readonly",
        HTMLRewriter: "readonly",
        Buffer: "readonly",
      },
    },
    rules: {
      // ---- 潜在真错误 ----
      "no-unused-vars": [
        "warn",
        { args: "none", caughtErrors: "none", ignoreRestSiblings: true },
      ],
      "no-undef": "warn",
      "no-cond-assign": ["warn", "except-parens"],
      "no-fallthrough": "warn",
      // 已知一处：services/crossfire/v1/crossfire.js:554（数据库异常分支尾部不可达，
      // 非 uuid 错误会被误判成 409 DUPLICATE）。改逻辑前先保持 warn。
      "no-unreachable": "warn",

      // ---- 可疑但常见的写法 ----
      "no-empty": ["warn", { allowEmptyCatch: true }],
      "no-constant-condition": ["warn", { checkLoops: false }],
      "no-useless-escape": "warn",
      "eqeqeq": ["warn", "smart"],

      // ---- 与本项目风格冲突，关掉 ----
      "no-prototype-builtins": "off",
      "no-control-regex": "off", // 路径/输入校验里有意使用 \x00-\x1f
      "no-unused-expressions": "off",
      "prefer-const": "off",
      "no-var": "off",
      "no-redeclare": "off", // 历史文件里同名函数重载较多
    },
  },
  {
    // 明确无人引用的历史文件：只保证语法即可，不再投入规则
    files: ["src/legacy/**/*.js"],
    rules: {
      "no-unused-vars": "off",
      "no-undef": "off",
    },
  },
  {
    // Node 侧脚本与配置文件（构建/一次性脚本），不是 Workers 运行时
    files: ["scripts/**/*.{js,mjs}", "eslint.config.js"],
    languageOptions: {
      sourceType: "module",
      globals: { ...globals.node },
    },
    rules: {
      "no-console": "off",
    },
  },
];
