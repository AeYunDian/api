# Steps 步骤条

> 分类：展示组件 ｜ 组件标签：`<var-steps>` ｜ 官方文档：https://varletjs.org/#/zh-CN/steps ｜ [返回索引](../组件索引.md)

**用途**：引导用户按照流程完成任务的导航条，常用于下单流程、审批进度、分步表单等场景。

**基础用法**：

```vue
<script setup>
import { ref } from 'vue'

const active = ref(0)

function next() {
  active.value = (active.value + 1) % 4
}
</script>

<template>
  <var-steps :active="active">
    <var-step>步骤1</var-step>
    <var-step>步骤2</var-step>
    <var-step>步骤3</var-step>
    <var-step>步骤4</var-step>
  </var-steps>
  <var-button type="primary" block @click="next">下一步</var-button>
</template>
```

**Props**：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `active` | 当前步骤 | _string \| number_ | `0` |
| `direction` | 显示方向，可选值为 `vertical` | _string_ | `horizontal` |
| `active-color` | 激活状态颜色 | _string_ | `-` |
| `inactive-color` | 未激活状态颜色 | _string_ | `-` |

**Events**：

| 事件 | 说明 | 回调参数 |
| --- | --- | --- |
| `click-step` | 点击步骤的标题或图标时触发 | `index: number` |

**Slots**：

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `default` | steps 的内容 | 无 |

**注意**：

- `active` 的值为当前 `var-step` 的索引，从 `0` 起计。
- 通过 `direction="vertical"` 可切换为垂直方向的步骤条。
