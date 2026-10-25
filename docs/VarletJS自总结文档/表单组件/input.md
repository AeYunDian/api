# Input 输入框

> 分类：表单组件 ｜ 组件标签：`<var-input>` ｜ 官方文档：https://varletjs.org/#/zh-CN/input ｜ [返回索引](../组件索引.md)

**用途**：行为和原生输入框基本一致，用户输入时始终获得一个符合 `type` 规则的字符串，适用于单行文本、密码、数字、电话以及多行文本域等输入场景，支持 `standard`、`outlined`、`filled` 三种外观。

**基础用法**：

```vue
<script setup>
import { ref } from 'vue'

const value = ref('')
const rules = (v) => v.length > 6 || '文本长度必须大于 6'
</script>

<template>
  <var-space direction="column" size="large">
    <var-input v-model="value" placeholder="请输入文本" clearable />
    <var-input v-model="value" variant="outlined" :rules="rules" placeholder="带校验" />
    <var-input v-model="value" textarea :maxlength="100" placeholder="文本域" />
  </var-space>
</template>
```

**Props**：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `v-model` | 绑定的值 | _string_ | `-` |
| `placeholder` | 占位符 | _string_ | `-` |
| `type` | 输入框类型，可选值为 `text` `password` `number` `tel` | _string_ | `text` |
| `size` | 输入框尺寸，可选值 `normal` `small` | _string_ | `normal` |
| `variant` | 输入框风格，可选值为 `standard` `outlined` `filled` | _string_ | `standard` |
| `maxlength` | 最大长度 | _string \| number_ | `-` |
| `textarea` | 是否是文本域 | _boolean_ | `false` |
| `rows` | 文本域的显示行数 | _string \| number_ | `8` |
| `line` | 是否显示分割线 | _boolean_ | `true` |
| `hint` | 是否使用占位符作为提示 | _boolean_ | `true` |
| `text-color` | 文字颜色 | _string_ | `-` |
| `focus-color` | 聚焦时的主要颜色 | _string_ | `-` |
| `blur-color` | 失焦时的主要颜色 | _string_ | `-` |
| `readonly` | 是否只读 | _boolean_ | `false` |
| `disabled` | 是否禁用 | _boolean_ | `false` |
| `clearable` | 是否可清除 | _boolean_ | `false` |
| `resize` | 文本域是否可以拖动调整尺寸 | _boolean_ | `false` |
| `autofocus` | 是否自动聚焦 | _boolean_ | `false` |
| `validate-trigger` | 触发验证的时机，可选值为 `onFocus` `onBlur` `onChange` `onClick` `onClear` `onInput` | _InputValidateTrigger[]_ | `['onInput', 'onClear']` |
| `rules` | 验证规则，返回 `true` 表示验证通过，其它类型的值将转换为文本作为用户提示。自 `3.5.0` 开始支持 Zod 验证 | _((v: string) => any) \| ZodType \| Array<((v: string) => any) \| ZodType>_ | `-` |
| `enterkeyhint` | 定制回车键样式，参见 MDN | _string_ | `-` |
| `aria-label` | 无障碍标签，参见 MDN（`3.8.4` 起支持） | _string_ | `-` |
| `prevent-auto-fill` | 阻止浏览器的自动填充行为（`3.11.4` 起支持） | _boolean_ | `true` |
| `inputmode` | 与原生 input 的 inputmode 属性一致（`3.11.4` 起支持） | _string_ | `-` |
| `tabindex` | 与原生 input 的 tabindex 属性一致（`3.12.1` 起支持） | _string_ | `-` |

**Events**：

| 事件 | 说明 | 回调参数 |
| --- | --- | --- |
| `focus` | 聚焦时触发 | `event: Event` |
| `blur` | 失焦时触发 | `event: Event` |
| `click` | 点击时触发 | `event: Event` |
| `clear` | 清除时触发 | `value: string` |
| `input` | 输入时触发 | `value: string`, `event: Event` |
| `change` | 更新时触发 | `value: string`, `event: Event` |

**Slots**：

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `prepend-icon` | 前置图标 | 无 |
| `append-icon` | 后置图标 | 无 |
| `clear-icon` | 清除图标 | `clear: (e: Event) => void` 清除函数（使用插槽时可用于清除输入框内容） |
| `extra-message` | 附加信息 | 无 |

**Methods**：

| 方法 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| `focus` | 聚焦 | 无 | 无 |
| `blur` | 失焦 | 无 | 无 |
| `select` | 选中输入框中的所有文本 | 无 | 无 |
| `validate` | 触发校验 | 无 | `valid: Promise<boolean>` |
| `resetValidation` | 清空校验信息 | 无 | 无 |
| `reset` | 清空绑定的值和校验信息 | 无 | 无 |

**注意**：

- 通过 `v-model` 绑定值，使用 `v-model.trim` 可自动移除输入内容的首尾空白字符。
- `rules` 返回 `true` 表示校验通过，其它返回值会被转换为文本作为错误提示展示；自 `3.5.0` 起也可直接传入 Zod 的 Schema。
- 使用 `maxlength` 限制长度、`textarea` 配合 `rows` 切换到多行文本域；需要清空能力时开启 `clearable`。
