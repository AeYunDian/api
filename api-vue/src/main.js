import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
// 由于组件库交互事件使用 touch 事件进行开发，不支持桌面端的 mouse 事件，使用 @varlet/touch-emulator 将 touch -> mouse 从而实现桌面端适配。
import '@varlet/touch-emulator'
import App from './App.vue'
import router from './router'
import MyIcon from './components/MyIcon.vue'


const app = createApp(App)

app.use(createPinia())
app.use(router)
app.component('MyIcon', MyIcon)
app.mount('#app')
