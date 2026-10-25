# Lazy 懒加载指令

> 分类：功能指令 ｜ 指令：`v-lazy` ｜ 官方文档：https://varletjs.org/#/zh-CN/lazy ｜ [返回索引](../组件索引.md)

**用途**：图片或背景图进入可视区域后才真正发起加载，减少首屏请求与流量消耗。常用于长列表、瀑布流、商品图墙等含大量图片的页面。

**引入与注册**：

```js
// 全局注册：注册后可在任意模板中使用 v-lazy，并可传入插件默认选项
import { createApp } from 'vue'
import { Lazy } from '@varlet/ui'

createApp().use(Lazy, {
  loading: 'https://xxx.cn/loading.png',
  error: 'https://xxx.cn/error.png',
  attempt: 3,
  throttleWait: 300,
})
```

```js
// 按需注册：在 <script setup> 中以 v 开头的变量名即为局部指令
import { Lazy } from '@varlet/ui'

const vLazy = Lazy
```

**基础用法**：

```vue
<template>
  <img class="lazy-cat" v-lazy="'https://varletjs.org/cat.jpg'">
</template>

<style>
.lazy-cat {
  width: 100%;
  height: 200px;
  object-fit: cover;
  pointer-events: none;
}
</style>
```

**指令值 / 修饰符**：

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| 指令值 | 待加载的图片地址 | _string_ | `-` |
| `background-image`（修饰符） | 以背景图方式加载，写作 `v-lazy:background-image="url"` | _string_ | `-` |
| `lazy-loading`（内联属性） | 加载中的占位图，应尽量选择加载速度很快的图片，覆盖插件选项 | _string_ | 1 像素透明图片 |
| `lazy-error`（内联属性） | 加载失败时显示的图片，覆盖插件选项 | _string_ | 1 像素透明图片 |
| `lazy-attempt`（内联属性） | 加载失败时尝试重新加载的次数，覆盖插件选项 | _number_ | `3` |

插件注册时可传入的默认选项：

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `loading` | 加载中的图片，尽可能选择加载速度很快的图片 | _string_ | 1 像素透明图片 |
| `error` | 加载失败显示的图片 | _string_ | 1 像素透明图片 |
| `attempt` | 加载失败时尝试重新加载的次数 | _number_ | `3` |
| `throttleWait` | 节流时间，数值越大事件触发频率越低 | _number_ | `300` |
| `events` | 触发可见性检测注册的事件列表 | _string[]_ | `['scroll', 'wheel', 'mousewheel', 'resize', 'animationend', 'transitionend', 'touchmove']` |
| `filter` | 属性拦截函数，可访问 lazy 上下文的所有属性（如把 `http://` 批量替换为 `https://`） | _(lazy: Lazy) => void_ | `() => void` |

**注意**：

1. 内联属性的优先级高于插件选项，同一页面可用内联属性为个别图片单独指定占位图与重试次数。
2. `attempt` 指加载失败后的重试次数，重试仍失败才会显示 `error` 图片，加载成功的地址会进入缓存，重复使用不再请求。
3. 需要滚动容器内的图片也能被检测时，确认容器的滚动行为会触发 `events` 中的事件；若使用自定义滚动容器（如 `var-scroll`），指令会自动收集父级滚动容器作为监听目标。
