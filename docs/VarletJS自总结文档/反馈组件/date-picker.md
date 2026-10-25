# DatePicker 日期选择器

> 分类：反馈组件 ｜ 组件标签：`<var-date-picker>` ｜ 官方文档：https://varletjs.org/#/zh-CN/date-picker ｜ [返回索引](../组件索引.md)

**用途**：用于选择日期、月份、年份或对应的时间范围，常用于表单中的出生日期、预约区间等场景。

**基础用法**：

```vue
<script setup>
import { ref } from 'vue'

const date = ref('2021-04-08')
</script>

<template>
  <var-date-picker v-model="date" />
</template>
```

**Props**：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `v-model` | 选中值，格式随 `type` 变化（`YYYY` / `YYYY-MM` / `YYYY-MM-DD`），`multiple` 或 `range` 时为数组 | _string[] \| string_ | `undefined` |
| `type` | 选择器类型，可选值为 `date month year` | _string_ | `date` |
| `allowed-dates` | 限制可以选择的值，参数格式随 `type` 变化（`YYYY` / `YYYY-MM` / `YYYY-MM-DD`） | _function_ | `-` |
| `color` | 选择器的颜色 | _string_ | `-` |
| `title-color` | 标题背景色。如果未指定，将使用 `color` 属性或默认颜色 | _string_ | `-` |
| `hint` | 选择器提示语，未设置时会根据 `type` 推导 | _string_ | `-` |
| `elevation` | 海拔高度，可选值为 `true` `false` 和 `0-24` 的等级 | _string \| number \| boolean_ | `false` |
| `button-elevation` | Button 的海拔高度 | _string \| number \| boolean_ | `true` |
| `first-day-of-week` | 设置一周的第一天，从周日的 0 开始 | _string \| number_ | `0` |
| `min` | 允许的最小值，格式随 `type` 变化（`YYYY` / `YYYY-MM` / `YYYY-MM-DD`） | _string_ | `-` |
| `max` | 允许的最大值，格式随 `type` 变化（`YYYY` / `YYYY-MM` / `YYYY-MM-DD`） | _string_ | `-` |
| `show-current` | 是否显示当前日期 | _boolean_ | `true` |
| `show-title` | 是否显示顶部标题区域 | _boolean_ | `true` |
| `readonly` | 是否只读 | _boolean_ | `false` |
| `multiple` | 是否支持选择多个日期 | _boolean_ | `false` |
| `range` | 是否支持选择一个范围 | _boolean_ | `false` |
| `fallback-view-date` ***3.15.2*** | 在没有可用选中值时，控制面板视图回退到的日期（不会写回 `v-model`） | _string_ | `-` |

**Events**：

| 事件 | 说明 | 回调参数 |
| --- | --- | --- |
| `preview` | 面板视图切换时触发。`dayOfMonth` 为当前选中的月内日期；没有可用选中日期时为 `undefined` | `year: number` <br> `month: number` <br> `dayOfMonth?: number` |
| `change` | 日期改变时触发 | `value: string \| string[]` |

**Slots**：

`weekIndex` 表示一周的第 `n` 天，从周日的 `0` 开始。

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `year` | 自定义 `type="year"` 时的标题文字 | `year: YYYY` |
| `month` | 自定义 `type="month"` 时的标题文字 | `year: YYYY` <br> `month: MM` |
| `date` | 自定义 `type="date"` 时的标题文字 | `year: YYYY` <br> `month: MM` <br> `date: DD` <br> `week: weekIndex` |
| `range` | 自定义范围选择时的标题文字 | `choose: [startDate, endDate]`，元素格式随 `type` 变化（`YYYY` / `YYYY-MM` / `YYYY-MM-DD`） |
| `multiple` | 自定义多选时的标题文字 | `choose: string[]`，元素格式随 `type` 变化（`YYYY` / `YYYY-MM` / `YYYY-MM-DD`） |
| `actions` | 自定义操作面板 | `-` |

**Methods**：

| 方法 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| `resetPreview` ***3.19.0*** | 将面板视图重置到当前绑定值对应的位置。没有有效绑定值时，会使用 `fallback-view-date` 或今天 | `-` | `-` |

**注意**：

- 面板头部的年份和月份可分别点击，以切换到年份或月份面板。
- 开启 `multiple` 或 `range` 后，绑定值为数组；`range` 时为 `[start, end]`，元素格式随 `type` 变化。
- 自 `3.19.0` 起，`touchable` 属性已移除，可用 `resetPreview` 方法替代相关交互。

