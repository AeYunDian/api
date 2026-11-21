<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
    title: { type: String, default: '' },
    subtitle: { type: String, default: '' },
    map: { type: Object, required: true },
    rows: { type: Array, default: () => [] },
    codeToId: { type: Function, required: true },
    codeToName: { type: Function, default: (code) => code },
    /** 无数据区域的名称解析；缺省用地图数据自带的 name */
    labelFor: { type: Function, default: null },
    /** 打印表格是否列出全部区域（含 0），否则只列出有数据的 */
    printAll: { type: Boolean, default: false },
    footnote: { type: String, default: '' },
})

const wrapRef = ref(null)
const hover = ref(null)
const hoverLoc = ref(null)
const dataExpanded = ref(false)

const valueById = computed(() => {
    const map = new Map()
    for (const row of props.rows) {
        if (!row || !row.val) continue
        map.set(props.codeToId(String(row.val).toUpperCase()), row)
    }
    return map
})

const max = computed(() =>
    Math.max(1, ...props.rows.map((row) => Number(row.pageviews) || 0))
)

function labelOf(loc) {
    return (props.labelFor ? props.labelFor(loc) : loc.name) || loc.id
}

function fillFor(loc) {
    return valueById.value.has(loc.id)
        ? 'var(--color-primary, #5b54e8)'
        : 'var(--color-surface-variant, rgba(0, 0, 0, 0.07))'
}

function fillOpacity(loc) {
    const row = valueById.value.get(loc.id)
    if (!row) return 1
    const ratio = Math.max(0, Math.min(1, (Number(row.pageviews) || 0) / max.value))
    return 0.18 + 0.82 * Math.sqrt(ratio)
}

function updateHover(event, loc) {
    const rect = wrapRef.value?.getBoundingClientRect()
    if (!rect) return
    const x = Math.min(
        Math.max(event.clientX - rect.left + 12, 8),
        Math.max(rect.width - 170, 8)
    )
    const y = Math.max(event.clientY - rect.top - 12, 8)
    hover.value = { x, y, name: labelOf(loc), row: valueById.value.get(loc.id) || null }
    hoverLoc.value = loc
}

function onMove(event, loc) {
    updateHover(event, loc)
}

function onLeave() {
    hover.value = null
    hoverLoc.value = null
}

function fmt(n) {
    return Number(n || 0).toLocaleString()
}

/** 打印用：地图卡片内的数据表 */
const printList = computed(() => {
    if (props.printAll) {
        return props.map.locations
            .filter((loc) => loc.id !== 'south-sea')
            .map((loc) => {
                const row = valueById.value.get(loc.id)
                return {
                    name: labelOf(loc),
                    pageviews: Number(row?.pageviews) || 0,
                    visitors: Number(row?.visitors) || 0,
                }
            })
            .sort((a, b) => b.pageviews - a.pageviews || a.name.localeCompare(b.name, 'zh'))
    }
    return props.rows
        .map((row) => ({
            name: props.codeToName(row.val),
            pageviews: Number(row.pageviews) || 0,
            visitors: Number(row.visitors) || 0,
        }))
        .sort((a, b) => b.pageviews - a.pageviews)
})
</script>

<template>
    <section class="card geo-card">
        <div class="card-head">
            <h3>{{ title }}</h3>
            <span v-if="subtitle" class="geo-sub">{{ subtitle }}</span>
        </div>

        <div ref="wrapRef" class="geo-wrap">
            <svg :viewBox="map.viewBox" class="geo-svg" role="img" :aria-label="title">
                <path v-for="(d, i) in map.frames || []" :key="'frame-' + i" :d="d" class="geo-frame" />

                <path v-for="loc in map.locations" :key="loc.id" :d="loc.path" :fill="fillFor(loc)"
                    :fill-opacity="fillOpacity(loc)" fill-rule="evenodd" class="geo-region"
                    @mouseenter="updateHover($event, loc)" @mousemove="onMove($event, loc)" @mouseleave="onLeave" />

                <path v-for="(d, i) in map.lines || []" :key="'line-' + i" :d="d" class="geo-line" />

                <!-- 悬浮高亮单独一层，避免被相邻区域的白色描边盖住 -->
                <path v-if="hoverLoc" :d="hoverLoc.path" class="geo-highlight" fill-rule="evenodd" />
            </svg>

            <div v-if="hover" class="geo-tip" :style="{ left: hover.x + 'px', top: hover.y + 'px' }">
                <div class="geo-tip__name">{{ hover.name }}</div>
                <div class="geo-tip__row">
                    <span>浏览</span>
                    <span>{{ fmt(hover.row?.pageviews) }}</span>
                </div>
                <div class="geo-tip__row">
                    <span>访客</span>
                    <span>{{ fmt(hover.row?.visitors) }}</span>
                </div>
            </div>
        </div>

        <div class="geo-data">
            <button type="button" class="geo-data-toggle" v-ripple @click="dataExpanded = !dataExpanded">
                <span>分布数据</span>
                <var-icon :name="dataExpanded ? 'chevron-up' : 'chevron-down'" />
            </button>

            <var-collapse-transition :expand="dataExpanded">
                <div class="geo-data-body">
                    <table class="geo-data-table">
                        <thead>
                            <tr>
                                <th>地区</th>
                                <th>浏览</th>
                                <th>访客</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="item in printList" :key="item.name">
                                <td>{{ item.name }}</td>
                                <td>{{ fmt(item.pageviews) }}</td>
                                <td>{{ fmt(item.visitors) }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </var-collapse-transition>
        </div>

        <p class="geo-foot">
            <span>颜色越深表示浏览量越高</span>
            <span v-if="footnote">{{ footnote }}</span>
        </p>
    </section>
</template>

<style scoped>
.geo-card {
    padding-bottom: var(--md-space-3);
}

.geo-sub {
    font-size: 12px;
    color: var(--color-text-secondary);
}

.geo-wrap {
    position: relative;
    width: 100%;
    max-width: 640px;
    margin: 4px auto 0;
}

.geo-svg {
    display: block;
    width: 100%;
    height: auto;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
}

.geo-region {
    stroke: var(--color-surface, #fff);
    stroke-width: 0.6;
    cursor: default;
}

/* 高亮层画在所有区域之上，线条不会被邻居的白色描边遮住 */
.geo-highlight {
    fill: none;
    stroke: var(--color-primary, #5b54e8);
    stroke-width: 1.6;
    stroke-linejoin: round;
    pointer-events: none;
}

.geo-frame {
    fill: var(--color-surface, #fff);
    stroke: var(--color-outline, rgba(0, 0, 0, 0.35));
    stroke-width: 0.8;
    pointer-events: none;
}

.geo-line {
    fill: none;
    stroke: var(--color-text-secondary, rgba(0, 0, 0, 0.55));
    stroke-width: 0.9;
    pointer-events: none;
}

.geo-tip {
    position: absolute;
    z-index: 5;
    min-width: 138px;
    padding: 8px 10px;
    border-radius: 10px;
    background: var(--color-surface, #fff);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.16);
    pointer-events: none;
    font-size: 12px;
    line-height: 18px;
}

.geo-tip__name {
    margin-bottom: 2px;
    font-weight: 600;
    font-size: 13px;
}

.geo-tip__row {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    color: var(--color-text-secondary);
}

.geo-foot {
    display: flex;
    justify-content: space-between;
    gap: var(--md-space-3);
    margin: 6px 0 0;
    font-size: 11px;
    line-height: 16px;
    color: var(--color-text-secondary);
}

/* 分布数据：自绘 header + Varlet 折叠动效 */
.geo-data {
    margin-top: 4px;
    margin-bottom: 8px;
    border-top: 1px solid var(--color-outline-variant, rgba(0, 0, 0, 0.08));
    border-bottom: 1px solid var(--color-outline-variant, rgba(0, 0, 0, 0.08));

}

.geo-data-toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 10px 0;
    border: none;
    background: none;
    color: inherit;
    font: inherit;
    font-size: 13px;
    line-height: 18px;
    cursor: pointer;
}

/* .geo-data-toggle:hover {
    color: var(--color-primary, #5b54e8);
} */

.geo-data-body {
    padding-bottom: 8px;
}

.geo-data-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
    line-height: 18px;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
}

.geo-data-table th,
.geo-data-table td {
    padding: 5px 6px;
    text-align: left;
}

.geo-data-table tbody tr:nth-child(even) {
    background: var(--color-surface-variant, rgba(0, 0, 0, 0.035));
}

.geo-data-table th:nth-child(2),
.geo-data-table td:nth-child(2),
.geo-data-table th:nth-child(3),
.geo-data-table td:nth-child(3) {
    text-align: right;
}

.geo-data-table th {
    font-weight: 500;
    color: var(--color-text-secondary);
}

@media print {
    .geo-wrap {
        max-width: 420px;
    }

    /* 打印时隐藏折叠开关，强制展开数据表 */
    .geo-data-toggle {
        display: none !important;
    }

    :deep(.var-collapse-transition__content) {
        display: block !important;
        height: auto !important;
    }

    .geo-data {
        margin-top: 8px;
        border-top: none;
    }

    .geo-data-table {
        font-size: 11px;
    }

    .geo-data-table tbody tr:nth-child(even) {
        background: #f3f4f6 !important;
    }
}
</style>
