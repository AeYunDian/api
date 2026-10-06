<script setup>
import { ref, computed, onMounted, onUnmounted, watch, inject } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Snackbar } from '@varlet/ui'
import { getSiteStats, getSiteRealtime } from '@/mysites/utils/api'
import { formatTime } from '@/shared/utils/format'

/* ───────────── 上下文 ───────────── */

const route = useRoute()
const router = useRouter()
const user = inject('user')

const siteId = computed(() => {
    const n = Number(route.params.id)
    return Number.isInteger(n) && n > 0 ? n : null
})

/* ───────────── 常量 ───────────── */

const RANGES = [
    { id: 'today', label: '今天' },
    { id: '7d', label: '7 天' },
    { id: '30d', label: '30 天' },
    { id: '90d', label: '90 天' },
]

const BREAKDOWN_TITLES = {
    path: '热门页面',
    referrer: '来源',
    country: '国家/地区',
    browser: '浏览器',
    os: '操作系统',
    device: '设备',
    event: '自定义事件',
}

const REALTIME_INTERVAL = 30000

/* ───────────── 响应式状态 ───────────── */

const loading = ref(false)
const range = ref('7d')
const stats = ref(null)
const realtime = ref(null)
const errorMsg = ref('')

let realtimeTimer = null

/* ───────────── 数据加载 ───────────── */

async function loadStats() {
    if (!user.value || !siteId.value) return
    loading.value = true
    errorMsg.value = ''
    try {
        stats.value = await getSiteStats(siteId.value, range.value)
    } catch (e) {
        errorMsg.value = e.message || '加载失败'
        Snackbar.error(errorMsg.value)
        // 站点不存在 / 无权限 → 回到列表
        if (e.status === 403 || e.status === 404) {
            router.replace('/')
        }
    } finally {
        loading.value = false
    }
}

async function loadRealtime() {
    if (!user.value || !siteId.value) return
    try {
        realtime.value = await getSiteRealtime(siteId.value)
    } catch {
        // 静默失败，不打扰用户；保留上一次的结果
    }
}

async function reloadAll() {
    await loadStats()
    await loadRealtime()
}

/* ───────────── 监听 ───────────── */

watch(range, loadStats)

watch(siteId, (v) => {
    if (v) reloadAll()
})

watch(
    () => user.value?.sub,
    (v) => {
        if (v) {
            reloadAll()
        } else {
            // 登出：清空数据，回到访客态
            stats.value = null
            realtime.value = null
            if (realtimeTimer) {
                clearInterval(realtimeTimer)
                realtimeTimer = null
            }
        }
    }
)

onMounted(async () => {
    await reloadAll()
    realtimeTimer = setInterval(loadRealtime, REALTIME_INTERVAL)
})

onUnmounted(() => {
    if (realtimeTimer) {
        clearInterval(realtimeTimer)
        realtimeTimer = null
    }
})

/* ───────────── 折线图计算 ───────────── */

const chart = computed(() => {
    const s = stats.value?.series
    if (!s || s.length === 0) return null

    const W = 800
    const H = 200
    const PAD = 24
    const innerW = W - PAD * 2
    const innerH = H - PAD * 2

    const max = Math.max(1, ...s.map((p) => p.pageviews))
    const step = s.length > 1 ? innerW / (s.length - 1) : 0

    const points = s.map((p, i) => {
        const x = PAD + i * step
        const y = H - PAD - (p.pageviews / max) * innerH
        return { x, y, ...p }
    })

    const line = points
        .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
        .join(' ')

    // 面积用于渲染填充
    const area =
        `M${points[0].x.toFixed(1)},${(H - PAD).toFixed(1)} ` +
        points.map((p) => `L${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') +
        ` L${points[points.length - 1].x.toFixed(1)},${(H - PAD).toFixed(1)} Z`

    return { W, H, PAD, line, area, max, points }
})

/* ───────────── Breakdown 分组 ───────────── */

const breakdownGroups = computed(() => {
    const b = stats.value?.breakdowns || {}
    return Object.entries(BREAKDOWN_TITLES)
        .map(([key, title]) => ({
            key,
            title,
            rows: (b[key] || []).filter((r) => r.val !== ''),
        }))
        .filter((g) => g.rows.length > 0)
})

/* ───────────── 工具函数 ───────────── */

function fmt(n) {
    return Number(n ?? 0).toLocaleString()
}

function fmtRange(r) {
    if (!r) return ''
    return r.from === r.to ? r.from : `${r.from} ~ ${r.to}`
}

function goBack() {
    router.push('/')
}

function refresh() {
    reloadAll()
    Snackbar.success({ content: '已刷新', duration: 800 })
}

function displayName(val) {
    if (!val) return '(空)'
    if (val === '__direct__') return '直接访问'
    return val
}

/* ───────────── 图表 hover ───────────── */

const hoverIndex = ref(-1)

function onChartMove(e) {
    if (!chart.value) return
    const svg = e.currentTarget
    const rect = svg.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * chart.value.W
    const { PAD } = chart.value
    const innerW = chart.value.W - PAD * 2
    const step = chart.value.points.length > 1
        ? innerW / (chart.value.points.length - 1)
        : 0
    const idx = step > 0
        ? Math.round((x - PAD) / step)
        : 0
    hoverIndex.value = Math.max(0, Math.min(chart.value.points.length - 1, idx))
}

function onChartLeave() {
    hoverIndex.value = -1
}

const hoverPoint = computed(() => {
    if (hoverIndex.value < 0 || !chart.value) return null
    return chart.value.points[hoverIndex.value] || null
})
</script>

<template>
    <div class="wrap">
        <!-- 未登录 -->
        <div v-if="!user" class="guest">
            <h1>需要登录</h1>
            <p>请先登录后再查看站点数据</p>
        </div>

        <template v-else>
            <!-- 头部 -->
            <div class="page-header">
                <div class="header-left">
                    <var-button text class="back-btn" @click="goBack">←</var-button>
                    <div class="title-block">
                        <h2>{{ stats?.site?.name || '站点数据' }}</h2>
                        <p class="domain">{{ stats?.site?.domain || '' }}</p>
                    </div>
                </div>

                <div class="header-right">
                    <div class="range-tabs">
                        <var-button v-for="r in RANGES" :key="r.id" size="small"
                            :type="range === r.id ? 'primary' : 'default'" @click="range = r.id">
                            {{ r.label }}
                        </var-button>
                    </div>
                    <var-button size="small" @click="refresh">刷新</var-button>
                </div>
            </div>

            <!-- 加载中 -->
            <var-progress v-if="loading && !stats" indeterminate />

            <!-- 错误 -->
            <div v-else-if="errorMsg && !stats" class="error-block">
                <p>{{ errorMsg }}</p>
                <var-button type="primary" @click="reloadAll">重试</var-button>
            </div>

            <!-- 内容 -->
            <template v-else-if="stats">
                <!-- 关键数字 -->
                <div class="metrics">
                    <div class="metric">
                        <span class="metric-label">浏览</span>
                        <span class="metric-value">{{ fmt(stats.totals.pageviews) }}</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">访客</span>
                        <span class="metric-value">{{ fmt(stats.totals.visitors) }}</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">当前在线</span>
                        <span class="metric-value live">{{ realtime?.online ?? 0 }}</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">范围</span>
                        <span class="metric-value small">{{ fmtRange(stats.range) }}</span>
                    </div>
                </div>

                <!-- 趋势图 -->
                <section class="card">
                    <h3>趋势</h3>
                    <div v-if="chart" class="chart-wrap">
                        <svg :viewBox="`0 0 ${chart.W} ${chart.H}`" class="chart" preserveAspectRatio="none"
                            @mousemove="onChartMove" @mouseleave="onChartLeave">
                            <!-- 面积填充 -->
                            <path :d="chart.area" class="area" />
                            <!-- 折线 -->
                            <path :d="chart.line" class="line" />
                            <!-- 基准线 -->
                            <line :x1="chart.PAD" :y1="chart.H - chart.PAD" :x2="chart.W - chart.PAD"
                                :y2="chart.H - chart.PAD" class="axis" />
                            <!-- hover 竖线 -->
                            <line v-if="hoverPoint" :x1="hoverPoint.x" y1="24" :x2="hoverPoint.x" :y2="chart.H - 24"
                                class="cursor" />
                            <!-- hover 点 -->
                            <circle v-if="hoverPoint" :cx="hoverPoint.x" :cy="hoverPoint.y" r="4" class="dot" />
                        </svg>

                        <!-- hover tooltip -->
                        <div v-if="hoverPoint" class="chart-tip"
                            :style="{ left: (hoverPoint.x / chart.W * 100) + '%' }">
                            <div class="tip-label">{{ hoverPoint.label }}</div>
                            <div class="tip-row">
                                <span>浏览</span>
                                <span>{{ fmt(hoverPoint.pageviews) }}</span>
                            </div>
                            <div class="tip-row">
                                <span>访客</span>
                                <span>{{ fmt(hoverPoint.visitors) }}</span>
                            </div>
                        </div>
                    </div>
                    <p v-else class="empty-line">暂无数据</p>
                </section>

                <!-- 实时 -->
                <section class="card" v-if="realtime">
                    <div class="card-head">
                        <h3>最近 30 分钟</h3>
                        <span class="live-indicator" v-if="realtime.online > 0">
                            <i></i>{{ realtime.online }} 人在线
                        </span>
                    </div>

                    <!-- 每分钟柱 -->
                    <div class="bars">
                        <div v-for="(m, i) in realtime.minutes" :key="i" class="bar"
                            :style="{ height: (Math.min(m.cur, 20) / 20 * 100) + '%' }"
                            :title="m.label + ' · ' + m.cur"></div>
                    </div>

                    <!-- 最近访问 -->
                    <div class="recent-list">
                        <div v-for="(r, i) in realtime.recent" :key="i" class="recent-row">
                            <span class="recent-path" :title="r.path">{{ r.path }}</span>
                            <span class="recent-country">{{ r.country || '—' }}</span>
                            <span class="recent-time">{{ formatTime(r.ts) }}</span>
                        </div>
                        <p v-if="!realtime.recent.length" class="empty-line">暂无</p>
                    </div>
                </section>

                <!-- Breakdown 面板 -->
                <section v-for="group in breakdownGroups" :key="group.key" class="card">
                    <h3>{{ group.title }}</h3>
                    <div class="bd-list">
                        <div v-for="row in group.rows" :key="row.val" class="bd-row">
                            <span class="bd-val" :title="row.val">
                                {{ displayName(row.val) }}
                            </span>
                            <div class="bd-bar-wrap">
                                <div class="bd-bar" :style="{
                                    width: (row.pageviews / group.rows[0].pageviews * 100) + '%'
                                }"></div>
                            </div>
                            <span class="bd-num">{{ fmt(row.pageviews) }}</span>
                        </div>
                    </div>
                </section>

                <!-- 无任何数据 -->
                <div v-if="!breakdownGroups.length && stats.totals.pageviews === 0" class="no-data">
                    <p>该时间范围内暂无数据</p>
                    <p class="hint">请确认嵌入脚本已正确安装</p>
                </div>
            </template>
        </template>
    </div>
</template>

<style scoped>
.wrap {
    max-width: 1100px;
    margin: 0 auto;
    padding: 20px;
}

/* ── 未登录 ── */
.guest {
    text-align: center;
    padding: 100px 20px;
}

.guest h1 {
    margin: 0 0 8px;
    font-size: 26px;
}

.guest p {
    margin: 0;
    color: var(--color-text-secondary, #888);
}

/* ── 头部 ── */
.page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 20px;
    gap: 12px;
    flex-wrap: wrap;
}

.header-left {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
}

.back-btn {
    font-size: 20px;
    padding: 0 10px;
    min-width: 0;
}

.title-block {
    min-width: 0;
}

.page-header h2 {
    margin: 0;
    font-size: 20px;
    line-height: 1.3;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.domain {
    margin: 2px 0 0;
    font-size: 13px;
    color: var(--color-text-secondary, #888);
    word-break: break-all;
}

.header-right {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
}

.range-tabs {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
}

/* ── 错误 ── */
.error-block {
    text-align: center;
    padding: 60px 20px;
}

.error-block p {
    margin: 0 0 16px;
    color: var(--color-text-secondary, #888);
}

/* ── 关键数字 ── */
.metrics {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 12px;
    margin-bottom: 16px;
}

.metric {
    background: var(--color-surface-container, #f5f5f8);
    border-radius: 10px;
    padding: 14px 16px;
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.metric-label {
    font-size: 12px;
    color: var(--color-text-secondary, #888);
}

.metric-value {
    font-size: 24px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    line-height: 1.2;
}

.metric-value.small {
    font-size: 15px;
    font-weight: 500;
}

.metric-value.live {
    color: #12a594;
}

/* ── 卡片 ── */
.card {
    background: var(--color-surface-container, #f5f5f8);
    border-radius: 10px;
    padding: 16px 18px;
    margin-bottom: 16px;
}

.card h3 {
    margin: 0 0 12px;
    font-size: 15px;
    font-weight: 600;
}

.card-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
}

.card-head h3 {
    margin: 0;
}

/* ── 折线图 ── */
.chart-wrap {
    position: relative;
}

.chart {
    width: 100%;
    height: 200px;
    display: block;
    overflow: visible;
}

.chart .area {
    fill: color-mix(in srgb, var(--color-primary, #5b54e8) 14%, transparent);
    stroke: none;
}

.chart .line {
    fill: none;
    stroke: var(--color-primary, #5b54e8);
    stroke-width: 2;
    stroke-linejoin: round;
    stroke-linecap: round;
}

.chart .axis {
    stroke: var(--color-outline-variant, rgba(0, 0, 0, 0.12));
    stroke-width: 1;
}

.chart .cursor {
    stroke: var(--color-primary, #5b54e8);
    stroke-width: 1;
    stroke-dasharray: 3 3;
    opacity: 0.5;
}

.chart .dot {
    fill: var(--color-primary, #5b54e8);
    stroke: var(--color-surface, #fff);
    stroke-width: 2;
}

.chart-tip {
    position: absolute;
    top: 8px;
    transform: translateX(-50%);
    background: var(--color-surface, #fff);
    border: 1px solid var(--color-outline-variant, rgba(0, 0, 0, 0.1));
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 12px;
    pointer-events: none;
    box-shadow: 0 6px 20px -8px rgba(0, 0, 0, 0.25);
    white-space: nowrap;
    z-index: 2;
}

.tip-label {
    font-weight: 600;
    margin-bottom: 4px;
    color: var(--color-text, #222);
}

.tip-row {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    color: var(--color-text-secondary, #888);
}

.tip-row span:last-child {
    color: var(--color-text, #222);
    font-variant-numeric: tabular-nums;
    font-weight: 500;
}

/* ── 空状态 ── */
.empty-line {
    margin: 0;
    padding: 16px 0;
    text-align: center;
    color: var(--color-text-secondary, #888);
    font-size: 13px;
}

/* ── 实时 ── */
.live-indicator {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #12a594;
    font-weight: 500;
}

.live-indicator i {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #12a594;
    animation: pulse 1.6s ease-in-out infinite;
}

@keyframes pulse {

    0%,
    100% {
        opacity: 1;
        transform: scale(1);
    }

    50% {
        opacity: 0.4;
        transform: scale(0.75);
    }
}

.bars {
    display: flex;
    align-items: flex-end;
    gap: 2px;
    height: 40px;
    margin-bottom: 12px;
}

.bar {
    flex: 1;
    min-height: 2px;
    background: var(--color-primary, #5b54e8);
    border-radius: 1px;
    opacity: 0.6;
    transition: opacity 0.15s;
}

.bar:hover {
    opacity: 1;
}

.recent-list {
    display: flex;
    flex-direction: column;
}

.recent-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto;
    gap: 12px;
    padding: 8px 0;
    border-bottom: 1px solid var(--color-outline-variant, rgba(0, 0, 0, 0.06));
    font-size: 13px;
    align-items: center;
}

.recent-row:last-child {
    border-bottom: 0;
}

.recent-path {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.recent-country {
    color: var(--color-text-secondary, #888);
    font-variant-numeric: tabular-nums;
}

.recent-time {
    color: var(--color-text-secondary, #888);
    font-variant-numeric: tabular-nums;
    font-size: 12px;
}

/* ── Breakdown ── */
.bd-list {
    display: flex;
    flex-direction: column;
}

.bd-row {
    display: grid;
    grid-template-columns: minmax(0, 1.4fr) minmax(40px, 1fr) auto;
    gap: 12px;
    padding: 8px 0;
    border-bottom: 1px solid var(--color-outline-variant, rgba(0, 0, 0, 0.06));
    font-size: 13px;
    align-items: center;
}

.bd-row:last-child {
    border-bottom: 0;
}

.bd-val {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.bd-bar-wrap {
    height: 6px;
    background: var(--color-outline-variant, rgba(0, 0, 0, 0.06));
    border-radius: 3px;
    overflow: hidden;
}

.bd-bar {
    height: 100%;
    background: var(--color-primary, #5b54e8);
    border-radius: 3px;
    transition: width 0.4s ease;
    min-width: 2px;
}

.bd-num {
    font-variant-numeric: tabular-nums;
    font-weight: 500;
    min-width: 48px;
    text-align: right;
}

/* ── 无数据 ── */
.no-data {
    text-align: center;
    padding: 60px 20px;
    color: var(--color-text-secondary, #888);
}

.no-data p {
    margin: 0 0 6px;
}

.no-data .hint {
    font-size: 12.5px;
    opacity: 0.7;
}
</style>