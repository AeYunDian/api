# RadioGroup 单选框组

> 分类：表单组件 ｜ 组件标签：`<var-radio-group>` ｜ 官方文档：https://varletjs.org/#/zh-CN/radio-group ｜ [返回索引](../组件索引.md)

**用途**：把多个 `Radio` 组织成一组互斥选项，统一绑定选中值并支持布局方向与整体校验。

**基础用法**：

```vue
<script setup>
import { ref } from 'vue'

const value = ref(0)
</script>

<template>
  <var-radio-group v-model="value">
    <var-radio :checked-value="0">吃饭</var-radio>
    <var-radio :checked-value="1">睡觉</var-radio>
  </var-radio-group>
</template>
```

**Props**：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `v-model` | 绑定的值 | _any_ | `-` |
| `direction` | 布局方向，可选值为 `horizontal` `vertical` | _string_ | `horizontal` |
| `options` | 指定可选项（3.2.14） | _RadioGroupOption[]_ | `[]` |
| `label-key` | 作为 label 唯一标识的键名（3.2.14） | _string_ | `label` |
| `value-key` | 作为 value 唯一标识的键名（3.2.14） | _string_ | `value` |
| `rules` | 验证规则，返回 `true` 表示验证通过，其它类型的值将转换为文本作为用户提示；自 `3.5.0` 开始支持 Zod 验证 | _((v: any) => any) \| ZodType \| Array<((v: any) => any) \| ZodType>_ | `-` |
| `aria-label` | 单选框组的标签（3.8.5） | _string_ | `-` |

**RadioGroupOption**

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `label` | 选项的标签 | _string \| VNode \| (option: RadioGroupOption, checked: boolean) => VNodeChild_ | `-` |
| `value` | 选项的值 | _any_ | `-` |
| `disabled` | 是否禁用 | _boolean_ | `-` |

**Events**：

| 事件 | 说明 | 回调参数 |
| --- | --- | --- |
| `change` | 变更时触发 | `value: any` |

**Slots**：

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `default` | 单选框组的内容 | 无 |

**Methods**：

| 方法 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| `validate` | 触发校验 | `-` | `valid: Promise<boolean>` |
| `resetValidation` | 清空校验信息 | `-` | `-` |
| `reset` | 清空绑定的值（设置为 `undefined`）和校验信息 | `-` | `-` |

**注意**：

- 组内的每个 `var-radio` 都必须设置 `checked-value`，单选框组会用它与 `v-model` 的值比对。
- `options` 属性可直接渲染子项，配合 `label-key`、`value-key` 适配自定义字段的数组。
- 在 `var-form` 中使用时通过 `rules` 校验，校验函数返回 `true` 表示通过，其它返回值作为提示文本。
