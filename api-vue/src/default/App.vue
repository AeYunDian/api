<script setup>
import WindowControls from '@/shared/components/WindowControls.vue'
import EmptyIllustration from '@/shared/components/EmptyIllustration.vue'
import '@/shared/assets/base.css'

function reload() {
    window.location.reload()
}
</script>

<template>
    <!-- MD3 top app bar：与导航抽屉同色的 chrome 底色 -->
    <var-app-bar class="md-top-app-bar" color="var(--md-chrome-bg)" text-color="var(--md-chrome-fg)" title="AyServices"
        onmousedown="if (window.hostshell) window.hostshell.startDrag()">
        <template #right>
            <WindowControls />
        </template>
    </var-app-bar>

    <!-- 与 online（账号中心）的 404 完全同版式：插画 + 标题 + 描述 + 操作。
         这里没有可返回的路由，所以只有「重新加载」一个按钮。 -->
    <main class="not-found-page">
        <var-result type="empty" title="页面不存在" description="你访问的地址可能已被移除、改名，或者链接拼写有误。">
            <template #image>
                <EmptyIllustration />
            </template>

            <template #footer>
                <var-button type="primary" @click="reload">重新加载</var-button>
            </template>
        </var-result>
    </main>
</template>

<style scoped>
.not-found-page {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: calc(100vh - var(--md-app-bar-height));
    /* 底部多留 12vh：几何居中会显得整块偏下，视觉重心上移约 6vh */
    padding: var(--md-space-8) var(--md-space-4) calc(var(--md-space-8) + 12vh);
    box-sizing: border-box;
}

/* 与 online 的 404 一致：整屏居中时不需要 result 自带的上/下留白 */
.not-found-page :deep(.var-result) {
    padding-top: 0;
    padding-bottom: 0;
}
</style>
