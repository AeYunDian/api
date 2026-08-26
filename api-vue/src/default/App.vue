<script setup>
import { onMounted } from 'vue'
import { StyleProvider, Themes } from '@varlet/ui'

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
</script>

<template>
    <var-app-bar color="primary" text-color="#fff" style="height: 54px;" title="404 Not Found" />
    <main>
        <RouterView />
    </main>
</template>
<style>
body {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    margin: 0;
    transition:
        background-color 0.25s,
        color 0.25s;
    color: var(--color-text);
    background-color: var(--color-body);
    color-scheme: var(--color-scheme);
}
</style>