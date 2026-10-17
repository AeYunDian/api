<script setup>
import { computed } from 'vue'
import { formatTime } from '@/shared/utils/format'
const mode = import.meta.env.MODE
const isProd = import.meta.env.PROD
const baseUrl = import.meta.env.BASE_URL

const buildTime = computed(() => {
    const raw = import.meta.env.VITE_BUILD_TIME
    return raw ? formatTime(raw) : '未注入'
})

const items = computed(() => [
    { label: '应用名称', value: 'AyConsole' },
    { label: '运行环境', value: isProd ? '生产' : '开发' },
    { label: '构建模式', value: mode },
    { label: '基础路径', value: baseUrl },
    { label: '目标网址', value: isProd ? 'https://console.undz.cn' : 'https://console-dev.undz.cn' },
    { label: '构建时间', value: buildTime.value },
])

const links = []

function openLink(path) {
    const base = isProd ? 'https://console.undz.cn' : 'https://console-dev.undz.cn'
    window.open(`${base}${path}`)
}
</script>

<template>
    <div class="about-page">
        <div class="md-page-header">
            <div class="md-page-heading">
                <h1 class="md-page-title">关于</h1>
                <p class="md-page-subtitle">OAuth 应用与反馈管理控制台</p>
            </div>
        </div>

        <var-card class="about-card">
            <template #title="{ slotClass }">
                <div :class="slotClass" class="md-card-header">
                    <my-icon icon="console-line" size="1.2em" />
                    <span class="md-card-title">AyConsole</span>
                </div>
            </template>

            <div class="meta-list">
                <div v-for="item in items" :key="item.label" class="meta-row">
                    <span class="meta-row__label">{{ item.label }}</span>
                    <span class="meta-row__value">{{ item.value }}</span>
                </div>
            </div>
        </var-card>

        <var-card class="about-card" v-if="links.length > 0">
            <template #title="{ slotClass }">
                <div :class="slotClass" class="md-card-header">
                    <my-icon icon="file-document-outline" size="1.2em" />
                    <span class="md-card-title">相关文档</span>
                </div>
            </template>
            <var-cell v-for="link in links" :key="link.path" :title="link.label" :border="true" v-ripple
                class="link-cell" @click="openLink(link.path)">
                <template #extra>
                    <my-icon icon="arrow-right" />
                </template>
            </var-cell>
        </var-card>

        <p class="copyright">
            © {{ new Date().getFullYear() }} AyConsole · All rights reserved.
        </p>
    </div>
</template>

<style scoped>
.about-page {
    padding-bottom: var(--md-space-8);
}

.about-card {
    margin-bottom: var(--md-space-4);
}

.meta-list {
    display: flex;
    flex-direction: column;
}

.meta-row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--md-space-6);
    padding: var(--md-space-3) 0;
    border-bottom: 1px solid var(--color-outline);
}

.meta-row:last-child {
    border-bottom: none;
    padding-bottom: 0;
}

.meta-row__label {
    font-size: 13px;
    line-height: 20px;
    color: var(--color-text-secondary);
    flex: 0 0 auto;
}

.meta-row__value {
    font-size: 13px;
    line-height: 20px;
    color: var(--color-text);
    text-align: right;
    word-break: break-all;
}

.link-cell {
    border-radius: var(--md-shape-sm);
    cursor: pointer;
}

.copyright {
    margin-top: var(--md-space-6);
    text-align: center;
    font-size: 12px;
    line-height: 16px;
    letter-spacing: 0.4px;
    color: var(--color-text-secondary);
}
</style>
