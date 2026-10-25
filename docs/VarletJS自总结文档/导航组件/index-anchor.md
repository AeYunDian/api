# IndexAnchor 索引锚点

> 分类：导航组件 ｜ 组件标签：`<var-index-anchor>` ｜ 官方文档：https://varletjs.org/#/zh-CN/index-bar ｜ [返回索引](../组件索引.md)

**用途**：`IndexBar` 的锚点项，标识一个索引分组的位置，并作为右侧索引字符的跳转目标。

**基础用法**：

```vue
<script setup>
import { ref, onMounted } from 'vue'

const list = ref([])

onMounted(() => {
  for (let i = 0; i < 26; i++) {
    list.value.push(String.fromCharCode(65 + i))
  }
})
</script>

<template>
  <var-index-bar>
    <template v-for="item in list" :key="item">
      <var-index-anchor :index="item">标题 {{ item }}</var-index-anchor>
      <var-cell>{{ item }} 文本</var-cell>
    </template>
  </var-index-bar>
</template>
```

**Props**：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `index` | 索引字符 | `number \| string` | `-` |

**Events**：

无。

**Slots**：

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `default` | 自定义索引字符 | 无 |
| `anchor-name` | 自定义锚点内容 | `anchorName: string` 锚点内容 |

**注意**：

- `index` 需与目标分组的索引字符保持一致，`scrollTo` 也以该值定位。
- 默认插槽用于自定义索引字符，`anchor-name` 插槽用于自定义锚点区域的内容。

