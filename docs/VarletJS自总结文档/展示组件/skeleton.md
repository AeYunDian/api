# Skeleton 骨架屏

> 分类：展示组件 ｜ 组件标签：`<var-skeleton>` ｜ 官方文档：https://varletjs.org/#/zh-CN/skeleton ｜ [返回索引](../组件索引.md)

**用途**：在数据加载过程中显示带过渡动画的占位元素，提升首屏感知速度。常用于列表、卡片、详情页等异步内容区域。

**基础用法**：

```vue
<script setup>
import { ref } from 'vue'

const loading = ref(true)
</script>

<template>
  <var-skeleton
    title
    avatar
    card
    :rows="3"
    :loading="loading"
  >
    加载的数据
  </var-skeleton>
</template>
```

**Props**：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `loading` | 加载状态，设置为 `true` 开启骨架屏 | _boolean_ | `true` |
| `title` | 是否显示标题 | _boolean_ | `false` |
| `card` | 是否显示卡片 | _boolean_ | `false` |
| `avatar` | 是否显示头像 | _boolean_ | `false` |
| `fullscreen` | 是否开启全屏模式 | _boolean_ | `false` |
| `fullscreen-z-index` | 全屏模式的层级 | _string \| number_ | `100` |
| `title-width` | 标题宽度 | _string \| number_ | `-` |
| `card-height` | 卡片高度 | _string \| number_ | `-` |
| `avatar-size` | 头像尺寸 | _string \| number_ | `-` |
| `rows` | 段落行数 | _string \| number_ | `3` |
| `rows-width` | 段落每一行的宽度 | _number[] \| string[]_ | `[]` |

**Events**：

| 事件 | 说明 | 回调参数 |
| --- | --- | --- |
| 无 | 无 | 无 |

**Slots**：

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `default` | 非加载状态下的内容 | 无 |

**注意**：

- `loading` 默认为 `true`，务必绑定响应式变量并在数据返回后置为 `false`，否则内容永远不会显示。
- `rows-width` 按段落行顺序依次取值，长度不足的行沿用默认宽度。
- `fullscreen` 模式会覆盖全屏，配合 `fullscreen-z-index` 调整层级可避免被弹层遮挡。
