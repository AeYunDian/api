<template>
  <div class="vt-cmain">

    <!-- 修复：给 RouterLink 加入文字内容，并加上按钮样式 -->
    <RouterLink to="/" class="start-btn nodefcolor nohovercolor">
      ？
    </RouterLink>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
ElMessage.error('Loading Error');
</script>

<style scoped>
.vt-cmain {
  /* 让内容在页面中完美居中 */
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  /* 撑满主容器的高度 */
  width: 100%;
  text-align: center;
  /* 之前你写的 margin-left 会影响居中，建议改为全局 padding 或者直接不用 */
}

h1 {
  font-size: 3rem;
  margin-bottom: 0.5rem;
  background: linear-gradient(135deg, #42b883, #2a9466);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  font-size: 1.2rem;
  color: rgba(60, 60, 67, 0.6);
  margin-bottom: 2rem;
}

/* 给 RouterLink 添加漂亮的按钮样式 */
.start-btn {
  display: inline-block;
  padding: 12px 32px;
  background-color: var(--vt-c-hover, #42b883);
  color: #fff;
  font-size: 1.1rem;
  font-weight: 500;
  border-radius: 50px;
  text-decoration: none;
  transition:
    background-color 0.3s,
    transform 0.2s;
  /* 防止链接穿透 */
  cursor: pointer;
}

.start-btn:hover {
  transform: translateY(-2px);
}
</style>
