# Result 结果

> 分类：展示组件 ｜ 组件标签：`<var-result>` ｜ 官方文档：https://varletjs.org/#/zh-CN/result ｜ [返回索引](../组件索引.md)

**用途**：用于向用户展示操作或请求的最终结果（成功、警告、信息、错误、疑问、空值等），常见于表单提交反馈、支付结果页与内容占位。

**基础用法**：

```vue
<template>
  <var-result
    title="成功"
    description="嗨~ 我是结果页的一段描述~"
  >
    <template #footer>
      <var-button type="success">知道了</var-button>
    </template>
  </var-result>
</template>
```

**Props**：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `type` | 结果状态，可选值为 `info` `success` `warning` `error` `question` `empty` | _string_ | `success` |
| `title` | 标题 | _string_ | `-` |
| `description` | 描述 | _string_ | `-` |
| `image-size` | 图片尺寸 | _string \| number_ | `-` |
| `animation` | 是否开启动画，仅对 `success` 状态有效 | _boolean_ | `true` |

**Events**：

| 事件 | 说明 | 回调参数 |
| --- | --- | --- |
| 无 | 组件本身不派发事件 | 无 |

**Slots**：

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `image` | 自定义图标 | 无 |
| `title` | 自定义标题 | 无 |
| `description` | 自定义描述 | 无 |
| `footer` | 自定义底部内容 | 无 |

**注意**：

- 修改背景颜色时请尽量不要设为透明或半透明，否则可能影响成功状态的动画效果。
- `animation` 只对 `success` 状态生效，其余状态没有入场动画。
