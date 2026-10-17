<script setup>
import { ref, computed, onMounted, inject } from 'vue'
import { Dialog, Snackbar } from '@varlet/ui'
import {
    getSites,
    registerSite,
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
// 普通用户最多可注册的站点数；user.sub === 1 不受限
const MY_SITE_LIMIT = 5

// 概览站点（独立的 SPA，不在本组件内渲染）
const MYSITES_BASE = import.meta.env.PROD
    ? 'https://mysites.undz.cn'
    : 'https://mysites-dev.undz.cn'

// ── 响应式状态 ──
const loading = ref(false)
const refreshState = ref(false)
const submitting = ref(false)
const transferring = ref(false)
const sites = ref([])
const users = ref([])

const showRegisterDialog = ref(false)
const showTransferDialog = ref(false)
const showSnippetDialog = ref(false)
const snippetSite = ref(null)
const registerFormRef = ref(null)
const transferFormRef = ref(null)

const emptyRegisterForm = () => ({ domain: '', name: '' })
const emptyTransferForm = () => ({ siteId: '', targetUserId: 1 })

const registerForm = ref(emptyRegisterForm())
const transferForm = ref(emptyTransferForm())

// 普通用户达到上限时禁用注册入口。管理员始终不受限。
// 普通用户看到列表即为自己所有；管理员看到全量，故此处只对非管理员判长。
const limitReached = computed(
    () => !isAdmin.value && sites.value.length >= MY_SITE_LIMIT
)

const pageSubtitle = computed(() => {
    if (loading.value && !sites.value.length) return '正在读取站点列表…'
    if (!sites.value.length) return '还没有注册任何站点'
    if (isAdmin.value) return `共 ${sites.value.length} 个站点（管理员视图）`
    return `已注册 ${sites.value.length} / ${MY_SITE_LIMIT} 个站点`
})

// ── 嵌入代码 ──
// 两种写法任选其一；同时出现则必须一致，否则跟踪脚本拒绝上报
const snippetQuery = computed(() => {
    if (!snippetSite.value) return ''
    return (
        '<script defer src="' +
        MYSITES_BASE +
        '/analytics.js?token=' +
        snippetSite.value.token +
        '"><\/script>'
    )
})

const snippetDataAttr = computed(() => {
    if (!snippetSite.value) return ''
    return (
        '<script defer src="' +
        MYSITES_BASE +
        '/analytics.js" data-token="' +
        snippetSite.value.token +
        '"><\/script>'
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

// ── 注册 ──
function openRegisterDialog() {
    if (!user?.value) {
        Snackbar.warning('请先登录后再注册站点')
        return
    }
    if (limitReached.value) {
        Snackbar.warning(`每个账号最多注册 ${MY_SITE_LIMIT} 个站点`)
        return
    }
    showRegisterDialog.value = true
}

async function handleRegister() {
    const valid = await registerFormRef.value?.validate()
    if (!valid) return

    const form = registerForm.value
    const domain = form.domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '')

    submitting.value = true
    try {
        const result = await registerSite({
            domain,
            name: form.name.trim() || domain,
        })
        Snackbar.success('站点注册成功')
        showRegisterDialog.value = false
        registerForm.value = emptyRegisterForm()
        await loadSites()

        // 顺手把嵌入代码推到用户面前
        if (result.site) {
            snippetSite.value = result.site
            showSnippetDialog.value = true
        }
    } catch (error) {
        Snackbar.error(error.message || '注册失败')
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
    snippetSite.value = site
    showSnippetDialog.value = true
}

function resetForms() {
    registerForm.value = emptyRegisterForm()
    transferForm.value = emptyTransferForm()
}

// ── 跳转概览 ──
// 实际数据视图在 mysites.undz.cn，这里只是把用户送过去
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
                description="注册站点后即可获得专属 Token，把统计脚本嵌入到你的网站中开始收集数据。">
                <template #footer>
                    <var-button type="primary" @click="openRegisterDialog">注册新站点</var-button>
                </template>
            </var-result>

            <div v-else class="md-card-list">
                <var-card v-for="site in sites" :key="site.id" class="site-card">
                    <template #title="{ slotClass }">
                        <div :class="slotClass" class="md-card-header">
                            <my-icon icon="web" size="1.1em" />
                            <span class="md-card-title">{{ site.name }}</span>
                            <var-chip size="small">{{ site.domain }}</var-chip>
                        </div>
                    </template>

                    <div class="site-fields">
                        <div class="site-field">
                            <span class="site-field__label">Token</span>
                            <span class="site-field__value md-mono md-copyable" title="点击复制"
                                @click="copyText(site.token)">
                                {{ site.token }}
                            </span>
                        </div>
                        <div v-if="isAdmin && site.creator_username" class="site-field">
                            <span class="site-field__label">所有者</span>
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
                            <var-button text size="small" @click="openSnippet(site)">
                                嵌入代码
                            </var-button>
                            <var-button v-if="isAdmin" text size="small" @click="openTransferDialog(site.id)">
                                转移
                            </var-button>
                            <var-button text type="danger" size="small" @click="handleDelete(site)"
                                :disabled="!isAdmin && site.user_sub !== user?.sub">
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
        :disabled="!user" @click="openRegisterDialog" />

    <!-- 注册站点 -->
    <var-dialog v-model:show="showRegisterDialog" title="注册新站点" :confirm-button="false" :cancel-button="false"
        :close-on-click-overlay="false" width="min(520px, calc(100vw - 32px))" @closed="resetForms">
        <template #title>
            <div class="md-dialog-title">
                <my-icon icon="web-plus" size="1.25em" class="md-dialog-title__icon" />
                <span>注册新站点</span>
            </div>
        </template>
        <var-form ref="registerFormRef" class="md-dialog-form" scroll-to-error="start" @submit.prevent>
            <var-input v-model="registerForm.domain" variant="outlined" placeholder="站点域名，如 example.com"
                :rules="[(v) => !!String(v).trim() || '请输入域名']" />
            <var-input v-model="registerForm.name" variant="outlined" placeholder="站点名称（可选，默认使用域名）" />
            <p class="md-hint">
                只填裸域名 —— 不要协议头，不要末尾斜杠。注册成功后会得到一个专属 Token 用于嵌入脚本。
            </p>
        </var-form>

        <template #actions="{ slotClass }">
            <div :class="slotClass" class="md-dialog-actions">
                <var-button text type="primary" @click="showRegisterDialog = false">取消</var-button>
                <var-button type="primary" :loading="submitting" @click="handleRegister">注册</var-button>
            </div>
        </template>
    </var-dialog>

    <!-- 转移所有者（管理员） -->
    <var-dialog v-model:show="showTransferDialog" title="转移站点所有者" :confirm-button="false"
        :cancel-button="false" width="min(480px, calc(100vw - 32px))" @closed="resetForms">
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
