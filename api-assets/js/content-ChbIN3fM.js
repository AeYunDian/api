const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["js/markdown-vue-usage-2026-09-18-B3ogHGBx.js","js/runtime-core.esm-bundler-Cz9CHoxa.js","js/dialog-CnKNd-RY.js","js/runtime-dom.esm-bundler-BJodgEXJ.js","js/device-DsCKXn2o.js","js/_plugin-vue_export-helper-BDNMzG2s.js","css/dialog-DvqYiKH4.css","js/GovPanel-CbaNhmpS.js","css/GovPanel-Bpth2y6u.css","js/GovButton-68ILwF25.js","css/GovButton-L23qjz4j.css","js/site-design-compliance-2026-09-16-Cqcbd0Ss.js","js/welcome-2026-09-13-DDN7NMu8.js"])))=>i.map(i=>d[i]);
import{t as e}from"./preload-helper-Czpn1I53.js";var t=Object.assign({"./posts/markdown-vue-usage-2026-09-18.md":`---\r
title: 关于在 Markdown 中嵌入 Vue 组件的说明\r
date: 2026-09-18\r
time: 11:00\r
category: 技术文档\r
tags: [Vue, Markdown, 内容层]\r
summary: 本站 Markdown 文件经 unplugin-vue-markdown 编译为 Vue 单文件组件，正文可直接使用 Vue 组件与响应式逻辑。现将使用方法与注意事项说明如下。\r
featured: true\r
listed: true\r
---\r
\r
<script setup>\r
import { ref } from 'vue'\r
import GovPanel from '@/index/components/common/GovPanel.vue'\r
import GovButton from '@/index/components/common/GovButton.vue'\r
import { showAlert } from '@/index/components/common/dialog'\r
\r
const count = ref(0)\r
const showTip = ref(true)\r
\r
function increment() {\r
    count.value += 1\r
}\r
\r
function handleAlert() {\r
    showAlert('来自文章内的事件')\r
}\r
<\/script>\r
\r
本站的 \`.md\` 文件由 \`unplugin-vue-markdown\` 在构建时编译为 Vue 单文件组件。正文中的 Vue 组件标签会被当作模板的一部分解析，\`<script setup>\` 中的逻辑对正文完全可见。现将使用方法说明如下。\r
\r
## 一、基本用法\r
\r
在 frontmatter 之后、正文之前书写 \`<script setup>\`，导入所需组件与响应式 API 即可。\r
\r
\`\`\`vue\r
<script setup>\r
import { ref } from "vue";\r
import GovButton from "@/index/components/common/GovButton.vue";\r
\r
const count = ref(0);\r
<\/script>\r
\r
正文中可以像这样使用：\r
<GovButton variant="primary">按钮</GovButton>\r
\`\`\`\r
\r
组件标签与 Markdown 语法可以混用。以下为实际渲染效果：\r
\r
<GovPanel title="示例一：响应式计数器">\r
  <p>当前计数：<b>{{ count }}</b></p>\r
  <GovButton variant="primary" @click="increment">\r
    <MyIcon icon="plus"></MyIcon>&nbsp;增加\r
  </GovButton> <br /><br />\r
  <GovButton variant="default" @click="count = 0">重置</GovButton>\r
</GovPanel>\r
\r
<div class="md-alert md-alert--tip">\r
  文章内的 <code>ref</code> 是独立的响应式状态，作用域限于当前文章的组件实例，不会与其他文章或站点状态相互影响。\r
</div>\r
\r
## 二、条件渲染与列表渲染\r
\r
Vue 的 \`v-if\`、\`v-for\` 等指令在正文中同样有效。\r
\r
<GovPanel title="示例二：条件渲染">\r
  <GovButton variant="primary" @click="showTip = !showTip">\r
    <MyIcon icon="eye"></MyIcon>&nbsp;切换显示\r
  </GovButton>\r
  <p v-if="showTip" style="margin-top: 12px;">\r
    这段文字由 <code>v-if</code> 控制，当前可见。\r
  </p>\r
  <p v-else style="margin-top: 12px; color: #999;">\r
    这段文字由 <code>v-else</code> 控制，当前显示的是它。\r
  </p>\r
</GovPanel>\r
\r
下面的列表由 \`v-for\` 渲染，数据来自文章内的 \`<script setup>\`：\r
\r
<ul>\r
  <li v-for="i in 3" :key="i">第 {{ i }} 项，共 3 项</li>\r
</ul>\r
\r
## 三、嵌入组件\r
\r
本站提供的政务组件均可在正文中直接使用。\r
\r
<GovPanel title="示例三：组件组合" tone="red">\r
  <p>以下按钮均为 <code>GovButton</code> 组件的不同 <code>variant</code>：</p>\r
  <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-top: 12px;">\r
    <GovButton variant="primary">主要操作</GovButton>\r
    <GovButton variant="danger">危险操作</GovButton>\r
    <GovButton variant="default">次要操作</GovButton>\r
  </div>\r
</GovPanel>\r
\r
<GovPanel title="示例四：图标使用">\r
  <p>\r
    <MyIcon icon="download"></MyIcon> 下载\r
    <MyIcon icon="web"></MyIcon> 官网\r
    <MyIcon icon="code-tags"></MyIcon> 源码\r
    <MyIcon icon="file-document-outline"></MyIcon> 文档\r
  </p>\r
</GovPanel>\r
\r
## 四、事件绑定\r
\r
组件上的 \`@click\` 等事件可以直接绑定到文章内的函数。\r
\r
<GovPanel title="示例五：事件处理">\r
  <GovButton variant="primary" @click="handleAlert">\r
    点击弹出提示\r
  </GovButton>\r
</GovPanel>\r
\r
实际写法如下：\r
\r
\`\`\`vue\r
<script setup>\r
function handleAlert() {\r
  alert("来自文章内的事件");\r
}\r
<\/script>\r
\r
<GovButton variant="primary" @click="handleAlert">\r
  点击弹出提示\r
</GovButton>\r
\`\`\`\r
\r
## 五、注意事项\r
\r
（一）**组件需要显式导入**。方案 B 下文章是独立的 Vue 组件，组件不会自动注册。必须在 \`<script setup>\` 中 \`import\`，不能依赖全局注册。\r
\r
（二）**自定义组件请显式闭合**。markdown-it 在处理块级 HTML 时，自闭合的自定义组件标签（\`<MyIcon ... />\`）容易丢失自闭合标志，导致 Vue 编译器报 \`Element is missing end tag\`。建议所有自定义组件都写成 \`<MyIcon ...></MyIcon>\`，HTML void 元素（\`<br>\`、\`<img>\`）不受影响。\r
\r
（三）**旧版容器语法不再生效**。本站早期的 \`::: tip\` / \`::: warning\` / \`::: tabs\` 等自定义容器已在迁移中移除，改用原生 HTML 类表达，例如 \`<div class="md-alert md-alert--tip">…</div>\`。\r
\r
（四）**构建时编译**。正文中的组件在构建阶段编译为 render function，而非运行时解析。若组件名拼写错误，会在构建时或开发时控制台提示，而不会静默忽略。\r
\r
（五）**样式作用域**。文章内联写的 \`style\` 属性作用于当前元素，Markdown 渲染出的标签样式由 \`markdown.css\` 统一控制。若需要局部样式，建议在文章内使用内联 \`style\`，或封装为独立组件。\r
\r
（六）**不要写 \`<style>\` 块**。本站暂不支持在 Markdown 中书写 \`<style>\`，会与 SFC 编译流程冲突。需要样式时优先使用已有 CSS 变量或内联样式。\r
\r
## 六、小结\r
\r
Markdown 与 Vue 的融合让静态内容具备了组件化的能力。文章不再只是纯文本，而是可以拥有响应式状态、可复用组件与事件交互的完整页面单元。这使得一些原本需要额外页面承载的功能，可以直接在文章内表达。\r
\r
如需查看本站组件清单，可参阅[《关于本站对照国办发〔2017〕47号文开展设计规范调整的说明》](/articles/site-design-compliance-2017-47)。\r
`,"./posts/site-design-compliance-2026-09-16.md":`---\r
title: 关于本站对照国办发〔2017〕47号文开展设计规范调整的说明\r
summary: 依据《政府网站发展指引》（国办发〔2017〕47号）及其附件《网页设计规范》，本站于2026年9月对站点色调、字体、内容加载、栏目结构等进行系统性调整，现将有关情况说明如下。\r
date: 2026-09-16\r
time: 21:50\r
category: 公告\r
tags: [政务规范, 设计规范, 公告]\r
featured: true\r
listed: true\r
---\r
\r
为进一步规范本站页面展现形式，提升信息服务质量，根据《政府网站发展指引》（国办发〔2017〕47号）及其附件《网页设计规范》有关要求，结合《政府网站与政务新媒体检查指标》（国办秘函〔2019〕19号）有关考核标准，本站于2026年9月对整体设计进行系统性调整。现将调整依据及主要内容说明如下。\r
\r
## 一、调整依据\r
\r
（一）《政府网站发展指引》（国办发〔2017〕47号）。该文件由国务院办公厅印发，是全国政府网站建设的基本规范，其中附件《网页设计规范》对网站的展现布局、地址链接、网页标签等提出了明确要求。\r
\r
（二）《政府网站与政务新媒体检查指标》（国办秘函〔2019〕19号）。该文件明确了政府网站考核的单项否决指标和扣分指标，其中涉及页面加载时长、栏目更新情况、内容发布规范等具体要求。\r
\r
（三）《政府网站集约化试点工作方案》（国办函〔2018〕71号）。该方案要求实现"统一标准体系、统一技术平台、统一安全防护、统一运维监管"，对站点技术架构和设计模式具有指导意义。\r
\r
（四）山西省地方标准《政府网站集约化平台 网页设计规范》（DB14/T 2544—2022）等行业性、地方性标准，作为本站在具体设计实施中的参考依据。\r
\r
## 二、调整主要内容\r
\r
（一）**规范色调使用**。规范要求"确定1种主色调，总色调不宜超过3种"。本站原设计围绕蓝色系展开了多个派生色，色值数量偏多。经调整，确立以深蓝（#015293）为主色调、白色为辅助色、红色（#e4393c）为强调色的三色体系，其余派生色统一收归为主色调的透明度变体，不再作为独立色值维护。\r
\r
（二）**统一字体字号**。规范要求"同一类别的栏目和信息使用同一模板，统一字体、字号、行间距和布局"。经排查，原设计在 \`GovPanel\` 标题、\`markdown.css\` 的 \`h2\`、\`DocLayout\` 的 \`h2\` 等位置存在字号不一致问题。本次调整将上述位置的字号统一为 \`--gov-fs-lg\`，并清理了 \`SiteFooter\`、\`DocLayout\` 中重复定义的样式规则。\r
\r
（三）**优化加载性能**。规范要求"页面加载时长不宜超过3秒"，检查指标将"网站打不开次数累计占比超过5%"列为单项否决。本站原内容层采用构建时全量内联方式，随内容数量增长将影响首屏体积。本次调整改为按需异步加载，配合空闲时预加载后续路由组件的方式，兼顾首屏速度与导航体验。\r
\r
（四）**完善内容展示**。规范要求"网站内容要清晰显示发布时间，时间格式为YYYY—MM—DD HH:MM"。本站原列表项仅显示日期，本次调整在内容层增加 \`time\` 字段，列表与详情页均按规范格式显示完整时间。\r
\r
（五）**健全栏目管理**。规范要求"栏目设置应科学合理，避免出现空白栏目"。本次调整新增"资源"栏目，统一收录开发工具、组件库等资源信息，并对文章列表、资源列表、搜索页的展示规则进行一致性梳理，明确各栏目数据来源，避免出现重复或空白栏目。\r
\r
（六）**扩展检索范围**。在原站内搜索仅覆盖文章的基础上，新增资源检索，统一为 \`/search\` 页面，支持全部、文章、资源三类筛选，并可分享、可回退、可刷新，符合规范中"提供信息检索功能"的相关要求。\r
\r
## 三、调整后效果\r
\r
（一）**色调统一**。全站主色调、辅助色、强调色使用规范，页面整体观感协调一致。\r
\r
（二）**字号规范**。同级标题字号一致，正文、辅助信息、数字等各级字号层级分明，符合用户阅读习惯。\r
\r
（三）**加载优化**。首屏体积得到控制，配合路由预加载，主流网络环境下页面加载时长稳定控制在规范要求以内。\r
\r
（四）**内容完整**。发布时间、信息来源、分类标签等要素展示完整，符合规范对内容展示的要求。\r
\r
（五）**结构清晰**。头部标识区、中部内容区、底部功能区划分明确，底部功能区列明网站名称、备案编号、联系方式等信息。\r
\r
## 四、后续工作\r
\r
（一）持续跟踪国家关于政府网站建设的相关文件更新情况，及时对照调整本站设计。\r
\r
（二）定期对站点进行自查，重点检查栏目更新、内容发布、页面性能等考核指标涉及的内容。\r
\r
（三）结合用户反馈，进一步优化站内检索、无障碍访问、移动端适配等体验。\r
\r
## 五、说明\r
\r
本站为个人技术项目，非政府网站，本站视觉设计参照政府网站规范进行，旨在为用户提供规范、清晰、易读的信息服务。所有内容仅代表个人观点，与任何机构无关。\r
\r
特此说明。\r
\r
---\r
\r
**附：主要参考文件**\r
\r
<ul>\r
  <li><a href="https://www.gov.cn/zhengce/content/2017-06/08/content_5200760.htm" target="_blank" rel="noopener">国务院办公厅关于印发政府网站发展指引的通知（国办发〔2017〕47号）</a></li>\r
  <li><a href="https://www.gov.cn/zhengce/content/2019-04/18/content_5384134.htm" target="_blank" rel="noopener">国务院办公厅秘书局关于印发政府网站与政务新媒体检查指标、监管工作年度考核指标的通知（国办秘函〔2019〕19号）</a></li>\r
  <li><a href="https://www.gov.cn/gongbao/content/2018/content_5343741.htm" target="_blank" rel="noopener">国务院办公厅关于印发《政府网站集约化试点工作方案》的通知（国办函〔2018〕71号）</a></li>\r
  <li><a href="https://ba.sacinfo.org.cn/stdDetail/f0d57c3b3c953827ce262a46b434d20685261c7714f6a0060ce1c7467868eae2" target="_blank" rel="noopener">《政府网站集约化平台 网页设计规范》（DB14/T 2544—2022）</a></li>\r
</ul>\r
\r
**简要说明**\r
\r
- **国办发〔2017〕47号**：国务院办公厅2017年5月15日成文，6月8日发布，附件含《网页设计规范》。\r
- **国办秘函〔2019〕19号**：国务院办公厅秘书局2019年4月1日成文，4月18日发布，含单项否决指标和扣分、加分指标。\r
- **国办函〔2018〕71号**：国务院办公厅2018年10月27日成文，11月9日发布，要求“统一标准体系、统一技术平台”等。\r
- **DB14/T 2544—2022**：山西省地方标准，2022年9月30日发布，12月30日实施，技术归口为山西省电子政务信息标准化技术委员会。\r
`,"./posts/welcome-2026-09-13.md":`---\r
title: 韵典综合平台博客上线\r
date: 2026-09-13\r
time: 09:00\r
category: 公告\r
tags: [公告, 平台]\r
summary: 韵典综合平台博客子应用正式上线，采用政务门户视觉语言、纯静态架构与 SFC 化 Markdown 内容层。\r
featured: true\r
listed: true\r
---\r
\r
## 缘起\r
\r
韵典综合平台需要一个稳定、清晰、高密度的信息发布区。我们选择政务门户的视觉语言：深蓝导航、红色重点提示、白底内容区、1px 直角边框。\r
\r
它追求的不是「好看」，而是**清晰、稳定、可长期维护**。\r
\r
## 技术选型\r
\r
| 层级 | 选型                                                          |\r
| ---- | ------------------------------------------------------------- |\r
| 框架 | Vue 3 + Vue Router 4                                          |\r
| 构建 | Vite 5                                                        |\r
| 内容 | Markdown + \`unplugin-vue-markdown\`（Markdown 编译为 Vue SFC） |\r
| 图标 | Material Design Icons                                         |\r
\r
> 原则：无后端、无数据库、无运行时服务；新增文章 = 丢一个 \`.md\` 文件。\r
\r
## 内容层：Markdown 即 Vue 组件\r
\r
本站的 \`.md\` 文件在构建时由 \`unplugin-vue-markdown\` 编译为 Vue 单文件组件。这意味着：\r
\r
- 正文里可以直接写 Vue 组件，例如 \`<GovButton variant="primary">查看详情</GovButton>\`；\r
- 每篇文章的 \`<script setup>\` 可以 import 自己的依赖，逻辑与展示完全内聚；\r
- 路由按需加载文章组件，首屏体积不随文章数量增长。\r
\r
\`frontmatter\` 顶部元信息由内容层在构建时读取，用于列表、归档、分类、标签与检索，**不影响正文的渲染方式**。\r
\r
## Frontmatter 字段约定\r
\r
| 字段       | 类型         | 说明                                       |\r
| ---------- | ------------ | ------------------------------------------ |\r
| \`title\`    | string       | 文章标题，缺失时回退到正文首个 H1 或文件名 |\r
| \`date\`     | \`YYYY-MM-DD\` | 发布日期，缺失时回退到文件名中的日期       |\r
| \`time\`     | \`HH:MM\`      | 发布时间（可选），用于详情页完整展示       |\r
| \`category\` | string       | 分类，归档与侧边栏聚合依据                 |\r
| \`tags\`     | string[]     | 标签，用于标签云与相关阅读打分             |\r
| \`summary\`  | string       | 摘要，缺失时从正文提取                     |\r
| \`featured\` | boolean      | 是否列入首页「推荐阅读」                   |\r
| \`listed\`   | boolean      | 是否列入列表/聚合（默认 \`true\`）           |\r
| \`draft\`    | boolean      | 是否跳过构建（\`true\` 则完全不打包）        |\r
\r
\`listed: false\` 与 \`draft: true\` 的语义不同：前者构建进包、详情页可直达，但不进列表；后者完全不构建。前者适合「有链接但不想公开收录」的场景。\r
\r
## 目录结构\r
\r
\`\`\`\r
src/index/\r
├── content/                # 文章内容层\r
│   ├── index.js\r
│   └── posts/\r
│       └── site-design-compliance-2017-47.md\r
├── resources/              # 资源内容层\r
│   ├── index.js\r
│   └── posts/\r
│       └── vite.md\r
├── components/\r
│   ├── common/             # GovPanel / GovButton / GovDialog / Breadcrumb 等\r
│   ├── blog/               # ArticleItem / ArticleSidebar\r
│   └── resource/           # ResourceCard / ResourceSidebar\r
├── views/                  # 路由视图\r
│   ├── HomeView.vue\r
│   ├── ArticleListView.vue\r
│   ├── ArticleDetailView.vue\r
│   ├── ResourceListView.vue\r
│   ├── ResourceDetailView.vue\r
│   ├── SearchView.vue\r
│   ├── ArchiveView.vue\r
│   ├── CategoryView.vue\r
│   ├── TagView.vue\r
│   └── ...\r
├── data/\r
│   └── site.js             # 站点配置与导航项\r
├── router/\r
│   └── index.js\r
└── styles/\r
    ├── tokens.css          # 设计令牌：颜色 / 字体 / 间距\r
    ├── base.css            # 基础样式与布局工具类\r
    └── markdown.css        # Markdown 内容渲染样式\r
\`\`\`\r
\r
所有博客代码位于 \`src/index/\`，作为 MSPA 融合项目的一个子应用，与 \`account / console / relay / ai\` 等子应用按域名分流。\r
\r
## 已上线功能\r
\r
- **文章**：列表 / 详情 / 分类 / 标签 / 归档 / 相关阅读\r
- **资源**：总览 / 详情 / 分类与平台筛选 / 多下载通道\r
- **搜索**：\`/search\` 统一检索公开的文章与资源，支持全部 / 文章 / 资源三类筛选，输入防抖自动搜索\r
- **弹窗**：\`GovDialog\` 声明式组件 + \`showDialog / showAlert / showConfirm\` 函数式调用，支持多弹窗栈、ESC 关闭、滚动锁定与滚动条宽度补偿\r
- **Cookie 合规**：按 IP 国家判断是否弹出授权，符合 GDPR 场景\r
- **无障碍**：顶部工具栏提供「无障碍浏览」字号放大开关\r
\r
## 内容约定\r
\r
- 新增文章：在 \`src/index/content/posts/\` 下新增 \`.md\`，\`listed\` 缺省即为公开；\r
- 新增资源：在 \`src/index/resources/posts/\` 下新增 \`.md\`，支持 \`downloads\` 对象数组声明多通道下载；\r
- 引用其他文章：用 \`router-link\` 或 Markdown 链接，slug 即文件名（去掉 \`.md\`）；\r
- 插入组件：在 \`<script setup>\` 中显式 import，正文中直接使用组件标签。\r
\r
## 设计原则\r
\r
- **三色体系**：以深蓝 \`#015293\` 为主色、白色为辅助色、红色 \`#e4393c\` 为强调色，总色调不超过三种；\r
- **字体分层**：正文黑体、公文引用宋体、数字 Tinos、顶栏点阵宋体，各司其职；\r
- **直角优先**：模块容器一律直角，小控件圆角不超过 6px；\r
- **加载性能**：路由懒加载 + 空闲预加载，配合 Markdown 组件化，首屏体积受控。\r
\r
## 说明\r
\r
本站为个人技术项目，非政府网站，视觉设计参照《政府网站发展指引》（国办发〔2017〕47号）及其附件《网页设计规范》进行。所有内容仅代表个人观点，与任何机构无关。\r
\r
如需了解本站对照国家规范的具体调整，可参阅[《关于本站对照国办发〔2017〕47号文开展设计规范调整的说明》](/articles/site-design-compliance-2017-47)。\r
`}),n=Object.assign({"./posts/markdown-vue-usage-2026-09-18.md":()=>e(()=>import(`./markdown-vue-usage-2026-09-18-B3ogHGBx.js`),__vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10])),"./posts/site-design-compliance-2026-09-16.md":()=>e(()=>import(`./site-design-compliance-2026-09-16-Cqcbd0Ss.js`),__vite__mapDeps([11,1])),"./posts/welcome-2026-09-13.md":()=>e(()=>import(`./welcome-2026-09-13-DDN7NMu8.js`),__vite__mapDeps([12,1]))});function r(e){let t=/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(e);if(!t)return{data:{},body:e};let n=t[1].split(/\r?\n/),r={},i=null,a=null;for(let e of n){let t=/^\s*-\s+(.*)$/.exec(e);if(t&&i){a||(a=[],r[i]=a),a.push(t[1].trim().replace(/^["']|["']$/g,``));continue}let n=/^([a-zA-Z][\w-]*)\s*:\s*(.*)$/.exec(e);if(n){let e=n[1],t=n[2].trim();i=e,a=null,t===``?(r[e]=[],a=r[e]):r[e]=t.startsWith(`[`)&&t.endsWith(`]`)?t.slice(1,-1).split(`,`).map(e=>e.trim().replace(/^["']|["']$/g,``)).filter(Boolean):t===`true`||t===`false`?t===`true`:t.replace(/^["']|["']$/g,``)}}return{data:r,body:t[2]}}function i(e){return e.replace(/<script[\s\S]*?<\/script>/gi,``).replace(/<style[\s\S]*?<\/style>/gi,``).replace(/<\/?[A-Z][\w-]*(\s[^>]*)?>/g,``).replace(/<!--[\s\S]*?-->/g,``).replace(/[#>*`\[\]()\-!\n\r]/g,` `).replace(/\s+/g,` `).trim()}function a(e,t){let a=e.replace(`./posts/`,``).replace(/\.md$/,``),{data:o,body:s}=r(t);if(o.draft===!0)return null;let c=/^#\s+(.+)$/m.exec(s),l=c?c[1].trim():a,u=o.category??o.categories??`未分类`,d=Array.isArray(u)?u[0]:u,f=o.tags??o.tag??[],p=Array.isArray(f)?f:[f],m=/\.(\d{4}-\d{2}-\d{2})\.md$/.exec(e)?.[1],h=o.date?String(o.date).slice(0,10):m||`1970-01-01`,g=i(s);return{slug:a,title:o.title||l,date:h,category:d,tags:p,listed:o.listed!==!1,summary:o.summary||g.slice(0,100),featured:!!o.featured,readingMinutes:Math.max(1,Math.round(g.length/350)),searchText:g.toLowerCase(),component:n[e]}}var o=Object.entries(t).map(([e,t])=>a(e,t)).filter(Boolean).sort((e,t)=>t.date.localeCompare(e.date)),s=o.filter(e=>e.listed),c=[...new Set(s.map(e=>e.category))].filter(Boolean).sort(),l=[...new Set(s.flatMap(e=>e.tags))].filter(Boolean).sort();function u(e){return o.find(t=>t.slug===e)}function d(e){return s.filter(t=>t.category===e)}function f(e){return s.filter(t=>t.tags.includes(e))}function p(){return s.filter(e=>e.featured)}function m(e=6){return s.slice(0,e)}function h(){let e={};for(let t of s){let n=t.date.slice(0,4);(e[n]??=[]).push(t)}return Object.entries(e).sort((e,t)=>t[0].localeCompare(e[0]))}function g(e){let t=String(e||``).trim().toLowerCase();return t?s.filter(e=>e.title.toLowerCase().includes(t)||e.summary.toLowerCase().includes(t)||e.category.toLowerCase().includes(t)||e.tags.some(e=>e.toLowerCase().includes(t))||e.searchText.includes(t)):[]}export{d as a,s as c,u as i,g as l,h as n,f as o,p as r,m as s,c as t,l as u};