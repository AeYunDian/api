<script setup>
import { inject, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Dialog, Snackbar } from '@varlet/ui'
import { formatTime } from '@/shared/utils/format';
import '@varlet/ui/es/dialog/style';
import '@varlet/ui/es/snackbar/style';
const sdk = inject('sdk');
const user = inject('user');
const channel = inject('channel');
const router = useRouter();
const loading = ref(false);

async function logout() {
    const action = await Dialog({
        title: '退出登录',
        confirmButtonProps: { text: false, type: 'danger' },
        message: '确定要退出当前账号吗？',
        confirmButtonText: '退出',
        cancelButtonText: '取消',
    });
    if (action === 'confirm') {
        try {
            await sdk.logout();
            channel.value.postMessage('logout');
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
    <div class="overview-page">
        <div class="md-page-header">
            <div class="md-page-heading">
                <h1 class="md-page-title">账号概览</h1>
                <p class="md-page-subtitle">你的账号信息与登录状态</p>
            </div>
        </div>

        <var-progress v-if="!user" indeterminate />

        <div v-else class="overview">
            <div class="profile-head">
                    <var-avatar v-if="user.avatar" :src="user.avatar" :size="56" class="profile-avatar" />
                    <div class="profile-text">
                        <p class="profile-name">{{ user.username || '未命名用户' }}</p>
                        <p v-if="user.email" class="profile-email">{{ maskEmail(user.email) }}</p>
                    </div>
                </div>

            <div class="meta-list">
                <div v-if="user.description" class="meta-row">
                    <span class="meta-row__label">个人简介</span>
                    <span class="meta-row__value">{{ user.description }}</span>
                </div>
                <div v-if="user.created_at" class="meta-row">
                    <span class="meta-row__label">注册时间</span>
                    <span class="meta-row__value">{{ formatTime(user.created_at) }}</span>
                </div>
            </div>

            <div class="overview-actions">
                    <var-button type="danger" tonal @click="logout">退出登录</var-button>
                </div>
        </div>
    </div>
</template>

<style scoped>
.overview-page {
    padding-bottom: var(--md-space-8);
}

.overview {
    max-width: 720px;
}

.profile-avatar {
    background: #fff;
}

.profile-head {
    display: flex;
    align-items: center;
    gap: var(--md-space-3);
}

.profile-text {
    min-width: 0;
}

.profile-name {
    margin: 0;
    font-size: 20px;
    line-height: 28px;
    font-weight: 500;
    color: var(--color-text);
}

.profile-email {
    margin: 2px 0 0;
    font-size: 13px;
    line-height: 20px;
    color: var(--color-text-secondary);
}

.meta-list {
    display: flex;
    flex-direction: column;
    gap: var(--md-space-2);
}

.meta-row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--md-space-4);
    padding-bottom: var(--md-space-2);
    border-bottom: 1px solid var(--color-outline);
}

.meta-row:last-child {
    border-bottom: none;
    padding-bottom: 0;
}

.meta-row__label {
    flex: 0 0 auto;
    font-size: 13px;
    line-height: 20px;
    color: var(--color-text-secondary);
}

.meta-row__value {
    font-size: 13px;
    line-height: 20px;
    color: var(--color-text);
    text-align: right;
    word-break: break-word;
}

.overview-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: var(--md-space-6);
}
</style>
