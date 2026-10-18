<script setup>
import { ref, onMounted, inject } from 'vue';
import { Dialog, Snackbar } from '@varlet/ui';
import { formatTime } from '@/shared/utils/format';
import { getBindings, unbindProvider, getBindUrl } from '@/account/utils/api';
import '@varlet/ui/es/dialog/style';
import '@varlet/ui/es/snackbar/style';

const sdk = inject('sdk');
const user = inject('user');
const refreshState = ref(false);
const loading = ref(false);
const bindings = ref([]);
const supportedProviders = ref([
    { id: 'yzhyzxy', name: 'Yzhyzxy', icon: '/yzhyzxy.svg' },
    { id: 'github', name: 'GitHub', icon: '/github.svg' },
    // { id: 'google', name: 'Google', icon: '/google.svg' },
]);

async function fetchBindings() {
    loading.value = true;
    try {
        const data = await getBindings();
        bindings.value = data.bindings || [];
    } catch (error) {
        Snackbar.error('获取绑定列表失败');
        console.error(error);
    } finally {
        loading.value = false;
    }
}

function isBound(providerId) {
    return bindings.value.some(b => b.provider === providerId);
}

function getBinding(providerId) {
    return bindings.value.find(b => b.provider === providerId);
}

async function handleBind(providerId) {
    const provider = supportedProviders.value.find(p => p.id === providerId);
    if (!provider) return;

    if (isBound(providerId)) {
        Snackbar.warning(`${provider.name} 已绑定`);
        return;
    }

    try {
        const url = await getBindUrl(providerId, 'register');
        const width = screen.availWidth / 4 * 3;
        const height = screen.availHeight / 4 * 3;
        const left = (screen.availWidth - width) / 2;
        const top = (screen.availHeight - height) / 2;
        const popup = window.open(
            url,
            `bind_${providerId}`,
            `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
        );
        if (!popup) {
            Snackbar.error('请允许弹窗，或手动点击链接进行绑定');
            return;
        }

        const handler = (event) => {
            if (event.origin !== 'https://online.undz.cn') return;
            const data = event.data;
            if (data?.action === 'bind_success') {
                if (timer) clearInterval(timer);
                window.removeEventListener('message', handler);
                popup.close();
                Snackbar.success(`${provider.name} 绑定成功`);
                fetchBindings();
            } else if (data?.action === 'bind_failed') {
                if (timer) clearInterval(timer);
                window.removeEventListener('message', handler);
                popup.close();
                Snackbar.error(data.error === 'not_logged_in' ? '请先登录' : '绑定失败，该账号已被其他用户绑定');
            } else if (data?.action === 'bind_already') {
                if (timer) clearInterval(timer);
                window.removeEventListener('message', handler);
                popup.close();
                Snackbar.info('该账号已绑定');
            }
        };
        window.addEventListener('message', handler);

        const timer = setInterval(() => {
            if (popup.closed) {
                Snackbar.info('已关闭视窗');
                clearInterval(timer);
                window.removeEventListener('message', handler);
            }
        }, 500);
    } catch (error) {
        Snackbar.error(error.message || '获取授权链接失败');
    }
}

// 解绑
async function handleUnbind(providerId) {
    const provider = supportedProviders.value.find(p => p.id === providerId);
    if (!provider) return;

    const action = await Dialog({
        title: '确认解绑',
        confirmButtonProps: { text: false, type: 'danger' },
        message: `确定要解除与“${provider.name}”的绑定吗？`
    });
    if (action !== 'confirm') return;

    try {
        await unbindProvider(providerId);
        Snackbar.success(`${provider.name} 已解绑`);
        await fetchBindings();
    } catch (error) {
        Dialog({
            title: '解绑失败',
            message: error.message || '请重试'
        });
    }
}
async function onPullRefresh() {
    try {
        await fetchBindings();
    } catch (error) {
        Snackbar.error(error.message)
    } finally {
        refreshState.value = false;
    }
}
onMounted(async () => {
    await fetchBindings();
})
</script>

<template>
    <var-pull-refresh v-model="refreshState" @refresh="onPullRefresh">
        <div class="link-page">
            <div class="md-page-header">
                <div class="md-page-heading">
                    <h1 class="md-page-title">第三方账号绑定</h1>
                    <p class="md-page-subtitle">绑定第三方账号后，可以使用它们快速登录</p>
                </div>
            </div>

            <var-progress v-if="loading && !supportedProviders.length" indeterminate />

            <var-result v-else-if="!supportedProviders.length" type="empty" title="暂无可绑定的第三方账号"
                description="当前没有可用的第三方登录渠道。" />

            <div v-else class="link-list">
                <p class="md-section__title">
                    <my-icon icon="link-variant" size="1.2em" />
                    登录渠道
                </p>

                <var-cell v-for="provider in supportedProviders" :key="provider.id" :title="provider.name"
                    :border="true" class="link-cell">
                    <template #icon>
                        <span class="link-icon">
                            <var-avatar v-if="provider.icon" :src="provider.icon" :size="32" class="link-avatar" />
                            <my-icon v-else icon="account-circle" size="24px" />
                        </span>
                    </template>

                    <template #description>
                        <span v-if="isBound(provider.id)" class="link-status link-status--bound">
                            <my-icon icon="check-circle-outline" size="1em" />
                            已绑定
                            <span v-if="getBinding(provider.id)?.created_at" class="link-time">
                                · {{ formatTime(getBinding(provider.id)?.created_at) }}
                            </span>
                        </span>
                        <span v-else class="link-status">
                            <my-icon icon="minus-circle-outline" size="1em" />
                            未绑定
                        </span>
                    </template>

                    <template #extra>
                        <var-button v-if="isBound(provider.id)" text type="danger" size="small"
                            @click="handleUnbind(provider.id)">
                            解绑
                        </var-button>
                        <var-button v-else type="primary" tonal size="small" @click="handleBind(provider.id)">
                            绑定
                        </var-button>
                    </template>
                </var-cell>
            </div>
        </div>
    </var-pull-refresh>
</template>

<style scoped>
.link-page {
    padding-bottom: var(--md-space-8);
}

.link-list {
    max-width: 720px;
}

.link-avatar {
    background: #fff;
}

.link-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-right: var(--md-space-3);
}

.link-status {
    display: inline-flex;
    align-items: center;
    gap: var(--md-space-1);
    font-size: 12px;
    line-height: 16px;
    letter-spacing: 0.4px;
    color: var(--color-text-secondary);
}

.link-status--bound {
    color: var(--color-success);
}

.link-time {
    color: var(--color-text-secondary);
}
</style>