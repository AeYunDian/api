<script setup>
import { useRouter } from 'vue-router'
import EmptyIllustration from '@/shared/components/EmptyIllustration.vue'

const router = useRouter()

function goBack() {
    if (window.history.length > 1) router.back()
    else router.push('/')
}
</script>

<template>
    <div class="not-found-page">
        <var-result type="empty" title="页面不存在"
            description="你访问的地址可能已被移除、改名，或者链接拼写有误。">
            <template #image>
                <EmptyIllustration />
            </template>

            <template #footer>
                <var-space :size="[8, 8]" justify="center">
                    <var-button type="primary" @click="router.push('/')">返回首页</var-button>
                    <var-button text type="primary" @click="goBack">返回上一页</var-button>
                </var-space>
            </template>
        </var-result>
    </div>
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

/* var-result 自带的上/下留白在这类整屏空态里偏小，补一点呼吸 */
.not-found-page :deep(.var-result) {
    padding-top: 0;
    padding-bottom: 0;
}
</style>
