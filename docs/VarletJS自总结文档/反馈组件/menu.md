# Menu 菜单

> 分类：反馈组件 ｜ 组件标签：`<var-menu>` ｜ 官方文档：https://varletjs.org/#/zh-CN/menu ｜ [返回索引](../组件索引.md)

**用途**：当元素点击时显示一个菜单，通过控制弹出位置和偏移量改变菜单的显示位置，常用于下拉操作、更多操作入口等场景。

**基础用法**：

```vue
<script setup>
import { ref } from 'vue'

const show = ref(false)
</script>

<template>
  <var-menu v-model:show="show">
    <var-button type="primary">基本使用</var-button>

    <template #menu>
      <var-cell @click="show = false">菜单项一</var-cell>
      <var-cell @click="show = false">菜单项二</var-cell>
    </template>
  </var-menu>
</template>
```

**Props / Options**：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `v-model:show` | 是否显示菜单 | `boolean` | `false` |
| `placement` | 菜单弹出位置 | `Placement` | `cover-top-start` |
| `strategy` | 菜单定位方式，可选值为 `absolute` `fixed` | `string` | `absolute` |
| `offset-x` | x 轴偏移量，相对于菜单对齐后的位置 | `number \| string` | `0` |
| `offset-y` | y 轴偏移量，相对于菜单对齐后的位置 | `number \| string` | `0` |
| `teleport` | 菜单挂载的位置 | `TeleportProps['to'] \| false` | `body` |
| `disabled` | 是否禁用菜单 | `boolean` | `false` |
| `trigger` | 菜单触发方式，可选值为 `click` `hover` `manual` | `string` | `click` |
| `reference` | 菜单关联的触发元素，`string` 类型为菜单组件的子孙元素选择器，`HTMLElement` 类型为任意指定的元素节点 | `string \| HTMLElement` | `-` |
| `elevation` | 海拔高度，可选值为 `true` `false` 和 `0-24` 的等级 | `string \| number \| boolean` | `true` |
| `same-width` | 是否与触发元素同宽 | `boolean` | `false` |
| `default-style` | 是否启用默认样式 | `boolean` | `true` |
| `popover-class` | 弹出层的 class | `string` | `-` |
| `close-on-click-reference` | 是否在点击菜单触发元素后关闭菜单 | `boolean` | `false` |
| `close-on-key-escape` | 是否支持键盘 ESC 关闭菜单 | `boolean` | `true` |

`placement` 可选值：

| 参数 | 说明 |
| --- | --- |
| `top` | 顶部中心位置 |
| `top-start` | 顶部左侧位置 |
| `top-end` | 顶部右侧位置 |
| `bottom` | 底部中心位置 |
| `bottom-start` | 底部左侧位置 |
| `bottom-end` | 底部右侧位置 |
| `right` | 右侧中心位置 |
| `right-start` | 右侧上方位置 |
| `right-end` | 右侧下方位置 |
| `left` | 左侧中心位置 |
| `left-start` | 左侧上方位置 |
| `left-end` | 左侧下方位置 |
| `cover-top` | 顶部中心位置，覆盖触发器 |
| `cover-top-start` | 顶部左侧位置，覆盖触发器 |
| `cover-top-end` | 顶部右侧位置，覆盖触发器 |
| `cover-bottom` | 底部中心位置，覆盖触发器 |
| `cover-bottom-start` | 底部左侧位置，覆盖触发器 |
| `cover-bottom-end` | 底部右侧位置，覆盖触发器 |
| `cover-left` | 左侧位置，覆盖触发器 |
| `cover-right` | 右侧位置，覆盖触发器 |

**Events**：

| 事件 | 说明 | 回调参数 |
| --- | --- | --- |
| `open` | 打开菜单时触发 | 无 |
| `opened` | 打开菜单动画结束时触发 | 无 |
| `close` | 关闭菜单时触发 | 无 |
| `closed` | 关闭菜单动画结束时触发 | 无 |
| `click-outside` | 点击菜单外部时触发 | `event: Event` |

**Slots**：

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `default` | 菜单关联的触发元素 | 无 |
| `menu` | 菜单内容 | 无 |

**Methods**：

| 方法 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| `open` | 打开 Menu | 无 | 无 |
| `close` | 关闭 Menu | 无 | 无 |
| `resize` | Menu 默认插槽元素产生位置大小变化时可以调用此方法进行重绘 | 无 | 无 |
| `setReference` | 设置菜单关联的触发元素（3.7.2） | `reference`：与组件属性的 `reference` 一致 | 无 |

**注意**：

- Menu 是一个 `inline-block` 元素，通过默认插槽点击时显示菜单；若希望 Menu 独占一行，推荐在外层包裹一个 `block` 元素。
- `trigger` 默认为 `click`，使用 `hover` 时要注意移动端没有悬停概念，`manual` 则需自行调用 `open` / `close` 方法或绑定 `v-model:show`。
- 菜单默认通过 `teleport` 挂载到 `body`，当触发元素的位置或尺寸发生滚动、布局变化时，可调用 `resize` 方法重新计算位置。

