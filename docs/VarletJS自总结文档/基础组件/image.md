# Image 图片

> 分类：基础组件 ｜ 组件标签：`<var-image>` ｜ 官方文档：https://varletjs.org/#/zh-CN/image ｜ [返回索引](../组件索引.md)

**用途**：图片组件提供更便捷的尺寸、填充模式、圆角设置，并通过水波效果增强点击交互体验，支持懒加载与加载中、失败占位。

**基础用法**：

```vue
<template>
  <var-space :size="[20, 20]">
    <var-image
      width="85px"
      height="85px"
      fit="cover"
      :radius="10"
      ripple
      src="https://varletjs.org/cat.jpg"
    />
    <var-image
      width="85px"
      height="85px"
      radius="50%"
      lazy
      src="https://varletjs.org/cat.jpg"
    />
  </var-space>
</template>
```

**Props**：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `src` | 图片地址 | _string_ | `-` |
| `fit` | 填充模式, 可选值为 `fill` `contain` `cover` `none` `scale-down` | _string_ | `fill` |
| `position`（3.2.3 起） | 可替换元素的内容在其内容框中的位置，等同于 [object-position](https://developer.mozilla.org/en-US/docs/Web/CSS/object-position) | _string_ | `50% 50%` |
| `alt` | 替代文本，和 `img` 标签原生属性一致 | _string_ | `-` |
| `title` | 图片描述性文字，和 `img` 标签原生属性一致 | _string_ | `-` |
| `referrerpolicy` | 指示在获取资源时使用的来源地址。该属性需注意浏览器兼容性，参见 [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img) | _string_ | `-` |
| `width` | 图片宽度 | _string \| number_ | `-` |
| `height` | 图片高度 | _string \| number_ | `-` |
| `radius` | 图片圆角 | _string \| number_ | `0` |
| `lazy` | 是否开启懒加载 | _boolean_ | `false` |
| `loading` | 当开启懒加载时, 加载中显示的图片 | _string_ | `-` |
| `error` | 当开启懒加载时, 加载失败显示的图片 | _string_ | `-` |
| `ripple` | 是否开启水波 | _boolean_ | `false` |
| `block` | 是否是块级元素 | _boolean_ | `true` |

**Events**：

| 事件 | 说明 | 回调参数 |
| --- | --- | --- |
| `click` | 点击图片时触发 | `event: Event` |
| `load` | 图片成功加载时触发(懒加载模式下失败时会多次尝试加载图片，只会在成功加载时触发) | `event: Event` |
| `error` | 图片失败加载时触发(懒加载模式下失败时会多次尝试加载图片，只会在尝试次数结束时触发) | `event: Event` |

**Slots**：

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `error` | 加载失败插槽 | 无 |

**注意**：

- 懒加载需开启 `lazy`，此时 `loading` 与 `error` 分别指定加载中、加载失败时显示的图片，也可用 `error` 插槽完全自定义失败内容。
- 在 `.vue` 文件中组件不会像原生 `img` 那样被构建工具自动处理模块请求，本地图片需手动 `import` 后传入 `:src`，或为 Vite 配置 `transformAssetUrls` 将 `var-image` 的 `src` 纳入处理。
- `radius` 支持数字与百分比字符串，传入 `50%` 时可得到圆形图片。

