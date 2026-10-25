# Form 表单

> 分类：表单组件 ｜ 组件标签：`<var-form>` ｜ 官方文档：https://varletjs.org/#/zh-CN/form ｜ [返回索引](../组件索引.md)

**用途**：提供了对所有表单组件进行控制的能力。把一组可输入组件（`var-input`、`var-select`、`var-radio-group`、`var-checkbox-group`、`var-uploader` 等）包裹进 `var-form` 后，即可在表单层面统一触发校验、清空校验信息、重置数值，统一控制禁用 / 只读，并在校验失败时自动滚动到出错的表单项。典型场景是登录注册、资料填写、地址编辑等需要一次性提交多项校验的页面。

**基础用法**：通过 `ref` 拿到表单实例，调用 `validate()` 触发全部校验，用 `reset()` 清空值与校验信息，用 `resetValidation()` 仅清空校验信息。

```vue
<script setup>
import { reactive, ref } from 'vue'
import { Snackbar } from '@varlet/ui'

const form = ref(null)
const formData = reactive({
  username: '',
  password: '',
})

async function handleSubmit() {
  const valid = await form.value.validate()
  valid ? Snackbar.success('校验通过') : Snackbar.error('校验失败')
}

function handleReset() {
  form.value.reset()
}
</script>

<template>
  <var-form ref="form" scroll-to-error="start">
    <var-input v-model="formData.username" variant="outlined" placeholder="请输入用户名"
      :rules="[(v) => !!v || '用户名不能为空']" />
    <var-input v-model="formData.password" variant="outlined" type="password" placeholder="请输入密码"
      :rules="[(v) => !!v || '密码不能为空', (v) => v.length >= 8 || '密码长度不能低于8位']" />
    <var-button type="primary" block @click="handleSubmit">提交</var-button>
    <var-button block @click="handleReset">清空</var-button>
  </var-form>
</template>
```

**Props**

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `readonly` | 是否只读 | _boolean_ | `false` |
| `disabled` | 是否禁用 | _boolean_ | `false` |
| `scroll-to-error` | 是否在校验不通过时滚动到不通过的表单项，可选值为 `start` `end` | _string_ | `-` |
| `scroll-to-error-offset-y` | 滚动到校验不通过的表单项的位置偏移量 | _number \| string_ | `0` |

说明：官方文档中 `Form` 没有 `model` 属性，表单数据不使用统一的数据对象收集，而是由每个表单组件各自通过 `v-model` 绑定；校验规则通过各表单组件自己的 `rules` 属性声明。

**Rules 规则**：Varlet 的校验规则挂在各表单组件的 `rules` 属性上（可传单个规则或规则数组），规则本身只有「函数」和「Zod Schema」两种形态，函数返回 `true` 表示通过、返回字符串则作为错误信息展示。

| 字段 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| 函数式规则 | 接收当前值与组件提供的 apis，返回 `true` 表示通过；返回非 `true` 的值时，该值会被 `String()` 转换为错误信息 | _Function_ | `-` |
| Zod Schema 规则 | 传入 Zod Schema，内部用 `safeParseAsync` 校验，失败时取第一个 `issue` 的 `message` 作为错误信息 | _ZodType_ | `-` |
| `rules` | 组件属性，规则集合；可以是单个函数 / 单个 Schema，也可以是它们的数组 | _any \| any[]_ | `-` |
| `validate-trigger` | 组件属性，指定在哪些时机触发校验（如 `onInput`、`onBlur`、`onChange`、`onClear` 等） | _string[]_ | 随组件而定，如 Input 为 `['onInput', 'onClear']` |

说明：官方文档没有定义 `required`、`message`、`type`、`pattern`、`validator`、`min`、`max`、`length` 这类「对象式」校验字段，此类配置请改用函数规则或 Zod Schema 实现。

**Methods**

| 方法 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| `validate` | 触发所有表单组件的校验 | `-` | `valid: Promise<boolean>` |
| `resetValidation` | 清空所有表单组件的校验信息 | `-` | `-` |
| `reset` | 清空所有表单组件绑定的值和校验信息 | `-` | `-` |

**Events**

| 事件 | 说明 | 回调参数 |
| --- | --- | --- |
| `submit` | 表单提交时触发（需配合 `native-type="submit"` 的按钮） | `valid: boolean` 是否通过表单验证 |
| `reset` | 表单清空时触发（需配合 `native-type="reset"` 的按钮） | `-` |

**Slots**

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `default` | 表单内容 | `-` |

**注意**

1. `validate()` 返回的是 `Promise<boolean>`，必须 `await` 或 `.then()` 才能拿到校验结果；不返回则会拿到一个 Promise 对象而误判为通过。
2. 设置了 `scroll-to-error` 后，校验不通过时会等待约 300ms（等待 `var-form-details` 展开动画）再滚动到第一个出错项，可用 `scroll-to-error-offset-y` 补偿固定头部的遮挡。
3. `reset()` 会同时清空**值和校验信息**，只想清掉红色错误提示而不清用户输入时请用 `resetValidation()`。

## FormItem 表单项

原文中**没有**独立的 `FormItem` 表单项组件（`packages/varlet-ui/src/` 下不存在 `form-item` 目录，官方文档也只有 `form` 一篇），因此其 Props、Slots、Events 均为「无」。Varlet 采用「表单组件自带校验」的方案：每个可输入组件自带 `rules` 与 `validate-trigger`，错误信息由内置的 `var-form-details` 渲染。

作为等价物，表单组件上通用的校验相关属性如下：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `rules` | 校验规则，函数或规则数组 | _any \| any[]_ | `-` |
| `validate-trigger` | 触发校验的时机数组，各组件默认值不同 | _string[]_ | 随组件而定 |

错误信息展示组件 `var-form-details` 的属性：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `error-message` | 错误信息 | _string_ | `-` |
| `extra-message` | 附加信息 | _string_ | `-` |

自定义组件接入表单能力时，使用 `Form.useForm()` 与 `Form.useValidation()` 组合出 `validate`、`reset`、`resetValidation` 三个方法并 `defineExpose` 暴露、同时调用 `bindForm(apis)` 注册到外层表单，才能被外层 `var-form` 统一调度。

**FormItem Slots**

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| 无 | 原文未定义 FormItem 插槽，错误信息由 `var-form-details` 渲染 | `-` |

**FormItem Events**

| 事件 | 说明 | 回调参数 |
| --- | --- | --- |
| 无 | 原文未定义 FormItem 事件，校验结果通过 `validate()` 返回值获取 | `-` |
