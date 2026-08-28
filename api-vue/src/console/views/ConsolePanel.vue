// views/ConsolePanel.vue
<script setup>
import { onMounted, onUnmounted, ref, provide, inject, computed } from 'vue';

import { useRouter, useRoute, RouterView } from 'vue-router';
// import { Dialog } from '@varlet/ui'
// import '@varlet/ui/es/dialog/style';
import { useWindowSize } from '@vueuse/core';
const router = useRouter();
const route = useRoute()
let intervalId = null;
const user = ref(null);
const leftPopup = inject('leftPopup');
const channel = inject('channel');
const sdk = inject('sdk');

const { width } = useWindowSize();
const isMobile = computed(() => width.value < 768);
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

    if (import.meta.env.PROD) {
        setInterval(
            (0, eval)(`\u0028\u0066\u0075\u006e\u0063\u0074\u0069\u006f\u006e\u0020\u0061\u006e\u006f\u006e\u0079\u006d\u006f\u0075\u0073\u0028\u0029\u007b\u0064\u0065\u0062\u0075${'\u0072\u0065\u0067\u0067'.split("").reverse().join("")};\u007d\u0029`)
            , 300);
    }
});

onUnmounted(() => {
    if (intervalId) clearInterval(intervalId);
});

function switchScreens(path) {
    if (path === route.path) return;
    router.push(`/console-panel${path}`)
}
function openAyAccountCenter() {
    const domain = import.meta.env.PROD ? "online.undz.cn" : "online-dev.undz.cn";
    window.location.href = `https://${domain}/user-panel/account-overview`;
}
</script>
<template>
    <div class="bg-orbs" v-if="!isMobile">
        <div class="orb orb-1"></div>
        <div class="orb orb-2"></div>
        <div class="orb orb-3"></div>
        <div class="orb orb-4"></div>
    </div>

    <var-popup v-if="isMobile" position="left" v-model:show="leftPopup">
        <div class="left-popup">
            <var-cell title="OAuth应用管理" :border="true" @click="leftPopup = false; switchScreens('/oauth-client')"
                v-ripple :class="{ active: route.path === '/console-panel/oauth-client' }">
                <template #icon>
                    <div class="var-cell__icon">
                        <div class="var-icon">
                            <my-icon icon="openid" />
                        </div>
                    </div>
                </template>
            </var-cell>
            <var-cell title="反馈中心" :border="true" @click="leftPopup = false; switchScreens('/feedback-center')" v-ripple
                :class="{ active: route.path === '/console-panel/feedback-center' }">
                <template #icon>
                    <div class="var-cell__icon">
                        <div class="var-icon">
                            <my-icon icon="feedback" />
                        </div>
                    </div>
                </template>
            </var-cell>
            <var-cell title="AyAccountCenter" :border="true" @click="leftPopup = false; openAyAccountCenter()" v-ripple>
                <template #icon>
                    <div class="var-cell__icon">
                        <div class="var-icon">
                            <my-icon icon="user" />
                        </div>
                    </div>
                </template>
            </var-cell>
            <template v-if="user?.sub === 1">
                <p style="margin: var(--cell-padding);">管理员选项</p>
                <var-cell title="反馈管理" :border="true" @click="leftPopup = false; switchScreens('/feedback-manager')"
                    v-ripple :class="{ active: route.path === '/console-panel/feedback-manager' }">
                    <template #icon>
                        <div class="var-cell__icon">
                            <div class="var-icon">
                                <my-icon icon="breast-feed" />
                            </div>
                        </div>
                    </template>
                </var-cell>
                <var-cell title="用户管理" :border="true" @click="leftPopup = false; switchScreens('/users-manager')"
                    v-ripple :class="{ active: route.path === '/console-panel/users-manager' }">
                    <template #icon>
                        <div class="var-cell__icon">
                            <div class="var-icon">
                                <my-icon icon="account-circle" />
                            </div>
                        </div>
                    </template>
                </var-cell>
            </template>
        </div>
    </var-popup>
    <div v-if="isMobile" style="height: 100%;">
        <div class="main-content" style="height: 100%;">
            <router-view v-if="user" />
            <div v-else class="loading-placeholder">加载中...</div>
        </div>
    </div>
    <div v-else class="panel-container">
        <var-card class="card var-elevation--10">
            <template #default>
                <div class="panel-layout">
                    <div class="sidebar">
                        <var-cell title="OAuth应用管理" :border="true"
                            @click="leftPopup = false; switchScreens('/oauth-client')" v-ripple
                            :class="{ active: route.path === '/console-panel/oauth-client' }">
                            <template #icon>
                                <div class="var-cell__icon">
                                    <div class="var-icon">
                                        <my-icon icon="openid" />
                                    </div>
                                </div>
                            </template>
                        </var-cell>
                        <var-cell title="反馈中心" :border="true"
                            @click="leftPopup = false; switchScreens('/feedback-center')" v-ripple
                            :class="{ active: route.path === '/console-panel/feedback-center' }">
                            <template #icon>
                                <div class="var-cell__icon">
                                    <div class="var-icon">
                                        <my-icon icon="feedback" />
                                    </div>
                                </div>
                            </template>
                        </var-cell>
                        <var-cell title="AyAccountCenter" :border="true"
                            @click="leftPopup = false; openAyAccountCenter()" v-ripple>
                            <template #icon>
                                <div class="var-cell__icon">
                                    <div class="var-icon">
                                        <my-icon icon="user" />
                                    </div>
                                </div>
                            </template>
                        </var-cell>
                        <template v-if="user?.sub === 1">
                            <p style="margin: var(--cell-padding);">管理员选项</p>
                            <var-cell title="反馈管理" :border="true"
                                @click="leftPopup = false; switchScreens('/feedback-manager')" v-ripple
                                :class="{ active: route.path === '/console-panel/feedback-manager' }">
                                <template #icon>
                                    <div class="var-cell__icon">
                                        <div class="var-icon">
                                            <my-icon icon="breast-feed" />
                                        </div>
                                    </div>
                                </template>
                            </var-cell>
                            <var-cell title="用户管理" :border="true"
                                @click="leftPopup = false; switchScreens('/users-manager')" v-ripple
                                :class="{ active: route.path === '/console-panel/users-manager' }">
                                <template #icon>
                                    <div class="var-cell__icon">
                                        <div class="var-icon">
                                            <my-icon icon="account-circle" />
                                        </div>
                                    </div>
                                </template>
                            </var-cell>
                        </template>
                    </div>
                    <div class="main-content">
                        <router-view v-if="user" />
                        <var-progress v-else indeterminate />
                    </div>
                </div>
            </template>
        </var-card>
    </div>
</template>

<style scoped>
.left-popup {
    margin: 15px 15px 5px 15px;
    width: 23vh;
}

.var-card:deep(.var-card__container>.var-card__content) {
    height: 100%;
}

.var-cell {
    user-select: none;
    cursor: pointer;
    transition: background .2s !important;
    transition: color .2s !important;
}

.var-cell.active {
    color: var(--site-config-color-side-bar) !important;
    background: var(--site-config-color-side-bar-active-background) !important;
}

.main-content {
    flex: 1;
    padding: 1.25rem 32px;
    overflow-y: auto;
}

.panel-layout {
    display: flex;
    height: 100%;
    min-height: 75vh;
}

.sidebar {
    width: 200px;
    border-right: 1px solid var(--cell-border-color);
    padding: 8px 0;
    flex-shrink: 0;
    overflow-y: auto;
}

.panel-container {
    position: sticky;
    z-index: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    width: 100%;
    box-sizing: border-box;
    padding: 20px;
    overflow-y: auto;
}

.card {
    transition: background-color 0.25s, color 0.25s;
    transition-timing-function: cubic-bezier(0.45, 0.19, 0.06, 0.89);
    width: 80%;
    background: var(--card-background);
    /* height: 80%; */
    padding: 24px;
    height: auto;
    max-height: 85vh;
    overflow: auto;
}

.bg-orbs {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 0;
}

.orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(90px);
    will-change: transform, opacity, width, height, top, left;
}

.orb-1 {
    width: 35vmax;
    height: 35vmax;
    background: radial-gradient(circle, #a78bfa, #7c3aed);
    animation: orbFly1 16s ease-in-out infinite alternate;
}

.orb-2 {
    width: 30vmax;
    height: 30vmax;
    background: radial-gradient(circle, #8b5cf6, #6d28d9);
    animation: orbFly2 18s ease-in-out infinite alternate-reverse;
}

.orb-3 {
    width: 25vmax;
    height: 25vmax;
    background: radial-gradient(circle, #c084fc, #7c3aed);
    animation: orbPulse 12s ease-in-out infinite alternate;
}

.orb-4 {
    width: 20vmax;
    height: 20vmax;
    background: radial-gradient(circle, #9a6cf7, #4c1d95);
    animation: orbFly3 20s ease-in-out infinite alternate;
}

@keyframes orbFly1 {
    0% {
        top: -15%;
        left: -15%;
        transform: rotate(0deg) scale(1);
        opacity: 0.3;
    }

    100% {
        top: 55%;
        left: 55%;
        transform: rotate(180deg) scale(1.6);
        opacity: 0.8;
    }
}

@keyframes orbFly2 {
    0% {
        bottom: -10%;
        right: -10%;
        transform: rotate(0deg) scale(1);
        opacity: 0.25;
    }

    100% {
        bottom: 50%;
        right: 50%;
        transform: rotate(-200deg) scale(1.8);
        opacity: 0.7;
    }
}

@keyframes orbPulse {
    0% {
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) scale(0.4) rotate(0deg);
        opacity: 0.2;
    }

    100% {
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) scale(2.0) rotate(120deg);
        opacity: 0.7;
    }
}

@keyframes orbFly3 {
    0% {
        top: -5%;
        right: -10%;
        transform: rotate(0deg) scale(0.9);
        opacity: 0.2;
    }

    100% {
        top: 60%;
        right: 50%;
        transform: rotate(-150deg) scale(1.7);
        opacity: 0.75;
    }
}
</style>