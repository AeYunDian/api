// src/shared/head.config.js
export const head = [
  // =========== 挂载前 ============

  // account-sdk 不依赖 DOM，挂载前加载
  {
    apps: ["*"],
    phase: "beforeLoadModule",
    tag: "script",
    attrs: {
      src: "/lib/ay-account/main.min.js",
      id: "account-sdk",
      async: true,
    },
  },
  {
    apps: ["console"],
    phase: "beforeLoadModule",
    tag: "script",
    attrs: {
      src: "https://mysites.undz.cn/analytics.js?token=bf99d0386b79d9d751a24cf23960c71c4c76c1740acd58bbfa0d76024ef71354",
      id: "ayanalytics",
      defer: true,
    },
  },
  {
    apps: ["account"],
    phase: "beforeLoadModule",
    tag: "script",
    attrs: {
      src: "https://mysites.undz.cn/analytics.js?token=61019c459094f30c6c2b1eb58845886fe7567222c9eb5575238492f2f395d4c2",
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
