const path = require("path");
const webpack = require("webpack");
const CopyPlugin = require("copy-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const HtmlMinimizerPlugin = require("html-minimizer-webpack-plugin");
const pkg = require("./package.json");
const ESLintPlugin = require("eslint-webpack-plugin");

module.exports = (env, argv) => {
    const isProd = argv.mode === "production";

    return {
        entry: {
            main: "./src/main.js",
            login: "./src/login.js",
        },
        output: {
            path: path.resolve(__dirname, "dist"),
            filename: isProd ? "[name].min.js" : "[name].js",
            clean: true,
            iife: true,
            environment: {
                arrowFunction: true,
                const: true,
                destructuring: true,
                // dynamicImport: true,
                forOf: true,
                // module: true,
                optionalChaining: true,
                templateLiteral: true,
            },
        },
        optimization: {
            splitChunks: false,
            runtimeChunk: false,
            minimize: isProd,
            minimizer: isProd
                ? [
                      new TerserPlugin({
                          terserOptions: {
                              compress: { passes: 2, drop_console: false },
                              mangle: true,
                              format: { comments: false },
                          },
                          extractComments: true,
                          parallel: true,
                      }),
                      new CssMinimizerPlugin({ parallel: true }),
                      new HtmlMinimizerPlugin({
                          parallel: true,
                          minimizerOptions: {
                              collapseWhitespace: true,
                              removeComments: true,
                              removeRedundantAttributes: true,
                              useShortDoctype: true,
                              minifyCSS: true,
                              minifyJS: true,
                          },
                      }),
                  ]
                : [],
        },
        devtool: isProd ? false : "source-map",
        module: { rules: [] },
        plugins: [
            new ESLintPlugin({
                configType: "flat",
                extensions: ["js"],
                fix: !isProd,
                exclude: ["dist", "node_modules"],
                cache: true,
            }),
            new webpack.DefinePlugin({
                __AY_VERSION__: JSON.stringify(pkg.version),
                __AY_PRODUCE__: JSON.stringify(isProd),
            }),
            new CopyPlugin({
                patterns: [
                    { from: "src/login.html", to: "login.html" },
                    { from: "src/demo.html", to: "demo.html" },
                    { from: "src/login.css", to: "login.css" },
                    { from: "src/header-title.css", to: "header-title.css" },
                    { from: "src/toast.css", to: "toast.css" },
                    { from: "src/header-title.js", to: "header-title.js" },
                    { from: "src/toast-loading.svg", to: "toast-loading.svg" },
                    { from: "src/toast-error.svg", to: "toast-error.svg" },
                    { from: "src/icon", to: "icon" },
                ],
            }),
        ],
        stats: { preset: "minimal" },
    };
};
