<script setup>
import { ref, computed, onMounted, inject } from 'vue'
import { Snackbar } from '@varlet/ui'
import { updateFeedbackStatus, replyFeedback, transferFeedbackOwner, getUsers } from '@/console/utils/api'
import { formatTime } from '@/shared/utils/format'
import { FEEDBACK_STATUS_OPTIONS, getStatusLabel, getStatusType } from '@/console/constants/feedback'
import { useFeedbackList } from '@/console/composables/useFeedbackList'
import { useIsAdmin } from '@/console/composables/useIsAdmin'
import '@varlet/ui/es/dialog/style'
import '@varlet/ui/es/snackbar/style'
import '@varlet/ui/es/form/style'

const user = inject('user')
const isAdmin = useIsAdmin()
const {
    loading, refreshState, feedbacks, selectedStatus, counts,
    loadFeedbacks, fetchCounts, handleDelete,
} = useFeedbackList()

const users = ref([])
const showTransferDialog = ref(false)
const transferForm = ref({ feedbackId: null, targetUserId: 1 })
const transferFormRef = ref(null)
const transferring = ref(false)
const showReplyDialog = ref(false)
const replyForm = ref({ feedbackId: null, reply: '' })
const replyFormRef = ref(null)
const replying = ref(false)

const pageSubtitle = computed(() => `共 ${counts.value.total} 条反馈`)

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
    const valid = await replyFormRef.value?.validate()
    if (!valid) return

    replying.value = true
    try {
        await replyFeedback(replyForm.value.feedbackId, replyForm.value.reply.trim())
        Snackbar.success('回复成功')
        showReplyDialog.value = false
        await loadFeedbacks()
        await fetchCounts()
    } catch (error) {
        Snackbar.error(error.message || '回复失败')
    } finally {
        replying.value = false
    }
}

function openTransferDialog(feedbackId) {
    transferForm.value.feedbackId = feedbackId
    transferForm.value.targetUserId = 1
    showTransferDialog.value = true
}

async function handleTransfer() {
    const valid = await transferFormRef.value?.validate()
    if (!valid) return

    const { feedbackId, targetUserId } = transferForm.value
    if (!users.value.some((u) => u.sub === targetUserId)) {
        Snackbar.error('目标用户不存在')
        return
    }

    transferring.value = true
    try {
        await transferFeedbackOwner(feedbackId, targetUserId)
        Snackbar.success('转移成功')
        showTransferDialog.value = false
        await loadFeedbacks()
        await fetchCounts()
    } catch (error) {
        Snackbar.error(error.message || '转移失败')
    } finally {
        transferring.value = false
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
        <div class="manager-page">
            <div class="md-page-header">
                <div class="md-page-heading">
                    <h1 class="md-page-title">反馈管理</h1>
                    <p class="md-page-subtitle">{{ isAdmin ? pageSubtitle : '只有管理员可以对反馈进行操作' }}</p>
                </div>

                <div class="md-page-actions">
                    <var-tooltip content="刷新列表">
                        <var-button round icon-container @click="refreshAll">
                            <my-icon icon="refresh" size="1em + 8px" />
                        </var-button>
                    </var-tooltip>
                </div>
            </div>

            <var-result v-if="!isAdmin" type="warning" title="权限不足"
                description="反馈管理只对管理员开放，如需协助请联系超级管理员。" />

            <template v-else>
                <var-tabs v-model:active="selectedStatus" class="manager-tabs" @change="loadFeedbacks">
                    <var-tab name="all">全部</var-tab>
                    <var-tab v-for="opt in FEEDBACK_STATUS_OPTIONS" :key="opt.value" :name="opt.value">
                        {{ opt.label }}
                    </var-tab>
                </var-tabs>

                <var-progress v-if="loading && !feedbacks.length" indeterminate class="manager-progress" />

                <var-result v-else-if="!feedbacks.length" type="empty" title="暂无反馈"
                    description="当前筛选条件下没有待处理的反馈。" />

                <div v-else class="md-card-list">
                    <var-card v-for="fb in feedbacks" :key="fb.id" class="feedback-card">
                        <template #title="{ slotClass }">
                            <div :class="slotClass" class="md-card-header">
                                <my-icon icon="account-circle-outline" size="1.1em" />
                                <span class="md-card-title">{{ fb.username }}</span>
                                <var-chip :type="getStatusType(fb.status)" size="small">
                                    {{ getStatusLabel(fb.status) }}
                                </var-chip>
                            </div>
                        </template>

                        <p class="fb-content">{{ fb.content }}</p>

                        <div class="fb-meta">
                            <div v-if="fb.admin_reply" class="fb-reply">
                                <span class="fb-meta__label">管理员回复</span>
                                <span class="fb-reply__text">{{ fb.admin_reply }}</span>
                            </div>
                            <div class="fb-times">
                                <span>提交于 {{ formatTime(fb.created_at) }}</span>
                                <span v-if="fb.resolved_at">解决于 {{ formatTime(fb.resolved_at) }}</span>
                            </div>
                        </div>

                        <template #extra>
                            <div class="fb-actions">
                                <var-select v-model="fb.status" class="fb-status-select" variant="outlined" size="small"
                                    placeholder="状态" @change="handleStatusChange(fb.id, fb.status)">
                                    <var-option v-for="opt in FEEDBACK_STATUS_OPTIONS" :key="opt.value" v-bind="opt" />
                                </var-select>
                                <div class="fb-buttons">
                                    <var-button text type="primary" size="small" @click="openReplyDialog(fb.id)">
                                        回复
                                    </var-button>
                                    <var-button text size="small" @click="openTransferDialog(fb.id)">
                                        转移
                                    </var-button>
                                    <var-button text type="danger" size="small" @click="handleDelete(fb.id)"
                                        :disabled="!isAdmin && fb.user_sub !== user?.sub">
                                        删除
                                    </var-button>
                                </div>
                            </div>
                        </template>
                    </var-card>
                </div>
            </template>
        </div>
    </var-pull-refresh>

    <!-- 回复反馈 -->
    <var-dialog v-model:show="showReplyDialog" title="回复反馈" :confirm-button="false" :cancel-button="false"
        :close-on-click-overlay="false" width="min(560px, calc(100vw - 32px))">
        <template #title>
            <div class="md-dialog-title">
                <my-icon icon="reply-outline" size="1.25em" class="md-dialog-title__icon" />
                <span>回复反馈</span>
            </div>
        </template>
        <var-form ref="replyFormRef" class="md-dialog-form" scroll-to-error="start" @submit.prevent>
            <var-input v-model="replyForm.reply" textarea :rows="4" maxlength="500" variant="outlined"
                placeholder="请输入回复内容，用户会在反馈中心看到这条回复"
                :rules="[(v) => !!String(v).trim() || '请输入回复内容']" />
        </var-form>

        <template #actions="{ slotClass }">
            <div :class="slotClass" class="md-dialog-actions">
                <var-button text type="primary" @click="showReplyDialog = false">取消</var-button>
                <var-button type="primary" :loading="replying" @click="handleReply">发送回复</var-button>
            </div>
        </template>
    </var-dialog>

    <!-- 转移反馈所有者 -->
    <var-dialog v-model:show="showTransferDialog" title="转移反馈所有者" :confirm-button="false" :cancel-button="false"
        width="min(480px, calc(100vw - 32px))">
        <template #title>
            <div class="md-dialog-title">
                <my-icon icon="swap-horizontal" size="1.25em" class="md-dialog-title__icon" />
                <span>转移反馈所有者</span>
            </div>
        </template>
        <var-form ref="transferFormRef" class="md-dialog-form">
            <var-select v-model="transferForm.targetUserId" variant="outlined" placeholder="选择目标用户"
                :rules="[(v) => !!v || '请选择一个用户']">
                <var-option v-for="u in users" :key="u.sub" :label="u.username" :value="u.sub" />
            </var-select>
        </var-form>

        <template #actions="{ slotClass }">
            <div :class="slotClass" class="md-dialog-actions">
                <var-button text type="primary" @click="showTransferDialog = false">取消</var-button>
                <var-button type="primary" :loading="transferring" @click="handleTransfer">确认转移</var-button>
            </div>
        </template>
    </var-dialog>
</template>

<style scoped>
.manager-page {
    padding-bottom: var(--md-space-4);
}

.manager-tabs {
    margin-bottom: var(--md-space-4);
    background: transparent;
}

.manager-progress {
    margin-top: var(--md-space-2);
}


.fb-content {
    margin: 0;
    font-size: 14px;
    line-height: 22px;
    color: var(--color-text);
    word-break: break-word;
}

.fb-meta {
    display: flex;
    flex-direction: column;
    gap: var(--md-space-2);
    margin-top: var(--md-space-3);
}

.fb-reply {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: var(--md-space-2) var(--md-space-3);
    border-radius: var(--md-shape-sm);
    background: var(--color-surface-container-highest);
}

.fb-meta__label {
    font-size: 12px;
    line-height: 16px;
    letter-spacing: 0.4px;
    color: var(--color-text-secondary);
}

.fb-reply__text {
    font-size: 13px;
    line-height: 20px;
    word-break: break-word;
    user-select: text;
}

.fb-times {
    display: flex;
    flex-wrap: wrap;
    gap: var(--md-space-1) var(--md-space-4);
    font-size: 12px;
    line-height: 16px;
    letter-spacing: 0.4px;
    color: var(--color-text-secondary);
}

.fb-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--md-space-3);
    flex-wrap: wrap;
    width: 100%;
}

.fb-status-select {
    width: 148px;
    flex: 0 0 auto;
}

.fb-buttons {
    display: flex;
    gap: var(--md-space-1);
    justify-content: flex-end;
    flex-wrap: wrap;
}
</style>
