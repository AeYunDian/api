<script setup>
import { onMounted, onUnmounted, provide, ref, watch } from 'vue'
import { RouterView, useRouter, useRoute } from 'vue-router'
import { initSdk, getSdk } from '@/shared/account-sdk'
import { useThemeStore } from '@/shared/stores/theme'
import { useDevice } from '@/shared/composables/useDevice'
import { isHostShell } from '@/shared/utils/device'
import { Snackbar } from '@varlet/ui'
import WindowControls from '@/shared/components/WindowControls.vue'
import '@varlet/ui/es/snackbar/style'
import '@/shared/assets/base.css'
/* ───────────── SDK ───────────── */

let sdk = null
try {
    initSdk(import.meta.env.VITE_ONLINE_APP_ID, 'zh-cn')
    sdk = getSdk()
} catch (error) {
    console.error('[AySites] SDK 初始化失败', error)
}

/* ───────────── 上下文 ───────────── */

const router = useRouter()
const route = useRoute()
const themeStore = useThemeStore()
const { mobileByWidth } = useDevice()

const user = ref(null)
const checking = ref(true)

let pollTimer = null
const POLL_INTERVAL = 60000

provide('sdk', sdk)
provide('user', user)

/* ───────────── 登录态 ───────────── */

async function refreshUser() {
    if (!sdk) {
        user.value = null
        return null
    }
    try {
        let res = await sdk.verify()
        if (!res || !res.valid) {
            try {
                await sdk.refresh()
                res = await sdk.verify()
            } catch {
                /* refresh 失败就当未登录 */
            }
        }
        user.value = res && res.valid ? res.user : null
        return user.value
    } catch (error) {
        user.value = null
        return null
    }
}

provide('refreshUser', refreshUser)

function goLogin() {
    if (!sdk) {
        Snackbar.error('登录服务未就绪，请刷新重试')
        return
    }
    try {
        if (typeof sdk.login === 'function') {
            sdk.login()
        } else if (typeof sdk.openLogin === 'function') {
            sdk.openLogin()
        } else if (typeof sdk.showLogin === 'function') {
            sdk.showLogin()
        } else {
            console.error('[AySites] account-sdk 未暴露登录方法')
            Snackbar.error('登录服务暂时不可用')
        }
    } catch (error) {
        console.error('[AySites] 登录失败', error)
        Snackbar.error('登录失败，请稍后重试')
    }
}

provide('goLogin', goLogin)

/* ───────────── 主题 ───────────── */

function toggleTheme() {
    themeStore.setTheme(themeStore.isDark ? 'light' : 'dark')
}

/* ───────────── 导航 ───────────── */

function goHome() {
    if (route.path !== '/') {
        router.push('/')
    }
}

/* ───────────── 生命周期 ───────────── */

onMounted(async () => {
    await refreshUser()
    checking.value = false
    pollTimer = setInterval(refreshUser, POLL_INTERVAL)
})

onUnmounted(() => {
    if (pollTimer) {
        clearInterval(pollTimer)
        pollTimer = null
    }
})

/* 登录态变为未登录时，若停在需要登录的页面，回首页 */
watch(
    () => user.value?.sub,
    (now, before) => {
        if (before && !now && route.path !== '/') {
            router.replace('/')
        }
    }
)
</script>

<template>
    <var-app-bar onmousedown="if (window.hostshell) window.hostshell.startDrag()" color="primary" text-color="#fff"
        style="height: 54px">
        <template #left>
            <div v-if="mobileByWidth && route.path !== '/'" @mousedown.stop>
                <var-button text @mousedown.stop @click="goHome">
                    <my-icon icon="arrow-left" size="1em + 8px" />
                </var-button>
            </div>
            <div style="margin-left: 15px; user-select: none;" @click="goHome" @mousedown.stop>
                <span class="app-bar-title" @mousedown.stop>AySites</span>
            </div>
        </template>

        <template #right>
            <var-button color="transparent" text-color="#fff" round text @click="toggleTheme" @mousedown.stop>
                <var-icon :name="themeStore.currentTheme === 'light' ? 'weather-night' : 'white-balance-sunny'"
                    :size="24" />
            </var-button>

            <var-button v-if="user" color="transparent" text-color="#fff" round text @mousedown.stop>
                {{ user.username }}
            </var-button>
            <var-button v-else color="transparent" text-color="#fff" round text @mousedown.stop @click="goLogin">
                登录
            </var-button>

            <WindowControls />
        </template>
    </var-app-bar>

    <main>
        <div v-if="checking" class="boot-loading">
            <var-loading type="circle" />
        </div>
        <RouterView v-else />
    </main>
</template>

<style scoped>
main {
    height: calc(100% - 54px);
    overflow-y: auto;
    position: relative;
}

.var-app-bar {
    position: relative;
    width: 100%;
    font-size: var(--app-bar-font-size);
    background: var(--app-bar-color);
    color: var(--app-bar-text-color);
    transition: background-color 0.25s;
}

.boot-loading {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    min-height: 200px;
}
</style>