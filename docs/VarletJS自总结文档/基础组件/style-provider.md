# StyleProvider 样式定制

> 分类：基础组件 ｜ 组件标签：`<var-style-provider>` ｜ 官方文档：https://varletjs.org/#/zh-CN/style-provider ｜ [返回索引](../组件索引.md)

**用途**：用于在局部挂载 CSS 样式变量，实现组件主题的局部定制，无需修改全局 `:root`。适合单个区块、单个页面需要独立配色的场景。

**基础用法**：组件式调用，通过 `style-vars` 传入 CSS 变量对象，切换对象即可实时改变内部组件的样式。

```vue
<script setup>
import { ref, reactive } from 'vue'

const state = reactive({ score: 5, license: true })
const styleVars = ref(null)
const successTheme = {
  '--rate-primary-color': 'var(--color-success)',
  '--switch-handle-active-background': 'var(--color-success)',
}

function toggleTheme() {
  styleVars.value = styleVars.value ? null : successTheme
}
</script>

<template>
  <var-style-provider :style-vars="styleVars">
    <var-rate v-model="state.score" />
    <var-switch v-model="state.license" />
    <var-button type="primary" block @click="toggleTheme">切换样式变量</var-button>
  </var-style-provider>
</template>
```

**Props**

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `style-vars` | CSS 变量 | _Record<string, string>_ | `{}` |
| `tag` | 自定义标签名 | _string_ | `div` |

**Events**

| 事件 | 说明 | 回调参数 |
| --- | --- | --- |
| 无 | 无 | 无 |

**Slots**

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `default` | 组件内容 | 无 |

**注意**

- 使用 `teleport` 传送到 `StyleProvider` 外的元素（如弹层）将不会应用该作用域内的样式变量。
- `style-vars` 的键名需为完整的 CSS 变量名（含 `--` 前缀），值为合法的 CSS 值或 `var()` 引用。
- 若需全局修改变量，应使用函数式调用直接更新 `:root` 上的样式变量，详见主题定制。

