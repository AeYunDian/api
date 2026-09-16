<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { listedResources, resourceCategories, resourcePlatforms } from '@/index/resources'
import GovPanel from '@/index/components/common/GovPanel.vue'
import Breadcrumb from '@/index/components/common/Breadcrumb.vue'
import Pagination from '@/index/components/common/Pagination.vue'
import ResourceCard from '@/index/components/resource/ResourceCard.vue'
import ResourceSidebar from '@/index/components/resource/ResourceSidebar.vue'

const route = useRoute()

const page = ref(1)
const SIZE = 9

const keyword = ref((route.query.q ?? '').toString())
const activeCategory = ref('')
const activePlatform = ref('')

const filtered = computed(() => {
    let list = listedResources
    if (activeCategory.value) {
        list = list.filter(r => r.category === activeCategory.value)
    }
    if (activePlatform.value) {
        list = list.filter(r => r.platforms.includes(activePlatform.value))
    }
    const q = keyword.value.trim().toLowerCase()
    if (q) {
        list = list.filter(r =>
            r.title.toLowerCase().includes(q) ||
            r.summary.toLowerCase().includes(q) ||
            r.tags.some(t => t.toLowerCase().includes(q)) ||
            r.platforms.some(p => p.toLowerCase().includes(q))
        )
    }
    return list
})

const paged = computed(() =>
    filtered.value.slice((page.value - 1) * SIZE, page.value * SIZE)
)

watch(
    [() => route.query.q, activeCategory, activePlatform],
    () => { page.value = 1 }
)

function resetFilters() {
    keyword.value = ''
    activeCategory.value = ''
    activePlatform.value = ''
    page.value = 1
}
</script>

<template>
    <div class="page">
        <Breadcrumb :items="[{ label: '首页', to: '/' }, { label: '资源' }]" />

        <section class="res-banner">
            <h2 class="res-banner__title">资源库</h2>
            <p class="res-banner__sub">收录开发工具、组件库与常用软件，按分类与平台整理。</p>
        </section>

        <div class="layout-2col">
            <div>
                <GovPanel title="资源筛选">
                    <div class="filters">
                        <div class="filters__row">
                            <span class="filters__label">关键词</span>
                            <input v-model="keyword" class="gov-input filters__input" type="search"
                                placeholder="搜索资源名称、标签或平台" />
                        </div>

                        <div class="filters__row">
                            <span class="filters__label">分类</span>
                            <div class="filters__chips">
                                <button class="chip" :class="{ 'is-active': !activeCategory }"
                                    @click="activeCategory = ''">全部</button>
                                <button v-for="c in resourceCategories" :key="c" class="chip"
                                    :class="{ 'is-active': activeCategory === c }" @click="activeCategory = c">{{ c
                                    }}</button>
                            </div>
                        </div>

                        <div class="filters__row">
                            <span class="filters__label">平台</span>
                            <div class="filters__chips">
                                <button class="chip" :class="{ 'is-active': !activePlatform }"
                                    @click="activePlatform = ''">全部</button>
                                <button v-for="p in resourcePlatforms" :key="p" class="chip"
                                    :class="{ 'is-active': activePlatform === p }" @click="activePlatform = p">{{ p
                                    }}</button>
                            </div>
                        </div>

                        <div class="filters__actions">
                            <button class="filters__reset" @click="resetFilters">重置筛选</button>
                        </div>
                    </div>
                </GovPanel>

                <GovPanel title="资源列表">
                    <template #header>
                        <span class="hint">共 {{ filtered.length }} 项</span>
                    </template>

                    <div v-if="paged.length" class="res-list">
                        <ResourceCard v-for="r in paged" :key="r.slug" :resource="r" />
                    </div>
                    <div v-else class="empty">暂无匹配的资源</div>

                    <Pagination v-if="filtered.length > SIZE" :page="page" :total="filtered.length" :size="SIZE"
                        @change="p => (page = p)" />
                </GovPanel>
            </div>

            <ResourceSidebar />
        </div>
    </div>
</template>

<style scoped>
.res-banner {
    background: var(--gov-bg);
    border: 1px solid var(--gov-border);
    border-top: 3px solid var(--gov-blue-deep);
    padding: var(--gov-gap-xl);
    margin-bottom: var(--gov-gap-xl);
}

.res-banner__title {
    font-family: var(--gov-font-title);
    font-size: var(--gov-fs-2xl);
    color: var(--gov-blue-deep);
    letter-spacing: 4px;
    margin-bottom: var(--gov-gap-sm);
}

.res-banner__sub {
    color: var(--gov-text-sub);
    font-size: var(--gov-fs-sm);
    letter-spacing: .5px;
}

/* 筛选区 */
.filters {
    display: flex;
    flex-direction: column;
    gap: var(--gov-gap-md);
}

.filters__row {
    display: flex;
    align-items: flex-start;
    gap: var(--gov-gap-md);
}

.filters__label {
    flex: none;
    width: 56px;
    padding-top: 6px;
    font-size: var(--gov-fs-sm);
    color: var(--gov-text-sub);
}

.filters__input {
    max-width: 360px;
}

.filters__chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--gov-gap-sm);
    flex: 1;
}

.filters__actions {
    text-align: right;
}

.filters__reset {
    font-size: var(--gov-fs-sm);
    color: var(--gov-blue);
    padding: 2px 6px;
}

.filters__reset:hover {
    text-decoration: underline;
}

/* 标签 chip */
.chip {
    padding: 3px 12px;
    font-size: var(--gov-fs-xs);
    background: var(--gov-bg-gray);
    border: 1px solid var(--gov-border);
    color: var(--gov-text-sub);
    border-radius: var(--gov-radius-sm);
    transition: all .15s;
}

.chip:hover {
    border-color: var(--gov-blue);
    color: var(--gov-blue);
}

.chip.is-active {
    background: var(--gov-blue-deep);
    border-color: var(--gov-blue-deep);
    color: #fff;
}

.res-list {
    padding: var(--gov-gap-sm) 0;
}

@media (min-width: 1100px) {
    .res-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }
}

@media (max-width: 700px) {
    .res-grid {
        grid-template-columns: 1fr;
    }

    .filters__row {
        flex-direction: column;
        gap: var(--gov-gap-sm);
    }

    .filters__label {
        width: auto;
        padding-top: 0;
    }
}

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