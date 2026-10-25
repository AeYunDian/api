# Select 选择框

> 分类：表单组件 ｜ 组件标签：`<var-select>` ｜ 官方文档：https://varletjs.org/#/zh-CN/select ｜ [返回索引](../组件索引.md)

**用途**：通过下拉菜单展示并选择内容，支持单选与多选，适合在有限的备选项中挑选一个或多个值。

**基础用法**：

```vue
<script setup>
import { ref } from 'vue'

const value = ref()
</script>

<template>
  <var-select v-model="value" placeholder="请选择一个选项">
    <var-option label="吃饭" />
    <var-option label="睡觉" />
  </var-select>
</template>
```

**Props**：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `v-model` | 绑定的值 | _any \| any[]_ | `-` |
| `size` | 选择框尺寸，可选值 `normal` `small` | _string_ | `normal` |
| `variant` | 选择框风格，可选值为 `standard` `outlined` `filled` | _string_ | `standard` |
| `placeholder` | 占位符 | _string_ | `-` |
| `multiple` | 是否开启多选 | _boolean_ | `false` |
| `offset-y` | 下拉菜单的垂直偏移量 | _string \| number_ | `0` |
| `chip` | 是否使用纸片风格（仅限多选） | _boolean_ | `false` |
| `line` | 是否显示分割线 | _boolean_ | `true` |
| `hint` | 是否使用占位符作为提示 | _boolean_ | `true` |
| `text-color` | 文字颜色 | _string_ | `-` |
| `focus-color` | 聚焦时的主要颜色 | _string_ | `-` |
| `blur-color` | 失焦时的主要颜色 | _string_ | `-` |
| `readonly` | 是否只读 | _boolean_ | `false` |
| `disabled` | 是否禁用 | _boolean_ | `false` |
| `clearable` | 是否可清除 | _boolean_ | `false` |
| `options` | 指定可选项（3.3.4） | _SelectOption[]_ | `[]` |
| `label-key` | 作为 label 唯一标识的键名（3.3.4） | _string_ | `label` |
| `value-key` | 作为 value 唯一标识的键名（3.3.4） | _string_ | `value` |
| `validate-trigger` | 触发验证的时机，可选值为 `onFocus` `onBlur` `onChange` `onClick` `onClear` `onClose` | _SelectValidateTrigger[]_ | `['onChange', 'onClear', 'onClose']` |
| `rules` | 验证规则，返回 `true` 表示验证通过，其它类型的值将转换为文本作为用户提示；自 `3.5.0` 开始支持 Zod 验证 | _((v: any) => any) \| ZodType \| Array<((v: any) => any) \| ZodType>_ | `-` |
| `tabindex` | 与原生 select 的 tabindex 属性一致（3.12.1） | _string_ | `-` |
| `filterable` | 是否可以过滤（3.14.0） | _boolean_ | `false` |
| `filter` | 自定义过滤方法（3.14.0） | _(pattern: string, option: SelectOption) => boolean_ | `-` |

**SelectOption**

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `label` | 选项的标签 | _string \| VNode \| (option: SelectOption, selected: boolean) => VNodeChild_ | `-` |
| `value` | 选项的值 | _any_ | `-` |
| `disabled` | 是否禁用 | _boolean_ | `-` |

**Option Props**

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `label` | 选项显示的文本 | _any_ | `-` |
| `value` | 选项绑定的值 | _any_ | `-` |
| `disabled` | 是否禁用 | _boolean_ | `false` |
| `ripple` | 是否启用水波效果（3.8.0） | _boolean_ | `true` |

**Events**：

| 事件 | 说明 | 回调参数 |
| --- | --- | --- |
| `focus` | 聚焦时触发 | `event: Event` |
| `blur` | 失焦时触发 | `event: Event` |
| `click` | 点击时触发 | `event: Event` |
| `clear` | 清除时触发 | `value: any \| any[]` |
| `close` | 关闭时触发 | `value: any[]` |
| `change` | 更新时触发 | `value: any \| any[]` |

**Slots**：

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `selected` | 选择区域的内容 | 无 |
| `prepend-icon` | 前置图标 | 无 |
| `clear-icon` | 清除图标 | `clear: (e: Event) => void` 清除函数，在使用插槽时可用于清除选择框内容 |
| `append-icon` | 后置图标 | 无 |
| `arrow-icon` | 箭头图标 | `focus: boolean` 是否处于聚焦状态、`menu-open: boolean` 是否菜单被打开 |
| `empty` | 无选项或过滤无结果时展示的内容，可完全定制整个空状态容器；未使用时为带国际化默认文案的默认空状态（3.14.0） | 无 |

**Option Slots**

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `default` | 选项显示的内容 | `selected: boolean` 是否选中 |

**Methods**：

| 方法 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| `focus` | 聚焦 | `-` | `-` |
| `blur` | 失焦 | `-` | `-` |
| `validate` | 触发校验 | `-` | `valid: Promise<boolean>` |
| `resetValidation` | 清空校验信息 | `-` | `-` |
| `reset` | 清空绑定的值（单选设置为 `undefined`，多选设置为 `[]`）和校验信息 | `-` | `-` |

**注意**：

- 通过 `v-model` 绑定值，单选时是单个值，开启 `multiple` 后是数组，多选建议初始化 `ref([])`。
- 选项既可以用 `var-option` 子组件声明，也可以用 `options` 属性配合 `label-key`、`value-key` 自定义字段。
- 可单独用 `rules` 校验，也可放在 `var-form` 中由表单统一校验；`validate-trigger` 决定何时触发校验。
