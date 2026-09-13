<script setup>
defineProps({
    title: { type: String, default: '' },
    tone: { type: String, default: 'blue' },
})
</script>

<template>
    <section class="panel" :class="`panel--${tone}`">
        <header v-if="title || $slots.header" class="panel__head">
            <h2 class="panel__title">{{ title }}</h2>
            <div class="panel__extra">
                <slot name="header" />
            </div>
        </header>
        <div class="panel__body">
            <slot />
        </div>
    </section>
</template>

<style scoped>
.panel {
    background: var(--gov-bg);
    border: 1px solid var(--gov-border-deep);
    border-radius: 0;
    margin-bottom: var(--gov-gap-md);
}

/* ★ 关键：标题条 flex 布局 */
.panel__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-top: 3px solid var(--gov-blue-deep);
    border-bottom: 1px solid var(--gov-border-deep);
    background: #ffffff;
    color: var(--gov-blue-deep);
    height: 40px;
    padding: 0 10px;
}

.panel__title {
    font-family: var(--gov-font-title);
    font-size: 18px;
    font-weight: normal;
    letter-spacing: 0;
    color: inherit;
}

.panel__extra {
    font-size: var(--gov-fs-xs);
    color: var(--gov-text-muted);
}

.panel--red .panel__head {
    border-top-color: var(--gov-red-deep);
    color: var(--gov-red-deep);
}

.panel--gray .panel__head {
    border-top-color: #777777;
    color: #333333;
}

.panel__body {
    padding: var(--gov-gap-md);
}
</style>