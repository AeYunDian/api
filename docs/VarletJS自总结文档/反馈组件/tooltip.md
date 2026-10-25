# Tooltip 提示

> 分类：反馈组件 ｜ 组件标签：`<var-tooltip>` ｜ 官方文档：https://varletjs.org/#/zh-CN/tooltip ｜ [返回索引](../组件索引.md)

**用途**：当元素点击或悬停时显示一段提示文本或自定义内容，常用于补充说明图标含义、展示字段详情等场景。

**基础用法**：

```vue
<template>
  <var-tooltip content="Tooltip">
    <var-button type="primary">基本使用</var-button>
  </var-tooltip>
</template>
```

**Props / Options**：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `v-model:show` | 是否显示 | _boolean_ | `false` |
| `content` | 显示的内容 | _string_ | `-` |
| `color` | 背景颜色 | _string_ | `-` |
| `text-color` ***3.5.0*** | 文字颜色 | _string_ | `-` |
| `type` | 类型，可选值为 `default` `primary` `info` `success` `warning` `danger` | _string_ | `default` |
| `placement` | 弹出位置 | _Placement_ | `bottom` |
| `strategy` | 定位方式，可选值为 `absolute` `fixed` | _string_ | `absolute` |
| `offset-x` | x 轴偏移量，相对于 `Tooltip` 对齐后的位置 | _number \| string_ | `0` |
| `offset-y` | y 轴偏移量，相对于 `Tooltip` 对齐后的位置 | _number \| string_ | `0` |
| `teleport` | 挂载的位置 | _TeleportProps['to'] \| false_ | `body` |
| `same-width` | 是否与触发元素同宽 | _boolean_ | `false` |
| `disabled` | 是否禁用 Tooltip | _boolean_ | `false` |
| `trigger` | 触发方式，可选值为 `click` `hover` `manual` | _string_ | `hover` |
| `reference` | 菜单关联的触发元素，`string` 类型为菜单组件的子孙元素选择器，`HTMLElement` 类型为任意指定的元素节点 | _string \| HTMLElement_ | `-` |
| `close-on-click-reference` | 是否在点击菜单触发元素后关闭菜单 | _boolean_ | `false` |
| `close-on-key-escape` | 是否支持键盘 ESC 关闭提示 | _boolean_ | `true` |

**Events**：

| 事件 | 说明 | 回调参数 |
| --- | --- | --- |
| `open` | 打开 `Tooltip` 时触发 | `-` |
| `opened` | 打开 `Tooltip` 动画结束时触发 | `-` |
| `close` | 关闭 `Tooltip` 时触发 | `-` |
| `closed` | 关闭 `Tooltip` 动画结束时触发 | `-` |
| `click-outside` | 点击菜单外部时触发 | `event: Event` |

**Slots**：

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `default` | `Tooltip` 关联的触发元素 | `-` |
| `content` | `Tooltip` 内容 | `-` |

**Methods**：

| 方法 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| `open` | 打开 `Tooltip` | `-` | `-` |
| `close` | 关闭 `Tooltip` | `-` | `-` |
| `resize` | `Tooltip` 默认插槽元素产生位置大小变化时可以调用此方法进行重绘 | `-` | `-` |
| `setReference` ***3.7.2*** | 设置 `Tooltip` 关联的触发元素 | `reference: 与组件属性的 reference 一致` | `-` |

**注意**：

- `placement` 可选值为 `top` `top-start` `top-end` `bottom` `bottom-start` `bottom-end` `right` `right-start` `right-end` `left` `left-start` `left-end`，默认 `bottom`。
- 需要富文本或图标时使用 `content` 插槽替代 `content` 属性。
- `disabled` 为 `true` 时提示不会被打开；`close-on-key-escape` 默认支持键盘 ESC 关闭。

