# SegmentedButtons 分段按钮

> 分类：表单组件 ｜ 组件标签：`<var-segmented-buttons>` ｜ 官方文档：https://varletjs.org/#/zh-CN/segmented-buttons ｜ [返回索引](../组件索引.md)

**用途**：把一组按钮样式的备选项横向排列，用于在少量互斥选项间快速切换，也支持多选。

**基础用法**：

```vue
<script setup>
import { ref } from 'vue'

const value = ref('day')
</script>

<template>
  <var-segmented-buttons v-model="value">
    <var-segmented-button checked-value="day">天</var-segmented-button>
    <var-segmented-button checked-value="week">周</var-segmented-button>
    <var-segmented-button checked-value="month">月</var-segmented-button>
  </var-segmented-buttons>
</template>
```

**Props**：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `v-model` | 绑定的值，单选模式下为单个值，多选模式下为数组 | _any_ | `-` |
| `options` | 选项数组 | _SegmentedButtonsOption[]_ | `[]` |
| `label-key` | 作为 label 唯一标识的键名 | _string_ | `label` |
| `value-key` | 作为 value 唯一标识的键名 | _string_ | `value` |
| `multiple` | 是否开启多选 | _boolean_ | `false` |
| `checkmark` | 选中项是否显示勾选图标 | _boolean_ | `true` |
| `size` | 分段按钮尺寸，可选值为 `mini` `small` `normal` `large` | _string_ | `normal` |
| `validate-trigger` | 校验触发时机，可选值为 `onClick` `onChange` | _Array<'onClick' \| 'onChange'>_ | `['onChange']` |
| `rules` | 校验规则 | _((v: any) => any) \| ZodType \| Array<((v: any) => any) \| ZodType>_ | `-` |

**SegmentedButtonsOption**

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `label` | 分段按钮选项内容，也可以是渲染函数 | _string \| VNode \| ((option: SegmentedButtonsOption, checked: boolean) => VNodeChild)_ | `-` |
| `value` | 选项值 | _any_ | `-` |
| `disabled` | 是否禁用分段按钮选项 | _boolean_ | `-` |
| `ripple` | 是否为分段按钮选项开启水波纹效果 | _boolean_ | `-` |

**Events**：

| 事件 | 说明 | 回调参数 |
| --- | --- | --- |
| `change` | 分段按钮组的值变化时触发 | `value: any \| any[]` |

**Slots**：

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `default` | 分段按钮内容 | 无 |

**Methods**：

| 方法 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| `validate` | 触发校验 | `-` | `valid: Promise<boolean>` |
| `resetValidation` | 清空校验信息 | `-` | `-` |
| `reset` | 清空绑定的值和校验信息 | `-` | `-` |

**注意**：

- 单选时 `v-model` 绑定单个值，开启 `multiple` 后须绑定数组。
- 子按钮必须通过 `checked-value` 声明自己的值，否则无法参与选中状态管理。
- 在 `var-form` 中使用时通过 `rules` 校验，默认在 `onChange` 时触发。
