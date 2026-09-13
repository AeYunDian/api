<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPost, getRecent, renderMarkdown } from '@/index/content'
import GovPanel from '@/index/components/common/GovPanel.vue'
import Breadcrumb from '@/index/components/common/Breadcrumb.vue'

const route = useRoute()
const router = useRouter()
const post = computed(() => getPost(route.params.slug))
const html = computed(() => post.value ? renderMarkdown(post.value.content) : '')
const related = computed(() => getRecent(6).filter(p => p.slug !== route.params.slug).slice(0, 3))
</script>

<template>
    <div class="page">
        <Breadcrumb :items="[
            { label: '首页', to: '/' },
            { label: '文章', to: '/articles' },
            { label: post?.title ?? '未找到' }
        ]" />

        <div v-if="post" class="layout-2col">
            <GovPanel>
                <header class="art-head">
                    <h1 class="art-title">{{ post.title }}</h1>
                    <div class="art-meta">
                        <span>分类：<router-link :to="`/categories/${encodeURIComponent(post.category)}`"
                                class="art-meta__link">{{ post.category }}</router-link></span>
                        <span class="art-meta__sep">|</span>
                        <span>标签：<router-link v-for="t in post.tags" :key="t" :to="`/tags/${encodeURIComponent(t)}`"
                                class="art-meta__link">{{ t }}</router-link></span>
                        <span class="art-meta__sep">|</span>
                        <time>{{ post.date }}</time>
                        <span class="art-meta__sep">|</span>
                        <span>约 {{ post.readingMinutes }} 分钟</span>
                    </div>
                </header>

                <article class="art-body" v-html="html" />

                <footer class="art-foot">
                    <button class="art-foot__btn" @click="router.back()">‹ 返回上一页</button>
                    <router-link to="/articles" class="art-foot__btn">文章列表</router-link>
                </footer>
            </GovPanel>

            <aside class="sidebar">
                <GovPanel title="相关阅读">
                    <ul class="rel">
                        <li v-for="r in related" :key="r.slug">
                            <router-link :to="`/articles/${r.slug}`" class="rel__link">{{ r.title }}</router-link>
                            <time class="rel__date">{{ r.date }}</time>
                        </li>
                    </ul>
                </GovPanel>
            </aside>
        </div>

        <GovPanel v-else title="提示">
            <p>文章不存在或已被删除。<router-link to="/articles">返回文章列表</router-link></p>
        </GovPanel>
    </div>
</template>

<style scoped>
.art-head {
    padding-bottom: var(--gov-gap-lg);
    border-bottom: 1px solid var(--gov-border);
    margin-bottom: var(--gov-gap-lg);
}

.art-title {
    font-size: var(--gov-fs-2xl);
    color: var(--gov-blue-deep);
    line-height: 1.4;
    margin-bottom: var(--gov-gap-md);
}

.art-meta {
    font-size: var(--gov-fs-xs);
    color: var(--gov-text-muted);
    display: flex;
    flex-wrap: wrap;
    gap: var(--gov-gap-sm);
}

.art-meta__sep {
    color: var(--gov-border-deep);
}

.art-meta__link {
    color: var(--gov-blue);
    margin-right: var(--gov-gap-xs);
}

.art-body :deep(h2) {
    font-size: var(--gov-fs-lg);
    color: var(--gov-blue-deep);
    margin: var(--gov-gap-xl) 0 var(--gov-gap-md);
    padding-left: var(--gov-gap-sm);
    border-left: 3px solid var(--gov-blue);
}

.art-body :deep(h3) {
    font-size: var(--gov-fs-md);
    margin: var(--gov-gap-lg) 0 var(--gov-gap-sm);
}

.art-body :deep(p) {
    margin-bottom: var(--gov-gap-md);
    line-height: 1.9;
}

.art-body :deep(ul),
.art-body :deep(ol) {
    padding-left: 1.6em;
    margin-bottom: var(--gov-gap-md);
}

.art-body :deep(ul) {
    list-style: disc;
}

.art-body :deep(ol) {
    list-style: decimal;
}

.art-body :deep(li) {
    margin-bottom: var(--gov-gap-xs);
    line-height: 1.9;
}

.art-body :deep(a) {
    color: var(--gov-blue);
}

.art-body :deep(code) {
    font-family: var(--gov-font-num);
    font-size: .92em;
    background: var(--gov-bg-gray);
    padding: 1px 5px;
    border: 1px solid var(--gov-border);
    border-radius: var(--gov-radius-sm);
}

.art-body :deep(pre) {
    background: #f5f7fa;
    border: 1px solid var(--gov-border);
    padding: var(--gov-gap-md);
    overflow-x: auto;
    margin-bottom: var(--gov-gap-md);
}

.art-body :deep(pre code) {
    background: none;
    border: none;
    padding: 0;
    font-size: var(--gov-fs-sm);
}

.art-body :deep(blockquote) {
    border-left: 3px solid var(--gov-blue);
    background: var(--gov-bg-gray);
    padding: var(--gov-gap-sm) var(--gov-gap-md);
    margin: var(--gov-gap-md) 0;
    color: var(--gov-text-sub);
}

.art-body :deep(table) {
    width: 100%;
    border-collapse: collapse;
    margin: var(--gov-gap-md) 0;
    border: 1px solid var(--gov-border);
}

.art-body :deep(th),
.art-body :deep(td) {
    border: 1px solid var(--gov-border);
    padding: .7rem;
    text-align: left;
    font-size: var(--gov-fs-sm);
}

.art-body :deep(th) {
    background: var(--gov-bg-gray);
    color: var(--gov-blue-deep);
    font-weight: 700;
}

.art-body :deep(img) {
    border: 1px solid var(--gov-border);
    margin: var(--gov-gap-md) 0;
}

.art-body :deep(hr) {
    border: none;
    border-top: 1px dashed var(--gov-border);
    margin: var(--gov-gap-xl) 0;
}

.art-foot {
    display: flex;
    gap: var(--gov-gap-md);
    padding-top: var(--gov-gap-lg);
    border-top: 1px solid var(--gov-border);
    margin-top: var(--gov-gap-xl);
}


.art-foot__btn {
    height: 30px;
    padding: 0 var(--gov-gap-lg);
    background: var(--gov-bg);
    align-items: center;
    display: flex;
    color: var(--gov-text);
    border: 1px solid var(--gov-border-deep);
    font-size: var(--gov-fs-sm);
    border-radius: var(--gov-radius);
}

.art-foot__btn:hover {
    color: var(--gov-blue);
    border-color: var(--gov-blue);
    text-decoration: none;
}

.rel li {
    padding: var(--gov-gap-sm) 0;
    border-bottom: 1px dashed var(--gov-border);
}

.rel li:last-child {
    border-bottom: none;
}

.rel__link {
    display: block;
    font-size: var(--gov-fs-sm);
    color: var(--gov-text);
    margin-bottom: 2px;
}

.rel__link:hover {
    color: var(--gov-blue);
}

.rel__date {
    font-size: var(--gov-fs-xs);
    color: var(--gov-text-muted);
    font-family: var(--gov-font-num);
}
</style>