# Cell 单元格

> 分类：基础组件 ｜ 组件标签：`<var-cell>` ｜ 官方文档：https://varletjs.org/#/zh-CN/cell ｜ [返回索引](../组件索引.md)

**用途**：单元格为列表中的单个展示项，常用于设置项、列表条目等场景，支持标题、描述、左右图标与边框。

**基础用法**：

```vue
<template>
  <var-cell icon="fire" title="这是单元格" description="描述">
    <template #extra>
      <var-icon name="information" />
    </template>
  </var-cell>
  <var-cell title="这是单元格" description="描述" border />
</template>
```

**Props**：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `title` | 单元格标题 | _string_ | `-` |
| `icon` | 左侧图标名称 | _string_ | `-` |
| `namespace` | 左侧图标命名空间 | _string_ | `var-icon` |
| `description` | 单元格描述 | _string_ | `-` |
| `border` | 是否显示边框 | _boolean_ | `false` |
| `border-offset` | 边框偏移量 | _string \| number_ | `-` |
| `icon-class` | 图标额外类名 | _string_ | `-` |
| `title-class` | 标题额外类名 | _string_ | `-` |
| `description-class` | 描述额外类名 | _string_ | `-` |
| `extra-class` | 右侧内容额外类名 | _string_ | `-` |
| `ripple` | 是否启用水波效果 | _boolean_ | `false` |

**Events**：

| 事件 | 说明 | 回调参数 |
| --- | --- | --- |
| `click` | 点击时触发 | `event: Event` |

**Slots**：

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `default` | cell 的内容 | 无 |
| `icon` | 自定义左侧 icon 区域 | 无 |
| `description` | 描述的内容 | 无 |
| `extra` | 自定义右侧区域内容 | 无 |

**注意**：

- 多个单元格用作列表项时，可配合 `border` 与 `border-offset` 控制分隔线，例如 `border-offset="0"` 让边框贯通整行。
- `ripple` 提供水波点击反馈，通常与监听 `click` 事件配合使用。
- 在 `extra` 插槽放置开关等交互控件时，可对其使用 `@click.stop` 避免连带触发单元格点击。

