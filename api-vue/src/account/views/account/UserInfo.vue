<script setup>
import { inject, ref, watch, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { Dialog, Snackbar } from '@varlet/ui'
import { formatTime } from '@/shared/utils/format';
import '@varlet/ui/es/dialog/style';
import '@varlet/ui/es/snackbar/style';
import { isEmailDomainAllowed } from '@/account/utils/validators';
import { updateProfile, request } from '@/account/utils/api';
const sdk = inject('sdk');
const user = inject('user');
const refreshUser = inject('refreshUser');
const router = useRouter();
const usernameInput = ref('');
const avatarInput = ref('');
const emailInput = ref('');
const descriptionInput = ref('');
const uidInput = ref('');
const genderInput = ref('');
const loading = ref(false);
const isModified = ref(false);
// 邮箱修改对话框相关
const showChangeEmailDialog = ref(false);
const newEmail = ref('');
const emailCode = ref('');
const emailToken = ref('');
const emailSending = ref(false);
const emailChanging = ref(false);
const emailCountdown = ref(0);
let emailTimer = null;

// 发送验证码
async function sendEmailCode() {
    if (!newEmail.value || !newEmail.value.includes('@')) {
        Snackbar.warning('请输入有效的邮箱地址');
        return;
    }
    if (!isEmailDomainAllowed(newEmail.value)) {
        Snackbar.warning('该邮箱域名不在支持列表中，请更换邮箱');
        return;
    }
    emailSending.value = true;
    try {
        const res = await request('send-verification', {
            method: 'POST',
            body: { email: newEmail.value, action: 'change_email' }
        });
        emailToken.value = res.token;
        Snackbar.success('验证码已发送，请查收邮件');
        // 开始倒计时
        emailCountdown.value = 60;
        if (emailTimer) clearInterval(emailTimer);
        emailTimer = setInterval(() => {
            emailCountdown.value--;
            if (emailCountdown.value <= 0) {
                clearInterval(emailTimer);
                emailTimer = null;
            }
        }, 1000);
    } catch (error) {
        Snackbar.error(error.message || '发送失败');
    } finally {
        emailSending.value = false;
    }
}

// 确认修改邮箱
async function confirmChangeEmail() {
    if (!newEmail.value || !newEmail.value.includes('@')) {
        Snackbar.warning('请输入有效的邮箱地址');
        return;
    }
    if (!isEmailDomainAllowed(newEmail.value)) {
        Snackbar.warning('该邮箱域名不在支持列表中，请更换邮箱');
        return;
    }
    if (!emailCode.value || emailCode.value.length !== 6) {
        Snackbar.warning('请输入6位验证码');
        return;
    }
    if (!emailToken.value) {
        Snackbar.warning('请先获取验证码');
        return;
    }

    emailChanging.value = true;
    try {
        await updateProfile({
            email: newEmail.value,
            code: emailCode.value,
            token: emailToken.value
        });
        if (refreshUser) {
            await refreshUser();
        }
        Snackbar.success('邮箱修改成功');
        showChangeEmailDialog.value = false;
        // 重置状态
        newEmail.value = '';
        emailCode.value = '';
        emailToken.value = '';
        if (emailTimer) {
            clearInterval(emailTimer);
            emailTimer = null;
            emailCountdown.value = 0;
        }
    } catch (error) {
        Dialog({
            title: '修改失败',
            message: error.message || '请重试'
        });
    } finally {
        emailChanging.value = false;
    }
}


onUnmounted(() => {
    if (emailTimer) clearInterval(emailTimer);
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
    <!-- 修改邮箱：var-dialog + var-form（MD3 对话框，不再手写 var-dialog 内部结构） -->
    <var-dialog v-model:show="showChangeEmailDialog" title="修改邮箱" :confirm-button="false" :cancel-button="false"
        :close-on-click-overlay="false" width="min(480px, calc(100vw - 32px))">
        <template #title>
            <div class="md-dialog-title">
                <my-icon icon="email-edit-outline" size="1.25em" class="md-dialog-title__icon" />
                <span>修改邮箱</span>
            </div>
        </template>
        <div class="md-dialog-form">
            <p class="dialog-hint">请输入新的邮箱地址，验证码将发送到该邮箱。</p>
            <var-input v-model="newEmail" type="email" variant="outlined" placeholder="新邮箱地址" />
            <var-button type="primary" block :loading="emailSending" :disabled="emailCountdown > 0 || !newEmail"
                @click="sendEmailCode">
                {{ emailCountdown > 0 ? `${emailCountdown}s 后可重新获取` : '获取验证码' }}
            </var-button>
            <var-input v-model="emailCode" variant="outlined" placeholder="6 位验证码" :maxlength="6" />
        </div>

        <template #actions="{ slotClass }">
            <div :class="slotClass" class="md-dialog-actions">
                <var-button text type="primary" @click="showChangeEmailDialog = false">取消</var-button>
                <var-button type="primary" :loading="emailChanging" @click="confirmChangeEmail">确认修改</var-button>
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
</style>