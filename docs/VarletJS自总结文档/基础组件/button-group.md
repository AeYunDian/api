# ButtonGroup 按钮组

> 分类：基础组件 ｜ 组件标签：`<var-button-group>` ｜ 官方文档：https://varletjs.org/#/zh-CN/button ｜ [返回索引](../组件索引.md)

**用途**：把多个 Button 聚合为一条视觉整体，用于同类操作并列展示或按钮拆分。组上的 `type`、`size`、`mode` 会被子按钮继承。

**基础用法**：通过 `mode` 切换文字、外边框、tonal 与普通形态，`vertical` 控制竖直排列。

```vue
<template>
  <var-space :size="[10, 10]">
    <var-button-group type="primary" mode="text">
      <var-button>按钮</var-button>
      <var-button>按钮</var-button>
      <var-button>按钮</var-button>
    </var-button-group>

    <var-button-group type="primary" mode="outline" vertical>
      <var-button>按钮</var-button>
      <var-button>按钮</var-button>
      <var-button>按钮</var-button>
    </var-button-group>
  </var-space>
</template>
```

**Props**

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `type` | 按钮组类型，可选值为 `default` `primary` `info` `success` `warning` `danger` | _string_ | `default` |
| `size` | 按钮组尺寸，可选值为 `normal` `mini` `small` `large` | _string_ | `normal` |
| `mode` | 按钮组模式，可选值为 `normal` `text` `outline` `tonal` `icon-container` | _string_ | `normal` |
| `vertical` | 按钮组是否竖直排列 | _boolean_ | `false` |
| `elevation` | 按钮组海拔高度，可选值为 `true`、`false` 和 `0-24` 的等级 | _string \| number \| boolean_ | `true` |
| `color` | 按钮组背景颜色 | _string_ | `-` |
| `text-color` | 按钮组文字颜色 | _string_ | `-` |

**Events**

| 事件 | 说明 | 回调参数 |
| --- | --- | --- |
| 无 | 无 | 无 |

**Slots**

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `default` | 按钮组内容 | 无 |

**注意**

- 组上设置的 `type`、`size`、`mode`、`color` 会作用于内部按钮，子按钮一般无需重复设置。
- 实现「按钮拆分」时，在 `ButtonGroup` 外包一层 `var-menu`，并在主按钮上使用 `@click.stop` 阻止事件冒泡。
- `mode` 与 `vertical` 组合可实现侧边工具条等竖向按钮组布局。

