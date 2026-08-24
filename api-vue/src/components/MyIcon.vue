<template>
    <Icon :icon="fullIcon" v-bind="$attrs" />
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
    // 默认前缀，可以自定义
    defaultPrefix: {
        type: String,
        default: 'mdi',
    },
})

// 计算最终使用的图标字符串
const fullIcon = computed(() => {
    const iconStr = props.icon
    // 如果包含 ':'，说明已有前缀，直接返回
    if (iconStr.includes(':')) {
        return iconStr
    }
    // 否则加上默认前缀（格式：前缀:图标名）
    return `${props.defaultPrefix}:${iconStr}`
})
</script>