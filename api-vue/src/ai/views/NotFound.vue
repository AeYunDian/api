<script setup>
// 无需 router，去掉未使用的 import
</script>

<template>
    <div class="coming-soon">
        <div class="coming-soon__content">
            <h1 class="coming-soon__title">AyIntelligence</h1>

            <p class="coming-soon__subtitle">
                智能对话助手平台正在搭建中，即将与你见面。
            </p>

            <div class="coming-soon__features">
                <var-chip type="info">多轮自然对话</var-chip>
                <var-chip type="info">代码与技术问答</var-chip>
                <var-chip type="info">Markdown 与公式渲染</var-chip>
                <var-chip type="info">流式响应</var-chip>
            </div>

            <p class="coming-soon__hint">
                敬请期待。如有建议或合作意向，欢迎
                <a href="https://console.undz.cn/console-panel/feedback-center" target="_blank">反馈</a>
            </p>
        </div>
    </div>
</template>

<style scoped>
.coming-soon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-height: 90vh;
    padding: 2rem;
    box-sizing: border-box;
}

.coming-soon__content {
    max-width: 560px;
    text-align: center;
}

.coming-soon__title {
    font-size: 2.5rem;
    margin: 0 0 1rem;
    font-weight: 700;
    background: linear-gradient(135deg, #6750a4, #2196f3);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.coming-soon__subtitle {
    font-size: 1.15rem;
    color: var(--color-text-secondary, #666);
    margin: 0 0 2rem;
    line-height: 1.6;
}

.coming-soon__features {
    list-style: none;
    padding: 0;
    margin: 0 0 2rem;
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
    justify-content: center;
}

.coming-soon__features li {
    padding: 0.35rem 0.9rem;
    font-size: 0.9rem;
    color: var(--color-text-disabled, #888);
    background: color-mix(in srgb, currentColor 8%, transparent);
    border-radius: 8px;
}

.coming-soon__hint {
    font-size: 0.95rem;
    color: var(--color-text-disabled, #888);
    margin: 0;
}

.coming-soon__hint a {
    color: var(--color-primary, #6750a4);
    text-decoration: none;
}

.coming-soon__hint a:hover {
    text-decoration: underline;
}

@media (max-width: 480px) {
    .coming-soon__title {
        font-size: 2rem;
    }

    .coming-soon__subtitle {
        font-size: 1rem;
    }
}
</style>