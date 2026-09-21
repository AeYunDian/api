import{F as e,d as t,m as n}from"./runtime-core.esm-bundler-Cz9CHoxa.js";var r={class:`markdown-body`},i=`韵典综合平台博客上线`,a=`2026-09-13T00:00:00.000Z`,o=`09:00`,s=`公告`,c=[`公告`,`平台`],l=`韵典综合平台博客子应用正式上线，采用政务门户视觉语言、纯静态架构与 SFC 化 Markdown 内容层。`,u=!0,d=!0,f={__name:`welcome-2026-09-13`,setup(i,{expose:a}){return a({frontmatter:{title:`韵典综合平台博客上线`,date:`2026-09-13T00:00:00.000Z`,time:`09:00`,category:`公告`,tags:[`公告`,`平台`],summary:`韵典综合平台博客子应用正式上线，采用政务门户视觉语言、纯静态架构与 SFC 化 Markdown 内容层。`,featured:!0,listed:!0}}),(i,a)=>(e(),t(`div`,r,[...a[0]||=[n(`<h2>缘起</h2><p>韵典综合平台需要一个稳定、清晰、高密度的信息发布区。我们选择政务门户的视觉语言：深蓝导航、红色重点提示、白底内容区、1px 直角边框。</p><p>它追求的不是「好看」，而是<strong>清晰、稳定、可长期维护</strong>。</p><h2>技术选型</h2><table><thead><tr><th>层级</th><th>选型</th></tr></thead><tbody><tr><td>框架</td><td>Vue 3 + Vue Router 4</td></tr><tr><td>构建</td><td>Vite 5</td></tr><tr><td>内容</td><td>Markdown + <code>unplugin-vue-markdown</code>（Markdown 编译为 Vue SFC）</td></tr><tr><td>图标</td><td>Material Design Icons</td></tr></tbody></table><blockquote><p>原则：无后端、无数据库、无运行时服务；新增文章 = 丢一个 <code>.md</code> 文件。</p></blockquote><h2>内容层：Markdown 即 Vue 组件</h2><p>本站的 <code>.md</code> 文件在构建时由 <code>unplugin-vue-markdown</code> 编译为 Vue 单文件组件。这意味着：</p><ul><li>正文里可以直接写 Vue 组件，例如 <code>&lt;GovButton variant=&quot;primary&quot;&gt;查看详情&lt;/GovButton&gt;</code>；</li><li>每篇文章的 <code>&lt;script setup&gt;</code> 可以 import 自己的依赖，逻辑与展示完全内聚；</li><li>路由按需加载文章组件，首屏体积不随文章数量增长。</li></ul><p><code>frontmatter</code> 顶部元信息由内容层在构建时读取，用于列表、归档、分类、标签与检索，<strong>不影响正文的渲染方式</strong>。</p><h2>Frontmatter 字段约定</h2><table><thead><tr><th>字段</th><th>类型</th><th>说明</th></tr></thead><tbody><tr><td><code>title</code></td><td>string</td><td>文章标题，缺失时回退到正文首个 H1 或文件名</td></tr><tr><td><code>date</code></td><td><code>YYYY-MM-DD</code></td><td>发布日期，缺失时回退到文件名中的日期</td></tr><tr><td><code>time</code></td><td><code>HH:MM</code></td><td>发布时间（可选），用于详情页完整展示</td></tr><tr><td><code>category</code></td><td>string</td><td>分类，归档与侧边栏聚合依据</td></tr><tr><td><code>tags</code></td><td>string[]</td><td>标签，用于标签云与相关阅读打分</td></tr><tr><td><code>summary</code></td><td>string</td><td>摘要，缺失时从正文提取</td></tr><tr><td><code>featured</code></td><td>boolean</td><td>是否列入首页「推荐阅读」</td></tr><tr><td><code>listed</code></td><td>boolean</td><td>是否列入列表/聚合（默认 <code>true</code>）</td></tr><tr><td><code>draft</code></td><td>boolean</td><td>是否跳过构建（<code>true</code> 则完全不打包）</td></tr></tbody></table><p><code>listed: false</code> 与 <code>draft: true</code> 的语义不同：前者构建进包、详情页可直达，但不进列表；后者完全不构建。前者适合「有链接但不想公开收录」的场景。</p><h2>目录结构</h2><pre><code>src<span class="hljs-operator">/</span>index<span class="hljs-symbol">/</span>
├── content<span class="hljs-symbol">/</span>                <span class="hljs-comment"># 文章内容层</span>
│   ├── index.js
│   └── posts<span class="hljs-symbol">/</span>
│       └── site-design-compliance-<span class="hljs-number">201</span>7-<span class="hljs-number">47</span>.md
├── resources<span class="hljs-symbol">/</span>              <span class="hljs-comment"># 资源内容层</span>
│   ├── index.js
│   └── posts<span class="hljs-symbol">/</span>
│       └── vite.md
├── components<span class="hljs-symbol">/</span>
│   ├── common<span class="hljs-symbol">/</span>             <span class="hljs-comment"># GovPanel / GovButton / GovDialog / Breadcrumb 等</span>
│   ├── blog<span class="hljs-symbol">/</span>               <span class="hljs-comment"># ArticleItem / ArticleSidebar</span>
│   └── resource<span class="hljs-symbol">/</span>           <span class="hljs-comment"># ResourceCard / ResourceSidebar</span>
├── views<span class="hljs-symbol">/</span>                  <span class="hljs-comment"># 路由视图</span>
│   ├── HomeView.vue
│   ├── ArticleListView.vue
│   ├── ArticleDetailView.vue
│   ├── ResourceListView.vue
│   ├── ResourceDetailView.vue
│   ├── SearchView.vue
│   ├── ArchiveView.vue
│   ├── CategoryView.vue
│   ├── TagView.vue
│   └── ...
├── data<span class="hljs-symbol">/</span>
│   └── site.js             <span class="hljs-comment"># 站点配置与导航项</span>
├── router<span class="hljs-symbol">/</span>
│   └── index.js
└── styles<span class="hljs-symbol">/</span>
    ├── tokens.css          <span class="hljs-comment"># 设计令牌：颜色 / 字体 / 间距</span>
    ├── base.css            <span class="hljs-comment"># 基础样式与布局工具类</span>
    └── markdown.css        <span class="hljs-comment"># Markdown 内容渲染样式</span>
</code></pre><p>所有博客代码位于 <code>src/index/</code>，作为 MSPA 融合项目的一个子应用，与 <code>account / console / relay / ai</code> 等子应用按域名分流。</p><h2>已上线功能</h2><ul><li><strong>文章</strong>：列表 / 详情 / 分类 / 标签 / 归档 / 相关阅读</li><li><strong>资源</strong>：总览 / 详情 / 分类与平台筛选 / 多下载通道</li><li><strong>搜索</strong>：<code>/search</code> 统一检索公开的文章与资源，支持全部 / 文章 / 资源三类筛选，输入防抖自动搜索</li><li><strong>弹窗</strong>：<code>GovDialog</code> 声明式组件 + <code>showDialog / showAlert / showConfirm</code> 函数式调用，支持多弹窗栈、ESC 关闭、滚动锁定与滚动条宽度补偿</li><li><strong>Cookie 合规</strong>：按 IP 国家判断是否弹出授权，符合 GDPR 场景</li><li><strong>无障碍</strong>：顶部工具栏提供「无障碍浏览」字号放大开关</li></ul><h2>内容约定</h2><ul><li>新增文章：在 <code>src/index/content/posts/</code> 下新增 <code>.md</code>，<code>listed</code> 缺省即为公开；</li><li>新增资源：在 <code>src/index/resources/posts/</code> 下新增 <code>.md</code>，支持 <code>downloads</code> 对象数组声明多通道下载；</li><li>引用其他文章：用 <code>router-link</code> 或 Markdown 链接，slug 即文件名（去掉 <code>.md</code>）；</li><li>插入组件：在 <code>&lt;script setup&gt;</code> 中显式 import，正文中直接使用组件标签。</li></ul><h2>设计原则</h2><ul><li><strong>三色体系</strong>：以深蓝 <code>#015293</code> 为主色、白色为辅助色、红色 <code>#e4393c</code> 为强调色，总色调不超过三种；</li><li><strong>字体分层</strong>：正文黑体、公文引用宋体、数字 Tinos、顶栏点阵宋体，各司其职；</li><li><strong>直角优先</strong>：模块容器一律直角，小控件圆角不超过 6px；</li><li><strong>加载性能</strong>：路由懒加载 + 空闲预加载，配合 Markdown 组件化，首屏体积受控。</li></ul><h2>说明</h2><p>本站为个人技术项目，非政府网站，视觉设计参照《政府网站发展指引》（国办发〔2017〕47号）及其附件《网页设计规范》进行。所有内容仅代表个人观点，与任何机构无关。</p><p>如需了解本站对照国家规范的具体调整，可参阅<a href="/articles/site-design-compliance-2017-47">《关于本站对照国办发〔2017〕47号文开展设计规范调整的说明》</a>。</p>`,25)]]))}};export{s as category,a as date,f as default,u as featured,d as listed,l as summary,c as tags,o as time,i as title};