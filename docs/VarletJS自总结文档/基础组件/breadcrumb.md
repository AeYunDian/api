# Breadcrumb 面包屑项

> 分类：基础组件 ｜ 组件标签：`<var-breadcrumb>` ｜ 官方文档：https://varletjs.org/#/zh-CN/breadcrumbs ｜ [返回索引](../组件索引.md)

**用途**：面包屑中的单个节点，放置文本或自定义内容，并可为该项单独设置分隔符或分隔符插槽。

**基础用法**：通过 `separator` 覆盖该项分隔符，或用 `#separator` 插槽放入图标等自定义内容。

```vue
<template>
  <var-breadcrumbs>
    <var-breadcrumb>
      首页
      <template #separator>
        <var-icon name="menu-right" style="margin: 1px 4px 0" />
      </template>
    </var-breadcrumb>
    <var-breadcrumb separator="~">一级</var-breadcrumb>
    <var-breadcrumb>二级</var-breadcrumb>
  </var-breadcrumbs>
</template>
```

**Props**

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `separator` | 分隔符 | _string_ | `-` |

**Events**

| 事件 | 说明 | 回调参数 |
| --- | --- | --- |
| `click` | 点击面包屑时触发 | `event: Event` |

**Slots**

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `default` | 自定义默认内容 | 无 |
| `separator` | 自定义分隔符内容 | 无 |

**注意**

- 子级 `separator` 未设置时继承父级 `Breadcrumbs` 的 `separator`。
- 最后一个 `Breadcrumb` 不会触发 `click` 事件，可据此把它当作当前页文本使用。
- `separator` 插槽优先级高于 `separator` 属性，适合使用图标分隔。

