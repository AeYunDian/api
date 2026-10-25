# Button 按钮

> 分类：基础组件 ｜ 组件标签：`<var-button>` ｜ 官方文档：https://varletjs.org/#/zh-CN/button ｜ [返回索引](../组件索引.md)

**用途**：最常用的操作触发器，用于提交、确认、跳转等交互。支持多种主题色、尺寸、加载态与文字 / 外边框 / tonal 等形态。

**基础用法**：通过 `type` 切换主题色，`@click` 注册点击事件。

```vue
<script setup>
import { Snackbar } from '@varlet/ui'

function handleClick() {
  Snackbar.success('点击成功')
}
</script>

<template>
  <var-space :size="[10, 10]">
    <var-button>默认按钮</var-button>
    <var-button type="primary">主要按钮</var-button>
    <var-button type="success" @click="handleClick">点击</var-button>
    <var-button loading type="primary">加载状态</var-button>
    <var-button disabled>禁用状态</var-button>
  </var-space>
</template>
```

**Props**

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `type` | 类型，可选值为 `default` `primary` `info` `success` `warning` `danger` | _string_ | `default` |
| `native-type` | 原生类型，可选值为 `button` `submit` `reset` | _string_ | `button` |
| `size` | 尺寸，可选值为 `normal` `mini` `small` `large` | _string_ | `normal` |
| `tonal`（3.18.0） | 是否使用 tonal 样式，等同于 `icon-container` 且无海拔 | _boolean_ | `false` |
| `loading` | 加载状态 | _boolean_ | `false` |
| `loading-radius` | loading 的半径，只作用于 `loading-type="circle"` 时 | _string \| number_ | `-` |
| `loading-type` | loading 的类型，可选值为 `circle` `wave` `cube` `rect` `disappear` | _string_ | `circle` |
| `loading-size` | loading 的尺寸，可选值为 `large` `normal` `small` `mini` | _string_ | `-` |
| `loading-color` | loading 的颜色 | _string_ | `currentColor` |
| `auto-loading` | 自动 loading 模式，方便处理异步任务 | _boolean_ | `false` |
| `round` | 是否是圆形按钮 | _boolean_ | `false` |
| `fab`（3.18.0） | 是否是 FAB 按钮 | _boolean_ | `false` |
| `block` | 是否是块级元素 | _boolean_ | `false` |
| `text` | 是否是文字按钮 | _boolean_ | `false` |
| `icon-container` | 是否作为图标容器 | _boolean_ | `false` |
| `outline` | 是否使用外边框 | _boolean_ | `false` |
| `disabled` | 禁用状态 | _boolean_ | `false` |
| `ripple` | 是否使用水波纹 | _boolean_ | `true` |
| `focusable`（3.3.13） | 是否可以被聚焦 | _boolean_ | `true` |
| `text-color` | 文字颜色 | _string_ | `-` |
| `color` | 背景颜色 | _string_ | `-` |
| `elevation` | 海拔高度，可选值为 `true`、`false` 和 `0-24` 的等级 | _string \| number \| boolean_ | `true` |

**Events**

| 事件 | 说明 | 回调参数 |
| --- | --- | --- |
| `click` | 点击按钮时触发，在 `loading` 或 `disabled` 状态为 `true` 时不触发 | `event: Event` |
| `touchstart` | 触摸手指压下按钮时触发，在 `loading` 或 `disabled` 状态为 `true` 时不触发 | `event: Event` |

**Slots**

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `default` | 按钮内容 | 无 |

**注意**

- 开启 `auto-loading` 后，`click` 回调返回 `Promise` 时会自动进入 loading，`resolve` 后自动结束，无需手动维护 `loading` 变量。
- `loading` 或 `disabled` 为 `true` 时不会派发 `click` 与 `touchstart`，依赖点击的逻辑需自行判断状态。
- 用于表单提交时需设置 `native-type="submit"`，否则默认以 `button` 渲染，不会触发表单提交。

