<script setup>
import { inject, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
let intervalId = null
const sdk = inject('sdk');
const router = useRouter();
const channel = inject('channel');
async function checkAndRedirect() {
    try {
        const verifyRes = await sdk.verify()
        if (verifyRes.valid && verifyRes.user?.sub && verifyRes.user?.username) {
            if (typeof sdk.close === 'function') { await sdk.close() }
            channel.value.postMessage('login');
            router.push('/console-panel/oauth-client')
            return true
        }
        return false
    } catch {
        return false
    }
}
async function login() {
    try {
        const loginRes = await sdk.login();
        if (loginRes?.user?.sub) {
            channel.value.postMessage('login');
            router.push('/console-panel/oauth-client');
        }
    } catch (err) {
        console.error('登录失败', err);
    }
}
onMounted(async () => {
    let loggedIn = await checkAndRedirect()
    if (loggedIn) return
    try {
        await sdk.refresh()
    } catch {
    }

    loggedIn = await checkAndRedirect()
    if (loggedIn) return

    try {
        const loginRes = await sdk.login()
        if (loginRes?.user?.sub && loginRes?.user?.username) {
            channel.value.postMessage('login');
            router.push('/console-panel/oauth-client');
        }
    } catch (err) {
    }

    intervalId = setInterval(checkAndRedirect, 10000)
})

onUnmounted(() => {
    if (intervalId) clearInterval(intervalId)
})
function goAccountCenter() {
    const domain = import.meta.env.PROD ? 'online.undz.cn' : 'online-dev.undz.cn';
    window.location.href = `https://${domain}/`;
}
</script>
<template>

    <div class="bg-orbs">
        <div class="orb orb-1"></div>
        <div class="orb orb-2"></div>
        <div class="orb orb-3"></div>
        <div class="orb orb-4"></div>
    </div>
    <div class="content">
        <var-space>
            <var-image width="85px" height="85px" fit="cover" radius="50%" src="/favicon.webp" />
            <var-space direction="column" size="large" style="color: #fff; align-items: unset;">
                <h5 class="content-title">Ay Console</h5>
                <p class="content-subtitle">开发者控制台，统一管理所有应用</p>
                <var-menu placement="bottom-end" style="width: 100%;" same-width>
                    <var-button-group style="display: flex; width: 100%;">
                        <var-button style="flex: 1;" @click.stop="login" block>
                            <span>登录</span>
                        </var-button>
                        <var-button style="padding: 0 8px; flex-shrink: 0;">
                            <var-icon name="menu-down" :size="24" />
                        </var-button>
                    </var-button-group>

                    <template #menu>
                        <var-cell ripple @click="goAccountCenter">前往 AyAccountCenter</var-cell>
                    </template>
                </var-menu>

            </var-space>
        </var-space>
        <br />
        <div class="feature">
            <var-card title="应用管理" description="集中管理所有 OAuth 应用，支持快速创建、配置密钥与回调地址，实时查看应用状态与调用数据。" />
            <var-card title="安全防护" description="实时监控应用与平台的访问动态，支持异常行为预警与安全策略配置，全方位守护业务数据安全。" />
            <var-card title="开发者工具" description="集成常用开发与调试能力，提供认证服务对接指引，助力开发者高效完成应用集成与上线。" />
        </div>
    </div>
</template>

<style scoped>
.feature {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 20px;
    margin-top: 15px;
}

.feature>div {
    margin: calc(10px) 20px calc(10px) 0px !important;
}

.var-card {
    max-width: 320px;
}

.var-space {
    align-items: center;
}

.content-title {
    margin: 0;
    font-size: 30px;
}

.content-subtitle {
    margin: 0;
    font-size: 15px;
}

.content {
    flex-direction: column;
    position: sticky;
    position: -webkit-sticky;
    align-items: center;
    justify-content: center;
    display: flex;
    height: 100%;
    overflow: hidden;
    z-index: 1;
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