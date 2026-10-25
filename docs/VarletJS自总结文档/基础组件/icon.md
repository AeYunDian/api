# Icon 图标

> 分类：基础组件 ｜ 组件标签：`<var-icon>` ｜ 官方文档：https://varletjs.org/#/zh-CN/icon ｜ [返回索引](../组件索引.md)

**用途**：基于字体的图标库，也支持以网络图片作为图标，字体图标来自 Material Design Icon。

**基础用法**：

```vue
<script setup>
import { ref } from 'vue'

const name = ref('checkbox-marked-circle')
</script>

<template>
  <var-space :size="[10, 10]">
    <var-icon name="checkbox-marked-circle" />
    <var-icon :name="name" :size="26" color="var(--color-primary)" />
  </var-space>
</template>
```

**Props**：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `name` | 图标名称 | _string_ | `-` |
| `size` | 尺寸 | _string \| number_ | `-` |
| `color` | 图标颜色, 只适用于字体图标 | _string_ | `-` |
| `namespace` | 图标的命名空间, 可扩展自定义图标库 | _string_ | `var-icon` |
| `animation-class` | 过渡动画类名 | _string_ | `-` |
| `transition` | 过渡动画时间（ms） | _string \| number_ | `0` |

**Events**：

| 事件 | 说明 | 回调参数 |
| --- | --- | --- |
| `click` | 点击图标时触发 | `event: Event` |

**Slots**：

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| 无 | 无 | 无 |

**注意**：

- 当 `name` 传入网络地址时，组件会使用 `img` 标签以 `cover` 模式显示，此时 `size` 表示图片的宽高，`color` 不生效。
- 图标切换动画需要设置 `transition`（毫秒），在 `name` 变化时触发，并可通过 `animation-class` 指定过渡动画类名。
- 自定义图标库有两种方式：使用 `@varlet/unplugin-icon-builder` 插件生成，或手动定义字体后通过 `namespace` 指定命名空间。

