# Progress 进度条

> 分类：展示组件 ｜ 组件标签：`<var-progress>` ｜ 官方文档：https://varletjs.org/#/zh-CN/progress ｜ [返回索引](../组件索引.md)

**用途**：展示操作的当前进度，常用于文件上传、数据加载、任务完成度等反馈场景。支持线性与环形两种形态。

**基础用法**：

```vue
<template>
  <var-space direction="column" :size="[12, 12]">
    <var-progress :value="20" />
    <var-progress :value="60" :track="false" label />
    <var-progress :value="100" label>success</var-progress>
  </var-space>
</template>
```

**Props**：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `mode` | `progress` 的模式，可选值为 `linear, circle` | _string_ | `linear` |
| `type` | 类型，可选值为 `default` `primary` `info` `success` `warning` `danger` | _string_ | `primary` |
| `value` | `progress` 的进度 | _string \| number_ | `0` |
| `line-width` | `progress` 的线宽 | _string \| number_ | `4` |
| `color` | `progress` 的颜色（环形进度条设置渐变色请使用 object，渐变同 svg 的 linearGradient 元素） | _string \| object_ | `-` |
| `track-color` | `progress` 轨道的颜色 | _string_ | `-` |
| `label` | 是否显示 `label` | _boolean_ | `false` |
| `label-class` | 自定义 `label` 的类名 | _string_ | `-` |
| `track` | 是否显示 `progress` 的轨道 | _boolean_ | `true` |
| `indeterminate` | 是否显示不间断动画 | _boolean_ | `false` |
| `size` | `progress` 的尺寸（仅支持环形进度条） | _string \| number_ | `40` |
| `rotate` | `progress` 的原点（仅支持环形进度条） | _number_ | `0` |

**Events**：

| 事件 | 说明 | 回调参数 |
| --- | --- | --- |
| 无 | 无 | 无 |

**Slots**：

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `default` | 自定义 label | 无 |

**注意**：

- 线性进度条通过 `line-width`、`color`、`track-color` 调整线宽与颜色；环形进度条的 `size` 控制直径。
- 环形进度条需要渐变色时，`color` 传入对象（如 `{ '0%': '#3fecff', '100%': '#6149f6' }`），线性进度条可直接使用字符串。
- 加载进度未知时，用 `indeterminate` 开启不间断动画。
