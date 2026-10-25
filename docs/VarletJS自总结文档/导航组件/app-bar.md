# AppBar 导航栏

> 分类：导航组件 ｜ 组件标签：`<var-app-bar>` ｜ 官方文档：https://varletjs.org/#/zh-CN/app-bar ｜ [返回索引](../组件索引.md)

**用途**：为页面提供顶部导航功能，支持标题、左右操作区与扩展内容，常用于页面标题栏、带图片背景的头部等。

**基础用法**：

```vue
<template>
  <var-app-bar title="标题">
    <template #left>
      <var-button round text>
        <var-icon name="arrow-left" :size="24" />
      </var-button>
    </template>

    <template #right>
      <var-button round text>
        <var-icon name="magnify" :size="24" />
      </var-button>
    </template>
  </var-app-bar>
</template>
```

**Props**：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `color` | 背景颜色 | `string` | `-` |
| `text-color` | 文字颜色 | `string` | `-` |
| `type` ***3.18.0*** | 外观类型，可选值为 `primary` `surface` | `string` | `primary` |
| `size` ***3.18.0*** | 尺寸，可选值为 `normal` `large` | `string` | `normal` |
| `title` | 标题 | `string` | `-` |
| `title-position` | 标题位置，可选值为 `left` `center` `right` | `string` | `left` |
| `elevation` | 海拔高度，可选值为 `true` `false` 和 `0-24` 的等级 | `string \| number \| boolean` | `true` |
| `fixed` | 是否固定到顶部 | `boolean` | `false` |
| `placeholder` ***3.2.14*** | 是否在顶部生成相同高度的占位元素（需设置 `fixed`） | `boolean` | `false` |
| `z-index` | 元素 z-index | `number \| string` | `1` |
| `round` | 是否使用圆角 | `boolean` | `false` |
| `border` ***3.3.2*** | 是否使用底部边框 | `boolean` | `false` |
| `image` | 背景图片 | `string` | `-` |
| `image-linear-gradient` | 背景图片渐变色 | `string` | `-` |
| `safe-area-top` | 是否开启顶部安全区适配 | `boolean` | `false` |

**Events**：

无。

**Slots**：

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `default` | 自定义标题内容，会覆盖 `title` 的内容 | 无 |
| `left` | 插入至导航栏左侧的内容 | 无 |
| `right` | 插入至导航栏右侧的内容 | 无 |
| `content` | 扩展内容 | 无 |

**注意**：

- `fixed` 固定到顶部时建议同时开启 `placeholder`，避免脱离文档流后页面内容上移遮挡。
- `type="surface"` 为弱背景色外观，适合桌面端或中后台页面。
- 设置 `image` 时可用 `image-linear-gradient` 叠加渐变，保证前景文字可读。

