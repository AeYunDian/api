// src/shared/bootstrap.js
import { createApp } from "vue";
import { createPinia } from "pinia";
import MyIcon from "@/shared/MyIcon.vue";
import { appInitConfig } from "@/shared/app-init.config";
import "@/shared/style/base.css";

// 浏览器专属：touch 模拟
import "@varlet/touch-emulator";

// ============ AppInit 执行器 ============
const APP_INIT_BY_PHASE = appInitConfig.reduce((acc, item) => {
  const phase = item.phase || "beforeRouter";
  (acc[phase] ||= []).push(item);
  return acc;
}, {});

async function applyAppInit(appName, phase, ctx) {
  const items = APP_INIT_BY_PHASE[phase] || [];
  for (const item of items) {
    const apps = item.apps;
    const matched = apps?.includes("*") || apps?.includes(appName);
    if (!matched) continue;
    try {
      const result = item.run(ctx);
      if (result && typeof result.then === "function") await result;
    } catch (err) {
      console.warn(`[Init] ${item.name ?? "unknown"} 执行失败:`, err);
    }
  }
}

// ============ 路由预加载 ============
function preloadAllRoutes(router) {
  const preload = () => {
    const routes = router.getRoutes();
    const tasks = routes
      .filter((r) => r.component && typeof r.component === "function")
      .map((r) =>
        Promise.resolve()
          .then(() => r.component())
          .catch((err) => console.warn(`[Preload] ${err.message}`)),
      );
    Promise.allSettled(tasks).then(() =>
      console.log("[Preload] All route components loaded"),
    );
  };
  if (window.requestIdleCallback) {
    window.requestIdleCallback(preload, { timeout: 3000 });
  } else {
    window.setTimeout(preload, 0);
  }
}

// ============ 统一的启动函数 ============
/**
 * 每个 app 的 main.js 调用这个函数即可。
 *
 * @param {string} appName  当前 app 名（"index" / "account" / ...）
 * @param {import('vue').Component} App  根组件
 * @param {object|null} router  vue-router 实例，没有传 null
 */
export async function bootstrap(appName, App, router) {
  const app = createApp(App);
  const pinia = createPinia();
  const ctx = { app, pinia, appName, router };

  await applyAppInit(appName, "beforePinia", ctx);
  app.use(pinia);
  await applyAppInit(appName, "beforeRouter", ctx);

  if (router) app.use(router);

  app.component("MyIcon", MyIcon);
  await applyAppInit(appName, "beforeMount", ctx);

  app.mount("#aymspa");

  await applyAppInit(appName, "afterMount", { app, pinia, appName, router });

  if (router) preloadAllRoutes(router);
}
