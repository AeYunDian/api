# Step 步骤

> 分类：展示组件 ｜ 组件标签：`<var-step>` ｜ 官方文档：https://varletjs.org/#/zh-CN/steps ｜ [返回索引](../组件索引.md)

**用途**：Steps 的单个步骤项，负责展示标题、图标与状态样式，需放在 `var-steps` 内使用。

**基础用法**：

```vue
<script setup>
import { ref } from 'vue'

const active = ref(0)
</script>

<template>
  <var-steps :active="active" active-color="var(--color-danger)">
    <var-step active-icon="heart" current-icon="fire" inactive-icon="heart-half-full">
      步骤1
    </var-step>
    <var-step active-icon="heart" current-icon="fire" inactive-icon="heart-half-full">
      步骤2
    </var-step>
  </var-steps>
</template>
```

**Props**：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `active-icon` | 激活状态图标 | _string_ | `check` |
| `current-icon` | 当前步骤时的图标 | _string_ | `-` |
| `inactive-icon` | 未激活状态图标 | _string_ | `-` |
| `active-icon-namespace` | 激活状态图标命名空间 | _string_ | `var-icon` |
| `current-icon-namespace` | 当前步骤时的图标命名空间 | _string_ | `var-icon` |
| `inactive-icon-namespace` | 未激活状态图标命名空间 | _string_ | `var-icon` |

**Events**：

| 事件 | 说明 | 回调参数 |
| --- | --- | --- |
| 无 | 无 | 无 |

**Slots**：

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `default` | step 的内容 | 无 |
| `active-icon`（3.19.0） | 激活状态图标 | 无 |
| `current-icon`（3.19.0） | 当前步骤时的图标 | 无 |
| `inactive-icon`（3.19.0） | 未激活状态图标 | 无 |

**注意**：

- `active-icon`、`current-icon`、`inactive-icon` 三个插槽自 `3.19.0` 起提供，可用来自定义图标节点。
- 如需使用自定义图标库，可通过对应的 `*-icon-namespace` 属性修改图标命名空间。
