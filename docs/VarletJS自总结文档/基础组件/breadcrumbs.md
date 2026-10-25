# Breadcrumbs 面包屑

> 分类：基础组件 ｜ 组件标签：`<var-breadcrumbs>` ｜ 官方文档：https://varletjs.org/#/zh-CN/breadcrumbs ｜ [返回索引](../组件索引.md)

**用途**：以层级路径展示当前页面所处位置，并支持逐级回退导航。常用于多级页面与分类详情页。

**基础用法**：`Breadcrumbs` 包裹多个 `Breadcrumb`，父级通过 `@click` 处理跳转，最后一项自动视为当前位置。

```vue
<script setup>
import { Snackbar } from '@varlet/ui'
</script>

<template>
  <var-breadcrumbs>
    <var-breadcrumb @click="Snackbar('首页')">首页</var-breadcrumb>
    <var-breadcrumb @click="Snackbar('一级')">一级</var-breadcrumb>
    <var-breadcrumb>二级</var-breadcrumb>
  </var-breadcrumbs>
</template>
```

**Props**

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `separator` | 分隔符 | _string_ | `/` |

**Events**

| 事件 | 说明 | 回调参数 |
| --- | --- | --- |
| 无 | 无 | 无 |

**Slots**

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `default` | 自定义默认内容 | 无 |

**注意**

- `Breadcrumbs` 上的 `separator` 是整条面包屑的默认分隔符，子级 `Breadcrumb` 可单独覆盖。
- 点击事件注册在子组件 `Breadcrumb` 上而非父级，最后一个面包屑不接受点击。

