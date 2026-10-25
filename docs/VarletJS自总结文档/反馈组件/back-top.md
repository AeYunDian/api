# BackTop 回到顶部

> 分类：反馈组件 ｜ 组件标签：`<var-back-top>` ｜ 官方文档：https://varletjs.org/#/zh-CN/back-top ｜ [返回索引](../组件索引.md)

**用途**：返回页面顶部的操作按钮，页面滚动到指定高度后自动出现在右下角，适用于长列表、长文章页面。

**基础用法**：

```vue
<script setup>
const lists = [...Array(100).keys()]
</script>

<template>
  <div>
    <var-cell v-for="list in lists" :key="list">Scroll to bottom {{ list }}</var-cell>
    <var-back-top :duration="300" />
  </div>
</template>
```

**Props / Options**：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `target` | 触发滚动的对象，如果为 `undefined` 会监听距离最近的一个可滚动的祖先节点 | _string \| HTMLElement_ | `-` |
| `visibility-height` | 滚动高度达到此参数值才出现 | _string \| number_ | `200` |
| `bottom` | `BackTop` 距离页面底部的距离 | _string \| number_ | `-` |
| `right` | `BackTop` 距离页面右侧的距离 | _string \| number_ | `-` |
| `size` | `BackTop` 按钮大小 | _string \| number_ | `-` |
| `elevation` | 海拔高度，可选值为 `true` `false` 和 `0-24` 的等级 | _string \| number \| boolean_ | `true` |
| `duration` | 回到顶部所需时间（ms） | _number_ | `300` |

**Events**：

| 事件 | 说明 | 回调参数 |
| --- | --- | --- |
| `click` | 点击按钮触发的事件 | `event: Event` |

**Slots**：

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `default` | 自定义按钮内容 | `-` |

**Methods**：

无

**注意**：

- 页面滚动到 `200px` 时按钮才会出现，可通过 `visibility-height` 调整触发阈值。
- 若滚动容器不是页面本身，需通过 `target` 指定该容器。
- `bottom`、`right`、`size` 未设置时使用组件样式变量中的默认值。

