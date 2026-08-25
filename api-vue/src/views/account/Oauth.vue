<script setup>
import { ref, onMounted } from 'vue';
import { Dialog, Snackbar } from '@varlet/ui';
import { getOAuthApps, revokeOAuthApp } from '@/utils/api';
import '@varlet/ui/es/dialog/style';
import '@varlet/ui/es/snackbar/style';

const apps = ref([]);
const loading = ref(false);

async function fetchApps() {
    // if (true) {
    //     loading.value = true;
    //     await new Promise(resolve => setTimeout(resolve, 500));
    //     apps.value = mockApps;
    //     loading.value = false;
    //     return;
    // }
    loading.value = true;
    try {
        const data = await getOAuthApps();
        apps.value = data.apps || [];
    } catch (error) {
        Snackbar.error('获取授权应用列表失败');
        console.error(error);
    } finally {
        loading.value = false;
    }
}
const mockApps = [
    {
        client_id: 'app_chat',
        name: '聊天助手',
        scope: 'openid profile email',
        trusted: true,
        created_at: 1745568000,
        authorized_at: 1745568000,
        token_count: 2,
    },
    {
        client_id: 'app_editor',
        name: '在线编辑器',
        scope: 'openid profile',
        trusted: false,
        created_at: 1745654400,
        authorized_at: 1745654400,
        token_count: 1,
    },
    {
        client_id: 'app_storage',
        name: '云存储',
        scope: 'openid profile offline_access',
        trusted: false,
        created_at: 1745740800,
        authorized_at: 1745740800,
        token_count: 3,
    },
];
async function handleRevoke(clientId, appName) {
    const action = await Dialog({
        title: '确认撤销',
        message: `确定要撤销 "${appName}" 的授权吗？撤销后该应用将无法访问您的账号信息。`
    });
    if (action !== 'confirm') return;
    try {
        await revokeOAuthApp(clientId);
        Snackbar.success(`已撤销 ${appName} 的授权`);
        // 重新加载列表
        await fetchApps();
    } catch (error) {
        Dialog({
            title: '撤销失败',
            message: error.message || '请重试'
        });
    }
}

onMounted(fetchApps);

const scopeMap = {
    'openid': '身份标识',
    'profile': '用户资料',
    'email': '邮箱',
    'offline_access': '离线访问',
    'phone': '手机号',
    'address': '地址',
};
function translateScope(scope) {
    if (!scope) return '未申请权限';
    const scopes = scope.split(' ').filter(s => s);
    const translated = scopes.map(s => scopeMap[s] || s); // 未定义的保留原文
    return translated.join('、');
}
</script>

<template>
    <div>
        <h2>授权管理</h2>
        <var-loading v-if="loading" />
        <template v-else>
            <var-list v-if="apps.length">
                <var-card v-for="app in apps" :key="app.client_id" style="margin-bottom: 16px;">
                    <div>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <h3>{{ app.name }}</h3>
                            <var-button type="danger" size="small" @click="handleRevoke(app.client_id, app.name)">
                                撤销授权
                            </var-button>
                        </div>
                        <div style="font-size: 14px; color: var(--color-text-secondary);">
                            <p>授权范围: {{ translateScope(app.scope) }}</p>
                            <p>授权时间: {{ app.authorized_at ? new Date(app.authorized_at * 1000).toLocaleString() : '未知'
                            }}</p>
                            <p>登录设备数: {{ app.token_count }}</p>
                        </div>
                    </div>
                </var-card>
            </var-list>
            <div v-else style="text-align: center; ">
                <p style="color: var(--color-text-disabled);">
                    暂无第三方应用授权

                </p>
                <var-button @click="fetchApps">刷新</var-button>
            </div>

        </template>
    </div>
</template>