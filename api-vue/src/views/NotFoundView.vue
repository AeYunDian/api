<script setup lang="ts">
import { RouterLink } from 'vue-router'
import HomeIcon from '../components/icons/IconHome.vue'
</script>

<template>
  <div class="not-found-container">
    <div class="not-found-content">
      <div class="not-found-status">404</div>
      <h1 class="not-found-title">哎呀，页面走丢了！</h1>
      <p class="not-found-desc">您访问的页面可能已被移除或不存在。</p>

      <RouterLink to="/" class="back-home-btn">
        <HomeIcon class="btn-icon" /> 回到主页
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
.not-found-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 2rem;
  box-sizing: border-box;
}

.not-found-content {
  text-align: center;
}

.not-found-status {
  font-size: 8rem;
  font-weight: 900;
  line-height: 1;
  background: linear-gradient(135deg, var(--vt-c-hover, #42b883), #2a9466);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.5rem;
}

.not-found-title {
  font-size: 2rem;
  color: var(--vt-c-text-light-1, #333);
  margin-bottom: 0.5rem;
}

.not-found-desc {
  font-size: 1.1rem;
  color: rgba(60, 60, 67, 0.6);
  margin-bottom: 2rem;
}

.back-home-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background-color: var(--vt-c-hover, hsla(160, 100%, 37%, 1));
  color: #fff;
  border-radius: 8px;
  font-weight: 500;
  text-decoration: none;
  transition: background-color 0.2s, transform 0.2s;
}

.back-home-btn:hover {
  background-color: #2a9466;
  transform: translateY(-2px);
}

.btn-icon {
  width: 1.2em;
  height: 1.2em;
}
</style>
