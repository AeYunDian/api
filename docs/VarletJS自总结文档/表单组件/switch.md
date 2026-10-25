# Switch 开关

> 分类：表单组件 ｜ 组件标签：`<var-switch>` ｜ 官方文档：https://varletjs.org/#/zh-CN/switch ｜ [返回索引](../组件索引.md)

**用途**：开关选择器，用于在两个互斥状态之间切换（如开启/关闭通知、启用/停用某项配置），常用于表单设置项与列表项右侧。

**基础用法**：

```vue
<script setup>
import { ref } from 'vue'

const value = ref(true)
</script>

<template>
  <var-switch v-model="value" />
</template>
```

**Props**：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `v-model` | 开关选中状态 | `any` | `false` |
| `active-value` | 开关打开时的值 | `any` | `true` |
| `inactive-value` | 开关关闭时的值 | `any` | `false` |
| `disabled` | 是否禁用 | `boolean` | `false` |
| `readonly` | 是否只读 | `boolean` | `false` |
| `loading` | 是否为加载状态 | `boolean` | `false` |
| `ripple` | 是否启用水波纹 | `boolean` | `true` |
| `button-elevation` | 控制按钮的海拔效果（3.2.7） | `boolean` | `true` |
| `color` | 打开状态下的颜色 | `string` | `-` |
| `loading-color` | 加载图标的颜色 | `string` | `-` |
| `close-color` | 关闭状态下的颜色 | `string` | `-` |
| `size` | switch 的大小 | `string \| number` | `-` |
| `rules` | 验证规则，返回 `true` 表示验证通过，其它类型的值将转换为文本作为用户提示。自 `3.5.0` 开始支持 Zod 验证 | `((v: any) => any) \| ZodType \| Array<((v: any) => any) \| ZodType>` | `-` |
| `lazy-change` | 是否允许触发 `before-change` 事件 | `boolean` | `false` |
| `validate-trigger` | 触发验证的时机，可选值为 `onChange` `onLazyChange` | `SwitchValidateTrigger[]` | `['onChange', 'onLazyChange']` |
| `variant` | 变体模式（3.2.3） | `boolean` | `false` |
| `tabindex` | 与原生 input 的 tabindex 属性一致（3.12.2） | `string` | `-` |

**Events**：

| 事件 | 说明 | 回调参数 |
| --- | --- | --- |
| `click` | 点击时触发 | `event: Event` |
| `change` | 开关状态切换时触发 | `value: any` |
| `before-change` | 变更之前（仅限 `lazy-change` 模式）触发 | `value: any`、`change: (value: any) => void` |

**Slots**：

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| 无 | 无 | 无 |

**Methods**：

| 方法 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| 无 | 无 | 无 | 无 |

**注意**：

- `v-model` 的值应为 `active-value` / `inactive-value` 之一，默认为 `true` / `false`；自定义这两个属性后，校验规则要按自定义值编写。
- 开启 `lazy-change` 后组件不再自动更新绑定值，必须在 `before-change` 回调中手动执行 `change(value)` 才会真正变更（适合等接口成功后再切换）。
- 仅当传入 `rules` 且校验不通过时组件才呈现错误态；`3.5.0` 起 `rules` 可直接传 Zod 校验器。
