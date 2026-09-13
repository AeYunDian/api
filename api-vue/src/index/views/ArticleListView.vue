<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { posts } from '@/index/content'
import GovPanel from '@/index/components/common/GovPanel.vue'
import Breadcrumb from '@/index/components/common/Breadcrumb.vue'
import Pagination from '@/index/components/common/Pagination.vue'
import ArticleItem from '@/index/components/blog/ArticleItem.vue'
import ArticleSidebar from '@/index/components/blog/ArticleSidebar.vue'

const route = useRoute()
const page = ref(1)
const SIZE = 6

const filtered = computed(() => {
    const q = (route.query.q ?? '').toString().trim().toLowerCase()
    if (!q) return posts
    return posts.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.summary.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q)))
})
const paged = computed(() => filtered.value.slice((page.value - 1) * SIZE, page.value * SIZE))

watch(() => route.query.q, () => { page.value = 1 })
</script>

<template>
    <div class="page">
        <Breadcrumb :items="[{ label: '首页', to: '/' }, { label: '文章列表' }]" />
        <div class="layout-2col">
            <div>
                <GovPanel title="文章列表">
                    <template #header><span class="hint">共 {{ filtered.length }} 篇</span></template>
                    <ArticleItem v-for="p in paged" :key="p.slug" :post="p" />
                    <div v-if="!paged.length" class="empty">暂无匹配的文章</div>
                    <Pagination :page="page" :total="filtered.length" :size="SIZE" @change="p => (page = p)" />
                </GovPanel>
            </div>
            <ArticleSidebar />
        </div>
    </div>
</template>

<style scoped>
.hint {
    font-size: var(--gov-fs-xs);
    color: var(--gov-text-muted);
}

.empty {
    padding: var(--gov-gap-2xl) 0;
    text-align: center;
    color: var(--gov-text-muted);
}
</style>