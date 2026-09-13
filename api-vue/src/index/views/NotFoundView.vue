<script setup>
import GovPanel from '@/index/components/common/GovPanel.vue'
import GovButton from '@/index/components/common/GovButton.vue'
</script>

<template>
    <div class="page">
        <GovPanel title="页面未找到">
            <div class="nf">
                <div class="nf__code">404</div>
                <p class="nf__msg">您访问的页面不存在或已被移除。</p>
                <div class="nf__actions">
                    <router-link to="/">
                        <GovButton variant="primary">返回首页</GovButton>
                    </router-link>
                    <router-link to="/articles">
                        <GovButton variant="default">浏览文章</GovButton>
                    </router-link>
                </div>
            </div>
        </GovPanel>
    </div>
</template>

<style scoped>
.nf {
    text-align: center;
    padding: var(--gov-gap-2xl) 0;
}

.nf__code {
    font-family: var(--gov-font-num);
    font-size: 72px;
    font-weight: 700;
    color: var(--gov-blue);
    line-height: 1;
    letter-spacing: 4px;
}

.nf__msg {
    color: var(--gov-text-sub);
    margin: var(--gov-gap-md) 0 var(--gov-gap-xl);
}

.nf__actions {
    display: inline-flex;
    gap: var(--gov-gap-md);
}
</style>