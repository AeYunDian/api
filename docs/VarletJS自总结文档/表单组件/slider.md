# Slider 滑块

> 分类：表单组件 ｜ 组件标签：`<var-slider>` ｜ 官方文档：https://varletjs.org/#/zh-CN/slider ｜ [返回索引](../组件索引.md)

**用途**：用于在给定范围内取值，支持单滑块与双滑块区间选择，常用于音量/亮度调节、价格区间筛选等场景。

**基础用法**：

```vue
<script setup>
import { ref } from 'vue'

const value = ref(30)
</script>

<template>
  <var-slider v-model="value" />
</template>
```

**Props**：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `v-model` | 当前进度值 | `number \| [number, number]` | `0` |
| `step` | 步长，取值必须大于 0 | `string \| number` | `1` |
| `range` | 是否启用双滑块 | `boolean` | `false` |
| `max` | 最大值 | `string \| number` | `100` |
| `min` | 最小值 | `string \| number` | `0` |
| `label-visible` | 是否显示标签，可选值为 `always` `normal` `never` | `string` | `normal` |
| `label-text-color` | 标签文字颜色 | `string` | `-` |
| `label-color` | 标签颜色 | `string` | `-` |
| `active-color` | 已激活的轨道背景颜色 | `string` | `-` |
| `track-color` | 轨道背景颜色 | `string` | `-` |
| `track-height` | 轨道的高度 | `string \| number` | `-` |
| `thumb-size` | 滑块的大小 | `string \| number` | `-` |
| `thumb-color` | 滑块的背景颜色 | `string` | `-` |
| `disabled` | 是否禁用 | `boolean` | `false` |
| `readonly` | 是否只读 | `boolean` | `false` |
| `direction` | 显示方向，可选值为 `vertical` `horizontal` | `string` | `horizontal` |
| `rules` | 验证规则，返回 `true` 表示验证通过，其它类型的值将转换为文本作为用户提示。自 `3.5.0` 开始支持 Zod 验证 | `((v: number \| [number, number]) => any) \| ZodType \| Array<((v: number \| [number, number]) => any) \| ZodType>` | `-` |

**Events**：

| 事件 | 说明 | 回调参数 |
| --- | --- | --- |
| `change` | 值改变时触发 | `value`：当前进度 |
| `start` | 开始拖动时触发 | 无 |
| `end` | 结束拖动时触发 | `value`：当前进度 |

**Slots**：

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `button` | 自定义滑动按钮 | `currentValue`：当前进度 |

**Methods**：

| 方法 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| 无 | 无 | 无 | 无 |

**注意**：

- 开启 `range` 时 `v-model` 必须是数组（如 `[24, 50]`），否则双滑块取值异常；数组两个元素会按大小自动归位。
- 使用 `button` 插槽自定义滑块后，`label-visible`、`label-text-color`、`thumb-size` 等属性均失效，需自行控制样式。
- `direction="vertical"` 时需要给滑块外层容器设置明确高度，否则垂直轨道无法撑开显示。
