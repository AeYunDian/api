# Divider 分割线

> 分类：展示组件 ｜ 组件标签：`<var-divider>` ｜ 官方文档：https://varletjs.org/#/zh-CN/divider ｜ [返回索引](../组件索引.md)

**用途**：用于分隔列表或布局的各个部分，支持水平与垂直方向、虚线、缩进以及带文字描述的形态。

**基础用法**：

```vue
<template>
  <var-divider description="文字描述" />
</template>
```

**Props**：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `inset` | 设置缩进距离，正负号可控制缩进方向，当传递 `true` 时默认缩进为 `72px`（仅限水平模式） | _boolean \| number \| string_ | `false` |
| `vertical` | 是否垂直 | _boolean_ | `false` |
| `dashed` | 虚线 | _boolean_ | `false` |
| `hairline` | 0.5px 的分割线 | _boolean_ | `false` |
| `description` | 分割线的文字描述（仅限水平模式） | _string_ | `-` |
| `margin` | 设置分割线样式的 `margin` 属性 | _string_ | `-` |

**Events**：

| 事件 | 说明 | 回调参数 |
| --- | --- | --- |
| 无 | 组件本身不派发事件 | 无 |

**Slots**：

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `default` | 自定义分割线文字描述内容（仅限水平模式） | 无 |

**注意**：

- `inset`、`description` 与 `default` 插槽仅在水平模式（未设置 `vertical`）下有效。
- `inset` 传入正负数值可控制缩进方向，传入 `true` 时使用默认的 `72px`。
- 需要极细边框时使用 `hairline` 开启 0.5px 分割线。
