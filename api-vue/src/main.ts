import './assets/main.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import 'element-plus/dist/index.css'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import ElLoading from './components/ElLoading.vue'
import ElProgressLoading from './components/ElProgressLoading.vue'

import zhCn from 'element-plus/es/locale/lang/zh-cn'
const loading = document.getElementById('app-loading')
const MIN_DISPLAY = 0.8 // 最小显示 1.3 秒，对应你的动画时长

const startTime = Date.now()
const app = createApp(App)

app.use(createPinia())
app.use(router)
app.component('ElLoading', ElLoading)
app.component('ElProgressLoading', ElProgressLoading)

app.use(ElementPlus, {
  locale: zhCn,
})
app.mount('#app')
const elapsed = Date.now() - startTime
const delay = Math.max(0, MIN_DISPLAY - elapsed)

setTimeout(() => {
  if (loading) {
    loading.classList.add('hide')
    setTimeout(() => loading.remove(), 600)
  }
}, delay)
