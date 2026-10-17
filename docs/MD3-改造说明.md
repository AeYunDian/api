# api-vue Material Design 3 改造说明

> 提交：`8db94fe feat(web): 全站接入 Material Design 3（蓝色 Monet 主题）`
> 范围：`api-vue`（Vue 3 + Vite + Varlet）；构建产物同步到 `api-assets`
> 规模：源码 37 个文件，`api-vue/src/shared/assets/md.css` 为新增的 1128 行设计层
> 验证：`npm run build` 通过；**未跑** ESLint / `wrangler deploy --dry-run`（原因见第 9 节）

---

## 1. 背景与目标

改造前的 `api-vue` 是一个多应用单页前端（按域名分流）：

| 应用 | 入口 | 路由 |
| --- | --- | --- |
| console | `src/console/App.vue` | `/console-panel/*` |
| account | `src/account/App.vue` | `/user-panel/*` |
| analytics（mysites） | `src/mysites/App.vue` | `/sites/:id` |
| ai | `src/ai/App.vue` | `/user-panel/*` |
| relay / default | `src/relay/App.vue`、`src/default/App.vue` | 无路由 |

目标有三条：

1. **视觉符合 Google Material Design（MD3 / Material You）**：64dp 顶栏、12dp 卡片、28dp 对话框、
   40dp 按钮、56dp 列表项、8dp chip、MD3 海拔与状态层、Roboto 排版比例。
2. **优先用 Varlet 组件，而不是手写**：对话框、抽屉、下拉、提示、结果页、上传、面包屑、选项卡
   全部换成 Varlet 提供的组件；只写"页面布局 + 业务内容"。
3. **统一交互**：主操作统一用 FAB；登录用 split button；导航用 MD3 navigation drawer。

---

## 2. 设计层：`src/shared/assets/md.css`

新增文件，在 `main.js` 中紧随 `shared/style/base.css` 之后全局引入，是所有应用的视觉底座。

### 2.1 令牌（Design Tokens）

| 类别 | 关键令牌 |
| --- | --- |
| 布局 | `--md-app-bar-height: 64px`、`--md-nav-drawer-width: 260px`、`--md-content-max-width: 1120px`、`--md-fab-inset: 16px` |
| 形状 | `--md-shape-xs 4px` / `sm 8px` / `md 12px` / `lg 16px` / `xl 28px` / `full 999px` |
| 间距 | `--md-space-1 4px` … `--md-space-10 40px`（8dp 网格） |
| 海拔 | `--md-elevation-1` … `--md-elevation-5`（亮色/暗色两套不透明度） |
| 动效 | `--md-ease-standard`、`--md-ease-emphasized`、`--md-duration-short/medium/long` |
| 状态层 | `--md-state-hover: 0.08`、`--md-state-focus: 0.12`、`--md-state-pressed: 0.12` |
| 字体 | `--md-font-family`、`--md-font-mono` |
| 主题结构 | `--md-chrome-bg`、`--md-chrome-fg`、`--md-panel-bg`、`--md-panel-radius: 20px` |

### 2.2 覆盖 Varlet 变量的关键手段：特异性

Varlet 的 MD3 皮肤（`StyleProvider(Themes.md3Light/md3Dark)`）运行时会把**组件级变量再注入一次**：

```html
<style id="varlet-style-vars">:root:root { --button-border-radius: 100px; ... }</style>
```

这段样式插在 `<head>` 末尾、选择器是 `:root:root`（特异性 `0,2,0`），普通 `:root`（`0,1,0`）压不住，
组件 CSS 里各自的 `:root`（`0,1,0`）也压不住。所以 md.css 统一使用：

```css
html:root:root { /* 0,2,1 —— 同时压过主题注入和组件自带 :root */ }
```

这一层做了三件事：

- **对齐规范**：按钮 40dp 高 + 全圆角、卡片 12dp、对话框 28dp、列表项 56dp、chip 8dp；
- **修主题缺陷**：主题把标题色/文字色硬编码成 `#1D1B20` 或 `inverse-surface`，暗色或自定义配色下会失真，
  这里全部改回语义色（`var(--color-text)` / `var(--color-on-surface-variant)`）；
- **补语义**：`--color-text-secondary`（项目里 40+ 处引用但从未定义）、
  `--color-outline-variant`（原代码到处写 `var(--color-outline-variant, rgba(0,0,0,.06))`，暗色下黑色 fallback 会失效）。

### 2.3 应用外壳：chrome + 圆角面板

结构（console / account / analytics / ai 四个内容型应用一致）：

```
body
├─ var-app-bar       background: var(--md-chrome-bg)
└─ main              background: var(--md-chrome-bg)   ← chrome 兜底
   └─ 布局容器 (flex)
      ├─ .md-nav-drawer   background: transparent      ← 透出 chrome，与顶栏连成一片
      └─ 内容面板         background: var(--md-panel-bg)
                          border-radius: 20px 20px 0 0  ← 上方两个圆角
                          overflow-y: auto            ← 唯一滚动容器
```

- 面板**自己是滚动容器**，所以圆角常驻：内容滚到圆角下方会被 `border-radius` 裁住。
  （曾经把面板放在文档流里，圆角会随内容滚走，被指出"圆角滚下去变方了"。）
- 抽屉 `height: 100%`、不参与滚动，不再需要 `position: sticky`。
- analytics / ai 用 `.app-panel` 包裹 `RouterView` 实现同样结构；console / account 由
  `.console-main` / `.user-main` 承担面板角色。

### 2.4 排版与字体

```css
--md-font-family: "Google Sans Mono", "Roboto", "Noto Sans", system-ui,
  -apple-system, "Segoe UI", "Microsoft YaHei", sans-serif;
--md-font-mono: "Google Sans Mono", "Roboto Mono", ui-monospace, …;
```

- `body` 为 body-medium（14/20/0.25px），`h1`–`h6` 分别映射 MD3 的 headline/title 档位；
- `var-chip` 原本写死 `font-family: Roboto`，补了 `html .var-chip { font-family: inherit }`；
- `* , *::before, *::after { box-sizing: border-box }`（见 3.4）。

### 2.5 组件级规则

| 组件 | 处理 |
| --- | --- |
| 顶栏 | `height: var(--md-app-bar-height)`、标题 16px/500、左右内边距 12px、去掉 `elevation` 阴影 |
| 图标按钮 | 40dp 圆形（`min-width/height` + `padding: 8px`）、无海拔、静止透明、hover 8% / active 12% 状态层 |
| FAB | 56dp、16dp 圆角、距边 16dp、触发器改「填充主色」（Varlet 默认是 tonal `primary-container`） |
| 卡片 | 12dp 圆角、`surface-container-low`、level-1 海拔、标题 w500、容器用 padding 而非 margin 留白 |
| 下拉刷新内的卡片 | 无阴影 + `outline: 1px solid; outline-offset: -1px`（原因见 3.5） |
| 对话框 | 宽 `min(420px, 100vw-32px)`、28dp 圆角、标题 22px/上内边距 28px、操作区右对齐 |
| 列表项 | 56dp 高、`12px 16px` 内边距、分割线与内边距对齐（`--cell-border-left/right: 16px`） |
| 选项卡 | `--tabs-background: transparent`、指示器上方 3px 圆角 |
| 多选 chip | `--select-chip-background-color` 从硬编码紫灰改为表面色 |

### 2.6 打印

```css
@media print {
  html, body { height: auto !important; overflow: visible !important; background: #fff !important }
  main, .app-panel, .var-pull-refresh {
    height: auto !important; max-height: none !important;
    overflow: visible !important; border-radius: 0 !important;
  }
  .var-app-bar, .md-nav-drawer, .var-fab, .top-progress, .var-snackbar, .var-dialog__popup { display: none !important }
}
```

原因见 3.6：圆角面板方案让 `main` / `.app-panel` 变成固定高度的滚动容器，打印时浏览器只输出
"可见滚动框"那一屏，内容被裁还带一条滚动条。

### 2.7 账号悬浮卡（第 9 节）

弹出层被 `var-menu` teleport 到 `body`，scoped 样式够不到，因此这部分规则放在全局层：

```css
.md-nav-drawer > .var-menu { display: block; width: 100% }   /* var-menu 是 inline-flex 且 inheritAttrs:false */
html .md-account-popover { padding: 0; border-radius: 12px; background: var(--color-surface-container-low) }
.md-account-card { width: 320px; padding: 16px; user-select: none; … }
html .md-account-card .md-account-copy { min-width: 28px; min-height: 28px; padding: 4px }
```

---

## 3. 踩到的坑：现象 → 根因 → 修法

这一节是本次改造里最有价值的部分，多数问题不是"样式没写对"，而是 **Varlet / 浏览器行为与预期不符**。

### 3.1 `<var-dialog>` 被解析成函数式 API（最严重）

**现象**：页面上出现一堆 `[object Promise]`；对话框只剩标题和按钮、插槽内容不渲染；
同一个弹窗在页面底部多出一个"空壳"。

**根因**：`@varlet/ui` 导出的 `Dialog` 是**函数式 API**：

```js
function Dialog(options) { return new Promise(...) }   // 内部 mountInstance 自己挂一个弹窗
Dialog.Component = VarDialog                           // 真正的组件
```

而 `@varlet/import-resolver` 处理标签 `VarDialog` 的方式是 `name.slice(3)` →
`import { Dialog } from '@varlet/ui'`（因为项目开了 `autoImport: true`）。
于是 `<var-dialog>` 被当成**函数式组件**渲染：每次渲染返回 Promise → Vue 当文本节点插入 DOM；
那个函数顺手挂出一个只认 props、不认插槽的弹窗。原作者那句
"var-dialog 组件调用有 bug，基于 var-dialog 创建原理自己弄一个"其实就是踩到了这里。

**修法**（`vite.config.js`，放在 Varlet 解析器之前）：

```js
const VarletDialogComponentResolver = {
  type: "component",
  resolve: (name) => {
    if (name !== "VarDialog") return;
    return {
      from: "@varlet/ui",
      name: "_DialogComponent",
      sideEffects: ["@varlet/ui/es/dialog/style/index.mjs"],
    };
  },
};
components({ resolvers: [VarletDialogComponentResolver, VarletImportResolver({ autoImport: true })] })
```

`components.d.ts` 从 `['Dialog']` 变成 `['_DialogComponent']` 即证明生效。改完后 `<var-dialog>`
是真正的组件，`v-model:show`、`#title`、`#actions`、`@closed` 全部可用。

> 注意：改的是 `vite.config.js`，必须**重启 dev server**，HMR 不会重载配置。

### 3.2 卡片 `#title` 插槽不包 `.var-card__title`

**现象**：所有卡片的标题"贴着卡片边缘"，看起来像跑到卡片外面。

**根因**：`var-card` 渲染时，只有用 `title` **属性**才包一层 `.var-card__title`；
用 `#title` **插槽**是原样输出，`slotClass` 只是通过插槽参数给你自己套。

**修法**：

```vue
<template #title="{ slotClass }">
  <div :class="slotClass" class="md-card-header">…</div>
</template>
```

### 3.3 `var-cell` 的插槽名

`var-cell` 实际插槽只有 `icon / default / description / extra`。原代码里用的 `#right-icon`
会被**静默丢弃**。所有右侧操作已改为 `#extra`。

### 3.4 抽屉明明有空间却出现滚动条

**根因**：抽屉是 `height: calc(100vh - 64px)` + 上下 padding，但项目里没有全局
`box-sizing: border-box`，实际高度多出 28px → `main` 与抽屉都溢出 → 出现一条几乎满高的滚动条。

**修法**：md.css 里加全局 reset `*, *::before, *::after { box-sizing: border-box }`。

### 3.5 卡片海拔被"切断"

**根因**：每个页面都包在 `var-pull-refresh` 里，而它自带 `overflow: hidden`
（用来把 `translateY(-125%)` 的下拉指示器藏到盒子上方），卡片正好铺满它的宽度，
左右各 2–3px 的阴影被裁平。

**试过但不行**：`overflow: clip + overflow-clip-margin: 12px` —— 阴影能出来，但下拉指示器
下半截会露进页面（被指出"圆形卡片会露出来一点"）。

**最终修法**：回退到组件自带的 `overflow: hidden`；**下拉刷新内的卡片改成 MD3 outlined card**：

```css
html .var-pull-refresh .var-card {
  box-shadow: none;
  outline: 1px solid var(--color-outline);
  outline-offset: -1px;   /* 画在盒子内侧，不依赖外部空间 */
}
```

不在 `pull-refresh` 里的卡片（关于页、首页功能卡）仍然是 level-1 海拔。

### 3.6 打印只能"对着纸滚动"

**根因**：同 2.3，内容装在 `main { height: calc(100vh - 64px); overflow: hidden }` 和
`.app-panel { height: 100%; overflow-y: auto }` 里，打印时只输出可见滚动框那一屏。

**修法**：见 2.6 的 `@media print`，把外壳的高度/溢出还原成自然流，并隐藏外壳 UI。

### 3.7 `var-menu` 丢弃外部 class

**现象**：给 `<var-menu class="home-login">` 写宽度完全没效果，按钮一直是 ~220px。

**根因**：`var-menu` 是 `inheritAttrs: false`，根节点 class 只来自内部 `classes()`，
外部 `class` / `style` 被丢弃（同页原来那句 `style="width: 100%"` 其实也一直是无效的）。

**修法**：宽度挂外层 wrapper：

```vue
<div class="home-login">
  <var-menu trigger="hover" placement="right-start"> … </var-menu>
</div>
```
```css
.home-login { width: min(320px, 100%) }
.home-login .var-menu { width: 100%; display: flex }
```

### 3.8 全局工具类被 scoped 样式压住

两处典型：

- **头像白底**：面板里 `.md-nav-avatar[data-v-x]`（`0,2,0`）压过全局
  `html .var-avatar:has(> img)`（`0,1,2`）→ 图片头像一直是淡紫底。
  修法：头像底色统一收到 md.css（`html .var-avatar:has(> img) { background: #fff }`），
  scoped 只留布局；用户列表再补一条 scoped `.user-avatar:has(> img)`。
- **hero 宽度**：`min(480px, 100%)` 的 100% 取的是 `.home-hero` 的宽度，而
  `.home-page { align-items: center }` 让 hero 按内容收缩（≈220px）→ 按钮永远短。
  修法：`.home-hero { width: 100%; max-width: 640px }`。

### 3.9 主题侧的两个隐藏 bug

- `Themes.md2Light` / `md2Dark` 在 `@varlet/ui@3.20.7` 已**不存在**，只导出
  `md3Light / md3Dark / dark`。`StyleProvider(undefined)` 会移除已注入变量，暗色模式颜色全乱。
  修法（`shared/stores/theme.js`）：
  `md2: { light: null, dark: Themes.dark }` —— 亮色沿用 Varlet 默认变量，暗色用内置 `Themes.dark`。
- 所有颜色都是 `hsla(var(--hsl-x), 1)` 派生的，所以改主题只需覆盖 `--hsl-*` 三元组（见第 4 节）。

---

## 4. 主题：蓝色 Monet（Material You）

不新增 JS 主题对象，只在 md.css 覆盖 HSL 三元组（`html:root:root` / `html.dark:root:root`）：

| 角色 | 亮色 | 暗色 |
| --- | --- | --- |
| `primary` | `206, 100%, 32%`（#0061A4） | `209, 100%, 84%`（#9ECAFF） |
| `primary-container` | `208, 100%, 91%`（#D1E4FF） | `206, 100%, 24%` |
| `on-primary-container` | `207, 100%, 11%` | `208, 100%, 91%` |
| `body`（面板） | `220, 100%, 99%` | `210, 11%, 8%` |
| `surface-container`（chrome） | `215, 30%, 96%` | `212, 9%, 13%` |
| `surface-container-high/highest` | `213, 25%, 93%` / `213, 22%, 91%` | `213, 8%, 17%` / `212, 7%, 21%` |
| `outline` | `220, 9%, 48%` | `216, 7%, 55%` |
| `on-surface-variant` | `215, 8%, 28%` | `216, 12%, 80%` |

语义色一并拉回 Material 基线（Varlet 原值是"橄榄绿/酱紫"，在蓝色主色下会互相打架）：
青蓝 info、绿 success、琥珀 warning、保留红 danger，容器色与 `on-*` 成对覆盖。

旧的紫色硬编码也清了：`base.css` 里 md3 的 `--site-config-*`
（#6750a4 / #e8def8 / #d0bcff / #4a4458 → 蓝色对应值）、`ai/views/NotFound.vue` 的紫色渐变。

---

## 5. 各应用改造清单

### 5.1 外壳（六个 App.vue）

- `<var-app-bar class="md-top-app-bar" color="var(--md-chrome-bg)" text-color="var(--md-chrome-fg)">`，
  去掉 `type="surface"` 与 `border`（chrome 一体后不需要分割线）；
- 窗口按钮抽成 `shared/components/WindowControls.vue`，继承顶栏前景色（原来写死 `#fff`）；
- ai 应用删掉重复实现的最小化/最大化/关闭逻辑，统一走 `WindowControls`。

### 5.2 console

| 文件 | 改造 |
| --- | --- |
| `views/ConsolePanel.vue` | MD3 navigation drawer（56dp pill、激活 `primary-container`）、`var-overlay`→`var-popup` 移动抽屉、面板滚动、悬浮账号卡 |
| `views/console/OAuthClient.vue` | 注册改 **FAB**、`var-dialog` + `var-form` 校验、文档/转移对话框、空态 `var-result` |
| `views/console/Analytics.vue` | 注册站点 FAB、3 个 `var-dialog`、嵌入代码对话框、站点卡片字段行 |
| `views/console/FeedbackCenter.vue` | 状态筛选改 `var-tabs`、提交反馈 FAB、卡片列表 |
| `views/console/FeedbackManager.vue` | 同上 + 回复/转移对话框、状态下拉 |
| `views/console/UsersManager.vue` | 封禁对话框、真实头像/图标兜底、字段行 |
| `views/console/FileManager.vue` | `<input type=file>`→`var-uploader`、`<input type=datetime-local>`→`var-date-input`、手写面包屑→`var-breadcrumbs`、上传 FAB、两个对话框 |
| `views/console/About.vue` | 页头 + 信息行、行距放宽 |
| `views/HomeView.vue` | 去 logo、登录改 split button、功能卡 |
| `composables/useFeedbackList.js` | 删除确认对话框加 danger |

### 5.3 account

| 文件 | 改造 |
| --- | --- |
| `views/UserPanel.vue` | 同 console 抽屉；悬浮账号卡（本应用"个人信息"走路由） |
| `views/account/UserInfo.vue` | 去卡片改为页内直排、`var-dialog` 改邮箱、字段行 |
| `views/account/LinkAccount.vue` | 去卡片、`var-cell` 列表、渠道 logo 白底 |
| `views/account/AccountOverview.vue` | 去卡片、头像白底、退出登录 danger 确认 |
| `views/account/Security.vue` | 两张卡片保留、表单 `variant="outlined"`、危险操作 danger |
| `views/account/Oauth.vue` | 授权列表卡片化、字段行、撤销授权 danger |
| `views/account/About.vue` | 信息行 + 行距 |
| `views/HomeView.vue` | 去 logo、split button |

### 5.4 analytics（mysites）

| 文件 | 改造 |
| --- | --- |
| `App.vue` | `main` 高度从 `100%` 改 `100vh`（原来 body 无确定高度 → 只铺到内容底部，下面露白底，被指出"页面割裂"）；`main` + `.app-panel` 双层面板结构 |
| `views/HomeView.vue` | 整页重写：MD3 页头、站点卡片、空态 `var-result`、未登录 hero |
| `views/NotFound.vue` | 整页重写：96px display 数字 + headline + 按钮 |
| `views/SiteOverview.vue` | 头部：返回/刷新/打印改图标按钮、时间范围改 `var-tabs`、标题挂 MD3 类；末尾追加 MD3 补丁（卡片/指标块/进度条/变化率 chip/空态/加载条）；图表与打印逻辑未动 |

### 5.5 relay / default

`relay` 改为卡片式"服务地址 / 协议"信息页；`default` 的 404 改为 MD3 版式。
这两个应用是 md2 皮肤、无抽屉，因此保持"整屏 chrome"、不套面板。

---

## 6. 关键交互

### 6.1 主操作 = FAB

`var-fab` 在**没有子按钮**时点击直接触发 `@click`（内部 `children.length === 0` 分支），
所以"注册 OAuth 客户端 / 注册站点 / 提交反馈 / 上传文件"都是一个 56dp FAB 一步到位：

```vue
<var-fab type="primary" position="right-bottom" inactive-icon="plus" :elevation="3"
         :disabled="!user" @click="openRegisterDialog" />
```

达到数量上限时不禁用 FAB，而是点击后 `Snackbar.warning` 说明原因（禁用态无法解释原因）。

### 6.2 登录 = split button

```vue
<div class="home-login">
  <var-menu placement="bottom-end" same-width>
    <var-button-group type="primary" size="large" class="home-login__group">
      <var-button class="home-login__main" @click.stop="login">登录 Ay 账号</var-button>
      <var-button class="home-login__chevron" aria-label="更多入口">
        <var-icon name="menu-down" :size="20" />
      </var-button>
    </var-button-group>
    <template #menu><var-cell ripple @click="goAccountCenter">前往账号中心</var-cell></template>
  </var-menu>
</div>
```

主操作（登录）与次级入口（去另一个应用）不再是两个平级的并排按钮。

### 6.3 抽屉头部悬停弹出账号卡

- `var-menu trigger="hover" placement="right-start"` + `popover-class="md-account-popover"`；
- 不加 `offset`：hover 菜单与触发块之间留空隙会导致鼠标移出即关闭；
- 卡片内容与「账号概览」一致：头像、用户名、脱敏邮箱、角色、**UID（带复制按钮）**、个人简介、注册时间，
  底部两个操作（个人信息 / 账号概览 + 退出登录）；
- 触发区与卡片 `user-select: none`（它们是控件，hover 时不应能选中半截文字）。

### 6.4 头像悬停出编辑入口（`v-hover`）

按 Varlet 文档的函数式用法，指令只回报悬停状态，动画自己驱动：

```js
import { Hover } from '@varlet/ui'
const vHover = Hover            // 局部注册
const avatarMaskY = ref('100%')
function handleAvatarHover(hovering) { avatarMaskY.value = hovering ? '0' : '100%' }
```
```vue
<div class="md-account-avatar" v-hover="handleAvatarHover" @click="goUserInfo">
  <var-avatar … />
  <div class="md-account-avatar__mask" :style="{ transform: `translateY(${avatarMaskY})` }">
    <my-icon icon="pencil-outline" size="20px" />
  </div>
</div>
```

- 账号中心：`router.push('/user-panel/user-info')`；
- 控制台没有个人信息路由，跨应用打开 `online(-dev).undz.cn/user-panel/user-info`。

### 6.5 对话框按钮层级

用 Varlet 官方默认值统一，而不是每个调用点手写：

```js
// main.js
Dialog.setDefaultOptions({
  cancelButtonText: '取消',
  cancelButtonProps: { text: true },      // 取消 = 低强调
  confirmButtonProps: { text: false },    // 确认 = 高强调（filled）
});
```

危险操作在调用处补 `confirmButtonProps: { text: false, type: 'danger' }`
（删除客户端/站点/文件/目录/反馈、退出登录、退出应用、撤销授权、全部设备登出、解绑）。

组件式对话框（`<var-dialog>`）用 `#actions="{ slotClass }"` 自定义按钮，
并给适合的标题配图标（注册、转移、文档、上传、编辑、回复、封禁、改邮箱、嵌入代码）。

---

## 7. 变更文件清单

```
api-vue/vite.config.js                            # VarDialog → _DialogComponent 解析器
api-vue/components.d.ts                           # 自动生成：VarDialog/_DialogComponent、VarFab、VarTabs…
api-vue/src/main.js                               # 引入 md.css、Dialog 默认按钮层级
api-vue/src/shared/assets/md.css                  # 新增：MD3 设计层（1128 行）
api-vue/src/shared/assets/base.css                # 精简重复声明、main 高度走令牌、site-config 蓝色化
api-vue/src/shared/stores/theme.js                # md2 主题映射修复
api-vue/src/shared/components/WindowControls.vue  # 图标按钮继承顶栏色
api-vue/src/shared/composables/useHostShell.js    # 退出确认改 danger
api-vue/src/shared/head.config.js                 # （格式/空白调整）
api-vue/src/console/App.vue                       # chrome 顶栏
api-vue/src/console/views/ConsolePanel.vue        # 抽屉 + 面板滚动 + 悬停账号卡
api-vue/src/console/views/HomeView.vue            # 去 logo + split button
api-vue/src/console/views/console/{About,Analytics,FeedbackCenter,FeedbackManager,FileManager,OAuthClient,UsersManager}.vue
api-vue/src/console/composables/useFeedbackList.js
api-vue/src/account/App.vue
api-vue/src/account/views/UserPanel.vue           # 抽屉 + 悬停账号卡
api-vue/src/account/views/HomeView.vue            # 去 logo + split button
api-vue/src/account/views/account/{About,AccountOverview,LinkAccount,Oauth,Security,UserInfo}.vue
api-vue/src/mysites/App.vue                       # main 高度 + 面板
api-vue/src/mysites/views/{HomeView,NotFound,SiteOverview}.vue
api-vue/src/ai/App.vue                            # 面板
api-vue/src/ai/views/{HomeView,NotFound}.vue
api-vue/src/default/App.vue
api-vue/src/relay/App.vue
```

构建产物 `api-assets/` 同步更新（该目录在仓库中是被跟踪的）。

---

## 8. 验证情况

| 项 | 结果 |
| --- | --- |
| `npm run build`（Vite 生产构建） | ✅ 多次通过，最后一次 `✓ built in 5.16s` |
| 构建产物包含改动 | ✅ 抽查 `md.css` 在 `index-*.css`、新组件的样式均进包 |
| `components.d.ts` | ✅ `VarDialog: typeof import('@varlet/ui')['_DialogComponent']` |
| 浏览器逐页截图比对 | ❌ 未做（沙箱限制，见 9） |
| ESLint | ❌ 未执行（项目未安装，见 9） |
| `wrangler deploy --dry-run` | ❌ 未执行（命令授权被拒，见 9） |

---

## 9. 已知限制与遗留

1. **ESLint 不存在**：`api-vue` 没有 `.eslintrc*` / `eslint.config.*`，`devDependencies` 里也没有
   `eslint` / `eslint-plugin-vue`。加一份 flat config 会一次性暴露大量存量告警，所以没有擅自加。
2. **`wrangler deploy --dry-run` 没跑**：本机 `workspace-write` 沙箱后端损坏（`0xC0000142`），
   每条 shell 都要单独升到 `danger-full-access`，该命令的授权被拒绝。
   需要本地执行：`cd api-worker && npx wrangler deploy --dry-run --outdir .wrangler-dry-run`。
3. **没有浏览器级视觉验证**：所有视觉结论来自用户提供的截图与源码核对。
4. **`ai/views/UserPanel.vue` 未改造**：仍是旧的"卡片包面板"结构（`var-card` + `var-elevation--10`），
   文案也是从账号中心复制来的"Ay Account Center"。属于历史遗留，需要产品文案后统一。
5. **`relay` / `default` 没有圆角面板**：这两页是居中说明页（md2 皮肤），套面板反而奇怪。
6. **`api-vue/VarletJS自总结文档/`（约 100 个 md）仍是 untracked**：看起来是本地查资料的副本，
   没有擅自入库。
7. **`api-vue/cert/_cert.pem` 是被跟踪的**（dev 证书，本次随构建更新）。若不希望证书进仓库，
   应 `.gitignore` + `git rm --cached`。

---

## 10. 后续建议

- **给 pull-refresh 内的卡片一个统一决策**：现在是 outlined；若更想要海拔，可在列表容器内加 4px
  内衬（`padding` 在裁切盒内），代价是卡片比页头窄 4px。
- **把悬停账号卡抽成共享组件**：目前 account / console 各写了一份（差异只有跳转目标与按钮文案），
  可以合并到 `shared/components/AccountHoverCard.vue`。
- **补 ESLint**：建议 `eslint` + `eslint-plugin-vue` + flat config，先只开 `vue3-essential`。
- **补视觉回归**：至少给 4 个应用各留一张基准截图（亮/暗 + 桌面/移动），避免再靠口头描述迭代。
- **整理 `--site-config-*` 这组历史令牌**：目前已基本无引用，确认后可整块删除。
