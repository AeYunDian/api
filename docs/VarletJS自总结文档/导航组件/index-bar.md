# IndexBar 索引栏

> 分类：导航组件 ｜ 组件标签：`<var-index-bar>` ｜ 官方文档：https://varletjs.org/#/zh-CN/index-bar ｜ [返回索引](../组件索引.md)

**用途**：以字母或自定义索引快速跳转到页面指定位置，常用于通讯录、城市列表、商品分类等长列表浏览场景。

**基础用法**：

```vue
<script setup>
import { ref, onMounted } from 'vue'

const list = ref([])

onMounted(() => {
  for (let i = 0; i < 26; i++) {
    list.value.push(String.fromCharCode(65 + i))
  }
})
</script>

<template>
  <var-index-bar duration="300">
    <template v-for="item in list" :key="item">
      <var-index-anchor :index="item">标题 {{ item }}</var-index-anchor>
      <var-cell>{{ item }} 文本</var-cell>
    </template>
  </var-index-bar>
</template>
```

**Props**：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `sticky` | 是否开启锚点吸顶 | `boolean` | `true` |
| `sticky-offset-top` | 锚点吸顶时与顶部的距离 | `number \| string` | `0` |
| `hide-list` | 是否隐藏锚点列表 | `boolean` | `false` |
| `sticky-css-mode` | 开启原生 `css sticky` 模式 | `boolean` | `false` |
| `z-index` | z-index 层级 | `number \| string` | `1` |
| `highlight-color` | 索引字符高亮颜色 | `string` | `-` |
| `duration` | 动画持续时间 | `string \| number` | `0` |

**Events**：

| 事件 | 说明 | 回调参数 |
| --- | --- | --- |
| `click` | 点击索引栏的字符时触发 | `index: number \| string` |
| `change` | 当前高亮的索引字符变化时触发 | `index: number \| string` |

**Slots**：

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `default` | 索引栏内容 | 无 |

**Methods**：

| 方法 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| `scrollTo` | 滚动到指定锚点 | `index: number \| string, options?: IndexBarScrollToOptions` | `-` |

`IndexBarScrollToOptions` 支持 `event`：值为 `false` 时阻止触发 `change` 事件，类型 `boolean`，默认 `-`。

**注意**：

- 每个索引项必须用 `IndexAnchor` 的 `index` 与索引字符一一对应，否则跳转位置不准确。
- 锚点吸顶默认开启，可用 `sticky-offset-top` 调整吸顶距离；`hide-list` 可隐藏右侧索引列表。
- 滚动动画时长由 `duration` 控制，默认无动画。

