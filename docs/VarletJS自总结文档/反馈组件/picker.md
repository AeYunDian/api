# Picker 多列选择器

> 分类：反馈组件 ｜ 组件标签：`<var-picker>` ｜ 官方文档：https://varletjs.org/#/zh-CN/picker ｜ [返回索引](../组件索引.md)

**用途**：提供单列、多列与级联联动的选项选择能力，支持组件调用与 `Picker()` 函数调用两种方式，常用于地区选择、日期区间、规格组合等表单场景。

**基础用法**

```vue
<script setup>
import { ref } from 'vue'
import { Snackbar } from '@varlet/ui'

const columns = ref([
  [
    { text: 'A' },
    { text: 'B' },
    { text: 'C' },
    { text: 'D' },
    { text: 'E' },
  ],
])

function handleChange(values, indexes) {
  Snackbar(`values: ${values.toString()}, indexes: ${indexes.toString()}`)
}
</script>

<template>
  <var-picker :columns="columns" @change="handleChange" />
</template>
```

**Props**

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `v-model` | 绑定的值 | _(string \| number)[]_ | `[]` |
| `columns` | 列内容 | _PickerColumnOption[] \| PickerColumnOption[][]_ | `[]` |
| `title` | 标题 | _string_ | `请选择` |
| `text-key` | 文本的属性 key | _string_ | `text` |
| `value-key` | 值的属性 key | _string_ | `value` |
| `children-key` | 级联子列表 key | _string_ | `children` |
| `toolbar` | 是否显示上方工具栏 | _boolean_ | `true` |
| `cascade` | 是否开启级联模式 | _boolean_ | `true` |
| `option-height` | 选项的高度（px rem） | _string \| number_ | `44` |
| `option-count` | 可见的选项个数 | _string \| number_ | `6` |
| `columns-count`（3.3.11） | 最大显示列数 | _string \| number_ | `-` |
| `confirm-button-text` | 确认按钮文字 | _string_ | `确认` |
| `cancel-button-text` | 取消按钮文字 | _string_ | `取消` |
| `confirm-button-text-color` | 确认按钮文字颜色 | _string_ | `-` |
| `cancel-button-text-color` | 取消按钮文字颜色 | _string_ | `-` |
| `close-on-key-escape` | 是否支持键盘 ESC 关闭选择器 | _boolean_ | `true` |

**Events**

| 事件 | 说明 | 回调参数 |
| --- | --- | --- |
| `change` | 选择内容变化时触发 | `values: (string \| number)[]` 选择的值列表、`indexes: number[]` 选择的下标列表、`options: PickerColumnOption[]` 选择的选项对象列表 |
| `cancel` | 点击取消按钮时触发 | `values`、`indexes`、`options`，同上 |
| `confirm` | 点击确认按钮时触发 | `values`、`indexes`、`options`，同上 |
| `key-escape` | 点击键盘 ESC 时触发 | 无 |

**Slots**

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `title` | 标题内容 | 无 |
| `cancel` | 取消按钮内容 | 无 |
| `confirm` | 确认按钮内容 | 无 |

**Methods**

| 方法 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| `confirm` | 立刻停止滚动并触发 confirm 事件 | 无 | 无 |
| `cancel` | 立刻停止滚动并触发 cancel 事件 | 无 | 无 |

**注意**

- 选项对象的字段为 `text`（文本）、`value`（值）、`children`（级联子列表）、`className`（附加类名）、`textClassName`（文本附加类名），可通过 `text-key`、`value-key`、`children-key` 自定义映射字段名。
- 函数调用 `Picker({ ... })` 使用 camelCase 同名配置（如 `columnsCount`、`confirmButtonText`、`optionHeight`），并额外支持 `closeOnClickOverlay`、`safeArea`、`onClickOverlay`、`onOpen`、`onOpened`、`onClose`、`onClosed`、`onChange`、`onConfirm`、`onCancel`、`onKeyEscape`。
- 函数调用返回 Promise，解析值为 `{ state, values, indexes, options, texts }`，其中 `state` 为 `confirm`、`cancel`、`close` 之一；组件库内置中国省市区级联数据，可直接 `import columns from '@varlet/ui/json/area.json'` 使用。

