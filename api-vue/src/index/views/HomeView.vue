<script setup>
import { computed } from 'vue'
import { site } from '@/index/data/site'
import { getFeatured, getRecent } from '@/index/content'
import GovPanel from '@/index/components/common/GovPanel.vue'
import ArticleItem from '@/index/components/blog/ArticleItem.vue'
import ArticleSidebar from '@/index/components/blog/ArticleSidebar.vue'

const featured = computed(() => getFeatured())
const recent = computed(() => getRecent(6))
</script>

<template>
    <div class="page">
        <section class="banner">
            <h2 class="banner__title">{{ site.name }} 正式上线运行</h2>
            <p class="banner__sub">{{ site.slogan }}</p>
        </section>

        <div class="layout-2col">
            <div>
                <GovPanel title="推荐阅读" tone="red">
                    <ArticleItem v-for="p in featured" :key="p.slug" :post="p" />
                </GovPanel>

                <GovPanel title="最新发布">
                    <ArticleItem v-for="p in recent" :key="p.slug" :post="p" />
                    <div class="more"><router-link to="/articles" class="more__link">查看更多文章 ›</router-link></div>
                </GovPanel>
            </div>
            <ArticleSidebar />
        </div>
    </div>
</template>

<style scoped>
.banner {
    background: var(--gov-bg);
    border: 1px solid var(--gov-border);
    padding: var(--gov-gap-xl);
    margin-bottom: var(--gov-gap-xl);
    text-align: left;
}

.banner__title {
    font-size: var(--gov-fs-2xl);
    color: var(--gov-blue-deep);
    letter-spacing: 4px;
}

.banner__sub {
    color: var(--gov-text-sub);
    margin-top: var(--gov-gap-sm);
    letter-spacing: 1px;
}

.more {
    text-align: right;
    padding-top: var(--gov-gap-md);
    border-top: 1px dashed var(--gov-border);
}

.more__link {
    font-size: var(--gov-fs-sm);
    color: var(--gov-blue);
}
</style>