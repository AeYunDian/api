# CountTo 数字动画

> 分类：反馈组件 ｜ 组件标签：`<var-count-to>` ｜ 官方文档：https://varletjs.org/#/zh-CN/count-to ｜ [返回索引](../组件索引.md)

**用途**：展示起始数值到目标数值的数字滚动动画，常用于数据看板、统计卡片中的数值展示。

**基础用法**：

```vue
<template>
  <var-count-to :to="123456" />
</template>
```

**Props / Options**：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `from` | 起始值 | _number \| string_ | `0` |
| `to` | 目标值 | _number \| string_ | `0` |
| `duration` | 动画持续时间（单位：毫秒） | _number \| string_ | `2000` |
| `precision` | 精度 | _number \| string_ | `2` |
| `auto-start` | 是否自动开始播放动画 | _boolean_ | `true` |
| `timing-function` | 动画曲线函数 | _(v: number) => number_ | `v => v` |

**Events**：

| 事件 | 说明 | 回调参数 |
| --- | --- | --- |
| `end` | 动画结束时触发 | `-` |

**Slots**：

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `default` | 自定义内容 | `value: number` |

**Methods**：

| 方法 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| `start` | 开始动画 | `-` | `-` |
| `pause` | 暂停动画 | `-` | `-` |
| `reset` | 重置动画，若 `auto-start` 为 `true`，重置后会自动开始播放 | `-` | `-` |

**注意**：

- 通过 `from` 和 `to` 指定起始数值与目标数值，默认从 `0` 开始。
- `precision` 控制数值精度，默认保留两位小数。
- `auto-start` 设为 `false` 后可调用实例方法 `start`、`pause`、`reset` 手动控制动画。

