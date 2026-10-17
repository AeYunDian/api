<script setup>
import { onMounted, onUnmounted, inject } from 'vue';
import { getSdk } from '@/shared/account-sdk'
import { useRouter } from 'vue-router'
import { isHostShell } from '@/shared/utils/device';
const channel = inject('channel');
const sdk = getSdk()
const router = useRouter()
let intervalId = null

/* 首页能力说明（MD3 卡片） */
const features = [
    { icon: 'account-edit-outline', title: '便捷管理', desc: '集中管理头像、邮箱、手机号等全部个人信息，修改后实时同步至所有关联服务。' },
    { icon: 'shield-check-outline', title: '安全防护', desc: '实时监控登录设备与活动日志，支持密码强度检测，异常行为即时预警。' },
    { icon: 'key-outline', title: '通用授权', desc: '统一管理第三方应用授权与关联关系，随时查看或撤销授权，权限清晰透明。' },
]

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
function goConsole() {
    const domain = import.meta.env.PROD ? (isHostShell() ? 'console.app.undz.cn' : 'console.undz.cn') : 'console-dev.undz.cn';
    window.location.href = `https://${domain}/${isHostShell() ? '?notinithostshell' : ''}`;
}
</script>
<template>
    <div class="home-page">
        <section class="home-hero">
            <h1 class="home-title">Ay Account Center</h1>
            <p class="home-subtitle">提供一站式服务，守护账号安全</p>

            <!-- MD3 split button：主操作是登录，次级入口收进右侧菜单。
                 var-menu 是 inheritAttrs:false，class/style 不会落到它的根节点，
                 所以宽度必须挂在外层 wrapper 上。 -->
            <div class="home-login">
                <var-menu placement="bottom-end" same-width>
                    <var-button-group type="primary" size="large" class="home-login__group">
                        <var-button class="home-login__main" @click.stop="login">登录 Ay 账号</var-button>
                        <var-button class="home-login__chevron" aria-label="更多入口">
                            <var-icon name="menu-down" :size="20" />
                        </var-button>
                    </var-button-group>
                    <template #menu>
                        <var-cell ripple @click="goConsole">前往 AyConsole</var-cell>
                    </template>
                </var-menu>
            </div>
        </section>

        <section class="home-features">
            <var-card v-for="item in features" :key="item.title" class="feature-card">
                <template #title="{ slotClass }">
                    <div :class="slotClass" class="md-card-header">
                        <my-icon :icon="item.icon" size="1.25em" />
                        <span class="md-card-title">{{ item.title }}</span>
                    </div>
                </template>
                <p class="feature-desc">{{ item.desc }}</p>
            </var-card>
        </section>
    </div>
</template>

<style scoped>
.home-page {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--md-space-6);
    min-height: 100%;
    padding: var(--md-space-6) var(--md-space-4) var(--md-space-10);
    box-sizing: border-box;
}

/* hero 必须自己撑满可用宽度：.home-page 是 align-items:center 的 flex 列，
   flex item 会按内容收缩（≈标题宽度），按钮的 100% 就会被压到内容宽。 */
.home-hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: var(--md-space-2);
    width: 100%;
    max-width: 640px;
}

.home-title {
    margin: 0;
    font-size: 40px;
    line-height: 48px;
    font-weight: 400;
    letter-spacing: 0;
    color: var(--color-text);
}

.home-subtitle {
    margin: 0;
    font-size: 14px;
    line-height: 20px;
    letter-spacing: 0.25px;
    color: var(--color-text-secondary);
}

/* MD3 split button 容器：var-menu 是 inheritAttrs:false，外部 class/style 会被丢弃，
 * 宽度只能加在这一层，再让里面的 .var-menu 撑满。
 * 宽度给到 ~320 就够：hero 铺满后按钮再跟着 100% 就会变成一条长条。 */
.home-login {
    width: min(320px, 100%);
    margin-top: var(--md-space-5);
}

.home-login .var-menu {
    width: 100%;
    display: flex;
}

.home-login__group {
    display: flex;
    width: 100%;
}

.home-login__group .var-button {
    box-shadow: none;
}

.home-login__main {
    flex: 1;
}

.home-login__chevron {
    flex: 0 0 auto;
    padding: 0 var(--md-space-3);
}

.home-features {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: var(--md-space-3);
    width: 100%;
    max-width: var(--md-content-max-width);
}


.feature-desc {
    margin: 0;
    font-size: 13px;
    line-height: 20px;
    color: var(--color-on-surface-variant);
}
</style>
