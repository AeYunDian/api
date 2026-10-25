# FloatingPanel 浮动面板

> 分类：反馈组件 ｜ 组件标签：`<var-floating-panel>` ｜ 官方文档：https://varletjs.org/#/zh-CN/floating-panel ｜ [返回索引](../组件索引.md)

**用途**：浮动在页面底部的面板，常用于提供额外的功能或信息，用户可灵活上下滑动浏览内容。

**基础用法**：

```vue
<script setup>
import { ref } from 'vue'

const anchors = ref([100, window.innerHeight * 0.4, window.innerHeight * 0.8])
const anchor = ref(100)
</script>

<template>
  <var-floating-panel v-model:anchor="anchor" :anchors="anchors">
    <var-cell v-for="i in 26" :key="i" :title="String.fromCharCode(i + 64)" border />
  </var-floating-panel>
</template>
```

**Props / Options**：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `v-model:anchor` | 面板初始显示锚点，如果不传则为 `anchors` 属性的第一个值 | `number` | `-` |
| `anchors` | 自定义锚点，单位为 `px` | `number[]` | `[100, window.innerHeight * 0.6]` |
| `content-draggable` | 是否允许拖拽面板内容 | `boolean` | `true` |
| `duration` | 动画时长，单位为 `ms` | `number \| string` | `300` |
| `elevation` | 海拔高度，可选值为 `true`、`false` 和 `0-24` 的等级 | `string \| number \| boolean` | `true` |
| `teleport` | 弹出层挂载的位置 | `TeleportProps['to'] \| false` | `body` |
| `safe-area` | 是否开启底部安全区适配 | `boolean` | `false` |

**Events**：

| 事件 | 说明 | 回调参数 |
| --- | --- | --- |
| `anchor-change` | 移动到某个锚点后触发 | `height: number` |

**Slots**：

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `default` | 自定义面板内容 | 无 |
| `header` | 自定义面板标头（3.2.12 起） | 无 |

**Methods**：

| 方法 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| 无 | 组件未暴露实例方法 | 无 | 无 |

**注意**：

- 默认高度为 `100px`，可拖动展开或收缩，默认展开的最大高度为屏幕的 `60%`。
- 头部与内容区域默认都可拖动，设置 `content-draggable="false"` 可限制为仅头部拖拽。
- `anchors` 需按高度升序传入，`v-model:anchor` 会随拖拽停靠自动更新为当前锚点高度。

