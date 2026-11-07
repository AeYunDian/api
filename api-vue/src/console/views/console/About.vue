<script setup>
import { computed, ref } from 'vue'
import { formatTime } from '@/shared/utils/format'
import { Snackbar } from '@varlet/ui' // 引入 Snackbar
const mode = import.meta.env.MODE
const isProd = import.meta.env.PROD
const baseUrl = import.meta.env.BASE_URL
const clickCount = ref(0)
let clickTimer = null
const buildTime = computed(() => {
    const raw = import.meta.env.VITE_BUILD_TIME
    return raw ? formatTime(raw) : '未注入'
})
const buildVersion = computed(() => {
    return import.meta.env.VITE_BUILD_VERSION || '未注入'
})
const devOptKey = `devopt-config`;
const items = computed(() => [
    { label: '应用名称', value: 'AyConsole' },
    { label: '运行环境', value: isProd ? '生产' : '开发' },
    { label: '构建模式', value: mode },
    { label: '基础路径', value: baseUrl },
    { label: '目标网址', value: isProd ? 'https://console.undz.cn' : 'https://console-dev.undz.cn' },
    { label: '版本号', value: buildVersion.value },
    { label: '构建时间', value: buildTime.value },
])

const links = []

function handleRowClick(item) {
    // 仅处理“版本号”这一项
    if (item.label !== '版本号') return

    if (localStorage.getItem(devOptKey) === '1') {
        Snackbar({ content: '您现在正处于开发者模式！', position: 'bottom' })
        return
    }

    clickCount.value++

    if (clickTimer) clearTimeout(clickTimer)
    clickTimer = setTimeout(() => {
        clickCount.value = 0
    }, 1500)

    if (clickCount.value >= 4 && clickCount.value <= 6) {
        const remain = 7 - clickCount.value
        //Snackbar.allowMultiple(true)
        Snackbar({ content: `现在只需再执行 ${remain} 步操作即可开启开发者模式`, position: 'bottom' })
    } else if (clickCount.value === 7) {
        clickCount.value = 0
        if (clickTimer) clearTimeout(clickTimer)

        let config = { devMode: false, vConsole: false };
        try {
            const raw = localStorage.getItem('devopt-config');
            if (raw) config = JSON.parse(raw);
        } catch (e) { }

        config.devMode = true;
        localStorage.setItem('devopt-config', JSON.stringify(config));

        Snackbar.success({ content: '您现在已处于开发者模式', position: 'bottom' });
        window.dispatchEvent(new Event('devmode-changed')); // 通知全局


    }
}
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

        <div class="custom-card var-elevation--1">
            <div class="meta-list">
                <div v-for="item in items" :key="item.label" class="meta-row" v-ripple @click="handleRowClick(item)">
                    <span class="meta-row__label">{{ item.label }}</span>
                    <span class="meta-row__value">{{ item.value }}</span>
                </div>
            </div>
        </div>

        <div class="custom-card" v-if="links.length > 0">
            <div class="custom-card-header">
                <my-icon icon="file-document-outline" size="1.2em" />
                <span class="custom-card-title">相关文档</span>
            </div>
            <var-cell v-for="link in links" :key="link.path" :title="link.label" :border="true" v-ripple
                class="link-cell" @click="openLink(link.path)">
                <template #extra>
                    <my-icon icon="arrow-right" />
                </template>
            </var-cell>
        </div>

        <p class="copyright">
            © {{ new Date().getFullYear() }} AyAccountCenter · All rights reserved.
        </p>
    </div>
</template>

<style scoped>
.about-page {
    padding-bottom: var(--md-space-8);
}

.md-page-title {
    font-weight: 600;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}

.custom-card {
    background: var(--color-surface, #fff);
    border-radius: var(--md-shape-lg, 16px);

    margin-bottom: var(--md-space-4);
    overflow: hidden;
}

.meta-list {
    display: flex;
    flex-direction: column;
}

.meta-row {
    user-select: none;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    gap: 4px;
    padding: var(--md-space-3) var(--md-space-4);
    border-bottom: 1px solid var(--color-outline-variant, rgba(0, 0, 0, 0.08));
}


.meta-row:last-child {
    border-bottom: none;
}

.meta-row:first-child {
    padding-top: var(--md-space-4);
}

.meta-row:last-child {
    padding-bottom: var(--md-space-4);
    border-bottom: none;
}

.meta-row__label {
    font-size: 14px;
    line-height: 20px;
}

.meta-row__value {
    font-size: 12px;
    line-height: 16px;
    word-break: break-all;
}


.custom-card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: var(--md-space-3) var(--md-space-4);
    padding-bottom: 0;
}

.custom-card-title {
    font-size: 16px;
    font-weight: 500;
}

.link-cell {
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