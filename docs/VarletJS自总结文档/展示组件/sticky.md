# Sticky 粘性布局

> 分类：展示组件 ｜ 组件标签：`<var-sticky>` ｜ 官方文档：https://varletjs.org/#/zh-CN/sticky ｜ [返回索引](../组件索引.md)

**用途**：将内容吸附在滚动容器的顶部，常用于吸顶导航、工具栏等场景。默认使用监听容器 `scroll` 事件的模式，也可切换为基于原生 `css sticky` 的模式以提升性能。

**基础用法**：

```vue
<template>
  <div class="sticky-example">
    <var-sticky :offset-top="54">
      <var-button type="primary">基本使用</var-button>
    </var-sticky>
  </div>
</template>

<style>
.sticky-example {
  min-height: 200vh;
}
</style>
```

**Props**：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `offset-top` | 吸顶距离 | _string \| number_ | `0` |
| `z-index` | 吸顶时的层级 | _string \| number_ | `10` |
| `css-mode` | 开启原生 `css sticky` 模式 | _boolean_ | `false` |
| `disabled` | 禁用吸顶，设置为 `true` 时，元素会回到文档流中 | _boolean_ | `false` |

**Events**：

| 事件 | 说明 | 回调参数 |
| --- | --- | --- |
| `scroll` | 当滚动容器滚动时触发 | `offsetTop: number` 距离顶部的 px 值；`isFixed: boolean` 是否吸顶 |

**Slots**：

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `default` | 粘性布局的内容 | 无 |

**Methods**：

| 方法 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| `resize` | 触发粘性布局重绘 | 无 | `Promise<void>` |

**注意**：

- 需要局部吸顶时，将 `var-sticky` 放入一个设置了固定高度与 `overflow: auto` 的滚动容器中即可。
- 内容尺寸或布局发生变化后，建议调用实例方法 `resize` 重新计算吸顶位置。
