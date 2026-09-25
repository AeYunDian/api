// postcss.config.js
module.exports = {
  plugins: {
    autoprefixer: {
      // 与 Babel 的 targets 保持一致
      overrideBrowserslist: [
        "chrome >= 60",
        "firefox >= 55",
        "safari >= 11",
        "edge >= 16",
        "ie >= 11",
      ],
    },
  },
};
