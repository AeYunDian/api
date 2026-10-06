// src/shared/head.config.js
import { isMobileByUA } from "./utils/device";

export const head = [
  // =========== 挂载前 ============

  // account-sdk 不依赖 DOM，挂载前加载
  {
    apps: ["*"],
    phase: "beforeLoadModule",
    tag: "script",
    attrs: { src: "/lib/account-sdk.min.js", id: "account-sdk", async: true },
  },
  {
    apps: ["analytics"],
    phase: "beforeLoadModule",
    tag: "script",
    attrs: {
      src: "https://mysites.undz.cn/analytics.js?token=33c4316fe7f09cf653e3f9f7e1f09325c4b3f62a2488426412f47d5f0b06e62a",
      id: "ayanalytics",
      defer: true,
    },
  },

  // 字体样式，越早加载越好（避免 FOUT）
  {
    apps: ["*"],
    tag: "link",
    attrs: {
      rel: "stylesheet",
      href: "https://cdn.undz.cn/css2?family=Noto+Serif+SC:wght@400;600;700&display=swap",
    },
  },
  {
    apps: ["*"],
    tag: "link",
    attrs: {
      rel: "stylesheet",
      href: "https://cdn.undz.cn/css2?family=Tinos:ital,wght@0,400;0,700;1,400;1,700&display=swap",
    },
  },
];
