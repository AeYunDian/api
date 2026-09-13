<script setup>
defineProps({
    variant: { type: String, default: 'primary' },
    size: { type: String, default: 'md' },
    block: { type: Boolean, default: false },
})
</script>

<template>
    <button class="gbtn" :class="[`gbtn--${variant}`, `gbtn--${size}`, { 'gbtn--block': block }]">
        <slot />
    </button>
</template>

<style scoped>
.gbtn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--gov-gap-xs);
    border: 1px solid transparent;
    border-radius: var(--gov-radius);
    font-size: var(--gov-fs-base);
    letter-spacing: 1px;
    transition: background .15s, border-color .15s, color .15s;
}

.gbtn--sm {
    height: 28px;
    padding: 0 var(--gov-gap-md);
    font-size: var(--gov-fs-xs);
}

.gbtn--md {
    height: 34px;
    padding: 0 var(--gov-gap-xl);
}

.gbtn--block {
    width: 100%;
}

.gbtn--primary {
    background: var(--gov-btn-primary);
    /* #0069c5 */
    border: 1px solid #0b4a85;
    /* ★ 深色描边 */
    color: #fff;
    font-weight: bold;
    font-family: var(--gov-font-title);
    letter-spacing: 2px;
}

.gbtn--primary:hover {
    background: var(--gov-btn-primary-hover);
}

.gbtn--danger {
    background: var(--gov-btn-red);
    /* #e4393c */
    border-color: #a00b0b;
}

.gbtn--danger:hover {
    background: var(--gov-btn-red-hover);
}

.gbtn--default {
    background: var(--gov-btn-gray);
    /* #e0e0e0 */
    border-color: #999;
    color: #333;
}

.gbtn--default:hover {
    background: var(--gov-btn-gray-hover);
}
</style>