<script setup>
import { ref, computed, onMounted, inject } from 'vue'
import { Dialog, Snackbar } from '@varlet/ui'
import {
    getShortLinks,
    createShortLink,
    updateShortLink,
    deleteShortLink,
    rotateShortLink,
    transferShortLink,
    getUsers,
} from '@/console/utils/api'
import { formatDate, formatTime } from '@/shared/utils/format'
import { useIsAdmin } from '@/console/composables/useIsAdmin'
import '@varlet/ui/es/dialog/style'
import '@varlet/ui/es/snackbar/style'
import '@varlet/ui/es/form/style'
import '@varlet/ui/es/fab/style'
import '@varlet/ui/es/tabs/style'
import '@varlet/ui/es/tab/style'
import '@varlet/ui/es/checkbox/style'
import '@varlet/ui/es/date-picker/style'
import '@varlet/ui/es/popup/style'

const user = inject('user')
const isAdmin = useIsAdmin()

const LINK_LIMIT = 100
const STATUS_TABS = [
    { name: 'all', label: '全部' },
    { name: 'active', label: '正常' },
    { name: 'expired', label: '已过期' },
    { name: 'disabled', label: '已停用' },
    { name: 'deleted', label: '已删除' },
]

const loading = ref(false)
const loadingMore = ref(false)
const submitting = ref(false)
const transferring = ref(false)
const refreshState = ref(false)

const links = ref([])
const nextCursor = ref(null)
const quota = ref({ used: 0, limit: LINK_LIMIT })
const keyword = ref('')
const statusFilter = ref('all')

const createDialog = ref(false)
const editDialog = ref(false)
const transferDialog = ref(false)

const createFormRef = ref(null)
const editFormRef = ref(null)
const transferFormRef = ref(null)

const users = ref([])

const emptyCreateForm = () => ({
    target: '',
    code: '',
    title: '',
    password: '',
    expires_date: '',
})
const emptyEditForm = () => ({
    id: null,
    target: '',
    code: '',
    title: '',
    password: '',
    clear_password: false,
    expires_date: '',
})
const emptyTransferForm = () => ({ id: null, targetUserId: null })

const createForm = ref(emptyCreateForm())
const editForm = ref(emptyEditForm())
const transferForm = ref(emptyTransferForm())
const editHasPassword = ref(false)
const editExpiresAt = ref(null)
const editOriginalExpiresAt = ref(null)

/* 到期日期选择器（var-date-picker 是内联面板，这里套一层 popup） */
const datePickerVisible = ref(false)
const datePickerValue = ref('')
const datePickerTarget = ref('create') // create | edit

function todayStr() {
    const d = new Date()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${d.getFullYear()}-${m}-${day}`
}

/** 秒级时间戳 → 本地 YYYY-MM-DD */
function toDateStr(timestamp) {
    const d = new Date(timestamp * 1000)
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${d.getFullYear()}-${m}-${day}`
}

/** 选中日期 → 当天 23:59:59 的秒级时间戳 */
function dateToExpiresAt(dateStr) {
    const [year, month, day] = String(dateStr).split('-').map(Number)
    if (!year || !month || !day) return null
    return Math.floor(
        new Date(year, month - 1, day, 23, 59, 59).getTime() / 1000,
    )
}

function openDatePicker(target) {
    datePickerTarget.value = target
    const current =
        target === 'create'
            ? createForm.value.expires_date
            : editForm.value.expires_date
    datePickerValue.value = current || todayStr()
    datePickerVisible.value = true
}

function confirmDate() {
    if (!datePickerValue.value) {
        Snackbar.warning('请选择到期日期')
        return
    }
    if (dateToExpiresAt(datePickerValue.value) <= Math.floor(Date.now() / 1000)) {
        Snackbar.warning('到期日期必须晚于今天')
        return
    }
    if (datePickerTarget.value === 'create') {
        createForm.value.expires_date = datePickerValue.value
    } else {
        editForm.value.expires_date = datePickerValue.value
    }
    datePickerVisible.value = false
}

/** 清空到期日 = 永久有效 */
function clearDate() {
    if (datePickerTarget.value === 'create') {
        createForm.value.expires_date = ''
    } else {
        editForm.value.expires_date = ''
    }
    datePickerVisible.value = false
}

const isFull = computed(() => {
    if (isAdmin.value) return false
    return Number(quota.value.used || 0) >= (quota.value.limit || LINK_LIMIT)
})

const pageSubtitle = computed(() => {
    if (isAdmin.value) {
        return '管理员视图，创建数量不限'
    }
    const used = Number(quota.value.used || 0)
    return `已使用 ${used} / ${quota.value.limit || LINK_LIMIT} 条`
})

const codeHint = computed(() =>
    isAdmin.value
        ? '管理员：1–250 位，可用 a-z A-Z 1-9 / @ # $ % * ( )'
        : '3–250 位，仅限 a-z、数字 1-9 和 /',
)

/* ---------- 列表 ---------- */

async function loadLinks({ append = false } = {}) {
    if (append) loadingMore.value = true
    else loading.value = true

    try {
        const data = await getShortLinks({
            cursor: append ? nextCursor.value : null,
            q: keyword.value.trim(),
            status: statusFilter.value,
        })
        const incoming = data.links || []
        links.value = append ? [...links.value, ...incoming] : incoming
        nextCursor.value = data.next_cursor || null
        if (data.quota) quota.value = data.quota
    } catch (error) {
        Snackbar.error(error.message || '获取短链接列表失败')
    } finally {
        loading.value = false
        loadingMore.value = false
    }
}

function reload() {
    nextCursor.value = null
    loadLinks()
}

function loadMore() {
    if (!nextCursor.value || loadingMore.value) return
    loadLinks({ append: true })
}

async function onPullRefresh() {
    try {
        await loadLinks()
    } finally {
        refreshState.value = false
    }
}

/* ---------- 复制 ---------- */

async function copyText(text) {
    try {
        await navigator.clipboard.writeText(text)
        Snackbar.success('已复制到剪贴板')
    } catch {
        Snackbar.error('复制失败，请手动复制')
    }
}

/* ---------- 创建 ---------- */

function openCreate() {
    if (isFull.value) {
        Snackbar.warning(`已达到 ${quota.value.limit || LINK_LIMIT} 条上限`)
        return
    }
    createForm.value = emptyCreateForm()
    createDialog.value = true
}

async function handleCreate() {
    const valid = await createFormRef.value?.validate()
    if (!valid) return

    const form = createForm.value
    const payload = { target: form.target.trim() }
    const code = form.code.trim()
    if (code) payload.code = code
    if (form.title.trim()) payload.title = form.title.trim()
    if (form.password) payload.password = form.password
    if (form.expires_date) {
        payload.expires_at = dateToExpiresAt(form.expires_date)
    }

    submitting.value = true
    try {
        const result = await createShortLink(payload)
        createDialog.value = false
        await loadLinks()
        Snackbar.success('短链接已创建')
        if (result?.link?.short_url) {
            await copyText(result.link.short_url)
        }
    } catch (error) {
        Snackbar.error(error.message || '创建失败')
    } finally {
        submitting.value = false
    }
}

/* ---------- 编辑 ---------- */

function openEdit(link) {
    editHasPassword.value = Boolean(link.has_password)
    editExpiresAt.value = link.expires_at || null
    editOriginalExpiresAt.value = link.expires_at || null
    editForm.value = {
        id: link.id,
        target: link.target,
        code: link.code,
        title: link.title || '',
        password: '',
        clear_password: false,
        expires_date: link.expires_at ? toDateStr(link.expires_at) : '',
    }
    editDialog.value = true
}

async function handleEdit() {
    const valid = await editFormRef.value?.validate()
    if (!valid) return

    const form = editForm.value
    const payload = {
        target: form.target.trim(),
        code: form.code.trim(),
        title: form.title.trim(),
    }

    if (form.clear_password) payload.clear_password = true
    else if (form.password) payload.password = form.password

    const originalDate = editOriginalExpiresAt.value
        ? toDateStr(editOriginalExpiresAt.value)
        : ''
    if (!form.expires_date) {
        // 原来有过期时间、现在清空 → 改为永久
        if (originalDate) payload.clear_expires = true
    } else if (form.expires_date !== originalDate) {
        payload.expires_at = dateToExpiresAt(form.expires_date)
    }

    submitting.value = true
    try {
        await updateShortLink(form.id, payload)
        editDialog.value = false
        await loadLinks()
        Snackbar.success('已保存')
    } catch (error) {
        Snackbar.error(error.message || '保存失败')
    } finally {
        submitting.value = false
    }
}

/* ---------- 状态 / 删除 / 换码 ---------- */

async function toggleStatus(link) {
    const next = link.status === 'active' ? 'disabled' : 'active'
    try {
        await updateShortLink(link.id, { status: next })
        Snackbar.success(next === 'active' ? '已启用' : '已停用')
        await loadLinks()
    } catch (error) {
        Snackbar.error(error.message || '操作失败')
    }
}

async function handleDelete(link) {
    const action = await Dialog({
        title: '删除短链接',
        message: `确定删除 ${link.code} 吗？删除后链接立即失效，短码不会被释放。`,
        confirmButtonText: '删除',
        confirmButtonProps: { text: false, type: 'danger' },
        cancelButtonText: '取消',
    })
    if (action !== 'confirm') return

    try {
        await deleteShortLink(link.id)
        Snackbar.success('已删除')
        await loadLinks()
    } catch (error) {
        Snackbar.error(error.message || '删除失败')
    }
}

async function handleRotate(link) {
    const action = await Dialog({
        title: '更换短码',
        message: `将重新生成短码，旧短码 ${link.code} 会立即失效。确定继续吗？`,
        confirmButtonText: '更换',
        cancelButtonText: '取消',
    })
    if (action !== 'confirm') return

    try {
        const result = await rotateShortLink(link.id)
        await loadLinks()
        if (result?.link?.short_url) await copyText(result.link.short_url)
    } catch (error) {
        Snackbar.error(error.message || '更换失败')
    }
}

/* ---------- 转移（管理员） ---------- */

async function loadUsers() {
    if (!isAdmin.value) return
    try {
        const data = await getUsers()
        users.value = data.users || []
    } catch (error) {
        Snackbar.error(error.message || '获取用户列表失败')
    }
}

function openTransfer(link) {
    transferForm.value = { id: link.id, targetUserId: null }
    transferDialog.value = true
}

async function handleTransfer() {
    const valid = await transferFormRef.value?.validate()
    if (!valid) return

    transferring.value = true
    try {
        await transferShortLink(
            transferForm.value.id,
            transferForm.value.targetUserId,
        )
        transferDialog.value = false
        await loadLinks()
        Snackbar.success('已转移')
    } catch (error) {
        Snackbar.error(error.message || '转移失败')
    } finally {
        transferring.value = false
    }
}

/* ---------- 展示助手 ---------- */

function statusChips(link) {
    if (link.status === 'deleted') return [{ text: '已删除', type: 'danger' }]
    if (link.status === 'disabled') return [{ text: '已停用', type: 'warning' }]
    if (link.expired) return [{ text: '已过期', type: 'danger' }]
    return [{ text: '正常', type: 'success' }]
}

onMounted(() => {
    loadLinks()
    if (isAdmin.value) loadUsers()
})
</script>

<template>
    <var-pull-refresh v-model="refreshState" @refresh="onPullRefresh">
        <div class="links-page">
            <div class="md-page-header">
                <div class="md-page-heading">
                    <h1 class="md-page-title">短链接管理</h1>
                    <p class="md-page-subtitle">{{ pageSubtitle }}</p>
                </div>

                <div class="md-page-actions">
                    <var-tooltip content="刷新列表">
                        <var-button round icon-container @click="reload">
                            <my-icon icon="refresh" size="1em + 8px" />
                        </var-button>
                    </var-tooltip>
                </div>
            </div>

            <div class="link-toolbar">
                <var-input v-model="keyword" class="link-search" variant="outlined" clearable
                    placeholder="搜索短码 / 目标 / 备注" @clear="reload" />
                <var-button type="primary" @click="reload">搜索</var-button>
            </div>

            <var-tabs v-model:active="statusFilter" class="link-tabs" @change="reload">
                <var-tab v-for="tab in STATUS_TABS" :key="tab.name" :name="tab.name">
                    {{ tab.label }}
                </var-tab>
            </var-tabs>

            <var-progress v-if="loading && !links.length" indeterminate class="link-progress" />

            <var-result v-else-if="!links.length" type="empty" title="暂无短链接" description="点击右下角的浮动按钮创建第一条短链接。">
                <template #footer>
                    <var-button type="primary" @click="openCreate">创建短链接</var-button>
                </template>
            </var-result>

            <div v-else class="md-card-list">
                <var-card v-for="link in links" :key="link.id" class="link-card">
                    <template #title="{ slotClass }">
                        <div :class="slotClass" class="md-card-header">
                            <my-icon icon="link-variant" size="1.1em" />
                            <span class="md-card-title md-mono">{{ link.code }}</span>
                            <var-chip v-for="chip in statusChips(link)" :key="chip.text" :type="chip.type" size="small">
                                {{ chip.text }}
                            </var-chip>
                            <var-chip v-if="link.has_password" type="info" size="small">
                                密码
                            </var-chip>
                        </div>
                    </template>

                    <div class="link-fields">
                        <div class="link-field">
                            <span class="link-field__label">短链接</span>
                            <span class="link-field__value md-mono md-copyable" title="点击复制"
                                @click="copyText(link.short_url)">
                                {{ link.short_url }}
                            </span>
                        </div>
                        <div class="link-field">
                            <span class="link-field__label">目标</span>
                            <span class="link-field__value md-mono" :title="link.target">
                                {{ link.target }}
                            </span>
                        </div>
                        <div v-if="link.title" class="link-field">
                            <span class="link-field__label">备注</span>
                            <span class="link-field__value">{{ link.title }}</span>
                        </div>
                        <div class="link-field">
                            <span class="link-field__label">到期日期</span>
                            <span class="link-field__value">
                                {{ link.expires_at ? formatDate(link.expires_at) : '永久有效' }}
                            </span>
                        </div>
                        <div class="link-field">
                            <span class="link-field__label">点击</span>
                            <span class="link-field__value">
                                {{ link.click_count }} 次
                                <template v-if="link.last_clicked_at">
                                    · 最近 {{ formatTime(link.last_clicked_at) }}
                                </template>
                            </span>
                        </div>
                        <div v-if="isAdmin && link.creator_username" class="link-field">
                            <span class="link-field__label">创建者</span>
                            <span class="link-field__value">{{ link.creator_username }}</span>
                        </div>
                        <div class="link-field">
                            <span class="link-field__label">创建时间</span>
                            <span class="link-field__value">{{ formatTime(link.created_at) }}</span>
                        </div>
                    </div>

                    <template #extra>
                        <div class="link-actions">
                            <var-button text type="primary" size="small" @click="copyText(link.short_url)">
                                复制
                            </var-button>
                            <var-button v-if="link.status !== 'deleted'" text type="primary" size="small"
                                @click="openEdit(link)">
                                编辑
                            </var-button>
                            <var-button v-if="link.status !== 'deleted'" text size="small" @click="toggleStatus(link)">
                                {{ link.status === 'active' ? '停用' : '启用' }}
                            </var-button>
                            <var-button v-if="link.status !== 'deleted'" text type="primary" size="small"
                                @click="handleRotate(link)">
                                换短码
                            </var-button>
                            <var-button v-if="isAdmin" text type="primary" size="small" @click="openTransfer(link)">
                                转移
                            </var-button>
                            <var-button v-if="link.status !== 'deleted'" text type="danger" size="small"
                                @click="handleDelete(link)">
                                删除
                            </var-button>
                        </div>
                    </template>
                </var-card>
            </div>

            <div v-if="nextCursor" class="link-load-more">
                <var-button variant="outlined" :loading="loadingMore" @click="loadMore">
                    加载更多
                </var-button>
            </div>
        </div>
    </var-pull-refresh>

    <var-fab class="link-fab" type="primary" position="right-bottom" inactive-icon="plus" :elevation="3"
        :disabled="!user" @click="openCreate" />

    <!-- 创建 -->
    <var-dialog v-model:show="createDialog" title="创建短链接" :confirm-button="false" :cancel-button="false"
        :close-on-click-overlay="false" width="min(560px, calc(100vw - 32px))">
        <template #title>
            <div class="md-dialog-title">
                <my-icon icon="link-plus" size="1.25em" class="md-dialog-title__icon" />
                <span>创建短链接</span>
            </div>
        </template>

        <var-form ref="createFormRef" class="md-dialog-form" scroll-to-error="start" @submit.prevent>
            <var-input v-model="createForm.target" variant="outlined" placeholder="目标链接（https://...）"
                :rules="[(v) => !!String(v).trim() || '请输入目标链接']" />
            <var-input v-model="createForm.code" variant="outlined" placeholder="自定义短码（可选）" />
            <p class="md-hint">{{ codeHint }}</p>
            <var-input v-model="createForm.title" variant="outlined" placeholder="备注（可选）" :maxlength="100" />
            <var-input v-model="createForm.password" type="password" variant="outlined" placeholder="访问密码（可选，4-64 位）" />
            <div class="date-trigger" @click="openDatePicker('create')">
                <var-input v-model="createForm.expires_date" readonly variant="outlined" placeholder="到期日期（留空永久有效）" />
                <my-icon icon="calendar-blank-outline" size="20px" />
            </div>
            <p class="md-hint">
                短链接形如 <span class="md-mono">https://go.undz.cn/你的短码</span>。
                普通用户最多 100 条，管理员不限。
            </p>
        </var-form>

        <template #actions="{ slotClass }">
            <div :class="slotClass" class="md-dialog-actions">
                <var-button text type="primary" @click="createDialog = false">取消</var-button>
                <var-button type="primary" :loading="submitting" @click="handleCreate">创建</var-button>
            </div>
        </template>
    </var-dialog>

    <!-- 编辑 -->
    <var-dialog v-model:show="editDialog" title="编辑短链接" :confirm-button="false" :cancel-button="false"
        :close-on-click-overlay="false" width="min(560px, calc(100vw - 32px))">
        <template #title>
            <div class="md-dialog-title">
                <my-icon icon="pencil-outline" size="1.25em" class="md-dialog-title__icon" />
                <span>编辑短链接</span>
            </div>
        </template>

        <var-form ref="editFormRef" class="md-dialog-form" scroll-to-error="start" @submit.prevent>
            <var-input v-model="editForm.target" variant="outlined" placeholder="目标链接"
                :rules="[(v) => !!String(v).trim() || '请输入目标链接']" />
            <var-input v-model="editForm.code" variant="outlined" placeholder="短码" />
            <var-input v-model="editForm.title" variant="outlined" placeholder="备注" :maxlength="100" />
            <var-input v-model="editForm.password" type="password" variant="outlined" placeholder="新密码（留空则不修改）" />
            <var-checkbox v-if="editHasPassword" v-model="editForm.clear_password">
                清除访问密码
            </var-checkbox>
            <div class="date-trigger" @click="openDatePicker('edit')">
                <var-input v-model="editForm.expires_date" readonly variant="outlined" placeholder="到期日期（留空永久有效）" />
                <my-icon icon="calendar-blank-outline" size="20px" />
            </div>
            <p v-if="editExpiresAt" class="md-hint">
                当前到期日期：{{ formatDate(editExpiresAt) }}（23:59:59 失效）
            </p>
            <p v-else class="md-hint">
                当前永久有效；选择日期后会在当天 23:59:59 失效。
            </p>
        </var-form>

        <template #actions="{ slotClass }">
            <div :class="slotClass" class="md-dialog-actions">
                <var-button text type="primary" @click="editDialog = false">取消</var-button>
                <var-button type="primary" :loading="submitting" @click="handleEdit">保存</var-button>
            </div>
        </template>
    </var-dialog>

    <!-- 转移（管理员） -->
    <var-dialog v-model:show="transferDialog" title="转移短链接" :confirm-button="false" :cancel-button="false"
        :close-on-click-overlay="false" width="min(480px, calc(100vw - 32px))">
        <template #title>
            <div class="md-dialog-title">
                <my-icon icon="swap-horizontal" size="1.25em" class="md-dialog-title__icon" />
                <span>转移短链接</span>
            </div>
        </template>

        <var-form ref="transferFormRef" class="md-dialog-form">
            <var-select v-model="transferForm.targetUserId" variant="outlined" placeholder="选择目标账号"
                :rules="[(v) => !!v || '请选择一个账号']">
                <var-option v-for="u in users" :key="u.sub" :label="`${u.username}（UID ${u.sub}）`" :value="u.sub" />
            </var-select>
            <p class="md-hint">转移后原所有者将失去该短链接的管理权限。</p>
        </var-form>

        <template #actions="{ slotClass }">
            <div :class="slotClass" class="md-dialog-actions">
                <var-button text type="primary" @click="transferDialog = false">取消</var-button>
                <var-button type="primary" :loading="transferring" @click="handleTransfer">转移</var-button>
            </div>
        </template>
    </var-dialog>

    <!-- 到期日期：var-date-picker 是内联面板，套一层底部 popup -->
    <var-popup v-model:show="datePickerVisible" position="bottom" teleport="body" :z-index="3000" safe-area
        class="date-popup">
        <div class="date-popup__main">
            <div class="date-popup__handle"></div>
            <var-date-picker v-model="datePickerValue" :min="todayStr()" :first-day-of-week="1">
                <template #actions>
                    <div class="date-popup__actions">
                        <var-button text type="primary" @click="clearDate">永久有效</var-button>
                        <var-button type="primary" @click="confirmDate">确定</var-button>
                    </div>
                </template>
            </var-date-picker>
        </div>
    </var-popup>
</template>

<style scoped>
.links-page {
    padding-bottom: var(--md-space-4);
}

.link-toolbar {
    display: flex;
    gap: var(--md-space-2);
    align-items: center;
    margin-bottom: var(--md-space-3);
}

.link-search {
    flex: 1;
    min-width: 0;
}

.link-tabs {
    margin-bottom: var(--md-space-4);
    background: transparent;
}

.link-progress {
    margin-top: var(--md-space-2);
}

.link-fields {
    display: flex;
    flex-direction: column;
    gap: var(--md-space-3);
}

.link-field {
    display: grid;
    grid-template-columns: 88px minmax(0, 1fr);
    gap: var(--md-space-3);
    align-items: baseline;
}

.link-field__label {
    font-size: 12px;
    line-height: 16px;
    letter-spacing: 0.4px;
    color: var(--color-text-secondary);
}

.link-field__value {
    font-size: 13px;
    line-height: 20px;
    color: var(--color-text);
    word-break: break-all;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
}

.link-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: var(--md-space-1);
    width: 100%;
}

.link-load-more {
    display: flex;
    justify-content: center;
    margin-top: var(--md-space-4);
}

.date-trigger {
    display: flex;
    align-items: center;
    gap: var(--md-space-2);
    cursor: pointer;
    color: var(--color-text-secondary);
}

.date-trigger :deep(.var-input) {
    flex: 1;
    min-width: 0;
}

.link-fab {
    z-index: 92;
}

@media (max-width: 640px) {
    .link-field {
        grid-template-columns: 1fr;
        gap: 2px;
    }

    .link-toolbar {
        flex-direction: column;
        align-items: stretch;
    }
}
</style>

<!--
  var-popup 的内容节点由 Popup 内部渲染、class 通过 $attrs 合并进去，
  teleport 到 body 后 scoped 属性不保证命中，所以弹层样式放全局块。
-->
<style>
.date-popup {
    /* var-popup--bottom 默认 left:0 + width:100%。绝对定位下把 left/right
       都设为 0、再配合 margin:auto 即可水平居中；不要用 transform 居中，
       会被 Varlet 的 translateY 进出场动画覆盖。 */
    left: 0;
    right: 0;
    width: 100%;
    max-width: 700px;
    margin-left: auto;
    margin-right: auto;
    box-sizing: border-box;
    background: var(--color-surface-container-high, #fff);
    border-radius: var(--md-shape-lg) var(--md-shape-lg) 0 0;
    overflow: hidden;
}

.date-popup__main {
    width: 100%;
}

.date-popup__handle {
    width: 32px;
    height: 4px;
    margin: var(--md-space-2) auto 0;
    border-radius: 2px;
    background: var(--color-outline-variant, rgba(0, 0, 0, 0.12));
}

.date-popup__actions {
    display: flex;
    justify-content: space-between;
    gap: var(--md-space-2);
    padding: var(--md-space-2) var(--md-space-4) var(--md-space-4);
}
</style>
