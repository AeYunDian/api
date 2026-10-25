# Layout 布局

> 分类：展示组件 ｜ 组件标签：`<var-row>` / `<var-col>` ｜ 官方文档：https://varletjs.org/#/zh-CN/row ｜ [返回索引](../组件索引.md)

**用途**：提供 `Row` 与 `Col` 两个辅助布局组件，把一行平均划分为 24 列栅格，用于快速搭建响应式页面结构。

**基础用法**：

```vue
<template>
  <var-row :gutter="[10, 10]">
    <var-col :span="8">
      <div class="item">span: 8</div>
    </var-col>
    <var-col :span="8">
      <div class="item">span: 8</div>
    </var-col>
    <var-col :span="8">
      <div class="item">span: 8</div>
    </var-col>
  </var-row>
</template>

<style>
.item {
  height: 36px;
  background: #3a7afe;
  color: #fff;
}
</style>
```

**注意**：

- 栅格总宽为 24 份，同一行内 `span` 之和超过 24 会自动换行。
- `Row` 与 `Col` 默认使用 `flex` 布局，具体属性、事件与插槽分别见下方 `Row`、`Col` 小节。
