<script setup>
import { ref, onMounted, inject, computed } from 'vue';
import { Dialog, Snackbar } from '@varlet/ui';
import { getClients, registerClient, deleteClient, getUsers, transferOAuthClientOwner } from '@/console/utils/api';
import { formatTime } from '@/shared/utils/format';
import '@varlet/ui/es/dialog/style';
import '@varlet/ui/es/snackbar/style';

const user = inject('user');
const loading = ref(false);
const users = ref([])
const clients = ref([]);
const showRegisterDialog = ref(false);
const showTransferDialog = ref(false);
// 注册表单
const registerForm = ref({
    name: '',
    redirect_uris: '',
    scope: 'openid profile email',
    trusted: false,
});
const transferForm = ref({
    clientId: "",
    targetUserId: 1,
});
// 是否为管理员
const isAdmin = computed(() => user.value?.sub === 1);

async function loadUsers() {
    if (!isAdmin.value) {
        Snackbar.warning('只有管理员可以查看用户列表');
        return;
    }
    loading.value = true;
    try {
        const data = await getUsers();
        users.value = data.users || [];
    } catch (error) {
        Snackbar.error(error.message || '获取用户列表失败');
    } finally {
        loading.value = false;
    }
}
async function loadClients() {
    loading.value = true;
    try {
        const data = await getClients();
        clients.value = data.clients || [];
    } catch (error) {
        Snackbar.error(error.message || '获取客户端列表失败');
    } finally {
        loading.value = false;
    }
}

async function handleRegister() {
    const form = registerForm.value;
    if (!form.name.trim() || !form.redirect_uris.trim()) {
        Snackbar.warning('请填写应用名称和回调地址');
        return;
    }

    try {
        const result = await registerClient({
            name: form.name.trim(),
            redirect_uris: form.redirect_uris.trim(),
            scope: form.scope,
            trusted: isAdmin ? form.trusted : false,
        });

        Snackbar.success('客户端创建成功');
        await Dialog({
            title: '客户端创建成功',
            dialogStyle: { whiteSpace: 'pre-line' },
            cancelButton: false,
            message: `Client ID: ${result.client_id}\nClient Secret: ${result.client_secret}\n\n请妥善保管 Client Secret，关闭后不再显示。`,
            confirmButtonText: '我已保存',
        });

        showRegisterDialog.value = false;
        registerForm.value = { name: '', redirect_uris: '', scope: 'openid profile email', trusted: false };
        await loadClients();
    } catch (error) {
        Snackbar.error(error.message || '注册失败');
    }
}
async function handleTransfer() {
    const form = transferForm.value;
    if (!form.clientId.trim() || !form.targetUserId) {
        Snackbar.warning('请填写目标应用和目标用户');
        return;
    }
    console.log(users.value.length)
    if (form.targetUserId < 1 || form.targetUserId > users.value.length) {
        Snackbar.error('目标用户不合法');
        return;
    }
    try {
        await transferOAuthClientOwner(form.clientId.trim(), form.targetUserId);
        Snackbar.success('转移成功');
        showRegisterDialog.value = false;
        transferForm.value = { clientId: "", targetUserId: 1 };
        await loadClients();
    } catch (error) {
        Snackbar.error(error.message || '转移失败');
    }
}
async function handleDelete(clientId, clientName) {
    const action = await Dialog({
        title: '确认删除',
        message: `确定要删除客户端 "${clientName}" 吗？此操作不可撤销。`,
        confirmButtonText: '确认删除',
        cancelButtonText: '取消',
    });
    if (action !== 'confirm') return;

    try {
        await deleteClient(clientId);
        Snackbar.success('客户端已删除');
        await loadClients();
    } catch (error) {
        Snackbar.error(error.message || '删除失败');
    }
}

function copyToClipboard(text) {
    navigator.clipboard?.writeText(text);
    Snackbar.success('已复制到剪贴板');
}
function resetForm() {
    registerForm.value = {
        name: '',
        redirect_uris: '',
        scope: 'openid profile email',
        trusted: false
    };
    transferForm.value = {
        clientId: "",
        targetUserId: 1,
    }
}
onMounted(() => {
    loadClients();
    loadUsers();
});
</script>

<template>
    <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h2 style="margin: 0;">OAuth 客户端管理</h2>

            <div style="text-align: end;">
                <var-button v-if="isAdmin" @click="loadClients(); if (isAdmin) { loadUsers() };"
                    style="margin-inline-end: 5px; margin-bottom: 5px;">
                    刷新
                </var-button>
                <var-tooltip v-if="!user || (!isAdmin && clients.length >= 3)" content="已达到最大注册数量（3个）">
                    <span>
                        <var-button type="primary" disabled>
                            注册新客户端
                        </var-button>
                    </span>
                </var-tooltip>
                <var-button v-else type="primary" @click="showRegisterDialog = true" :disabled="!user">
                    注册新客户端
                </var-button>
            </div>
        </div>

        <!-- 说明 -->
        <p style="color: var(--color-text-secondary); margin-bottom: 16px;">
            <span v-if="isAdmin">已注册 {{ clients.length }} 个客户端</span>
            <span v-else>已注册 {{ clients.length }} / 3 个客户端</span>
        </p>

        <!-- 加载中 -->
        <var-loading v-if="loading" type="circle" />

        <p v-else-if="!clients.length">暂无 OAuth 客户端</p>

        <!-- 客户端列表 -->
        <var-list v-else>
            <var-card v-for="client in clients" :key="client.client_id" style="margin-bottom: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <strong style="font-size: 16px;">{{ client.name }}</strong>
                            <var-chip v-if="client.trusted" type="success" size="small">受信任</var-chip>
                        </div>
                        <div style="font-size: 13px; color: var(--color-text-secondary); margin-top: 4px;">
                            <div>Client ID: <span style="cursor: pointer;" @click="copyToClipboard(client.client_id)">{{
                                client.client_id }}</span></div>
                            <div v-if="isAdmin && client.creator_username">创建者：{{ client.creator_username }}</div>
                            <div>回调地址：{{ client.redirect_uris }}</div>
                            <div>权限范围：{{ client.scope }}</div>
                            <div>创建时间：{{ formatTime(client.created_at) }}</div>
                        </div>
                    </div>
                    <div>
                        <var-button type="default" v-if="isAdmin" style="margin-inline-end: 5px; margin-bottom: 5px;"
                            @click="transferForm.clientId = client.client_id; showTransferDialog = true;"
                            :disabled="!isAdmin && client.user_sub !== user?.sub">
                            转移
                        </var-button>
                        <var-button type="danger" @click="handleDelete(client.client_id, client.name)"
                            :disabled="!isAdmin && client.user_sub !== user?.sub">
                            删除
                        </var-button>
                    </div>
                </div>
            </var-card>
        </var-list>

        <!-- var-dialog 组件调用有bug，基于 var-dialog 创建原理，自己弄 -->

        <!-- var-dialog 组件调用有bug，基于 var-dialog 创建原理，自己弄一个 -->
        <var-popup v-model:show="showTransferDialog" class="var-dialog__popup" var-dialog-cover @closed="resetForm">
            <div class="var--box var-dialog">
                <div class="var-dialog__title">转移 OAuth 客户端</div>
                <div style="padding: 16px 24px 16px;" class="var-dialog__message">
                    <var-select placeholder="请选择 OAuth 应用" v-model="transferForm.clientId" style="margin-bottom: 15px;"
                        :rules="[(v) => v !== '' || '请选择一个客户端']">
                        <var-option v-for="client in clients" :key="client.client_id" :label="client.name"
                            :value="client.client_id" />
                    </var-select>
                    <var-select placeholder="请选择目标账号" v-model="transferForm.targetUserId"
                        :rules="[(v) => v !== '' || '请选择一个账号']">
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

        <var-popup v-model:show="showRegisterDialog" class="var-dialog__popup" var-dialog-cover @closed="resetForm">
            <div class="var--box var-dialog">
                <div class="var-dialog__title">注册 OAuth 客户端</div>
                <div style="padding: 0 24px 16px;" class="var-dialog__message">
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
    </div>
</template>

<style scoped></style>