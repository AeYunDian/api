<script setup>
import { ref, onMounted, inject, computed } from 'vue';
import { Dialog, Snackbar } from '@varlet/ui';
import { getUsers, banUser } from '@/console/utils/api';
import '@varlet/ui/es/dialog/style';
import '@varlet/ui/es/snackbar/style';
import MyIcon from '@/shared/MyIcon.vue';

const user = inject('user');
const loading = ref(false);
const users = ref([]);

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

async function toggleBan(targetUser) {
    if (!isAdmin.value) {
        Snackbar.warning('只有管理员可以执行此操作');
        return;
    }
    if (targetUser.sub === 1) {
        Snackbar.warning('不能封禁超级管理员');
        return;
    }

    const isBanned = targetUser.banned === 1;
    const action = await Dialog({
        title: isBanned ? '确认解封' : '确认封禁',
        message: isBanned
            ? `确定要解封用户 "${targetUser.username}" 吗？`
            : `确定要封禁用户 "${targetUser.username}" 吗？\n封禁后该用户将无法登录所有服务。`,
        confirmButtonText: isBanned ? '确认解封' : '确认封禁',
        cancelButtonText: '取消',
    });
    if (action !== 'confirm') return;

    try {
        await banUser(targetUser.sub, !isBanned, isBanned ? '' : '管理员封禁');
        Snackbar.success(isBanned ? '用户已解封' : '用户已封禁');
        await loadUsers();
    } catch (error) {
        Snackbar.error(error.message || '操作失败');
    }
}

onMounted(() => {
    if (isAdmin.value) {
        loadUsers();
    }
});
</script>

<template>
    <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h2 style="margin: 0;">用户管理</h2>
            <var-button @click="loadUsers" :disabled="!isAdmin">刷新</var-button>
        </div>

        <p v-if="!isAdmin" style="color: var(--color-text-secondary);">
            <my-icon icon="error" /> 只有管理员可以查看和管理用户
        </p>

        <var-loading v-else-if="loading" type="circle" />

        <p v-else-if="!users.length">暂无用户</p>

        <var-list v-else>
            <var-card v-for="u in users" :key="u.sub" style="margin-bottom: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <strong>{{ u.username }}</strong>
                            <var-chip v-if="u.banned" type="danger">已封禁</var-chip>
                            <var-chip v-if="u.sub === 1" type="primary">超级管理员</var-chip>
                        </div>
                        <div style="font-size: 13px; color: var(--color-text-secondary);">
                            <div>UID: {{ u.sub }}</div>
                            <div>邮箱：{{ u.email || '未设置' }}</div>
                            <div v-if="u.ban_reason">封禁原因：{{ u.ban_reason }}</div>
                            <div>注册时间：{{ new Date(u.created_at).toLocaleString() }}</div>
                        </div>
                    </div>
                    <var-button v-if="u.sub !== 1" :type="u.banned ? 'success' : 'danger'" @click="toggleBan(u)">
                        {{ u.banned ? '解封' : '封禁' }}
                    </var-button>
                </div>
            </var-card>
        </var-list>
    </div>
</template>