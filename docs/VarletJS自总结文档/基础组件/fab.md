# Fab 悬浮动作按钮

> 分类：基础组件 ｜ 组件标签：`<var-fab>` ｜ 官方文档：https://varletjs.org/#/zh-CN/fab ｜ [返回索引](../组件索引.md)

**用途**：固定在页面某个角落的悬浮按钮，按下后展开一组次要操作，用于移动端高频入口。支持主题色、弹出方向、拖拽与自定义触发器。

**基础用法**：用 `v-model:active` 控制展开状态，默认插槽中的按钮即为展开后的动作菜单。

```vue
<script setup>
import { ref } from 'vue'

const active = ref(false)
const trigger = ref('click')
</script>

<template>
  <var-fab v-model:active="active" type="primary" :trigger="trigger">
    <var-button type="info" icon-container>
      <var-icon name="account-circle" />
    </var-button>
    <var-button type="danger" icon-container>
      <var-icon name="delete" />
    </var-button>
  </var-fab>
</template>
```

**Props**

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `v-model:active` | 是否激活动作菜单 | _boolean_ | `false` |
| `show` | 是否显示触发器 | _boolean_ | `true` |
| `drag` | Drag 组件配置，用于深度定制（支持 `direction` `attraction` `boundary`） | _boolean \| DragProps_ | `false` |
| `type` | 类型，可选值为 `default` `primary` `info` `success` `warning` `danger` | _string_ | `primary` |
| `position` | 触发器位置，可选值为 `left-top` `right-top` `left-bottom` `right-bottom` | _string_ | `right-bottom` |
| `direction` | 动作菜单弹出方向，可选值为 `top` `bottom` `left` `right` | _string_ | `top` |
| `trigger` | 触发方式 `click` `hover` | _string_ | `click` |
| `disabled` | 是否禁用 | _boolean_ | `false` |
| `color` | 触发器颜色 | _string_ | `-` |
| `inactive-icon` | 未激活时触发器图标 | _string_ | `plus` |
| `active-icon` | 激活时触发器图标 | _string_ | `window-close` |
| `inactive-icon-size` | 未激活时触发器图标尺寸 | _string \| number_ | `-` |
| `active-icon-size` | 激活时触发器图标尺寸 | _string \| number_ | `-` |
| `inactive-icon-namespace` | 未激活时触发器图标的命名空间 | _string_ | `var-icon` |
| `active-icon-namespace` | 激活时触发器图标的命名空间 | _string_ | `var-icon` |
| `fixed` | 是否使用固定定位，设置为 `false` 可开启绝对定位（绝对定位无法使用拖拽） | _boolean_ | `true` |
| `z-index` | 同 css z-index，用于自定义触发器层级 | _string \| number_ | `90` |
| `top` | 同 css top，用于自定义触发器位置 | _string \| number_ | `-` |
| `bottom` | 同 css bottom，用于自定义触发器位置 | _string \| number_ | `-` |
| `left` | 同 css left，用于自定义触发器位置 | _string \| number_ | `-` |
| `right` | 同 css right，用于自定义触发器位置 | _string \| number_ | `-` |
| `safe-area` | 是否开启底部安全区适配 | _boolean_ | `false` |
| `teleport` | 组件挂载的元素 | _TeleportProps['to'] \| false_ | `body` |
| `elevation` | 海拔高度，可选值为 `true`、`false` 和 `0-24` 的等级 | _string \| number \| boolean_ | `true` |

**Events**

| 事件 | 说明 | 回调参数 |
| --- | --- | --- |
| `click` | 点击触发器时触发，在 `disabled` 状态为 `true` 时不触发 | `active: boolean, event: Event` |
| `open` | 在激活并打开动作菜单时触发 | 无 |
| `opened` | 在激活并打开动作菜单的动画结束时触发 | 无 |
| `close` | 在失活并关闭动作菜单时触发 | 无 |
| `closed` | 在失活并关闭动作菜单的动画结束时触发 | 无 |

**Slots**

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `default` | 动作菜单 | 无 |
| `trigger` | 触发器 | `{ active: boolean }` |

**注意**

- `v-model:active` 可双向绑定展开状态，外部按钮也能控制菜单展开与收起。
- 设置 `fixed="false"` 改为绝对定位后拖拽失效，`drag` 仅在固定定位下可用。
- 组件默认通过 `teleport` 挂载到 `body`，自定义 `trigger` 插槽时需自行处理触发器尺寸与圆角样式。

