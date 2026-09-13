<script setup>
defineProps({ items: { type: Array, default: () => [] } })
</script>

<template>
    <nav class="crumb" aria-label="面包屑">
        <span class="crumb__lead">当前位置：</span>
        <template v-for="(it, i) in items" :key="i">
            <router-link v-if="it.to" :to="it.to" class="crumb__link">{{ it.label }}</router-link>
            <span v-else class="crumb__current">{{ it.label }}</span>
            <span v-if="i < items.length - 1" class="crumb__sep">›</span>
        </template>
    </nav>
</template>

<style scoped>
.crumb {
    font-size: var(--gov-fs-sm);
    color: var(--gov-text-sub);
    padding: var(--gov-gap-md) 0;
    border-bottom: 1px dashed var(--gov-border);
    margin-bottom: var(--gov-gap-lg);
}

.crumb__lead {
    color: var(--gov-text-muted);
}

.crumb__link {
    color: var(--gov-text-sub);
}

.crumb__link:hover {
    color: var(--gov-blue);
}

.crumb__current {
    color: var(--gov-text);
}

.crumb__sep {
    margin: 0 var(--gov-gap-sm);
    color: var(--gov-text-muted);
}
</style>