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
const publicSites = ref([])
const mineSites = ref([])
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

const summary = computed(() => {
    const parts = []
    if (publicSites.value.length) parts.push(`公开站点 ${publicSites.value.length}`)
    if (user.value) parts.push(`我的站点 ${mineSites.value.length}`)
    return parts.length ? parts.join(' · ') : '暂无可浏览的站点'
})

async function load() {
    loading.value = true
    try {
        // 免授权接口；带了 Cookie 后端会额外返回 mine
        const data = await getSites()
        publicSites.value = data.public || []
        mineSites.value = data.mine || []
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

function primaryDomain(site) {
    if (!site) return ''
    if (Array.isArray(site.domains) && site.domains.length > 0) {
        return site.domains.join(', ')
    }
    return site.domain || ''
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
 * - 登录成功 → 优先跳回 redirect
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
            if (redirect.value) {
                router.replace(redirect.value)
                return
            }
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
            mineSites.value = []
        }
    }
)
</script>

<template>
    <div class="home-page">
        <div class="md-page-header">
            <div class="md-page-heading">
                <h1 class="md-page-title">站点分析</h1>
                <p class="md-page-subtitle">{{ summary }}</p>
            </div>

            <div class="md-page-actions">
                <var-tooltip content="刷新列表">
                    <var-button round icon-container :loading="loading" @click="load">
                        <my-icon icon="refresh" size="1em + 8px" />
                    </var-button>
                </var-tooltip>
                <var-button v-if="!user" type="primary" :loading="loggingIn" @click="handleLogin">
                    登录
                </var-button>
                <var-button v-else @click="openConsole">管理站点</var-button>
            </div>
        </div>

        <var-progress v-if="loading && !publicSites.length && !mineSites.length" indeterminate />

        <template v-else>
            <section class="site-section">
                <h2 class="section-title">公开站点</h2>
                <p class="section-desc">站点所有者公开了分享内容的站点；点开即可查看。</p>

                <var-result v-if="!publicSites.length" type="empty" title="暂无公开站点" description="还没有站点公开分享统计数据。" />

                <div v-else class="site-grid">
                    <var-card v-for="site in publicSites" :key="site.id" class="site-card" hoverable
                        @click="openSite(site)">
                        <template #title="{ slotClass }">
                            <div :class="slotClass" class="md-card-header">
                                <my-icon icon="web" size="1.2em" />
                                <span class="md-card-title">{{ site.name }}</span>
                            </div>
                        </template>
                        <p class="site-domain">{{ primaryDomain(site) }}</p>
                    </var-card>
                </div>
            </section>

            <section v-if="user" class="site-section">
                <h2 class="section-title">我的站点</h2>
                <p class="section-desc">包含私密站点，只有你自己可见。</p>

                <var-result v-if="!mineSites.length" type="empty" title="还没有站点"
                    description="站点需要在 AyConsole 的「网站分析」里创建，创建后这里会自动出现。">
                    <template #footer>
                        <var-button type="primary" @click="openConsole">前往 AyConsole</var-button>
                    </template>
                </var-result>

                <div v-else class="site-grid">
                    <var-card v-for="site in mineSites" :key="site.id" class="site-card" hoverable
                        @click="openSite(site)">
                        <template #title="{ slotClass }">
                            <div :class="slotClass" class="md-card-header">
                                <my-icon icon="web" size="1.2em" />
                                <span class="md-card-title">{{ site.name }}</span>
                            </div>
                        </template>
                        <p class="site-domain">{{ primaryDomain(site) }}</p>
                    </var-card>
                </div>
            </section>
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

/* ── 区块 ── */
.site-section {
    margin-bottom: var(--md-space-8);
}

.section-title {
    margin: 0 0 4px;
    font-size: 18px;
    line-height: 24px;
    font-weight: 500;
    color: var(--color-text);
}

.section-desc {
    margin: 0 0 var(--md-space-3);
    font-size: 13px;
    line-height: 18px;
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
