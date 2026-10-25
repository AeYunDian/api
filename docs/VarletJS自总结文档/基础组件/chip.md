# Chip 纸片

> 分类：基础组件 ｜ 组件标签：`<var-chip>` ｜ 官方文档：https://varletjs.org/#/zh-CN/chip ｜ [返回索引](../组件索引.md)

**用途**：纸片组件，用于显示一些条目，并且支持关闭条目。常见于标签、筛选项、已选条件等场景。

**基础用法**：

```vue
<script setup>
import { ref } from 'vue'

const show = ref(true)
const show1 = ref(true)
</script>

<template>
  <var-chip closeable v-if="show" @close="show = false">可关闭纸片</var-chip>
  <var-chip closeable icon="delete" v-if="show1" @close="show1 = false">
    自定义关闭图标
  </var-chip>
</template>
```

**Props**：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `type` | 类型，可选值为 `default` `primary` `info` `success` `warning` `danger` | _string_ | `default` |
| `size` | 尺寸，可选值为 `normal` `mini` `small` `large` | _string_ | `normal` |
| `plain` | 是否为空心样式 | _boolean_ | `false` |
| `round` | 是否为圆角样式 | _boolean_ | `true` |
| `block` | 是否为块级样式 | _boolean_ | `false` |
| `elevation` | 海拔高度，可选值为 `true`、`false` 和 `0-24` 的等级（3.3.0 起支持） | _string \| number \| boolean_ | `false` |
| `closeable` | 是否为可关闭纸片 | _boolean_ | `false` |
| `icon` | 自定义可关闭纸片的图标，必须在 `closeable` 为 `true` 的条件下才能用（3.19.0 起支持） | _string_ | `-` |
| `icon-name` | 已废弃，请使用 `icon` 代替 | _string_ | `-` |
| `namespace` | 自定义可关闭纸片的图标的命名空间 | _string_ | `var-icon` |
| `color` | 纸片颜色 | _string_ | `_` |
| `text-color` | 文本颜色，优先级高于 `color` 属性 | _string_ | `-` |

**Events**：

| 事件 | 说明 | 回调参数 |
| --- | --- | --- |
| `close` | 点击关闭按钮时触发，只有在显示关闭按钮的时候才能使用 | `event: Event` |

**Slots**：

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `default` | 纸片内容 | 无 |
| `left` | 插入至纸片左侧的内容 | 无 |
| `right` | 插入至纸片右侧的内容 | 无 |
| `icon` | 关闭图标（3.19.0 起支持） | 无 |

**注意**：

- `icon` 属性与 `icon` 插槽都只在 `closeable` 为 `true` 时生效。
- `icon-name` 已废弃，应使用 `icon` 替代。
- `text-color` 的优先级高于 `color`。

