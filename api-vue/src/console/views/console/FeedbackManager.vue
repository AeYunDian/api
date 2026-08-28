<script setup>
import { ref, onMounted, inject, computed } from 'vue';
import { Dialog, Snackbar } from '@varlet/ui';
import { getFeedbackList, deleteFeedback, updateFeedbackStatus, replyFeedback, transferFeedbackOwner, getUsers } from '@/console/utils/api';
import { formatTime } from '@/shared/utils/format';
import '@varlet/ui/es/dialog/style';
import '@varlet/ui/es/snackbar/style';

const user = inject('user');
const loading = ref(false);
const feedbacks = ref([]);
const users = ref([]); // 用于转移时选择目标用户
const selectedStatus = ref(''); // 筛选状态

// 转移对话框
const showTransferDialog = ref(false);
const transferForm = ref({
    feedbackId: null,
    targetUserId: 1,
});

// 回复对话框
const showReplyDialog = ref(false);
const replyForm = ref({
    feedbackId: null,
    reply: '',
});

const isAdmin = computed(() => user.value?.sub === 1);

async function loadUsers() {
    if (!isAdmin.value) return;
    try {
        const data = await getUsers();
        users.value = data.users || [];
    } catch (error) {
        console.error('加载用户列表失败', error);
    }
}

async function loadFeedbacks() {
    loading.value = true;
    try {
        const data = await getFeedbackList(selectedStatus.value || null);
        feedbacks.value = data.feedbacks || [];
    } catch (error) {
        Snackbar.error(error.message || '加载反馈列表失败');
    } finally {
        loading.value = false;
    }
}

function getStatusLabel(status) {
    const map = {
        pending: '待处理',
        processing: '处理中',
        resolved: '已解决',
        closed: '已关闭',
    };
    return map[status] || status;
}

async function handleDelete(feedbackId) {
    const action = await Dialog({
        title: '确认删除',
        message: '确定要删除这条反馈吗？',
        confirmButtonText: '确认删除',
        cancelButtonText: '取消',
    });
    if (action !== 'confirm') return;
    try {
        await deleteFeedback(feedbackId);
        Snackbar.success('已删除');
        await loadFeedbacks();
    } catch (error) {
        Snackbar.error(error.message || '删除失败');
    }
}

async function handleStatusChange(feedbackId, status) {
    try {
        await updateFeedbackStatus(feedbackId, status);
        Snackbar.success('状态已更新');
        await loadFeedbacks();
    } catch (error) {
        Snackbar.error(error.message || '更新状态失败');
    }
}

function openReplyDialog(feedbackId) {
    replyForm.value.feedbackId = feedbackId;
    replyForm.value.reply = '';
    showReplyDialog.value = true;
}

async function handleReply() {
    const { feedbackId, reply } = replyForm.value;
    if (!reply.trim()) {
        Snackbar.warning('请输入回复内容');
        return;
    }
    try {
        await replyFeedback(feedbackId, reply.trim());
        Snackbar.success('回复成功');
        showReplyDialog.value = false;
        await loadFeedbacks();
    } catch (error) {
        Snackbar.error(error.message || '回复失败');
    }
}

function openTransferDialog(feedbackId) {
    transferForm.value.feedbackId = feedbackId;
    transferForm.value.targetUserId = 1;
    showTransferDialog.value = true;
}

async function handleTransfer() {
    const { feedbackId, targetUserId } = transferForm.value;
    if (!feedbackId || !targetUserId) {
        Snackbar.warning('请选择目标用户');
        return;
    }
    const targetExists = users.value.some(u => u.sub === targetUserId);
    if (!targetExists) {
        Snackbar.error('目标用户不存在');
        return;
    }
    try {
        await transferFeedbackOwner(feedbackId, targetUserId);
        Snackbar.success('转移成功');
        showTransferDialog.value = false;
        await loadFeedbacks();
    } catch (error) {
        Snackbar.error(error.message || '转移失败');
    }
}

onMounted(() => {
    loadUsers();
    loadFeedbacks();
});
</script>

<template>
    <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h2 style="margin: 0;">反馈管理</h2>
            <div>
                <var-button @click="loadFeedbacks(); if (isAdmin) loadUsers();"
                    style="margin-inline-end: 5px;">刷新</var-button>
            </div>
        </div>

        <template v-if="!isAdmin">
            <p style="justify-content: center; align-items: center; display: flex;">
                <my-icon icon="error" /> <span style="margin-inline-start: 10px;">只有管理员可以对反馈进行操作</span>
            </p>
        </template>
        <template v-else>
            <div style="margin-bottom: 16px;">
                <var-select v-model="selectedStatus" placeholder="全部状态" @change="loadFeedbacks" style="width: 180px;">
                    <var-option label="全部" value="" />
                    <var-option label="待处理" value="pending" />
                    <var-option label="处理中" value="processing" />
                    <var-option label="已解决" value="resolved" />
                    <var-option label="已关闭" value="closed" />
                </var-select>
            </div>

            <var-progress v-if="loading" indeterminate />
            <p v-else-if="!feedbacks.length">暂无反馈</p>

            <var-list v-else>
                <var-card v-for="fb in feedbacks" :key="fb.id" style="margin-bottom: 12px;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div style="flex: 1;">
                            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                                <strong style="font-size: 16px;">{{ fb.username }}</strong>
                                <var-chip
                                    :type="fb.status === 'pending' ? 'warning' : fb.status === 'processing' ? 'info' : fb.status === 'resolved' ? 'success' : 'default'"
                                    size="small">
                                    {{ getStatusLabel(fb.status) }}
                                </var-chip>
                            </div>
                            <div style="font-size: 14px; margin: 8px 0;">{{ fb.content }}</div>
                            <div style="font-size: 13px; color: var(--color-text-secondary);">
                                <div v-if="fb.admin_reply">管理员回复：{{ fb.admin_reply }}</div>
                                <div>提交时间：{{ formatTime(fb.created_at) }}</div>
                                <div v-if="fb.resolved_at">解决时间：{{ formatTime(fb.resolved_at) }}</div>
                            </div>
                        </div>
                        <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
                            <var-select v-model="fb.status" @change="handleStatusChange(fb.id, fb.status)"
                                style="width: 100px;" size="small">
                                <var-option label="待处理" value="pending" />
                                <var-option label="处理中" value="processing" />
                                <var-option label="已解决" value="resolved" />
                                <var-option label="已关闭" value="closed" />
                            </var-select>

                            <div style="display: flex; gap: 5px; flex-wrap: wrap; justify-content: flex-end;">
                                <var-button type="primary" size="small" @click="openReplyDialog(fb.id)">
                                    回复
                                </var-button>
                                <var-button type="default" size="small" @click="openTransferDialog(fb.id)">
                                    转移
                                </var-button>
                                <var-button type="danger" size="small" @click="handleDelete(fb.id)"
                                    :disabled="!isAdmin && fb.user_sub !== user?.sub">
                                    删除
                                </var-button>
                            </div>
                        </div>
                    </div>
                </var-card>
            </var-list>

            <var-popup v-model:show="showReplyDialog" class="var-dialog__popup" var-dialog-cover>
                <div class="var--box var-dialog">
                    <div class="var-dialog__title">回复反馈</div>
                    <div style="padding: 0 24px 16px;" class="var-dialog__message">
                        <var-input placeholder="请输入回复内容" v-model="replyForm.reply" textarea rows="4" maxlength="500" />
                    </div>
                    <div class="var-dialog__actions">
                        <var-button @click="showReplyDialog = false" text type="primary"
                            class="var--inline-flex var-dialog__button var-dialog__cancel-button">取消</var-button>
                        <var-button @click="handleReply" text type="primary"
                            class="var--inline-flex var-dialog__button var-dialog__confirm-button">发送回复</var-button>
                    </div>
                </div>
            </var-popup>

            <var-popup v-model:show="showTransferDialog" class="var-dialog__popup" var-dialog-cover>
                <div class="var--box var-dialog">
                    <div class="var-dialog__title">转移反馈所有者</div>
                    <div style="padding: 16px 24px 16px;" class="var-dialog__message">
                        <var-select placeholder="请选择目标用户" v-model="transferForm.targetUserId"
                            :rules="[(v) => v !== '' || '请选择一个用户']">
                            <var-option v-for="u in users" :key="u.sub" :label="u.username" :value="u.sub" />
                        </var-select>
                    </div>
                    <div class="var-dialog__actions">
                        <var-button @click="showTransferDialog = false" text type="primary"
                            class="var--inline-flex var-dialog__button var-dialog__cancel-button">取消</var-button>
                        <var-button @click="handleTransfer" text type="primary"
                            class="var--inline-flex var-dialog__button var-dialog__confirm-button">确认转移</var-button>
                    </div>
                </div>
            </var-popup>
        </template>
    </div>
</template>

<style scoped>
.var-card {
    transition: background-color 0.2s;
}
</style>