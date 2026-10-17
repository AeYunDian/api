<script setup>
import { inject, ref, onMounted } from 'vue';
import { Dialog, Snackbar } from '@varlet/ui';
import { useRouter } from 'vue-router';
import { getDeviceCount, revokeAllDevices } from '@/account/utils/api';
import '@varlet/ui/es/dialog/style';
import '@varlet/ui/es/snackbar/style';
import '@varlet/ui/es/form/style';

const router = useRouter();
const sdk = inject('sdk');
const user = inject('user');
const channel = inject('channel');
const deviceCount = ref(0);
const refreshState = ref(false);
// 修改密码表单
const oldPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const passwordLoading = ref(false);
const deviceCountLoading = ref(true);
onMounted(async () => {
    try {
        const data = await getDeviceCount();
        deviceCount.value = data.count;
    } catch (error) {
        Snackbar.error('获取设备数量失败');
        deviceCount.value = -1;
        console.error(error);
    } finally {
        deviceCountLoading.value = false;
    }
});

async function handleRevokeAll() {
    const action = await Dialog({
        title: '登出所有设备',
        confirmButtonProps: { text: false, type: 'danger' },
        dialogStyle: { whiteSpace: 'pre-line' },
        message: '此操作将登出所有设备（包括当前设备）以及授权的应用。\n如需单独管理授权应用，请前往「授权管理」。\n\n确认继续？',
        confirmButtonText: '继续',
        cancelButtonText: '取消',
    });

    if (action !== 'confirm') return;
    const confirm2 = await Dialog({
        title: '再次确认',
        confirmButtonProps: { text: false, type: 'danger' },
        message: '确定要立即登出全部设备吗？',
        confirmButtonText: '登出',
        cancelButtonText: '取消',
    });
    if (confirm2 !== 'confirm') return;
    try {
        await revokeAllDevices();
        await sdk.logout();
        Snackbar.success('已登出，其他设备将在 10 分钟内失效');
        channel.value.postMessage('logout');
        router.push('/');
    } catch (error) {
        Dialog({
            title: '操作失败',
            message: error.message || '未知原因'
        });
    }

}

async function handleChangePassword() {
    if (newPassword.value !== confirmPassword.value) {
        Snackbar.error('两次输入的新密码不一致');
        return;
    }
    if (newPassword.value.length < 6) {
        Snackbar.error('密码长度至少6位');
        return;
    }

    const action = await Dialog({
        title: '修改密码',
        message: '修改后需要使用新密码重新登录，确认继续？',
        confirmButtonText: '修改',
        cancelButtonText: '取消',
    });
    if (action === 'confirm') {
        passwordLoading.value = true;
        try {
            await sdk.changePassword(oldPassword.value, newPassword.value);
            Snackbar.success('密码修改成功，请重新登录');
            channel.value.postMessage('logout');
            router.push('/');
        } catch (error) {
            Dialog({
                title: '修改失败',
                message: error.message || '请重试'
            });
        } finally {
            passwordLoading.value = false;
        }
    }

}

async function onPullRefresh() {
    try {
        await getDeviceCount();
    } catch (error) {
        Snackbar.error(error.message)
    } finally {
        refreshState.value = false;
    }
}
</script>

<template>
    <var-pull-refresh v-model="refreshState" @refresh="onPullRefresh">
        <div class="security-page">
            <div class="md-page-header">
                <div class="md-page-heading">
                    <h1 class="md-page-title">安全中心</h1>
                    <p class="md-page-subtitle">管理登录设备与账号密码</p>
                </div>
            </div>

            <var-card class="security-card">
                <template #title="{ slotClass }">
                    <div :class="slotClass" class="md-card-header">
                        <my-icon icon="devices" size="1.2em" />
                        <span class="md-card-title">设备管理</span>
                    </div>
                </template>

                <var-progress v-if="deviceCountLoading || refreshState" indeterminate />
                <p v-else-if="deviceCount === -1" class="md-hint">设备数量加载失败</p>
                <p v-else class="device-count">
                    当前已在 <strong>{{ deviceCount }}</strong> 台设备上登录
                </p>

                <div class="device-actions">
                    <span class="md-hint device-note">
                        <my-icon icon="information-outline" size="1em" />
                        其他设备最长需要 10 分钟才会完全失效
                    </span>
                    <var-button type="danger" @click="handleRevokeAll">登出所有设备</var-button>
                </div>
            </var-card>

            <var-card class="security-card">
                <template #title="{ slotClass }">
                    <div :class="slotClass" class="md-card-header">
                        <my-icon icon="lock-reset" size="1.2em" />
                        <span class="md-card-title">修改密码</span>
                    </div>
                </template>

                <var-form class="md-dialog-form" scroll-to-error="start" @submit="handleChangePassword">
                    <var-input type="password" variant="outlined" placeholder="旧密码" v-model="oldPassword"
                        :rules="[v => !!v || '请填写旧密码']" />
                    <var-input type="password" variant="outlined" placeholder="新密码（至少 6 位）" v-model="newPassword" :rules="[
                        v => !!v || '请填写新密码',
                        v => v.length >= 6 || '密码至少6位'
                    ]" />
                    <var-input type="password" variant="outlined" placeholder="再次输入新密码" v-model="confirmPassword" :rules="[
                        v => !!v || '请再次输入新密码',
                        v => v === newPassword || '两次密码不一致'
                    ]" />

                    <div class="form-actions">
                        <var-button type="primary" native-type="submit" :loading="passwordLoading">
                            修改密码
                        </var-button>
                    </div>
                </var-form>
            </var-card>
        </div>
    </var-pull-refresh>
</template>

<style scoped>
.security-page {
    padding-bottom: var(--md-space-8);
}

.security-card {
    margin-bottom: var(--md-space-4);
}

.device-count {
    margin: 0;
    font-size: 14px;
    line-height: 20px;
    color: var(--color-text);
}

.device-count strong {
    font-size: 20px;
    line-height: 28px;
    font-weight: 500;
    color: var(--color-primary);
}

.device-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--md-space-4);
    flex-wrap: wrap;
    margin-top: var(--md-space-4);
}

.device-note {
    display: inline-flex;
    align-items: center;
    gap: var(--md-space-1);
    margin: 0;
}

.form-actions {
    display: flex;
    justify-content: flex-end;
}
</style>
