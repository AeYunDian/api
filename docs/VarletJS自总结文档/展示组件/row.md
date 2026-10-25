# Row 行

> 分类：展示组件 ｜ 组件标签：`<var-row>` ｜ 官方文档：https://varletjs.org/#/zh-CN/row ｜ [返回索引](../组件索引.md)

**用途**：栅格系统的行容器，负责列间距与整体的主轴、交叉轴对齐。

**基础用法**：

```vue
<template>
  <var-row justify="center" :gutter="[20, 10]">
    <var-col :span="8">
      <div class="item">span: 8</div>
    </var-col>
    <var-col :span="8">
      <div class="item">span: 8</div>
    </var-col>
  </var-row>
</template>
```

**Props**：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `gutter` | 列间距，默认为水平间距。可设置为 `[垂直间距, 水平间距]`（支持长度单位） | _string \| number \| [string \| number, string \| number]_ | `0` |
| `justify` | 主轴对齐方式，可选值为 `flex-start` `flex-end` `center` `space-between` `space-around` | _string_ | `flex-start` |
| `align` | 交叉轴对齐方式，可选值为 `flex-start` `flex-end` `center` | _string_ | `flex-start` |

**Events**：

| 事件 | 说明 | 回调参数 |
| --- | --- | --- |
| `click` | 点击 Row 时触发 | `event: Event` |

**Slots**：

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `default` | Row 内容 | 无 |

**注意**：

- `gutter` 为数字或字符串时表示水平间距，传数组时顺序为 `[垂直间距, 水平间距]`。
- `align` 的可选值比 `Col` 的同类属性少，不支持 `stretch` 与 `baseline`。
