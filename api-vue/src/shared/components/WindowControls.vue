<script setup>
import { useHostShell } from '@/shared/composables/useHostShell'

const { isHostShell, isMaximized, minimizeWindow, maximizeWindow, closeWindow } = useHostShell()
</script>

<template>
    <!-- MD3：图标按钮继承顶栏的 on-surface 颜色，不再写死白色 -->
    <template v-if="isHostShell">
        <var-button text round class="md-window-control" @mousedown.stop @click.stop="minimizeWindow">
            <my-icon icon="window-minimize" size="1em + 8px" />
        </var-button>
        <var-button text round class="md-window-control" @mousedown.stop @click.stop="maximizeWindow">
            <my-icon :icon="isMaximized ? 'window-restore' : 'window-maximize'" size="1em + 8px" />
        </var-button>
        <var-button text round class="md-window-control md-window-control--close" @mousedown.stop @click.stop="closeWindow">
            <my-icon icon="close" size="1em + 8px" />
        </var-button>
    </template>
</template>

<style scoped>
.md-window-control {
    color: inherit;
}

/* MD3：关闭按钮使用 error 色作为强调，符合桌面窗口的惯例 */
.md-window-control--close:hover {
    color: var(--color-danger);
}
</style>
