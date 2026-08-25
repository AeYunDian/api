<script setup>
import { inject, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Dialog, Snackbar } from '@varlet/ui'
import '@varlet/ui/es/dialog/style';
import '@varlet/ui/es/snackbar/style';
const sdk = inject('sdk');
const user = inject('user');
const router = useRouter();
const usernameInput = ref('');
const avatarInput = ref('');
const emailInput = ref('');
const descriptionInput = ref('');
const uidInput = ref('');
const genderInput = ref('');
watch(
    () => user.value,
    (newUser) => {
        if (newUser?.username) {
            usernameInput.value = newUser.username;
        }
        if (newUser?.avatar) {
            avatarInput.value = newUser.avatar;
        }
        if (newUser?.email) {
            emailInput.value = newUser.email;
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
    },
    { immediate: true }
);
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
    <div>
        <h2>个人信息</h2>
        <template v-if="user">
            <div>
                <var-input placeholder="用户名" v-if="user.username" v-model="usernameInput" />
                <br />
                <div v-if="user.avatar" class="avatar">
                    <var-input placeholder="头像URL" v-if="user.avatar" v-model="avatarInput"
                        style="margin-right: 25px;" />
                    <var-avatar :src="user.avatar" color="transparent" />
                </div>
                <br />
                <var-input placeholder="邮箱" v-if="user.email" v-model="emailInput" />
                <br />
                <var-input placeholder="UID" v-if="user.sub" v-model="uidInput" readonly>
                    <template #append-icon>
                        <var-button @click="copyToClipboard(user.sub)" text>
                            <my-icon icon="content-copy" />
                        </var-button>
                    </template>
                </var-input>
                <br />
                <var-select variant="outlined" v-if="user.gender !== undefined" v-model="genderInput"
                    placeholder="请选择性别" :options="[
                        { label: '保密', value: 'unknown' },
                        { label: '男', value: 'male' },
                        { label: '女', value: 'female' }
                    ]" />
                <br />
                <var-input placeholder="个人简介" v-if="user.description" v-model="descriptionInput" textarea
                    :maxlength="150" variant="outlined" rows=6>
                    <template #append-icon>
                        <div style="align-items: flex-start; height: 100%;">
                            <var-button @click="pasteWithClipboard(descriptionInput)" text>
                                <my-icon icon="content-paste" />
                            </var-button>
                        </div>
                    </template>
                </var-input>
                <br />

            </div>
        </template>
        <p v-else>加载中...</p>
    </div>
</template>
<style scoped>
.avatar {
    align-items: center;
    display: flex;
    justify-content: flex-start;
}

.var-input,
.var-select {
    margin-right: 10px;
    width: 100%;
}

@media (min-width: 768px) {

    .var-input,
    .var-select {
        width: 80%;
    }
}

.var-space {
    align-items: center;
}
</style>