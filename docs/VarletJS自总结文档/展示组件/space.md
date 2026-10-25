# Space 间隔

> 分类：展示组件 ｜ 组件标签：`<var-space>` ｜ 官方文档：https://varletjs.org/#/zh-CN/space ｜ [返回索引](../组件索引.md)

**用途**：为多个同级元素快速设置统一的间距与排列方向，免去手写 flex 与 margin。常用于按钮组、标签组、操作区。

**基础用法**：

```vue
<template>
  <var-space>
    <var-button>Button1</var-button>
    <var-button>Button2</var-button>
    <var-button>Button3</var-button>
  </var-space>
</template>
```

**Props**：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `direction` | 布局方向 可选值为 `row` `column` | _string_ | `row` |
| `justify` | 主轴排列方式 可选值为 `flex-start` `flex-end` `center` `space-around` `space-between` | _string_ | `flex-start` |
| `align` | 交叉轴排列方式 可选值为 `stretch` `center` `flex-start` `flex-end` `baseline` | _string_ | `-` |
| `size` | 间距，可选值为 `mini` `small` `normal` `large` 或 `[垂直间距, 水平间距]`（支持长度单位） | _string \| number \| [string \| number, string \| number]_ | `normal` |
| `wrap` | 是否超出换行 | _boolean_ | `true` |
| `inline` | 是否为行内元素 | _boolean_ | `false` |

**Events**：

| 事件 | 说明 | 回调参数 |
| --- | --- | --- |
| 无 | 无 | 无 |

**Slots**：

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `default` | Space 内容 | 无 |

**注意**：

- `size` 传数组时顺序为 `[垂直间距, 水平间距]`，与 `Row` 的 `gutter` 一致。
- 需在文本流中与其他行内元素并排时开启 `inline`，否则默认以块级元素占满一行。
- 子元素会被包裹一层容器，作用于子元素的 `margin` 可能被覆盖，间距请统一通过 `size` 控制。
