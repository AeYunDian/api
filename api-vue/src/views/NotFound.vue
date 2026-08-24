<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

</script>

<template>
    <div>
        <div class="not-found-container">
            <div class="not-found-content">
                <h1 class="not-found-title">哎呀，页面走丢了！</h1>
                <p class="not-found-desc">您访问的页面可能已被移除或不存在。</p>

                <var-button type="primary" block @click="router.push('/')">
                    <span>返回主页</span>
                </var-button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.not-found-container {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: 2rem;
    box-sizing: border-box;
}

.not-found-content {
    text-align: center;
}

.not-found-status {
    font-size: 8rem;
    font-weight: 900;
    line-height: 1;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 0.5rem;
}

.not-found-title {
    font-size: 2rem;
    margin-bottom: 0.5rem;
}

.not-found-desc {
    font-size: 1.1rem;
    color: var(--color-text-disabled);
    margin-bottom: 2rem;
}
</style>
