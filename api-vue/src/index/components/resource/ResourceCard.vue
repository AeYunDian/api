<script setup>
import { computed } from 'vue'
import GovButton from '@/index/components/common/GovButton.vue'
const props = defineProps({
    resource: { type: Object, required: true },
})

const platforms = computed(() => props.resource.platforms ?? [])
</script>

<template>
    <article class="res-item">
        <!-- 上：主信息 -->
        <div class="res-item__main">
            <h3 class="res-item__title">
                <router-link :to="`/resources/${resource.slug}`">{{ resource.title }}</router-link>
                <span v-if="resource.version" class="res-item__version">{{ resource.version }}</span>
            </h3>

            <p class="res-item__summary">{{ resource.summary }}</p>

            <div class="res-item__row">
                <div class="res-item__meta">
                    <span class="res-item__tag res-item__tag--cat">{{ resource.category }}</span>
                    <span v-for="t in resource.tags" :key="t" class="res-item__tag">{{ t }}</span>
                </div>

                <div class="res-item__sub">
                    <span v-if="platforms.length" class="res-item__sub-item">
                        {{ platforms.join(' / ') }}
                    </span>
                    <span v-if="platforms.length && resource.size" class="res-item__sub-sep">·</span>
                    <span v-if="resource.size" class="res-item__sub-item res-num">{{ resource.size }}</span>
                    <span v-if="resource.license" class="res-item__sub-sep">·</span>
                    <span v-if="resource.license" class="res-item__sub-item">{{ resource.license }}</span>
                </div>
            </div>
        </div>

        <!-- 下：日期 + 详情 -->
        <footer class="res-item__bom">
            <time class="res-item__date">{{ resource.date }}</time>
            <router-link :to="`/resources/${resource.slug}`">
                <GovButton size="sm">详情</GovButton>
            </router-link>
        </footer>
    </article>
</template>

<style scoped>
.res-item {
    display: flex;
    flex-direction: column;
    gap: var(--gov-gap-md);
    padding: var(--gov-gap-lg) 0;
    border-bottom: 1px dashed var(--gov-border);
    transition: border-color .15s;
}

.res-item:last-child {
    border-bottom: none;
}

.res-item:hover {
    border-bottom-color: var(--gov-blue);
}

/* 主信息 */
.res-item__main {
    min-width: 0;
}

.res-item__title {
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: var(--gov-gap-sm);
    font-size: var(--gov-fs-lg);
    line-height: 1.4;
    margin-bottom: var(--gov-gap-sm);
}

.res-item__title a {
    color: var(--gov-text);
}

.res-item__title a:hover {
    color: var(--gov-blue);
}

.res-item__version {
    font-family: var(--gov-font-num);
    font-size: var(--gov-fs-xs);
    font-weight: 400;
    color: var(--gov-blue-deep);
    background: var(--gov-blue-light);
    padding: 1px 6px;
    border-radius: var(--gov-radius-sm);
    line-height: 1.5;
}

.res-item__summary {
    font-size: var(--gov-fs-sm);
    color: var(--gov-text-sub);
    line-height: 1.8;
    margin-bottom: var(--gov-gap-md);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

/* 标签 + 平台信息同一行，两端对齐 */
.res-item__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--gov-gap-md);
    flex-wrap: wrap;
}

.res-item__meta {
    display: flex;
    flex-wrap: wrap;
    gap: var(--gov-gap-xs);
    min-width: 0;
}

.res-item__tag {
    font-size: var(--gov-fs-xs);
    padding: 1px var(--gov-gap-sm);
    background: var(--gov-bg-gray);
    color: var(--gov-text-sub);
    border-radius: var(--gov-radius-sm);
}

.res-item__tag--cat {
    background: var(--gov-blue-light);
    color: var(--gov-blue-deep);
}

.res-item__sub {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--gov-gap-xs);
    font-size: var(--gov-fs-xs);
    color: var(--gov-text-muted);
    flex: none;
}

.res-item__sub-sep {
    color: var(--gov-border-deep);
}

.res-num {
    font-family: var(--gov-font-num);
}

/* 底部：日期 + 详情 */
.res-item__bom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--gov-gap-md);
    padding-top: var(--gov-gap-sm);
    border-top: 1px dashed var(--gov-border);
}

.res-item__date {
    font-family: var(--gov-font-num);
    font-size: var(--gov-fs-xs);
    color: var(--gov-text-muted);
}


/* 响应式 */
@media (max-width: 700px) {
    .res-item__row {
        flex-direction: column;
        align-items: flex-start;
    }

    .res-item__sub {
        flex: none;
    }
}
</style>