// prettier.config.mjs

/** @type {import("prettier").Config} */
export default {
    semi: true, // 分号结尾
    singleQuote: false, // 双引号（和现有源码一致）
    trailingComma: "all", // 尾随逗号（函数参数也加）
    printWidth: 80, // 每行最多 80 字符
    tabWidth: 4, // 2 空格缩进
    useTabs: false,
    arrowParens: "always", // (x) => x 而非 x => x
    endOfLine: "lf", // 统一 LF，避免 Windows CRLF 污染 git
    bracketSpacing: true, // { foo } 而非 {foo}
    objectWrap: "preserve",
};
