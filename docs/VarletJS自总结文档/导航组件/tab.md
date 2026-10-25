# Tab 选项卡项

> 分类：导航组件 ｜ 组件标签：`<var-tab>` ｜ 官方文档：https://varletjs.org/#/zh-CN/tabs ｜ [返回索引](../组件索引.md)

**用途**：单个选项卡标签，需作为 `Tabs` 的子节点使用，负责展示标签文案与禁用、水波等交互状态。

**基础用法**：

```vue
<script setup>
import { ref } from 'vue'

const active = ref('选项1')
</script>

<template>
  <var-tabs v-model:active="active">
    <var-tab name="选项1">选项1</var-tab>
    <var-tab name="选项2">选项2</var-tab>
    <var-tab name="选项3">选项3</var-tab>
  </var-tabs>
</template>
```

**Props**：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `name` | 选项卡的名字 | `string \| number` | `-` |
| `disabled` | 是否禁用选项卡 | `boolean` | `false` |
| `ripple` | 是否启用水波效果 | `boolean` | `true` |

**Events**：

| 事件 | 说明 | 回调参数 |
| --- | --- | --- |
| `click` | 点击选项卡时触发，在 `disabled` 状态为 `true` 时不触发 | `active: string \| number`、`event: Event` |

**Slots**：

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `default` | 选项卡内容 | 无 |

**注意**：

- `name` 与 `index` 同时存在时，`Tabs` 的 `active` 优先匹配 `name`。
- 禁用项不会触发点击与切换，可通过 `disabled-color` 指定其文字颜色。

