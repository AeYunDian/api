---
title: Vite
summary: 新一代前端构建工具，冷启动秒级，HMR 极速，开箱即用的现代开发体验。
date: 2026-09-10
category: 构建工具
tags: [前端, 构建, Vue]
platforms: [Windows, macOS, Linux]
version: v5.4.0
license: MIT
size: 12.6 MB
official: https://vitejs.dev/
repo: https://github.com/vitejs/vite
docs: https://cn.vitejs.dev/
featured: true
downloads:
  - name: 官方安装包
    url: https://vitejs.dev/guide/
    platform: 全平台
    size: 12.6 MB
  - name: GitHub Releases
    url: https://github.com/vitejs/vite/releases
    platform: 全平台
  - name: npm 安装
    url: https://www.npmjs.com/package/vite
    platform: Node.js
---

## 简介

Vite 是一个由 Evan You 创建的前端构建工具，利用浏览器原生 ES Module 与 esbuild 预构建依赖，实现了近乎即时的冷启动。

## 核心特性

- **极速冷启动**：基于 esbuild 预构建依赖
- **即时 HMR**：模块级别热更新
- **开箱即用**：内置 TypeScript、CSS 预处理、静态资源处理
- **丰富插件生态**：兼容 Rollup 插件

## 快速开始

```bash
npm create vite@latest my-app
cd my-app
npm install
npm run dev
```

::: tip
Vite 5 要求 Node.js 18+，推荐使用 LTS 版本。
:::
