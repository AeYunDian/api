# Badge 徽标

> 分类：基础组件 ｜ 组件标签：`<var-badge>` ｜ 官方文档：https://varletjs.org/#/zh-CN/badge ｜ [返回索引](../组件索引.md)

**用途**：出现在图标或文字上的红色圆点、数字或者文字，表示有新内容或者待处理的信息。

**基础用法**：

```vue
<template>
  <var-space>
    <var-badge type="danger" :value="66" />
    <var-badge type="danger" value="badge" />
    <var-badge type="danger" value="hot" />
  </var-space>
</template>
```

**Props**：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `type` | 类型，可选值为 `default` `primary` `info` `success` `warning` `danger` | _string_ | `default` |
| `hidden` | 是否隐藏徽标 | _boolean_ | `false` |
| `dot` | 徽标是否为小圆点 | _boolean_ | `false` |
| `value` | 徽标中显示的值（当 `dot` 为 `false` 时生效） | _string \| number_ | `0` |
| `max-value` | 徽标中显示的最大值，当 `value` 大于 `max-value` 时会显示 `max-value+`（当 `value` 与 `max-value` 都存在时生效） | _string \| number_ | `-` |
| `position` | 徽标标签中有其他标签时定义徽标在其他标签上的位置，可选值 `right-top` `right-bottom` `left-top` `left-bottom` | _string_ | `right-top` |
| `offset-x` | 徽标的水平偏移量 | _number \| string_ | `0` |
| `offset-y` | 徽标的垂直偏移量 | _number \| string_ | `0` |
| `color` | 自定义徽标颜色 | _string_ | `-` |
| `icon` | 自定义徽标中图标的内容（优先级高于 `value`） | _string_ | `-` |
| `namespace` | 自定义徽标中图标的命名空间 | _string_ | `var-icon` |

**Events**：

无

**Slots**：

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `default` | 徽标内容 | 无 |
| `value` | 徽标中显示的值 | 无 |
| `icon` | 徽标图标（3.19.0 起支持） | 无 |

**注意**：

- `max-value` 仅在 `value` 与 `max-value` 同时存在时生效，超出时显示为 `max-value+`。
- `icon` 属性的优先级高于 `value`，设置后不再显示数值。
- `dot` 为 `true` 时 `value` 不生效，仅显示小圆点。

