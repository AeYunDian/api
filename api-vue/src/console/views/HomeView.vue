<script setup>
import { inject, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { isHostShell } from '@/shared/utils/device';
let intervalId = null
const sdk = inject('sdk');
const router = useRouter();
const channel = inject('channel');

const features = [
    { icon: 'application-cog-outline', title: '应用管理', desc: '集中管理 OAuth 应用，创建密钥、配置回调地址并查看调用情况。' },
    { icon: 'message-alert-outline', title: '反馈中心', desc: '提交问题或建议并全程追踪处理状态，管理员会及时回复。' },
    { icon: 'tools', title: '开发者工具', desc: '提供完整的授权流程说明与调试工具，帮助应用快速接入。' },
];

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
    const domain = import.meta.env.PROD ? (isHostShell() ? 'online.app.undz.cn' : 'online.undz.cn') : 'online-dev.undz.cn';
    window.location.href = `https://${domain}/${isHostShell() ? '?notinithostshell' : ''}`;
}
</script>

<template>
    <div class="home-page">
        <section class="home-hero">
            <h1 class="home-title">Ay Console</h1>
            <p class="home-subtitle">开发者控制台 · 统一管理应用与反馈</p>

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
                        <var-cell ripple @click="goAccountCenter">前往账号中心</var-cell>
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
   flex item 会按内容收缩（≈标题宽度），导致里面 min(480px, 100%) 只能取到 ~220px。 */
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

/* MD3 split button 容器：var-menu 不接收外部 class，宽度只能加在这一层。
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
