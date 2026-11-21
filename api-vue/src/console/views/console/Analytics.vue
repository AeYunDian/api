<script setup>
import { ref, computed, onMounted, onUnmounted, inject } from 'vue'
import { Dialog, Snackbar } from '@varlet/ui'
import {
    getSites,
    registerSite,
    updateSite,
    deleteSite,
    getUsers,
    transferSiteOwner,
} from '@/console/utils/api'
import { formatTime } from '@/shared/utils/format'
import { useIsAdmin } from '@/console/composables/useIsAdmin'
import '@varlet/ui/es/dialog/style'
import '@varlet/ui/es/snackbar/style'
import '@varlet/ui/es/form/style'
import '@varlet/ui/es/fab/style'

// ── 上下文 ──
const user = inject('user')
const isAdmin = useIsAdmin()

// ── 常量 ──
const MY_SITE_LIMIT = 5
const DEVOPT_KEY = 'devopt-config'

const MYSITES_BASE = import.meta.env.PROD
    ? 'https://mysites.undz.cn'
    : 'https://mysites-dev.undz.cn'

const VISIBILITY_OPTIONS = [
    { value: 'private', label: '仅自己可见' },
    { value: 'logged_in', label: '登录可见' },
    { value: 'public', label: '公开' },
]

const TOTAL_ITEMS = [
    { key: 'pageviews', label: '浏览量', desc: '页面浏览次数' },
    { key: 'visitors', label: '访客数', desc: '独立访客数' },
    { key: 'sessions', label: '会话数', desc: '独立会话数' },
]

const BREAKDOWN_ITEMS = [
    { key: 'path', label: '热门页面', desc: '访问次数最多的页面路径' },
    { key: 'referrer', label: '来源', desc: '带来访问的来源域名' },
    { key: 'country', label: '国家/地区', desc: '访客所在国家或地区' },
    { key: 'browser', label: '浏览器', desc: '访客使用的浏览器' },
    { key: 'os', label: '操作系统', desc: '访客使用的操作系统' },
    { key: 'device', label: '设备', desc: '桌面、手机或平板' },
    { key: 'event', label: '自定义事件', desc: '页面内手动上报的事件' },
]

// ── 开发者选项（仅解锁 creator 勾选） ──
function readDevOptions() {
    try {
        return JSON.parse(localStorage.getItem(DEVOPT_KEY) || '{}')
    } catch {
        return {}
    }
}
const devOptions = ref(readDevOptions())
const creatorEditable = computed(
    () => !!devOptions.value.devMode && !!devOptions.value.creatorControl
)
function syncDevOptions() {
    devOptions.value = readDevOptions()
}

// ── 响应式状态 ──
const loading = ref(false)
const refreshState = ref(false)
const submitting = ref(false)
const transferring = ref(false)
const sites = ref([])
const users = ref([])

const showSiteDialog = ref(false)
const showTransferDialog = ref(false)
const showSnippetDialog = ref(false)
const snippetSite = ref(null)
const siteFormRef = ref(null)
const transferFormRef = ref(null)

const defaultShareConfig = () => ({
    totals: { pageviews: true, visitors: true, sessions: true },
    series: true,
    realtime: false,
    creator: true,
    breakdowns: {
        path: true,
        referrer: true,
        country: true,
        province: true,
        browser: true,
        os: true,
        device: true,
        event: true,
    },
})

function normalizeShareConfig(raw) {
    const base = defaultShareConfig()
    if (!raw || typeof raw !== 'object') return base
    return {
        totals: { ...base.totals, ...(raw.totals || {}) },
        series: raw.series !== undefined ? !!raw.series : base.series,
        realtime: !!raw.realtime,
        creator: raw.creator !== undefined ? !!raw.creator : true,
        breakdowns: { ...base.breakdowns, ...(raw.breakdowns || {}) },
    }
}

const emptySiteForm = () => ({
    id: null,
    name: '',
    domainsText: '',
    visibility: 'private',
    listed: false,
    share: defaultShareConfig(),
})

const emptyTransferForm = () => ({ siteId: '', targetUserId: 1 })

const siteForm = ref(emptySiteForm())
const transferForm = ref(emptyTransferForm())
const isEditing = computed(() => !!siteForm.value.id)

const limitReached = computed(
    () => !isAdmin.value && sites.value.filter((s) => s.is_owner).length >= MY_SITE_LIMIT
)

const pageSubtitle = computed(() => {
    if (loading.value && !sites.value.length) return '正在读取站点列表…'
    if (!sites.value.length) return '还没有注册任何站点'
    if (isAdmin.value) return `共 ${sites.value.length} 个站点（管理员视图）`
    return `已注册 ${sites.value.filter((s) => s.is_owner).length} / ${MY_SITE_LIMIT} 个站点`
})

// 省份三态：false / true / "CN_ONLY"
const provinceEnabled = computed({
    get: () => siteForm.value.share.breakdowns.province !== false,
    set: (v) => {
        siteForm.value.share.breakdowns.province = v ? true : false
    },
})
const provinceCnOnly = computed({
    get: () => siteForm.value.share.breakdowns.province === 'CN_ONLY',
    set: (v) => {
        siteForm.value.share.breakdowns.province = v ? 'CN_ONLY' : true
    },
})

function onVisibilityChange(value) {
    if (value === 'private') siteForm.value.listed = false
}

// 「省份」「仅中国」依赖「国家/地区」维度
const countryEnabled = computed(() => siteForm.value.share.breakdowns.country)
const provinceEditable = computed(() => countryEnabled.value && provinceEnabled.value)

function toggleField(target, key) {
    target[key] = !target[key]
}

function toggleListed() {
    siteForm.value.listed = !siteForm.value.listed
}

function toggleCreator() {
    if (!creatorEditable.value) return
    siteForm.value.share.creator = !siteForm.value.share.creator
}

function toggleBreakdown(key) {
    const breakdowns = siteForm.value.share.breakdowns
    breakdowns[key] = !breakdowns[key]
    if (key === 'country' && !breakdowns.country) breakdowns.province = false
}

function toggleProvince() {
    if (!countryEnabled.value) return
    provinceEnabled.value = !provinceEnabled.value
}

function toggleProvinceCnOnly() {
    if (!provinceEditable.value) return
    provinceCnOnly.value = !provinceCnOnly.value
}

// ── 嵌入代码 ──
const snippetQuery = computed(() => {
    if (!snippetSite.value) return ''
    return (
        '<script defer src="' +
        MYSITES_BASE +
        '/analytics.js?token=' +
        snippetSite.value.token +
        '">' +
        '</scr' +
        'ipt>'
    )
})

const snippetDataAttr = computed(() => {
    if (!snippetSite.value) return ''
    return (
        '<script defer src="' +
        MYSITES_BASE +
        '/analytics.js" data-token="' +
        snippetSite.value.token +
        '">' +
        '</scr' +
        'ipt>'
    )
})

// ── 数据加载 ──
async function loadSites() {
    loading.value = true
    try {
        const data = await getSites()
        sites.value = data.sites || []
    } catch (error) {
        Snackbar.error(error.message || '获取站点列表失败')
    } finally {
        loading.value = false
    }
}

async function loadUsers() {
    if (!isAdmin.value) return
    try {
        const data = await getUsers()
        users.value = data.users || []
    } catch (error) {
        Snackbar.error(error.message || '获取用户列表失败')
    }
}

async function refreshAll() {
    await loadSites()
    if (isAdmin.value) await loadUsers()
}

async function onPullRefresh() {
    try {
        await refreshAll()
    } catch (error) {
        Snackbar.error(error.message || '刷新失败')
    } finally {
        refreshState.value = false
    }
}

// ── 站点表单 ──
function canEdit(site) {
    return isAdmin.value || site.is_owner
}

function openCreateDialog() {
    if (!user?.value) {
        Snackbar.warning('请先登录后再注册站点')
        return
    }
    if (limitReached.value) {
        Snackbar.warning(`每个账号最多注册 ${MY_SITE_LIMIT} 个站点`)
        return
    }
    siteForm.value = emptySiteForm()
    showSiteDialog.value = true
}

function openEditDialog(site) {
    if (!canEdit(site)) return
    siteForm.value = {
        id: site.id,
        name: site.name,
        domainsText: (site.domains?.length ? site.domains : [site.domain]).join('\n'),
        visibility: site.visibility || 'private',
        listed: !!site.listed,
        share: normalizeShareConfig(site.share_config),
    }
    showSiteDialog.value = true
}

function buildSharePayload() {
    const share = JSON.parse(JSON.stringify(siteForm.value.share))
    // 省份依赖国家/地区维度；国家/地区关闭时不保留省份配置
    if (!share.breakdowns.country) share.breakdowns.province = false
    // 至少一项为 true；全关时打开 creator
    const anyOn =
        share.series ||
        share.realtime ||
        share.creator ||
        Object.values(share.totals).some(Boolean) ||
        Object.values(share.breakdowns).some(Boolean)
    if (!anyOn) share.creator = true
    return share
}

async function handleSubmitSite() {
    const valid = await siteFormRef.value?.validate()
    if (!valid) return

    const form = siteForm.value
    const domains = form.domainsText
        .split(/\r?\n/)
        .map((d) => d.trim())
        .filter(Boolean)

    const payload = {
        domains,
        name: form.name.trim() || domains[0],
        visibility: form.visibility,
        listed: form.visibility === 'private' ? false : form.listed,
        share_config: buildSharePayload(),
    }

    submitting.value = true
    try {
        if (form.id) {
            await updateSite(form.id, payload)
            Snackbar.success('站点已更新')
            showSiteDialog.value = false
            await loadSites()
        } else {
            const result = await registerSite(payload)
            Snackbar.success('站点注册成功')
            showSiteDialog.value = false
            await loadSites()
            if (result.site) {
                snippetSite.value = result.site
                showSnippetDialog.value = true
            }
        }
    } catch (error) {
        Snackbar.error(error.message || (form.id ? '更新失败' : '注册失败'))
    } finally {
        submitting.value = false
    }
}

// ── 删除 ──
async function handleDelete(site) {
    const action = await Dialog({
        title: '删除站点',
        confirmButtonProps: { text: false, type: 'danger' },
        message:
            `确定要删除站点「${site.name}」（${site.domain}）吗？\n\n` +
            `该站点的全部统计数据将被一并清除，且不可恢复。`,
        dialogStyle: { whiteSpace: 'pre-line' },
        confirmButtonText: '删除',
        cancelButtonText: '取消',
    })
    if (action !== 'confirm') return

    try {
        await deleteSite(site.id)
        Snackbar.success('站点已删除')
        await loadSites()
    } catch (error) {
        Snackbar.error(error.message || '删除失败')
    }
}

// ── 转移 ──
async function handleTransfer() {
    const valid = await transferFormRef.value?.validate()
    if (!valid) return

    const form = transferForm.value
    if (!users.value.some((u) => u.sub === form.targetUserId)) {
        Snackbar.error('目标用户不存在')
        return
    }

    transferring.value = true
    try {
        await transferSiteOwner(form.siteId, form.targetUserId)
        Snackbar.success('转移成功')
        showTransferDialog.value = false
        transferForm.value = emptyTransferForm()
        await loadSites()
    } catch (error) {
        Snackbar.error(error.message || '转移失败')
    } finally {
        transferring.value = false
    }
}

// ── 对话框开关 ──
function openTransferDialog(siteId) {
    transferForm.value.siteId = siteId
    showTransferDialog.value = true
}

function openSnippet(site) {
    if (!site.token) return
    snippetSite.value = site
    showSnippetDialog.value = true
}

function resetForms() {
    siteForm.value = emptySiteForm()
    transferForm.value = emptyTransferForm()
}

function visibilityLabel(site) {
    return VISIBILITY_OPTIONS.find((o) => o.value === site.visibility)?.label || '私密'
}

function siteDomains(site) {
    return site.domains?.length ? site.domains : [site.domain]
}

// ── 跳转概览 ──
function openOverview(site) {
    window.open(`${MYSITES_BASE}/sites/${site.id}`, '_blank', 'noopener')
}

// ── 复制 ──
function copyText(text) {
    try {
        navigator.clipboard?.writeText(text)
        Snackbar.success('已复制到剪贴板')
    } catch {
        Snackbar.error('复制失败，请手动选择')
    }
}

function copySnippet() {
    copyText(snippetQuery.value)
}

// ── 初始化 ──
onMounted(() => {
    loadSites()
    if (isAdmin.value) loadUsers()
    window.addEventListener('devmode-changed', syncDevOptions)
    window.addEventListener('storage', syncDevOptions)
})

onUnmounted(() => {
    window.removeEventListener('devmode-changed', syncDevOptions)
    window.removeEventListener('storage', syncDevOptions)
})
</script>

<template>
    <var-pull-refresh v-model="refreshState" @refresh="onPullRefresh">
        <div class="analytics-page">
            <div class="md-page-header">
                <div class="md-page-heading">
                    <h1 class="md-page-title">网站分析</h1>
                    <p class="md-page-subtitle">{{ pageSubtitle }}</p>
                </div>

                <div class="md-page-actions">
                    <var-tooltip content="刷新列表">
                        <var-button round icon-container @click="refreshAll">
                            <my-icon icon="refresh" size="1em + 8px" />
                        </var-button>
                    </var-tooltip>
                </div>
            </div>

            <var-progress v-if="loading && !sites.length" indeterminate />

            <var-result v-else-if="!sites.length" type="empty" title="暂无站点"
                description="注册站点后即可获得专属 Token，将统计脚本嵌入到网站中开始收集数据。">
                <template #footer>
                    <var-button type="primary" @click="openCreateDialog">注册新站点</var-button>
                </template>
            </var-result>

            <div v-else class="md-card-list">
                <var-card v-for="site in sites" :key="site.id" class="site-card">
                    <template #title="{ slotClass }">
                        <div :class="slotClass" class="md-card-header">
                            <my-icon icon="web" size="1.1em" />
                            <span class="md-card-title">{{ site.name }}</span>
                            <var-chip size="small">{{ visibilityLabel(site) }}</var-chip>
                            <var-chip v-if="site.listed" size="small" type="primary">列表</var-chip>
                            <var-chip v-if="!site.is_owner" size="small">他人</var-chip>
                        </div>
                    </template>

                    <div class="site-fields">
                        <div class="site-field">
                            <span class="site-field__label">域名</span>
                            <span class="site-field__value">
                                <var-chip v-for="d in siteDomains(site)" :key="d" size="small" class="domain-chip">
                                    {{ d }}
                                </var-chip>
                            </span>
                        </div>
                        <div v-if="site.token" class="site-field">
                            <span class="site-field__label">Token</span>
                            <span class="site-field__value md-mono md-copyable" title="点击复制"
                                @click="copyText(site.token)">
                                {{ site.token }}
                            </span>
                        </div>
                        <div v-if="site.creator_username" class="site-field">
                            <span class="site-field__label">创建者</span>
                            <span class="site-field__value">
                                {{ site.creator_username }}
                                <span v-if="site.user_sub === 1" class="site-owner-admin">（管理员）</span>
                            </span>
                        </div>
                        <div class="site-field">
                            <span class="site-field__label">创建时间</span>
                            <span class="site-field__value">{{ formatTime(site.created_at) }}</span>
                        </div>
                    </div>

                    <template #extra>
                        <div class="site-actions">
                            <var-button type="primary" text size="small" @click="openOverview(site)">
                                查看概览
                            </var-button>
                            <var-button v-if="site.token" text size="small" @click="openSnippet(site)">
                                嵌入代码
                            </var-button>
                            <var-button v-if="canEdit(site)" text size="small" @click="openEditDialog(site)">
                                编辑
                            </var-button>
                            <var-button v-if="isAdmin" text size="small" @click="openTransferDialog(site.id)">
                                转移
                            </var-button>
                            <var-button text type="danger" size="small" @click="handleDelete(site)"
                                :disabled="!canEdit(site)">
                                删除
                            </var-button>
                        </div>
                    </template>
                </var-card>
            </div>
        </div>
    </var-pull-refresh>

    <!-- MD3 FAB：注册站点 -->
    <var-fab class="analytics-fab" type="primary" position="right-bottom" inactive-icon="plus" :elevation="3"
        :disabled="!user" @click="openCreateDialog" />

    <!-- 注册 / 编辑站点 -->
    <var-dialog v-model:show="showSiteDialog" :confirm-button="false" :cancel-button="false"
        :close-on-click-overlay="false" width="min(560px, calc(100vw - 32px))" @closed="resetForms">
        <template #title>
            <div class="md-dialog-title">
                <my-icon :icon="isEditing ? 'pencil' : 'web-plus'" size="1.25em" class="md-dialog-title__icon" />
                <span>{{ isEditing ? '编辑站点' : '注册新站点' }}</span>
            </div>
        </template>

        <var-form ref="siteFormRef" class="md-dialog-form site-form" scroll-to-error="start" @submit.prevent>
            <var-input v-model="siteForm.name" variant="outlined" placeholder="站点名称" />

            <var-input textarea v-model="siteForm.domainsText" variant="outlined" type="textarea" :rows="4"
                placeholder="站点域名" :rules="[(v) => !!String(v).trim() || '请至少填写一个域名']" />
            <p class="md-hint field-hint">
                一行一个域名，最多 10 个，第一个作为主域名；不要协议头和路径。
            </p>

            <var-select v-model="siteForm.visibility" variant="outlined" placeholder="可见性" @change="onVisibilityChange">
                <var-option v-for="opt in VISIBILITY_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
            </var-select>

            <div v-if="siteForm.visibility !== 'private'" class="switch-list switch-list--single">
                <div class="switch-row" v-ripple @click="toggleListed">
                    <div class="switch-row__text">
                        <span class="switch-row__label">进入公开列表</span>
                        <span class="switch-row__desc">出现在 mysites 首页的公开站点区块</span>
                    </div>
                    <var-switch v-model="siteForm.listed" :size="18" @click.stop />
                </div>
            </div>

            <template v-if="siteForm.visibility !== 'private'">

                <div class="switch-row__text">
                    <p class="section-title">分享内容</p>
                    <p class="section-desc">对外展示的数据范围，至少开启一项。</p>
                </div>

                <div class="switch-list">
                    <div class="switch-row" :class="{ 'switch-row--disabled': !creatorEditable }"
                        v-ripple="{ disabled: !creatorEditable }" @click="toggleCreator">
                        <div class="switch-row__text">
                            <span class="switch-row__label">展示创建者</span>
                            <span class="switch-row__desc">分享页显示站点创建者用户名</span>
                        </div>
                        <var-switch v-model="siteForm.share.creator" :size="18" :disabled="!creatorEditable"
                            @click.stop />
                    </div>
                    <div v-for="item in TOTAL_ITEMS" :key="item.key" class="switch-row" v-ripple
                        @click="toggleField(siteForm.share.totals, item.key)">
                        <div class="switch-row__text">
                            <span class="switch-row__label">{{ item.label }}</span>
                            <span class="switch-row__desc">{{ item.desc }}</span>
                        </div>
                        <var-switch v-model="siteForm.share.totals[item.key]" :size="18" @click.stop />
                    </div>
                    <div class="switch-row" v-ripple @click="toggleField(siteForm.share, 'series')">
                        <div class="switch-row__text">
                            <span class="switch-row__label">趋势图</span>
                            <span class="switch-row__desc">按天或按小时的访问曲线</span>
                        </div>
                        <var-switch v-model="siteForm.share.series" :size="18" @click.stop />
                    </div>
                    <div class="switch-row" v-ripple @click="toggleField(siteForm.share, 'realtime')">
                        <div class="switch-row__text">
                            <span class="switch-row__label">实时数据</span>
                            <span class="switch-row__desc">最近 30 分钟的在线情况</span>
                        </div>
                        <var-switch v-model="siteForm.share.realtime" :size="18" @click.stop />
                    </div>
                </div>

                <p class="section-title">明细维度</p>

                <div class="switch-list">
                    <template v-for="item in BREAKDOWN_ITEMS" :key="item.key">
                        <div class="switch-row" v-ripple @click="toggleBreakdown(item.key)">
                            <div class="switch-row__text">
                                <span class="switch-row__label">{{ item.label }}</span>
                                <span class="switch-row__desc">{{ item.desc }}</span>
                            </div>
                            <var-switch v-model="siteForm.share.breakdowns[item.key]" :size="18" @click.stop />
                        </div>

                        <template v-if="item.key === 'country' && countryEnabled">
                            <div class="switch-row" :class="{ 'switch-row--disabled': !provinceEditable }"
                                v-ripple="{ disabled: !provinceEditable }" @click="toggleProvinceCnOnly">
                                <div class="switch-row__text">
                                    <span class="switch-row__label">仅中国</span>
                                    <span class="switch-row__desc">分享时只显示中国大陆地区的数据</span>
                                </div>
                                <var-switch v-model="provinceCnOnly" :size="18" :disabled="!provinceEditable"
                                    @click.stop />
                            </div>
                            <div class="switch-row" v-ripple @click="toggleProvince">
                                <div class="switch-row__text">
                                    <span class="switch-row__label">省份</span>
                                    <span class="switch-row__desc">分享时按中国省级拆分访客地区</span>
                                </div>
                                <var-switch v-model="provinceEnabled" :size="18" @click.stop />
                            </div>
                        </template>
                    </template>
                </div>
            </template>
        </var-form>

        <template #actions="{ slotClass }">
            <div :class="slotClass" class="md-dialog-actions">
                <var-button text type="primary" @click="showSiteDialog = false">取消</var-button>
                <var-button type="primary" :loading="submitting" @click="handleSubmitSite">
                    {{ isEditing ? '保存' : '注册' }}
                </var-button>
            </div>
        </template>
    </var-dialog>

    <!-- 转移所有者（管理员） -->
    <var-dialog v-model:show="showTransferDialog" title="转移站点所有者" :confirm-button="false" :cancel-button="false"
        width="min(480px, calc(100vw - 32px))" @closed="resetForms">
        <template #title>
            <div class="md-dialog-title">
                <my-icon icon="swap-horizontal" size="1.25em" class="md-dialog-title__icon" />
                <span>转移站点所有者</span>
            </div>
        </template>
        <var-form ref="transferFormRef" class="md-dialog-form">
            <var-select v-model="transferForm.siteId" variant="outlined" placeholder="选择站点"
                :rules="[(v) => !!v || '请选择站点']">
                <var-option v-for="site in sites" :key="site.id" :label="`${site.name}（${site.domain}）`"
                    :value="site.id" />
            </var-select>
            <var-select v-model="transferForm.targetUserId" variant="outlined" placeholder="选择目标账号"
                :rules="[(v) => !!v || '请选择目标账号']">
                <var-option v-for="u in users" :key="u.sub" :label="u.username" :value="u.sub" />
            </var-select>
        </var-form>

        <template #actions="{ slotClass }">
            <div :class="slotClass" class="md-dialog-actions">
                <var-button text type="primary" @click="showTransferDialog = false">取消</var-button>
                <var-button type="primary" :loading="transferring" @click="handleTransfer">转移</var-button>
            </div>
        </template>
    </var-dialog>

    <!-- 嵌入代码 -->
    <var-dialog v-model:show="showSnippetDialog" title="嵌入代码" :confirm-button="false" :cancel-button="false"
        width="min(640px, calc(100vw - 32px))">
        <template #title>
            <div class="md-dialog-title">
                <my-icon icon="code-tags" size="1.25em" class="md-dialog-title__icon" />
                <span>嵌入代码</span>
            </div>
        </template>
        <p class="md-hint snippet-hint">
            把下面任一段代码粘贴到 <strong>{{ snippetSite?.domain }}</strong>
            的 <code>&lt;head&gt;</code> 中即可开始统计。
        </p>

        <p class="snippet-label">写法一：Token 作为查询参数</p>
        <pre class="md-mono snippet-code" v-text="snippetQuery"></pre>

        <p class="snippet-label">写法二：Token 作为 data 属性</p>
        <pre class="md-mono snippet-code" v-text="snippetDataAttr"></pre>

        <p class="md-hint">
            两种写法等价，二选一即可。若同一标签同时声明
            <code>?token=</code> 与 <code>data-token</code>，二者必须一致，否则本次上报将被拒绝。
        </p>
        <p class="md-hint">
            自定义事件：在页面脚本里调用 <code>window.ayAnalytics('事件名')</code>。
        </p>

        <template #actions="{ slotClass }">
            <div :class="slotClass" class="md-dialog-actions">
                <var-button text type="primary" @click="showSnippetDialog = false">关闭</var-button>
                <var-button type="primary" @click="copySnippet">复制代码</var-button>
            </div>
        </template>
    </var-dialog>
</template>

<style scoped>
.analytics-page {
    padding-bottom: var(--md-space-4);
}

.site-fields {
    display: flex;
    flex-direction: column;
    gap: var(--md-space-3);
}

.site-field {
    display: grid;
    grid-template-columns: 104px minmax(0, 1fr);
    gap: var(--md-space-3);
    align-items: baseline;
}

.site-field__label {
    font-size: 12px;
    line-height: 16px;
    letter-spacing: 0.4px;
    color: var(--color-text-secondary);
}

.site-field__value {
    font-size: 13px;
    line-height: 20px;
    color: var(--color-text);
    word-break: break-all;
}

.domain-chip {
    margin: 0 6px 6px 0;
}

.site-owner-admin {
    color: var(--color-primary);
}

.site-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--md-space-1);
    flex-wrap: wrap;
    width: 100%;
}

/* ── 站点表单 ── */
.site-form {
    max-height: min(58vh, 520px);
    overflow-y: auto;
    overflow-x: hidden;
    padding-right: 2px;
    padding-top: 12px;
}

.field-hint {
    margin: 2px 0 0;
}

.section-title {
    margin: 16px 0 2px;
    font-size: 15px;
    line-height: 20px;
    font-weight: 600;
    color: var(--color-text);
}

.section-desc {
    margin: 0 0 6px;
    font-size: 12px;
    line-height: 16px;
    color: var(--color-text-secondary);
}

.switch-list {
    border-top: none;
}

.switch-list--single {
    margin-top: 8px;
}

.switch-row {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--md-space-3);
    padding: 8px;
    margin: 0 -8px;
    border-bottom: 1px solid var(--color-outline-variant, rgba(0, 0, 0, 0.08));
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.15s ease;
}

.switch-row:hover {
    background: var(--color-surface-variant, rgba(0, 0, 0, 0.04));
}

.switch-list>.switch-row:last-child {
    border-bottom: none;
}

.switch-row--disabled {
    opacity: 0.55;
    cursor: default;
}

.switch-row--disabled:hover {
    background: none;
}

.switch-row__label {
    color: var(--color-text);
    font-size: 13px;
    line-height: 18px;
}

.switch-row__text {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
}

.switch-row__desc {
    font-size: 12px;
    line-height: 16px;
    color: var(--color-text-secondary);
}

.snippet-hint {
    margin-top: 0;
}

.snippet-label {
    margin: var(--md-space-4) 0 var(--md-space-2);
    font-size: 12px;
    line-height: 16px;
    font-weight: 500;
    letter-spacing: 0.5px;
    color: var(--color-text-secondary);
}

.snippet-code {
    margin: 0;
    user-select: all;
}

.analytics-fab {
    z-index: 92;
}

@media (max-width: 640px) {
    .site-field {
        grid-template-columns: 1fr;
        gap: 2px;
    }
}
</style>
