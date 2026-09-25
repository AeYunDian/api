// babel.config.js
module.exports = {
  presets: [
    [
      "@babel/preset-env",
      {
        // 指定目标浏览器为 IE 11 及以上
        targets: {
          ie: "11",
        },
        // 使用 core-js@3 作为 polyfill 来源
        corejs: 3,
        // 按需自动引入 polyfill，避免全局污染和体积过大
        useBuiltIns: "usage",
        // 调试模式，开发时可设为 true 查看 polyfill 引入情况
        debug: false,
      },
    ],
  ],
};
