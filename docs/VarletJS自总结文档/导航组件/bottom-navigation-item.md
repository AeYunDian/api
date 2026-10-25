# BottomNavigationItem 底部导航项

> 分类：导航组件 ｜ 组件标签：`<var-bottom-navigation-item>` ｜ 官方文档：https://varletjs.org/#/zh-CN/bottom-navigation ｜ [返回索引](../组件索引.md)

**用途**：`BottomNavigation` 的单个导航项，展示图标、文字与徽标，并作为选中匹配的最小单位。

**基础用法**：

```vue
<script setup>
import { ref, reactive } from 'vue'

const active = ref(0)
const badgeProps = reactive({ type: 'primary', value: '66' })
</script>

<template>
  <var-bottom-navigation v-model:active="active">
    <var-bottom-navigation-item label="标签" icon="home" />
    <var-bottom-navigation-item label="标签" icon="magnify" badge />
    <var-bottom-navigation-item label="标签" icon="heart" :badge="badgeProps" />
    <var-bottom-navigation-item label="标签" icon="account-circle" />
  </var-bottom-navigation>
</template>
```

**Props**：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `name` | 标签名称，作为匹配的标识符 | `string` | `-` |
| `icon` | 图标名称，等同于 Icon 组件的 name | `string` | `-` |
| `label` | 标签文字内容 | `string` | `-` |
| `namespace` | 图标的命名空间，可扩展自定义图标库，等同于 Icon 组件的 namespace | `string` | `var-icon` |
| `badge` | 图标右上角徽标 | `boolean \| BadgeProps` | `false` |

**Events**：

| 事件 | 说明 | 回调参数 |
| --- | --- | --- |
| `click` | 点击时触发 | `active: number \| string` |

**Slots**：

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `default` | 自定义标签文字内容，会覆盖 `label` 的内容 | 无 |
| `icon` | 自定义图标 | `active: boolean` |

**注意**：

- 父组件的 `v-model:active` 绑定索引或 `name`，两者需保持一致才能正确高亮。
- `badge` 既可直接传 `true`，也可传入 Badge 的配置对象以定制类型与数值。

