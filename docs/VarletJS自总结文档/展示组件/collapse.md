# Collapse 折叠面板

> 分类：展示组件 ｜ 组件标签：`<var-collapse>` ｜ 官方文档：https://varletjs.org/#/zh-CN/collapse ｜ [返回索引](../组件索引.md)

**用途**：将内容分组收起与展开，节省纵向空间。常用于问答列表、筛选条件、分组表单等场景。

**基础用法**：

```vue
<script setup>
import { ref } from 'vue'

const value = ref(['1'])

function handleChange(val) {
  console.log(val)
}
</script>

<template>
  <var-collapse v-model="value" @change="handleChange">
    <var-collapse-item title="标题" name="1">文本</var-collapse-item>
    <var-collapse-item title="标题" name="2">文本</var-collapse-item>
  </var-collapse>
</template>
```

**Props**：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `v-model` | 当前展开面板的 name | 手风琴模式： _string \| number_<br>非手风琴模式： _string[] \| number[]_ | `-` |
| `accordion` | 是否开启手风琴模式 | _boolean_ | `false` |
| `elevation` | 海拔高度，可选值为 `true` `false` 和 `0-24` 的等级 | _string \| number \| boolean_ | `true` |
| `offset` | 是否显示边距 | _boolean_ | `true` |
| `divider` | 是否显示分割线 | _boolean_ | `true` |

**Events**：

| 事件 | 说明 | 回调参数 |
| --- | --- | --- |
| `change` | 切换面板时触发 | `value: 类型与 v-model 绑定的值一致` |

**Slots**：

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `default` | 折叠面板的内容 | 无 |

**Methods**：

| 方法 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| `toggleAll` | 开启或关闭所有面板 | `options: CollapseToggleAllOptions` | 无 |

`CollapseToggleAllOptions` 参数说明：

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `expand` | 设置 `'inverse'` 可切换所有面板的状态，包括禁用的面板；设置 `boolean` 控制所有面板展开或收起 | _'inverse' \| boolean_ | `-` |
| `skipDisabled` | 是否跳过禁用状态的面板 | _boolean_ | `false` |

**注意**：

- 开启 `accordion` 后 `v-model` 值必须是字符串或数字，而非数组；模式切换时记得同步改为对应类型。
- `toggleAll` 需通过组件 `ref` 调用，`expand: 'inverse'` 会连同禁用面板一起反转状态。
- 面板之间默认有 `16px` 上边距，设置 `offset` 为 `false` 可去掉该间距以贴合容器。
