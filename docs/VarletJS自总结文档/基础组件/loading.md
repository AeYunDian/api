# Loading 加载

> 分类：基础组件 ｜ 组件标签：`<var-loading>` ｜ 官方文档：https://varletjs.org/#/zh-CN/loading ｜ [返回索引](../组件索引.md)

**用途**：加载组件，用于数据加载时执行动画。可单独作为加载指示器，也可包裹内容在加载期间显示遮罩动画。

**基础用法**：

```vue
<script setup>
import { ref } from 'vue'

const loading = ref(false)
</script>

<template>
  <var-button @click="loading = !loading" style="margin-bottom: 8px">
    {{ loading ? '关闭' : '打开' }}
  </var-button>
  <var-loading description="LOADING" :loading="loading">
    <var-card
      title="介绍"
      description="Varlet 是一个基于Vue3开发的 Material 风格移动端组件库，全面拥抱Vue3生态，由社区的小伙伴开发和维护。"
    />
  </var-loading>
</template>
```

**Props**：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `color` | loading 的颜色 | _string_ | `-` |
| `type` | loading 的类型，可选值为 `circle` `wave` `cube` `rect` `disappear` | _string_ | `circle` |
| `size` | loading 的大小，可选值为 `large` `normal` `small` `mini` | _string_ | `normal` |
| `description` | loading 的描述文字 | _string_ | `-` |
| `loading` | 存在内容时 loading 是否显示 | _boolean_ | `false` |
| `radius` | loading 的类型为 `circle` 时，可设置其半径大小 | _string \| number_ | `-` |

**Events**：

无

**Slots**：

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `default` | `loading` 包裹着的内容 | 无 |
| `description` | `loading` 的描述文字 | 无 |

**注意**：

- `loading` 属性只在存在默认插槽内容时生效，用于控制遮罩是否显示；不传内容时组件始终展示加载动画。
- `radius` 仅在 `type` 为 `circle` 时有效。

