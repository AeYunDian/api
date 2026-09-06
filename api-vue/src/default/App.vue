<script setup>
import { onMounted } from 'vue'
import { StyleProvider, Themes } from '@varlet/ui'
import { Dialog } from '@varlet/ui'
import '@varlet/ui/es/dialog/style';
onMounted(() => {
    const media = window.matchMedia('(prefers-color-scheme:dark)')
    if (media.matches) {
        StyleProvider(Themes.md3Dark)
    } else {
        StyleProvider(Themes.md3Light)
    }
    media.addEventListener('change', (e) => {
        if (e.matches) {
            StyleProvider(Themes.md3Dark)
        } else {
            StyleProvider(Themes.md3Light)
        }
    })
})
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
    <var-app-bar onmousedown="window.hostshell.startDrag()" color="primary" text-color="#fff" style="height: 54px;"
        title="404 Not Found">
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
        <RouterView />
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
</style>