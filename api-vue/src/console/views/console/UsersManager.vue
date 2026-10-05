<script setup>
import { ref, onMounted } from 'vue'
import { Dialog, Snackbar } from '@varlet/ui'
import { getUsers, banUser } from '@/console/utils/api'
import { formatTime } from '@/shared/utils/format'
import { useIsAdmin } from '@/console/composables/useIsAdmin'
import '@varlet/ui/es/dialog/style'
import '@varlet/ui/es/snackbar/style'

const isAdmin = useIsAdmin()

const loading = ref(false)
const refreshState = ref(false)
const users = ref([])
const showBanDialog = ref(false)
const banTarget = ref(null)
const banReason = ref('')

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
    try {
        await banUser(banTarget.value.sub, true, reason)
        Snackbar.success(`用户 "${banTarget.value.username}" 已封禁`)
        showBanDialog.value = false
        await loadUsers()
    } catch (error) {
        Snackbar.error(error.message || '封禁失败')
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
        title: '确认解封',
        message: `确定要解封用户 "${targetUser.username}" 吗？解封后该用户可恢复正常登录。`,
        confirmButtonText: '确认解封',
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
        <div>
            <div class="page-header">
                <h2>用户管理</h2>
                <var-button @click="loadUsers" :disabled="!isAdmin">刷新</var-button>
            </div>

            <p v-if="!isAdmin" class="empty-tip">
                <my-icon icon="error" />
                <span style="margin-inline-start: 10px;">只有管理员可以查看和管理用户</span>
            </p>

            <var-progress v-else-if="loading" indeterminate />
            <p v-else-if="!users.length" style="margin-bottom: 70px;">暂无用户</p>

            <var-list v-else>
                <var-card v-for="u in users" :key="u.sub" class="user-card">
                    <div class="user-row">
                        <div>
                            <div class="user-tags">
                                <strong>{{ u.username }}</strong>
                                <var-chip v-if="u.banned" type="danger" size="small">已封禁</var-chip>
                                <var-chip v-if="u.sub === 1" type="primary" size="small">超级管理员</var-chip>
                            </div>
                            <div class="user-meta">
                                <div>UID: {{ u.sub }}</div>
                                <div>邮箱：{{ u.email || '未设置' }}</div>
                                <div v-if="u.ban_reason">封禁原因：{{ u.ban_reason }}</div>
                                <div>注册时间：{{ formatTime(u.created_at) }}</div>
                            </div>
                        </div>
                        <var-button v-if="u.sub !== 1" :type="u.banned ? 'success' : 'danger'"
                            @click="u.banned ? confirmUnban(u) : openBanDialog(u)">
                            {{ u.banned ? '解封' : '封禁' }}
                        </var-button>
                    </div>
                </var-card>
            </var-list>
        </div>
    </var-pull-refresh>

    <var-popup v-model:show="showBanDialog" class="var-dialog__popup" var-dialog-cover @closed="closeBanDialog">
        <div class="var--box var-dialog">
            <div class="var-dialog__title">封禁用户</div>
            <div class="dialog-message">
                <p class="ban-hint">
                    封禁用户 <strong>{{ banTarget?.username }}</strong>，该用户将无法登录所有服务。
                </p>
                <var-input placeholder="请输入封禁原因（可选）" v-model="banReason" textarea rows="3" :maxlength="200" />
            </div>
            <div class="var-dialog__actions">
                <var-button @click="showBanDialog = false" text type="primary"
                    class="var--inline-flex var-dialog__button var-dialog__cancel-button">取消</var-button>
                <var-button @click="confirmBan" text type="danger"
                    class="var--inline-flex var-dialog__button var-dialog__confirm-button">确认封禁</var-button>
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
}

.user-card {
    margin-bottom: 12px;
}

.user-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.user-tags {
    display: flex;
    align-items: center;
    gap: 8px;
}

.user-meta {
    font-size: 13px;
}

.ban-hint {
    margin: 0 0 12px 0;
    color: var(--color-text-secondary);
}

.dialog-message {
    padding: 0 24px 16px;
}
</style>