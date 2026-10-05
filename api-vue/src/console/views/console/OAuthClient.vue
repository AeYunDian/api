<script setup>
import { ref, onMounted, inject } from 'vue'
import { Dialog, Snackbar } from '@varlet/ui'
import { getClients, registerClient, deleteClient, getUsers, transferOAuthClientOwner } from '@/console/utils/api'
import { formatTime } from '@/shared/utils/format'
import { useIsAdmin } from '@/console/composables/useIsAdmin'
import '@varlet/ui/es/dialog/style'
import '@varlet/ui/es/snackbar/style'

const user = inject('user')
const isAdmin = useIsAdmin()

const loading = ref(false)
const refreshState = ref(false)
const users = ref([])
const clients = ref([])
const showRegisterDialog = ref(false)
const showTransferDialog = ref(false)
const showDocDialog = ref(false)

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

async function handleRegister() {
    const form = registerForm.value
    if (!form.name.trim() || !form.redirect_uris.trim()) {
        Snackbar.warning('请填写应用名称和回调地址')
        return
    }

    try {
        const result = await registerClient({
            name: form.name.trim(),
            redirect_uris: form.redirect_uris.trim(),
            scope: form.scope,
            trusted: isAdmin.value ? form.trusted : false,
        })

        Snackbar.success('客户端创建成功')
        await Dialog({
            title: '客户端创建成功',
            dialogStyle: { whiteSpace: 'pre-line' },
            cancelButton: false,
            message: `Client ID: ${result.client_id}\nClient Secret: ${result.client_secret}\n\n请妥善保管 Client Secret，关闭后不再显示。`,
            confirmButtonText: '我已保存',
        })

        showRegisterDialog.value = false
        registerForm.value = emptyRegisterForm()
        await loadClients()
    } catch (error) {
        Snackbar.error(error.message || '注册失败')
    }
}

async function handleTransfer() {
    const form = transferForm.value
    if (!form.clientId.trim() || !form.targetUserId) {
        Snackbar.warning('请填写目标应用和目标用户')
        return
    }
    if (!users.value.some(u => u.sub === form.targetUserId)) {
        Snackbar.error('目标用户不存在')
        return
    }
    if (!clients.value.some(c => c.client_id === form.clientId)) {
        Snackbar.error('所选客户端不存在')
        return
    }
    try {
        await transferOAuthClientOwner(form.clientId.trim(), form.targetUserId)
        Snackbar.success('转移成功')
        showTransferDialog.value = false
        transferForm.value = emptyTransferForm()
        await loadClients()
    } catch (error) {
        Snackbar.error(error.message || '转移失败')
    }
}

async function handleDelete(clientId, clientName) {
    const action = await Dialog({
        title: '确认删除',
        message: `确定要删除客户端 "${clientName}" 吗？此操作不可撤销。`,
        confirmButtonText: '确认删除',
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

function copyToClipboard(text) {
    navigator.clipboard?.writeText(text)
    Snackbar.success('已复制到剪贴板')
}

function resetForm() {
    registerForm.value = emptyRegisterForm()
    transferForm.value = emptyTransferForm()
}

function openTransferDialog(clientId) {
    transferForm.value.clientId = clientId
    showTransferDialog.value = true
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
        <div>
            <div class="page-header">
                <h2>OAuth 客户端管理</h2>

                <div class="header-actions">
                    <var-tooltip content="在找接入文档？点我">
                        <var-button text @click="showDocDialog = true">
                            <my-icon icon="question-mark-circle-outline" size="1em + 10px" />
                        </var-button>
                    </var-tooltip>

                    <var-button v-if="isAdmin" @click="refreshAll" class="refresh-btn">刷新</var-button>

                    <var-tooltip v-if="!user || (!isAdmin && clients.length >= 3)" content="已达到最大注册数量（3个）">
                        <var-button type="primary" disabled>注册新客户端</var-button>
                    </var-tooltip>
                    <var-button v-else type="primary" @click="showRegisterDialog = true" :disabled="!user">
                        注册新客户端
                    </var-button>
                </div>
            </div>

            <p v-if="clients.length" class="client-count">
                <span v-if="isAdmin">已注册 {{ clients.length }} 个客户端</span>
                <span v-else>已注册 {{ clients.length }} / 3 个客户端</span>
            </p>

            <var-progress v-if="loading" indeterminate />
            <p v-else-if="!clients.length" style="margin-bottom: 70px;">暂无 OAuth 客户端</p>

            <var-list v-else>
                <var-card v-for="client in clients" :key="client.client_id" class="client-card var-elevation--2">
                    <div>
                        <div class="client-name-row">
                            <strong class="client-name">{{ client.name }}</strong>
                            <var-chip v-if="client.trusted" type="success" size="small">受信任</var-chip>
                        </div>
                        <div class="client-meta">
                            <div>
                                Client ID:
                                <span class="copyable" @click="copyToClipboard(client.client_id)">
                                    {{ client.client_id }}
                                </span>
                            </div>
                            <div v-if="isAdmin && client.creator_username">创建者：{{ client.creator_username }}</div>
                            <div>回调地址：{{ client.redirect_uris }}</div>
                            <div>权限范围：{{ client.scope }}</div>
                            <div>创建时间：{{ formatTime(client.created_at) }}</div>
                        </div>
                    </div>
                    <var-divider />
                    <div class="client-actions">
                        <var-button type="default" v-if="isAdmin" @click="openTransferDialog(client.client_id)"
                            :disabled="!isAdmin && client.user_sub !== user?.sub">
                            转移
                        </var-button>
                        <var-button type="danger" @click="handleDelete(client.client_id, client.name)"
                            :disabled="!isAdmin && client.user_sub !== user?.sub">
                            删除
                        </var-button>
                    </div>
                </var-card>
            </var-list>
        </div>
    </var-pull-refresh>

    <var-popup v-model:show="showTransferDialog" class="var-dialog__popup" var-dialog-cover @closed="resetForm">
        <div class="var--box var-dialog">
            <div class="var-dialog__title">转移 OAuth 客户端</div>
            <div class="dialog-message">
                <var-select placeholder="请选择 OAuth 应用" v-model="transferForm.clientId" style="margin-bottom: 15px;"
                    :rules="[(v) => !!v || '请选择一个客户端']">
                    <var-option v-for="client in clients" :key="client.client_id" :label="client.name"
                        :value="client.client_id" />
                </var-select>
                <var-select placeholder="请选择目标账号" v-model="transferForm.targetUserId"
                    :rules="[(v) => !!v || '请选择一个账号']">
                    <var-option v-for="u in users" :key="u.sub" :label="u.username" :value="u.sub" />
                </var-select>
            </div>
            <div class="var-dialog__actions">
                <var-button @click="showTransferDialog = false" text type="primary"
                    class="var--inline-flex var-dialog__button var-dialog__cancel-button">取消</var-button>
                <var-button @click="handleTransfer" text type="primary"
                    class="var--inline-flex var-dialog__button var-dialog__confirm-button"
                    :disabled="!isAdmin">转移</var-button>
            </div>
        </div>
    </var-popup>

    <var-popup v-model:show="showDocDialog" class="var-dialog__popup" var-dialog-cover>
        <div class="var--box var-dialog">
            <div class="var-dialog__title">OAuth 应用接入文档</div>
            <div class="dialog-message">
                <p class="doc-link" @click="openPath('/doc/oauth2.v2')">《OAuth 应用接入文档 第二版》</p>
                <p class="doc-link" @click="openPath('/doc/oauth2.v1tov2')">《OAuth 应用接入文档第一到第二版的更新摘要》</p>
                <p class="doc-link deprecated" @click="openPath('/doc/oauth2.v1')" title="此文档已过时，不再推荐">
                    《OAuth 服务文档 第一版》
                </p>
            </div>
            <div class="var-dialog__actions">
                <var-button @click="showDocDialog = false" text type="primary"
                    class="var--inline-flex var-dialog__button var-dialog__cancel-button">关闭</var-button>
            </div>
        </div>
    </var-popup>

    <var-popup v-model:show="showRegisterDialog" class="var-dialog__popup" var-dialog-cover @closed="resetForm">
        <div class="var--box var-dialog">
            <div class="var-dialog__title">注册 OAuth 客户端</div>
            <div class="dialog-message">
                <var-input placeholder="应用名称" v-model="registerForm.name" :rules="[v => !!v || '请输入应用名称']" />
                <var-input placeholder="回调地址（多个用逗号分隔）" v-model="registerForm.redirect_uris"
                    :rules="[v => !!v || '请输入回调地址']" style="margin-top: 12px;" />
                <var-input placeholder="权限范围（默认 openid profile email）" v-model="registerForm.scope"
                    style="margin-top: 12px;" />
                <var-checkbox v-model="registerForm.trusted" style="margin-top: 12px;" v-if="isAdmin">
                    设置为受信任应用
                </var-checkbox>
            </div>
            <div class="var-dialog__actions">
                <var-button @click="showRegisterDialog = false" text type="primary"
                    class="var--inline-flex var-dialog__button var-dialog__cancel-button">取消</var-button>
                <var-button @click="handleRegister" text type="primary"
                    class="var--inline-flex var-dialog__button var-dialog__confirm-button">注册</var-button>
            </div>
        </div>
    </var-popup>
</template>

<style scoped>
.page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}

.page-header h2 {
    margin: 0;
}

.header-actions {
    text-align: end;
    display: flex;
    align-items: center;
}

.refresh-btn {
    margin-inline-end: 5px;
    margin-bottom: 5px;
}

.client-count {
    color: var(--color-text-secondary);
    margin-bottom: 16px;
}

.client-card {
    margin-bottom: 12px;
}

.client-name-row {
    display: flex;
    align-items: center;
    gap: 8px;
}

.client-name {
    font-size: 16px;
}

.client-meta {
    font-size: 13px;
    color: var(--color-text-secondary);
    margin-top: 4px;
}

.copyable {
    cursor: pointer;
}

.client-actions {
    text-align: end;
    display: flex;
    justify-content: flex-end;
    gap: 5px;
}

.doc-link {
    text-decoration: none;
    word-wrap: break-word;
    user-select: none;
    cursor: pointer;
    word-break: break-all;
    width: 95%;
}

.doc-link:hover {
    text-decoration: underline;
}

.doc-link.deprecated {
    text-decoration: line-through;
}

.dialog-message {
    padding: 0 24px 16px;
}
</style>