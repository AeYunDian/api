<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<template>
    <div class="wrap">
        <h1>404</h1>
        <p>页面不存在</p>
        <var-button type="primary" @click="router.push('/')">返回站点列表</var-button>
    </div>
</template>

<style scoped>
.wrap {
    text-align: center;
    padding: 120px 20px;
}
</style>