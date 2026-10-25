# Elevation 海拔效果

> 分类：基础组件 ｜ 样式类：`var-elevation--0` ~ `var-elevation--24`（纯 CSS 工具类，无组件标签） ｜ 官方文档：https://varletjs.org/#/zh-CN/styles ｜ [返回索引](../组件索引.md)

**用途**：组件库提供的基于 `Material` 规范的阴影海拔工具类，用来表现元素的立体感与层级高低；适合直接给自定义容器（卡片、弹层、图片底衬）套用统一的阴影。

**引入方式**：

```js
import '@varlet/ui/es/styles/elevation.css'
```

**类名规则**：

阴影程度划分为 `0-24` 共 25 个等级，等级越高海拔越高、阴影越大。完整类名如下：

| 类名 | 海拔等级 | 说明 |
| --- | --- | --- |
| `var-elevation--0` | 0 | 无阴影，完全贴合背景 |
| `var-elevation--1` | 1 | 极轻微阴影 |
| `var-elevation--2` | 2 | 轻微阴影，适合常规卡片 |
| `var-elevation--3` | 3 | 轻度阴影 |
| `var-elevation--4` | 4 | 轻度阴影，适合悬浮卡片 |
| `var-elevation--5` | 5 | 中等偏轻阴影 |
| `var-elevation--6` | 6 | 中等阴影，适合下拉面板 |
| `var-elevation--7` | 7 | 中等阴影 |
| `var-elevation--8` | 8 | 中等阴影，适合浮层 |
| `var-elevation--9` | 9 | 中等偏重阴影 |
| `var-elevation--10` | 10 | 中等偏重阴影 |
| `var-elevation--11` | 11 | 偏重阴影 |
| `var-elevation--12` | 12 | 偏重阴影，适合弹窗 |
| `var-elevation--13` | 13 | 重阴影 |
| `var-elevation--14` | 14 | 重阴影 |
| `var-elevation--15` | 15 | 重阴影，适合模态层 |
| `var-elevation--16` | 16 | 很重阴影 |
| `var-elevation--17` | 17 | 很重阴影 |
| `var-elevation--18` | 18 | 很重阴影 |
| `var-elevation--19` | 19 | 极重阴影 |
| `var-elevation--20` | 20 | 极重阴影 |
| `var-elevation--21` | 21 | 极重阴影 |
| `var-elevation--22` | 22 | 近乎最大阴影 |
| `var-elevation--23` | 23 | 近乎最大阴影 |
| `var-elevation--24` | 24 | 最大阴影等级 |

**用法示例**：

直接用 `class` 或动态 `:class` 绑定 `var-elevation--{等级}` 即可，等级为 `0-24` 的整数：

```vue
<template>
  <var-space :size="[16, 16]" justify="space-between">
    <div v-for="e in 25" :key="e" :class="`var-elevation--${e - 1}`" class="elevation-item">
      {{ e - 1 }}
    </div>
  </var-space>
</template>

<style>
.elevation-item {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100px;
  height: 100px;
  border-radius: 4px;
}
</style>
```

**注意**：

- 这是一组纯 CSS 类而非组件标签，必须引入 `@varlet/ui/es/styles/elevation.css` 才会生效。
- 等级越高阴影扩散越大，移动端界面通常控制在 `1-8`，仅弹窗、模态层等才使用更高等级。
- `Paper` 组件的 `elevation` 属性复用了同一套等级规则，需要统一阴影语言时可与工具类混用。

