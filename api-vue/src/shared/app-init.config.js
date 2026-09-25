// src/shared/app-init.config.js

/**
 * 应用初始化配置
 *
 * 用于声明「哪些应用」在启动阶段执行「哪些初始化逻辑」，
 * 由 main.js 中的 applyAppInit() 统一遍历并匹配执行。
 * 与 head.config.js 的设计思路保持一致：配置声明 + 执行器遍历。
 *
 * ────────────────────────────────────────────────────────────
 * 配置项字段说明
 * ────────────────────────────────────────────────────────────
 * @property {string}   name    - 配置名称，仅用于错误日志定位，可省略。
 * @property {string[]} apps    - 生效的应用列表，取值与 getAppName() 返回值一致：
 *                                "index" | "account" | "console" | "relay" | "ai" | "default"
 *                                传 ["*"] 表示所有应用都执行。
 * @property {string}  [phase]  - 执行时机，缺省为 "beforeRouter"，可选：
 *                                "beforeLoadModule" - appName 确定后、加载 App 模块之前
 *                                                    （ctx 仅含 appName，app/pinia/router 均为 null）
 *                                "beforePinia"      - createApp 之后、app.use(pinia) 之前
 *                                "beforeRouter"     - app.use(pinia) 之后、app.use(router) 之前
 *                                "beforeMount"      - app.use(router) / 组件注册之后、app.mount() 之前
 *                                "afterMount"       - app.mount() 之后
 * @property {Function} run     - 执行函数，接收上下文对象 ctx。
 *                                可为同步函数，也可为 async 函数；
 *                                执行器会检测返回值是否为 Promise，
 *                                是则 await，否则同步执行完即进入下一条。

 *
 * ────────────────────────────────────────────────────────────
 * 上下文对象 ctx
 * ────────────────────────────────────────────────────────────
 * @param {import('vue').App}  ctx.app     - 当前 Vue 应用实例（createApp 创建）。
 * @param {import('pinia').Pinia} ctx.pinia - 当前 Pinia 实例，已 app.use。
 * @param {string}             ctx.appName - 当前应用名。
 * @param {import('vue-router').Router|null} ctx.router - 当前路由实例，无则为 null。
 */

export const appInitConfig = [
  {
    name: "memorial-style",
    apps: ["index"],
    phase: "beforeLoadModule",
    run: async () => {
      const { startMemorialWatcher } =
        await import("@/shared/utils/memorial.js");
      startMemorialWatcher();
    },
  },
  {
    name: "theme-md3",
    apps: ["console", "account", "ai"],
    run: async ({ pinia }) => {
      const { useThemeStore } = await import("@/shared/stores/theme");
      useThemeStore(pinia).initializeTheme("md3");
    },
  },
  {
    name: "theme-md2",
    apps: ["relay", "default"],
    run: async ({ pinia }) => {
      const { useThemeStore } = await import("@/shared/stores/theme");
      useThemeStore(pinia).initializeTheme("md2");
    },
  },
  // 纯同步的也可以直接写
  {
    name: "global-props",
    apps: ["*"],
    run: ({ appName }) => {
      console.log(appName);
    },
  },
];
