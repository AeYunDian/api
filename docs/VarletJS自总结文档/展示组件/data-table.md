# DataTable 数据表格

> 分类：展示组件 ｜ 组件标签：`<var-data-table>` ｜ 官方文档：https://varletjs.org/#/zh-CN/data-table ｜ [返回索引](../组件索引.md)

**用途**：数据驱动的表格组件，通过 `columns` 列配置与 `data` 数据源自动渲染表头与表体，并内置分页、排序、多选、树形、展开、单元格合并与总结栏。适合后台管理、报表、明细列表等需要展示大量结构化数据的场景。

**基础用法**

```vue
<script setup>
import { ref } from 'vue'

const columns = ref([
  { key: 'name', title: '姓名' },
  { key: 'role', title: '角色' },
  { key: 'status', title: '状态' },
])

const data = ref(
  Array.from({ length: 18 }, (_, index) => ({
    id: index + 1,
    name: `用户 ${index + 1}`,
    role: index % 2 === 0 ? '工程师' : '操作员',
    status: index % 3 === 0 ? '在线' : '离线',
  })),
)
</script>

<template>
  <var-data-table :columns="columns" :data="data" :pagination="{ showSizeChanger: true }" />
</template>
```

**Props**

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `data` | 数据源。前端分页下传全量数据，远程分页下传当前页数据 | `any[]` | `[]` |
| `columns` | 列配置 | `DataTableColumn[]` | `[]` |
| `row-key` | 行 key 字段或获取函数。选择、详情展开和树形展开依赖稳定唯一的行 key；如果数据没有 `id`，应显式配置该属性 | `string \| number \| ((context: { row, rowIndex }) => string \| number)` | `'id'` |
| `row-props` | 自定义行属性，支持对象或函数 | `object \| (context) => object` | `-` |
| `row-class` | 自定义行类名，支持字符串、数组、对象或函数 | `string \| array \| object \| (context) => string \| array \| object` | `-` |
| `summary` | 总结栏渲染函数。返回数组时渲染多行总结栏 | `(context) => Record<string, DataTableSummaryCell> \| Array<Record<string, DataTableSummaryCell>>` | `-` |
| `loading` | 是否显示加载遮罩 | `boolean` | `false` |
| `pagination` | 内置分页配置 | `boolean \| DataTablePagination` | `true` |
| `remote` | 是否启用远程分页模式 | `boolean` | `false` |
| `v-model:page` | 当前页码 | `number` | `1` |
| `v-model:page-size` | 当前每页条数 | `number` | `10` |
| `v-model:checked-row-keys` | 选中行的 key 集合 | `Array<string \| number>` | `[]` |
| `v-model:expanded-row-keys` | `type: 'expand'` 展开详情行的 key 集合 | `Array<string \| number>` | `[]` |
| `v-model:expanded-tree-row-keys` | `tree` 模式下展开树节点的 key 集合 | `Array<string \| number>` | `[]` |
| `total` | 远程分页总条数 | `number` | `-` |
| `max-height` | 表格主体最大高度。设置后表头固定，内容区域内部滚动 | `number \| string` | `-` |
| `scroll-x` | 用于开启横向滚动的表格最小宽度。当容器更宽时，表格仍会撑满容器 | `number \| string` | `-` |
| `v-model:sorters` | 受控排序状态集合 | `DataTableSorter[]` | `[]` |
| `sort-mode` | 排序器模式 | `'single' \| 'multiple'` | `'single'` |
| `plain` | 是否以纯表格形态渲染，不带卡片阴影、背景色和圆角 | `boolean` | `false` |
| `bordered` | 是否显示外边框 | `boolean` | `false` |
| `table-layout` | 原生 `table-layout` 布局方式 | `'auto' \| 'fixed'` | `'auto'` |
| `tree` | 是否显式开启树形数据 | `boolean` | `false` |
| `cascade` | 树形选择是否开启级联 | `boolean` | `true` |
| `children-key` | 树形子节点字段名 | `string` | `'children'` |
| `elevation` | 海拔层级 | `boolean \| number \| string` | `true` |
| `surface` | 弱背景色风格 | `'low'` | `-` |
| `cell-bordered` | 是否显示单元格分割线 | `boolean` | `false` |
| `size` | 表格尺寸 | `'small' \| 'normal' \| 'large'` | `'normal'` |

**Columns 配置**

列配置以 `columns` 数组传入，每一项的字段名与常见表格库不同：列标识是 `key`（不是 `prop`），排序开关是 `sorter`（不是 `sortable`），自定义渲染是 `render` 与 `renderExpand`（不是 `formatter`）。

| 列名 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `type` | 列类型。支持 `selection` 和 `expand` | `'selection' \| 'expand'` | `-` |
| `key` | 列唯一 key | `string` | `-` |
| `title` | 列标题，支持渲染函数。对 `selection` 和 `expand` 列无效 | `VNodeChild \| () => VNodeChild` | `-` |
| `children` | 子列配置，用于渲染分组表头 | `DataTableColumn[]` | `-` |
| `sorter` | 字段列是否显示排序交互 | `boolean` | `false` |
| `multiple` | 选择列是否允许多选，仅对选择列生效 | `boolean` | `true` |
| `selectable` | 是否允许选择。支持 `boolean` 或 `(context) => boolean`，仅对选择列生效 | `boolean \| (context) => boolean` | `true` |
| `expandable` | 是否允许用户通过内置展开按钮展开该行，仅对展开列生效；受控的 `expanded-row-keys` 优先级更高 | `(context) => boolean` | `-` |
| `renderExpand` | 自定义展开内容，仅对展开列生效 | `(context) => VNodeChild` | `-` |
| `resizable` | 是否允许通过拖拽调整列宽 | `boolean` | `false` |
| `fixed` | 固定列位置，必须配合 `width` 使用 | `'left' \| 'right'` | `-` |
| `width` | 列宽 | `number \| string` | `-` |
| `minWidth` | 列最小宽度 | `number \| string` | `-` |
| `maxWidth` | 列最大宽度。开启 `resizable` 时也会作为拖拽的上限 | `number \| string` | `-` |
| `align` | 内容对齐方式 | `'left' \| 'center' \| 'right'` | `'left'` |
| `titleAlign` | 表头标题对齐方式 | `'left' \| 'center' \| 'right'` | `align` |
| `titleColSpan` | 表头列合并数量，设为 `0` 时当前表头不渲染 | `number` | `1` |
| `colSpan` | 表体单元格列合并数量，支持数字或函数，返回 `0` 时当前单元格不渲染 | `number \| (context) => number` | `1` |
| `rowSpan` | 表体单元格行合并数量，支持数字或函数，返回 `0` 时当前单元格不渲染 | `number \| (context) => number` | `1` |
| `cellProps` | 自定义单元格属性，支持对象或函数 | `object \| (context) => object` | `-` |
| `render` | 自定义单元格渲染 | `(context) => VNodeChild` | `-` |

**Pagination 配置**

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `simple` | 是否使用简洁分页 | `boolean` | `false` |
| `elevation` | 分页项的海拔高度；表格开启 `plain` 时默认为 `1` | `boolean \| number \| string` | `true` |
| `disabled` | 是否禁用分页 | `boolean` | `false` |
| `showSizeChanger` | 是否显示每页条数切换器 | `boolean` | `false` |
| `showQuickJumper` | 是否显示快速跳转 | `boolean` | `false` |
| `maxPagerCount` | 最多显示的页码数量 | `number` | `5` |
| `sizeOption` | 每页条数选项 | `number[]` | `[10, 20, 50, 100]` |
| `showTotal` | 总数文案渲染函数 | `(total: number, range: [number, number]) => string` | `-` |

**Summary 配置**

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `value` | 单元格内容 | `VNodeChild` | `-` |
| `colSpan` | 单元格列合并数量 | `number` | `1` |
| `rowSpan` | 单元格行合并数量 | `number` | `1` |

**Sorter 配置**

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `key` | 对应列 key | `string` | `-` |
| `order` | 排序方向 | `'asc' \| 'desc'` | `-` |

**Events**

无。分页、选中、展开与排序状态均通过 `v-model:page`、`v-model:page-size`、`v-model:checked-row-keys`、`v-model:expanded-row-keys`、`v-model:expanded-tree-row-keys`、`v-model:sorters` 双向绑定同步。

**Slots**

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `empty` | 自定义空态内容 | 无 |
| `loading-description` | 自定义加载描述 | 无 |
| `footer-prefix` | 分页前置内容 | 无 |

**注意**

- `data` 的语义随 `remote` 变化：前端分页（默认）传全量数据，远程分页传当前页数据并结合 `total` 使用。
- 固定列必须配合明确的 `width`；分组表头的 `titleColSpan` 仅对叶子列生效，分组列的跨度由其 `children` 推导。
- 选择、详情展开和树形展开都依赖稳定唯一的行 key，默认取 `id`，数据中没有 `id` 时必须显式配置 `row-key`。
