# Paper 纸张

> 分类：基础组件 ｜ 组件标签：`<var-paper>` ｜ 官方文档：https://varletjs.org/#/zh-CN/paper ｜ [返回索引](../组件索引.md)

**用途**：一个易于使用海拔效果和水波效果的容器，可作为卡片、按钮容器、图片底座等承载内容的「纸面」，通过海拔、圆角、变体与交互态快速搭建材质层次。

**基础用法**：

```vue
<script setup>
import { ref } from 'vue'

const active = ref(false)
</script>

<template>
  <var-paper :active="active" hoverable ripple :width="200" :height="48" @click="active = !active">
    {{ active ? '激活状态' : '未激活状态' }}
  </var-paper>
</template>
```

**Props**：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `elevation` | 海拔高度，可选值为 `true`、`false` 和 `0-24` 的等级 | `string \| number \| boolean` | `false` |
| `ripple` | 是否启用水波效果，支持对象形式 `{ disabled?: boolean, color?: string }` | `boolean \| object` | `false` |
| `radius` | 纸张圆角 | `string \| number` | `-` |
| `width` | 纸张宽度 | `string \| number` | `-` |
| `height` | 纸张高度 | `string \| number` | `-` |
| `round` | 是否启用圆形纸张 | `boolean` | `false` |
| `inline` | 是否使用行内纸张 | `boolean` | `false` |
| `variant` 3.18.0 | 纸张变体，可选值为 `standard`、`outlined`、`filled`，`outlined` 和 `filled` 模式不挂载海拔样式 | `string` | `standard` |
| `surface` 3.16.0 | 背景色预设，可选值 `low`，在 `variant` 为 `filled` 时无效，目前只作用在 MD3 暗色主题 | `string` | `-` |
| `hoverable` 3.16.0 | 是否开启鼠标悬停效果，支持对象形式 `{ disabled?: boolean, color?: string }` | `boolean \| object` | `false` |
| `active` 3.20.6 | 是否开启常驻激活效果，默认使用主色半透明叠层和文字颜色，支持对象形式 `{ color?: string }` | `boolean \| object` | `false` |
| `disabled` 3.20.6 | 是否禁用交互。禁用后不触发点击、悬停和水波效果，仅显示禁用光标 | `boolean` | `false` |

**Events**：

| 事件 | 说明 | 回调参数 |
| --- | --- | --- |
| `click` | 点击纸张时触发 | `event: Event` |

**Slots**：

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `default` | 纸张内容 | 无 |

**注意**：

- `variant` 为 `outlined` 或 `filled` 时不会再挂载海拔样式，此时设置 `elevation` 不生效。
- `active` 是受控状态，需自行在 `click` 等外部逻辑中切换，参考「交互状态」示例。
- `surface="low"` 仅在 MD3 暗色主题下弱化背景色，且在 `variant="filled"` 时无效。

