# Signature 签名

> 分类：反馈组件 ｜ 组件标签：`<var-signature>` ｜ 官方文档：https://varletjs.org/#/zh-CN/signature ｜ [返回索引](../组件索引.md)

**用途**：基于 `Canvas` 的手写签名组件，常用于签署确认、电子表单等需要采集手写笔迹的场景。

**基础用法**：

```vue
<script setup>
import { ref } from 'vue'

const signatureRef = ref()
const signature = ref('')

function confirmSignature() {
  signature.value = signatureRef.value.confirm()
}
</script>

<template>
  <var-signature ref="signatureRef" />
  <var-button type="primary" @click="confirmSignature">确认</var-button>
  <img v-if="signature" :src="signature" />
</template>
```

**Props**：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `stroke-style` | 画笔颜色 | _string_ | `currentColor` |
| `line-width` | 画笔粗细 | _string \| number_ | `2` |
| `data-url-type` | 生成图片的格式 | _'png' \| 'jpg'_ | `'png'` |

**Events**：

| 事件 | 说明 | 回调参数 |
| --- | --- | --- |
| `start` | 开始签名时触发 | `-` |
| `signing` | 签名过程中触发 | `-` |
| `end` | 结束签名时触发 | `-` |

**Slots**：无

**Methods**：

| 方法 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| `reset` | 重置签名 | `-` | `-` |
| `confirm` | 确认签名，返回 data url 格式的图片数据。画布为空时返回空字符串 | `-` | `string` |

**注意**：

- 通过 `confirm` 获取画布的 data url，画布为空时会得到空字符串，需自行判断后再提交。
- `stroke-style` 默认为 `currentColor`，会继承文字颜色，因此也可用 CSS `color` 设置画笔颜色。
- 图片输出格式由 `data-url-type` 决定，可选 `'png'` 或 `'jpg'`。

