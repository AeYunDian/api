# Dialog 对话框

> 分类：反馈组件 ｜ 组件标签：`<var-dialog>` ｜ 官方文档：https://varletjs.org/#/zh-CN/dialog ｜ [返回索引](../组件索引.md)

**用途**：弹出一个对话框展示内容并处理用户交互，常用于二次确认、重要提示与表单确认等打断式场景。Varlet 同时提供函数式与组件式两种调用方式，两者参数与效果没有本质区别。

**基础用法**：

```vue
<script setup>
import { ref } from 'vue'
import { Dialog } from '@varlet/ui'

const show = ref(false)

async function openByFunction() {
  // 返回值 Promise 解析为 confirm | cancel | close
  console.log(await Dialog('兰亭临帖 行书如行云流水'))
}
</script>

<template>
  <var-button type="primary" block @click="openByFunction">函数式调用</var-button>
  <var-button type="warning" block @click="show = true">组件式调用</var-button>

  <var-dialog
    v-model:show="show"
    title="兰亭序"
    message="兰亭临帖 行书如行云流水"
    @confirm="show = false"
  />
</template>
```

**Props / Options**：

组件式属性：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `v-model:show` | 是否显示对话框 | `boolean` | `false` |
| `title` | 对话框标题 | `string` | `提示` |
| `width` | 对话框宽度 | `string \| number` | `-` |
| `message` | 对话框内容 | `string` | `-` |
| `message-align` | 对话框内容文字对齐方式，可选值 `center` `left` `right` | `string` | `left` |
| `confirm-button` | 是否显示确认按钮 | `boolean` | `true` |
| `cancel-button` | 是否显示取消按钮 | `boolean` | `true` |
| `confirm-button-text` | 确认按钮文字 | `string` | `确认` |
| `cancel-button-text` | 取消按钮文字 | `string` | `取消` |
| `confirm-button-text-color` | 确认按钮文字颜色 | `string` | `-` |
| `cancel-button-text-color` | 取消按钮文字颜色 | `string` | `-` |
| `confirm-button-color` | 确认按钮背景颜色 | `string` | `-` |
| `cancel-button-color` | 取消按钮背景颜色 | `string` | `-` |
| `confirm-button-props` | 确认按钮属性（3.18.0） | `ButtonProps` | `-` |
| `cancel-button-props` | 取消按钮属性（3.18.0） | `ButtonProps` | `-` |
| `confirm-button-loading` | 确认按钮加载状态（3.12.0） | `boolean` | `false` |
| `cancel-button-loading` | 取消按钮加载状态（3.12.0） | `boolean` | `false` |
| `confirm-button-disabled` | 确认按钮禁用状态（3.12.0） | `boolean` | `false` |
| `cancel-button-disabled` | 取消按钮禁用状态（3.12.0） | `boolean` | `false` |
| `dialog-class` | 对话框主体区域的 class | `string` | `-` |
| `dialog-style` | 对话框主体区域的 style | `object` | `-` |
| `overlay` | 是否显示遮罩层 | `boolean` | `true` |
| `overlay-class` | 自定义遮罩层的 class | `string` | `-` |
| `overlay-style` | 自定义遮罩层的 style | `object` | `-` |
| `lock-scroll` | 是否禁止滚动穿透，禁止时滚动弹出层不会引发 body 的滚动 | `boolean` | `true` |
| `close-on-click-overlay` | 是否点击遮罩层关闭弹出层 | `boolean` | `true` |
| `close-on-key-escape` | 是否支持键盘 ESC 关闭弹窗 | `boolean` | `true` |
| `teleport` | 弹出层挂载的位置 | `TeleportProps['to'] \| false` | `body` |

函数式调用（`Dialog(options)`）的 Options：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `title` | 对话框标题 | `string` | `提示` |
| `width` | 对话框宽度 | `string \| number` | `-` |
| `message` | 对话框内容 | `string` | `-` |
| `messageAlign` | 对话框内容文字对齐方式，可选值 `center` `left` `right` | `string` | `left` |
| `confirmButton` | 是否显示确认按钮 | `boolean` | `true` |
| `cancelButton` | 是否显示取消按钮 | `boolean` | `true` |
| `confirmButtonText` | 确认按钮文字 | `string` | `确认` |
| `cancelButtonText` | 取消按钮文字 | `string` | `取消` |
| `confirmButtonTextColor` | 确认按钮文字颜色 | `string` | `-` |
| `cancelButtonTextColor` | 取消按钮文字颜色 | `string` | `-` |
| `confirmButtonColor` | 确认按钮背景颜色 | `string` | `-` |
| `cancelButtonColor` | 取消按钮背景颜色 | `string` | `-` |
| `confirmButtonProps` | 确认按钮属性（3.18.0） | `ButtonProps` | `-` |
| `cancelButtonProps` | 取消按钮属性（3.18.0） | `ButtonProps` | `-` |
| `confirmButtonLoading` | 确认按钮加载状态（3.12.0） | `boolean` | `false` |
| `cancelButtonLoading` | 取消按钮加载状态（3.12.0） | `boolean` | `false` |
| `confirmButtonDisabled` | 确认按钮禁用状态（3.12.0） | `boolean` | `false` |
| `cancelButtonDisabled` | 取消按钮禁用状态（3.12.0） | `boolean` | `false` |
| `dialogClass` | 对话框主体区域的 class | `string` | `-` |
| `dialogStyle` | 对话框主体区域的 style | `object` | `-` |
| `overlay` | 是否显示遮罩层 | `boolean` | `true` |
| `overlayClass` | 自定义遮罩层的 class | `string` | `-` |
| `overlayStyle` | 自定义遮罩层的 style | `object` | `-` |
| `lockScroll` | 是否禁止滚动穿透，禁止时滚动弹出层不会引发 body 的滚动 | `boolean` | `true` |
| `closeOnClickOverlay` | 是否点击遮罩层关闭弹出层 | `boolean` | `true` |
| `closeOnKeyEscape` | 是否支持键盘 ESC 关闭弹窗 | `boolean` | `true` |
| `onOpen` | 对话框开启回调 | `() => void` | `-` |
| `onOpened` | 对话框开启动画结束回调 | `() => void` | `-` |
| `onBeforeClose` | 对话框关闭前回调，会阻止关闭 | `(action, done, refs) => void` | `-` |
| `onClose` | 对话框关闭回调 | `() => void` | `-` |
| `onClosed` | 对话框关闭动画结束回调 | `() => void` | `-` |
| `onConfirm` | 确认回调 | `() => void` | `-` |
| `onCancel` | 取消回调 | `() => void` | `-` |
| `onClickOverlay` | 遮罩层点击回调 | `() => void` | `-` |
| `onKeyEscape` | 点击键盘 ESC 时触发 | `() => void` | `-` |

**Events**：

| 事件 | 说明 | 回调参数 |
| --- | --- | --- |
| `open` | 打开对话框时触发 | 无 |
| `opened` | 打开对话框动画结束时触发 | 无 |
| `before-close` | 对话框关闭前触发，会阻止关闭 | `action: 'confirm' \| 'cancel' \| 'close'`、`done: () => void`、`refs: DialogBeforeCloseRefs` |
| `close` | 关闭对话框时触发 | 无 |
| `closed` | 关闭对话框动画结束时触发 | 无 |
| `confirm` | 确认时触发 | 无 |
| `cancel` | 取消时触发 | 无 |
| `click-overlay` | 点击遮罩层时触发 | 无 |
| `key-escape` | 点击键盘 ESC 时触发 | 无 |

**Slots**：

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `default` | 对话框主要内容 | 无 |
| `title` | 对话框标题 | 无 |
| `actions` | 对话框底部操作区域（3.3.3） | `slotClass: string` 操作容器样式、`cancel: () => void` 取消的回调函数、`confirm: () => void` 确认的回调函数 |

**Methods**：

| 方法 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| `Dialog` | 函数式显示对话框，参数为字符串时作为 `message` | `options \| string` | `Promise<'confirm' \| 'cancel' \| 'close'>` |
| `Dialog.close` | 关闭当前对话框 | 无 | 无 |
| `Dialog.setDefaultOptions` | 设置默认的选项配置 | `options` | 无 |
| `Dialog.resetDefaultOptions` | 重置默认的选项配置 | 无 | 无 |

**注意**：

- 函数式调用 `Dialog(...)` 返回 `Promise`，其解析值表示用户行为：`confirm`（确认）、`cancel`（取消）、`close`（点击遮罩层或 ESC 触发的关闭），可据此分发后续逻辑。
- Varlet 未提供 `Dialog.confirm` / `Dialog.alert` 一类的静态快捷方法，确认、警告等弹窗请统一通过 `Dialog({...})` 传入不同的 `title`、`message`、按钮配置或使用 `var-dialog` 组件实现。
- 使用 `before-close` / `onBeforeClose` 做异步拦截时，必须在异步流程结束后调用 `done()`，否则对话框不会关闭；该回调还会提供 `confirmButtonLoading`、`cancelButtonLoading`、`confirmButtonDisabled`、`cancelButtonDisabled` 等引用以便在等待期间控制按钮状态。
- 通过插槽自定义内容时，`message` 属性不再生效，底部按钮区域可用 `actions` 插槽完全接管。

