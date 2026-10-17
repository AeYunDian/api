<script setup>
import { ref, onMounted } from 'vue';
import { Dialog, Snackbar } from '@varlet/ui';
import { formatTime } from '@/shared/utils/format';
import { getOAuthApps, revokeOAuthApp, revokeOAuthTokens } from '@/account/utils/api';
import { useDevice } from "@/shared/composables/useDevice";
const { mobileByWidth } = useDevice();
import '@varlet/ui/es/dialog/style';
import '@varlet/ui/es/snackbar/style';
const refreshState = ref(false);
const apps = ref([]);
const loading = ref(false);


async function handleRevokeAll() {
    const action = await Dialog({
        title: '确认',
        confirmButtonProps: { text: false, type: 'danger' },
        message: '确定要撤销所有第三方应用的授权吗？'
    });
    if (action === 'confirm') {
        try {
            await revokeOAuthTokens();
            Snackbar.success('已撤销所有第三方应用授权');
            await fetchApps(); // 刷新列表
        } catch (error) {
            Dialog({ title: '操作失败', message: error.message });
        }
    }
}

async function fetchApps() {

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

async function handleRevoke(clientId, appName) {
    const action = await Dialog({
        title: '确认撤销',
        confirmButtonProps: { text: false, type: 'danger' },
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
async function onPullRefresh() {
    try {
        await fetchApps();
    } catch (error) {
        Snackbar.error(error.message)
    } finally {
        refreshState.value = false;
    }
}
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
    <var-pull-refresh v-model="refreshState" @refresh="onPullRefresh">
        <div class="oauth-page">
            <div class="md-page-header">
                <div class="md-page-heading">
                    <h1 class="md-page-title">授权管理</h1>
                    <p class="md-page-subtitle">
                        {{ apps.length ? `已授权 ${apps.length} 个第三方应用` : '还没有第三方应用获得授权' }}
                    </p>
                </div>

                <div class="md-page-actions" v-if="apps.length">
                    <var-button type="danger" tonal size="small" @click="handleRevokeAll">
                        撤销全部授权
                    </var-button>
                </div>
            </div>

            <var-progress v-if="loading && !apps.length" indeterminate />

            <var-result v-else-if="!apps.length" type="empty" title="暂无第三方应用授权"
                description="当你在第三方应用中使用 Ay 账号登录后，授权记录会显示在这里。">
                <template #footer>
                    <var-button type="primary" @click="fetchApps">刷新</var-button>
                </template>
            </var-result>

            <div v-else class="md-card-list">
                <var-card v-for="app in apps" :key="app.client_id" class="app-card">
                    <template #title="{ slotClass }">
                        <div :class="slotClass" class="md-card-header">
                            <my-icon icon="application-outline" size="1.1em" />
                            <span class="md-card-title">{{ app.name }}</span>
                        </div>
                    </template>

                    <div class="app-fields">
                        <div class="app-field">
                            <span class="app-field__label">授权范围</span>
                            <span class="app-field__value">{{ translateScope(app.scope) }}</span>
                        </div>
                        <div class="app-field">
                            <span class="app-field__label">授权时间</span>
                            <span class="app-field__value">
                                {{ app.authorized_at ? formatTime(app.authorized_at * 1000) : '未知' }}
                            </span>
                        </div>
                        <div class="app-field">
                            <span class="app-field__label">登录设备数</span>
                            <span class="app-field__value">{{ app.token_count }}</span>
                        </div>
                    </div>

                    <template #extra>
                        <div class="app-actions">
                            <var-button text type="danger" :size="mobileByWidth ? 'small' : 'normal'"
                                @click="handleRevoke(app.client_id, app.name)">
                                撤销授权
                            </var-button>
                        </div>
                    </template>
                </var-card>
            </div>
        </div>
    </var-pull-refresh>
</template>

<style scoped>
.oauth-page {
    padding-bottom: var(--md-space-8);
}


.app-fields {
    display: flex;
    flex-direction: column;
    gap: var(--md-space-3);
}

.app-field {
    display: grid;
    grid-template-columns: 104px minmax(0, 1fr);
    gap: var(--md-space-3);
    align-items: baseline;
}

.app-field__label {
    font-size: 12px;
    line-height: 16px;
    letter-spacing: 0.4px;
    color: var(--color-text-secondary);
}

.app-field__value {
    font-size: 13px;
    line-height: 20px;
    color: var(--color-text);
    word-break: break-all;
}

.app-actions {
    display: flex;
    justify-content: flex-end;
    width: 100%;
}

@media (max-width: 640px) {
    .app-field {
        grid-template-columns: 1fr;
        gap: 2px;
    }
}
</style>