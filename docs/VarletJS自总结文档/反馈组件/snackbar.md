# Snackbar 消息条

> 分类：反馈组件 ｜ 组件标签：`<var-snackbar>` ｜ 官方文档：https://varletjs.org/#/zh-CN/snackbar ｜ [返回索引](../组件索引.md)

**用途**：用于向用户显示快速的轻量消息，如操作结果提示、加载状态与简短通知，既可用组件方式，也可用函数式调用。

**基础用法**：

组件调用方式：

```vue
<script setup>
import { ref } from 'vue'

const show = ref(false)
</script>

<template>
  <var-button type="primary" block @click="show = true">打开消息条</var-button>
  <var-snackbar v-model:show="show" :duration="3000">这是一个消息条！！</var-snackbar>
</template>
```

函数式调用方式：

```vue
<script setup>
import { Snackbar } from '@varlet/ui'

Snackbar('这是一个消息条！！')
Snackbar.success('操作成功')
</script>
```

**Props / Options**：

组件调用时的属性：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `v-model:show` | 是否显示 `Snackbar` | `boolean` | `false` |
| `type` | `Snackbar` 类型，可选值为 `success` `warning` `info` `error` `loading` | `string` | `-` |
| `position` | `Snackbar` 位置，可选值为 `top` `center` `bottom` | `string` | `top` |
| `duration` | 显示时长 | `number` | `3000` |
| `elevation` | 海拔高度，可选值为 `true` `false` 和 `0-24` 的等级（3.3.0 起） | `string \| number \| boolean` | `true` |
| `content` | 自定义内容 | `string` | `-` |
| `content-class` | 自定义内容的类名 | `string` | `-` |
| `vertical` | 是否启用竖直排列方式 | `boolean` | `false` |
| `loading-type` | Loading 类型（见 `Loading` 组件） | `string` | `circle` |
| `loading-size` | Loading 大小（见 `Loading` 组件） | `string` | `normal` |
| `loading-color` | Loading 颜色（见 `Loading` 组件） | `string` | `currentColor` |
| `loading-radius` | Loading 半径大小（见 `Loading` 组件） | `string \| number` | `-` |
| `lock-scroll` | 是否禁止滚动穿透 | `boolean` | `false` |
| `forbid-click` | 是否禁止穿透点击 | `boolean` | `false` |
| `teleport` | 弹出层挂载的位置 | `TeleportProps['to'] \| false` | `body` |

函数式调用时传入的选项（Options）：

| 选项 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `type` | `Snackbar` 类型，可选值为 `success` `warning` `info` `error` `loading` | `string` | `-` |
| `position` | `Snackbar` 位置，可选值为 `top` `center` `bottom` | `string` | `top` |
| `duration` | 显示时长（当 `type` 属性为 `loading` 时，需要手动关闭） | `number` | `3000` |
| `elevation` | 海拔高度，可选值为 `true` `false` 和 `0-24` 的等级（3.3.0 起） | `string \| number \| boolean` | `true` |
| `content` | 自定义内容 | `string \| VNode \| (() => VNode)` | `-` |
| `icon` | 自定义图标 | `string \| VNode \| (() => VNode)` | `-` |
| `action` | 自定义右边动作区 | `string \| VNode \| (() => VNode)` | `-` |
| `contentClass` | 自定义内容的类名 | `string` | `-` |
| `vertical` | 是否启用竖直排列方式 | `boolean` | `false` |
| `loadingType` | Loading 类型（见 `Loading` 组件） | `string` | `circle` |
| `loadingSize` | Loading 大小（见 `Loading` 组件） | `string` | `normal` |
| `loadingColor` | Loading 颜色（见 `Loading` 组件） | `string` | `currentColor` |
| `loadingRadius` | Loading 半径大小（见 `Loading` 组件） | `string \| number` | `-` |
| `lockScroll` | 是否禁止滚动穿透 | `boolean` | `false` |
| `forbidClick` | 是否禁止穿透点击（当 `type` 属性为 `loading` 时，默认为 `true`） | `boolean` | `false` |
| `onOpen` | 打开 `Snackbar` 时触发 | `() => void` | `-` |
| `onOpened` | 打开 `Snackbar` 动画结束时触发 | `() => void` | `-` |
| `onClose` | 关闭 `Snackbar` 时触发 | `() => void` | `-` |
| `onClosed` | 关闭 `Snackbar` 动画结束时触发 | `() => void` | `-` |

**Events**：

| 事件 | 说明 | 回调参数 |
| --- | --- | --- |
| `open` | 打开 `Snackbar` 时触发 | 无 |
| `opened` | 打开 `Snackbar` 动画结束时触发 | 无 |
| `close` | 关闭 `Snackbar` 时触发 | 无 |
| `closed` | 关闭 `Snackbar` 动画结束时触发 | 无 |

**Slots**：

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `default` | `Snackbar` 内容 | 无 |
| `icon` | `Snackbar` 图标 | 无 |
| `action` | `Snackbar` 右边动作区 | 无 |

**Methods**：

实例上的 `clear` 方法可关闭当前实例，全局 `clear` 方法可关闭所有的消息条。

| 方法 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| `Snackbar` | 显示消息条 | `options \| string` | `snackbar 实例` |
| `Snackbar.success` | 显示成功消息条 | `options \| string` | `snackbar 实例` |
| `Snackbar.info` | 显示普通消息条 | `options \| string` | `snackbar 实例` |
| `Snackbar.warning` | 显示警告消息条 | `options \| string` | `snackbar 实例` |
| `Snackbar.error` | 显示错误消息条 | `options \| string` | `snackbar 实例` |
| `Snackbar.loading` | 显示加载消息条 | `options \| string` | `snackbar 实例` |
| `Snackbar.clear` | 关闭消息条 | 无 | 无 |
| `Snackbar.allowMultiple` | 是否允许多例模式 | `boolean` | 无 |
| `Snackbar.setDefaultOptions` | 设置默认的选项配置 | `options` | 无 |
| `Snackbar.resetDefaultOptions` | 重置默认的选项配置 | 无 | 无 |

**注意**：

- 函数式调用默认单例，同一时间只会存在一个 `Snackbar`；需要同时弹出多个时先调用 `Snackbar.allowMultiple(true)`。
- `type` 为 `loading` 时不会自动消失，需要手动调用返回实例的 `clear()` 或全局 `Snackbar.clear()`。
- 函数式调用的选项名使用驼峰形式（如 `contentClass`、`lockScroll`），组件属性使用短横线形式。
- 函数返回 `snackbar 实例`，可用其 `clear()` 只关闭该条消息。

