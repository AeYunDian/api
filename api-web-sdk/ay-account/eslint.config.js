// eslint.config.js
import js from "@eslint/js";
import globals from "globals";
import eslintConfigPrettier from "eslint-config-prettier";

export default [
    { ignores: ["dist/**", "node_modules/**"] },

    js.configs.recommended,

    {
        files: ["src/**/*.js"],
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            globals: {
                ...globals.browser,
                __AY_VERSION__: "readonly",
                __AY_PRODUCE__: "readonly",
            },
        },
        rules: {
            "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
            "no-console": "off",
            "no-empty": ["error", { allowEmptyCatch: true }],
        },
    },

    {
        files: ["src/header-title.js"],
        languageOptions: {
            sourceType: "script",
            globals: { ...globals.browser },
        },
    },

    {
        files: ["webpack.config.cjs"],
        languageOptions: {
            sourceType: "commonjs",
            globals: { ...globals.node },
        },
    },

    {
        files: ["*.mjs", "**/*.mjs"],
        languageOptions: {
            sourceType: "module",
            globals: { ...globals.node },
        },
    },

    eslintConfigPrettier,
];
