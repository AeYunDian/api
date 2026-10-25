# Pagination 分页

> 分类：展示组件 ｜ 组件标签：`<var-pagination>` ｜ 官方文档：https://varletjs.org/#/zh-CN/pagination ｜ [返回索引](../组件索引.md)

**用途**：数据量较大时用于分页展示，提供页码、每页条数切换、总数显示与快速跳转能力。默认为适合小屏的简约模式，宽屏可切换为普通模式。

**基础用法**

```vue
<template>
  <var-pagination :current="1" :total="20" />
</template>
```

**Props**

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `v-model:current` | 当前页数 | `string \| number` | `1` |
| `v-model:size` | 每页条数 | `string \| number` | `10` |
| `total` | 总条数 | `string \| number` | `0` |
| `simple` | 是否为简单模式 | `boolean` | `true` |
| `elevation` | 海拔高度，可选值为 `true` `false` 和 `0-24` 的等级，不为简单模式时生效 | `string \| number \| boolean` | `true` |
| `disabled` | 禁用分页 | `boolean` | `false` |
| `show-size-changer` | 是否显示 `size` 切换器 | `boolean` | `true` |
| `show-quick-jumper` | 是否可以快速跳转至某页 | `boolean` | `false` |
| `max-pager-count` | 省略号间显示的按钮数量 | `number` | `3` |
| `size-option` | 指定每页可以显示多少条 | `number[]` | `[10, 20, 50, 100]` |
| `show-total` | 用于显示数据总量和当前数据顺序 | `function(total, range)` | `-` |

**Events**

| 事件 | 说明 | 回调参数 |
| --- | --- | --- |
| `change` | `current` 或 `size` 改变后的回调 | `current: number`、`size: number` |

**Slots**

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `prev` | 上一页按钮内容 | 无 |
| `next` | 下一页按钮内容 | 无 |

**注意**

- `simple` 默认为 `true`，即默认渲染简约模式；需要宽屏的完整分页风格时显式设置 `:simple="false"`。
- `elevation` 仅在非简单模式（`simple` 为 `false`）下生效。
- `v-model:size` 表示每页条数，与表示当前页的 `v-model:current` 区分开。
