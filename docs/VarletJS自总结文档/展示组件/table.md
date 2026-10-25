# Table 表格

> 分类：展示组件 ｜ 组件标签：`<var-table>` ｜ 官方文档：https://varletjs.org/#/zh-CN/table ｜ [返回索引](../组件索引.md)

**用途**

一个极简的表格容器，当你需要以表格的形式展示一些数据的时候可以使用它。`Table` 只负责表格外观（卡片阴影、圆角、边框、背景层级、滚动容器与尾部区域），表格的行列结构完全由原生 `thead` / `tbody` / `tr` / `th` / `td` 决定，因此适合展示静态说明表、成绩单、规格对比表等结构简单的数据；需要列配置、排序、固定列等能力时请使用 [DataTable](data-table.md)。

**基础用法**

```vue
<script setup>
import { ref } from 'vue'

const students = ref([
  { name: '耗子君', math: 124, english: 38 },
  { name: '火猫桑', math: 100, english: 135 },
])
</script>

<template>
  <var-table>
    <thead>
      <tr>
        <th>姓名</th>
        <th>数学</th>
        <th>英语</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="s in students" :key="s.name">
        <td>{{ s.name }}</td>
        <td>{{ s.math }}</td>
        <td>{{ s.english }}</td>
      </tr>
    </tbody>
  </var-table>
</template>
```

**Props**

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `full-width` | `table` 的宽度（包含可滚动部分） | `string \| number` | `100%` |
| `elevation` | 海拔高度，可选值为 `true` `false` 和 `0-24` 的等级 | `string \| number \| boolean` | `true` |
| `plain` | 是否以纯表格形态渲染，不带卡片阴影、背景色和圆角 | `boolean` | `false` |
| `bordered` | 是否显示外边框 | `boolean` | `false` |
| `surface` | 弱背景色风格，可选值 `low`（更接近 MD3 的弱背景层级） | `'low'` | `-` |
| `scroller-height` ***3.2.0*** | 滚动容器高度，可用于实现纵向局部滚动、固定表头等功能 | `string \| number` | `-` |

**Columns 配置**

无。`Table` 不接受 `columns`、`data` 之类的配置项，表头与单元格由使用者在默认插槽中直接书写 `thead`、`tbody` 结构（或用 `v-for` 渲染 `tr`）。需要「列配置 + 数据驱动」的表格请使用 [DataTable](data-table.md)。

**Events**

无。

**Slots**

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `default` | Table 的内容，即 `thead` / `tbody` 等表格结构 | `-` |
| `footer` | Table 尾部内容，常见用法是放入分页组件 `var-pagination` | `-` |

自定义单元格无需插槽：直接在 `<td>` 内写任意模板内容即可，例如 `<td><var-chip>及格</var-chip></td>`。

**Methods**

无。

**注意**

- 表格结构由原生标签决定，`th` / `td` 的数量必须与表头列数保持一致，否则会出现错位。
- 固定表头需同时设置 `scroller-height` 与 `thead` 的 `position: sticky; top: 0`，注意 `scroller-height` 仅在 ***3.2.0*** 及以上版本可用。
- `plain` 会去掉卡片阴影、背景色和圆角；`plain` 与 `bordered` 同时使用时呈现纯粹的带外边框表格形态。
- 本文档不罗列 CSS 变量，主题定制请通过 [StyleProvider](../基础组件/style-provider.md) 覆盖。
