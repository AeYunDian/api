# Hover 悬停指令

> 分类：功能指令 ｜ 指令：`v-hover` ｜ 官方文档：https://varletjs.org/#/zh-CN/hover ｜ [返回索引](../组件索引.md)

**用途**：指针悬停在绑定元素上时为其绑定一组内联样式，移出时还原；也可传入函数获得当前悬停状态，并支持只在桌面端或只在移动端启用。常用于图片遮罩、卡片高亮、鼠标跟随式交互。

**引入与注册**：

```js
// 全局注册：注册后可在任意模板中使用 v-hover
import { createApp } from 'vue'
import { Hover } from '@varlet/ui'

createApp().use(Hover)
```

```js
// 按需注册：在 <script setup> 中以 v 开头的变量名即为局部指令
import { Hover } from '@varlet/ui'

const vHover = Hover
```

**基础用法**：

```vue
<template>
  <div
    class="hover-block"
    v-hover="{ color: 'var(--color-on-primary)', background: 'var(--color-primary)' }"
  >
    HOVER
  </div>
</template>

<style>
.hover-block {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100px;
  cursor: pointer;
}
</style>
```

**指令值 / 修饰符**：

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| 指令值（对象） | 悬停时应用的样式对象，键为 CSS 属性名（推荐小驼峰写法，也兼容短横线写法），值为合法样式值，如 `{ color: '#fff', background: 'var(--color-primary)' }` | _Record<string, any>_ | `-` |
| 指令值（函数） | 悬停状态变化时调用，参数为当前是否悬停，用于自行驱动动画或状态 | _(hovering: boolean) => void_ | `-` |
| `desktop`（修饰符） | 只在桌面端启用，写作 `v-hover:desktop="{ color: '#fff' }"` | _string_ | `-` |
| `mobile`（修饰符） | 只在移动端启用，写作 `v-hover:mobile="{ color: '#fff' }"` | _string_ | `-` |

**注意**：

1. 对象形式是「覆盖再还原」：移出元素时会清除指令写入的样式，并恢复元素原先的内联样式，因此不要与依赖内联样式的 `:style` 绑定混用在同一属性上。
2. 函数形式不会自动修改任何样式，悬停状态与视觉表现全部由使用方维护，适合遮罩位移、`translate` 等复合动画。
3. 移动端与桌面端的 `hover` 行为差异较大，建议通过 `desktop` / `mobile` 修饰符按平台选择性启用。
