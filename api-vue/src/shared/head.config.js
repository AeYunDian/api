// src/shared/head.config.js

function isMobile() {
  const ua = navigator.userAgent;
  // 常规移动端关键字
  if (
    /Android|iPhone|iPod|Mobile|HarmonyOS|MicroMessenger|BlackBerry|IEMobile|Opera Mini/i.test(
      ua,
    )
  ) {
    return true;
  }
  // iPad iOS 13+：UA 里有 Macintosh，但触点数 > 1
  if (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) {
    return true;
  }
  return false;
}

// 声明式资源注入表
// 每条 = { apps, phase?, tag, attrs }
//   apps  : 哪些应用加载，对应 getAppName() 的返回值
//   phase : 'before' | 'after'，相对 app.mount('#app') 的位置，默认 'before'
//   tag   : HTML 标签名
//   attrs : 标签属性，attrs.id 同时用作幂等去重标记
//
// 数组顺序 = 同阶段内的加载顺序，有依赖时靠顺序保证。

export const head = [
  // =========== 挂载前 ============

  // account-sdk 不依赖 DOM，挂载前加载
  {
    apps: ["*"],
    phase: "before",
    tag: "script",
    attrs: { src: "/lib/account-sdk.min.js", id: "account-sdk" },
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
  ...(!isMobile()
    ? [
        {
          apps: ["index"],
          phase: "before",
          tag: "script",
          attrs: { src: "/canyou/js/jquery.min.js", id: "canyou-jquery" },
        },
      ]
    : []),

  // ============ 挂载后 ============
  // wza.min.js 需要 #wzayd 已存在于 DOM，必须在 mount 之后加载
  ...(!isMobile()
    ? [
        {
          apps: ["index"],
          phase: "after",
          tag: "script",
          attrs: {
            src: "/canyou/js/wzatool-pc.js",
            id: "rrbayJs",
          },
        },
      ]
    : []),
];
