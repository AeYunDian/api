<script setup>
import { ref, watch } from 'vue'
import { Snackbar } from '@varlet/ui'
import { useRouter } from 'vue-router'

const router = useRouter()
const configKey = 'devopt-config'

// 统一获取配置
const getConfig = () => {
    try {
        return JSON.parse(localStorage.getItem(configKey)) || { devMode: false, vConsole: false }
    } catch {
        return { devMode: false, vConsole: false }
    }
}

const config = getConfig()
const isDevMode = ref(config.devMode)
const isVConsoleEnabled = ref(config.vConsole)

// 保存配置并广播事件
const saveConfigAndBroadcast = () => {
    localStorage.setItem(configKey, JSON.stringify({
        devMode: isDevMode.value,
        vConsole: isVConsoleEnabled.value
    }))
    window.dispatchEvent(new Event('devmode-changed'))
}

watch(isDevMode, (val) => {
    saveConfigAndBroadcast()
    if (val) {
        Snackbar.success('开发者模式已开启')
    } else {
        Snackbar.info('开发者模式已关闭')
        router.replace('/user-panel/account-overview')
    }
})

watch(isVConsoleEnabled, () => {
    saveConfigAndBroadcast()
})

function switchDevMode() { isDevMode.value = !isDevMode.value }
function switchVConsole() { isVConsoleEnabled.value = !isVConsoleEnabled.value }
</script>

<template>
    <div class="about-page">
        <div class="md-page-header">
            <div class="md-page-heading">
                <h1 class="md-page-title">开发者选项</h1>
            </div>
        </div>

        <div class="custom-card var-elevation--1">
            <div class="meta-list">
                <div class="meta-row meta-row--action" v-ripple @click="switchDevMode">
                    <div class="meta-row__text">
                        <span class="meta-row__label">开发者选项</span>
                        <span class="meta-row__value">启用开发者模式</span>
                    </div>
                    <var-switch v-model="isDevMode" @click.stop @mousedown.stop @touchstart.stop />
                </div>
            </div>
        </div>

        <div class="custom-card var-elevation--1">
            <div class="meta-list">
                <div class="meta-row meta-row--action" v-ripple @click="switchVConsole">
                    <div class="meta-row__text">
                        <span class="meta-row__label">vConsole</span>
                        <span class="meta-row__value">调试控制台</span>
                    </div>
                    <var-switch v-model="isVConsoleEnabled" @click.stop @mousedown.stop @touchstart.stop />
                </div>
            </div>
        </div>
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

/* 默认的上下布局 */
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

/* 针对带开关的行：横向布局，两端对齐 */
.meta-row--action {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
}

/* 包含文字内容的容器 */
.meta-row__text {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.meta-row:last-child {
    border-bottom: none;
    padding-bottom: var(--md-space-4);
}

.meta-row:first-child {
    padding-top: var(--md-space-4);
}

.meta-row__label {
    font-size: 14px;
    line-height: 20px;
}

.meta-row__value {
    font-size: 12px;
    line-height: 16px;
    word-break: break-all;
    color: var(--color-on-surface-variant, rgba(0, 0, 0, 0.6));
}
</style>