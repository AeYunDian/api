# Counter 计数器

> 分类：表单组件 ｜ 组件标签：`<var-counter>` ｜ 官方文档：https://varletjs.org/#/zh-CN/counter ｜ [返回索引](../组件索引.md)

**用途**：用于在一定范围内输入或调整数字，适合购物车数量、步进式数值录入等场景。

**基础用法**：

```vue
<script setup>
import { ref } from 'vue'

const value = ref(0)
</script>

<template>
  <var-counter v-model="value" />
</template>
```

**Props**：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `v-model` | 绑定的值 | _number_ | `0` |
| `min` | 最小值 | _string \| number_ | `-` |
| `max` | 最大值 | _string \| number_ | `-` |
| `step` | 步长 | _string \| number_ | `1` |
| `decimal-length` | 保留小数位数 | _string \| number_ | `-` |
| `color` | 背景颜色 | _string_ | `-` |
| `input-width` | 输入框的宽度 | _string \| number_ | `-` |
| `input-text-size` | 输入框的文字大小 | _string \| number_ | `-` |
| `button-size` | 按钮大小 | _string \| number_ | `-` |
| `elevation` | 海拔高度，可选值为 `true` `false` 和 `0-24` 的等级，不为简单模式时生效 | _string \| number \| boolean_ | `true` |
| `readonly` | 是否只读 | _boolean_ | `false` |
| `disabled` | 是否禁用 | _boolean_ | `false` |
| `disable-increment` | 是否禁用增加 | _boolean_ | `false` |
| `disable-decrement` | 是否禁用减少 | _boolean_ | `false` |
| `disable-input` | 是否禁用输入 | _boolean_ | `false` |
| `increment-button` | 是否显示增加按钮 | _boolean_ | `true` |
| `decrement-button` | 是否显示减少按钮 | _boolean_ | `true` |
| `press` | 是否开启按钮长按 | _boolean_ | `true` |
| `ripple` | 是否开启水波纹 | _boolean_ | `true` |
| `lazy-change` | 是否阻止组件本身的绑定值更新操作 | _boolean_ | `false` |
| `validate-trigger` | 触发验证的时机，可选值为 `onInputChange` `onLazyChange` `onIncrement` `onDecrement` | _CounterValidateTrigger[]_ | `['onIncrement', 'onDecrement', 'onInputChange', 'onLazyChange']` |
| `rules` | 验证规则，返回 `true` 表示验证通过，其它类型的值将转换为文本作为用户提示；自 `3.5.0` 开始支持 Zod 验证 | _((v: number) => any) \| ZodType \| Array<((v: number) => any) \| ZodType>_ | `-` |

**Events**：

| 事件 | 说明 | 回调参数 |
| --- | --- | --- |
| `before-change` | 变更之前触发（仅限 `lazy-change` 模式） | `value: number`、`change: (value: string \| number) => void` |
| `change` | 变更时触发 | `value: number` |
| `increment` | 增加时触发 | `value: number` |
| `decrement` | 减少时触发 | `value: number` |

**Slots**：无

**Methods**：

| 方法 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| `validate` | 触发校验 | `-` | `valid: Promise<boolean>` |
| `resetValidation` | 清空校验信息 | `-` | `-` |
| `reset` | 清空绑定的值（设置为 `min \|\| 0`）和校验信息 | `-` | `-` |

**注意**：

- `v-model` 绑定数字，建议配合 `min`、`max`、`step` 约束取值范围与步进幅度。
- 需要等待接口返回后再更新时，使用 `lazy-change` 配合 `before-change` 事件手动调用 `change(value)`。
- 可单独用 `rules` 校验，也可放在 `var-form` 中统一校验，`validate-trigger` 控制触发时机。
