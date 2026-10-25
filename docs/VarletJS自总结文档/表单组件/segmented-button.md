# SegmentedButton 分段按钮

> 分类：表单组件 ｜ 组件标签：`<var-segmented-button>` ｜ 官方文档：https://varletjs.org/#/zh-CN/segmented-buttons ｜ [返回索引](../组件索引.md)

**用途**：`SegmentedButtons` 的单个子按钮，声明自己的值并可选地禁用、只读，可自定义选中图标。

**基础用法**：

```vue
<script setup>
import { ref } from 'vue'

const value = ref('day')
</script>

<template>
  <var-segmented-buttons v-model="value">
    <var-segmented-button checked-value="day">天</var-segmented-button>
    <var-segmented-button checked-value="week" disabled>周</var-segmented-button>
    <var-segmented-button checked-value="month" readonly>月</var-segmented-button>
  </var-segmented-buttons>
</template>
```

**Props**：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `checked-value` | 分段按钮对应的值 | _any_ | `-` |
| `disabled` | 是否禁用分段按钮 | _boolean_ | `false` |
| `readonly` | 是否将分段按钮设为只读 | _boolean_ | `false` |
| `ripple` | 是否为分段按钮开启水波纹效果 | _boolean_ | `true` |

**Events**：

| 事件 | 说明 | 回调参数 |
| --- | --- | --- |
| `click` | 点击分段按钮时触发 | `e: Event` |

**Slots**：

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `checkmark` | 分段按钮在选中时显示的自定义勾选图标内容 | `checked: boolean` |
| `default` | 分段按钮的文字或标签内容 | `checked: boolean` |

**注意**：

- `checked-value` 用于标识该按钮的值，应当与父级 `v-model` 中的值类型保持一致。
- `disabled` 完全不可交互，`readonly` 仅禁止切换选中状态。
- 是否显示勾选图标由父级 `SegmentedButtons` 的 `checkmark` 属性统一控制。
