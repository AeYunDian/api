# Rate 评分

> 分类：表单组件 ｜ 组件标签：`<var-rate>` ｜ 官方文档：https://varletjs.org/#/zh-CN/rate ｜ [返回索引](../组件索引.md)

**用途**：用于对事物进行评级打分（如商品评价、服务满意度），支持半选、清空与自定义图标。

**基础用法**：

```vue
<script setup>
import { ref } from 'vue'

const score = ref(3)
</script>

<template>
  <var-rate v-model="score" />
</template>
```

**Props**：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `v-model` | 当前分数 | `number` | `0` |
| `count` | 评分总数 | `number \| string` | `5` |
| `color` | 选中时图标的颜色 | `string` | `-` |
| `icon` | 选中整个图标时的图标样式 | `string` | `star` |
| `empty-color` | 未选中时图标的颜色 | `string` | `-` |
| `empty-icon` | 未选中时图标的样式 | `string` | `star-outline` |
| `size` | 图标大小，默认单位为 `px` | `number \| string` | `-` |
| `gap` | 图标间隔，默认单位为 `px` | `number \| string` | `-` |
| `half` | 是否允许半选 | `boolean` | `false` |
| `half-icon` | 半选时图标的样式，只有在 `half` 为 `true` 时才有效 | `string` | `star-half-full` |
| `namespace` | 图标的命名空间 | `string` | `var-icon` |
| `empty-icon-namespace` | 未选中时图标的命名空间 | `string` | `var-icon` |
| `half-icon-namespace` | 半选时图标的命名空间 | `string` | `var-icon` |
| `disabled` | 是否禁止评分 | `boolean` | `false` |
| `disabled-color` | 禁止评分时图标的颜色，只有在 `disabled` 为 `true` 时才有效，优先级高于 `color`、`empty-color` | `string` | `-` |
| `readonly` | 是否为只读状态，只读状态下无法修改评分 | `boolean` | `false` |
| `clearable` | 是否允许清空 | `boolean` | `false` |
| `ripple` | 是否使用水波纹 | `boolean` | `true` |
| `rules` | 验证规则，返回 `true` 表示验证通过，其它类型的值将转换为文本作为用户提示。自 `3.5.0` 开始支持 Zod 验证 | `((v: number) => any) \| ZodType \| Array<((v: number) => any) \| ZodType>` | `-` |

**Events**：

| 事件 | 说明 | 回调参数 |
| --- | --- | --- |
| `change` | 评分改变时触发 | `value: number` |

**Slots**：

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `icon` | 选中时的图标（3.19.0） | 无 |
| `empty-icon` | 未选中时的图标（3.19.0） | 无 |
| `half-icon` | 半选时的图标（3.19.0） | 无 |

**Methods**：

| 方法 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| 无 | 无 | 无 | 无 |

**注意**：

- 开启 `half` 后分数可以是 `0.5` 的倍数；再配合 `clearable` 即可点击已选分数将其清空为 `0`。
- 使用 `icon` / `half-icon` / `empty-icon` 插槽（3.19.0+）自定义图标后，对应的 `icon`、`half-icon`、`empty-icon` 属性不再生效。
- `disabled-color` 的优先级高于 `color` 与 `empty-color`，禁用态颜色统一由它控制。
