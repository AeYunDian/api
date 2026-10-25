# TabItem 选项卡视图项

> 分类：导航组件 ｜ 组件标签：`<var-tab-item>` ｜ 官方文档：https://varletjs.org/#/zh-CN/tabs ｜ [返回索引](../组件索引.md)

**用途**：`TabsItems` 中的单个视图面板，与同名或同索引的 `Tab` 对应。

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
  </var-tabs>

  <var-tabs-items v-model:active="active">
    <var-tab-item name="选项1">第一个视图的内容</var-tab-item>
    <var-tab-item name="选项2">第二个视图的内容</var-tab-item>
  </var-tabs-items>
</template>
```

**Props**：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `name` | 视图的名字 | `string \| number` | `-` |

**Events**：

无。

**Slots**：

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `default` | 视图的内容 | 无 |

**注意**：

- 设置 `name` 后，视图按名称与 `Tab` 匹配；未设置时按索引顺序匹配。

