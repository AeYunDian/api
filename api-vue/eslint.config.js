import js from "@eslint/js";
import pluginVue from "eslint-plugin-vue";
import globals from "globals";

/**
 * api-vue 的 ESLint 9 flat config。
 *
 * 只开启「能发现真实错误」的规则，不引入格式类规则：
 * 现有代码混用单/双引号、有无分号、缩进不统一，格式交给编辑器 / 后续再加 Prettier。
 */
export default [
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "../api-assets/**",
      "public/**",
      "stats.html",
      "auto-imports.d.ts",
      "components.d.ts",
      "VarletJS自总结文档/**",
    ],
  },

  js.configs.recommended,
  ...pluginVue.configs["flat/essential"],

  // 浏览器端源码
  {
    files: ["src/**/*.{js,mjs,vue}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        // unplugin-auto-import 注入的全局（见 auto-imports.d.ts）
        Dialog: "readonly",
        Snackbar: "readonly",
        // Vue <script setup> 编译器宏
        defineProps: "readonly",
        defineEmits: "readonly",
        defineExpose: "readonly",
        defineOptions: "readonly",
        withDefaults: "readonly",
      },
    },
  },

  // 构建脚本 / 配置文件
  {
    files: ["vite.config.js", "scripts/**/*.mjs", "eslint.config.js"],
    languageOptions: {
      globals: { ...globals.node },
    },
  },

  // 全工程通用规则（放最后，覆盖 recommended 的默认值）
  {
    files: ["**/*.{js,mjs,vue}"],
    rules: {
      // 现有代码里有不少未使用变量，先以 warning 暴露，逐步清理
      "no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrors: "none",
        },
      ],
      "no-empty": ["warn", { allowEmptyCatch: true }],
      // 单文件组件名不强制多词（HomeView / NotFound 等项目约定）
      "vue/multi-word-component-names": "off",
      "vue/no-unused-vars": "warn",
    },
  },
];
