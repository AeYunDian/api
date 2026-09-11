<script setup>
import { computed } from 'vue'
import { RouterView } from 'vue-router'
import { useWindowState } from '@/shared/composables/useWindowState';
import { useRouter } from 'vue-router'
import { Dialog } from '@varlet/ui'
import '@varlet/ui/es/snackbar/style';
import '@varlet/ui/es/dialog/style';
import '@/shared/assets/base.css'
const router = useRouter();

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
    <var-app-bar onmousedown="window.hostshell.startDrag()" color="primary" text-color="#fff" style="height: 54px;">
        <template #left>
            <div style="margin-left: 15px; user-select: none;" @click="router.push('/')" @mousedown.stop>
                <span class=" app-bar-title" @mousedown.stop>AyRelay</span>
            </div>
        </template>
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
