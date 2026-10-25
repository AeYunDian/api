# AutoComplete 自动补全

> 分类：表单组件 ｜ 组件标签：`<var-auto-complete>` ｜ 官方文档：https://varletjs.org/#/zh-CN/auto-complete ｜ [返回索引](../组件索引.md)

**用途**：在输入框中输入内容时，根据 `options` 展示候选下拉菜单并自动补全，常用于邮箱后缀补全、搜索建议等场景。

**基础用法**：

```vue
<script setup>
import { ref, computed } from 'vue'

const value = ref('')
const options = computed(() =>
  ['@qq.com', '@163.com', '@gmail.com'].map((suffix) => {
    const [prefix] = value.value.split('@')
    return { label: `${prefix}${suffix}`, value: `${prefix}${suffix}` }
  })
)
</script>

<template>
  <var-auto-complete v-model="value" :options="options" placeholder="请输入邮箱" />
</template>
```

**Props**：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `v-model` | 绑定的值 | _string_ | `-` |
| `variant` | 输入框风格，可选值为 `standard` `outlined` `filled` | _string_ | `standard` |
| `size` | 输入框尺寸，可选值 `normal` `small` | _string_ | `normal` |
| `placeholder` | 占位符 | _string_ | `-` |
| `options` | 指定可选项 | _AutoCompleteOption[]_ | `[]` |
| `label-key` | 作为 label 唯一标识的键名 | _string_ | `label` |
| `value-key` | 作为 value 唯一标识的键名 | _string_ | `value` |
| `maxlength` | 最大长度 | _string \| number_ | `-` |
| `readonly` | 是否只读 | _boolean_ | `false` |
| `disabled` | 是否禁用 | _boolean_ | `false` |
| `validate-trigger` | 触发验证的时机，可选值为 `onFocus` `onBlur` `onChange` `onClick` `onClear` `onInput` | _AutoCompleteValidateTrigger[]_ | `['onInput', 'onClear', 'onChange']` |
| `rules` | 验证规则，返回 `true` 表示验证通过，其余的值则转换为文本作为用户提示 | _((v: string) => any) \| ZodType \| Array<((v: string) => any) \| ZodType>_ | `-` |
| `enterkeyhint` | 定制回车键样式，参见 MDN | _string_ | `-` |
| `clearable` | 是否可清除 | _boolean_ | `false` |
| `line` | 是否显示分割线 | _boolean_ | `true` |
| `hint` | 是否使用占位符作为提示 | _boolean_ | `true` |
| `text-color` | 文字颜色 | _string_ | `-` |
| `focus-color` | 聚焦时的主要颜色 | _string_ | `-` |
| `blur-color` | 失焦时的主要颜色 | _string_ | `-` |
| `get-show` | 根据输入值决定是否显示菜单 | _(v: string) => boolean_ | `-` |
| `tabindex` | 与原生 input 的 tabindex 属性一致（`3.12.1` 起支持） | _string_ | `-` |

选项对象的字段如下：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `label` | 选项的标签 | _string \| VNode \| (option: AutoCompleteOption, checked: boolean) => VNodeChild_ | `-` |
| `value` | 选项的值 | _any_ | `-` |
| `disabled` | 是否禁用 | _boolean_ | `-` |

**Events**：

| 事件 | 说明 | 回调参数 |
| --- | --- | --- |
| `focus` | 聚焦时触发 | 无 |
| `blur` | 失焦时触发 | 无 |
| `click` | 点击时触发 | `event: Event` |
| `clear` | 清除时触发 | `value: string` |
| `input` | 输入时触发 | `value: string`, `event: Event` |
| `change` | 更新时触发 | `value: string` |

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
| `validate` | 触发校验 | 无 | `valid: Promise<boolean>` |
| `resetValidation` | 清空校验信息 | 无 | 无 |
| `reset` | 清空绑定的值和校验信息 | 无 | 无 |

**注意**：

- `options` 默认识别 `label` 与 `value` 字段，字段名不同时用 `label-key`、`value-key` 指定。
- 通过 `get-show` 可自定义菜单显示时机，例如输入满一定长度后才展开候选列表。
- 组件支持 `rules` 字段校验与 `clearable` 清除，样式可沿用 Input 的外观配置。
