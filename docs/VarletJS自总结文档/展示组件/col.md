# Col 列

> 分类：展示组件 ｜ 组件标签：`<var-col>` ｜ 官方文档：https://varletjs.org/#/zh-CN/row ｜ [返回索引](../组件索引.md)

**用途**：栅格系统的列容器，通过 `span`、`offset` 与响应式断点控制自身占据与偏移的份数。

**基础用法**：

```vue
<template>
  <var-row :gutter="[10, 10]">
    <var-col :span="16" :offset="8">
      <div class="item">offset: 8 span: 16</div>
    </var-col>
    <var-col :span="8">
      <div class="item">span: 8</div>
    </var-col>
  </var-row>
</template>
```

**Props**：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `span` | 列占据的栅格数 | _string \| number_ | `24` |
| `offset` | 列偏移的栅格数 | _string \| number_ | `0` |
| `direction` | 布局方向，可选值为 `row` `column` | _string_ | `row` |
| `justify` | 主轴排列方式 可选值为 `flex-start` `flex-end` `center` `space-around` `space-between` | _string_ | `-` |
| `align` | 交叉轴排列方式 可选值为 `stretch` `center` `flex-start` `flex-end` `baseline` | _string_ | `-` |
| `xs` | `<768px` 响应式栅格数或者栅格属性对象 | _string \| number \| { span?: number \| string, offset?: number \| string }_ | `-` |
| `sm` | `≥768px` 响应式栅格数或者栅格属性对象 | _string \| number \| { span?: number \| string, offset?: number \| string }_ | `-` |
| `md` | `≥992px` 响应式栅格数或者栅格属性对象 | _string \| number \| { span?: number \| string, offset?: number \| string }_ | `-` |
| `lg` | `≥1200px` 响应式栅格数或者栅格属性对象 | _string \| number \| { span?: number \| string, offset?: number \| string }_ | `-` |
| `xl` | `≥1920px` 响应式栅格数或者栅格属性对象 | _string \| number \| { span?: number \| string, offset?: number \| string }_ | `-` |

**Events**：

| 事件 | 说明 | 回调参数 |
| --- | --- | --- |
| `click` | 点击 Col 时触发 | `event: Event` |

**Slots**：

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `default` | Col 内容 | 无 |

**注意**：

- 响应式断点按 `xs` → `sm` → `md` → `lg` → `xl` 顺序向上覆盖，宽度小于 `768px` 时以 `xs` 为准。
- 断点属性既可直接传栅格数，也可传 `{ span, offset }` 对象同时设置偏移。
- `span` 与 `offset` 之和超过 24 时，该列会换行到下一行并保留偏移。
