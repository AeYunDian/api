<script setup>
import { inject } from 'vue';
import { useRouter } from 'vue-router';
import { Dialog, Snackbar } from '@varlet/ui'
import '@varlet/ui/es/dialog/style';
import '@varlet/ui/es/snackbar/style';
const sdk = inject('sdk');
const user = inject('user');
const router = useRouter();
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
            <h2>个人信息</h2>
            <p v-if="user.username">用户名：{{ user?.username }}</p>
            <p v-if="user.email">邮箱：{{ maskEmail(user?.email) }}</p>
        </template>
        <p v-else>加载中...</p>
    </div>
</template>