<script setup>
import { useHostShell } from '@/shared/composables/useHostShell'

const { isHostShell, isMaximized, minimizeWindow, maximizeWindow, closeWindow } = useHostShell()
</script>

<template>
    <template v-if="isHostShell">
        <var-button color="transparent" text-color="#fff" round text @mousedown.stop @click.stop="minimizeWindow">
            <my-icon icon="window-minimize" size="1em + 8px" />
        </var-button>
        <var-button color="transparent" text-color="#fff" round text @mousedown.stop @click.stop="maximizeWindow">
            <my-icon :icon="isMaximized ? 'window-restore' : 'window-maximize'" size="1em + 8px" />
        </var-button>
        <var-button color="transparent" text-color="#fff" round text @mousedown.stop @click.stop="closeWindow">
            <my-icon icon="close" size="1em + 8px" />
        </var-button>
    </template>
</template>