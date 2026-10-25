# Drag 拖拽

> 分类：反馈组件 ｜ 组件标签：`<var-drag>` ｜ 官方文档：https://varletjs.org/#/zh-CN/drag ｜ [返回索引](../组件索引.md)

**用途**：使元素可以在页面中自由拖拽移动，常用于悬浮按钮、悬浮入口、可自由摆放的浮层等场景。

**基础用法**：

```vue
<script setup>
import { ref } from 'vue'

const drag = ref(null)

function reset() {
  drag.value.reset()
}
</script>

<template>
  <var-space>
    <var-drag ref="drag" style="top: 100px" direction="xy" :boundary="{ top: 0, bottom: 0, left: 0, right: 0 }">
      <var-button type="primary">拖我</var-button>
    </var-drag>
    <var-button @click="reset">重置位置</var-button>
  </var-space>
</template>
```

**Props / Options**：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `direction` | 拖拽方向，可选值 `x` `y` `xy` | `string` | `xy` |
| `attraction` | 吸附方向，可选值 `x` `y` `xy` | `string` | `-` |
| `disabled` | 是否禁用 | `boolean` | `false` |
| `boundary` | 拖拽范围，形如 `{ top?: number \| string, bottom?: number \| string, left?: number \| string, right?: number \| string }` | `object` | `{ top: 0, bottom: 0, left: 0, right: 0 }` |
| `z-index` | 拖拽元素的层级 | `string \| number` | `90` |
| `teleport` | 拖拽元素挂载的位置 | `TeleportProps['to'] \| false` | `body` |

**Events**：

| 事件 | 说明 | 回调参数 |
| --- | --- | --- |
| `click` | 点击组件时触发 | `event: Event` |

**Slots**：

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `default` | 拖拽元素的内容 | 无 |

**Methods**：

| 方法 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| `resize` | 产生位置大小变化时可以调用此方法进行重绘 | 无 | 无 |
| `reset` | 重置初始化时的位置信息 | 无 | 无 |

**注意**：

- `attraction` 用于指定拖拽结束后在该轴上吸附到边界，`xy` 表示两个方向都吸附。
- 默认为 `teleport="body"`，元素会挂载到 `body` 上，可通过传 `false` 阻止挂载到外部。
- 容器尺寸发生变化后应主动调用 `resize()`，否则拖拽边界仍按旧尺寸计算。

