# Ripple 水波指令

> 分类：功能指令 ｜ 指令：`v-ripple` ｜ 官方文档：https://varletjs.org/#/zh-CN/ripple ｜ [返回索引](../组件索引.md)

**用途**：元素被点击（或键盘回车、空格触发）时，从触点位置扩散出一个圆形水波，用于给可点击元素提供即时的点击反馈。常用于按钮、列表项、卡片等需要 Material 风格的交互元素。

**引入与注册**：

```js
// 全局注册：注册后可在任意模板中使用 v-ripple
import { createApp } from 'vue'
import { Ripple } from '@varlet/ui'

createApp().use(Ripple)
```

```js
// 按需注册：在 <script setup> 中以 v 开头的变量名即为局部指令
import { Ripple } from '@varlet/ui'

const vRipple = Ripple
```

**基础用法**：

```vue
<template>
  <div class="ripple-block" v-ripple>点击</div>
</template>

<style>
.ripple-block {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100px;
  user-select: none;
  cursor: pointer;
  background-color: var(--color-surface-container-highest);
}
</style>
```

**指令值 / 修饰符**：

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `color` | 水波纹的颜色，支持任意合法 CSS 颜色值 | _string_ | `currentColor` |
| `disabled` | 禁用状态，为 `true` 时点击不再产生水波 | _boolean_ | `false` |

该指令不支持修饰符，指令值以对象形式传入，例如 `v-ripple="{ color: 'var(--color-warning)' }"`。

**注意**：

1. 指令挂载时会把元素样式设置为 `overflow: hidden`，并在元素为 `static` 定位时改为 `relative`，因此不要在需要显示溢出内容的元素上使用。
2. 未指定 `color` 时水波颜色取元素自身的 `currentColor`，可通过父级 `color` 或传入 `color` 统一调整。
3. 组件库上下文关闭水波（`context.enableRipple` 为 `false`）时，指令不会产生任何效果。
