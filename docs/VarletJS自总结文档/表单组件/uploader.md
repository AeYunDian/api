# Uploader 文件上传

> 分类：表单组件 ｜ 组件标签：`<var-uploader>` ｜ 官方文档：https://varletjs.org/#/zh-CN/uploader ｜ [返回索引](../组件索引.md)

**用途**：提供文件读取与图片/视频预览能力，通过 `after-read` 事件拿到文件后自行上传到服务器，常用于头像、凭证、多图评价等上传场景。

**基础用法**：

```vue
<script setup>
import { ref } from 'vue'

const files = ref([])

function handleAfterRead(file) {
  console.log(file)
  // 在此处上传到服务器，并回写 file.url 与 file.state
}
</script>

<template>
  <var-uploader v-model="files" @after-read="handleAfterRead" />
</template>
```

**Props**：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `v-model` | 文件列表 | `VarFile[]` | `[]` |
| `accept` | 接受的文件类型，与原生属性一致 | `string` | `image/*` |
| `capture` | 获取文件方式，与原生属性一致 | `string` | `-` |
| `multiple` | 是否多选文件 | `boolean` | `false` |
| `readonly` | 是否只读 | `boolean` | `false` |
| `disabled` | 是否禁用 | `boolean` | `false` |
| `variant` | 外观类型，可选值为 `standard` `outlined` `filled`（3.20.3） | `string` | `standard` |
| `elevation` | 海拔高度，可选值为 `true` `false` 和 `0-24` 的等级，仅在 `standard` 外观下生效 | `string \| number \| boolean` | `true` |
| `removable` | 是否可以删除 | `boolean` | `true` |
| `maxlength` | 最大文件个数 | `string \| number` | `-` |
| `maxsize` | 最大文件大小，单位为 `byte` | `string \| number` | `-` |
| `previewed` | 是否允许预览 | `boolean` | `true` |
| `prevent-default-preview` | 阻止默认预览行为 | `boolean` | `false` |
| `ripple` | 是否开启水波纹 | `boolean` | `true` |
| `hide-list` | 是否隐藏文件列表 | `boolean` | `false` |
| `resolve-type` | 文件预处理类型，可选值为 `default` `file` `data-url`（`default`，图片文件包含 dataURL 编码和 File 对象，其他类型仅包含 File 对象。`file`，仅包含 File 对象。`data-url`，所有文件类型都包含 dataURL 编码和 File 对象） | `string` | `default` |
| `validate-trigger` | 触发验证的时机，可选值为 `onChange` `onRemove` | `UploaderValidateTrigger[]` | `['onChange', 'onRemove']` |
| `rules` | 验证规则，返回 `true` 表示验证通过，其它类型的值将转换为文本作为用户提示。自 `3.5.0` 开始支持 Zod 验证 | `((v: VarFile[]) => any) \| ZodType \| Array<((v: VarFile[]) => any) \| ZodType>` | `-` |

**Events**：

| 事件 | 说明 | 回调参数 |
| --- | --- | --- |
| `before-filter` | `before-read` 前触发，对文件列表进行过滤 | `files: VarFile[]` |
| `before-read` | 文件读取前触发，返回假值阻止文件读取（支持 promise） | `file: VarFile` |
| `after-read` | 文件读取后触发 | `file: VarFile` |
| `oversize` | 文件超过限制大小时触发 | `file: VarFile` |
| `before-remove` | 文件删除前触发，返回假值阻止文件删除（支持 promise） | `file: VarFile` |
| `remove` | 文件删除时触发 | `file: VarFile` |
| `preview` | 文件预览时触发 | `file: VarFile` |
| `click-action` | 拦截上传按钮的点击行为 | `chooseFile: () => void`、`event: Event` |

**Slots**：

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `default` | 上传按钮内容 | 无 |
| `extra-message` | 附加信息 | 无 |
| `remove-button` | 删除按钮（3.8.0） | `remove: () => void` |

**Methods**：

| 方法 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| `chooseFile` | 触发选择文件动作，显示文件列表 | 无 | 无 |
| `closePreview` | 关闭预览文件弹出层 | 无 | 无 |
| `getLoading` | 获取 `state` 等于 `loading` 的文件集合 | 无 | `VarFile[]` |
| `getSuccess` | 获取 `state` 等于 `success` 的文件集合 | 无 | `VarFile[]` |
| `getError` | 获取 `state` 等于 `error` 的文件集合 | 无 | `VarFile[]` |
| `validate` | 触发校验 | 无 | `valid: Promise<boolean>` |
| `resetValidation` | 清空校验信息 | 无 | 无 |
| `reset` | 清空绑定的值（设置为 `[]`）和校验信息 | 无 | 无 |

**注意**：

- 组件只负责读取与预览，不会自动上传；需在 `after-read` 中请求服务器，再把 `file.url`、`file.state`、`file.progress` 回写到绑定的文件对象上。
- `accept` 默认 `image/*`，需要其它类型时显式设置；`maxsize` 单位为 `byte`，超限只会触发 `oversize` 并阻止读取。
- `before-filter`、`before-read`、`before-remove` 返回假值（或 resolve 假值）即可阻止默认行为；监听 `click-action` 后浏览器选择文件不会自动弹出，必须在回调里手动调用 `chooseFile()`。

## VarFile 上传文件对象

**用途**：`v-model` 绑定的文件项结构，描述一个已读取文件的原始对象、预览地址与上传状态，配合 `state`、`progress` 可驱动加载骨架、进度条与失败标识。

**基础用法**：

```vue
<script setup>
import { ref } from 'vue'

const files = ref([
  {
    url: 'https://varletjs.org/cat.jpg',
    cover: 'https://varletjs.org/cat.jpg',
    state: 'success',
    progress: 100,
  },
])
</script>

<template>
  <var-uploader v-model="files" />
</template>
```

**Props**：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `file` | 原生文件 | `File` | `-` |
| `name` | 文件名 | `string` | `-` |
| `url` | 文件地址 | `string` | `-` |
| `cover` | 封面图 | `string` | `-` |
| `fit` | 封面图填充模式，可选值为 `fill` `contain` `cover` `none` `scale-down` | `string` | `-` |
| `state` | 文件上传状态，可选值为 `loading` `success` `error` | `string` | `-` |
| `progress` | 文件上传进度，范围 [0, 100] | `number` | `-` |

**Events**：

| 事件 | 说明 | 回调参数 |
| --- | --- | --- |
| 无 | 无 | 无 |

**Slots**：

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| 无 | 无 | 无 |

**Methods**：

| 方法 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| 无 | 无 | 无 | 无 |

**注意**：

- 只给 `url` 时会用 `url` 作为封面；视频类文件建议同时提供 `cover` 作为占位图。
- 组件通过 `url` 后缀判断预览类型（图片/视频），后缀缺失的文件不会走默认预览。

## VarFileUtils 文件状态工具

**用途**：`rules` 校验器的第二个参数即为该工具集合，用于在校验时快速按上传状态筛选文件。

**基础用法**：

```vue
<script setup>
import { ref } from 'vue'

const files = ref([])
</script>

<template>
  <var-uploader
    :rules="(v, u) => u.getError().length === 0 || '存在上传失败的文件'"
    v-model="files"
  />
</template>
```

**Props**：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| 无 | 无 | 无 | 无 |

**Events**：

| 事件 | 说明 | 回调参数 |
| --- | --- | --- |
| 无 | 无 | 无 |

**Slots**：

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| 无 | 无 | 无 |

**Methods**：

| 方法 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| `getLoading` | 获取 `state` 等于 `loading` 的文件集合 | 无 | `VarFile[]` |
| `getSuccess` | 获取 `state` 等于 `success` 的文件集合 | 无 | `VarFile[]` |
| `getError` | 获取 `state` 等于 `error` 的文件集合 | 无 | `VarFile[]` |

**注意**：

- 工具集合只作为 `rules` 校验器的第二个参数传入，不是组件实例上的方法；组件实例上另有同名方法可单独调用。
