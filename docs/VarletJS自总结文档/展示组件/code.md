# Code 代码块

> 分类：展示组件 ｜ 组件标签：`<var-code>` ｜ 官方文档：https://varletjs.org/#/zh-CN/code ｜ [返回索引](../组件索引.md)

**用途**：用于代码着色展示的代码块组件。组件库因包体积原因不内置着色器，需配合 `HighlighterProvider` 设置着色器（官方推荐 Shiki）。

**基础用法**

```vue
<script setup>
import { codeToHtml } from 'shiki'
</script>

<template>
  <var-highlighter-provider :highlighter="{ codeToHtml }" theme="vitesse-light">
    <var-space direction="column" size="large">
      <var-code code="console.log('Hello Varlet UI')" language="javascript" />
      <var-code code="print('Hello Varlet UI')" language="python" />
      <var-code code="console.log('Hello Varlet UI')" language="javascript" theme="github-light" />
    </var-space>
  </var-highlighter-provider>
</template>
```

**Props**

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `code` | 代码片段 | `string` | `-` |
| `language` | 语言 | `string` | `-` |
| `theme` | 主题 | `string` | `-` |
| `word-wrap` | 是否开启在代码溢出时自动换行 | `boolean` | `false` |
| `trim` | 是否移除代码开头和结尾的空白字符 | `boolean` | `true` |

**HighlighterProvider Props**

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `highlighter` | 着色器 | `Highlighter` | `-` |
| `theme` | 主题 | `string` | `-` |
| `tag` | 自定义标签名 | `string` | `div` |

**Highlighter**

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `codeToHtml` | 着色函数，组件的着色器必须实现该函数 | `(code: string, options: CodeToHtmlOptions) => Promise<string>` | `-` |

**CodeToHtmlOptions**

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `lang` | 语言 | `string` | `-` |
| `theme` | 主题 | `string` | `-` |

**Events**

无。

**Slots**

无。

**注意**

- 必须先安装着色器，例如 `pnpm add shiki`，再用 `var-highlighter-provider` 包裹代码块并传入 `:highlighter="{ codeToHtml }"`。
- `HighlighterProvider` 的 `theme` 为全局默认主题，`var-code` 自身的 `theme` 可单独覆盖。
- 长代码行默认横向溢出，需要换行展示时设置 `word-wrap`。
