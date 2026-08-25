<script setup>
import { inject, ref, onMounted } from 'vue';
import { Dialog, Snackbar } from '@varlet/ui'
import { getDeviceCount } from '@/utils/api';
import '@varlet/ui/es/dialog/style';
import '@varlet/ui/es/snackbar/style';
const sdk = inject('sdk');
const user = inject('user');

const deviceCount = ref(0);

onMounted(async () => {
    try {
        const data = await getDeviceCount();
        deviceCount.value = data.count;
    } catch (error) {
        Snackbar.error('获取设备数量失败');
        console.error(error);
    }
});

</script>

<template>
    <div>
        <h2>安全中心</h2>
        <p v-if="deviceCount !== 0">当前已在 {{ deviceCount }} 台设备上登录</p>
        <p v-else>加载失败</p>
    </div>
</template>