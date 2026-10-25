# TreeMenu 树形菜单

> 分类：导航组件 ｜ 组件标签：`<var-tree-menu>` ｜ 官方文档：https://varletjs.org/#/zh-CN/tree-menu ｜ [返回索引](../组件索引.md)

**用途**：多级折叠菜单，常用作侧边导航栏，支持分组、分割线、手风琴模式与自定义渲染。

**基础用法**：

```vue
<script setup>
import { ref } from 'vue'

const active = ref('overview')
const options = ref([
  { value: 'overview', label: '概览', icon: 'home' },
  {
    value: 'workspace',
    label: '工作台',
    icon: 'notebook',
    children: [
      { value: 'projects', label: '项目', icon: 'star' },
      { value: 'tasks', label: '任务', icon: 'check' },
    ],
  },
])
</script>

<template>
  <var-tree-menu v-model:active="active" :options="options" />
</template>
```

**Props**：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `v-model:active` | 激活菜单项的值 | `string \| number` | `-` |
| `options` | 菜单选项。可选择或可展开的选项必须提供 `value`，或提供由 `value-key` 指定的等价字段 | `TreeMenuOption[]` | `[]` |
| `v-model:expanded-values` | 展开菜单项的值集合 | `Array<string \| number>` | `-` |
| `value-key` | 选项值字段。当选项不使用 `value` 字段时，必须通过该字段指定唯一值来源 | `string` | `'value'` |
| `label-key` | 选项标签字段 | `string` | `'label'` |
| `icon-key` | 选项图标字段 | `string` | `'icon'` |
| `children-key` | 子选项字段 | `string` | `'children'` |
| `accordion` | 是否只允许同级一个选项展开 | `boolean` | `false` |
| `indent` | 每一级缩进 | `string \| number` | `-` |
| `ripple` | 是否开启水波纹 | `boolean` | `false` |
| `bordered` | 是否显示右边框 | `boolean` | `false` |
| `disabled` | 是否禁用整个菜单 | `boolean` | `false` |

**Events**：

| 事件 | 说明 | 回调参数 |
| --- | --- | --- |
| `change` | 激活菜单项变化时触发 | `active: string \| number`、`option: TreeMenuOption` |

**Slots**：

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `start` | 头部内容 | 无 |
| `end` | 尾部内容 | 无 |

**注意**：

- 可选择或可展开的选项必须提供 `value`（或 `value-key` 指定的等价字段），否则无法匹配激活与展开状态。
- 数据结构字段不一致时通过 `value-key`、`label-key`、`icon-key`、`children-key` 做字段映射，无需转换数据。
- `accordion` 仅约束同级菜单，跨层级仍可同时展开。

## TreeMenuOption 树形菜单节点数据

**用途**：描述 `TreeMenu` 的每一个菜单节点，支持普通选项、`group` 分组、`divider` 分割线以及自定义渲染。

**基础用法**：

```vue
<script setup>
import { ref } from 'vue'

const active = ref('overview')
const options = ref([
  {
    type: 'group',
    value: 'main',
    label: '主要',
    children: [
      { value: 'overview', label: '概览', icon: 'home' },
      { value: 'workspace', label: '工作台', icon: 'notebook' },
    ],
  },
  { type: 'divider', value: 'main-divider' },
])
</script>

<template>
  <var-tree-menu v-model:active="active" :options="options" />
</template>
```

**Props**：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `type` | 选项类型。`group` 渲染分组标题和子选项，`divider` 渲染分割线 | `'group' \| 'divider'` | `-` |
| `value` | 选项值。可选择或可展开的选项必须提供，或提供由 `value-key` 指定的等价字段；`group` 和 `divider` 可省略 | `string \| number` | `-` |
| `label` | 选项标签 | `string \| VNode \| ((option, active) => VNodeChild)` | `-` |
| `icon` | 选项图标 | `string \| VNode \| ((option, active) => VNodeChild)` | `-` |
| `render` | 自定义选项渲染 | `({ node }, option, active) => VNodeChild` | `-` |
| `namespace` | 图标命名空间 | `string` | `var-icon` |
| `show` | 是否显示当前选项 | `boolean` | `true` |
| `disabled` | 是否禁用当前选项 | `boolean` | `false` |
| `children` | 子选项 | `TreeMenuOption[]` | `-` |

**Events**：

无。

**Slots**：

无。

**注意**：

- `label` 与 `icon` 支持函数形式，接收 `(option, active)` 便于根据激活状态动态渲染。
- `render` 可包裹任意内容（如 `Tooltip`、`router-link`），返回的节点会替代默认菜单项渲染。
- `show: false` 可动态隐藏节点，配合计算属性即可实现按条件显示菜单。

