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

// 完整的默认配置
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

// 动态生成插件状态字典
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
        router.replace('/user-panel/account-overview')
    }
})

watch(isVConsoleEnabled, () => {
    saveConfigAndBroadcast()
})

watch(isErudaEnabled, () => {
    saveConfigAndBroadcast()
})

// 监听插件状态
erudaPlugins.forEach(p => {
    watch(pluginStates[p.key], () => {
        saveConfigAndBroadcast()
    })
})

function switchDevMode() { isDevMode.value = !isDevMode.value }
function switchVConsole() { isVConsoleEnabled.value = !isVConsoleEnabled.value }
function switchEruda() { isErudaEnabled.value = !isErudaEnabled.value }
function switchPlugin(key) { pluginStates[key].value = !pluginStates[key].value }
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
                <div class="meta-row meta-row--action" v-ripple @click="switchDevMode">
                    <div class="meta-row__text">
                        <span class="meta-row__label">开发者选项</span>
                        <span class="meta-row__value">启用开发者模式</span>
                    </div>
                    <var-switch v-model="isDevMode" @click.stop @mousedown.stop @touchstart.stop />
                </div>
            </div>
        </div>

        <!-- 调试工具开关组 -->
        <div class="custom-card var-elevation--1">
            <div class="meta-list">
                <!-- vConsole 开关 -->
                <div class="meta-row meta-row--action" v-ripple @click="switchVConsole">
                    <div class="meta-row__text">
                        <span class="meta-row__label">vConsole</span>
                        <span class="meta-row__value">轻量级调试面板（腾讯）</span>
                    </div>
                    <var-switch v-model="isVConsoleEnabled" @click.stop @mousedown.stop @touchstart.stop />
                </div>

                <!-- Eruda 主开关 -->
                <div class="meta-row meta-row--action" v-ripple @click="switchEruda">
                    <div class="meta-row__text">
                        <span class="meta-row__label">Eruda</span>
                        <span class="meta-row__value">功能更强的调试面板</span>
                    </div>
                    <var-switch v-model="isErudaEnabled" @click.stop @mousedown.stop @touchstart.stop />
                </div>

                <!-- Eruda 插件子开关（随主开关开启而显示） -->
                <template v-if="isErudaEnabled">
                    <div class="meta-row meta-row--action" v-for="plugin in erudaPlugins" :key="plugin.key" v-ripple
                        @click="switchPlugin(plugin.key)">
                        <div class="meta-row__text">
                            <span class="meta-row__label">{{ plugin.label }}</span>
                            <span class="meta-row__value">{{ plugin.desc }}</span>
                        </div>
                        <var-switch v-model="pluginStates[plugin.key].value" @click.stop @mousedown.stop
                            @touchstart.stop />
                    </div>
                </template>
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