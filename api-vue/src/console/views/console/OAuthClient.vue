<script setup>
import { ref, onMounted, inject, computed } from 'vue';
import { Dialog, Snackbar } from '@varlet/ui';
import { getClients, registerClient, deleteClient } from '@/console/utils/api';
import '@varlet/ui/es/dialog/style';
import '@varlet/ui/es/snackbar/style';

const user = inject('user');
const loading = ref(false);
const clients = ref([]);
const showRegisterDialog = ref(false);

// 注册表单
const registerForm = ref({
    name: '',
    redirect_uris: '',
    scope: 'openid profile email',
    trusted: false,
});

// 是否为管理员
const isAdmin = computed(() => user.value?.sub === 1);

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
            trusted: form.trusted,
        });

        Snackbar.success('客户端创建成功');
        // 显示 client_secret（只显示一次）
        await Dialog({
            title: '客户端创建成功',
            message: `Client ID: ${result.client_id}\nClient Secret: ${result.client_secret}\n请妥善保管 Client Secret，关闭后不再显示。`,
            confirmButtonText: '我已保存',
        });

        showRegisterDialog.value = false;
        registerForm.value = { name: '', redirect_uris: '', scope: 'openid profile email', trusted: false };
        await loadClients();
    } catch (error) {
        Snackbar.error(error.message || '注册失败');
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

onMounted(() => {
    loadClients();
});
</script>

<template>
    <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h2 style="margin: 0;">OAuth 客户端管理</h2>
            <var-button type="primary" @click="showRegisterDialog = true" :disabled="!user">
                注册新客户端
            </var-button>
        </div>

        <!-- 说明 -->
        <p style="color: var(--color-text-secondary); margin-bottom: 16px;">
            <span v-if="isAdmin">管理员：无限制注册</span>
            <span v-else>每个用户最多可注册 3 个 OAuth 客户端</span>
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
                            <var-chip v-if="client.trusted" type="success">受信任</var-chip>
                        </div>
                        <div style="font-size: 13px; color: var(--color-text-secondary); margin-top: 4px;">
                            <div>Client ID: <code style="cursor: pointer;"
                                    @click="copyToClipboard(client.client_id)">{{ client.client_id }}</code></div>
                            <div v-if="isAdmin && client.creator_username">创建者：{{ client.creator_username }}</div>
                            <div>回调地址：{{ client.redirect_uris }}</div>
                            <div>权限范围：{{ client.scope }}</div>
                            <div>创建时间：{{ new Date(client.created_at * 1000).toLocaleString() }}</div>
                        </div>
                    </div>
                    <var-button type="danger" @click="handleDelete(client.client_id, client.name)"
                        :disabled="!isAdmin && client.user_sub !== user?.sub">
                        删除
                    </var-button>
                </div>
            </var-card>
        </var-list>

        <!-- 注册对话框 -->
        <var-dialog v-model:show="showRegisterDialog" title="注册 OAuth 客户端">
            <div style="padding: 0 24px 16px;">
                <var-input placeholder="应用名称" v-model="registerForm.name" :rules="[v => !!v || '请输入应用名称']" />
                <var-input placeholder="回调地址（多个用逗号分隔）" v-model="registerForm.redirect_uris" textarea rows="2"
                    :rules="[v => !!v || '请输入回调地址']" style="margin-top: 12px;" />
                <var-input placeholder="权限范围（默认 openid profile email）" v-model="registerForm.scope"
                    style="margin-top: 12px;" />
                <var-checkbox v-model="registerForm.trusted" style="margin-top: 12px;">
                    设置为受信任应用
                </var-checkbox>
            </div>
            <template #actions>
                <var-button @click="showRegisterDialog = false">取消</var-button>
                <var-button type="primary" @click="handleRegister">注册</var-button>
            </template>
        </var-dialog>
    </div>
</template>

<style scoped>
code {
    background: var(--color-surface);
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 12px;
}
</style>