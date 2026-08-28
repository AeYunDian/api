<script setup>
import { ref, onMounted, inject, computed } from 'vue';
import { Dialog, Snackbar } from '@varlet/ui';
import { getUsers, transferFeedbackOwner, getFeedbackDetail, getFeedbackList, deleteFeedback } from '@/console/utils/api';
import { formatTime } from '@/shared/utils/format';
import '@varlet/ui/es/dialog/style';
import '@varlet/ui/es/snackbar/style';

const user = inject('user');
const loading = ref(false);
const users = ref([])
const feedbacks = ref([]);
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
async function loadFeedbacks() {
    loading.value = true;
    try {
        const data = await getFeedbackList();
        console.log(data.feedbacks)
        feedbacks.value = data.feedbacks || [];
    } catch (error) {
        Snackbar.error(error.message || '获取反馈列表失败');
    } finally {
        loading.value = false;
    }
}
onMounted(() => {
    loadFeedbacks();
    if (isAdmin.value) loadUsers();
});
</script>
<template>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <h2 style="margin: 0;">反馈中心</h2>

        <var-button type="primary" disabled>
            提交反馈
        </var-button>
    </div>
    <var-loading v-if="loading" type="circle" />

    <p v-else-if="!feedbacks.length">无反馈</p>

    <!-- 客户端列表 -->
    <var-list v-else-if="false">
        <var-card v-for="feedback in feedbacks" :key="feedback.client_id" style="margin-bottom: 12px;">
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

</template>