# CollapseItem 折叠面板项

> 分类：展示组件 ｜ 组件标签：`<var-collapse-item>` ｜ 官方文档：https://varletjs.org/#/zh-CN/collapse ｜ [返回索引](../组件索引.md)

**用途**：作为 `Collapse` 的子项，承载单个面板的标题、图标与内容区域。

**基础用法**：

```vue
<script setup>
import { ref } from 'vue'

const value = ref(['1'])
</script>

<template>
  <var-collapse v-model="value">
    <var-collapse-item title="这是标题" name="1" icon="account-circle">
      文本
    </var-collapse-item>
    <var-collapse-item name="2">
      <template #title>这是标题</template>
      <template #icon>^_^</template>
      这是内容
    </var-collapse-item>
  </var-collapse>
</template>
```

**Props**：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `name` | 唯一标识符，默认为索引值 | _string \| number_ | `index` |
| `title` | 面板标题 | _string \| number_ | `-` |
| `icon` | icon 的名称 | _string_ | `chevron-down` |
| `disabled` | 是否禁用面板 | _boolean_ | `false` |

**Events**：

| 事件 | 说明 | 回调参数 |
| --- | --- | --- |
| 无 | 无 | 无 |

**Slots**：

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `default` | 面板的内容 | 无 |
| `title` | 面板的标题 | 无 |
| `icon` | 自定义右侧 icon | 无 |

**注意**：

- 未显式设置 `name` 时以索引作为标识，列表动态增删会导致展开状态错位，建议始终指定稳定的 `name`。
- `disabled` 只阻止用户交互，`toggleAll({ expand: true })` 仍可展开禁用面板，除非传入 `skipDisabled`。
