<script setup>
import { computed } from 'vue'
import { getArchive } from '@/index/content'
import GovPanel from '@/index/components/common/GovPanel.vue'
import Breadcrumb from '@/index/components/common/Breadcrumb.vue'

const grouped = computed(() => getArchive())
</script>

<template>
    <div class="page">
        <Breadcrumb :items="[{ label: '首页', to: '/' }, { label: '归档' }]" />
        <GovPanel title="文章归档">
            <div v-for="[year, list] in grouped" :key="year" class="year">
                <h3 class="year__title">{{ year }} 年 <span class="year__count">{{ list.length }} 篇</span></h3>
                <ul class="year__list">
                    <li v-for="p in list" :key="p.slug">
                        <time class="year__date">{{ p.date }}</time>
                        <router-link :to="`/articles/${p.slug}`" class="year__link">{{ p.title }}</router-link>
                    </li>
                </ul>
            </div>
        </GovPanel>
    </div>
</template>

<style scoped>
.year {
    padding: var(--gov-gap-md) 0;
}

.year__title {
    font-size: var(--gov-fs-md);
    color: var(--gov-blue-deep);
    padding-left: var(--gov-gap-sm);
    border-left: 3px solid var(--gov-blue);
    margin-bottom: var(--gov-gap-md);
}

.year__count {
    font-size: var(--gov-fs-xs);
    color: var(--gov-text-muted);
    font-weight: 400;
    margin-left: var(--gov-gap-sm);
}

.year__list li {
    display: flex;
    gap: var(--gov-gap-md);
    padding: var(--gov-gap-sm) 0;
    border-bottom: 1px dashed var(--gov-border);
}

.year__list li:last-child {
    border-bottom: none;
}

.year__date {
    flex: none;
    font-family: var(--gov-font-num);
    font-size: var(--gov-fs-xs);
    color: var(--gov-text-muted);
    width: 90px;
}

.year__link {
    font-size: var(--gov-fs-sm);
}
</style>