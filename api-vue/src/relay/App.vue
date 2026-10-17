<script setup>
import WindowControls from '@/shared/components/WindowControls.vue'
import '@varlet/ui/es/dialog/style'
import '@/shared/assets/base.css'

const endpoints = [
    { label: 'WebSocket', value: 'wss://relay.undz.cn/ws' },
    { label: '健康检查', value: 'https://relay.undz.cn/health' },
]

const protocol = [
    { label: '版本', value: 'PSP 1.0' },
    { label: '格式', value: 'JSON' },
    { label: '传输', value: 'WebSocket' },
]
</script>

<template>
    <!-- MD3 top app bar：与导航抽屉同色的 chrome 底色 -->
    <var-app-bar class="md-top-app-bar" color="var(--md-chrome-bg)" text-color="var(--md-chrome-fg)"
        onmousedown="if (window.hostshell) window.hostshell.startDrag()">
        <template #left>
            <div class="app-bar-brand">
                <span class="app-bar-title">AyRelay</span>
            </div>
        </template>
        <template #right>
            <WindowControls />
        </template>
    </var-app-bar>

    <main class="relay-layout">
        <div class="relay-content">
            <header class="md-page-header relay-header">
                <div class="md-page-heading">
                    <h1 class="md-page-title">AyRelay</h1>
                    <p class="md-page-subtitle">WebSocket 中继服务</p>
                </div>
                <var-chip type="success" size="small">运行中</var-chip>
            </header>

            <var-card class="relay-card">
                <template #title="{ slotClass }">
                    <div :class="slotClass" class="md-card-header">
                        <my-icon icon="lan-connect" size="1.2em" />
                        <span class="md-card-title">服务地址</span>
                    </div>
                </template>
                <var-cell v-for="item in endpoints" :key="item.label" :title="item.label" :border="true"
                    class="relay-cell">
                    <template #description>
                        <code class="md-mono relay-code">{{ item.value }}</code>
                    </template>
                </var-cell>
            </var-card>

            <var-card class="relay-card">
                <template #title="{ slotClass }">
                    <div :class="slotClass" class="md-card-header">
                        <my-icon icon="protocol" size="1.2em" />
                        <span class="md-card-title">协议</span>
                    </div>
                </template>
                <var-cell v-for="item in protocol" :key="item.label" :title="item.label" :border="true" class="relay-cell">
                    <template #description>
                        <span class="relay-value">{{ item.value }}</span>
                    </template>
                </var-cell>
            </var-card>

            <p class="md-hint relay-note">
                本服务只提供 WebSocket 中继能力，不存储用户业务数据。<br />
                所有消息在 TTL 到期后自动清理。
            </p>
        </div>
    </main>
</template>

<style scoped>
.app-bar-brand {
    display: inline-flex;
    align-items: center;
    height: 100%;
    margin-left: var(--md-space-2);
    user-select: none;
}

.relay-layout {
    display: flex;
    align-items: flex-start;
    justify-content: center;
    min-height: calc(100vh - var(--md-app-bar-height));
    padding: var(--md-space-8) var(--md-space-4);
}

.relay-content {
    width: 100%;
    max-width: 720px;
}

.relay-header {
    align-items: center;
}

.relay-card {
    margin-bottom: var(--md-space-4);
}

.relay-cell {
    --cell-min-height: 48px;
}

.relay-code {
    font-size: 13px;
    color: var(--color-primary);
}

.relay-value {
    font-size: 13px;
    color: var(--color-text);
}

.relay-note {
    text-align: center;
}
</style>
