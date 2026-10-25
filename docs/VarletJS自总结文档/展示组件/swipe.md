# Swipe 轮播

> 分类：展示组件 ｜ 组件标签：`<var-swipe>` ｜ 官方文档：https://varletjs.org/#/zh-CN/swipe ｜ [返回索引](../组件索引.md)

**用途**：在有限区域内循环展示一组内容（图片、卡片、广告位等），支持自动播放、垂直方向、导航按钮与自定义指示器。

**基础用法**：

```vue
<template>
  <var-swipe class="swipe-example">
    <var-swipe-item>
      <img class="swipe-example-image" src="https://varletjs.org/cat.jpg">
    </var-swipe-item>
    <var-swipe-item>
      <img class="swipe-example-image" src="https://varletjs.org/cat2.jpg">
    </var-swipe-item>
  </var-swipe>
</template>

<style>
.swipe-example {
  height: 160px;
}

.swipe-example-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
```

**Props**：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `loop` | 是否开启循环轮播 | _boolean_ | `true` |
| `autoplay` | 自动播放间隔时间 (ms) | _string \| number_ | `-` |
| `duration` | 切换过渡时间 (ms) | _string \| number_ | `300` |
| `initial-index` | 初始化显示的索引 | _string \| number_ | `0` |
| `indicator` | 是否显示指示器 | _boolean_ | `true` |
| `indicator-color` | 指示器颜色 | _string_ | `-` |
| `vertical` | 是否开启垂直轮播 | _boolean_ | `false` |
| `touchable` | 是否可以拖动 | _boolean_ | `true` |
| `navigation` | 是否显示导航箭头。设置为 `hover` 时，指针悬浮会显示导航按钮 | _boolean \| string_ | `false` |

**Events**：

| 事件 | 说明 | 回调参数 |
| --- | --- | --- |
| `change` | 切换轮播时触发 | `index: number` 轮播索引 |

**Slots**：

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `default` | 轮播内容 | 无 |
| `prev` | 上一页按钮 | `index: number` 轮播索引；`length: number` 轮播总数；`hovering: boolean` 指针是否悬浮；`to`、`prev`、`next` 类型和同名方法一致 |
| `next` | 下一页按钮 | `index: number` 轮播索引；`length: number` 轮播总数；`hovering: boolean` 指针是否悬浮；`to`、`prev`、`next` 类型和同名方法一致 |
| `indicator` | 指示器内容 | `index: number` 轮播索引；`length: number` 轮播总数；`hovering: boolean` 指针是否悬浮；`to`、`prev`、`next` 类型和同名方法一致 |

**Methods**：

| 方法 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| `resize` | 产生位置大小变化时可以调用此方法进行重绘 | 无 | 无 |
| `prev` | 上一页 | `options?: SwipeToOptions` | 无 |
| `next` | 下一页 | `options?: SwipeToOptions` | 无 |
| `to` | 跳转到指定下标 | `index: number, options?: SwipeToOptions` | 无 |

**注意**：

- `SwipeToOptions` 的 `event` 参数为 `false` 时会阻止触发 `change` 事件。
- `navigation` 可设为 `hover`，仅在指针悬浮时显示导航按钮，适合内容区域较紧凑的场景。
- 自定义指示器时可通过 `indicator` 插槽拿到 `index`、`length`、`to` 等参数实现点击跳转。
