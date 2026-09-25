<script setup>
import { computed } from 'vue'
import { Dialog } from '@varlet/ui'
import '@varlet/ui/es/dialog/style';
import { useWindowState } from '@/shared/composables/useWindowState';
const { isMaximized } = useWindowState();
const isHostShell = computed(() => {
    return typeof window.hostshell !== 'undefined' && typeof window.chrome !== 'undefined' && typeof window.chrome.webview !== 'undefined';
});
const minimizeWindow = () => {
    if (typeof window.hostshell !== 'undefined' && typeof window.hostshell.windowState === 'string') {
        window.hostshell.windowState = 'minimized';
    }
};
const maximizeWindow = () => {
    if (typeof window.hostshell !== 'undefined' && typeof window.hostshell.windowState === 'string') {
        if (window.hostshell.windowState === 'maximized') {
            window.hostshell.windowState = 'normal';
        } else {
            window.hostshell.windowState = 'maximized';
        }
    }
};
const closeWindow = async () => {
    if (typeof window.hostshell !== 'undefined' && typeof window.hostshell.exit === 'function') {
        const result = await Dialog(
            {
                title: '退出',
                message: '确定要退出应用吗？',
                confirmButtonText: '退出',
                cancelButtonText: '取消',
            });
        if (result === 'confirm') {
            window.hostshell.exit(0);
        }

    }
};

</script>

<template>
    <var-app-bar onmousedown="if (window.hostshell) window.hostshell.startDrag()" color="primary" text-color="#fff"
        style="height: 54px;" title="404 Not Found">
        <template #right>
            <var-button v-if="isHostShell" color="transparent" text-color="#fff" round text @mousedown.stop
                @click.stop="minimizeWindow">
                <my-icon icon="window-minimize" size="1em + 8px" />
            </var-button>
            <var-button v-if="isHostShell" color="transparent" text-color="#fff" round text @mousedown.stop
                @click.stop="maximizeWindow">
                <my-icon :icon="isMaximized ? 'window-restore' : 'window-maximize'" size="1em + 8px" />
            </var-button>
            <var-button v-if="isHostShell" color="transparent" text-color="#fff" round text @mousedown.stop
                @click.stop="closeWindow">
                <my-icon icon="close" size="1em + 8px" />
            </var-button>
        </template>
    </var-app-bar>
    <main>
        <div class="not-found-container">
            <div class="not-found-content">
                <h1 class="not-found-title">404 Not Found</h1>
                <p class="not-found-desc">Description: HTTP 404. The resource you are looking for (or one of its
                    dependencies) could have been removed, had its name changed, or is temporarily unavailable. Please
                    review the following URL and make sure that it is spelled correctly.</p>
                <p class="not-found-desc">描述：HTTP 404。您要查找的资源（或其依赖项）可能已被删除、名称已更改，或暂时不可用。请检查以下 URL 并确保其拼写正确。</p>
                <p class="not-found-desc">Descripción: HTTP 404. El recurso que está buscando (o una de sus
                    dependencias) podría haber sido eliminado, haber cambiado de nombre o no estar disponible
                    temporalmente. Revise la siguiente URL y asegúrese de que esté escrita correctamente.</p>
                <p class="not-found-desc">Description : HTTP 404. La ressource que vous recherchez (ou l'une de ses
                    dépendances) a peut-être été supprimée, renommée ou est temporairement indisponible. Veuillez
                    vérifier l'URL ci-dessous et vous assurer qu'elle est correctement orthographiée.</p>
                <p class="not-found-desc" dir="rtl">الوصف: HTTP 404. قد يكون المورد الذي تبحث عنه (أو أحد تبعياته) قد تم
                    حذفه، أو تغيير اسمه، أو أنه غير متوفر مؤقتًا. يرجى مراجعة عنوان URL التالي والتأكد من كتابته بشكل
                    صحيح.</p>

            </div>
        </div>
    </main>
</template>
<style>
body {
    margin: 0;
    transition:
        background-color 0.25s,
        color 0.25s;
    color: var(--color-text);
    background-color: var(--color-body);
    color-scheme: var(--color-scheme);
}

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
    text-align: center;
    display: inline-block;
    justify-content: center;
    max-width: 80%;
    font-size: 1.1rem;
    color: var(--color-text-disabled);
    margin-bottom: 2rem;
}

@media (max-width: 768px) {
    .not-found-desc {
        max-width: 95%;
    }
}
</style>