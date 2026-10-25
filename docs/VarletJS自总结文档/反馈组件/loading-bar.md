# LoadingBar 加载条

> 分类：反馈组件 ｜ 组件标签：`<var-loading-bar>` ｜ 官方文档：https://varletjs.org/#/zh-CN/loading-bar ｜ [返回索引](../组件索引.md)

**用途**：在页面顶部显示一条加载进度条，通过函数式 API 控制开始、结束与失败，适合路由切换、请求等待等全局加载反馈。

**基础用法**：

```vue
<script setup>
import { LoadingBar } from '@varlet/ui'
</script>

<template>
  <var-space direction="column" size="large">
    <var-button type="primary" block @click="LoadingBar.start()">开始</var-button>
    <var-button type="primary" block @click="LoadingBar.finish()">结束</var-button>
    <var-button type="primary" block @click="LoadingBar.error()">错误</var-button>
  </var-space>
</template>
```

**Props / Options**：

LoadingBar 为函数式组件，无组件属性，通过 `LoadingBar.setDefaultOptions` 传入 `LoadingBarOptions` 配置：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `color` | 加载条颜色 | _string_ | `-` |
| `errorColor` | 加载失败时的颜色 | _string_ | `-` |
| `height` | 加载条的高度 | _string \| number_ | `-` |
| `top` | 加载条距离页面顶部的距离 | _string \| number_ | `-` |
| `finishDelay` ***3.3.13*** | 结束加载的延时时间（单位 ms），可用于增加加载动画的持续时间 | _number_ | `-` |

**Events**：

无

**Slots**：

无

**Methods**：

| 方法 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| `LoadingBar.start` | 开始加载 | `-` | `-` |
| `LoadingBar.finish` | 结束加载 | `-` | `-` |
| `LoadingBar.error` | 加载失败 | `-` | `-` |
| `LoadingBar.setDefaultOptions` | 设置默认的选项配置 | _options: LoadingBarOptions_ | `-` |
| `LoadingBar.resetDefaultOptions` | 重置默认的选项配置 | `-` | `-` |

**注意**：

- 移动端场景常需要避开顶部导航栏，可通过 `LoadingBar.setDefaultOptions({ top: '54px' })` 调整偏移。
- 修改过默认配置后，调用 `LoadingBar.resetDefaultOptions()` 可恢复初始样式。
- `finishDelay` 用于延长结束动画的持续时间，避免进度条一闪而过。

