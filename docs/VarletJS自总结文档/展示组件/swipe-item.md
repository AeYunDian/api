# SwipeItem 轮播项

> 分类：展示组件 ｜ 组件标签：`<var-swipe-item>` ｜ 官方文档：https://varletjs.org/#/zh-CN/swipe ｜ [返回索引](../组件索引.md)

**用途**：Swipe 的每一项内容容器，需作为 `var-swipe` 的直接子元素使用，数量决定轮播总数。

**基础用法**：

```vue
<template>
  <var-swipe class="swipe-example">
    <var-swipe-item>第一屏</var-swipe-item>
    <var-swipe-item>第二屏</var-swipe-item>
  </var-swipe>
</template>

<style>
.swipe-example {
  height: 160px;
}
</style>
```

**Props**：无。

**Events**：

| 事件 | 说明 | 回调参数 |
| --- | --- | --- |
| 无 | 无 | 无 |

**Slots**：

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `default` | 轮播项内容 | 无 |
