# ImagePreview 图片预览

> 分类：展示组件 ｜ 组件标签：`<var-image-preview>` ｜ 官方文档：https://varletjs.org/#/zh-CN/image-preview ｜ [返回索引](../组件索引.md)

**用途**：用于图片放大浏览的场景，支持多图切换、双击倍数放大、循环播放与键盘 ESC 关闭，提供函数调用和组件调用两种使用方式，常见于商品图、相册、聊天图片等需要查看大图的需求。

**基础用法**：

```vue
<script setup>
import { ImagePreview, Snackbar } from '@varlet/ui'

function preview() {
  ImagePreview({
    images: [
      'https://varletjs.org/cat.jpg',
      'https://varletjs.org/cat2.jpg',
    ],
    onChange(index) {
      Snackbar(String(index))
    },
  })
}
</script>

<template>
  <var-button type="primary" block @click="preview">处理回调函数</var-button>
</template>
```

**Props**：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `v-model:show` | 是否显示 | _boolean_ | `false` |
| `images` | 需要预览的图片 URL 数组 | _string[]_ | `[]` |
| `initial-index` | 图片预览起始的索引 | _string \| number_ | `0` |
| `zoom` | 双击放大倍数 | _string \| number_ | `2` |
| `closeable` | 是否显示关闭按钮 | _boolean_ | `false` |
| `close-on-key-escape` | 是否支持键盘 ESC 图片预览 | _boolean_ | `true` |
| `loop` | 是否开启循环播放 | _boolean_ | `true` |
| `indicator` | 是否显示分页 | _boolean_ | `true` |
| `lock-scroll` | 锁定滚动 | _boolean_ | `true` |
| `teleport` | 弹出层挂载的位置 | _TeleportProps['to'] \| false_ | `body` |
| `image-prevent-default` | 是否禁止图片默认行为 | _boolean_ | `false` |

**Options**（函数式调用 `ImagePreview(options)` 的参数）：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `images` | 需要预览的图片 URL 数组或者单个图片的 URL | _string[] \| string_ | `[]` |
| `initialIndex` | 图片预览起始的索引 | _string \| number_ | `0` |
| `zoom` | 双击放大倍数 | _string \| number_ | `2` |
| `closeable` | 是否显示关闭按钮 | _boolean_ | `false` |
| `closeOnKeyEscape` | 是否支持键盘 ESC 关闭图片预览 | _boolean_ | `true` |
| `loop` | 是否开启循环播放 | _boolean_ | `true` |
| `indicator` | 是否显示分页 | _boolean_ | `true` |
| `lockScroll` | 锁定滚动 | _boolean_ | `true` |
| `imagePreventDefault` | 是否禁止图片默认行为 | _boolean_ | `false` |
| `onChange` | 切换图片时的回调函数，回调参数为当前索引 | _(index: number) => void_ | `-` |
| `onOpen` | image-preview 开启时候的回调 | _() => void_ | `-` |
| `onOpened` | image-preview 动画结束时候的回调 | _() => void_ | `-` |
| `onClose` | image-preview 关闭时候的回调 | _() => void_ | `-` |
| `onClosed` | image-preview 关闭动画结束时候的回调 | _() => void_ | `-` |
| `onLongPress` | 长按图片时的回调函数，回调参数为当前索引 | _(index: number) => void_ | `-` |
| `onKeyEscape` | 点击键盘 ESC 时触发 | _() => void_ | `-` |

**Events**：

| 事件 | 说明 | 回调参数 |
| --- | --- | --- |
| `change` | 切换图片时的回调函数 | `index: number` 图片索引 |
| `open` | 打开 image-preview 时触发 | 无 |
| `opened` | 打开 image-preview 动画结束时触发 | 无 |
| `close` | 关闭 image-preview 时触发 | 无 |
| `closed` | 关闭 image-preview 动画结束时触发 | 无 |
| `long-press` | 长按图片时的回调函数 | `index: number` 图片索引 |
| `key-escape` | 点击键盘 ESC 时触发 | 无 |

**Slots**：

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `indicator` | 分页指示器 | `index: number` 图片索引、`length: number` 图片总数 |
| `close-icon` | 关闭按钮 | 无 |
| `extra` | 额外插槽 | 无 |

**Methods**：

| 方法 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| `ImagePreview` | 显示 image-preview | _options \| string \| string[]_ | `-` |
| `ImagePreview.close` | 关闭 image-preview | `-` | `-` |
| `ImagePreview.setDefaultOptions` | 设置默认的选项配置 | _options_ | `-` |
| `ImagePreview.resetDefaultOptions` | 重置默认的选项配置 | `-` | `-` |
| `prev` | 上一页 | `options?: SwipeToOptions` | `-` |
| `next` | 下一页 | `options?: SwipeToOptions` | `-` |
| `to` | 跳转到指定下标 | `index: number, options?: SwipeToOptions` | `-` |
| `zoom` | 放大或者缩小图片 | `ratio: number` | `-` |

**注意**：

- 函数式调用后可通过 `ImagePreview.close()` 主动关闭，并用 `setDefaultOptions` 统一设置默认项。
- 需要监听长按事件时，应先设置 `image-prevent-default` 禁止图片默认行为，再监听 `long-press`。
- `teleport` 默认为 `body`，在弹层嵌套等场景可改为容器选择器或 `false`。
