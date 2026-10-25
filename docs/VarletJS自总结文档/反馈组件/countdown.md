# Countdown 倒计时

> 分类：反馈组件 ｜ 组件标签：`<var-countdown>` ｜ 官方文档：https://varletjs.org/#/zh-CN/countdown ｜ [返回索引](../组件索引.md)

**用途**：用于实时展示倒计时数值，支持毫秒精度，常用于限时活动、秒杀开抢、订单超时提醒等场景。

**基础用法**：`time` 属性表示倒计时总时长，单位为毫秒。

```vue
<script setup>
import { ref } from 'vue'

const time = ref(30 * 60 * 60 * 1000)
</script>

<template>
  <var-countdown :time="time" format="DD 天 HH 时 mm 分 ss 秒" />
</template>
```

**Props**

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `time` | 倒计时时长（ms） | _string \| number_ | `0` |
| `format` | 时间格式 | _string_ | `HH : mm : ss` |
| `auto-start` | 是否自动开始倒计时 | _boolean_ | `true` |

**Events**

| 事件 | 说明 | 回调参数 |
| --- | --- | --- |
| `end` | 倒计时结束时触发 | 无 |
| `change` | 倒计时变化时触发 | `timeData: TimeData` |

**Slots**

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `default` | 自定义内容 | `timeData: TimeData` |

**Methods**

| 方法 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| `start` | 开始倒计时 | 无 | 无 |
| `pause` | 暂停倒计时 | 无 | 无 |
| `reset` | 重设倒计时，若 `auto-start` 为 `true`，重设后会自动开始倒计时 | 无 | 无 |

**注意**

- `format` 支持的占位符：`DD` 天数、`HH` 小时、`mm` 分钟、`ss` 秒数、`S` 毫秒（1 位）、`SS` 毫秒（2 位）、`SSS` 毫秒（3 位）。示例：`DD 天 HH 时 mm 分 ss 秒`、`HH:mm:ss:SS`。
- 插槽与 `change` 事件拿到的 `timeData` 对象包含 `days`、`hours`、`minutes`、`seconds`、`milliseconds` 五个字段，均为 `number`。
- 通过 `ref` 获取组件实例后可手动调用 `start`、`pause`、`reset`；配合 `:auto-start="false"` 可实现「点击开始」的自定义控制流程。

