<script setup>
import { ref, watch } from 'vue'
import { Snackbar } from '@varlet/ui'
import { useRouter } from 'vue-router'

const router = useRouter()
const configKey = 'devopt-config'

// 定义所有 Eruda 插件列表
const erudaPlugins = [
    { key: 'erudaVue', label: 'Vue', desc: '查看 Vue 组件树和状态' },
    { key: 'erudaMonitor', label: 'Monitor', desc: 'FPS、内存和 DOM 节点监控' },
    { key: 'erudaFeatures', label: 'Features', desc: '浏览器特性/API 检测' },
    { key: 'erudaTiming', label: 'Timing', desc: '性能与资源加载耗时' },
    { key: 'erudaBenchmark', label: 'Benchmark', desc: 'JS 性能测试' },
    { key: 'erudaGeolocation', label: 'Geolocation', desc: '地理位置 API 测试' },
    { key: 'erudaOrientation', label: 'Orientation', desc: '设备方向 API 测试' },
]

const defaultConfig = {
    devMode: false,
    vConsole: false,
    eruda: false,
    erudaVue: false,
    erudaMonitor: false,
    erudaFeatures: false,
    erudaTiming: false,
    erudaBenchmark: false,
    erudaGeolocation: false,
    erudaOrientation: false,
}

const getConfig = () => {
    try {
        const raw = localStorage.getItem(configKey)
        return raw ? { ...defaultConfig, ...JSON.parse(raw) } : { ...defaultConfig }
    } catch {
        return { ...defaultConfig }
    }
}

const config = getConfig()

const isDevMode = ref(config.devMode)
const isVConsoleEnabled = ref(config.vConsole)
const isErudaEnabled = ref(config.eruda)

const pluginStates = {}
erudaPlugins.forEach(p => {
    pluginStates[p.key] = ref(config[p.key])
})

const saveConfigAndBroadcast = () => {
    const newConfig = {
        devMode: isDevMode.value,
        vConsole: isVConsoleEnabled.value,
        eruda: isErudaEnabled.value,
    }
    erudaPlugins.forEach(p => {
        newConfig[p.key] = pluginStates[p.key].value
    })
    localStorage.setItem(configKey, JSON.stringify(newConfig))
    window.dispatchEvent(new Event('devmode-changed'))
}

watch(isDevMode, (val) => {
    saveConfigAndBroadcast()
    if (val) {
        Snackbar.success('开发者模式已开启')
    } else {
        Snackbar.info('开发者模式已关闭')
        router.replace('/console-panel/oauth-client')
    }
})

watch(isVConsoleEnabled, () => saveConfigAndBroadcast())
watch(isErudaEnabled, () => saveConfigAndBroadcast())

function switchDevMode() {
    if (!isDevMode.value) return
    isDevMode.value = !isDevMode.value
}

// ⭐ 核心修改：如果开发者模式未开启，直接 return 拦截
function switchVConsole() {
    if (!isDevMode.value) return
    isVConsoleEnabled.value = !isVConsoleEnabled.value
}

function switchEruda() {
    if (!isDevMode.value) return
    isErudaEnabled.value = !isErudaEnabled.value
}
</script>

<template>
    <div class="about-page">
        <div class="md-page-header">
            <div class="md-page-heading">
                <h1 class="md-page-title">开发者选项</h1>
            </div>
        </div>

        <!-- 开发者模式开关 -->
        <div class="custom-card var-elevation--1">
            <div class="meta-list">
                <div class="meta-row meta-row--action" :class="{ 'meta-row--disabled': !isDevMode }" v-ripple
                    @click="switchDevMode">
                    <div class="meta-row__text">
                        <span class="meta-row__label">开发者选项</span>
                        <span class="meta-row__value">启用开发者模式</span>
                    </div>
                    <var-switch v-model="isDevMode" @click.stop @mousedown.stop @touchstart.stop
                        :disabled="!isDevMode" />
                </div>
            </div>
        </div>

        <!-- 调试工具开关组 -->
        <div class="custom-card var-elevation--1">
            <div class="meta-list">
                <!-- vConsole 开关 -->
                <div class="meta-row meta-row--action" :class="{ 'meta-row--disabled': !isDevMode }" v-ripple
                    @click="switchVConsole">
                    <div class="meta-row__text">
                        <span class="meta-row__label">vConsole</span>
                        <span class="meta-row__value">轻量级调试面板（腾讯）</span>
                    </div>
                    <var-switch v-model="isVConsoleEnabled" @click.stop @mousedown.stop @touchstart.stop
                        :disabled="!isDevMode" />
                </div>

                <!-- Eruda 主开关 -->
                <div class="meta-row meta-row--action" :class="{ 'meta-row--disabled': !isDevMode }" v-ripple
                    @click="switchEruda">
                    <div class="meta-row__text">
                        <span class="meta-row__label">Eruda</span>
                        <span class="meta-row__value">功能更强的调试面板</span>
                    </div>
                    <var-switch v-model="isErudaEnabled" @click.stop @mousedown.stop @touchstart.stop
                        :disabled="!isDevMode" />
                </div>
            </div>
        </div>

        <p>Eruda 插件</p>
        <div class="custom-card var-elevation--1" v-if="isErudaEnabled">
            <div class="meta-list">
                <div class="meta-row meta-row--action meta-row--disabled" v-for="plugin in erudaPlugins"
                    :key="plugin.key">
                    <div class="meta-row__text">
                        <span class="meta-row__label">{{ plugin.label }}</span>
                        <span class="meta-row__value">{{ plugin.desc }}</span>
                    </div>
                    <var-switch v-model="pluginStates[plugin.key].value" disabled />
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

.meta-row--action {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
}

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

/* ===== 新增：统一的禁用态样式 ===== */
.meta-row--disabled {
    cursor: not-allowed;
    /* 禁止点击的鼠标样式 */
    opacity: 0.5;
    /* 整体降低透明度，视觉上直接体现不可用 */
}

/* 子插件专属样式 */
.meta-row--disabled.meta-row--sub-style {
    cursor: default;
    opacity: 1;
    /* 子插件是纯展示，不需要太虚 */
    padding-left: calc(var(--md-space-4) + 20px);
    background-color: rgba(0, 0, 0, 0.015);
}

/* 如果为了子插件单独拆分 */
.meta-row--action.meta-row--disabled:not(.meta-row--sub-style) {
    opacity: 0.5;
}
</style>