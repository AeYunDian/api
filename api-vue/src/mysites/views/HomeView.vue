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

function openConsole() {
    const base = import.meta.env.PROD ? 'https://console.undz.cn' : 'https://console-dev.undz.cn'
    window.open(`${base}/console-panel/analytics`, '_blank', 'noopener')
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
    <div class="home-page">
        <!-- 未登录：MD3 hero -->
        <section v-if="!user" class="guest">
            <h1 class="guest-title">AyAnalytics</h1>
            <p class="guest-subtitle">登录后查看你的站点数据</p>
            <var-button type="primary" size="large" :loading="loggingIn" @click="handleLogin">
                立即登录
            </var-button>
        </section>

        <!-- 已登录 -->
        <template v-else>
            <div class="md-page-header">
                <div class="md-page-heading">
                    <h1 class="md-page-title">我的站点</h1>
                    <p class="md-page-subtitle">
                        {{ sites.length ? `共 ${sites.length} 个站点` : '还没有任何站点' }}
                    </p>
                </div>

                <div class="md-page-actions">
                    <var-tooltip content="刷新列表">
                        <var-button round icon-container :loading="loading" @click="load">
                            <my-icon icon="refresh" size="1em + 8px" />
                        </var-button>
                    </var-tooltip>
                </div>
            </div>

            <var-progress v-if="loading && !sites.length" indeterminate />

            <var-result v-else-if="!sites.length" type="empty" title="还没有站点"
                description="站点需要在 AyConsole 的「网站分析」里创建，创建后这里会自动出现。">
                <template #footer>
                    <var-button type="primary" @click="openConsole">前往 AyConsole</var-button>
                </template>
            </var-result>

            <!-- 站点卡片：MD3 filled card + level-1 海拔，整卡可点 -->
            <div v-else class="site-grid">
                <var-card v-for="site in sites" :key="site.id" class="site-card" hoverable
                    @click="openSite(site)">
                    <template #title="{ slotClass }">
                        <div :class="slotClass" class="md-card-header">
                            <my-icon icon="web" size="1.2em" />
                            <span class="md-card-title">{{ site.name }}</span>
                        </div>
                    </template>
                    <p class="site-domain">{{ site.domain }}</p>
                </var-card>
            </div>
        </template>
    </div>
</template>

<style scoped>
.home-page {
    max-width: var(--md-content-max-width);
    margin: 0 auto;
    padding: var(--md-space-6) var(--md-space-8);
    padding-bottom: calc(var(--md-space-10) + 24px);
}

/* ── 未登录 ── */
.guest {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--md-space-2);
    min-height: 60vh;
    text-align: center;
}

.guest-title {
    margin: 0;
    font-size: 36px;
    line-height: 44px;
    font-weight: 400;
    letter-spacing: 0;
    color: var(--color-text);
}

.guest-subtitle {
    margin: 0 0 var(--md-space-4);
    font-size: 14px;
    line-height: 20px;
    letter-spacing: 0.25px;
    color: var(--color-text-secondary);
}

/* ── 站点列表 ── */
.site-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: var(--md-space-3);
}

.site-card {
    cursor: pointer;
}

.site-domain {
    margin: 0;
    font-size: 13px;
    line-height: 20px;
    color: var(--color-text-secondary);
    word-break: break-all;
}

@media (max-width: 640px) {
    .home-page {
        padding: var(--md-space-4);
    }

    .site-grid {
        grid-template-columns: 1fr;
    }
}
</style>
