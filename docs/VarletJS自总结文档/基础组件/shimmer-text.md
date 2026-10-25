# ShimmerText 流光文字

> 分类：基础组件 ｜ 组件标签：`<var-shimmer-text>` ｜ 官方文档：https://varletjs.org/#/zh-CN/shimmer-text ｜ [返回索引](../组件索引.md)

**用途**：带有流光扫过动画的文字，用于表示内容正在生成或处理中；典型场景是 AI 回答生成中的占位提示、加载中的状态文案。

**基础用法**：

```vue
<template>
  <var-shimmer-text>内容生成中</var-shimmer-text>
</template>
```

**Props**：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `type` | 类型，可选值为 `default` `primary` `info` `success` `warning` `danger` | `string` | `default` |

**Events**：

| 事件 | 说明 | 回调参数 |
| --- | --- | --- |
| 无 | 无 | 无 |

**Slots**：

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `default` | 文字内容 | 无 |

**注意**：

- 通过 `type` 切换主题色，语义色取值与 `Button` 等组件保持一致。
- 组件只负责文案外观，动画由内部样式实现，无需手动添加过渡类。

