// src/main.js
import { createApp } from "vue";
import { createPinia } from "pinia";
// 由于组件库交互事件使用 touch 事件进行开发，不支持桌面端的 mouse 事件，使用 @varlet/touch-emulator 将 touch -> mouse 从而实现桌面端适配。
import "@varlet/touch-emulator";
import MyIcon from "@/shared/MyIcon.vue";
import { isHostShell, initWindow } from "@/shared/utils/device";
import { head } from "@/shared/head.config";
import { appInitConfig } from "@/shared/app-init.config";

import "@/shared/style/base.css";

const DEFAULT_APP = "default";

const APP_MODULES = {
  index: () => import("./index/App.vue"),
  account: () => import("./account/App.vue"),
  console: () => import("./console/App.vue"),
  relay: () => import("./relay/App.vue"),
  ai: () => import("./ai/App.vue"),
  default: () => import("./default/App.vue"),
};

const ROUTER_MODULES = {
  index: () => import("./index/router/index.js"),
  account: () => import("./account/router/index.js"),
  ai: () => import("./ai/router/index.js"),
  console: () => import("./console/router/index.js"),
};

const TITLES = {
  relay: "AyRelay",
  ai: "AyIntelligence",
  default: "404 Not Found",
};

const HOST_APP_RULES = [
  {
    match: (hostname) => hostname === "undz.cn" || hostname === "dev.undz.cn",
    app: "index",
  },
  { match: (hostname) => hostname.includes("relay"), app: "relay" },
  { match: (hostname) => hostname.includes("console"), app: "console" },
  { match: (hostname) => hostname.includes("online"), app: "account" },
  { match: (hostname) => hostname.includes("ai"), app: "ai" },
];

const url = new URL(window.location.href);

if (isHostShell() && !url.searchParams.has("notinithostshell")) {
  initWindow({
    borderStyle: "none",
    windowState: "normal",
    enableEdgeResize: true,
    minWidth: 1000,
    minHeight: 800,
  });
}

const hostname = window.location.hostname;

function getAppName() {
  return (
    HOST_APP_RULES.find((rule) => rule.match(hostname))?.app ?? DEFAULT_APP
  );
}

// ======================= Head 资源注入 =======================

// 按 phase 预分组，避免每次 applyHead 都遍历整个 head
const HEAD_BY_PHASE = head.reduce((acc, item) => {
  const phase = item.phase || "before";
  (acc[phase] ||= []).push(item);
  return acc;
}, {});

function createElement({ tag, attrs = {}, text, children }) {
  const el = document.createElement(tag);

  for (const [key, value] of Object.entries(attrs)) {
    if (value === false || value == null) continue;
    el.setAttribute(key, value === true ? "" : value);
  }

  // 纯文本内容（最常用：内联 script / style）
  if (text != null) {
    el.textContent = String(text);
  }

  // 子元素
  if (Array.isArray(children)) {
    for (const child of children) {
      el.appendChild(createElement(child));
    }
  }

  return el;
}

function injectOne(item) {
  return new Promise((resolve, reject) => {
    const { tag, attrs = {} } = item;

    // 幂等：有 id 且已存在则跳过
    if (attrs.id && document.getElementById(attrs.id)) {
      return resolve();
    }

    const el = createElement(item);

    // 只有外链 script / link 才需要等 load/error
    // 内联 script（有 text、无 src）会同步执行，不会触发 load，直接 resolve
    const isExternalResource =
      (tag === "script" && attrs.src) || tag === "link";

    if (isExternalResource) {
      el.addEventListener("load", () => resolve(), { once: true });
      el.addEventListener(
        "error",
        () =>
          reject(
            new Error(
              `加载失败: ${attrs.src || attrs.href || "(无 src/href)"}`,
            ),
          ),
        { once: true },
      );
    }

    document.head.appendChild(el);

    if (!isExternalResource) resolve();
  });
}

async function applyHead(appName, phase) {
  const items = HEAD_BY_PHASE[phase] || [];

  for (const item of items) {
    const apps = item.apps;
    const matched = apps?.includes("*") || apps?.includes(appName);

    if (!matched) continue;

    try {
      await injectOne(item); // 串行，保证顺序
    } catch (err) {
      console.warn(`[Head] ${err.message}`);
    }
  }
}

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
      // 返回 Promise 才 await，同步函数直接过
      if (result && typeof result.then === "function") {
        await result;
      }
    } catch (err) {
      console.warn(`[Init] ${item.name ?? "unknown"} 执行失败:`, err);
    }
  }
}
function preloadAllRoutes(router) {
  const preload = () => {
    const routes = router.getRoutes();

    // 筛选出使用动态导入的组件
    const loadTasks = routes
      .filter(
        (route) => route.component && typeof route.component === "function",
      )
      .map((route) =>
        Promise.resolve()
          .then(() => route.component())
          .catch((err) => {
            console.warn(`[Preload] ${err.message}`);
          }),
      );

    // 并发加载，不阻塞主线程
    Promise.allSettled(loadTasks).then(() => {
      console.log("[Preload] All route components have been loaded");
    });
  };

  if (window.requestIdleCallback) {
    window.requestIdleCallback(preload, { timeout: 3000 });
  } else {
    // 保持原行为：原 setTimeout 第二个参数传对象会被转为 0
    window.setTimeout(preload, 0);
  }
}

let appInstance = null;

async function createVueApp(appName) {
  const appModulePromise = APP_MODULES[appName]();
  const routerModulePromise = ROUTER_MODULES[appName]
    ? ROUTER_MODULES[appName]()
    : Promise.resolve(null);

  const [AppModule, RouterModule] = await Promise.all([
    appModulePromise,
    routerModulePromise,
  ]);

  const App = AppModule.default;
  const router = RouterModule?.default || null;

  const app = createApp(App);
  const pinia = createPinia();
  const ctx = { app, pinia, appName, router };

  await applyAppInit(appName, "beforePinia", ctx);
  app.use(pinia);
  await applyAppInit(appName, "beforeRouter", ctx);

  if (router) {
    app.use(router);
  }

  app.component("MyIcon", MyIcon);
  await applyAppInit(appName, "beforeMount", ctx);
  return { app, router, pinia };
}

async function showLoadError(err) {
  const { StyleProvider, Themes, Dialog } = await import("@varlet/ui");

  await import("@varlet/ui/es/dialog/style");
  StyleProvider(Themes.md3Light);

  const res = await Dialog({
    title: "加载失败",
    message: err.message + "\n是否重试？",
    cancelButton: false,
  });

  return res === "confirm";
}

async function loadApp() {
  try {
    // 卸载之前的应用
    if (appInstance) {
      appInstance.unmount();
      appInstance = null;
    }

    const appName = getAppName();

    await applyHead(appName, "beforeLoadModule");
    await applyAppInit(appName, "beforeLoadModule", { appName });

    if (!APP_MODULES[appName]) {
      throw new Error(`未知应用: ${appName}`);
    }

    const { app, router, pinia } = await createVueApp(appName);

    appInstance = app;

    await applyHead(appName, "beforeMount");
    app.mount("#aymspa");
    await applyHead(appName, "afterMount");
    await applyAppInit(appName, "afterMount", { app, pinia, appName, router });

    if (typeof TITLES[appName] === "string") {
      document.title = TITLES[appName];
    }

    if (router) {
      preloadAllRoutes(router);
    }
  } catch (err) {
    try {
      await showLoadError(err);
      loadApp();
    } catch (dialogErr) {
      console.error(dialogErr);
      alert(`加载出错：${dialogErr.message}`);
    }
  }
}

loadApp();
