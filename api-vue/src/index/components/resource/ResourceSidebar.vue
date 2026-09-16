<script setup>
import { computed } from 'vue'
import { listedResources, resourceCategories, resourcePlatforms } from '@/index/resources'
import GovPanel from '@/index/components/common/GovPanel.vue'

const catCount = computed(() =>
    resourceCategories.map(c => ({
        name: c,
        count: listedResources.filter(r => r.category === c).length,
    }))
)

const platformCount = computed(() =>
    resourcePlatforms.map(p => ({
        name: p,
        count: listedResources.filter(r => r.platforms.includes(p)).length,
    }))
)

const hot = computed(() => listedResources.slice(0, 5))
</script>

<template>
    <aside class="sidebar">
        <GovPanel title="资源分类" v-if="catCount.length">
            <ul class="list">
                <li v-for="c in catCount" :key="c.name">
                    <router-link :to="`/resources?category=${encodeURIComponent(c.name)}`" class="list__link">
                        <span>{{ c.name }}</span>
                        <span class="list__count">{{ c.count }}</span>
                    </router-link>
                </li>
            </ul>
        </GovPanel>

        <GovPanel title="支持平台" v-if="platformCount.length">
            <div class="tagcloud">
                <router-link v-for="p in platformCount" :key="p.name"
                    :to="`/resources?platform=${encodeURIComponent(p.name)}`" class="tagcloud__item">{{ p.name }} ({{
                        p.count }})</router-link>
            </div>
        </GovPanel>

        <GovPanel title="最新收录" v-if="hot.length">
            <ol class="hot">
                <li v-for="(r, i) in hot" :key="r.slug">
                    <span class="hot__idx" :class="{ 'is-top': i < 3 }">{{ i + 1 }}</span>
                    <router-link :to="`/resources/${r.slug}`" class="hot__link">
                        {{ r.title }}
                    </router-link>
                </li>
            </ol>
        </GovPanel>

        <GovPanel title="常用办事通道" tone="red">
            <a class="volume" href="//online.undz.cn">账户中心</a>
            <a class="volume" href="//console.undz.cn">控制台</a>
            <a class="volume" href="//chat.undz.cn">在线聊天</a>
            <a class="volume" href="//ai.undz.cn">人工智能</a>
        </GovPanel>
    </aside>
</template>

<style scoped>
.list__link {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--gov-gap-sm) 0;
    border-bottom: 1px dashed var(--gov-border);
    font-size: var(--gov-fs-sm);
}

.list li:last-child .list__link {
    border-bottom: none;
}

.list__link:hover {
    color: var(--gov-blue);
    text-decoration: none;
}

.list__count {
    color: var(--gov-text-muted);
    font-size: var(--gov-fs-xs);
}

.tagcloud {
    display: flex;
    flex-wrap: wrap;
    gap: var(--gov-gap-sm);
}

.tagcloud__item {
    font-size: var(--gov-fs-xs);
    padding: 2px var(--gov-gap-sm);
    background: var(--gov-bg-gray);
    border: 1px solid var(--gov-border);
    color: var(--gov-text-sub);
    border-radius: var(--gov-radius-sm);
}

.tagcloud__item:hover {
    background: var(--gov-blue-light);
    color: var(--gov-blue-deep);
    border-color: var(--gov-border-blue);
    text-decoration: none;
}

.hot li {
    display: flex;
    align-items: center;
    gap: var(--gov-gap-sm);
    padding: var(--gov-gap-sm) 0;
    border-bottom: 1px dashed var(--gov-border);
    font-size: var(--gov-fs-sm);
}

.hot li:last-child {
    border-bottom: none;
}

.hot__idx {
    flex: none;
    width: 18px;
    height: 18px;
    line-height: 18px;
    text-align: center;
    font-size: 11px;
    background: var(--gov-bg-gray);
    color: var(--gov-text-muted);
    border-radius: var(--gov-radius-sm);
}

.hot__idx.is-top {
    background: var(--gov-red);
    color: #fff;
}

.hot__link {
    color: var(--gov-text);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.hot__link:hover {
    color: var(--gov-blue);
}

a.volume {
    border-bottom: 1px dashed var(--gov-border);
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 9px 6px;
    cursor: pointer;
    color: #333;
}

a.volume::before {
    content: "";
    flex: none;
    width: 0;
    height: 0;
    border-top: 4px solid transparent;
    border-bottom: 4px solid transparent;
    border-left: 6px solid var(--gov-blue);
}

a.volume:hover {
    background: var(--gov-bg-blue);
    color: var(--gov-blue-deep);
}
</style>