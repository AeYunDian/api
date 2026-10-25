# CheckboxGroup 复选框组

> 分类：表单组件 ｜ 组件标签：`<var-checkbox-group>` ｜ 官方文档：https://varletjs.org/#/zh-CN/checkbox-group ｜ [返回索引](../组件索引.md)

**用途**：把多个 `Checkbox` 组织成一组多选项，统一收集所有选中值，并支持全选、反选与最大选择数量。

**基础用法**：

```vue
<script setup>
import { ref } from 'vue'

const value = ref([])
const group = ref(null)
</script>

<template>
  <var-checkbox-group ref="group" v-model="value">
    <var-checkbox :checked-value="0">吃饭</var-checkbox>
    <var-checkbox :checked-value="1">睡觉</var-checkbox>
  </var-checkbox-group>
  <var-button type="primary" @click="group.checkAll()">全选</var-button>
</template>
```

**Props**：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `v-model` | 绑定的值 | _any[]_ | `[]` |
| `max` | 最大选择的数量 | _string \| number_ | `-` |
| `direction` | 布局方向，可选值为 `horizontal` `vertical` | _string_ | `horizontal` |
| `options` | 指定可选项（3.2.11） | _CheckboxGroupOption[]_ | `[]` |
| `label-key` | 作为 label 唯一标识的键名（3.2.12） | _string_ | `label` |
| `value-key` | 作为 value 唯一标识的键名（3.2.12） | _string_ | `value` |
| `rules` | 验证规则，返回 `true` 表示验证通过，其它类型的值将转换为文本作为用户提示；自 `3.5.0` 开始支持 Zod 验证 | _((v: any[]) => any) \| ZodType \| Array<((v: any[]) => any) \| ZodType>_ | `-` |

**CheckboxGroupOption**

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `label` | 选项的标签 | _string \| VNode \| (option: CheckboxGroupOption, checked: boolean) => VNodeChild_ | `-` |
| `value` | 选项的值 | _any_ | `-` |
| `disabled` | 是否禁用 | _boolean_ | `-` |

**Events**：

| 事件 | 说明 | 回调参数 |
| --- | --- | --- |
| `change` | 变更时触发 | `value: any[]` |

**Slots**：

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `default` | 复选框组的内容 | 无 |

**Methods**：

| 方法 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| `validate` | 触发校验 | `-` | `valid: Promise<boolean>` |
| `resetValidation` | 清空校验信息 | `-` | `-` |
| `reset` | 清空绑定的值（设置为 `[]`）和校验信息 | `-` | `-` |
| `checkAll` | 全选 | `-` | `value: any[]` |
| `inverseAll` | 反选 | `-` | `value: any[]` |

**注意**：

- `v-model` 必须是数组，组内的每个 `var-checkbox` 都要设置 `checked-value` 才会被收集。
- `max` 可限制最多可选数量，超出后无法继续勾选。
- `checkAll`、`inverseAll` 需通过模板引用调用；与 `var-form` 组合时用 `rules` 校验选中数量等条件。
