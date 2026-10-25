# Popup 弹出层

> 分类：反馈组件 ｜ 组件标签：`<var-popup>` ｜ 官方文档：https://varletjs.org/#/zh-CN/popup ｜ [返回索引](../组件索引.md)

**用途**：创建一个可以从上、下、左、右、中心弹出的容器，用于展示信息或承载自定义面板。

**基础用法**：

```vue
<script setup>
import { ref } from 'vue'

const show = ref(false)
const bottom = ref(false)
</script>

<template>
  <var-button type="primary" block @click="show = true">居中弹出</var-button>
  <var-button type="primary" block @click="bottom = true">下方弹出</var-button>

  <var-popup v-model:show="show">
    <div class="popup-block">素胚勾勒出青花笔锋浓转淡。</div>
  </var-popup>

  <var-popup position="bottom" v-model:show="bottom">
    <div class="popup-block">素胚勾勒出青花笔锋浓转淡。</div>
  </var-popup>
</template>

<style>
.popup-block {
  padding: 24px;
  width: 280px;
}
</style>
```

**Props / Options**：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `v-model:show` | 是否显示弹出层 | `boolean` | `false` |
| `position` | 弹出位置，可选值为 `top` `bottom` `right` `left` `center` | `string` | `center` |
| `overlay` | 是否显示遮罩层 | `boolean` | `true` |
| `overlay-class` | 自定义遮罩层的 class | `string` | `-` |
| `overlay-style` | 自定义遮罩层的 style | `object` | `-` |
| `default-style` | 是否启用默认样式 | `boolean` | `true` |
| `transition` | 过渡动画的名称 | `string` | `-` |
| `lock-scroll` | 是否禁止滚动穿透，禁止时滚动弹出层不会引发 body 的滚动 | `boolean` | `true` |
| `close-on-click-overlay` | 是否点击遮罩层关闭弹出层 | `boolean` | `true` |
| `close-on-key-escape` | 是否支持键盘 ESC 关闭弹出层 | `boolean` | `true` |
| `teleport` | 弹出层挂载的位置 | `TeleportProps['to'] \| false` | `body` |
| `safe-area` | 是否开启底部安全区适配 | `boolean` | `false` |
| `safe-area-top` | 是否开启顶部安全区适配 | `boolean` | `false` |
| `z-index` | 元素 z-index（3.3.10） | `number` | `-` |

**Events**：

| 事件 | 说明 | 回调参数 |
| --- | --- | --- |
| `open` | 打开弹出层时触发 | 无 |
| `opened` | 打开弹出层动画结束时触发 | 无 |
| `close` | 关闭弹出层时触发 | 无 |
| `closed` | 关闭弹出层动画结束时触发 | 无 |
| `click-overlay` | 点击遮罩层时触发 | 无 |
| `key-escape` | 点击键盘 ESC 时触发 | 无 |

**Slots**：

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `default` | 弹出层内容 | 无 |

**Methods**：

| 方法 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| 无 | 组件未暴露实例方法 | 无 | 无 |

**注意**：

- 默认使用 `teleport` 插入到 `body` 尾部，因此在组件内部用普通选择器样式可能失效，推荐通过 `overlay-class`、`overlay-style` 定制外观。
- `position` 默认值为 `center`；从底部弹出并需要适配全面屏时可同时开启 `safe-area`，从顶部弹出则可开启 `safe-area-top`。
- 弹出层内容默认没有内边距与固定宽度，需要在插槽内容上自行书写样式。

