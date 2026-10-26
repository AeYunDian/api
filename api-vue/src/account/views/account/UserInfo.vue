<script setup>
import { computed, inject, ref, watch, onUnmounted } from 'vue';
import { Dialog, Snackbar } from '@varlet/ui'
import { formatTime } from '@/shared/utils/format';
import '@varlet/ui/es/dialog/style';
import '@varlet/ui/es/snackbar/style';
import { isEmailDomainAllowed } from '@/account/utils/validators';
import { updateProfile, createEmailVerify, queryEmailVerify, changeEmail } from '@/account/utils/api';
const sdk = inject('sdk');
const user = inject('user');
const refreshUser = inject('refreshUser');
const usernameInput = ref('');
const avatarInput = ref('');
const emailInput = ref('');
const descriptionInput = ref('');
const uidInput = ref('');
const genderInput = ref('');
const loading = ref(false);
const isModified = ref(false);
// 修改邮箱（第一步：输入新邮箱并创建反向验证任务）
const showChangeEmailDialog = ref(false);
const newEmail = ref('');
const emailSending = ref(false);

// 修改邮箱（第二步：提示用户发邮件 + 轮询验证结果）
const showVerifyEmailDialog = ref(false);
const verifyTicket = ref(null);
const verifyStatus = ref('waiting'); // waiting | success | expired | error
const verifyMessage = ref('');
const verifyPolling = ref(false);
const verifyPollCount = ref(0);
const emailChanging = ref(false);
const canRetryChange = ref(false);
let verifyTimer = null;

const mailtoUrl = computed(() => {
    const ticket = verifyTicket.value;
    if (!ticket) return '';
    return `mailto:${encodeURIComponent(ticket.email)}?subject=${encodeURIComponent('验证码')}&body=${encodeURIComponent(ticket.code)}`;
});

const verifyExpiresAt = computed(() => {
    const ticket = verifyTicket.value;
    if (!ticket?.expiresAt) return '';
    return new Date(ticket.expiresAt * 1000).toLocaleString('zh-CN', { hour12: false });
});

function stopVerifyPolling() {
    if (verifyTimer) {
        clearInterval(verifyTimer);
        verifyTimer = null;
    }
}

function resetVerifyState() {
    stopVerifyPolling();
    verifyTicket.value = null;
    verifyStatus.value = 'waiting';
    verifyMessage.value = '';
    verifyPolling.value = false;
    verifyPollCount.value = 0;
    canRetryChange.value = false;
    emailChanging.value = false;
    newEmail.value = '';
}

// 获取验证码：创建反向验证任务，拿到专用收件地址和随机验证码
async function sendEmailCode() {
    const email = newEmail.value.trim();
    if (!email || !email.includes('@')) {
        Snackbar.warning('请输入有效的邮箱地址');
        return;
    }
    if (!isEmailDomainAllowed(email)) {
        Snackbar.warning('该邮箱域名不在支持列表中，请更换邮箱');
        return;
    }

    emailSending.value = true;
    try {
        const ticket = await createEmailVerify({ email });
        newEmail.value = email;
        verifyTicket.value = ticket;
        verifyStatus.value = 'waiting';
        verifyMessage.value = '';
        verifyPollCount.value = 0;
        canRetryChange.value = false;
        showChangeEmailDialog.value = false;
        showVerifyEmailDialog.value = true;
        startVerifyPolling();
    } catch (error) {
        Snackbar.error(error.message || '获取验证码失败');
    } finally {
        emailSending.value = false;
    }
}

function startVerifyPolling() {
    stopVerifyPolling();
    // 立即查一次，之后每 3 秒自动轮询
    pollVerifyOnce();
    verifyTimer = setInterval(pollVerifyOnce, 3000);
}

// 轮询（也用于界面上的“手动刷新”按钮）
async function pollVerifyOnce() {
    const ticket = verifyTicket.value;
    if (!ticket || verifyPolling.value || verifyStatus.value !== 'waiting') return;

    verifyPolling.value = true;
    verifyPollCount.value++;
    try {
        const data = await queryEmailVerify({
            requestId: ticket.requestId,
            email: newEmail.value
        });
        // 期间用户可能点了“返回修改”或关闭弹窗，丢弃过期响应
        if (!verifyTicket.value || verifyTicket.value.requestId !== ticket.requestId) return;

        if (data.valid) {
            verifyStatus.value = 'success';
            stopVerifyPolling();
            // 验证通过：带上邮件验证 ID 请求修改邮箱
            await applyEmailChange();
            return;
        }

        if (data.error === 'EXPIRED_OR_NOT_FOUND') {
            verifyStatus.value = 'expired';
            verifyMessage.value = '验证已过期，请重新获取';
            stopVerifyPolling();
        } else if (data.error === 'ACTION_MISMATCH' || data.error === 'EMAIL_MISMATCH') {
            verifyStatus.value = 'error';
            verifyMessage.value = '验证信息不匹配，请重新获取';
            stopVerifyPolling();
        } else {
            // NOT_YET_VERIFIED：继续等待下一轮
            verifyMessage.value = '';
        }
    } catch (error) {
        const message = error.message || '网络异常';
        if (message === 'Unauthorized') {
            verifyStatus.value = 'error';
            verifyMessage.value = '登录状态已过期，请刷新页面后重试';
            stopVerifyPolling();
        } else {
            // 网络抖动不终止轮询，下一轮自动重试
            verifyMessage.value = `${message}，正在重试…`;
        }
    } finally {
        verifyPolling.value = false;
    }
}

// 验证通过后真正提交改邮箱；失败时保留 ticket 供“重试修改”
async function applyEmailChange() {
    const ticket = verifyTicket.value;
    if (!ticket || emailChanging.value) return;

    emailChanging.value = true;
    canRetryChange.value = false;
    try {
        await changeEmail({
            email: newEmail.value,
            emailVerifyId: ticket.requestId
        });
        Snackbar.success('邮箱修改成功');
        showVerifyEmailDialog.value = false;
        resetVerifyState();
        if (refreshUser) {
            try {
                await refreshUser();
            } catch (error) {
                console.error('刷新用户信息失败:', error);
            }
        }
    } catch (error) {
        verifyStatus.value = 'error';
        verifyMessage.value = error.message || '邮箱修改失败，请重试';
        canRetryChange.value = true;
    } finally {
        emailChanging.value = false;
    }
}

// 取消验证：任务会在服务端自然过期
function closeVerifyDialog() {
    showVerifyEmailDialog.value = false;
    resetVerifyState();
}

// 返回第一步修改邮箱地址；旧任务不消费，等待过期
function backToEmailDialog() {
    stopVerifyPolling();
    showVerifyEmailDialog.value = false;
    verifyTicket.value = null;
    verifyStatus.value = 'waiting';
    verifyMessage.value = '';
    verifyPollCount.value = 0;
    canRetryChange.value = false;
    emailChanging.value = false;
    showChangeEmailDialog.value = true;
}

onUnmounted(() => {
    stopVerifyPolling();
});

let runCount = 0;
watch(
    () => user.value,
    (newUser) => {
        if (runCount > 2) return;
        if (newUser?.username) {
            usernameInput.value = newUser.username;
        }
        if (newUser?.avatar) {
            avatarInput.value = newUser.avatar;
        }
        if (newUser?.email) {
            emailInput.value = maskEmail(newUser.email);
        }
        if (newUser?.description) {
            descriptionInput.value = newUser.description;
        }
        if (newUser?.sub) {
            uidInput.value = newUser.sub;
        }
        if (newUser?.gender) {
            genderInput.value = newUser.gender;
        }
        runCount++;
    },
    { immediate: true }
);
watch(
    [usernameInput, avatarInput, emailInput, genderInput, descriptionInput],
    () => {
        if (!user.value) {
            isModified.value = false;
            return;
        }
        const changed =
            usernameInput.value !== (user.value.username ?? '') ||
            avatarInput.value !== (user.value.avatar ?? '') ||
            genderInput.value !== (user.value.gender ?? '') ||
            descriptionInput.value !== (user.value.description ?? '');
        isModified.value = changed;
    },
    { deep: true }
);
function maskEmail(email) {
    if (!email || typeof email !== 'string' || !email.includes('@')) {
        return email;
    }
    const atIndex = email.indexOf('@');
    const username = email.slice(0, atIndex);
    const domain = email.slice(atIndex);
    if (username.length <= 3) {
        return email;
    }
    const prefix = username.slice(0, 2);
    const suffix = username.slice(-1);
    return prefix + '****' + suffix + domain;
}
async function handleSave() {
    // 收集有变化的字段
    const payload = {};
    if (usernameInput.value !== user.value?.username) payload.username = usernameInput.value;
    if (avatarInput.value !== user.value?.avatar) payload.avatar = avatarInput.value;
    if (genderInput.value !== user.value?.gender) payload.gender = genderInput.value;
    if (descriptionInput.value !== user.value?.description) payload.description = descriptionInput.value;

    if (Object.keys(payload).length === 0) {
        Snackbar.info('未做任何修改');
        return;
    }

    loading.value = true;
    try {
        await updateProfile(payload);
        if (refreshUser) {
            await refreshUser();
        } else {
            Snackbar.warning('刷新信息时出现问题，请手动刷新页面后查看更新');
        }
        Snackbar.success('个人信息已更新');
        isModified.value = false;
    } catch (error) {
        Dialog({
            title: '更新失败',
            message: error.message || '请重试'
        });
    } finally {
        loading.value = false;
    }
}

async function copyToClipboard(text) {
    try {
        if (!text) {
            Snackbar.warning('没有内容可复制');
            return;
        }
        // 优先使用 Clipboard API
        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
            await navigator.clipboard.writeText(String(text));
            Snackbar.success('已复制到剪贴板');
            return;
        }
        // 降级方案：使用 document.execCommand（虽已弃用，但仍是唯一兼容方式）
        // 提示用户升级浏览器或使用 HTTPS
        console.warn('Clipboard API 不可用，使用 document.execCommand 降级方案');
        const textarea = document.createElement('textarea');
        textarea.value = String(text);
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        textarea.style.pointerEvents = 'none';
        document.body.appendChild(textarea);
        textarea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textarea);
        if (success) {
            Snackbar.success('已复制到剪贴板');
        } else {
            throw new Error('复制失败');
        }
    } catch (err) {
        const errorMsg = err.message || err.name || '未知错误';
        Snackbar.error(`复制失败：${errorMsg}`);
    }
}
async function pasteWithClipboard(refvalue) {
    try {

        // 正常情况（refvalue 是 ref）
        if (!navigator.clipboard || typeof navigator.clipboard.readText !== 'function') {
            Snackbar.warning('浏览器不支持剪贴板读取，请手动输入');
            return;
        }
        // 如果传入的是字符串，说明传入的是值而不是 ref，直接赋值
        if (typeof refvalue === 'string') {
            const text = await navigator.clipboard.readText();
            descriptionInput.value = text;
            Snackbar.success('已从剪贴板粘贴');
            return;
        }
        const text = await navigator.clipboard.readText();
        if (text) {
            refvalue.value = text;
            Snackbar.success('已从剪贴板粘贴');
        } else {
            Snackbar.warning('剪贴板内容为空');
        }
    } catch (err) {
        const errorMsg = err.message || err.name || '未知错误';
        console.error('粘贴失败:', err);
        Snackbar.error(`粘贴失败: ${errorMsg}`);
    }
}
</script>

<template>
    <!-- 第一步：输入新邮箱，创建反向邮件验证任务 -->
    <var-dialog v-model:show="showChangeEmailDialog" title="修改邮箱" :confirm-button="false" :cancel-button="false"
        :close-on-click-overlay="false" :close-on-key-escape="false" width="min(480px, calc(100vw - 32px))">
        <template #title>
            <div class="md-dialog-title">
                <my-icon icon="email-edit-outline" size="1.25em" class="md-dialog-title__icon" />
                <span>修改邮箱</span>
            </div>
        </template>
        <div class="md-dialog-form">
            <p class="dialog-hint">
                请输入新的邮箱地址。点击“获取验证码”后会生成一个专用收件地址，
                需要你用这个新邮箱向该地址发送验证邮件。
            </p>
            <var-input v-model="newEmail" type="email" variant="outlined" placeholder="新邮箱地址" />
        </div>

        <template #actions="{ slotClass }">
            <div :class="slotClass" class="md-dialog-actions">
                <var-button text type="primary" @click="showChangeEmailDialog = false">取消</var-button>
                <var-button type="primary" :loading="emailSending" :disabled="!newEmail" @click="sendEmailCode">
                    获取验证码
                </var-button>
            </div>
        </template>
    </var-dialog>

    <!-- 第二步：指导用户发邮件，并每 3 秒轮询验证结果 -->
    <var-dialog v-model:show="showVerifyEmailDialog" title="验证新邮箱" :confirm-button="false" :cancel-button="false"
        :close-on-click-overlay="false" :close-on-key-escape="false" width="min(560px, calc(100vw - 32px))">
        <template #title>
            <div class="md-dialog-title">
                <my-icon icon="email-check-outline" size="1.25em" class="md-dialog-title__icon" />
                <span>验证新邮箱</span>
            </div>
        </template>

        <div v-if="verifyTicket" class="md-dialog-form verify-dialog">
            <p class="dialog-hint">
                请用新邮箱 <strong class="verify-email">{{ newEmail }}</strong> 作为发件人，
                向下面的专用地址发送一封邮件（主题随意）：
            </p>

            <div class="verify-box">
                <span class="verify-box__label">收件地址</span>
                <code class="verify-box__value">{{ verifyTicket.email }}</code>
                <var-button text type="primary" @click="copyToClipboard(verifyTicket.email)">复制</var-button>
            </div>

            <div class="verify-box">
                <span class="verify-box__label">邮件正文</span>
                <code class="verify-box__value verify-box__value--code">{{ verifyTicket.code }}</code>
                <var-button text type="primary" @click="copyToClipboard(verifyTicket.code)">复制</var-button>
            </div>

            <p class="dialog-hint">
                正文只需填写上面的验证码，若发送后无响应，请尝试发送时启用纯文本模式。
            </p>

            <a class="verify-mailto" :href="mailtoUrl">
                <my-icon icon="email-fast-outline" />
                <span>使用邮件客户端发送（mailto）</span>
            </a>

            <div class="verify-status" :class="`verify-status--${verifyStatus}`">
                <template v-if="verifyStatus === 'waiting'">
                    <span class="verify-spinner" />
                    <span>{{ verifyMessage || `等待邮件…` }}</span>
                </template>
                <template v-else-if="verifyStatus === 'success'">
                    <my-icon icon="check-circle-outline" />
                    <span>{{ emailChanging ? '验证通过，正在修改邮箱…' : '验证通过' }}</span>
                </template>
                <template v-else-if="verifyStatus === 'expired'">
                    <my-icon icon="clock-alert-outline" />
                    <span>验证已过期，请重新获取</span>
                </template>
                <template v-else>
                    <my-icon icon="alert-circle-outline" />
                    <span>{{ verifyMessage || '验证失败' }}</span>
                </template>
            </div>

            <p v-if="verifyExpiresAt" class="md-hint">验证有效期至 {{ verifyExpiresAt }}</p>
        </div>

        <template #actions="{ slotClass }">
            <div :class="slotClass" class="md-dialog-actions">
                <var-button text type="primary" :disabled="emailChanging" @click="backToEmailDialog">
                    返回修改
                </var-button>
                <var-button v-if="verifyStatus === 'waiting'" type="primary" :loading="verifyPolling"
                    @click="pollVerifyOnce">
                    手动刷新
                </var-button>
                <var-button v-if="verifyStatus === 'expired'" type="primary" @click="backToEmailDialog">
                    重新获取
                </var-button>
                <var-button v-if="canRetryChange" type="primary" :loading="emailChanging" @click="applyEmailChange">
                    重试修改
                </var-button>
                <var-button text :disabled="emailChanging" @click="closeVerifyDialog">取消</var-button>
            </div>
        </template>
    </var-dialog>

    <div class="user-info-page">
        <div class="md-page-header">
            <div class="md-page-heading">
                <h1 class="md-page-title">个人信息</h1>
                <p class="md-page-subtitle">修改后会同步到所有已接入 Ay 服务的应用</p>
            </div>
        </div>

        <var-progress v-if="!user" indeterminate />

        <div v-else class="info-form">
            <p class="md-section__title">
                <my-icon icon="account-circle-outline" size="1.2em" />
                基本资料
            </p>

            <div class="md-dialog-form">
                <var-input v-if="user.username" v-model="usernameInput" variant="outlined" placeholder="用户名" />

                <div v-if="user.avatar" class="avatar-row">
                    <var-input v-model="avatarInput" variant="outlined" placeholder="头像 URL" class="avatar-input" />
                    <var-avatar :src="user.avatar" :size="48" class="avatar-preview" />
                </div>

                <var-input v-if="user.email" v-model="emailInput" variant="outlined" placeholder="邮箱" readonly>
                    <template #append-icon>
                        <var-button text @click="showChangeEmailDialog = true">
                            <my-icon icon="exchange" />
                        </var-button>
                    </template>
                </var-input>

                <var-input v-if="user.sub" v-model="uidInput" variant="outlined" placeholder="UID" readonly>
                    <template #append-icon>
                        <var-button text @click="copyToClipboard(user.sub)">
                            <my-icon icon="content-copy" />
                        </var-button>
                    </template>
                </var-input>

                <var-select v-if="user.gender !== undefined" v-model="genderInput" variant="outlined" placeholder="性别"
                    :options="[
                        { label: '保密', value: 'unknown' },
                        { label: '男', value: 'male' },
                        { label: '女', value: 'female' },
                    ]" />

                <var-input v-if="user.description" v-model="descriptionInput" textarea :maxlength="150"
                    variant="outlined" :rows="4" placeholder="个人简介">
                    <template #append-icon>
                        <var-button text @click="pasteWithClipboard(descriptionInput)">
                            <my-icon icon="content-paste" />
                        </var-button>
                    </template>
                </var-input>

                <p v-if="user.created_at" class="md-hint">注册时间：{{ formatTime(user.created_at) }}</p>
            </div>

            <div class="info-actions">
                <var-button type="primary" :loading="loading" :disabled="!isModified" @click="handleSave">
                    保存修改
                </var-button>
            </div>
        </div>
    </div>
</template>
<style scoped>
.user-info-page {
    padding-bottom: var(--md-space-8);
}

.info-form {
    max-width: 720px;
}

/* 头像可能是透明底的 logo，白底才好看 */
.avatar-preview {
    background: #fff;
    flex: 0 0 auto;
}

.avatar-row {
    display: flex;
    align-items: center;
    gap: var(--md-space-3);
}

.avatar-input {
    flex: 1;
    min-width: 0;
}

.info-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: var(--md-space-6);
}

.dialog-hint {
    margin: 0;
    font-size: 14px;
    line-height: 20px;
    color: var(--color-text-secondary);
}

/* 窄屏时操作按钮自动换行，避免四个按钮挤成一排 */
.md-dialog-actions {
    flex-wrap: wrap;
}

.verify-email {
    color: var(--color-primary);
    word-break: break-all;
}

.verify-box {
    display: flex;
    align-items: center;
    gap: var(--md-space-2);
    padding: 10px 12px;
    border-radius: var(--md-shape-md);
    background: var(--color-surface-container-high, rgba(0, 0, 0, 0.04));
}

.verify-box__label {
    flex: 0 0 auto;
    font-size: 12px;
    color: var(--color-text-tertiary);
}

.verify-box__value {
    flex: 1;
    min-width: 0;
    font-family: var(--md-font-mono);
    font-size: 14px;
    word-break: break-all;
    color: var(--color-text);
}

.verify-box__value--code {
    font-size: 20px;
    font-weight: 600;
    letter-spacing: 3px;
    color: var(--color-primary);
}

.verify-mailto {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--md-space-2);
    align-self: flex-start;
    padding: 8px 16px;
    border-radius: var(--md-shape-full);
    background: var(--color-primary-container);
    color: var(--color-on-primary-container);
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
    transition: filter var(--md-duration-short) var(--md-ease-standard);
}

.verify-mailto:hover {
    filter: brightness(0.96);
}

.verify-status {
    display: flex;
    align-items: center;
    gap: var(--md-space-2);
    padding: 10px 12px;
    border-radius: var(--md-shape-md);
    background: var(--color-surface-container, rgba(0, 0, 0, 0.04));
    font-size: 13px;
    color: var(--color-text-secondary);
}

.verify-status--success {
    color: var(--color-primary);
}

.verify-status--expired,
.verify-status--error {
    color: var(--color-error);
}

.verify-spinner {
    width: 14px;
    height: 14px;
    border: 2px solid var(--color-outline-variant);
    border-top-color: var(--color-primary);
    border-radius: 50%;
    animation: verify-spin 0.8s linear infinite;
}

@keyframes verify-spin {
    to {
        transform: rotate(360deg);
    }
}
</style>