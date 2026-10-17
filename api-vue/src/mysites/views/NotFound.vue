<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
    <div class="not-found-page">
        <p class="not-found-code">404</p>
        <h1 class="not-found-title">页面不存在</h1>
        <p class="not-found-desc">你访问的页面不存在，或者链接已经失效。</p>

        <var-button type="primary" @click="router.push('/')">返回站点列表</var-button>
    </div>
</template>

<style scoped>
.not-found-page {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--md-space-2);
    min-height: calc(100vh - var(--md-app-bar-height) - var(--md-space-8));
    padding: var(--md-space-8) var(--md-space-4);
    text-align: center;
}

.not-found-code {
    margin: 0;
    font-size: 96px;
    line-height: 104px;
    font-weight: 400;
    letter-spacing: -1.5px;
    color: var(--color-primary);
}

.not-found-title {
    margin: 0;
    font-size: 24px;
    line-height: 32px;
    font-weight: 400;
    color: var(--color-text);
}

.not-found-desc {
    margin: 0 0 var(--md-space-4);
    font-size: 14px;
    line-height: 20px;
    letter-spacing: 0.25px;
    color: var(--color-text-secondary);
}
</style>
