<script setup>
import { ref, onMounted, inject, computed } from 'vue'
import { Dialog, Snackbar } from '@varlet/ui'
import { getClients, registerClient, deleteClient, getUsers, transferOAuthClientOwner } from '@/console/utils/api'
import { formatTime } from '@/shared/utils/format'
import { useIsAdmin } from '@/console/composables/useIsAdmin'
import '@varlet/ui/es/dialog/style'
import '@varlet/ui/es/snackbar/style'
import '@varlet/ui/es/form/style'
import '@varlet/ui/es/fab/style'

const user = inject('user')
const isAdmin = useIsAdmin()

/* 普通用户最多可注册 6 个客户端，管理员不限 */
const CLIENT_LIMIT = 6

const loading = ref(false)
const refreshState = ref(false)
const submitting = ref(false)
const transferring = ref(false)
const users = ref([])
const clients = ref([])
const showRegisterDialog = ref(false)
const showTransferDialog = ref(false)
const showDocDialog = ref(false)
const registerFormRef = ref(null)
const transferFormRef = ref(null)

const emptyRegisterForm = () => ({
    name: '',
    redirect_uris: '',
    scope: 'openid profile email',
    trusted: false,
})
const emptyTransferForm = () => ({
    clientId: '',
    targetUserId: 1,
})

const registerForm = ref(emptyRegisterForm())
const transferForm = ref(emptyTransferForm())

/* 是否还能注册（决定 FAB 的可点结果） */
const canRegister = computed(() => {
    if (!user?.value) return false
    return isAdmin.value || clients.value.length < CLIENT_LIMIT
})

const pageSubtitle = computed(() => {
    if (loading.value && !clients.value.length) return '正在读取客户端列表…'
    if (!clients.value.length) return '还没有注册任何 OAuth 客户端'
    if (isAdmin.value) return `已注册 ${clients.value.length} 个客户端（管理员视图）`
    return `已注册 ${clients.value.length} / ${CLIENT_LIMIT} 个客户端`
})

async function loadUsers() {
    if (!isAdmin.value) {
        Snackbar.warning('只有管理员可以查看用户列表')
        return
    }
    loading.value = true
    try {
        const data = await getUsers()
        users.value = data.users || []
    } catch (error) {
        Snackbar.error(error.message || '获取用户列表失败')
    } finally {
        loading.value = false
    }
}

async function loadClients() {
    loading.value = true
    try {
        const data = await getClients()
        clients.value = data.clients || []
    } catch (error) {
        Snackbar.error(error.message || '获取客户端列表失败')
    } finally {
        loading.value = false
    }
}

/* ---------- 注册 ---------- */

function openRegisterDialog() {
    if (!canRegister.value) {
        Snackbar.warning(
            isAdmin.value
                ? '请先登录后再注册客户端'
                : `已达到最大注册数量（${CLIENT_LIMIT} 个）`,
        )
        return
    }
    showRegisterDialog.value = true
}

async function handleRegister() {
    const valid = await registerFormRef.value?.validate()
    if (!valid) return

    const form = registerForm.value
    submitting.value = true
    try {
        const result = await registerClient({
            name: form.name.trim(),
            redirect_uris: form.redirect_uris.trim(),
            scope: form.scope,
            trusted: isAdmin.value ? form.trusted : false,
        })

        showRegisterDialog.value = false
        await loadClients()

        await Dialog({
            title: '客户端创建成功',
            message: `Client ID\n${result.client_id}\n\nClient Secret\n${result.client_secret}\n\n请妥善保管 Client Secret，关闭后不再显示。`,
            dialogStyle: { whiteSpace: 'pre-line' },
            messageAlign: 'left',
            cancelButton: false,
            confirmButtonText: '我已保存',
        })
    } catch (error) {
        Snackbar.error(error.message || '注册失败')
    } finally {
        submitting.value = false
    }
}

/* ---------- 转移 ---------- */

function openTransferDialog(clientId) {
    transferForm.value.clientId = clientId
    showTransferDialog.value = true
}

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
        await transferOAuthClientOwner(form.clientId.trim(), form.targetUserId)
        Snackbar.success('转移成功')
        showTransferDialog.value = false
        await loadClients()
    } catch (error) {
        Snackbar.error(error.message || '转移失败')
    } finally {
        transferring.value = false
    }
}

/* ---------- 删除 ---------- */

async function handleDelete(clientId, clientName) {
    const action = await Dialog({
        title: '删除客户端',
        confirmButtonProps: { text: false, type: 'danger' },
        message: `确定要删除客户端「${clientName}」吗？删除后使用该客户端的应用将立即失效，且不可撤销。`,
        confirmButtonText: '删除',
        cancelButtonText: '取消',
    })
    if (action !== 'confirm') return

    try {
        await deleteClient(clientId)
        Snackbar.success('客户端已删除')
        await loadClients()
    } catch (error) {
        Snackbar.error(error.message || '删除失败')
    }
}

/* ---------- 其他 ---------- */

function copyToClipboard(text) {
    navigator.clipboard?.writeText(text)
    Snackbar.success('已复制到剪贴板')
}

function resetForm() {
    registerForm.value = emptyRegisterForm()
    transferForm.value = emptyTransferForm()
}

async function refreshAll() {
    await loadClients()
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

function openPath(path) {
    const base = import.meta.env.PROD ? 'https://console.undz.cn' : 'https://console-dev.undz.cn'
    window.open(`${base}${path}`)
}

onMounted(() => {
    loadClients()
    if (isAdmin.value) loadUsers()
})
</script>

<template>
    <var-pull-refresh v-model="refreshState" @refresh="onPullRefresh">
        <div class="oauth-page">
            <!-- MD3 page header：标题 + 副标题（承载统计信息）+ 图标操作 -->
            <div class="md-page-header">
                <div class="md-page-heading">
                    <h1 class="md-page-title">OAuth 客户端管理</h1>
                    <p class="md-page-subtitle">{{ pageSubtitle }}</p>
                </div>

                <div class="md-page-actions">
                    <var-tooltip content="接入文档">
                        <var-button round icon-container @click="showDocDialog = true">
                            <my-icon icon="book-open-variant" size="1em + 8px" />
                        </var-button>
                    </var-tooltip>
                    <var-tooltip content="刷新列表">
                        <var-button round icon-container @click="refreshAll">
                            <my-icon icon="refresh" size="1em + 8px" />
                        </var-button>
                    </var-tooltip>
                </div>
            </div>

            <var-progress v-if="loading && !clients.length" indeterminate class="oauth-progress" />

            <!-- MD3 空状态：使用 Varlet Result，而不是手写占位 -->
            <var-result v-else-if="!clients.length" type="empty" title="暂无 OAuth 客户端"
                description="点击右下角的浮动按钮注册你的第一个客户端，注册后会得到 Client ID 与 Client Secret。">
                <template #footer>
                    <var-button type="primary" @click="openRegisterDialog">注册新客户端</var-button>
                </template>
            </var-result>

            <!-- MD3 filled card 列表 -->
            <div v-else class="md-card-list">
                <var-card v-for="client in clients" :key="client.client_id" class="client-card">
                    <template #title="{ slotClass }">
                        <div :class="slotClass" class="md-card-header">
                            <my-icon icon="application-outline" size="1.1em" />
                            <span class="md-card-title">{{ client.name }}</span>
                            <var-chip v-if="client.trusted" type="success" size="small">受信任</var-chip>
                        </div>
                    </template>

                    <div class="client-fields">
                        <div class="client-field">
                            <span class="client-field__label">Client ID</span>
                            <span class="client-field__value md-mono md-copyable" title="点击复制"
                                @click="copyToClipboard(client.client_id)">
                                {{ client.client_id }}
                            </span>
                        </div>
                        <div class="client-field">
                            <span class="client-field__label">回调地址</span>
                            <span class="client-field__value md-mono">{{ client.redirect_uris }}</span>
                        </div>
                        <div class="client-field">
                            <span class="client-field__label">权限范围</span>
                            <span class="client-field__value">{{ client.scope }}</span>
                        </div>
                        <div v-if="isAdmin && client.creator_username" class="client-field">
                            <span class="client-field__label">创建者</span>
                            <span class="client-field__value">{{ client.creator_username }}</span>
                        </div>
                        <div class="client-field">
                            <span class="client-field__label">创建时间</span>
                            <span class="client-field__value">{{ formatTime(client.created_at) }}</span>
                        </div>
                    </div>

                    <template #extra>
                        <div class="client-actions">
                            <var-button v-if="isAdmin" text type="primary" size="small"
                                @click="openTransferDialog(client.client_id)">
                                转移
                            </var-button>
                            <var-button text type="danger" size="small"
                                @click="handleDelete(client.client_id, client.name)"
                                :disabled="!isAdmin && client.user_sub !== user?.sub">
                                删除
                            </var-button>
                        </div>
                    </template>
                </var-card>
            </div>
        </div>
    </var-pull-refresh>

    <!--
        MD3 FAB：注册入口改为右下角浮动按钮（单一主操作，符合 Material 3 的
        "一个页面一个 FAB" 约定）。无子按钮时点击直接触发 @click，一步到位。
    -->
    <var-fab class="oauth-fab" type="primary" position="right-bottom" :inactive-icon="'plus'" :elevation="3"
        :disabled="!user" @click="openRegisterDialog" />

    <!-- 注册客户端：var-dialog + var-form（不再手写 dialog 结构） -->
    <var-dialog v-model:show="showRegisterDialog" title="注册 OAuth 客户端" :confirm-button="false" :cancel-button="false"
        :close-on-click-overlay="false" width="min(520px, calc(100vw - 32px))" @closed="resetForm">
        <template #title>
            <div class="md-dialog-title">
                <my-icon icon="account-plus-outline" size="1.25em" class="md-dialog-title__icon" />
                <span>注册 OAuth 客户端</span>
            </div>
        </template>
        <var-form ref="registerFormRef" class="md-dialog-form" scroll-to-error="start" @submit.prevent>
            <var-input v-model="registerForm.name" variant="outlined" placeholder="应用名称"
                :rules="[(v) => !!String(v).trim() || '请输入应用名称']" />
            <var-input v-model="registerForm.redirect_uris" variant="outlined" placeholder="回调地址（多个用逗号分隔）"
                :rules="[(v) => !!String(v).trim() || '请输入回调地址']" />
            <var-input v-model="registerForm.scope" variant="outlined" placeholder="权限范围（默认 openid profile email）" />
            <var-checkbox v-if="isAdmin" v-model="registerForm.trusted">
                设为受信任应用（跳过授权确认页）
            </var-checkbox>
            <p class="md-hint">
                回调地址必须是完整的 https 地址，多个地址用英文逗号分隔。注册成功后 Client Secret 只显示一次。
            </p>
        </var-form>

        <template #actions="{ slotClass }">
            <div :class="slotClass" class="md-dialog-actions">
                <var-button text type="primary" @click="showRegisterDialog = false">取消</var-button>
                <var-button type="primary" :loading="submitting" @click="handleRegister">注册</var-button>
            </div>
        </template>
    </var-dialog>

    <!-- 转移客户端：var-dialog + var-select -->
    <var-dialog v-model:show="showTransferDialog" title="转移 OAuth 客户端" :confirm-button="false" :cancel-button="false"
        width="min(480px, calc(100vw - 32px))" @closed="resetForm">
        <template #title>
            <div class="md-dialog-title">
                <my-icon icon="swap-horizontal" size="1.25em" class="md-dialog-title__icon" />
                <span>转移 OAuth 客户端</span>
            </div>
        </template>
        <var-form ref="transferFormRef" class="md-dialog-form">
            <var-select v-model="transferForm.clientId" variant="outlined" placeholder="选择 OAuth 应用"
                :rules="[(v) => !!v || '请选择一个客户端']">
                <var-option v-for="client in clients" :key="client.client_id" :label="client.name"
                    :value="client.client_id" />
            </var-select>
            <var-select v-model="transferForm.targetUserId" variant="outlined" placeholder="选择目标账号"
                :rules="[(v) => !!v || '请选择一个账号']">
                <var-option v-for="u in users" :key="u.sub" :label="u.username" :value="u.sub" />
            </var-select>
            <p class="md-hint">转移后原所有者将失去该客户端的查看与删除权限。</p>
        </var-form>

        <template #actions="{ slotClass }">
            <div :class="slotClass" class="md-dialog-actions">
                <var-button text type="primary" @click="showTransferDialog = false">取消</var-button>
                <var-button type="primary" :loading="transferring" @click="handleTransfer">转移</var-button>
            </div>
        </template>
    </var-dialog>

    <!-- 接入文档：var-dialog + var-cell 列表 -->
    <var-dialog v-model:show="showDocDialog" title="OAuth 应用接入文档" :cancel-button="false" confirm-button-text="关闭"
        width="min(520px, calc(100vw - 32px))">
        <template #title>
            <div class="md-dialog-title">
                <my-icon icon="book-open-variant" size="1.25em" class="md-dialog-title__icon" />
                <span>OAuth 应用接入文档</span>
            </div>
        </template>
        <div class="doc-list">
            <var-cell title="《OAuth 应用接入文档 第二版》" description="推荐阅读，包含完整的授权码流程说明" :border="true" v-ripple
                class="doc-cell" @click="openPath('/doc/oauth2.v2')">
                <template #extra>
                    <my-icon icon="open-in-new" />
                </template>
            </var-cell>
            <var-cell title="《第一到第二版的更新摘要》" description="从旧版迁移需要关注的变更点" :border="true" v-ripple class="doc-cell"
                @click="openPath('/doc/oauth2.v1tov2')">
                <template #extra>
                    <my-icon icon="open-in-new" />
                </template>
            </var-cell>
            <var-cell title="《OAuth 服务文档 第一版》" description="已过时，仅作历史参考" :border="true" v-ripple
                class="doc-cell doc-cell--deprecated" @click="openPath('/doc/oauth2.v1')">
                <template #extra>
                    <my-icon icon="open-in-new" />
                </template>
            </var-cell>
        </div>
    </var-dialog>
</template>

<style scoped>
.oauth-page {
    padding-bottom: var(--md-space-4);
}

.oauth-progress {
    margin-top: var(--md-space-2);
}


.client-fields {
    display: flex;
    flex-direction: column;
    gap: var(--md-space-3);
}

.client-field {
    display: grid;
    grid-template-columns: 104px minmax(0, 1fr);
    gap: var(--md-space-3);
    align-items: baseline;
}

.client-field__label {
    font-size: 12px;
    line-height: 16px;
    letter-spacing: 0.4px;
    color: var(--color-text-secondary);
}

.client-field__value {
    font-size: 13px;
    line-height: 20px;
    color: var(--color-text);
    word-break: break-all;
}

.client-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--md-space-1);
    width: 100%;
}

.doc-list {
    display: flex;
    flex-direction: column;
    gap: var(--md-space-1);
}

.doc-cell {
    border-radius: var(--md-shape-sm);
    cursor: pointer;
}

.doc-cell--deprecated .var-cell__title {
    text-decoration: line-through;
    color: var(--color-text-secondary);
}

/* FAB 与内容保持视觉呼吸（移动端更靠近边缘一些） */
.oauth-fab {
    z-index: 92;
}

@media (max-width: 640px) {
    .client-field {
        grid-template-columns: 1fr;
        gap: 2px;
    }
}
</style>
