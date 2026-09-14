<script setup>
import { computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPost, getRecent, renderMarkdown, bindMarkdownTabs, posts } from '@/index/content'
import GovPanel from '@/index/components/common/GovPanel.vue'
import Breadcrumb from '@/index/components/common/Breadcrumb.vue'
import '@/index/styles/markdown.css'

const route = useRoute()
const router = useRouter()
const post = computed(() => getPost(route.params.slug))
const html = computed(() => post.value ? renderMarkdown(post.value.content) : '')

/* ★ 新增：渲染后绑定 Tabs 交互 */
function bindTabs() {
    nextTick(() => bindMarkdownTabs())
}
onMounted(bindTabs)
watch(html, bindTabs)

const related = computed(() => {
    if (!post.value) return []
    const cur = post.value
    const others = posts.filter(p => p.slug !== cur.slug)
    if (!others.length) return []

    // 1) 打分：同分类 +10，每共同标签 +3
    const scored = others.map(p => {
        let score = 0
        if (p.category === cur.category) score += 10
        const common = p.tags.filter(t => cur.tags.includes(t))
        score += common.length * 3
        return { post: p, score }
    })

    // 2) 按分数降序，同分按日期降序
    scored.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score
        return b.post.date.localeCompare(a.post.date)
    })

    // 3) 先取有分数（真正相关）的，不足 3 篇再用最新的补齐
    const picked = scored.filter(x => x.score > 0).slice(0, 3).map(x => x.post)
    if (picked.length < 3) {
        const taken = new Set(picked.map(p => p.slug))
        const fill = others
            .filter(p => !taken.has(p.slug))
            .sort((a, b) => b.date.localeCompare(a.date))
            .slice(0, 3 - picked.length)
        picked.push(...fill)
    }

    return picked
})
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

                <article class="md-body art-body" v-html="html" />

                <footer class="art-foot">
                    <button class="art-foot__btn" @click="router.back()">‹ 返回上一页</button>
                    <router-link to="/articles" class="art-foot__btn">文章列表</router-link>
                </footer>
            </GovPanel>

            <aside class="sidebar" v-if="related.length">
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
    border: 1px solid var(--gov-border-deep);
    background: var(--gov-bg);
    color: var(--gov-text);
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