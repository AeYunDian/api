<script setup>
import { computed } from 'vue'
import { posts, categories, tags } from '@/index/content'
import GovPanel from '@/index/components/common/GovPanel.vue'

const catCount = computed(() => categories.map(c => ({ name: c, count: posts.filter(p => p.category === c).length })))
const tagList = computed(() => tags.map(t => ({ name: t, count: posts.filter(p => p.tags.includes(t)).length })))
const hot = computed(() => [...posts].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5))
</script>

<template>
    <aside class="sidebar">
        <GovPanel title="文章分类">
            <ul class="list">
                <li v-for="c in catCount" :key="c.name">
                    <router-link :to="`/categories/${encodeURIComponent(c.name)}`" class="list__link">
                        <span>{{ c.name }}</span><span class="list__count">{{ c.count }}</span>
                    </router-link>
                </li>
            </ul>
        </GovPanel>

        <GovPanel title="标签云">
            <div class="tagcloud">
                <router-link v-for="t in tagList" :key="t.name" :to="`/tags/${encodeURIComponent(t.name)}`"
                    class="tagcloud__item">{{ t.name }} ({{ t.count }})</router-link>
            </div>
        </GovPanel>

        <GovPanel title="最新发布">
            <ol class="hot">
                <li v-for="(p, i) in hot" :key="p.slug">
                    <span class="hot__idx" :class="{ 'is-top': i < 3 }">{{ i + 1 }}</span>
                    <router-link :to="`/articles/${p.slug}`" class="hot__link">{{ p.title }}</router-link>
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

a.volume:hover {
    background: var(--gov-bg-blue);
    color: var(--gov-blue-deep);
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

a.volume::before {
    content: "";
    font-size: 14px;
    list-style: none;
    flex: none;
    width: 0;
    height: 0;
    border-top: 4px solid transparent;
    border-bottom: 4px solid transparent;
    border-left: 6px solid var(--gov-blue);
}

.hot__link {
    color: var(--gov-text);
    display: -webkit-box;
    line-clamp: 2;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.hot__link:hover {
    color: var(--gov-blue);
}
</style>