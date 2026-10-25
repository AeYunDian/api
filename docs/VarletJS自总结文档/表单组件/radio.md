# Radio 单选框

> 分类：表单组件 ｜ 组件标签：`<var-radio>` ｜ 官方文档：https://varletjs.org/#/zh-CN/radio-group ｜ [返回索引](../组件索引.md)

**用途**：在一组备选项中进行单选；单独使用时也可作为一个布尔开关，用于勾选确认类场景。

**基础用法**：

```vue
<script setup>
import { ref } from 'vue'

const value = ref(false)
</script>

<template>
  <var-radio v-model="value">当前的值: {{ value }}</var-radio>
</template>
```

**Props**：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `v-model` | 绑定的值 | _any_ | `false` |
| `checked-value` | 选中状态的值 | _any_ | `true` |
| `unchecked-value` | 未选中状态的值 | _any_ | `false` |
| `checked-color` | 选中状态的颜色 | _string_ | `-` |
| `unchecked-color` | 未选中状态的颜色 | _string_ | `-` |
| `icon-size` | 图标尺寸 | _string \| number_ | `-` |
| `disabled` | 是否禁用 | _boolean_ | `false` |
| `readonly` | 是否只读 | _boolean_ | `false` |
| `ripple` | 是否开启水波纹 | _boolean_ | `true` |
| `rules` | 验证规则，返回 `true` 表示验证通过，其它类型的值将转换为文本作为用户提示；自 `3.5.0` 开始支持 Zod 验证 | _(v: string) => any \| ZodType \| Array<(v: string) => any \| ZodType>_ | `-` |
| `tabindex` | 与原生 input 的 tabindex 属性一致（3.12.2） | _string_ | `-` |

**Events**：

| 事件 | 说明 | 回调参数 |
| --- | --- | --- |
| `click` | 点击时触发 | `e: Event` |
| `change` | 状态变更时触发 | `value: any` |

**Slots**：

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `checked-icon` | 选中图标 | 无 |
| `unchecked-icon` | 未选中图标 | 无 |
| `default` | 显示的文本 | 无 |

**Methods**：

| 方法 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| `validate` | 触发校验 | `-` | `valid: Promise<boolean>` |
| `resetValidation` | 清空校验信息 | `-` | `-` |
| `reset` | 清空绑定的值（设置为 `unchecked-value`）和校验信息 | `-` | `-` |
| `toggle` | 切换选中状态，传 `checked-value` 为选中，`unchecked-value` 为取消选中，不传或其他情况为取反 | `value: any` | `-` |

**注意**：

- `v-model` 默认在 `false` 与 `true` 之间切换，可用 `checked-value`、`unchecked-value` 改为业务所需的状态值。
- 放在 `RadioGroup` 内使用时，必须给每个 `Radio` 设置 `checked-value` 用于标识。
- `rules` 可单独校验，也可置于 `var-form` 中由表单统一收集校验结果。
