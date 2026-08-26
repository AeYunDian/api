<script setup>
import { onMounted, onBeforeUnmount, onUnmounted, provide, ref, computed } from 'vue'
import { RouterView } from 'vue-router'
import { initSdk, getSdk } from '@/shared/account-sdk'
import { useRouter, useRoute } from 'vue-router'
import { useThemeStore } from '@/shared/stores/theme'
import { Snackbar } from '@varlet/ui'
import '@varlet/ui/es/snackbar/style';
import '@/shared/assets/base.css'
import { useWindowSize } from '@vueuse/core';
const { width } = useWindowSize();
const isMobile = computed(() => width.value < 768);
const route = useRoute();
const router = useRouter();
const themeStore = useThemeStore();
const channel = ref(null);
const leftPopup = ref(false);
try {
    initSdk(import.meta.env.ONLINE_APP_ID, 'zh-cn');
} catch (error) {
    console.error('SDK 初始化失败', error);
}

const sdk = getSdk();
provide('sdk', sdk);
provide('leftPopup', leftPopup);
provide('channel', channel);
function toggleTheme() {
    themeStore.setTheme(themeStore.currentTheme === 'light' ? 'dark' : 'light');
}
async function handleBroadcast(event) {
    if (event.data === 'login') {
        if (router.currentRoute.value.path !== '/user-panel/account-overview') {
            Snackbar.success({
                content: "已检测到登入",
                duration: 1000,
            })
            if (typeof sdk.close === 'function') { await sdk.close() }
            router.push('/user-panel/account-overview');
        }
    } else if (event.data === 'logout') {
        Snackbar.success({
            content: "已检测到登出",
            duration: 1000,
        })
        if (typeof sdk.close === 'function') { await sdk.close() }
        router.push('/');
    }
}
function handleStorage(e) {
    if (e.key === 'theme' && e.newValue) {
        themeStore.setTheme(e.newValue);
    }
}
onMounted(() => {
    themeStore.initializeTheme();
    channel.value = new BroadcastChannel('ayaccountcenter_data');
    channel.value.addEventListener('message', handleBroadcast);
    window.addEventListener('storage', handleStorage);

    if (import.meta.env.PROD) {
        setInterval(
            (0, eval)(`\u0028\u0066\u0075\u006e\u0063\u0074\u0069\u006f\u006e\u0020\u0061\u006e\u006f\u006e\u0079\u006d\u006f\u0075\u0073\u0028\u0029\u007b\u0064\u0065\u0062\u0075${'\u0072\u0065\u0067\u0067'.split("").reverse().join("")};\u007d\u0029`)
            , 150);
    }
})
onBeforeUnmount(() => {
    window.removeEventListener('storage', handleStorage);
});
onUnmounted(() => {
    channel.value?.close();
});
</script>

<template>
    <var-app-bar color="primary" text-color="#fff" style="height: 54px;">
        <template #left>
            <div v-if="isMobile && route.path.startsWith('/user-panel/')"><var-button @click="leftPopup = true;"
                    text><my-icon icon="menu" size="1em + 8px" /></var-button></div>
            <div style="margin-left: 15px; user-select: none;" @click="router.push('/')">
                <span class="app-bar-title">AyAccountCenter</span>
            </div>
        </template>
        <template #right>
            <!-- <var-space :size="0" class="nav-space">
        <var-button text color="transparent" text-color="#fff" class="nav-button" @click="router.push('/')">
          首页
        </var-button>
      </var-space> -->
            <var-button color="transparent" text-color="#fff" round text @click="toggleTheme">
                <var-icon :name="themeStore.currentTheme === 'light' ? 'weather-night' : 'white-balance-sunny'"
                    :size="24" />
            </var-button>
        </template>
    </var-app-bar>
    <main>
        <RouterView />
    </main>
</template>
