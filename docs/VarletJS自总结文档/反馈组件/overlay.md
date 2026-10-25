# Overlay 遮罩层

> 分类：反馈组件 ｜ 组件标签：`<var-overlay>` ｜ 官方文档：https://varletjs.org/#/zh-CN/overlay ｜ [返回索引](../组件索引.md)

**用途**：创建一个遮罩层，用于强调特定的页面元素，也常作为自定义弹层的背景使用。

**基础用法**：

```vue
<script setup>
import { ref } from 'vue'

const show = ref(false)
</script>

<template>
  <var-button type="primary" block @click="show = true">显示遮罩层</var-button>
  <var-overlay v-model:show="show">
    <div class="overlay-content">
      素胚勾勒出青花笔锋浓转淡，瓶身描绘的牡丹一如你初妆。
    </div>
  </var-overlay>
</template>

<style>
.overlay-content {
  padding: 24px;
  width: 312px;
  border-radius: 28px;
}
</style>
```

**Props / Options**：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `v-model:show` | 是否显示遮罩层 | `boolean` | `false` |
| `lock-scroll` | 是否禁止滚动穿透，禁止时滚动遮罩层不会引发 body 的滚动 | `boolean` | `true` |
| `teleport` | 遮罩层挂载的位置 | `TeleportProps['to'] \| false` | `-` |
| `close-on-key-escape` | 是否支持键盘 ESC 关闭遮罩层 | `boolean` | `true` |

**Events**：

| 事件 | 说明 | 回调参数 |
| --- | --- | --- |
| `click` | 点击遮罩层时触发 | 无 |
| `key-escape` | 点击键盘 ESC 时触发 | 无 |

**Slots**：

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `default` | 遮罩层内容 | 无 |

**Methods**：

| 方法 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| 无 | 组件未暴露实例方法 | 无 | 无 |

**注意**：

- 通过 `v-model:show` 控制显示，点击遮罩时组件会自动将 `show` 设为 `false` 以关闭遮罩层。
- 未指定 `teleport` 时遮罩层在组件所在位置渲染，需要覆盖整个页面时可将 `teleport` 指向 `body`。
- 滚动穿透默认已被禁止（`lock-scroll` 为 `true`），在遮罩层内部做嵌套滚动时需留意这一行为。

