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

const items = [
    { label: '应用名称', value: 'AyConsole' },
    { label: '运行环境', value: isProd ? '生产' : '开发' },
    { label: '构建模式', value: mode },
    { label: '基础路径', value: baseUrl },
    { label: '目标网址', value: isProd ? 'https://console.undz.cn' : 'https://console-dev.undz.cn' },
    { label: '构建时间', value: buildTime },
]

const links = [
]

function openLink(path) {
    const base = isProd ? 'https://console.undz.cn' : 'https://console-dev.undz.cn'
    window.open(`${base}${path}`)
}
</script>

<template>
    <div class="about-page">
        <div class="about-header">
            <h2>关于</h2>
        </div>

        <var-card class="about-card var-elevation--2">
            <div class="brand">
                <div>
                    <div class="brand-name">AyConsole</div>
                    <div class="brand-desc">OAuth 应用与反馈管理控制台</div>
                </div>
            </div>

            <var-divider />

            <var-cell v-for="item in items" :key="item.label" :title="item.label">
                <template #description>
                    <span class="cell-value">{{ item.value }}</span>
                </template>
            </var-cell>
        </var-card>

        <var-card class="about-card var-elevation--2" v-if="links.length > 0">
            <div class="section-title">相关文档</div>
            <var-cell v-for="link in links" :key="link.path" :title="link.label" :border="true" v-ripple
                class="link-cell" @click="openLink(link.path)">
                <template #right-icon>
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
    padding-bottom: 40px;
}

.about-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}

.about-header h2 {
    margin: 0;
}

.about-card {
    margin-bottom: 16px;
}

.brand {
    margin-left: 8px;
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 8px 0;
}


.brand-name {
    font-size: 18px;
    font-weight: 600;
}

.brand-desc {
    font-size: 13px;
    color: var(--color-text-secondary);
    margin-top: 4px;
}

.section-title {
    font-size: 15px;
    font-weight: 600;
    margin-bottom: 4px;
}

.cell-value {
    color: var(--color-text-secondary);
    font-size: 13px;
}

.link-cell {
    user-select: none;
    cursor: pointer;
}

.copyright {
    text-align: center;
    font-size: 14px;
    color: var(--color-text-secondary);
    margin-top: 24px;
}
</style>