// postcss.config.js
module.exports = {
  plugins: {
    autoprefixer: {
      // 与 Babel 的 targets 保持一致
      overrideBrowserslist: ["ie >= 11", "last 2 versions"],
    },
  },
};
