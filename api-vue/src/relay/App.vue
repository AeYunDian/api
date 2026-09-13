<script setup>
import { computed } from 'vue'
import { useWindowState } from '@/shared/composables/useWindowState';
import { Dialog } from '@varlet/ui'
import '@varlet/ui/es/snackbar/style';
import '@varlet/ui/es/dialog/style';
import '@/shared/assets/base.css'

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
        style="height: 54px;">
        <template #left>
            <div style="margin-left: 15px; user-select: none;">
                <span class="app-bar-title">AyRelay</span>
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
        <div class="tip-container">
            <div class="tip-content">
                <h3 class="tip-title">AyRelay</h3>
                <p class="tip-subtitle">WebSocket 中继服务</p>

                <div class="tip-section">
                    <h2 class="tip-section-title">服务地址</h2>
                    <ul class="tip-list">
                        <li>
                            <span class="tip-label">WebSocket</span>
                            <code class="tip-code">wss://relay.undz.cn/ws</code>
                        </li>
                        <li>
                            <span class="tip-label">健康检查</span>
                            <code class="tip-code">https://relay.undz.cn/health</code>
                        </li>
                    </ul>
                </div>

                <div class="tip-section">
                    <h2 class="tip-section-title">协议</h2>
                    <ul class="tip-list">
                        <li>
                            <span class="tip-label">版本</span>
                            <span>PSP 1.0</span>
                        </li>
                        <li>
                            <span class="tip-label">格式</span>
                            <span>JSON</span>
                        </li>
                        <li>
                            <span class="tip-label">传输</span>
                            <span>WebSocket</span>
                        </li>
                    </ul>
                </div>

                <p class="tip-desc">
                    本服务只提供 WebSocket 中继能力，不存储用户业务数据。<br>
                    所有消息在 TTL 到期后自动清理。
                </p>
            </div>
        </div>
    </main>
</template>

<style scoped>
.tip-container {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: 2rem;
    box-sizing: border-box;
}

.tip-content {
    max-width: 720px;
    width: 100%;
    text-align: center;
}

.tip-title {
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0 0 0.25rem 0;
}

.tip-subtitle {
    font-size: 1.1rem;
    color: var(--color-text-disabled);
    margin: 0 0 2.5rem 0;
}

.tip-section {
    text-align: left;
    margin-bottom: 2rem;
    padding: 1.25rem 1.5rem;
    border-radius: 12px;
    background: var(--color-surface-container, rgba(128, 128, 128, 0.06));
}

.tip-section-title {
    font-size: 1rem;
    font-weight: 600;
    margin: 0 0 0.75rem 0;
    color: var(--color-primary, #6750a4);
}

.tip-list {
    list-style: none;
    padding: 0;
    margin: 0;
}

.tip-list li {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.4rem 0;
    font-size: 0.95rem;
    line-height: 1.5;
    border-bottom: 1px solid var(--color-outline-variant, rgba(128, 128, 128, 0.15));
}

.tip-list li:last-child {
    border-bottom: none;
}

.tip-label {
    flex: 0 0 5.5rem;
    color: var(--color-text-disabled);
    font-size: 0.9rem;
}

.tip-code {
    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
    font-size: 0.85rem;
    padding: 0.1rem 0.5rem;
    border-radius: 6px;
    background: var(--color-surface-variant, rgba(128, 128, 128, 0.12));
    word-break: break-all;
}

.tip-desc {
    font-size: 0.9rem;
    line-height: 1.7;
    color: var(--color-text-disabled);
    margin-top: 2rem;
}

@media (max-width: 768px) {
    .tip-container {
        padding: 1.25rem;
    }

    .tip-title {
        font-size: 2rem;
    }

    .tip-section {
        padding: 1rem 1.1rem;
    }

    .tip-list li {
        flex-direction: column;
        gap: 0.15rem;
    }

    .tip-label {
        flex: none;
    }
}
</style>