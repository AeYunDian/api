<script setup>
import { inject, ref, onMounted } from 'vue';
import { Dialog, Snackbar } from '@varlet/ui';
import { useRouter } from 'vue-router';
import { getDeviceCount, revokeAllDevices } from '@/utils/api';
import '@varlet/ui/es/dialog/style';
import '@varlet/ui/es/snackbar/style';

const router = useRouter();
const sdk = inject('sdk');
const user = inject('user');
const channel = inject('channel');
const deviceCount = ref(0);

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
        title: '确认',
        dialogStyle: { whiteSpace: 'pre-line' },
        message: '此操作将登出所有设备（包括当前设备）以及授权的应用，如果您想登出授权的应用，请前往授权管理页面。\n\n确认继续？'
    });

    if (action === 'confirm') {
        const confirm2 = await Dialog({
            title: '确认',
            message: '您确认要继续吗？'
        });
        if (confirm2 === 'confirm') {
            try {
                await revokeAllDevices();
                Snackbar.success('所有设备已退出');
                router.push('/');
                channel.value.postMessage('logout');
            } catch (error) {
                Dialog({
                    title: '操作失败',
                    message: error.message || '未知原因'
                });
            }
        }
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
        title: '确认',
        message: '您确认要继续吗？'
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
</script>

<template>
    <div>
        <h2>安全中心</h2>

        <var-card title="设备管理">
            <var-loading v-if="deviceCountLoading" />
            <p v-else-if="deviceCount === -1">加载失败</p>
            <p v-else>当前已在 <span style="font-size: calc(1em + 3px);">{{ deviceCount }}</span> 台设备上登录</p>
            <var-button type="danger" @click="handleRevokeAll">登出所有设备</var-button>
        </var-card>

        <var-card title="修改密码" style="margin-top: 20px;">
            <var-form ref="passwordForm" @submit="handleChangePassword">
                <var-input type="password" placeholder="请输入旧密码" v-model="oldPassword" :rules="[v => !!v || '请填写旧密码']" />
                <var-input type="password" placeholder="请输入新密码（至少6位）" v-model="newPassword" :rules="[
                    v => !!v || '请填写新密码',
                    v => v.length >= 6 || '密码至少6位'
                ]" />
                <var-input type="password" placeholder="请再次输入新密码" v-model="confirmPassword" :rules="[
                    v => !!v || '请再次输入新密码',
                    v => v === newPassword || '两次密码不一致'
                ]" />
                <var-button type="primary" native-type="submit" :loading="passwordLoading">修改密码</var-button>
            </var-form>
        </var-card>

    </div>
</template>
<style scoped>
.var-input,
.var-button {
    margin-top: 10px;
}
</style>