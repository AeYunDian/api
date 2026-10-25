# PullRefresh 下拉刷新

> 分类：反馈组件 ｜ 组件标签：`<var-pull-refresh>` ｜ 官方文档：https://varletjs.org/#/zh-CN/pull-refresh ｜ [返回索引](../组件索引.md)

**用途**：用于提供下拉刷新的交互操作，常见于列表、信息流等需要在顶部手势触发的刷新场景。

**基础用法**：

```vue
<script setup>
import { ref } from 'vue'

const data = ref(Array(30).fill('列表项'))
const isRefresh = ref(false)

function refresh() {
  // 开始时 isRefresh 为 true 表示正在加载，完成后置为 false
  setTimeout(() => {
    data.value = Array(30).fill('新的列表项')
    isRefresh.value = false
  }, 2000)
}
</script>

<template>
  <var-pull-refresh v-model="isRefresh" @refresh="refresh">
    <var-cell v-for="(item, index) in data" :key="index" border>
      {{ item + ' ' + (index + 1) }}
    </var-cell>
  </var-pull-refresh>
</template>
```

**Props / Options**：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `v-model` | 是否处于加载中状态 | `boolean` | `-` |
| `disabled` | 是否禁用下拉刷新 | `boolean` | `false` |
| `target` | 触发滚动的对象，如果为 `undefined` 会监听距离最近的一个可滚动的祖先节点 | `string \| HTMLElement` | `-` |
| `animation-duration` | 加载结束后回到初始位置的动画时长（ms） | `string \| number` | `300` |
| `success-duration` | 成功提示展示时长（ms） | `string \| number` | `2000` |
| `bg-color` | control 的背景颜色 | `string` | `#005CAF` |
| `color` | control 的颜色 | `string` | `#ffffff` |
| `success-bg-color` | 成功状态下 control 的背景颜色 | `string` | `#4CAF50` |
| `success-color` | 成功状态下 control 的颜色 | `string` | `ffffff` |

**Events**：

| 事件 | 说明 | 回调参数 |
| --- | --- | --- |
| `refresh` | 下拉刷新时触发 | 无 |

**Slots**：

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `default` | 默认插槽，放置刷新后需要更新的内容 | 无 |

**Methods**：

| 方法 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| 无 | 组件未暴露实例方法 | 无 | 无 |

**注意**：

- 下拉到刷新位置时松开会触发 `refresh` 事件，需在事件开始时将 `v-model` 置为 `true` 表示正在加载，加载结束后再置为 `false`，否则下拉状态不会复位。
- 与 `var-list` 组合使用即可同时实现上拉加载与下拉刷新，此时需保证 `PullRefresh` 容器高度不为 `0`。
- 容器高度为 `0` 时下拉功能会失效，因此要保证子元素高度不为 `0`，或直接为 `var-pull-refresh` 设置高度。

