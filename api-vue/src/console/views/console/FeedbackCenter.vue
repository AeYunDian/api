<script setup>
import { ref, onMounted, inject, computed } from 'vue';
import { Dialog, Snackbar } from '@varlet/ui';
import { getFeedbackList, deleteFeedback, submitFeedback } from '@/console/utils/api';
import { formatTime } from '@/shared/utils/format';
import '@varlet/ui/es/dialog/style';
import '@varlet/ui/es/snackbar/style';

const user = inject('user');
const loading = ref(false);
const feedbacks = ref([]);
const selectedStatus = ref('all');
const showSubmitDialog = ref(false);
const submitForm = ref({ content: '' });
const submitting = ref(false);
const isAdmin = computed(() => user.value?.sub === 1);
const counts = ref({ total: 0, pending: 0 });

async function handleSubmit() {
    const content = submitForm.value.content.trim();
    if (!content) { Snackbar.warning('请输入反馈内容'); return; }
    submitting.value = true;
    try {
        await submitFeedback(content);
        Snackbar.success('反馈提交成功');
        showSubmitDialog.value = false;
        submitForm.value.content = '';
        await loadFeedbacks();
    } catch (error) {
        Snackbar.error(error.message || '提交失败');
    } finally {
        submitting.value = false;
    }
}
async function loadFeedbacks() {
    loading.value = true;
    try {
        const data = await getFeedbackList(selectedStatus.value === 'all' ? '' : selectedStatus.value || null);
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
async function fetchCounts() {
    try {
        const data = await getFeedbackList();
        const list = data.feedbacks || [];
        const total = list.length;
        const pending = list.filter(f => f.status === 'pending' || f.status === 'processing').length;
        counts.value = { total, pending };
    } catch (error) {
        Snackbar.error('获取反馈计数失败', error);
    }
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
    fetchCounts();
});
</script>

<template>
    <div>
        <div style="display: flex; justify-content: space-between; align-items: center; ">
            <h2 style="margin: 0;">反馈中心</h2>
            <div>
                <var-button @click="loadFeedbacks(); fetchCounts();" style="margin-inline-end: 5px;">刷新</var-button>
                <var-tooltip v-if="!isAdmin && (counts.total >= 50 || counts.pending >= 5)"
                    :content="counts.total >= 50 ? '您已提交50条反馈，已达上限' : '您有5条反馈待处理/处理中，请先处理'">
                    <span>
                        <var-button type="primary" disabled>
                            提交反馈
                        </var-button>
                    </span>
                </var-tooltip>
                <var-button v-else type="primary" @click="showSubmitDialog = true">
                    提交反馈
                </var-button>
            </div>
        </div>

        <var-space style="align-items: center; justify-content: space-between; margin-bottom: 16px; margin-top: 10px;">
            <div>
                <var-select v-model="selectedStatus" placeholder="全部状态" @change="loadFeedbacks" style="width: 180px;">
                    <var-option label="全部" value="all" />
                    <var-option label="待处理" value="pending" />
                    <var-option label="处理中" value="processing" />
                    <var-option label="已解决" value="resolved" />
                    <var-option label="已关闭" value="closed" />
                </var-select>
            </div>
            <p>
                <span v-if="isAdmin">共 {{ counts.total }} 条反馈</span>
                <span v-else>已提交 {{ counts.total }} / 50 条反馈，待处理/处理中 {{ counts.pending }} / 5 条</span>
            </p>
        </var-space>

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
                            <var-button type="danger" @click="handleDelete(fb.id)"
                                :disabled="!isAdmin && fb.user_sub !== user?.sub">
                                删除
                            </var-button>
                        </div>
                    </div>
                </div>
            </var-card>
        </var-list>
        <var-popup v-model:show="showSubmitDialog" class="var-dialog__popup" var-dialog-cover>
            <div class="var--box var-dialog">
                <div class="var-dialog__title">提交反馈</div>
                <div style="padding: 0 24px 16px; margin-top: 18px;" class="var-dialog__message">
                    <var-input placeholder="请详细描述您遇到的问题或建议" v-model="submitForm.content" textarea rows="6"
                        variant="outlined" maxlength="500" />
                </div>
                <div class="var-dialog__actions">
                    <var-button @click="showSubmitDialog = false" text type="primary">取消</var-button>
                    <var-button @click="handleSubmit" text type="primary" :loading="submitting">提交</var-button>
                </div>
            </div>
        </var-popup>
    </div>
</template>

<style scoped>
.var-card {
    transition: background-color 0.2s;
}
</style>