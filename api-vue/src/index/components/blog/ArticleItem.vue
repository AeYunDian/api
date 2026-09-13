<script setup>
defineProps({ post: { type: Object, required: true } })
</script>

<template>
    <article class="post-item">
        <div class="post-item__main">
            <h3 class="post-item__title">
                <router-link :to="`/articles/${post.slug}`">{{ post.title }}</router-link>
            </h3>
            <p class="post-item__summary">{{ post.summary }}</p>
            <div class="post-item__meta">
                <span class="post-item__tag">{{ post.category }}</span>
                <span v-for="t in post.tags" :key="t" class="post-item__tag post-item__tag--light">{{ t }}</span>
            </div>
        </div>
        <div class="post-item__side">
            <time class="post-item__date">{{ post.date }}</time>
            <span class="post-item__views">约 {{ post.readingMinutes }} 分钟</span>
        </div>
    </article>
</template>

<style scoped>
.post-item {
    display: flex;
    justify-content: space-between;
    gap: var(--gov-gap-lg);
    padding: var(--gov-gap-lg) 0;
    border-bottom: 1px dashed var(--gov-border);
}

.post-item:last-child {
    border-bottom: none;
}

.post-item__title {
    font-size: var(--gov-fs-lg);
    line-height: 1.4;
    margin-bottom: var(--gov-gap-sm);
}

.post-item__title a {
    color: var(--gov-text);
}

.post-item__title a:hover {
    color: var(--gov-blue);
}

.post-item__summary {
    font-size: var(--gov-fs-sm);
    color: var(--gov-text-sub);
    line-height: 1.8;
    margin-bottom: var(--gov-gap-sm);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.post-item__meta {
    display: flex;
    flex-wrap: wrap;
    gap: var(--gov-gap-xs);
}

.post-item__tag {
    font-size: var(--gov-fs-xs);
    padding: 1px var(--gov-gap-sm);
    background: var(--gov-blue-light);
    color: var(--gov-blue-deep);
    border-radius: var(--gov-radius-sm);
}

.post-item__tag--light {
    background: var(--gov-bg-gray);
    color: var(--gov-text-sub);
}

.post-item__side {
    flex: none;
    width: 110px;
    text-align: right;
    display: flex;
    flex-direction: column;
    gap: var(--gov-gap-xs);
    font-size: var(--gov-fs-xs);
    color: var(--gov-text-muted);
}

.post-item__date {
    font-family: var(--gov-font-num);
}

@media (max-width: 600px) {
    .post-item {
        flex-direction: column;
    }

    .post-item__side {
        width: auto;
        text-align: left;
        flex-direction: row;
        gap: var(--gov-gap-md);
    }
}
</style>