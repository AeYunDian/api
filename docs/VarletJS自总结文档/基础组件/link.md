# Link 链接

> 分类：基础组件 ｜ 组件标签：`<var-link>` ｜ 官方文档：https://varletjs.org/#/zh-CN/link ｜ [返回索引](../组件索引.md)

**用途**：用于页面跳转的链接组件，支持主题色、下划线样式，并可选择原生 `href` 跳转或 `router-link` 路由跳转。

**基础用法**：

```vue
<template>
  <var-space :size="[10, 10]">
    <var-link
      type="primary"
      href="https://varletjs.org/#/zh-CN/home"
      target="_blank"
    >
      href 链接
    </var-link>
    <var-link type="primary" to="/button">router-link 链接</var-link>
  </var-space>
</template>
```

**Props**：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `type` | 类型，可选值为 `default` `primary` `info` `success` `warning` `danger` | _string_ | `default` |
| `underline` | 下划线状态，可选值为 `always` `hover` `none` | _string_ | `always` |
| `disabled` | 禁用状态 | _boolean_ | `false` |
| `text-color` | 文字颜色 | _string_ | `-` |
| `text-size` | 文字尺寸 | _string \| number_ | `-` |
| `href` | 原生 `href` 属性，优先级高于 `to` | _string_ | `-` |
| `rel` | 原生 `rel` 属性 | _string_ | `-` |
| `target` | 原生 `target` 属性 | _string_ | `-` |
| `to` | `router-link` `to` 属性，将会渲染为 `<router-link />` | _string \| object_ | `-` |
| `replace` | `router-link` `replace` 属性 | _boolean_ | `false` |

**Events**：

| 事件 | 说明 | 回调参数 |
| --- | --- | --- |
| `click` | 点击链接时触发 | `event: Event` |

**Slots**：

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `default` | 链接内容 | 无 |

**注意**：

- `href` 的优先级高于 `to`；传入 `to` 时会渲染为 `<router-link />`，需要项目已安装并配置 Vue Router。
- 通过 `type` 使用内置主题色，通过 `text-color` 可指定任意文字颜色。
- 默认插槽可放置按钮等元素，实现整块内容的点击跳转。

