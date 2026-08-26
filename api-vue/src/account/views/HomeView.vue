<script setup>
import { onMounted, onUnmounted, inject } from 'vue';
import { getSdk } from '@/shared/account-sdk'
import { useRouter } from 'vue-router'
const channel = inject('channel');
const sdk = getSdk()
const router = useRouter()
let intervalId = null

// 核心检查登录状态的方法
async function checkAndRedirect() {
    try {
        const verifyRes = await sdk.verify()
        if (verifyRes.valid && verifyRes.user?.sub && verifyRes.user?.username) {
            if (typeof sdk.close === 'function') { await sdk.close() }
            channel.value.postMessage('login');
            router.push('/user-panel/account-overview')
            return true
        }
        return false
    } catch {
        return false
    }
}
async function login() {
    try {
        const loginRes = await sdk.login()
        if (loginRes?.user?.sub && loginRes?.user?.username) {
            channel.value.postMessage('login');
            router.push('/user-panel/account-overview')
        }
    } catch (err) {
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
            router.push('/user-panel/account-overview')
        }
    } catch (err) {
    }

    intervalId = setInterval(checkAndRedirect, 10000)
})

// 组件卸载时清理定时器
onUnmounted(() => {
    if (intervalId) clearInterval(intervalId)
})
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
                <h5 class="content-title">Ay Account Center</h5>
                <p class="content-subtitle">提供一站式服务，守护账号安全</p>
                <var-button block @click="login">
                    <span>登录</span>
                </var-button>
            </var-space>
        </var-space>
        <br />
        <div class="feature">
            <var-card title="便捷管理" description="集中管理头像、邮箱、手机号等全部个人信息，修改后实时同步至所有关联服务，省去重复填写的烦恼。" />
            <var-card title="安全防护" description="实时监控登录设备与活动日志，支持双因素认证及密码强度检测，异常行为即时预警，全方位守护账号。" />
            <var-card title="通用授权" description="统一管理第三方应用授权与关联关系，随时查看或撤销授权，确保接口权限清晰透明，操作简单易掌控。" />
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
    background: radial-gradient(circle, #4a7cf7, #1a3a8a);
    animation: orbFly1 16s ease-in-out infinite alternate;
}

.orb-2 {
    width: 30vmax;
    height: 30vmax;
    background: radial-gradient(circle, #6a9cf7, #1a4a9a);
    animation: orbFly2 18s ease-in-out infinite alternate-reverse;
}

.orb-3 {
    width: 25vmax;
    height: 25vmax;
    background: radial-gradient(circle, #3a6cf7, #0a2a7a);
    animation: orbPulse 12s ease-in-out infinite alternate;
}

.orb-4 {
    width: 20vmax;
    height: 20vmax;
    background: radial-gradient(circle, #5a8cf7, #2a4a9a);
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