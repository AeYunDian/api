<script setup>
import { computed } from 'vue'
const props = defineProps({
    page: { type: Number, required: true },
    total: { type: Number, required: true },
    size: { type: Number, default: 6 },
})
const emit = defineEmits(['change'])
const pageCount = computed(() => Math.max(1, Math.ceil(props.total / props.size)))
const pages = computed(() => {
    const p = props.page, n = pageCount.value, arr = []
    const push = v => arr.push(v)
    if (n <= 7) { for (let i = 1; i <= n; i++) push(i); return arr }
    push(1)
    if (p > 3) push('…')
    for (let i = Math.max(2, p - 1); i <= Math.min(n - 1, p + 1); i++) push(i)
    if (p < n - 2) push('…')
    push(n)
    return arr
})
function go(p) {
    if (p === '…' || p === props.page) return
    if (p < 1 || p > pageCount.value) return
    emit('change', p)
}
</script>

<template>
    <div class="pager">
        <button class="pager__btn" :disabled="page <= 1" @click="go(page - 1)">上一页</button>
        <button v-for="(p, i) in pages" :key="i" class="pager__btn"
            :class="{ 'is-active': p === page, 'is-gap': p === '…' }" :disabled="p === '…'" @click="go(p)">{{ p
            }}</button>
        <button class="pager__btn" :disabled="page >= pageCount" @click="go(page + 1)">下一页</button>
        <span class="pager__info">共 {{ total }} 条 / {{ pageCount }} 页</span>
    </div>
</template>

<style scoped>
.pager {
    display: flex;
    align-items: center;
    gap: var(--gov-gap-xs);
    padding: var(--gov-gap-lg) 0;
    flex-wrap: wrap;
}

.pager__btn {
    min-width: 32px;
    height: 30px;
    padding: 0 var(--gov-gap-sm);
    border: 1px solid var(--gov-border);
    background: var(--gov-bg);
    color: var(--gov-text);
    font-size: var(--gov-fs-sm);
    border-radius: var(--gov-radius);
}

.pager__btn:hover:not(:disabled) {
    color: var(--gov-blue);
    border-color: var(--gov-blue);
}

.pager__btn.is-active {
    background: var(--gov-blue);
    color: #fff;
    border-color: var(--gov-blue);
}

.pager__btn:disabled {
    color: var(--gov-text-muted);
    cursor: not-allowed;
    background: var(--gov-bg-gray);
}

.pager__btn.is-gap {
    border: none;
    background: transparent;
}

.pager__info {
    margin-left: auto;
    font-size: var(--gov-fs-xs);
    color: var(--gov-text-muted);
}
</style>