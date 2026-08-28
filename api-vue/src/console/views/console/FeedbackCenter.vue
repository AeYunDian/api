<script setup>
import { ref, onMounted, inject, computed } from 'vue';
import { Dialog, Snackbar } from '@varlet/ui';
import { getFeedbackList, deleteFeedback } from '@/console/utils/api';
import { formatTime } from '@/shared/utils/format';
import '@varlet/ui/es/dialog/style';
import '@varlet/ui/es/snackbar/style';

const user = inject('user');
const loading = ref(false);
const feedbacks = ref([]);
const selectedStatus = ref('');

const isAdmin = computed(() => user.value?.sub === 1);

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

onMounted(() => {
    loadFeedbacks();
});
</script>

<template>
    <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h2 style="margin: 0;">反馈中心</h2>
            <div>
                <var-button @click="loadFeedbacks" style="margin-inline-end: 5px;">刷新</var-button>
            </div>
        </div>

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
                        <div style="display: flex; gap: 5px; flex-wrap: wrap; justify-content: flex-end;">
                            <var-button type="danger" size="small" @click="handleDelete(fb.id)"
                                :disabled="!isAdmin && fb.user_sub !== user?.sub">
                                删除
                            </var-button>
                        </div>
                    </div>
                </div>
            </var-card>
        </var-list>

    </div>
</template>

<style scoped>
.var-card {
    transition: background-color 0.2s;
}
</style>