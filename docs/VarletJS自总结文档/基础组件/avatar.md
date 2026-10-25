# Avatar 头像

> 分类：基础组件 ｜ 组件标签：`<var-avatar>` ｜ 官方文档：https://varletjs.org/#/zh-CN/avatar ｜ [返回索引](../组件索引.md)

**用途**：用作头像显示，支持图片、图标和纯文字内容。常用于用户信息、成员列表、评论区等需要展示形象的场景。

**基础用法**：

```vue
<template>
  <var-space align="center">
    <var-avatar src="https://varletjs.org/cat.jpg" size="mini" />
    <var-avatar src="https://varletjs.org/cat.jpg" size="small" />
    <var-avatar src="https://varletjs.org/cat.jpg" />
    <var-avatar src="https://varletjs.org/cat.jpg" size="large" />
    <var-avatar src="https://varletjs.org/cat.jpg" :size="78" />
  </var-space>
</template>
```

**Props**：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `round` | 头像是否为圆形 | _boolean_ | `true` |
| `size` | 头像的尺寸，可选值为 `mini small normal large` | _string \| number_ | `normal` |
| `color` | 头像的背景颜色 | _string_ | `-` |
| `src` | 头像的地址 | _string_ | `-` |
| `alt` | 替代文本，和 `img` 标签原生属性一致 | _string_ | `-` |
| `fit` | 头像图片的填充模式，可选值 `fill contain cover none scale-down` | _string_ | `cover` |
| `bordered` | 头像是否带边框 | _boolean_ | `false` |
| `border-color` | 头像边框颜色 | _string_ | `-` |
| `loading` | 当开启懒加载时，加载中显示的图片 | _string_ | `-` |
| `error` | 当开启懒加载时，加载失败显示的图片 | _string_ | `-` |
| `lazy` | 是否开启懒加载 | _boolean_ | `false` |
| `hoverable` | 是否开启悬停效果 | _boolean_ | `false` |

**Events**：

| 事件 | 说明 | 回调参数 |
| --- | --- | --- |
| `click` | 点击头像时触发 | `event: Event` |
| `load` | 头像图片成功加载时触发（懒加载模式下失败时会多次尝试加载头像图片，只会在成功加载时触发） | `event: Event` |
| `error` | 头像图片失败加载时触发（懒加载模式下失败时会多次尝试加载头像图片，只会在尝试次数结束时触发） | `event: Event` |

**Slots**：

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `default` | 头像内容 | 无 |

**注意**：

- `size` 既可使用预设值 `mini`、`small`、`normal`、`large`，也可传入数字直接指定像素尺寸。
- 在 `.vue` 文件中，组件不会像原生 `img` 一样被构建工具自动处理模块请求，使用本地图片时需手动 `import` 资源或配置 `transformAssetUrls`。
- 懒加载模式下加载失败会多次重试，`error` 事件仅在重试次数用尽后才触发。

