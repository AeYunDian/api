<script setup>
import { ref, onMounted } from 'vue'
import { Snackbar } from '@varlet/ui'
import { submitFeedback } from '@/console/utils/api'
import { formatTime } from '@/shared/utils/format'
import { FEEDBACK_STATUS_OPTIONS, getStatusLabel, getStatusType } from '@/console/constants/feedback'
import { useFeedbackList } from '@/console/composables/useFeedbackList'
import { useIsAdmin } from '@/console/composables/useIsAdmin'
import '@varlet/ui/es/dialog/style'
import '@varlet/ui/es/snackbar/style'
import { inject } from 'vue'
const user = inject('user')
const isAdmin = useIsAdmin()
const {
    loading, refreshState, feedbacks, selectedStatus, counts,
    loadFeedbacks, fetchCounts, handleDelete, onPullRefresh,
} = useFeedbackList()

const showSubmitDialog = ref(false)
const submitForm = ref({ content: '' })
const submitting = ref(false)

async function handleSubmit() {
    const content = submitForm.value.content.trim()
    if (!content) { Snackbar.warning('请输入反馈内容'); return }
    submitting.value = true
    try {
        await submitFeedback(content)
        Snackbar.success('反馈提交成功')
        showSubmitDialog.value = false
        submitForm.value.content = ''
        await loadFeedbacks()
        await fetchCounts()
    } catch (error) {
        Snackbar.error(error.message || '提交失败')
    } finally {
        submitting.value = false
    }
}

function refresh() {
    loadFeedbacks()
    fetchCounts()
}

onMounted(refresh)
</script>

<template>
    <var-pull-refresh v-model="refreshState" @refresh="onPullRefresh">
        <div>
            <div class="page-header">
                <h2>反馈中心</h2>
                <div>
                    <var-button @click="refresh" style="margin-inline-end: 5px;">刷新</var-button>
                    <var-tooltip v-if="!isAdmin && (counts.total >= 50 || counts.pending >= 5)"
                        :content="counts.total >= 50 ? '您已提交50条反馈，已达上限' : '您有5条反馈待处理/处理中，请先处理'">
                        <span><var-button type="primary" disabled>提交反馈</var-button></span>
                    </var-tooltip>
                    <var-button v-else type="primary" @click="showSubmitDialog = true">提交反馈</var-button>
                </div>
            </div>

            <var-space class="filter-bar">
                <var-select v-model="selectedStatus" placeholder="全部状态" @change="loadFeedbacks" style="width: 180px;">
                    <var-option label="全部" value="all" />
                    <var-option v-for="opt in FEEDBACK_STATUS_OPTIONS" :key="opt.value" v-bind="opt" />
                </var-select>
                <p>
                    <span v-if="isAdmin">共 {{ counts.total }} 条反馈</span>
                    <span v-else-if="counts.total > 0">
                        已提交 {{ counts.total }} / 50 条反馈，待处理/处理中 {{ counts.pending }} / 5 条
                    </span>
                </p>
            </var-space>

            <var-progress v-if="loading" indeterminate />
            <p v-else-if="!feedbacks.length">暂无反馈</p>

            <var-list v-else>
                <var-card v-for="fb in feedbacks" :key="fb.id" class="feedback-card var-elevation--2">
                    <div class="fb-header">
                        <strong class="fb-user">{{ fb.username }}</strong>
                        <var-chip :type="getStatusType(fb.status)" size="small">{{ getStatusLabel(fb.status)
                        }}</var-chip>
                    </div>
                    <div class="fb-content">{{ fb.content }}</div>
                    <div class="fb-meta">
                        <div v-if="fb.admin_reply" class="admin-reply">管理员回复：{{ fb.admin_reply }}</div>
                        <div>提交时间：{{ formatTime(fb.created_at) }}</div>
                        <div v-if="fb.resolved_at">解决时间：{{ formatTime(fb.resolved_at) }}</div>
                    </div>
                    <var-divider />
                    <div style="text-align: end;">
                        <var-button type="danger" @click="handleDelete(fb.id)"
                            :disabled="!isAdmin && fb.user_sub !== user?.sub">删除</var-button>
                    </div>
                </var-card>
            </var-list>
        </div>
    </var-pull-refresh>

    <!-- 提交反馈弹窗不变 -->
    <var-popup v-model:show="showSubmitDialog" class="var-dialog__popup" var-dialog-cover>
        <div class="var--box var-dialog">
            <div class="var-dialog__title">提交反馈</div>
            <div class="dialog-message" style="margin-top: 18px;">
                <var-input placeholder="请详细描述您遇到的问题或建议" v-model="submitForm.content" textarea rows="6"
                    variant="outlined" maxlength="500" />
            </div>
            <div class="var-dialog__actions">
                <var-button @click="showSubmitDialog = false" text type="primary">取消</var-button>
                <var-button @click="handleSubmit" text type="primary" :loading="submitting">提交</var-button>
            </div>
        </div>
    </var-popup>
</template>

<style scoped>
.page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.page-header h2 {
    margin: 0;
}

.filter-bar {
    align-items: center;
    justify-content: space-between !important;
    margin-bottom: 16px !important;
    margin-top: 10px !important;
}

.feedback-card {
    margin: 0 5px 20px;
    width: 95%;
}

.fb-header {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
}

.fb-user {
    font-size: 16px;
}

.fb-content {
    font-size: 14px;
    margin: 8px 0;
}

.fb-meta {
    font-size: 13px;
}

.admin-reply {
    word-wrap: break-word;
    user-select: all;
    word-break: break-all;
}

.dialog-message {
    padding: 0 24px 16px;
}
</style>