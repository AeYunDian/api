<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { searchPosts } from '@/index/content'
import { listedResources } from '@/index/resources'
import GovPanel from '@/index/components/common/GovPanel.vue'
import Breadcrumb from '@/index/components/common/Breadcrumb.vue'
import Pagination from '@/index/components/common/Pagination.vue'
import ArticleItem from '@/index/components/blog/ArticleItem.vue'
import ResourceCard from '@/index/components/resource/ResourceCard.vue'

const route = useRoute()
const router = useRouter()

const SIZE = 10
const DEBOUNCE = 400
const TYPES = ['all', 'article', 'resource']
const normalizeType = (t) => (TYPES.includes(t) ? t : 'all')

const keyword = ref((route.query.q ?? '').toString())
const type = ref(normalizeType(route.query.type))
const page = ref(1)

/* ---------------- 路由 -> 本地（外部导航） ---------------- */
watch(
    () => route.query,
    (q) => {
        const newQ = (q.q ?? '').toString()
        const newType = normalizeType(q.type)
        // 如果路由状态和本地已一致，说明是本次自动搜索/切换 tab 产生的回声
        // 不重置 keyword 和分页，避免输入过程中被打断
        if (newQ === keyword.value && newType === type.value) return
        keyword.value = newQ
        type.value = newType
        page.value = 1
    }
)

/* ---------------- 本地 -> 路由（防抖自动搜索） ---------------- */
let timer = null

function buildQuery(overrides = {}) {
    const q = overrides.q ?? keyword.value.trim()
    const t = overrides.type ?? type.value
    return {
        ...(q ? { q } : {}),
        ...(t !== 'all' ? { type: t } : {}),
    }
}

function go(targetKeyword = null) {
    const target = (targetKeyword ?? keyword.value).trim()
    const current = (route.query.q ?? '').toString()
    if (target === current) return
    page.value = 1
    router.replace({ path: '/search', query: buildQuery({ q: target }) })
}

function clearTimer() {
    if (timer) {
        clearTimeout(timer)
        timer = null
    }
}

watch(keyword, (val) => {
    clearTimer()
    timer = setTimeout(() => {
        timer = null
        go(val)
    }, DEBOUNCE)
})

onUnmounted(clearTimer)

/* ---------------- 立即搜索：回车 / 点击按钮 ---------------- */
function submit() {
    clearTimer()
    go()
}

function clearKeyword() {
    keyword.value = ''
}

/* ---------------- 切换类型 ---------------- */
const tabs = [
    { value: 'all', label: '全部' },
    { value: 'article', label: '文章' },
    { value: 'resource', label: '资源' },
]

function switchType(v) {
    if (v === type.value) return
    clearTimer()
    type.value = v
    page.value = 1
    router.replace({ path: '/search', query: buildQuery({ type: v }) })
}

/* ---------------- 匹配与结果 ---------------- */
const query = computed(() => keyword.value.trim().toLowerCase())

const matchPost = (p, q) =>
    p.title.toLowerCase().includes(q) ||
    p.summary.toLowerCase().includes(q) ||
    p.category.toLowerCase().includes(q) ||
    p.tags.some(t => t.toLowerCase().includes(q))

const matchResource = (r, q) =>
    r.title.toLowerCase().includes(q) ||
    r.summary.toLowerCase().includes(q) ||
    r.category.toLowerCase().includes(q) ||
    r.tags.some(t => t.toLowerCase().includes(q)) ||
    r.platforms.some(p => p.toLowerCase().includes(q))

const postResults = computed(() =>
    query.value ? searchPosts(query.value) : []
)
const resourceResults = computed(() =>
    query.value ? listedResources.filter(r => matchResource(r, query.value)) : []
)

function countOf(v) {
    if (v === 'article') return postResults.value.length
    if (v === 'resource') return resourceResults.value.length
    return postResults.value.length + resourceResults.value.length
}

const combined = computed(() => {
    const arr = []
    if (type.value === 'all' || type.value === 'article') {
        arr.push(...postResults.value.map(item => ({ kind: 'article', item, date: item.date })))
    }
    if (type.value === 'all' || type.value === 'resource') {
        arr.push(...resourceResults.value.map(item => ({ kind: 'resource', item, date: item.date })))
    }
    if (type.value === 'all') {
        arr.sort((a, b) => b.date.localeCompare(a.date))
    }
    return arr
})

const paged = computed(() =>
    combined.value.slice((page.value - 1) * SIZE, page.value * SIZE)
)
</script>

<template>
    <div class="page">
        <Breadcrumb :items="[{ label: '首页', to: '/' }, { label: '搜索' }]" />

        <GovPanel title="站内搜索">
            <div class="search-box">
                <input v-model="keyword" class="search-box__input" type="search" placeholder="输入关键词，自动搜索公开的文章与资源"
                    @keyup.enter="submit" />
                <button v-if="keyword" class="search-box__clear" type="button" aria-label="清空关键词" @click="clearKeyword">
                    ×
                </button>
                <button class="search-box__btn" type="button" @click="submit">搜索</button>
            </div>

            <div class="search-tabs">
                <button v-for="t in tabs" :key="t.value" class="search-tab" :class="{ 'is-active': type === t.value }"
                    type="button" @click="switchType(t.value)">
                    {{ t.label }}
                    <span class="search-tab__count">{{ countOf(t.value) }}</span>
                </button>
            </div>
        </GovPanel>

        <GovPanel v-if="query" title="搜索结果">
            <template #header>
                <span class="hint">
                    关键词「{{ query }}」共 {{ combined.length }} 条
                </span>
            </template>

            <div v-if="paged.length" class="search-list">
                <template v-for="row in paged" :key="row.kind + ':' + row.item.slug">
                    <ArticleItem v-if="row.kind === 'article'" :post="row.item" />
                    <ResourceCard v-else :resource="row.item" />
                </template>
            </div>
            <div v-else class="empty">没有找到匹配的内容，试试其他关键词。</div>

            <Pagination v-if="combined.length > SIZE" :page="page" :total="combined.length" :size="SIZE"
                @change="p => (page = p)" />
        </GovPanel>

        <GovPanel v-else title="开始搜索">
            <p>请输入关键词，搜索站内公开的文章与资源。</p>
            <p class="search-tip">提示：可按标题、摘要、分类、标签、平台进行匹配。</p>
        </GovPanel>
    </div>
</template>

<style scoped>
.search-box {
    position: relative;
    display: flex;
    align-items: center;
    max-width: 620px;
    height: 40px;
    margin-bottom: var(--gov-gap-lg);
}

.search-box__input {
    flex: 1;
    min-width: 0;
    height: 100%;
    padding: 0 40px 0 var(--gov-gap-lg);
    background: #f0f0f0;
    border: 1px solid #d9d9d9;
    border-right: 0;
    border-radius: 0;
    outline: none;
    font-size: var(--gov-fs-base);
}

.search-box__input:focus {
    border-color: var(--gov-blue);
}

.search-box__input::-webkit-search-cancel-button {
    display: none;
}

.search-box__clear {
    position: absolute;
    right: 94px;
    top: 0;
    width: 32px;
    height: 100%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    line-height: 1;
    color: var(--gov-text-muted);
    background: transparent;
    border: 0;
    cursor: pointer;
}

.search-box__clear:hover {
    color: var(--gov-red);
}

.search-box__btn {
    flex: none;
    width: 88px;
    height: 100%;
    background: var(--gov-btn-primary);
    color: #fff;
    border: 0;
    font-weight: 700;
    letter-spacing: 3px;
    font-family: var(--gov-font-title);
    cursor: pointer;
    transition: background .15s;
}

.search-box__btn:hover {
    background: var(--gov-btn-primary-hover);
}

.search-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: var(--gov-gap-sm);
    padding-top: var(--gov-gap-md);
    border-top: 1px dashed var(--gov-border);
}

.search-tab {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px var(--gov-gap-lg);
    font-size: var(--gov-fs-sm);
    color: var(--gov-text-sub);
    background: var(--gov-bg-gray);
    border: 1px solid var(--gov-border);
    border-radius: var(--gov-radius-sm);
    transition: all .15s;
}

.search-tab:hover {
    border-color: var(--gov-blue);
    color: var(--gov-blue);
}

.search-tab.is-active {
    background: var(--gov-blue-deep);
    border-color: var(--gov-blue-deep);
    color: #fff;
    font-weight: 700;
}

.search-tab__count {
    font-family: var(--gov-font-num);
    font-size: var(--gov-fs-xs);
    opacity: .85;
}

.search-list {
    padding: var(--gov-gap-sm) 0;
}

.hint {
    font-size: var(--gov-fs-xs);
    color: var(--gov-text-muted);
}

.empty {
    padding: var(--gov-gap-2xl) 0;
    text-align: center;
    color: var(--gov-text-muted);
}

.search-tip {
    color: var(--gov-text-muted);
    font-size: var(--gov-fs-sm);
}
</style>