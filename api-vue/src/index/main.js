import { bootstrap } from "@/shared/bootstrap";
import App from "./App.vue";
import router from "./router/index.js";
import { isHostShell, initWindow } from "@/shared/utils/device";

// index 专属：HostShell 初始化
if (isHostShell()) {
  const url = new URL(window.location.href);
  if (!url.searchParams.has("notinithostshell")) {
    initWindow({
      borderStyle: "none",
      windowState: "normal",
      enableEdgeResize: true,
      minWidth: 1000,
      minHeight: 800,
    });
  }
}

await bootstrap("index", App, router);
