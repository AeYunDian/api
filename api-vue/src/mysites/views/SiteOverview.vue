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

const rawId = computed(() => route.params.id)
const siteId = computed(() => {
    const n = Number(rawId.value)
    return Number.isInteger(n) && n > 0 ? n : null
})
const invalidId = computed(() => rawId.value !== undefined && siteId.value === null)

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

/* ───────────── 状态 ───────────── */

const loading = ref(false)
const range = ref('7d')
const stats = ref(null)
const realtime = ref(null)
const notFound = ref(false)
const errorMsg = ref('')
const lastUpdated = ref(0)

let realtimeTimer = null
let statsAbort = null
let realtimeAbort = null
let statsSeq = 0

/* ───────────── 未登录跳首页 ───────────── */

function redirectToLogin() {
    const target = encodeURIComponent(route.fullPath)
    router.replace(`/?redirect=${target}`)
}

/* ───────────── 数据加载（带竞态保护） ───────────── */

async function loadStats() {
    if (!user.value || !siteId.value) return

    if (statsAbort) statsAbort.abort()
    statsAbort = new AbortController()
    const seq = ++statsSeq
    const signal = statsAbort.signal

    loading.value = true
    errorMsg.value = ''

    try {
        const data = await getSiteStats(siteId.value, range.value, { signal })
        if (seq !== statsSeq) return
        stats.value = data
        notFound.value = false
        lastUpdated.value = Date.now()
    } catch (e) {
        if (e.name === 'AbortError') return
        if (seq !== statsSeq) return
        if (e.status === 404 || e.status === 403) {
            stats.value = null
            notFound.value = true
            stopRealtime()
            return
        }
        errorMsg.value = e.message || '加载失败'
        Snackbar.error(errorMsg.value)
    } finally {
        if (seq === statsSeq) loading.value = false
    }
}

async function loadRealtime() {
    if (!user.value || !siteId.value || notFound.value) return
    if (realtimeAbort) realtimeAbort.abort()
    realtimeAbort = new AbortController()

    try {
        const data = await getSiteRealtime(siteId.value, { signal: realtimeAbort.signal })
        realtime.value = data
    } catch (e) {
        if (e.name === 'AbortError') return
        if (e.status === 404 || e.status === 403) {
            stopRealtime()
        }
    }
}

async function reloadAll() {
    await loadStats()
    if (!notFound.value) await loadRealtime()
}
function printPage() {
    // 让浏览器把当前渲染结果打到打印机 / 存成 PDF
    window.print()
}
/* ───────────── 实时定时器 ───────────── */

function startRealtime() {
    stopRealtime()
    realtimeTimer = setInterval(() => {
        if (document.visibilityState === 'visible') loadRealtime()
    }, REALTIME_INTERVAL)
}

function stopRealtime() {
    if (realtimeTimer) {
        clearInterval(realtimeTimer)
        realtimeTimer = null
    }
}

function onVisibilityChange() {
    if (document.visibilityState === 'visible' && !notFound.value && user.value) {
        loadRealtime()
    }
}

/* ───────────── 监听 ───────────── */

watch(range, loadStats)

watch(siteId, (v) => {
    if (v) {
        stopRealtime()
        realtime.value = null
        stats.value = null
        notFound.value = false
        errorMsg.value = ''
        reloadAll().then(() => {
            if (!notFound.value) startRealtime()
        })
    }
})

watch(
    () => user.value?.sub,
    (v) => {
        if (v) {
            reloadAll().then(() => {
                if (!notFound.value) startRealtime()
            })
        } else {
            stopRealtime()
            stats.value = null
            realtime.value = null
            redirectToLogin()
        }
    }
)

/* ───────────── 生命周期 ───────────── */

onMounted(async () => {
    document.addEventListener('visibilitychange', onVisibilityChange)

    if (!user.value) {
        redirectToLogin()
        return
    }

    if (invalidId.value) {
        notFound.value = true
        return
    }

    await reloadAll()
    if (!notFound.value) startRealtime()
})

onUnmounted(() => {
    document.removeEventListener('visibilitychange', onVisibilityChange)
    stopRealtime()
    if (statsAbort) statsAbort.abort()
    if (realtimeAbort) realtimeAbort.abort()
})

/* ───────────── 折线图 ───────────── */

/**
 * series 只有 1 个点画不出折线，返回 null。
 * 模板里用 todaySummary 兜底显示"今日累计"。
 */
const chart = computed(() => {
    const s = stats.value?.series
    if (!s || s.length < 2) return null

    const W = 800
    const H = 220
    const PAD_L = 40
    const PAD_R = 20
    const PAD_T = 16
    const PAD_B = 32
    const innerW = W - PAD_L - PAD_R
    const innerH = H - PAD_T - PAD_B

    const max = Math.max(1, ...s.map((p) => p.pageviews))
    const yMax = niceCeil(max)

    const step = innerW / (s.length - 1)

    const points = s.map((p, i) => {
        const x = PAD_L + i * step
        const y = PAD_T + innerH - (p.pageviews / yMax) * innerH
        return { x, y, ...p }
    })

    const line = points
        .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
        .join(' ')

    const area =
        `M${points[0].x.toFixed(1)},${(PAD_T + innerH).toFixed(1)} ` +
        points.map((p) => `L${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') +
        ` L${points[points.length - 1].x.toFixed(1)},${(PAD_T + innerH).toFixed(1)} Z`

    const yTicks = [0, 0.25, 0.5, 0.75, 1].map((r) => ({
        y: PAD_T + innerH - r * innerH,
        value: Math.round(r * yMax),
    }))

    const labelEvery = Math.max(1, Math.ceil(s.length / 6))
    const xTicks = points
        .filter((_, i) => i % labelEvery === 0 || i === points.length - 1)
        .map((p) => ({ x: p.x, label: shortLabel(p.label) }))

    return { W, H, PAD_L, PAD_R, PAD_T, PAD_B, innerH, line, area, points, yTicks, xTicks }
})

/** 只有一个点时，用于 today 的累计卡片 */
const todaySummary = computed(() => {
    if (range.value !== 'today') return null
    if (!stats.value?.totals) return null
    if (chart.value) return null  // 有图就不显示
    return {
        pageviews: stats.value.totals.pageviews || 0,
        visitors: stats.value.totals.visitors || 0,
    }
})

function niceCeil(n) {
    if (n <= 5) return 5
    const mag = Math.pow(10, Math.floor(Math.log10(n)))
    const norm = n / mag
    const nice = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10
    return nice * mag
}

function shortLabel(l) {
    if (!l) return ''
    if (l.includes('T')) return l.split('T')[1] + ':00'
    return l.slice(5)
}

/* ───────────── 顶部对比 ───────────── */

const deltas = computed(() => {
    if (!chart.value) return null
    const s = stats.value?.series || []
    if (s.length < 2) return null
    const half = Math.floor(s.length / 2)
    const cur = s.slice(-half).reduce((a, b) => a + b.pageviews, 0)
    const prev = s.slice(0, -half).reduce((a, b) => a + b.pageviews, 0)
    return { cur, prev, delta: prev === 0 ? null : (cur - prev) / prev }
})

/* ───────────── Breakdown ───────────── */

const breakdownGroups = computed(() => {
    const b = stats.value?.breakdowns || {}
    const totalPv = stats.value?.totals?.pageviews || 0
    return Object.entries(BREAKDOWN_TITLES)
        .map(([key, title]) => {
            const rows = (b[key] || []).filter((r) => r.val !== '')
            const top = rows.length ? rows[0].pageviews : 1
            return {
                key,
                title,
                rows: rows.map((r) => ({
                    ...r,
                    percent: top > 0 ? r.pageviews / top : 0,
                    ofTotal: totalPv > 0 ? r.pageviews / totalPv : 0,
                })),
            }
        })
        .filter((g) => g.rows.length > 0)
})

/* ───────────── 工具 ───────────── */

function fmt(n) {
    return Number(n ?? 0).toLocaleString()
}

function fmtPercent(n) {
    if (n == null) return ''
    const sign = n >= 0 ? '+' : ''
    return `${sign}${(n * 100).toFixed(1)}%`
}

function fmtRange(r) {
    if (!r) return ''
    return r.from === r.to ? r.from : `${r.from} ~ ${r.to}`
}

function fmtUpdated(ts) {
    if (!ts) return ''
    const d = new Date(ts)
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    const ss = String(d.getSeconds()).padStart(2, '0')
    return `${hh}:${mm}:${ss}`
}

function goBack() {
    router.push('/')
}

function refresh() {
    reloadAll().then(() => {
        Snackbar.success({ content: '已刷新', duration: 800 })
    })
}

function displayName(val) {
    if (!val) return '(空)'
    if (val === '__direct__') return '直接访问'
    return val
}

/* ───────────── 图表 hover ───────────── */

const hoverIndex = ref(-1)
const svgRef = ref(null)

function onChartMove(e) {
    if (!chart.value || !svgRef.value) return
    const rect = svgRef.value.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * chart.value.W
    const { PAD_L, PAD_R, points } = chart.value
    const innerW = chart.value.W - PAD_L - PAD_R
    const step = points.length > 1 ? innerW / (points.length - 1) : 0
    const idx = step > 0 ? Math.round((x - PAD_L) / step) : 0
    hoverIndex.value = Math.max(0, Math.min(points.length - 1, idx))
}

function onChartLeave() {
    hoverIndex.value = -1
}

const hoverPoint = computed(() => {
    if (hoverIndex.value < 0 || !chart.value) return null
    return chart.value.points[hoverIndex.value] || null
})

function tipStyle() {
    if (!hoverPoint.value || !chart.value) return {}
    const { x } = hoverPoint.value
    const { W } = chart.value
    const left = (x / W * 100) + '%'
    let transform
    if (x > W * 0.75) transform = 'translateX(-100%) translateX(-8px)'
    else if (x < W * 0.25) transform = 'translateX(8px)'
    else transform = 'translateX(-50%)'
    return { left, transform }
}
</script>

<template>
    <div class="wrap">
        <!-- 无效 id -->
        <div v-if="invalidId" class="empty-page">
            <h2>无效的站点链接</h2>
            <p>地址里的站点 ID 不是一个有效 ID。</p>
            <var-button type="primary" @click="goBack">返回站点列表</var-button>
        </div>

        <!-- 站点不存在 / 无权限 -->
        <div v-else-if="notFound" class="empty-page">
            <h2>站点不存在</h2>
            <p>该站点可能已被删除，或你无权访问它。</p>
            <var-button type="primary" @click="goBack">返回站点列表</var-button>
        </div>

        <template v-else>
            <div class="top-progress" :class="{ active: loading && stats }"></div>

            <!-- 头部 -->
            <div class="page-header">
                <div class="header-left">
                    <var-button text class="back-btn" @click="goBack">←</var-button>
                    <div class="title-block">
                        <h2>{{ stats?.site?.name || '站点数据' }}</h2>
                        <p class="domain">
                            {{ stats?.site?.domain || '' }}
                            <span v-if="lastUpdated" class="updated">
                                · {{ fmtUpdated(lastUpdated) }} 更新
                            </span>
                        </p>
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
                    <var-button size="small" @click="printPage">打印</var-button>
                </div>
            </div>

            <var-progress v-if="loading && !stats" indeterminate />

            <div v-else-if="errorMsg && !stats" class="empty-page">
                <p>{{ errorMsg }}</p>
                <var-button type="primary" @click="reloadAll">重试</var-button>
            </div>

            <template v-else-if="stats">
                <div v-if="stats" class="print-header">
                    <h1>{{ stats.site?.name }}</h1>
                    <p class="print-meta">
                        {{ stats.site?.domain }} · {{ fmtRange(stats.range) }}
                    </p>
                    <p class="print-meta">
                        导出时间：{{ new Date().toLocaleString('zh-CN') }}
                    </p>
                </div>
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
                        <span class="metric-value live">
                            <i v-if="realtime?.online > 0" class="dot"></i>
                            {{ realtime?.online ?? 0 }}
                        </span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">范围</span>
                        <span class="metric-value small">{{ fmtRange(stats.range) }}</span>
                    </div>
                </div>

                <!-- 趋势卡片 -->
                <section class="card">
                    <div class="card-head">
                        <h3>趋势</h3>
                        <span v-if="deltas" class="delta" :class="deltas.delta >= 0 ? 'up' : 'down'">
                            {{ fmtPercent(deltas.delta) }} vs 前半段
                        </span>
                    </div>

                    <!-- 折线图（>= 2 个点） -->
                    <div v-if="chart" class="chart-wrap">
                        <svg ref="svgRef" :viewBox="`0 0 ${chart.W} ${chart.H}`" class="chart" @mousemove="onChartMove"
                            @mouseleave="onChartLeave">
                            <defs>
                                <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stop-color="var(--color-primary, #5b54e8)" stop-opacity="0.24" />
                                    <stop offset="100%" stop-color="var(--color-primary, #5b54e8)" stop-opacity="0" />
                                </linearGradient>
                            </defs>

                            <!-- y 轴 -->
                            <g class="grid">
                                <g v-for="(t, i) in chart.yTicks" :key="'y' + i">
                                    <line :x1="chart.PAD_L" :y1="t.y" :x2="chart.W - chart.PAD_R" :y2="t.y" />
                                    <text :x="chart.PAD_L - 6" :y="t.y + 4" text-anchor="end" class="tick-label">{{
                                        fmt(t.value) }}</text>
                                </g>
                            </g>

                            <!-- x 轴 -->
                            <g class="grid">
                                <g v-for="(t, i) in chart.xTicks" :key="'x' + i">
                                    <text :x="t.x" :y="chart.H - 10" text-anchor="middle" class="tick-label">{{ t.label
                                        }}</text>
                                </g>
                            </g>

                            <path :d="chart.area" fill="url(#areaFill)" stroke="none" />
                            <path :d="chart.line" class="line" />

                            <!-- hover 竖线和点 -->
                            <g v-if="hoverPoint">
                                <line :x1="hoverPoint.x" :y1="chart.PAD_T" :x2="hoverPoint.x"
                                    :y2="chart.PAD_T + chart.innerH" class="cursor" />
                                <circle :cx="hoverPoint.x" :cy="hoverPoint.y" r="4" class="dot" />
                            </g>
                        </svg>

                        <div v-if="hoverPoint" class="chart-tip" :style="tipStyle()">
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

                    <!-- 今日累计（只有 1 个数据点） -->
                    <div v-else-if="todaySummary" class="today-summary">
                        <div class="today-number">{{ fmt(todaySummary.pageviews) }}</div>
                        <div class="today-label">次浏览 · 今日累计</div>
                        <div class="today-sub">
                            {{ fmt(todaySummary.visitors) }} 位访客
                        </div>
                    </div>

                    <p v-else class="empty-line">该范围内暂无数据</p>
                </section>

                <!-- 实时 -->
                <section class="card" v-if="realtime">
                    <div class="card-head">
                        <h3>最近 30 分钟</h3>
                        <span class="live-indicator" v-if="realtime.online > 0">
                            <i></i>{{ realtime.online }} 人在线
                        </span>
                    </div>

                    <div class="bars">
                        <div v-for="(m, i) in realtime.minutes" :key="i" class="bar"
                            :style="{ height: (Math.min(m.cur, 20) / 20 * 100) + '%' }"
                            :title="m.label + ' · ' + m.cur"></div>
                    </div>

                    <div class="recent-list">
                        <div v-for="(r, i) in realtime.recent" :key="i" class="recent-row">
                            <span class="recent-path" :title="r.path">{{ r.path }}</span>
                            <span class="recent-country">{{ r.country || '—' }}</span>
                            <span class="recent-time">{{ formatTime(r.ts) }}</span>
                        </div>
                        <p v-if="!realtime.recent.length" class="empty-line">暂无</p>
                    </div>
                </section>

                <!-- Breakdown -->
                <section v-for="group in breakdownGroups" :key="group.key" class="card">
                    <h3>{{ group.title }}</h3>
                    <div class="bd-list">
                        <div v-for="row in group.rows" :key="row.val" class="bd-row">
                            <span class="bd-val" :title="row.val">{{ displayName(row.val) }}</span>
                            <div class="bd-bar-wrap">
                                <div class="bd-bar" :style="{ width: (row.percent * 100) + '%' }"></div>
                            </div>
                            <span class="bd-num">{{ fmt(row.pageviews) }}</span>
                            <span class="bd-pct">{{ (row.ofTotal * 100).toFixed(1) }}%</span>
                        </div>
                    </div>
                </section>

                <div v-if="!breakdownGroups.length && stats.totals.pageviews === 0" class="empty-page">
                    <p>该时间范围内暂无数据</p>
                    <p class="hint">请确认嵌入脚本已正确安装</p>
                </div>
                <div class="print-footer">
                    Generated by AyAnalytics · {{ new Date().toLocaleDateString('zh-CN') }}
                </div>
            </template>
        </template>
    </div>
</template>

<style scoped>
.print-footer {
    display: none;
}

@media print {
    .print-footer {
        display: block !important;
        margin-top: 24px;
        padding-top: 8px;
        border-top: 1px solid #ccc;
        font-size: 11px;
        color: #888;
        text-align: center;
    }

    /* 屏幕上的 UI 全部藏掉 */
    .top-progress,
    .header-right,
    .title-block,
    .back-btn,
    .live-indicator,
    .bars,
    .recent-list,
    .empty-line,
    .delta {
        display: none !important;
    }

    /* 布局改为黑白、无背景、无阴影 */
    .wrap {
        max-width: none !important;
        padding: 0 !important;
        margin: 0 !important;
    }

    .card,
    .metric {
        background: #fff !important;
        border: 1px solid #ddd !important;
        box-shadow: none !important;
        border-radius: 4px !important;
        break-inside: avoid;
        page-break-inside: avoid;
    }

    /* 页面里的所有文字用黑色，打印才清晰 */
    * {
        color: #000 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
    }

    /* 折线图保留颜色，SVG 打印一般没问题 */
    .chart .line {
        stroke: #444 !important;
        stroke-width: 1.5 !important;
    }

    .chart .grid line {
        stroke: #e0e0e0 !important;
    }

    .chart .tick-label {
        fill: #666 !important;
        font-size: 11px !important;
    }

    /* 面积填充在黑白打印里改成浅灰 */
    .chart path[fill^="url"] {
        fill: #f0f0f0 !important;
    }

    /* Breakdown 的进度条改成灰底黑条 */
    .bd-bar-wrap {
        background: #eee !important;
    }

    .bd-bar {
        background: #666 !important;
    }

    .page-header h2 {
        font-size: 22px !important;
    }

    .domain {
        color: #666 !important;
        font-size: 13px !important;
    }

    .card {
        margin-bottom: 10px !important;
        padding: 12px 14px !important;
    }

    .metrics {
        grid-template-columns: repeat(2, 1fr) !important;
        gap: 8px !important;
    }

    .print-header {
        display: block !important;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 2px solid #000;
    }

    .print-header h1 {
        margin: 0 0 4px;
        font-size: 24px;
        color: #000;
    }

    .print-meta {
        margin: 2px 0;
        font-size: 12px;
        color: #555;
    }

    section.card:has(.bars) {
        display: none !important;
    }

    .bd-row {
        grid-template-columns: minmax(0, 2fr) minmax(40px, 1fr) auto 52px !important;
    }

    .bd-bar-wrap {
        display: block !important;
    }
}

/* 屏幕上默认隐藏打印头部 */
.print-header {
    display: none;
}

.wrap {
    max-width: 1100px;
    margin: 0 auto;
    padding: 20px;
}

/* ── 顶部加载条 ── */
.top-progress {
    position: fixed;
    top: 54px;
    left: 0;
    right: 0;
    height: 2px;
    background: transparent;
    z-index: 10;
    pointer-events: none;
}

.top-progress.active {
    background: linear-gradient(90deg,
            transparent 0%,
            var(--color-primary, #5b54e8) 50%,
            transparent 100%);
    background-size: 40% 100%;
    background-repeat: no-repeat;
    animation: slide 1.2s linear infinite;
}

@keyframes slide {
    0% {
        background-position: -40% 0;
    }

    100% {
        background-position: 140% 0;
    }
}

/* ── 空页 ── */
.empty-page {
    text-align: center;
    padding: 80px 20px;
    color: var(--color-text-secondary, #888);
}

.empty-page h2 {
    margin: 0 0 8px;
    font-size: 22px;
    color: var(--color-text, #222);
}

.empty-page p {
    margin: 0 0 20px;
}

.empty-page .hint {
    font-size: 12.5px;
    opacity: 0.7;
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

.updated {
    opacity: 0.7;
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
    display: flex;
    align-items: center;
    gap: 6px;
}

.metric-value.small {
    font-size: 15px;
    font-weight: 500;
}

.metric-value.live {
    color: #12a594;
}

.metric-value .dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #12a594;
    animation: pulse 1.6s ease-in-out infinite;
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

/* ── 变化率 ── */
.delta {
    font-size: 12px;
    font-weight: 500;
    padding: 2px 8px;
    border-radius: 6px;
    font-variant-numeric: tabular-nums;
}

.delta.up {
    color: #0f8a7a;
    background: rgba(18, 165, 148, 0.12);
}

.delta.down {
    color: #c4553d;
    background: rgba(196, 85, 61, 0.12);
}

/* ── 折线图 ── */
.chart-wrap {
    position: relative;
}

.chart {
    width: 100%;
    height: 220px;
    display: block;
    overflow: visible;
}

.chart .line {
    fill: none;
    stroke: var(--color-primary, #5b54e8);
    stroke-width: 2;
    stroke-linejoin: round;
    stroke-linecap: round;
    vector-effect: non-scaling-stroke;
}

.chart .grid line {
    stroke: var(--color-outline-variant, rgba(0, 0, 0, 0.08));
    stroke-width: 1;
    vector-effect: non-scaling-stroke;
}

.chart .tick-label {
    font-size: 10px;
    fill: var(--color-text-secondary, #888);
    font-variant-numeric: tabular-nums;
}

.chart .cursor {
    stroke: var(--color-primary, #5b54e8);
    stroke-width: 1;
    stroke-dasharray: 3 3;
    opacity: 0.6;
    vector-effect: non-scaling-stroke;
}

.chart .dot {
    fill: var(--color-primary, #5b54e8);
    stroke: var(--color-surface, #fff);
    stroke-width: 2;
    vector-effect: non-scaling-stroke;
}

.chart-tip {
    position: absolute;
    top: 8px;
    background: var(--color-surface, #fff);
    border: 1px solid var(--color-outline-variant, rgba(0, 0, 0, 0.1));
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 12px;
    pointer-events: none;
    box-shadow: 0 6px 20px -8px rgba(0, 0, 0, 0.25);
    white-space: nowrap;
    z-index: 2;
    transition: left 0.06s linear;
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

/* ── 今日累计（代替折线图） ── */
.today-summary {
    text-align: center;
    padding: 30px 0 20px;
}

.today-number {
    font-size: 48px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    line-height: 1.1;
    color: var(--color-text, #222);
}

.today-label {
    font-size: 13px;
    color: var(--color-text-secondary, #888);
    margin-top: 4px;
}

.today-sub {
    font-size: 13px;
    color: var(--color-text-secondary, #888);
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--color-outline-variant, rgba(0, 0, 0, 0.06));
    display: inline-block;
    min-width: 120px;
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
    grid-template-columns: minmax(0, 1.4fr) minmax(40px, 1fr) auto 52px;
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

.bd-pct {
    font-variant-numeric: tabular-nums;
    color: var(--color-text-secondary, #888);
    font-size: 12px;
    text-align: right;
}

/* ── 移动端 ── */
@media (max-width: 640px) {
    .wrap {
        padding: 12px;
    }

    .page-header {
        flex-direction: column;
        align-items: stretch;
    }

    .header-right {
        justify-content: space-between;
    }

    .chart {
        height: 160px;
    }

    .bd-row {
        grid-template-columns: minmax(0, 1.4fr) auto 48px;
    }

    .bd-bar-wrap {
        display: none;
    }

    .today-number {
        font-size: 40px;
    }
}
</style>