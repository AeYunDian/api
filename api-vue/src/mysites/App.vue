<script setup>
import { onMounted, onUnmounted, provide, ref } from 'vue'
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
const POLL_INTERVAL = 30000

provide('sdk', sdk)
provide('user', user)

/* ───────────── 登录态 ───────────── */

/**
 * 三步验证链：
 *   1. verify 成功 → 更新 user
 *   2. verify 失败 → refresh → 再 verify
 *   3. 仍然失败 → user = null
 * 不主动弹登录，由 Home 页处理
 */
async function ensureLoggedIn() {
    if (!sdk) {
        user.value = null
        return null
    }

    try {
        const res = await sdk.verify()
        if (res && res.valid && res.user) {
            user.value = res.user
            return user.value
        }
    } catch (error) {
        // verify 抛错通常是 401，未登录
    }

    try {
        await sdk.refresh()
        const res = await sdk.verify()
        if (res && res.valid && res.user) {
            user.value = res.user
            return user.value
        }
    } catch (error) {
        // refresh 也失败，就是真的未登录
    }

    user.value = null
    return null
}

provide('refreshUser', ensureLoggedIn)

/**
 * 打开 SDK 登录模态框并等待用户操作。
 *
 * sdk.login() 返回 Promise：
 *   - 用户登录成功 → resolve({ user: {...} })
 *   - 用户关闭窗口 → resolve(null)
 *   - 重复打开 / Toast 未就绪 → reject
 *
 * @returns {Promise<Object|null>} 登录成功返回 user，其余返回 null
 */
async function goLogin() {
    if (!sdk) {
        Snackbar.error('登录服务未就绪，请刷新重试')
        return null
    }
    try {
        const result = await sdk.login()
        if (result && result.user) {
            user.value = result.user
            return result.user
        }
        // 用户主动关闭窗口，静默返回
        return null
    } catch (error) {
        // 重复打开：可能是别处已经弹了，静默
        const msg = error?.message || ''
        if (msg.includes('已打开') || msg.includes('already open')) {
            return null
        }
        console.error('[AySites] 登录失败', error)
        Snackbar.error(msg || '登录失败，请稍后重试')
        return null
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
    await ensureLoggedIn()
    checking.value = false
    pollTimer = setInterval(ensureLoggedIn, POLL_INTERVAL)
})

onUnmounted(() => {
    if (pollTimer) {
        clearInterval(pollTimer)
        pollTimer = null
    }
})
</script>

<template>
    <!-- MD3 small top app bar：品牌主色底 + on-primary 前景色，高度由 --md-app-bar-height 统一 -->
    <var-app-bar class="md-top-app-bar" color="var(--md-chrome-bg)" text-color="var(--md-chrome-fg)"
        onmousedown="if (window.hostshell) window.hostshell.startDrag()">
        <template #left>
            <div v-if="mobileByWidth && route.path !== '/'" @mousedown.stop>
                <var-button text round @mousedown.stop @click="goHome">
                    <my-icon icon="arrow-left" size="1em + 8px" />
                </var-button>
            </div>
            <div class="app-bar-brand" @click="goHome" @mousedown.stop>
                <span class="app-bar-title" @mousedown.stop>AyAnalytics</span>
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
    <div class="header">
        <div class="header-start">
            <div class="header-title">AyAnalytics</div>
        </div>
        <div class="header-end">
            <p v-if="user">
                账户：{{ user.username }}
            </p>
            <p v-else>
                未登录
            </p>
        </div>
    </div>
    <main>
        <!-- 内容面板：上方两个圆角常驻，滚动发生在面板内部（与 console/account 同构） -->
        <div class="app-panel">
            <div v-if="checking" class="boot-loading">
                <var-loading type="circle" />
            </div>
            <RouterView v-else />
        </div>
    </main>
</template>
<style>
@media print {
    .var-app-bar {
        display: none !important;
    }
}
</style>
<style scoped>
@media print {
    div.header {
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        padding: 0 20px 8px !important;
        border-bottom: 1px solid #ccc !important;
        margin-bottom: 16px !important;
        color: #000 !important;
    }

    .header-title {
        font-size: 16px;
        font-weight: 600;
        color: #000;
    }

    .header-user {
        font-size: 13px;
        color: #333;
    }

    .header-user--guest {
        cursor: default;
    }
}


/* 与 console/account 一致：main 只负责 chrome 底色，内容是一块圆角面板。
 * 注意高度必须用 100vh 计算（原来写 100% 时 body 没有确定高度，
 * 结果 main 只有内容那么高，下面露出 body 的白底 → 页面看起来被切成两截）。 */
main {
    height: calc(100vh - var(--md-app-bar-height, 64px));
    overflow: hidden;
    position: relative;
}

/* 圆角面板本身是唯一滚动容器：滚动时上方圆角不会跟着滚走 */
.app-panel {
    height: 100%;
    overflow-y: auto;
    background: var(--md-panel-bg);
    border-radius: var(--md-panel-radius) var(--md-panel-radius) 0 0;
}

.app-bar-brand {
    display: inline-flex;
    align-items: center;
    height: 100%;
    margin-left: var(--md-space-2);
    cursor: pointer;
    user-select: none;
}


div.header {
    display: none;
}

.boot-loading {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    min-height: 200px;
}
</style>