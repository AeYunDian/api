<script setup>
import { ref, onMounted, inject, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Snackbar } from '@varlet/ui'
import { getSites } from '@/mysites/utils/api'

const router = useRouter()
const user = inject('user')
const goLogin = inject('goLogin')

const loading = ref(false)
const sites = ref([])

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

function openSite(site) {
    router.push(`/sites/${site.id}`)
}

onMounted(load)
// 登录状态变化时重新拉
watch(() => user.value?.sub, load)
</script>

<template>
    <div class="wrap">
        <!-- 未登录 -->
        <div v-if="!user" class="guest">
            <h1>AySites</h1>
            <p>登录后查看你的站点数据</p>
            <var-button type="primary" @click="goLogin">立即登录</var-button>
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
    color: var(--color-primary, #5B54E8);
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
    transition: transform .18s ease, box-shadow .18s ease;
}

.site-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 24px -14px rgba(0, 0, 0, 0.3);
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