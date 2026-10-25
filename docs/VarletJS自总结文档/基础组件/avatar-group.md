# AvatarGroup 头像分组

> 分类：基础组件 ｜ 组件标签：`<var-avatar-group>` ｜ 官方文档：https://varletjs.org/#/zh-CN/avatar ｜ [返回索引](../组件索引.md)

**用途**：将多个 `var-avatar` 组合排列，形成头像组，常用于展示群组成员或点赞者。

**基础用法**：

```vue
<template>
  <var-avatar-group>
    <var-avatar src="https://varletjs.org/cat.jpg" bordered />
    <var-avatar src="https://varletjs.org/cat2.jpg" bordered />
    <var-avatar src="https://varletjs.org/cat3.jpg" bordered />
    <var-avatar bordered>+2</var-avatar>
  </var-avatar-group>
</template>
```

**Props**：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `offset` | 组内头像的头像偏移量 | _number \| string_ | `-` |
| `vertical` | 组内头像是否垂直排列 | _boolean_ | `false` |

**Events**：

无

**Slots**：

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `default` | 头像组内容 | 无 |

