// src/account/App.vue
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

try {
    initSdk(import.meta.env.VITE_ONLINE_APP_ID, 'zh-cn')
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
        if (router.currentRoute.value.path !== '/user-panel/account-overview') {
            Snackbar.success({ content: '已检测到登入', duration: 1000 })
            if (typeof sdk.close === 'function') await sdk.close()
            router.push('/user-panel/account-overview')
        }
    } else if (event.data === 'logout') {
        Snackbar.success({ content: '已检测到登出', duration: 1000 })
        if (typeof sdk.close === 'function') await sdk.close()
        router.push('/')
    }
}

onMounted(() => {
    channel.value = new BroadcastChannel('ayaccountcenter_data')
    channel.value.addEventListener('message', handleBroadcast)
})

onUnmounted(() => {
    channel.value?.close()
})
</script>

<template>
    <!-- MD3 small top app bar：品牌主色底 + on-primary 前景色，高度由 --md-app-bar-height 统一 -->
    <var-app-bar class="md-top-app-bar" color="var(--md-chrome-bg)" text-color="var(--md-chrome-fg)"
        onmousedown="if (window.hostshell) window.hostshell.startDrag()">
        <template #left>
            <div v-if="mobileByWidth && route.path.startsWith('/user-panel/')" @mousedown.stop>
                <var-button text round @mousedown.stop @click="leftPopup = true">
                    <my-icon icon="menu" size="1em + 8px" />
                </var-button>
            </div>
            <div class="app-bar-brand" @click="router.push('/')" @mousedown.stop>
                <span class="app-bar-title" @mousedown.stop>AyAccountCenter</span>
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
