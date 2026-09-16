import{t as e}from"./markdown-it-4WYQckG-.js";var t=Object.assign({"./posts/vite.md":`---\r
title: Vite\r
summary: 新一代前端构建工具，冷启动秒级，HMR 极速，开箱即用的现代开发体验。\r
date: 2026-09-10\r
category: 构建工具\r
tags: [前端, 构建, Vue]\r
platforms: [Windows, macOS, Linux]\r
version: v5.4.0\r
license: MIT\r
size: 12.6 MB\r
official: https://vitejs.dev/\r
repo: https://github.com/vitejs/vite\r
docs: https://cn.vitejs.dev/\r
featured: true\r
downloads:\r
  - name: 官方安装包\r
    url: https://vitejs.dev/guide/\r
    platform: 全平台\r
    size: 12.6 MB\r
  - name: GitHub Releases\r
    url: https://github.com/vitejs/vite/releases\r
    platform: 全平台\r
  - name: npm 安装\r
    url: https://www.npmjs.com/package/vite\r
    platform: Node.js\r
---\r
\r
## 简介\r
\r
Vite 是一个由 Evan You 创建的前端构建工具，利用浏览器原生 ES Module 与 esbuild 预构建依赖，实现了近乎即时的冷启动。\r
\r
## 核心特性\r
\r
- **极速冷启动**：基于 esbuild 预构建依赖\r
- **即时 HMR**：模块级别热更新\r
- **开箱即用**：内置 TypeScript、CSS 预处理、静态资源处理\r
- **丰富插件生态**：兼容 Rollup 插件\r
\r
## 快速开始\r
\r
\`\`\`bash\r
npm create vite@latest my-app\r
cd my-app\r
npm install\r
npm run dev\r
\`\`\`\r
\r
::: tip\r
Vite 5 要求 Node.js 18+，推荐使用 LTS 版本。\r
:::\r
`});function n(e){return String(e).trim().replace(/^["']|["']$/g,``)}function r(e){let t=String(e).trim();return t===`true`||t!==`false`&&n(t)}function i(e){let t=/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(e);if(!t)return{data:{},body:e};let i=t[1].split(/\r?\n/),a={},o=null,s=null,c=null;for(let e of i){if(!e.trim())continue;let t=/^\s*-\s+([a-zA-Z][\w-]*)\s*:\s*(.*)$/.exec(e);if(t&&o){Array.isArray(a[o])||(a[o]=[]),c={[t[1]]:r(t[2])},a[o].push(c),s=null;continue}let i=/^\s+([a-zA-Z][\w-]*)\s*:\s*(.*)$/.exec(e);if(i&&c){c[i[1]]=r(i[2]);continue}let l=/^\s*-\s+(.*)$/.exec(e);if(l&&o&&!c){s||(s=[],a[o]=s),s.push(n(l[1]));continue}let u=/^([a-zA-Z][\w-]*)\s*:\s*(.*)$/.exec(e);if(u){let e=u[1],t=u[2].trim();o=e,s=null,c=null,a[e]=t===``?[]:t.startsWith(`[`)&&t.endsWith(`]`)?t.slice(1,-1).split(`,`).map(e=>n(e)).filter(Boolean):r(t)}}return{data:a,body:t[2]}}function a(e){return e=e.replace(/^:::\s*center\s*$\n([\s\S]*?)^:::\s*$/gm,(e,t)=>`<div class="md-center">\n\n${t.trim()}\n\n</div>`),e=e.replace(/^:::\s*warning\s*$\n([\s\S]*?)^:::\s*$/gm,(e,t)=>`<div class="md-alert md-alert--warning">\n\n${t.trim()}\n\n</div>`),e=e.replace(/^:::\s*info\s*$\n([\s\S]*?)^:::\s*$/gm,(e,t)=>`<div class="md-alert md-alert--info">\n\n${t.trim()}\n\n</div>`),e=e.replace(/^:::\s*tip\s*$\n([\s\S]*?)^:::\s*$/gm,(e,t)=>`<div class="md-alert md-alert--tip">\n\n${t.trim()}\n\n</div>`),e=e.replace(/^:::\s*(?:danger|error)\s*$\n([\s\S]*?)^:::\s*$/gm,(e,t)=>`<div class="md-alert md-alert--danger">\n\n${t.trim()}\n\n</div>`),e=e.replace(/^:::\s*tabs\s*$\n([\s\S]*?)^:::\s*$/gm,(e,t)=>{let n=t.split(/^@tab\s+/m).filter(e=>e.trim());if(!n.length)return``;let r=n.map((e,t)=>{let n=e.split(`
`);return{title:n.shift().trim(),content:n.join(`
`).trim(),idx:t}});return`<div class="md-tabs">\n<div class="md-tabs__nav">${r.map((e,t)=>`<button class="md-tab__btn${t===0?` is-active`:``}" data-md-tab="${t}">${e.title}</button>`).join(``)}</div>\n<div class="md-tabs__panels">${r.map((e,t)=>`<div class="md-tab__panel${t===0?` is-active`:``}" data-md-tab-panel="${t}">\n\n${e.content}\n\n</div>`).join(`
`)}</div>\n</div>`}),e}var o=new e({html:!0,linkify:!0,breaks:!0});function s(e,t){let n=e.replace(`./posts/`,``).replace(/\.md$/,``),{data:r,body:a}=i(t);if(r.draft===!0)return null;let o=/^\s*#\s+(.+)$/m.exec(a),s=o?o[1].trim():n,c=r.category??r.categories??`未分类`,l=Array.isArray(c)?c[0]:c,u=r.tags??r.tag??[],d=Array.isArray(u)?u:[u],f=r.platforms??r.platform??[],p=Array.isArray(f)?f:[f],m=r.downloads??[],h=Array.isArray(m)?m.filter(e=>e&&typeof e==`object`&&e.url).map(e=>({name:e.name||`下载`,url:e.url,platform:e.platform||``,size:e.size||``,version:e.version||``})):[],g=/\.(\d{4}-\d{2}-\d{2})\.md$/.exec(e)?.[1],_=r.date?String(r.date).slice(0,10):g||`1970-01-01`;return{slug:n,title:r.title||s,date:_,category:l,tags:d,platforms:p,version:r.version||``,license:r.license||``,size:r.size||``,official:r.official||``,repo:r.repo||``,docs:r.docs||``,downloads:h,listed:r.listed!==!1,summary:r.summary||a.replace(/^---[\s\S]*?---/g,``).replace(/:::[^\n]*\n/g,``).replace(/^@tab[^\n]*\n/gm,``).replace(/[#>*`\[\]()\-!\n]/g,` `).trim().slice(0,100),featured:!!r.featured,content:a.trim()}}var c=Object.entries(t).map(([e,t])=>s(e,t)).filter(Boolean).sort((e,t)=>t.date.localeCompare(e.date)),l=c.filter(e=>e.listed),u=[...new Set(l.map(e=>e.category))].filter(Boolean).sort(),d=[...new Set(l.flatMap(e=>e.platforms))].filter(Boolean).sort();[...new Set(l.flatMap(e=>e.tags))].filter(Boolean).sort();function f(e){return c.find(t=>t.slug===e)}function p(e){return o.render(a(e))}function m(e=document){e.querySelectorAll(`.md-tabs`).forEach(e=>{e.dataset.bound||(e.dataset.bound=`1`,e.querySelectorAll(`.md-tab__btn`).forEach(t=>{t.addEventListener(`click`,()=>{let n=t.dataset.mdTab;e.querySelectorAll(`.md-tab__btn`).forEach(e=>e.classList.toggle(`is-active`,e===t)),e.querySelectorAll(`.md-tab__panel`).forEach(e=>e.classList.toggle(`is-active`,e.dataset.mdTabPanel===n))})}))})}export{u as a,p as i,f as n,d as o,l as r,m as t};