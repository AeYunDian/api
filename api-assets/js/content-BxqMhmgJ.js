import{t as e}from"./markdown-it-4WYQckG-.js";var t=Object.assign({"./posts/site-design-compliance-2017-47.md":`---\r
title: 关于本站对照国办发〔2017〕47号文开展设计规范调整的说明\r
summary: 依据《政府网站发展指引》（国办发〔2017〕47号）及其附件《网页设计规范》，本站于2026年9月对站点色调、字体、内容加载、栏目结构等进行系统性调整，现将有关情况说明如下。\r
date: 2026-09-16\r
time: 21:50\r
category: 站点公告\r
tags: [政务规范, 设计规范, 站点调整]\r
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
`,"./posts/welcome.md":`---\r
title: 韵典综合平台博客上线\r
date: 2026-09-13\r
category: 公告\r
tags: [公告, 平台]\r
summary: 韵典综合平台博客子应用正式上线，采用政务门户视觉语言与纯静态架构。\r
featured: true\r
---\r
\r
## 缘起\r
\r
韵典综合平台需要一个稳定、清晰、高密度的信息发布区。我们选择政务门户的视觉语言：深蓝导航、红色重点提示、白底内容区、1px 直角边框。\r
\r
它追求的不是"好看"，而是**清晰、稳定、可长期维护**。\r
\r
## 技术选型\r
\r
| 层级 | 选型                                         |\r
| ---- | -------------------------------------------- |\r
| 框架 | Vue 3 + Vue Router 4                         |\r
| 构建 | Vite 5                                       |\r
| 内容 | Markdown + markdown-it                       |\r
| 部署 | 纯静态（CF Pages / GitHub Pages / 对象存储） |\r
\r
> 原则：无后端、无数据库、无运行时服务；新增文章 = 丢一个 \`.md\` 文件。\r
\r
## 目录约定\r
\r
所有博客代码位于 \`src/index/\`，作为 MSPA 融合项目的一个子应用。\r
`});function n(e){let t=/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(e);if(!t)return{data:{},body:e};let n=t[1].split(/\r?\n/),r={},i=null,a=null;for(let e of n){let t=/^\s*-\s+(.*)$/.exec(e);if(t&&i){a||(a=[],r[i]=a),a.push(t[1].trim().replace(/^["']|["']$/g,``));continue}let n=/^([a-zA-Z][\w-]*)\s*:\s*(.*)$/.exec(e);if(n){let e=n[1],t=n[2].trim();i=e,a=null,t===``?(r[e]=[],a=r[e]):r[e]=t.startsWith(`[`)&&t.endsWith(`]`)?t.slice(1,-1).split(`,`).map(e=>e.trim().replace(/^["']|["']$/g,``)).filter(Boolean):t===`true`||t===`false`?t===`true`:t.replace(/^["']|["']$/g,``)}}return{data:r,body:t[2]}}function r(e){return e=e.replace(/^:::\s*center\s*$\n([\s\S]*?)^:::\s*$/gm,(e,t)=>`<div class="md-center">\n\n${t.trim()}\n\n</div>`),e=e.replace(/^:::\s*warning\s*$\n([\s\S]*?)^:::\s*$/gm,(e,t)=>`<div class="md-alert md-alert--warning">\n\n${t.trim()}\n\n</div>`),e=e.replace(/^:::\s*info\s*$\n([\s\S]*?)^:::\s*$/gm,(e,t)=>`<div class="md-alert md-alert--info">\n\n${t.trim()}\n\n</div>`),e=e.replace(/^:::\s*tip\s*$\n([\s\S]*?)^:::\s*$/gm,(e,t)=>`<div class="md-alert md-alert--tip">\n\n${t.trim()}\n\n</div>`),e=e.replace(/^:::\s*(?:danger|error)\s*$\n([\s\S]*?)^:::\s*$/gm,(e,t)=>`<div class="md-alert md-alert--danger">\n\n${t.trim()}\n\n</div>`),e=e.replace(/^:::\s*tabs\s*$\n([\s\S]*?)^:::\s*$/gm,(e,t)=>{let n=t.split(/^@tab\s+/m).filter(e=>e.trim());if(!n.length)return``;let r=n.map((e,t)=>{let n=e.split(`
`);return{title:n.shift().trim(),content:n.join(`
`).trim(),idx:t}});return`<div class="md-tabs">\n<div class="md-tabs__nav">${r.map((e,t)=>`<button class="md-tab__btn${t===0?` is-active`:``}" data-md-tab="${t}">${e.title}</button>`).join(``)}</div>\n<div class="md-tabs__panels">${r.map((e,t)=>`<div class="md-tab__panel${t===0?` is-active`:``}" data-md-tab-panel="${t}">\n\n${e.content}\n\n</div>`).join(`
`)}</div>\n</div>`}),e}var i=new e({html:!0,linkify:!0,breaks:!0});function a(e,t){let r=e.replace(`./posts/`,``).replace(/\.md$/,``),{data:i,body:a}=n(t);if(i.draft===!0)return null;let o=/^\s*#\s+(.+)$/m.exec(a),s=o?o[1].trim():r,c=i.category??i.categories??`未分类`,l=Array.isArray(c)?c[0]:c,u=i.tags??i.tag??[],d=Array.isArray(u)?u:[u],f=/\.(\d{4}-\d{2}-\d{2})\.md$/.exec(e)?.[1],p=i.date?String(i.date).slice(0,10):f||`1970-01-01`;return{slug:r,title:i.title||s,date:p,category:l,tags:d,listed:i.listed!==!1,summary:i.summary||a.replace(/^---[\s\S]*?---/g,``).replace(/:::[^\n]*\n/g,``).replace(/^@tab[^\n]*\n/gm,``).replace(/[#>*`\[\]()\-!\n]/g,` `).trim().slice(0,100),featured:!!i.featured,readingMinutes:Math.max(1,Math.round(a.length/350)),content:a.trim()}}var o=Object.entries(t).map(([e,t])=>a(e,t)).filter(Boolean).sort((e,t)=>t.date.localeCompare(e.date)),s=o.filter(e=>e.listed),c=[...new Set(s.map(e=>e.category))].filter(Boolean).sort(),l=[...new Set(s.flatMap(e=>e.tags))].filter(Boolean).sort();function u(e){return o.find(t=>t.slug===e)}function d(e){return s.filter(t=>t.category===e)}function f(e){return s.filter(t=>t.tags.includes(e))}function p(){return s.filter(e=>e.featured)}function m(e=6){return s.slice(0,e)}function h(){let e={};for(let t of s){let n=t.date.slice(0,4);(e[n]??=[]).push(t)}return Object.entries(e).sort((e,t)=>t[0].localeCompare(e[0]))}function g(e){return i.render(r(e))}function _(e=document){e.querySelectorAll(`.md-tabs`).forEach(e=>{e.dataset.bound||(e.dataset.bound=`1`,e.querySelectorAll(`.md-tab__btn`).forEach(t=>{t.addEventListener(`click`,()=>{let n=t.dataset.mdTab;e.querySelectorAll(`.md-tab__btn`).forEach(e=>e.classList.toggle(`is-active`,e===t)),e.querySelectorAll(`.md-tab__panel`).forEach(e=>e.classList.toggle(`is-active`,e.dataset.mdTabPanel===n))})}))})}export{u as a,m as c,l as d,p as i,s as l,c as n,d as o,h as r,f as s,_ as t,g as u};