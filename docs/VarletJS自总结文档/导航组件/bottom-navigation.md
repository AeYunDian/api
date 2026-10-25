# BottomNavigation 底部导航栏

> 分类：导航组件 ｜ 组件标签：`<var-bottom-navigation>` ｜ 官方文档：https://varletjs.org/#/zh-CN/bottom-navigation ｜ [返回索引](../组件索引.md)

**用途**：在页面底部显示页面级导航入口和关键操作，适用于移动端主框架的底部 Tab 切换。

**基础用法**：

```vue
<script setup>
import { ref } from 'vue'

const active = ref(0)
</script>

<template>
  <var-bottom-navigation v-model:active="active">
    <var-bottom-navigation-item label="标签" icon="home" />
    <var-bottom-navigation-item label="标签" icon="magnify" />
    <var-bottom-navigation-item label="标签" icon="heart" />
    <var-bottom-navigation-item label="标签" icon="account-circle" />
  </var-bottom-navigation>
</template>
```

**Props**：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `v-model:active` | 选中标签的名称或者索引值 | `number \| string` | `0` |
| `fixed` | 是否固定在底部 | `boolean` | `false` |
| `bordered` | 是否显示外边框 | `boolean` | `false` |
| `safe-area` | 是否开启底部安全区适配 | `boolean` | `false` |
| `z-index` | 元素 z-index | `number \| string` | `1` |
| `active-color` | 选中标签的颜色 | `string` | `-` |
| `inactive-color` | 未选中标签的颜色 | `string` | `-` |
| `placeholder` ***3.2.11*** | 是否在底部生成相同高度的占位元素（需设置 `fixed`） | `boolean` | `false` |
| `fab-props` | 悬浮按钮属性 | `ButtonProps` | `{ type: 'primary' }` |
| `variant` ***3.2.0*** | 变体模式 | `boolean` | `false` |
| `animated` ***3.13.1*** | 是否启用内容切换动画 | `boolean` | `true` |

**Events**：

| 事件 | 说明 | 回调参数 |
| --- | --- | --- |
| `before-change` | 切换标签前的回调函数，返回假值可阻止切换，支持返回 Promise | `active: number \| string` |
| `change` | 切换标签时触发 | `active: number \| string` |
| `fab-click` | 悬浮按钮点击时触发 | 无 |

**Slots**：

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `default` | 底部导航栏内容 | 无 |
| `fab` | 支持在组件中插入一个自定义的 fab 按钮 | 无 |

**注意**：

- 固定在底部时建议配合 `placeholder` 使用，避免页面内容被遮挡。
- 配置 `fab` 插槽即出现悬浮按钮：Item 数量为偶数时按钮居中，为奇数时位于最右侧。
- 需要拦截切换时使用 `before-change`，返回假值或 reject 的 Promise 均可阻止切换。

