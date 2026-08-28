<script setup>
import { ref, onMounted, inject } from 'vue';
import { Dialog, Snackbar } from '@varlet/ui';
import { formatTime } from '@/shared/utils/format';
import { getBindings, unbindProvider, getBindUrl } from '@/account/utils/api';
import '@varlet/ui/es/dialog/style';
import '@varlet/ui/es/snackbar/style';

const sdk = inject('sdk');
const user = inject('user');

const loading = ref(false);
const bindings = ref([]);
const supportedProviders = ref([
    { id: 'yzhyzxy', name: 'Yzhyzxy', icon: '/yzhyzxy.svg' },
    // { id: 'github', name: 'GitHub', icon: '/github.svg' },
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

onMounted(async () => {
    await fetchBindings();
})
</script>

<template>
    <div>
        <h2>第三方账号绑定</h2>
        <p style="color: var(--card-content-color); margin-bottom: 16px;">
            绑定第三方账号后，您可以使用它们进行快速登录。
        </p>

        <var-progress v-if="loading" indeterminate />
        <template v-else>
            <var-list>
                <var-cell v-for="provider in supportedProviders" :key="provider.id" :border="true">
                    <template #default>
                        <div
                            style="display: flex; justify-content: space-between; align-items: center; width: 100%; padding: 4px 0;">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <var-avatar v-if="provider.icon" :src="provider.icon" size="32px" color="transparent"
                                    style="flex-shrink: 0;" />
                                <div>
                                    <div style="font-weight: 500;">{{ provider.name }}</div>
                                    <div
                                        style="font-size: 13px; color: var(--card-content-color); display: flex; align-items: center; word-break: keep-all;">
                                        <template v-if="isBound(provider.id)">
                                            <my-icon icon="check-circle-outline"
                                                style="margin-inline-end: 5px; color: var(--color-success);" />
                                            已绑定
                                            <span v-if="getBinding(provider.id)?.created_at"
                                                style="margin-inline-start: 10px;">绑定时间：{{
                                                    formatTime(getBinding(provider.id)?.created_at) }}</span>

                                        </template>
                                        <template v-else>
                                            <my-icon icon="minus-circle"
                                                style="margin-inline-end: 5px; color: var(--color-danger);" />
                                            未绑定
                                        </template>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <var-button v-if="isBound(provider.id)" type="danger"
                                    @click="handleUnbind(provider.id)">
                                    解绑
                                </var-button>
                                <var-button v-else type="primary" @click="handleBind(provider.id)">
                                    绑定
                                </var-button>
                            </div>
                        </div>
                    </template>
                </var-cell>
            </var-list>
        </template>
    </div>
</template>

<style scoped>
.var-cell {
    --cell-padding: 8px 16px;
}
</style>