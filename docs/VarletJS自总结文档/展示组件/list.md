# List 无限滚动列表

> 分类：展示组件 ｜ 组件标签：`<var-list>` ｜ 官方文档：https://varletjs.org/#/zh-CN/list ｜ [返回索引](../组件索引.md)

**用途**：实现无限滚动加载与触底加载，支持手动检查位置并加载，可自定义加载中、加载失败、加载完毕三种状态。常与 `PullRefresh` 组合成下拉刷新 + 上拉加载。

**基础用法**：

```vue
<script setup>
import { ref } from 'vue'

const loading = ref(false)
const finished = ref(false)
const list = ref([])
function load() {
  setTimeout(() => {
    for (let i = 0; i < 20; i++) {
      list.value.push(list.value.length + 1)
    }
    loading.value = false
    if (list.value.length >= 60) finished.value = true
  }, 1000)
}
</script>

<template>
  <var-list :finished="finished" v-model:loading="loading" @load="load">
    <var-cell :key="item" v-for="item in list">列表项: {{ item }}</var-cell>
  </var-list>
</template>
```

**Props**：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `v-model:loading` | 加载状态 | _boolean_ | `false` |
| `v-model:error` | 错误状态 | _boolean_ | `false` |
| `immediate-check` | 是否在组件初始化时立刻检测位置 | _boolean_ | `true` |
| `finished` | 是否加载完毕 | _boolean_ | `false` |
| `offset` | 距离底部的触发距离 | _string \| number_ | `0` |
| `loading-text` | 加载状态文字 | _string_ | `加载中` |
| `finished-text` | 加载完毕文字 | _string_ | `没有更多了` |
| `error-text` | 加载失败文字 | _string_ | `加载失败` |

**Events**：

| 事件 | 说明 | 回调参数 |
| --- | --- | --- |
| `load` | 触底时触发 | 无 |

**Slots**：

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `default` | 列表内容 | 无 |
| `loading` | 加载中内容 | 无 |
| `error` | 加载失败内容 | 无 |
| `finished` | 加载完毕内容 | 无 |

**Methods**：

| 方法 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| `check` | 触发位置检查，触底触发 load 事件 | 无 | 无 |

**注意**：

- 触底后组件会把 `loading` 置为 `true`，加载结束必须手动置回 `false`，否则不会继续加载。
- 使用 `v-model:error` 手动设置错误状态，点击错误提示会自动把 `error` 置为 `false` 并再次触发 `load`。
- 组件监听最近一个 `overflow-y` 为 `auto` 或 `scroll` 的元素作为滚动容器；若给元素设置了非 `visible` 的 `overflow-x`，浏览器会把它修正为 `auto`，从而被误判为滚动容器，需注意规避。
