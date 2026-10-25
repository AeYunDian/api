# OtpInput 验证码输入框

> 分类：表单组件 ｜ 组件标签：`<var-otp-input>` ｜ 官方文档：https://varletjs.org/#/zh-CN/otp-input ｜ [返回索引](../组件索引.md)

**用途**：用于输入短信验证码、邮箱验证码等多位短码，`v-model` 始终是完整字符串，输入满 `length` 位时触发 `complete` 事件。

**基础用法**：

```vue
<script setup>
import { ref } from 'vue'

const value = ref('')

function handleComplete(code) {
  console.log('输入完成', code)
}
</script>

<template>
  <var-otp-input v-model="value" :length="6" type="digit" @complete="handleComplete" />
</template>
```

**Props**：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `v-model` | 验证码值 | _string_ | `''` |
| `length` | 验证码位数 | _string \| number_ | `6` |
| `type` | 验证码类型，可选值为 `digit` `text` `alphanumeric` | _OtpInputType_ | `digit` |
| `variant` | 风格，可选值为 `standard` `outlined` `filled` | _Variant_ | `outlined` |
| `mask` | 是否掩码显示 | _boolean_ | `false` |
| `mask-symbol` | 掩码字符 | _string_ | `•` |
| `cell-height` | 单格高度 | _string \| number_ | `48` |
| `cell-max-width` | 单格最大宽度 | _string \| number_ | `48` |
| `text-color` | 文字颜色 | _string_ | `-` |
| `focus-color` | 聚焦时主要颜色 | _string_ | `-` |
| `blur-color` | 失焦时主要颜色 | _string_ | `-` |
| `disabled` | 是否禁用 | _boolean_ | `false` |
| `readonly` | 是否只读 | _boolean_ | `false` |
| `autofocus` | 初始化后是否自动聚焦 | _boolean_ | `false` |
| `gutter` | 格子间距 | _string \| number_ | `8` |
| `align` | 组件整体内容对齐方式，可选值为 `start` `center` `end`（`3.16.1` 起支持） | _OtpInputAlign_ | `center` |
| `validate-trigger` | 触发校验的时机，可选值为 `onInput` `onClick` `onPaste` `onComplete` | _OtpInputValidateTrigger[]_ | `['onInput', 'onComplete']` |
| `rules` | 验证规则，返回 `true` 表示验证通过，其它类型的值将转换为文本作为用户提示，支持 Zod 验证 | _((v: string) => any) \| ZodType \| Array<((v: string) => any) \| ZodType>_ | `-` |
| `allow-paste` | 是否允许粘贴整串验证码 | _boolean_ | `true` |
| `paste-transform` | 粘贴内容转换器 | _(value: string) => string_ | `-` |

**Events**：

| 事件 | 说明 | 回调参数 |
| --- | --- | --- |
| `input` | 验证码值变化时触发 | `value: string` |
| `click` | 点击组件根节点时触发 | `event: Event` |
| `paste` | 粘贴时触发 | `value: string`, `event: ClipboardEvent` |
| `complete` | 输入满 `length` 时触发 | `value: string` |

**Slots**：

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `separator` | 自定义分隔位内容 | `index: number` |

**Methods**：

| 方法 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| `focus` | 聚焦到首个空位，或指定位置 | `index?: number` | 无 |
| `blur` | 使所有输入格失焦 | 无 | 无 |
| `reset` | 清空绑定的值和校验信息 | 无 | 无 |
| `validate` | 触发校验 | 无 | `valid: Promise<boolean>` |
| `resetValidation` | 清空校验信息 | 无 | 无 |

**注意**：

- `type` 决定可输入字符范围，`digit` 仅数字、`text` 仅字母、`alphanumeric` 为字母数字混合。
- 默认允许粘贴整串验证码，超出 `length` 的内容会自动截断；可用 `paste-transform` 对粘贴内容做清洗与转换。
- 设置 `mask` 开启掩码显示，配合 `mask-symbol` 自定义掩码字符。
