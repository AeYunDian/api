<template>
    <Icon :icon="fullIcon" v-bind="$attrs" :style="{ fontSize: computedSize }" />
</template>
<script setup>
import { Icon } from '@iconify/vue'
import { computed } from 'vue'

const props = defineProps({
    /**
     * 图标名称。如果未包含前缀（如 'home'），会自动加上默认的 'mdi:' 前缀；
     * 如果已经包含前缀（如 'mdi:home' 或 'fa:home'），则原样使用。
     */
    icon: {
        type: String,
        required: true,
    },
    size: {
        type: String,
        default: '1em + 2px'
    },
    defaultPrefix: {
        type: String,
        default: 'mdi',
    },
})

const fullIcon = computed(() => {
    const iconStr = props.icon
    if (iconStr.includes(':')) {
        return iconStr
    }
    return `${props.defaultPrefix}:${iconStr}`
})
const computedSize = computed(() => {
    if (/[\+\-\*\/]/.test(props.size)) {
        return `calc(${props.size})`
    }
    return props.size
})
</script>
