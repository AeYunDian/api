# Watermark 水印

> 分类：展示组件 ｜ 组件标签：`<var-watermark>` ｜ 官方文档：https://varletjs.org/#/zh-CN/watermark ｜ [返回索引](../组件索引.md)

**用途**：给页面的某个区域加上文字或图片水印，可用于标识版权、防止信息盗用。支持自定义间距、偏移、旋转角度、透明度与全屏模式。

**基础用法**

```vue
<template>
  <var-watermark content="Varlet">
    <div class="watermark-wrapper"></div>
  </var-watermark>
</template>

<style>
.watermark-wrapper {
  width: 100%;
  height: 200px;
}
</style>
```

**Props**

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `width` | 水印的宽度 | `number` | `100` |
| `height` | 水印的高度 | `number` | `100` |
| `content` | 文字水印的内容 | `string` | `-` |
| `image` | 图片水印的路径，优先级比 `content` 高 | `string` | `-` |
| `rotate` | 水印的旋转角度 | `number` | `-22` |
| `offset-x` | 水印距离容器 x 轴的偏移量 | `number` | `0` |
| `offset-y` | 水印距离容器 y 轴的偏移量 | `number` | `0` |
| `gap-x` | 水印水平方向的间距 | `number` | `0` |
| `gap-y` | 水印垂直方向的间距 | `number` | `0` |
| `z-index` | 水印的 z-index | `number \| string` | `10` |
| `opacity` | 水印的透明度 | `number \| string` | `0.5` |
| `fullscreen` | 水印是否全屏显示 | `boolean` | `false` |
| `font` | 文字水印的字体样式 | `WatermarkFont` | `WatermarkFont` |

**WatermarkFont 配置**

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `font-size` | 字体大小 | `number` | `14` |
| `font-variant` | 设置小型大写字母的字体显示文本 | `string` | `normal` |
| `font-weight` | 字体粗细 | `string` | `normal` |
| `font-style` | 字体样式 | `string` | `normal` |
| `font-family` | 字体类型 | `string` | `-` |

**Events**

无。

**Slots**

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `content` | `Watermark` 内容，仅支持行内样式，不支持传入自闭合标签，优先级高于 `content` 或 `image` 属性 | 无 |

**Methods**

| 方法 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| `resize` | 水印属性变化时可以调用此方法进行重绘 | 无 | 无 |

**注意**

- 内容优先级为插槽 `content` > `image` > `content` 属性。
- 动态修改水印属性后可通过实例方法 `resize` 手动重绘，以保证绘制结果与最新属性一致。
- 插槽内容仅支持行内样式，且不支持自闭合标签。
