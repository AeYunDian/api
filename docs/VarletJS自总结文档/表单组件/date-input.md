# DateInput 日期输入框

> 分类：表单组件 ｜ 组件标签：`<var-date-input>` ｜ 官方文档：https://varletjs.org/#/zh-CN/date-input ｜ [返回索引](../组件索引.md)

**用途**：用于输入或选择日期，支持 `date`、`month`、`year`、`datetime` 四种类型，并支持多选与范围选择，通常配合日期面板完成可视化选取。

**基础用法**：

```vue
<script setup>
import { ref } from 'vue'

const value = ref('2021-04-08')
const rangeValue = ref(['2021-04-08', '2021-04-20'])
</script>

<template>
  <var-space direction="column" size="large">
    <var-date-input v-model="value" placeholder="请选择日期" />
    <var-date-input v-model="value" type="month" placeholder="请选择月份" />
    <var-date-input v-model="rangeValue" range placeholder="请选择日期范围" />
  </var-space>
</template>
```

**Props**：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `v-model` | 绑定值，默认格式为 `YYYY-MM-DD` / `YYYY-MM` / `YYYY` / `YYYY-MM-DD HH:mm:ss`，`use-seconds` 为 `false` 时日期时间格式为 `YYYY-MM-DD HH:mm`，`value-format` 可改变绑定值类型 | _string \| number \| Date \| Array<string \| number \| Date> \| undefined_ | `-` |
| `type` | 输入类型，可选值为 `date` `month` `year` `datetime` | _string_ | `date` |
| `format` | 输入框展示格式 | _string_ | `-` |
| `value-format` | 绑定值格式，可选值为 `timestamp` `date` 或日期格式字符串 | _string_ | `-` |
| `use-seconds` | `type` 为 `datetime` 时是否精确到秒 | _boolean_ | `true` |
| `multiple` | 是否支持多选，`type` 为 `datetime` 时不支持该属性 | _boolean_ | `false` |
| `range` | 是否支持范围选择 | _boolean_ | `false` |
| `separator` | 多个日期在输入框中的分隔符 | _string_ | `, ` |
| `range-separator` | 范围展示分隔符 | _string_ | ` ~ ` |
| `placeholder` | 占位符 | _string_ | `-` |
| `variant` | 输入框风格，可选值为 `standard` `outlined` `filled` | _string_ | `standard` |
| `size` | 输入框尺寸，可选值 `normal` `small` | _string_ | `normal` |
| `line` | 是否显示分割线 | _boolean_ | `true` |
| `hint` | 是否使用占位符作为提示 | _boolean_ | `true` |
| `text-color` | 文字颜色 | _string_ | `-` |
| `focus-color` | 聚焦时的主要颜色 | _string_ | `-` |
| `blur-color` | 失焦时的主要颜色 | _string_ | `-` |
| `readonly` | 是否只读，只读时禁止输入并禁止打开面板选择 | _boolean_ | `false` |
| `disabled` | 是否禁用 | _boolean_ | `false` |
| `clearable` | 是否可清除 | _boolean_ | `false` |
| `validate-trigger` | 触发验证的时机，可选值为 `onFocus` `onBlur` `onChange` `onClick` `onClear` `onInput` | _InputValidateTrigger[]_ | `['onInput', 'onClear', 'onChange']` |
| `rules` | 验证规则，返回 `true` 表示验证通过，其它类型的值将转换为文本作为用户提示。自 `3.5.0` 开始支持 Zod 验证 | _((v: any) => any) \| ZodType \| Array<((v: any) => any) \| ZodType>_ | `-` |
| `allowed-dates` | 可选日期过滤函数，参数格式随 `type` 变化：`year` 使用 `YYYY`，`month` 使用 `YYYY-MM`，`date` / `datetime` 使用 `YYYY-MM-DD` | _(value: string) => boolean_ | `-` |
| `allowed-times` | 可选时间过滤函数，仅在 `type` 为 `datetime` 时生效 | _(date: string, position?: 'start' \| 'end') => { hours?, minutes?, seconds? }_ | `-` |
| `min` | 最小可选边界 | _string_ | `-` |
| `max` | 最大可选边界 | _string_ | `-` |
| `first-day-of-week` | 设置一周的第一天，从周日的 `0` 开始 | _string \| number_ | `0` |
| `tabindex` | 与原生 input 的 tabindex 属性一致 | _string_ | `-` |

**Events**：

| 事件 | 说明 | 回调参数 |
| --- | --- | --- |
| `focus` | 聚焦时触发 | `event: Event` |
| `blur` | 失焦时触发 | `event: Event` |
| `clear` | 清除时触发 | `value: string` |
| `change` | 绑定值变化时触发 | `value: string \| number \| Date \| Array<string \| number \| Date> \| undefined` |

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

- 绑定值格式随 `type` 变化，可通过 `value-format` 指定为 `timestamp`、`date` 或自定义日期格式字符串。
- `range` 为范围选择，此时绑定值为数组；`multiple` 多选不支持 `datetime` 类型。
- 用 `min` / `max` 限制可选边界，用 `allowed-dates`、`allowed-times` 精确控制可选的日期与时间；`use-seconds="false"` 可让日期时间精确到分钟。
