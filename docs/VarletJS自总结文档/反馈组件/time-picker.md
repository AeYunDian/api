# TimePicker 时间选择器

> 分类：反馈组件 ｜ 组件标签：`<var-time-picker>` ｜ 官方文档：https://varletjs.org/#/zh-CN/time-picker ｜ [返回索引](../组件索引.md)

**用途**：用于选择时间，支持 12 小时制与 24 小时制，可通过限制条件约束可选的小时、分钟与秒。

**基础用法**：

```vue
<script setup>
import { ref } from 'vue'

const date = ref('11:20')
</script>

<template>
  <var-time-picker v-model="date" />
</template>
```

**Props**：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `v-model` | 被选择的时间（ISO 8601 格式，`HH:mm` 或 `HH:mm:ss`） | _string_ | `-` |
| `format` | 选择器时间格式，可选值为 `ampm 24hr` | _string_ | `ampm` |
| `color` | 选择器的颜色 | _string_ | `-` |
| `title-color` | 选择器标题栏背景色，如果未指定，将使用 `color` 属性或默认颜色 | _string_ | `-` |
| `hint` | 选择器提示语 | _string_ | `选择时间` |
| `elevation` | 海拔高度，可选值为 `true` `false` 和 `0-24` 的等级 | _string \| number \| boolean_ | `false` |
| `min` | 允许的最小时间（ISO 8601 格式） | _string_ | `-` |
| `max` | 允许的最大时间（ISO 8601 格式） | _string_ | `-` |
| `allowed-time` | 限制可以选择的时间 | _AllowedTime_ | `-` |
| `readonly` | 是否只读 | _boolean_ | `false` |
| `use-seconds` | 是否显示秒 | _boolean_ | `false` |

`allowed-time` 的 AllowedTime 类型定义如下：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `hours` | 限制可选的 `hour` | _Function: hour => boolean_ | `-` |
| `minutes` | 限制可选的 `minute` | _Function: minute => boolean_ | `-` |
| `seconds` | 限制可选的 `second` | _Function: second => boolean_ | `-` |

**Events**：

| 事件 | 说明 | 回调参数 |
| --- | --- | --- |
| `change` | 时间变化时触发 | `value: string` |

**Slots**：

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `actions` | 自定义操作面板 | `-` |

**Methods**：无

**注意**：

- `format` 默认为 `ampm`，需要 24 小时制时显式设置 `format="24hr"`。
- 显示秒需同时设置 `use-seconds`，此时绑定值格式为 `HH:mm:ss`。
- `allowed-time` 的 `hours`、`minutes`、`seconds` 均为返回布尔值的函数，返回 `false` 的项将被禁用。

