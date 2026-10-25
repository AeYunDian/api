# RailNavigationItem 单轨导航项

> 分类：导航组件 ｜ 组件标签：`<var-rail-navigation-item>` ｜ 官方文档：https://varletjs.org/#/zh-CN/rail-navigation ｜ [返回索引](../组件索引.md)

**用途**：`RailNavigation` 的单个导航项，可展示图标、文字与徽标，并支持禁用与鼠标交互事件。

**基础用法**：

```vue
<script setup>
import { ref } from 'vue'

const active = ref(0)
</script>

<template>
  <var-rail-navigation v-model:active="active">
    <var-rail-navigation-item label="首页" icon="home" />
    <var-rail-navigation-item label="搜索" icon="magnify" badge />
    <var-rail-navigation-item label="收藏" icon="heart" :badge="{ type: 'primary', value: 6 }" />
    <var-rail-navigation-item label="我的" icon="account-circle" />
  </var-rail-navigation>
</template>
```

**Props**：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `name` | 导航项名称，作为匹配的标识符 | `number \| string` | `-` |
| `label` | 标签文字内容 | `string` | `-` |
| `icon` | 图标名称，等同于 Icon 组件的 name | `string` | `-` |
| `namespace` | 图标的命名空间，等同于 Icon 组件的 namespace | `string` | `var-icon` |
| `badge` | 图标右上角徽标，等同于 Badge 组件的属性 | `boolean \| BadgeProps` | `false` |
| `disabled` | 是否禁用当前导航项 | `boolean` | `false` |

**Events**：

| 事件 | 说明 | 回调参数 |
| --- | --- | --- |
| `click` | 点击时触发 | `active: number \| string` |
| `mouseenter` | 鼠标移入时触发 | `active: number \| string` |
| `mouseleave` | 鼠标移出时触发 | `active: number \| string` |

**Slots**：

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `default` | 自定义标签内容，会覆盖 `label` 的内容 | `active: boolean` |
| `icon` | 自定义图标 | `active: boolean` |

**注意**：

- 包裹 `Tooltip`、`router-link` 或 `a` 标签即可实现提示、路由跳转与外部链接，包裹元素的样式需自行设置为占满宽度。
- 禁用状态不响应点击，也不会因为交互而被激活。

