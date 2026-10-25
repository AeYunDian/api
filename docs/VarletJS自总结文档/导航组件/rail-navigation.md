# RailNavigation 单轨导航

> 分类：导航组件 ｜ 组件标签：`<var-rail-navigation>` ｜ 官方文档：https://varletjs.org/#/zh-CN/rail-navigation ｜ [返回索引](../组件索引.md)

**用途**：在页面侧边显示页面级导航入口，适合平板、桌面端的侧边主框架导航。

**基础用法**：

```vue
<script setup>
import { ref } from 'vue'

const active = ref(0)
</script>

<template>
  <var-rail-navigation v-model:active="active">
    <var-rail-navigation-item label="首页" icon="home" />
    <var-rail-navigation-item label="搜索" icon="magnify" />
    <var-rail-navigation-item label="收藏" icon="heart" />
    <var-rail-navigation-item label="我的" icon="account-circle" />
  </var-rail-navigation>
</template>
```

**Props**：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `v-model:active` | 激活导航项的索引或名称 | `number \| string` | `0` |
| `ripple` | 是否开启水波纹 | `boolean` | `false` |
| `show-label` | 是否显示导航项标签 | `boolean` | `true` |
| `bordered` | 是否显示右侧边框 | `boolean` | `false` |

**Events**：

| 事件 | 说明 | 回调参数 |
| --- | --- | --- |
| `change` | 激活导航项变化时触发 | `active: number \| string` |

**Slots**：

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `default` | 导航项内容 | 无 |
| `start` | 顶部内容 | 无 |
| `end` | 底部内容 | 无 |

**注意**：

- 设置 `show-label="false"` 可只显示图标，此时建议用 `Tooltip` 包裹导航项补充说明。
- 可通过 `start` / `end` 插槽在导航栏顶部、底部放置额外操作按钮。

