<script setup>
import { ref, computed, onMounted } from 'vue'
import { Snackbar } from '@varlet/ui'
import { submitFeedback } from '@/console/utils/api'
import { formatTime } from '@/shared/utils/format'
import { FEEDBACK_STATUS_OPTIONS, getStatusLabel, getStatusType } from '@/console/constants/feedback'
import { useFeedbackList } from '@/console/composables/useFeedbackList'
import { useIsAdmin } from '@/console/composables/useIsAdmin'
import '@varlet/ui/es/dialog/style'
import '@varlet/ui/es/snackbar/style'
import '@varlet/ui/es/form/style'
import '@varlet/ui/es/fab/style'
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
const submitFormRef = ref(null)

/* 普通用户的两道上限：累计 50 条、待处理/处理中 5 条 */
const submitLimitReached = computed(
    () => !isAdmin.value && (counts.value.total >= 50 || counts.value.pending >= 5)
)

const pageSubtitle = computed(() => {
    if (isAdmin.value) return `共 ${counts.value.total} 条反馈`
    if (!counts.value.total) return '遇到问题或有建议？随时提交给我们'
    return `已提交 ${counts.value.total} / 50 条，待处理 ${counts.value.pending} / 5 条`
})

function openSubmitDialog() {
    if (submitLimitReached.value) {
        Snackbar.warning(
            counts.value.total >= 50
                ? '您已提交 50 条反馈，已达上限'
                : '您有 5 条反馈待处理/处理中，请先处理',
        )
        return
    }
    showSubmitDialog.value = true
}

async function handleSubmit() {
    const valid = await submitFormRef.value?.validate()
    if (!valid) return

    submitting.value = true
    try {
        await submitFeedback(submitForm.value.content.trim())
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
        <div class="feedback-page">
            <div class="md-page-header">
                <div class="md-page-heading">
                    <h1 class="md-page-title">反馈中心</h1>
                    <p class="md-page-subtitle">{{ pageSubtitle }}</p>
                </div>

                <div class="md-page-actions">
                    <var-tooltip content="刷新列表">
                        <var-button round icon-container @click="refresh">
                            <my-icon icon="refresh" size="1em + 8px" />
                        </var-button>
                    </var-tooltip>
                </div>
            </div>

            <!-- MD3 一级选项卡作为状态筛选，替代下拉框 -->
            <var-tabs v-model:active="selectedStatus" class="feedback-tabs" @change="loadFeedbacks">
                <var-tab name="all">全部</var-tab>
                <var-tab v-for="opt in FEEDBACK_STATUS_OPTIONS" :key="opt.value" :name="opt.value">
                    {{ opt.label }}
                </var-tab>
            </var-tabs>

            <var-progress v-if="loading && !feedbacks.length" indeterminate class="feedback-progress" />

            <var-result v-else-if="!feedbacks.length" type="empty" title="暂无反馈"
                description="当前筛选条件下还没有反馈记录，可以从右下角的浮动按钮提交一条。" />

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
                            <var-button text type="danger" size="small" @click="handleDelete(fb.id)"
                                :disabled="!isAdmin && fb.user_sub !== user?.sub">
                                删除
                            </var-button>
                        </div>
                    </template>
                </var-card>
            </div>
        </div>
    </var-pull-refresh>

    <!-- MD3 FAB：提交反馈 -->
    <var-fab class="feedback-fab" type="primary" position="right-bottom" inactive-icon="plus" :elevation="3"
        :disabled="!user" @click="openSubmitDialog" />

    <var-dialog v-model:show="showSubmitDialog" title="提交反馈" :confirm-button="false" :cancel-button="false"
        :close-on-click-overlay="false" width="min(560px, calc(100vw - 32px))">
        <template #title>
            <div class="md-dialog-title">
                <my-icon icon="message-plus-outline" size="1.25em" class="md-dialog-title__icon" />
                <span>提交反馈</span>
            </div>
        </template>
        <var-form ref="submitFormRef" class="md-dialog-form" scroll-to-error="start" @submit.prevent>
            <var-input v-model="submitForm.content" textarea :rows="6" maxlength="500"
                variant="outlined" placeholder="请详细描述您遇到的问题或建议，我们会尽快处理"
                :rules="[(v) => !!String(v).trim() || '请输入反馈内容']" />
        </var-form>

        <template #actions="{ slotClass }">
            <div :class="slotClass" class="md-dialog-actions">
                <var-button text type="primary" @click="showSubmitDialog = false">取消</var-button>
                <var-button type="primary" :loading="submitting" @click="handleSubmit">提交</var-button>
            </div>
        </template>
    </var-dialog>
</template>

<style scoped>
.feedback-page {
    padding-bottom: var(--md-space-4);
}

.feedback-tabs {
    margin-bottom: var(--md-space-4);
    background: transparent;
}

.feedback-progress {
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
    justify-content: flex-end;
    gap: var(--md-space-1);
    width: 100%;
}

.feedback-fab {
    z-index: 92;
}
</style>
