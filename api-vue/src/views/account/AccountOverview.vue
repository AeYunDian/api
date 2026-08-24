<script setup>
import { inject } from 'vue';
import { useRouter } from 'vue-router';
import { Dialog, Snackbar } from '@varlet/ui'
import '@varlet/ui/es/dialog/style';
import '@varlet/ui/es/snackbar/style';
const sdk = inject('sdk');
const user = inject('user');

const router = useRouter();
async function logout() {
    // Varlet 的 Dialog 回调真神奇
    const action = await Dialog({
        title: '确认',
        message: '您确认要登出？'
    });
    if (action === 'confirm') {
        try {
            await sdk.logout();
            Snackbar.success({
                content: "已登出",
                duration: 1000,
            })
            router.push('/');
        } catch (error) {
            // 如果能执行到这里，说明要么服务器崩了，要么服务器在维护，要么浏览器有问题，理论上执行不到这里
            Dialog({
                title: '操作失败',
                message: '错误信息：' + error.message
            })
        }

    }
}
function maskEmail(email) {
    if (!email || typeof email !== 'string' || !email.includes('@')) {
        return email;
    }
    const atIndex = email.indexOf('@');
    const username = email.slice(0, atIndex);
    const domain = email.slice(atIndex);
    if (username.length <= 3) {
        return email;
    }
    const prefix = username.slice(0, 2);
    const suffix = username.slice(-1);
    return prefix + '****' + suffix + domain;
}
</script>

<template>
    <div>
        <template v-if="user">
            <h2>账号概览</h2>
            <p v-if="user.username">用户名：{{ user?.username }}</p>
            <p v-if="user.email">邮箱：{{ maskEmail(user?.email) }}</p>
        </template>
        <p v-else>加载中...</p>
        <var-divider />
        <h2>第三方账号绑定</h2>
        <p>功能待更新</p>
        <var-button @click="logout" style="float: inline-end;">退出登录</var-button>
    </div>
</template>