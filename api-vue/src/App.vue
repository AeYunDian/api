<script setup>
import { onMounted, onBeforeUnmount } from 'vue'
import { RouterView } from 'vue-router'
import { initSdk } from './account-sdk'
import { useRouter } from 'vue-router'
import { useThemeStore } from '@/stores/theme'
import '@/assets/base.css'

const router = useRouter();
const themeStore = useThemeStore();

function toggleTheme() {
  themeStore.setTheme(themeStore.currentTheme === 'light' ? 'dark' : 'light');
}

function handleStorage(e) {
  if (e.key === 'theme' && e.newValue) {
    themeStore.setTheme(e.newValue);
  }
}
onMounted(() => {
  themeStore.initializeTheme();
  try {
    initSdk('ayaccountcenter_1601', 'zh-cn');
  } catch (error) {
    console.error('SDK 初始化失败', error);
  }
  window.addEventListener('storage', handleStorage);
})
onBeforeUnmount(() => {
  window.removeEventListener('storage', handleStorage);
});
</script>

<template>
  <var-app-bar color="primary" text-color="#fff" style="height: 54px;">
    <template #default>
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
        <var-icon :name="themeStore.currentTheme === 'light' ? 'weather-night' : 'white-balance-sunny'" :size="24" />
      </var-button>
    </template>
  </var-app-bar>
  <main>
    <RouterView />
  </main>
</template>
