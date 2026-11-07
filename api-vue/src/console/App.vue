// src/console/App.vue
<script setup>
import { onMounted, onUnmounted, provide, ref } from 'vue'
import { RouterView, useRouter, useRoute } from 'vue-router'
import { initSdk, getSdk } from '@/shared/account-sdk'
import { useThemeStore } from '@/shared/stores/theme'
import { useDevice } from '@/shared/composables/useDevice'
import { Snackbar } from '@varlet/ui'
import WindowControls from '@/shared/components/WindowControls.vue'
import '@varlet/ui/es/snackbar/style'
import '@varlet/ui/es/dialog/style'
import '@/shared/assets/base.css'

const { mobileByWidth } = useDevice()
const route = useRoute()
const router = useRouter()
const themeStore = useThemeStore()
const channel = ref(null)
const leftPopup = ref(false)
let vConsoleInstance = null
let erudaInstance = null
try {
    initSdk(import.meta.env.VITE_CONSOLE_APP_ID, 'zh-cn')
} catch (error) {
    console.error('SDK 初始化失败', error)
}

const sdk = getSdk()
provide('sdk', sdk)
provide('leftPopup', leftPopup)
provide('channel', channel)

function toggleTheme() {
    themeStore.setTheme(themeStore.isDark ? 'light' : 'dark')
}

async function handleBroadcast(event) {
    if (event.data === 'login') {
        if (router.currentRoute.value.path !== '/console-panel/oauth-client') {
            Snackbar.success({ content: '已检测到登入', duration: 1000 })
            if (typeof sdk.close === 'function') await sdk.close()
            router.push('/console-panel/oauth-client')
        }
    } else if (event.data === 'logout') {
        Snackbar.success({ content: '已检测到登出', duration: 1000 })
        if (typeof sdk.close === 'function') await sdk.close()
        router.push('/')
    }
}

async function syncDevOptions() {
    let config = {
        devMode: false, vConsole: false, eruda: false,
        erudaVue: false, erudaMonitor: false, erudaFeatures: false,
        erudaTiming: false, erudaBenchmark: false, erudaGeolocation: false, erudaOrientation: false
    }
    try {
        const raw = localStorage.getItem('devopt-config')
        if (raw) config = { ...config, ...JSON.parse(raw) }
    } catch (e) {
        console.error('解析开发者配置失败', e)
    }

    // ===== vConsole 逻辑 =====
    if (config.vConsole && config.devMode) {
        if (!vConsoleInstance) {
            const VConsole = (await import('vconsole')).default
            vConsoleInstance = new VConsole()
        }
    } else {
        if (vConsoleInstance) {
            vConsoleInstance.destroy()
            vConsoleInstance = null
        }
    }

    // ===== Eruda 逻辑 =====
    if (config.eruda && config.devMode) {
        // 如果实例已存在，先移除旧容器和实例，因为无法动态移除插件
        if (erudaInstance) {
            return
        }

        const eruda = (await import('eruda')).default

        // // 定义插件动态导入映射
        // const pluginsMap = {
        //     erudaVue: () => import('eruda-vue'),
        //     erudaMonitor: () => import('eruda-monitor'),
        //     erudaFeatures: () => import('eruda-features'),
        //     erudaTiming: () => import('eruda-timing'),
        //     erudaBenchmark: () => import('eruda-benchmark'),
        //     erudaGeolocation: () => import('eruda-geolocation'),
        //     erudaOrientation: () => import('eruda-orientation'),
        // }

        // // 遍历并加载用户选中的插件
        // for (const [key, importFn] of Object.entries(pluginsMap)) {
        //     if (config[key]) {
        //         try {
        //             const mod = await importFn()
        //             eruda.add(mod.default || mod)
        //         } catch (err) {
        //             console.error(`加载 Eruda 插件 ${key} 失败`, err)
        //         }
        //     }
        // }

        eruda.init()
        erudaInstance = eruda
    } else {
        if (erudaInstance) {
            const erudaContainer = document.querySelector('#eruda')
            if (erudaContainer) erudaContainer.remove()
            erudaInstance = null
        }
    }
}
onMounted(() => {
    syncDevOptions()
    window.addEventListener('devmode-changed', syncDevOptions)

    channel.value = new BroadcastChannel('ayconsolecenter_data')
    channel.value.addEventListener('message', handleBroadcast)
})

onUnmounted(() => {
    channel.value?.close()
    window.removeEventListener('devmode-changed', syncDevOptions)

})
</script>

<template>
    <!-- MD3 top app bar：与导航抽屉同色的 chrome 底色，两者连成一片；高度由 --md-app-bar-height 统一 -->
    <var-app-bar class="md-top-app-bar" color="var(--md-chrome-bg)" text-color="var(--md-chrome-fg)"
        onmousedown="if (window.hostshell) window.hostshell.startDrag()">
        <template #left>
            <div v-if="mobileByWidth && route.path.startsWith('/console-panel/')" @mousedown.stop>
                <var-button text round @mousedown.stop @click="leftPopup = true">
                    <my-icon icon="menu" size="1em + 8px" />
                </var-button>
            </div>
            <div class="app-bar-brand" @click="router.push('/')" @mousedown.stop>
                <span class="app-bar-title" @mousedown.stop>AyConsole</span>
            </div>
        </template>
        <template #right>
            <var-button text round @click="toggleTheme" @mousedown.stop>
                <var-icon :name="themeStore.currentTheme === 'light' ? 'weather-night' : 'white-balance-sunny'"
                    :size="24" />
            </var-button>
            <WindowControls />
        </template>
    </var-app-bar>
    <main>
        <RouterView />
    </main>
</template>

<style scoped>
.app-bar-brand {
    display: inline-flex;
    align-items: center;
    height: 100%;
    margin-left: var(--md-space-2);
    cursor: pointer;
    user-select: none;
}
</style>
