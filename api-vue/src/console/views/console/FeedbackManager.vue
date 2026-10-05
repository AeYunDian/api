<script setup>
import { ref, onMounted, inject } from 'vue'
import { Snackbar } from '@varlet/ui'
import { updateFeedbackStatus, replyFeedback, transferFeedbackOwner, getUsers } from '@/console/utils/api'
import { formatTime } from '@/shared/utils/format'
import { FEEDBACK_STATUS_OPTIONS, getStatusLabel, getStatusType } from '@/console/constants/feedback'
import { useFeedbackList } from '@/console/composables/useFeedbackList'
import { useIsAdmin } from '@/console/composables/useIsAdmin'
import '@varlet/ui/es/dialog/style'
import '@varlet/ui/es/snackbar/style'

const user = inject('user')
const isAdmin = useIsAdmin()
const {
    loading, refreshState, feedbacks, selectedStatus, counts,
    loadFeedbacks, fetchCounts, handleDelete,
} = useFeedbackList()

const users = ref([])
const showTransferDialog = ref(false)
const transferForm = ref({ feedbackId: null, targetUserId: 1 })
const showReplyDialog = ref(false)
const replyForm = ref({ feedbackId: null, reply: '' })

async function loadUsers() {
    if (!isAdmin.value) return
    try {
        const data = await getUsers()
        users.value = data.users || []
    } catch (error) {
        console.error('加载用户列表失败', error)
    }
}

async function handleStatusChange(feedbackId, status) {
    try {
        await updateFeedbackStatus(feedbackId, status)
        Snackbar.success('状态已更新')
        await loadFeedbacks()
        await fetchCounts()
    } catch (error) {
        Snackbar.error(error.message || '更新状态失败')
    }
}

function openReplyDialog(feedbackId) {
    replyForm.value.feedbackId = feedbackId
    replyForm.value.reply = ''
    showReplyDialog.value = true
}

async function handleReply() {
    const { feedbackId, reply } = replyForm.value
    if (!reply.trim()) {
        Snackbar.warning('请输入回复内容')
        return
    }
    try {
        await replyFeedback(feedbackId, reply.trim())
        Snackbar.success('回复成功')
        showReplyDialog.value = false
        await loadFeedbacks()
        await fetchCounts()
    } catch (error) {
        Snackbar.error(error.message || '回复失败')
    }
}

function openTransferDialog(feedbackId) {
    transferForm.value.feedbackId = feedbackId
    transferForm.value.targetUserId = 1
    showTransferDialog.value = true
}

async function handleTransfer() {
    const { feedbackId, targetUserId } = transferForm.value
    if (!feedbackId || !targetUserId) {
        Snackbar.warning('请选择目标用户')
        return
    }
    if (!users.value.some(u => u.sub === targetUserId)) {
        Snackbar.error('目标用户不存在')
        return
    }
    try {
        await transferFeedbackOwner(feedbackId, targetUserId)
        Snackbar.success('转移成功')
        showTransferDialog.value = false
        await loadFeedbacks()
        await fetchCounts()
    } catch (error) {
        Snackbar.error(error.message || '转移失败')
    }
}

async function refreshAll() {
    await loadFeedbacks()
    await fetchCounts()
    if (isAdmin.value) await loadUsers()
}

async function onPullRefresh() {
    try {
        await refreshAll()
    } catch (error) {
        Snackbar.error(error.message || '刷新失败')
    } finally {
        refreshState.value = false
    }
}

onMounted(() => {
    loadUsers()
    loadFeedbacks()
    fetchCounts()
})
</script>

<template>
    <var-pull-refresh v-model="refreshState" @refresh="onPullRefresh">
        <div>
            <div class="page-header">
                <h2>反馈管理</h2>
                <var-button @click="refreshAll" style="margin-inline-end: 5px;">刷新</var-button>
            </div>

            <p v-if="!isAdmin" class="empty-tip">
                <my-icon icon="error" />
                <span style="margin-inline-start: 10px;">只有管理员可以对反馈进行操作</span>
            </p>

            <template v-else>
                <var-space class="filter-bar">
                    <var-select v-model="selectedStatus" placeholder="全部状态" @change="loadFeedbacks"
                        style="width: 180px;">
                        <var-option label="全部" value="all" />
                        <var-option v-for="opt in FEEDBACK_STATUS_OPTIONS" :key="opt.value" v-bind="opt" />
                    </var-select>
                    <p>共 {{ counts.total }} 条反馈</p>
                </var-space>

                <var-progress v-if="loading" indeterminate />
                <p v-else-if="!feedbacks.length">暂无反馈</p>

                <var-list v-else>
                    <var-card v-for="fb in feedbacks" :key="fb.id" class="feedback-card var-elevation--2">
                        <div class="fb-header">
                            <strong class="fb-user">{{ fb.username }}</strong>
                            <var-chip :type="getStatusType(fb.status)" size="small">
                                {{ getStatusLabel(fb.status) }}
                            </var-chip>
                        </div>
                        <div class="fb-content">{{ fb.content }}</div>
                        <div class="fb-meta">
                            <div v-if="fb.admin_reply" class="admin-reply">管理员回复：{{ fb.admin_reply }}</div>
                            <div>提交时间：{{ formatTime(fb.created_at) }}</div>
                            <div v-if="fb.resolved_at">解决时间：{{ formatTime(fb.resolved_at) }}</div>
                        </div>
                        <var-divider />
                        <div class="fb-actions">
                            <var-select v-model="fb.status" @change="handleStatusChange(fb.id, fb.status)"
                                class="fb-status-select" placeholder="状态">
                                <var-option v-for="opt in FEEDBACK_STATUS_OPTIONS" :key="opt.value" v-bind="opt" />
                            </var-select>
                            <div class="fb-buttons">
                                <var-button type="primary" @click="openReplyDialog(fb.id)">回复</var-button>
                                <var-button type="default" @click="openTransferDialog(fb.id)">转移</var-button>
                                <var-button type="danger" @click="handleDelete(fb.id)"
                                    :disabled="!isAdmin && fb.user_sub !== user?.sub">删除</var-button>
                            </div>
                        </div>
                    </var-card>
                </var-list>
            </template>
        </div>
    </var-pull-refresh>

    <var-popup v-model:show="showReplyDialog" class="var-dialog__popup" var-dialog-cover>
        <div class="var--box var-dialog">
            <div class="var-dialog__title">回复反馈</div>
            <div class="dialog-message">
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
            <div class="dialog-message">
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

<style scoped>
.page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}

.page-header h2 {
    margin: 0;
}

.empty-tip {
    justify-content: center;
    align-items: center;
    display: flex;
    margin-bottom: 70px;
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
    color: var(--color-text-secondary);
}

.admin-reply {
    word-wrap: break-word;
    user-select: all;
    word-break: break-all;
}

.fb-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.fb-status-select {
    margin-inline-end: 10px;
    width: 150px;
}

.fb-buttons {
    display: flex;
    gap: 5px;
    justify-content: flex-end;
}

.dialog-message {
    padding: 0 24px 16px;
}
</style>