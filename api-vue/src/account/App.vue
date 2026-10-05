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
    <var-app-bar onmousedown="if (window.hostshell) window.hostshell.startDrag()" color="primary" text-color="#fff"
        style="height: 54px;">
        <template #left>
            <div v-if="mobileByWidth && route.path.startsWith('/user-panel/')" @mousedown.stop>
                <var-button text @mousedown.stop @click="leftPopup = true">
                    <my-icon icon="menu" size="1em + 8px" />
                </var-button>
            </div>
            <div style="margin-left: 15px; user-select: none;" @click="router.push('/')" @mousedown.stop>
                <span class="app-bar-title" @mousedown.stop>AyAccountCenter</span>
            </div>
        </template>
        <template #right>
            <var-button color="transparent" text-color="#fff" round text @click="toggleTheme" @mousedown.stop>
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