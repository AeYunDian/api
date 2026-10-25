# ActionSheet 动作面板

> 分类：反馈组件 ｜ 组件标签：`<var-action-sheet>` ｜ 官方文档：https://varletjs.org/#/zh-CN/action-sheet ｜ [返回索引](../组件索引.md)

**用途**：弹出一个动作面板，提供用户选择选项的能力，常用于操作菜单、选择器、底部弹出的操作列表。

**基础用法**：

函数式调用（返回 `Promise`，选择时返回当前选中的 `action`，点击遮罩层关闭返回 `close`）：

```vue
<script setup>
import { Snackbar, ActionSheet } from '@varlet/ui'

async function handleSelect() {
  const action = await ActionSheet({
    title: '选择一个你喜欢的吧',
    actions: [
      { name: 'Item 01', icon: 'account-circle' },
      { name: 'Item 02', icon: 'notebook' },
      { name: 'Item 03', icon: 'wifi', disabled: true },
    ],
  })

  action !== 'close' && Snackbar(`您选择的是:${action.name}`)
}
</script>

<template>
  <var-button type="primary" block @click="handleSelect">基本使用</var-button>
</template>
```

组件式调用：

```vue
<script setup>
import { ref } from 'vue'

const show = ref(false)
const actions = ref([
  { name: 'Item 01', icon: 'account-circle' },
  { name: 'Item 02', icon: 'notebook' },
])
</script>

<template>
  <var-button type="warning" block @click="show = true">基本使用</var-button>
  <var-action-sheet :actions="actions" v-model:show="show" @select="(action) => console.log(action)" />
</template>
```

**Props / Options**：

组件调用时的属性：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `v-model:show` | 是否显示动作面板 | `boolean` | `false` |
| `actions` | 选项列表 | `Actions` | `[]` |
| `title` | 动作面板标题 | `string` | `请选择` |
| `overlay` | 是否显示遮罩层 | `boolean` | `true` |
| `overlay-class` | 自定义遮罩层的 class | `string` | `-` |
| `overlay-style` | 自定义遮罩层的 style | `object` | `-` |
| `lock-scroll` | 是否禁止滚动穿透，禁止时滚动弹出层不会引发 body 的滚动 | `boolean` | `true` |
| `close-on-click-action` | 是否点击选项时关闭动作面板 | `boolean` | `true` |
| `close-on-click-overlay` | 是否点击遮罩层关闭动作面板 | `boolean` | `true` |
| `close-on-key-escape` | 是否支持键盘 ESC 关闭动作面板 | `boolean` | `true` |
| `safe-area` | 是否开启底部安全区适配 | `boolean` | `false` |
| `teleport` | 动作面板挂载的位置 | `TeleportProps['to'] \| false` | `body` |

函数式调用时传入的选项（Options）：

| 选项 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `actions` | 选项列表 | `Actions` | `[]` |
| `title` | 动作面板标题 | `string` | `请选择` |
| `overlay` | 是否显示遮罩层 | `boolean` | `true` |
| `overlayClass` | 自定义遮罩层的 class | `string` | `-` |
| `overlayStyle` | 自定义遮罩层的 style | `object` | `-` |
| `lockScroll` | 是否禁止滚动穿透，禁止时滚动弹出层不会引发 body 的滚动 | `boolean` | `true` |
| `closeOnClickAction` | 是否点击选项时关闭动作面板 | `boolean` | `true` |
| `closeOnClickOverlay` | 是否点击遮罩层关闭弹出层 | `boolean` | `true` |
| `closeOnKeyEscape` | 是否支持键盘 ESC 关闭动作面板 | `boolean` | `true` |
| `safe-area` | 是否开启底部安全区适配 | `boolean` | `false` |
| `onOpen` | 动作面板开启回调 | `() => void` | `-` |
| `onOpened` | 动作面板开启动画结束回调 | `() => void` | `-` |
| `onClose` | 动作面板关闭回调 | `() => void` | `-` |
| `onClosed` | 动作面板关闭动画结束回调 | `() => void` | `-` |
| `onSelect` | 选项选择时回调 | `(action: Action) => void` | `-` |
| `onClickOverlay` | 遮罩层点击回调 | `() => void` | `-` |
| `onKeyEscape` | 点击键盘 ESC 时触发 | `() => void` | `-` |

`Action` 数据结构：

| 字段 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `name` | 选项名称 | `string` | `-` |
| `color` | 选项文字颜色 | `string` | `-` |
| `icon` | icon 图标，支持网络图片地址、VNode 或渲染函数 | `string \| VNode \| () => VNode` | `-` |
| `iconSize` | 图标尺寸 | `string` | `-` |
| `namespace` | 图标命名空间 | `string` | `-` |
| `className` | 选项附加类名 | `string` | `-` |
| `disabled` | 是否禁用选项 | `boolean` | `false` |

**Events**：

| 事件 | 说明 | 回调参数 |
| --- | --- | --- |
| `select` | 选择选项时触发 | `action: Action` |
| `open` | 打开动作面板时触发 | 无 |
| `opened` | 打开动作面板动画结束时触发 | 无 |
| `close` | 关闭动作面板时触发 | 无 |
| `closed` | 关闭动作面板动画结束时触发 | 无 |
| `click-overlay` | 点击遮罩层时触发 | 无 |
| `key-escape` | 点击键盘 ESC 时触发 | 无 |

**Slots**：

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `actions` | 选项列表 | 无 |
| `title` | 动作面板标题 | 无 |

**Methods**：

| 方法 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| `ActionSheet` | 显示动作面板 | `options` | 无 |
| `ActionSheet.close` | 关闭动作面板 | 无 | 无 |
| `ActionSheet.setDefaultOptions` | 设置默认的选项配置 | `options` | 无 |
| `ActionSheet.resetDefaultOptions` | 重置默认的选项配置 | 无 | 无 |

**注意**：

- 函数式调用返回 `Promise`，选择时 `resolve` 选中的 `action`，点击遮罩关闭时 `resolve` 字符串 `'close'`，需先判断再取值。
- 设置 `closeOnClickAction: false` 后可多次选择，但 `Promise` 只会 `resolve` 一次，推荐改用 `onSelect` 监听选择行为。
- 选项只有 `disabled` 为 `true` 时不可点击，样式上会使用禁用色。

