<script setup>
import Breadcrumb from './Breadcrumb.vue'
import GovPanel from './GovPanel.vue'
defineProps({
    title: { type: String, required: true },
    updated: { type: String, default: '' },
})
</script>

<template>
    <div class="page">
        <Breadcrumb :items="[{ label: '首页', to: '/' }, { label: title }]" />
        <GovPanel :title="title">
            <p v-if="updated" class="doc-updated">最近更新：{{ updated }}</p>
            <article class="doc-body">
                <slot />
            </article>
        </GovPanel>
    </div>
</template>

<style scoped>
.doc-body :deep(blockquote) {
    border-left: 3px solid var(--gov-blue-deep);
    background: var(--gov-bg-blue);
    padding: var(--gov-gap-md) var(--gov-gap-lg);
    margin: var(--gov-gap-md) 0;
    color: var(--gov-text-sub);
    font-family: var(--gov-font-serif);
    line-height: 2;
}

.doc-body :deep(blockquote p) {
    margin: 0;
    text-align: center;
}

.doc-body :deep(code) {
    font-family: var(--gov-font-num);
    font-size: .92em;
    background: var(--gov-bg-gray);
    padding: 1px 5px;
    border: 1px solid var(--gov-border);
    border-radius: var(--gov-radius-sm);
}

.doc-body :deep(a) {
    color: var(--gov-blue);
    text-decoration: none;
}

.doc-body :deep(a:hover) {
    text-decoration: underline;
}

.doc-body :deep(a[target="_blank"])::after {
    content: " ↗";
    font-size: 0.85em;
    color: var(--gov-text-muted);
}

/* 表格里 th 是左侧标签列，稍微窄一点、居右对齐更好看 */
.doc-body :deep(th) {
    background: var(--gov-bg-gray);
    color: var(--gov-blue-deep);
    font-weight: 700;
    width: auto;
}

/* 链接 */
.doc-body :deep(a) {
    color: var(--gov-blue);
    text-decoration: none;
}

.doc-body :deep(a:hover) {
    text-decoration: underline;
}

/* 行内代码 */
.doc-body :deep(code) {
    font-family: var(--gov-font-num);
    font-size: .92em;
    background: var(--gov-bg-gray);
    padding: 1px 5px;
    border: 1px solid var(--gov-border);
    border-radius: var(--gov-radius-sm);
}

/* 引用块 */
.doc-body :deep(blockquote) {
    border-left: 3px solid var(--gov-blue-deep);
    background: var(--gov-bg-blue);
    padding: var(--gov-gap-md) var(--gov-gap-lg);
    margin: var(--gov-gap-md) 0;
    color: var(--gov-text-sub);
    line-height: 2;
}

/* 嵌套列表：内层用空心点，缩进一档 */
.doc-body :deep(ul ul) {
    list-style: circle;
    margin-top: 4px;
}

.doc-body :deep(ul ul li) {
    font-size: 13px;
    color: var(--gov-text-sub);
}

/* 表格首列 th 左对齐、稍窄 */
.doc-body :deep(table th:first-child) {
    white-space: nowrap;
}

.doc-body :deep(h2) {
    font-size: var(--gov-fs-lg);
    color: var(--gov-blue-deep);
    margin: var(--gov-gap-xl) 0 var(--gov-gap-md);
    padding-left: var(--gov-gap-sm);
    border-left: 3px solid var(--gov-blue-deep);
    /* 用深蓝而不是 --gov-blue */
    font-family: var(--gov-font-title);
}

.doc-updated {
    font-size: var(--gov-fs-xs);
    color: var(--gov-text-muted);
    padding-bottom: var(--gov-gap-md);
    border-bottom: 1px dashed var(--gov-border);
    margin-bottom: var(--gov-gap-lg);
}

.doc-body :deep(h2) {
    font-size: var(--gov-fs-lg);
    color: var(--gov-blue-deep);
    margin: var(--gov-gap-xl) 0 var(--gov-gap-md);
    padding-left: var(--gov-gap-sm);
    border-left: 3px solid var(--gov-blue);
}

.doc-body :deep(h2:first-child) {
    margin-top: 0;
}

.doc-body :deep(h3) {
    font-size: var(--gov-fs-md);
    color: var(--gov-text);
    margin: var(--gov-gap-lg) 0 var(--gov-gap-sm);
}

.doc-body :deep(p) {
    margin-bottom: var(--gov-gap-md);
    line-height: 1.9;
}

.doc-body :deep(ul),
.doc-body :deep(ol) {
    padding-left: 1.5em;
    margin-bottom: var(--gov-gap-md);
}

.doc-body :deep(ul) {
    list-style: disc;
}

.doc-body :deep(ol) {
    list-style: decimal;
}

.doc-body :deep(li) {
    margin-bottom: var(--gov-gap-xs);
    line-height: 1.9;
}

.doc-body :deep(table) {
    width: 100%;
    border-collapse: collapse;
    margin: var(--gov-gap-md) 0;
    border: 1px solid var(--gov-border);
}

.doc-body :deep(th),
.doc-body :deep(td) {
    border: 1px solid var(--gov-border);
    padding: .7rem;
    text-align: left;
    font-size: var(--gov-fs-sm);
}

.doc-body :deep(th) {
    background: var(--gov-bg-gray);
    color: var(--gov-blue-deep);
    font-weight: 700;
}
</style>