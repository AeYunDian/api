<script setup>
import { onMounted, onUnmounted, provide, ref } from 'vue'
import { RouterView, useRouter } from 'vue-router'
import { initSdk, getSdk } from '@/shared/account-sdk'
import { useThemeStore } from '@/shared/stores/theme'
import { useDevice } from '@/shared/composables/useDevice'
import { isHostShell } from '@/shared/utils/device'
import WindowControls from '@/shared/components/WindowControls.vue'

try {
    initSdk(import.meta.env.VITE_MYSITES_APP_ID, 'zh-cn')
} catch (e) {
    console.error('SDK 初始化失败', e)
}

const sdk = getSdk()
const router = useRouter()
const themeStore = useThemeStore()
const { mobileByWidth } = useDevice()

const user = ref(null)
const checking = ref(true)
let timerId = null

provide('sdk', sdk)
provide('user', user)

async function refreshUser() {
    try {
        let res = await sdk.verify()
        if (!res.valid) {
            try {
                await sdk.refresh()
                res = await sdk.verify()
            } catch { /* 刷新失败就算未登录 */ }
        }
        user.value = res.valid ? res.user : null
        return user.value
    } catch {
        user.value = null
        return null
    }
}

provide('refreshUser', refreshUser)

function toggleTheme() {
    themeStore.setTheme(themeStore.isDark ? 'light' : 'dark')
}

function goLogin() {
    const domain = import.meta.env.PROD
        ? (isHostShell() ? 'online.app.undz.cn' : 'online.undz.cn')
        : 'online-dev.undz.cn'
    const back = encodeURIComponent(window.location.href)
    window.location.href = `https://${domain}/oauth2/login?redirect_url=${back}`
}

provide('goLogin', goLogin)

onMounted(async () => {
    await refreshUser()
    checking.value = false
    // 每分钟轮询一次，跨子域登录/登出也能同步到
    timerId = setInterval(refreshUser, 60000)
})

onUnmounted(() => {
    if (timerId) clearInterval(timerId)
})
</script>

<template>
    <var-app-bar onmousedown="if (window.hostshell) window.hostshell.startDrag()" color="primary" text-color="#fff"
        style="height: 54px">
        <template #left>
            <div style="margin-left: 15px; user-select: none;" @click="router.push('/')" @mousedown.stop>
                <span class="app-bar-title" @mousedown.stop>AySites</span>
            </div>
        </template>
        <template #right>
            <var-button color="transparent" text-color="#fff" round text @click="toggleTheme" @mousedown.stop>
                <var-icon :name="themeStore.currentTheme === 'light' ? 'weather-night' : 'white-balance-sunny'"
                    :size="24" />
            </var-button>
            <var-button v-if="user" color="transparent" text-color="#fff" round text @mousedown.stop
                @click="router.push('/')">
                {{ user.username }}
            </var-button>
            <var-button v-else color="transparent" text-color="#fff" round text @mousedown.stop @click="goLogin">
                登录
            </var-button>
            <WindowControls />
        </template>
    </var-app-bar>

    <main>
        <RouterView v-if="!checking" />
        <div v-else class="boot-loading">
            <var-loading type="circle" />
        </div>
    </main>
</template>

<style scoped>
main {
    height: calc(100% - 54px);
    overflow-y: auto;
}

.boot-loading {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
}
</style>