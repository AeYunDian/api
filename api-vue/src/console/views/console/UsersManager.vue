<script setup>
import { ref, computed, onMounted } from 'vue'
import { Dialog, Snackbar } from '@varlet/ui'
import { getUsers, banUser } from '@/console/utils/api'
import { formatTime } from '@/shared/utils/format'
import { useIsAdmin } from '@/console/composables/useIsAdmin'
import '@varlet/ui/es/dialog/style'
import '@varlet/ui/es/snackbar/style'
import '@varlet/ui/es/form/style'

const isAdmin = useIsAdmin()

const loading = ref(false)
const refreshState = ref(false)
const users = ref([])
const showBanDialog = ref(false)
const banTarget = ref(null)
const banReason = ref('')
const banFormRef = ref(null)
const banning = ref(false)

const pageSubtitle = computed(() => {
    if (!isAdmin.value) return '只有管理员可以查看和管理用户'
    if (loading.value && !users.value.length) return '正在读取用户列表…'
    return `共 ${users.value.length} 个账号`
})

async function loadUsers() {
    if (!isAdmin.value) {
        Snackbar.warning('只有管理员可以查看用户列表')
        return
    }
    loading.value = true
    try {
        const data = await getUsers()
        users.value = data.users || []
    } catch (error) {
        Snackbar.error(error.message || '获取用户列表失败')
    } finally {
        loading.value = false
    }
}

function openBanDialog(targetUser) {
    if (!isAdmin.value) {
        Snackbar.warning('只有管理员可以执行此操作')
        return
    }
    if (targetUser.sub === 1) {
        Snackbar.warning('不能对超级管理员进行操作')
        return
    }
    banTarget.value = targetUser
    banReason.value = ''
    showBanDialog.value = true
}

function closeBanDialog() {
    banTarget.value = null
    banReason.value = ''
}

async function confirmBan() {
    if (!banTarget.value) return
    const reason = banReason.value.trim() || '无原因'

    banning.value = true
    try {
        await banUser(banTarget.value.sub, true, reason)
        Snackbar.success(`用户「${banTarget.value.username}」已封禁`)
        showBanDialog.value = false
        await loadUsers()
    } catch (error) {
        Snackbar.error(error.message || '封禁失败')
    } finally {
        banning.value = false
    }
}

async function confirmUnban(targetUser) {
    if (!isAdmin.value) {
        Snackbar.warning('只有管理员可以执行此操作')
        return
    }
    if (targetUser.sub === 1) {
        Snackbar.warning('不能对超级管理员进行操作')
        return
    }
    const result = await Dialog({
        title: '解封用户',
        message: `确定要解封用户「${targetUser.username}」吗？解封后该用户可恢复正常登录。`,
        confirmButtonText: '解封',
        cancelButtonText: '取消',
    })
    if (result !== 'confirm') return

    try {
        await banUser(targetUser.sub, false, '无')
        Snackbar.success('用户已解封')
        await loadUsers()
    } catch (error) {
        Snackbar.error(error.message || '解封失败')
    }
}

async function onPullRefresh() {
    try {
        if (isAdmin.value) await loadUsers()
    } catch (error) {
        Snackbar.error(error.message || '刷新失败')
    } finally {
        refreshState.value = false
    }
}

onMounted(() => {
    if (isAdmin.value) loadUsers()
})
</script>

<template>
    <var-pull-refresh v-model="refreshState" @refresh="onPullRefresh">
        <div class="users-page">
            <div class="md-page-header">
                <div class="md-page-heading">
                    <h1 class="md-page-title">用户管理</h1>
                    <p class="md-page-subtitle">{{ pageSubtitle }}</p>
                </div>

                <div class="md-page-actions">
                    <var-tooltip content="刷新列表">
                        <var-button round icon-container :disabled="!isAdmin" @click="loadUsers">
                            <my-icon icon="refresh" size="1em + 8px" />
                        </var-button>
                    </var-tooltip>
                </div>
            </div>

            <var-result v-if="!isAdmin" type="warning" title="权限不足"
                description="用户管理只对管理员开放。" />

            <var-progress v-else-if="loading && !users.length" indeterminate />

            <var-result v-else-if="!users.length" type="empty" title="暂无用户" description="还没有任何账号数据。" />

            <div v-else class="md-card-list">
                <var-card v-for="u in users" :key="u.sub" class="user-card">
                    <template #title="{ slotClass }">
                        <div :class="slotClass" class="md-card-header">
                            <var-avatar v-if="u.avatar" :src="u.avatar" :size="32" class="user-avatar" />
                            <var-avatar v-else :size="32" class="user-avatar">
                                <my-icon icon="account-circle" size="22px" />
                            </var-avatar>
                            <span class="md-card-title">{{ u.username }}</span>
                            <var-chip v-if="u.sub === 1" type="primary" size="small">超级管理员</var-chip>
                            <var-chip v-if="u.banned" type="danger" size="small">已封禁</var-chip>
                        </div>
                    </template>

                    <div class="user-fields">
                        <div class="user-field">
                            <span class="user-field__label">UID</span>
                            <span class="user-field__value">{{ u.sub }}</span>
                        </div>
                        <div class="user-field">
                            <span class="user-field__label">邮箱</span>
                            <span class="user-field__value">{{ u.email || '未设置' }}</span>
                        </div>
                        <div class="user-field">
                            <span class="user-field__label">注册时间</span>
                            <span class="user-field__value">{{ formatTime(u.created_at) }}</span>
                        </div>
                        <div v-if="u.ban_reason" class="user-field">
                            <span class="user-field__label">封禁原因</span>
                            <span class="user-field__value">{{ u.ban_reason }}</span>
                        </div>
                    </div>

                    <template #extra>
                        <div class="user-actions">
                            <var-button v-if="u.sub !== 1" :type="u.banned ? 'success' : 'danger'" size="small"
                                @click="u.banned ? confirmUnban(u) : openBanDialog(u)">
                                {{ u.banned ? '解封' : '封禁' }}
                            </var-button>
                        </div>
                    </template>
                </var-card>
            </div>
        </div>
    </var-pull-refresh>

    <var-dialog v-model:show="showBanDialog" title="封禁用户" :confirm-button="false" :cancel-button="false"
        width="min(480px, calc(100vw - 32px))" @closed="closeBanDialog">
        <template #title>
            <div class="md-dialog-title">
                <my-icon icon="account-cancel-outline" size="1.25em" class="md-dialog-title__icon" />
                <span>封禁用户</span>
            </div>
        </template>
        <var-form ref="banFormRef" class="md-dialog-form">
            <p class="ban-hint">
                封禁用户 <strong>{{ banTarget?.username }}</strong> 后，该账号将无法登录全部服务。
            </p>
            <var-input v-model="banReason" textarea :rows="3" maxlength="200" variant="outlined"
                placeholder="请输入封禁原因（可选，会展示给用户）" />
        </var-form>

        <template #actions="{ slotClass }">
            <div :class="slotClass" class="md-dialog-actions">
                <var-button text type="primary" @click="showBanDialog = false">取消</var-button>
                <var-button type="danger" :loading="banning" @click="confirmBan">确认封禁</var-button>
            </div>
        </template>
    </var-dialog>
</template>

<style scoped>
.users-page {
    padding-bottom: var(--md-space-4);
}


.user-avatar {
    flex: 0 0 auto;
    background: var(--color-primary-container);
    color: var(--color-on-primary-container);
}

/* 有真实头像时用白底（透明 logo 不会露出淡紫圆底） */
.user-avatar:has(> img) {
    background: #fff;
}

.user-fields {
    display: flex;
    flex-direction: column;
    gap: var(--md-space-3);
}

.user-field {
    display: grid;
    grid-template-columns: 104px minmax(0, 1fr);
    gap: var(--md-space-3);
    align-items: baseline;
}

.user-field__label {
    font-size: 12px;
    line-height: 16px;
    letter-spacing: 0.4px;
    color: var(--color-text-secondary);
}

.user-field__value {
    font-size: 13px;
    line-height: 20px;
    color: var(--color-text);
    word-break: break-all;
}

.user-actions {
    display: flex;
    justify-content: flex-end;
    width: 100%;
}

.ban-hint {
    margin: 0;
    font-size: 14px;
    line-height: 20px;
    color: var(--color-on-surface-variant);
}

@media (max-width: 640px) {
    .user-field {
        grid-template-columns: 1fr;
        gap: 2px;
    }
}
</style>
