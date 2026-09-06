// src/shared/composables/useWindowState.js
import { ref, onMounted, onUnmounted } from 'vue';

export function useWindowState() {
    const isMaximized = ref(false);
    const windowState = ref('normal');

    const handleMessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            if (data.type === 'windowStateUpdate') {
                const state = data.data.state;
                windowState.value = state;
                isMaximized.value = state === 'maximized';
            }
        } catch (e) { /* ignore */ }
    };

    onMounted(() => {
        if (window.hostshell?.addEventListener) {
            window.hostshell.addEventListener('message', handleMessage);
        }
    });

    onUnmounted(() => {
        if (window.hostshell?.removeEventListener) {
            window.hostshell.removeEventListener('message', handleMessage);
        }
    });

    return { isMaximized, windowState };
}