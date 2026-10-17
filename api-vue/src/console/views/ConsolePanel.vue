// views/ConsolePanel.vue
<script setup>
import { onMounted, onUnmounted, ref, provide, inject, computed } from 'vue';
import { isHostShell } from '@/shared/utils/device';
import { useRouter, useRoute, RouterView } from 'vue-router';
import { useDevice } from '@/shared/composables/useDevice';
import { Dialog, Hover, Snackbar } from '@varlet/ui';
import { formatTime } from '@/shared/utils/format';
import '@varlet/ui/es/dialog/style';
import '@varlet/ui/es/snackbar/style';

/* 悬停指令：按需注册（v 开头的变量会被识别为局部指令） */
const vHover = Hover;

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

const navItems = computed(() => {
    const items = [
        { path: '/oauth-client', title: 'OAuth 应用管理', icon: 'openid' },
        { path: '/analytics', title: '网站分析', icon: 'chart-line' },
        { path: '/feedback-center', title: '反馈中心', icon: 'feedback' },
    ];
    if (user.value?.sub === 1) {
        items.push(
            { path: '/feedback-manager', title: '反馈管理', icon: 'breast-feed' },
            { path: '/users-manager', title: '用户管理', icon: 'account-circle' },
            { path: '/file-manager', title: '文件管理', icon: 'folder' }
        );
    }
    return items;
});

const footerItems = [
    { path: '/ay-account', title: 'AyAccountCenter', icon: 'user', handler: openAyAccountCenter },
    { path: '/about', title: '关于', icon: 'information' },
];

const userRole = computed(() => {
    if (!user.value) return '未登录';
    return user.value.sub === 1 ? '超级管理员' : '开发者';
});

/* ---------- 悬浮账号卡（桌面端 hover 抽屉头部弹出） ---------- */

/** 头像遮罩位移：v-hover 的函数形式只回报悬停状态，动画自己驱动 */
const avatarMaskY = ref('100%');

function handleAvatarHover(hovering) {
    avatarMaskY.value = hovering ? '0' : '100%';
}

/** 复制 UID 到剪贴板 */
async function copyUid() {
    const uid = user.value?.sub;
    if (uid == null) return;
    try {
        await navigator.clipboard.writeText(String(uid));
        Snackbar.success('已复制 UID');
    } catch {
        Snackbar.error('复制失败，请手动输入');
    }
}

function maskEmail(email) {
    if (!email || typeof email !== 'string' || !email.includes('@')) return email;
    const at = email.indexOf('@');
    const name = email.slice(0, at);
    const domain = email.slice(at);
    if (name.length <= 3) return email;
    return `${name.slice(0, 2)}****${name.slice(-1)}${domain}`;
}

/** 控制台的「个人信息」在账号中心，跨应用跳转 */
function openAccountPage(path = '/user-panel/account-overview') {
    const domain = import.meta.env.PROD
        ? (isHostShell() ? 'online.app.undz.cn' : 'online.undz.cn')
        : 'online-dev.undz.cn';
    window.location.href = `https://${domain}${path}${isHostShell() ? '?notinithostshell' : ''}`;
}

async function logout() {
    const action = await Dialog({
        title: '退出登录',
        message: '确定要退出当前账号吗？',
        confirmButtonText: '退出',
        confirmButtonProps: { text: false, type: 'danger' },
    });
    if (action !== 'confirm') return;

    try {
        await sdk.logout();
        channel.value.postMessage('logout');
        Snackbar.success({ content: '已登出', duration: 1000 });
        router.push('/');
    } catch (error) {
        Dialog({ title: '操作失败', message: error.message });
    }
}

function isActive(item) {
    if (item.handler) return false
    const target = `/console-panel${item.path}`
    return route.path === target || route.path.startsWith(target + '/')
}

function handleNav(item) {
    leftPopup.value = false;
    if (item.handler) {
        item.handler();
        return;
    }
    if (isActive(item)) return;
    router.push(`/console-panel${item.path}`);
}

function openAyAccountCenter() {
    const domain = import.meta.env.PROD
        ? (isHostShell() ? 'online.app.undz.cn' : 'online.undz.cn')
        : 'online-dev.undz.cn';
    window.location.href = `https://${domain}/user-panel/account-overview${isHostShell() ? '?notinithostshell' : ''}`;
}
</script>

<template>
    <div class="console-layout" :class="{ 'is-mobile': mobileByWidth }">
        <!-- 桌面端：常驻导航抽屉 -->
        <aside v-if="!mobileByWidth" class="md-nav-drawer">
            <!-- 悬停账号块：var-menu(trigger="hover") 弹出账号卡，内容与账号概览一致。
                 不加 offset：hover 菜单与触发块之间有间隙时容易移出即关闭。 -->
            <var-menu trigger="hover" placement="right-start"
                popover-class="md-account-popover">
                <div class="md-nav-drawer__header">
                    <var-avatar v-if="user?.avatar" :src="user.avatar" :size="40" class="md-nav-avatar" />
                    <var-avatar v-else :size="40" class="md-nav-avatar">
                        <my-icon icon="account-circle" size="28px" />
                    </var-avatar>
                    <div class="md-nav-drawer__account">
                        <p class="md-nav-drawer__title">{{ user?.username || '未登录' }}</p>
                        <p class="md-nav-drawer__subtitle">{{ userRole }}</p>
                    </div>
                </div>

                <template #menu>
                    <div class="md-account-card">
                        <div class="md-account-card__head">
                            <!-- 头像可点：v-hover 驱动遮罩上滑，浮出编辑图标 -->
                            <div class="md-account-avatar" v-hover="handleAvatarHover"
                                @click="openAccountPage('/user-panel/user-info')" title="编辑个人信息">
                                <var-avatar v-if="user?.avatar" :src="user.avatar" :size="56" />
                                <var-avatar v-else :size="56">
                                    <my-icon icon="account-circle" size="32px" />
                                </var-avatar>
                                <div class="md-account-avatar__mask"
                                    :style="{ transform: `translateY(${avatarMaskY})` }">
                                    <my-icon icon="pencil-outline" size="20px" />
                                </div>
                            </div>

                            <div class="md-account-card__id">
                                <p class="md-account-card__name">{{ user?.username || '未登录' }}</p>
                                <p v-if="user?.email" class="md-account-card__email">
                                    {{ maskEmail(user.email) }}
                                </p>
                                <p class="md-account-card__role">{{ userRole }}</p>
                            </div>
                        </div>

                        <div v-if="user" class="md-account-card__rows">
                            <div v-if="user?.sub != null" class="md-account-card__row">
                                <span class="md-account-card__label">UID</span>
                                <span class="md-account-card__value">
                                    {{ user.sub }}
                                    <var-button text round class="md-account-copy" aria-label="复制 UID"
                                        @click="copyUid">
                                        <my-icon icon="content-copy" size="16px" />
                                    </var-button>
                                </span>
                            </div>
                            <div v-if="user?.description" class="md-account-card__row">
                                <span class="md-account-card__label">个人简介</span>
                                <span class="md-account-card__value">{{ user.description }}</span>
                            </div>
                            <div v-if="user?.created_at" class="md-account-card__row">
                                <span class="md-account-card__label">注册时间</span>
                                <span class="md-account-card__value">{{ formatTime(user.created_at) }}</span>
                            </div>
                        </div>

                        <div class="md-account-card__actions">
                            <var-button text type="primary" @click="openAccountPage('/user-panel/account-overview')">
                                账号概览
                            </var-button>
                            <var-button type="danger" tonal @click="logout">退出登录</var-button>
                        </div>
                    </div>
                </template>
            </var-menu>

            <nav class="md-nav-list">
                <var-cell v-for="item in navItems" :key="item.path" :title="item.title" class="md-nav-item"
                    :class="{ 'md-nav-item--active': isActive(item) }" v-ripple @click="handleNav(item)">
                    <template #icon>
                        <span class="md-nav-icon">
                            <my-icon :icon="item.icon" size="24px" />
                        </span>
                    </template>
                </var-cell>
            </nav>

            <nav class="md-nav-list md-nav-list--footer">
                <var-cell v-for="item in footerItems" :key="item.path" :title="item.title" class="md-nav-item"
                    :class="{ 'md-nav-item--active': isActive(item) }" v-ripple @click="handleNav(item)">
                    <template #icon>
                        <span class="md-nav-icon">
                            <my-icon :icon="item.icon" size="24px" />
                        </span>
                    </template>
                </var-cell>
            </nav>
        </aside>

        <div class="console-main">
            <div class="console-content">
                <router-view v-if="user" />
                <div v-else class="md-empty">
                    <var-loading type="circle" />
                </div>
            </div>
        </div>
    </div>

    <!--
        移动端：直接上 var-popup(position="left")。
        遮罩、进出场动画、ESC 关闭、滚动锁定、点遮罩关闭、层级管理全部由 Varlet 负责，
        不需要自己写 overlay + transform 的模态抽屉。
    -->
    <var-popup v-if="mobileByWidth" v-model:show="leftPopup" position="left" teleport="body" class="md-nav-popup">
        <div class="md-nav-drawer md-nav-drawer--popup">
            <div class="md-nav-drawer__header">
                <var-avatar v-if="user?.avatar" :src="user.avatar" :size="40" class="md-nav-avatar" />
                <var-avatar v-else :size="40" class="md-nav-avatar">
                    <my-icon icon="account-circle" size="28px" />
                </var-avatar>
                <div class="md-nav-drawer__account">
                    <p class="md-nav-drawer__title">{{ user?.username || '未登录' }}</p>
                    <p class="md-nav-drawer__subtitle">{{ userRole }}</p>
                </div>
            </div>

            <nav class="md-nav-list">
                <var-cell v-for="item in navItems" :key="item.path" :title="item.title" class="md-nav-item"
                    :class="{ 'md-nav-item--active': isActive(item) }" v-ripple @click="handleNav(item)">
                    <template #icon>
                        <span class="md-nav-icon">
                            <my-icon :icon="item.icon" size="24px" />
                        </span>
                    </template>
                </var-cell>
            </nav>

            <nav class="md-nav-list md-nav-list--footer">
                <var-cell v-for="item in footerItems" :key="item.path" :title="item.title" class="md-nav-item"
                    :class="{ 'md-nav-item--active': isActive(item) }" v-ripple @click="handleNav(item)">
                    <template #icon>
                        <span class="md-nav-icon">
                            <my-icon :icon="item.icon" size="24px" />
                        </span>
                    </template>
                </var-cell>
            </nav>
        </div>
    </var-popup>
</template>

<style scoped>
.console-layout {
    display: flex;
    align-items: stretch;
    height: 100%;
    width: 100%;
}

.console-layout.is-mobile {
    display: block;
}

/* 弹层内的抽屉：宽度由 CSS 控制，内容与桌面端一致 */
.md-nav-drawer--popup {
    width: min(84vw, 300px);
    height: 100%;
}

/* 底色统一在 shared/assets/md.css 里定义（图片头像走白底），这里只管布局 */
.md-nav-avatar {
    flex: 0 0 auto;
}

.md-nav-drawer__account {
    min-width: 0;
}

.md-nav-drawer__account .md-nav-drawer__title,
.md-nav-drawer__account .md-nav-drawer__subtitle {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

/* 主内容区：固定的圆角面板（圆角常驻），滚动发生在面板内部 */
.console-main {
    flex: 1;
    min-width: 0;
    height: 100%;
    overflow-y: auto;
    background: var(--md-panel-bg);
    border-radius: var(--md-panel-radius) var(--md-panel-radius) 0 0;
}

.console-content {
    max-width: var(--md-content-max-width);
    margin: 0 auto;
    padding: var(--md-space-6) var(--md-space-8);
    /* 给右下角的 FAB 留出空间 */
    padding-bottom: calc(var(--md-space-10) + 56px);
}

/* 移动端内容更窄一点，符合阅读习惯 */
.console-layout.is-mobile .console-content {
    max-width: 800px;
    padding: var(--md-space-4);
    padding-bottom: calc(var(--md-space-10) + 56px);
}
</style>
