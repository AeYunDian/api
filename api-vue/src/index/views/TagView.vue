<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { getPostsByTag } from '@/index/content'
import GovPanel from '@/index/components/common/GovPanel.vue'
import Breadcrumb from '@/index/components/common/Breadcrumb.vue'
import ArticleItem from '@/index/components/blog/ArticleItem.vue'
import ArticleSidebar from '@/index/components/blog/ArticleSidebar.vue'

const route = useRoute()
const slug = computed(() => decodeURIComponent(route.params.slug))
const list = computed(() => getPostsByTag(slug.value))
</script>

<template>
    <div class="page">
        <Breadcrumb :items="[
            { label: '首页', to: '/' },
            { label: '标签' },
            { label: slug }
        ]" />
        <div class="layout-2col">
            <GovPanel :title="`标签：${slug}`">
                <template #header><span class="hint">共 {{ list.length }} 篇</span></template>
                <ArticleItem v-for="p in list" :key="p.slug" :post="p" />
                <div v-if="!list.length" class="empty">该标签下暂无文章</div>
            </GovPanel>
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