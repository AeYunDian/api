# Ellipsis 文本省略

> 分类：基础组件 ｜ 组件标签：`<var-ellipsis>` ｜ 官方文档：https://varletjs.org/#/zh-CN/ellipsis ｜ [返回索引](../组件索引.md)

**用途**：用于省略单行或多行文字，超出容器的部分会被截断并以省略号显示；常配合展开交互与 Tooltip，处理标题、摘要、列表描述等长度不可控的文本。

**基础用法**：

```vue
<template>
  <var-ellipsis
    style="max-width: 170px"
    expand-trigger="click"
    :line-clamp="3"
    :tooltip="false"
  >
    其实没有什么事情是不可能的，我都拿到世界冠军了，真的没有什么事情是不可能的。
  </var-ellipsis>
</template>
```

**Props**：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `v-model:expand` | 是否展开 | `boolean` | `false` |
| `expand-trigger` | 展开触发方式，可选值 `click` | `string` | `-` |
| `expandable-on-overflow` 3.20.7 | 仅在文本被省略时允许展开 | `boolean` | `false` |
| `line-clamp` | 最大显示行数，兼容性见 line-clamp | `string` | `-` |
| `tooltip-on-overflow` 3.20.7 | 仅在文本被省略时显示 Tooltip | `boolean` | `false` |
| `tooltip` | Tooltip 组件配置，用于深度定制。为了更方便使用，`sameWidth` 在这里默认为 `true` | `boolean \| TooltipProps` | `true` |

**Events**：

| 事件 | 说明 | 回调参数 |
| --- | --- | --- |
| 无 | 无 | 无 |

**Slots**：

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `default` | 文字内容 | 无 |
| `tooltip-content` | Tooltip 的内容 | 无 |

**注意**：

- 单行省略无需设置 `line-clamp`，多行省略通过 `line-clamp` 指定最大行数。
- `expand-trigger="click"` 搭配 `v-model:expand` 可把展开状态提升为受控状态（如配合按钮切换）。
- 同时开启 `expandable-on-overflow` 与 `tooltip-on-overflow` 时，只有内容确实被省略才会允许展开、才显示 Tooltip。

