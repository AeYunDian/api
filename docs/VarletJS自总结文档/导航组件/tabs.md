# Tabs 选项卡

> 分类：导航组件 ｜ 组件标签：`<var-tabs>` ｜ 官方文档：https://varletjs.org/#/zh-CN/tabs ｜ [返回索引](../组件索引.md)

**用途**：配合 `Tab` 实现选项卡组的切换，常与 `TabsItems`、`TabItem` 组合完成「标签 + 视图」联动，适用于顶部频道切换、内容分区浏览等场景。

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
    <var-tab>选项3</var-tab>
  </var-tabs>
</template>
```

**Props**：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `v-model:active` | 激活的选项卡标识，优先匹配 `name`，其次是 `index` | `string` | `default` |
| `layout-direction` | 选项卡组的布局方向，可选值为 `horizontal` `vertical` | `string` | `horizontal` |
| `item-direction` | 选项卡的布局方向，可选值为 `horizontal` `vertical` | `string` | `horizontal` |
| `fixed-bottom` | 是否固定在窗口底部，可用做底部导航 | `boolean` | `false` |
| `color` | 选项卡的背景颜色 | `string` | `-` |
| `active-color` | 选项卡激活的主要颜色 | `string` | `-` |
| `inactive-color` | 选项卡未激活的主要颜色 | `string` | `-` |
| `disabled-color` | 选项卡禁用时的主要颜色 | `string` | `-` |
| `indicator-color` | 选项卡激活指示器的颜色 | `string` | `-` |
| `indicator-size` | 选项卡激活指示器的尺寸 | `string \| number` | `2px` |
| `elevation` | 海拔高度，可选值为 `true` `false` 和 `0-24` 的等级 | `string \| number \| boolean` | `false` |
| `sticky` | 是否启用粘性布局 | `boolean` | `false` |
| `sticky-css-mode` | 是否启用粘性布局的原生 css sticky 模式 | `boolean` | `false` |
| `sticky-z-index` | 粘性布局的层级 | `number` | `10` |
| `safe-area` | 是否开启底部安全区适配 | `boolean` | `false` |
| `offset-top` | 吸顶距离 | `string \| number` | `0` |
| `scrollable` | 是否开启滚动，可选值为 `auto` `always` | `string` | `auto` |
| `indicator-position` | 选项卡激活指示器的位置，可选值为 `normal` `reverse` | `string` | `normal` |

**Events**：

| 事件 | 说明 | 回调参数 |
| --- | --- | --- |
| `click` | 点击选项卡时触发，在选项卡 `disabled` 状态为 `true` 时不触发 | `active: string \| number` |
| `change` | 切换选项卡时触发 | `active: string \| number` |

**Slots**：

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `default` | 选项卡组的内容 | 无 |

**Methods**：

| 方法 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| `resize` | 产生位置大小变化时可以调用此方法重绘选项卡组 | `-` | `-` |
| `resizeSticky` | 产生位置大小变化时可以调用此方法重绘粘性布局 | `-` | `Promise<void>` |

**注意**：

- 默认通过 `active` 匹配 `Tab` 的 `index` 决定激活项；若 `Tab` 设置了 `name`，则优先按 `name` 匹配。
- 选项卡数量超过四个时自动开启滚动，点击的选项卡会自动滚动到视口中央。
- 容器尺寸变化后需手动调用 `resize` / `resizeSticky` 重绘，否则指示器位置可能错位。

