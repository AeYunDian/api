# TabsItems 选项卡视图组

> 分类：导航组件 ｜ 组件标签：`<var-tabs-items>` ｜ 官方文档：https://varletjs.org/#/zh-CN/tabs ｜ [返回索引](../组件索引.md)

**用途**：与 `Tabs` 联动的内容容器，常配合 `TabItem` 展示各选项卡对应的视图，支持滑动切换与切换动画。

**基础用法**：

```vue
<script setup>
import { ref } from 'vue'

const active = ref(0)
</script>

<template>
  <var-tabs v-model:active="active">
    <var-tab>选项1</var-tab>
    <var-tab>选项2</var-tab>
  </var-tabs>

  <var-tabs-items v-model:active="active">
    <var-tab-item>呜啦啦啦火车笛，随着奔腾的马蹄。</var-tab-item>
    <var-tab-item>很多人不长眼睛，嚣张都靠武器。</var-tab-item>
  </var-tabs-items>
</template>
```

**Props**：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `v-model:active` | 激活的选项卡的标识 | `string \| number` | `-` |
| `can-swipe` | 是否允许滑动切换 | `boolean` | `true` |
| `animated` | 是否启用内容切换动画 | `boolean` | `true` |
| `loop` | 是否允许循环切换 | `boolean` | `false` |

**Events**：

无。

**Slots**：

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `default` | 视图组的内容 | 无 |

**Methods**：

| 方法 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| `getSwipe` | 获取 `swipe` 组件实例 | `-` | `-` |

**注意**：

- `TabsItems` 的 `v-model:active` 必须与 `Tabs` 绑定同一个响应式变量，视图才会随选项卡切换。
- 不允许滑动切换时设置 `can-swipe="false"`，关闭动画设置 `animated="false"`。

