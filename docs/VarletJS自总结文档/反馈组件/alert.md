# Alert 警告信息

> 分类：反馈组件 ｜ 组件标签：`<var-alert>` ｜ 官方文档：https://varletjs.org/#/zh-CN/alert ｜ [返回索引](../组件索引.md)

**用途**：向用户显示简短的提示消息，但不会中断他们的使用，常用于页面内的类型化提示、说明或错误反馈。

**基础用法**：

```vue
<script setup>
import { ref } from 'vue'

const show = ref(true)
</script>

<template>
  <var-alert
    v-if="show"
    title="傲慢与偏见"
    message="我也说不准是在什么时间，什么地点，看见你的什么神情，听见你的什么言语，便开始爱上了你。"
    type="success"
    closeable
    @close="show = false"
  />
</template>
```

**Props / Options**：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `type` | 类型，可选值为 `info` `success` `warning` `danger` | `string` | `info` |
| `variant` | 变体，可选值为 `standard` `outlined` `tonal` | `string` | `standard` |
| `color` | 背景色 | `string` | `-` |
| `title` | 标题 | `string` | `-` |
| `message` | 信息 | `string` | `-` |
| `elevation` | 海拔高度，可选值为 `true`、`false` 和 `0-24` 的等级 | `string \| number \| boolean` | `false` |
| `closeable` | 是否为可关闭警告 | `boolean` | `false` |

**Events**：

| 事件 | 说明 | 回调参数 |
| --- | --- | --- |
| `close` | 点击关闭按钮时触发，只有在显示关闭按钮的时候才能使用 | `event: Event` |

**Slots**：

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `default` | 警告信息 | 无 |
| `content` | 警告内容 | 无 |
| `title` | 警告标题 | 无 |
| `icon` | 警告的前置图标 | 无 |
| `close-icon` | 警告的关闭图标 | 无 |

**Methods**：

| 方法 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| 无 | 组件未暴露实例方法 | 无 | 无 |

**注意**：

- `title` 与 `message` 均可省略，仅用 `default` 插槽也能展示内容。
- 组件本身不维护显示状态，可关闭场景需自行用 `v-if` 配合 `close` 事件控制。
- `variant` 与 `type` 可组合使用，`tonal`、`outlined` 属于弱化的视觉风格。

