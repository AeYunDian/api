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
    apps: ["index"],
    tag: "link",
    attrs: {
      rel: "stylesheet",
      href: "/font/govwf_fz_7081407_361750289.css",
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
  // jQuery 不依赖 DOM，挂载前加载
  ...(!isMobileByUA()
    ? [
        {
          apps: ["index"],
          phase: "beforeMount",
          tag: "script",
          attrs: { src: "/canyou/js/jquery.min.js", id: "canyou-jquery" },
        },
      ]
    : []),

  // ============ 挂载后 ============
  // wza.min.js 需要 #wzayd 已存在于 DOM，必须在 mount 之后加载
  ...(!isMobileByUA()
    ? [
        {
          apps: ["index"],
          phase: "afterMount",
          tag: "script",
          attrs: {
            src: "/canyou/js/wzatool-pc.js",
            id: "rrbayJs",
          },
        },
      ]
    : []),
];
