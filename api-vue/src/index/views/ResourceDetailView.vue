<script setup>
import { computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getResource, renderResourceMarkdown, bindResourceTabs, listedResources } from '@/index/resources'
import GovPanel from '@/index/components/common/GovPanel.vue'
import Breadcrumb from '@/index/components/common/Breadcrumb.vue'
import MyIcon from '@/shared/MyIcon.vue'
import '@/index/styles/markdown.css'

const route = useRoute()
const router = useRouter()

const resource = computed(() => getResource(route.params.slug))
const html = computed(() =>
    resource.value ? renderResourceMarkdown(resource.value.content) : ''
)

function bindTabs() {
    nextTick(() => bindResourceTabs())
}
onMounted(bindTabs)
watch(html, bindTabs)

/* 元信息表 */
const metaRows = computed(() => {
    const r = resource.value
    if (!r) return []
    const rows = []
    if (r.version) rows.push({ label: '版本', value: r.version, mono: true })
    if (r.license) rows.push({ label: '授权', value: r.license })
    if (r.size) rows.push({ label: '大小', value: r.size, mono: true })
    if (r.platforms.length) rows.push({ label: '平台', value: r.platforms.join(' / ') })
    if (r.official) rows.push({ label: '官方网站', value: r.official, link: r.official })
    if (r.repo) rows.push({ label: '源码仓库', value: r.repo, link: r.repo })
    if (r.docs) rows.push({ label: '文档', value: r.docs, link: r.docs })
    rows.push({ label: '收录时间', value: r.date, mono: true })
    return rows
})

/* 相关资源：同分类优先，再按标签重合度，最后按时间 */
const related = computed(() => {
    const cur = resource.value
    if (!cur) return []
    const others = listedResources.filter(r => r.slug !== cur.slug)
    if (!others.length) return []

    const scored = others.map(r => {
        let score = 0
        if (r.category === cur.category) score += 10
        const common = r.tags.filter(t => cur.tags.includes(t))
        score += common.length * 3
        return { resource: r, score }
    })

    scored.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score
        return b.resource.date.localeCompare(a.resource.date)
    })

    const picked = scored.filter(x => x.score > 0).slice(0, 3).map(x => x.resource)
    if (picked.length < 3) {
        const taken = new Set(picked.map(r => r.slug))
        const fill = others
            .filter(r => !taken.has(r.slug))
            .sort((a, b) => b.date.localeCompare(a.date))
            .slice(0, 3 - picked.length)
        picked.push(...fill)
    }
    return picked
})
</script>

<template>
    <div class="page">
        <Breadcrumb :items="[
            { label: '首页', to: '/' },
            { label: '资源', to: '/resources' },
            { label: resource?.title ?? '未找到' },
        ]" />

        <div v-if="resource" class="layout-2col">
            <GovPanel>
                <!-- 标题区 -->
                <header class="res-head">
                    <h1 class="res-title">{{ resource.title }}</h1>
                    <div class="res-meta">
                        <span>分类：<router-link :to="`/resources?category=${encodeURIComponent(resource.category)}`"
                                class="res-meta__link">{{ resource.category }}</router-link></span>
                        <span class="res-meta__sep">|</span>
                        <span>标签：<router-link v-for="t in resource.tags" :key="t"
                                :to="`/resources?q=${encodeURIComponent(t)}`" class="res-meta__link">{{ t
                                }}</router-link></span>
                        <span class="res-meta__sep">|</span>
                        <time>{{ resource.date }}</time>
                    </div>
                </header>

                <!-- 操作按钮 -->
                <section class="res-actions">
                    <a v-if="resource.downloads.length" :href="resource.downloads[0].url" target="_blank" rel="noopener"
                        class="res-btn res-btn--primary">
                        <MyIcon icon="download" />&nbsp;立即下载
                    </a>
                    <a v-if="resource.official" :href="resource.official" target="_blank" rel="noopener"
                        class="res-btn">
                        <MyIcon icon="globe" />&nbsp;官方网站
                    </a>
                    <a v-if="resource.repo" :href="resource.repo" target="_blank" rel="noopener" class="res-btn">
                        <MyIcon icon="code" />&nbsp;源码仓库
                    </a>
                    <a v-if="resource.docs" :href="resource.docs" target="_blank" rel="noopener" class="res-btn">
                        <MyIcon icon="document" />&nbsp;使用文档
                    </a>
                </section>

                <!-- 元信息表 -->
                <section class="res-info">
                    <table class="res-info__table">
                        <tbody>
                            <tr v-for="row in metaRows" :key="row.label">
                                <th>{{ row.label }}</th>
                                <td>
                                    <a v-if="row.link" :href="row.link" target="_blank" rel="noopener">{{ row.value
                                        }}</a>
                                    <span v-else :class="{ 'res-num': row.mono }">{{ row.value }}</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </section>

                <!-- 多下载通道 -->
                <section v-if="resource.downloads.length > 1" class="res-downloads">
                    <h3 class="res-block-title">其他下载通道</h3>
                    <ul class="dl-list">
                        <li v-for="(d, i) in resource.downloads.slice(1)" :key="i">
                            <a :href="d.url" target="_blank" rel="noopener" class="dl-item">
                                <span class="dl-item__name">{{ d.name }}</span>
                                <span v-if="d.platform" class="dl-item__badge">{{ d.platform }}</span>
                                <span v-if="d.version" class="dl-item__badge dl-item__badge--light">{{ d.version
                                    }}</span>
                                <span v-if="d.size" class="dl-item__size">{{ d.size }}</span>
                                <span class="dl-item__arrow">›</span>
                            </a>
                        </li>
                    </ul>
                </section>

                <!-- 正文 -->
                <article class="md-body res-body" v-html="html" />

                <footer class="res-foot">
                    <button class="res-foot__btn" @click="router.back()">
                        <MyIcon icon="arrow-left" />&nbsp;返回上一页
                    </button>
                    <router-link to="/resources" class="res-foot__btn">资源列表</router-link>
                </footer>
            </GovPanel>

            <aside class="sidebar" v-if="related.length">
                <GovPanel title="相关资源">
                    <ul class="rel">
                        <li v-for="r in related" :key="r.slug">
                            <router-link :to="`/resources/${r.slug}`" class="rel__link">{{ r.title }}</router-link>
                            <time class="rel__date">{{ r.date }}</time>
                        </li>
                    </ul>
                </GovPanel>
            </aside>
        </div>

        <GovPanel v-else title="提示">
            <p>资源不存在或已被移除。<router-link to="/resources">返回资源列表</router-link></p>
        </GovPanel>
    </div>
</template>

<style scoped>
.res-head {
    padding-bottom: var(--gov-gap-lg);
    border-bottom: 1px solid var(--gov-border);
    margin-bottom: var(--gov-gap-lg);
}

.res-title {
    font-family: var(--gov-font-title);
    font-size: var(--gov-fs-2xl);
    color: var(--gov-blue-deep);
    line-height: 1.4;
    margin-bottom: var(--gov-gap-md);
}

.res-meta {
    display: flex;
    flex-wrap: wrap;
    gap: var(--gov-gap-sm);
    font-size: var(--gov-fs-xs);
    color: var(--gov-text-muted);
}

.res-meta__sep {
    color: var(--gov-border-deep);
}

.res-meta__link {
    color: var(--gov-blue);
    margin-right: var(--gov-gap-xs);
}

/* 操作按钮区 */
.res-actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--gov-gap-md);
    padding-bottom: var(--gov-gap-lg);
    border-bottom: 1px dashed var(--gov-border);
    margin-bottom: var(--gov-gap-lg);
}

.res-btn {
    display: inline-flex;
    align-items: center;
    height: 34px;
    padding: 0 var(--gov-gap-lg);
    background: var(--gov-bg);
    border: 1px solid var(--gov-border-deep);
    color: var(--gov-text);
    font-size: var(--gov-fs-sm);
    text-decoration: none;
    transition: all .15s;
}

.res-btn:hover {
    color: var(--gov-blue);
    border-color: var(--gov-blue);
    text-decoration: none;
}

.res-btn--primary {
    background: var(--gov-btn-primary);
    border-color: var(--gov-btn-primary-border);
    color: #fff;
    font-weight: 700;
    letter-spacing: 1px;
}

.res-btn--primary:hover {
    background: var(--gov-btn-primary-hover);
    color: #fff;
}

/* 元信息表 */
.res-info {
    margin-bottom: var(--gov-gap-lg);
}

.res-info__table {
    width: 100%;
    border-collapse: collapse;
    border: 1px solid var(--gov-border);
    font-size: var(--gov-fs-sm);
}

.res-info__table th,
.res-info__table td {
    border: 1px solid var(--gov-border);
    padding: 8px 12px;
    text-align: left;
    line-height: 1.7;
    vertical-align: top;
}

.res-info__table th {
    width: 110px;
    background: var(--gov-bg-gray);
    color: var(--gov-blue-deep);
    font-weight: 700;
    white-space: nowrap;
}

.res-num {
    font-family: var(--gov-font-num);
}

/* 多下载通道 */
.res-downloads {
    margin-bottom: var(--gov-gap-lg);
}

.res-block-title {
    font-family: var(--gov-font-title);
    font-size: var(--gov-fs-md);
    color: var(--gov-blue-deep);
    padding-left: var(--gov-gap-sm);
    border-left: 3px solid var(--gov-blue);
    margin-bottom: var(--gov-gap-md);
}

.dl-list {
    border: 1px solid var(--gov-border);
    background: var(--gov-bg);
}

.dl-list li+li {
    border-top: 1px dashed var(--gov-border);
}

.dl-item {
    display: flex;
    align-items: center;
    gap: var(--gov-gap-md);
    padding: 10px var(--gov-gap-lg);
    color: var(--gov-text);
    text-decoration: none;
    font-size: var(--gov-fs-sm);
    transition: background .15s;
}

.dl-item:hover {
    background: var(--gov-bg-blue);
    color: var(--gov-blue-deep);
    text-decoration: none;
}

.dl-item__name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.dl-item__badge {
    flex: none;
    font-size: var(--gov-fs-xs);
    padding: 1px var(--gov-gap-sm);
    background: var(--gov-blue-light);
    color: var(--gov-blue-deep);
    border-radius: var(--gov-radius-sm);
}

.dl-item__badge--light {
    background: var(--gov-bg-gray);
    color: var(--gov-text-sub);
}

.dl-item__size {
    flex: none;
    font-family: var(--gov-font-num);
    font-size: var(--gov-fs-xs);
    color: var(--gov-text-muted);
}

.dl-item__arrow {
    flex: none;
    color: var(--gov-text-muted);
}

/* 页脚 */
.res-foot {
    display: flex;
    align-items: center;
    gap: var(--gov-gap-md);
    padding-top: var(--gov-gap-lg);
    border-top: 1px solid var(--gov-border);
    margin-top: var(--gov-gap-xl);
}

.res-foot__btn {
    display: inline-flex;
    align-items: center;
    height: 30px;
    padding: 0 var(--gov-gap-lg);
    border: 1px solid var(--gov-border-deep);
    background: var(--gov-bg);
    color: var(--gov-text);
    font-size: var(--gov-fs-sm);
    text-decoration: none;
}

.res-foot__btn:hover {
    color: var(--gov-blue);
    border-color: var(--gov-blue);
    text-decoration: none;
}

/* 相关资源 */
.rel li {
    padding: var(--gov-gap-sm) 0;
    border-bottom: 1px dashed var(--gov-border);
}

.rel li:last-child {
    border-bottom: none;
}

.rel__link {
    display: block;
    font-size: var(--gov-fs-sm);
    color: var(--gov-text);
    margin-bottom: 2px;
}

.rel__link:hover {
    color: var(--gov-blue);
}

.rel__date {
    font-size: var(--gov-fs-xs);
    color: var(--gov-text-muted);
    font-family: var(--gov-font-num);
}
</style>