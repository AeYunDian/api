// views/UserPanel.vue
<script setup>
import { onMounted, onUnmounted, ref, provide, inject } from 'vue';
import { isHostShell } from '@/shared/utils/device';
import { useRouter, useRoute, RouterView } from 'vue-router';
import { useDevice } from '@/shared/composables/useDevice';

const { mobileByWidth } = useDevice();
const router = useRouter();
const route = useRoute();
let intervalId = null;
const user = ref(null);
const leftPopup = inject('leftPopup');
const channel = inject('channel');
const sdk = inject('sdk');

provide('user', user);

const refreshUser = async () => {
    const { valid, data } = await checkLogin();
    if (valid && data?.user) {
        user.value = data.user;
        return data.user;
    }
    return null;
};

provide('refreshUser', refreshUser);

async function checkLogin() {
    try {
        const res = await sdk.verify();
        return { valid: !!res.valid, data: res };
    } catch (error) {
        console.error('[验证失败]', error);
        return { valid: false };
    }
}

function goHome() {
    if (intervalId) clearInterval(intervalId);
    channel.value.postMessage('logout');
    router.push('/');
}

onMounted(async () => {
    let { valid, data } = await checkLogin();
    if (!valid) {
        try {
            await sdk.refresh();
            const result = await checkLogin();
            valid = result.valid;
            data = result.data;
        } catch (refreshError) {
            valid = false;
        }
    }
    if (!valid || !data?.user) {
        goHome();
        return;
    }

    user.value = data.user;

    intervalId = setInterval(async () => {
        let { valid, data } = await checkLogin();
        if (!valid) {
            try {
                await sdk.refresh();
                const result = await checkLogin();
                valid = result.valid;
                data = result.data;
            } catch (refreshError) {
                valid = false;
            }
        }
        if (!valid || !data?.user) {
            goHome();
            return;
        }
        user.value = data.user;
    }, 10000);
});

onUnmounted(() => {
    if (intervalId) clearInterval(intervalId);
});

/* ---------- 导航数据 ---------- */

const navItems = [
    { path: '/account-overview', title: '账号概览', icon: 'application' },
    { path: '/user-info', title: '个人信息', icon: 'account-circle' },
    { path: '/link-account', title: '第三方账号绑定', icon: 'apache-kafka' },
    { path: '/oauth', title: '授权管理', icon: 'account-secure' },
    { path: '/security', title: '安全中心', icon: 'secure' },
];

const footerItems = [
    { path: '/console', title: 'AyConsole', icon: 'console-line', handler: openConsole },
    { path: '/about', title: '关于', icon: 'information' },
];

/* ---------- 导航行为 ---------- */

function isActive(item) {
    return !item.handler && route.path === `/user-panel${item.path}`;
}

function handleNav(item) {
    leftPopup.value = false;
    if (item.handler) {
        item.handler();
        return;
    }
    if (isActive(item)) return;
    router.push(`/user-panel${item.path}`);
}

function openConsole() {
    const domain = import.meta.env.PROD
        ? (isHostShell() ? 'console.app.undz.cn' : 'console.undz.cn')
        : 'console-dev.undz.cn';
    window.location.href = `https://${domain}/console-panel/oauth-client${isHostShell() ? '?notinithostshell' : ''}`;
}
</script>

<template>
    <div class="user-layout" :class="{ 'is-mobile': mobileByWidth }">
        <!-- 桌面端：常驻侧栏 -->
        <aside v-if="!mobileByWidth" class="user-sidebar">
            <nav class="user-nav">
                <var-cell v-for="item in navItems" :key="item.path" :title="item.title" :border="true" v-ripple
                    :class="{ active: isActive(item) }" @click="handleNav(item)">
                    <template #icon>
                        <div class="var-cell__icon">
                            <div class="var-icon">
                                <my-icon :icon="item.icon" />
                            </div>
                        </div>
                    </template>
                </var-cell>
            </nav>
            <nav class="user-nav-footer">
                <var-cell v-for="item in footerItems" :key="item.path" :title="item.title" :border="true" v-ripple
                    @click="handleNav(item)">
                    <template #icon>
                        <div class="var-cell__icon">
                            <div class="var-icon">
                                <my-icon :icon="item.icon" />
                            </div>
                        </div>
                    </template>
                </var-cell>
            </nav>
        </aside>

        <!-- 主内容 -->
        <div class="user-main">
            <div class="user-content">
                <router-view v-if="user" />
                <div v-else class="loading-placeholder">加载中...</div>
            </div>
        </div>
    </div>

    <!-- 移动端：左侧抽屉 -->
    <var-popup v-if="mobileByWidth" position="left" v-model:show="leftPopup"
        style="display: flex;flex-direction: column;flex-shrink: 0;height: 100%;">
        <div class="left-popup">
            <div class="user-sidebar">
                <div class="user-nav">
                    <var-cell v-for="item in navItems" :key="item.path" :title="item.title" :border="true" v-ripple
                        :class="{ active: isActive(item) }" @click="handleNav(item)">
                        <template #icon>
                            <div class="var-cell__icon">
                                <div class="var-icon">
                                    <my-icon :icon="item.icon" />
                                </div>
                            </div>
                        </template>
                    </var-cell>
                </div>
                <nav class="user-nav-footer">
                    <var-cell v-for="item in footerItems" :key="item.path" :title="item.title" :border="true" v-ripple
                        @click="handleNav(item)">
                        <template #icon>
                            <div class="var-cell__icon">
                                <div class="var-icon">
                                    <my-icon :icon="item.icon" />
                                </div>
                            </div>
                        </template>
                    </var-cell>
                </nav>
            </div>
        </div>
    </var-popup>
</template>

<style scoped>
.user-layout {
    display: flex;
    height: 100%;
    width: 100%;
}

.user-layout.is-mobile {
    display: block;
}

/* 桌面端侧栏：flex 纵向，footer 撑到底 */
.user-sidebar {
    display: flex;
    flex-direction: column;
    width: 220px;
    flex-shrink: 0;
    border-right: 1px solid var(--cell-border-color);
    padding: 10px 5px;
    overflow-y: auto;
}

/* 主导航占据剩余空间 */
.user-nav {
    flex: 1;
}

/* 底部固定区 */
.user-nav-footer {
    flex-shrink: 0;
    margin-top: 8px;
}

/* 主内容区 */
.user-main {
    flex: 1;
    min-width: 0;
    height: 100%;
    overflow-y: auto;
}

.user-content {
    max-width: 1100px;
    margin: 0 auto;
    padding: 1.25rem 32px;
}

/* 移动端内容更窄一点，符合阅读习惯 */
.user-layout.is-mobile .user-content {
    max-width: 800px;
    padding: 1rem 16px;
}

/* 移动端抽屉 */
.left-popup {
    display: flex;
    height: 100%;
    margin: 15px 15px 5px 15px;
    min-width: 200px;
    width: 23vh;
}

/* 只在侧栏内改 var-cell，避免污染其他组件 */
.user-sidebar .var-cell {
    user-select: none;
    cursor: pointer;
    transition: background .2s, color .2s;
}

.user-sidebar .var-cell.active {
    color: var(--site-config-color-side-bar) !important;
    background: var(--site-config-color-side-bar-active-background) !important;
}

/* 移动端抽屉 cell 复用同一套交互 */
.left-popup .var-cell {
    user-select: none;
    cursor: pointer;
    transition: background .2s, color .2s;
}

.left-popup .var-cell.active {
    color: var(--site-config-color-side-bar) !important;
    background: var(--site-config-color-side-bar-active-background) !important;
}

.loading-placeholder {
    text-align: center;
    padding: 40px;
    color: var(--color-text-secondary);
}
</style>