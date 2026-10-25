# CollapseTransition 折叠动效

> 分类：展示组件 ｜ 组件标签：`<var-collapse-transition>` ｜ 官方文档：https://varletjs.org/#/zh-CN/collapse-transition ｜ [返回索引](../组件索引.md)

**用途**：为任意内容提供折叠/展开的高度过渡动画，常用于自定义折叠区域或条件渲染的容器。

**基础用法**：

```vue
<script setup>
import { ref } from 'vue'

const expand = ref(true)
</script>

<template>
  <var-switch v-model="expand" />
  <var-divider />
  <var-collapse-transition :expand="expand">
    不要温和地走进那良夜，老年应当在日暮时燃烧咆哮；怒斥，怒斥光明的消逝。
  </var-collapse-transition>
</template>
```

**Props**：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `expand` | 折叠或展开内容 | _boolean_ | `false` |

**Events**：

| 事件 | 说明 | 回调参数 |
| --- | --- | --- |
| 无 | 无 | 无 |

**Slots**：

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `default` | 折叠或展开的内容 | 无 |

**注意**：

- 内容高度由组件自动测量，子元素高度在动画过程中频繁变化时可能出现跳变，建议保持内容高度稳定。
- 内部内容不要使用 `v-if` 与 `expand` 联动，否则动画结束前元素已被销毁。
