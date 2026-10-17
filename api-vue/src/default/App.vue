<script setup>
import WindowControls from '@/shared/components/WindowControls.vue'
import '@/shared/assets/base.css'

const descriptions = [
    'Description: HTTP 404. The resource you are looking for (or one of its dependencies) could have been removed, had its name changed, or is temporarily unavailable.',
    '描述：HTTP 404。您要查找的资源（或其依赖项）可能已被删除、名称已更改，或暂时不可用。',
    'Descripción: HTTP 404. El recurso que está buscando podría haber sido eliminado, haber cambiado de nombre o no estar disponible temporalmente.',
    'Description : HTTP 404. La ressource que vous recherchez a peut-être été supprimée, renommée ou est temporairement indisponible.',
    'الوصف: HTTP 404. قد يكون المورد الذي تبحث عنه قد تم حذفه، أو تغيير اسمه، أو أنه غير متوفر مؤقتًا.',
]

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

    <main class="not-found-layout">
        <div class="not-found-content">
            <p class="not-found-code">404</p>
            <h1 class="not-found-title">Not Found</h1>
            <p v-for="text in descriptions" :key="text" class="not-found-desc">{{ text }}</p>

            <var-space justify="center" size="[8, 8]" class="not-found-actions">
                <var-button type="primary" @click="reload">重新加载</var-button>
            </var-space>
        </div>
    </main>
</template>

<style scoped>
.not-found-layout {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: calc(100vh - var(--md-app-bar-height));
    padding: var(--md-space-8) var(--md-space-4);
}

.not-found-content {
    max-width: 640px;
    text-align: center;
}

.not-found-code {
    margin: 0;
    font-size: 96px;
    line-height: 104px;
    font-weight: 400;
    letter-spacing: -1.5px;
    color: var(--color-primary);
}

.not-found-title {
    margin: 0 0 var(--md-space-3);
    font-size: 24px;
    line-height: 32px;
    font-weight: 400;
}

.not-found-desc {
    margin: 0 0 var(--md-space-2);
    font-size: 12px;
    line-height: 16px;
    letter-spacing: 0.4px;
    color: var(--color-text-secondary);
}

.not-found-actions {
    margin-top: var(--md-space-6);
}
</style>
