<template>
  <div class="vt-cmain">
    <h1>关于</h1>
    <p class="subtitle">此页面已迁移至主站，您可以通过下面链接转至主站</p>
    <a href="https://undz.cn/aboutus/zh-cn.html">简体中文</a>
    <a href="https://undz.cn/aboutus/zh-hk.html">繁體中文（香港）</a>
    <a href="https://undz.cn/aboutus/en-us.html">English</a>
  </div>
</template>

<script setup lang="ts">

</script>

<style scoped>
.vt-cmain {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
  text-align: center;
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
  transition: background-color 0.3s, transform 0.2s;
  /* 防止链接穿透 */
  cursor: pointer;
}

.start-btn:hover {
  transform: translateY(-2px);
}
</style>
