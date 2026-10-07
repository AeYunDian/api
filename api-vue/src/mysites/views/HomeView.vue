<script setup>
import { ref, computed, onMounted, watch, inject } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Snackbar } from '@varlet/ui'
import { getSites } from '@/mysites/utils/api'

const router = useRouter()
const route = useRoute()
const user = inject('user')
const goLogin = inject('goLogin')

const loading = ref(false)
const sites = ref([])
const loggingIn = ref(false)

/**
 * ?redirect=/sites/123
 * 只接受站内路径（单斜杠开头，且不以 // 开头），防开放重定向
 */
const redirect = computed(() => {
    const r = route.query.redirect
    if (typeof r !== 'string') return null
    if (!r.startsWith('/') || r.startsWith('//')) return null
    return r
})

async function load() {
    if (!user.value) return
    loading.value = true
    try {
        const data = await getSites()
        sites.value = data.sites || []
    } catch (e) {
        Snackbar.error(e.message || '加载失败')
    } finally {
        loading.value = false
    }
}

/** 若已登录且有合法 redirect，跳过去；返回 true 表示已经跳走 */
function tryRedirect() {
    if (user.value && redirect.value) {
        router.replace(redirect.value)
        return true
    }
    return false
}

function openSite(site) {
    router.push(`/sites/${site.id}`)
}

/**
 * 点登录：调 goLogin()，等 SDK 模态框关闭。
 * - 登录成功 → 立刻跳回 redirect（不用等轮询）
 * - 用户关闭 → 停在原地
 */
async function handleLogin() {
    if (loggingIn.value) return
    if (typeof goLogin !== 'function') {
        Snackbar.error('登录服务未就绪')
        return
    }
    loggingIn.value = true
    try {
        const loggedUser = await goLogin()
        if (loggedUser) {
            // 优先跳回原目标
            if (redirect.value) {
                router.replace(redirect.value)
                return
            }
            // 没有 redirect，留在首页并加载列表
            await load()
        }
    } finally {
        loggingIn.value = false
    }
}

onMounted(() => {
    if (tryRedirect()) return
    load()
})

watch(
    () => user.value?.sub,
    (v) => {
        if (v) {
            // 别的途径登录（比如另一个 tab）时，也能响应
            if (tryRedirect()) return
            load()
        } else {
            sites.value = []
        }
    }
)
</script>

<template>
    <div class="wrap">
        <!-- 未登录 -->
        <div v-if="!user" class="guest">
            <h1>AySites</h1>
            <p>登录后查看你的站点数据</p>
            <var-button type="primary" size="large" :loading="loggingIn" @click="handleLogin">
                立即登录
            </var-button>
        </div>

        <!-- 已登录 -->
        <template v-else>
            <div class="page-header">
                <h2>我的站点</h2>
                <var-button @click="load" :loading="loading">刷新</var-button>
            </div>

            <var-progress v-if="loading" indeterminate />

            <p v-else-if="!sites.length" class="empty">
                还没有站点，请到
                <a href="https://console.undz.cn/console-panel/analytics" target="_blank" rel="noopener">
                    AyConsole
                </a>
                添加
            </p>

            <div v-else class="site-grid">
                <div v-for="site in sites" :key="site.id" class="site-card" @click="openSite(site)">
                    <div class="site-name">{{ site.name }}</div>
                    <div class="site-domain">{{ site.domain }}</div>
                </div>
            </div>
        </template>
    </div>
</template>

<style scoped>
.wrap {
    max-width: 1100px;
    margin: 0 auto;
    padding: 24px 20px;
}

/* ── 未登录 ── */
.guest {
    text-align: center;
    padding: 90px 20px;
}

.guest h1 {
    font-size: 30px;
    margin: 0 0 10px;
}

.guest p {
    color: var(--color-text-secondary, #888);
    margin: 0 0 24px;
}

.redirect-hint {
    margin-top: 20px;
    font-size: 12.5px;
    opacity: 0.75;
}

.redirect-hint code {
    font-family: ui-monospace, Menlo, Consolas, monospace;
    padding: 2px 6px;
    background: rgba(0, 0, 0, 0.06);
    border-radius: 4px;
}

/* ── 站点列表 ── */
.page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.page-header h2 {
    margin: 0;
}

.empty {
    text-align: center;
    padding: 60px 0;
    color: var(--color-text-secondary, #888);
}

.empty a {
    color: var(--color-primary, #5b54e8);
    text-decoration: none;
}

.empty a:hover {
    text-decoration: underline;
}

.site-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 12px;
}

.site-card {
    padding: 16px;
    border-radius: 10px;
    border: 1px solid var(--color-outline-variant, rgba(0, 0, 0, 0.08));
    background: var(--color-surface-container, #fff);
    cursor: pointer;
    transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.site-name {
    font-weight: 600;
    font-size: 15px;
    margin-bottom: 4px;
}

.site-domain {
    font-size: 13px;
    color: var(--color-text-secondary, #888);
    word-break: break-all;
}
</style>