<script setup>
import TopBar from '@/index/components/layout/TopBar.vue'
import SiteHeader from '@/index/components/layout/SiteHeader.vue'
import MainNav from '@/index/components/layout/MainNav.vue'
import MarqueeBar from '@/index/components/layout/MarqueeBar.vue'
import SiteFooter from '@/index/components/layout/SiteFooter.vue'
import CookieConsent from '@/index/components/common/CookieConsent.vue'
import './styles/tokens.css'
import './styles/base.css'
</script>

<template>

    <div class="app-shell">
        <TopBar />
        <SiteHeader />
        <MainNav />
        <MarqueeBar />

        <main class="app-main">
            <router-view v-slot="{ Component, route }">
                <transition name="fade" mode="out-in">
                    <component :is="Component" :key="route.path" />
                </transition>
            </router-view>
        </main>

        <SiteFooter />
        <CookieConsent />
    </div>
</template>

<style scoped>
.app-shell {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}

.app-main {
    flex: 1;
}
</style>