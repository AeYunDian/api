# Card 卡片

> 分类：展示组件 ｜ 组件标签：`<var-card>` ｜ 官方文档：https://varletjs.org/#/zh-CN/card ｜ [返回索引](../组件索引.md)

**用途**：用于展示与单个主题相关的内容和操作，常见于信息流列表、图文摘要、可点击的产品或文章条目。

**基础用法**：

```vue
<template>
  <var-card
    title="本草纲目"
    subtitle="我表情悠哉 跳个大概"
    description="如果华佗再世,崇洋都被医治,外邦来学汉字,激发我民族意识。马钱子、决明子、苍耳子，还有莲子；黄药子、苦豆子、川楝子，我要面子。用我的方式，改写一部历史。没什么别的事，跟着我念几个字。山药当归枸杞 GO，山药 当归 枸杞 GO，看我抓一把中药，服下一帖骄傲~"
    src="https://varletjs.org/cat.jpg"
  >
    <template #extra>
      <var-space>
        <var-button type="primary">操作 1</var-button>
        <var-button type="primary">操作 2</var-button>
      </var-space>
    </template>
  </var-card>
</template>
```

**Props**：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `variant` | 卡片外观，可选值 `standard` `outlined` `filled` | _string_ | `standard` |
| `title` | 卡片标题 | _string_ | `-` |
| `subtitle` | 卡片副标题 | _string_ | `-` |
| `description` | 卡片描述 | _string_ | `-` |
| `elevation` | 海拔高度，可选值为 `true`、`false` 和 `0-24` 的等级 | _string \| number \| boolean_ | `true` |
| `src` | 图片地址 | _string_ | `-` |
| `layout` | 排列方式，可选值为 `row` `column` | _string_ | `column` |
| `fit` | 填充模式，可选值为 `fill` `contain` `cover` `none` `scale-down` | _string_ | `cover` |
| `alt` | 替代文本，和 img 标签原生属性一致 | _string_ | `-` |
| `image-height` | 图片高度 | _string \| number_ | `-` |
| `image-width` | 图片宽度 | _string \| number_ | `-` |
| `ripple` | 是否开启水波，支持对象形式 `{ disabled?: boolean, color?: string }` | _boolean \| object_ | `false` |
| `v-model:floating` | 是否开启全屏 | _boolean_ | `false` |
| `floating-duration` | 开关全屏所需时间（ms） | _number_ | `250` |
| `hoverable` | 是否开启鼠标悬停效果，支持对象形式 `{ disabled?: boolean, color?: string }` | _boolean \| object_ | `false` |
| `surface` | 背景色预设，可选值 `low`，在 `variant` 为 `filled` 时无效，目前只作用在 MD3 暗色主题 | _string_ | `-` |

**Events**：

| 事件 | 说明 | 回调参数 |
| --- | --- | --- |
| `click` | 点击卡片时触发 | `event: Event` |

**Slots**：

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `image` | 自定义图片 | 无 |
| `default` | 自定义内容 | 无 |
| `title` | 自定义标题 | `slotClass: string` 标题样式 |
| `subtitle` | 自定义副标题 | `slotClass: string` 副标题样式 |
| `description` | 自定义描述 | `slotClass: string` 描述样式 |
| `floating-content` | 漂浮时显示的正文内容 | 无 |
| `extra` | 自定义底部内容 | 无 |
| `close-button` | 自定义关闭按钮 | 无 |

**注意**：

- 通过 `v-model:floating` 开启全屏，全屏时的正文内容由 `floating-content` 插槽提供，动画时长可用 `floating-duration` 调整。
- `ripple` 与 `hoverable` 都支持对象形式，可传 `{ disabled, color }` 自定义水波与悬停颜色。
- `surface="low"` 仅在 `variant` 不为 `filled` 且处于 MD3 暗色主题时生效。
