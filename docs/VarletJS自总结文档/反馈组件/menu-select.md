# MenuSelect 菜单选择器

> 分类：反馈组件 ｜ 组件标签：`<var-menu-select>` ｜ 官方文档：https://varletjs.org/#/zh-CN/menu-select ｜ [返回索引](../组件索引.md)

**用途**：具有选择器功能的菜单，点击触发元素弹出选项列表并完成取值，部分使用方式与 Menu 菜单组件一致，适合在移动端做轻量的单选、多选与级联选择。

**基础用法**：

```vue
<script setup>
import { ref } from 'vue'

const value = ref()
</script>

<template>
  <var-menu-select v-model="value">
    <var-button type="primary">{{ value ? value : '请选择' }}</var-button>

    <template #options>
      <var-menu-option label="吃饭" />
      <var-menu-option label="睡觉" />
      <var-menu-option label="打游戏" />
    </template>
  </var-menu-select>
</template>
```

**Props / Options**：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `v-model` | 绑定的值 | _any \| any[]_ | `-` |
| `v-model:show` | 是否显示菜单 | _boolean_ | `false` |
| `size` | 菜单尺寸，可选值 `normal` `mini` `small` `large` | _string_ | `normal` |
| `multiple` | 是否多选 | _boolean_ | `false` |
| `scrollable` | 是否可滚动 | _boolean_ | `false` |
| `close-on-select` | 选中时是否关闭菜单（多选模式下选中选项始终不关闭菜单） | _boolean_ | `true` |
| `placement` | 菜单弹出位置 | _Placement_ | `cover-top-start` |
| `strategy` | 菜单定位方式，可选值为 `absolute` `fixed` | _string_ | `absolute` |
| `offset-x` | x 轴偏移量，相对于菜单对齐后的位置 | _number \| string_ | `0` |
| `offset-y` | y 轴偏移量，相对于菜单对齐后的位置 | _number \| string_ | `0` |
| `teleport` | 菜单挂载的位置 | _TeleportProps['to'] \| false_ | `body` |
| `disabled` | 是否禁用菜单 | _boolean_ | `false` |
| `trigger` | 菜单触发方式，可选值为 `click` `hover` `manual` | _string_ | `click` |
| `reference` | 菜单关联的触发元素，`string` 类型为菜单组件的子孙元素选择器，`HTMLElement` 类型为任意指定的元素节点 | _string \| HTMLElement_ | `-` |
| `elevation` | 海拔高度，可选值为 `true` `false` 和 `0-24` 的等级 | _string \| number \| boolean_ | `true` |
| `same-width` | 是否与触发元素同宽 | _boolean_ | `false` |
| `popover-class` | 弹出层的 class | _string_ | `-` |
| `close-on-click-reference` | 是否在点击菜单触发元素后关闭菜单 | _boolean_ | `false` |
| `options` ***3.3.7*** | 指定可选项 | _MenuSelectOption[]_ | `[]` |
| `label-key` ***3.3.7*** | 作为 label 唯一标识的键名 | _string_ | `label` |
| `value-key` ***3.3.7*** | 作为 value 唯一标识的键名 | _string_ | `value` |
| `children-key` ***3.8.0*** | 作为 children 唯一标识的键名 | _string_ | `children` |

MenuSelectOption：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `label` | 选项的标签 | _string \| VNode \| (option: MenuSelectOption, selected: boolean) => VNodeChild_ | `-` |
| `value` | 选项的值 | _any_ | `-` |
| `children` ***3.8.0*** | 选项的子选项 | _MenuSelectOption[]_ | `-` |
| `disabled` | 是否禁用 | _boolean_ | `-` |
| `ripple` | 是否启用水波效果 | _boolean_ | `true` |

MenuOption Props：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `label` | 选项显示的文本 | _any_ | `-` |
| `value` | 选项绑定的值 | _any_ | `-` |
| `disabled` | 是否禁用 | _boolean_ | `false` |
| `ripple` ***3.3.0*** | 是否启用水波效果 | _boolean_ | `true` |

**Events**：

| 事件 | 说明 | 回调参数 |
| --- | --- | --- |
| `open` | 打开菜单时触发 | `-` |
| `opened` | 打开菜单动画结束时触发 | `-` |
| `close` | 关闭菜单时触发 | `-` |
| `closed` | 关闭菜单动画结束时触发 | `-` |
| `click-outside` | 点击菜单外部时触发 | `event: Event` |
| `select` ***3.8.0*** | 选择某个选项时触发 | `value: any, option: MenuSelectOption` |

**Slots**：

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `default` | 菜单关联的触发元素 | `-` |
| `options` | 菜单选项内容 | `-` |

MenuOption Slots：

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `default` | 选项显示的内容 | `-` |

**Methods**：

| 方法 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| `open` | 打开 MenuSelect | `-` | `-` |
| `close` | 关闭 MenuSelect | `-` | `-` |
| `resize` | MenuSelect 默认插槽元素产生位置大小变化时可以调用此方法进行重绘 | `-` | `-` |
| `setReference` ***3.7.2*** | 设置 MenuSelect 关联的触发元素 | `reference: 与组件属性的 reference 一致` | `-` |

**注意**：

- `placement` 的可选值在基础方位（`top` `top-start` `top-end` `bottom` `bottom-start` `bottom-end` `right` `right-start` `right-end` `left` `left-start` `left-end`）之外，还支持覆盖触发器的 `cover-top` `cover-top-start` `cover-top-end` `cover-bottom` `cover-bottom-start` `cover-bottom-end` `cover-left` `cover-right`。
- 多选模式下选中选项不会关闭菜单，此时 `close-on-select` 不生效。
- 大量选项时开启 `scrollable` 让菜单局部滚动，避免菜单高度撑出屏幕。

